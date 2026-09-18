function addPageButton(container, label, { disabled = false, active = false, onClick } = {}) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'page_btn' + (active ? ' active' : '');
  btn.textContent = label;
  btn.disabled = disabled;
  if (!disabled && onClick) btn.onclick = onClick;
  container.appendChild(btn);
}

export function pageWindow(page, totalPages, size = 3) {
  let startPage = 1;
  let endPage = totalPages;
  if (totalPages > size) {
    if (page <= 2) {
      startPage = 1;
      endPage = size;
    } else if (page >= totalPages - 1) {
      startPage = totalPages - (size - 1);
      endPage = totalPages;
    } else {
      startPage = page - 1;
      endPage = page + 1;
    }
  }
  return { startPage, endPage };
}

export function updatePaginationUI({
  total,
  page,
  pageSize,
  onPage,
  rangeEl = document.querySelector('.pg_range'),
  totalEl = document.querySelector('.pg_total'),
  container = document.querySelector('.pagination'),
  windowSize = 3,
} = {}) {
  const totalPages = Math.ceil(total / pageSize) || 0;
  const startRange = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRange = Math.min(page * pageSize, total);

  if (rangeEl) rangeEl.textContent = `${startRange}–${endRange}`;
  if (totalEl) totalEl.textContent = String(total);
  if (!container) return;

  container.innerHTML = '';
  addPageButton(container, '‹', {
    disabled: page === 1,
    onClick: () => onPage(page - 1),
  });

  const { startPage, endPage } = pageWindow(page, totalPages, windowSize);
  for (let i = startPage; i <= endPage; i++) {
    addPageButton(container, String(i), {
      active: i === page,
      onClick: () => onPage(i),
    });
  }

  addPageButton(container, '›', {
    disabled: page === totalPages || totalPages === 0,
    onClick: () => onPage(page + 1),
  });
}

export function renderSequentialPager(container, { page, totalPages, onPage } = {}) {
  if (!container) return;

  const btn = (label, target, { active = false, disabled = false, aria } = {}) => `
        <button class="page_btn${active ? ' active' : ''}"
            data-page="${target}" ${disabled ? 'disabled' : ''}
            ${aria ? `aria-label="${aria}"` : ''} ${active ? 'aria-current="page"' : ''}>${label}</button>`;

  let html = btn('‹', Math.max(1, page - 1), { disabled: page === 1, aria: 'Previous page' });
  for (let p = 1; p <= totalPages; p += 1) {
    html += btn(String(p), p, { active: p === page });
  }
  html += btn('›', Math.min(totalPages, page + 1), { disabled: page === totalPages, aria: 'Next page' });

  container.innerHTML = html;

  container.querySelectorAll('.page_btn:not([disabled])').forEach((el) => {
    el.addEventListener('click', () => {
      const next = Number(el.dataset.page);
      if (Number.isFinite(next)) onPage(next);
    });
  });
}
