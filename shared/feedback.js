/* shared/feedback.js — 「이 지시서 도움 됐어요」 (선택 기능)
   - shared/config.js 에 Supabase 주소와 anon 키가 있을 때만 켜진다. 비어 있으면 아무 일도 하지 않는다.
   - 안내서·지시서 복사는 이 기능과 상관없이 항상 동작한다. 막히면 한 줄 안내만 보인다.
   - 보내는 것: 카드 번호(task_id), 도움 여부(helpful), 시각. 이름·학교·기기 정보는 보내지 않는다. */
(function () {
  'use strict';
  var cfg = window.NOAN_CONFIG || {};
  var enabled = !!(cfg.supabaseUrl && cfg.supabaseAnonKey) && location.protocol !== 'file:';

  function send(taskId, helpful) {
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 5000);
    return fetch(cfg.supabaseUrl.replace(/\/$/, '') + '/rest/v1/prompt_feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: cfg.supabaseAnonKey, Authorization: 'Bearer ' + cfg.supabaseAnonKey, Prefer: 'return=minimal' },
      body: JSON.stringify({ task_id: taskId, helpful: helpful }),
      signal: ctl ? ctl.signal : undefined
    }).then(function (r) { clearTimeout(timer); if (!r.ok) throw new Error(r.status); });
  }

  window.NoanFeedback = {
    copied: function (box, preId) {
      if (!enabled || !box || box.querySelector('.fb')) return;
      var taskId = String(preId || '').replace('gPrompt-', '');
      var row = document.createElement('div');
      row.className = 'fb';
      row.innerHTML = '<span>이 지시서가 도움이 됐나요?</span>' +
        '<button type="button" data-v="1">도움 됐어요</button><button type="button" data-v="0">아쉬워요</button>';
      row.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        row.textContent = '보내는 중…';
        send(taskId, b.getAttribute('data-v') === '1').then(function () {
          row.textContent = '고맙습니다. 안내서를 고치는 데 씁니다.';
        }, function () {
          row.textContent = '지금은 보낼 수 없습니다. 안내서는 그대로 쓰실 수 있어요.';
        });
      });
      box.appendChild(row);
    }
  };
})();
