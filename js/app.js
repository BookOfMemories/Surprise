'use strict';
/* =============================================================
   Main application controller
   
   Page index system:
     INTRO  = -1          (intro page)
     0..N-1 = chapters    (N = chapters.length = 19)
     BEYOND = N     = 19  (beyond these pages)
     ENDING = N + 1 = 20  (ending / anniversary)
   ============================================================= */

const App = (() => {

  /* ── Page index sentinels ── */
  const INTRO  = -1;
  let   BEYOND = 0;   // set in init after chapters loads
  let   ENDING = 0;

  /* ── State ── */
  let pageIdx      = INTRO;   // current logical page
  let activeSlot   = null;    // ID of currently visible .page-slot
  let animating    = false;

  /* ── Secret letter tap counter ── */
  let tapCount    = 0;
  let tapResetTmr = null;

  /* ── Zoom / pan state (chapter images) ── */
  let zoom          = 1;
  let panX          = 0;
  let panY          = 0;
  let dragging      = false;
  let dragOX        = 0;
  let dragOY        = 0;
  let lastTapMs     = 0;
  let lastPinchDist = 0;

  /* ── Auto-close timer ── */
  let autoCloseTmr = null;

  /* ================================================================
     INIT
  ================================================================ */
  function init() {
    BEYOND = chapters.length;      // 19
    ENDING = chapters.length + 1;  // 20

    Music.init();
    Book.init();
    _bindEvents();
    _checkOrientation();
    if (CONFIG.showDust) _spawnDust();
    _startPreloading();
  }

  /* ================================================================
     PRELOADING
  ================================================================ */
  function _startPreloading() {
    const bar   = document.getElementById('loading-bar-fill');
    const pctEl = document.getElementById('loading-percent');
    const total = chapters.length;
    let   done  = 0;

    function step(i) {
      if (i >= total) {
        _setProgress(bar, pctEl, total, total);
        setTimeout(_onLoadingDone, 350);
        return;
      }
      const img    = new Image();
      img.onload   =
      img.onerror  = () => { done++; _setProgress(bar, pctEl, done, total); step(i + 1); };
      img.src      = chapters[i].image;
    }

    _setProgress(bar, pctEl, 0, total);
    step(0);
  }

  function _setProgress(bar, pctEl, done, total) {
    const p = Math.round((done / total) * 100);
    if (bar)   bar.style.width  = p + '%';
    if (pctEl) pctEl.textContent = p + '%';
  }

  function _onLoadingDone() {
    const screen = document.getElementById('loading-screen');
    screen.classList.add('anim-fade-out');
    setTimeout(() => {
      screen.style.display = 'none';
      screen.classList.remove('anim-fade-out');
      _showCover();
    }, 520);
  }

  /* ================================================================
     COVER
  ================================================================ */
  function _showCover() {
    const cover = document.getElementById('cover-screen');
    cover.style.display = 'flex';
    cover.classList.add('anim-fade-in');
    setTimeout(() => cover.classList.remove('anim-fade-in'), 700);
  }

  /* ================================================================
     OPEN STORY
  ================================================================ */
  function _onOpenStory() {
    if (Book.isBusy() || animating) return;
    const saved = CONFIG.showBookmark ? Storage.loadProgress() : null;
    if (saved !== null && saved >= INTRO) {
      _showWelcomeBack(saved);
    } else {
      _beginStory(INTRO);
    }
  }

  function _showWelcomeBack(savedPage) {
    const overlay = document.getElementById('wb-overlay');
    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('overlay-visible'));

    function dismiss(startPage) {
      overlay.classList.remove('overlay-visible');
      setTimeout(() => { overlay.style.display = 'none'; }, 350);
      _beginStory(startPage);
    }

    document.getElementById('wb-continue').onclick = () => dismiss(savedPage);
    document.getElementById('wb-restart').onclick  = () => {
      Storage.clearProgress();
      dismiss(INTRO);
    };
  }

  function _beginStory(startPage) {
    Music.play();
    pageIdx = startPage;
    Book.openBook(() => {
      _renderDirect(pageIdx);
      _updateUI();
    });
  }

  /* ================================================================
     NAVIGATION
  ================================================================ */
  function goForward() {
    if (animating || Book.isBusy()) return;
    if (pageIdx >= ENDING) return;
    _cancelAutoClose();
    _changePage(pageIdx + 1, 'forward');
  }

  function goBackward() {
    if (animating || Book.isBusy()) return;
    if (pageIdx <= INTRO) return;
    _cancelAutoClose();
    _changePage(pageIdx - 1, 'backward');
  }

  /* ================================================================
     PAGE RENDERING
  ================================================================ */

  /* Transition to a new page with animation */
  function _changePage(newIdx, direction) {
    animating = true;
    Book.playFlip();

    const incomingId = _resolveSlot(newIdx);
    const outgoingId = activeSlot;

    // Prepare content before transition begins (image is cached so no flicker)
    _prepareSlot(incomingId, newIdx);

    const out = document.getElementById(outgoingId);
    const inn = document.getElementById(incomingId);

    _runTransition(out, inn, direction, () => {
      pageIdx    = newIdx;
      activeSlot = incomingId;
      _postRender(newIdx);
      animating  = false;
    });
  }

  /* Show a page immediately (no animation — used after book opens) */
  function _renderDirect(idx) {
    document.querySelectorAll('.page-slot').forEach(s => {
      s.classList.remove('slot-active');
      s.style.zIndex = '';
    });
    const slotId = _resolveSlot(idx);
    _prepareSlot(slotId, idx);
    document.getElementById(slotId).classList.add('slot-active');
    activeSlot = slotId;
    _postRender(idx);
  }

  /* ── Slot resolution (which HTML element to use) ── */
  function _resolveSlot(idx) {
    if (idx === INTRO)  return 'slot-intro';
    if (idx === BEYOND) return 'slot-beyond';
    if (idx === ENDING) return 'slot-ending';
    // For chapters, alternate between two slots so the outgoing image
    // stays visible during the transition while the incoming loads.
    return (activeSlot === 'slot-ch-a') ? 'slot-ch-b' : 'slot-ch-a';
  }

  /* ── Load content into a slot ── */
  function _prepareSlot(slotId, idx) {
    if (idx < 0 || idx >= BEYOND) return; // text pages are static
    const ch  = chapters[idx];
    if (!ch) return;
    const img = document.querySelector(`#${slotId} .chapter-img`);
    if (img) img.src = ch.image;
  }

  /* ── Post-render housekeeping ── */
  function _postRender(idx) {
    const isText = (idx === INTRO || idx === BEYOND || idx === ENDING);
    _setBookMode(isText ? 'text' : 'chapter');
    _updateCounter(idx);
    _updateNavBtns(idx);
    _resetZoom();
    if (CONFIG.showBookmark) Storage.saveProgress(idx);
    if (idx === ENDING) _scheduleAutoClose();
  }

  /* Switches between text-page layout and full-spread chapter layout */
  function _setBookMode(mode) {
    const bo = document.getElementById('book-open');
    if (bo) bo.setAttribute('data-mode', mode);
  }

  /* ================================================================
     PAGE TRANSITION ANIMATION
  ================================================================ */
  const T = () => CONFIG.pageTransitionMs;

  function _runTransition(outEl, inEl, direction, cb) {
    if (!outEl || outEl === inEl) {
      if (inEl) inEl.classList.add('slot-active');
      cb && cb();
      return;
    }

    const exitCls  = direction === 'forward' ? 'anim-exit-fwd'  : 'anim-exit-bwd';
    const enterCls = direction === 'forward' ? 'anim-enter-fwd' : 'anim-enter-bwd';

    outEl.style.zIndex = '2';
    inEl.style.zIndex  = '1';
    inEl.classList.add('slot-active', enterCls);
    outEl.classList.add(exitCls);

    setTimeout(() => {
      outEl.classList.remove('slot-active', exitCls);
      outEl.style.zIndex = '';
      inEl.classList.remove(enterCls);
      inEl.style.zIndex  = '';
      cb && cb();
    }, T());
  }

  /* ================================================================
     UI UPDATES
  ================================================================ */
  function _updateUI() {
    _updateCounter(pageIdx);
    _updateNavBtns(pageIdx);
  }

  function _updateCounter(idx) {
    const el = document.getElementById('page-counter');
    if (!el) return;
    if (idx < 0 || idx >= BEYOND) {
      el.textContent  = '';
      el.style.opacity = '0';
      return;
    }
    const ch  = chapters[idx];
    let   lbl = `Chapter ${ch.chapterNum} of ${CONFIG.totalChapters}`;
    if (ch.subPage) lbl += `  (${ch.subPage}/${ch.totalSubPages})`;
    el.textContent  = lbl;
    el.style.opacity = '1';
  }

  function _updateNavBtns(idx) {
    const prev = document.getElementById('nav-prev');
    const next = document.getElementById('nav-next');
    if (prev) prev.style.opacity = idx <= INTRO  ? '0' : '1';
    if (next) next.style.opacity = idx >= ENDING ? '0' : '1';
  }

  /* ================================================================
     AUTO-CLOSE SEQUENCE
  ================================================================ */
  function _scheduleAutoClose() {
    if (!CONFIG.autoBookClose) return;
    _cancelAutoClose();
    autoCloseTmr = setTimeout(_executeAutoClose, CONFIG.autoBookCloseDelay);
  }

  function _cancelAutoClose() {
    if (autoCloseTmr) { clearTimeout(autoCloseTmr); autoCloseTmr = null; }
  }

  function _executeAutoClose() {
    // Start fading music (runs independently)
    Music.fadeOut(CONFIG.musicFadeDuration, null);
    // Play paper rustle
    Book.playPaper();

    setTimeout(() => {
      Storage.clearProgress();
      Book.closeBook(() => _showGlowingHeart());
    }, 650);
  }

  function _showGlowingHeart() {
    const h = document.getElementById('glow-heart');
    if (!h) return;
    h.style.display = 'block';
    h.classList.add('heart-glow-anim');
    setTimeout(() => {
      h.classList.add('heart-fade-out');
      setTimeout(() => {
        h.classList.remove('heart-glow-anim', 'heart-fade-out');
        h.style.display = 'none';
      }, 600);
    }, 2200);
  }

  /* ================================================================
     SECRET LETTER EASTER EGG
  ================================================================ */
  function _initSecretHeart() {
    const sh = document.getElementById('secret-heart');
    if (!sh) return;
    ['click', 'touchend'].forEach(ev =>
      sh.addEventListener(ev, _onSecretTap, { passive: true })
    );
  }

  function _onSecretTap(e) {
    e.stopPropagation && e.stopPropagation();
    
    // Once they start tapping the secret heart, don't auto-close the book!
    _cancelAutoClose();

    tapCount++;
    clearTimeout(tapResetTmr);
    tapResetTmr = setTimeout(() => { 
      tapCount = 0; 
      // If they stop tapping before 5, resume the auto-close timer
      _scheduleAutoClose(); 
    }, CONFIG.secretTapWindow);
    if (tapCount >= CONFIG.secretTaps) {
      tapCount = 0;
      clearTimeout(tapResetTmr);
      _openLetter();
    }
  }

  function _openLetter() {
    const modal  = document.getElementById('letter-modal');
    const iframe = document.getElementById('letter-iframe');
    
    // Add cache-bust to ensure it loads fresh if edited
    iframe.src = CONFIG.letterPath + '?t=' + Date.now();
    modal.classList.add('modal-active');
  }

  function _closeLetter() {
    const modal = document.getElementById('letter-modal');
    modal.classList.remove('modal-active');
    setTimeout(() => {
      document.getElementById('letter-iframe').src = '';
    }, 450);
  }

  /* ================================================================
     ZOOM & PAN (chapter images)
  ================================================================ */
  function _resetZoom() {
    zoom = 1; panX = 0; panY = 0;
    _applyZoom();
  }

  function _applyZoom() {
    document.querySelectorAll('.chapter-img').forEach(img => {
      img.style.transform = zoom === 1
        ? 'none'
        : `scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px)`;
    });
  }

  function _doZoom(delta) {
    zoom = Math.max(1, Math.min(4, zoom + delta));
    if (zoom === 1) { panX = 0; panY = 0; }
    _applyZoom();
  }

  /* ================================================================
     DUST PARTICLES (cover screen)
  ================================================================ */
  function _spawnDust() {
    const container = document.getElementById('dust-container');
    if (!container) return;

    function make() {
      const p = document.createElement('div');
      p.className = 'dust-particle';
      const dur = 5 + Math.random() * 7;
      const del = Math.random() * 3;
      p.style.cssText = [
        `left:${Math.random() * 100}%`,
        `top:${Math.random() * 100}%`,
        `width:${1 + Math.random() * 2.5}px`,
        `height:${1 + Math.random() * 2.5}px`,
        `animation-duration:${dur}s`,
        `animation-delay:${del}s`,
        `opacity:${0.15 + Math.random() * 0.45}`,
      ].join(';');
      container.appendChild(p);
      setTimeout(() => { p.remove(); make(); }, (dur + del + 0.5) * 1000);
    }

    for (let i = 0; i < CONFIG.dustParticleCount; i++) {
      setTimeout(make, i * 160);
    }
  }

  /* ================================================================
     ORIENTATION CHECK
  ================================================================ */
  function _checkOrientation() {
    const ov = document.getElementById('rotation-overlay');
    if (!ov) return;
    const isPortrait = () => window.innerHeight > window.innerWidth && window.innerWidth < 900;
    const update     = () => { ov.style.display = isPortrait() ? 'flex' : 'none'; };
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', () => setTimeout(update, 180));
    update();
  }

  /* ================================================================
     EVENT BINDINGS
  ================================================================ */
  function _bindEvents() {

    /* Cover: open story */
    _on('open-story-btn', 'click', _onOpenStory);

    /* Intro: begin reading */
    _on('begin-reading-btn', 'click', goForward);

    /* Nav arrows */
    _on('nav-prev', 'click', goBackward);
    _on('nav-next', 'click', goForward);

    /* Keyboard */
    document.addEventListener('keydown', e => {
      if (['ArrowRight','ArrowDown'].includes(e.key)) goForward();
      if (['ArrowLeft', 'ArrowUp'  ].includes(e.key)) goBackward();
    });

    /* Edge tap zones */
    _on('tap-zone-left',  'click', goBackward);
    _on('tap-zone-right', 'click', goForward);

    /* Music & Fullscreen */
    _on('music-toggle',  'click', () => Music.toggleMute());
    _on('volume-slider', 'input', e  => Music.setVolume(e.target.value / 100));
    _on('fullscreen-toggle', 'click', _toggleFullscreen);

    /* Rotation overlay */
    _on('rot-continue', 'click', () => {
      document.getElementById('rotation-overlay').style.display = 'none';
    });

    /* Letter */
    _on('close-letter-btn', 'click', _closeLetter);
    const bd = document.querySelector('.letter-backdrop');
    if (bd) bd.addEventListener('click', _closeLetter);

    /* Secret heart */
    _initSecretHeart();

    /* Swipe / pinch */
    _initTouch();

    /* Mouse wheel zoom + drag */
    _initMouseInteractions();
  }

  function _on(id, ev, fn) {
    const el = document.getElementById(id);
    if (el) el.addEventListener(ev, fn);
  }

  /* ── Fullscreen ── */
  function _toggleFullscreen() {
    const doc = document.documentElement;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      if (doc.requestFullscreen) doc.requestFullscreen();
      else if (doc.webkitRequestFullscreen) doc.webkitRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
  }

  /* ── Touch: swipe + pinch + double-tap ── */
  function _initTouch() {
    const scene = document.getElementById('book-scene');
    if (!scene) return;

    let sx = 0, sy = 0, st = 0;

    scene.addEventListener('touchstart', e => {
      if (e.touches.length === 1) {
        sx = e.touches[0].clientX;
        sy = e.touches[0].clientY;
        st = Date.now();
        // double-tap
        const now = Date.now();
        if (now - lastTapMs < 290) {
          e.preventDefault();
          zoom > 1 ? _resetZoom() : _doZoom(1.5);
        }
        lastTapMs = now;
      }
      if (e.touches.length === 2) lastPinchDist = _pinchDist(e);
    }, { passive: false });

    scene.addEventListener('touchmove', e => {
      if (e.touches.length === 1 && zoom > 1) {
        // Panning while zoomed
        const cx = e.touches[0].clientX;
        const cy = e.touches[0].clientY;
        panX += (cx - sx);
        panY += (cy - sy);
        sx = cx;
        sy = cy;
        _applyZoom();
      } else if (e.touches.length === 2 && lastPinchDist > 0) {
        // Pinch zoom
        const d   = _pinchDist(e);
        const rat = d / lastPinchDist;
        zoom      = Math.max(1, Math.min(4, zoom * rat));
        lastPinchDist = d;
        if (zoom === 1) { panX = 0; panY = 0; }
        _applyZoom();
      }
    }, { passive: true });

    scene.addEventListener('touchend', e => {
      lastPinchDist = 0;
      if (e.changedTouches.length !== 1 || e.touches.length > 0) return;
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      const dt = Date.now() - st;
      if (Math.abs(dx) > 55 && Math.abs(dy) < 80 && dt < 600 && zoom <= 1) {
        dx < 0 ? goForward() : goBackward();
      }
    }, { passive: true });
  }

  function _pinchDist(e) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /* ── Mouse: wheel zoom, drag, double-click ── */
  function _initMouseInteractions() {
    const scene = document.getElementById('book-scene');
    if (!scene) return;

    scene.addEventListener('wheel', e => {
      // Only zoom when on a chapter page
      if (!document.querySelector('#slot-ch-a.slot-active, #slot-ch-b.slot-active')) return;
      e.preventDefault();
      _doZoom(e.deltaY < 0 ? 0.25 : -0.25);
    }, { passive: false });

    scene.addEventListener('mousedown', e => {
      if (zoom <= 1) return;
      dragging = true;
      dragOX   = e.clientX - panX;
      dragOY   = e.clientY - panY;
      scene.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      panX = e.clientX - dragOX;
      panY = e.clientY - dragOY;
      _applyZoom();
    });

    document.addEventListener('mouseup', () => {
      if (dragging) {
        dragging = false;
        const sc = document.getElementById('book-scene');
        if (sc) sc.style.cursor = '';
      }
    });

    scene.addEventListener('dblclick', () => {
      zoom > 1 ? _resetZoom() : _doZoom(1.5);
    });
  }

  /* ================================================================
     PUBLIC API
  ================================================================ */
  return { init };

})();

/* ── Boot ── */
document.addEventListener('DOMContentLoaded', App.init);
