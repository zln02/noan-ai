const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' },
});

const sha256 = async (value: string) => {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((n) => n.toString(16).padStart(2, '0')).join('');
};

const luma = async (path: string, init?: RequestInit) => {
  const key = Deno.env.get('LUMA_AGENTS_API_KEY');
  if (!key) throw new Error('LUMA_AGENTS_API_KEY가 설정되지 않았습니다.');
  const res = await fetch(`https://agents.lumalabs.ai/v1${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 402 || /billing|credit|balance/i.test(String(data.detail || data.message || ''))) {
    throw new Error('영상 생성 결제가 아직 연결되지 않았습니다. 선생님께 알려 주세요.');
  }
  if (!res.ok) throw new Error(data.detail || data.message || `Luma API 오류 ${res.status}`);
  return data;
};

const polishPrompt = async (prompt: string, kind: 'image' | 'video') => {
  const key = Deno.env.get('GEMINI_API_KEY');
  if (!key) return prompt;
  const purpose = kind === 'image'
    ? '학생 작품의 화풍과 배경을 보존하면서 요청한 대상만 정확히 바꾸는 이미지 편집'
    : '완성된 그림의 화풍과 구도를 보존하면서 대상이 자연스럽게 살아 움직이는 5초 영상';
  const instruction = [
    '다음 학생의 한국어 요청을 생성형 AI용 프롬프트 한 문단으로 다듬어라.',
    `용도: ${purpose}`,
    '학생이 말하지 않은 인물, 글자, 사물은 추가하지 마라.',
    '원래 작품의 붓 자국, 색감, 구도는 유지하라고 명시하라.',
    '설명이나 제목 없이 다듬은 한국어 프롬프트만 300자 이내로 출력하라.',
    `학생 요청: ${prompt}`,
  ].join('\n');
  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: instruction }] }],
        generationConfig: { maxOutputTokens: 220, thinkingConfig: { thinkingLevel: 'minimal' } },
      }),
    });
    if (!res.ok) throw new Error(`Gemini API 오류 ${res.status}`);
    const data = await res.json();
    const text = String(data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
    return text ? text.slice(0, 600) : prompt;
  } catch (error) {
    console.error('Gemini prompt fallback', error);
    return prompt;
  }
};

const db = async (path: string, init?: RequestInit) => {
  const url = Deno.env.get('SUPABASE_URL');
  const keys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}');
  const key = keys.default || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Supabase 서버 키가 없습니다.');
  const res = await fetch(`${url}/rest/v1${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `DB 오류 ${res.status}`);
  return data;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return json({ message: 'POST만 사용할 수 있습니다.' }, 405);
  try {
    const body = await req.json();
    const action = String(body.action || '');
    const clientId = String(body.clientId || '').slice(0, 80);
    const classCode = String(body.classCode || '').trim().slice(0, 20);
    const accessCode = String(body.accessCode || '').trim().toUpperCase().replace(/\s+/g, '').slice(0, 20);
    if (!clientId || !classCode || !accessCode) return json({ message: '수업 코드와 참가 코드가 필요합니다.' }, 400);

    const sessions = await db(`/art_sessions?code=eq.${encodeURIComponent(classCode)}&active=eq.true&select=id,max_images,max_videos,expires_at&limit=1`);
    const session = sessions[0];
    if (!session || (session.expires_at && Date.parse(session.expires_at) < Date.now())) return json({ message: '수업 코드가 없거나 사용 시간이 끝났습니다.' }, 403);
    const accessHash = await sha256(accessCode);
    const accesses = await db(`/art_access_codes?session_id=eq.${session.id}&code_hash=eq.${accessHash}&active=eq.true&select=id,label,unlimited&limit=1`);
    const access = accesses[0];
    if (!access) return json({ message: '참가 코드를 다시 확인해 주세요.' }, 403);
    const quotaClientId = String(access.id);

    if (action === 'polish') {
      const prompt = String(body.prompt || '').trim().slice(0, 600);
      const kind = body.kind === 'video' ? 'video' : 'image';
      if (prompt.length < 4) return json({ message: '바꾸고 싶은 내용을 문장으로 써 주세요.' }, 400);
      return json({ prompt: await polishPrompt(prompt, kind), unlimited: !!access.unlimited });
    }

    if (action === 'status') {
      const generationId = String(body.generationId || '');
      const jobs = await db(`/art_jobs?provider_id=eq.${encodeURIComponent(generationId)}&session_id=eq.${session.id}&client_id=eq.${encodeURIComponent(quotaClientId)}&select=id,kind&limit=1`);
      if (!jobs[0]) return json({ message: '이 기기에서 만든 작업이 아닙니다.' }, 403);
      const result = await luma(`/generations/${generationId}`);
      const state = result.state || result.status || 'processing';
      const url = result.output?.[0]?.url || result.assets?.video || result.assets?.image || '';
      if (state === 'completed' || state === 'failed') await db(`/art_jobs?id=eq.${jobs[0].id}`, { method: 'PATCH', body: JSON.stringify({ state, result_url: url || null }) });
      const usage = await db(`/art_usage?session_id=eq.${session.id}&client_id=eq.${encodeURIComponent(quotaClientId)}&select=images_used,videos_used&limit=1`);
      return json({ state, url, message: result.failure_reason || result.error || '', unlimited: !!access.unlimited, remainingImages: access.unlimited ? null : Math.max(0, session.max_images - (usage[0]?.images_used || 0)), remainingVideos: access.unlimited ? null : Math.max(0, session.max_videos - (usage[0]?.videos_used || 0)) });
    }

    const kind = action === 'edit' ? 'image' : action === 'video' ? 'video' : '';
    if (!kind) return json({ message: '알 수 없는 요청입니다.' }, 400);
    const prompt = String(body.prompt || '').trim().slice(0, 600);
    if (prompt.length < 4) return json({ message: '바꾸고 싶은 내용을 문장으로 써 주세요.' }, 400);
    let requestBody: Record<string, unknown>;
    if (kind === 'image') {
      const image = body.image || {};
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(image.mediaType) || !image.data || image.data.length > 5_600_000) return json({ message: '4MB 이하 JPG·PNG·WEBP만 사용할 수 있습니다.' }, 400);
      requestBody = { model: 'uni-1', type: 'image_edit', prompt: await polishPrompt(prompt, 'image'), source: { data: image.data, media_type: image.mediaType }, output_format: 'jpeg', user_id: quotaClientId };
    } else {
      const imageGenerationId = String(body.imageGenerationId || '');
      if (!/^[0-9a-f-]{36}$/i.test(imageGenerationId)) return json({ message: '먼저 바뀐 그림을 만들어 주세요.' }, 400);
      requestBody = { model: 'ray-3.2', type: 'video', prompt: await polishPrompt(prompt, 'video'), video: { resolution: '540p', duration: '5s', start_frame: { generation_id: imageGenerationId } }, user_id: quotaClientId };
    }
    let quotaReserved = false;
    if (!access.unlimited) {
      const reserved = await db('/rpc/reserve_art_quota', { method: 'POST', body: JSON.stringify({ p_session_id: session.id, p_client_id: quotaClientId, p_kind: kind }) });
      if (!reserved?.allowed) return json({ message: kind === 'image' ? '이 참가 코드의 그림 변환 횟수를 모두 썼습니다.' : '이 참가 코드의 영상 생성 횟수를 모두 썼습니다.' }, 429);
      quotaReserved = true;
    }
    let generation;
    try {
      generation = await luma('/generations', { method: 'POST', body: JSON.stringify(requestBody) });
    } catch (error) {
      if (quotaReserved) await db('/rpc/release_art_quota', { method: 'POST', body: JSON.stringify({ p_session_id: session.id, p_client_id: quotaClientId, p_kind: kind }) }).catch(console.error);
      throw error;
    }
    await db('/art_jobs', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ session_id: session.id, client_id: quotaClientId, kind, provider_id: generation.id, state: generation.state || 'queued' }) });
    return json({ generationId: generation.id, state: generation.state || 'queued' }, 201);
  } catch (error) {
    console.error(error);
    return json({ message: error instanceof Error ? error.message : '서버 오류가 발생했습니다.' }, 500);
  }
});
