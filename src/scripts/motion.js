import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
gsap.registerPlugin(ScrollTrigger, SplitText);

const root = document.documentElement;
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
const MOBILE = matchMedia('(max-width: 899px)').matches;
const $ = (s, r = document) => [...r.querySelectorAll(s)];
let lenis = null;
// v3: content is visible by default; only this script hides it (html.anim), so a failed/slow bundle never blanks the page
if (!RM) root.classList.add('anim');
ScrollTrigger.config({ ignoreMobileResize: true });
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

/* mobile menu: focus in, Tab trap, Escape, inert page, scroll position kept */
(() => {
  const burger = document.querySelector('.hdr__burger');
  const menu = document.getElementById('menu');
  if (!burger || !menu) return;
  const label = burger.querySelector('.sr');
  const outside = [document.querySelector('main'), document.querySelector('footer'), document.querySelector('.hdr__nav'), document.querySelector('.hdr__logo')].filter(Boolean);
  let y = 0;
  const focusables = () => [burger, ...$('a, button', menu)];
  const set = (open, restore = true) => {
    burger.setAttribute('aria-expanded', String(open));
    if (label) label.textContent = open ? 'Close menu' : 'Open menu';
    menu.hidden = !open;
    outside.forEach((el) => (el.inert = open));
    if (open) {
      y = scrollY; lenis?.stop();
      root.classList.add('menu-open');
      menu.querySelector('a')?.focus();
    } else {
      root.classList.remove('menu-open');
      if (restore) { window.scrollTo(0, y); lenis?.scrollTo(y, { immediate: true, force: true }); }
      lenis?.start();
    }
  };
  burger.addEventListener('click', () => set(burger.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (e) => {
    if (menu.hidden) return;
    if (e.key === 'Escape') { set(false); burger.focus(); return; }
    if (e.key !== 'Tab') return;
    const f = focusables(); const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  $('a', menu).forEach((a) => a.addEventListener('click', () => set(false, false)));
  matchMedia('(min-width: 1024px)').addEventListener('change', (e) => { if (e.matches && !menu.hidden) set(false); });
})();

/* quote form: inline validation (works with or without motion) */
(() => {
  const form = document.getElementById('qf');
  if (!form) return;
  const sum = form.querySelector('.form__sum');
  const fields = $('[required]', form);
  let tried = false;
  const check = (el) => {
    const ok = el.checkValidity() && String(el.value).trim() !== '';
    el.setAttribute('aria-invalid', ok ? 'false' : 'true');
    const err = document.getElementById(el.id + '-err');
    if (err) err.textContent = ok ? '' : el.dataset.err || 'This field is required';
    return ok;
  };
  fields.forEach((el) => el.addEventListener('blur', () => tried && check(el)));
  form.addEventListener('submit', (e) => {
    tried = true;
    const bad = fields.filter((el) => !check(el));
    if (bad.length) {
      e.preventDefault();
      if (sum) sum.textContent = bad.length === 1 ? '1 field needs attention.' : `${bad.length} fields need attention.`;
      bad[0].focus();
    } else if (sum) sum.textContent = '';
  });
})();

/* services: active row drives the sticky photo */
(() => {
  const rows = $('.svc__row');
  const imgs = $('.svc__img');
  if (!rows.length) return;
  const set = (n) => {
    rows.forEach((r, k) => r.classList.toggle('on', k === n));
    imgs.forEach((m, k) => m.classList.toggle('on', k === n));
  };
  set(0);
  rows.forEach((r, k) => {
    if (FINE) r.addEventListener('mouseenter', () => set(k));
    ScrollTrigger.create({ trigger: r, start: 'top 62%', end: 'bottom 62%', onToggle: (st) => st.isActive && set(k) });
  });
})();

const restoreScroll = () => {
  const y = Number(sessionStorage.getItem('y:' + location.pathname));
  if (!location.hash && y > 0 && performance.getEntriesByType('navigation')[0]?.type === 'back_forward') {
    window.scrollTo(0, y); lenis?.scrollTo(y, { immediate: true, force: true });
  }
};
addEventListener('pagehide', () => sessionStorage.setItem('y:' + location.pathname, String(scrollY)));

if (!RM) {
  const hdrH = () => document.getElementById('hdr')?.offsetHeight || 0;
  lenis = new Lenis({ duration: 1.0, smoothWheel: true, syncTouch: false, wheelMultiplier: 0.9, anchors: { offset: -hdrH() } });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  const start = MOBILE ? 'top 94%' : 'top 88%';

  /* copy fades up */
  ScrollTrigger.batch('.fade', { start: MOBILE ? 'top 96%' : 'top 90%', once: true, onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.85, ease: 'power3.out', stagger: 0.08 }) });

  /* photo mask reveal (bottom-up wipe) */
  $('.reveal').forEach((el) => {
    ScrollTrigger.create({ trigger: el, start, once: true, onEnter: () => gsap.to(el, { clipPath: 'inset(0% 0 0 0)', duration: MOBILE ? 0.75 : 1.15, ease: 'expo.inOut' }) });
  });

  /* parallax inside frames */
  $('.px').forEach((el) => {
    const img = el.querySelector('img');
    const sp = Number(el.dataset.speed || 5);
    gsap.fromTo(img, { yPercent: -sp }, { yPercent: sp, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* statement words brighten with scroll: only words whose state changes are touched */
  $('.brighten').forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map((w) => `<span class="w">${w}</span>`).join(' ');
    const ws = $('.w', el); let last = 0;
    ScrollTrigger.create({ trigger: el, start: 'top 82%', end: 'bottom 50%', scrub: true, onUpdate: (st) => {
      const n = Math.round(st.progress * ws.length);
      if (n === last) return;
      const [a, b] = n > last ? [last, n] : [n, last];
      for (let k = a; k < b; k++) ws[k].classList.toggle('lit', k < n);
      last = n;
    } });
  });

  /* hero: slow scale on the photo, tied to scroll */
  const hp = document.querySelector('.hero .px-hero img');
  if (hp) gsap.fromTo(hp, { scale: 1.04 }, { scale: 1.1, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  document.fonts.ready.then(() => {
    /* headings: lines rise straight out of masks (already-visible ones are shown at rest: no double entrance) */
    $('.rise-lines').forEach((el) => {
      const st = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'rl-line', aria: 'auto' });
      el.classList.add('is-split');
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight * 0.92 && r.bottom > 0) return;
      gsap.set(st.lines, { yPercent: 115 });
      ScrollTrigger.create({ trigger: el, start, once: true, onEnter: () => gsap.to(st.lines, { yPercent: 0, duration: 1.0, ease: 'expo.out', stagger: 0.08 }) });
    });

    /* pinned sideways rail: only on hover-capable landscape desktops; everything else keeps the native swipe rail */
    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px) and (hover: hover) and (pointer: fine) and (min-aspect-ratio: 1/1)', () => {
      const rail = document.querySelector('.rail');
      const track = document.querySelector('.rail__track');
      const bar = document.querySelector('.rail__bar i');
      if (!rail || !track) return;
      rail.classList.add('rail--pin');
      track.scrollLeft = 0;
      const pad = () => parseFloat(getComputedStyle(track).paddingLeft) || 0;
      const dist = () => Math.max(0, track.scrollWidth - innerWidth + pad());
      const tw = gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '.rail', start: () => 'top ' + hdrH() + 'px', end: () => '+=' + Math.round(dist() * 0.8), pin: '.rail', scrub: true, invalidateOnRefresh: true, anticipatePin: 1, onUpdate: (st) => bar?.style.setProperty('--p', st.progress.toFixed(3)) } });
      return () => { tw.kill(); rail.classList.remove('rail--pin'); gsap.set(track, { clearProps: 'x' }); };
    });
    ScrollTrigger.refresh();
    restoreScroll();
  });
  addEventListener('load', () => ScrollTrigger.refresh());
} else {
  addEventListener('load', restoreScroll);
}

/* native rail progress (touch, reduced motion, tablets) */
(() => {
  const track = document.querySelector('.rail__track'); const bar = document.querySelector('.rail__bar i');
  if (!track || !bar) return;
  track.addEventListener('scroll', () => { const m = track.scrollWidth - track.clientWidth; bar.style.setProperty('--p', m > 0 ? (track.scrollLeft / m).toFixed(3) : 0); }, { passive: true });
})();

/* pointer-reactive pieces (desktop only) */
if (!RM && FINE) {
  $('.mag').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * 0.2).toFixed(1) + 'px');
      el.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1) + 'px');
    });
    el.addEventListener('pointerleave', () => { el.style.setProperty('--mx', '0px'); el.style.setProperty('--my', '0px'); });
  });
  const hero = document.querySelector('.hero, .phero');
  const a = document.querySelector('.px-hero picture');
  if (hero && a) {
    const qa = { x: gsap.quickTo(a, 'x', { duration: 1.2, ease: 'power3' }), y: gsap.quickTo(a, 'y', { duration: 1.2, ease: 'power3' }) };
    hero.addEventListener('pointermove', (e) => {
      const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
      qa.x(nx * -12); qa.y(ny * -8);
    });
  }
}

/* hero asphalt grain: aggregate speckle; light under the pointer on desktop only */
(() => {
  const cv = document.querySelector('.hero__grain');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const T = 220, tile = document.createElement('canvas'); tile.width = tile.height = T;
  const t = tile.getContext('2d');
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 1900; i++) {
    const g = 90 + rnd() * 165 | 0; t.fillStyle = `rgba(${g},${g},${g},${0.25 + rnd() * 0.6})`;
    const s = rnd() < 0.85 ? 1 : 2; t.fillRect(rnd() * T | 0, rnd() * T | 0, s, s);
  }
  const live = !RM && FINE;
  const lit = live ? document.createElement('canvas') : null; const lc = lit?.getContext('2d');
  let W = 0, H = 0, pat, lpat; const dpr = live ? Math.min(devicePixelRatio || 1, 2) : 1;
  const size = () => {
    const r = cv.getBoundingClientRect();
    if (Math.round(r.width) === Math.round(W) && Math.abs(r.height - H) < 120) return;
    W = r.width; H = r.height;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); pat = ctx.createPattern(tile, 'repeat');
    if (lit) { lit.width = W * dpr; lit.height = H * dpr; lc.setTransform(dpr, 0, 0, dpr, 0, 0); lpat = lc.createPattern(tile, 'repeat'); }
    draw();
  };
  let px = -999, py = -999, tx = -999, ty = -999, raf = 0;
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.09; ctx.fillStyle = pat; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
    if (lit && px > -900) {
      lc.globalCompositeOperation = 'source-over'; lc.clearRect(0, 0, W, H);
      lc.fillStyle = lpat; lc.fillRect(0, 0, W, H);
      lc.globalCompositeOperation = 'destination-in';
      const g = lc.createRadialGradient(px, py, 0, px, py, 260);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      lc.fillStyle = g; lc.fillRect(0, 0, W, H);
      ctx.drawImage(lit, 0, 0, W, H);
    }
  };
  const loop = () => {
    px += (tx - px) * 0.14; py += (ty - py) * 0.14; draw();
    raf = Math.abs(tx - px) + Math.abs(ty - py) > 0.5 ? requestAnimationFrame(loop) : 0;
  };
  let rt = 0; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(size, 150); }, { passive: true });
  size();
  if (live) {
    cv.parentElement.addEventListener('pointermove', (e) => {
      const r = cv.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top;
      if (px < -900) { px = tx; py = ty; }
      if (!raf) raf = requestAnimationFrame(loop);
    });
  }
})();
