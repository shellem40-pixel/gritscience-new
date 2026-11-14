'use strict';

/* ===== 사이트 공통 정보 ===== */
const SITE = {
  name: 'GRIT그릿과학쟁이 & 일산SP과학',
  author: '과학쟁이 원장',
  phone: '031-918-9912',
  tel: '0319189912',
  email: 'shellem40@gmail.com'
};

const NAV = [
  { href: 'about.html', label: '학원&시스템', key: 'about' },
  { href: 'schedule.html', label: '시간표&커리큘럼', key: 'schedule' },
  { href: 'blog.html', label: '블로그', key: 'blog' },
  { href: 'notice.html', label: '공지사항', key: 'notice' }
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
  el.className = 'site-footer';
  el.innerHTML = `
    <div class="container footer-inner">
      <div class="footer-brand">
        <strong>${esc(SITE.name)}</strong>
        <p>새로운 과학 학습 밀착 관리 시스템 · 심화학습연구소</p>
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

/* ===== 커리큘럼 ===== */
function initCurriculum() {
  const root = document.getElementById('curriculum-root');
  const tabs = document.getElementById('curr-tabs');
  if (!root || !tabs || typeof CURRICULUM === 'undefined') return;

  tabs.innerHTML = CURRICULUM.map((c) => `<a href="#${c.id}" data-id="${c.id}">${esc(c.short)}</a>`).join('');
  root.innerHTML = CURRICULUM.map((c) => `
    <section class="curr-section" id="${c.id}">
      <div class="curr-head">
        <p class="eyebrow">${esc(c.group)}</p>
        <h2>${esc(c.title)}</h2>
        <p>${esc(c.goal)}</p>
        <dl class="curr-facts">
          <div><dt>대상</dt><dd>${esc(c.target)}</dd></div>
          <div><dt>수업 시간</dt><dd>${esc(c.time)}</dd></div>
        </dl>
      </div>
      <ol class="curr-steps">
        ${c.steps.map((s, i) => `<li><span class="step-no">STEP ${i + 1}</span><h3>${esc(s.title)}</h3><p>${esc(s.desc)}</p></li>`).join('')}
      </ol>
      <a class="text-link" href="schedule.html">← 시간표로 돌아가기</a>
    </section>`).join('');

  const setActive = (id) => {
    tabs.querySelectorAll('a').forEach((a) => a.classList.toggle('is-active', a.dataset.id === id));
    root.querySelectorAll('.curr-section').forEach((s) => s.classList.toggle('is-target', s.id === id));
    const activeTab = tabs.querySelector('a.is-active');
    if (activeTab) activeTab.scrollIntoView({ block: 'nearest', inline: 'center' });
  };

  const goHash = () => {
    const id = location.hash.slice(1);
    const target = id && document.getElementById(id);
    if (target) {
      setActive(id);
      requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
    } else {
      setActive(CURRICULUM[0].id);
    }
  };
  window.addEventListener('hashchange', goHash);
  goHash();
}

/* ===== 시작 ===== */
document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  renderFooter();
  initImageFallback();
  const page = document.body.dataset.page;
  if (page === 'home') initHome();
  if (page === 'notice') initNotice();
  if (page === 'blog') initBlog();
  if (page === 'post') initPost();
  if (page === 'curriculum') initCurriculum();
});