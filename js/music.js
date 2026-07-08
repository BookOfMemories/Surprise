'use strict';
/* =============================================================
   Music controller — single soundtrack, never restarts between
   chapters. Persists mute/volume to LocalStorage.
   ============================================================= */

const Music = (() => {

  let audio    = null;
  let fadeTick = null;
  let muted    = false;
  let vol      = CONFIG.musicVolume;

  /* ── Initialise (call once, before first play) ── */
  function init() {
    audio        = new Audio(CONFIG.music);
    audio.loop   = true;
    audio.preload = 'none';   // load on first play, not at startup

    muted = Storage.loadMuted();
    vol   = Storage.loadVolume();

    _apply();
    _refreshUI();
  }

  /* ── Playback ── */
  function play() {
    if (!audio) return;
    audio.play().catch(() => {});   // browser may block; swallow the error
  }

  function pause() {
    if (!audio) return;
    audio.pause();
  }

  function toggleMute() {
    muted = !muted;
    Storage.saveMuted(muted);
    _apply();
    _refreshUI();
  }

  function setVolume(v) {
    vol   = Math.max(0, Math.min(1, v));
    muted = vol === 0;
    Storage.saveVolume(vol);
    Storage.saveMuted(muted);
    _apply();
    _refreshUI();
  }

  /* ── Gradual fade-out (used during auto-close) ── */
  function fadeOut(durationMs, onDone) {
    if (!audio) { onDone && onDone(); return; }
    clearInterval(fadeTick);

    const start = audio.volume;
    const steps = 40;
    const ms    = durationMs / steps;
    const dec   = start / steps;
    let   i     = 0;

    fadeTick = setInterval(() => {
      i++;
      audio.volume = Math.max(0, start - dec * i);
      if (i >= steps) {
        clearInterval(fadeTick);
        audio.pause();
        onDone && onDone();
      }
    }, ms);
  }

  /* ── Private ── */
  function _apply() {
    if (!audio) return;
    audio.muted  = muted;
    audio.volume = muted ? 0 : vol;
  }

  function _refreshUI() {
    const btn    = document.getElementById('music-toggle');
    const slider = document.getElementById('volume-slider');
    if (btn)    btn.innerHTML   = muted ? '🔇' : '🎵';
    if (slider) slider.value    = muted ? 0 : Math.round(vol * 100);
  }

  return { init, play, pause, toggleMute, setVolume, fadeOut };

})();
