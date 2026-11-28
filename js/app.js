import { setClockOffset, DAYS, TOTAL, START, END, BADGES, CH_TITLES, ar, fmtDate, todayCairo, status, dueDays, streak, chLabel, dayTitle, diffDays, addDays, weekday, keyVerse, weekOf } from './plan.js';
import { init, api, on, mode, normPhone, validPhone, initialOf, REACTS, BLOCKED_MSG } from './data.js';
import { askModal, myQuestionsHTML, verseModal } from './extras.js';
import { $, $$, esc, APP, NAV, S, reduce, first, avatar, timeAgo, toast, vibrate, myRead, meU, greeting, loadText, ICON, topbar, foot, burst, plural } from './ui.js';
import { userStats, readState, nextBadge, weekRange, lampLevel, LAMP_NAMES } from './stats.js';
import { chapterQuiz, vExam, examBanner, ttsSetup, shareVerseImage, drawCert } from './features.js';
import { vJourney } from './journey.js';
import { vAdmin } from './admin.js';
import { DEFS, ICO, shipMark, NIGHT, lamp, wellSVG, introLayers, seaWaves, starsHTML } from './ship.js';

document.body.insertAdjacentHTML('afterbegin', DEFS);

// ---------- تسجيل القراءة ----------
// يوم لسه ماجاش معادُه؟ (الجمعة مش يوم قراءة أصلًا)
const notYet = (n) => { const dd = DAYS.find((x) => x.n === n); return !!dd && dd.date > todayCairo(); };
async function markRead(n, btn) {
  if (notYet(n)) { toast('اليوم ده لسه ماجاش معاده… هتقدر تسجّله في ' + fmtDate(DAYS.find((x) => x.n === n).date) + ' 🙂'); return; }
  const before = new Set(myRead()); if (before.has(n)) return;
  const r = btn?.getBoundingClientRect(); if (r) burst(r.left + r.width / 2, r.top + r.height / 2);
  btn?.classList.add('pop'); vibrate([18, 40, 30]);
  document.querySelector('.wellc')?.classList.add('drawn');
  try { await api.setRead(n, true); } catch (e) { console.error(e); document.querySelector('.wellc')?.classList.remove('drawn'); btn?.classList.remove('pop'); saveFailed(e); return false; }
  const after = new Set([...before, n]);
  const got = BADGES.filter((b) => !b.test(before) && b.test(after));
  const dd = DAYS.find((x) => x.n === n);
  toast(n === dayToday()?.n ? 'الدلو طلع مليان… ربنا يبارك قرايتك 💧' : (dd && dd.date < todayCairo() ? `اليوم ${ar(n)} اتسجّل إنك قريته متأخر ✓` : `تمام! اليوم ${ar(n)} اتسجّل ✓`));
  if (got.length) setTimeout(() => badgeModal(got[0]), 900);
  return true;
}
// رسالة واضحة حسب سبب فشل الحفظ
function saveFailed(e) {
  const c = e && e.code;
  if (c === 'blocked') { S.me && (S.me.blocked = true); route(); return; }
  if (c === 'expired') { sessionExpired(); return; }
  if (!navigator.onLine) return toast('مفيش نت دلوقتي… اتصل بالنت وجرّب تاني');
  toast('حصلت مشكلة في الحفظ… جرّب تاني');
}
// المشترك اتمسح أو الجلسة باظت: نرجّعه لصفحة الدخول بنفس الاسم، ورقمه بيرجّعله كل بياناته
async function sessionExpired() {
  const name = S.me?.name || ''; try { await api.logout(); } catch (e) { /* ignore */ }
  S.me = null; S.prefillName = name; route(); toast('محتاجين تدخل رقمك تاني عشان نكمّل 🙏');
}
function vBlocked() {
  NAV.hidden = true;
  APP.innerHTML = `<div class="view"><section class="card empty" style="text-align:center;margin-top:40px"><div class="big">🚫</div><h2>الحساب ده موقوف</h2><p class="sub">${BLOCKED_MSG}</p></section></div>`;
}
const dayToday = () => { const s = status(); return s.phase === 'reading' ? s.day : null; };
function badgeModal(b) {
  const m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = `<div class="box"><div class="bigbadge">${ICO(b.icon)}</div><p class="eyebrow" style="margin-top:6px">شارة جديدة</p><h2 style="font-size:26px;margin:4px 0">${b.name}</h2><p class="muted">${b.desc}</p><button class="btn primary block" style="margin-top:18px">آمين 🙏</button></div>`;
  document.body.appendChild(m); const r = m.querySelector('.box').getBoundingClientRect(); burst(r.left + r.width / 2, r.top + 60, 120);
  m.addEventListener('click', (e) => { if (e.target === m || e.target.tagName === 'BUTTON') m.remove(); });
}

// ---------- النهارده ----------
// ---------- أنوار البحر: الكارت الصغير + البحر الكبير (بيتفتح بالضغط) ----------
const hashId = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } h ^= h >>> 16; h = Math.imul(h, 0x45d9f3b); h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 16; return h >>> 0; };
function seaBackdrop(p) {
  return `<svg class="sc" viewBox="0 0 320 120" preserveAspectRatio="none" aria-hidden="true">
  <defs><linearGradient id="${p}sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#030d1d"/><stop offset=".55" stop-color="#0A2A52"/><stop offset="1" stop-color="#0D4A8B"/></linearGradient>
  <radialGradient id="${p}mn"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#EAF6FC" stop-opacity="0"/></radialGradient>
  <linearGradient id="${p}bm" x1="0" x2="1"><stop offset="0" stop-color="#FFC857" stop-opacity=".7"/><stop offset="1" stop-color="#FFC857" stop-opacity="0"/></linearGradient>
  <linearGradient id="${p}wt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0D4A8B" stop-opacity=".55"/><stop offset="1" stop-color="#061A33"/></linearGradient></defs>
  <rect width="320" height="120" fill="url(#${p}sk)"/>
  <circle cx="276" cy="22" r="22" fill="url(#${p}mn)"/><circle cx="276" cy="22" r="9" fill="#F4FBFE"/><circle cx="272" cy="19" r="2" fill="#D6ECF6"/><circle cx="280" cy="25" r="1.4" fill="#D6ECF6"/>
  <g transform="translate(40 24)"><path class="bmx" d="M12 8L-34 -4V20Z" fill="url(#${p}bm)"/><path class="bmx b2" d="M12 8L58 -4V20Z" fill="url(#${p}bm)" style="transform:scaleX(-1);transform-origin:12px 8px"/>
    <path d="M7 36L9 12H15L17 36Z" fill="#F4FBFE"/><path d="M8 22H16V27H8Z" fill="#0D4A8B"/><rect x="8" y="6" width="8" height="7" rx="1" fill="#FFC857"/><path d="M6 6Q12 -2 18 6Z" fill="#0D4A8B"/><path d="M12 -2V-8M9.5 -5H14.5" stroke="#FFC857" stroke-width="1.4" stroke-linecap="round"/></g>
  <rect y="58" width="320" height="62" fill="url(#${p}wt)"/>
  <path d="M0 58H320" stroke="#8FD3F0" stroke-opacity=".55"/>
  <path d="M250 58V120" stroke="url(#${p}mn)" stroke-width="16" opacity=".28"/>
  <g fill="none" stroke="#8FD3F0" stroke-linecap="round"><path class="wvx" d="M-20 72q20-6 40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0" stroke-opacity=".3"/><path class="wvx w2" d="M-20 88q20-6 40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0" stroke-opacity=".22"/><path class="wvx w3" d="M-20 104q20-6 40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0" stroke-opacity=".16"/></g></svg>`;
}
function lightsHTML(n) {
  const list = S.users; const readers = list.filter((u) => (u.readDays || []).includes(n));
  const myOn = readers.some((u) => u.id === S.me.id);
  const lamps = readers.filter((u) => u.id !== S.me.id).map((u, i) => { const h = hashId(u.id); const x = 4 + ((h % 880) / 10), y = 58 + ((h >>> 5) % 28); return `<i class="lamp" style="left:${x.toFixed(1)}%;top:${y}%;animation-delay:${((i * .27) % 3).toFixed(2)}s"></i>`; }).join('');
  const me = myOn ? '<i class="lamp me" style="left:50%;top:60%"></i><span class="me-tag" style="left:calc(50% - 16px);top:38%">أنت</span>' : '';
  const others = readers.filter((u) => u.id !== S.me.id).slice(0, 3).map((u) => esc(first(u.name)));
  return `<div class="lights tap" id="lights" role="button" tabindex="0" aria-label="كبّر البحر وشوف كل الناس">${seaBackdrop('c')}${lamps}${me}${!readers.length ? '<p class="lights-empty">كن أول نور النهارده ✨</p>' : ''}<span class="expand">⤢ كبّر البحر</span></div>
  <p class="names"><b>${ar(readers.length)}</b> من ${ar(list.length)} قروا النهارده${others.length ? ` — ${others.join('، ')}${readers.length - (myOn ? 1 : 0) - others.length > 0 ? ` و${ar(readers.length - (myOn ? 1 : 0) - others.length)} كمان` : ''}` : ''}</p>`;
}
function openSea(n) {
  const t = todayCairo(); const all = S.users.map((u) => { const s = userStats(u, t); return { u, s, lvl: lampLevel(s), lit: (u.readDays || []).includes(n) }; });
  const lit = all.filter((x) => x.lit).length; const root = document.createElement('div'); root.className = 'seaview'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true');
  root.innerHTML = `<div class="sv-top"><div><h3>بحر النهارده</h3><p><b>${ar(lit)}</b> نور من ${ar(all.length)} · اضغط على أي فنار</p></div><button class="iconbtn" id="svx" aria-label="قفل">✕</button></div>
  <div class="sv-tabs"><button class="on" data-f="all">الكل</button><button data-f="lit">اللي قروا</button><button data-f="off">اللي لسه</button></div>
  <div class="sv-scene" id="svs"><div class="sv-sky"><div class="stars">${starsHTML(40, 80)}</div><div class="sv-moon"></div><div class="sv-far">${lamp(5)}</div>${shipMark('sv-ship', NIGHT + '--sh-heart-o:0')}</div>
    <div class="sv-water"><svg class="sv-waves" viewBox="0 0 720 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 22q45-22 90 0t90 0t90 0t90 0t90 0t90 0t90 0t90 0V60H0z" fill="#0D4A8B" opacity=".5"/></svg><div class="sv-lanterns" id="svl"></div></div></div>
  <div class="sv-info" id="svinfo">اضغط على أي فنار تشوف صاحبه 🏮</div>`;
  document.body.appendChild(root); document.body.style.overflow = 'hidden';
  const close = () => { root.classList.add('out'); document.body.style.overflow = ''; document.removeEventListener('keydown', esc2); setTimeout(() => root.remove(), 250); };
  const esc2 = (e) => { if (e.key === 'Escape') close(); }; document.addEventListener('keydown', esc2); $('#svx', root).onclick = close;
  const draw = (f) => {
    const arr = all.filter((x) => (f === 'lit' ? x.lit : f === 'off' ? !x.lit : true)).sort((a, b) => (a.u.id === S.me.id) - (b.u.id === S.me.id) || b.lvl - a.lvl || a.u.name.localeCompare(b.u.name, 'ar'));
    const per = 4, rowH = 120, rows = Math.max(1, Math.ceil(arr.length / per)); const box = $('#svl', root); box.style.height = (rows * rowH + 40) + 'px';
    box.innerHTML = arr.map((x, i) => { const r = Math.floor(i / per), c = i % per; const h = hashId(x.u.id); const sc = (.74 + .36 * (rows > 1 ? r / (rows - 1) : 1)).toFixed(2);
      const left = ((c + .5 + (r % 2 ? .25 : -.1)) / per) * 100 + ((h % 7) - 3); const top = r * rowH + 6 + ((h >>> 3) % 14);
      return `<button class="lt ${x.lit ? 'lit' : 'off'} ${x.u.id === S.me.id ? 'me' : ''}" data-id="${x.u.id}" style="left:${Math.max(15, Math.min(85, left)).toFixed(1)}%;top:${top}px;--s:${sc};animation-delay:${((i * .31) % 3).toFixed(2)}s"><span class="lt-svg">${lamp(x.lvl, true)}</span><span class="lt-refl"></span><span class="lt-name">${x.u.id === S.me.id ? 'أنت' : esc(first(x.u.name))}</span></button>`; }).join('') || '<p class="lights-empty" style="position:static;padding:40px 0">مفيش حد هنا لسه</p>';
    $$('.lt', box).forEach((b) => b.onclick = () => { const x = all.find((y) => y.u.id === b.dataset.id); const s = x.s; $$('.lt.sel', box).forEach((e) => e.classList.remove('sel')); b.classList.add('sel');
      $('#svinfo', root).innerHTML = `${avatar(x.u.name, 34)}<span class="grow"><b>${esc(x.u.name)}${x.u.id === S.me.id ? ' (أنت)' : ''}</b><small>فنار: ${LAMP_NAMES[x.lvl - 1]} · ${ar(s.onTime)} يوم في معاده${s.streak > 1 ? ` · ${ar(s.streak)} متتالي` : ''}</small></span><em class="${x.lit ? 'on' : ''}">${x.lit ? 'قرا النهارده ✓' : 'لسه'}</em>`; });
  };
  draw('all'); $$('.sv-tabs button', root).forEach((b) => b.onclick = () => { $$('.sv-tabs button', root).forEach((e) => e.classList.toggle('on', e === b)); draw(b.dataset.f); $('#svs', root).scrollTop = 0; });
}
function weekHTML() {
  const t = todayCairo(); const [s] = weekRange(t); const u = meU();
  const cells = Array.from({ length: 7 }, (_, i) => { const dt = addDays(s, i); const d = DAYS.find((x) => x.date === dt); let cls = 'off', ic = '';
    if (d) { const st = readState(u, d.n); if (st === 'ontime') { cls = 'ok'; ic = '✓'; } else if (st === 'late') { cls = 'late'; ic = '⏰'; } else if (dt < t) { cls = 'miss'; ic = '!'; } else if (dt === t) { cls = 'now'; ic = '•'; } else cls = 'fu'; }
    return `<a class="wd ${cls}" ${d && dt <= t ? `href="#/read/${d.n}"` : ''}><i>${ic}</i><span>${['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'][weekday(dt)]}</span><small>${ar(+dt.slice(8))}</small></a>`; });
  const w = weekRangeDays(t); const done = w.filter((d) => ['ontime', 'late'].includes(readState(u, d.n))).length;
  return `<section class="card week7"><div class="between"><h2>أسبوعك</h2><a class="chip" href="#/plan">الخطة</a></div><div class="wrow">${cells.join('')}</div>
    ${w.length ? `<div class="wbar"><i style="width:${Math.round(done / w.length * 100)}%"></i></div><p class="sub">${ar(done)} من ${ar(w.length)} — ${ar(Math.round(done / w.length * 100))}٪</p>` : ''}</section>`;
}
const weekRangeDays = (t) => { const [s, e] = weekRange(t); return DAYS.filter((d) => d.date >= s && d.date <= e && d.date <= t); };
function verseHTML(d) {
  const k = keyVerse(d.n); if (!k || !S.text) return '<section class="card vday" id="vday"></section>';
  const [c, v] = k; const txt = (S.text[c] && S.text[c][v - 1]) || ''; if (!txt) return '';
  return `<section class="card vday" id="vday"><div class="between"><h2>آية اليوم</h2><button class="chip" id="vshare">🖼️ شاركها صورة</button></div><q>${esc(txt)}</q><cite>تكوين ${ar(c)}: ${ar(v)}</cite></section>`;
}
function lampPreview() {
  const t = todayCairo(); const rows = S.users.map((u) => ({ u, s: userStats(u, t) })).sort((a, b) => b.s.onTime - a.s.onTime || b.s.read - a.s.read);
  const i = rows.findIndex((r) => r.u.id === S.me.id); if (i < 0 || rows.length < 2) return '';
  const me = rows[i]; const lvl = lampLevel(me.s);
  return `<a class="card lamppre" href="#/journey/lamps"><span class="lp">${lamp(lvl, true)}</span><span class="grow"><b>فنارك: ${LAMP_NAMES[lvl - 1]} · ترتيبك ${ar(i + 1)} من ${ar(rows.length)}</b>
    <small>الأوائل: ${rows.slice(0, 3).map((r) => esc(first(r.u.name))).join('، ')}</small></span>${ICON.back}</a>`;
}
function familyHTML() {
  const vs = S.wall.filter((w) => w.type === 'verse').sort((a, b) => b.at - a.at).slice(0, 2); const rf = S.wall.filter((w) => w.type === 'reflection').length;
  if (!vs.length && !rf) return '';
  return `<section class="card fam"><div class="between"><h2>آيات لمستنا</h2><a class="chip" href="#/wall">الكل</a></div>
    ${vs.map((w) => `<div class="famv">${avatar(w.name, 30)}<span class="grow"><b>${esc(first(w.name))}</b> لمسته آية${w.ref ? ` <small>${esc(w.ref)}</small>` : ''}<em>«${esc(w.text.length > 90 ? w.text.slice(0, 90) + '…' : w.text)}»</em></span></div>`).join('')}
    ${rf ? `<a class="famp" href="#/wall">✍️ فيه ${ar(rf)} ${plural(rf, 'تأمل', 'تأملات')} من الأسرة</a>` : ''}</section>`;
}
function quizCTA(d) {
  const keys = d.ch.map(String).filter((k) => (S.chq[k]?.questions || []).length && !(meU().quiz || {})[k]);
  if (!keys.length) return '';
  return `<a class="card cta" href="#/read/${d.n}"><span class="ei">💡</span><span class="grow"><b>فيه أسئلة على قراءة النهارده</b><small>اقرا وبعدين «اختبر نفسك» تحت الأصحاح</small></span>${ICON.back}</a>`;
}
function nudgeHTML() {
  const nb = nextBadge(myRead()); if (!nb) return '';
  return `<a class="nudge" href="#/journey/sea">✨ فاضلك ${ar(nb.left)} ${plural(nb.left, 'يوم', 'أيام')} على شارة «${nb.name}»</a>`;
}
function countdownHTML() {
  const t = todayCairo(); const d = diffDays(t, END); if (d < 0) return '';
  const left = DAYS.filter((x) => x.date >= t).length;
  return `<section class="card"><p class="eyebrow">على نهاية الرحلة · ${fmtDate(END, true)}</p><div class="count"><div><b>${ar(d)}</b><span>يوم على الميناء الأخير</span></div><div><b>${ar(left)}</b><span>يوم قراءة فاضل</span></div><div><b>${ar(myRead().size)}</b><span>من ${ar(TOTAL)} قريتهم</span></div></div></section>`;
}
function missedHTML() {
  const r = myRead(); const t = todayCairo(); const miss = dueDays(t).filter((d) => d.date < t && !r.has(d.n));
  if (!miss.length) return '';
  return `<section class="card"><div class="between"><h2>فاتك ${ar(miss.length)} ${plural(miss.length, 'يوم', 'أيام')}</h2><a class="chip" href="#/plan">الخطة كلها</a></div><p class="sub">ولا يهمك… تقدر تقراهم دلوقتي، وهيتسجلوا إنك قريتهم متأخر.</p>
  ${miss.slice(0, 3).map((d) => `<a class="pday missed" href="#/read/${d.n}" style="margin-top:10px"><span class="n">${ar(d.n)}</span><span class="t"><b>${chLabel(d)}</b><small>${dayTitle(d)} · ${fmtDate(d.date)}</small></span></a>`).join('')}</section>`;
}
function reflHTML(n) {
  const x = S.days[n]; if (!x || !(x.reflection || x.question)) return '';
  return `<section class="card refl"><p class="eyebrow">كلمة النهارده</p>${x.reflection ? `<blockquote>${esc(x.reflection)}</blockquote>` : ''}${x.question ? `<div class="q">💭 ${esc(x.question)}</div>` : ''}</section>`;
}
const wellCard = (drawn) => `<section class="wellc ${drawn ? 'drawn' : ''}"><div class="wsvg">${wellSVG('t')}</div><div class="wtxt"><div class="eb">ينبوع الحياة · يوحنا ٤</div><h3>المسيح مصدر حياتنا</h3>
  <q>بَلِ الْمَاءُ الَّذِي أُعْطِيهِ يَصِيرُ فِيهِ يَنْبُوعَ مَاءٍ يَنْبَعُ إِلَى حَيَاةٍ أَبَدِيَّةٍ</q><cite>يوحنا ٤: ١٤</cite><p>زي السامرية عند البئر… اشرب من كلمته كل يوم.</p></div></section>`;

function vToday() {
  const st = status(); const r = myRead(); const name = first(S.me.name);
  const scene = `<div class="scene"><svg viewBox="0 0 360 230" preserveAspectRatio="none" class="waves"><path d="M0 108q45-16 90 0t90 0t90 0t90 0V230H0z" fill="#0A2A52" opacity=".8"/><path d="M0 130q45-14 90 0t90 0t90 0t90 0V230H0z" fill="#061A33" opacity=".92"/></svg>${shipMark('hship ship-bob', NIGHT + '--sh-heart-o:0')}</div>`;
  let hero = '', well = '';
  if (st.phase === 'reading') {
    const d = st.day; const done = r.has(d.n);
    hero = `<section class="hero"><div class="stars" aria-hidden="true">${starsHTML(26, 55)}</div><div class="eyebrow">اليوم ${ar(d.n)} من ${ar(TOTAL)} · ${fmtDate(d.date)}</div><h2>${chLabel(d)}</h2><div class="sub">${dayTitle(d)}</div>
      <div class="prog"><i style="width:${(r.size / TOTAL) * 100}%"></i></div>${scene}
      <div class="ctas"><a class="btn glass" href="#/read/${d.n}">اقرا الأصحاح</a><button class="btn ${done ? 'done on' : 'done'} readbtn" id="readNow" ${done ? 'disabled' : ''}>${done ? 'اتسجلت ✓' : 'قريت ✓'}</button></div></section>`;
    well = wellCard(done);
  } else if (st.phase === 'before') {
    hero = `<section class="hero"><div class="stars" aria-hidden="true">${starsHTML(26, 55)}</div><div class="eyebrow">الرحلة لسه هتبدأ</div><h2>فاضل ${ar(st.daysLeft)} ${plural(st.daysLeft, 'يوم', 'أيام')}</h2><div class="sub">البداية ${fmtDate(START, true, true)} من سفر التكوين</div>${scene}</section>`;
    well = wellCard(false);
  } else if (st.phase === 'rest') {
    hero = `<section class="hero"><div class="stars" aria-hidden="true">${starsHTML(26, 55)}</div><div class="eyebrow">${fmtDate(todayCairo())}</div><h2>النهارده راحة</h2><div class="sub">مفيش أصحاح في يوم الجمعة. بكرة نكمل: ${st.next ? `${chLabel(st.next)} — ${dayTitle(st.next)}` : ''}</div>${scene}${st.prev && !r.has(st.prev.n) ? `<div class="ctas"><a class="btn glass" href="#/read/${st.prev.n}">كمّل ${chLabel(st.prev)}</a></div>` : ''}</section>`;
    well = wellCard(false);
  } else {
    hero = `<section class="hero"><div class="stars" aria-hidden="true">${starsHTML(26, 55)}</div><div class="eyebrow">الرحلة خلصت</div><h2>كل سنة وانت طيب ✨</h2><div class="sub">قريت ${ar(r.size)} من ${ar(TOTAL)} يوم</div>${scene}<div class="ctas"><a class="btn glass" href="#/me">شوف شهادتك</a></div></section>`;
    well = wellCard(true);
  }
  APP.innerHTML = `<div class="view">${topbar()}<div class="stagger"><div class="hello"><h1>${greeting()} يا ${esc(name)}</h1><p>${st.phase === 'reading' ? 'جاهز لرحلة النهارده؟' : 'خليك قريب… الرحلة مستمرة.'}</p></div>${st.phase === 'reading' ? nudgeHTML() : ''}<div id="exb"></div>${hero}${well}
    ${st.phase === 'reading' ? `<section class="card"><div class="between"><h2>أنوار البحر</h2><span class="sub">كل واحد يقرا يطلع نوره</span></div>${lightsHTML(st.day.n)}</section>${reflHTML(st.day.n)}${verseHTML(st.day)}${weekHTML()}${quizCTA(st.day)}` : weekHTML()}
    ${lampPreview()}${familyHTML()}<a class="card cta" href="#/wall/ask"><span class="ei">❓</span><span class="grow"><b>عندك سؤال أو محتاج تفسير لآية؟</b><small>اسأل المسؤولين، والرد هيوصلك على الواتساب</small></span>${ICON.back}</a>${missedHTML()}${countdownHTML()}${foot()}</div></div>`;
  $('#readNow')?.addEventListener('click', async (e) => { const b = e.currentTarget; if (b.disabled) return; b.disabled = true; if (!(await markRead(st.day.n, b))) b.disabled = false; });
  const lg = $('#lights'); if (lg && st.phase === 'reading') { lg.addEventListener('click', () => openSea(st.day.n)); lg.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSea(st.day.n); } }); }
  examBanner($('#exb'));
  if (st.phase === 'reading') {
    const hook = () => { const k = keyVerse(st.day.n); $('#vshare')?.addEventListener('click', () => { const [c, v] = k; shareVerseImage(S.text[c][v - 1], `تكوين ${ar(c)}: ${ar(v)}`); }); };
    if (S.text) hook(); else loadText().then(() => { const el = $('#vday'); if (el) { el.outerHTML = verseHTML(st.day); hook(); } });
  }
}

// ---------- قراءة جوه الموقع ----------
async function vRead(n, tab = 0) {
  const d = DAYS.find((x) => x.n === +n); if (!d) { location.hash = '#/today'; return; }
  // أصحاح يوم لسه ماجاش: مقفول تمامًا (مفيش نص ولا أسئلة ولا صوت)، لحد ما يومه ييجي
  if (notYet(d.n)) {
    APP.innerHTML = `<div class="view reader"><div class="rhead"><a class="iconbtn" href="#/today" aria-label="رجوع">${ICON.back}</a><span class="sp"></span><div class="tabs grow"><span class="tab on">${chLabel(d)}</span></div></div>
      <section class="card empty" style="text-align:center;margin-top:24px"><div class="big">🔒</div><h2>الأصحاح ده لسه مقفول</h2>
      <p class="sub">بيتفتح يوم ${fmtDate(d.date)}. خلّينا نمشي مع بعض يوم بيوم 🙂</p><a class="btn primary block" style="margin-top:14px" href="#/today">ارجع لقراءة النهارده</a></section></div>`;
    scrollTo(0, 0); return;
  }
  tab = Math.min(+tab || 0, d.ch.length - 1);
  APP.innerHTML = `<div class="view reader"><div class="rhead"><a class="iconbtn" href="#/today" aria-label="رجوع">${ICON.back}</a><span class="sp"></span><div class="tabs grow">${d.ch.map((c, i) => `<a class="tab ${i === tab ? 'on' : ''}" href="#/read/${d.n}/${i}">تكوين ${ar(c)}</a>`).join('')}</div>
    <button class="iconbtn" id="tts" aria-label="اسمع الأصحاح">${ICON.ear}</button><button class="iconbtn" id="night" aria-label="وضع القراءة الليلي">${ICON.moon}</button><button class="iconbtn" id="fsm" aria-label="تصغير الخط">${ICON.minus}</button><button class="iconbtn" id="fsp" aria-label="تكبير الخط">${ICON.plus}</button></div>
    <div class="chapter" id="chap"><p class="muted" style="text-align:center;margin-top:40px">بيحمّل…</p></div></div>`;
  const T = await loadText(); const c = d.ch[tab]; const vs = T[c];
  const chapEl = $('#chap'); if (!chapEl) return;
  const late = d.date < todayCairo();
  chapEl.innerHTML = `<p class="eyebrow" style="text-align:center">اليوم ${ar(d.n)} — ${fmtDate(d.date)}${late && !myRead().has(d.n) ? ' · هيتسجل متأخر' : ''}</p><h2>سفر التكوين</h2><div class="orn">الأصحاح ${ar(c)} · ${CH_TITLES[c - 1]}</div>
    <div class="text" style="--fs:${S.fs}px">${vs.map((v, i) => `<span class="v" data-v="${i + 1}" data-t="${esc(v)}"><sup>${ar(i + 1)}</sup>${esc(v)}</span> `).join('')}</div><div id="cquiz"></div>
    <div class="endread">${tab < d.ch.length - 1 ? `<a class="btn primary block" href="#/read/${d.n}/${tab + 1}">الأصحاح اللي بعده ←</a>` : (myRead().has(d.n) ? `<button class="btn done on block" disabled>${ICON.check} قريت اليوم ده</button>` : '<button class="btn red block readbtn" id="rdone">خلّصت… قريت ✓</button>')}
    <p class="hint">دوس على أي آية عشان تختارها: تشاركها في «آيات لمستنا»، أو تسأل المسؤولين عنها</p></div>
    <div class="selbar" id="selbar"><button class="btn light" id="share">✨ آية لمستني</button><button class="btn light" id="simg">🖼️ صورة</button><button class="btn light" id="sask">❓ اسأل</button><button class="btn ghost" id="copy">نسخ</button></div>`;
  $$('body > .selbar').forEach((x) => x.remove()); document.body.appendChild($('#selbar')); // الشريط لازم يعيش برّه العنصر المتحرك عشان position:fixed يتحسب من الشاشة
  const sel = new Set(); const upd = () => $('#selbar').classList.toggle('show', sel.size > 0);
  $$('.v', chapEl).forEach((el) => el.addEventListener('click', () => { const k = +el.dataset.v; sel.has(k) ? sel.delete(k) : sel.add(k); el.classList.toggle('sel'); upd(); }));
  const selText = () => { const ks = [...sel].sort((a, b) => a - b); return { text: ks.map((k) => vs[k - 1]).join(' '), ref: `تكوين ${ar(c)}: ${ar(ks[0])}${ks.length > 1 ? '-' + ar(ks[ks.length - 1]) : ''}` }; };
  $('#share').onclick = async () => { const s = selText(); try { await api.post('verse', s.text, s.ref); } catch (e) { console.error(e); return saveFailed(e); } toast('اتشاركت في «آيات لمستنا» ✨'); $$('.v.sel').forEach((x) => x.classList.replace('sel', 'mark')); sel.clear(); upd(); };
  $('#simg').onclick = async () => { const s = selText(); await shareVerseImage(s.text, s.ref); };
  $('#sask').onclick = () => { const s = selText(); askModal(s); $$('.v.sel').forEach((x) => x.classList.remove('sel')); sel.clear(); upd(); };
  ttsSetup($('#tts'), $$('.v', chapEl));
  chapterQuiz($('#cquiz'), String(c), `تكوين ${ar(c)}`);
  const applyNight = () => document.body.classList.toggle('night', !!S.night); try { S.night = localStorage.getItem('ruh:night') === '1'; } catch (e) { /* ignore */ } applyNight();
  $('#night').onclick = () => { S.night = !S.night; applyNight(); try { localStorage.setItem('ruh:night', S.night ? '1' : '0'); } catch (e) { /* ignore */ } };
  $('#copy').onclick = async () => { const s = selText(); try { await navigator.clipboard.writeText(`«${s.text}» (${s.ref})`); toast('اتنسخت'); } catch (e) { toast('مش قادر أنسخ هنا'); } };
  $('#rdone')?.addEventListener('click', async (e) => { const b = e.currentTarget; if (b.disabled) return; b.disabled = true; const ok = await markRead(d.n, b); if (ok) setTimeout(() => { location.hash = '#/today'; }, 1500); else b.disabled = false; });
  const setFs = (v) => { S.fs = Math.max(16, Math.min(32, v)); $('.text').style.setProperty('--fs', S.fs + 'px'); try { localStorage.setItem('ruh:fs', S.fs); } catch (e) { /* ignore */ } };
  $('#fsp').onclick = () => setFs(S.fs + 2); $('#fsm').onclick = () => setFs(S.fs - 2);
  scrollTo(0, 0);
}

// ---------- الخطة ----------
function vPlan() {
  const r = myRead(); const t = todayCairo(); let html = ''; let wk = -1;
  DAYS.forEach((x) => {
    const w = weekOf(x.n);
    if (w !== wk) { if (wk >= 0) html += '</div>'; wk = w; html += `<div class="week"><h3>الأسبوع ${ar(w + 1)}، من ${fmtDate(x.date, false)}</h3>`; }
    const cls = r.has(x.n) ? 'done' : x.date === t ? 'today' : x.date < t ? 'missed' : 'future';
    const fu = x.date > t; // الأيام الجاية: من غير لينك، وبقفل
    html += `<${fu ? 'div' : 'a'} class="pday ${cls}" ${fu ? `data-lock="${x.n}" aria-disabled="true"` : `href="#/read/${x.n}"`}><span class="n">${ar(x.n)}</span><span class="t"><b>${chLabel(x)} — ${dayTitle(x)}</b><small>${fmtDate(x.date)}${r.has(x.n) && readState(meU(), x.n) === 'late' ? ' <i class="latepill">قريته متأخر</i>' : ''}</small></span>${cls === 'done' ? `<span class="check">${ICON.check}</span>` : cls === 'missed' ? '<span class="st">كمّله</span>' : cls === 'today' ? '<span class="st">النهارده</span>' : fu ? '<span class="st">🔒</span>' : ''}</${fu ? 'div' : 'a'}>`;
  });
  html += '</div>';
  APP.innerHTML = `<div class="view">${topbar()}<div class="hello"><h1>الخطة كلها</h1><p>${ar(TOTAL)} يوم من ${fmtDate(START, false)} لحد ${fmtDate(END, false, true)}، وبنرتاح يوم الجمعة</p></div>
  <div class="card" style="padding:14px 16px"><div class="between"><span class="sub">قريت</span><b>${ar(r.size)} / ${ar(TOTAL)}</b></div><div class="prog light"><i style="width:${(r.size / TOTAL) * 100}%"></i></div></div>${html}${foot()}</div>`;
  $$('[data-lock]').forEach((el) => el.onclick = () => { const x = DAYS.find((y) => y.n === +el.dataset.lock); toast(`🔒 بيتفتح يوم ${fmtDate(x.date)}`); });
  const tEl = $('.pday.today'); if (tEl) setTimeout(() => tEl.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' }), 300);
}

// ---------- آيات لمستنا / طلبات الصلاة / اسأل المسؤولين ----------
const amenSet = () => { try { return new Set(JSON.parse(localStorage.getItem('ruh:amen') || '[]')); } catch (e) { return new Set(); } };
const PRAYER_VERSE = '<blockquote class="vp-text pverse"><p>«وَصَلُّوا بَعْضُكُمْ لأَجْلِ بَعْضٍ، لِكَيْ تُشْفَوْا. طَلِبَةُ الْبَارِّ تَقْتَدِرُ كَثِيرًا فِي فِعْلِهَا»</p><cite>يعقوب ٥: ١٦</cite></blockquote>';
// تفاعلات «آيات لمستنا»: واحد لكل شخص، والضغط على نفس التفاعل بيشيله
function reactBar(w) {
  const r = w.reacts || {}; const mineK = r[api.myUid()]?.t; const n = Object.keys(r).length;
  const cnt = {}; Object.values(r).forEach((x) => { cnt[x.t] = (cnt[x.t] || 0) + 1; });
  const top = REACTS.filter((x) => cnt[x.k]).sort((a, b) => cnt[b.k] - cnt[a.k]).slice(0, 3);
  const mine = REACTS.find((x) => x.k === mineK);
  return `<div class="rbar">${n ? `<button class="rsum" data-who="${w.id}" aria-label="مين تفاعل"><span class="re">${top.map((x) => x.e).join('')}</span>${ar(n)}</button>` : '<span></span>'}
    <button class="rbtn ${mine ? 'on' : ''}" data-rx="${w.id}">${mine ? `${mine.e} ${mine.t}` : '🙏 تفاعل'}</button></div>`;
}
function wireReacts() {
  $$('[data-rx]').forEach((b) => b.onclick = (ev) => {
    ev.stopPropagation(); $$('.rpick').forEach((x) => x.remove());
    const id = b.dataset.rx; const w = S.wall.find((x) => x.id === id); const cur = w?.reacts?.[api.myUid()]?.t;
    const p = document.createElement('div'); p.className = 'rpick';
    p.innerHTML = REACTS.map((x, i) => `<button data-k="${x.k}" class="${cur === x.k ? 'on' : ''}" style="--d:${i * 35}ms" aria-label="${x.t}"><span>${x.e}</span><small>${x.t}</small></button>`).join('');
    b.closest('.post').appendChild(p);
    const close = () => { p.remove(); document.removeEventListener('click', close); }; setTimeout(() => document.addEventListener('click', close), 0);
    $$('button', p).forEach((x) => x.onclick = async (e) => {
      e.stopPropagation(); const k = x.dataset.k; const R = REACTS.find((y) => y.k === k); close(); vibrate(12);
      const r = x.getBoundingClientRect(); burst(r.left + r.width / 2, r.top, 18);
      const ok = await api.react(id, cur === k ? null : k); if (!ok) return toast('مقدرناش نسجّل تفاعلك، جرّب تاني');
      if (cur !== k) toast(`${R.e} ${R.v}`);
    });
  });
  $$('[data-who]').forEach((b) => b.onclick = () => {
    const w = S.wall.find((x) => x.id === b.dataset.who); if (!w) return; const r = Object.values(w.reacts || {});
    const m = document.createElement('div'); m.className = 'modal';
    m.innerHTML = `<div class="box whobox"><h2>التفاعلات</h2>${REACTS.filter((x) => r.some((y) => y.t === x.k)).map((x) => `<div class="whog"><p><b>${x.e} ${x.t}</b> <small>${esc(x.v)}</small></p><div>${r.filter((y) => y.t === x.k).map((y) => `<span class="chip">${esc(first(y.n || ''))}</span>`).join('')}</div></div>`).join('')}<button class="btn ghost block" id="wcl" style="margin-top:12px">قفل</button></div>`;
    document.body.appendChild(m); m.onclick = (e) => { if (e.target === m) m.remove(); }; $('#wcl', m).onclick = () => m.remove();
  });
}
async function vWall(tabArg) {
  if (['verse', 'prayer', 'ask'].includes(tabArg)) S.wallTab = tabArg;
  if (!['verse', 'prayer', 'ask'].includes(S.wallTab)) S.wallTab = 'verse';
  const tab = S.wallTab; const am = amenSet(); const myU = api.myUid();
  const list = S.wall.filter((w) => (tab === 'verse' ? (w.type === 'verse' || w.type === 'reflection') : w.type === tab)).sort((a, b) => b.at - a.at);
  const pending = (S.myq || []).filter((q) => q.status !== 'answered').length;
  const mine = (w) => (w.uid ? w.uid === myU : w.userId === S.me.id);
  const post = (w) => {
    const anon = w.type === 'prayer'; const who = anon ? initialOf(w.name) : w.name;
    return `<article class="card post ${w.type}"><div class="who">${anon ? `<span class="av anon" style="width:38px;height:38px;font-size:17px">${esc(who.replace('.', ''))}</span>` : avatar(w.name)}<div class="grow"><b>${esc(who)}</b><div class="sub" style="font-size:12px">${anon ? 'واحد من الأسرة، ' : ''}${timeAgo(w.at)}</div></div>${(mine(w) || S.admin) ? `<button class="chip" data-del="${w.id}" aria-label="حذف">حذف</button>` : ''}</div>
    <p class="txt ${w.type === 'verse' ? 'verse-q' : ''}">${w.type === 'verse' ? '«' + esc(w.text) + '»' : esc(w.text)}</p>${w.ref ? `<p class="ref">${esc(w.ref)}</p>` : ''}${w.note ? `<p class="note">💭 ${esc(w.note)}</p>` : ''}
    ${anon ? `<div class="foot"><span class="sub">${ar(w.amens || 0)} صلّوا</span><button class="amen ${am.has(w.id) ? 'did' : ''}" data-amen="${w.id}">${am.has(w.id) ? 'صلّيت ✓' : '🙏 صلّيت'}</button></div>` : reactBar(w)}</article>`;
  };
  const compose = {
    verse: `<button class="card compose-cta" id="vnew"><span class="ei">✨</span><span class="grow"><b>شارك آية لمستك</b><small>اختار الآية من الكتاب، واكتب ليه لمستك</small></span><span class="plus">＋</span></button>`,
    prayer: `${PRAYER_VERSE}<section class="card compose"><textarea id="ptext" maxlength="400" placeholder="اكتب طلبتك… وإحنا هنصلّي لك">${esc(S.prayDraft || '')}</textarea><p class="hint" style="margin:6px 2px 0">🔒 اسمك مش هيظهر، هيظهر أول حرف منه بس.</p>
      <button class="btn primary block" id="psend" style="margin-top:10px">اطلب صلاة</button></section>`,
    ask: `<section class="card ask-cta"><div class="big">❓</div><h2>عندك سؤال أو محتاج تفسير لآية؟</h2><p class="sub">اسأل المسؤولين، والرد هيوصلك على الواتساب. سؤالك محدش بيشوفه غير المسؤولين.</p><button class="btn red block" id="ask">اسأل دلوقتي</button>
      <p class="hint" style="margin-top:8px">ممكن كمان وإنت بتقرا: دوس على الآية واختار «❓ اسأل».</p></section><h3 class="ch3" style="margin:16px 4px 8px">أسئلتي</h3>`,
  }[tab];
  APP.innerHTML = `<div class="view">${topbar()}<div class="hello"><h1>الأسرة</h1><p>«احملوا بعضكم أثقال بعض»</p></div>
  <div class="seg three" role="tablist"><button class="${tab === 'verse' ? 'on' : ''}" data-t="verse">✨ آيات لمستنا</button><button class="${tab === 'prayer' ? 'on' : ''}" data-t="prayer">🙏 طلبات صلاة</button><button class="${tab === 'ask' ? 'on' : ''}" data-t="ask">❓ اسأل${pending ? ` <i class="dot">${ar(pending)}</i>` : ''}</button></div>
  ${compose}
  <div class="stagger">${tab === 'ask' ? myQuestionsHTML(S.myq || []) : list.length ? list.map(post).join('') : '<div class="card" style="text-align:center"><p class="muted">لسه مفيش حاجة هنا… كن أول واحد يشارك 🤍</p></div>'}</div>${foot()}</div>`;
  $$('.seg button').forEach((b) => b.onclick = () => { location.hash = '#/wall/' + b.dataset.t; });
  $$('[data-amen]').forEach((b) => b.onclick = async () => { const id = b.dataset.amen; const s = amenSet(); if (s.has(id)) return; s.add(id); localStorage.setItem('ruh:amen', JSON.stringify([...s])); vibrate(15); const r = b.getBoundingClientRect(); burst(r.left + r.width / 2, r.top, 30); try { await api.amen(id); } catch (e) { console.error(e); s.delete(id); localStorage.setItem('ruh:amen', JSON.stringify([...s])); saveFailed(e); } });
  $$('[data-del]').forEach((b) => b.onclick = async () => { if (b.dataset.sure) { await api.removePost(b.dataset.del); toast('اتمسح'); } else { b.dataset.sure = '1'; b.textContent = 'متأكد؟'; b.style.color = 'var(--heart)'; setTimeout(() => { delete b.dataset.sure; b.textContent = 'حذف'; b.style.color = ''; }, 3000); } });
  if (tab === 'ask') { $('#ask').onclick = () => askModal(); return; }
  if (tab === 'prayer') {
    $('#ptext').oninput = (e) => { S.prayDraft = e.target.value; };
    $('#psend').onclick = async () => { const t = $('#ptext').value.trim(); if (t.length < 3) return toast('اكتب طلبتك الأول 🙂'); $('#psend').disabled = true; try { await api.post('prayer', t, ''); } catch (e) { console.error(e); $('#psend').disabled = false; return saveFailed(e); } S.prayDraft = ''; $('#ptext').value = ''; $('#psend').disabled = false; toast('طلبتك وصلت… هنصلّي لك 🙏'); };
    return;
  }
  $('#vnew').onclick = () => verseModal();
  wireReacts();
}

// ---------- أنا ----------
function vMe() {
  const r = myRead(); const us = userStats(meU()); const st = streak(r); const got = BADGES.filter((b) => b.test(r)); const pct = r.size / TOTAL; const C = 2 * Math.PI * 78; const lvl = lampLevel(us);
  APP.innerHTML = `<div class="view">${topbar()}<div class="stagger"><section class="card" style="text-align:center"><div class="row" style="justify-content:center">${avatar(S.me.name, 54)}<div style="text-align:right"><h2 style="margin:0">${esc(S.me.name)}</h2><span class="sub">في الرحلة من ${fmtDate(START, false)}</span></div></div>
    <div class="ring"><svg width="180" height="180"><circle cx="90" cy="90" r="78" fill="none" stroke="#D6ECF6" stroke-width="14"/><circle cx="90" cy="90" r="78" fill="none" stroke="url(#rg)" stroke-width="14" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}" style="transition:stroke-dashoffset 1.4s var(--ease)" transform="rotate(-90 90 90)"/><defs><linearGradient id="rg"><stop offset="0" stop-color="#5BB6DD"/><stop offset="1" stop-color="#0D4A8B"/></linearGradient></defs></svg>
    <div class="c"><div><b>${ar(Math.round(pct * 100))}٪</b><span>من الرحلة</span></div></div></div>
    <div class="stats"><div class="stat"><b>${ar(us.onTime)}</b><span>في معاده</span></div><div class="stat"><b>${ar(us.late)}</b><span>متأخر</span></div><div class="stat"><b>${ar(st)}</b><span>أيام متتالية</span></div><div class="stat"><b>${ar(got.length)}</b><span>شارة</span></div><div class="stat"><b>${us.qt ? ar(us.qc) + '<small>/' + ar(us.qt) + '</small>' : '—'}</b><span>أسئلة صح</span></div><div class="stat"><b>${ar(us.points)}</b><span>نقطة نور</span></div></div></section>
    <section class="card mylamp"><span class="lp">${lamp(lvl, true)}</span><div><h2>فنارك: ${LAMP_NAMES[lvl - 1]}</h2><p class="sub">بيزيد نوره كل ما تقرا في معادك.</p><a class="chip" href="#/journey/lamps">لوحة الأمناء</a></div></section>
    <section class="card"><h2>الشارات</h2><div class="badges">${BADGES.map((b) => `<div class="badge ${b.test(r) ? 'got' : ''}"><i>${ICO(b.icon)}</i><b>${b.name}</b><small>${b.desc}</small></div>`).join('')}</div></section>
    <section class="card"><h2>شهادة إتمام الرحلة</h2><p class="sub">${r.size >= TOTAL ? 'مبروك! خلّصت السفر كله 🎉' : `هتتفتح لما تخلّص الـ${ar(TOTAL)} يوم — فاضل ${ar(TOTAL - r.size)}`}</p><button class="btn ${r.size >= TOTAL ? 'red' : 'ghost'} block" id="cert" style="margin-top:12px">${r.size >= TOTAL ? 'حمّل شهادتك' : 'شوف شكل الشهادة'}</button></section>
    <section class="card"><h2>بياناتي</h2><div class="field" style="margin-top:10px"><input id="nm" value="${esc(S.me.name)}" placeholder=" " maxlength="40"><label for="nm">الاسم</label></div>
    <div class="actions" style="margin-top:4px"><button class="btn primary" id="save">حفظ الاسم</button><button class="btn ghost" id="out">خروج</button></div></section>${foot()}</div></div>`;
  $('#cert').onclick = () => certModal(r.size >= TOTAL);
  $('#save').onclick = async () => { const n = $('#nm').value.trim(); if (n.length < 2) return toast('اكتب اسمك'); try { await api.rename(n); toast('اتحفظ ✓'); } catch (e) { console.error(e); saveFailed(e); } };
  $('#out').onclick = async () => { await api.logout(); S.me = null; route(); };
}
function certModal(real) {
  const m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = `<div class="box cert"><h2>${real ? 'شهادتك 🎉' : 'شكل الشهادة'}</h2><canvas id="cv" width="1600" height="1130"></canvas><div class="actions"><button class="btn red" id="dl" ${real ? '' : 'disabled'}>تحميل</button><button class="btn ghost" id="cl">قفل</button></div></div>`;
  document.body.appendChild(m); m.querySelector('#cl').onclick = () => m.remove(); m.onclick = (e) => { if (e.target === m) m.remove(); };
  drawCert(m.querySelector('#cv'), real).then(() => { m.querySelector('#dl').onclick = () => { const a = document.createElement('a'); a.download = 'شهادة-روح-وحياة.png'; a.href = m.querySelector('#cv').toDataURL('image/png'); a.click(); }; });
}

// ---------- التسجيل + الافتتاحية 3D ----------
function vOnboard() {
  NAV.hidden = true; APP.classList.add('full');
  APP.innerHTML = `<div class="onb view" id="onb"><div class="sky night"></div><div class="sky dawn"></div><div class="stars" aria-hidden="true">${starsHTML(48, 45)}</div>
    <div class="sea" aria-hidden="true">${seaWaves()}</div>
    <div class="stage" aria-hidden="true"><div class="world" id="world">${introLayers()}</div></div>
    <div class="otitle"><h1>روح وحياة</h1><div class="en">SPIRIT &amp; LIFE</div><p class="verse">«الكَلامُ الَّذي أُكَلِّمُكُمْ بهِ هو روحٌ وحَياةٌ»<small>يوحنا ٦: ٦٣</small></p></div>
    <form class="oform" id="oform" novalidate>
      <div class="field"><input id="iname" autocomplete="name" placeholder=" " maxlength="40" required value="${esc(S.prefillName || '')}"><label for="iname">اسمك</label></div>
      <div class="field"><input id="iphone" type="tel" inputmode="tel" autocomplete="tel" placeholder=" " maxlength="14" required><label for="iphone">رقم الموبايل</label></div>
      <p class="err" id="oerr"></p>
      <button class="btn red block" id="ogo">يلا نبدأ الرحلة</button>
      <p class="hint">رقمك بيخليك تدخل من أي موبايل لو مسحت الكاش، وبيشوفه المسؤولين بس.${mode === 'demo' ? '<br><b>وضع تجريبي:</b> البيانات على جهازك بس.' : ''}</p>
    </form><button class="skip" id="skip" type="button">تخطّي</button></div>`;
  const onb = $('#onb'); const finish = () => { onb.getAnimations({ subtree: true }).forEach((a) => { if (a.effect?.getTiming().iterations !== Infinity) { try { a.finish(); } catch (e) { /* ignore */ } } }); onb.classList.add('ready'); };
  requestAnimationFrame(() => { onb.classList.add('play'); if (reduce) setTimeout(finish, 60); });
  $('#skip').onclick = finish; $('#world').addEventListener('click', finish);
  setTimeout(() => onb.classList.add('ready'), 7600);
  $('#oform').addEventListener('submit', async (e) => {
    e.preventDefault(); const n = $('#iname').value.trim(); const p = normPhone($('#iphone').value);
    if (n.length < 2) return ($('#oerr').textContent = 'اكتب اسمك');
    if (!validPhone(p)) return ($('#oerr').textContent = 'رقم الموبايل لازم يكون ١١ رقم ويبدأ بـ 01');
    $('#oerr').textContent = ''; $('#ogo').disabled = true; $('#ogo').textContent = 'لحظة…';
    try { S.me = await api.login(n, p); const r = $('#ogo').getBoundingClientRect(); burst(r.left + r.width / 2, r.top, 140); setTimeout(() => { APP.classList.remove('full'); if (!/^#\/(admin|khadem|exam)/.test(location.hash)) location.hash = '#/today'; route(); }, 700); }
    catch (err) { console.error(err); $('#oerr').textContent = err.code === 'blocked' ? BLOCKED_MSG : !navigator.onLine ? 'مفيش نت دلوقتي… اتصل بالنت وجرّب تاني' : 'حصلت مشكلة في الاتصال… جرّب تاني'; $('#ogo').disabled = false; $('#ogo').textContent = 'يلا نبدأ الرحلة'; }
  });
}

// ---------- الراوتر ----------
function route() {
  $$('body > .selbar').forEach((x) => x.remove());
  if (!S.me) return vOnboard();
  APP.classList.remove('full');
  if (S.me.blocked) return vBlocked();
  { const rr = (location.hash || '#/today').split('/')[1]; NAV.hidden = rr === 'read' || rr === 'exam'; document.body.classList.toggle('reading', rr === 'read'); }
  let [, r = 'today', a, b] = (location.hash || '#/today').split('/');
  if (r === 'khadem' || r === 'servants') r = 'admin';
  try { speechSynthesis.cancel(); } catch (e) { /* ignore */ } if (r !== 'read') document.body.classList.remove('night');
  $$('#nav a').forEach((x) => x.classList.toggle('on', x.dataset.r === r || (r === 'read' && x.dataset.r === 'today') || (r === 'exam' && x.dataset.r === 'journey')));
  const v = { today: vToday, read: () => vRead(a, b), journey: () => vJourney(a), plan: vPlan, wall: () => vWall(a), me: vMe, admin: () => vAdmin(a, b), exam: () => vExam(a) }[r] || vToday;
  const same = S.lastRoute === location.hash; S.lastRoute = location.hash;
  // لو أي صفحة وقعت (فورًا أو بعد انتظار)، نعرض كارت بدل ما الشاشة تقف
  const fail = (e) => { console.error(e); APP.innerHTML = `<div class="view">${topbar()}<section class="card empty" style="text-align:center"><div class="big">⚠️</div><h2>حصلت مشكلة في الصفحة دي</h2><p class="sub">ارجع للصفحة الرئيسية وجرّب تاني.</p><a class="btn primary block" href="#/today">الصفحة الرئيسية</a></section></div>`; };
  try { const p = v(); if (p && p.catch) p.catch(fail); } catch (e) { fail(e); }
  if (!same && r !== 'journey' && r !== 'plan' && r !== 'read') scrollTo(0, 0);
}
let rt; const pendK = new Set(); const rerender = (kinds) => () => { kinds.forEach((k) => pendK.add(k)); clearTimeout(rt); rt = setTimeout(() => { const ks = new Set(pendK); pendK.clear(); const r = (location.hash.split('/')[1] || 'today'); const sub = location.hash.split('/')[2]; if (r === 'admin' && ['bank', 'exams', 'word', 'asks', 'reports'].includes(sub)) return; if (S.me && ks.has(r) && !document.activeElement?.matches('input,textarea,select')) route(); }, 120); };
// المحظورين مش بيظهروا في البحر ولا الترتيب ولا الإحصائيات (المسؤولين بيشوفوهم في «المشتركين» بس)
on('users', (u) => {
  S.allUsers = u; S.users = u.filter((x) => !x.blocked);
  if (S.me) { const m = u.find((x) => x.id === S.me.id); if (m) { const wasBlocked = !!S.me.blocked; S.me = m; if (m.blocked !== wasBlocked) { route(); return; } } }
  rerender(['today', 'journey', 'plan', 'me', 'admin'])();
});
on('blocked', () => { if (S.me && !S.me.blocked) { S.me = { ...S.me, blocked: true }; route(); } });
on('expired', () => { if (S.me) sessionExpired(); });
on('wall', (w) => { S.wall = w; rerender(['wall', 'today'])(); });
on('myq', (q) => { S.myq = q; rerender(['wall'])(); });
on('days', (d) => { S.days = d; rerender(['today', 'admin'])(); });
on('chq', (d) => { S.chq = d; rerender(['admin'])(); });
on('exams', (d) => { S.exams = d; rerender(['today', 'journey', 'admin'])(); });
addEventListener('hashchange', route);

// ساعة السيرفر: عند الفتح، ولما النت يرجع، ولما الصفحة ترجع قدّام المستخدم (كل ١٠ دقايق بالكتير)
let clockAt = 0;
async function syncClock() {
  try { const t0 = Date.now(); const r = await fetch('index.html', { method: 'HEAD', cache: 'no-store' }); const d = Date.parse(r.headers.get('date') || ''); if (d) { setClockOffset(d + (Date.now() - t0) / 2 - Date.now()); clockAt = Date.now(); return true; } } catch (e) { /* ignore */ }
  return false;
}
const resync = async () => { if (Date.now() - clockAt < 6e5 && clockAt) return; const before = todayCairo(); if (await syncClock() && S.me && todayCairo() !== before && !document.activeElement?.matches('input,textarea,select')) route(); };
addEventListener('online', resync);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') resync(); });

(async () => {
  APP.innerHTML = `<div class="boot">${shipMark('boot-ship ship-bob')}</div>`;
  await syncClock();
  try { S.me = await init(); } catch (e) { console.error(e); }
  try { S.admin = await api.isServant(); } catch (e) { S.admin = false; }
  route();
  if ('serviceWorker' in navigator && location.protocol === 'https:') { try { navigator.serviceWorker.register('sw.js'); } catch (e) { /* ignore */ } }
})();
