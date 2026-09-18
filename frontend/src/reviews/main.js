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


async function main() {
    submitComment();
    pagePagination();
    getAverageRate();
    getPercentage();
    getReviewsNumber();

    window.NumberLinkGuest?.whenAuthenticated(() => {
        starsInteractive();
    });
}

main();

function buildReviewCardHtml(item) {
  const commentedAt = convertReviewDate(item.commentedOn);
  const comment = (item.comment || '').trim();
  const avatar = item.avatarUrl;
  const rating = Math.max(0, Math.min(5, Number(item.rating) || 0));
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);

  return `
    <div class="review_card">
          <div class="review_avatar" aria-hidden="true">${avatar ?
          `<img src="${escapeHtml(resolveMediaUrl(avatar))}" alt="" referrerpolicy="no-referrer">` : escapeHtml(userInitials(item.player))}</div>
      <div class="review_body">
        <div class="review_header">
          <div>
            <div class="review_user">${item.player}</div>
            <div class="review_date">${commentedAt}</div>
          </div>
          <div class="review_stars" aria-label="${rating} out of 5 stars">${stars}</div>
        </div>
        ${comment ? `<div class="review_text">${comment}</div>` : ''}
      </div>
    </div>
  `;
}

function showReviewsEmpty() {
  document.querySelector('.reviews_list').innerHTML = `
    <div class="d-flex flex-column justify-content-center align-items-center">
      <div class="lb_empty_state" role="status">
        <div class="lb_empty_icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <div class="lb_empty_content">
          <h3 class="lb_empty_title">No reviews yet</h3>
          <p class="lb_empty_text">Be the first to say how NumberLink plays.</p>
          <button type="button" class="lb_empty_cta" data-empty-cta="write-review">Write a review</button>
        </div>
      </div>
    </div>`;

  document.querySelector('[data-empty-cta="write-review"]')?.addEventListener('click', () => {
    if (!document.body.classList.contains('is-authenticated')) {
      window.NumberLinkAuth?.open('login');
      return;
    }
    const textarea = document.querySelector('.review_input textarea');
    textarea?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    textarea?.focus({ preventScroll: true });
  });
}

async function fetchUserRating() {
  try {
    const response = await fetch(`${backendApiUrl()}/rating`, {
      method: 'GET',
      credentials: 'include',
    });
    if (response.status === 401 || response.status === 403) return null;
    if (!response.ok) throw new Error('API Error');
    const data = await response.json();
    return {
      value: Number(data.value) || 0,
      comment: typeof data.comment === 'string' ? data.comment : '',
    };
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

function bindInteractiveStars(stars, initialValue) {
  let rating = null;
  const paintStars = (index) => {
    stars.forEach((star, ind) => star.classList.toggle('active', ind <= index));
  };

  if (initialValue > 0) {
    rating = initialValue - 1;
    paintStars(rating);
  }

  stars.forEach((star, index) => {
    star.addEventListener('mouseover', () => paintStars(index));
    star.addEventListener('mouseleave', () => {
      if (rating !== null) paintStars(rating);
      else stars.forEach((s) => s.classList.remove('active'));
    });
    star.addEventListener('click', () => {
      rating = index;
      paintStars(index);
    });
  });
}

async function pagePagination() {
    let allData = [];
    let currentPage = 1;
    const itemsPerPage = 3;

    async function fetchComments() {
        try {
            const query = `${backendApiUrl()}/rating/comments`;

            const response = await fetch(query, {
                method: "GET",
                credentials: "include"
            });
            if (!response.ok) throw new Error('API error');

            const data = await response.json();
            allData = (Array.isArray(data) ? data : []).filter((item) => (item.comment || '').trim().length > 0);

            if (!allData || allData.length === 0) {
                showReviewsEmpty();
                return;
            }

            renderPage(1);

        } catch (error) {
            console.error("Error:", error);
        }
    }

    function renderPage(page) {
        currentPage = page;

        const container = document.querySelector('.reviews_list');
        container.innerHTML = '';

        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageData = allData.slice(startIndex, endIndex);
        

        pageData.forEach((item) => {
            container.insertAdjacentHTML('beforeend', buildReviewCardHtml(item));
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


    fetchComments();
}

async function starsInteractive() {
    if (!window.NumberLinkGuest?.isAuthenticated()) return;

    const data = await fetchUserRating();
    const stars = document.querySelectorAll('.interactive_stars .star');
    bindInteractiveStars(stars, data?.value || 0);

    const textarea = document.querySelector('.review_input textarea');
    if (textarea && data?.comment) {
        textarea.value = data.comment;
    }
}

function ensureReviewFeedback(button) {
  let feedback = document.querySelector('.review_feedback');
  if (feedback) return feedback;
  feedback = document.createElement('div');
  feedback.className = 'review_feedback';
  button.insertAdjacentElement('afterend', feedback);
  return feedback;
}

async function postUserRating(value, content) {
  const response = await fetch(`${backendApiUrl()}/rating`, {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify({ rating: Number(value), comment: content}),
    headers: { 'Content-Type': 'application/json' },
  });

  let data = null;
  try {
    data = await response.json();
  } catch (_) {}

  if (response.status === 401 || response.status === 403) {
    window.NumberLinkAuth?.open('login');
    throw new Error('Log in to rate the game.');
  }

  if (!response.ok) {
    throw new Error(data?.message || 'Could not save rating.');
  }
}

async function submitComment() {
  const button = document.querySelector('.review_submit');
  const textarea = document.querySelector('.review_input textarea');
  if (!button || !textarea) return;

  const feedback = ensureReviewFeedback(button);
  const setFeedback = (message, type) => {
    feedback.textContent = message;
    feedback.dataset.type = type || '';
  };

  button.addEventListener('click', async () => {
    const content = textarea.value.trim();
    const selectedRating = document.querySelectorAll('.interactive_stars .star.active').length;

    if (!content && selectedRating === 0) {
      setFeedback('Choose a star rating and write a short review.', 'error');
      return;
    }

    if (content && selectedRating === 0) {
      setFeedback('Choose a star rating before posting a review.', 'error');
      return;
    }

    if (!content) {
      setFeedback('Write a short review before posting.', 'error');
      return;
    }

    button.disabled = true;
    setFeedback('Sending…', 'pending');

    try {
      await postUserRating(selectedRating, content);
      textarea.value = '';
      setFeedback('Review published.', 'success');
      window.location.reload();
    } catch (error) {
      console.error('Comment submit failed:', error);
      setFeedback(error.message || 'Could not add comment.', 'error');
      button.disabled = false;
    }
  });
}

function convertReviewDate(date) {
    const d = new Date(date);

    const formattedDate = new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
    }).format(d);

    const formattedTime = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    }).format(d);

    const result = `${formattedDate} at ${formattedTime}`;

    return result;
}

async function getAverageRate() {
    const query = `${backendApiUrl()}/rating/avg`;
    try {
        const response = await fetch(query);

        if (!response.ok) {
            throw new Error("API Error");
        }

        const data = await response.json();
        const value = Number(data).toFixed(1);

        document.querySelector('.rating_number').innerHTML = value;
    } catch (error) {
        console.error("Error:", error);
    }
}

async function getPercentage() {
    const percentQuery = `${backendApiUrl()}/rating/percentage`;
    const amountQuery = `${backendApiUrl()}/rating/amount`;

    try {
        const [percentResponse, amountResponse] = await Promise.all([
            fetch(percentQuery),
            fetch(amountQuery)
        ]);

        if (!percentResponse.ok || !amountResponse.ok) {
            throw new Error("API Error");
        }

        const data = await percentResponse.json();
        const total = Number(await amountResponse.json()) || 0;

        const rows = [
            { key: 'five', fill: '.fill_5', percent: data.fiveStar },
            { key: 'four', fill: '.fill_4', percent: data.fourStar },
            { key: 'three', fill: '.fill_3', percent: data.threeStar },
            { key: 'two', fill: '.fill_2', percent: data.twoStar },
            { key: 'one', fill: '.fill_1', percent: data.oneStar },
        ];

        const starByKey = { five: 5, four: 4, three: 3, two: 2, one: 1 };

        rows.forEach(({ key, fill, percent }) => {
            const value = Number(percent) || 0;
            const count = Math.round((value * total) / 100);
            const percentEl = document.querySelector(`.stars_percent.${key}`);
            const fillEl = document.querySelector(fill);
            const tipEl = document.querySelector(`#tip-${key}`);
            const labelEl = tipEl?.closest('.stars_label');
            const tipText = count === 1 ? '1 player' : `${count} players`;

            if (percentEl) percentEl.textContent = `${value.toFixed(1)}%`;
            if (fillEl) fillEl.style.width = `${value}%`;
            if (tipEl) tipEl.textContent = tipText;
            if (labelEl) {
                labelEl.setAttribute('aria-label', `${starByKey[key]} stars, ${tipText}`);
            }
        });
    } catch (error) {
        console.error("Error:", error);
    }
}

async function getReviewsNumber() {
    const query = `${backendApiUrl()}/rating/amount`;
    try {
        const response = await fetch(query);

        if (!response.ok) {
            throw new Error("API Error");
        }

        const data = await response.json();
        const value = Number(data);

        document.querySelector('.review_number').innerHTML = value;
    } catch (error) {
        console.error("Error:", error);
    }
}