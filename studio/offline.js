(function () {
  'use strict';
  var button = document.getElementById('offlineDownload');
  var status = document.getElementById('offlineStatus');
  var source = document.currentScript && document.currentScript.src;
  if (!source) return;
  function show(message) { if (status) status.textContent = message; }
  if (!('serviceWorker' in navigator) || !window.isSecureContext) {
    if (button) {
      show('이 브라우저에서는 오프라인 저장을 지원하지 않아요. Safari 또는 Chrome에서 열어 주세요.');
      button.disabled = true;
    }
    return;
  }
  var workerURL = new URL('sw.js', source);
  var scopeURL = new URL('./', workerURL);
  var registration = navigator.serviceWorker.register(workerURL.href, {scope: scopeURL.href});
  registration.catch(function () {
    show('오프라인 저장 준비에 실패했어요. 인터넷 연결을 확인한 뒤 다시 열어 주세요.');
  });

  function check(reg) {
    return new Promise(function (resolve, reject) {
      var channel = new MessageChannel();
      var timer = setTimeout(function () { reject(new Error('timeout')); }, 60000);
      channel.port1.onmessage = function (event) {
        clearTimeout(timer);
        channel.port1.close();
        resolve(event.data);
      };
      reg.active.postMessage({type: 'OFFLINE_PREPARE'}, [channel.port2]);
    });
  }
  if (!button) return;
  button.addEventListener('click', function () {
    button.disabled = true;
    show('게임 5종과 화면·음악·그림을 이 태블릿에 저장하는 중이에요…');
    registration
      .then(function (reg) { return reg.update().catch(function () { return reg; }); })
      .then(function () { return navigator.serviceWorker.ready; })
      .then(check)
      .then(function (result) {
        if (!result.ok) throw new Error(result.missing.join(', '));
        show('저장 완료! 홈 화면 아이콘으로 연 앱을 비행기 모드에서 다시 실행해 보세요.');
      })
      .catch(function () {
        show('저장이 끝나지 않았어요. 인터넷을 연결하고 다시 눌러 주세요.');
      })
      .finally(function () { button.disabled = false; });
  });
})();
