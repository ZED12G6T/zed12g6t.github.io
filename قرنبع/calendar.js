// calendar.js — جدول الشهر: مهام الجامعة وغيرها.
// المهام الأساسية في tasks.json (تنعدل في الريبو). اللي تضيفه من الصفحة ينحفظ في هالجهاز بس (localStorage)، وكذلك علامة "خلصت".
const LOCAL_KEY = 'qurnba-tasks';
const DONE_KEY = 'qurnba-done';
const DEFAULT_COURSES = {
  vectors: { name: 'المتجهات', color: '#5b7fa6' },
  electromagnetism: { name: 'الكهرومغناطيسية', color: '#c98a2e' },
  ethics: { name: 'أخلاقيات المهنة', color: '#5f8f44' },
  circuits2: { name: 'الدوائر ٢', color: '#bf6450' },
  personal: { name: 'شخصي', color: '#8a6fa8' },
};
const TYPES = { exam: 'اختبار', quiz: 'كويز', homework: 'واجب', project: 'مشروع', lab: 'معمل', presentation: 'عرض', other: 'مهمة' };
const WEEKDAYS = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

const fmtMonth = new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', { month: 'long', year: 'numeric' });
const fmtDayLong = new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', { weekday: 'long', day: 'numeric', month: 'long' });
const fmtHijriDay = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', { day: 'numeric' });
const fmtHijriMonth = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', { month: 'long', year: 'numeric' });
const fmtHijriFull = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' });
const fmtHijriMonthOnly = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', { month: 'long' });

const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function readJSON(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function writeJSON(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }

export async function startCalendar(root) {
  let courses = { ...DEFAULT_COURSES };
  let base = [];
  try {
    const res = await fetch('tasks.json', { cache: 'no-store' });
    const data = await res.json();
    if (data.courses) courses = { ...courses, ...data.courses };
    base = (data.tasks || []).map((t, i) => ({ ...t, id: t.id || `b${i}-${t.date}` }));
  } catch (e) { console.warn('tasks.json', e); }
  let local = readJSON(LOCAL_KEY, []);
  let done = new Set(readJSON(DONE_KEY, []));

  const today = new Date(); today.setHours(0, 0, 0, 0);
  let view = new Date(today.getFullYear(), today.getMonth(), 1);
  let selected = iso(today);
  let adding = false;

  const all = () => [...base, ...local.map((t) => ({ ...t, local: true }))];
  const byDate = () => {
    const m = new Map();
    for (const t of all()) { if (!m.has(t.date)) m.set(t.date, []); m.get(t.date).push(t); }
    for (const list of m.values()) list.sort((a, b) => (a.time || '99').localeCompare(b.time || '99'));
    return m;
  };
  const course = (k) => courses[k] || { name: k || 'مهمة', color: '#8b8172' };

  function render() {
    const map = byDate();
    const y = view.getFullYear(), mo = view.getMonth();
    const first = new Date(y, mo, 1), last = new Date(y, mo + 1, 0);
    const h1 = fmtHijriMonthOnly.format(first), h2 = fmtHijriMonth.format(last);
    const hijri = h1 === fmtHijriMonthOnly.format(last) ? h2 : `${h1} – ${h2}`;

    // ملخص الشهر
    const monthTasks = all().filter((t) => { const d = parse(t.date); return d.getFullYear() === y && d.getMonth() === mo; });
    const left = monthTasks.filter((t) => !done.has(t.id) && parse(t.date) >= today).length;
    const nextExam = all().filter((t) => (t.type === 'exam' || t.type === 'quiz') && parse(t.date) >= today && !done.has(t.id))
      .sort((a, b) => a.date.localeCompare(b.date))[0];
    let examLine = '';
    if (nextExam) {
      const days = Math.round((parse(nextExam.date) - today) / 864e5);
      const when = days === 0 ? 'اليوم' : days === 1 ? 'بكرة' : `بعد ${days} أيام`;
      examLine = `<span class="pill"><i style="background:${course(nextExam.course).color}"></i>أقرب ${TYPES[nextExam.type]}: ${esc(nextExam.title)}، ${when}</span>`;
    }

    // خانات الشهر، الأسبوع يبدأ الأحد
    const start = new Date(y, mo, 1 - first.getDay());
    const cells = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      if (i >= 35 && d.getMonth() !== mo) break;
      const key = iso(d);
      const list = map.get(key) || [];
      const cls = ['day'];
      if (d.getMonth() !== mo) cls.push('out');
      if (key === iso(today)) cls.push('today');
      if (key === selected) cls.push('sel');
      if (d < today) cls.push('past');
      const chips = list.slice(0, 2).map((t) =>
        `<span class="chip-t${done.has(t.id) ? ' done' : ''}" style="--c:${course(t.course).color}">${esc(t.title)}</span>`).join('');
      const more = list.length > 2 ? `<span class="more">+${list.length - 2}</span>` : '';
      const dots = list.slice(0, 4).map((t) => `<i style="background:${course(t.course).color}"></i>`).join('');
      cells.push(`<button type="button" class="${cls.join(' ')}" data-date="${key}" aria-label="${fmtDayLong.format(d)}${list.length ? `، ${list.length} مهام` : ''}">
        <span class="num">${d.getDate()}</span><span class="hd">${fmtHijriDay.format(d)}</span>
        <span class="chips">${chips}${more}</span><span class="dots">${dots}</span></button>`);
    }

    // تفاصيل اليوم المختار
    const sd = parse(selected);
    const dayList = map.get(selected) || [];
    const rows = dayList.map((t) => {
      const c = course(t.course);
      return `<li class="task${done.has(t.id) ? ' done' : ''}" style="--c:${c.color}">
        <label class="check"><input type="checkbox" data-done="${t.id}" ${done.has(t.id) ? 'checked' : ''}><span></span></label>
        <div class="t-body">
          <p class="t-title">${esc(t.title)}</p>
          <p class="t-meta"><span class="t-course">${esc(c.name)}</span><span class="t-type">${TYPES[t.type] || 'مهمة'}</span>${t.time ? `<span>${esc(t.time)}</span>` : ''}${t.example ? '<span class="t-ex">مثال</span>' : ''}${t.local ? '<span class="t-ex">على هالجهاز</span>' : ''}</p>
          ${t.note ? `<p class="t-note">${esc(t.note)}</p>` : ''}
        </div>
        ${t.local ? `<button type="button" class="t-del" data-del="${t.id}" aria-label="احذف المهمة">×</button>` : ''}
      </li>`;
    }).join('');

    // الجاية خلال أسبوعين
    const soon = all().filter((t) => { const d = parse(t.date); return d >= today && d - today <= 14 * 864e5 && !done.has(t.id); })
      .sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || ''))).slice(0, 6);
    const soonRows = soon.map((t) => {
      const d = parse(t.date), days = Math.round((d - today) / 864e5);
      const when = days === 0 ? 'اليوم' : days === 1 ? 'بكرة' : fmtDayLong.format(d);
      return `<li><button type="button" data-jump="${t.date}" style="--c:${course(t.course).color}"><i></i><span class="s-title">${esc(t.title)}</span><span class="s-when">${when}</span></button></li>`;
    }).join('');

    const courseOpts = Object.entries(courses).map(([k, c]) => `<option value="${k}">${esc(c.name)}</option>`).join('');
    const typeOpts = Object.entries(TYPES).map(([k, n]) => `<option value="${k}">${n}</option>`).join('');

    root.innerHTML = `
      <header class="cal-head">
        <div class="cal-title"><h2>${fmtMonth.format(first)}</h2><p>${hijri}</p></div>
        <div class="cal-nav">
          <button type="button" class="nav" data-nav="-1" aria-label="الشهر اللي قبل"><svg viewBox="0 0 24 24"><path d="M9.5 6.5 15 12l-5.5 5.5"/></svg></button>
          <button type="button" class="nav today-btn" data-nav="0">اليوم</button>
          <button type="button" class="nav" data-nav="1" aria-label="الشهر الجاي"><svg viewBox="0 0 24 24"><path d="M14.5 6.5 9 12l5.5 5.5"/></svg></button>
        </div>
      </header>
      <div class="cal-sum"><span class="pill">${monthTasks.length} مهام هالشهر، باقي ${left}</span>${examLine}</div>
      <div class="grid">
        ${WEEKDAYS.map((w) => `<span class="wd">${w}</span>`).join('')}
        ${cells.join('')}
      </div>
      <section class="detail">
        <div class="detail-head">
          <h3>${fmtDayLong.format(sd)}<small>${fmtHijriFull.format(sd)}</small></h3>
          <button type="button" class="add-btn" data-add aria-expanded="${adding}">${adding ? 'إلغاء' : 'أضف مهمة'}</button>
        </div>
        ${adding ? `<form class="add-form" id="cal-add">
          <input id="cal-title" name="title" required placeholder="وش المهمة؟" autocomplete="off">
          <div class="add-row">
            <select id="cal-course" name="course" aria-label="المادة">${courseOpts}</select>
            <select id="cal-type" name="type" aria-label="النوع">${typeOpts}</select>
            <input id="cal-time" name="time" type="time" aria-label="الوقت">
          </div>
          <div class="add-row"><button type="submit" class="save">احفظ</button><span class="hint-local">تنحفظ في هالجهاز بس</span></div>
        </form>` : ''}
        ${rows ? `<ul class="tasks">${rows}</ul>` : `<p class="empty">ما عندك شي هاليوم</p>`}
      </section>
      <section class="soon">
        <h3>الجاية خلال أسبوعين</h3>
        ${soonRows ? `<ul>${soonRows}</ul>` : '<p class="empty">ما فيه شي قريب</p>'}
      </section>
      <footer class="legend">${Object.values(courses).map((c) => `<span><i style="background:${c.color}"></i>${esc(c.name)}</span>`).join('')}</footer>`;
  }

  root.addEventListener('click', (e) => {
    const el = e.target.closest('[data-date],[data-nav],[data-jump],[data-add],[data-del]');
    if (!el) return;
    if (el.dataset.date) {
      selected = el.dataset.date;
      const d = parse(selected);
      if (d.getMonth() !== view.getMonth()) view = new Date(d.getFullYear(), d.getMonth(), 1);
    } else if (el.dataset.nav !== undefined) {
      const n = Number(el.dataset.nav);
      if (n === 0) { view = new Date(today.getFullYear(), today.getMonth(), 1); selected = iso(today); }
      else view = new Date(view.getFullYear(), view.getMonth() + n, 1);
    } else if (el.dataset.jump) {
      selected = el.dataset.jump;
      const d = parse(selected); view = new Date(d.getFullYear(), d.getMonth(), 1);
    } else if (el.dataset.add !== undefined) {
      adding = !adding;
    } else if (el.dataset.del) {
      local = local.filter((t) => t.id !== el.dataset.del); writeJSON(LOCAL_KEY, local);
    }
    render();
    if (adding && el.dataset.add !== undefined) root.querySelector('#cal-title')?.focus();
  });
  root.addEventListener('change', (e) => {
    const id = e.target.dataset?.done;
    if (!id) return;
    e.target.checked ? done.add(id) : done.delete(id);
    writeJSON(DONE_KEY, [...done]);
    render();
  });
  root.addEventListener('submit', (e) => {
    if (e.target.id !== 'cal-add') return;
    e.preventDefault();
    const f = new FormData(e.target);
    const title = String(f.get('title') || '').trim();
    if (!title) return;
    local.push({ id: `l${Date.now()}`, date: selected, title, course: f.get('course'), type: f.get('type'), time: f.get('time') || '' });
    writeJSON(LOCAL_KEY, local);
    adding = false;
    render();
  });

  render();
}
