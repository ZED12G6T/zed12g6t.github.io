// قائمة فصول الاقتصاد الهندسي - عند إضافة فصل جديد تضيف سطر هنا فقط (الملفات بأرقام فصول الكتاب)
const lectures = [
  { name: "🏠 فهرس المادة", url: "index.html" },
  { name: "الفصل 2 · مفاهيم التكلفة", url: "lecture2.html" },
  { name: "الفصل 4 (1) · الفائدة وعوامل P و F و A", url: "lecture4-1.html" },
  { name: "الفصل 4 (2) · التدرجات والفائدة الفعالة", url: "lecture4-2.html" }
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
