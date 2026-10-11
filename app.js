/* ══════════════════════════════════════════════════════════
   Leaf Track — microinteractions
   Each block is one contained moment: trigger · rules · feedback · loop
   ══════════════════════════════════════════════════════════ */

/* ── M1 · Nav scroll state ─────────────────────────────────
   Trigger  system, scrollY past 16px
   Rules    hysteresis so a 1px jitter can't flicker the bar
   Feedback the pill tightens, opaques, gains a shadow
   Loop     open, follows the page for its lifetime            */
(() => {
  const nav = document.getElementById('nav');
  if (!nav) return;
  let stuck = false;
  const sync = () => {
    const y = scrollY;
    if (!stuck && y > 16) { stuck = true; nav.classList.add('is-stuck'); }
    else if (stuck && y < 8) { stuck = false; nav.classList.remove('is-stuck'); }
  };
  addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
  sync();
})();

/* ── M3 · Language MODE ────────────────────────────────────
   Trigger  manual, the EN / ID buttons
   Rules    one mode at a time; persisted; <html lang> follows
   Feedback aria-pressed + a tinted pill — never colour alone
   Loop     long, the choice survives reloads                  */
const lang = (() => {
  const KEY = 'leaftrack:lang';
  const buttons = [...document.querySelectorAll('[data-set-lang]')];
  let current = 'en';

  const apply = (next) => {
    current = next === 'id' ? 'id' : 'en';
    document.documentElement.lang = current;
    document.documentElement.dataset.lang = current;

    for (const el of document.querySelectorAll('[data-en]')) {
      const copy = el.dataset[current];
      if (copy != null) el.innerHTML = copy;
    }
    for (const b of buttons) b.setAttribute('aria-pressed', String(b.dataset.setLang === current));
    try { localStorage.setItem(KEY, current); } catch {}
    document.dispatchEvent(new CustomEvent('langchange', { detail: current }));
  };

  for (const b of buttons) b.addEventListener('click', () => apply(b.dataset.setLang));

  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch {}
  apply(saved || (navigator.language?.startsWith('id') ? 'id' : 'en'));

  return { get current() { return current; } };
})();

/* ── M5 · Hero mosaic, long loop ───────────────────────────
   Trigger  system on a 4s timer; manual on hover / focus
   Rules    exactly one tile is active
   Feedback gradient edge, lift, assignee + status read-out
   Loop     the auto-advance stops for good the first time the
            visitor points at a tile — they have taken over,
            and a carousel that keeps moving under the cursor
            is the thing everybody hates about carousels       */
(() => {
  const mosaic = document.getElementById('mosaic');
  if (!mosaic) return;
  const tiles = [...mosaic.querySelectorAll('.tile')];
  if (!tiles.length) return;

  /* The names, avatars and statuses are in the markup, and CSS shows them on
     hover — this block only advances the highlight and then gets out of the
     way. Nothing here is load-bearing for reading the page. */
  let i = Math.max(0, tiles.findIndex((t) => t.classList.contains('is-active')));
  const show = (n) => {
    tiles[i].classList.remove('is-active');
    i = (n + tiles.length) % tiles.length;
    tiles[i].classList.add('is-active');
  };
  show(i);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let timer = reduced ? 0 : setInterval(() => show(i + 1), 4000);

  for (const tile of tiles) {
    tile.addEventListener('pointerenter', () => {
      if (timer) { clearInterval(timer); timer = 0; }
      show(tiles.indexOf(tile));
    });
  }
})();

/* ── M7 · Live demo dropzone ───────────────────────────────
   Trigger  manual — drag-and-drop (invisible) AND a visible
            "Choose a file" button, because a gesture with no
            visible twin is a feature nobody finds
   Rules    validate.js — GLB/FBX, ≤10MB, boundary inclusive
   Feedback one live region; honest progress driven by bytes
            actually read, never a decorative timer
   Modes    idle · over · reading · ready · error, each one
            visually distinct and announced in text            */
(() => {
  const drop = document.getElementById('drop');
  if (!drop) return;

  const { validateFile, t } = window.LeafTrackRules;

  const input  = document.getElementById('dropInput');
  const status = document.getElementById('dropStatus');
  const bar    = document.getElementById('dropBar');

  const setState = (state, message = '') => {
    drop.dataset.state = state;
    status.textContent = message;
  };

  let depth = 0; // dragenter/dragleave fire per child; count them
  const stop = (e) => { e.preventDefault(); e.stopPropagation(); };

  drop.addEventListener('dragenter', (e) => { stop(e); if (++depth === 1) setState('over'); });
  drop.addEventListener('dragover', stop);
  drop.addEventListener('dragleave', (e) => { stop(e); if (--depth <= 0) { depth = 0; setState('idle'); } });
  drop.addEventListener('drop', (e) => {
    stop(e); depth = 0;
    accept(e.dataTransfer?.files?.[0]);
  });

  /* the visible affordance is a <label for>, not a button — one control,
     one tab stop, and it still works with JS off */
  input.addEventListener('change', () => accept(input.files?.[0]));

  function accept(file) {
    if (!file) return setState('idle');

    const verdict = validateFile(file, lang.current);
    if (!verdict.ok) {
      bar.style.width = '0%';
      return setState('error', verdict.message);
    }

    setState('reading', t(lang.current, 'reading', file.name));
    bar.style.width = '0%';

    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable) bar.style.width = `${(e.loaded / e.total) * 100}%`;
    };
    reader.onerror = () => setState('error', `Couldn't read ${file.name} — the browser blocked it. Try dropping it again, or pick it with the button.`);
    reader.onload = () => {
      bar.style.width = '100%';
      setState('ready', t(lang.current, 'ok', file.name));
    };
    reader.readAsArrayBuffer(file);
  }
})();

/* ── M8 · Scroll reveal ────────────────────────────────────
   Trigger  system, element crosses 12% into view
   Rules    fires once per element, then unobserves
   Feedback 18px rise + fade, staggered by position in group
   Loop     closed — a reveal that replays on every scroll-by
            is an animation, not a signal

   Nothing is hidden by CSS. This script hides the elements that are
   below the fold, one frame before it starts watching them. If the
   script never runs — blocked, errored, an old browser — the page is
   simply plain and completely readable, which is the only acceptable
   failure mode for content. An earlier version gated the hiding on a
   `.js` class set inline in <head>; that lied, because inline script
   runs in situations where the deferred script does not. */
(() => {
  const items = [...document.querySelectorAll('.reveal')];
  if (!items.length || !('IntersectionObserver' in window)) return;

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    }
  }, { threshold: 0.12, rootMargin: '0px 0px -40px' });

  for (const el of items) {
    // already on screen: leave it alone, there is nothing to reveal
    if (el.getBoundingClientRect().top < innerHeight) continue;

    // stagger index within the nearest group, so cards ripple in order
    if (!el.style.getPropertyValue('--i')) {
      const siblings = [...(el.parentElement?.children || [])].filter((n) => n.classList.contains('reveal'));
      el.style.setProperty('--i', String(Math.min(siblings.indexOf(el), 5)));
    }
    el.classList.add('reveal--pending');
    io.observe(el);
  }
})();
