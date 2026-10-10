// قائمة محاضرات تحليل الدوائر الكهربائية 2 - عند إضافة محاضرة جديدة تضيف سطر هنا فقط
const lectures = [
  { name: "🏠 فهرس المادة", url: "index.html" },
  { name: "المحاضرة 1 · الإشارات الجيبية", url: "lecture1.html" },
  { name: "المحاضرة 2 · الفيزورات", url: "lecture2.html" },
  { name: "المحاضرة 3 · علاقات R و L و C", url: "lecture3.html" }
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
