import { DAYS, TOTAL, START, END, CHRISTMAS, BADGES, CH_TITLES, ar, fmtDate, todayCairo, status, dueDays, streak, chLabel, dayTitle, diffDays, addDays, weekday, keyVerse, weekOf } from './plan.js';
import { init, api, on, mode, normPhone, validPhone } from './data.js';
import { $, $$, esc, APP, NAV, S, reduce, first, avatar, timeAgo, toast, vibrate, myRead, meU, greeting, loadText, ICON, topbar, foot, burst, plural } from './ui.js';
import { userStats, readState, nextBadge, weekRange, lampLevel, LAMP_NAMES } from './stats.js';
import { chapterQuiz, vExam, examBanner, ttsSetup, shareVerseImage, drawCert } from './features.js';
import { vJourney } from './journey.js';
import { vAdmin } from './admin.js';
import { DEFS, ICO, shipMark, NIGHT, lamp, wellSVG, introLayers, seaWaves, starsHTML } from './ship.js';

document.body.insertAdjacentHTML('afterbegin', DEFS);

// ---------- تسجيل القراءة ----------
async function markRead(n, btn) {
  const before = new Set(myRead()); if (before.has(n)) return;
  const r = btn?.getBoundingClientRect(); if (r) burst(r.left + r.width / 2, r.top + r.height / 2);
  btn?.classList.add('pop'); vibrate([18, 40, 30]);
  document.querySelector('.wellc')?.classList.add('drawn');
  try { await api.setRead(n, true); } catch (e) { console.error(e); document.querySelector('.wellc')?.classList.remove('drawn'); toast('حصلت مشكلة في الحفظ… جرّب تاني'); return; }
  const after = new Set([...before, n]);
  const got = BADGES.filter((b) => !b.test(before) && b.test(after));
  const dd = DAYS.find((x) => x.n === n);
  toast(n === dayToday()?.n ? 'الدلو طلع مليان… ربنا يبارك قرايتك 💧' : (dd && dd.date < todayCairo() ? `اليوم ${ar(n)} اتسجّل إنك قريته متأخر ✓` : `تمام! اليوم ${ar(n)} اتسجّل ✓`));
  if (got.length) setTimeout(() => badgeModal(got[0]), 900);
}
const dayToday = () => { const s = status(); return s.phase === 'reading' ? s.day : null; };
function badgeModal(b) {
  const m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = `<div class="box"><div class="bigbadge">${ICO(b.icon)}</div><p class="eyebrow" style="margin-top:6px">شارة جديدة</p><h2 style="font-size:26px;margin:4px 0">${b.name}</h2><p class="muted">${b.desc}</p><button class="btn primary block" style="margin-top:18px">آمين 🙏</button></div>`;
  document.body.appendChild(m); const r = m.querySelector('.box').getBoundingClientRect(); burst(r.left + r.width / 2, r.top + 60, 120);
  m.addEventListener('click', (e) => { if (e.target === m || e.target.tagName === 'BUTTON') m.remove(); });
}

// ---------- النهارده ----------
function lightsHTML(n) {
  const list = S.users; const readers = list.filter((u) => (u.readDays || []).includes(n));
  const myOn = readers.some((u) => u.id === S.me.id);
  const lamps = readers.filter((u) => u.id !== S.me.id).map((u, i) => { let h = 0; for (const c of u.id) h = (h * 31 + c.charCodeAt(0)) >>> 0; const x = 4 + ((h % 880) / 10), y = 26 + ((h >> 5) % 46); return `<i class="lamp" title="${esc(u.name)}" style="left:${x.toFixed(1)}%;top:${y}%;animation-delay:${((i * .27) % 3).toFixed(2)}s"></i>`; }).join('');
  const me = myOn ? '<i class="lamp me" style="left:50%;top:30%"></i><span class="me-tag" style="left:calc(50% - 16px);top:4%">أنت</span>' : '';
  const others = readers.filter((u) => u.id !== S.me.id).slice(0, 3).map((u) => esc(first(u.name)));
  return `<div class="lights"><div class="hz"></div>${lamps}${me}${!readers.length ? '<p class="lights-empty">كن أول نور النهارده ✨</p>' : ''}</div>
  <p class="names"><b>${ar(readers.length)}</b> من ${ar(list.length)} قروا النهارده${others.length ? ` — ${others.join('، ')}${readers.length - myOn - others.length > 0 ? ` و${ar(readers.length - (myOn ? 1 : 0) - others.length)} كمان` : ''}` : ''}</p>`;
}
function weekHTML() {
  const t = todayCairo(); const [s] = weekRange(t); const u = meU();
  const cells = Array.from({ length: 7 }, (_, i) => { const dt = addDays(s, i); const d = DAYS.find((x) => x.date === dt); let cls = 'off', ic = '';
    if (d) { const st = readState(u, d.n); if (st === 'ontime') { cls = 'ok'; ic = '✓'; } else if (st === 'late') { cls = 'late'; ic = '⏰'; } else if (dt < t) { cls = 'miss'; ic = '!'; } else if (dt === t) { cls = 'now'; ic = '•'; } else cls = 'fu'; }
    return `<a class="wd ${cls}" ${d ? `href="#/read/${d.n}"` : ''}><i>${ic}</i><span>${['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'][weekday(dt)]}</span><small>${ar(+dt.slice(8))}</small></a>`; });
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
  const t = todayCairo(); const d = diffDays(t, CHRISTMAS); if (d < 0) return '';
  const left = DAYS.filter((x) => x.date >= t).length;
  return `<section class="card"><p class="eyebrow">على عيد الميلاد المجيد</p><div class="count"><div><b>${ar(d)}</b><span>يوم على العيد</span></div><div><b>${ar(left)}</b><span>يوم قراءة فاضل</span></div><div><b>${ar(myRead().size)}</b><span>من ${ar(TOTAL)} قريتهم</span></div></div></section>`;
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
  } else {
    hero = `<section class="hero"><div class="stars" aria-hidden="true">${starsHTML(26, 55)}</div><div class="eyebrow">الرحلة خلصت</div><h2>كل سنة وانت طيب ✨</h2><div class="sub">قريت ${ar(r.size)} من ${ar(TOTAL)} يوم</div>${scene}<div class="ctas"><a class="btn glass" href="#/me">شوف شهادتك</a></div></section>`;
    well = wellCard(true);
  }
  APP.innerHTML = `<div class="view">${topbar()}<div class="stagger"><div class="hello"><h1>${greeting()} يا ${esc(name)}</h1><p>${st.phase === 'reading' ? 'جاهز لرحلة النهارده؟' : 'خليك قريب… الرحلة مستمرة.'}</p></div>${nudgeHTML()}<div id="exb"></div>${hero}${well}
    ${st.phase === 'reading' ? `<section class="card"><div class="between"><h2>أنوار البحر</h2><span class="sub">كل واحد يقرا يطلع نوره</span></div>${lightsHTML(st.day.n)}</section>${reflHTML(st.day.n)}${verseHTML(st.day)}${weekHTML()}${quizCTA(st.day)}` : weekHTML()}
    ${lampPreview()}${familyHTML()}${missedHTML()}${countdownHTML()}${foot()}</div></div>`;
  $('#readNow')?.addEventListener('click', (e) => markRead(st.day.n, e.currentTarget));
  examBanner($('#exb'));
  if (st.phase === 'reading') {
    const hook = () => { const k = keyVerse(st.day.n); $('#vshare')?.addEventListener('click', () => { const [c, v] = k; shareVerseImage(S.text[c][v - 1], `تكوين ${ar(c)}: ${ar(v)}`); }); };
    if (S.text) hook(); else loadText().then(() => { const el = $('#vday'); if (el) { el.outerHTML = verseHTML(st.day); hook(); } });
  }
}

// ---------- قراءة جوه الموقع ----------
async function vRead(n, tab = 0) {
  const d = DAYS.find((x) => x.n === +n); if (!d) { location.hash = '#/today'; return; }
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
    <p class="hint">دوس على أي آية عشان تختارها وتشاركها في «آيات لمستنا»</p></div>
    <div class="selbar" id="selbar"><button class="btn light" id="share">✨ آية لمستني</button><button class="btn light" id="simg">🖼️ صورة</button><button class="btn ghost" id="copy">نسخ</button></div>`;
  const sel = new Set(); const upd = () => $('#selbar').classList.toggle('show', sel.size > 0);
  $$('.v', chapEl).forEach((el) => el.addEventListener('click', () => { const k = +el.dataset.v; sel.has(k) ? sel.delete(k) : sel.add(k); el.classList.toggle('sel'); upd(); }));
  const selText = () => { const ks = [...sel].sort((a, b) => a - b); return { text: ks.map((k) => vs[k - 1]).join(' '), ref: `تكوين ${ar(c)}: ${ar(ks[0])}${ks.length > 1 ? '-' + ar(ks[ks.length - 1]) : ''}` }; };
  $('#share').onclick = async () => { const s = selText(); await api.post('verse', s.text, s.ref); toast('اتشاركت في «آيات لمستنا» ✨'); $$('.v.sel').forEach((x) => x.classList.replace('sel', 'mark')); sel.clear(); upd(); };
  $('#simg').onclick = async () => { const s = selText(); await shareVerseImage(s.text, s.ref); };
  ttsSetup($('#tts'), $$('.v', chapEl));
  chapterQuiz($('#cquiz'), String(c), `تكوين ${ar(c)}`);
  const applyNight = () => document.body.classList.toggle('night', !!S.night); try { S.night = localStorage.getItem('ruh:night') === '1'; } catch (e) { /* ignore */ } applyNight();
  $('#night').onclick = () => { S.night = !S.night; applyNight(); try { localStorage.setItem('ruh:night', S.night ? '1' : '0'); } catch (e) { /* ignore */ } };
  $('#copy').onclick = async () => { const s = selText(); try { await navigator.clipboard.writeText(`«${s.text}» (${s.ref})`); toast('اتنسخت'); } catch (e) { toast('مش قادر أنسخ هنا'); } };
  $('#rdone')?.addEventListener('click', async (e) => { await markRead(d.n, e.currentTarget); setTimeout(() => { location.hash = '#/today'; }, 1500); });
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
    html += `<a class="pday ${cls}" href="#/read/${x.n}"><span class="n">${ar(x.n)}</span><span class="t"><b>${chLabel(x)} — ${dayTitle(x)}</b><small>${fmtDate(x.date)}${r.has(x.n) && readState(meU(), x.n) === 'late' ? ' <i class="latepill">قريته متأخر</i>' : ''}</small></span>${cls === 'done' ? `<span class="check">${ICON.check}</span>` : cls === 'missed' ? '<span class="st">كمّله</span>' : cls === 'today' ? '<span class="st">النهارده</span>' : ''}</a>`;
  });
  html += '</div>';
  APP.innerHTML = `<div class="view">${topbar()}<div class="hello"><h1>الخطة كلها</h1><p>${ar(TOTAL)} يوم من ${fmtDate(START, false)} لحد ${fmtDate(END, false, true)}، من غير إجازات</p></div>
  <div class="card" style="padding:14px 16px"><div class="between"><span class="sub">قريت</span><b>${ar(r.size)} / ${ar(TOTAL)}</b></div><div class="prog light"><i style="width:${(r.size / TOTAL) * 100}%"></i></div></div>${html}${foot()}</div>`;
  const tEl = $('.pday.today'); if (tEl) setTimeout(() => tEl.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' }), 300);
}

// ---------- آيات لمستنا ----------
const amenSet = () => { try { return new Set(JSON.parse(localStorage.getItem('ruh:amen') || '[]')); } catch (e) { return new Set(); } };
function vWall() {
  const tab = S.wallTab; const list = S.wall.filter((w) => w.type === tab).sort((a, b) => b.at - a.at); const am = amenSet();
  APP.innerHTML = `<div class="view">${topbar()}<div class="hello"><h1>آيات لمستنا</h1><p>«احملوا بعضكم أثقال بعض»</p></div>
  <div class="seg" role="tablist"><button class="${tab === 'verse' ? 'on' : ''}" data-t="verse">✨ آيات</button><button class="${tab === 'reflection' ? 'on' : ''}" data-t="reflection">✍️ تأملات</button></div>
  <section class="card compose"><textarea id="ptext" maxlength="400" placeholder="${tab === 'verse' ? 'اكتب الآية اللي لمستك النهارده…' : 'اكتب تأمل قصير من قراءة النهارده…'}"></textarea>${tab === 'verse' ? '<input id="pref" maxlength="40" placeholder="الشاهد (مثلًا: تكوين ١: ٣)">' : ''}
  <button class="btn primary block" id="psend" style="margin-top:10px">${tab === 'verse' ? 'شارك الآية' : 'شارك التأمل'}</button></section>
  <div class="stagger">${list.length ? list.map((w) => `<article class="card post ${w.type}"><div class="who">${avatar(w.name)}<div class="grow"><b>${esc(w.name)}</b><div class="sub" style="font-size:12px">${timeAgo(w.at)}</div></div>${w.userId === S.me.id ? `<button class="chip" data-del="${w.id}" aria-label="حذف">حذف</button>` : ''}</div>
    <p class="txt ${w.type === 'verse' ? 'verse-q' : ''}">${w.type === 'verse' ? '«' + esc(w.text) + '»' : esc(w.text)}</p>${w.ref ? `<p class="ref">${esc(w.ref)}</p>` : ''}
    <div class="foot"><span class="sub">${ar(w.amens || 0)} آمين</span><button class="amen ${am.has(w.id) ? 'did' : ''}" data-amen="${w.id}">${am.has(w.id) ? 'آمين ✓' : '🙏 آمين'}</button></div></article>`).join('')
    : '<div class="card" style="text-align:center"><p class="muted">لسه مفيش حاجة هنا… كن أول واحد يشارك 🤍</p></div>'}</div>${foot()}</div>`;
  $$('.seg button').forEach((b) => b.onclick = () => { S.wallTab = b.dataset.t; vWall(); });
  $('#psend').onclick = async () => { const t = $('#ptext').value.trim(); if (t.length < 3) return toast('اكتب حاجة الأول 🙂'); $('#psend').disabled = true; await api.post(tab, t, $('#pref')?.value.trim()); toast('اتشاركت ✨'); };
  $$('[data-amen]').forEach((b) => b.onclick = async () => { const id = b.dataset.amen; const s = amenSet(); if (s.has(id)) return; s.add(id); localStorage.setItem('ruh:amen', JSON.stringify([...s])); vibrate(15); const r = b.getBoundingClientRect(); burst(r.left + r.width / 2, r.top, 30); await api.amen(id); });
  $$('[data-del]').forEach((b) => b.onclick = async () => { if (b.dataset.sure) { await api.removePost(b.dataset.del); toast('اتمسح'); } else { b.dataset.sure = '1'; b.textContent = 'متأكد؟'; b.style.color = 'var(--heart)'; setTimeout(() => { delete b.dataset.sure; b.textContent = 'حذف'; b.style.color = ''; }, 3000); } });
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
  $('#save').onclick = async () => { const n = $('#nm').value.trim(); if (n.length < 2) return toast('اكتب اسمك'); toast('اتحفظ ✓'); try { await api.rename(n); } catch (e) { /* ignore */ } };
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
      <div class="field"><input id="iname" autocomplete="name" placeholder=" " maxlength="40" required><label for="iname">اسمك</label></div>
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
    catch (err) { console.error(err); $('#oerr').textContent = 'حصلت مشكلة في الاتصال… جرّب تاني'; $('#ogo').disabled = false; $('#ogo').textContent = 'يلا نبدأ الرحلة'; }
  });
}

// ---------- الراوتر ----------
function route() {
  if (!S.me) return vOnboard();
  APP.classList.remove('full');
  { const rr = (location.hash || '#/today').split('/')[1]; NAV.hidden = rr === 'read' || rr === 'exam'; document.body.classList.toggle('reading', rr === 'read'); }
  let [, r = 'today', a, b] = (location.hash || '#/today').split('/');
  if (r === 'khadem' || r === 'servants') r = 'admin';
  try { speechSynthesis.cancel(); } catch (e) { /* ignore */ } if (r !== 'read') document.body.classList.remove('night');
  $$('#nav a').forEach((x) => x.classList.toggle('on', x.dataset.r === r || (r === 'read' && x.dataset.r === 'today') || (r === 'exam' && x.dataset.r === 'journey')));
  const v = { today: vToday, read: () => vRead(a, b), journey: () => vJourney(a), plan: vPlan, wall: vWall, me: vMe, admin: () => vAdmin(a, b), exam: () => vExam(a) }[r] || vToday;
  const same = S.lastRoute === location.hash; S.lastRoute = location.hash;
  v(); if (!same && r !== 'journey' && r !== 'plan' && r !== 'read') scrollTo(0, 0);
}
let rt; const rerender = (kinds) => () => { clearTimeout(rt); rt = setTimeout(() => { const r = (location.hash.split('/')[1] || 'today'); const sub = location.hash.split('/')[2]; if (r === 'admin' && ['bank', 'exams', 'word'].includes(sub)) return; if (S.me && kinds.includes(r) && !document.activeElement?.matches('input,textarea,select')) route(); }, 120); };
on('users', (u) => { S.users = u; if (S.me) { const m = u.find((x) => x.id === S.me.id); if (m) S.me = m; } rerender(['today', 'journey', 'plan', 'me', 'admin'])(); });
on('wall', (w) => { S.wall = w; rerender(['wall', 'today'])(); });
on('days', (d) => { S.days = d; rerender(['today', 'admin'])(); });
on('chq', (d) => { S.chq = d; rerender(['admin'])(); });
on('exams', (d) => { S.exams = d; rerender(['today', 'journey', 'admin'])(); });
addEventListener('hashchange', route);

(async () => {
  APP.innerHTML = `<div class="boot">${shipMark('boot-ship ship-bob')}</div>`;
  try { S.me = await init(); } catch (e) { console.error(e); }
  route();
  if ('serviceWorker' in navigator && location.protocol === 'https:') { try { navigator.serviceWorker.register('sw.js'); } catch (e) { /* ignore */ } }
})();
