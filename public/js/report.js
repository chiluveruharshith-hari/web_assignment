import { api } from './api.js';
import { showToast, escapeHTML } from './main.js';

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('report-form');
  if (!form) return;

  // Pre-select type from URL query string
  const urlParams = new URLSearchParams(window.location.search);
  const typeParam = urlParams.get('type');
  if (typeParam && ['lost', 'found'].includes(typeParam)) {
    const radio = document.querySelector(`input[name="type"][value="${typeParam}"]`);
    if (radio) radio.checked = true;
    updateFoundNotice(typeParam);
  }

  // Pre-populate today's date
  const dateInput = document.getElementById('incidentDate');
  if (dateInput && !dateInput.value) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    dateInput.max = today; // Cannot be in future
  }

  // Type change listener
  const typeRadios = document.querySelectorAll('input[name="type"]');
  typeRadios.forEach((radio) => {
    radio.addEventListener('change', (e) => {
      updateFoundNotice(e.target.value);
    });
  });

  // Description character counter
  const descTextarea = document.getElementById('description');
  const descCounter = document.getElementById('desc-counter');
  if (descTextarea && descCounter) {
    descTextarea.addEventListener('input', () => {
      const len = descTextarea.value.length;
      descCounter.textContent = `${len} / 2000 characters`;
    });
  }

  // Live image preview
  const imageUrlInput = document.getElementById('imageUrl');
  const imagePreviewWrap = document.getElementById('image-preview-wrap');
  const imagePreviewImg = document.getElementById('image-preview-img');

  if (imageUrlInput && imagePreviewWrap && imagePreviewImg) {
    imageUrlInput.addEventListener('input', () => {
      const url = imageUrlInput.value.trim();
      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        imagePreviewImg.src = url;
        imagePreviewWrap.classList.remove('hidden');
        imagePreviewImg.onerror = () => {
          imagePreviewWrap.classList.add('hidden');
        };
      } else {
        imagePreviewWrap.classList.add('hidden');
      }
    });
  }

  // Handle Form Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllErrors();

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;

    // Gather form values
    const type = form.querySelector('input[name="type"]:checked')?.value;
    const itemName = document.getElementById('itemName')?.value.trim();
    const category = document.getElementById('category')?.value;
    const description = document.getElementById('description')?.value.trim();
    const location = document.getElementById('location')?.value.trim();
    const incidentDate = document.getElementById('incidentDate')?.value;
    const imageUrl = document.getElementById('imageUrl')?.value.trim();
    const contactEmail = document.getElementById('contactEmail')?.value.trim();
    const privateDetails = document.getElementById('privateDetails')?.value.trim();

    // Client-side quick validation
    let hasClientErrors = false;
    if (!type) {
      setFieldError('type', 'Please select whether this item was lost or found.');
      hasClientErrors = true;
    }
    if (!itemName || itemName.length < 3) {
      setFieldError('itemName', 'Item name must be at least 3 characters.');
      hasClientErrors = true;
    }
    if (!category) {
      setFieldError('category', 'Please select a valid category.');
      hasClientErrors = true;
    }
    if (!description || description.length < 10) {
      setFieldError('description', 'Description must be at least 10 characters.');
      hasClientErrors = true;
    }
    if (!location || location.length < 2) {
      setFieldError('location', 'Please specify a campus location.');
      hasClientErrors = true;
    }
    if (!incidentDate) {
      setFieldError('incidentDate', 'Please specify the date of incident.');
      hasClientErrors = true;
    }

    if (hasClientErrors) {
      showToast('Validation Error', 'Please correct the highlighted fields.', 'warning');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Submitting Report...';

      const res = await api.post('/items', {
        type,
        itemName,
        category,
        description,
        location,
        incidentDate,
        imageUrl,
        contactEmail,
        privateDetails
      });

      if (res.success && res.data) {
        showToast('Success', res.message || 'Report submitted successfully!', 'success');
        form.reset();
        setTimeout(() => {
          window.location.href = `item-details.html?id=${res.data._id}`;
        }, 1000);
      }
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;

      if (err.status === 401) {
        showToast('Authentication Required', 'Please log in to submit a report.', 'warning');
        setTimeout(() => {
          window.location.href = 'login.html?redirect=report.html';
        }, 1500);
        return;
      }

      if (err.errors) {
        Object.entries(err.errors).forEach(([field, msg]) => {
          setFieldError(field, msg);
        });
        showToast('Validation Failed', 'Please review the highlighted errors.', 'error');
      } else {
        showToast('Error', err.message || 'Failed to submit report. Please try again.', 'error');
      }
    }
  });
});

function updateFoundNotice(type) {
  const notice = document.getElementById('found-privacy-notice');
  if (notice) {
    if (type === 'found') {
      notice.style.display = 'block';
    } else {
      notice.style.display = 'none';
    }
  }
}

function setFieldError(fieldName, message) {
  const group = document.getElementById(`group-${fieldName}`);
  const errorEl = document.getElementById(`error-${fieldName}`);
  if (group) group.classList.add('has-error');
  if (errorEl) errorEl.textContent = message;
}

function clearAllErrors() {
  document.querySelectorAll('.form-group.has-error').forEach((el) => {
    el.classList.remove('has-error');
  });
  document.querySelectorAll('.form-error').forEach((el) => {
    el.textContent = '';
  });
}
