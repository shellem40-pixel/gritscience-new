'use strict';

/* ===== 사이트 공통 정보 ===== */
const SITE = {
  name: 'GRIT그릿과학쟁이 & 일산SP과학',
  author: '과학쟁이 원장',
  phone: '031-918-9912',
  tel: '0319189912',
  email: 'shellem40@gmail.com',
  address: '경기도 고양시 일산서구 일산로 562 (신일산연합상가)'
};

/* 오시는 길은 홈 맨 아래(index.html#location)에 있습니다. */
const LOCATION_URL = 'index.html#location';

const NAV = [
  { href: 'schedule.html', label: '시간표&커리큘럼', key: 'schedule' },
  { href: 'blog.html', label: '블로그', key: 'blog' },
  { href: 'notice.html', label: '공지사항', key: 'notice' }
];

/* 시간표 페이지의 정규수업 구분 (data/schedule.js 의 level 과 연결) */
const LEVELS = [
  { id: 'high', level: '고등', label: '정규수업 고등', title: '정규수업 고등부', desc: '고1 · 고2 · 고3 학기 중 내신과 수능을 대비하는 정규 과정입니다.' },
  { id: 'middle', level: '중등', label: '정규수업 중등', title: '정규수업 중등부', desc: '중1 · 중2 · 중3 학교 내신과 고등 선행을 함께 준비하는 정규 과정입니다.' }
];

/* ===== 도우미 함수 ===== */
function esc(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function fmtDate(d) { return d.replace(/-/g, '.'); }
function byNewest(a, b) { return b.date.localeCompare(a.date) || b.id - a.id; }
function toParagraphs(text) {
  return text.trim().split(/\n\s*\n/)
    .map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
}
function isNew(dateStr) {
  const diff = (Date.now() - new Date(dateStr + 'T00:00:00').getTime()) / 86400000;
  return diff >= 0 && diff < 7;
}
function getParam(name) { return new URLSearchParams(location.search).get(name); }
const hasNotices = () => typeof NOTICES !== 'undefined';
const hasPosts = () => typeof POSTS !== 'undefined';
const hasSchedule = () => typeof REGULAR_COURSES !== 'undefined';
const hasCurriculum = () => typeof CURRICULUM !== 'undefined';
const hasWinter = () => typeof WINTER !== 'undefined' && WINTER.open !== false;
const reduceMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ===== 데이터 파일 확인 =====
   시간표(data/schedule.js)나 커리큘럼(data/curriculum.js)을 못 받았으면
   한 번 더 새로 받아 보고, 그래도 안 되면 빈칸 대신 안내 문구를 보여 줍니다. */
const DATA_FILES = {
  home: [
    { src: 'data/schedule.js', ok: () => typeof HOME_COURSES !== 'undefined' && hasSchedule() }
  ],
  schedule: [
    { src: 'data/schedule.js', ok: hasSchedule },
    { src: 'data/curriculum.js', ok: hasCurriculum }
  ]
};

/* 편집 모드(editor.js)는 화면이 다 그려진 뒤에 시작하도록 이 신호를 기다립니다. */
let resolveReady = () => {};
window.GRIT_READY = new Promise((r) => { resolveReady = r; });

function loadScript(src) {
  return new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = `${src}?retry=${Date.now()}`;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

async function ensureData(page) {
  const missing = [];
  for (const f of DATA_FILES[page] || []) {
    if (f.ok()) continue;
    console.warn(`[GRIT] ${f.src} 파일을 불러오지 못해 다시 받아 봅니다.`);
    await loadScript(f.src);
    if (!f.ok()) {
      console.error(`[GRIT] ${f.src} 파일을 끝내 불러오지 못했습니다. GitHub에 파일이 있는지 확인해 주세요.`);
      missing.push(f.src);
    }
  }
  return missing;
}

function dataErrorHtml(message, tag) {
  const t = tag || 'div';
  return `
    <${t} class="data-error" role="alert">
      <p class="data-error-title">${esc(message)}</p>
      <p>잠시 뒤 새로고침해 주세요. 계속 보이지 않으면 ${SITE.phone}로 문의해 주세요.</p>
      <button type="button" class="btn btn-primary data-reload">새로고침</button>
    </${t}>`;
}
document.addEventListener('click', (e) => {
  if (e.target.closest && e.target.closest('.data-reload')) location.reload();
});

/* 편집 모드에서 고칠 수 있는 글자 표시. '@'로 시작하면 여러 페이지가 함께 쓰는 글자입니다. */
function ed(key) { return ` data-edit="${esc(key)}"`; }

/* 반 이름 옆 괄호 글자: sub 가 있으면 sub, 없으면 (대상 : ...) */
function classSub(c) { return c.sub || (c.target ? `대상 : ${c.target}` : ''); }
function className(c) {
  const sub = classSub(c);
  return `${esc(c.name)}${sub ? ` <small class="sub">(${esc(sub)})</small>` : ''}`;
}
function classText(c) {
  const sub = classSub(c);
  return sub ? `${c.name} (${sub})` : c.name;
}
/* "토요반 오후 2:30-5:00" → 첫 단어 굵게 */
function fmtTime(t) {
  const i = t.indexOf(' ');
  return i > 0 ? `<b>${esc(t.slice(0, i))}</b> ${esc(t.slice(i + 1))}` : esc(t);
}
/* 정규수업 시간: 요일만 있으면 한 줄, 시간이 있으면 여러 줄 */
function timesHtml(times) {
  if (!times || !times.length) return '시간 추후 안내 · 상담 문의';
  if (times.every((t) => t.trim().indexOf(' ') < 0)) return times.map(esc).join(' · ');
  return times.map(fmtTime).join('<br>');
}
/* 특강 시간: 요일 굵게 + 시간, 여러 줄 */
function sessionsHtml(list) {
  if (!list || !list.length) return '추후 안내';
  return list.map((s) => `<b>${esc(s.day)}</b> ${esc(s.time)}`).join('<br>');
}
function clsKey(c, g, i) { return c.id || c.curr || `${g.id}-${i}`; }

/* 주차별 진도 도우미 */
function weekUnits(w) { return Array.isArray(w) ? w : ((w && w.units) || []); }
function weekLabel(w, k) { return (w && !Array.isArray(w) && w.label) || `${k + 1}주차`; }
function weekWhen(w) { return (w && !Array.isArray(w) && w.when) || ''; }
function tracksOf(cur) {
  if (cur.tracks && cur.tracks.length) return cur.tracks;
  return [{ name: '', weeks: cur.weeks || cur.steps || [] }];
}

/* ===== 편집 글자를 다른 곳(과정 버튼 등)에도 맞춰 보여 주기 ===== */
function htmlToText(html) {
  const t = document.createElement('template');
  t.innerHTML = html;
  return t.content.textContent;
}
document.addEventListener('edits:applied', (e) => {
  const shared = (e.detail && e.detail.shared) || {};
  document.querySelectorAll('[data-mirror]').forEach((el) => {
    const key = el.dataset.mirror;
    const src = document.querySelector(`[data-edit="${key}"]`);
    const text = src ? src.textContent : (shared[key] ? htmlToText(shared[key]) : '');
    if (text.trim()) el.textContent = text.replace(/\s+/g, ' ').trim();
  });
  document.querySelectorAll('.cw-track').forEach(fillStepDetail);
});

/* 휴대폰: 고른 주차의 진도를 아래 칸에 보여 줌 */
function fillStepDetail(track) {
  const box = track.querySelector('.step-detail');
  const li = track.querySelector('.cs-steps li.is-picked') || track.querySelector('.cs-steps li');
  if (!box || !li) return;
  track.querySelectorAll('.cs-steps li').forEach((x) => x.classList.toggle('is-picked', x === li));
  const no = li.querySelector('.step-no');
  const d = li.querySelector('.step-desc');
  const w = li.querySelector('.wk-when');
  box.innerHTML = `<span class="step-no">${esc(no ? no.textContent : '')}</span>
    <div class="step-detail-body">${d ? d.innerHTML : ''}</div>
    ${w ? `<p class="wk-when">${esc(w.textContent)}</p>` : ''}`;
}

/* ===== 헤더 ===== */
function renderHeader() {
  const el = document.getElementById('site-header');
  if (!el) return;
  const page = document.body.dataset.page;
  const activeKey = { curriculum: 'schedule', post: 'blog' }[page] || page;

  el.className = 'site-header';
  el.innerHTML = `
    <div class="container header-inner">
      <a class="logo" href="index.html" aria-label="${esc(SITE.name)} 홈">
        <span class="logo-mark">GRIT</span>
        <span class="logo-text">그릿과학쟁이 &amp; 일산SP과학</span>
      </a>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="메뉴 열기">
        <span></span><span></span><span></span>
      </button>
      <nav id="site-nav" class="site-nav" aria-label="주요 메뉴">
        <ul>
          ${NAV.map((n) => `<li><a href="${n.href}"${n.key === activeKey ? ' class="is-active" aria-current="page"' : ''}>${esc(n.label)}</a></li>`).join('')}
        </ul>
        <a class="nav-call" href="tel:${SITE.tel}">상담 ${SITE.phone}</a>
      </nav>
    </div>`;

  const btn = el.querySelector('.menu-toggle');
  const setOpen = (open) => {
    el.classList.toggle('nav-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
  };
  btn.addEventListener('click', () => setOpen(!el.classList.contains('nav-open')));
  el.querySelectorAll('.site-nav a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
  window.addEventListener('resize', () => { if (window.innerWidth > 900) setOpen(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
}

/* ===== 푸터 ===== */
function renderFooter() {
  const el = document.getElementById('site-footer');
  if (!el) return;
  const isHome = document.body.dataset.page === 'home';
  el.className = 'site-footer';
  el.innerHTML = `
    <div class="container footer-inner">
      <div class="footer-brand">
        <strong>${esc(SITE.name)}</strong>
        <p>새로운 과학 학습 밀착 관리 시스템 · 심화학습연구소</p>
        <p><a href="${isHome ? '#location' : LOCATION_URL}">${esc(SITE.address)}</a></p>
      </div>
      <dl class="footer-info">
        <div><dt>전화상담</dt><dd><a href="tel:${SITE.tel}">${SITE.phone}</a></dd></div>
        <div><dt>이메일</dt><dd><a href="mailto:${SITE.email}">${SITE.email}</a></dd></div>
        <div><dt>운영시간</dt><dd>평일 오후 2:00 – 오후 10:00<br>토·일 오전 10:00 – 오후 10:00</dd></div>
      </dl>
    </div>
    <div class="container">
      <p class="footer-bottom">© ${new Date().getFullYear()} ${esc(SITE.name)}. All rights reserved.</p>
    </div>`;
}

/* ===== 이미지가 없을 때 빈 자리 처리 ===== */
function initImageFallback() {
  const markEmpty = (img) => { const box = img.closest('.media'); if (box) box.classList.add('is-empty'); };
  document.addEventListener('error', (e) => {
    if (e.target && e.target.tagName === 'IMG') markEmpty(e.target);
  }, true);
  document.querySelectorAll('.media img').forEach((img) => {
    if (img.complete && img.naturalWidth === 0) markEmpty(img);
  });
}

/* ===== 블로그 카드 ===== */
function postCard(p) {
  const fit = p.fit === 'contain' ? ' fit-contain' : '';
  return `
    <article class="post-card">
      <a class="post-link" href="post.html?id=${p.id}">
        <div class="post-thumb media${fit}"><img src="${esc(p.image)}" alt="" loading="lazy"></div>
        <h3 class="post-title">${esc(p.title)}</h3>
        <p class="post-excerpt">${esc(p.excerpt)}</p>
      </a>
      <p class="post-meta">
        <span class="avatar" aria-hidden="true">GRIT</span>
        <span>${esc(SITE.author)}</span><span class="sep">|</span><span>${fmtDate(p.date)} 게시</span>
      </p>
    </article>`;
}

/* ===== 홈 ===== */
function initHome() {
  /* 개설 과정 카드 (data/schedule.js 의 HOME_COURSES, 편집 모드에서 글자를 고칠 수 있음) */
  const courseEl = document.getElementById('hero-courses');
  if (courseEl && typeof HOME_COURSES !== 'undefined') {
    courseEl.innerHTML = HOME_COURSES.map((h) => `
      <li>
        <a href="${esc(h.href)}">
          <span class="course-tag"${ed(h.tagKey)}>${esc(h.tag)}</span>
          <span class="course-body">
            ${h.lines.map((l) => `<span class="course-line"${ed(l.key)}>${esc(l.text)}</span>`).join('')}
          </span>
          <span class="course-arrow" aria-hidden="true">→</span>
        </a>
      </li>`).join('');
  } else if (courseEl) {
    courseEl.innerHTML = dataErrorHtml('개설 과정을 불러오지 못했습니다.', 'li');
  }
  /* 겨울방학 특강 배너 */
  const winterEl = document.getElementById('hero-winter');
  if (winterEl && hasWinter()) {
    winterEl.querySelector('.hw-text').textContent = WINTER.banner;
    winterEl.hidden = false;
  }

  const noticeEl = document.getElementById('home-notices');
  if (noticeEl && hasNotices()) {
    const pinned = NOTICES.filter((n) => n.important).sort(byNewest);
    const rest = NOTICES.filter((n) => !n.important).sort(byNewest);
    noticeEl.innerHTML = pinned.concat(rest).slice(0, 4).map((n) => `
      <li>
        <a href="notice.html?id=${n.id}">
          ${n.important ? '<span class="badge">공지</span>' : ''}
          <span class="t">${esc(n.title)}</span>
        </a>
        <time datetime="${n.date}">${fmtDate(n.date)}</time>
      </li>`).join('');
  }
  const postEl = document.getElementById('home-posts');
  if (postEl && hasPosts()) {
    postEl.innerHTML = [...POSTS].sort(byNewest).slice(0, 3).map(postCard).join('');
  }

  /* 다른 페이지에서 index.html#location 으로 들어왔을 때 오시는 길로 이동 */
  const target = location.hash && document.getElementById(location.hash.slice(1));
  if (target) {
    requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
    window.addEventListener('load', () => target.scrollIntoView({ block: 'start' }), { once: true });
  }
}

/* ===== 시간표&커리큘럼 =====
   탭: 겨울방학 특강 | 정규수업 고등 | 정규수업 중등 | 커리큘럼
   모든 내용을 한 번에 그려 두고 탭에 따라 보이기/숨기기만 합니다.
   (편집 모드에서 고친 글자가 탭을 바꿔도 사라지지 않게) */
function initSchedule() {
  const root = document.getElementById('schedule-root');
  const tabsEl = document.getElementById('sched-tabs');
  if (!root) return;
  if (!hasSchedule()) {
    root.innerHTML = `<div class="container">${dataErrorHtml('시간표를 불러오지 못했습니다.')}</div>`;
    return;
  }

  const winterOn = hasWinter();
  const winterList = winterOn ? (WINTER.classes || []) : [];
  const currOk = hasCurriculum();
  const CURR = currOk ? CURRICULUM : [];
  const currById = {};
  CURR.forEach((c) => { currById[c.id] = c; });
  const alias = typeof CURRICULUM_ALIAS !== 'undefined' ? CURRICULUM_ALIAS : {};
  const galias = typeof GROUP_ALIAS !== 'undefined' ? GROUP_ALIAS : {};

  /* 커리큘럼으로 볼 과정 (특강 → 고등 → 중등 순서) */
  const courses = [];
  winterList.forEach((w) => {
    if (w.id && currById[w.id]) courses.push({ id: w.id, kind: 'winter', cls: w, cur: currById[w.id] });
  });
  LEVELS.forEach((lv) => {
    REGULAR_COURSES.filter((g) => g.level === lv.level).forEach((g) => {
      g.classes.forEach((c, i) => {
        const id = clsKey(c, g, i);
        if (currById[id]) courses.push({ id, kind: lv.id, cls: c, group: g, cur: currById[id] });
      });
    });
  });
  const courseIds = courses.map((c) => c.id);
  const firstRegular = (courses.find((c) => c.kind !== 'winter') || courses[0] || {}).id || null;
  const nameKey = (c) => (c.kind === 'winter' ? `@w.${c.id}.name` : `@cls.${c.id}.name`);

  /* ---------- 1) 겨울방학 특강 ---------- */
  function winterPanel() {
    const statusCls = { '모집중': 'is-open', '마감임박': 'is-hot', '마감': 'is-closed' };
    const grades = ['전체'].concat([...new Set(winterList.map((c) => c.grade))]);
    const card = (c) => `
      <article class="wc" data-grade="${esc(c.grade)}">
        <div class="wc-top">
          <span class="wc-grade">${esc(c.grade)}</span>
          ${c.status ? `<span class="wc-status ${statusCls[c.status] || ''}">${esc(c.status)}</span>` : ''}
        </div>
        <h3${ed(`@w.${c.id}.name`)}>${esc(c.name)}</h3>
        <div class="wc-times">
          <p class="wc-label">수업 시간</p>
          <p class="time-lines"${ed(`@w.${c.id}.times`)}>${sessionsHtml(c.sessions)}</p>
        </div>
        <dl class="wc-meta">
          <div><dt>기간</dt><dd${ed(`@w.${c.id}.period`)}>${esc(c.period || '추후 안내')}</dd></div>
          <div><dt>대상</dt><dd${ed(`@w.${c.id}.target`)}>${esc(c.target || '상담 시 안내')}</dd></div>
        </dl>
        ${currById[c.id] ? `<a class="wc-link" href="#c-${c.id}">커리큘럼 보기 →</a>` : ''}
      </article>`;

    return `
      <div class="sp-banner is-winter">
        <div class="container">
          <span class="sp-badge">WINTER SPECIAL</span>
          <h2 class="sp-title"${ed('@winter.title')}>${esc(WINTER.title)}</h2>
          <p class="sp-lead"${ed('@winter.banner')}>${esc(WINTER.banner)}</p>
          <dl class="winter-info">
            <div><dt>특강 기간</dt><dd${ed('@winter.period')}>${esc(WINTER.period || '추후 안내')}</dd></div>
            <div><dt>접수 방법</dt><dd${ed('@winter.apply')}>${esc(WINTER.apply || '전화 상담')}</dd></div>
            <div><dt>상담 문의</dt><dd><a href="tel:${SITE.tel}">${SITE.phone}</a></dd></div>
          </dl>
        </div>
      </div>
      <div class="sp-body is-tint">
        <div class="container">
          ${WINTER.notice ? `<p class="winter-note">※ <span${ed('@winter.notice')}>${esc(WINTER.notice)}</span></p>` : ''}
          <div class="winter-filter" role="group" aria-label="학년 선택">
            ${grades.map((g, i) => `<button type="button" class="wf-btn" data-grade="${esc(g)}" aria-pressed="${i === 0}">${esc(g)}</button>`).join('')}
          </div>
          <div class="winter-grid">
            ${winterList.length ? winterList.map(card).join('') : '<p class="empty">등록된 특강 시간표가 없습니다.</p>'}
          </div>
        </div>
      </div>`;
  }

  /* ---------- 2) 정규수업 (고등 / 중등) ---------- */
  function regularPanel(lv, groups) {
    const block = (g, i) => {
      const rows = g.classes.map((c, j) => {
        const id = clsKey(c, g, j);
        const many = c.times && c.times.length > 4 ? ' is-many' : '';
        return `
          <div class="sched-row">
            <div class="sched-info">
              <strong class="cls-name"><span${ed(`@cls.${id}.name`)}>${className(c)}</span></strong>
              <div class="cls-detail">
                <p class="time-lines${many}"${ed(`@cls.${id}.times`)}>${timesHtml(c.times)}</p>
                <p class="cls-book"><span class="cls-book-label">교재</span><span${ed(`@cls.${id}.book`)}>${esc(c.book || '추후 안내')}</span></p>
              </div>
            </div>
            ${currById[id] ? `<a class="btn btn-primary sched-btn" href="#c-${id}">커리큘럼 보기</a>` : ''}
          </div>`;
      }).join('');
      const notes = (g.notes || []).map((n, k) => `
        <div class="sched-row no-line">
          <div class="sched-info">
            <strong class="cls-name"><span${ed(`@grp.${g.id}.n${k}.label`)}>${esc(n.label)}</span></strong>
            <p class="time-lines"${ed(`@grp.${g.id}.n${k}.text`)}>${n.items.map(esc).join(' · ')}</p>
          </div>
        </div>`).join('');
      return `
        <section class="sched-block${i % 2 ? ' is-tint' : ''}" id="blk-${g.id}">
          <div class="container">
            <h3 class="sched-title"${ed(`@grp.${g.id}.title`)}>${esc(g.title)}</h3>
            ${g.sub ? `<p class="sched-sub"${ed(`@grp.${g.id}.sub`)}>${esc(g.sub)}</p>` : ''}
            <div class="sched-rows">${rows}${notes}</div>
          </div>
        </section>`;
    };
    return `
      <div class="sp-banner is-regular">
        <div class="container">
          <span class="sp-badge">REGULAR CLASS</span>
          <h2 class="sp-title"${ed(`@panel.${lv.id}.title`)}>${esc(lv.title)}</h2>
          <p class="sp-lead"${ed(`@panel.${lv.id}.desc`)}>${esc(lv.desc)}</p>
          ${groups.length > 1 ? `
            <nav class="sp-jump" aria-label="구역 바로가기">
              ${groups.map((g) => `<a href="#${g.id}">${esc(g.tag)}</a>`).join('')}
            </nav>` : ''}
        </div>
      </div>
      ${groups.map(block).join('')}`;
  }

  /* ---------- 3) 커리큘럼 ---------- */
  function trackHtml(id, t, ti) {
    const weeks = t.weeks || [];
    const n = weeks.length || 1;
    const cols = n <= 8 ? n : Math.ceil(n / 2);                       /* PC 넓은 화면 */
    const tcols = n % 4 === 0 ? 4 : (n % 3 === 0 ? 3 : Math.min(4, n)); /* 좁은 화면 · 태블릿 · 휴대폰 */
    return `
      <div class="cw-track">
        ${t.name ? `<h4 class="cw-track-name"><span${ed(`@cur.${id}.t${ti}.name`)}>${esc(t.name)}</span></h4>` : ''}
        <ol class="cs-steps" style="--n:${cols};--nt:${tcols}">
          ${weeks.map((w, k) => {
            const units = weekUnits(w);
            const when = weekWhen(w);
            return `
              <li tabindex="0">
                <span class="step-no">${esc(weekLabel(w, k))}<span class="wk-sfx"> 진도</span></span>
                <p class="step-desc"${ed(`@cur.${id}.t${ti}.w${k + 1}`)}>${units.length ? units.map(esc).join('<br>') : '추후 안내'}</p>
                ${when ? `<span class="wk-when">${esc(when)}</span>` : ''}
              </li>`;
          }).join('')}
        </ol>
        <div class="step-detail" aria-live="polite"></div>
      </div>`;
  }

  function courseHtml(c) {
    const cur = c.cur;
    const isW = c.kind === 'winter';
    const id = c.id;
    const timesKey = isW ? `@w.${id}.times` : `@cls.${id}.times`;
    const timesDefault = isW ? sessionsHtml(c.cls.sessions) : timesHtml(c.cls.times);
    const targetKey = isW ? `@w.${id}.target` : `@cur.${id}.target`;
    const targetDefault = isW ? (c.cls.target || cur.target || '상담 시 안내') : (cur.target || c.cls.target || '상담 시 안내');
    const bookKey = isW ? `@cur.${id}.book` : `@cls.${id}.book`;
    const bookDefault = isW ? (cur.book || '추후 안내') : (c.cls.book || cur.book || '추후 안내');
    const eyebrow = isW
      ? `<p class="eyebrow">겨울방학 특강 · ${esc(c.cls.grade)}</p>`
      : `<p class="eyebrow" data-mirror="@grp.${c.group.id}.title">${esc(c.group.title)}</p>`;
    const back = isW ? '#winter' : `#${c.group.id}`;
    return `
      <article class="cs is-${c.kind}" id="course-${id}" hidden>
        <header class="cs-head">
          ${eyebrow}
          <h3 class="cs-title"><span${ed(nameKey(c))}>${isW ? esc(c.cls.name) : className(c.cls)}</span></h3>
          <p class="cs-goal"${ed(`@cur.${id}.goal`)}>${esc(cur.goal || '과정 목표는 상담 시 안내드립니다.')}</p>
        </header>
        <dl class="cs-facts">
          <div><dt>대상</dt><dd${ed(targetKey)}>${esc(targetDefault)}</dd></div>
          <div><dt>수업 시간</dt><dd><p class="time-lines"${ed(timesKey)}>${timesDefault}</p></dd></div>
          <div><dt>교재</dt><dd${ed(bookKey)}>${esc(bookDefault)}</dd></div>
          <div class="is-feat"><dt>수업 특징</dt><dd><p${ed(`@cur.${id}.feat`)}>${esc(cur.feature || '상담 시 안내')}</p></dd></div>
        </dl>
        <p class="cw-heading">주차별 진도</p>
        ${tracksOf(cur).map((t, ti) => trackHtml(id, t, ti)).join('')}
        ${cur.note ? `<p class="cw-note">※ <span${ed(`@cur.${id}.note`)}>${esc(cur.note)}</span></p>` : ''}
        <a class="text-link cs-back" href="${back}">← 시간표로 돌아가기</a>
      </article>`;
  }

  function curriculumPanel() {
    const chip = (c) => `<a class="cp-chip" href="#c-${c.id}" data-id="${c.id}" data-mirror="${nameKey(c)}">${esc(c.kind === 'winter' ? c.cls.name : classText(c.cls))}</a>`;
    const sections = [];
    const wItems = courses.filter((c) => c.kind === 'winter');
    if (wItems.length) sections.push({ kind: 'winter', title: '겨울방학 특강', groups: [{ label: '특강', items: wItems }] });
    LEVELS.forEach((lv) => {
      const groups = REGULAR_COURSES.filter((g) => g.level === lv.level)
        .map((g) => ({ label: g.title, mirror: `@grp.${g.id}.title`, items: courses.filter((c) => c.group === g) }))
        .filter((x) => x.items.length);
      if (groups.length) sections.push({ kind: lv.id, title: lv.label, groups });
    });

    let body;
    if (!currOk) {
      body = dataErrorHtml('커리큘럼을 불러오지 못했습니다.');
    } else {
      body = `
          <div class="cp-picker">
            ${sections.map((s) => `
              <div class="cp-section is-${s.kind}">
                <p class="cp-level">${esc(s.title)}</p>
                ${s.groups.map((pg) => `
                  <div class="cp-group">
                    <p class="cp-label"${pg.mirror ? ` data-mirror="${esc(pg.mirror)}"` : ''}>${esc(pg.label)}</p>
                    <div class="cp-chips">${pg.items.map(chip).join('')}</div>
                  </div>`).join('')}
              </div>`).join('')}
          </div>
          ${courses.length ? courses.map(courseHtml).join('') : '<p class="empty">등록된 커리큘럼이 없습니다.</p>'}
          <p class="curr-note"${ed('@panel.curr.note')}>※ 주차별 진도는 학교 진도와 학생 수준에 따라 조정될 수 있습니다. 자세한 내용은 상담 시 안내드립니다.</p>`;
    }

    return `
      <div class="sp-banner is-regular">
        <div class="container">
          <span class="sp-badge">CURRICULUM</span>
          <h2 class="sp-title"${ed('@panel.curr.title')}>과정별 커리큘럼</h2>
          <p class="sp-lead"${ed('@panel.curr.desc')}>과정을 고르면 대상, 수업 시간, 교재, 수업 특징과 주차별 진도를 볼 수 있습니다.</p>
        </div>
      </div>
      <div class="sp-body is-tint">
        <div class="container">${body}</div>
      </div>`;
  }

  /* ---------- 탭과 패널 그리기 ---------- */
  const panels = [];
  if (winterOn) panels.push({ id: 'winter', label: '겨울방학 특강', winter: true, html: winterPanel() });
  LEVELS.forEach((lv) => {
    const groups = REGULAR_COURSES.filter((g) => g.level === lv.level);
    if (groups.length) panels.push({ id: lv.id, label: lv.label, html: regularPanel(lv, groups) });
  });
  panels.push({ id: 'curriculum', label: '커리큘럼', html: curriculumPanel() });
  const panelIds = panels.map((p) => p.id);

  root.innerHTML = panels.map((p) =>
    `<section class="sp-panel" id="panel-${p.id}" aria-label="${esc(p.label)}" hidden>${p.html}</section>`).join('');

  if (tabsEl) {
    tabsEl.innerHTML = panels.map((p, i) => {
      const sep = i > 0 && (panels[i - 1].winter || p.id === 'curriculum') ? '<span class="tab-sep" aria-hidden="true"></span>' : '';
      return `${sep}<a href="#${p.id}" data-panel="${p.id}"${p.winter ? ' class="is-winter"' : ''}>${esc(p.label)}</a>`;
    }).join('');
  }

  /* ---------- 겨울방학 특강: 학년 버튼 ---------- */
  root.querySelectorAll('.winter-filter').forEach((f) => {
    f.addEventListener('click', (e) => {
      const b = e.target.closest('.wf-btn');
      if (!b) return;
      const g = b.dataset.grade;
      f.querySelectorAll('.wf-btn').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      root.querySelectorAll('.wc').forEach((card) => { card.hidden = !(g === '전체' || card.dataset.grade === g); });
    });
  });

  /* ---------- 휴대폰: 주차 칸 누르면 진도 보기 ---------- */
  const pickStep = (li) => {
    const tr = li.closest('.cw-track');
    tr.querySelectorAll('.cs-steps li').forEach((x) => x.classList.toggle('is-picked', x === li));
    fillStepDetail(tr);
  };
  root.addEventListener('click', (e) => {
    const li = e.target.closest('.cs-steps li');
    if (!li || document.documentElement.classList.contains('is-editing')) return;
    pickStep(li);
  });
  root.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const li = e.target.closest && e.target.closest('.cs-steps li');
    if (!li || e.target !== li || document.documentElement.classList.contains('is-editing')) return;
    e.preventDefault();
    pickStep(li);
  });
  root.querySelectorAll('.cw-track').forEach(fillStepDetail);

  /* ---------- 주소(#)에 따라 탭 바꾸기 ---------- */
  let currentCourse = null;

  function show(panelId) {
    panels.forEach((p) => { root.querySelector(`#panel-${p.id}`).hidden = p.id !== panelId; });
    if (!tabsEl) return;
    tabsEl.querySelectorAll('a[data-panel]').forEach((a) => {
      const on = a.dataset.panel === panelId;
      a.classList.toggle('is-active', on);
      if (on) {
        a.setAttribute('aria-current', 'true');
        tabsEl.scrollLeft = Math.max(0, a.offsetLeft - 24);
      } else {
        a.removeAttribute('aria-current');
      }
    });
  }

  function pickCourse(id) {
    root.querySelectorAll('.cs').forEach((cs) => { cs.hidden = cs.id !== `course-${id}`; });
    root.querySelectorAll('.cp-chip').forEach((ch) => {
      const on = ch.dataset.id === id;
      ch.classList.toggle('is-active', on);
      if (on) ch.setAttribute('aria-current', 'true'); else ch.removeAttribute('aria-current');
    });
    const cs = document.getElementById(`course-${id}`);
    if (cs) cs.querySelectorAll('.cw-track').forEach(fillStepDetail);
  }

  function scrollToEl(el, onlyIfAbove) {
    const header = document.getElementById('site-header');
    const tabs = document.querySelector('.sched-tabs');
    const offset = (header ? header.offsetHeight : 0) + (tabs ? tabs.offsetHeight : 0) + 8;
    const y = el.getBoundingClientRect().top + window.scrollY - offset;
    if (onlyIfAbove && window.scrollY <= y) return;
    window.scrollTo({ top: Math.max(0, y), behavior: reduceMotion() ? 'auto' : 'smooth' });
  }

  function route(doScroll) {
    let raw = '';
    try { raw = decodeURIComponent(location.hash.slice(1)); } catch (e) { raw = location.hash.slice(1); }
    let panel = panels[0].id;
    let focus = null;
    let course = null;

    const gid = galias[raw] || raw;
    const group = REGULAR_COURSES.find((g) => g.id === gid);
    if (panelIds.includes(raw)) {
      panel = raw;
    } else if (group) {
      const lv = LEVELS.find((l) => l.level === group.level);
      if (lv && panelIds.includes(lv.id)) {
        panel = lv.id;
        focus = document.getElementById(`blk-${group.id}`);
      }
    } else if (raw) {
      let id = raw.replace(/^c-/, '');
      id = alias[id] || id;
      if (courseIds.includes(id)) {
        panel = 'curriculum';
        course = id;
      }
    }

    show(panel);
    if (panel === 'curriculum') {
      course = course || currentCourse || firstRegular;
      if (course) {
        currentCourse = course;
        pickCourse(course);
        if (raw.startsWith('c-') || (raw && raw !== 'curriculum')) focus = document.getElementById(`course-${course}`);
      }
    }

    if (!doScroll) return;
    if (focus) requestAnimationFrame(() => scrollToEl(focus));
    else requestAnimationFrame(() => scrollToEl(root, true));
  }

  window.addEventListener('hashchange', () => route(true));
  route(!!location.hash);
}

/* ===== 공지사항: 리스트 ===== */
function initNotice() {
  const root = document.getElementById('notice-root');
  if (!root || !hasNotices()) return;

  const list = [...NOTICES].sort(byNewest);
  const id = Number(getParam('id'));
  if (id) { renderNoticeView(root, list, id); return; }

  const PER_PAGE = 10;
  const state = { q: '', page: 1 };

  root.innerHTML = `
    <div class="board-top">
      <p class="board-count">전체 <b id="notice-count">0</b>건</p>
      <form class="board-search" id="notice-search" role="search">
        <label class="sr-only" for="notice-q">공지 검색</label>
        <input id="notice-q" type="search" placeholder="제목 또는 내용 검색" autocomplete="off">
        <button type="submit" class="btn btn-primary">검색</button>
      </form>
    </div>
    <div class="board">
      <div class="board-head" aria-hidden="true"><span>번호</span><span>제목</span><span>작성일</span></div>
      <ul class="board-list" id="notice-list"></ul>
    </div>
    <nav class="pager" id="notice-pager" aria-label="페이지 이동"></nav>`;

  const listEl = root.querySelector('#notice-list');
  const pagerEl = root.querySelector('#notice-pager');
  const countEl = root.querySelector('#notice-count');
  const input = root.querySelector('#notice-q');

  const row = (n, numHtml, pinned) => `
    <li class="board-row${pinned ? ' is-pinned' : ''}">
      <span class="col-num">${numHtml}</span>
      <a class="col-title" href="notice.html?id=${n.id}">
        ${pinned ? '<span class="badge badge-m">공지</span>' : ''}
        <span class="t">${esc(n.title)}</span>
        ${isNew(n.date) ? '<span class="new" aria-label="새 글">N</span>' : ''}
      </a>
      <span class="col-date">${fmtDate(n.date)}</span>
    </li>`;

  function draw() {
    const q = state.q.trim().toLowerCase();
    const filtered = q ? list.filter((n) => (n.title + ' ' + n.body).toLowerCase().includes(q)) : list;
    const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    state.page = Math.min(state.page, pages);
    const start = (state.page - 1) * PER_PAGE;
    const slice = filtered.slice(start, start + PER_PAGE);
    const pinned = (!q && state.page === 1) ? list.filter((n) => n.important) : [];

    countEl.textContent = filtered.length;
    const rows = pinned.map((n) => row(n, '<span class="badge">공지</span>', true))
      .concat(slice.map((n, i) => row(n, filtered.length - (start + i), false)));
    listEl.innerHTML = rows.length ? rows.join('') : '<li class="board-empty">검색 결과가 없습니다.</li>';

    if (pages <= 1) { pagerEl.innerHTML = ''; return; }
    let html = `<button type="button" data-page="${state.page - 1}" ${state.page === 1 ? 'disabled' : ''} aria-label="이전 페이지">‹</button>`;
    for (let p = 1; p <= pages; p++) {
      html += `<button type="button" data-page="${p}" class="${p === state.page ? 'is-current' : ''}" ${p === state.page ? 'aria-current="page"' : ''}>${p}</button>`;
    }
    html += `<button type="button" data-page="${state.page + 1}" ${state.page === pages ? 'disabled' : ''} aria-label="다음 페이지">›</button>`;
    pagerEl.innerHTML = html;
  }

  root.querySelector('#notice-search').addEventListener('submit', (e) => {
    e.preventDefault(); state.q = input.value; state.page = 1; draw();
  });
  input.addEventListener('input', () => { state.q = input.value; state.page = 1; draw(); });
  pagerEl.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-page]');
    if (!b || b.disabled) return;
    state.page = Number(b.dataset.page);
    draw();
    root.scrollIntoView({ block: 'start' });
  });

  draw();
}

/* ===== 공지사항: 글 보기 ===== */
function renderNoticeView(root, list, id) {
  const idx = list.findIndex((n) => n.id === id);
  if (idx < 0) {
    root.innerHTML = `<p class="board-empty">글을 찾을 수 없습니다.</p>
      <div class="view-actions"><a class="btn btn-outline" href="notice.html">목록으로</a></div>`;
    return;
  }
  const n = list[idx];
  const newer = list[idx - 1];
  const older = list[idx + 1];
  document.title = `${n.title} - ${SITE.name}`;

  root.innerHTML = `
    <article class="notice-view">
      <header class="view-head">
        ${n.important ? '<span class="badge">공지</span>' : ''}
        <h2>${esc(n.title)}</h2>
        <p class="view-meta">${esc(SITE.author)} · ${fmtDate(n.date)}</p>
      </header>
      <div class="view-body">${toParagraphs(n.body)}</div>
      <ul class="view-nav">
        <li><span>이전글</span>${older ? `<a href="notice.html?id=${older.id}">${esc(older.title)}</a>` : '<em>이전 글이 없습니다.</em>'}</li>
        <li><span>다음글</span>${newer ? `<a href="notice.html?id=${newer.id}">${esc(newer.title)}</a>` : '<em>다음 글이 없습니다.</em>'}</li>
      </ul>
      <div class="view-actions"><a class="btn btn-outline" href="notice.html">목록으로</a></div>
    </article>`;
}

/* ===== 블로그: 목록 ===== */
function initBlog() {
  const tabsEl = document.getElementById('blog-tabs');
  const gridEl = document.getElementById('post-grid');
  if (!tabsEl || !gridEl || !hasPosts()) return;

  const form = document.getElementById('blog-search');
  const input = document.getElementById('blog-q');
  const searchBtn = document.getElementById('blog-search-btn');
  const state = { cat: BLOG_CATEGORIES[0], q: '' };
  const posts = [...POSTS].sort(byNewest);

  tabsEl.innerHTML = BLOG_CATEGORIES.map((c, i) =>
    `<button type="button" class="blog-tab" role="tab" data-cat="${esc(c)}" aria-selected="${i === 0}">${esc(c)}</button>`
  ).join('');

  function draw() {
    const q = state.q.trim().toLowerCase();
    const all = state.cat === BLOG_CATEGORIES[0];
    const items = posts.filter((p) =>
      (all || p.category === state.cat) &&
      (!q || (p.title + ' ' + p.excerpt + ' ' + p.body).toLowerCase().includes(q))
    );
    gridEl.innerHTML = items.length ? items.map(postCard).join('') : '<p class="empty">해당하는 글이 없습니다.</p>';
  }

  tabsEl.addEventListener('click', (e) => {
    const b = e.target.closest('.blog-tab');
    if (!b) return;
    state.cat = b.dataset.cat;
    tabsEl.querySelectorAll('.blog-tab').forEach((t) => t.setAttribute('aria-selected', String(t === b)));
    draw();
  });

  searchBtn.addEventListener('click', () => {
    const open = !form.classList.contains('is-open');
    form.classList.toggle('is-open', open);
    searchBtn.setAttribute('aria-label', open ? '검색 닫기' : '검색 열기');
    if (open) input.focus();
    else { input.value = ''; state.q = ''; draw(); }
  });
  form.addEventListener('submit', (e) => e.preventDefault());
  input.addEventListener('input', () => { state.q = input.value; draw(); });

  draw();
}

/* ===== 블로그: 글 보기 ===== */
function initPost() {
  const root = document.getElementById('post-root');
  if (!root || !hasPosts()) return;
  const p = POSTS.find((x) => x.id === Number(getParam('id')));
  if (!p) {
    root.innerHTML = `<div class="post-article"><p class="empty">글을 찾을 수 없습니다.</p>
      <div class="view-actions"><a class="btn btn-outline" href="blog.html">블로그로 돌아가기</a></div></div>`;
    return;
  }
  document.title = `${p.title} - ${SITE.name}`;
  const fit = p.fit === 'contain' ? ' fit-contain' : '';
  const others = [...POSTS].filter((x) => x.id !== p.id).sort((a, b) =>
    (b.category === p.category) - (a.category === p.category) || byNewest(a, b)
  ).slice(0, 2);

  root.innerHTML = `
    <article class="post-article">
      <a class="back-link" href="blog.html">← 블로그 목록</a>
      <div><span class="chip">${esc(p.category)}</span></div>
      <h1>${esc(p.title)}</h1>
      <p class="post-meta">
        <span class="avatar" aria-hidden="true">GRIT</span>
        <span>${esc(SITE.author)}</span><span class="sep">|</span><span>${fmtDate(p.date)} 게시</span>
      </p>
      <div class="post-hero media${fit}"><img src="${esc(p.image)}" alt=""></div>
      <div class="prose">${toParagraphs(p.body)}</div>
    </article>
    <section class="related">
      <h2>다른 글 읽기</h2>
      <div class="post-grid">${others.map(postCard).join('')}</div>
    </section>`;
}

/* ===== 예전 커리큘럼 주소 → 시간표&커리큘럼 페이지의 커리큘럼 탭으로 이동 ===== */
function initCurriculum() {
  const alias = typeof CURRICULUM_ALIAS !== 'undefined' ? CURRICULUM_ALIAS : {};
  const raw = location.hash.slice(1);
  const id = alias[raw] || raw;
  location.replace(`schedule.html${id ? `#c-${id}` : '#curriculum'}`);
}

/* ===== 시작 ===== */
document.addEventListener('DOMContentLoaded', async () => {
  const page = document.body.dataset.page;
  if (page === 'curriculum') { resolveReady(); initCurriculum(); return; }
  try {
    renderHeader();
    renderFooter();
    initImageFallback();
    try { await ensureData(page); } catch (e) { /* 아래에서 안내 문구로 처리 */ }
    if (page === 'home') initHome();
    if (page === 'schedule') initSchedule();
    if (page === 'notice') initNotice();
    if (page === 'blog') initBlog();
    if (page === 'post') initPost();
  } catch (err) {
    console.error('[GRIT] 화면을 그리는 중 문제가 생겼습니다.', err);
  } finally {
    resolveReady();
  }
});