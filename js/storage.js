'use strict';
/* =============================================================
   LocalStorage manager — bookmarks & audio preferences
   All reads/writes go through here; nothing else touches
   localStorage directly.
   ============================================================= */

const Storage = (() => {

  const K = {
    PAGE   : 'memories_book_page',
    MUTED  : 'memories_music_muted',
    VOLUME : 'memories_music_volume',
  };

  function _set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  }

  function _get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch (_) { return fallback; }
  }

  function _del(key) {
    try { localStorage.removeItem(key); } catch (_) {}
  }

  return {
    /* Bookmark */
    saveProgress  : (v) => _set(K.PAGE, v),
    loadProgress  : ()  => _get(K.PAGE, null),
    clearProgress : ()  => _del(K.PAGE),

    /* Music prefs */
    saveMuted  : (v) => _set(K.MUTED,  v),
    loadMuted  : ()  => _get(K.MUTED,  false),
    saveVolume : (v) => _set(K.VOLUME, v),
    loadVolume : ()  => _get(K.VOLUME, CONFIG.musicVolume),
  };

})();
