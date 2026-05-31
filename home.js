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

  // Apply the language chosen in the planner's Settings (persisted in localStorage)
  // so the landing page reflects it too. Level 1: LTR layout, Arabic text RTL
  // within elements. English source strings are matched against the inlined
  // Arabic dictionary (src/i18n-ar.js); misses stay English.
  function applyStoredLanguage() {
    try {
      const raw = localStorage.getItem('uascDfrSettings');
      const lang = raw ? JSON.parse(raw).lang : 'en';
      if (lang !== 'ar' || !window.DFR_I18N_AR || !window.DFR_I18N_AR.text) return;
      const dict = window.DFR_I18N_AR.text;
      const skip = /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|CODE|PRE)$/;
      document.querySelectorAll('*').forEach(node => {
        if (skip.test(node.tagName) || node.children.length !== 0) return;
        const key = (node.textContent || '').trim();
        if (key && dict[key]) node.textContent = dict[key];
      });
      document.documentElement.setAttribute('lang', 'ar');
      document.documentElement.setAttribute('dir', 'ltr');
    } catch (e) { /* storage unavailable — stay English */ }
  }

  updateUtcClock();
  setInterval(updateUtcClock, 1000);
  document.querySelectorAll('.drop-slot').forEach(wireDropSlot);
  wireAboutModal();
  wireSavedPlanLoader();
  wireTermsModal();
  applyStoredLanguage();
})();
