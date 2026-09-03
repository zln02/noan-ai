/* shared/contest.js — 대회 마감일 분류. 외부 요청 0건, tools/CONTRACT.md 준수.
 *
 * 마감 지난 대회를 손으로 지우지 않는다. 여는 시점의 날짜와 비교해 저절로 접힌다.
 * 대회 페이지와 랜딩이 같은 계산식을 쓰도록 여기 한 곳에만 둔다.
 */
(function (global) {
  'use strict';

  var DAY = 86400000;

  /* 오늘 자정 (시·분·초 버림, 로컬 기준) */
  function today() {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /* "2026-09-03" -> 로컬 자정 Date. 값이 없으면 null */
  function parseDate(s) {
    if (!s) return null;
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s).trim());
    if (!m) return null;
    return new Date(+m[1], +m[2] - 1, +m[3]);
  }

  /* 오늘부터 마감까지 남은 날수. 마감이 없으면 null */
  function daysLeft(item, base) {
    var d = parseDate(item && item['마감']);
    if (!d) return null;
    return Math.round((d - (base || today())) / DAY);
  }

  /* 접수 중 / 지난 / 확인 중 으로 나눈다. 접수 중은 마감 빠른 순 */
  function classify(items, base) {
    var t = base || today();
    var open = [], past = [], unknown = [];
    for (var i = 0; i < (items || []).length; i++) {
      var it = items[i];
      var n = daysLeft(it, t);
      if (n === null) unknown.push(it);
      else if (n >= 0) open.push(it);
      else past.push(it);
    }
    open.sort(function (a, b) { return daysLeft(a, t) - daysLeft(b, t); });
    past.sort(function (a, b) { return daysLeft(b, t) - daysLeft(a, t); });
    return { open: open, past: past, unknown: unknown };
  }

  /* 화면에 쓸 남은 기간 표기. D-0 은 헷갈리므로 "오늘 마감" 으로 쓴다 */
  function ddayLabel(n) {
    if (n === null) return '마감 확인 중';
    if (n < 0) return '마감';
    if (n === 0) return '오늘 마감';
    return 'D-' + n;
  }

  /* 급한 정도 — 7일 이하 stop, 30일 이하 warm */
  function ddayLevel(n) {
    if (n === null) return 'wait';
    if (n < 0) return 'past';
    if (n <= 7) return 'urgent';
    if (n <= 30) return 'soon';
    return 'far';
  }

  global.NoanContest = {
    today: today,
    parseDate: parseDate,
    daysLeft: daysLeft,
    classify: classify,
    ddayLabel: ddayLabel,
    ddayLevel: ddayLevel
  };
})(window);
