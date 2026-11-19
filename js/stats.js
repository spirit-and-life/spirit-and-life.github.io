// حسابات الانتظام والنقاط ومستوى الفنار
import { DAYS, TOTAL, todayCairo, dueDays, streak, BADGES, TARGETS, weekOf } from './plan.js';

const fmtCairo = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' });
export const cairoDate = (ms) => fmtCairo.format(new Date(ms));
const byN = Object.fromEntries(DAYS.map((d) => [d.n, d]));

// في معاده = اتسجلت في يوم القراءة نفسه بتوقيت القاهرة. أي حاجة بعد كده «متأخرة».
export function readState(u, n) {
  if (!(u.readDays || []).includes(n)) return 'no';
  const t = u.readAt && u.readAt[n]; if (!t) return 'ontime';
  return cairoDate(t) <= byN[n].date ? 'ontime' : 'late';
}
export function userStats(u, today = todayCairo()) {
  const due = dueDays(today); const read = new Set(u.readDays || []);
  let onTime = 0, late = 0;
  read.forEach((n) => { const s = readState(u, n); if (s === 'ontime') onTime++; else if (s === 'late') late++; });
  const quiz = Object.values(u.quiz || {}); const qc = quiz.reduce((a, x) => a + (x.c || 0), 0); const qt = quiz.reduce((a, x) => a + (x.t || 0), 0);
  const st = streak(read, today);
  const lastAt = Math.max(0, ...Object.values(u.readAt || {}));
  return { read: read.size, onTime, late, missed: due.filter((d) => d.date < today && !read.has(d.n)).length, due: due.length,
    consistency: Math.round((onTime / (due.length || 1)) * 100), progress: read.size / TOTAL, streak: st, qc, qt, lastAt,
    points: onTime * 10 + late * 5 + qc * 3 + st * 2, badges: BADGES.filter((b) => b.test(read)).length,
    readToday: !!due.length && due[due.length - 1].date === today && read.has(due[due.length - 1].n) };
}
// مستوى الفنار (١–٥): بيزيد مع الالتزام، والقراءة المتأخرة بنص نقطة
export function lampLevel(s) {
  const score = s.onTime + s.late * 0.5;
  return score >= 27 ? 5 : score >= 14 ? 4 : score >= 7 ? 3 : score >= 1 ? 2 : 1;
}
export const LAMP_NAMES = ['مطفي', 'شرارة', 'فانوس', 'مصباح ساطع', 'فنار'];
export const LAMP_HINTS = ['لسه ما بدأش', '١–٦ أيام', '٧–١٣ يوم', '١٤–٢٦ يوم', '٢٧ يوم فأكتر'];

// الأسبوع = من السبت للجمعة (اليوم الأول سبت)
export function weekRange(today = todayCairo()) {
  const d = new Date(today + 'T12:00:00Z'); const back = (d.getUTCDay() + 1) % 7; d.setUTCDate(d.getUTCDate() - back);
  const s = d.toISOString().slice(0, 10); const e = new Date(d.getTime() + 6 * 864e5).toISOString().slice(0, 10); return [s, e];
}
export function weekStats(u, today = todayCairo()) {
  const [s, e] = weekRange(today); const days = DAYS.filter((d) => d.date >= s && d.date <= e && d.date <= today);
  let onTime = 0; days.forEach((d) => { if (readState(u, d.n) === 'ontime') onTime++; });
  return { onTime, due: days.length, consistency: days.length ? Math.round((onTime / days.length) * 100) : 0 };
}
// إحصائية كل أسبوع لكل المشتركين (للوحة المسؤولين)
export function weeksSummary(users, today = todayCairo()) {
  const due = dueDays(today); const weeks = {};
  due.forEach((d) => { const w = weekOf(d.n); const o = (weeks[w] = weeks[w] || { w, days: 0, on: 0, late: 0, slots: 0 }); o.days++; o.slots += users.length;
    users.forEach((u) => { const s = readState(u, d.n); if (s === 'ontime') o.on++; else if (s === 'late') o.late++; }); });
  return Object.values(weeks).map((o) => ({ ...o, pct: o.slots ? Math.round(((o.on + o.late) / o.slots) * 100) : 0, pctOn: o.slots ? Math.round((o.on / o.slots) * 100) : 0 }));
}
// أقرب شارة لسه ما خدتهاش (للتشجيع)
export function nextBadge(readSet) {
  const opts = TARGETS.map((t) => {
    let left; if (t.count) left = t.count - readSet.size; else { left = 0; for (let n = t.set[0]; n <= t.set[1]; n++) if (!readSet.has(n)) left++; }
    return { ...t, left };
  }).filter((t) => t.left > 0).sort((a, b) => a.left - b.left);
  return opts[0] || null;
}
