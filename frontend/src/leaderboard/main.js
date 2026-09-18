import 'bootstrap/dist/css/bootstrap.min.css';
import './style.css';
import * as bootstrap from 'bootstrap';
import { backendApiUrl } from '../shared/api.js';
import { escapeHtml, userInitials, resolveMediaUrl } from '../shared/html.js';
import '../shared/auth/auth-ui.js';
import { initMobileNav } from '../shared/nav.js';
import { initGuestGate } from '../shared/guest.js';
import { updatePaginationUI as renderPager } from '../shared/pagination.js';

initGuestGate();
initMobileNav();

function main() {
    leaderBoarTimelineButtons();
    sortButtonsConfiguration();

    // No leaderboard API calls for guests — wait until session is confirmed
    window.NumberLinkGuest?.whenAuthenticated(() => {
        generateUserStats();
        pagePagination();
    });
}

main();

function setLeaderboardPeriod(value, label) {
    const periodButton = document.getElementById('leaderboard-period');
    if (!periodButton) return;

    periodButton.dataset.period = value;
    periodButton.textContent = label;

    document.querySelectorAll('.leaderboard_period_menu .dropdown-item').forEach((item) => {
        item.classList.toggle('active', item.dataset.value === value);
    });
}

function leaderBoarTimelineButtons() {
    const periodButton = document.getElementById('leaderboard-period');
    const items = document.querySelectorAll('.leaderboard_period_menu .dropdown-item');
    if (!periodButton) return;

    items.forEach((item) => {
        item.addEventListener('click', (event) => {
            event.preventDefault();
            setLeaderboardPeriod(item.dataset.value, item.textContent.trim());
            pagePagination();
        });
    });
}

function sortButtonsConfiguration() {
    const dropDownElements = document.querySelectorAll('.sort_dropdown .dropdown-item');
    const mapSortButton = document.getElementById('map-sort-button');

    dropDownElements.forEach(item => {
    item.addEventListener('click', () => {
        if (!mapSortButton) return;
        mapSortButton.textContent = item.textContent;
        mapSortButton.dataset.size = item.dataset.size;

        pagePagination();
    });
});

const sortButtons = document.querySelectorAll('.sort_btn:not(.dropdown-toggle)');

sortButtons.forEach(button => {
    button.addEventListener('click', () => {
        const isActive = button.classList.contains('active');

        sortButtons.forEach(btn => {
            btn.classList.remove('active');
        });

        if (isActive) {
            button.classList.remove('active');
        } else {
            button.classList.add('active');
        }

        pagePagination();
    });
});

}

function resolveLeaderboardFilters() {
  const period = document.getElementById('leaderboard-period')?.dataset.period || '';
  const sortBtn = document.querySelector('.active.sort_btn:not(.dropdown-toggle)');
  const mapSize = document.getElementById('map-sort-button')?.dataset.size || '';

  return {
    period,
    criterion: sortBtn?.dataset.criterion || '',
    mapSize,
  };
}

function showLeaderboardEmpty() {
  const container = document.querySelector('.leaderboard_records');
  container.querySelectorAll('.leaderboard_item:not(.self)').forEach((el) => el.remove());
  container.querySelectorAll('.leaderboard_no_items').forEach((el) => el.remove());

  container.insertAdjacentHTML(
    'beforeend',
    `<div class="leaderboard_no_items row d-flex flex-column justify-content-center align-items-center">
      <div class="lb_empty_state col-11" role="status">
        <div class="lb_empty_icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M4 6h16"/><path d="M4 12h10"/><path d="M4 18h7"/>
            <circle cx="18" cy="17" r="3"/><path d="M20.2 19.2 22 21"/>
          </svg>
        </div>
        <div class="lb_empty_content">
          <h3 class="lb_empty_title">No scores match</h3>
          <p class="lb_empty_text">Nothing for this period, sort, and map size.</p>
          <button type="button" class="lb_empty_cta" data-empty-cta="reset-filters">Show all-time results</button>
        </div>
      </div>
    </div>`
  );

  document.querySelector('[data-empty-cta="reset-filters"]')?.addEventListener('click', () => {
    const mapBtn = document.getElementById('map-sort-button');
    if (mapBtn) {
      mapBtn.textContent = 'All Sizes';
      delete mapBtn.dataset.size;
    }
    document.querySelectorAll('.sort_btn:not(.dropdown-toggle).active').forEach((btn) => {
      btn.classList.remove('active');
    });
    setLeaderboardPeriod('all-time', 'All Time');
    pagePagination();
  });
}

function rankMedalClass(rankIndex) {
  if (rankIndex === 0) return 'gold_medal';
  if (rankIndex === 1) return 'silver_medal';
  if (rankIndex === 2) return 'bronze_medal';
  return 'normal_medal';
}

function lbMedalHtml(rank, rankClass) {
  const label = rank == null || rank === '' ? '—' : String(rank);
  return `<span class="lb_medal ${rankClass}">${escapeHtml(label)}</span>`;
}

function fillLbAvatar(el, username, avatarUrl) {
  if (!el) return;
  const src = resolveMediaUrl(avatarUrl);
  el.innerHTML = src
    ? `<img src="${escapeHtml(src)}" alt="" referrerpolicy="no-referrer">`
    : escapeHtml(userInitials(username));
}

function hintsLabel(hints) {
  if (hints === 0) return 'no hints';
  if (hints === 1) return '1 hint';
  return `${hints} hints`;
}

function lbHintsHtml(hints, variant) {
  const n = Number(hints);
  if (!Number.isInteger(n) || n < 0) return '';
  const clean = n === 0
    ? `<span class="lb_hint_badge clean">Clean solve</span>`
    : '';
  return `<div class="lb_hints lb_hints--${variant}">${clean}<span class="lb_hint_meta">${hintsLabel(n)}</span></div>`;
}

function buildLeaderboardItemHtml(item, realIndex) {
  const rankClass = rankMedalClass(realIndex);
  const mapSize = item.fieldWidth && item.fieldHeight ? `${item.fieldWidth}×${item.fieldHeight}` : '--';
  const player = item.player || '--';
  const src = resolveMediaUrl(item.avatarUrl);
  const avatarInner = src
    ? `<img src="${escapeHtml(src)}" alt="" referrerpolicy="no-referrer">`
    : escapeHtml(userInitials(player));

  return `
    <div class="leaderboard_item">
      <div class="lb_content">
        <div class="lb_row">
          ${lbMedalHtml(realIndex + 1, rankClass)}
          <div class="lb_avatar">${avatarInner}</div>
          <div class="lb_who">
            <div class="lb_name">${escapeHtml(player)}</div>
            <div class="lb_points">${item.points ?? '--'} points</div>
          </div>
        </div>
        <div class="lb_stats">
          <div class="lb_stat_item"><span class="lb_stat_label">Time:</span><span class="lb_stat_value">${item.elapsedSeconds ? item.elapsedSeconds + 's' : '--'}</span></div>
          <div class="lb_stat_item"><span class="lb_stat_label">Map Size:</span><span class="lb_stat_value">${mapSize}</span></div>
          <div class="lb_stat_item"><span class="lb_stat_label">Avg Time:</span><span class="lb_stat_value">${item.avgElapsedSeconds ? item.avgElapsedSeconds + 's' : '--'}</span></div>
          <div class="lb_stat_item"><span class="lb_stat_label">Avg Score:</span><span class="lb_stat_value">${item.avgScore || '--'}</span></div>
          ${lbHintsHtml(item.hints, 'row')}
        </div>
      </div>
    </div>
  `;
}

async function pagePagination() {
    if (!window.NumberLinkGuest?.isAuthenticated()) return;

    let allData = [];
    let currentPage = 1;
    const itemsPerPage = 5;

    async function fetchLeaderboard() {
    if (!window.NumberLinkGuest?.isAuthenticated()) return;
    try {
        const { period, criterion, mapSize } = resolveLeaderboardFilters();
        const params = new URLSearchParams();
        if (period) params.set("period", period);
        if (criterion) params.set("criterion", criterion);
        if (mapSize) params.set("mapSize", mapSize);

        const query = `${backendApiUrl()}/score/sort?` + params.toString();

        const response = await fetch(query);
        if (!response.ok) throw new Error('API error');
        
        allData = await response.json();

        if (!allData || allData.length === 0) {
            showLeaderboardEmpty();
            return;
        }

        renderPage(1);

    } catch (error) {
        console.error(error);
    }
}

function renderPage(page) {
    currentPage = page;

    const container = document.querySelector('.leaderboard_records');
    container.querySelectorAll('.leaderboard_item:not(.self)').forEach(el => el.remove());
    container.querySelectorAll('.leaderboard_no_items').forEach(el => el.remove());

    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = allData.slice(startIndex, endIndex);


        pageData.forEach((item, index) => {
        const realIndex = startIndex + index;
        container.insertAdjacentHTML('beforeend', buildLeaderboardItemHtml(item, realIndex));
    });

    updatePaginationUI();
}

function updatePaginationUI() {
    renderPager({
        total: allData.length,
        page: currentPage,
        pageSize: itemsPerPage,
        onPage: renderPage,
    });
}


fetchLeaderboard();
}

async function generateUserStats() {
    if (!window.NumberLinkGuest?.isAuthenticated()) return;

    const query = `${backendApiUrl()}/score`;
    try {
            const response = await fetch(query,
            {
                method: "GET",
                credentials: "include"
            });

            if (response.status === 401 || response.status === 403) {
                return;
            }
            if (!response.ok) throw new Error("API error");
            const data = await response.json();

            const nameEl = document.querySelector('.lb_name-1');
            const pointsLine = document.getElementById('self_points_line');
            const medal = document.getElementById('self_rank');
            const player = data.player || 'You';

            nameEl.textContent = player;
            fillLbAvatar(document.getElementById('self_avatar'), player, data.avatarUrl);

            if (data.points != null && data.points !== '' && data.points !== '--') {
                pointsLine.textContent = `${data.points} points`;
            } else {
                pointsLine.textContent = 'No score yet';
            }

            document.querySelector('.lb_stat_value-1.time').innerHTML =
                data.avgElapsedSeconds != null && data.avgElapsedSeconds !== '' ? `${data.avgElapsedSeconds}s` : '—';
            document.querySelector('.lb_stat_value-1.score').innerHTML =
                data.avgScore != null && data.avgScore !== '' ? data.avgScore : '—';

            const selfHints = document.getElementById('self_hints');
            if (selfHints) {
                const n = Number(data.hints);
                const hasScore = data.points != null && data.points !== '' && data.points !== '--';
                if (hasScore && Number.isInteger(n) && n >= 0) {
                    selfHints.innerHTML = `${n === 0 ? '<span class="lb_hint_badge clean">Clean solve</span>' : ''}<span class="lb_hint_meta">${hintsLabel(n)}</span>`;
                    selfHints.hidden = false;
                } else {
                    selfHints.replaceChildren();
                    selfHints.hidden = true;
                }
            }

            if (data.rank != null && !Number.isNaN(Number(data.rank))) {
                const rankClass = rankMedalClass(Number(data.rank) - 1);
                if (medal) {
                    medal.textContent = data.rank;
                    medal.classList.remove('self_medal', 'normal_medal', 'bronze_medal', 'silver_medal', 'gold_medal');
                    medal.classList.add(rankClass);
                }
            }

            return;
        } catch (error) {
            console.error("Error:", error);
            return;
        }

}