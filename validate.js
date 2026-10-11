/* Dropzone rules, kept free of the DOM so they can be tested without a browser.
   Written as a plain script on purpose: a module would be CORS-blocked when the
   page is opened straight off disk with file://. */
(function (global) {
  'use strict';

  const MAX_BYTES = 10 * 1024 * 1024;
  const ACCEPTED = ['glb', 'fbx'];

  /* round the file UP so a 10485761-byte file never reads as "10.0MB over the 10MB limit" */
  const MB = (n) => (Math.ceil((n / 1024 / 1024) * 10) / 10).toFixed(1);
  const LIMIT = `${MAX_BYTES / 1024 / 1024}MB`;

  /* Every message names what happened -> why -> what to do next.
     An error that can't name the next action isn't finished. */
  const COPY = {
    en: {
      empty:  () => "That file is empty. A GLB or FBX needs geometry in it — re-export from your DCC tool and try again.",
      type:   (ext) => `.${ext} isn't supported here. This viewer reads GLB and FBX only — export as GLB, or drop the FBX and we'll convert it.`,
      size:   (mb) => `That file is ${mb}MB, over the ${LIMIT} demo limit. The demo renders in your browser, so large scenes stall it — decimate the mesh, or sign up to upload the full asset.`,
      ok:     (name) => `${name} loaded — rendered in your browser, nothing was uploaded.`,
      reading:(name) => `Reading ${name}…`,
    },
    id: {
      empty:  () => "File itu kosong. GLB atau FBX harus berisi geometri — ekspor ulang dari tool Anda lalu coba lagi.",
      type:   (ext) => `.${ext} belum didukung di sini. Viewer ini hanya membaca GLB dan FBX — ekspor ke GLB, atau jatuhkan FBX dan kami konversikan.`,
      size:   (mb) => `File itu ${mb}MB, melebihi batas demo ${LIMIT}. Demo dirender di browser Anda, jadi scene besar membuatnya macet — kurangi mesh, atau daftar untuk mengunggah aset penuh.`,
      ok:     (name) => `${name} dimuat — dirender di browser Anda, tidak ada yang diunggah.`,
      reading:(name) => `Membaca ${name}…`,
    },
  };

  const t = (lang, key, ...args) => (COPY[lang] || COPY.en)[key](...args);

  function extensionOf(name) {
    const i = String(name || '').lastIndexOf('.');
    return i > -1 ? String(name).slice(i + 1).toLowerCase() : '';
  }

  /** @returns {{ok:true}|{ok:false, code:'empty'|'type'|'size', message:string}} */
  function validateFile(file, lang) {
    lang = lang || 'en';
    const ext = extensionOf(file && file.name);

    if (!ACCEPTED.includes(ext)) return { ok: false, code: 'type', message: t(lang, 'type', ext || '—') };
    if (!file.size)              return { ok: false, code: 'empty', message: t(lang, 'empty') };
    if (file.size > MAX_BYTES)   return { ok: false, code: 'size', message: t(lang, 'size', MB(file.size)) };
    return { ok: true };
  }

  const api = { MAX_BYTES, ACCEPTED, extensionOf, validateFile, t };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.LeafTrackRules = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
