(function() {
  'use strict';

  const STORAGE_PREFIX = 'dfr-home-media:';
  const MAX_LOCAL_STORAGE_BYTES = 3 * 1024 * 1024;

  function updateUtcClock() {
    const el = document.getElementById('homeUtcClock');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleString('en-GB', {
      timeZone: 'UTC',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).toUpperCase();
  }

  function renderMedia(slot, payload) {
    slot.classList.add('has-media');
    slot.innerHTML = '';
    const mediaType = payload.type || '';
    const media = document.createElement(mediaType.startsWith('video/') ? 'video' : 'img');
    if (media.tagName === 'VIDEO') {
      media.autoplay = true;
      media.loop = true;
      media.muted = true;
      media.playsInline = true;
    } else {
      media.alt = 'Dropped mission media';
    }
    media.src = payload.dataUrl;
    slot.appendChild(media);
  }

  function clearSlot(slot) {
    localStorage.removeItem(STORAGE_PREFIX + slot.dataset.slotId);
    slot.classList.remove('has-media');
    slot.innerHTML = '';
    ensureClearButton(slot);
  }

  function ensureClearButton(slot) {
    const frame = slot.closest('.hero-slot-frame');
    if (!frame || frame.querySelector('.slot-clear')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'slot-clear';
    button.setAttribute('aria-label', 'Clear media slot');
    button.textContent = '×';
    button.addEventListener('click', function(event) {
      event.stopPropagation();
      clearSlot(slot);
    });
    frame.appendChild(button);
  }

  function restoreSlot(slot) {
    ensureClearButton(slot);
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + slot.dataset.slotId);
      if (saved) {
        renderMedia(slot, JSON.parse(saved));
        return;
      }
      if (slot.dataset.defaultSrc) {
        renderMedia(slot, {
          type: slot.dataset.defaultType || '',
          dataUrl: slot.dataset.defaultSrc
        });
      }
    } catch (err) {
      localStorage.removeItem(STORAGE_PREFIX + slot.dataset.slotId);
    }
  }

  function persistFile(slot, file) {
    if (!file || (!file.type.startsWith('image/') && !file.type.startsWith('video/'))) return;
    if (file.size > MAX_LOCAL_STORAGE_BYTES) {
      alert('This file is larger than 3MB. Use a smaller image or video for the home preview slot.');
      return;
    }
    const reader = new FileReader();
    reader.onload = function() {
      const payload = { type: file.type, dataUrl: reader.result };
      localStorage.setItem(STORAGE_PREFIX + slot.dataset.slotId, JSON.stringify(payload));
      renderMedia(slot, payload);
      ensureClearButton(slot);
    };
    reader.readAsDataURL(file);
  }

  function wireDropSlot(slot) {
    restoreSlot(slot);
    ['dragenter', 'dragover'].forEach(eventName => {
      slot.addEventListener(eventName, function(event) {
        event.preventDefault();
        slot.classList.add('drag-over');
      });
    });
    ['dragleave', 'drop'].forEach(eventName => {
      slot.addEventListener(eventName, function(event) {
        event.preventDefault();
        slot.classList.remove('drag-over');
      });
    });
    slot.addEventListener('drop', function(event) {
      persistFile(slot, event.dataTransfer.files && event.dataTransfer.files[0]);
    });
  }

  function wireAboutModal() {
    const modal = document.getElementById('aboutModal');
    const openBtn = document.getElementById('whyToolBtn');
    if (!modal || !openBtn) return;
    // The shared About modal ships without a logo src (paths differ per page).
    const aboutLogo = document.getElementById('aboutPageLogo');
    if (aboutLogo && !aboutLogo.getAttribute('src')) aboutLogo.src = 'assets/uasc-logo.png';
    const total = modal.querySelectorAll('.about-page').length || 1;
    let currentPage = 0;
    const showPage = page => {
      currentPage = Math.max(0, Math.min(total - 1, page));
      modal.querySelectorAll('.about-page').forEach(el => {
        el.classList.toggle('active', Number(el.dataset.page) === currentPage);
      });
      modal.querySelectorAll('.about-dot').forEach(el => {
        el.classList.toggle('active', Number(el.dataset.page) === currentPage);
      });
      const prev = document.getElementById('aboutPrev');
      const next = document.getElementById('aboutNext');
      const counter = document.getElementById('aboutPageCounter');
      if (prev) prev.disabled = currentPage === 0;
      if (next) next.textContent = currentPage === total - 1 ? 'Close' : 'Next ->';
      if (counter) counter.textContent = `${currentPage + 1} / ${total}`;
      const body = document.getElementById('aboutBody');
      if (body) body.scrollTop = 0;
    };
    const open = () => {
      modal.style.display = 'flex';
      showPage(0);
    };
    const close = () => { modal.style.display = 'none'; };
    openBtn.addEventListener('click', open);
    document.getElementById('aboutBtn')?.addEventListener('click', open);
    document.getElementById('aboutClose')?.addEventListener('click', close);
    modal.querySelector('.about-backdrop')?.addEventListener('click', close);
    document.getElementById('aboutPrev')?.addEventListener('click', () => showPage(currentPage - 1));
    document.getElementById('aboutNext')?.addEventListener('click', () => {
      if (currentPage === total - 1) close();
      else showPage(currentPage + 1);
    });
    modal.querySelectorAll('.about-dot').forEach(el => {
      el.addEventListener('click', () => showPage(Number(el.dataset.page)));
    });
    document.addEventListener('keydown', event => {
      if (modal.style.display === 'none') return;
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowRight') showPage(currentPage + 1);
      if (event.key === 'ArrowLeft') showPage(currentPage - 1);
    });
  }

  function wireSavedPlanLoader() {
    const button = document.getElementById('loadSavedPlanBtn');
    const input = document.getElementById('loadSavedPlanInput');
    if (!button || !input) return;
    const getStorage = () => {
      try {
        return window.sessionStorage || null;
      } catch (err) {
        return null;
      }
    };
    button.addEventListener('click', () => input.click());
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = String(reader.result || '');
          const parsed = JSON.parse(text);
          if (!parsed || (parsed.fileType !== 'uasc-dfr-plan' && !parsed.area && !parsed.incidents)) {
            throw new Error('Not a DFR plan file');
          }
          const storage = getStorage();
          if (!storage) throw new Error('Plan handoff storage unavailable');
          storage.setItem('uasc-dfr-load-plan', text);
          window.location.href = 'planner/?loadPlan=1';
        } catch (err) {
          alert('Could not load this plan file. Choose a saved .dfrplan.json file.');
        } finally {
          input.value = '';
        }
      };
      reader.readAsText(file);
    });
  }

  function wireTermsModal() {
    const modal = document.getElementById('termsModal');
    const link = document.getElementById('termsLink');
    if (!modal || !link) return;
    const open = () => { modal.style.display = 'flex'; };
    const close = () => { modal.style.display = 'none'; };
    link.addEventListener('click', open);
    modal.querySelectorAll('[data-terms-close]').forEach(el => el.addEventListener('click', close));
    document.addEventListener('keydown', event => {
      if (modal.style.display !== 'none' && event.key === 'Escape') close();
    });
  }

  // ---- Settings persistence (shared key with the planner) ----
  const SETTINGS_KEY = 'uascDfrSettings';
  function readHomeSettings() {
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function writeHomeSettings(patch) {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(Object.assign(readHomeSettings(), patch))); } catch (e) { /* storage unavailable */ }
  }

  // ---- Level-1 language: live translate / restore on the landing page ----
  // Mirrors the planner's translator. Arabic strings are matched against the
  // inlined dictionary (src/i18n-ar.js); misses stay English. Layout stays LTR.
  let homeI18nRecords = [];
  function homeTranslate(dict) {
    const skip = /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|CODE|PRE)$/;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) {
      const parent = n.parentNode;
      if (parent && !skip.test(parent.nodeName)) nodes.push(n);
    }
    nodes.forEach(node => {
      const raw = node.nodeValue || '';
      // Collapse the core's internal whitespace so multi-line, indented
      // paragraphs match single-spaced dictionary keys; keep outer whitespace.
      const m = raw.match(/^(\s*)([\s\S]*?)(\s*)$/);
      const key = m[2].replace(/\s+/g, ' ');
      if (key && dict[key]) { homeI18nRecords.push({ node, en: raw }); node.nodeValue = m[1] + dict[key] + m[3]; }
    });
    document.querySelectorAll('[title]').forEach(el => {
      const k = (el.getAttribute('title') || '').trim();
      if (k && dict[k]) { if (!el.dataset.i18nTitle) el.dataset.i18nTitle = el.getAttribute('title'); el.setAttribute('title', dict[k]); }
    });
  }
  function homeRestoreEnglish() {
    homeI18nRecords.forEach(r => { try { r.node.nodeValue = r.en; } catch (e) { /* detached */ } });
    homeI18nRecords = [];
    document.querySelectorAll('[data-i18n-title]').forEach(el => el.setAttribute('title', el.dataset.i18nTitle));
  }
  function applyHomeLanguage(lang) {
    lang = (lang === 'ar') ? 'ar' : 'en';
    if (lang === 'ar' && window.DFR_I18N_AR && window.DFR_I18N_AR.text) homeTranslate(window.DFR_I18N_AR.text);
    else homeRestoreEnglish();
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', 'ltr');
  }

  // ---- Settings panel (gear) ----
  function wireHomeSettings() {
    const toggle = document.getElementById('settingsToggle');
    const panel = document.getElementById('settingsPanel');
    if (toggle && panel) {
      toggle.addEventListener('click', e => {
        e.stopPropagation();
        const open = panel.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      document.addEventListener('click', e => {
        if (!panel.classList.contains('open')) return;
        if (panel.contains(e.target) || toggle.contains(e.target)) return;
        panel.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && panel.classList.contains('open')) {
          panel.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    }
    const s = readHomeSettings();
    const u = document.getElementById('unitSystem');
    const d = document.getElementById('dateFormatSelect');
    const c = document.getElementById('coordFormat');
    const l = document.getElementById('langSelect');
    if (u && (s.unitSystem === 'metric' || s.unitSystem === 'imperial')) u.value = s.unitSystem;
    if (d && s.dateFormat) d.value = s.dateFormat;
    if (c && s.coordFormat) c.value = s.coordFormat;
    if (l) l.value = (s.lang === 'ar') ? 'ar' : 'en';
    // Units / date / coords have no visual effect on the landing page; persist so
    // the planner honours them. Language applies live here.
    if (u) u.onchange = function () { writeHomeSettings({ unitSystem: this.value }); };
    if (d) d.onchange = function () { writeHomeSettings({ dateFormat: this.value }); };
    if (c) c.onchange = function () { writeHomeSettings({ coordFormat: this.value }); };
    if (l) l.onchange = function () { writeHomeSettings({ lang: this.value }); applyHomeLanguage(this.value); };
  }

  updateUtcClock();
  setInterval(updateUtcClock, 1000);
  document.querySelectorAll('.drop-slot').forEach(wireDropSlot);
  wireAboutModal();
  wireSavedPlanLoader();
  wireTermsModal();
  wireHomeSettings();
  applyHomeLanguage(readHomeSettings().lang || 'en');
})();
