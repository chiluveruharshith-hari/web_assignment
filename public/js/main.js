import { api } from './api.js';

// Global application state
export const state = {
  currentUser: null
};

// Safe HTML sanitization helper to prevent Cross-Site Scripting (XSS)
export function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// User-friendly date formatting
export function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

// Global Toast Notification Helper
export function showToast(title, message, type = 'info', duration = 4000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <div class="toast-title">${escapeHTML(title)}</div>
      <div class="toast-message">${escapeHTML(message)}</div>
    </div>
    <button class="toast-close" aria-label="Close notification">&times;</button>
  `;

  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => toast.remove());

  container.appendChild(toast);

  if (duration > 0) {
    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, duration);
  }
}

// Check and render authentication status in Header
export async function updateNavAuth() {
  const authContainer = document.getElementById('nav-auth');
  if (!authContainer) return;

  try {
    const res = await api.get('/auth/me');
    if (res.success && res.data && res.data.user) {
      state.currentUser = res.data.user;
      renderUserMenu(authContainer, res.data.user);
      return res.data.user;
    }
  } catch {
    state.currentUser = null;
    renderGuestMenu(authContainer);
  }
  return null;
}

function renderUserMenu(container, user) {
  const isAdmin = user.role === 'admin';
  container.innerHTML = `
    <div class="user-menu">
      <span class="user-name">${escapeHTML(user.name)}</span>
      <span class="user-badge">${escapeHTML(user.role)}</span>
      ${isAdmin ? `<a href="admin.html" class="nav-link">Admin Portal</a>` : ''}
      <button id="nav-btn-logout" class="btn-logout" type="button">Logout</button>
    </div>
  `;

  const logoutBtn = document.getElementById('nav-btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
}

function renderGuestMenu(container) {
  container.innerHTML = `
    <a href="login.html" class="nav-link">Login</a>
    <a href="register.html" class="btn btn-primary btn-sm">Register</a>
  `;
}

export async function handleLogout() {
  try {
    await api.post('/auth/logout');
    api.setToken(null);
    state.currentUser = null;
    showToast('Logged Out', 'You have been signed out safely.', 'info');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 500);
  } catch (err) {
    showToast('Error', err.message || 'Failed to logout.', 'error');
  }
}

// Highlight active navigation tab
function setupActiveNavLink() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

// Mobile navigation toggle
function setupMobileNav() {
  const toggleBtn = document.querySelector('.mobile-nav-toggle');
  const mainNav = document.querySelector('.main-nav');
  if (toggleBtn && mainNav) {
    toggleBtn.addEventListener('click', () => {
      mainNav.classList.toggle('open');
    });
  }
}

// Keyboard shortcut: Press '/' to focus search field
function setupKeyboardShortcuts() {
  window.addEventListener('keydown', (e) => {
    if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
      const searchInput = document.getElementById('search-input');
      if (searchInput) {
        e.preventDefault();
        searchInput.focus();
        showToast('Keyboard Shortcut', 'Search field focused via "/" key', 'info', 1800);
      }
    }
  });
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  setupActiveNavLink();
  setupMobileNav();
  setupKeyboardShortcuts();
  updateNavAuth();
});
