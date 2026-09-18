import { burgerIcon, mobileCloseIcon } from './icons.js';

function syncMobileHeaderBarHeight(container) {
  if (!container) return;
  const header = document.querySelector('header');
  const top = header ? Math.round(header.getBoundingClientRect().bottom) : container.offsetHeight;
  document.documentElement.style.setProperty('--mobile-header-bar-h', `${top}px`);
}

function syncMobileNavPlacement(container, drawer, navLinks) {
  const github = container.querySelector('.header_github');
  if (window.matchMedia('(max-width: 576px)').matches) {
    navLinks.forEach((link) => drawer.appendChild(link));
  } else {
    navLinks.forEach((link) => container.insertBefore(link, github));
  }
}

export function closeMobileNav() {
  const container = document.querySelector('.header_container');
  const drawer = document.querySelector('.mobile-nav-drawer');
  const scrim = document.querySelector('.mobile-nav-scrim');
  if (!container?.classList.contains('menu-open')) return;

  container.classList.remove('menu-open');
  if (drawer) drawer.hidden = true;
  if (scrim) scrim.hidden = true;
  const toggle = container.querySelector('.menu_toggle');
  if (toggle) {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    toggle.innerHTML = burgerIcon();
  }
}

export function initMobileNav() {
  const header = document.querySelector('header');
  const container = document.querySelector('.header_container');
  if (!header || !container || container.querySelector('.menu_toggle')) return;

  const navLinks = [...container.querySelectorAll('a:not(.header_github):not(.numberlink_nav)')];
  const drawer = document.createElement('div');
  drawer.className = 'mobile-nav-drawer';
  drawer.hidden = true;
  document.body.appendChild(drawer);

  const scrim = document.createElement('div');
  scrim.className = 'mobile-nav-scrim';
  scrim.hidden = true;
  document.body.appendChild(scrim);
  scrim.addEventListener('click', closeMobileNav);

  const mq = window.matchMedia('(max-width: 576px)');
  syncMobileNavPlacement(container, drawer, navLinks);
  mq.addEventListener('change', () => {
    closeMobileNav();
    syncMobileNavPlacement(container, drawer, navLinks);
    syncMobileHeaderBarHeight(container);
  });

  const btn = document.createElement('button');
  btn.className = 'menu_toggle';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Open menu');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = burgerIcon();

  container.prepend(btn);
  syncMobileHeaderBarHeight(container);
  window.addEventListener('resize', () => syncMobileHeaderBarHeight(container));

  btn.addEventListener('click', () => {
    syncMobileHeaderBarHeight(container);
    const open = container.classList.toggle('menu-open');
    drawer.hidden = !open;
    scrim.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    btn.innerHTML = open ? mobileCloseIcon() : burgerIcon();
    requestAnimationFrame(() => {
      btn.blur();
      container.querySelectorAll('.auth-btn').forEach((el) => el.blur());
    });
  });

  drawer.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMobileNav);
  });
}
