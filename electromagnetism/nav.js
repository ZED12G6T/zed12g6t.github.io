// قائمة محاضرات الكهرومغناطيسية - عند إضافة محاضرة جديدة تضيف سطر هنا فقط
const lectures = [
  { name: "🏠 فهرس المادة", url: "index.html" },
  { name: "المحاضرة 1", url: "lecture1.html" },
  { name: "المحاضرة 2", url: "lecture2.html" },
  { name: "المحاضرة 3", url: "lecture3.html" },
  { name: "المحاضرة 4 الجزء الأول", url: "lecture4-1.html" },
  { name: "المحاضرة 4 الجزء الثاني", url: "lecture4-2.html" },
  { name: "المحاضرة 5", url: "lecture5.html" }
];

function renderNavigation() {
  const select = document.getElementById("lecture-select");
  if (!select) return;

  // معرفة اسم الصفحة الحالية لتحديد الخيار المفعل تلقائياً
  let currentPath = window.location.pathname.split("/").pop();
  if (!currentPath) currentPath = "index.html";

  // لو المستخدم جاي من الرابط المنفصل /em/ يرجعه "فهرس المادة" له بدل فهرس الموقع
  let emOnly = false;
  try { emOnly = localStorage.getItem("em-only") === "1"; } catch (e) {}
  const list = lectures.slice();
  if (emOnly) list[0] = { name: lectures[0].name, url: "../em/" };

  select.innerHTML = list.map(lec => `
    <option value="${lec.url}" ${currentPath === lec.url ? 'selected' : ''}>
      ${lec.name}
    </option>
  `).join('');
}

document.addEventListener("DOMContentLoaded", renderNavigation);
