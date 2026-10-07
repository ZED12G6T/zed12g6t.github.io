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
