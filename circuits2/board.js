// لوحة القوانين: ترسم الخطوط بين البطاقات، تفتح شرح كل قانون، وتضيّء مسار الحل.
// الاستخدام: <div class="fboard"> فيه <svg class="fb-lines">، وبطاقات .fb-node لها data-id و data-from (آباؤها)،
// وأزرار [data-path] فيها أسماء بطاقات المسار، وشروحات .fb-info[data-for].
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const boards = [...document.querySelectorAll('.fboard')];
  if (!boards.length) return;

  function draw(board) {
    const svg = board.querySelector('.fb-lines');
    if (!svg) return;
    svg.replaceChildren();
    const br = board.getBoundingClientRect();
    const path = (board.dataset.active || '').split(' ').filter(Boolean);
    board.querySelectorAll('.fb-node[data-from]').forEach(n => {
      const nr = n.getBoundingClientRect();
      n.dataset.from.split(' ').filter(Boolean).forEach(id => {
        const p = board.querySelector('.fb-node[data-id="' + id + '"]');
        if (!p) return;
        const pr = p.getBoundingClientRect();
        const x1 = pr.left + pr.width / 2 - br.left, y1 = pr.bottom - br.top;
        const x2 = nr.left + nr.width / 2 - br.left, y2 = nr.top - br.top - 5;
        const ym = (y1 + y2) / 2;
        const cls = !path.length ? '' : (path.includes(id) && path.includes(n.dataset.id) ? 'on' : 'dim');
        const line = document.createElementNS(NS, 'path');
        line.setAttribute('d', `M${x1} ${y1}C${x1} ${ym} ${x2} ${ym} ${x2} ${y2}`);
        if (cls) line.setAttribute('class', cls);
        const tip = document.createElementNS(NS, 'path');
        tip.setAttribute('d', `M${x2 - 5} ${y2 - 2}L${x2} ${y2 + 5}L${x2 + 5} ${y2 - 2}Z`);
        tip.setAttribute('class', 'fb-tip ' + cls);
        svg.append(line, tip);
      });
    });
  }

  function setPath(board, ids) {
    board.dataset.active = ids.join(' ');
    board.querySelectorAll('.fb-node').forEach(n => {
      n.classList.toggle('on', ids.includes(n.dataset.id));
      n.classList.toggle('dim', ids.length > 0 && !ids.includes(n.dataset.id));
    });
    board.querySelectorAll('.fb-paths [data-path]').forEach(b => b.setAttribute('aria-pressed', ids.length > 0 && b.dataset.path === ids.join(' ')));
    draw(board);
  }

  boards.forEach(board => {
    board.querySelectorAll('.fb-node').forEach(n => {
      n.setAttribute('aria-expanded', 'false');
      n.addEventListener('click', () => {
        const open = n.getAttribute('aria-expanded') === 'true';
        board.querySelectorAll('.fb-node').forEach(o => o.setAttribute('aria-expanded', 'false'));
        board.querySelectorAll('.fb-info').forEach(i => { i.hidden = true; });
        if (open) return;
        const info = board.querySelector('.fb-info[data-for="' + n.dataset.id + '"]');
        if (!info) return;
        n.setAttribute('aria-expanded', 'true');
        info.hidden = false;
        info.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
    });
    board.querySelectorAll('.fb-paths [data-path]').forEach(b => b.addEventListener('click', () => {
      const ids = b.dataset.path.split(' ').filter(Boolean);
      setPath(board, b.getAttribute('aria-pressed') === 'true' ? [] : ids);
    }));
    if (window.ResizeObserver) new ResizeObserver(() => draw(board)).observe(board);
    draw(board);
  });

  // روابط "المسار في لوحة القوانين" من الأمثلة: تضيّء المسار وتنزل للوحة
  document.querySelectorAll('a.fb-go[data-path]').forEach(a => a.addEventListener('click', e => {
    const ids = a.dataset.path.split(' ').filter(Boolean);
    const board = boards.find(b => b.querySelector('.fb-node[data-id="' + ids[0] + '"]'));
    if (!board) return;
    e.preventDefault();
    setPath(board, ids);
    board.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }));

  const redraw = () => boards.forEach(draw);
  window.addEventListener('resize', redraw);
  window.addEventListener('load', redraw);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(redraw);
  [300, 1200, 3000].forEach(t => setTimeout(redraw, t));
})();
