import { api } from './api.js';
import { escapeHTML, formatDate, showToast } from './main.js';

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('item-details-container');
  if (!container) return;

  const urlParams = new URLSearchParams(window.location.search);
  const itemId = urlParams.get('id');

  if (!itemId) {
    renderError(container, 'No item identifier specified in the URL.', 'Return to Directory');
    return;
  }

  try {
    const res = await api.get(`/items/${encodeURIComponent(itemId)}`);
    if (!res.success || !res.data) {
      renderError(container, 'Item report not found.', 'Back to Reports');
      return;
    }

    renderItemDetails(container, res.data);
  } catch (err) {
    renderError(container, err.message || 'Unable to load item report.', 'Back to Reports');
  }
});

function renderItemDetails(container, item) {
  const isLost = item.type === 'lost';
  const typeBadgeClass = isLost ? 'badge-lost' : 'badge-found';
  const typeBadgeText = isLost ? 'Lost Item' : 'Found Item';

  let statusBadgeClass = 'badge-status-open';
  let statusText = 'Open Report';
  if (item.status === 'claimed') {
    statusBadgeClass = 'badge-status-claimed';
    statusText = 'Claim Under Verification';
  } else if (item.status === 'returned') {
    statusBadgeClass = 'badge-status-returned';
    statusText = 'Returned to Owner';
  }

  const imageHtml = item.imageUrl
    ? `<img src="${escapeHTML(item.imageUrl)}" alt="${escapeHTML(item.itemName)}" class="item-card-image" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'item-card-placeholder\\'><span>📦</span><span>No Image Available</span></div>';">`
    : `<div class="item-card-placeholder" style="height: 280px;">
         <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
         </svg>
         <span>No Photograph Provided</span>
       </div>`;

  // Action button logic
  let actionHtml = '';
  if (!isLost && item.status !== 'returned') {
    actionHtml = `
      <div class="card" style="margin-top: 1.5rem; background-color: #F0F4FA; border-color: var(--color-accent);">
        <h3 style="color: var(--color-primary-dark); margin-bottom: 0.35rem;">Is this your item?</h3>
        <p class="text-muted" style="margin-bottom: 1rem;">If you lost an item matching this description, submit an ownership claim. Our campus administration will verify your claim against stored identifying records.</p>
        <a href="claim.html?id=${encodeURIComponent(item._id)}" class="btn btn-primary btn-lg">Submit Ownership Claim</a>
      </div>
    `;
  } else if (!isLost && item.status === 'returned') {
    actionHtml = `
      <div class="card" style="margin-top: 1.5rem; background-color: var(--color-success-bg); border-color: var(--color-success);">
        <h3 style="color: var(--color-success); margin-bottom: 0.25rem;">Item Resolved</h3>
        <p style="color: #1F5A3E; margin: 0;">This found item has been verified and returned to its rightful owner.</p>
      </div>
    `;
  } else {
    // Lost item
    actionHtml = `
      <div class="card" style="margin-top: 1.5rem; background-color: #F8F9FA;">
        <h3 style="color: var(--color-primary-dark); margin-bottom: 0.35rem;">Found this item?</h3>
        <p class="text-muted">If you have found this lost property or have information about it, please contact the reporter directly or submit a Found Item report.</p>
        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
          ${item.contactEmail ? `<a href="mailto:${escapeHTML(item.contactEmail)}?subject=Found%20Item:%20${encodeURIComponent(item.itemName)}" class="btn btn-secondary">Email Reporter</a>` : ''}
          <a href="report.html?type=found" class="btn btn-primary">File a Found Report</a>
        </div>
      </div>
    `;
  }

  // Private details box (visible if present from server)
  const privateDetailsHtml = item.privateDetails ? `
    <div class="card" style="margin-top: 1.25rem; background-color: #FEF7EC; border-color: var(--color-warning);">
      <h4 style="color: var(--color-warning); margin-bottom: 0.25rem;">🔒 Private Administrative Verification Details</h4>
      <p style="font-size: 0.85rem; color: #7B4C08; margin: 0;">${escapeHTML(item.privateDetails)}</p>
      <span class="text-muted" style="font-size: 0.75rem;">(Visible only to you and authorized portal administrators)</span>
    </div>
  ` : '';

  container.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1.3fr; gap: 2rem; align-items: start;" class="item-details-layout">
      <div>
        <div class="item-card-image-wrap" style="height: 320px; border-radius: var(--radius-md); border: 1px solid var(--color-border);">
          ${imageHtml}
        </div>
        ${privateDetailsHtml}
      </div>

      <div>
        <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.75rem;">
          <span class="item-card-badge ${typeBadgeClass}" style="position:static;">${typeBadgeText}</span>
          <span class="item-card-badge ${statusBadgeClass}" style="position:static;">${statusText}</span>
          <span class="text-muted" style="margin-left: auto; font-size: 0.8rem;">Category: <strong>${escapeHTML(item.category)}</strong></span>
        </div>

        <h1 style="font-size: 1.85rem; margin-bottom: 0.75rem;">${escapeHTML(item.itemName)}</h1>

        <div class="card" style="margin-bottom: 1.25rem;">
          <h3 style="margin-bottom: 0.5rem; font-size: 1rem; color: var(--color-primary-dark);">Description</h3>
          <p style="white-space: pre-line; line-height: 1.6;">${escapeHTML(item.description)}</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem;">
          <div class="card">
            <span class="text-muted" style="font-size: 0.75rem; text-transform: uppercase;">Location</span>
            <div style="font-weight: 600; margin-top: 0.2rem; display: flex; align-items: center; gap: 0.35rem;">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
              ${escapeHTML(item.location)}
            </div>
          </div>
          <div class="card">
            <span class="text-muted" style="font-size: 0.75rem; text-transform: uppercase;">Incident Date</span>
            <div style="font-weight: 600; margin-top: 0.2rem; display: flex; align-items: center; gap: 0.35rem;">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              ${formatDate(item.incidentDate)}
            </div>
          </div>
        </div>

        <div class="card" style="margin-bottom: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem;">
            <span>Reported by: <strong>${escapeHTML(item.owner?.name || 'Campus Member')}</strong></span>
            <span class="text-muted">Reported on: ${formatDate(item.createdAt)}</span>
          </div>
        </div>

        ${actionHtml}
      </div>
    </div>
  `;
}

function renderError(container, message, backText = 'Back to Directory') {
  container.innerHTML = `
    <div class="empty-state" style="border-color: var(--color-danger); max-width: 500px; margin: 3rem auto;">
      <svg class="empty-state-icon" style="color: var(--color-danger);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>
      <h3>Unable to display report</h3>
      <p>${escapeHTML(message)}</p>
      <a href="index.html" class="btn btn-secondary">${escapeHTML(backText)}</a>
    </div>
  `;
}
