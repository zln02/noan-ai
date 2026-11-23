/* guide/home-alpine.js — 첫 화면 안내서 목록의 「앱 같은」 부분 (Alpine.js 3, shared/vendor/alpine)
 *
 *  하는 일: 찾기(바로바로 좁혀짐) · 분류 칩 · 정렬 · 보기 탭(전체/찜/최근 본, 쪽마다 기억)
 *          · 찜(☆) · 최근 본 카드 · 카드에서 바로 「부탁 글 복사」 + 카드 위 알림 · 폰에서 아래서 올라오는 필터 서랍
 *
 *  화면 모양은 index.html 의 x-… 표시가 정한다. 이 파일은 「상태」와 「계산」만 갖는다.
 *  - 글자를 바꾸려면 index.html 을 메모장으로 고치면 된다.
 *  - 이 브라우저에 남기는 것은 카드 번호(예: "02")뿐이다. 이름·내용·검색어는 남기지 않는다(개인정보 없음).
 *  - 인터넷이 없어도 돈다. 저장이 막힌 브라우저(사생활 보호 창)면 기억만 안 될 뿐 그대로 쓴다.
 *
 *  Alpine 이 못 도는 브라우저에서는 이 파일의 아래쪽(Alpine 부분)이 그냥 쉬고,
 *  index.html 의 「자바스크립트 없이도 보이는 목록」(tools/gen-home-static.js 가 만든다)이 보인다.
 *  위쪽 NoanGuideStore 는 Alpine 없이도 돌아서, 상세 쪽(guide/home.js)이 「최근 본 카드」「찜」을 적을 때 쓴다.
 *  우리 코드는 오래된 크롬에서도 읽히게 옛 문법(var, function)만 쓴다.
 */
(function () {
  'use strict';

  var KEY_FAV = 'noan-favs';
  var KEY_RECENT = 'noan-recent';
  var KEY_UI = 'noan-ui:' + location.pathname; /* 쪽마다 따로 기억 */
  var RECENT_MAX = 8;

  /* ---------- 저장 (막혀 있어도 멈추지 않는다) ---------- */
  function load(key, fallback) {
    try {
      var v = JSON.parse(window.localStorage.getItem(key));
      return v == null ? fallback : v;
    } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* 저장이 막혀도 괜찮다 */ }
  }
  /* 카드 번호처럼 생긴 것만 받는다 — 다른 글자가 섞여 들어가지 않게 */
  function isNo(x) { return typeof x === 'string' && /^[0-9]{2}[a-z]?$/.test(x); }
  function cleanList(a) { return Array.isArray(a) ? a.filter(isNo) : []; }
  function tell(name) {
    try { window.dispatchEvent(new CustomEvent(name)); } catch (e) { /* 아주 오래된 브라우저 */ }
  }

  /* 업무 이름으로 카드 그림을 고른다 (shared/icons.js 의 그림 이름) */
  var ICON_RULES = [
    [/가정통신문|알림|홈페이지/, 'letter'], [/회의|녹음|발언/, 'mic'],
    [/공문|지침|요강|계획서/, 'doc-long'], [/활동지|문항|퀴즈|형성평가|질문/, 'book'],
    [/설문|동의|인증|계정|안전/, 'shield'], [/발표|팜플렛|포스터|PPT|슬라이드/, 'slides'],
    [/수업|과학|캐릭터|배우/, 'school'], [/검토|비교|찾기|체크|부탁 글|운영/, 'search-doc']
  ];

  var Store = window.NoanGuideStore = {
    favs: function () { return cleanList(load(KEY_FAV, [])); },
    isFav: function (no) { return Store.favs().indexOf(no) !== -1; },
    toggleFav: function (no) {
      if (!isNo(no)) return false;
      var a = Store.favs(), i = a.indexOf(no);
      if (i === -1) a.unshift(no); else a.splice(i, 1);
      save(KEY_FAV, a);
      tell('noan:favs');
      return i === -1;
    },
    recent: function () { return cleanList(load(KEY_RECENT, [])); },
    pushRecent: function (no) {
      if (!isNo(no)) return;
      var a = Store.recent().filter(function (x) { return x !== no; });
      a.unshift(no);
      save(KEY_RECENT, a.slice(0, RECENT_MAX));
      tell('noan:recent');
    },
    clearRecent: function () { save(KEY_RECENT, []); tell('noan:recent'); },
    iconName: function (task) {
      var t = (task.title || '') + ' ' + (task.tool || '');
      for (var i = 0; i < ICON_RULES.length; i++) if (ICON_RULES[i][0].test(t)) return ICON_RULES[i][1];
      return 'doc-long';
    },
    /* 글자를 클립보드로. 새 방식이 막히면 옛 방식(숨은 글상자 + 복사 명령)으로 */
    copy: function (text) {
      function old() {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        var ok = false;
        try { ok = document.execCommand && document.execCommand('copy'); } catch (e) { ok = false; }
        document.body.removeChild(ta);
        return ok;
      }
      return new Promise(function (resolve, reject) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(resolve, function () { if (old()) resolve(); else reject(); });
        } else if (old()) resolve(); else reject();
      });
    }
  };

  /* ---------- 여기부터 Alpine (받쳐 주는 브라우저에서만 돈다) ---------- */
  document.addEventListener('alpine:init', function () {
    var FILTERS = [
      { key: 'all', label: '모든 분류' }, { key: 'work', label: '업무' },
      { key: 'class', label: '수업' }, { key: 'prompt', label: '부탁 글 있음' }
    ];
    var SORTS = { no: '번호순', fast: '빨리 끝나는 순', name: '가나다순' };
    var TABS = ['all', 'fav', 'recent'];

    window.Alpine.data('guideHome', function () {
      return {
        ready: false,
        tasks: [],
        q: '',            /* 찾는 말 */
        filter: 'all',    /* 분류 칩 */
        sort: 'no',       /* 정렬 */
        tab: 'all',       /* 보기 탭: 전체 / 찜 / 최근 본 */
        favs: [],
        recent: [],
        drawer: false,    /* 폰 필터 서랍이 열렸나 */
        phone: false,
        copied: '',       /* 방금 복사한 카드 번호 (카드 위 알림) */
        failed: '',       /* 복사가 막힌 카드 번호 */
        filters: FILTERS,
        sorts: SORTS,

        init: function () {
          var self = this;
          var ui = load(KEY_UI, {});
          if (TABS.indexOf(ui.tab) !== -1) this.tab = ui.tab;
          if (ui.filter && FILTERS.some(function (f) { return f.key === ui.filter; })) this.filter = ui.filter;
          if (ui.sort && SORTS[ui.sort]) this.sort = ui.sort;
          this.favs = Store.favs();
          this.recent = Store.recent();

          ['tab', 'filter', 'sort'].forEach(function (k) {
            self.$watch(k, function () { save(KEY_UI, { tab: self.tab, filter: self.filter, sort: self.sort }); });
          });
          window.addEventListener('noan:favs', function () { self.favs = Store.favs(); });
          window.addEventListener('noan:recent', function () { self.recent = Store.recent(); });
          /* 다른 창에서 찜을 바꿔도 따라온다 */
          window.addEventListener('storage', function () { self.favs = Store.favs(); self.recent = Store.recent(); });

          var mq = window.matchMedia ? window.matchMedia('(max-width: 759px)') : null;
          function onMq() { self.phone = !!(mq && mq.matches); if (!self.phone) self.drawer = false; }
          onMq();
          if (mq && mq.addEventListener) mq.addEventListener('change', onMq);
          else if (mq && mq.addListener) mq.addListener(onMq);

          var src = window.NoanGuideReady || Promise.resolve(window.GUIDE_TASKS);
          src.then(function (data) {
            if (!data || !data.tasks) return;
            self.tasks = data.tasks;
            self.ready = true;
            self.$nextTick(function () { if (window.NoanMotion) window.NoanMotion.reveal(self.$refs.grid); });
          });
        },

        /* ----- 계산 ----- */
        byNo: function (no) {
          for (var i = 0; i < this.tasks.length; i++) if (this.tasks[i].no === no) return this.tasks[i];
          return null;
        },
        matches: function (t, words) {
          if (this.filter === 'work' && t.group !== 'work') return false;
          if (this.filter === 'class' && t.group !== 'class') return false;
          if (this.filter === 'prompt' && !t.prompt) return false;
          if (!words.length) return true;
          var hay = [t.no, t.title, t.when, t.tool].concat(t.keywords || []).join(' ').toLowerCase();
          for (var i = 0; i < words.length; i++) if (hay.indexOf(words[i]) === -1) return false;
          return true;
        },
        get words() { return this.q.trim().toLowerCase().split(/\s+/).filter(Boolean); },
        get favTasks() { var self = this; return this.favs.map(function (n) { return self.byNo(n); }).filter(Boolean); },
        get recentTasks() { var self = this; return this.recent.map(function (n) { return self.byNo(n); }).filter(Boolean); },
        get visible() {
          var self = this, words = this.words;
          var list = this.tab === 'fav' ? this.favTasks : (this.tab === 'recent' ? this.recentTasks : this.tasks.slice());
          list = list.filter(function (t) { return self.matches(t, words); });
          if (this.tab === 'recent') return list; /* 최근 본 순서 그대로 */
          if (this.sort === 'fast') list.sort(function (a, b) { return self.mins(a) - self.mins(b) || self.order(a) - self.order(b); });
          else if (this.sort === 'name') list.sort(function (a, b) { return String(a.title).localeCompare(String(b.title), 'ko'); });
          else if (this.tab === 'all') list.sort(function (a, b) { return self.order(a) - self.order(b); });
          return list;
        },
        count: function (key) {
          var n = 0;
          for (var i = 0; i < this.tasks.length; i++) {
            var t = this.tasks[i];
            if (key === 'all' || (key === 'prompt' ? !!t.prompt : t.group === key)) n++;
          }
          return n;
        },
        get activeCount() { return (this.filter !== 'all' ? 1 : 0) + (this.sort !== 'no' ? 1 : 0); },
        get countText() { return this.ready ? this.visible.length + '장' : ''; },
        get emptyKind() {
          if (this.words.length) return 'search';
          if (this.tab === 'fav') return 'fav';
          if (this.tab === 'recent') return 'recent';
          return 'filter';
        },
        order: function (t) { return this.tasks.indexOf(t); },
        mins: function (t) { return (t.min && t.min[1]) || 999; },
        minsText: function (t) { return t.min && t.min[1] ? t.min[1] + '분' : ''; },
        tone: function (t) { return 'g-pastel-' + ((this.order(t) % 6) + 1); },
        icon: function (t) { return window.NoanIcons && window.NoanIcons.icon ? window.NoanIcons.icon(Store.iconName(t), 30) : ''; },
        isFav: function (t) { return this.favs.indexOf(t.no) !== -1; },

        /* ----- 하는 일 ----- */
        toggleFav: function (t) {
          var on = Store.toggleFav(t.no);
          this.favs = Store.favs();
          if (window.NoanApp) window.NoanApp.toast(on ? '찜했어요 — 「찜」 탭에 모여요' : '찜을 풀었어요');
        },
        copy: function (t, ev) {
          var self = this, btn = ev && ev.currentTarget;
          Store.copy(t.prompt).then(function () {
            self.failed = '';
            self.copied = t.no;
            if (window.NoanMotion && btn) window.NoanMotion.copied(btn, null);
            clearTimeout(self._ct);
            self._ct = setTimeout(function () { self.copied = ''; }, 2600);
          }, function () {
            self.copied = '';
            self.failed = t.no; /* 막히면 상세로 가서 직접 선택하도록 안내 */
          });
        },
        pick: function (word) {
          this.q = word;
          this.filter = 'all';
          this.tab = 'all';
          this.toList();
        },
        clearSearch: function () { this.q = ''; },
        reset: function () { this.filter = 'all'; this.sort = 'no'; },
        toList: function () {
          var top = document.getElementById('gGuideTitle');
          if (top) top.scrollIntoView({ behavior: window.NoanApp && window.NoanApp.reduced ? 'auto' : 'smooth', block: 'start' });
        },
        /* 탭: 왼쪽·오른쪽 화살표로도 옮겨 간다 */
        tabKey: function (ev) {
          var i = TABS.indexOf(this.tab);
          if (ev.key === 'ArrowRight') i = (i + 1) % TABS.length;
          else if (ev.key === 'ArrowLeft') i = (i + TABS.length - 1) % TABS.length;
          else if (ev.key === 'Home') i = 0;
          else if (ev.key === 'End') i = TABS.length - 1;
          else return;
          ev.preventDefault();
          this.tab = TABS[i];
          var b = this.$root.querySelector('[data-tab="' + this.tab + '"]');
          if (b) b.focus();
        },
        /* 폰 필터 서랍: 열면 첫 칩으로, 닫으면 여는 단추로 초점이 돌아간다 */
        openDrawer: function () {
          var self = this;
          this.drawer = true;
          this.$nextTick(function () {
            var first = self.$refs.controls && self.$refs.controls.querySelector('button, select');
            if (first) first.focus();
          });
        },
        closeDrawer: function () {
          if (!this.drawer) return;
          this.drawer = false;
          var b = this.$refs.opener;
          if (b) this.$nextTick(function () { b.focus(); });
        },
        trap: function (ev) {
          if (!this.drawer || ev.key !== 'Tab') return;
          var f = this.$refs.controls.querySelectorAll('button:not([disabled]), select');
          if (!f.length) return;
          var a = f[0], z = f[f.length - 1];
          if (ev.shiftKey && document.activeElement === a) { ev.preventDefault(); z.focus(); }
          else if (!ev.shiftKey && document.activeElement === z) { ev.preventDefault(); a.focus(); }
        }
      };
    });
  });
})();
