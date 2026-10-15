const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const BUCKET = 'art-results';

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
  const key = Deno.env.get('ANTHROPIC_API_KEY');
  if (!key) return prompt;
  const model = Deno.env.get('ANTHROPIC_MODEL') || 'claude-haiku-4-5-20251001';
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
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 220,
        messages: [{ role: 'user', content: instruction }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic API 오류 ${res.status}`);
    const data = await res.json();
    const text = String(data.content?.find((block: { type?: string }) => block.type === 'text')?.text || '').trim();
    return text ? text.slice(0, 600) : prompt;
  } catch (error) {
    console.error('Anthropic prompt fallback', error);
    return prompt;
  }
};

const serverKey = () => {
  const keys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}');
  return keys.default || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
};

const db = async (path: string, init?: RequestInit) => {
  const url = Deno.env.get('SUPABASE_URL');
  const key = serverKey();
  if (!url || !key) throw new Error('Supabase 서버 키가 없습니다.');
  const res = await fetch(`${url}/rest/v1${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `DB 오류 ${res.status}`);
  return data;
};

const storage = async (path: string, init: RequestInit) => {
  const key = serverKey();
  return fetch(`${Deno.env.get('SUPABASE_URL')}/storage/v1${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, ...(init.headers || {}) },
  });
};

const kstStamp = (iso: string) => {
  const d = new Date(Date.parse(iso) + 9 * 3600_000).toISOString();
  return { day: d.slice(0, 10), time: d.slice(11, 16).replace(':', '') };
};

const labelSlug = (label: string) => {
  const n = label.match(/\d+/)?.[0];
  if (/학생/.test(label) && n) return `student-${n.padStart(2, '0')}`;
  if (/선생님/.test(label)) return 'teacher';
  return 'unknown';
};

type Job = { id: string; kind: string; provider_id: string; created_at: string };

// Copies a finished Luma result into Supabase Storage so it outlives Luma's 1-hour link.
const archive = async (job: Job, label: string, sourceUrl: string) => {
  const res = await fetch(sourceUrl);
  if (!res.ok) throw new Error(`결과 파일 다운로드 실패 ${res.status}`);
  const type = res.headers.get('content-type') || (job.kind === 'video' ? 'video/mp4' : 'image/jpeg');
  const ext = type.includes('mp4') ? 'mp4' : type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg';
  const { day, time } = kstStamp(job.created_at);
  const path = `${day}/${labelSlug(label)}_${job.kind}_${time}_${job.provider_id.slice(0, 8)}.${ext}`;
  const up = await storage(`/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': type, 'x-upsert': 'true' },
    body: await res.arrayBuffer(),
  });
  if (!up.ok) throw new Error(`저장소 업로드 실패 ${up.status} ${await up.text()}`);
  await db(`/art_jobs?id=eq.${job.id}`, { method: 'PATCH', body: JSON.stringify({ storage_path: path }) });
  return path;
};

const signPaths = async (paths: string[], expiresIn = 3600) => {
  if (!paths.length) return new Map<string, string>();
  const res = await storage(`/object/sign/${BUCKET}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expiresIn, paths }),
  });
  const data = await res.json().catch(() => []);
  const base = `${Deno.env.get('SUPABASE_URL')}/storage/v1`;
  return new Map<string, string>((Array.isArray(data) ? data : [])
    .filter((row: { signedURL?: string }) => row.signedURL)
    .map((row: { path: string; signedURL: string }) => [row.path, `${base}${row.signedURL}`]));
};

const findPrompt = (o: unknown, depth = 0): string | null => {
  if (!o || typeof o !== 'object' || depth > 4) return null;
  const rec = o as Record<string, unknown>;
  if (typeof rec.prompt === 'string' && rec.prompt) return rec.prompt;
  for (const v of Object.values(rec)) {
    const p = findPrompt(v, depth + 1);
    if (p) return p;
  }
  return null;
};

const lumaResult = (g: Record<string, any>) => ({
  state: String(g.state || g.status || 'processing'),
  url: String(g.output?.[0]?.url || g.assets?.video || g.assets?.image || ''),
  prompt: findPrompt(g),
});

// Admin-only: recover results whose Luma links expired, by asking Luma for a fresh link and archiving.
const adminArchive = async (req: Request, body: Record<string, unknown>) => {
  const token = req.headers.get('x-admin-token') || '';
  const ok = token && (await db(`/art_admin_tokens?token_hash=eq.${await sha256(token)}&select=label&limit=1`))[0];
  if (!ok) return json({ message: '권한이 없습니다.' }, 403);
  const limit = Math.min(Math.max(Number(body.limit) || 5, 1), 10);
  if (body.mode === 'prompts') {
    const missing: { id: string; provider_id: string }[] = await db(`/art_jobs?polished_prompt=is.null&provider_id=not.is.null&select=id,provider_id&limit=30`);
    let filled = 0;
    let sampleKeys: string[] = [];
    for (const job of missing) {
      const raw = await luma(`/generations/${job.provider_id}`).catch(() => null);
      if (!raw) continue;
      if (!sampleKeys.length) sampleKeys = Object.keys(raw);
      const prompt = findPrompt(raw);
      if (prompt) { await db(`/art_jobs?id=eq.${job.id}`, { method: 'PATCH', body: JSON.stringify({ polished_prompt: prompt }) }); filled++; }
    }
    return json({ checked: missing.length, filled, sampleKeys });
  }
  const jobs: (Job & { client_id: string; state: string })[] = await db(`/art_jobs?storage_path=is.null&provider_id=not.is.null&select=id,client_id,kind,provider_id,state,created_at&order=created_at.asc&limit=${limit}`);
  const codes: { id: string; label: string }[] = await db('/art_access_codes?select=id,label');
  const labelOf = new Map(codes.map((c) => [String(c.id), c.label]));
  const results = [];
  for (const job of jobs) {
    const label = labelOf.get(job.client_id) || 'unknown';
    try {
      const g = lumaResult(await luma(`/generations/${job.provider_id}`));
      if (g.state !== 'completed' || !g.url) {
        if (g.state === 'failed') await db(`/art_jobs?id=eq.${job.id}`, { method: 'PATCH', body: JSON.stringify({ state: 'failed', storage_path: 'unavailable:failed' }) });
        results.push({ label, kind: job.kind, created_at: job.created_at, status: g.state });
        continue;
      }
      const path = await archive(job, label, g.url);
      await db(`/art_jobs?id=eq.${job.id}`, { method: 'PATCH', body: JSON.stringify({ state: 'completed', polished_prompt: g.prompt }) });
      results.push({ label, kind: job.kind, created_at: job.created_at, status: 'archived', path, prompt: g.prompt });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await db(`/art_jobs?id=eq.${job.id}`, { method: 'PATCH', body: JSON.stringify({ storage_path: `unavailable:${message.slice(0, 120)}` }) }).catch(console.error);
      results.push({ label, kind: job.kind, created_at: job.created_at, status: 'error', message });
    }
  }
  const remaining: unknown[] = await db('/art_jobs?storage_path=is.null&provider_id=not.is.null&select=id');
  return json({ processed: results.length, remaining: remaining.length, results });
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return json({ message: 'POST만 사용할 수 있습니다.' }, 405);
  try {
    const body = await req.json();
    const action = String(body.action || '');
    if (action === 'archive') return await adminArchive(req, body);

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

    if (action === 'gallery') {
      if (!access.unlimited) return json({ message: '선생님 코드로만 볼 수 있습니다.' }, 403);
      const jobs = await db(`/art_jobs?session_id=eq.${session.id}&storage_path=not.is.null&storage_path=not.like.unavailable*&select=id,client_id,kind,created_at,prompt,polished_prompt,storage_path&order=created_at.desc&limit=200`);
      const codes: { id: string; label: string }[] = await db(`/art_access_codes?session_id=eq.${session.id}&select=id,label`);
      const labelOf = new Map(codes.map((c) => [String(c.id), c.label]));
      const signed = await signPaths(jobs.map((j: { storage_path: string }) => j.storage_path));
      return json({ items: jobs.map((j: Record<string, string>) => ({
        label: labelOf.get(j.client_id) || '알 수 없음',
        kind: j.kind,
        createdAt: j.created_at,
        prompt: j.prompt || null,
        polishedPrompt: j.polished_prompt || null,
        url: signed.get(j.storage_path) || '',
      })) });
    }

    if (action === 'polish') {
      const prompt = String(body.prompt || '').trim().slice(0, 600);
      const kind = body.kind === 'video' ? 'video' : 'image';
      if (prompt.length < 4) return json({ message: '바꾸고 싶은 내용을 문장으로 써 주세요.' }, 400);
      return json({ prompt: await polishPrompt(prompt, kind), unlimited: !!access.unlimited });
    }

    if (action === 'status') {
      const generationId = String(body.generationId || '');
      const jobs = await db(`/art_jobs?provider_id=eq.${encodeURIComponent(generationId)}&session_id=eq.${session.id}&client_id=eq.${encodeURIComponent(quotaClientId)}&select=id,kind,provider_id,created_at,storage_path&limit=1`);
      if (!jobs[0]) return json({ message: '이 기기에서 만든 작업이 아닙니다.' }, 403);
      const raw = await luma(`/generations/${generationId}`);
      const result = lumaResult(raw);
      const { state, url } = result;
      if (state === 'completed' || state === 'failed') {
        if (state === 'completed' && url && !jobs[0].storage_path) {
          await archive(jobs[0], access.label, url).catch((error) => console.error('archive failed', error));
        }
        await db(`/art_jobs?id=eq.${jobs[0].id}`, { method: 'PATCH', body: JSON.stringify({ state, result_url: url || null }) });
      }
      const usage = await db(`/art_usage?session_id=eq.${session.id}&client_id=eq.${encodeURIComponent(quotaClientId)}&select=images_used,videos_used&limit=1`);
      return json({ state, url, message: raw.failure_reason || raw.error || '', unlimited: !!access.unlimited, remainingImages: access.unlimited ? null : Math.max(0, session.max_images - (usage[0]?.images_used || 0)), remainingVideos: access.unlimited ? null : Math.max(0, session.max_videos - (usage[0]?.videos_used || 0)) });
    }

    const kind = action === 'edit' ? 'image' : action === 'video' ? 'video' : '';
    if (!kind) return json({ message: '알 수 없는 요청입니다.' }, 400);
    const prompt = String(body.prompt || '').trim().slice(0, 600);
    if (prompt.length < 4) return json({ message: '바꾸고 싶은 내용을 문장으로 써 주세요.' }, 400);
    let requestBody: Record<string, unknown>;
    let polished: string;
    if (kind === 'image') {
      const image = body.image || {};
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(image.mediaType) || !image.data || image.data.length > 5_600_000) return json({ message: '4MB 이하 JPG·PNG·WEBP만 사용할 수 있습니다.' }, 400);
      polished = await polishPrompt(prompt, 'image');
      requestBody = { model: 'uni-1', type: 'image_edit', prompt: polished, source: { data: image.data, media_type: image.mediaType }, output_format: 'jpeg', user_id: quotaClientId };
    } else {
      const imageGenerationId = String(body.imageGenerationId || '');
      if (!/^[0-9a-f-]{36}$/i.test(imageGenerationId)) return json({ message: '먼저 바뀐 그림을 만들어 주세요.' }, 400);
      const imageJobs = await db(`/art_jobs?provider_id=eq.${encodeURIComponent(imageGenerationId)}&session_id=eq.${session.id}&client_id=eq.${encodeURIComponent(quotaClientId)}&kind=eq.image&state=eq.completed&select=result_url&limit=1`);
      const startUrl = String(imageJobs[0]?.result_url || '');
      if (!startUrl.startsWith('https://')) return json({ message: '바뀐 그림이 아직 준비되지 않았습니다. 잠시 뒤 다시 해 주세요.' }, 409);
      polished = await polishPrompt(prompt, 'video');
      requestBody = { model: 'ray-3.2', type: 'video', prompt: polished, video: { resolution: '540p', duration: '5s', start_frame: { url: startUrl } }, user_id: quotaClientId };
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
    await db('/art_jobs', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ session_id: session.id, client_id: quotaClientId, kind, provider_id: generation.id, state: generation.state || 'queued', prompt, polished_prompt: polished }) });
    return json({ generationId: generation.id, state: generation.state || 'queued' }, 201);
  } catch (error) {
    console.error(error);
    return json({ message: error instanceof Error ? error.message : '서버 오류가 발생했습니다.' }, 500);
  }
});
