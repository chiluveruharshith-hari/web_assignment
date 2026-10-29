import { api } from './api.js';
import { escapeHTML, formatDate } from './main.js';

export function renderItemCard(item) {
  const isLost = item.type === 'lost';
  const badgeClass = isLost ? 'badge-lost' : 'badge-found';
  const badgeText = isLost ? 'Lost Item' : 'Found Item';

  let statusBadgeClass = 'badge-status-open';
  let statusText = 'Open';
  if (item.status === 'claimed') {
    statusBadgeClass = 'badge-status-claimed';
    statusText = 'Claim Under Review';
  } else if (item.status === 'returned') {
    statusBadgeClass = 'badge-status-returned';
    statusText = 'Returned / Resolved';
  }

  const imageHtml = item.imageUrl
    ? `<img src="${escapeHTML(item.imageUrl)}" alt="${escapeHTML(item.itemName)}" class="item-card-image" loading="lazy" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'item-card-placeholder\\'><span>📦</span><span>No Image Available</span></div>';">`
    : `<div class="item-card-placeholder">
         <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
         </svg>
         <span>No Image</span>
       </div>`;

  return `
    <a href="item-details.html?id=${encodeURIComponent(item._id)}" class="item-card" id="item-${escapeHTML(item._id)}">
      <div class="item-card-image-wrap">
        ${imageHtml}
        <span class="item-card-badge ${badgeClass}">${badgeText}</span>
      </div>
      <div class="item-card-body">
        <div class="item-card-meta">
          <span>${escapeHTML(item.category)}</span>
          <span class="item-card-badge ${statusBadgeClass}" style="position:static; padding: 0.1rem 0.35rem; font-size: 0.7rem;">${statusText}</span>
        </div>
        <h3 class="item-card-title">${escapeHTML(item.itemName)}</h3>
        <p class="item-card-desc">${escapeHTML(item.description)}</p>
        <div class="item-card-footer">
          <div class="item-location" title="${escapeHTML(item.location)}">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <span>${escapeHTML(item.location)}</span>
          </div>
          <time datetime="${item.incidentDate}">${formatDate(item.incidentDate)}</time>
        </div>
      </div>
    </a>
  `;
}

export function renderEmptyState(container, options = {}) {
  const type = options.type || 'reports';
  const actionText = type === 'lost' ? 'Report a Lost Item' : (type === 'found' ? 'Report a Found Item' : 'Create First Report');
  const actionUrl = type === 'lost' ? 'report.html?type=lost' : (type === 'found' ? 'report.html?type=found' : 'report.html');

  container.innerHTML = `
    <div class="empty-state">
      <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <h3>No items found</h3>
      <p>There are currently no ${escapeHTML(type)} matching your filter criteria. Be the first to report an item.</p>
      <a href="${actionUrl}" class="btn btn-primary">${actionText}</a>
    </div>
  `;
}

export function renderLoading(container) {
  container.innerHTML = `
    <div class="spinner-container">
      <div class="spinner"></div>
      <p>Loading reports from database...</p>
    </div>
  `;
}

export async function fetchAndRenderItems(containerId, filters = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  renderLoading(container);

  try {
    const res = await api.get('/items', filters);
    if (!res.success || !res.data || res.data.length === 0) {
      renderEmptyState(container, { type: filters.type });
      return;
    }

    container.innerHTML = `
      <div class="items-grid">
        ${res.data.map(renderItemCard).join('')}
      </div>
    `;

    // Render count if element exists
    const countEl = document.getElementById('items-count');
    if (countEl) {
      countEl.textContent = `Showing ${res.data.length} of ${res.totalItems || res.data.length} records`;
    }
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state" style="border-color: var(--color-danger);">
        <h3 style="color: var(--color-danger);">Failed to load items</h3>
        <p>${escapeHTML(err.message || 'Could not connect to the server.')}</p>
        <button class="btn btn-secondary" onclick="window.location.reload()">Retry</button>
      </div>
    `;
  }
}
