/* shared/dial.js — 연수 일정 배지 + 회차 다이얼 (바닐라 JS, 외부 요청 0건)
   data/schedule.js 의 SCHEDULE_DATA 를 읽는다. 일정마다 눈금 하나, 다음 연수는 파란 눈금,
   다음 연수가 있으면 궤도 점이 느리게 돈다(CSS, 동작 줄이기면 멈춤). 이름·인원 같은 사람 정보는 쓰지 않는다. */
(function () {
  'use strict';
  var box = document.getElementById('dial');
  var data = window.SCHEDULE_DATA;
  if (!box || !data || !data.length) return;
  var WD = ['일', '월', '화', '수', '목', '금', '토'];
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  var now = new Date();
  var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
  var today = new Date(now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()));
  var items = data.filter(function (x) { return x && x.date && !isNaN(new Date(x.date).getTime()); })
    .sort(function (a, b) { return new Date(a.date) - new Date(b.date); });
  if (!items.length) return;
  var next = null, ni = -1;
  for (var i = 0; i < items.length; i++) { if (new Date(items[i].date) >= today) { next = items[i]; ni = i; break; } }
  var n = items.length;
  var ticks = '';
  for (var k = 0; k < n; k++) {
    var a = (n === 1 ? 0 : (k / n)) * Math.PI * 2 - Math.PI / 2;
    var x = 48 + Math.cos(a) * 42, y = 48 + Math.sin(a) * 42;
    var cls = 'dial-tick' + (k === ni ? ' is-next' : (ni === -1 || k < ni ? ' is-past' : ''));
    ticks += '<circle class="' + cls + '" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (k === ni ? 5.5 : 4) + '"/>';
  }
  var orbit = next ? '<g class="dial-orbit"><circle cx="48" cy="4" r="3.5"/></g>' : '';
  var center, line1, line2;
  if (next) {
    var d = Math.round((new Date(next.date) - today) / 86400000);
    var dt = new Date(next.date);
    center = d === 0 ? '오늘' : 'D-' + d;
    line1 = '다음 연수 ' + (dt.getMonth() + 1) + '/' + dt.getDate() + '(' + WD[dt.getDay()] + ') ' + esc(next.time || '');
    line2 = esc(next.title || '');
  } else {
    center = n + '회';
    var last = items[n - 1], ld = new Date(last.date);
    line1 = '지난 연수 ' + n + '회';
    line2 = '마지막 ' + (ld.getMonth() + 1) + '/' + ld.getDate() + ' ' + esc(last.title || '') + ' — 다음 일정은 정해지면 올립니다';
  }
  box.className = 'dial-card';
  box.innerHTML = '<div class="dial" aria-hidden="true"><svg viewBox="0 0 96 96"><circle class="dial-ring" cx="48" cy="48" r="42"/>' +
    '<g class="dial-ticks">' + ticks + '</g>' + orbit + '</svg><div class="dial-center"><span>' + center + '</span></div></div>' +
    '<p class="dial-text"><b>' + line1 + '</b><span>' + line2 + '</span></p>';
  box.setAttribute('role', 'group');
  box.setAttribute('aria-label', '연수 일정');
})();
