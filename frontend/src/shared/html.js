import { backendOrigin } from './api.js';

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function userInitials(username = '') {
  const cleaned = String(username).trim();
  if (!cleaned) return '?';
  const parts = cleaned.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
}

export function resolveMediaUrl(url) {
  if (!url) return null;
  if (/^(data:|blob:|https?:)/i.test(url)) return url;
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${backendOrigin()}${path}`;
}
