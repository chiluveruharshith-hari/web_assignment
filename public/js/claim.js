import { api } from './api.js';
import { showToast, escapeHTML } from './main.js';

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('claim-form');
  const itemSummaryContainer = document.getElementById('claim-item-summary');
  const urlParams = new URLSearchParams(window.location.search);
  const itemId = urlParams.get('id');

  if (!itemId) {
    if (itemSummaryContainer) {
      itemSummaryContainer.innerHTML = `
        <div class="empty-state" style="border-color: var(--color-danger);">
          <h3>No Item Selected</h3>
          <p>Please select a found item first to submit an ownership claim.</p>
          <a href="found-items.html" class="btn btn-primary">Browse Found Items</a>
        </div>
      `;
    }
    if (form) form.style.display = 'none';
    return;
  }

  // Load item summary
  try {
    const res = await api.get(`/items/${encodeURIComponent(itemId)}`);
    const item = res.data;

    if (item.type !== 'found') {
      showToast('Error', 'Ownership claims can only be submitted for found items.', 'error');
      setTimeout(() => { window.location.href = `item-details.html?id=${itemId}`; }, 1500);
      return;
    }

    if (item.status === 'returned') {
      showToast('Notice', 'This item has already been returned to its owner.', 'warning');
      setTimeout(() => { window.location.href = `item-details.html?id=${itemId}`; }, 1500);
      return;
    }

    if (itemSummaryContainer) {
      itemSummaryContainer.innerHTML = `
        <div class="card" style="margin-bottom: 1.5rem; background: #F8F9FA;">
          <span class="text-muted" style="font-size: 0.75rem; text-transform: uppercase;">Claiming Found Property:</span>
          <h3 style="margin-top: 0.25rem;">${escapeHTML(item.itemName)}</h3>
          <p class="text-muted" style="margin: 0.25rem 0 0.5rem; font-size: 0.85rem;">
            Category: <strong>${escapeHTML(item.category)}</strong> &bull;
            Found at: <strong>${escapeHTML(item.location)}</strong>
          </p>
        </div>
      `;
    }
  } catch (err) {
    if (itemSummaryContainer) {
      itemSummaryContainer.innerHTML = `
        <div class="empty-state" style="border-color: var(--color-danger);">
          <h3>Item Not Found</h3>
          <p>${escapeHTML(err.message || 'Could not verify item record.')}</p>
          <a href="found-items.html" class="btn btn-secondary">Back to Found Items</a>
        </div>
      `;
    }
    if (form) form.style.display = 'none';
    return;
  }

  // Claim form submission
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const explanation = document.getElementById('explanation')?.value.trim();
      const identifyingDetails = document.getElementById('identifyingDetails')?.value.trim();
      const contactPhone = document.getElementById('contactPhone')?.value.trim();

      if (!explanation || explanation.length < 10) {
        showToast('Validation Error', 'Please provide an explanation of ownership (at least 10 characters).', 'warning');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Submitting Claim...';

        const res = await api.post(`/items/${encodeURIComponent(itemId)}/claims`, {
          explanation,
          identifyingDetails,
          contactPhone
        });

        if (res.success) {
          showToast('Claim Submitted', res.message || 'Your claim has been submitted to campus administration.', 'success');
          form.reset();
          setTimeout(() => {
            window.location.href = `item-details.html?id=${itemId}`;
          }, 1500);
        }
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;

        if (err.status === 401) {
          showToast('Login Required', 'You must be logged in as a student to file an ownership claim.', 'warning');
          setTimeout(() => {
            window.location.href = `login.html?redirect=claim.html?id=${itemId}`;
          }, 1500);
          return;
        }

        showToast('Claim Failed', err.message || 'Unable to submit claim. Please try again.', 'error');
      }
    });
  }
});
