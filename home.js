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
    const media = document.createElement(payload.type.startsWith('video/') ? 'video' : 'img');
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
      if (!saved) return;
      renderMedia(slot, JSON.parse(saved));
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
    const modal = document.getElementById('homeAboutModal');
    const openBtn = document.getElementById('whyToolBtn');
    if (!modal || !openBtn) return;
    const close = () => { modal.hidden = true; };
    openBtn.addEventListener('click', () => { modal.hidden = false; });
    modal.querySelectorAll('[data-about-close]').forEach(el => {
      el.addEventListener('click', close);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !modal.hidden) close();
    });
  }

  updateUtcClock();
  setInterval(updateUtcClock, 1000);
  document.querySelectorAll('.drop-slot').forEach(wireDropSlot);
  wireAboutModal();
})();
