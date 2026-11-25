// واجهة الأسئلة: بتتعرض في الامتحانات وتحت كل أصحاح. كل نوع بيرسم نفسه وبيبعت إجابته (نص أو رقم) لـ onChange
import { qType, csv, toNum, normAr } from './data.js';
import { ar } from './plan.js';
import { $, $$, esc, vibrate } from './ui.js';

const LET = 'أبجدهو';
const COL = ['#0D4A8B', '#1E9C8F', '#E08A00', '#8E44AD', '#E4202B', '#2B8FC4'];

// الأنواع اللي بتتأكد بمجرد الضغط (باقي الأنواع محتاجة زرار «تأكد»)
export const INSTANT = new Set(['mcq', 'tf', 'emoji', 'quote', 'riddle']);

function prompt(q, t) {
  if (t === 'quote') return `<blockquote class="qquote"><p>«${esc(q.q)}»</p></blockquote><p class="qq" style="margin-top:6px">مين اللي قال الكلام ده؟</p>`;
  const txt = t === 'fill' ? esc(q.q).replace(/(…+|\.{3,}|_{3,})/g, '<span class="blank">……</span>') : esc(q.q);
  return `<p class="qq">${txt}</p>`;
}

// host: العنصر اللي هيتحط فيه السؤال | q: السؤال (من غير الإجابة) | value: إجابة محفوظة قبل كده
// بيرجّع { lock(key) } عشان نلوّن الصح والغلط بعد التأكيد
export function mountQ(host, q, { value = null, onChange = () => {} } = {}) {
  const t = qType(q); let v = value; let locked = false;
  const emit = (nv) => { v = nv; onChange(nv); };
  const P = prompt(q, t);
  const optHTML = (labels, cls = (i) => '') => `<div class="opts">${labels.map((o, i) => `<button type="button" class="opt ${cls(i)}" data-o="${i}"><span>${LET[i] || ar(i + 1)}</span>${esc(o)}</button>`).join('')}</div>`;
  const paint = (key, picked) => $$('.opt', host).forEach((x) => { x.disabled = true; x.classList.remove('picked'); const i = +x.dataset.o; if (picked(i)) x.classList.add(key(i) ? 'right' : 'wrong'); else if (key(i)) x.classList.add('right', 'missed'); });

  // ---------- اختياري / إيموجي / مين القائل
  if (t === 'mcq' || t === 'emoji' || t === 'quote') {
    host.innerHTML = `${P}${t === 'emoji' ? `<div class="qemo" aria-hidden="true">${esc(q.emo || '')}</div>` : ''}${optHTML(q.options || [], (i) => (v === i ? 'picked' : ''))}`;
    $$('.opt', host).forEach((b) => b.onclick = () => { if (locked) return; $$('.opt', host).forEach((x) => x.classList.toggle('picked', x === b)); vibrate(10); emit(+b.dataset.o); });
    return { lock(k) { locked = true; paint((i) => i === k, (i) => i === v); } };
  }
  // ---------- صح وخطأ
  if (t === 'tf') {
    host.innerHTML = `${P}<div class="opts tf"><button type="button" class="opt ${v === true ? 'picked' : ''}" data-b="1"><span>✓</span>صح</button><button type="button" class="opt ${v === false ? 'picked' : ''}" data-b="0"><span>✗</span>خطأ</button></div>`;
    $$('.opt', host).forEach((b) => b.onclick = () => { if (locked) return; $$('.opt', host).forEach((x) => x.classList.toggle('picked', x === b)); vibrate(10); emit(b.dataset.b === '1'); });
    return { lock(k) { locked = true; $$('.opt', host).forEach((x) => { x.disabled = true; x.classList.remove('picked'); const val = x.dataset.b === '1'; if (val === k) x.classList.add('right'); else if (val === v) x.classList.add('wrong'); }); } };
  }
  // ---------- أكمل
  if (t === 'fill') {
    host.innerHTML = `${P}<input class="inp xin" id="qfi" maxlength="80" autocomplete="off" placeholder="اكتب الكلمة الناقصة" value="${esc(v || '')}">`;
    const inp = $('#qfi', host); inp.oninput = () => emit(inp.value);
    inp.onkeydown = (e) => { if (e.key === 'Enter') host.dispatchEvent(new CustomEvent('qenter', { bubbles: true })); };
    return { lock() { locked = true; inp.disabled = true; }, focus() { inp.focus(); } };
  }
  // ---------- أكتر من إجابة
  if (t === 'multi') {
    const sel = new Set(csv(v));
    host.innerHTML = `${P}<p class="qhint">اختار كل الإجابات الصح (ممكن تكون أكتر من واحدة)</p>${optHTML(q.options || [], (i) => (sel.has(i) ? 'picked' : ''))}`;
    $$('.opt', host).forEach((b) => b.onclick = () => { if (locked) return; const i = +b.dataset.o; sel.has(i) ? sel.delete(i) : sel.add(i); b.classList.toggle('picked', sel.has(i)); vibrate(8); emit(sel.size ? [...sel].sort((a, c) => a - c).join(',') : null); });
    return { lock(k) { locked = true; const K = csv(k); paint((i) => K.includes(i), (i) => sel.has(i)); } };
  }
  // ---------- مين أنا؟ (تلميحات بتقلل الدرجة)
  if (t === 'riddle') {
    let h = Math.min(3, Math.max(1, (v && v.h) || 1)); let a = v && v.a != null ? v.a : null; const H = (q.hints || []).filter(Boolean);
    const draw = () => {
      host.innerHTML = `${P}<div class="hints">${H.slice(0, h).map((x, i) => `<div class="hintc"><b>تلميح ${ar(i + 1)}</b>${esc(x)}</div>`).join('')}</div>
        ${h < H.length && !locked ? `<button type="button" class="btn ghost block" id="qhm">💡 تلميح كمان <small>(الدرجة بتقل)</small></button>` : ''}
        <p class="qhint">كل تلميح بتفتحه بيقلل الدرجة: كاملة بتلميح واحد، وبعدين ثلثين، وبعدين ثلث.</p>${optHTML(q.options || [], (i) => (a === i ? 'picked' : ''))}`;
      $('#qhm', host) && ($('#qhm', host).onclick = () => { h++; vibrate(10); draw(); if (a != null) emit({ a, h }); });
      $$('.opt', host).forEach((b) => b.onclick = () => { if (locked) return; a = +b.dataset.o; $$('.opt', host).forEach((x) => x.classList.toggle('picked', x === b)); vibrate(10); emit({ a, h }); });
    };
    draw();
    return { lock(k) { locked = true; h = H.length; draw(); paint((i) => i === k, (i) => i === a); } };
  }
  // ---------- رتّب الأحداث
  if (t === 'order') {
    const items = q.items || []; const seq = csv(v).filter((j) => j >= 0 && j < items.length);
    let res = null;
    const draw = () => {
      host.innerHTML = `${P}<p class="qhint">دوس على الأحداث بالترتيب الصح. ودوس على مكان مليان عشان تشيله.</p>
        <ol class="oslots">${items.map((_, k) => `<li><button type="button" class="oslot ${seq[k] != null ? 'on' : ''} ${res ? (seq[k] === res[k] ? 'right' : 'wrong') : ''}" data-k="${k}"><i>${ar(k + 1)}</i><span>${seq[k] != null ? esc(items[seq[k]]) : '…'}</span></button></li>`).join('')}</ol>
        <div class="opool">${items.map((it, j) => (seq.includes(j) ? '' : `<button type="button" class="chipq" data-j="${j}">${esc(it)}</button>`)).join('')}</div>
        ${res && items.some((_, k) => seq[k] !== res[k]) ? `<div class="ocorrect"><b>الترتيب الصح:</b><ol>${res.map((j) => `<li>${esc(items[j])}</li>`).join('')}</ol></div>` : ''}`;
      if (locked) return;
      $$('.chipq', host).forEach((b) => b.onclick = () => { seq.push(+b.dataset.j); vibrate(8); emit(seq.join(',')); draw(); });
      $$('.oslot.on', host).forEach((b) => b.onclick = () => { seq.splice(+b.dataset.k, 1); emit(seq.length ? seq.join(',') : null); draw(); });
    };
    draw();
    return { lock(k) { locked = true; res = csv(k); draw(); $$('.oslot, .chipq', host).forEach((x) => (x.disabled = true)); } };
  }
  // ---------- وصّل
  if (t === 'match') {
    const L = q.left || [], R = q.right || [];
    const pairs = L.map((_, i) => { const x = String(v ?? '').split(',')[i]; return x !== undefined && x !== '' ? +x : -1; });
    let sel = null; let res = null;
    const draw = () => {
      host.innerHTML = `${P}<p class="qhint">دوس على عنصر من اليمين، وبعدين على اللي يناسبه من الشمال. ودوس على العنصر تاني عشان تشيل التوصيل.</p>
        <div class="mgrid"><div class="mcol">${L.map((l, i) => `<button type="button" class="mitem ${pairs[i] >= 0 ? 'paired' : ''} ${sel === i ? 'sel' : ''} ${res ? (pairs[i] === res[i] ? 'right' : 'wrong') : ''}" data-l="${i}" style="--c:${COL[i % COL.length]}">${esc(l)}</button>`).join('')}</div>
        <div class="mcol">${R.map((r, j) => { const o = pairs.indexOf(j); return `<button type="button" class="mitem r ${o >= 0 ? 'paired' : ''}" data-r="${j}" style="--c:${COL[(o >= 0 ? o : 0) % COL.length]}">${esc(r)}</button>`; }).join('')}</div></div>
        ${res && L.some((_, i) => pairs[i] !== res[i]) ? `<div class="ocorrect"><b>التوصيل الصح:</b><ul>${L.map((l, i) => `<li>${esc(l)} ← ${esc(R[res[i]])}</li>`).join('')}</ul></div>` : ''}`;
      if (locked) { $$('.mitem', host).forEach((x) => (x.disabled = true)); return; }
      const out = () => emit(pairs.every((p) => p < 0) ? null : pairs.join(','));
      $$('.mitem:not(.r)', host).forEach((b) => b.onclick = () => { const i = +b.dataset.l; if (sel === i) { pairs[i] = -1; sel = null; out(); } else sel = i; vibrate(8); draw(); });
      $$('.mitem.r', host).forEach((b) => b.onclick = () => { const j = +b.dataset.r; const o = pairs.indexOf(j);
        if (sel == null) { if (o >= 0) pairs[o] = -1; } else { if (o >= 0) pairs[o] = -1; pairs[sel] = j; sel = null; }
        vibrate(8); out(); draw(); });
    };
    draw();
    return { lock(k) { locked = true; res = csv(k); sel = null; draw(); } };
  }
  // ---------- رتّب الآية
  if (t === 'words') {
    const W = q.words || []; const used = []; // فهارس الكلمات المختارة بالترتيب
    String(v ?? '').trim().split(/\s+/).filter(Boolean).forEach((tok) => { const j = W.findIndex((w, k) => w === tok && !used.includes(k)); if (j >= 0) used.push(j); });
    let res = null; let verse = '';
    const draw = () => {
      host.innerHTML = `${P}<p class="qhint">دوس على الكلمات بالترتيب عشان تكوّن الآية. ودوس على كلمة فوق عشان تشيلها.</p>
        <div class="wline ${used.length ? '' : 'empty'}">${used.length ? used.map((j, p) => `<button type="button" class="chipq on ${res ? (normAr(W[j]) === res[p] ? 'right' : 'wrong') : ''}" data-p="${p}">${esc(W[j])}</button>`).join('') : '<span class="muted">الآية هتتكوّن هنا…</span>'}</div>
        <div class="opool">${W.map((w, j) => (used.includes(j) ? '' : `<button type="button" class="chipq" data-j="${j}">${esc(w)}</button>`)).join('')}</div>
        ${res && res.join(' ') !== used.map((j) => normAr(W[j])).join(' ') ? `<div class="ocorrect"><b>الآية بالترتيب الصح:</b><p class="vq">«${esc(verse)}»</p></div>` : ''}`;
      if (locked) { $$('.chipq', host).forEach((x) => (x.disabled = true)); return; }
      const out = () => emit(used.length ? used.map((j) => W[j]).join(' ') : null);
      $$('.opool .chipq', host).forEach((b) => b.onclick = () => { used.push(+b.dataset.j); vibrate(8); out(); draw(); });
      $$('.wline .chipq', host).forEach((b) => b.onclick = () => { used.splice(+b.dataset.p, 1); out(); draw(); });
    };
    draw();
    return { lock(k) { locked = true; verse = String(k); res = normAr(k).split(' ').filter(Boolean); draw(); } };
  }
  // ---------- قدّر الرقم
  if (t === 'num') {
    host.innerHTML = `${P}<div class="numrow"><input class="inp xin" id="qni" inputmode="decimal" autocomplete="off" dir="ltr" placeholder="اكتب الرقم" value="${esc(v ?? '')}">${q.unit ? `<span class="unit">${esc(q.unit)}</span>` : ''}</div>`;
    const inp = $('#qni', host); inp.oninput = () => emit(inp.value.trim() === '' ? null : inp.value.trim());
    inp.onkeydown = (e) => { if (e.key === 'Enter') host.dispatchEvent(new CustomEvent('qenter', { bubbles: true })); };
    return { lock(k) { locked = true; inp.disabled = true; const n = toNum(v); inp.classList.add(Number.isFinite(n) && k && n === k.v ? 'okin' : Number.isFinite(n) && k && k.tol && Math.abs(n - k.v) <= k.tol ? 'halfin' : 'noin'); }, focus() { inp.focus(); } };
  }
  host.innerHTML = P;
  return { lock() {} };
}
