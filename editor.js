'use strict';
/* =========================================================
   편집 모드: 홈페이지 화면에서 글자를 바로 고치기
   ---------------------------------------------------------
   ■ 방문자: data/edits.json 에 저장된 수정 글자를 불러와 기본 글자 대신 보여 줍니다.
   ■ 원장님: 주소 뒤에 ?edit 를 붙여 들어오면 편집 모드가 켜집니다.
       예) https://shellem40-pixel.github.io/gritscience-new/?edit
   ■ 고칠 수 있는 곳: data-edit="이름" 이 붙은 글자만.
       - 이름이 '@'로 시작하면 여러 페이지가 함께 쓰는 글자입니다.
         (예: 반 이름은 홈 "개설 과정"과 시간표 페이지에 함께 반영)
       - 같은 이름이 한 페이지에 여러 곳 있으면 한 곳을 고칠 때 함께 바뀝니다.
   ■ 저장: GitHub 저장소의 data/edits.json 파일 하나에만 저장합니다.
       토큰은 이 브라우저(localStorage)에만 보관하고, 홈페이지 파일에는 넣지 않습니다.
   ========================================================= */
(function () {
  const CONFIG = {
    owner: 'shellem40-pixel',      // github.io 주소가 아닐 때(미리보기) 쓰는 기본 저장소
    repo: 'gritscience-new',
    branch: 'main',
    file: 'data/edits.json',
    tokenKey: 'grit-editor-token',
    modeKey: 'grit-editor-on',
    tokenUrl: 'https://github.com/settings/personal-access-tokens/new',
    revealAfter: 1500              // 수정 글자를 못 불러와도 이 시간(ms) 뒤에는 글자를 보여 줌
  };

  const PAGE_NAMES = { home: '홈', schedule: '시간표&커리큘럼', curriculum: '커리큘럼', notice: '공지사항', blog: '블로그' };

  /* ----- 1. 불러오는 동안 원래 글자가 깜빡이지 않게 잠깐 숨김 ----- */
  const root = document.documentElement;
  root.classList.add('edits-pending');
  const revealTimer = setTimeout(reveal, CONFIG.revealAfter);
  function reveal() {
    clearTimeout(revealTimer);
    root.classList.remove('edits-pending');
  }

  /* ----- 저장소(브라우저) 안전하게 쓰기: 막힌 환경에서도 오류 없이 ----- */
  function safeStore(type) {
    let s = null;
    try { s = window[type]; s.getItem('x'); } catch (e) { s = null; }
    return {
      get(k) { try { return s ? s.getItem(k) : null; } catch (e) { return null; } },
      set(k, v) { try { if (s) s.setItem(k, v); } catch (e) { /* 무시 */ } },
      del(k) { try { if (s) s.removeItem(k); } catch (e) { /* 무시 */ } }
    };
  }
  const local = safeStore('localStorage');
  const session = safeStore('sessionStorage');

  const params = new URLSearchParams(location.search);
  if (params.has('edit')) session.set(CONFIG.modeKey, '1');
  const editMode = params.has('edit') || session.get(CONFIG.modeKey) === '1';

  const REPO = detectRepo();
  const API = `https://api.github.com/repos/${REPO.owner}/${REPO.repo}`;

  /* github.io 주소면 주소에서 저장소 이름을 읽음 (저장소 이름을 바꿔도 그대로 동작) */
  function detectRepo() {
    const host = location.hostname;
    if (host.endsWith('.github.io')) {
      const owner = host.replace(/\.github\.io$/, '');
      const first = location.pathname.split('/').filter(Boolean)[0];
      const repo = first && !first.includes('.') ? first : host;
      return { owner, repo, branch: CONFIG.branch };
    }
    return { owner: CONFIG.owner, repo: CONFIG.repo, branch: CONFIG.branch };
  }

  /* ----- 상태 ----- */
  const state = {
    page: 'page',
    els: [],
    defaults: {},   // 처음 화면에 그려진 글자
    baseline: {},   // 마지막으로 저장된(또는 불러온) 글자
    data: emptyData(),
    token: null,    // 브라우저 저장이 막혔을 때 임시 보관
    saving: false,
    leaving: false
  };

  function emptyData() { return { version: 1, pages: {}, shared: {} }; }
  function normalize(d) {
    if (!d || typeof d !== 'object') return emptyData();
    if (!d.pages || typeof d.pages !== 'object') d.pages = {};
    if (!d.shared || typeof d.shared !== 'object') d.shared = {};
    return d;
  }
  function keyOf(el) { return el.dataset.edit; }
  function isShared(key) { return key.charAt(0) === '@'; }
  function pageName() { return PAGE_NAMES[state.page] || state.page; }
  function uniqueKeys() { return [...new Set(state.els.map(keyOf))]; }
  function firstEl(key) { return state.els.find((el) => keyOf(el) === key); }

  /* =========================================================
     글자 정리: 허용한 꾸밈(줄바꿈, 굵게, 강조, 작은 글씨, 링크)만 남김
     ========================================================= */
  const TAGS = { EM: 'em', I: 'em', STRONG: 'strong', B: 'strong', SMALL: 'small', A: 'a' };

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function escAttr(s) { return esc(s).replace(/"/g, '&quot;'); }
  function safeHref(h) {
    h = (h || '').trim();
    return /^(https?:|tel:|mailto:|#|[\w.\-/]+\.html)/i.test(h) ? h : '';
  }
  function safeClass(c) {
    c = (c || '').trim();
    return /^[\w\s-]+$/.test(c) ? c : '';
  }

  function walk(node) {
    let out = '';
    node.childNodes.forEach(n => {
      if (n.nodeType === 3) { out += esc(n.nodeValue.replace(/[ \t\r\n]+/g, ' ')); return; }
      if (n.nodeType !== 1) return;
      const tag = n.tagName;
      if (tag === 'BR') { out += '<br>'; return; }
      if (tag === 'DIV' || tag === 'P') {
        if (out && !/<br>$/.test(out)) out += '<br>';
        out += walk(n);
        return;
      }
      const t = TAGS[tag];
      if (!t) { out += walk(n); return; }
      let attrs = '';
      const cls = safeClass(n.getAttribute('class'));
      if (cls) attrs += ` class="${escAttr(cls)}"`;
      if (t === 'a') {
        const href = safeHref(n.getAttribute('href'));
        if (href) attrs += ` href="${escAttr(href)}"`;
        if (n.getAttribute('target') === '_blank') attrs += ' target="_blank" rel="noopener"';
      }
      const inner = walk(n);
      if (!inner) return;
      out += `<${t}${attrs}>${inner}</${t}>`;
    });
    return out;
  }

  function clean(html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = String(html || '');
    return walk(tpl.content).replace(/^(?:\s|<br>)+|(?:\s|<br>)+$/g, '');
  }

  /* 전화번호·이메일 글자를 고치면 누를 때 연결되는 주소도 함께 맞춤 */
  function fixLinks(el) {
    const links = el.matches('a') ? [el] : Array.from(el.querySelectorAll('a'));
    links.forEach(a => {
      const href = a.getAttribute('href') || '';
      const text = a.textContent.trim();
      if (href.startsWith('tel:')) {
        const digits = text.replace(/[^\d+]/g, '');
        if (digits.length >= 8) a.setAttribute('href', 'tel:' + digits);
      } else if (href.startsWith('mailto:') && /^[^\s@]+@[^\s@]+$/.test(text)) {
        a.setAttribute('href', 'mailto:' + text);
      }
    });
  }

  /* 같은 이름의 다른 글자도 똑같이 맞춤 */
  function syncSame(el) {
    const key = keyOf(el);
    state.els.forEach(o => {
      if (o !== el && keyOf(o) === key && o.innerHTML !== el.innerHTML) {
        o.innerHTML = el.innerHTML;
        fixLinks(o);
      }
    });
  }

  /* =========================================================
     2. 시작: 화면이 다 그려진 뒤(app.js 다음) → 저장된 수정 글자 불러오기 → 적용
     ========================================================= */
  function boot() { setTimeout(init, 0); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  async function init() {
    state.page = (document.body && document.body.dataset.page) || 'page';
    state.els = Array.from(document.querySelectorAll('[data-edit]'));
    state.els.forEach(el => {
      const key = keyOf(el);
      if (!(key in state.defaults)) state.defaults[key] = clean(el.innerHTML);
    });

    try {
      state.data = editMode ? await loadForEditor() : await loadFromSite();
    } catch (e) {
      state.data = emptyData();
    }
    applyEdits();
    reveal();
    document.dispatchEvent(new CustomEvent('edits:applied', { detail: { shared: state.data.shared || {} } }));
    if (editMode) startEditor();
  }

  async function loadFromSite() {
    const res = await fetch(`${CONFIG.file}?v=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return emptyData();
    return normalize(await res.json());
  }

  /* 편집 모드에서는 GitHub에서 바로 읽어서 방금 저장한 내용도 보이게 함 */
  async function loadForEditor() {
    try {
      const remote = await readRemote(getToken());
      return remote.data;
    } catch (e) {
      try { return await loadFromSite(); } catch (e2) { return emptyData(); }
    }
  }

  function applyEdits() {
    const mine = state.data.pages[state.page] || {};
    const shared = state.data.shared || {};
    state.els.forEach(el => {
      const key = keyOf(el);
      const src = isShared(key) ? shared : mine;
      if (Object.prototype.hasOwnProperty.call(src, key)) {
        const html = clean(src[key]);
        if (html) el.innerHTML = html;
      }
      fixLinks(el);
    });
  }

  /* =========================================================
     3. GitHub 읽기·쓰기
     ========================================================= */
  function getToken() { return local.get(CONFIG.tokenKey) || state.token; }
  function setToken(t) { state.token = t; local.set(CONFIG.tokenKey, t); }
  function forgetToken() { state.token = null; local.del(CONFIG.tokenKey); }

  async function gh(method, path, token, body) {
    const headers = { Accept: 'application/vnd.github+json' };
    if (token) headers.Authorization = 'Bearer ' + token;
    if (body) headers['Content-Type'] = 'application/json';
    try {
      return await fetch(API + path, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        cache: 'no-store'
      });
    } catch (e) {
      throw editorError(0);
    }
  }

  function editorError(status) {
    const messages = {
      0: '인터넷 연결을 확인한 뒤 다시 시도해 주세요.',
      401: '토큰이 맞지 않거나 기간이 끝났어요. 토큰을 다시 넣어 주세요.',
      403: '이 토큰에는 저장 권한이 없어요. Contents 권한을 Read and write로 만들었는지 확인해 주세요.',
      404: `저장소를 찾지 못했어요. 토큰을 만들 때 ${REPO.repo} 저장소를 골랐는지 확인해 주세요.`
    };
    const err = new Error(messages[status] || `저장하지 못했어요. (오류 ${status}) 잠시 뒤 다시 시도해 주세요.`);
    err.status = status;
    return err;
  }

  function b64encode(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    bytes.forEach(b => { bin += String.fromCharCode(b); });
    return btoa(bin);
  }
  function b64decode(b64) {
    const bin = atob(String(b64).replace(/\s/g, ''));
    const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  async function readRemote(token) {
    const path = `/contents/${CONFIG.file}?ref=${encodeURIComponent(REPO.branch)}&t=${Date.now()}`;
    const res = await gh('GET', path, token);
    if (res.status === 404) return { data: emptyData(), sha: null };
    if (!res.ok) throw editorError(res.status);
    const json = await res.json();
    let data = emptyData();
    try { data = normalize(JSON.parse(b64decode(json.content || ''))); } catch (e) { /* 빈 파일로 취급 */ }
    return { data, sha: json.sha || null };
  }

  /* 이 페이지에서 처음 글자와 다른 것만 모음 (페이지 전용 / 함께 쓰는 글자 나눠서) */
  function collectEdits() {
    const page = {};
    const shared = {};
    const sharedKeys = [];
    uniqueKeys().forEach(key => {
      const el = firstEl(key);
      const html = clean(el.innerHTML);
      const changed = html && html !== state.defaults[key];
      if (isShared(key)) {
        sharedKeys.push(key);
        if (changed) shared[key] = html;
      } else if (changed) {
        page[key] = html;
      }
    });
    return { page, shared, sharedKeys };
  }

  async function writeRemote(token, attempt) {
    attempt = attempt || 0;
    const remote = await readRemote(token);
    const data = remote.data;
    const mine = collectEdits();

    if (Object.keys(mine.page).length) data.pages[state.page] = mine.page;
    else delete data.pages[state.page];

    mine.sharedKeys.forEach(k => {
      if (Object.prototype.hasOwnProperty.call(mine.shared, k)) data.shared[k] = mine.shared[k];
      else delete data.shared[k];
    });
    data.updated = new Date().toISOString();

    const body = {
      message: `홈페이지 글자 수정: ${pageName()}`,
      content: b64encode(JSON.stringify(data, null, 2) + '\n'),
      branch: REPO.branch
    };
    if (remote.sha) body.sha = remote.sha;

    const res = await gh('PUT', `/contents/${CONFIG.file}`, token, body);
    if ((res.status === 409 || res.status === 422) && attempt < 2) return writeRemote(token, attempt + 1);
    if (!res.ok) throw editorError(res.status);
    state.data = data;
  }

  /* =========================================================
     4. 편집 모드 화면
     ========================================================= */
  let bar, statusEl, undoBtn, saveBtn, toastEl, toastTimer;

  function startEditor() {
    root.classList.add('is-editing');

    state.els.forEach(el => {
      const key = keyOf(el);
      state.baseline[key] = clean(el.innerHTML);
      el.contentEditable = 'true';
      el.spellcheck = false;
      el.setAttribute('title', '눌러서 글자를 고치세요');
      el.addEventListener('input', onChange);
      el.addEventListener('keydown', onKey);
      el.addEventListener('paste', onPaste);
      el.addEventListener('blur', onBlur);
    });

    /* 편집 중인 글자 안의 링크는 눌러도 이동하지 않게 */
    document.addEventListener('click', e => {
      if (e.target.closest('[data-edit]') && e.target.closest('a')) e.preventDefault();
    }, true);

    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); }
    });

    window.addEventListener('beforeunload', e => {
      if (!state.leaving && unsavedCount()) { e.preventDefault(); e.returnValue = ''; }
    });

    buildBar();
    markChanged();
    updateBar();
    if (state.els.length) toast('편집 모드예요. 점선 글자를 눌러 고친 뒤 저장하기를 누르세요.');
  }

  function buildBar() {
    bar = document.createElement('div');
    bar.className = 'ed-bar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', '편집 모드');
    bar.innerHTML = `
      <div class="ed-info">
        <span class="ed-badge">편집 모드</span>
        <span class="ed-status" aria-live="polite"></span>
      </div>
      <div class="ed-actions">
        <button type="button" class="ed-btn" data-act="undo">되돌리기</button>
        <button type="button" class="ed-btn is-primary" data-act="save">저장하기</button>
        <button type="button" class="ed-btn" data-act="settings">설정</button>
        <button type="button" class="ed-btn is-ghost" data-act="exit">편집 끝내기</button>
      </div>`;
    document.body.appendChild(bar);

    toastEl = document.createElement('div');
    toastEl.className = 'ed-toast';
    toastEl.setAttribute('role', 'status');
    toastEl.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastEl);

    statusEl = bar.querySelector('.ed-status');
    undoBtn = bar.querySelector('[data-act="undo"]');
    saveBtn = bar.querySelector('[data-act="save"]');

    bar.addEventListener('click', e => {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;
      const act = btn.dataset.act;
      if (act === 'undo') undo();
      else if (act === 'save') save();
      else if (act === 'settings') openSettings();
      else if (act === 'exit') exitEditor();
    });
  }

  function unsavedCount() {
    return uniqueKeys().filter(key => clean(firstEl(key).innerHTML) !== state.baseline[key]).length;
  }

  function markChanged() {
    state.els.forEach(el => {
      el.classList.toggle('edit-changed', clean(el.innerHTML) !== state.baseline[keyOf(el)]);
    });
  }

  function updateBar() {
    if (!bar) return;
    const n = unsavedCount();
    if (!state.els.length) statusEl.textContent = '이 페이지에는 고칠 수 있는 글자가 없어요.';
    else statusEl.textContent = n ? `저장하지 않은 수정 ${n}곳` : '점선 글자를 눌러 고치세요';
    statusEl.classList.toggle('is-dirty', n > 0);
    undoBtn.disabled = !n || state.saving;
    saveBtn.disabled = !n || state.saving;
    saveBtn.textContent = state.saving ? '저장하는 중…' : '저장하기';
  }

  /* ----- 글자 입력 처리 ----- */
  function isSingleLine(el) { return ['A', 'SPAN', 'STRONG', 'DD'].includes(el.tagName); }

  function onChange(e) {
    if (e && e.currentTarget) syncSame(e.currentTarget);
    markChanged();
    updateBar();
  }

  function onKey(e) {
    const el = e.currentTarget;
    if (e.key === 'Escape') { el.blur(); return; }
    if (e.key !== 'Enter' || e.isComposing) return;
    e.preventDefault();
    if (isSingleLine(el)) { el.blur(); return; }
    if (!document.execCommand('insertLineBreak')) document.execCommand('insertHTML', false, '<br>');
  }

  function onPaste(e) {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, text);
  }

  function onBlur(e) {
    const el = e.currentTarget;
    const key = keyOf(el);
    const html = clean(el.innerHTML);
    if (!html) {
      el.innerHTML = state.baseline[key] || state.defaults[key];
      toast('빈칸으로 둘 수 없어서 원래 글자로 돌렸어요.');
    } else if (html !== el.innerHTML) {
      el.innerHTML = html;
    }
    fixLinks(el);
    syncSame(el);
    markChanged();
    updateBar();
  }

  /* ----- 버튼 동작 ----- */
  function undo() {
    state.els.forEach(el => {
      el.innerHTML = state.baseline[keyOf(el)];
      fixLinks(el);
    });
    markChanged();
    updateBar();
    toast('저장하지 않은 수정을 되돌렸어요.');
  }

  async function save() {
    if (state.saving || !unsavedCount()) return;
    let token = getToken();
    if (!token) {
      token = await askToken();
      if (!token) return;
    }

    state.saving = true;
    updateBar();
    let needNewToken = false;
    try {
      await writeRemote(token);
      state.els.forEach(el => { state.baseline[keyOf(el)] = clean(el.innerHTML); });
      markChanged();
      toast('저장했어요. 1~2분 뒤 모든 방문자에게 보여요.');
    } catch (err) {
      if (err.status === 401) { forgetToken(); needNewToken = true; }
      else toast(err.message, true);
    } finally {
      state.saving = false;
      updateBar();
    }

    if (needNewToken) {
      const t = await askToken('토큰이 맞지 않거나 기간이 끝났어요. 새 토큰을 넣어 주세요.');
      if (t) save();
    }
  }

  function exitEditor() {
    if (unsavedCount() && !window.confirm('저장하지 않은 수정이 있어요. 그래도 편집을 끝낼까요?')) return;
    state.leaving = true;
    session.del(CONFIG.modeKey);
    const url = new URL(location.href);
    url.searchParams.delete('edit');
    location.href = url.toString();
  }

  function toast(msg, isError) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('is-error', !!isError);
    toastEl.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-show'), isError ? 6000 : 3500);
  }

  /* =========================================================
     5. 창(모달): 토큰 넣기, 설정
     ========================================================= */
  function openModal(html, onClose) {
    const wrap = document.createElement('div');
    wrap.className = 'ed-modal';
    wrap.innerHTML = `<div class="ed-modal-box" role="dialog" aria-modal="true" aria-labelledby="ed-modal-title">${html}</div>`;
    document.body.appendChild(wrap);
    const box = wrap.querySelector('.ed-modal-box');

    function close() {
      document.removeEventListener('keydown', onEsc);
      wrap.remove();
      if (onClose) onClose();
    }
    function onEsc(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onEsc);
    wrap.addEventListener('click', e => { if (e.target === wrap) close(); });

    return { box, close, remove() { document.removeEventListener('keydown', onEsc); wrap.remove(); } };
  }

  function askToken(message) {
    return new Promise(resolve => {
      let finished = false;
      function done(value) {
        if (finished) return;
        finished = true;
        resolve(value);
      }

      const m = openModal(`
        <h2 class="ed-title" id="ed-modal-title">GitHub 토큰 넣기</h2>
        <p class="ed-text">처음 한 번만 넣으면 돼요. 토큰은 <b>이 컴퓨터의 브라우저에만</b> 저장되고, 홈페이지 파일에는 들어가지 않아요.</p>
        <ol class="ed-steps">
          <li>아래 <b>토큰 만들기 화면 열기</b>를 눌러요.</li>
          <li>Token name에 <b>홈페이지 편집</b>이라고 적어요.</li>
          <li>Repository access에서 <b>Only select repositories</b>를 누르고 <b>${esc(REPO.repo)}</b>를 골라요.</li>
          <li>Permissions에서 <b>Contents</b>를 <b>Read and write</b>로 바꿔요.</li>
          <li><b>Generate token</b>을 누르고, 나온 글자를 복사해서 아래에 붙여넣어요.</li>
        </ol>
        <a class="ed-link" href="${CONFIG.tokenUrl}" target="_blank" rel="noopener">토큰 만들기 화면 열기 ↗</a>
        <label class="ed-label" for="ed-token">토큰</label>
        <input class="ed-input" id="ed-token" type="password" autocomplete="off" spellcheck="false" placeholder="github_pat_ 로 시작하는 글자">
        <p class="ed-error" role="alert"${message ? '' : ' hidden'}>${esc(message || '')}</p>
        <div class="ed-modal-actions">
          <button type="button" class="ed-mbtn" data-act="cancel">취소</button>
          <button type="button" class="ed-mbtn is-primary" data-act="ok">확인</button>
        </div>`, () => done(null));

      const input = m.box.querySelector('#ed-token');
      const errEl = m.box.querySelector('.ed-error');
      const okBtn = m.box.querySelector('[data-act="ok"]');

      function showErr(text) { errEl.textContent = text; errEl.hidden = false; }

      async function submit() {
        const val = input.value.trim();
        if (!val) { showErr('토큰을 붙여넣어 주세요.'); return; }
        okBtn.disabled = true;
        okBtn.textContent = '확인하는 중…';
        try {
          const res = await gh('GET', '', val);
          if (!res.ok) throw editorError(res.status);
          setToken(val);
          m.remove();
          done(val);
          toast('토큰을 저장했어요.');
        } catch (err) {
          showErr(err.message);
          okBtn.disabled = false;
          okBtn.textContent = '확인';
        }
      }

      okBtn.addEventListener('click', submit);
      input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
      m.box.querySelector('[data-act="cancel"]').addEventListener('click', () => m.close());
      setTimeout(() => input.focus(), 30);
    });
  }

  function openSettings() {
    const hasToken = !!getToken();
    const m = openModal(`
      <h2 class="ed-title" id="ed-modal-title">편집 설정</h2>
      <dl class="ed-meta">
        <div><dt>저장소</dt><dd>${esc(REPO.owner)}/${esc(REPO.repo)}</dd></div>
        <div><dt>토큰</dt><dd>${hasToken ? '이 컴퓨터에 저장됨' : '아직 없음'}</dd></div>
        <div><dt>지금 페이지</dt><dd>${esc(pageName())}</dd></div>
      </dl>
      <div class="ed-menu">
        <button type="button" class="ed-mbtn" data-act="token">토큰 ${hasToken ? '바꾸기' : '넣기'}</button>
        <button type="button" class="ed-mbtn" data-act="forget"${hasToken ? '' : ' disabled'}>이 컴퓨터에서 토큰 지우기</button>
        <button type="button" class="ed-mbtn" data-act="reset"${state.els.length ? '' : ' disabled'}>이 페이지 글자를 처음 상태로 되돌리기</button>
      </div>
      <p class="ed-text is-small">처음 상태로 되돌린 뒤 <b>저장하기</b>를 눌러야 홈페이지에 반영돼요.</p>
      <div class="ed-modal-actions">
        <button type="button" class="ed-mbtn is-primary" data-act="close">닫기</button>
      </div>`);

    m.box.addEventListener('click', async e => {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;
      const act = btn.dataset.act;
      if (act === 'close') { m.close(); return; }
      if (act === 'token') { m.close(); await askToken(); return; }
      if (act === 'forget') {
        if (!window.confirm('이 컴퓨터에 저장된 토큰을 지울까요? 다음에 저장할 때 다시 넣어야 해요.')) return;
        forgetToken();
        m.close();
        toast('토큰을 지웠어요.');
        return;
      }
      if (act === 'reset') {
        if (!window.confirm('이 페이지에서 고친 글자를 모두 처음 상태로 되돌릴까요?')) return;
        state.els.forEach(el => {
          el.innerHTML = state.defaults[keyOf(el)];
          fixLinks(el);
        });
        markChanged();
        updateBar();
        m.close();
        toast('처음 글자로 바꿨어요. 저장하기를 눌러야 반영돼요.');
      }
    });
    setTimeout(() => { const b = m.box.querySelector('[data-act="close"]'); if (b) b.focus(); }, 30);
  }
})();