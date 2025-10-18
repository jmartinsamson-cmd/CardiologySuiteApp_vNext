/**
 * Citation Viewer UI Component
 * Interactive modal for viewing linked guidelines/PDFs
 */

/**
 * Create citation modal HTML
 * @param {Array} citations - Array of citation objects with source and evidence
 * @returns {string} HTML string for modal
 */
export function createCitationModal(citations) {
  if (!citations || citations.length === 0) {
    return '<div class="no-citations">No citations available</div>';
  }

  const citationItems = citations
    .map(
      (citation, index) => `
    <div class="citation-item" data-index="${index}">
      <div class="citation-header">
        <span class="citation-number">[${index + 1}]</span>
        <h4 class="citation-source">${citation.source || 'Unknown Source'}</h4>
      </div>
      <div class="citation-evidence">
        ${citation.evidence || 'No evidence provided'}
      </div>
      ${citation.url ? `<a href="${citation.url}" target="_blank" class="citation-link">View Full Document →</a>` : ''}
    </div>
  `
    )
    .join('');

  return `
    <div class="citation-modal" id="citationModal">
      <div class="citation-modal-content">
        <div class="citation-modal-header">
          <h3>Clinical Citations</h3>
          <button class="citation-modal-close" onclick="closeCitationModal()">&times;</button>
        </div>
        <div class="citation-modal-body">
          ${citationItems}
        </div>
      </div>
    </div>
  `;
}

/**
 * Show citation modal
 * @param {Array} citations
 */
export function showCitationModal(citations) {
  const modal = document.getElementById('citationModal');
  if (!modal) {
    // Create modal if it doesn't exist
    const modalHTML = createCitationModal(citations);
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }
  
  const modalElement = document.getElementById('citationModal');
  if (modalElement) {
    modalElement.style.display = 'block';
  }
}

/**
 * Close citation modal
 */
export function closeCitationModal() {
  const modal = document.getElementById('citationModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

/**
 * Initialize citation modal event listeners
 */
export function initCitationModal() {
  // Close modal when clicking outside
  window.addEventListener('click', (event) => {
    const modal = document.getElementById('citationModal');
    if (event.target === modal) {
      closeCitationModal();
    }
  });
  
  // Close modal on Escape key
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeCitationModal();
    }
  });
}

// Make functions available globally for onclick handlers
if (typeof window !== 'undefined') {
  window.showCitationModal = showCitationModal;
  window.closeCitationModal = closeCitationModal;
}
