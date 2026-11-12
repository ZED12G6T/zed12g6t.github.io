// قائمة محاضرات تحليل الدوائر الكهربائية 2 - عند إضافة محاضرة جديدة تضيف سطر هنا فقط
const lectures = [
  { name: "🏠 فهرس المادة", en: "🏠 Course index", url: "index.html" },
  { name: "المحاضرة 1 · الإشارات الجيبية", en: "Lecture 1 · Sinusoids", url: "lecture1.html" },
  { name: "المحاضرة 2 · الفيزورات", en: "Lecture 2 · Phasors", url: "lecture2.html" },
  { name: "المحاضرة 3 · علاقات R و L و C", en: "Lecture 3 · R, L and C relations", url: "lecture3.html" },
  { name: "المحاضرة 4 · المعاوقة والمسامحة", en: "Lecture 4 · Impedance & admittance", url: "lecture4.html" },
  { name: "المحاضرة 5 · كيرشوف وتوصيل المعاوقات", en: "Lecture 5 · Kirchhoff & impedance combinations", url: "lecture5.html" },
  { name: "المحاضرة 6 · تحليل العقد والحلقات", en: "Lecture 6 · Nodal & mesh analysis", url: "lecture6.html" },
  { name: "المحاضرة 7 · مكافئ ثيفنن ونورتن", en: "Lecture 7 · Thevenin & Norton", url: "lecture7.html" },
  { name: "المحاضرة 8 · القدرة اللحظية والمتوسطة", en: "Lecture 8 · Instantaneous & average power", url: "lecture8.html" },
  { name: "المحاضرة 9 · أقصى قدرة والقيمة الفعالة", en: "Lecture 9 · Max power transfer & RMS", url: "lecture9.html" },
  { name: "المحاضرة 10 · القدرة المركبة ومعامل القدرة", en: "Lecture 10 · Complex power & power factor", url: "lecture10.html" },
  { name: "المحاضرة 11 · حفظ القدرة وتصحيح معامل القدرة", en: "Lecture 11 · Power conservation & pf correction", url: "lecture11.html" }
];

function renderNavigation() {
  const select = document.getElementById("lecture-select");
  if (!select) return;

  // معرفة اسم الصفحة الحالية لتحديد الخيار المفعل تلقائياً
  let currentPath = window.location.pathname.split("/").pop();
  if (!currentPath) currentPath = "index.html";

  select.innerHTML = lectures.map(lec => `
    <option value="${lec.url}" ${currentPath === lec.url ? 'selected' : ''}>
      ${document.documentElement.lang === 'en' && lec.en ? lec.en : lec.name}
    </option>
  `).join('');
}

document.addEventListener("DOMContentLoaded", renderNavigation);
