import 'bootstrap/dist/css/bootstrap.min.css';
import './style.css';
import * as bootstrap from 'bootstrap';
import { backendApiUrl } from '../shared/api.js';
import '../shared/auth/auth-ui.js';
import { initMobileNav } from '../shared/nav.js';
import { renderSequentialPager } from '../shared/pagination.js';
import { mapScoreRecord, initShareModal, openShareModal } from '../shared/share.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const PAGE_SIZE = 6;

const state = {
    size: 'all',
    period: 'all-time',
    page: 1,
};

let games = [];
let bestScore = 0;
let playerName = 'A NumberLink player';
let isAuthenticated = false;
let loadState = 'loading';
let loadError = false;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '—';
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} · ${hh}:${mm}`;
}

function relativeLabel(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((startOfToday - date) / DAY_MS) + 1;
    if (date >= startOfToday) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} wk ago`;
    return `${Math.floor(diffDays / 30)} mo ago`;
}

function formatSeconds(total) {
    if (total < 60) return `${total}s`;
    const m = Math.floor(total / 60);
    const s = String(total % 60).padStart(2, '0');
    return `${m}:${s}`;
}

function hintsLabel(game) {
    if (game.hints === 0) return 'no hints';
    if (game.hints === 1) return '1 hint';
    return `${game.hints} hints`;
}

function filteredGames() {
    const now = Date.now();
    return games.filter((g) => {
        if (state.size !== 'all' && g.size !== Number(state.size)) return false;
        const played = g.playedAt instanceof Date ? g.playedAt.getTime() : NaN;
        if (!Number.isFinite(played)) return state.period === 'all-time';
        if (state.period === 'week' && now - played > 7 * DAY_MS) return false;
        if (state.period === 'month' && now - played > 30 * DAY_MS) return false;
        return true;
    });
}

function renderStats() {
    const total = games.length;
    const best = total ? games.reduce((a, b) => (b.score > a.score ? b : a)) : null;
    const avgScore = total ? Math.round(games.reduce((sum, g) => sum + g.score, 0) / total) : 0;
    const cleanSolves = games.filter((g) => g.hints === 0).length;

    const cards = [
        { label: 'Games played', value: String(total), hint: 'all time' },
        {
            label: 'Best score',
            value: best ? `${best.score} pts` : '—',
            hint: best ? `${best.size}×${best.size} in ${formatSeconds(best.seconds)}` : 'no games yet',
        },
        { label: 'Average score', value: total ? `${avgScore} pts` : '—', hint: 'across all sizes' },
        { label: 'Clean solves', value: String(cleanSolves), hint: 'finished without hints' },
    ];

    document.getElementById('history_stats').innerHTML = cards
        .map(
            (c) => `
            <div class="history_stat">
                <div class="history_stat_value">${c.value}</div>
                <div class="history_stat_label">${c.label}</div>
                <div class="history_stat_hint">${c.hint}</div>
            </div>`
        )
        .join('');
}

function gameRow(game) {
    const badges = [];
    if (bestScore > 0 && game.score === bestScore) {
        badges.push(`
            <span class="history_badge best">
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24"
                    fill="currentColor" aria-hidden="true">
                    <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                </svg>
                Personal best
            </span>`);
    }
    if (game.hints === 0) {
        badges.push('<span class="history_badge clean">Clean solve</span>');
    }

    return `
        <div class="history_item"${game.mapTrackId ? ` data-map-track-id="${game.mapTrackId}"` : ''}>
            <div class="history_size_badge" aria-label="Map size ${game.size} by ${game.size}">${game.size}×${game.size}</div>
            <div class="history_item_main">
                <div class="history_item_date">${formatDate(game.playedAt)}</div>
                <div class="history_item_sub">
                    <span>${relativeLabel(game.playedAt)}</span>
                    <span>·</span>
                    <span>${hintsLabel(game)}</span>
                    ${badges.join('')}
                </div>
            </div>
            <div class="history_item_metrics">
                <div class="history_metric">
                    <div class="history_metric_label">Time</div>
                    <div class="history_metric_value">${formatSeconds(game.seconds)}</div>
                </div>
                <div class="history_metric">
                    <div class="history_metric_label">Score</div>
                    <div class="history_metric_value score">${game.score} pts</div>
                </div>
                <button type="button" class="history_share" data-id="${game.id}"
                    aria-label="Share this result" title="Share result">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round" aria-hidden="true">
                        <circle cx="18" cy="5" r="3"></circle>
                        <circle cx="6" cy="12" r="3"></circle>
                        <circle cx="18" cy="19" r="3"></circle>
                        <line x1="8.59" x2="15.42" y1="13.51" y2="17.49"></line>
                        <line x1="15.41" x2="8.59" y1="6.51" y2="10.49"></line>
                    </svg>
                </button>
            </div>
        </div>`;
}

function setEmptyState(title, html) {
    const titleEl = document.getElementById('history_empty_title');
    const textEl = document.getElementById('history_empty_text');
    if (titleEl) titleEl.textContent = title;
    if (textEl) textEl.innerHTML = html;
}

function renderList() {
    const records = document.getElementById('history_records');
    const empty = document.getElementById('history_empty');

    if (loadState === 'loading') {
        records.innerHTML = '';
        empty.hidden = true;
        document.querySelector('.pg_range').textContent = '0';
        document.querySelector('.pg_total').textContent = '0';
        renderPagination(1);
        return;
    }

    const visible = filteredGames();
    const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
    state.page = Math.min(state.page, totalPages);

    const start = (state.page - 1) * PAGE_SIZE;
    const pageGames = visible.slice(start, start + PAGE_SIZE);

    records.innerHTML = pageGames.map(gameRow).join('');

    if (visible.length === 0) {
        empty.hidden = false;
        if (loadError) {
            setEmptyState(
                'Couldn’t load history',
                'Something went wrong while loading your games. Refresh the page to try again.',
            );
        } else if (!isAuthenticated) {
            setEmptyState(
                'Log in to see your history',
                'Solved puzzles are saved to your account. <button type="button" class="history_empty_login" data-history-login>Log in</button> to view them here.',
            );
            empty.querySelector('[data-history-login]')?.addEventListener('click', () => {
                window.NumberLinkAuth?.open('login');
            });
        } else if (games.length === 0) {
            setEmptyState(
                'No games here yet',
                'Finish a puzzle while signed in and it will show up here. <a href="/">Play a round</a>.',
            );
        } else {
            setEmptyState(
                'No games here yet',
                'Nothing matches this filter. Try another size or period — or <a href="/">play a round</a>.',
            );
        }
    } else {
        empty.hidden = true;
    }

    records.querySelectorAll('.history_share').forEach((btn) => {
        btn.addEventListener('click', () => {
            const game = games.find((g) => String(g.id) === String(btn.dataset.id));
            if (game) openShareModal(game);
        });
    });

    document.querySelector('.pg_range').textContent = visible.length === 0 ? '0' : `${start + 1}–${start + pageGames.length}`;
    document.querySelector('.pg_total').textContent = String(visible.length);

    renderPagination(totalPages);
}

async function loadHistory() {
    loadState = 'loading';
    loadError = false;
    renderList();
    try {
        const response = await fetch(`${backendApiUrl()}/score/history`, {
            method: 'GET',
            credentials: 'include',
            headers: { Accept: 'application/json' },
        });

        if (response.status === 401 || response.status === 403) {
            isAuthenticated = false;
            games = [];
            bestScore = 0;
            loadState = 'ready';
            renderStats();
            renderList();
            return;
        }
        if (!response.ok) throw new Error('API error');

        const data = await response.json();
        isAuthenticated = true;
        games = (Array.isArray(data) ? data : []).map(mapScoreRecord).filter(Boolean);
        bestScore = games.reduce((max, g) => Math.max(max, g.score), 0);
        loadState = 'ready';
        renderStats();
        renderList();
    } catch (_) {
        games = [];
        bestScore = 0;
        loadError = true;
        loadState = 'ready';
        renderStats();
        renderList();
    }
}

function renderPagination(totalPages) {
    renderSequentialPager(document.getElementById('history_pagination'), {
        page: state.page,
        totalPages,
        onPage: (next) => {
            state.page = next;
            renderList();
        },
    });
}

function initSizeChips() {
    const chips = document.querySelectorAll('.history_chip');
    chips.forEach((chip) => {
        chip.addEventListener('click', () => {
            chips.forEach((c) => {
                c.classList.toggle('active', c === chip);
                c.setAttribute('aria-pressed', String(c === chip));
            });
            state.size = chip.dataset.size;
            state.page = 1;
            renderList();
        });
    });
}

function initPeriodDropdown() {
    const button = document.getElementById('history-period');
    const items = document.querySelectorAll('.history_period_menu .dropdown-item');
    items.forEach((item) => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            items.forEach((i) => i.classList.toggle('active', i === item));
            button.textContent = item.textContent.trim();
            button.dataset.period = item.dataset.value;
            state.period = item.dataset.value;
            state.page = 1;
            renderList();
        });
    });
}

function applyAuthUser(user) {
    isAuthenticated = Boolean(user);
    if (user?.username) playerName = String(user.username).slice(0, 32);
}

document.addEventListener('numberlink:auth', (event) => {
    applyAuthUser(event.detail?.user);
    loadHistory();
});

if (document.body.dataset.authReady === '1') {
    applyAuthUser(document.body.dataset.authUser ? { username: document.body.dataset.authUser } : null);
}

renderStats();
renderList();
initSizeChips();
initPeriodDropdown();
initShareModal();
initMobileNav();
loadHistory();

requestAnimationFrame(() => {
    document.body.style.opacity = '1';
});
