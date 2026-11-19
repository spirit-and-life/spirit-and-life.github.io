// الرسومات: السفينة (علامة روح وحياة)، البئر، الفنار، والأيقونات
export const P = {
  heart: 'M155 745C60 600 25 440 70 300C100 200 150 120 240 100C330 80 390 160 405 250C470 150 600 60 760 45C880 40 915 130 890 240C855 380 700 520 560 610',
  sail: 'M262 305L560 308C545 380 540 470 580 560C500 510 330 515 262 562C300 470 285 380 262 305Z',
  band: 'M120 640C300 636 520 622 712 596C690 626 400 652 120 646Z',
  bow: 'M712 596L556 754L598 750C690 684 712 640 712 596Z',
  body: 'M126 647C300 650 560 628 708 600C690 650 640 705 560 752C470 722 330 706 126 647Z',
  hline: 'M275 692C440 690 590 665 690 628',
  ecg: 'M105 770L162 770L190 735L218 768L272 770L300 678L322 792L342 770L420 770L460 714L505 768L632 770',
  waves: ['M110 806C230 822 390 792 625 808', 'M128 842C260 856 430 830 606 846', 'M152 876C280 890 410 870 562 882'],
  wind: ['M10 380C110 360 200 400 258 420', 'M0 460C100 450 190 480 256 498', 'M40 320C130 308 200 330 255 346', 'M600 440C690 425 770 450 880 415', 'M590 380C680 365 760 380 850 350'],
};

// ---------- أيقونات + رمز السفينة (بتتحط مرة في أول الصفحة) ----------
export const DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <symbol id="i-anchor" viewBox="0 0 24 24"><circle cx="12" cy="5" r="2.2"/><path d="M12 7.2V21M8.5 11.5h7M5 15c.8 3.4 3.7 6 7 6s6.2-2.6 7-6M3.4 16.6 5 15l1.7 1.7M17.3 16.7 19 15l1.6 1.6"/></symbol>
  <symbol id="i-compass" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M15.8 8.2 13.6 13.6 8.2 15.8 10.4 10.4z"/></symbol>
  <symbol id="i-helm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="6.3"/><circle cx="12" cy="12" r="2"/><path d="M12 1.8v4M12 18.2v4M1.8 12h4M18.2 12h4M4.8 4.8l2.8 2.8M16.4 16.4l2.8 2.8M19.2 4.8l-2.8 2.8M7.6 16.4l-2.8 2.8"/></symbol>
  <symbol id="i-sail" viewBox="0 0 24 24"><path d="M12 3v14M12 4.5 19.5 15H12M10.8 6.5 4.5 15h6.3M3 19c2.6 1.6 5.6 1.6 9 0s6.4-1.6 9 0"/></symbol>
  <symbol id="i-light" viewBox="0 0 24 24"><path d="M8.5 21h7M9.7 21l1-11.5h2.6L14.3 21M9.7 9.5h4.6l-1-4.5h-2.6zM12 3v1M4.6 5.4l2.2 1.4M19.4 5.4l-2.2 1.4M3 10l2.4.5M21 10l-2.4.5"/></symbol>
  <symbol id="i-ark" viewBox="0 0 24 24"><path d="M2.5 14h19l-2.8 5.5H5.3zM6 14v-4h12v4M12 10V5.5l4 2.5M9.5 10V8M14.5 10V8"/></symbol>
  <symbol id="i-well" viewBox="0 0 24 24"><path d="M5 20.5h14M6 20.5V13M18 20.5V13M4 13h16M7 13V7l5-3.5L17 7v6M12 3.5V13M12 8v2"/></symbol>
  <symbol id="i-coat" viewBox="0 0 24 24"><path d="M8.5 3.5 12 5.5l3.5-2L21 8l-3 3.2V21H6v-9.8L3 8zM9 13h6M9 16.5h6"/></symbol>
  <symbol id="i-map" viewBox="0 0 24 24"><path d="M3 6.5l6-2 6 2 6-2v13l-6 2-6-2-6 2zM9 4.5v13M15 6.5v13"/></symbol>
  <symbol id="i-lamp" viewBox="0 0 24 24"><path d="M12 2.5v2.6M9 5.2h6l1.6 3v7.5H7.4V8.2zM8 18.5h8M10 21.5h4"/></symbol>
  <symbol id="i-verse" viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></symbol>
  <symbol id="i-user" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></symbol>
  <symbol id="i-cal" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></symbol>
  <symbol id="i-wave" viewBox="0 0 24 24"><path d="M2 9c2.5-2.5 5-2.5 7.5 0s5 2.5 7.5 0 3.5-1.5 5 0M2 15c2.5-2.5 5-2.5 7.5 0s5 2.5 7.5 0 3.5-1.5 5 0"/></symbol>
  <symbol id="ship" viewBox="0 0 930 920">
    <path d="${P.heart}" fill="none" style="stroke:var(--sh-heart,#E4202B);opacity:var(--sh-heart-o,0)" stroke-width="58" stroke-linecap="round"/>
    <path d="${P.sail}" fill="rgba(255,255,255,.14)" style="stroke:var(--sh-line,#0D4A8B)" stroke-width="12"/>
    <rect x="248" y="296" width="330" height="20" style="fill:var(--sh-line,#0D4A8B)"/><rect x="409" y="186" width="20" height="442" style="fill:var(--sh-line,#0D4A8B)"/>
    <path d="${P.body}" style="fill:var(--sh-body,#fff);stroke:var(--sh-line,#0D4A8B)" stroke-width="5"/>
    <path d="${P.band} ${P.bow}" style="fill:var(--sh-band,#0B1F3F)"/>
    <path d="${P.ecg}" fill="none" style="stroke:var(--sh-wave,#8FD3F0)" stroke-width="26"/>
    <g fill="none" style="stroke:var(--sh-wave,#8FD3F0)" stroke-width="24" stroke-linecap="round">${P.waves.map((d) => `<path d="${d}"/>`).join('')}</g>
  </symbol>
</svg>`;
export const ICO = (id) => `<svg class="ico" aria-hidden="true"><use href="#${id}"/></svg>`;
export const shipMark = (cls = '', style = '') => `<svg class="${cls}" viewBox="0 0 930 920" style="${style}" aria-hidden="true"><use href="#ship"/></svg>`;
export const NIGHT = '--sh-line:#8FD3F0;--sh-body:#F4FBFE;--sh-band:#CFEAF7;';

// السفينة كصورة مستقلة (للشهادة وصورة الآية وأيقونة التطبيق)
export function shipURL({ line = '#0D4A8B', body = '#FFFFFF', band = '#0B1F3F', wave = '#8FD3F0' } = {}) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 930 920"><path d="${P.sail}" fill="rgba(255,255,255,.14)" stroke="${line}" stroke-width="12"/><rect x="248" y="296" width="330" height="20" fill="${line}"/><rect x="409" y="186" width="20" height="442" fill="${line}"/><path d="${P.body}" fill="${body}" stroke="${line}" stroke-width="5"/><path d="${P.band} ${P.bow}" fill="${band}"/><path d="${P.ecg}" fill="none" stroke="${wave}" stroke-width="26"/><g fill="none" stroke="${wave}" stroke-width="24" stroke-linecap="round">${P.waves.map((d) => `<path d="${d}"/>`).join('')}</g></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

// ---------- الافتتاحية 3D (طبقات CSS) ----------
export function introLayers() {
  const VB = 'viewBox="0 0 930 920"';
  return `
<div class="L heart" style="--z:-60px"><svg ${VB}><defs><filter id="brush" x="-8%" y="-8%" width="116%" height="116%"><feTurbulence type="fractalNoise" baseFrequency=".03" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="18"/></filter></defs><g filter="url(#brush)"><path class="hp" pathLength="1" d="${P.heart}"/></g></svg></div>
<div class="L wind" style="--z:-10px"><svg ${VB}>${P.wind.map((d, i) => `<path class="wnd" style="--d:${3.4 + i * .35}s" d="${d}"/>`).join('')}</svg></div>
<div class="L sailL" style="--z:0px"><svg ${VB}><g class="sailg"><path class="sailfill" d="${P.sail}"/><path class="ln" d="${P.sail}"/></g><rect class="mast fl" x="409" y="186" width="20" height="442"/><rect class="yard fl" x="248" y="296" width="330" height="20"/></svg></div>
<div class="L hull" style="--z:28px"><svg ${VB}><g class="hullg"><path class="body" d="${P.body}"/><path class="hline" d="${P.hline}"/><path class="band" d="${P.band}"/><path class="bow" d="${P.bow}"/></g></svg></div>
<div class="L front" style="--z:62px"><svg ${VB}><path class="ecg" pathLength="1" d="${P.ecg}"/>${P.waves.map((d) => `<path class="wvp" d="${d}"/>`).join('')}</svg></div>`;
}
export const seaWaves = () => { const w = '<svg viewBox="0 0 720 60" preserveAspectRatio="none"><path d="M0 22q45-22 90 0t90 0t90 0t90 0t90 0t90 0t90 0t90 0V60H0z" fill="#0D4A8B"/></svg>'; return w + w; };
export function starsHTML(n, maxTop) {
  let seed = 11; const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: n }, () => { const b = r() < .2 ? 3 : 2; return `<span style="left:${(r() * 100).toFixed(1)}%;top:${(r() * maxTop).toFixed(1)}%;animation-delay:${(r() * 3).toFixed(2)}s;width:${b}px;height:${b}px"></span>`; }).join('');
}

// ---------- الفنار (٥ مستويات) ----------
let UID = 0;
export function lamp(l, small) {
  const u = 'L' + (++UID), lit = l >= 2;
  const fl = [0, .55, .85, 1.05, 1.1][l - 1], glowR = [0, 26, 40, 56, 76][l - 1];
  const defs = `<defs>
  <radialGradient id="${u}g"><stop offset="0" stop-color="#FFF2C4" stop-opacity=".95"/><stop offset=".4" stop-color="#FFC857" stop-opacity=".5"/><stop offset="1" stop-color="#FFC857" stop-opacity="0"/></radialGradient>
  <linearGradient id="${u}m" x1="0" x2="1"><stop offset="0" stop-color="#8FD3F0"/><stop offset=".5" stop-color="#3F8FC4"/><stop offset="1" stop-color="#1D5E96"/></linearGradient>
  <linearGradient id="${u}bl" x1="0" x2="1"><stop offset="0" stop-color="#FFC857" stop-opacity="0"/><stop offset="1" stop-color="#FFC857" stop-opacity=".8"/></linearGradient>
  <linearGradient id="${u}br" x1="1" x2="0"><stop offset="0" stop-color="#FFC857" stop-opacity="0"/><stop offset="1" stop-color="#FFC857" stop-opacity=".8"/></linearGradient>
  <linearGradient id="${u}gl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${lit ? '#FFF2C4' : '#1B4A7A'}" stop-opacity="${lit ? (.3 + l * .1).toFixed(2) : .55}"/><stop offset="1" stop-color="${lit ? '#FFC857' : '#0A2A52'}" stop-opacity="${lit ? (.22 + l * .08).toFixed(2) : .7}"/></linearGradient>
  <clipPath id="${u}c"><path d="M47 134L52 62H68L73 134Z"/></clipPath></defs>`;
  const water = `<g fill="none" stroke="#5BB6DD" stroke-linecap="round"><path d="M8 157q8-5 16 0t16 0t16 0t16 0t16 0t16 0" stroke-width="2.4" opacity=".75"/><path d="M20 165q8-5 16 0t16 0t16 0t16 0t16 0" stroke-width="2" opacity=".4"/></g>${lit ? `<ellipse class="pulse" cx="60" cy="161" rx="${8 + l * 5}" ry="3.2" fill="#FFC857" opacity=".4"/>` : ''}`;
  let b = '';
  if (l < 5) {
    const cy = 48;
    if (lit) b += `<circle class="pulse" cx="60" cy="${cy}" r="${glowR}" fill="url(#${u}g)"/>`;
    if (l >= 4 && !small) for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; b += `<line class="pulse" x1="${60 + Math.cos(a) * 32}" y1="${cy + Math.sin(a) * 32}" x2="${60 + Math.cos(a) * (i % 2 ? 40 : 46)}" y2="${cy + Math.sin(a) * (i % 2 ? 40 : 46)}" stroke="#FFC857" stroke-opacity=".75" stroke-width="2" stroke-linecap="round"/>`; }
    b += '<path d="M60 70L36 156M60 70L84 156" stroke="#5BB6DD" stroke-opacity=".55" stroke-width="1.2" fill="none"/>';
    [112, 124, 136, 148].forEach((y) => { const d = 24 * (y - 70) / 86; b += `<path d="M${(60 - d).toFixed(1)} ${y}L${(60 + d).toFixed(1)} ${y}" stroke="#5BB6DD" stroke-opacity=".45" stroke-width="1"/>`; });
    b += `<rect x="57.5" y="64" width="5" height="92" rx="2" fill="url(#${u}m)"/><rect x="36" y="98" width="48" height="3.6" rx="1.8" fill="url(#${u}m)"/><circle cx="36" cy="99.8" r="2" fill="#8FD3F0"/><circle cx="84" cy="99.8" r="2" fill="#8FD3F0"/>`;
    b += '<path d="M40 156H80L76 148H44Z" fill="#1D5E96" stroke="#8FD3F0" stroke-width="1"/>';
    if (l === 4) b += '<path d="M60 11V0" stroke="#8FD3F0" stroke-width="1.4"/><path d="M60 0L77 4.5L60 9Z" fill="#E4202B"/>';
    b += `<circle cx="60" cy="15" r="4" fill="none" stroke="#8FD3F0" stroke-width="2"/>
    <path d="M41 29Q60 11 79 29Z" fill="#0D4A8B" stroke="#8FD3F0" stroke-width="1.5" stroke-linejoin="round"/>
    <rect x="39" y="28" width="42" height="4.5" rx="2" fill="#1D5E96" stroke="#8FD3F0" stroke-width="1.2"/>
    <path d="M44 32H76L72 62H48Z" fill="url(#${u}gl)" stroke="#8FD3F0" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M52 32L54 62M60 32V62M68 32L66 62M46 46.5H74" stroke="#8FD3F0" stroke-width="1.3" opacity=".85"/>
    <path d="M47 33L49.5 60" stroke="#fff" stroke-width="1.6" opacity="${lit ? .5 : .25}" stroke-linecap="round"/>
    <rect x="45" y="62" width="30" height="5" rx="2" fill="#1D5E96" stroke="#8FD3F0" stroke-width="1.2"/>
    <path d="M47 67L44 72M73 67L76 72" stroke="#8FD3F0" stroke-width="1.6" stroke-linecap="round"/>`;
    if (l === 1) b += '<path d="M60 56V44" stroke="#5BB6DD" stroke-width="1.6" stroke-linecap="round"/><path d="M60 42q-5-5 0-9t0-8" stroke="#8FD3F0" stroke-opacity=".35" stroke-width="1.4" fill="none"/>';
    if (lit) b += `<g transform="translate(60 56) scale(${fl})"><g class="flick"><path d="M0-22C9-11 12-1 6 7 3 11-3 11-6 7-12-1-9-11 0-22Z" fill="#FFC857"/><path d="M0-11C4-5 5 0 2.5 4 1 6-1 6-2.5 4-5 0-4-5 0-11Z" fill="#FFF4CF"/></g></g>`;
  } else {
    const cy = 49;
    if (!small) b += `<path class="bm" d="M60 ${cy}L-14 22V76Z" fill="url(#${u}bl)"/><path class="bm b2" d="M60 ${cy}L134 22V76Z" fill="url(#${u}br)"/>`;
    b += `<circle class="pulse" cx="60" cy="${cy}" r="${small ? 44 : glowR}" fill="url(#${u}g)"/>`;
    b += '<path d="M12 158Q22 140 42 134H78Q98 140 108 158Z" fill="#143E70" stroke="#2F6EAD" stroke-width="1.4"/><path d="M30 150Q38 142 50 142M70 144Q84 142 92 150" stroke="#2F6EAD" stroke-width="1.2" fill="none" opacity=".7"/>';
    b += `<g clip-path="url(#${u}c)"><rect x="40" y="62" width="40" height="72" fill="#F4FBFE"/><rect x="40" y="78" width="40" height="14" fill="#0D4A8B"/><rect x="40" y="106" width="40" height="14" fill="#0D4A8B"/><path d="M47 62h6v72h-6z" fill="#8FD3F0" opacity=".4"/><path d="M66 62h7v72h-7z" fill="#0A2A52" opacity=".16"/></g><path d="M47 134L52 62H68L73 134Z" fill="none" stroke="#8FD3F0" stroke-width="1.2"/>`;
    b += '<path d="M56 134V125A4 4 0 0 1 64 125V134Z" fill="#0A2A52"/><rect x="58" y="96" width="4" height="7" rx="2" fill="#FFC857"/><rect x="58" y="66" width="4" height="6" rx="2" fill="#FFC857"/>';
    b += '<rect x="45" y="58" width="30" height="5" rx="1.5" fill="#0A2A52" stroke="#8FD3F0" stroke-width="1.2"/><path d="M46 50H74M47 50V58M53.6 50V58M60 50V58M66.4 50V58M73 50V58" stroke="#8FD3F0" stroke-width="1.2" fill="none"/>';
    b += `<rect x="52.5" y="39" width="15" height="19" rx="1.5" fill="url(#${u}gl)" stroke="#8FD3F0" stroke-width="1.6"/><path d="M57.5 39V58M62.5 39V58" stroke="#8FD3F0" stroke-width="1.1"/><circle cx="60" cy="${cy}" r="4.4" fill="#FFF4CF"/>`;
    b += '<path d="M50 40Q60 23 70 40Z" fill="#0D4A8B" stroke="#8FD3F0" stroke-width="1.5" stroke-linejoin="round"/><path d="M60 28V10M54.5 16H65.5" stroke="#FFC857" stroke-width="2.6" stroke-linecap="round"/>';
  }
  return `<svg class="lampsvg" viewBox="0 0 120 170" aria-hidden="true">${defs}${b}${water}</svg>`;
}

// ---------- البئر (المرأة السامرية — يوحنا ٤) ----------
export function wellSVG(u) {
  const arcY = (x, cy) => cy + 15 * Math.sqrt(1 - ((x - 100) / 56) ** 2);
  let bricks = '';
  [16, 32].forEach((o) => { bricks += `<path d="M44 ${138 + o}A56 15 0 0 0 156 ${138 + o}" fill="none" stroke="#061A33" stroke-opacity=".45" stroke-width="1.6"/>`; });
  [[0, [62, 86, 114, 138]], [1, [74, 100, 126]], [2, [60, 86, 114, 140]]].forEach(([k, xs]) => xs.forEach((x) => { bricks += `<path d="M${x} ${arcY(x, 138 + 16 * k).toFixed(1)}L${x} ${arcY(x, 138 + 16 * (k + 1)).toFixed(1)}" stroke="#061A33" stroke-opacity=".4" stroke-width="1.5"/>`; }));
  return `<svg class="well-svg" viewBox="0 0 200 224" aria-hidden="true">
  <defs>
    <radialGradient id="ww${u}"><stop offset="0" stop-color="#FFF2C4"/><stop offset=".5" stop-color="#FFC857"/><stop offset="1" stop-color="#5BB6DD"/></radialGradient>
    <linearGradient id="bm${u}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#FFC857" stop-opacity=".7"/><stop offset="1" stop-color="#FFC857" stop-opacity="0"/></linearGradient>
    <linearGradient id="st${u}" x1="0" x2="1"><stop offset="0" stop-color="#1D4F86"/><stop offset=".45" stop-color="#3A78B8"/><stop offset="1" stop-color="#143E70"/></linearGradient>
    <linearGradient id="wd${u}" x1="0" x2="1"><stop offset="0" stop-color="#9A6E45"/><stop offset="1" stop-color="#C99C6A"/></linearGradient>
    <radialGradient id="cg${u}"><stop offset="0" stop-color="#FFC857" stop-opacity=".9"/><stop offset="1" stop-color="#FFC857" stop-opacity="0"/></radialGradient>
    <clipPath id="cp${u}"><rect x="0" y="0" width="200" height="143"/></clipPath>
  </defs>
  <ellipse cx="100" cy="203" rx="78" ry="8" fill="#000" opacity=".28"/>
  <path class="beam" d="M62 136L138 136L182 12L18 12Z" fill="url(#bm${u})"/>
  <rect x="51" y="62" width="8" height="76" fill="url(#wd${u})"/><rect x="141" y="62" width="8" height="76" fill="url(#wd${u})"/>
  <rect x="46" y="57" width="108" height="8" rx="2" fill="url(#wd${u})"/>
  <path d="M38 58L100 30L162 58Z" fill="#0D4A8B" stroke="#8FD3F0" stroke-width="2" stroke-linejoin="round"/>
  <path d="M52 52L100 33M148 52L100 33M46 58H154" stroke="#8FD3F0" stroke-opacity=".45" stroke-width="1.2" fill="none"/>
  <circle class="pulse" cx="100" cy="16" r="15" fill="url(#cg${u})"/>
  <path class="xcross" d="M100 30V6M91 14H109" stroke="#FFC857" stroke-width="3.6" stroke-linecap="round"/>
  <path d="M100 65V72" stroke="#8FD3F0" stroke-width="2"/>
  <g class="wheel"><circle cx="100" cy="80" r="8.5" fill="#061A33" stroke="#8FD3F0" stroke-width="2"/><path d="M100 72V88M92 80H108" stroke="#5BB6DD" stroke-width="1.2"/><circle cx="100" cy="80" r="2" fill="#8FD3F0"/></g>
  <ellipse cx="100" cy="138" rx="56" ry="15" fill="#D6ECF6" stroke="#8FD3F0" stroke-width="1.5"/>
  <ellipse cx="100" cy="139" rx="49" ry="11.5" fill="#061A33"/>
  <ellipse class="water" cx="100" cy="140" rx="45" ry="9" fill="url(#ww${u})"/>
  <ellipse class="rip" cx="100" cy="140" rx="30" ry="6" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.2"/>
  <ellipse class="rip r2" cx="100" cy="140" rx="30" ry="6" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.2"/>
  <g clip-path="url(#cp${u})">
    <rect x="107" y="82" width="2" height="26" fill="#D6ECF6"/><circle cx="108" cy="110" r="3.6" fill="#B98B5E"/>
    <rect class="rope" x="91" y="82" width="2" height="68" fill="#D6ECF6"/>
    <g class="bucket">
      <path d="M82 154Q92 143 102 154" fill="none" stroke="#D6ECF6" stroke-width="1.6"/>
      <path d="M82 153H102L99 173H85Z" fill="url(#wd${u})" stroke="#6B4A2C" stroke-width="1.2"/>
      <path d="M83 159H101M84 166H100" stroke="#6B4A2C" stroke-width="1.4"/>
      <ellipse cx="92" cy="153" rx="10" ry="2.6" fill="#8FD3F0"/>
      <circle class="drop" cx="88" cy="174" r="1.8" fill="#8FD3F0"/><circle class="drop d2" cx="96" cy="174" r="1.8" fill="#8FD3F0"/>
    </g>
  </g>
  <path d="M44 138A56 15 0 0 0 156 138V186A56 15 0 0 1 44 186Z" fill="url(#st${u})"/>
  ${bricks}
  <path d="M44 138A56 15 0 0 0 156 138" fill="none" stroke="#D6ECF6" stroke-width="5" stroke-linecap="round"/>
  <path d="M52 150V182" stroke="#fff" stroke-opacity=".18" stroke-width="5" stroke-linecap="round"/>
  <g fill="#FFE9A8"><circle class="spark" cx="82" cy="132" r="1.8"/><circle class="spark s2" cx="104" cy="130" r="2.2"/><circle class="spark s3" cx="120" cy="134" r="1.6"/><circle class="spark s4" cx="94" cy="128" r="1.4"/></g>
  <g fill="#2F6EAD" opacity=".8"><ellipse cx="30" cy="198" rx="9" ry="4"/><ellipse cx="172" cy="200" rx="11" ry="4.5"/><ellipse cx="160" cy="205" rx="6" ry="3"/></g>
  </svg>`;
}
export const wellGlyph = (x, y, on) => `<g transform="translate(${x} ${y})" opacity="${on ? 1 : .55}"><ellipse cy="-6" rx="12" ry="4.5" fill="#D6ECF6"/><path d="M-12 -6A12 4.5 0 0 0 12 -6V7A12 4.5 0 0 1 -12 7Z" fill="#2F6EAD" stroke="#8FD3F0" stroke-width="1"/><ellipse cy="-6" rx="8.5" ry="2.8" fill="#FFC857"/></g>`;
