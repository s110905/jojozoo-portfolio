document.querySelectorAll('.warroom-table, .meta-table').forEach((table, index) => {
  const viewport = table.closest('.scroll');
  const label = index === 0 ? '每日投放成效' : 'Meta 廣告成效';
  viewport.id = `report-table-${index}`;
  const controls = document.createElement('div');
  controls.className = 'table-controls';
  controls.hidden = true;
  const previous = document.createElement('button');
  const next = document.createElement('button');
  const position = document.createElement('span');
  for (const [button, text, direction] of [[previous, '←', '向左'], [next, '→', '向右']]) {
    button.type = 'button';
    button.textContent = text;
    button.setAttribute('aria-label', `${label}：${direction}查看欄位`);
    button.setAttribute('aria-controls', viewport.id);
  }
  controls.append(previous, position, next);
  viewport.after(controls);
  const update = () => {
    const maximum = viewport.scrollWidth - viewport.clientWidth;
    controls.hidden = maximum <= 1;
    previous.disabled = viewport.scrollLeft <= 1;
    next.disabled = viewport.scrollLeft >= maximum - 1;
    position.textContent = previous.disabled ? '左側欄位' : next.disabled ? '右側欄位' : '中間欄位';
  };
  const move = direction => viewport.scrollBy({
    left: direction * viewport.clientWidth * 0.8,
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
  });
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  viewport.addEventListener('scroll', update, { passive: true });
  new ResizeObserver(update).observe(viewport);
  update();
});
