// صفحة الرحلة: الخريطة البحرية، لوحة الأمناء (الفنار)، قائمة الشرف
import { DAYS, TOTAL, BADGES, PORTS, WELLS, ar, fmtDate, todayCairo, chLabel, dayTitle, status, END } from './plan.js';
import { examState } from './data.js';
import { $, $$, esc, APP, S, reduce, color, initial, first, toast, myRead, topbar, foot, ICON } from './ui.js';
import { ICO, lamp, shipMark, NIGHT, wellGlyph } from './ship.js';
import { userStats, weekStats, weekRange, lampLevel, LAMP_NAMES } from './stats.js';

const segs = (tab) => `<div class="seg" role="tablist"><a href="#/journey/sea" class="${tab === 'sea' ? 'on' : ''}">البحر</a><a href="#/journey/lamps" class="${tab === 'lamps' ? 'on' : ''}">الفنار</a><a href="#/journey/honor" class="${tab === 'honor' ? 'on' : ''}">قائمة الشرف</a></div>`;

export function vJourney(sub) {
  const tab = ['lamps', 'honor'].includes(sub) ? sub : 'sea';
  if (tab === 'lamps') return boardLamps(); if (tab === 'honor') return boardHonor();
  return vSea();
}

// ---------------------------------------------------------------- الخريطة البحرية
function vSea() {
  const r = myRead(); const t = todayCairo(); const st = status(t); const todayN = st.phase === 'reading' ? st.day.n : 0;
  const W = 340, STEP = 84, TOP = 170, N = TOTAL;
  const pts = Array.from({ length: N }, (_, i) => ({ d: i + 1, x: W / 2 + 98 * Math.sin(i * .85 + .2), y: TOP + i * STEP }));
  const H = TOP + N * STEP + 90;
  const seg = (a, b, p0, p3) => { const c1 = { x: a.x + (b.x - p0.x) / 6, y: a.y + (b.y - p0.y) / 6 }, c2 = { x: b.x - (p3.x - a.x) / 6, y: b.y - (p3.y - a.y) / 6 }; return `M${a.x.toFixed(1)} ${a.y}C${c1.x.toFixed(1)} ${c1.y.toFixed(1)} ${c2.x.toFixed(1)} ${c2.y.toFixed(1)} ${b.x.toFixed(1)} ${b.y}`; };
  const maxRead = Math.max(0, ...r);
  let s = '<defs><radialGradient id="halo"><stop offset="0" stop-color="#FFC857" stop-opacity=".8"/><stop offset="1" stop-color="#FFC857" stop-opacity="0"/></radialGradient></defs>';
  for (let k = 0; k < Math.ceil(H / 120); k++) s += `<path d="M-10 ${60 + k * 120}q85-16 170 0t170 0t170 0" fill="none" stroke="#8FD3F0" stroke-opacity=".07" stroke-width="2"/>`;
  s += `<g transform="translate(${W - 54} ${TOP - 96})" opacity=".55" fill="none" stroke="#8FD3F0"><circle r="24"/><circle r="17" stroke-dasharray="2 4"/><path d="M0-34L6 0 0 34-6 0Z M-34 0L0-6 34 0 0 6Z" fill="#8FD3F0" fill-opacity=".25"/><text y="-40" text-anchor="middle" fill="#8FD3F0" stroke="none" font-size="11">ش</text></g>`;
  for (let i = 0; i < N - 1; i++) {
    const a = pts[i], b = pts[i + 1], done = r.has(b.d);
    s += `<path d="${seg(a, b, pts[i - 1] || a, pts[i + 2] || b)}" fill="none" ${done ? 'stroke="#8FD3F0" stroke-width="4" stroke-linecap="round" stroke-opacity=".9"' : 'stroke="#5BB6DD" stroke-width="3" stroke-dasharray="1 9" stroke-linecap="round" stroke-opacity=".55"'}/>`;
  }
  pts.forEach((p) => {
    const port = PORTS[p.d], read = r.has(p.d), isT = p.d === todayN, left = p.x > W / 2;
    let g = '';
    if (port) {
      g += `<circle cx="${p.x}" cy="${p.y}" r="25" fill="none" stroke="#8FD3F0" stroke-opacity="${read ? .45 : .2}" stroke-width="2"/>`;
      g += WELLS.has(p.d) ? wellGlyph(p.x, p.y, read) : `<ellipse cx="${p.x}" cy="${p.y + 2}" rx="17" ry="12" fill="#1E9C8F" opacity="${read ? 1 : .5}"/>`;
      const off = 32, tx = left ? p.x - off : p.x + off, anc = left ? 'end' : 'start';
      g += `<g opacity="${read || isT ? 1 : .6}"><text x="${tx}" y="${p.y - 3}" text-anchor="${anc}" fill="#fff" font-size="14.5" font-weight="700">${port}${p.d === N ? ' ✦' : ''}</text><text x="${tx}" y="${p.y + 14}" text-anchor="${anc}" fill="#8FD3F0" font-size="11.5">يوم ${ar(p.d)} · ${fmtDate(DAYS[p.d - 1].date)}</text></g>`;
    }
    if (read) g += `<circle cx="${p.x}" cy="${p.y}" r="13" fill="url(#halo)"/><circle cx="${p.x}" cy="${p.y}" r="4.6" fill="#FFC857"/>`;
    else if (!port) g += `<circle cx="${p.x}" cy="${p.y}" r="4.5" fill="#061A33" stroke="#5BB6DD" stroke-opacity=".75" stroke-width="1.6"/>`;
    if (isT) g += `<circle class="ripple" cx="${p.x}" cy="${p.y}" r="14" fill="none" stroke="#E4202B" stroke-width="2.5"/><circle cx="${p.x}" cy="${p.y}" r="9" fill="none" stroke="#E4202B" stroke-width="2.5"/>`;
    if (p.d === N) g += `<path d="M${p.x} ${p.y - 46}l4 11 12 .8-9.4 7.6 3.2 11.6-9.8-6.6-9.8 6.6 3.2-11.6-9.4-7.6 12-.8z" fill="#FFC857" class="twk"/>`;
    s += `<g class="stn" data-n="${p.d}">${g}<circle cx="${p.x}" cy="${p.y}" r="22" fill="transparent"/></g>`;
  });
  // الناس: أصحابي على بعد محطتهم، وأنا بالسفينة
  const groups = {}; S.users.forEach((u) => { if (u.id === S.me.id) return; const k = Math.max(0, ...(u.readDays || [])); if (k) (groups[k] = groups[k] || []).push(u); });
  Object.entries(groups).forEach(([k, us]) => { const p = pts[+k - 1]; us.forEach((u, i) => { const off = (i - (us.length - 1) / 2) * 17; const x = p.x + off, y = p.y - 24;
    s += `<g><circle cx="${x}" cy="${y}" r="9.5" fill="${color(u.name)}" stroke="#EEF8FC" stroke-width="1.6"/><text x="${x}" y="${y + 3.8}" font-size="11" fill="#fff" text-anchor="middle" font-weight="700" style="stroke:none">${esc(initial(u.name))}</text></g>`; }); });
  const mp = maxRead ? pts[maxRead - 1] : { x: W / 2 - 60, y: TOP - 52 };
  const mLeft = mp.x > W / 2;
  s += `<g class="ship-bob" style="transform-origin:${mp.x}px ${mp.y}px"><svg x="${mp.x - 46}" y="${mp.y - 64}" width="92" height="92" viewBox="0 0 930 920" style="${NIGHT}overflow:visible"><use href="#ship"/></svg></g>`;
  s += `<g><rect x="${mp.x + (mLeft ? -126 : 40)}" y="${mp.y + 24}" width="86" height="22" rx="11" fill="#FFC857"/><text x="${mp.x + (mLeft ? -83 : 83)}" y="${mp.y + 39}" text-anchor="middle" font-size="12" font-weight="700" fill="#14264F" style="stroke:none">${maxRead ? 'أنت هنا' : 'ابدأ الرحلة'}</text></g>`;
  APP.innerHTML = `<div class="view">${topbar()}<div class="hello"><h1>رحلتنا في بحر التكوين</h1><p>كل يوم محطة… وآخر ميناء «الميلاد» يوم ${fmtDate(END, false)}</p></div>${segs('sea')}
  <div class="seamap" id="sea"><svg viewBox="0 0 ${W} ${H}" id="seasvg" role="img" aria-label="خريطة الرحلة البحرية">${s}</svg></div>
  <div class="legend"><span><i class="lit"></i>قريته</span><span><i class="ring"></i>لسه</span><span><i class="now"></i>النهارده</span><span><i class="well"></i>بئر</span></div>
  <section class="card"><h2>الشارات</h2><div class="badges">${BADGES.map((b) => `<div class="badge ${b.test(r) ? 'got' : ''}"><i>${ICO(b.icon)}</i><b>${b.name}</b><small>${b.desc}</small></div>`).join('')}</div></section>${foot()}</div>`;
  $$('.stn').forEach((g) => g.addEventListener('click', () => { const n = +g.dataset.n; const d = DAYS[n - 1]; if (d.date <= t) location.hash = `#/read/${n}`; else toast(`يوم ${ar(n)}: ${chLabel(d)} — ${dayTitle(d)} · ${fmtDate(d.date)}`); }));
  const svg = $('#seasvg'); const focusY = mp.y;
  setTimeout(() => { const sc = svg.getBoundingClientRect().height / H; scrollTo({ top: svg.getBoundingClientRect().top + scrollY + focusY * sc - innerHeight / 2, behavior: reduce ? 'auto' : 'smooth' }); }, 350);
}

// ---------------------------------------------------------------- لوحة الأمناء (فنار لكل واحد)
function boardLamps() {
  const range = S.boardRange || 'all'; const t = todayCairo();
  const rows = S.users.map((u) => { const s = userStats(u, t); const w = weekStats(u, t);
    const lvl = range === 'week' ? (w.onTime >= 7 ? 5 : w.onTime >= 5 ? 4 : w.onTime >= 3 ? 3 : w.onTime >= 1 ? 2 : 1) : lampLevel(s);
    return { u, s, w, lvl, key: range === 'week' ? w.onTime * 1000 + w.consistency : s.onTime * 10000 + s.read * 100 + s.streak }; })
    .sort((a, b) => b.key - a.key || a.u.name.localeCompare(b.u.name, 'ar'));
  const top = rows.slice(0, 3); const order = [top[1], top[0], top[2]].filter(Boolean);
  const meRank = rows.findIndex((r) => r.u.id === S.me.id); const [ws, we] = weekRange(t);
  APP.innerHTML = `<div class="view">${topbar()}<div class="hello"><h1>لوحة الأمناء</h1><p class="verse-sub">«كُنْتَ أَمِينًا فِي الْقَلِيلِ فَأُقِيمُكَ عَلَى الْكَثِيرِ» (مت ٢٥: ٢١)</p></div>${segs('lamps')}
  <div class="range"><button class="${range === 'all' ? 'on' : ''}" data-r="all">الرحلة كلها</button><button class="${range === 'week' ? 'on' : ''}" data-r="week">الأسبوع ده</button></div>
  <section class="altar"><p class="altar-note">نور الفنار بيزيد مع التزامك بالقراءة في معادها${range === 'week' ? `<br>من ${fmtDate(ws, false)} لـ ${fmtDate(we, false)}` : ''}</p>
    <div class="podium">${order.map((r) => { const rank = rows.indexOf(r) + 1; return `<div class="pod p${rank} ${r.u.id === S.me.id ? 'me' : ''}"><div class="pl">${lamp(r.lvl)}</div><b class="pn">${esc(first(r.u.name))}</b>
      <span class="ps">${LAMP_NAMES[r.lvl - 1]} · ${range === 'week' ? `${ar(r.w.onTime)} من ${ar(r.w.due)}` : `${ar(r.s.consistency)}٪`}</span><div class="step"><span>${ar(rank)}</span></div></div>`; }).join('')}</div></section>
  ${meRank >= 0 ? `<a class="mepill" href="#me-row">ترتيبك <b>${ar(meRank + 1)}</b> من ${ar(rows.length)} <small>فنارك: ${LAMP_NAMES[rows[meRank].lvl - 1]}</small></a>` : ''}
  <ol class="lamps">${rows.map((r, i) => `<li class="lrow ${r.u.id === S.me.id ? 'me' : ''}" ${r.u.id === S.me.id ? 'id="me-row"' : ''}><span class="rk">${ar(i + 1)}</span><span class="lp">${lamp(r.lvl, true)}</span><span class="ln"><b>${esc(r.u.name)}</b>
    <small>${range === 'week' ? `${ar(r.w.onTime)} يوم في معاده من ${ar(r.w.due)}` : `${ar(r.s.onTime)} في معاده${r.s.late ? ` <i class="lt">${ar(r.s.late)} متأخر</i>` : ''}${r.s.streak > 1 ? ` <i class="st">${ar(r.s.streak)} متتالي</i>` : ''}`}</small></span><span class="pc">${ar(range === 'week' ? r.w.consistency : r.s.consistency)}٪</span></li>`).join('')}</ol>
  ${foot()}</div>`;
  $$('.range button').forEach((b) => b.onclick = () => { S.boardRange = b.dataset.r; boardLamps(); });
}

// ---------------------------------------------------------------- قائمة الشرف (الامتحانات)
function boardHonor() {
  const pub = S.exams.filter((e) => e.status === 'published' && (e.results || []).length).sort((a, b) => b.createdAt - a.createdAt);
  const tot = {}; pub.forEach((e) => e.results.forEach((r) => { tot[r.id] = tot[r.id] || { name: r.name, id: r.id, score: 0, total: 0 }; tot[r.id].score += r.score; tot[r.id].total += r.total; }));
  const overall = Object.values(tot).sort((a, b) => b.score - a.score);
  const medal = (i) => ['🥇', '🥈', '🥉'][i] || ar(i + 1);
  const list = (rs, isExam) => `<ol class="honor">${rs.map((r, i) => `<li class="${r.id === S.me.id ? 'me' : ''} ${i < 3 ? 'top' : ''}"><span class="md">${medal(i)}</span><span class="hn">${esc(r.name)}</span><span class="hs">${ar(r.score)}<small>/${ar(r.total)}</small></span>${isExam && r.dur ? `<span class="ht">${ar(Math.floor(r.dur / 60))}:${ar(String(r.dur % 60).padStart(2, '0'))}</span>` : ''}</li>`).join('')}</ol>`;
  const open = S.exams.filter((e) => examState(e) === 'open');
  APP.innerHTML = `<div class="view">${topbar()}<div class="hello"><h1>قائمة الشرف</h1><p>أوائل الامتحانات، وكل امتحان له قائمته</p></div>${segs('honor')}
  ${open.map((e) => `<a class="card cta exam-cta" href="#/exam/${e.id}"><span class="ei">📝</span><span class="grow"><b>${esc(e.title)}</b><small>الامتحان مفتوح دلوقتي، ادخل امتحن</small></span>${ICON.back}</a>`).join('')}
  ${overall.length ? `<section class="card honor-card gold"><h2>الترتيب العام</h2><p class="sub">مجموع درجات كل الامتحانات</p>${list(overall.slice(0, 10), false)}</section>` : ''}
  ${pub.map((e) => `<section class="card honor-card"><h2>${esc(e.title)}</h2>${e.desc ? `<p class="sub">${esc(e.desc)}</p>` : ''}${list(e.results.slice(0, 10), true)}
    ${(() => { const i = e.results.findIndex((r) => r.id === S.me.id); return i >= 10 ? `<p class="mine">ترتيبك ${ar(i + 1)}: ${ar(e.results[i].score)} من ${ar(e.results[i].total)}</p>` : ''; })()}</section>`).join('')}
  ${!pub.length ? '<section class="card empty"><div class="big">🏆</div><h2>لسه مفيش نتايج</h2><p class="sub">أول ما المسؤولين يعلنوا نتيجة امتحان، الأوائل هيظهروا هنا.</p></section>' : ''}
  ${foot()}</div>`;
}
