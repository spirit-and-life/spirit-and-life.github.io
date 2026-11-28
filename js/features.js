// أسئلة الأصحاحات، الامتحانات، القراءة بالصوت، مشاركة آية كصورة، الشهادة
import { ar, fmtDate, TOTAL, START, END } from './plan.js';
import { api, examState, QTYPES, QICON, CREATIVE_TYPES, qType, qPts, splitQ, gradeOne, isDone, keyLabel } from './data.js';
import { mountQ, INSTANT } from './qui.js';
import { $, $$, esc, APP, S, reduce, toast, vibrate, meU, topbar, burst, ICON, foot } from './ui.js';
import { shipURL } from './ship.js';
import { cairoDate } from './stats.js';

const fmtTime = (ms) => { const d = new Date(ms); const day = cairoDate(ms); const h = new Intl.DateTimeFormat('ar-EG', { timeZone: 'Africa/Cairo', hour: 'numeric', minute: '2-digit', hour12: true }).format(d); return `${fmtDate(day, true)} الساعة ${h}`; };
export { fmtTime };

// ---------------------------------------------------------------- اختبر نفسك (أسئلة على كل أصحاح، بأنواع مختلفة وتصحيح فوري)
const fmtN = (x) => ar(String(x).replace('.', '٫'));
const PRAISE = ['صح! 👏', 'برافو! ✨', 'ممتاز 🌟', 'تمام كده 👌', 'ربنا يبارك ذكاءك 🙏'];
export function chapterQuiz(el, key, label) {
  const qz = S.chq[key]; if (!el || !qz || !(qz.questions || []).length) { if (el) el.innerHTML = ''; return; }
  const Q = qz.questions.filter((q) => qType(q) !== 'essay').map(splitQ); if (!Q.length) { el.innerHTML = ''; return; }
  const done = (meU().quiz || {})[key];
  const emoOf = (p) => (p.type === 'emoji' && p.emo ? `<span class="qemo sm">${esc(p.emo)}</span> ` : '');
  if (done) {
    el.innerHTML = `<section class="card quiz done"><div class="between"><h2>اختبر نفسك</h2><span class="score">${fmtN(done.c)} / ${ar(done.t)}</span></div><p class="sub">جاوبت على أسئلة ${esc(label)} قبل كده.</p><button class="btn ghost block" id="qrev" style="margin-top:12px">راجع الإجابات</button><div id="qrevb"></div></section>`;
    $('#qrev', el).onclick = () => { $('#qrevb', el).innerHTML = Q.map(({ pub, key: k }, i) => { const ex = qz.questions.filter((q) => qType(q) !== 'essay')[i].explain;
      return `<div class="qrev"><span class="tag">${QICON[pub.type]} ${QTYPES[pub.type]}</span><b>${ar(i + 1)}. ${emoOf(pub)}${esc(pub.q)}</b><p>✓ ${esc(keyLabel(pub, k))}</p>${ex ? `<small>${esc(ex)}</small>` : ''}</div>`; }).join(''); $('#qrev', el).remove(); };
    return;
  }
  const explains = qz.questions.filter((q) => qType(q) !== 'essay').map((q) => q.explain || '');
  let i = 0, sum = 0, combo = 0;
  el.innerHTML = `<section class="card quiz"><div class="between"><h2>اختبر نفسك</h2><span class="qdots">${Q.map((_, k) => `<i data-k="${k}"></i>`).join('')}</span></div><p class="sub">${ar(Q.length)} ${Q.length > 2 && Q.length < 11 ? 'أسئلة' : 'سؤال'} على ${esc(label)}، بأشكال مختلفة. كل إجابة صح بـ٣ نقط، والإجابة الجزئية بتاخد جزء منها.</p><div class="qbody" id="qb"></div></section>`;
  const body = $('#qb', el);
  const show = () => {
    const { pub, key: k } = Q[i]; const t = qType(pub); let cur = null; let checked = false;
    body.innerHTML = `<p class="qtag"><span class="tag">${QICON[t]} ${QTYPES[t]}</span> <small class="muted">${ar(i + 1)} من ${ar(Q.length)}</small></p><div id="qm"></div><div class="qexp" id="qx"></div><div class="actions" id="qa"></div>`;
    body.animate?.([{ opacity: 0, transform: 'translateX(-20px)' }, { opacity: 1, transform: 'none' }], { duration: 350, easing: 'ease-out' });
    const instant = INSTANT.has(t);
    const chk = () => {
      if (checked) return; checked = true; const g = gradeOne(pub, k, cur); const f = g.frac != null ? g.frac : (g.max ? g.got / g.max : 0); sum += f; ctrl.lock(k); vibrate(f === 1 ? 20 : [30, 60, 30]);
      combo = f === 1 ? combo + 1 : 0; $(`.qdots i[data-k="${i}"]`, el).classList.add(f === 1 ? 'ok' : f > 0 ? 'half' : 'no');
      const msg = f === 1 ? PRAISE[(i + combo) % PRAISE.length] : f > 0 ? `قربت! ✨ خدت ${ar(Math.round(f * 100))}٪ من السؤال` : 'مش دي…';
      const showKey = f < 1 && ['fill', 'num', 'riddle', 'multi'].includes(t) ? `<p class="qkey">الإجابة الصح: <b>${esc(keyLabel(pub, k))}</b></p>` : '';
      $('#qx', body).innerHTML = `<p class="${f === 1 ? 'good' : f > 0 ? 'meh' : 'bad'}">${msg}</p>${combo >= 3 ? `<p class="combo">🔥 ${ar(combo)} إجابات صح ورا بعض!</p>` : ''}${showKey}${explains[i] ? `<small>${esc(explains[i])}</small>` : ''}`;
      $('#qa', body).innerHTML = `<button class="btn primary block" id="qn">${i < Q.length - 1 ? 'السؤال اللي بعده' : 'خلّصت'}</button>`;
      if (f === 1) { const r = $('#qm', body).getBoundingClientRect(); burst(r.left + r.width / 2, r.top + 60, 40); }
      $('#qn', body).onclick = async () => {
        if (i < Q.length - 1) { i++; show(); return; }
        const c = Math.round(sum * 2) / 2;
        try { await api.answerChq(key, c, Q.length); } catch (e) { console.error(e); toast(e.code === 'blocked' ? e.message : 'مقدرناش نحفظ نتيجة الأسئلة… افتح الأصحاح تاني وجاوب لما النت يبقى كويس'); }
        const p = c / Q.length;
        body.innerHTML = `<div class="qend"><div class="big">${p === 1 ? '🌟' : p >= .5 ? '👍' : '📖'}</div><h3>${fmtN(c)} من ${ar(Q.length)}</h3><p class="sub">${p === 1 ? 'كله صح! ربنا يبارك قرايتك' : p >= .5 ? 'كويس جدًا… ارجع للأصحاح وهتلاقي الباقي' : 'ارجع للأصحاح تاني وهتلاقي الإجابات'}</p></div>`;
        if (p === 1) { const r = body.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + 40, 120); }
      };
    };
    const ctrl = mountQ($('#qm', body), pub, { onChange: (v) => { cur = v; if (instant) chk(); else { const b = $('#qc', body); if (b) b.disabled = !isDone(pub, v); } } });
    if (!instant) { $('#qa', body).innerHTML = '<button class="btn primary block" id="qc" disabled>تأكد ✓</button>'; $('#qc', body).onclick = chk; body.addEventListener('qenter', () => { if (!$('#qc', body).disabled) chk(); }); setTimeout(() => ctrl.focus && ctrl.focus(), 80); }
  };
  show();
}

// ---------------------------------------------------------------- الامتحانات (بتوقيت فتح وقفل)
export async function examBanner(el) {
  if (!el) return; const open = S.exams.filter((e) => examState(e) === 'open'); if (!open.length) { el.innerHTML = ''; return; }
  const out = [];
  for (const e of open) { const s = await api.mySubmission(e.id); if (!s) out.push(e); }
  el.innerHTML = out.map((e) => `<a class="card cta exam-cta" href="#/exam/${e.id}"><span class="ei">📝</span><span class="grow"><b>${esc(e.title)}</b><small>امتحان مفتوح · ${ar(e.questions.length)} سؤال · مرة واحدة بس${e.closeAt ? ` · بيقفل ${fmtTime(e.closeAt)}` : ''}</small></span>${ICON.back}</a>`).join('');
}
export async function vExam(id) {
  const e = S.exams.find((x) => x.id === id);
  const head = (t) => `<div class="rhead"><a class="iconbtn" href="#/journey/honor" aria-label="رجوع">${ICON.back}</a><b class="grow">${esc(t || '')}</b></div>`;
  if (!e || examState(e) === 'draft') { APP.innerHTML = `<div class="view">${head('')}<section class="card empty"><div class="big">📝</div><h2>الامتحان مش موجود</h2><a class="btn primary" href="#/journey/honor">قائمة الشرف</a></section></div>`; return; }
  const st = examState(e); const mine = await api.mySubmission(id); const h = head(e.title);
  if (st === 'published') {
    const i = (e.results || []).findIndex((r) => r.id === S.me.id); const r = e.results[i];
    APP.innerHTML = `<div class="view">${h}<section class="card result">${r ? `<div class="big">${i < 3 ? ['🥇', '🥈', '🥉'][i] : '🎓'}</div><h2>${ar(r.score)} من ${ar(r.total)}</h2><p class="sub">ترتيبك ${ar(i + 1)} من ${ar(e.results.length)}</p>` : '<div class="big">📝</div><h2>النتيجة اتعلنت</h2><p class="sub">مكنتش دخلت الامتحان ده.</p>'}
      <a class="btn primary block" href="#/journey/honor" style="margin-top:14px">شوف قائمة الشرف</a></section></div>`;
    if (r && i < 3) setTimeout(() => burst(innerWidth / 2, 200, 140), 300); return;
  }
  if (mine) { APP.innerHTML = `<div class="view">${h}<section class="card result"><div class="big">✅</div><h2>إجاباتك اتسلّمت</h2><p class="sub">النتيجة وقائمة الشرف هيظهروا أول ما المسؤولين يعلنوها.</p></section></div>`; return; }
  if (st === 'soon') { APP.innerHTML = `<div class="view">${h}<section class="card result"><div class="big">⏳</div><h2>الامتحان لسه ما فتحش</h2><p class="sub">بيفتح ${fmtTime(e.openAt)}</p></section></div>`; return; }
  if (st !== 'open') { APP.innerHTML = `<div class="view">${h}<section class="card result"><div class="big">🔒</div><h2>الامتحان اتقفل</h2><p class="sub">النتيجة هتظهر في قائمة الشرف.</p></section></div>`; return; }
  APP.innerHTML = `<div class="view">${h}<section class="card exam-intro"><div class="big">📝</div><h2>${esc(e.title)}</h2>${e.desc ? `<p class="sub">${esc(e.desc)}</p>` : ''}
    <ul class="rules"><li>${ar(e.questions.length)} سؤال: ${Object.entries(QTYPES).map(([k, l]) => { const n = e.questions.filter((q) => qType(q) === k).length; return n ? `${l} ${ar(n)}` : ""; }).filter(Boolean).join("، ")}</li><li>الدرجة الكلية ${ar(e.questions.reduce((s, q) => s + qPts(q), 0))}</li><li>تقدر تدخله مرة واحدة بس</li><li>الوقت بيتحسب، ولو اتساوت الدرجات الأسرع بيسبق</li>${e.closeAt ? `<li>بيقفل ${fmtTime(e.closeAt)}</li>` : ''}</ul>
    <button class="btn red block" id="xgo">ابدأ الامتحان</button></section></div>`;
  $('#xgo').onclick = () => runExam(e, h);
}
function runExam(e, head) {
  const Q = e.questions; const ans = Array(Q.length).fill(null); let i = 0; const t0 = Date.now(); let tick;
  const answered = (k) => isDone(Q[k], ans[k]);
  const draw = () => {
    const q = Q[i]; const t = qType(q);
    const creative = CREATIVE_TYPES.includes(t);
    const body = creative ? () => '<div id="qmount"></div>' : {
      mcq: () => `<div class="opts">${(q.options || []).map((o, k) => `<button class="opt ${ans[i] === k ? 'picked' : ''}" data-k="${k}"><span>${'أبجد'[k] || ar(k + 1)}</span>${esc(o)}</button>`).join('')}</div>`,
      tf: () => `<div class="opts tf"><button class="opt ${ans[i] === true ? 'picked' : ''}" data-b="1"><span>✓</span>صح</button><button class="opt ${ans[i] === false ? 'picked' : ''}" data-b="0"><span>✗</span>خطأ</button></div>`,
      fill: () => `<input class="inp xin" id="xa" maxlength="80" autocomplete="off" placeholder="اكتب الكلمة الناقصة" value="${esc(ans[i] || '')}">`,
      essay: () => `<textarea class="inp xin" id="xa" rows="6" maxlength="1500" placeholder="اكتب إجابتك هنا…">${esc(ans[i] || '')}</textarea><p class="hint">المسؤولين هيصححوا الإجابة دي بإيديهم.</p>`,
    }[t];
    const qtext = t === 'fill' ? esc(q.q).replace(/(…+|\.{3,}|_{3,})/g, '<span class="blank">……</span>') : esc(q.q);
    APP.innerHTML = `<div class="view">${head}<div class="xbar"><div class="xprog"><i style="width:${(i / Q.length) * 100}%"></i></div><span id="xt">٠:٠٠</span></div>
    <section class="card xq"><p class="qn">سؤال ${ar(i + 1)} من ${ar(Q.length)} <span class="qt">${QTYPES[t]}، ${ar(qPts(q))} ${qPts(q) > 2 && qPts(q) < 11 ? 'درجات' : 'درجة'}</span></p>${creative ? "" : `<p class="qq">${qtext}</p>`}
    ${body()}
    <div class="actions">${i > 0 ? '<button class="btn ghost" id="xp">السابق</button>' : ''}<button class="btn ${i === Q.length - 1 ? 'red' : 'primary'}" id="xn" ${answered(i) ? '' : 'disabled'}>${i === Q.length - 1 ? 'سلّم الإجابات' : 'التالي'}</button></div></section></div>`;
    if (creative) mountQ($('#qmount'), q, { value: ans[i], onChange: (v) => { ans[i] = v; $('#xn').disabled = !isDone(q, v); } });
    const pick = (b, v) => { ans[i] = v; $$('.opt').forEach((x) => x.classList.toggle('picked', x === b)); $('#xn').disabled = false; vibrate(10); };
    $$('.opt[data-k]').forEach((b) => b.onclick = () => pick(b, +b.dataset.k));
    $$('.opt[data-b]').forEach((b) => b.onclick = () => pick(b, b.dataset.b === '1'));
    const xa = $('#xa'); if (xa) { xa.oninput = () => { ans[i] = xa.value; $('#xn').disabled = !answered(i); }; if (t === 'fill') xa.onkeydown = (ev) => { if (ev.key === 'Enter' && answered(i)) $('#xn').click(); }; setTimeout(() => xa.focus(), 60); }
    $('#xp') && ($('#xp').onclick = () => { i--; draw(); });
    $('#xn').onclick = async () => {
      if (i < Q.length - 1) { i++; draw(); return; }
      clearInterval(tick); $('#xn').disabled = true; const dur = Math.round((Date.now() - t0) / 1000);
      const ok = await api.submitExam(e.id, ans.map((a) => (typeof a === 'string' ? a.trim() : a)), dur);
      APP.innerHTML = `<div class="view">${head}<section class="card result"><div class="big">${ok ? '✅' : '⚠️'}</div><h2>${ok ? 'إجاباتك اتسلّمت' : 'مقدرناش نسلّم الإجابات'}</h2><p class="sub">${ok ? 'النتيجة وقائمة الشرف هيظهروا أول ما المسؤولين يعلنوها.' : 'يمكن الامتحان اتقفل أو سلّمته قبل كده.'}</p><a class="btn primary block" href="#/today" style="margin-top:14px">رجوع للنهارده</a></section></div>`;
      if (ok) burst(innerWidth / 2, 220, 100);
    };
    clearInterval(tick); tick = setInterval(() => { const s = Math.round((Date.now() - t0) / 1000); const x = $('#xt'); if (!x) return clearInterval(tick); x.textContent = `${ar(Math.floor(s / 60))}:${ar(String(s % 60).padStart(2, '0'))}`; }, 1000);
  };
  draw();
}

// ---------------------------------------------------------------- اسمع الأصحاح (speechSynthesis)
export function ttsSetup(btn, verseEls) {
  const synth = window.speechSynthesis; if (!btn) return;
  if (!synth) { btn.remove(); return; }
  let playing = false; let idx = 0;
  const pickVoice = () => { const vs = synth.getVoices(); return vs.find((v) => /^ar/i.test(v.lang) && /EG/i.test(v.lang)) || vs.find((v) => /^ar/i.test(v.lang)) || null; };
  const stop = () => { playing = false; synth.cancel(); verseEls.forEach((v) => v.classList.remove('speaking')); btn.classList.remove('on'); btn.setAttribute('aria-label', 'اسمع الأصحاح'); };
  const speakNext = () => {
    if (!playing || idx >= verseEls.length) return stop();
    const el = verseEls[idx]; verseEls.forEach((v) => v.classList.toggle('speaking', v === el));
    el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
    const u = new SpeechSynthesisUtterance(el.dataset.t || el.textContent); const v = pickVoice(); if (v) u.voice = v; u.lang = v?.lang || 'ar-EG'; u.rate = .92;
    u.onend = () => { idx++; speakNext(); }; u.onerror = () => stop(); synth.speak(u);
  };
  btn.onclick = () => {
    if (playing) return stop();
    if (!pickVoice() && synth.getVoices().length) toast('مفيش صوت عربي على جهازك… هنجرّب بالصوت الافتراضي');
    playing = true; btn.classList.add('on'); btn.setAttribute('aria-label', 'وقّف الصوت');
    const sel = verseEls.findIndex((v) => v.classList.contains('sel')); idx = sel >= 0 ? sel : 0; speakNext();
  };
  addEventListener('hashchange', stop, { once: true });
}

// ---------------------------------------------------------------- صور (شهادة + مشاركة آية) بهوية روح وحياة
const loadImg = (s) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = s; });
const ensureFonts = () => Promise.all(['700 60px "Aref Ruqaa"', '700 60px "Reem Kufi"', '500 30px "IBM Plex Sans Arabic"', '400 30px "Noto Naskh Arabic"'].map((f) => document.fonts.load(f, 'ابتث')));
function nightBg(c, W, H) {
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#030d1d'); g.addColorStop(.55, '#0A2A52'); g.addColorStop(1, '#0D4A8B'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  let seed = 5; const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 70; i++) { c.fillStyle = `rgba(255,255,255,${.2 + r() * .6})`; c.beginPath(); c.arc(r() * W, r() * H * .55, 1 + r() * 2, 0, 7); c.fill(); }
  const w = c.createLinearGradient(0, H * .84, 0, H); w.addColorStop(0, 'rgba(6,26,51,0)'); w.addColorStop(1, 'rgba(6,26,51,.9)'); c.fillStyle = w; c.fillRect(0, H * .84, W, H * .16);
}
export async function shareVerseImage(text, ref) {
  await ensureFonts(); const W = 1080, H = 1350; const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
  const ship = await loadImg(shipURL({ line: '#8FD3F0', body: '#F4FBFE', band: '#CFEAF7', wave: '#8FD3F0' }));
  nightBg(c, W, H);
  const r = c.createRadialGradient(W / 2, 360, 20, W / 2, 360, 700); r.addColorStop(0, 'rgba(255,200,87,.28)'); r.addColorStop(1, 'rgba(255,200,87,0)'); c.fillStyle = r; c.fillRect(0, 0, W, H);
  c.direction = 'rtl'; c.textAlign = 'center'; c.fillStyle = '#FFC857'; c.font = '700 150px "Reem Kufi"'; c.fillText('«', W / 2, 270);
  let fs = 70; let lines;
  const wrap = () => { c.font = `700 ${fs}px "Aref Ruqaa"`; const words = text.split(/\s+/); lines = []; let cur = '';
    words.forEach((w) => { const t = cur ? cur + ' ' + w : w; if (c.measureText(t).width > W - 200 && cur) { lines.push(cur); cur = w; } else cur = t; }); if (cur) lines.push(cur); };
  wrap(); while (lines.length * fs * 1.8 > 640 && fs > 34) { fs -= 4; wrap(); }
  const lh = fs * 1.8; let y = 330 + (640 - lines.length * lh) / 2 + fs;
  c.fillStyle = '#EEF8FC'; lines.forEach((l) => { c.fillText(l, W / 2, y); y += lh; });
  c.fillStyle = '#8FD3F0'; c.font = '700 44px "Reem Kufi"'; c.fillText(ref, W / 2, y + 30);
  c.fillStyle = 'rgba(238,248,252,.2)'; c.fillRect(W / 2 - 160, H - 270, 320, 2);
  if (ship) c.drawImage(ship, W / 2 - 70, H - 250, 140, 138);
  c.fillStyle = '#EEF8FC'; c.font = '700 54px "Reem Kufi"'; c.fillText('روح وحياة', W / 2, H - 70);
  const blob = await new Promise((ok) => cv.toBlob(ok, 'image/png'));
  const file = new File([blob], 'آية-روح-وحياة.png', { type: 'image/png' });
  try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text: `«${text}» (${ref})` }); return; } } catch (e) { if (e.name === 'AbortError') return; }
  const url = URL.createObjectURL(blob); const m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = `<div class="box"><img src="${url}" alt="صورة الآية" style="width:100%;border-radius:16px"><p class="sub" style="margin:10px 0">اضغط مطوّل على الصورة واحفظها، أو نزّلها:</p><div class="actions"><a class="btn red" href="${url}" download="آية-روح-وحياة.png">تنزيل</a><button class="btn ghost">قفل</button></div></div>`;
  document.body.appendChild(m); m.onclick = (ev) => { if (ev.target === m || ev.target.tagName === 'BUTTON') { m.remove(); URL.revokeObjectURL(url); } };
}

export async function drawCert(cv, real) {
  await ensureFonts(); const c = cv.getContext('2d'); const W = cv.width, H = cv.height;
  const ship = await loadImg(shipURL());
  c.fillStyle = '#EEF8FC'; c.fillRect(0, 0, W, H);
  const g = c.createRadialGradient(W / 2, H * .35, 50, W / 2, H * .4, W * .7); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(214,236,246,1)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.strokeStyle = '#0D4A8B'; c.lineWidth = 6; c.strokeRect(40, 40, W - 80, H - 80); c.strokeStyle = '#8FD3F0'; c.lineWidth = 2; c.strokeRect(58, 58, W - 116, H - 116);
  if (ship) { c.globalAlpha = .06; c.drawImage(ship, W / 2 - 330, H / 2 - 330, 660, 652); c.globalAlpha = 1; c.drawImage(ship, W / 2 - 80, 90, 160, 158); }
  c.direction = 'rtl'; c.textAlign = 'center'; c.fillStyle = '#0D4A8B'; c.font = '700 82px "Reem Kufi"'; c.fillText('روح وحياة', W / 2, 340);
  c.fillStyle = '#5BB6DD'; c.font = '500 34px "IBM Plex Sans Arabic"'; c.fillText('شهادة إتمام قراءة سفر التكوين', W / 2, 420);
  c.fillStyle = '#14264F'; c.font = '700 100px "Aref Ruqaa"'; c.fillText(real ? S.me.name : 'اسمك هنا', W / 2, 580);
  c.fillStyle = '#14264F'; c.font = '400 40px "Noto Naskh Arabic"'; c.fillText('أتمّ قراءة سفر التكوين كله، ٥٠ أصحاحًا', W / 2, 680);
  c.fillText(`في ${ar(TOTAL)} يومًا من ${fmtDate(START, false)} إلى ${fmtDate(END, false, true)}`, W / 2, 740);
  c.fillStyle = '#0D4A8B'; c.font = '700 40px "Aref Ruqaa"'; c.fillText('«الكَلامُ الَّذي أُكَلِّمُكُمْ بهِ هو روحٌ وحَياةٌ» (يوحنا ٦: ٦٣)', W / 2, 850);
  c.fillStyle = '#5BB6DD'; c.font = '500 28px "IBM Plex Sans Arabic"'; c.fillText('خدمة روح وحياة · مستشفى هرمل بمدينة السادات', W / 2, 1040);
  if (!real) { c.save(); c.translate(W / 2, H / 2); c.rotate(-.35); c.fillStyle = 'rgba(228,32,43,.12)'; c.font = '700 150px "Reem Kufi"'; c.fillText('معاينة', 0, 40); c.restore(); }
}
