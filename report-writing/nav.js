// قائمة محاضرات كتابة التقارير الهندسية - عند إضافة محاضرة جديدة تضيف سطر هنا فقط (الملفات بأرقام المحاضرات)
const lectures = [
  { name: "🏠 فهرس المادة", url: "index.html" },
  { name: "المحاضرة 2 · أنواع التقارير", url: "lecture2.html" },
  { name: "المحاضرة 3 · خطوات الكتابة الناجحة", url: "lecture3.html" },
  { name: "المحاضرة 4 · كتابة تقرير المختبر", url: "lecture4.html" }
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
