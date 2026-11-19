// خطة القراءة: سفر التكوين فقط، من السبت ٢١ نوفمبر ٢٠٢٦ لحد الأربعاء ٦ يناير ٢٠٢٧ (٤٧ يوم، من غير إجازات)
export const START = '2026-11-21';
export const CHRISTMAS = '2027-01-07';

export const CH_TITLES = ['الخليقة', 'جنة عدن', 'السقوط', 'قايين وهابيل', 'من آدم إلى نوح', 'نوح والفلك', 'الطوفان', 'الفلك يستقر', 'عهد القوس', 'أمم الأرض',
  'برج بابل', 'دعوة إبراهيم', 'إبراهيم ولوط', 'ملكي صادق', 'عهد الله مع إبراهيم', 'هاجر', 'عهد الختان', 'الزوار الثلاثة', 'سدوم', 'إبراهيم وأبيمالك',
  'ميلاد إسحاق', 'جبل المريا', 'موت سارة', 'رفقة عند البئر', 'يعقوب وعيسو', 'إسحاق وآباره', 'البركة', 'سلّم يعقوب', 'يعقوب وراحيل', 'أولاد يعقوب',
  'العودة', 'فنوئيل', 'لقاء يعقوب وعيسو', 'دينة وشكيم', 'بيت إيل ثانيةً', 'نسل عيسو', 'يوسف يُباع', 'يهوذا وثامار', 'يوسف في بيت فوطيفار', 'حلما الساقي والخباز',
  'حلم فرعون', 'إخوة يوسف في مصر', 'الرحلة الثانية', 'الكأس', 'يوسف يعلن نفسه', 'يعقوب ينزل إلى مصر', 'أرض جاسان', 'أفرايم ومنسى', 'بركات يعقوب', 'رحيل يعقوب ويوسف'];

// أصحاح واحد كل يوم، والتلات أيام قبل الأخيرة فيهم أصحاحين، وآخر يوم أصحاح
const GROUPS = [...Array.from({ length: 43 }, (_, i) => [i + 1]), [44, 45], [46, 47], [48, 49], [50]];

const AR = '٠١٢٣٤٥٦٧٨٩';
export const ar = (x) => String(x).replace(/[0-9]/g, (d) => AR[d]);
export const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
export const WEEKDAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

// التواريخ كنصوص YYYY-MM-DD بتوقيت القاهرة
export function iso(d) { return d.toISOString().slice(0, 10); }
export function addDays(s, n) { const d = new Date(s + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return iso(d); }
export function weekday(s) { return new Date(s + 'T12:00:00Z').getUTCDay(); }
export function diffDays(a, b) { return Math.round((new Date(b + 'T12:00:00Z') - new Date(a + 'T12:00:00Z')) / 864e5); }
export function fmtDate(s, withDay = true, withYear = false) {
  const d = new Date(s + 'T12:00:00Z');
  return (withDay ? WEEKDAYS[d.getUTCDay()] + ' ' : '') + ar(d.getUTCDate()) + ' ' + MONTHS[d.getUTCMonth()] + (withYear ? ' ' + ar(d.getUTCFullYear()) : '');
}
// فرق ساعة الجهاز عن ساعة السيرفر (بالميلي ثانية) — بيتظبط عند فتح الموقع عشان «النهارده» ما يتأثرش بساعة موبايل غلط
let CLOCK = 0;
export const setClockOffset = (ms) => { CLOCK = Math.abs(ms) > 120000 ? ms : 0; };
export const nowMs = () => Date.now() + CLOCK;
export function todayCairo() {
  try { const q = new URLSearchParams(location.search).get('date'); if (q && /^\d{4}-\d{2}-\d{2}$/.test(q)) return q; } catch (e) { /* ignore */ }
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(nowMs()));
}

export const DAYS = GROUPS.map((ch, i) => ({ n: i + 1, date: addDays(START, i), ch }));
export const TOTAL = DAYS.length;
export const END = DAYS[TOTAL - 1].date;

export const chLabel = (d, short = false) => {
  const b = short ? 'تك' : 'تكوين';
  return d.ch.length === 1 ? `${b} ${ar(d.ch[0])}` : `${b} ${ar(d.ch[0])} و${ar(d.ch[1])}`;
};
export const dayTitle = (d) => d.ch.map((c) => CH_TITLES[c - 1]).join(' · ');
export const dayByDate = (s) => DAYS.find((d) => d.date === s) || null;
export function status(today = todayCairo()) {
  if (today < START) return { phase: 'before', daysLeft: diffDays(today, START) };
  if (today > END) return { phase: 'after' };
  return { phase: 'reading', day: dayByDate(today) };
}
export const dueDays = (today = todayCairo()) => DAYS.filter((d) => d.date <= today);
export const weekOf = (n) => Math.floor((n - 1) / 7); // أسابيع من السبت للجمعة، واليوم الأول سبت

// موانئ الخريطة (يوم ← اسم)، والآبار على أحداث تكوين
export const PORTS = { 1: 'الخليقة', 3: 'جنة عدن', 6: 'الفلك', 11: 'برج بابل', 12: 'دعوة إبراهيم', 19: 'سدوم', 22: 'جبل المريا', 24: 'رفقة عند البئر', 28: 'سلّم يعقوب',
  29: 'يعقوب وراحيل عند البئر', 32: 'فنوئيل', 37: 'يوسف والبئر', 41: 'حلم فرعون', 44: 'يوسف يعلن نفسه', 47: 'ميناء الميلاد' };
export const WELLS = new Set([24, 29]);

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
export const BADGES = [
  { id: 'anchor', icon: 'i-anchor', name: 'مرساة', desc: 'قريت أول يوم', test: (r) => r.size >= 1 },
  { id: 'compass', icon: 'i-compass', name: 'بوصلة', desc: '٧ أيام قراءة', test: (r) => r.size >= 7 },
  { id: 'ark', icon: 'i-ark', name: 'الفلك', desc: 'تكوين ٦ – ٩', test: (r) => range(6, 9).every((n) => r.has(n)) },
  { id: 'helm', icon: 'i-helm', name: 'دفة', desc: '١٤ يوم قراءة', test: (r) => r.size >= 14 },
  { id: 'well', icon: 'i-well', name: 'البئر', desc: 'تكوين ٢٤ و٢٩', test: (r) => r.has(24) && r.has(29) },
  { id: 'sail', icon: 'i-sail', name: 'شراع', desc: '٢١ يوم قراءة', test: (r) => r.size >= 21 },
  { id: 'joseph', icon: 'i-coat', name: 'قصة يوسف', desc: 'تكوين ٣٧ – ٥٠', test: (r) => range(37, 47).every((n) => r.has(n)) },
  { id: 'light', icon: 'i-light', name: 'فنار', desc: 'خلّصت السفر كله', test: (r) => r.size >= TOTAL },
];
export const TARGETS = [
  { name: 'مرساة', count: 1 }, { name: 'بوصلة', count: 7 }, { name: 'الفلك', set: [6, 9] }, { name: 'دفة', count: 14 }, { name: 'شراع', count: 21 },
  { name: 'قصة يوسف', set: [37, 47] }, { name: 'فنار', count: TOTAL },
];

// أيام متتالية لحد آخر يوم مستحق (النهارده لو لسه ما اتقراش ما يكسرش السلسلة)
export function streak(readSet, today = todayCairo()) {
  const due = dueDays(today); let s = 0;
  for (let i = due.length - 1; i >= 0; i--) {
    if (readSet.has(due[i].n)) s++;
    else if (i === due.length - 1 && due[i].date === today) continue;
    else break;
  }
  return s;
}

// آية اليوم: [أصحاح، آية]
const KV = { 1: [1, 27], 2: [2, 7], 3: [3, 15], 4: [4, 7], 5: [5, 24], 6: [6, 8], 7: [7, 1], 8: [8, 1], 9: [9, 13], 10: [10, 32], 11: [11, 9], 12: [12, 2], 13: [13, 8], 14: [14, 19],
  15: [15, 6], 16: [16, 13], 17: [17, 1], 18: [18, 14], 19: [19, 29], 20: [20, 17], 21: [21, 17], 22: [22, 8], 23: [23, 4], 24: [24, 27], 25: [25, 23], 26: [26, 24],
  27: [27, 28], 28: [28, 15], 29: [29, 20], 30: [30, 22], 31: [31, 3], 32: [32, 26], 33: [33, 4], 34: [33, 11], 35: [35, 3], 36: [35, 11], 37: [37, 3], 38: [38, 26],
  39: [39, 2], 40: [40, 8], 41: [41, 16], 42: [42, 24], 43: [43, 14], 44: [45, 5], 45: [46, 4], 46: [49, 10], 47: [50, 20] };
export const keyVerse = (n) => KV[n] || null;
