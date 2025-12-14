/**
 * Utilities Module - Shared helper functions and constants
 * Reduces code duplication across the application
 */

// ============================================================================
// CONSTANTS
// ============================================================================

// Previous policy field keys and CSS class mapping
const PREV_POLICY_KEYS = [
    'prev_policy_no', 'prev_branch', 'prev_plan_term', 'prev_sa',
    'prev_y_premium', 'prev_ab_addb', 'prev_doc', 'prev_mode',
    'prev_or', 'prev_m_nm', 'prev_inforce'
];

const PREV_POLICY_CLASS_MAP = {
    prev_policy_no: 'prev-policy-no',
    prev_branch: 'prev-branch',
    prev_plan_term: 'prev-plan-term',
    prev_sa: 'prev-sa',
    prev_y_premium: 'prev-y-premium',
    prev_ab_addb: 'prev-ab-addb',
    prev_doc: 'prev-doc',
    prev_mode: 'prev-mode',
    prev_or: 'prev-or',
    prev_m_nm: 'prev-m-nm',
    prev_inforce: 'prev-inforce'
};

// Family member configuration for repeater nodes
const FAMILY_MEMBER_CONFIG = {
    sibling: {
        template: 'sibling-template',
        itemClass: 'sibling-item',
        prefix: 'sibling',
        headerClass: 'sibling-header',
        removeClass: 'remove-sibling',
        deathContainerClass: 'sibling-death-container'
    },
    child: {
        template: 'child-template',
        itemClass: 'child-item',
        prefix: 'child',
        headerClass: 'child-header',
        removeClass: 'remove-child',
        deathContainerClass: 'child-death-container',
        numField: 'num_children'
    }
};

// ============================================================================
// DOM UTILITIES
// ============================================================================

/**
 * Generic visibility toggle for Yes/No conditional fields
 * @param {string} containerId - ID of the container element
 * @param {string} inputId - ID of the input element (optional)
 * @param {string} value - Current value to check
 * @param {string} triggerValue - Value that triggers visibility (default: 'Yes')
 */
function updateConditionalVisibility(containerId, inputId, value, triggerValue = 'Yes') {
    const container = document.getElementById(containerId);
    const input = inputId ? document.getElementById(inputId) : null;
    const show = value === triggerValue;

    if (container) {
        container.classList.toggle('hidden', !show);
    }

    if (input) {
        if (show) {
            input.setAttribute('required', 'required');
        } else {
            input.removeAttribute('required');
            input.value = '';
        }
    }

    return show;
}

/**
 * Set required attribute on multiple elements based on visibility
 * @param {Array<HTMLElement>} elements - Elements to update
 * @param {boolean} show - Whether to set or remove required
 * @param {boolean} clearOnHide - Whether to clear values when hiding
 */
function setRequiredIfVisible(elements, show, clearOnHide = true) {
    elements.forEach(el => {
        if (!el) return;
        if (show) {
            el.setAttribute('required', 'required');
        } else {
            el.removeAttribute('required');
            if (clearOnHide) el.value = '';
        }
    });
}

/**
 * Get CSS class for a key, with fallback to hyphenated version
 * @param {string} key - The field key
 * @param {Object} classMap - Mapping of keys to CSS classes
 * @returns {string} CSS class name
 */
function getClassForKey(key, classMap) {
    return classMap[key] || key.replace(/_/g, '-');
}

/**
 * Create a family member node (sibling or child)
 * @param {string} type - 'sibling' or 'child'
 * @param {Object} data - Initial data for the node
 * @param {string} role - Display role (e.g., 'Brother', 'Sister', 'Child')
 * @param {number} index - Index for display
 * @returns {HTMLElement|null} The created node
 */
function createFamilyMemberNode(type, data = {}, role = null, index = null) {
    const config = FAMILY_MEMBER_CONFIG[type];
    if (!config) return null;

    const tpl = document.getElementById(config.template);
    if (!tpl) return null;

    const node = tpl.content.firstElementChild.cloneNode(true);
    const prefix = config.prefix;

    // Get elements
    const ageEl = node.querySelector(`.${prefix}-age`);
    const stateEl = node.querySelector(`.${prefix}-state`);
    const diedAgeEl = node.querySelector(`.${prefix}-died-age`);
    const diedYearEl = node.querySelector(`.${prefix}-died-year`);
    const diedCauseEl = node.querySelector(`.${prefix}-died-cause`);
    const deathContainer = node.querySelector(`.${config.deathContainerClass}`);
    const header = node.querySelector(`.${config.headerClass}`);

    // Set header text
    const displayRole = role || (type === 'sibling' ? 'Sibling' : 'Child');
    if (header) header.textContent = `${displayRole}${index ? ' ' + index : ''}`;

    // Populate data
    if (ageEl && typeof data.age !== 'undefined') ageEl.value = data.age;
    if (stateEl && data.state) stateEl.value = data.state;
    if (diedAgeEl && data.died_age) diedAgeEl.value = data.died_age;
    if (diedYearEl && data.died_year) diedYearEl.value = data.died_year;
    if (diedCauseEl && data.died_cause) diedCauseEl.value = data.died_cause;

    // Handle death container visibility
    const deathFields = [diedAgeEl, diedYearEl, diedCauseEl];
    const showDeath = stateEl && stateEl.value === 'Dead';
    if (deathContainer) {
        deathContainer.classList.toggle('hidden', !showDeath);
        setRequiredIfVisible(deathFields, showDeath, false);
    }

    // Wire up remove button
    const removeBtn = node.querySelector(`.${config.removeClass}`);
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            // Update count field if applicable
            if (config.numField) {
                const numEl = document.getElementById(config.numField);
                if (numEl) numEl.value = Math.max(0, (parseInt(numEl.value || '0', 10) - 1));
            } else if (role) {
                // Handle siblings (num_brothers or num_sisters)
                const roleLower = role.toLowerCase();
                const numElId = roleLower === 'brother' ? 'num_brothers' :
                    (roleLower === 'sister' ? 'num_sisters' : null);
                if (numElId) {
                    const numEl = document.getElementById(numElId);
                    if (numEl) numEl.value = Math.max(0, (parseInt(numEl.value || '0', 10) - 1));
                }
            }
            node.remove();
            if (typeof window.renumberRepeaters === 'function') {
                window.renumberRepeaters(displayRole);
            }
            if (type === 'child' && typeof window.updateDeliveryVisibility === 'function') {
                window.updateDeliveryVisibility();
            }
        });
    }

    // Wire up state change listener
    if (stateEl) {
        stateEl.addEventListener('change', (e) => {
            const showDeathNow = e.target.value === 'Dead';
            if (deathContainer) deathContainer.classList.toggle('hidden', !showDeathNow);
            setRequiredIfVisible(deathFields, showDeathNow);
        });
    }

    return node;
}

// ============================================================================
// EXPORTS
// ============================================================================

// Browser-compatible exports
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PREV_POLICY_KEYS,
        PREV_POLICY_CLASS_MAP,
        FAMILY_MEMBER_CONFIG,
        updateConditionalVisibility,
        setRequiredIfVisible,
        getClassForKey,
        createFamilyMemberNode
    };
} else {
    window.UtilsModule = {
        PREV_POLICY_KEYS,
        PREV_POLICY_CLASS_MAP,
        FAMILY_MEMBER_CONFIG,
        updateConditionalVisibility,
        setRequiredIfVisible,
        getClassForKey,
        createFamilyMemberNode
    };
}
