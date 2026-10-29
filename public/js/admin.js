import { api } from './api.js';
import { escapeHTML, formatDate, showToast } from './main.js';

let activeClaimIdToReview = null;
let currentDecision = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Check authorization
  try {
    const res = await api.get('/auth/me');
    if (!res.success || !res.data || res.data.user.role !== 'admin') {
      showToast('Access Denied', 'Administrator privileges are required to view this portal.', 'error');
      setTimeout(() => { window.location.href = 'login.html?redirect=admin.html'; }, 1000);
      return;
    }
  } catch {
    showToast('Authentication Required', 'Please log in with an administrator account.', 'warning');
    setTimeout(() => { window.location.href = 'login.html?redirect=admin.html'; }, 1000);
    return;
  }

  setupTabs();
  loadAdminStats();
  loadAdminItems();
  loadAdminClaims();
  setupReviewModal();
});

// Switch between Reports and Claims tabs
function setupTabs() {
  const tabs = document.querySelectorAll('.admin-tab-btn');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));

      tab.classList.add('active');
      const targetPanel = document.getElementById(tab.dataset.target);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });
}

// 1. Load Admin Statistics
export async function loadAdminStats() {
  try {
    const res = await api.get('/admin/stats');
    if (res.success && res.data) {
      const stats = res.data;
      updateStatEl('stat-total', stats.totalReports);
      updateStatEl('stat-lost', stats.lostReports);
      updateStatEl('stat-found', stats.foundReports);
      updateStatEl('stat-open', stats.openReports);
      updateStatEl('stat-claims', stats.pendingClaims);
      updateStatEl('stat-returned', stats.returnedItems);

      const claimTabBadge = document.getElementById('pending-claims-badge');
      if (claimTabBadge) {
        claimTabBadge.textContent = stats.pendingClaims;
        claimTabBadge.style.display = stats.pendingClaims > 0 ? 'inline-block' : 'none';
      }
    }
  } catch (err) {
    console.error('Failed to load admin stats:', err);
  }
}

function updateStatEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val !== undefined ? val : 0;
}

// 2. Load Item Reports for Management
export async function loadAdminItems() {
  const tbody = document.getElementById('admin-items-tbody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2rem;">Loading reports...</td></tr>`;

  try {
    const search = document.getElementById('admin-item-search')?.value || '';
    const type = document.getElementById('admin-item-type')?.value || '';
    const status = document.getElementById('admin-item-status')?.value || '';

    const res = await api.get('/admin/items', { search, type, status, limit: 50 });
    if (!res.success || !res.data || res.data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2rem; color: var(--color-text-secondary);">No item reports found matching criteria.</td></tr>`;
      return;
    }

    tbody.innerHTML = res.data.map((item) => {
      const isLost = item.type === 'lost';
      const badgeClass = isLost ? 'badge-lost' : 'badge-found';

      return `
        <tr id="admin-row-${item._id}">
          <td>
            <strong><a href="item-details.html?id=${item._id}" style="color: inherit; text-decoration: underline;">${escapeHTML(item.itemName)}</a></strong>
            ${item.privateDetails ? `<div style="font-size: 0.75rem; color: #7B4C08;" title="Private Details">🔒 ${escapeHTML(item.privateDetails)}</div>` : ''}
          </td>
          <td><span class="item-card-badge ${badgeClass}" style="position:static;">${item.type.toUpperCase()}</span></td>
          <td>${escapeHTML(item.category)}</td>
          <td>${escapeHTML(item.location)}</td>
          <td>${formatDate(item.createdAt)}</td>
          <td>
            <select class="form-select form-select-sm status-select" data-id="${item._id}" style="padding: 0.2rem 0.4rem; font-size: 0.8rem; width: auto;">
              <option value="open" ${item.status === 'open' ? 'selected' : ''}>Open</option>
              <option value="claimed" ${item.status === 'claimed' ? 'selected' : ''}>Claimed</option>
              <option value="returned" ${item.status === 'returned' ? 'selected' : ''}>Returned</option>
            </select>
          </td>
          <td>
            <div class="table-actions">
              <a href="item-details.html?id=${item._id}" class="btn btn-secondary btn-sm" title="View Details">View</a>
              <button class="btn btn-danger btn-sm btn-delete-item" data-id="${item._id}" data-name="${escapeHTML(item.itemName)}">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach status change listeners
    tbody.querySelectorAll('.status-select').forEach((sel) => {
      sel.addEventListener('change', async (e) => {
        const id = e.target.dataset.id;
        const newStatus = e.target.value;
        try {
          await api.patch(`/admin/items/${id}/status`, { status: newStatus });
          showToast('Updated', `Item status set to '${newStatus}'.`, 'success');
          loadAdminStats();
        } catch (err) {
          showToast('Update Failed', err.message || 'Error updating status', 'error');
          loadAdminItems();
        }
      });
    });

    // Attach delete listeners
    tbody.querySelectorAll('.btn-delete-item').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        const name = e.target.dataset.name;
        if (confirm(`Are you sure you want to permanently delete the report for "${name}"? This action cannot be undone.`)) {
          try {
            await api.delete(`/admin/items/${id}`);
            showToast('Deleted', 'Report removed from database.', 'info');
            loadAdminStats();
            loadAdminItems();
          } catch (err) {
            showToast('Delete Failed', err.message || 'Error deleting report', 'error');
          }
        }
      });
    });

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2rem; color: var(--color-danger);">Failed to load reports: ${escapeHTML(err.message)}</td></tr>`;
  }
}

// 3. Load Ownership Claims
export async function loadAdminClaims() {
  const container = document.getElementById('admin-claims-container');
  if (!container) return;

  container.innerHTML = `<div class="spinner-container"><div class="spinner"></div><p>Loading claims...</p></div>`;

  try {
    const res = await api.get('/admin/claims');
    if (!res.success || !res.data || res.data.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>No Claims Submitted</h3>
          <p>There are currently no ownership claims requiring administrator review.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="claims-grid">
        ${res.data.map(renderClaimCard).join('')}
      </div>
    `;

    // Attach approve / reject buttons
    container.querySelectorAll('.btn-approve-claim').forEach((btn) => {
      btn.addEventListener('click', () => {
        openReviewModal(btn.dataset.id, 'approved', btn.dataset.item, btn.dataset.claimant);
      });
    });

    container.querySelectorAll('.btn-reject-claim').forEach((btn) => {
      btn.addEventListener('click', () => {
        openReviewModal(btn.dataset.id, 'rejected', btn.dataset.item, btn.dataset.claimant);
      });
    });

  } catch (err) {
    container.innerHTML = `
      <div class="empty-state" style="border-color: var(--color-danger);">
        <h3>Failed to load claims</h3>
        <p>${escapeHTML(err.message)}</p>
      </div>
    `;
  }
}

function renderClaimCard(claim) {
  const isPending = claim.status === 'pending';
  const isApproved = claim.status === 'approved';

  let statusBadgeClass = 'badge-status-open';
  if (isApproved) statusBadgeClass = 'badge-status-returned';
  else if (claim.status === 'rejected') statusBadgeClass = 'badge-lost';

  return `
    <div class="claim-card" id="claim-card-${claim._id}">
      <div class="claim-card-details">
        <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.35rem;">
          <span class="item-card-badge ${statusBadgeClass}" style="position:static;">${claim.status.toUpperCase()}</span>
          <span class="text-muted" style="font-size: 0.8rem;">Submitted: ${formatDate(claim.createdAt)}</span>
        </div>

        <h4>Property: <a href="item-details.html?id=${claim.item?._id}" style="color: inherit; text-decoration: underline;">${escapeHTML(claim.item?.itemName || 'Deleted Item')}</a></h4>

        <div class="claim-meta">
          <span>Claimant: <strong>${escapeHTML(claim.claimant?.name || 'Unknown')}</strong> (${escapeHTML(claim.claimant?.email || 'N/A')})</span>
          ${claim.contactPhone ? `<span>Phone: <strong>${escapeHTML(claim.contactPhone)}</strong></span>` : ''}
        </div>

        <div class="claim-explanation-box">
          <strong>Claimant's Explanation & Proof:</strong>
          <p style="margin: 0.25rem 0 0;">${escapeHTML(claim.explanation)}</p>
          ${claim.identifyingDetails ? `<div style="margin-top: 0.35rem; font-size: 0.8rem; color: #555;"><strong>Extra Details:</strong> ${escapeHTML(claim.identifyingDetails)}</div>` : ''}
        </div>

        ${claim.item?.privateDetails ? `
          <div class="claim-private-box">
            <strong>Stored Administrative Verification Record:</strong>
            <p style="margin: 0.15rem 0 0;">${escapeHTML(claim.item.privateDetails)}</p>
          </div>
        ` : ''}

        ${claim.reviewNotes ? `
          <div style="font-size: 0.8rem; color: var(--color-text-secondary); margin-top: 0.5rem;">
            Review Notes (${formatDate(claim.reviewedAt)} by ${escapeHTML(claim.reviewedBy?.name || 'Admin')}):
            <em>${escapeHTML(claim.reviewNotes)}</em>
          </div>
        ` : ''}
      </div>

      <div class="claim-actions-panel">
        ${isPending ? `
          <button class="btn btn-primary btn-sm btn-approve-claim" data-id="${claim._id}" data-item="${escapeHTML(claim.item?.itemName || '')}" data-claimant="${escapeHTML(claim.claimant?.name || '')}">
            Approve Claim
          </button>
          <button class="btn btn-danger btn-sm btn-reject-claim" data-id="${claim._id}" data-item="${escapeHTML(claim.item?.itemName || '')}" data-claimant="${escapeHTML(claim.claimant?.name || '')}">
            Reject Claim
          </button>
        ` : `
          <span class="text-muted" style="font-size: 0.85rem; text-align: center;">Decision Finalized</span>
        `}
      </div>
    </div>
  `;
}

// 4. Modal for Claim Review Confirmation
function setupReviewModal() {
  const modal = document.getElementById('review-modal');
  const cancelBtn = document.getElementById('btn-modal-cancel');
  const confirmBtn = document.getElementById('btn-modal-confirm');

  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeReviewModal);
  }

  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      if (!activeClaimIdToReview || !currentDecision) return;

      const notes = document.getElementById('modal-review-notes')?.value || '';
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = 'Processing...';

      try {
        const res = await api.patch(`/admin/claims/${activeClaimIdToReview}`, {
          decision: currentDecision,
          reviewNotes: notes
        });

        showToast('Claim Evaluated', res.message || 'Claim status updated.', 'success');
        closeReviewModal();
        loadAdminStats();
        loadAdminClaims();
        loadAdminItems();
      } catch (err) {
        showToast('Evaluation Failed', err.message || 'Unable to update claim.', 'error');
      } finally {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = 'Confirm Decision';
      }
    });
  }
}

function openReviewModal(claimId, decision, itemName, claimant) {
  activeClaimIdToReview = claimId;
  currentDecision = decision;

  const modal = document.getElementById('review-modal');
  const title = document.getElementById('modal-review-title');
  const text = document.getElementById('modal-review-text');
  const notes = document.getElementById('modal-review-notes');

  if (title) title.textContent = decision === 'approved' ? 'Approve Ownership Claim' : 'Reject Ownership Claim';
  if (text) {
    text.innerHTML = decision === 'approved'
      ? `You are approving <strong>${escapeHTML(claimant)}</strong> as the verified owner of <strong>${escapeHTML(itemName)}</strong>. This will set the item's status to "claimed" and reject any conflicting pending claims.`
      : `You are rejecting the claim submitted by <strong>${escapeHTML(claimant)}</strong> for <strong>${escapeHTML(itemName)}</strong>.`;
  }
  if (notes) notes.value = '';

  if (modal) modal.classList.add('active');
}

function closeReviewModal() {
  activeClaimIdToReview = null;
  currentDecision = null;
  const modal = document.getElementById('review-modal');
  if (modal) modal.classList.remove('active');
}
