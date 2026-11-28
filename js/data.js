// طبقة البيانات: Firebase لو الإعدادات موجودة، وإلا وضع تجريبي على الجهاز
// الهوية: رقم الموبايل بيتحوّل لمعرّف مشفّر (SHA-256) فمفيش أرقام موبايل ظاهرة في الداتا العامة،
// والرقم نفسه محفوظ في collection منفصل (contacts) ما يقراش غير المسؤولين.
import { firebaseConfig } from './firebase-config.js';
import { DAYS, dueDays, todayCairo, clockVerified } from './plan.js';

const listeners = { users: new Set(), wall: new Set(), days: new Set(), chq: new Set(), exams: new Set(), myq: new Set(), blocked: new Set(), expired: new Set() };
// أخطاء معروفة بنعرض لها رسالة واضحة بدل «حصلت مشكلة»
export const errOf = (code, msg) => Object.assign(new Error(msg || code), { code });
export const BLOCKED_MSG = 'الرقم ده موقوف من المسؤولين. لو ده حصل بالغلط كلّم حد من المسؤولين.';
const emit = (k, v) => listeners[k].forEach((f) => { try { f(v); } catch (e) { console.error(e); } });
const PFX = 'ruh:';
const ck = {
  get(k) { try { const m = document.cookie.match(new RegExp('(?:^|; )ruh_' + k + '=([^;]*)')); return m ? decodeURIComponent(m[1]) : null; } catch (e) { return null; } },
  set(k, v) { try { document.cookie = `ruh_${k}=${encodeURIComponent(v)}; max-age=${60 * 60 * 24 * 400}; path=/; SameSite=Lax`; } catch (e) { /* ignore */ } },
  del(k) { try { document.cookie = `ruh_${k}=; max-age=0; path=/`; } catch (e) { /* ignore */ } },
};
const KEEP = ['me', 'myName'];
export const store = {
  get(k, d) {
    try { const v = localStorage.getItem(PFX + k); if (v) return JSON.parse(v); } catch (e) { /* ignore */ }
    if (KEEP.includes(k)) { const c = ck.get(k); if (c) { try { return JSON.parse(c); } catch (e) { return c; } } }
    return d;
  },
  set(k, v) { try { localStorage.setItem(PFX + k, JSON.stringify(v)); } catch (e) { /* ignore */ } if (KEEP.includes(k)) ck.set(k, JSON.stringify(v)); },
  del(k) { try { localStorage.removeItem(PFX + k); } catch (e) { /* ignore */ } if (KEEP.includes(k)) ck.del(k); },
};
try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { /* ignore */ }

export const normPhone = (p) => String(p || '').replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[^\d]/g, '').replace(/^(20|0020)/, '0');
export const validPhone = (p) => /^01[0125]\d{8}$/.test(normPhone(p));
export async function idOf(phone) {
  const b = new TextEncoder().encode('ruh-wa-hayat|' + phone);
  const h = await crypto.subtle.digest('SHA-256', b);
  return [...new Uint8Array(h)].map((x) => x.toString(16).padStart(2, '0')).join('').slice(0, 32);
}
const ms = (v) => (v && v.toMillis ? v.toMillis() : (typeof v === 'number' ? v : (v && v.seconds ? v.seconds * 1000 : null)));
// قراءة أو إجابة اتسجلت قبل يومها (بالثغرات القديمة: تغيير ساعة الموبايل أو ?date) ما بتتحسبش:
// وقت التسجيل جاي من سيرفر Firebase فمش ممكن يتزوّر. ولما اليوم ييجي، المشترك يقدر يقراه ويسجّله من جديد.
const cairoDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' });
const DAY_DATE = Object.fromEntries(DAYS.map((d) => [d.n, d.date]));
const DAY_OF_CH = Object.fromEntries(DAYS.flatMap((d) => d.ch.map((c) => [String(c), d.n])));
const tooEarly = (n, t) => !!(t && DAY_DATE[n] && cairoDay.format(new Date(t)) < DAY_DATE[n]);
function normUser(u) {
  const ra = {}; Object.entries(u.readAt || {}).forEach(([k, v]) => { const m = ms(v); if (m) ra[k] = m; });
  // byTime: بوقت السيرفر (أكيد). byDate: يومه لسه ماجاش بحسب ساعة الجهاز، فبنمسحه بس لو اتأكدنا من ساعة السيرفر
  const today = todayCairo(); const sure = clockVerified();
  const byTime = (u.readDays || []).filter((n) => tooEarly(n, ra[n]));
  const byDate = (u.readDays || []).filter((n) => !byTime.includes(n) && DAY_DATE[n] > today);
  const early = [...byTime, ...byDate]; early.forEach((n) => delete ra[n]);
  const qTime = [], qDate = []; const quiz = {};
  Object.entries(u.quiz || {}).forEach(([k, q]) => { const n = DAY_OF_CH[k]; const at = ms(q && q.at);
    if (n && (byTime.includes(n) || tooEarly(n, at))) qTime.push(k); else if (n && (byDate.includes(n) || DAY_DATE[n] > today)) qDate.push(k); else quiz[k] = at ? { ...q, at } : q; });
  const out = { ...u, readAt: ra, readDays: (u.readDays || []).filter((n) => !early.includes(n)), quiz, blocked: !!u.blocked, bonus: Number.isFinite(+u.bonus) ? +u.bonus : 0 };
  // اللي اتسجل قبل معاده مش بيظهر في أي مكان، وبيتمسح من البيانات (junk مخفي عن العرض)
  const days = sure ? early : byTime; const qk = sure ? [...qTime, ...qDate] : qTime;
  Object.defineProperty(out, 'junk', { value: days.length || qk.length ? { days, quiz: qk } : null, enumerable: false });
  return out;
}
const normExam = (id, x) => ({ id, ...x, createdAt: ms(x.createdAt) || 0, openAt: ms(x.openAt) || null, closeAt: ms(x.closeAt) || null, questions: x.questions || [], results: x.results || [] });

// حالة الامتحان بالوقت: draft | soon | open | closed | published
export function examState(e, now = Date.now()) {
  if (e.status === 'published') return 'published';
  if (e.status === 'closed') return 'closed';
  if (e.status !== 'open') return 'draft';
  if (e.openAt && now < e.openAt) return 'soon';
  if (e.closeAt && now > e.closeAt) return 'closed';
  return 'open';
}
// ---- أنواع الأسئلة (للامتحانات وللأسئلة تحت كل أصحاح): ٤ أساسية + ٨ إبداعية
export const QTYPES = { mcq: 'اختياري', tf: 'صح وخطأ', fill: 'أكمل', essay: 'مقالي',
  order: 'رتّب الأحداث', match: 'وصّل', multi: 'أكتر من إجابة', words: 'رتّب الآية', riddle: 'مين أنا؟', num: 'قدّر الرقم', emoji: 'خمّن بالإيموجي', quote: 'مين القائل؟' };
export const QICON = { mcq: '🔘', tf: '⚖️', fill: '✏️', essay: '📝', order: '🔢', match: '🔗', multi: '☑️', words: '🧩', riddle: '🕵️', num: '🔟', emoji: '😀', quote: '🗣️' };
export const BASIC_TYPES = ['mcq', 'tf', 'fill', 'essay'];
export const CREATIVE_TYPES = ['order', 'match', 'multi', 'words', 'riddle', 'num', 'emoji', 'quote'];
// توحيد الكتابة العربية لمقارنة إجابات «أكمل»: من غير تشكيل ولا تطويل، أ إ آ = ا، ى = ي، ة = ه، ومن غير «ال» في أول الكلمة
export function normAr(t) {
  return String(t ?? '').replace(/[ً-ْٰـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/[٠-٩]/g, (c) => '٠١٢٣٤٥٦٧٨٩'.indexOf(c)).replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/^(ال)(?=\S{3,})/g, '').replace(/\s+/g, ' ').trim();
}
const accepted = (k) => String(k ?? '').split(/[\/،,|]| او /).map(normAr).filter(Boolean).map((x) => x.replace(/^ال(?=\S{3,})/, ''));
export const qPts = (q) => Math.max(1, +(q && q.pts) || 1);
export const qType = (q) => (q && q.type) || 'mcq';
export const csv = (s) => (Array.isArray(s) ? s : String(s ?? '').split(',')).filter((x) => x !== '' && x != null).map(Number);
export const toNum = (v) => { const t = String(v ?? '').trim(); if (t === '') return NaN; return Number(t.replace(/[٠-٩]/g, (c) => '٠١٢٣٤٥٦٧٨٩'.indexOf(c)).replace(/[٫،]/g, '.').replace(/[^\d.\-]/g, '')); };

// ---- خلط ثابت (نفس السؤال دايمًا يتخلط بنفس الشكل)، عشان إجابات الامتحان تفضل مظبوطة لو اتعدّل
const hashStr = (str) => { let h = 2166136261; for (const c of String(str)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
export function shuf(n, seed) {
  const idx = [...Array(n).keys()]; let x = hashStr(seed) || 1; const r = () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  if (n > 1 && idx.every((v, i) => v === i)) idx.push(idx.shift());
  return idx;
}
// صيغة السؤال «الكاملة» (اللي بيكتبها المسؤول وبتتخزن في بنك الأسئلة) ← { pub: اللي بيتشاف، key: الإجابة الصح }
export function splitQ(q) {
  const t = qType(q); const base = { type: t, q: q.q, ...(q.pts ? { pts: q.pts } : {}) };
  if (t === 'mcq' || t === 'emoji' || t === 'quote') return { pub: { ...base, options: q.options, ...(t === 'emoji' ? { emo: q.emo || '' } : {}) }, key: q.answer };
  if (t === 'riddle') return { pub: { ...base, hints: q.hints, options: q.options }, key: q.answer };
  if (t === 'multi') return { pub: { ...base, options: q.options }, key: [...q.answers].sort((x, y) => x - y).join(',') };
  if (t === 'tf') return { pub: base, key: q.tf !== false };
  if (t === 'fill') return { pub: base, key: q.fill };
  if (t === 'essay') return { pub: base, key: { model: q.model || '' } };
  if (t === 'num') return { pub: { ...base, unit: q.unit || '' }, key: { v: +q.v, tol: +q.tol || 0 } };
  if (t === 'order') { const n = q.items.length; const p = shuf(n, q.q + q.items.join('|')); return { pub: { ...base, items: p.map((i) => q.items[i]) }, key: q.items.map((_, k) => p.indexOf(k)).join(',') }; }
  if (t === 'match') { const n = q.pairs.length; const p = shuf(n, q.q + q.pairs.map((x) => x.r).join('|')); return { pub: { ...base, left: q.pairs.map((x) => x.l), right: p.map((j) => q.pairs[j].r) }, key: q.pairs.map((_, k) => p.indexOf(k)).join(',') }; }
  if (t === 'words') { const w = String(q.verse).trim().split(/\s+/); const p = shuf(w.length, q.q + q.verse); return { pub: { ...base, words: p.map((i) => w[i]) }, key: w.join(' ') }; }
  return { pub: base, key: null };
}
// العكس: من اللي بيتشاف + الإجابة الصح ← صيغة المسؤول (لما نفتح امتحان للتعديل)
const pad = (a, n) => { const o = [...(a || [])]; while (o.length < n) o.push(''); return o; };
export function joinQ(pub, k) {
  const t = qType(pub); const b = { type: t, q: pub.q, pts: qPts(pub) }; const nOpt = Math.max(4, (pub.options || []).length);
  if (t === 'mcq' || t === 'emoji' || t === 'quote') return { ...b, options: pad(pub.options, nOpt), answer: typeof k === 'number' ? k : 0, ...(t === 'emoji' ? { emo: pub.emo || '' } : {}) };
  if (t === 'riddle') return { ...b, hints: pad(pub.hints, 3), options: pad(pub.options, nOpt), answer: typeof k === 'number' ? k : 0 };
  if (t === 'multi') return { ...b, options: pad(pub.options, nOpt), answers: csv(k) };
  if (t === 'tf') return { ...b, tf: k !== false };
  if (t === 'fill') return { ...b, fill: typeof k === 'string' ? k : '' };
  if (t === 'essay') return { ...b, model: (k && k.model) || '' };
  if (t === 'num') return { ...b, v: k && k.v != null ? k.v : '', tol: k && k.tol ? k.tol : 0, unit: pub.unit || '' };
  if (t === 'order') return { ...b, items: csv(k).map((j) => pub.items[j]) };
  if (t === 'match') { const m = csv(k); return { ...b, pairs: (pub.left || []).map((l, i) => ({ l, r: (pub.right || [])[m[i]] ?? '' })) }; }
  if (t === 'words') return { ...b, verse: typeof k === 'string' ? k : (pub.words || []).join(' ') };
  return b;
}
// الإجابة مكتملة؟ (عشان زرار «التالي» و«تأكد»)
export function isDone(q, a) {
  const t = qType(q); if (a == null) return false;
  if (t === 'order') return csv(a).length === (q.items || []).length;
  if (t === 'match') { const v = String(a).split(','); return v.length === (q.left || []).length && v.every((x) => x !== '' && +x >= 0); }
  if (t === 'multi') return csv(a).length > 0;
  if (t === 'words') return String(a).trim().split(/\s+/).filter(Boolean).length === (q.words || []).length;
  if (t === 'riddle') return typeof a === 'object' && a.a != null && a.a >= 0;
  if (t === 'num') return Number.isFinite(toNum(a));
  return typeof a !== 'string' || a.trim().length > 0;
}
// درجة جزئية (٠ لـ ١) للأنواع الإبداعية والاختيارية
function autoFrac(t, k, a) {
  if (t === 'order') { const K = csv(k), A = csv(a); return K.length ? K.filter((v, i) => A[i] === v).length / K.length : 0; }
  if (t === 'match') { const K = csv(k), A = String(a).split(',').map(Number); return K.length ? K.filter((v, i) => A[i] === v).length / K.length : 0; }
  if (t === 'multi') { const K = csv(k), A = csv(a); const good = A.filter((x) => K.includes(x)).length; return K.length ? Math.max(0, (good - (A.length - good)) / K.length) : 0; }
  if (t === 'words') { const K = normAr(k).split(' ').filter(Boolean), A = normAr(a).split(' ').filter(Boolean); return K.length ? K.filter((w, i) => A[i] === w).length / K.length : 0; }
  if (t === 'riddle') return a && a.a === k ? [1, 2 / 3, 1 / 3][Math.min(2, Math.max(0, (+a.h || 1) - 1))] : 0;
  if (t === 'num') { const v = toNum(a); if (!Number.isFinite(v) || !k) return 0; const d = Math.abs(v - k.v); return d === 0 ? 1 : (k.tol && d <= k.tol ? 0.5 : 0); }
  return a === k ? 1 : 0;
}
// سؤال واحد ← { got, max, auto, pending } (pending = مقالي لسه متصححش)
export function gradeOne(q, k, a, g) {
  const max = qPts(q); const t = qType(q);
  if (g != null && g !== '') return { got: Math.min(max, Math.max(0, +g)), max, auto: false, pending: false };
  if (a == null || a === '') return { got: 0, max, auto: true, pending: false };
  if (t === 'essay') return { got: 0, max, auto: false, pending: true };
  if (t === 'fill') { const x = normAr(a).replace(/^ال(?=\S{3,})/, ''); return { got: accepted(k).includes(x) ? max : 0, max, auto: true, pending: false }; }
  const f = autoFrac(t, k, a); return { got: Math.round(f * max * 2) / 2, max, auto: true, pending: false, frac: f };
}
// نص الإجابة (بتاعة المشترك / الصح) للعرض في التصحيح والتقارير
const riddleWord = (h) => (h > 2 ? 'تلميحات' : h === 2 ? 'تلميحين' : 'تلميح');
export function ansLabel(q, a) {
  const t = qType(q); if (a == null || a === '') return 'ماجاوبش';
  if (t === 'mcq' || t === 'emoji' || t === 'quote') return (q.options || [])[a] ?? '—';
  if (t === 'tf') return a ? 'صح' : 'خطأ';
  if (t === 'order') return csv(a).map((j, i) => `${i + 1}) ${(q.items || [])[j] ?? '؟'}`).join('  ');
  if (t === 'match') return String(a).split(',').map((r, i) => `${(q.left || [])[i] ?? ''} ← ${+r >= 0 ? (q.right || [])[+r] : '؟'}`).join('  ·  ');
  if (t === 'multi') return csv(a).map((j) => (q.options || [])[j]).join('، ');
  if (t === 'riddle') return `${(q.options || [])[a.a] ?? '—'} (بعد ${a.h || 1} ${riddleWord(a.h || 1)})`;
  if (t === 'num') return String(a) + (q.unit ? ' ' + q.unit : '');
  return String(a);
}
export function keyLabel(q, k) {
  const t = qType(q);
  if (t === 'mcq' || t === 'emoji' || t === 'quote' || t === 'riddle') return (q.options || [])[k] ?? '';
  if (t === 'tf') return k ? 'صح' : 'خطأ';
  if (t === 'order') return csv(k).map((j, i) => `${i + 1}) ${(q.items || [])[j] ?? '؟'}`).join('  ');
  if (t === 'match') return csv(k).map((r, i) => `${(q.left || [])[i] ?? ''} ← ${(q.right || [])[r] ?? ''}`).join('  ·  ');
  if (t === 'multi') return csv(k).map((j) => (q.options || [])[j]).join('، ');
  if (t === 'num') return k ? `${k.v}${q.unit ? ' ' + q.unit : ''}${k.tol ? ` (±${k.tol} بنص درجة)` : ''}` : '';
  if (t === 'essay') return (k && k.model) || '';
  return String(k ?? '');
}
export function scoreSub(exam, key, sub) {
  const Q = exam.questions || []; let score = 0, total = 0, pending = 0;
  Q.forEach((q, i) => { const r = gradeOne(q, (key || [])[i], sub.answers && sub.answers[i], sub.grades && sub.grades[i]); score += r.got; total += r.max; if (r.pending) pending++; });
  return { score, total, pending };
}
export function buildResults(exam, key, subs) {
  return subs.map((s) => { const r = scoreSub(exam, key, s); return { name: s.name, id: s.userId, score: r.score, total: r.total, pending: r.pending, dur: s.dur || 0, at: ms(s.at) || 0 }; })
    .sort((a, b) => b.score - a.score || a.dur - b.dur || a.at - b.at);
}
// تفاعلات «آيات لمستنا»: كل تفاعل عبارة من الكتاب
export const REACTS = [
  { k: 'amen', e: '🙏', t: 'آمين', v: '«آمِينَ. تَعَالَ أَيُّهَا الرَّبُّ يَسُوعُ» (رؤ ٢٢: ٢٠)' },
  { k: 'love', e: '❤️', t: 'لمستني', v: '«مَا أَحْلَى قَوْلَكَ لِحَنَكِي» (مز ١١٩: ١٠٣)' },
  { k: 'fire', e: '🔥', t: 'ألهبت قلبي', v: '«أَلَمْ يَكُنْ قَلْبُنَا مُلْتَهِبًا فِينَا» (لو ٢٤: ٣٢)' },
  { k: 'light', e: '💡', t: 'نوّرتني', v: '«سِرَاجٌ لِرِجْلِي كَلَامُكَ وَنُورٌ لِسَبِيلِي» (مز ١١٩: ١٠٥)' },
  { k: 'strong', e: '💪', t: 'قوّتني', v: '«أَسْتَطِيعُ كُلَّ شَيْءٍ فِي الْمَسِيحِ الَّذِي يُقَوِّينِي» (في ٤: ١٣)' },
  { k: 'tears', e: '😢', t: 'بكّتتني', v: '«فَلَمَّا سَمِعُوا نُخِسُوا فِي قُلُوبِهِمْ» (أع ٢: ٣٧)' },
];
export const initialOf = (n) => { const c = String(n || '').trim()[0]; return c ? c + '.' : '؟'; };

let impl = null;
export let mode = 'demo';

// ------------------------------------------------------------------ DEMO (على الجهاز بس)
// أسئلة إبداعية للوضع التجريبي
const demoCreative = [
  { type: 'order', q: 'رتّب أحداث الطوفان', items: ['نوح وأسرته يدخلوا الفلك', 'تنفجر ينابيع الغمر', 'الرب يغلق الباب على نوح', 'المياه تغطي الجبال'] },
  { type: 'match', q: 'وصّل كل واحد بشغله', pairs: [{ l: 'قايين', r: 'عامل في الأرض' }, { l: 'هابيل', r: 'راعي غنم' }, { l: 'شيث', r: 'اتولد عوض هابيل' }] },
  { type: 'multi', q: 'إيه اللي قاله ربنا لنوح عن الفلك؟ (اختار كل الصح)', options: ['من خشب جفر', 'يتطلي بالقار', 'بابه في جانبه', 'من الحجر'], answers: [0, 1, 2] },
  { type: 'quote', q: 'أَحَارِسٌ أَنَا لِأَخِي؟', options: ['قايين', 'هابيل', 'آدم', 'لامك'], answer: 0 },
  { type: 'num', q: 'كام سنة عاش آدم؟', v: 930, tol: 10, unit: 'سنة' },
];
function demoImpl() {
  const K = 'demo1_';
  const memo = { users: store.get(K + 'users', null), wall: store.get(K + 'wall', null), days: store.get(K + 'days', {}), chq: store.get(K + 'chq', {}), exams: store.get(K + 'exams', []), keys: store.get(K + 'keys', {}), subs: store.get(K + 'subs', []), qs: store.get(K + 'qs', null), blocked: store.get(K + 'blocked', {}) };
  if (!memo.users) {
    const names = ['مينا عادل', 'مارينا سمير', 'كيرلس ناجي', 'مريم هاني', 'أبانوب رأفت', 'فادي جرجس', 'كاترين عماد', 'يوستينا مجدي', 'جورج صبحي', 'ماريان فايز', 'مايكل نبيل', 'ساندرا رامي', 'أندرو ماهر', 'ميرنا أشرف', 'شنودة فكري', 'فيرينا وجيه', 'بولا إسحق', 'ديفيد عاطف'];
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const due = dueDays(); const tdy = todayCairo();
    memo.users = names.map((name, i) => {
      const skill = 0.35 + rnd() * 0.65; const readDays = []; const readAt = {};
      due.forEach((d) => {
        if (d.date === tdy ? rnd() < 0.55 : rnd() < skill) {
          readDays.push(d.n); const late = d.date !== tdy && rnd() < 0.22;
          readAt[d.n] = new Date(d.date + 'T19:00:00Z').getTime() + (late ? 864e5 * (1 + Math.floor(rnd() * 3)) : 0);
        }
      });
      return { id: 'demo' + (1000 + i), phone: '0100000' + String(1000 + i), name, readDays, readAt, quiz: rnd() < .6 ? { 1: { c: rnd() < .5 ? 3 : 2, t: 3 } } : {}, createdAt: Date.now() - 864e5 * 2 };
    });
    memo.wall = [
      { id: 'w1', type: 'verse', name: 'مارينا سمير', userId: 'demo1001', text: 'فِي الْبَدْءِ خَلَقَ اللهُ السَّمَاوَاتِ وَالْأَرْضَ', ref: 'تكوين ١: ١', at: Date.now() - 36e5 * 20, amens: 2 },
      { id: 'w2', type: 'reflection', name: 'كيرلس ناجي', userId: 'demo1002', text: 'ربنا بيبدأ بالنور… لما بحس إن يومي مضلم بفتكر «ليكن نور».', ref: '', at: Date.now() - 36e5 * 9, amens: 5 },
      { id: 'w3', type: 'verse', name: 'مريم هاني', userId: 'demo1003', text: 'وَكَانَ الرَّبُّ مَعَ يُوسُفَ فَكَانَ رَجُلًا نَاجِحًا', ref: 'تكوين ٣٩: ٢', at: Date.now() - 36e5 * 5, amens: 1 },
    ];
    memo.days = { 1: { reflection: 'ربنا بيبدأ بالنور. قبل ما يخلق أي حاجة قال «ليكن نور». يمكن النهارده عندك حاجة ضلمة… اديها لربنا يقول فيها «ليكن نور».', question: 'إيه الحاجة اللي محتاج ربنا يقول فيها «ليكن نور» النهارده؟' } };
    memo.chq = { 1: { questions: [
      { q: 'إيه أول حاجة قال الله «ليكن»؟', options: ['الجَلَد', 'النور', 'الأرض', 'الإنسان'], answer: 1, explain: '«وَقَالَ اللهُ: لِيَكُنْ نُورٌ، فَكَانَ نُورٌ» (تك ١: ٣)' },
      { q: 'في أنهي يوم خلق الله الإنسان؟', options: ['الرابع', 'الخامس', 'السادس', 'السابع'], answer: 2, explain: 'اليوم السادس (تك ١: ٢٧–٣١)' },
      { q: 'خلق الله الإنسان على…', options: ['صورته', 'صورة الملائكة', 'صورة الحيوان', 'مفيش إجابة صح'], answer: 0, explain: '«فَخَلَقَ اللهُ الإِنْسَانَ عَلَى صُورَتِهِ» (تك ١: ٢٧)' },
      { type: 'order', q: 'رتّب أيام الخلق من الأول للسادس', items: ['النور', 'الجَلَد (السماء)', 'اليابسة والنباتات', 'الشمس والقمر والنجوم', 'الأسماك والطيور', 'الحيوانات والإنسان'], explain: 'تكوين ١: ٣–٣١' },
      { type: 'match', q: 'وصّل كل يوم بالحاجة اللي اتخلقت فيه', pairs: [{ l: 'اليوم الأول', r: 'النور' }, { l: 'اليوم الرابع', r: 'الشمس والقمر' }, { l: 'اليوم الخامس', r: 'الطيور والأسماك' }, { l: 'اليوم السادس', r: 'الإنسان' }], explain: 'تكوين ١' },
      { type: 'emoji', q: 'الإيموجي دي بتفكرك بأنهي يوم من أيام الخلق؟', emo: '☀️🌙⭐', options: ['اليوم الأول', 'اليوم الثاني', 'اليوم الرابع', 'اليوم السادس'], answer: 2, explain: '«فَعَمِلَ اللهُ النُّورَيْنِ الْعَظِيمَيْنِ… وَالنُّجُومَ» (تك ١: ١٦)' },
      { type: 'multi', q: 'اختار كل اللي اتخلق في اليوم الثالث', options: ['اليابسة والبحار', 'العشب والأشجار المثمرة', 'الشمس والقمر', 'الطيور', 'الإنسان'], answers: [0, 1], explain: 'تكوين ١: ٩–١٣' },
      { type: 'words', q: 'رتّب كلمات أول آية في الكتاب المقدس', verse: 'فِي الْبَدْءِ خَلَقَ اللهُ السَّمَاوَاتِ وَالْأَرْضَ.', explain: 'تكوين ١: ١' },
      { type: 'riddle', q: 'مين أنا؟', hints: ['أنا أول امرأة في الكتاب', 'اتبنيت من ضلع', 'آدم سمّاني اسم معناه «أم كل حي»'], options: ['حواء', 'سارة', 'رفقة', 'راحيل'], answer: 0, explain: 'تكوين ٣: ٢٠' },
      { type: 'num', q: 'كام يوم اشتغل الله في الخلق قبل ما يستريح؟', v: 6, tol: 0, unit: 'أيام', explain: 'تكوين ٢: ٢' },
    ] } };
    memo.exams = [{ id: 'ex1', title: 'امتحان الأسبوع الأول', desc: 'تكوين ١ – ٧', status: 'open', openAt: null, closeAt: Date.now() + 864e5 * 5, questions: [
      { q: 'مين قتل هابيل؟', options: ['قايين', 'شيث', 'آدم', 'نوح'] },
      { q: 'كام يوم استمر المطر في الطوفان؟', options: ['٧ أيام', '٤٠ يومًا', '١٠٠ يوم', 'سنة'] },
      { q: 'الإنسان اتخلق من…', options: ['نار', 'تراب الأرض', 'ميّة', 'هوا'] },
      ...demoCreative.map((x) => splitQ({ ...x, pts: x.type === 'riddle' || x.type === 'order' ? 3 : 2 }).pub),
    ], results: [], createdAt: Date.now() - 864e5 }];
    memo.keys = { ex1: [0, 1, 1, ...demoCreative.map((x) => splitQ(x).key)] };
    save();
  }
  if (!memo.qs) {
    memo.qs = [
      { id: 'q1', userId: 'demo1002', name: 'كيرلس ناجي', uid: 'demo-demo1002', ref: 'تكوين ٦: ٢', verse: 'أَنَّ أَبْنَاءَ اللهِ رَأَوْا بَنَاتِ النَّاسِ أَنَّهُنَّ حَسَنَاتٌ', text: 'مين هما «أبناء الله» و«بنات الناس» هنا؟', status: 'new', at: Date.now() - 36e5 * 3 },
      { id: 'q2', userId: 'demo1005', name: 'فادي جرجس', uid: 'demo-demo1005', ref: '', verse: '', text: 'إزاي قايين خاف إن حد يقتله وهما كانوا عيلة واحدة بس؟', status: 'answered', answeredBy: 'بيشوي', answeredAt: Date.now() - 36e5 * 20, at: Date.now() - 36e5 * 30 },
    ];
    memo.wall = (memo.wall || []).concat([{ id: 'w4', type: 'prayer', name: 'م.', userId: '', uid: 'demo-demo1003', text: 'صلّوا عشان امتحانات الميدترم الأسبوع الجاي', ref: '', at: Date.now() - 36e5 * 5, amens: 7 }]);
    save();
  }
  function save() { Object.entries(memo).forEach(([k, v]) => store.set(K + k, v)); }
  const me = () => memo.users.find((u) => u.id === store.get('me', null));
  const guard = () => { const u = me(); if (!u) throw errOf('expired'); if (u.blocked) throw errOf('blocked', BLOCKED_MSG); return u; };
  const myUid = () => 'demo-' + (store.get('me', '') || '');
  const all = () => {
    let dirty = false;
    memo.users.forEach((u) => { const j = normUser(u).junk; if (!j) return; dirty = true; u.readDays = u.readDays.filter((n) => !j.days.includes(n)); j.days.forEach((n) => delete u.readAt[n]); j.quiz.forEach((k) => delete u.quiz[k]); });
    if (dirty) save();
    emit('myq', (memo.qs || []).filter((q) => q.uid === myUid())); emit('users', memo.users.map(normUser)); emit('wall', memo.wall); emit('days', memo.days); emit('chq', memo.chq); emit('exams', memo.exams.map((x) => normExam(x.id, x))); };
  return {
    async init() { setTimeout(all, 0); return me() ? normUser(me()) : null; },
    async login(name, phone) {
      let u = memo.users.find((x) => x.phone === phone);
      if (memo.blocked[phone] || (u && u.blocked)) throw errOf('blocked', BLOCKED_MSG);
      if (!u) { u = { id: 'u' + Date.now(), phone, name, readDays: [], readAt: {}, quiz: {}, createdAt: Date.now() }; memo.users.push(u); } else u.name = name;
      store.set('me', u.id); save(); all(); return normUser(u);
    },
    async logout() { store.del('me'); },
    async rename(name) { const u = me(); if (!u) return; u.name = name; save(); all(); },
    async adminRename(id, name) { const u = memo.users.find((x) => x.id === id); if (u) { u.name = name; save(); all(); } },
    async setBonus(id, n) { const u = memo.users.find((x) => x.id === id); if (u) { u.bonus = n; save(); all(); } },
    async adminDeleteUser(id) { memo.users = memo.users.filter((x) => x.id !== id); save(); all(); },
    // حظر أرقام الموبايل (المفتاح في الوضع التجريبي هو الرقم نفسه)
    async blockPhone(phone, note) { const u = memo.users.find((x) => x.phone === phone); return this.blockUser(u ? u.id : '', phone, u ? u.name : '', note); },
    async blockUser(id, phone, name, note) {
      const u = memo.users.find((x) => x.id === id) || memo.users.find((x) => phone && x.phone === phone); const p = phone || u?.phone || id;
      memo.blocked[p] = { id: u?.id || '', phone: phone || u?.phone || '', name: name || u?.name || '', note: note || '', at: Date.now() };
      if (u) u.blocked = true; save(); all(); if (u && u.id === store.get('me', null)) emit('blocked', true); return p;
    },
    async unblock(key) { const b = memo.blocked[key]; delete memo.blocked[key]; const u = b && memo.users.find((x) => x.id === b.id || (b.phone && x.phone === b.phone)); if (u) u.blocked = false; save(); all(); return true; },
    async blockedList() { return Object.entries(memo.blocked).map(([key, b]) => ({ key, ...b })).sort((a, b) => b.at - a.at); },
    async setRead(n, on) { const u = guard(); const s = new Set(u.readDays); on ? s.add(n) : s.delete(n); u.readDays = [...s].sort((a, b) => a - b); u.readAt = { ...(u.readAt || {}), [n]: Date.now() }; save(); all(); },
    async answerChq(key, c, t) { const u = guard(); u.quiz = { ...(u.quiz || {}), [key]: { c, t, at: Date.now() } }; save(); all(); },
    myUid,
    async post(type, text, ref, note) { const u = guard(); const anon = type === 'prayer'; memo.wall.push({ id: 'w' + Date.now(), type, text, ref: ref || '', note: note || '', name: anon ? initialOf(u.name) : u.name, userId: anon ? '' : u.id, uid: myUid(), at: Date.now(), amens: 0 }); save(); all(); },
    async amen(id) { const w = memo.wall.find((x) => x.id === id); if (w) { w.amens = (w.amens || 0) + 1; save(); all(); } },
    async react(id, k) { const w = memo.wall.find((x) => x.id === id); if (!w) return true; const r = { ...(w.reacts || {}) }; const u = myUid(); if (!k) delete r[u]; else r[u] = { t: k, n: me().name }; w.reacts = r; save(); all(); return true; },
    async removePost(id) { memo.wall = memo.wall.filter((x) => x.id !== id); save(); all(); },
    async isServant() { return !!store.get('servant', false); },
    async unlock(code) { if (code === store.get('demo_code', '2026')) { store.set('servant', true); return true; } return false; },
    async setCode(code) { store.set('demo_code', code); store.set('servant', true); return true; },
    async contacts() { return Object.fromEntries(memo.users.map((u) => [u.id, u.phone])); },
    async saveDay(n, data) { memo.days[n] = { ...(memo.days[n] || {}), ...data }; save(); all(); },
    async saveChq(key, questions) { if (questions.length) memo.chq[key] = { questions }; else delete memo.chq[key]; save(); all(); },
    async saveExam(ex, key) {
      const id = ex.id || 'ex' + Date.now(); const i = memo.exams.findIndex((x) => x.id === id);
      const doc = { ...(i >= 0 ? memo.exams[i] : { results: [], createdAt: Date.now(), status: 'draft' }), ...ex, id };
      i >= 0 ? (memo.exams[i] = doc) : memo.exams.push(doc); if (key) memo.keys[id] = key; save(); all(); return id;
    },
    async deleteExam(id) { memo.exams = memo.exams.filter((x) => x.id !== id); delete memo.keys[id]; memo.subs = memo.subs.filter((s) => s.examId !== id); save(); all(); },
    async examKey(id) { return memo.keys[id] || []; },
    async submitExam(id, answers, dur) { const u = me(); if (memo.subs.some((s) => s.examId === id && s.userId === u.id)) return false; memo.subs.push({ examId: id, userId: u.id, name: u.name, answers, dur, at: Date.now() }); save(); return true; },
    async mySubmission(id) { const u = me(); return memo.subs.find((s) => s.examId === id && s.userId === u?.id) || null; },
    async submissions(id) { return memo.subs.filter((s) => s.examId === id); },
    async gradeSubmission(id, userId, grades) { const s = memo.subs.find((x) => x.examId === id && x.userId === userId); if (s) { s.grades = grades; save(); } return true; },
    async ask(text, ref, verse) { const u = me(); if (!u || u.blocked) return false; memo.qs.unshift({ id: 'q' + Date.now(), userId: u.id, name: u.name, uid: myUid(), text, ref: ref || '', verse: verse || '', status: 'new', at: Date.now() }); save(); all(); return true; },
    async listQuestions() { return [...memo.qs].sort((a, b) => b.at - a.at); },
    async markAnswered(id, by, on = true) { const q = memo.qs.find((x) => x.id === id); if (q) { q.status = on ? 'answered' : 'new'; q.answeredBy = on ? by : ''; q.answeredAt = on ? Date.now() : null; save(); all(); } return true; },
  };
}

// ------------------------------------------------------------------ FIREBASE
async function firebaseImpl() {
  const V = '10.12.2';
  const [{ initializeApp }, A, F] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`),
  ]);
  const app = initializeApp(firebaseConfig);
  const auth = A.getAuth(app);
  const db = F.initializeFirestore(app, { localCache: F.persistentLocalCache() });
  await A.setPersistence(auth, A.browserLocalPersistence);
  if (typeof auth.authStateReady === 'function') await auth.authStateReady(); else await new Promise((ok) => { const u = A.onAuthStateChanged(auth, () => { u(); ok(); }); });
  const cred = auth.currentUser ? { user: auth.currentUser } : await A.signInAnonymously(auth);
  const uid = cred.user.uid;
  let users = []; let myId = store.get('me', null);
  const subs = [];
  // لو الاتصال اترفض (حظر)، نتأكد ونبلّغ الصفحة
  const denied = (e) => { if (e && e.code === 'permission-denied') checkBan().then((b) => { if (b) emit('blocked', true); }); else console.warn(e); };
  async function checkBan() {
    try { if ((await F.getDoc(F.doc(db, 'bans', uid))).exists()) return true; } catch (e) { /* ignore */ }
    try { if (myId && (await F.getDoc(F.doc(db, 'blockedPhones', myId))).exists()) return true; } catch (e) { /* ignore */ }
    return false;
  }
  function startSubs() {
    if (subs.length) return;
    subs.push(F.onSnapshot(F.collection(db, 'users'), (s) => { users = s.docs.map((d) => { const x = d.data(); return normUser({ id: d.id, name: x.name, readDays: x.readDays, readAt: x.readAt, quiz: x.quiz, lastSeen: ms(x.lastSeen), blocked: x.blocked, bonus: x.bonus }); }); emit('users', users); if (!s.metadata.hasPendingWrites) cleanJunk(users); if (myId && !s.metadata.fromCache && !s.docs.some((d) => d.id === myId)) emit('expired', true); }, denied));
    subs.push(F.onSnapshot(F.query(F.collection(db, 'wall'), F.orderBy('at', 'desc'), F.limit(150)), (s) => {
      emit('wall', s.docs.map((d) => { const x = d.data(); return { id: d.id, ...x, at: ms(x.at) || Date.now() }; }));
    }));
    subs.push(F.onSnapshot(F.collection(db, 'days'), (s) => { const m = {}; s.docs.forEach((d) => { m[d.id] = d.data(); }); emit('days', m); }));
    subs.push(F.onSnapshot(F.collection(db, 'chq'), (s) => { const m = {}; s.docs.forEach((d) => { m[d.id] = d.data(); }); emit('chq', m); }));
    subs.push(F.onSnapshot(F.collection(db, 'exams'), (s) => { emit('exams', s.docs.map((d) => normExam(d.id, d.data()))); }));
    subs.push(F.onSnapshot(F.query(F.collection(db, 'questions'), F.where('uid', '==', uid)), (s) => { emit('myq', s.docs.map((d) => { const x = d.data(); return { id: d.id, ...x, at: ms(x.at) || Date.now(), answeredAt: ms(x.answeredAt) }; })); }, () => emit('myq', [])));
  }
  const me = () => users.find((u) => u.id === myId) || (myId ? normUser({ id: myId, name: store.get('myName', '') }) : null);
  // مسح القراءات والإجابات اللي اتسجلت قبل يومها من البيانات نفسها:
  // كل مشترك بيتمسح له بتاعه أول ما يفتح الموقع، والمسؤول لما يفتح الموقع بيمسح للكل
  let servant = false; const tried = new Set();
  const junkPatch = (j) => { const p = {}; if (j.days.length) p.readDays = F.arrayRemove(...j.days); j.days.forEach((n) => { p[`readAt.${n}`] = F.deleteField(); }); j.quiz.forEach((k) => { p[`quiz.${k}`] = F.deleteField(); }); return p; };
  function cleanJunk(list) {
    list.forEach((u) => {
      const j = u.junk; if (!j) return; const sig = u.id + JSON.stringify(j); if (tried.has(sig)) return; tried.add(sig);
      if (u.id === myId) selfUpdate(junkPatch(j)).catch((e) => console.warn('clean', e));
      else if (servant) F.updateDoc(F.doc(db, 'users', u.id), junkPatch(j)).catch((e) => console.warn('clean', u.id, e));
    });
  }
  const MAXU = 38; // القواعد بتسمح بـ٤٠ جهاز بالكتير، فبنسيب آخر ٢٠ لو العدد كبر
  const trimUids = (list) => { const l = (list || []).filter((x) => x !== uid); return l.length >= MAXU ? [...l.slice(-20), uid] : null; };
  const wait = (t) => new Promise((ok) => setTimeout(() => ok('queued'), t));
  const NET = ['unavailable', 'deadline-exceeded', 'aborted', 'internal', 'resource-exhausted'];
  // تعديل بيانات المشترك نفسه بأمان:
  // - بنضيف الجهاز الحالي لـ uids في كل مرة (السبب الأساسي لرسالة «حصلت مشكلة في الحفظ»: الجهاز بيتغيّر
  //   معرّفه بعد مسح البيانات أو تحديث المتصفح، بس الكوكي بتفضل فاكرة المشترك، فالقواعد كانت بترفض الحفظ)
  // - لو عدد الأجهزة وصل للحد، بنخفّفه
  // - لو النت ضعيف، الحفظ بيتسجل على الجهاز وبيتبعت لوحده أول ما النت يرجع
  async function selfUpdate(patch) {
    if (!myId) throw errOf('expired');
    const ref = F.doc(db, 'users', myId);
    const run = (p) => Promise.race([F.updateDoc(ref, p), wait(12000)]);
    for (let attempt = 0; ; attempt++) {
      try { return await run({ ...patch, uids: F.arrayUnion(uid) }); } catch (e) {
        if (e.code === 'not-found') throw errOf('expired');
        if (e.code === 'permission-denied') {
          let snap = null; try { snap = await F.getDoc(ref); } catch (e2) { throw e; }
          if (!snap.exists()) throw errOf('expired');
          if (snap.data().blocked || await checkBan()) { emit('blocked', true); throw errOf('blocked', BLOCKED_MSG); }
          const t = trimUids(snap.data().uids); if (t && attempt === 0) return await run({ ...patch, uids: t });
          throw e;
        }
        if (NET.includes(e.code) && attempt < 2) { await wait(1200 * (attempt + 1)); continue; }
        throw e;
      }
    }
  }
  return {
    async init() {
      if (!myId) {
        try {
          const q = await F.getDocs(F.query(F.collection(db, 'users'), F.where('uids', 'array-contains', uid), F.limit(1)));
          if (!q.empty) { myId = q.docs[0].id; store.set('me', myId); store.set('myName', q.docs[0].data().name); }
        } catch (e) { console.warn(e); }
      }
      if (myId) {
        // نتأكد إن المشترك لسه موجود، ومش محظور، وإن الجهاز ده مربوط بيه (عشان الحفظ ما يترفضش بعدين)
        try {
          const snap = await F.getDoc(F.doc(db, 'users', myId));
          if (!snap.exists()) { if (!snap.metadata.fromCache) { store.del('me'); store.del('myName'); myId = null; return null; } }
          else {
            const x = snap.data(); if (x.name) store.set('myName', x.name);
            if (x.blocked || await checkBan()) return { ...me(), blocked: true };
            if (!(x.uids || []).includes(uid)) selfUpdate({ lastSeen: F.serverTimestamp() }).catch((e) => console.warn('relink', e));
          }
        } catch (e) { if (e.code === 'permission-denied' && await checkBan()) return { ...me(), blocked: true }; console.warn(e); }
        startSubs();
      }
      return myId ? me() : null;
    },
    async login(name, phone) {
      const id = await idOf(phone); const ref = F.doc(db, 'users', id);
      let bl = false; try { bl = (await F.getDoc(F.doc(db, 'blockedPhones', id))).exists(); } catch (e) { /* ignore */ }
      if (bl) throw errOf('blocked', BLOCKED_MSG);
      const snap = await F.getDoc(ref);
      if (snap.exists()) {
        if (snap.data().blocked) throw errOf('blocked', BLOCKED_MSG);
        const t = trimUids(snap.data().uids);
        await F.updateDoc(ref, { name, uids: t || F.arrayUnion(uid), lastSeen: F.serverTimestamp() });
      } else await F.setDoc(ref, { name, uids: [uid], readDays: [], readAt: {}, quiz: {}, createdAt: F.serverTimestamp(), lastSeen: F.serverTimestamp() });
      try { await F.setDoc(F.doc(db, 'contacts', id), { phone }); } catch (e) { console.warn('contact', e); }
      myId = id; store.set('me', id); store.set('myName', name); startSubs(); return me();
    },
    async logout() { store.del('me'); store.del('myName'); myId = null; },
    async rename(name) { await selfUpdate({ name, lastSeen: F.serverTimestamp() }); store.set('myName', name); },
    async adminRename(id, name) { await F.updateDoc(F.doc(db, 'users', id), { name }); },
    async setBonus(id, n) { await F.updateDoc(F.doc(db, 'users', id), { bonus: n }); },
    async adminDeleteUser(id) { await F.deleteDoc(F.doc(db, 'users', id)); try { await F.deleteDoc(F.doc(db, 'contacts', id)); } catch (e) { /* ignore */ } },
    async setRead(n, on) {
      await selfUpdate(on ? { readDays: F.arrayUnion(n), [`readAt.${n}`]: F.serverTimestamp(), lastSeen: F.serverTimestamp() } : { readDays: F.arrayRemove(n) });
    },
    async answerChq(key, c, t) { await selfUpdate({ [`quiz.${key}`]: { c, t, at: F.serverTimestamp() }, lastSeen: F.serverTimestamp() }); },
    // ---- حظر أرقام الموبايل (المسؤولين): blockedPhones/{معرّف الرقم} بيمنع الدخول بالرقم ده من أي جهاز،
    // و bans/{uid} بيقفل القراءة والكتابة على الأجهزة اللي المشترك كان داخل منها
    async blockPhone(phone, note) { const id = await idOf(phone); return this.blockUser(id, phone, '', note); },
    async blockUser(id, phone, name, note) {
      const ref = F.doc(db, 'users', id); const snap = await F.getDoc(ref); const x = snap.exists() ? snap.data() : null;
      await F.setDoc(F.doc(db, 'blockedPhones', id), { phone: phone || '', name: name || x?.name || '', note: note || '', at: F.serverTimestamp() });
      if (x) {
        await F.updateDoc(ref, { blocked: true });
        await Promise.all((x.uids || []).map((u) => F.setDoc(F.doc(db, 'bans', u), { userId: id, at: F.serverTimestamp() }).catch((e) => console.warn('ban', e))));
      }
      return id;
    },
    async unblock(id) {
      await F.deleteDoc(F.doc(db, 'blockedPhones', id));
      const ref = F.doc(db, 'users', id); const snap = await F.getDoc(ref);
      if (snap.exists()) {
        await F.updateDoc(ref, { blocked: false });
        await Promise.all((snap.data().uids || []).map((u) => F.deleteDoc(F.doc(db, 'bans', u)).catch(() => {})));
      }
      return true;
    },
    async blockedList() { const q = await F.getDocs(F.collection(db, 'blockedPhones')); return q.docs.map((d) => { const x = d.data(); return { key: d.id, id: d.id, ...x, at: ms(x.at) || 0 }; }).sort((a, b) => b.at - a.at); },
    myUid: () => uid,
    async post(type, text, ref, note) { const u = me(); const anon = type === 'prayer'; await F.addDoc(F.collection(db, 'wall'), { type, text, ref: ref || '', note: note || '', name: anon ? initialOf(u.name) : u.name, userId: anon ? '' : myId, uid, at: F.serverTimestamp(), amens: 0 }); },
    async amen(id) { await F.updateDoc(F.doc(db, 'wall', id), { amens: F.increment(1) }); },
    async react(id, k) { try { await F.updateDoc(F.doc(db, 'wall', id), { [`reacts.${uid}`]: k ? { t: k, n: me().name } : F.deleteField() }); return true; } catch (e) { console.warn(e); return false; } },
    async removePost(id) { await F.deleteDoc(F.doc(db, 'wall', id)); },
    async isServant() { try { servant = (await F.getDoc(F.doc(db, 'admins', uid))).exists(); if (servant) cleanJunk(users); return servant; } catch (e) { return false; } },
    async unlock(code) { try { await F.setDoc(F.doc(db, 'admins', uid), { code, at: F.serverTimestamp() }); servant = true; cleanJunk(users); return true; } catch (e) { return false; } },
    async setCode(code) { try { await F.setDoc(F.doc(db, 'secrets', 'servants'), { code }); } catch (e) { return false; } return this.unlock(code); },
    async contacts() { try { const q = await F.getDocs(F.collection(db, 'contacts')); return Object.fromEntries(q.docs.map((d) => [d.id, d.data().phone])); } catch (e) { return {}; } },
    async saveDay(n, data) { await F.setDoc(F.doc(db, 'days', String(n)), { ...data, at: F.serverTimestamp() }, { merge: true }); },
    async saveChq(key, questions) { if (questions.length) await F.setDoc(F.doc(db, 'chq', String(key)), { questions, at: F.serverTimestamp() }); else await F.deleteDoc(F.doc(db, 'chq', String(key))); },
    async saveExam(ex, key) {
      const ref = ex.id ? F.doc(db, 'exams', ex.id) : F.doc(F.collection(db, 'exams'));
      const data = { ...ex }; delete data.id;
      ['openAt', 'closeAt'].forEach((k) => { if (k in data) data[k] = data[k] ? F.Timestamp.fromMillis(data[k]) : F.deleteField(); });
      if (!ex.id) { data.createdAt = F.serverTimestamp(); data.results = []; data.status = data.status || 'draft'; }
      await F.setDoc(ref, data, { merge: true }); if (key) await F.setDoc(F.doc(db, 'examKeys', ref.id), { answers: key }); return ref.id;
    },
    async deleteExam(id) { await F.deleteDoc(F.doc(db, 'exams', id)); try { await F.deleteDoc(F.doc(db, 'examKeys', id)); } catch (e) { /* ignore */ } },
    async examKey(id) { const s = await F.getDoc(F.doc(db, 'examKeys', id)); return s.exists() ? s.data().answers : []; },
    async submitExam(id, answers, dur) {
      const u = me(); try { await F.setDoc(F.doc(db, 'submissions', `${id}_${myId}`), { examId: id, userId: myId, name: u.name, uid, answers, dur, at: F.serverTimestamp() }); return true; } catch (e) { console.warn(e); return false; }
    },
    async mySubmission(id) { try { const s = await F.getDoc(F.doc(db, 'submissions', `${id}_${myId}`)); return s.exists() ? s.data() : null; } catch (e) { return null; } },
    async submissions(id) { const q = await F.getDocs(F.query(F.collection(db, 'submissions'), F.where('examId', '==', id))); return q.docs.map((d) => d.data()); },
    async gradeSubmission(id, userId, grades) { try { await F.updateDoc(F.doc(db, 'submissions', `${id}_${userId}`), { grades }); return true; } catch (e) { console.warn(e); return false; } },
    async ask(text, ref, verse) { const u = me(); try { await F.addDoc(F.collection(db, 'questions'), { userId: myId, name: u.name, uid, text, ref: ref || '', verse: verse || '', status: 'new', at: F.serverTimestamp() }); return true; } catch (e) { console.warn(e); return false; } },
    async listQuestions() { const q = await F.getDocs(F.query(F.collection(db, 'questions'), F.orderBy('at', 'desc'), F.limit(300))); return q.docs.map((d) => { const x = d.data(); return { id: d.id, ...x, at: ms(x.at) || 0, answeredAt: ms(x.answeredAt) }; }); },
    async markAnswered(id, by, on = true) { try { await F.updateDoc(F.doc(db, 'questions', id), on ? { status: 'answered', answeredBy: by || '', answeredAt: F.serverTimestamp() } : { status: 'new', answeredBy: '', answeredAt: null }); return true; } catch (e) { console.warn(e); return false; } },
  };
}

export async function init() {
  let forceDemo = false; try { forceDemo = new URLSearchParams(location.search).has('demo'); } catch (e) { /* ignore */ }
  if (firebaseConfig && firebaseConfig.apiKey && !forceDemo) {
    try { impl = await firebaseImpl(); mode = 'firebase'; } catch (e) { console.error('Firebase failed, demo mode', e); impl = demoImpl(); mode = 'demo'; }
  } else impl = demoImpl();
  return impl.init();
}
export const api = new Proxy({}, { get: (_, k) => (...a) => impl[k](...a) });
export function on(kind, f) { listeners[kind].add(f); return () => listeners[kind].delete(f); }
export { DAYS };
