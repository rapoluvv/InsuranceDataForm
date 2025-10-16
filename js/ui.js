/**
 * UI Module - Handles all UI component functions
 * Manages modals, data tables, repeaters, form tabs, and visibility logic
 */

/**
 * Open a modal with specified title
 * @param {string} title - The title for the modal
 */
function openModal(title) {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-body').innerHTML = `<div class="flex items-center justify-center h-32"><div class="loader"></div></div>`;
    const gm = document.getElementById('gemini-modal');
    gm.classList.remove('hidden');
    try { 
        const content = gm.querySelector('.modal-content'); 
        scrollElementToTop(content); 
        const body = document.getElementById('modal-body'); 
        if (body) scrollElementToTop(body); 
    } catch (e) { /* ignore */ }
}

/**
 * Close the Gemini modal
 */
function closeModal() {
    document.getElementById('gemini-modal').classList.add('hidden');
}

/**
 * Close the row details modal
 */
function closeRowDetails() {
    document.getElementById('row-details-modal').classList.add('hidden');
}

/**
 * Open row details modal with content
 * @param {string} title - Modal title
 * @param {string} content - HTML content to display
 */
function openRowDetailsModal(title, content) {
    const modal = document.getElementById('row-details-modal');
    const titleEl = document.getElementById('row-modal-title');
    const overviewEl = document.getElementById('row-modal-overview');
    
    if (titleEl) titleEl.innerText = title;
    if (overviewEl) overviewEl.innerHTML = content;
    
    // Show overview tab, hide others
    const overviewTab = document.querySelector('[data-tab="overview"]');
    const prevpolTab = document.querySelector('[data-tab="prevpol"]');
    const nomineeTab = document.querySelector('[data-tab="nominee"]');
    
    if (overviewTab) overviewTab.classList.add('border-b-2', 'border-blue-500', 'text-blue-600');
    if (prevpolTab) prevpolTab.classList.remove('border-b-2', 'border-blue-500', 'text-blue-600');
    if (nomineeTab) nomineeTab.classList.remove('border-b-2', 'border-blue-500', 'text-blue-600');
    
    const overviewContent = document.getElementById('row-modal-overview');
    const prevpolContent = document.getElementById('row-modal-prevpol');
    const nomineeContent = document.getElementById('row-modal-nominee');
    
    if (overviewContent) overviewContent.classList.remove('hidden');
    if (prevpolContent) prevpolContent.classList.add('hidden');
    if (nomineeContent) nomineeContent.classList.add('hidden');
    
    modal.classList.remove('hidden');
}

/**
 * Escape HTML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Format AI-generated content into readable HTML
 * @param {string} text - Plain text content
 * @returns {string} Formatted HTML
 */
function formatAIContentToHTML(text) {
    if (!text) return '';
    const lines = String(text).replace(/\r/g, '').split('\n');
    let html = '';
    let inUl = false;
    let inOl = false;
    let inPara = false;

    const flushPara = () => {
        if (inPara) { html += '</p>'; inPara = false; }
    };
    const closeLists = () => {
        if (inUl) { html += '</ul>'; inUl = false; }
        if (inOl) { html += '</ol>'; inOl = false; }
    };

    for (let rawLine of lines) {
        const line = rawLine.trim();
        if (line === '') {
            flushPara();
            closeLists();
            continue;
        }

        const ulMatch = line.match(/^[-*]\s+(.*)/);
        if (ulMatch) {
            closeLists();
            if (!inUl) { html += '<ul class="list-disc pl-6 mb-2">'; inUl = true; }
            html += '<li>' + escapeHtml(ulMatch[1]) + '</li>';
            continue;
        }

        const olMatch = line.match(/^\d+[.)]\s+(.*)/);
        if (olMatch) {
            closeLists();
            if (!inOl) { html += '<ol class="list-decimal pl-6 mb-2">'; inOl = true; }
            html += '<li>' + escapeHtml(olMatch[1]) + '</li>';
            continue;
        }

        if (line.endsWith(':') || /^[A-Z0-9 \-]{3,60}:$/.test(line)) {
            flushPara(); closeLists();
            const h = escapeHtml(line.replace(/:$/, ''));
            html += `<h3 class="text-lg font-semibold text-gray-800 mt-3 mb-1">${h}</h3>`;
            continue;
        }

        closeLists();
        if (!inPara) { html += '<p class="mb-2">'; inPara = true; }
        else html += ' ';
        html += escapeHtml(line);
    }

    if (inPara) html += '</p>';
    if (inUl) html += '</ul>';
    if (inOl) html += '</ol>';

    return `<div class="prose max-w-none text-gray-700">${html}</div>`;
}

/**
 * Show content in modal
 * @param {string} content - Content to display
 */
function showModalContent(content) {
    const html = formatAIContentToHTML(content);
    document.getElementById('modal-body').innerHTML = html;
    try { 
        const gm = document.getElementById('gemini-modal'); 
        const contentEl = gm.querySelector('.modal-content'); 
        scrollElementToTop(contentEl); 
        const body = document.getElementById('modal-body'); 
        if (body) scrollElementToTop(body); 
    } catch (e) { /* ignore */ }
}

/**
 * Scroll an element to its top
 * @param {HTMLElement} el - Element to scroll
 */
function scrollElementToTop(el) {
    try {
        if (!el) { window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }); return; }
        if (el === document.body || el === document.documentElement) {
            window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
            return;
        }
        if (typeof el.scrollTo === 'function') {
            el.scrollTop = 0;
            el.scrollLeft = 0;
        } else if (el instanceof HTMLElement) {
            el.scrollTop = 0;
            el.scrollLeft = 0;
        } else {
            window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        }
    } catch (e) { /* ignore */ }
}

/**
 * Show a specific main tab (form-view or data-view)
 * @param {string} tabId - ID of the tab to show
 */
function showMainTab(tabId) {
    document.getElementById('form-view').classList.toggle('hidden', tabId !== 'form-view');
    document.getElementById('data-view').classList.toggle('hidden', tabId !== 'data-view');
    document.getElementById('form-tab-button').classList.toggle('active', tabId === 'form-view');
    document.getElementById('view-tab-button').classList.toggle('active', tabId === 'data-view');
    if (tabId === 'data-view' && typeof window.renderDataTable === 'function') {
        window.renderDataTable();
    }
    try { 
        scrollElementToTop(tabId === 'form-view' ? document.getElementById('form-view') : document.getElementById('data-view')); 
    } catch (e) { /* ignore */ }
}

/**
 * Render the data table with all saved records
 */
async function renderDataTable() {
    // Get data from DataModule if available
    const allData = (typeof window.DataModule !== 'undefined') 
        ? await window.DataModule.getStoredData() 
        : [];
    
    const tableContainer = document.getElementById('data-table-container');

    if (!tableContainer) return;

    if (allData.length === 0) {
        tableContainer.innerHTML = `<p class="text-center text-gray-500 mt-8">No data has been submitted yet.</p>`;
        return;
    }

    let tableHTML = `<table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50"><tr>`;
    tableHTML += `<th scope="col" class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>`;
    tableHTML += `<th scope="col" class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>`;
    const headersToShow = ['name_of_la', 'policy_no', 'plan_term', 'premium', 'doc'];
    headersToShow.forEach(header => {
        const headerText = header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        tableHTML += `<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${headerText}</th>`;
    });
    tableHTML += `<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>`;
    tableHTML += `</tr></thead><tbody class="bg-white divide-y divide-gray-200">`;

    allData.forEach((row, index) => {
        tableHTML += `<tr data-index="${index}" class="cursor-pointer hover:bg-gray-50" onclick="openRowDetails(${index})">`;
        tableHTML += `<td class="px-3 py-4 whitespace-nowrap text-sm text-gray-700"><button onclick="event.stopPropagation(); editRow(${index})" title="Edit" class="p-2 rounded hover:bg-gray-100" aria-label="Edit">✏️</button></td>`;
        tableHTML += `<td class="px-3 py-4 whitespace-nowrap text-sm text-gray-700">${index + 1}</td>`;
        headersToShow.forEach(header => {
            tableHTML += `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${row[header] || 'N/A'}</td>`;
        });
        tableHTML += `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 space-x-2">
            <button onclick="event.stopPropagation(); generateSummary(${index})" class="text-blue-600 hover:text-blue-800 font-semibold">✨</button>
            <button onclick="event.stopPropagation(); deleteRow(${index})" title="Delete" aria-label="Delete" class="text-red-600 hover:text-red-800 font-semibold p-2">🗑️</button>
        </td>`;
        tableHTML += `</tr>`;
    });

    tableHTML += `</tbody></table>`;
    tableContainer.innerHTML = tableHTML;
    try { scrollElementToTop(tableContainer); } catch (e) { /* ignore */ }
}

/**
 * Filter data table based on search input
 */
function filterDataTable() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const rows = document.querySelectorAll('#data-table-container table tbody tr');
    rows.forEach(row => {
        const name = row.cells[2].textContent.toLowerCase();
        const policy = row.cells[3].textContent.toLowerCase();
        if (name.includes(searchTerm) || policy.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Browser-compatible exports
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        openModal,
        closeModal,
        closeRowDetails,
        openRowDetailsModal,
        escapeHtml,
        formatAIContentToHTML,
        showModalContent,
        scrollElementToTop,
        showMainTab,
        renderDataTable,
        filterDataTable
    };
} else {
    window.UIModule = {
        openModal,
        closeModal,
        closeRowDetails,
        openRowDetailsModal,
        escapeHtml,
        formatAIContentToHTML,
        showModalContent,
        scrollElementToTop,
        showMainTab,
        renderDataTable,
        filterDataTable
    };
}
