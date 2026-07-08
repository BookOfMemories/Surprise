'use strict';
/* =============================================================
   Book animation controller
   Handles the physical book open / close sequences.
   Page-turn transitions within the open book are in app.js.
   ============================================================= */

const Book = (() => {

  let busy       = false;
  let flipAudio  = null;
  let paperAudio = null;

  /* ── Init ── */
  function init() {
    flipAudio  = _makeAudio(CONFIG.pageSound,  0.45);
    paperAudio = _makeAudio(CONFIG.paperSound, 0.35);
  }

  function _makeAudio(src, vol) {
    try {
      const a   = new Audio(src);
      a.preload = 'auto';
      a.volume  = vol;
      return a;
    } catch (_) { return null; }
  }

  function _play(a) {
    if (!a) return;
    try { a.pause(); a.currentTime = 0; a.play().catch(() => {}); } catch (_) {}
  }

  /* ── Public sound helpers (called by app.js for page turns) ── */
  function playFlip()  { _play(flipAudio);  }
  function playPaper() { _play(paperAudio); }

  /* ── Open: cover screen → book scene ── */
  function openBook(cb) {
    if (busy) return;
    busy = true;

    const cover = document.getElementById('cover-screen');
    const scene = document.getElementById('book-scene');

    playFlip();

    // 1. Fade cover out
    cover.classList.add('anim-fade-out');
    setTimeout(() => {
      cover.style.display = 'none';
      cover.classList.remove('anim-fade-out');

      // 2. Reveal book with an "open" entrance
      scene.style.display = 'flex';
      scene.classList.add('anim-book-open');

      setTimeout(() => {
        scene.classList.remove('anim-book-open');
        busy = false;
        cb && cb();
      }, 700);
    }, 380);
  }

  /* ── Close: book scene → cover screen ── */
  function closeBook(cb) {
    if (busy) return;
    busy = true;

    const cover = document.getElementById('cover-screen');
    const scene = document.getElementById('book-scene');

    playPaper();

    // 1. Book closes / fades
    scene.classList.add('anim-book-close');
    setTimeout(() => {
      scene.classList.remove('anim-book-close');
      scene.style.display = 'none';

      // 2. Cover fades back in gently
      cover.style.display = 'flex';
      cover.classList.add('anim-fade-in-slow');
      setTimeout(() => {
        cover.classList.remove('anim-fade-in-slow');
        busy = false;
        cb && cb();
      }, 900);
    }, 950);
  }

  function isBusy() { return busy; }

  return { init, openBook, closeBook, playFlip, playPaper, isBusy };

})();
