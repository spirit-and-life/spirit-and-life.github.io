// طبقة البيانات: Firebase لو الإعدادات موجودة، وإلا وضع تجريبي على الجهاز
// الهوية: رقم الموبايل بيتحوّل لمعرّف مشفّر (SHA-256) فمفيش أرقام موبايل ظاهرة في الداتا العامة،
// والرقم نفسه محفوظ في collection منفصل (contacts) ما يقراش غير المسؤولين.
import { firebaseConfig } from './firebase-config.js';
import { DAYS, dueDays, todayCairo } from './plan.js';

const listeners = { users: new Set(), wall: new Set(), days: new Set(), chq: new Set(), exams: new Set(), myq: new Set() };
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
function normUser(u) { const ra = {}; Object.entries(u.readAt || {}).forEach(([k, v]) => { const m = ms(v); if (m) ra[k] = m; }); return { ...u, readAt: ra, readDays: u.readDays || [], quiz: u.quiz || {} }; }
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
// ---- الامتحانات: ٤ أنواع أسئلة (اختياري / صح وخطأ / أكمل / مقالي)
export const QTYPES = { mcq: 'اختياري', tf: 'صح وخطأ', fill: 'أكمل', essay: 'مقالي' };
// توحيد الكتابة العربية لمقارنة إجابات «أكمل»: من غير تشكيل ولا تطويل، أ إ آ = ا، ى = ي، ة = ه، ومن غير «ال» في أول الكلمة
export function normAr(t) {
  return String(t ?? '').replace(/[\u064B-\u0652\u0670\u0640]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/[٠-٩]/g, (c) => '٠١٢٣٤٥٦٧٨٩'.indexOf(c)).replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/^(ال)(?=\S{3,})/g, '').replace(/\s+/g, ' ').trim();
}
const accepted = (k) => String(k ?? '').split(/[\/،,|]| او /).map(normAr).filter(Boolean).map((x) => x.replace(/^ال(?=\S{3,})/, ''));
export const qPts = (q) => Math.max(1, +(q && q.pts) || 1);
export const qType = (q) => (q && q.type) || 'mcq';
// سؤال واحد ← { got, max, auto, pending } (pending = مقالي لسه متصححش)
export function gradeOne(q, k, a, g) {
  const max = qPts(q); const t = qType(q);
  if (g != null && g !== '') return { got: Math.min(max, Math.max(0, +g)), max, auto: false, pending: false };
  if (a == null || a === '') return { got: 0, max, auto: true, pending: false };
  if (t === 'essay') return { got: 0, max, auto: false, pending: true };
  if (t === 'fill') { const x = normAr(a).replace(/^ال(?=\S{3,})/, ''); return { got: accepted(k).includes(x) ? max : 0, max, auto: true, pending: false }; }
  return { got: a === k ? max : 0, max, auto: true, pending: false };
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
function demoImpl() {
  const K = 'demo1_';
  const memo = { users: store.get(K + 'users', null), wall: store.get(K + 'wall', null), days: store.get(K + 'days', {}), chq: store.get(K + 'chq', {}), exams: store.get(K + 'exams', []), keys: store.get(K + 'keys', {}), subs: store.get(K + 'subs', []), qs: store.get(K + 'qs', null) };
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
    ] } };
    memo.exams = [{ id: 'ex1', title: 'امتحان الأسبوع الأول', desc: 'تكوين ١ – ٧', status: 'open', openAt: null, closeAt: Date.now() + 864e5 * 5, questions: [
      { q: 'مين قتل هابيل؟', options: ['قايين', 'شيث', 'آدم', 'نوح'] },
      { q: 'كام يوم استمر المطر في الطوفان؟', options: ['٧ أيام', '٤٠ يومًا', '١٠٠ يوم', 'سنة'] },
      { q: 'الإنسان اتخلق من…', options: ['نار', 'تراب الأرض', 'ميّة', 'هوا'] },
    ], results: [], createdAt: Date.now() - 864e5 }];
    memo.keys = { ex1: [0, 1, 1] };
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
  const myUid = () => 'demo-' + (store.get('me', '') || '');
  const all = () => { emit('myq', (memo.qs || []).filter((q) => q.uid === myUid())); emit('users', memo.users.map(normUser)); emit('wall', memo.wall); emit('days', memo.days); emit('chq', memo.chq); emit('exams', memo.exams.map((x) => normExam(x.id, x))); };
  return {
    async init() { setTimeout(all, 0); return me() ? normUser(me()) : null; },
    async login(name, phone) {
      let u = memo.users.find((x) => x.phone === phone);
      if (!u) { u = { id: 'u' + Date.now(), phone, name, readDays: [], readAt: {}, quiz: {}, createdAt: Date.now() }; memo.users.push(u); } else u.name = name;
      store.set('me', u.id); save(); all(); return normUser(u);
    },
    async logout() { store.del('me'); },
    async rename(name) { const u = me(); if (!u) return; u.name = name; save(); all(); },
    async adminRename(id, name) { const u = memo.users.find((x) => x.id === id); if (u) { u.name = name; save(); all(); } },
    async adminDeleteUser(id) { memo.users = memo.users.filter((x) => x.id !== id); save(); all(); },
    async setRead(n, on) { const u = me(); if (!u) return; const s = new Set(u.readDays); on ? s.add(n) : s.delete(n); u.readDays = [...s].sort((a, b) => a - b); u.readAt = { ...(u.readAt || {}), [n]: Date.now() }; save(); all(); },
    async answerChq(key, c, t) { const u = me(); u.quiz = { ...(u.quiz || {}), [key]: { c, t } }; save(); all(); },
    myUid,
    async post(type, text, ref, note) { const u = me(); const anon = type === 'prayer'; memo.wall.push({ id: 'w' + Date.now(), type, text, ref: ref || '', note: note || '', name: anon ? initialOf(u.name) : u.name, userId: anon ? '' : u.id, uid: myUid(), at: Date.now(), amens: 0 }); save(); all(); },
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
    async ask(text, ref, verse) { const u = me(); memo.qs.unshift({ id: 'q' + Date.now(), userId: u.id, name: u.name, uid: myUid(), text, ref: ref || '', verse: verse || '', status: 'new', at: Date.now() }); save(); all(); return true; },
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
  function startSubs() {
    if (subs.length) return;
    subs.push(F.onSnapshot(F.collection(db, 'users'), (s) => { users = s.docs.map((d) => { const x = d.data(); return normUser({ id: d.id, name: x.name, readDays: x.readDays, readAt: x.readAt, quiz: x.quiz, lastSeen: ms(x.lastSeen) }); }); emit('users', users); }));
    subs.push(F.onSnapshot(F.query(F.collection(db, 'wall'), F.orderBy('at', 'desc'), F.limit(150)), (s) => {
      emit('wall', s.docs.map((d) => { const x = d.data(); return { id: d.id, ...x, at: ms(x.at) || Date.now() }; }));
    }));
    subs.push(F.onSnapshot(F.collection(db, 'days'), (s) => { const m = {}; s.docs.forEach((d) => { m[d.id] = d.data(); }); emit('days', m); }));
    subs.push(F.onSnapshot(F.collection(db, 'chq'), (s) => { const m = {}; s.docs.forEach((d) => { m[d.id] = d.data(); }); emit('chq', m); }));
    subs.push(F.onSnapshot(F.collection(db, 'exams'), (s) => { emit('exams', s.docs.map((d) => normExam(d.id, d.data()))); }));
    subs.push(F.onSnapshot(F.query(F.collection(db, 'questions'), F.where('uid', '==', uid)), (s) => { emit('myq', s.docs.map((d) => { const x = d.data(); return { id: d.id, ...x, at: ms(x.at) || Date.now(), answeredAt: ms(x.answeredAt) }; })); }, () => emit('myq', [])));
  }
  const me = () => users.find((u) => u.id === myId) || (myId ? normUser({ id: myId, name: store.get('myName', '') }) : null);
  return {
    async init() {
      if (!myId) {
        try {
          const q = await F.getDocs(F.query(F.collection(db, 'users'), F.where('uids', 'array-contains', uid), F.limit(1)));
          if (!q.empty) { myId = q.docs[0].id; store.set('me', myId); store.set('myName', q.docs[0].data().name); }
        } catch (e) { console.warn(e); }
      }
      if (myId) startSubs(); return myId ? me() : null;
    },
    async login(name, phone) {
      const id = await idOf(phone); const ref = F.doc(db, 'users', id); const snap = await F.getDoc(ref);
      if (snap.exists()) await F.updateDoc(ref, { name, uids: F.arrayUnion(uid), lastSeen: F.serverTimestamp() });
      else await F.setDoc(ref, { name, uids: [uid], readDays: [], readAt: {}, quiz: {}, createdAt: F.serverTimestamp(), lastSeen: F.serverTimestamp() });
      try { await F.setDoc(F.doc(db, 'contacts', id), { phone }); } catch (e) { console.warn('contact', e); }
      myId = id; store.set('me', id); store.set('myName', name); startSubs(); return me();
    },
    async logout() { store.del('me'); store.del('myName'); myId = null; },
    async rename(name) { await F.updateDoc(F.doc(db, 'users', myId), { name, lastSeen: F.serverTimestamp() }); store.set('myName', name); },
    async adminRename(id, name) { await F.updateDoc(F.doc(db, 'users', id), { name }); },
    async adminDeleteUser(id) { await F.deleteDoc(F.doc(db, 'users', id)); try { await F.deleteDoc(F.doc(db, 'contacts', id)); } catch (e) { /* ignore */ } },
    async setRead(n, on) {
      await F.updateDoc(F.doc(db, 'users', myId), on ? { readDays: F.arrayUnion(n), [`readAt.${n}`]: F.serverTimestamp(), lastSeen: F.serverTimestamp() } : { readDays: F.arrayRemove(n) });
    },
    async answerChq(key, c, t) { await F.updateDoc(F.doc(db, 'users', myId), { [`quiz.${key}`]: { c, t }, lastSeen: F.serverTimestamp() }); },
    myUid: () => uid,
    async post(type, text, ref, note) { const u = me(); const anon = type === 'prayer'; await F.addDoc(F.collection(db, 'wall'), { type, text, ref: ref || '', note: note || '', name: anon ? initialOf(u.name) : u.name, userId: anon ? '' : myId, uid, at: F.serverTimestamp(), amens: 0 }); },
    async amen(id) { await F.updateDoc(F.doc(db, 'wall', id), { amens: F.increment(1) }); },
    async react(id, k) { try { await F.updateDoc(F.doc(db, 'wall', id), { [`reacts.${uid}`]: k ? { t: k, n: me().name } : F.deleteField() }); return true; } catch (e) { console.warn(e); return false; } },
    async removePost(id) { await F.deleteDoc(F.doc(db, 'wall', id)); },
    async isServant() { try { return (await F.getDoc(F.doc(db, 'admins', uid))).exists(); } catch (e) { return false; } },
    async unlock(code) { try { await F.setDoc(F.doc(db, 'admins', uid), { code, at: F.serverTimestamp() }); return true; } catch (e) { return false; } },
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
