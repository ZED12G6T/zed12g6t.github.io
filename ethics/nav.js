// قائمة محاضرات أخلاقيات المهنة - عند إضافة محاضرة جديدة تضيف سطر هنا فقط
const lectures = [
  { name: "🏠 فهرس المادة", url: "index.html" },
  { name: "ملخص المحاضرة 1 · مقدمة", url: "lecture1.html" },
  { name: "ملخص المحاضرة 2 · أخلاقيات الهندسة", url: "lecture2.html" },
  { name: "ملخص المحاضرة 3 · ميثاق المهندس 🎯", url: "lecture3.html" }
];

function renderNavigation() {
  const select = document.getElementById("lecture-select");
  if (!select) return;

  // معرفة اسم الصفحة الحالية لتحديد الخيار المفعل تلقائياً
  let currentPath = window.location.pathname.split("/").pop();
  if (!currentPath) currentPath = "index.html";

  select.innerHTML = lectures.map(lec => `
    <option value="${lec.url}" ${currentPath === lec.url ? 'selected' : ''}>
      ${lec.name}
    </option>
  `).join('');
}

document.addEventListener("DOMContentLoaded", renderNavigation);

// تبويب "الشرح | القواعد | الاختبار" في نص أعلى صفحة الشرح (<html data-laws="laws1.html">، والاختبار quiz1.html)
// نفس فكرة econ.js في الاقتصاد. الشريط العلوي يبنيه lecture.js وقت DOMContentLoaded قبلنا
document.addEventListener("DOMContentLoaded", () => {
  const laws = document.documentElement.dataset.laws, bar = document.querySelector("header.topbar");
  if (!laws || !bar) return;
  bar.insertAdjacentHTML("afterend", `<nav class="mode-tabs" aria-label="الشرح أو القواعد أو الاختبار"><span class="on" aria-current="page">📖 الشرح</span><a href="${laws}">📐 القواعد</a><a href="${laws.replace("laws", "quiz")}">🧠 الاختبار</a></nav>`);
});
