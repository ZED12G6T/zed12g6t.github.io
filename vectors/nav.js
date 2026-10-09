// قائمة محاضرات المتجهات - عند إضافة محاضرة جديدة تضيف سطر هنا فقط
const lectures = [
  { name: "🏠 فهرس المادة", url: "index.html" },
  { name: "ملخص المحاضرة 1", url: "lecture1.html" },
  { name: "ملخص المحاضرة 2", url: "lecture2.html" },
  { name: "ملخص المحاضرة 3", url: "lecture3.html" },
  { name: "ملخص المحاضرة 4", url: "lecture4.html" },
  { name: "ملخص المحاضرة 5", url: "lecture5.html" },
  { name: "ملخص المحاضرة 6", url: "lecture6.html" },
  { name: "ملخص المحاضرة 7", url: "lecture7.html" },
  { name: "ملخص المحاضرة 8", url: "lecture8.html" },
  { name: "Exercise 2", url: "exercise2.html" }
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
