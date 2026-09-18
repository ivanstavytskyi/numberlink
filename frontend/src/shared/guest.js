function guestGateId() {
  return 'guest-gate';
}

function lockIcon() {
  return `
<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <rect x="5" y="11" width="14" height="10" rx="2"/>
  <path d="M8 11V8a4 4 0 0 1 8 0v3"/>
</svg>
`;
}

function guestGateCopy() {
  return {
    leaderboard: {
      title: 'See rankings with an account',
      text: 'Create an account or log in to open the leaderboard and keep your puzzle results after each win.',
    },
    reviews: {
      title: 'Join the conversation',
      text: 'Create an account or log in to read reviews, rate NumberLink, and share your own experience.',
    },
    default: {
      title: 'Continue with an account',
      text: 'Create an account or log in to use this part of NumberLink.',
    },
  };
}

function resolveGatePage() {
  const path = window.location.pathname.toLowerCase();
  if (path.includes('/reviews')) return 'reviews';
  if (path.includes('/leaderboard')) return 'leaderboard';
  return 'default';
}

function applyGateCopy(root) {
  const copy = guestGateCopy()[resolveGatePage()] || guestGateCopy().default;
  const title = root.querySelector('#guest-gate-title');
  const text = root.querySelector('#guest-gate-text');
  if (title) title.textContent = copy.title;
  if (text) text.textContent = copy.text;
}

function ensureGate() {
  let root = document.getElementById(guestGateId());
  if (root) return root;

  root = document.createElement('div');
  root.id = guestGateId();
  root.className = 'guest-gate';
  root.hidden = true;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-labelledby', 'guest-gate-title');
  root.setAttribute('aria-describedby', 'guest-gate-text');
  root.innerHTML = `
    <div class="guest-gate__dialog" tabindex="-1">
      <div class="guest-gate__icon">${lockIcon()}</div>
      <h2 class="guest-gate__title" id="guest-gate-title"></h2>
      <p class="guest-gate__text" id="guest-gate-text"></p>
      <div class="guest-gate__actions">
        <button type="button" class="guest-gate__btn guest-gate__btn--primary" data-gate-auth="signup">
          Sign up
        </button>
        <button type="button" class="guest-gate__btn guest-gate__btn--ghost" data-gate-auth="login">
          Log in
        </button>
      </div>
      <a class="guest-gate__home" href="/"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 8H3"/><path d="M7 4 3 8l4 4"/></svg>Back to NumberLink</a>
    </div>
  `;

  root.querySelectorAll('[data-gate-auth]').forEach((btn) => {
    btn.addEventListener('click', () => {
      btn.blur();
      const mode = btn.getAttribute('data-gate-auth') || 'login';
      window.NumberLinkAuth?.open(mode);
    });
  });

  applyGateCopy(root);
  document.body.appendChild(root);
  return root;
}

function setGateVisible(visible) {
  const root = ensureGate();
  root.hidden = !visible;
  document.body.classList.toggle('guest-locked', visible);

  if (visible) {
    requestAnimationFrame(() => {
      root.querySelector('.guest-gate__dialog')?.focus({ preventScroll: true });
    });
  }
}

function revealPage() {
  if (document.body.dataset.pageRevealed === '1') return;
  document.body.dataset.pageRevealed = '1';
  document.body.style.opacity = '1';
}

function applyAuthState(user) {
  setGateVisible(!user);
}

export function isAuthenticated() {
  return document.body.classList.contains('is-authenticated');
}

/** Run once after the user is authenticated (skips entirely for guests). */
export function whenAuthenticated(callback) {
  let ran = false;
  const run = () => {
    if (ran || !isAuthenticated()) return;
    ran = true;
    callback();
  };

  document.addEventListener('numberlink:auth', (event) => {
    if (event.detail?.user) run();
  });

  if (document.body.dataset.authReady === '1') {
    run();
  }
}

export function initGuestGate() {
  ensureGate();

  document.addEventListener('numberlink:auth', (event) => {
    applyAuthState(event.detail?.user ?? null);
    revealPage();
  });

  if (document.body.dataset.authReady === '1') {
    applyAuthState(isAuthenticated() ? { ok: true } : null);
    revealPage();
  }

  window.setTimeout(revealPage, 3000);
}

window.NumberLinkGuest = {
  isAuthenticated,
  whenAuthenticated,
};
