// اختيار آية من سفر التكوين، وأسئلة المشتركين للمسؤولين
import { ar, CH_TITLES, status, dueDays } from './plan.js';
import { api } from './data.js';
import { $, $$, esc, S, toast, loadText, timeAgo, burst } from './ui.js';

export const refOf = (ch, from, to) => `تكوين ${ar(ch)}: ${ar(from)}${to > from ? '-' + ar(to) : ''}`;
const MAXV = 5;

// أصحاح النهارده (أو آخر يوم مستحق، أو الأول لو الرحلة لسه ما بدأتش)
function defaultChapter() {
  const st = status(); if (st.phase === 'reading') return st.day.ch[0];
  const d = dueDays().slice(-1)[0]; return d ? d.ch[0] : 1;
}

// اختيار آية: السفر ← الأصحاح ← من آية ← لحد آية (أقصى حاجة ٥ آيات)، والنص بيتكتب لوحده
// «keep» كائن بيفضل محفوظ بين إعادات رسم الصفحة، فالاختيار ما يرجعش للأول
export async function versePicker(host, { optional = false, keep = {} } = {}) {
  const T = await loadText(); const total = Object.keys(T).length;
  if (!keep.ch) Object.assign(keep, { ch: defaultChapter(), from: 1, to: 1, on: !optional });
  const st = keep;
  const draw = () => {
    st.ch = Math.min(Math.max(1, st.ch), total); const vs = T[st.ch];
    st.from = Math.min(Math.max(1, st.from), vs.length); st.to = Math.min(Math.max(st.to, st.from), st.from + MAXV - 1, vs.length);
    const opt = (a, b, sel) => Array.from({ length: b - a + 1 }, (_, i) => a + i).map((k) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${ar(k)}</option>`).join('');
    host.innerHTML = `${optional ? `<label class="vp-toggle"><input type="checkbox" id="vpOn" ${st.on ? 'checked' : ''}> السؤال عن آية معينة</label>` : ''}
      <div class="vp" ${st.on ? '' : 'hidden'}>
        <div class="vp-row"><label><span>السفر</span><select disabled aria-label="السفر"><option>سفر التكوين</option></select></label>
        <label><span>الأصحاح</span><select data-k="ch" aria-label="الأصحاح">${Array.from({ length: total }, (_, i) => i + 1).map((k) => `<option value="${k}" ${k === st.ch ? 'selected' : ''}>${ar(k)} — ${CH_TITLES[k - 1]}</option>`).join('')}</select></label></div>
        <div class="vp-row"><label><span>من آية</span><select data-k="from" aria-label="من آية">${opt(1, vs.length, st.from)}</select></label>
        <label><span>لحد آية</span><select data-k="to" aria-label="لحد آية">${opt(st.from, Math.min(vs.length, st.from + MAXV - 1), st.to)}</select></label></div>
        <blockquote class="vp-text"><p>«${esc(vs.slice(st.from - 1, st.to).join(' '))}»</p><cite>${refOf(st.ch, st.from, st.to)}</cite></blockquote>
      </div>`;
    $$('select[data-k]', host).forEach((s) => s.onchange = () => {
      const k = s.dataset.k; st[k] = +s.value;
      if (k === 'ch') { st.from = 1; st.to = 1; } if (k === 'from') st.to = st.from;
      draw();
    });
    const t = $('#vpOn', host); if (t) t.onchange = () => { st.on = t.checked; draw(); };
  };
  draw();
  return () => { if (!st.on) return null; const vs = T[st.ch]; return { ch: st.ch, from: st.from, to: st.to, text: vs.slice(st.from - 1, st.to).join(' '), ref: refOf(st.ch, st.from, st.to) }; };
}

// اسأل المسؤولين: سؤال أو تفسير آية، والرد بيوصل على الواتساب
export async function askModal(pre) {
  const m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = `<div class="box ask-box"><h2>❓ اسأل المسؤولين</h2><p class="sub">عندك سؤال، أو محتاج تفسير لآية؟ اكتبه هنا، وواحد من المسؤولين هيرد عليك على الواتساب على الرقم اللي سجلت بيه.</p>
    ${pre ? `<blockquote class="vp-text"><p>«${esc(pre.text.length > 260 ? pre.text.slice(0, 260) + '…' : pre.text)}»</p><cite>${esc(pre.ref)}</cite></blockquote>` : '<div id="apick"></div>'}
    <textarea class="inp" id="aq" maxlength="600" placeholder="${pre ? 'إيه اللي محتاج تفهمه في الآية دي؟' : 'اكتب سؤالك…'}"></textarea>
    <div class="actions"><button class="btn red" id="asend">ابعت السؤال</button><button class="btn ghost" id="acl">إلغاء</button></div></div>`;
  document.body.appendChild(m); const close = () => m.remove();
  m.onclick = (e) => { if (e.target === m) close(); }; $('#acl', m).onclick = close;
  const get = pre ? () => pre : await versePicker($('#apick', m), { optional: true, keep: {} });
  setTimeout(() => $('#aq', m)?.focus(), 50);
  $('#asend', m).onclick = async () => {
    const t = $('#aq', m).value.trim(); const v = get();
    if (t.length < 3 && !v) return toast('اكتب سؤالك الأول 🙂');
    $('#asend', m).disabled = true;
    const ok = await api.ask(t || 'محتاج تفسير للآية دي', v?.ref || '', v?.text || '');
    if (!ok) { $('#asend', m).disabled = false; return toast('مقدرناش نبعت السؤال، جرّب تاني'); }
    close(); toast('سؤالك وصل للمسؤولين 🙏 هيردّوا عليك على الواتساب'); burst(innerWidth / 2, innerHeight / 2, 50);
  };
}

// قايمة «أسئلتي» عند المشترك
export function myQuestionsHTML(list) {
  if (!list || !list.length) return '<p class="muted" style="text-align:center;margin:10px 0 0">لسه مسألتش أي سؤال.</p>';
  return [...list].sort((a, b) => b.at - a.at).map((q) => `<article class="card myq ${q.status}">
    <div class="between"><span class="tag ${q.status === 'answered' ? 'ok' : 'late'}">${q.status === 'answered' ? '✓ اتردّ عليه' : '⏳ مستني الرد'}</span><small class="muted">${timeAgo(q.at)}</small></div>
    ${q.ref ? `<p class="ref" style="margin-top:8px">${esc(q.ref)}</p>` : ''}<p class="txt">${esc(q.text)}</p>
    ${q.status === 'answered' ? `<small class="muted">ردّ عليك ${esc(q.answeredBy || 'واحد من المسؤولين')} على الواتساب${q.answeredAt ? '، ' + timeAgo(q.answeredAt) : ''}</small>` : '<small class="muted">هيوصلك الرد على الواتساب</small>'}</article>`).join('');
}
