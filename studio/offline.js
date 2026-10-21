(function () {
  'use strict';
  var button = document.getElementById('offlineDownload');
  var status = document.getElementById('offlineStatus');
  var source = document.currentScript && document.currentScript.src;
  if (!source) return;
  function show(message) { if (status) status.textContent = message; }
  if (!('serviceWorker' in navigator) || (location.protocol !== 'https:' && location.hostname !== 'localhost')) {
    if (button) {
      show('이 브라우저에서는 오프라인 저장을 지원하지 않아요. 갤럭시 탭은 삼성 인터넷이나 Chrome을 업데이트한 뒤 다시 열어 주세요.');
      button.disabled = true;
    }
    return;
  }
  var workerURL = new URL('sw.js', source);
  var scopeURL = new URL('./', workerURL);
  var expectedVersion = 'noan-studio-v6';
  var registration = navigator.serviceWorker.register(workerURL.href, {scope: scopeURL.href});
  registration.catch(function () {
    show('오프라인 저장 준비에 실패했어요. 인터넷 연결을 확인한 뒤 다시 열어 주세요.');
  });

  function check(reg) {
    return new Promise(function (resolve, reject) {
      if (!reg.active) { reject(new Error('worker-update')); return; }
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
  function prepareCurrent(reg, attempt) {
    return check(reg).then(function (result) {
      if (result && result.version === expectedVersion) return result;
      if (attempt >= 5) throw new Error('worker-update');
      return new Promise(function (resolve) { setTimeout(resolve, 1000); })
        .then(function () { return prepareCurrent(reg, attempt + 1); });
    });
  }
  if (!button) return;
  button.addEventListener('click', function () {
    button.disabled = true;
    show('게임 5종과 화면·음악·그림을 이 태블릿에 저장하는 중이에요…');
    registration
      .then(function (reg) { return reg.update ? reg.update().catch(function () { return reg; }) : reg; })
      .then(function () { return navigator.serviceWorker.ready; })
      .then(function (reg) { return prepareCurrent(reg, 0); })
      .then(function (result) {
        if (!result.ok) throw new Error('incomplete');
        show('저장 완료! 홈 화면 아이콘으로 연 앱을 비행기 모드에서 다시 실행해 보세요.');
        button.disabled = false;
      })
      .catch(function (error) {
        show(error.message === 'worker-update'
          ? '게임 업데이트가 아직 적용 중이에요. 앱을 닫았다가 다시 열고 다운로드를 눌러 주세요.'
          : '일부 파일을 새로 받지 못했어요. 인터넷을 확인하고 다시 눌러 주세요.');
        button.disabled = false;
      });
  });
})();
