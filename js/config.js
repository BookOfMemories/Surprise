'use strict';
/* =============================================================
   OUR LITTLE BOOK OF MEMORIES — Configuration
   All tunable values live here. The rest of the app reads from
   this object so nothing else needs to change for customisation.
   ============================================================= */

const CONFIG = {

  /* ── Identity ── */
  bookTitle  : "Our Little Book of Memories",
  volume     : "Volume I",
  dateRange  : "July 2025 – July 2026",

  /* ── Audio paths ── */
  music      : "audio/until-i-found-you.mp3",
  pageSound  : "sounds/page-flip.mp3",
  paperSound : "sounds/paper.mp3",
  musicVolume: 0.65,

  /* ── Auto-close after Ending page ── */
  autoBookClose      : true,
  autoBookCloseDelay : 5000,   // ms to wait before starting close
  musicFadeDuration  : 3200,   // ms for music fade-out

  /* ── Feature flags ── */
  showDust          : true,
  showBookmark      : true,
  dustParticleCount : 20,

  /* ── Secret letter easter egg ── */
  letterPath    : "letter/letter.html",
  secretTaps    : 5,
  secretTapWindow: 5000,        // ms window for the 5 taps

  /* ── Page display ── */
  totalChapters    : 16,        // shown in counter "Chapter X of 16"
  pageTransitionMs : 480,       // page-turn animation duration

};
