import { api } from './api.js';
import { showToast } from './main.js';

document.addEventListener('DOMContentLoaded', () => {
  setupLoginForm();
  setupRegisterForm();
  setupQuickFillDemoButtons();
});

function setupLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value;

    if (!email || !password) {
      showToast('Validation Error', 'Please enter your email and password.', 'warning');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Signing In...';

      const res = await api.post('/auth/login', { email, password });
      if (res.success && res.data) {
        api.setToken(res.data.token);
        showToast('Success', `Welcome back, ${res.data.user.name}!`, 'success');

        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect');

        setTimeout(() => {
          if (redirect) {
            window.location.href = redirect;
          } else if (res.data.user.role === 'admin') {
            window.location.href = 'admin.html';
          } else {
            window.location.href = 'index.html';
          }
        }, 800);
      }
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
      showToast('Authentication Error', err.message || 'Invalid email or password.', 'error');
    }
  });
}

function setupRegisterForm() {
  const form = document.getElementById('register-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;

    if (!name || name.length < 2) {
      showToast('Validation Error', 'Please enter your full name (at least 2 characters).', 'warning');
      return;
    }

    if (!email || !email.includes('@')) {
      showToast('Validation Error', 'Please enter a valid email address.', 'warning');
      return;
    }

    if (!password || password.length < 6) {
      showToast('Validation Error', 'Password must be at least 6 characters long.', 'warning');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Validation Error', 'Passwords do not match.', 'warning');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Creating Account...';

      const res = await api.post('/auth/register', { name, email, password });
      if (res.success && res.data) {
        api.setToken(res.data.token);
        showToast('Success', 'Account registered successfully! Welcome to CampusFind.', 'success');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1000);
      }
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
      showToast('Registration Error', err.message || 'Unable to register account.', 'error');
    }
  });
}

function setupQuickFillDemoButtons() {
  const adminFillBtn = document.getElementById('btn-fill-admin');
  const studentFillBtn = document.getElementById('btn-fill-student');

  if (adminFillBtn) {
    adminFillBtn.addEventListener('click', () => {
      const emailInput = document.getElementById('email');
      const passInput = document.getElementById('password');
      if (emailInput && passInput) {
        emailInput.value = 'admin@campusfind.edu';
        passInput.value = 'DevAdminPass123';
        showToast('Demo Auto-Fill', 'Filled default Administrator credentials.', 'info', 2000);
      }
    });
  }

  if (studentFillBtn) {
    studentFillBtn.addEventListener('click', () => {
      const emailInput = document.getElementById('email');
      const passInput = document.getElementById('password');
      if (emailInput && passInput) {
        emailInput.value = 'alex.student@campusfind.edu';
        passInput.value = 'StudentPass123!';
        showToast('Demo Auto-Fill', 'Filled sample Student credentials.', 'info', 2000);
      }
    });
  }
}
