import { backendApiUrl } from './api.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

let shareModalReady = false;
let lastFocused = null;
let closeTimer = null;
let currentShareGame = null;
let shareAccess = 'private';

const SHARE_MODAL_HTML = `
<div class="share_overlay" id="share_overlay" hidden>
  <div class="share_card" role="dialog" aria-modal="true" aria-labelledby="share_kicker">
    <button type="button" class="share_close" id="share_close" aria-label="Close">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
        stroke-linejoin="round" aria-hidden="true">
        <path d="M18 6 6 18"></path>
        <path d="m6 6 12 12"></path>
      </svg>
    </button>
    <div class="share_kicker" id="share_kicker">Share this result</div>
    <div class="share_result">
      <div class="share_trophy" aria-hidden="true">
        <span class="confetti c1"></span>
        <span class="confetti c2"></span>
        <span class="confetti c3"></span>
        <span class="confetti c4"></span>
        <span class="confetti c5"></span>
        <span class="confetti c6"></span>
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
          stroke-linejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
          <path d="M4 22h16"></path>
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
        </svg>
      </div>
      <div class="share_score">
        <span id="share_score_value">0</span>
        <span class="share_score_unit">pts</span>
      </div>
      <div class="share_meta" id="share_meta"></div>
    </div>
    <div class="share_access" role="radiogroup" aria-labelledby="share_access_label">
      <div class="share_access_label" id="share_access_label">General access</div>
      <div class="share_access_list">
        <button type="button" class="share_access_opt" role="radio" aria-checked="true" tabindex="0"
          data-access="private" id="share_access_private">
          <span class="share_access_icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </span>
          <span class="share_access_text">Private</span>
          <span class="share_access_check" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round"
              stroke-linejoin="round">
              <path d="M20 6 9 17l-5-5"></path>
            </svg>
          </span>
        </button>
        <button type="button" class="share_access_opt" role="radio" aria-checked="false" tabindex="-1"
          data-access="public" id="share_access_public">
          <span class="share_access_icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
              <path d="M2 12h20"></path>
            </svg>
          </span>
          <span class="share_access_text">Anyone with the link can view</span>
          <span class="share_access_check" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round"
              stroke-linejoin="round">
              <path d="M20 6 9 17l-5-5"></path>
            </svg>
          </span>
        </button>
      </div>
    </div>
    <div class="share_link_row">
      <input class="share_link" id="share_link" type="text" readonly aria-label="Link to this result">
      <button type="button" class="share_copy_link" id="share_copy_link">
        <svg class="icon_link" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
          stroke-linejoin="round" aria-hidden="true">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
        </svg>
        <svg class="icon_check" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
          stroke-linejoin="round" aria-hidden="true">
          <path d="M20 6 9 17l-5-5"></path>
        </svg>
        <span data-copy-label>Copy link</span>
      </button>
    </div>
  </div>
</div>`;

export function mapScoreRecord(row) {
  if (!row || typeof row !== 'object') return null;

  const seconds = Number(row.elapsedSeconds);
  const width = Number(row.fieldWidth);
  const height = Number(row.fieldHeight);
  const hints = Number(row.hints);
  const playedAt = row.playedAt ? new Date(row.playedAt) : new Date(NaN);
  const score = Number.isFinite(Number(row.points))
    ? Number(row.points)
    : Math.round(10000 / Math.max(seconds, 1));
  const token = row.gameToken != null ? String(row.gameToken).trim() : '';

  return {
    id: row.id ?? null,
    playedAt,
    size: Number.isInteger(width) ? width : 0,
    width: Number.isInteger(width) ? width : 0,
    height: Number.isInteger(height) ? height : width,
    seconds: Number.isInteger(seconds) && seconds > 0 ? seconds : 0,
    hints: Number.isInteger(hints) && hints >= 0 ? hints : 0,
    score,
    mapTrackId: token || null,
  };
}

function formatDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '—';
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} · ${hh}:${mm}`;
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

function ensureShareModal() {
  if (!document.getElementById('share_overlay')) {
    document.body.insertAdjacentHTML('beforeend', SHARE_MODAL_HTML);
  }
}

function getShareOverlay() {
  ensureShareModal();
  return document.getElementById('share_overlay');
}

function searchUrl(token) {
  if (!token) return `${window.location.origin}/`;
  return `${window.location.origin}/search/${encodeURIComponent(token)}`;
}

function shareLink(game) {
  return searchUrl(game?.mapTrackId);
}

function paintShareAccess(access) {
  shareAccess = access === 'public' ? 'public' : 'private';
  document.querySelectorAll('.share_access_opt').forEach((opt) => {
    const selected = opt.dataset.access === shareAccess;
    opt.setAttribute('aria-checked', String(selected));
    opt.tabIndex = selected ? 0 : -1;
  });
}

async function setShareAccess(access, { persist } = { persist: true }) {
  paintShareAccess(access);
  const input = document.getElementById('share_link');

  if (!persist) {
    input.value = shareLink(currentShareGame);
    return;
  }

  if (shareAccess === 'public' && currentShareGame?.mapTrackId) {
    const request = await fetch(`${backendApiUrl()}/share/generate`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gameToken: currentShareGame.mapTrackId }),
    });
    if (!request.ok) throw new Error('Unable to generate share access link');
    const response = await request.json();
    input.value = searchUrl(response.shareToken);
    return;
  }

  if (shareAccess === 'private' && currentShareGame?.mapTrackId) {
    const request = await fetch(`${backendApiUrl()}/share/revoke`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gameToken: currentShareGame.mapTrackId }),
    });
    if (!request.ok && request.status !== 404) {
      throw new Error('Unable to revoke share token');
    }
    input.value = shareLink(currentShareGame);
  }
}

async function restoreShareAccess(game) {
  const input = document.getElementById('share_link');
  if (!game?.mapTrackId) {
    paintShareAccess('private');
    input.value = shareLink(game);
    return;
  }

  try {
    const request = await fetch(`${backendApiUrl()}/search/${encodeURIComponent(game.mapTrackId)}`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (request.ok) {
      const result = await request.json();
      if (result.access === 'public') {
        paintShareAccess('public');
        input.value = searchUrl(result.shareToken || game.mapTrackId);
        return;
      }
    }
  } catch {
    // keep private
  }

  paintShareAccess('private');
  input.value = shareLink(game);
}

export function openShareModal(game) {
  if (!game?.mapTrackId) return;

  const shareOverlay = getShareOverlay();
  lastFocused = document.activeElement;
  currentShareGame = game;
  restoreShareAccess(game).then(() => {
    document.querySelector('.share_access_opt[aria-checked="true"]')?.focus();
  });

  document.getElementById('share_score_value').textContent = String(game.score);
  document.getElementById('share_meta').textContent =
    `${game.size}×${game.size} · ${formatSeconds(game.seconds)} · ${hintsLabel(game)} · ${formatDate(game.playedAt)}`;

  clearTimeout(closeTimer);
  shareOverlay.hidden = false;
  requestAnimationFrame(() => shareOverlay.classList.add('show'));
}

function closeShareModal() {
  const shareOverlay = getShareOverlay();
  if (shareOverlay.hidden) return;
  shareOverlay.classList.remove('show');
  closeTimer = setTimeout(() => {
    shareOverlay.hidden = true;
  }, 180);
  if (lastFocused) lastFocused.focus();
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const input = document.getElementById('share_link');
    input.select();
    try {
      return document.execCommand('copy');
    } catch {
      return false;
    }
  }
}

function flashCopied(btn) {
  const label = btn.querySelector('[data-copy-label]');
  const restore = label?.textContent ?? '';
  btn.classList.add('copied');
  if (label) label.textContent = 'Copied';
  setTimeout(() => {
    btn.classList.remove('copied');
    if (label) label.textContent = restore;
  }, 1600);
}

export function initShareModal() {
  ensureShareModal();
  if (shareModalReady) return;
  shareModalReady = true;

  const shareOverlay = getShareOverlay();
  document.getElementById('share_close').addEventListener('click', closeShareModal);

  shareOverlay.addEventListener('click', (e) => {
    if (e.target === shareOverlay) closeShareModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !shareOverlay.hidden) closeShareModal();
  });

  const accessOpts = [...document.querySelectorAll('.share_access_opt')];
  accessOpts.forEach((opt) => {
    opt.addEventListener('click', () => setShareAccess(opt.dataset.access));
    opt.addEventListener('keydown', (e) => {
      const i = accessOpts.indexOf(opt);
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        const next = accessOpts[(i + 1) % accessOpts.length];
        setShareAccess(next.dataset.access);
        next.focus();
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const prev = accessOpts[(i - 1 + accessOpts.length) % accessOpts.length];
        setShareAccess(prev.dataset.access);
        prev.focus();
      }
    });
  });

  const copyLinkBtn = document.getElementById('share_copy_link');
  copyLinkBtn.addEventListener('click', async () => {
    if (await copyToClipboard(document.getElementById('share_link').value)) {
      flashCopied(copyLinkBtn);
    }
  });

  document.getElementById('share_link').addEventListener('focus', (e) => e.target.select());
}
