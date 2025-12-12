/**
 * Application Module - Main application coordination logic
 * Handles form tabs, repeaters, visibility rules, and event coordination
 */

// Application state
let currentFormTabIndex = 0;
let editingIndex = null;
const formTabPanels = document.querySelectorAll('.form-tab-panel');
const formTabsNav = document.getElementById('form-tabs-nav');
// Track which tabs have been visited (for showing warning indicators)
const visitedTabs = new Set([0]); // First tab is visited by default

// Currency formatting helpers
function stripFormatting(val) {
    if (val === null || val === undefined) return '';
    return String(val).replace(/[\u20B9,\s]/g, '').trim();
}

function formatIndianNumber(x) {
    if (x === null || x === undefined) return '';
    const s = String(x).replace(/[^0-9.-]/g, '');
    if (s === '' || isNaN(Number(s))) return '';
    const neg = s.startsWith('-');
    const parts = s.replace('-', '').split('.');
    let intPart = parts[0];
    const decPart = parts[1] ? '.' + parts[1] : '';
    if (intPart.length > 3) {
        const last3 = intPart.slice(-3);
        let rest = intPart.slice(0, -3);
        rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
        intPart = rest + ',' + last3;
    }
    const res = (neg ? '-' : '') + intPart + decPart;
    return res;
}

// Visibility helpers
function updateMarriageDependentVisibility(value) {
    const dependents = document.querySelectorAll('.marriage-dependent');
    const show = value === 'Yes';
    dependents.forEach(el => {
        if (show) el.classList.remove('hidden'); else el.classList.add('hidden');
        const inputs = el.querySelectorAll('input, select, textarea');
        inputs.forEach(i => {
            // Date of marriage (d_marriage) is NOT required, only spouse name is required
            if (i.id === 'd_marriage') {
                i.removeAttribute('required');
            } else {
                if (show) i.setAttribute('required', 'required'); else i.removeAttribute('required');
            }
        });
    });
    if (!show) {
        try {
            const spouse = document.getElementById('spouse');
            const dmar = document.getElementById('d_marriage');
            if (spouse) spouse.value = '';
            if (dmar) dmar.value = '';
        } catch (e) { /* ignore */ }
    }
}

function updateDatingBackVisibility(value) {
    const container = document.getElementById('dating-back-date-container');
    const input = document.getElementById('dating_back_date');
    const show = value === 'Yes';
    if (container) {
        if (show) container.classList.remove('hidden'); else container.classList.add('hidden');
    }
    if (input) {
        if (show) input.setAttribute('required', 'required'); else input.removeAttribute('required');
        if (!show) input.value = '';
    }
}

function updateParentDeathVisibility(member, value) {
    const map = {
        father: 'father-death-container',
        mother: 'mother-death-container',
        spouse: 'spouse-death-container'
    };
    const containerId = map[member];
    if (!containerId) return;
    const container = document.getElementById(containerId);
    const show = value === 'Dead';
    if (!container) return;
    if (show) container.classList.remove('hidden'); else container.classList.add('hidden');
    const inputs = container.querySelectorAll('input, select, textarea');
    inputs.forEach(i => {
        if (show) i.setAttribute('required', 'required'); else i.removeAttribute('required');
        if (!show) i.value = '';
    });
}

function updateOperationsVisibility(value) {
    const container = document.getElementById('operation-details-container');
    const input = document.getElementById('operation_details');
    const show = value === 'Yes';
    if (container) container.classList.toggle('hidden', !show);
    if (input) {
        if (show) input.setAttribute('required', 'required'); else input.removeAttribute('required');
        if (!show) input.value = '';
    }
}

function updateDiseasesVisibility(value) {
    const container = document.getElementById('disease-details-container');
    const input = document.getElementById('disease_details');
    const show = value === 'Yes';
    if (container) container.classList.toggle('hidden', !show);
    if (input) {
        if (show) input.setAttribute('required', 'required'); else input.removeAttribute('required');
        if (!show) input.value = '';
    }
}

function updatePregnancyVisibility(gender) {
    const pregSection = document.getElementById('pregnancy-section');
    const pregSelect = document.getElementById('are_pregnant');
    const husbandSection = document.getElementById('husband-details-section');
    const show = String(gender || '').toLowerCase() === 'female';
    if (pregSection) pregSection.classList.toggle('hidden', !show);
    if (husbandSection) husbandSection.classList.toggle('hidden', !show);
    if (pregSelect) {
        if (show) pregSelect.setAttribute('required', 'required'); else pregSelect.removeAttribute('required');
        if (!show) pregSelect.value = '';
    }
    if (!show) {
        const el = document.getElementById('last_delivery_date');
        if (el) el.value = '';
        if (el) el.removeAttribute('required');
    }
}

function updateDeliveryVisibility() {
    const lastDelContainer = document.getElementById('last-delivery-container');
    const ldInput = document.getElementById('last_delivery_date');
    const gender = (document.getElementById('gender') && document.getElementById('gender').value) || '';
    const numChildrenEl = document.getElementById('num_children');
    const numChildren = numChildrenEl ? parseInt(numChildrenEl.value || '0', 10) : 0;
    const show = String(gender).toLowerCase() === 'female' && Number.isFinite(numChildren) && numChildren > 0;
    if (lastDelContainer) lastDelContainer.classList.toggle('hidden', !show);
    if (ldInput) {
        if (show) {
            ldInput.setAttribute('required', 'required');
        } else {
            ldInput.removeAttribute('required');
            ldInput.value = '';
        }
    }
}

// Form tab navigation - Stepper/Wizard version
function initializeFormTabs() {
    formTabsNav.innerHTML = '';
    formTabPanels.forEach((panel, index) => {
        const tabName = panel.getAttribute('data-tab-name');

        // Create stepper step
        const step = document.createElement('div');
        step.className = 'stepper-step';
        step.setAttribute('data-step-index', index);
        if (index === 0) step.classList.add('active');

        // Create step circle
        const circle = document.createElement('div');
        circle.className = 'step-circle';
        circle.innerHTML = `<span class="step-number">${index + 1}</span>`;

        // Create step label
        const label = document.createElement('div');
        label.className = 'step-label';
        label.textContent = tabName;

        step.appendChild(circle);
        step.appendChild(label);

        step.onclick = () => {
            // Allow free navigation between tabs without validation
            showFormTab(index);
        };

        formTabsNav.appendChild(step);
    });
}

function updateProgress() {
    // Update stepper states instead of progress bar
    const steps = formTabsNav.querySelectorAll('.stepper-step');
    steps.forEach((step, index) => {
        step.classList.remove('active', 'completed', 'has-errors');

        // Check if this tab has missing required fields or validation errors
        const panel = formTabPanels[index];
        let hasMissingRequired = false;
        if (panel) {
            const requiredInputs = panel.querySelectorAll('input[required], select[required], textarea[required]');
            requiredInputs.forEach(input => {
                // Check if the input is in a conditionally hidden container (not the panel itself)
                // We want to skip inputs that are in hidden containers WITHIN the panel,
                // like .marriage-dependent.hidden, but NOT skip just because the panel is hidden
                let isConditionallyHidden = false;
                let parent = input.parentElement;
                while (parent && parent !== panel) {
                    if (parent.classList.contains('hidden')) {
                        isConditionallyHidden = true;
                        break;
                    }
                    parent = parent.parentElement;
                }

                if (!isConditionallyHidden) {
                    // Check if the field is empty
                    const value = input.value ? input.value.trim() : '';
                    if (!value) {
                        hasMissingRequired = true;
                    }
                }
            });

            // Also check for format validation errors (Aadhaar, PAN, email, etc.)
            const aadhaarInput = panel.querySelector('#aadhaar');
            if (aadhaarInput && aadhaarInput.value) {
                const digits = aadhaarInput.value.replace(/[\s-]/g, '');
                if (!/^\d{12}$/.test(digits)) {
                    hasMissingRequired = true;
                }
            }

            const panInput = panel.querySelector('#pan');
            if (panInput && panInput.value && !/^[A-Z]{5}\d{4}[A-Z]$/.test(panInput.value)) {
                hasMissingRequired = true;
            }

            const emailInput = panel.querySelector('#email');
            if (emailInput && emailInput.value && !/^\S+@\S+\.\S+$/.test(emailInput.value)) {
                hasMissingRequired = true;
            }
        }

        if (index === currentFormTabIndex) {
            // Current active tab
            step.classList.add('active');
            if (hasMissingRequired) {
                step.classList.add('has-errors');
            }
        } else if (visitedTabs.has(index)) {
            // Previously visited tabs - show completed or warning based on status
            if (hasMissingRequired) {
                step.classList.add('has-errors');
            } else {
                step.classList.add('completed');
            }
        }
        // Future tabs that haven't been visited yet remain neutral (no class added)
    });
}

function showFormTab(tabIndex) {
    formTabPanels.forEach(panel => panel.classList.add('hidden'));
    formTabPanels[tabIndex].classList.remove('hidden');
    currentFormTabIndex = tabIndex;
    // Mark this tab as visited
    visitedTabs.add(tabIndex);
    updateProgress();
    try {
        if (typeof window.scrollElementToTop === 'function') {
            window.scrollElementToTop(formTabPanels[tabIndex]);
        }
    } catch (e) { /* ignore */ }
}

function navigateFormTab(direction) {
    const newIndex = currentFormTabIndex + direction;
    if (newIndex < 0 || newIndex >= formTabPanels.length) return;
    // Allow free navigation between tabs without validation blocking
    showFormTab(newIndex);
}

// Repeater helpers for nominees
function createNomineeNode(data = {}) {
    const tpl = document.getElementById('nominee-template');
    const node = tpl.content.firstElementChild.cloneNode(true);
    const nameEl = node.querySelector('.nominee-name');
    const shareEl = node.querySelector('.nominee-share');
    const dobEl = node.querySelector('.nominee-dob');
    const relEl = node.querySelector('.nominee-relation');
    const aadEl = node.querySelector('.nominee-aadhaar');
    if (nameEl && data.name) nameEl.value = data.name;
    if (shareEl && typeof data.share !== 'undefined') shareEl.value = data.share;
    if (dobEl && data.dob) dobEl.value = data.dob;
    if (relEl && data.relation) relEl.value = data.relation;
    if (aadEl && data.aadhaar) aadEl.value = data.aadhaar;

    node.querySelector('.remove-nominee').addEventListener('click', () => {
        node.remove();
        if (typeof window.validateNomineeShares === 'function') {
            window.validateNomineeShares();
        }
    });
    [node.querySelector('.nominee-share'), node.querySelector('.nominee-name')].forEach(el => {
        if (!el) return;
        el.addEventListener('input', () => {
            if (typeof window.validateNomineeShares === 'function') {
                window.validateNomineeShares();
            }
        });
    });
    return node;
}

function getNomineesFromRepeater() {
    const container = document.getElementById('nominees-repeater');
    const items = Array.from(container.querySelectorAll('.nominee-item'));
    return items.map(item => {
        return {
            name: (item.querySelector('.nominee-name') || { value: '' }).value.trim(),
            share: (item.querySelector('.nominee-share') || { value: '' }).value.trim(),
            dob: (item.querySelector('.nominee-dob') || { value: '' }).value,
            relation: (item.querySelector('.nominee-relation') || { value: '' }).value.trim(),
            aadhaar: (item.querySelector('.nominee-aadhaar') || { value: '' }).value.trim()
        };
    }).filter(n => n.name || n.share || n.dob || n.relation || n.aadhaar);
}

function clearNomineesRepeater() {
    const container = document.getElementById('nominees-repeater');
    if (container) container.innerHTML = '';
}

function loadNomineesIntoRepeater(list) {
    clearNomineesRepeater();
    const container = document.getElementById('nominees-repeater');
    if (!Array.isArray(list) || !container) return;
    list.forEach(item => container.appendChild(createNomineeNode({
        name: item.name || item.nominee || '',
        share: item.share || item.nominee_share || '',
        dob: item.dob || item.nominee_dob || '',
        relation: item.relation || item.nominee_relation || '',
        aadhaar: item.aadhaar || item.nominee_aadhaar || ''
    })));
    if (typeof window.validateNomineeShares === 'function') {
        window.validateNomineeShares();
    }
}

// Edit a stored row: populate the form and switch to the first tab
async function editRow(index) {
    const DataModule = window.DataModule;
    const allData = await DataModule.getStoredData();
    const row = allData[index];
    if (!row) return alert('Row not found');

    // Track that we're editing this row
    editingIndex = index;
    window.editingIndex = index;

    // Get CSV_HEADERS from DataModule
    const CSV_HEADERS = DataModule.CSV_HEADERS;

    // Populate fields using name attributes
    CSV_HEADERS.forEach(key => {
        const el = document.querySelector(`[name="${key}"]`);
        if (!el) return;
        // For income fields, format for display
        try {
            if (['a_income', 'ly_income1', 'ly_income2', 'ly_income3', 'husband_annual_income'].includes(key)) {
                el.value = row[key] ? formatIndianNumber(stripFormatting(row[key])) : '';
            } else {
                el.value = row[key] || '';
            }
        } catch (e) { /* ignore */ }
    });

    // Handle checkboxes
    const corrCheckbox = document.getElementById('corr_same_kyc');
    if (corrCheckbox) {
        const savedCorr = row['corr_same_kyc'];
        corrCheckbox.checked = (savedCorr === 'on' || savedCorr === 'true' || savedCorr === '1');
        updateCorrAddressVisibility();
    }

    // Populate repeaters
    try {
        if (row.nominees && Array.isArray(row.nominees)) {
            loadNomineesIntoRepeater(row.nominees);
        } else {
            clearNomineesRepeater();
        }
    } catch (e) { clearNomineesRepeater(); }

    try {
        if (row.previous_policies && Array.isArray(row.previous_policies)) {
            loadPreviousPoliciesIntoRepeater(row.previous_policies);
        } else {
            clearPreviousPoliciesRepeater();
        }
    } catch (e) { clearPreviousPoliciesRepeater(); }

    try {
        const repData = {
            brothers: Array.isArray(row.fam_brothers) ? row.fam_brothers : (row.fam_brothers ? JSON.parse(row.fam_brothers) : []),
            sisters: Array.isArray(row.fam_sisters) ? row.fam_sisters : (row.fam_sisters ? JSON.parse(row.fam_sisters) : []),
            children: Array.isArray(row.fam_children) ? row.fam_children : (row.fam_children ? JSON.parse(row.fam_children) : [])
        };
        loadRepeatersFromData(repData);
    } catch (e) { /* ignore */ }

    // Update visibility states
    try {
        if (row.is_married) updateMarriageDependentVisibility(row.is_married);
        if (row.gender) updatePregnancyVisibility(row.gender);
        if (row.dating_back) updateDatingBackVisibility(row.dating_back);
        if (row.any_operations) updateOperationsVisibility(row.any_operations);
        if (row.any_diseases) updateDiseasesVisibility(row.any_diseases);
        ['father', 'mother', 'spouse'].forEach(role => {
            const key = `fam_${role}_state`;
            if (row[key]) updateParentDeathVisibility(role, row[key]);
        });
    } catch (e) { /* ignore */ }

    // Show form view and go to first tab
    if (typeof window.UIModule !== 'undefined' && window.UIModule.showMainTab) {
        window.UIModule.showMainTab('form-view');
    }
    showFormTab(0);

    // Focus first input
    const firstInput = formTabPanels[0]?.querySelector('input, select, textarea');
    if (firstInput) setTimeout(() => { firstInput.focus(); firstInput.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 120);
}

// Open row details modal to view all fields
async function openRowDetails(index) {
    const DataModule = window.DataModule;
    const UIModule = window.UIModule;
    const allData = await DataModule.getStoredData();
    const row = allData[index];
    if (!row) return alert('Row not found');

    // Get CSV_HEADERS and form structure
    const CSV_HEADERS = DataModule.CSV_HEADERS;

    // Set modal title
    document.getElementById('row-modal-title').innerText = row.name_of_la || ('Record #' + (index + 1));

    // Build section map from form tabs
    const formTabPanels = Array.from(document.querySelectorAll('.form-tab-panel'));
    const sectionMap = {};
    formTabPanels.forEach(panel => {
        const sectionName = panel.getAttribute('data-tab-name');
        if (sectionName) sectionMap[sectionName] = [];
    });

    // Group CSV_HEADERS by section
    const grouped = {};
    CSV_HEADERS.forEach(key => {
        let found = false;
        formTabPanels.forEach(panel => {
            const sec = panel.getAttribute('data-tab-name');
            if (sec && panel.querySelector(`[name="${key}"]`)) {
                if (!grouped[sec]) grouped[sec] = [];
                grouped[sec].push(key);
                found = true;
            }
        });
        if (!found) {
            if (!grouped['Other']) grouped['Other'] = [];
            grouped['Other'].push(key);
        }
    });

    // Compute visible fields based on form rules
    function computeVisibleForRow(r) {
        const visible = new Set(CSV_HEADERS);

        // Marriage-dependent fields (is_married, not marital_status)
        if (r.is_married !== 'Yes') {
            visible.delete('spouse');
            visible.delete('d_marriage');
        }

        // Dating back visibility
        if (r.dating_back !== 'Yes') {
            visible.delete('dating_back_date');
        }

        // Operations visibility (any_operations, operation_details)
        if (r.any_operations !== 'Yes') {
            visible.delete('operation_details');
        }

        // Diseases visibility (any_diseases, disease_details)
        if (r.any_diseases !== 'Yes') {
            visible.delete('disease_details');
        }

        // Correspondence address visibility
        if (r.corr_same_kyc === 'on' || r.corr_same_kyc === 'true' || r.corr_same_kyc === true) {
            visible.delete('corr_address');
        }

        // Gender-dependent fields
        if (r.gender !== 'Female') {
            visible.delete('are_pregnant');
            visible.delete('last_delivery_date');
            visible.delete('husband_occupation');
            visible.delete('husband_annual_income');
        } else {
            // For females, check pregnancy for delivery date visibility
            if (r.are_pregnant !== 'Yes') {
                // Still show if they have children
                let childCount = 0;
                try {
                    const ch = Array.isArray(r.fam_children) ? r.fam_children : (r.fam_children ? JSON.parse(r.fam_children) : []);
                    childCount = ch.length;
                } catch (e) { childCount = 0; }
                if (childCount === 0) {
                    visible.delete('last_delivery_date');
                }
            }
        }

        // Parent death details visibility (with fam_ prefix)
        if (r.fam_father_state !== 'Dead') {
            visible.delete('fam_father_died_age');
            visible.delete('fam_father_died_year');
            visible.delete('fam_father_died_cause');
        }
        if (r.fam_mother_state !== 'Dead') {
            visible.delete('fam_mother_died_age');
            visible.delete('fam_mother_died_year');
            visible.delete('fam_mother_died_cause');
        }
        if (r.is_married === 'Yes' && r.fam_spouse_state !== 'Dead') {
            visible.delete('fam_spouse_died_age');
            visible.delete('fam_spouse_died_year');
            visible.delete('fam_spouse_died_cause');
        }

        // Sibling/child repeater fields (handled separately)
        const repeaterPrefixes = ['fam_brother_', 'fam_sister_', 'fam_child_'];
        repeaterPrefixes.forEach(prefix => {
            CSV_HEADERS.forEach(k => {
                if (k.startsWith(prefix)) visible.delete(k);
            });
        });

        return visible;
    }

    const visibleFields = computeVisibleForRow(row);

    // Populate Overview tab
    const overviewEl = document.getElementById('row-modal-overview');
    overviewEl.innerHTML = '';

    Object.entries(grouped).forEach(([sectionName, keys]) => {
        // Skip 'Other', 'Nominee' (has its own tab), and empty sections
        if (sectionName === 'Other' || sectionName === 'Nominee' || keys.length === 0) return;

        const keysFiltered = keys.filter(k => CSV_HEADERS.includes(k));
        if (keysFiltered.length === 0) return;

        // Special handling for Medical History section - group by Father/Mother/Spouse/Other
        if (sectionName === 'Medical History') {
            const header = document.createElement('div');
            header.className = 'col-span-1 sm:col-span-2 pt-2 pb-1 border-b border-gray-200';
            header.innerHTML = `<div class="text-sm font-semibold text-gray-800">${sectionName}</div>`;
            overviewEl.appendChild(header);

            function renderSubsection(title, keysSubset) {
                const subheader = document.createElement('div');
                subheader.className = 'col-span-1 sm:col-span-2 pt-1';
                subheader.innerHTML = `<div class="text-xs font-medium text-gray-600">${title}</div>`;
                overviewEl.appendChild(subheader);

                keysSubset.forEach(key => {
                    if (!visibleFields.has(key)) return;
                    let labelText = null;
                    try {
                        const lab = document.querySelector(`label[for="${key}"]`);
                        if (lab && lab.innerText && lab.innerText.trim()) {
                            labelText = lab.innerText.replace(/\*+/g, '').trim();
                        }
                    } catch (e) { /* ignore */ }
                    if (!labelText) labelText = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    const value = row[key] || '';
                    const item = document.createElement('div');
                    item.className = 'detail-item p-2 rounded border border-transparent hover:border-gray-100';
                    item.innerHTML = `
                        <div class="text-xs text-gray-500">${labelText}</div>
                        <div class="text-sm text-gray-700">${value || '<span class="text-gray-400">(empty)</span>'}</div>
                    `;
                    overviewEl.appendChild(item);
                });
            }

            const fatherKeys = keysFiltered.filter(k => k.startsWith('fam_father_'));
            const motherKeys = keysFiltered.filter(k => k.startsWith('fam_mother_'));
            const spouseKeys = keysFiltered.filter(k => k.startsWith('fam_spouse_'));
            const otherKeys = keysFiltered.filter(k => !fatherKeys.includes(k) && !motherKeys.includes(k) && !spouseKeys.includes(k));

            if (fatherKeys.length > 0) renderSubsection('Father', fatherKeys);
            if (motherKeys.length > 0) renderSubsection('Mother', motherKeys);
            if (spouseKeys.length > 0) renderSubsection('Spouse', spouseKeys);

            // Render repeaters (Brothers, Sisters, Children) as subsections
            function renderRepeaterArray(titlePlural, arr, roleLabel) {
                if (!Array.isArray(arr) || arr.length === 0) return;
                const groupHeader = document.createElement('div');
                groupHeader.className = 'col-span-1 sm:col-span-2 pt-1';
                groupHeader.innerHTML = `<div class="text-sm font-semibold text-gray-800">${titlePlural}</div>`;
                overviewEl.appendChild(groupHeader);

                arr.forEach((it, idx) => {
                    const itemHeader = document.createElement('div');
                    itemHeader.className = 'col-span-1 sm:col-span-2 pt-1';
                    itemHeader.innerHTML = `<div class="text-xs font-medium text-gray-600">${roleLabel} ${idx + 1}</div>`;
                    overviewEl.appendChild(itemHeader);

                    const state = it.state || it.fam_brother_state || it.fam_sister_state || it.fam_child_state;

                    const fields = [
                        { label: 'Age', value: it.age || it.fam_brother_age || it.fam_sister_age || it.fam_child_age },
                        { label: 'State', value: state }
                    ];

                    if (state === 'Dead') {
                        fields.push(
                            { label: 'Age at Death', value: it.died_age || it.fam_brother_died_age || it.fam_sister_died_age || it.fam_child_died_age },
                            { label: 'Death Year', value: it.died_year || it.fam_brother_died_year || it.fam_sister_died_year || it.fam_child_died_year },
                            { label: 'Cause of Death', value: it.died_cause || it.fam_brother_died_cause || it.fam_sister_died_cause || it.fam_child_died_cause }
                        );
                    }

                    fields.forEach(f => {
                        const item = document.createElement('div');
                        item.className = 'detail-item p-2 rounded border border-transparent hover:border-gray-100';
                        item.innerHTML = `
                            <div class="text-xs text-gray-500">${f.label}</div>
                            <div class="text-sm text-gray-700">${f.value || '<span class="text-gray-400">(empty)</span>'}</div>
                        `;
                        overviewEl.appendChild(item);
                    });
                });
            }

            let bros = [];
            try { bros = Array.isArray(row.fam_brothers) ? row.fam_brothers : (row.fam_brothers ? JSON.parse(row.fam_brothers) : []); } catch (e) { bros = []; }
            let sis = [];
            try { sis = Array.isArray(row.fam_sisters) ? row.fam_sisters : (row.fam_sisters ? JSON.parse(row.fam_sisters) : []); } catch (e) { sis = []; }
            let ch = [];
            try { ch = Array.isArray(row.fam_children) ? row.fam_children : (row.fam_children ? JSON.parse(row.fam_children) : []); } catch (e) { ch = []; }

            renderRepeaterArray('Brothers', bros, 'Brother');
            renderRepeaterArray('Sisters', sis, 'Sister');
            renderRepeaterArray('Children', ch, 'Child');

            const leftoverKeys = otherKeys.filter(k => !k.startsWith('fam_brother') && !k.startsWith('fam_sister') && !k.startsWith('fam_child'));
            if (leftoverKeys.length > 0) renderSubsection('Medical', leftoverKeys);
        } else {
            const header = document.createElement('div');
            header.className = 'col-span-1 sm:col-span-2 pt-2 pb-1 border-b border-gray-200';
            header.innerHTML = `<div class="text-sm font-semibold text-gray-800">${sectionName}</div>`;
            overviewEl.appendChild(header);

            keysFiltered.forEach(key => {
                if (!visibleFields.has(key)) return;
                let labelText = null;
                try {
                    const lab = document.querySelector(`label[for="${key}"]`);
                    if (lab && lab.innerText && lab.innerText.trim()) {
                        labelText = lab.innerText.replace(/\*+/g, '').trim();
                    }
                } catch (e) { /* ignore */ }
                if (!labelText) labelText = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                const value = row[key] || '';
                const item = document.createElement('div');
                item.className = 'detail-item p-2 rounded border border-transparent hover:border-gray-100';
                item.innerHTML = `
                    <div class="text-xs text-gray-500">${labelText}</div>
                    <div class="text-sm text-gray-700">${value || '<span class="text-gray-400">(empty)</span>'}</div>
                `;
                overviewEl.appendChild(item);
            });
        }
    });

    // Populate Previous Policies tab
    const prevListEl = document.getElementById('prevpol-list');
    const prevDetailEl = document.getElementById('prevpol-detail');
    prevListEl.innerHTML = '';
    prevDetailEl.innerHTML = '';

    let policies = Array.isArray(row.previous_policies) ? row.previous_policies : [];
    if ((!policies || policies.length === 0) && (row.prev_policy_no || row.prev_plan_term || row.prev_y_premium)) {
        policies = [{
            prev_policy_no: row.prev_policy_no || '',
            prev_branch: row.prev_branch || '',
            prev_plan_term: row.prev_plan_term || '',
            prev_sa: row.prev_sa || '',
            prev_y_premium: row.prev_y_premium || '',
            prev_ab_addb: row.prev_ab_addb || '',
            prev_doc: row.prev_doc || '',
            prev_or: row.prev_or || '',
            prev_m_nm: row.prev_m_nm || '',
            prev_inforce: row.prev_inforce || ''
        }];
    }

    if (policies.length === 0) {
        prevListEl.innerHTML = `<div class="text-sm text-gray-500">No previous policies saved.</div>`;
        prevDetailEl.innerHTML = `<div class="text-sm text-gray-500">Select a policy to view details.</div>`;
    } else {
        policies.forEach((pol, i) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'w-full text-left p-2 rounded hover:bg-gray-100';
            btn.innerHTML = `<div class="text-sm font-medium">Policy ${i + 1}</div><div class="text-xs text-gray-500">${pol.prev_policy_no || ''}</div>`;
            btn.addEventListener('click', () => {
                prevDetailEl.innerHTML = '';
                const card = document.createElement('div');
                card.className = 'p-3 border rounded bg-white';
                card.innerHTML = `
                    <div class="grid grid-cols-1 gap-1 text-xs text-gray-600">
                        <div><strong>Policy Number:</strong> <span class="text-gray-700">${pol.prev_policy_no || '<span class="text-gray-400">(empty)</span>'}</span></div>
                        <div><strong>Branch:</strong> <span class="text-gray-700">${pol.prev_branch || '<span class="text-gray-400">(empty)</span>'}</span></div>
                        <div><strong>Plan/Term:</strong> <span class="text-gray-700">${pol.prev_plan_term || '<span class="text-gray-400">(empty)</span>'}</span></div>
                        <div><strong>Sum Assured:</strong> <span class="text-gray-700">${pol.prev_sa || '<span class="text-gray-400">(empty)</span>'}</span></div>
                        <div><strong>Premium:</strong> <span class="text-gray-700">${pol.prev_y_premium || '<span class="text-gray-400">(empty)</span>'}</span></div>
                        <div><strong>Accidental Benefit:</strong> <span class="text-gray-700">${pol.prev_ab_addb || '<span class="text-gray-400">(empty)</span>'}</span></div>
                        <div><strong>Date of Commencement:</strong> <span class="text-gray-700">${pol.prev_doc || '<span class="text-gray-400">(empty)</span>'}</span></div>
                        <div><strong>OR:</strong> <span class="text-gray-700">${pol.prev_or || '<span class="text-gray-400">(empty)</span>'}</span></div>
                        <div><strong>Medical:</strong> <span class="text-gray-700">${pol.prev_m_nm || '<span class="text-gray-400">(empty)</span>'}</span></div>
                        <div><strong>Inforce:</strong> <span class="text-gray-700">${pol.prev_inforce || '<span class="text-gray-400">(empty)</span>'}</span></div>
                    </div>
                `;
                prevDetailEl.appendChild(card);
            });
            prevListEl.appendChild(btn);
        });
        setTimeout(() => {
            const firstBtn = prevListEl.querySelector('button');
            if (firstBtn) firstBtn.click();
        }, 20);
    }

    // Wire Edit button
    const editBtn = document.getElementById('row-modal-edit');
    editBtn.onclick = (e) => {
        e.stopPropagation();
        UIModule.closeRowDetails();
        setTimeout(() => editRow(index), 80);
    };

    // Tab switching
    const tabOverview = document.getElementById('modal-tab-overview');
    const tabPrev = document.getElementById('modal-tab-prevpol');
    const bodyOverview = document.getElementById('row-modal-overview');
    const bodyPrev = document.getElementById('row-modal-prevpol');

    function activateOverview() {
        const tabNomLocal = document.getElementById('modal-tab-nominee');
        [tabOverview, tabPrev, tabNomLocal].forEach(t => {
            if (!t) return;
            t.classList.remove('text-blue-600', 'border-b-2');
            t.classList.add('border-transparent');
        });
        tabOverview.classList.add('text-blue-600', 'border-b-2');
        tabOverview.classList.remove('border-transparent');
        bodyOverview.classList.remove('hidden');
        bodyPrev.classList.add('hidden');
        const bodyNom = document.getElementById('row-modal-nominee');
        if (bodyNom) bodyNom.classList.add('hidden');
        try {
            const modalContent = document.getElementById('row-details-modal').querySelector('.modal-content');
            UIModule.scrollElementToTop(modalContent);
            UIModule.scrollElementToTop(bodyOverview);
        } catch (e) { /* ignore */ }
    }

    function activatePrev() {
        const tabNomLocal = document.getElementById('modal-tab-nominee');
        [tabOverview, tabPrev, tabNomLocal].forEach(t => {
            if (!t) return;
            t.classList.remove('text-blue-600', 'border-b-2');
            t.classList.add('border-transparent');
        });
        tabPrev.classList.add('text-blue-600', 'border-b-2');
        bodyPrev.classList.remove('hidden');
        bodyOverview.classList.add('hidden');
        const bodyNom = document.getElementById('row-modal-nominee');
        if (bodyNom) bodyNom.classList.add('hidden');
        try {
            const modalContent = document.getElementById('row-details-modal').querySelector('.modal-content');
            UIModule.scrollElementToTop(modalContent);
            UIModule.scrollElementToTop(bodyPrev);
        } catch (e) { /* ignore */ }
    }

    function activateNominee() {
        const tabNom = document.getElementById('modal-tab-nominee');
        const bodyNom = document.getElementById('row-modal-nominee');
        tabNom.classList.add('text-blue-600', 'border-b-2');
        tabOverview.classList.remove('text-blue-600', 'border-b-2');
        tabPrev.classList.remove('text-blue-600', 'border-b-2');
        if (bodyNom) bodyNom.classList.remove('hidden');
        bodyOverview.classList.add('hidden');
        bodyPrev.classList.add('hidden');
        try {
            const modalContent = document.getElementById('row-details-modal').querySelector('.modal-content');
            UIModule.scrollElementToTop(modalContent);
            UIModule.scrollElementToTop(bodyNom);
        } catch (e) { /* ignore */ }
    }

    tabOverview.onclick = activateOverview;
    tabPrev.onclick = activatePrev;
    const tabNom = document.getElementById('modal-tab-nominee');
    if (tabNom) tabNom.onclick = activateNominee;

    // Populate Nominees tab
    try {
        const listEl = document.getElementById('nominee-list');
        const detailEl = document.getElementById('nominee-detail');
        const appContainer = document.getElementById('appointee-container');
        if (listEl && detailEl && appContainer) {
            listEl.innerHTML = '';
            detailEl.innerHTML = '';
            appContainer.innerHTML = '';

            const hasAppointee = (row.appointee && String(row.appointee).trim()) || (row.appointee_relation && String(row.appointee_relation).trim()) || (row.appointee_age && String(row.appointee_age).trim());
            if (hasAppointee) {
                const appCard = document.createElement('div');
                appCard.className = 'p-3 border rounded bg-white';
                appCard.innerHTML = `
                    <div class="text-sm font-semibold text-gray-800 mb-1">Appointee</div>
                    <div class="text-xs text-gray-600">Name: ${row.appointee || '<span class="text-gray-400">(empty)</span>'}</div>
                    <div class="text-xs text-gray-600">Relation: ${row.appointee_relation || '<span class="text-gray-400">(empty)</span>'}</div>
                    <div class="text-xs text-gray-600">Age: ${row.appointee_age || '<span class="text-gray-400">(empty)</span>'}</div>
                `;
                appContainer.appendChild(appCard);
            }

            const savedNoms = Array.isArray(row.nominees) ? row.nominees : (row.nominees ? JSON.parse(row.nominees || '[]') : []);
            if (!Array.isArray(savedNoms) || savedNoms.length === 0) {
                listEl.innerHTML = '<div class="text-sm text-gray-500">No nominees saved for this entry.</div>';
                detailEl.innerHTML = '<div class="text-sm text-gray-500">Select a nominee to view details.</div>';
            } else {
                function renderNomineeDetail(nom, idx) {
                    detailEl.innerHTML = '';
                    const card = document.createElement('div');
                    card.className = 'p-3 border rounded bg-white';
                    const name = nom.name || nom.nominee || '';
                    const share = (typeof nom.share !== 'undefined') ? nom.share : (nom.nominee_share || '');
                    const rel = nom.relation || nom.nominee_relation || '';
                    const dob = nom.dob || nom.nominee_dob || '';
                    const aad = nom.aadhaar || nom.nominee_aadhaar || '';
                    card.innerHTML = `
                        <div class="text-sm font-semibold text-gray-800 mb-1">${name || '(unnamed)'}</div>
                        <div class="text-xs text-gray-600">Share: ${share || '(unspecified)'}%</div>
                        <div class="text-xs text-gray-600">Relation: ${rel || '(unspecified)'}</div>
                        <div class="text-xs text-gray-600">DOB: ${dob || '(unspecified)'}</div>
                        <div class="text-xs text-gray-600">Aadhaar: ${aad || '(unspecified)'}</div>
                    `;
                    detailEl.appendChild(card);
                }

                savedNoms.forEach((n, i) => {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'w-full text-left p-2 rounded hover:bg-gray-100';
                    const displayName = (n.name || n.nominee || `(Nominee ${i + 1})`);
                    btn.innerHTML = `<div class="text-sm font-medium">${displayName}</div><div class="text-xs text-gray-500">${n.relation || n.nominee_relation || ''}</div>`;
                    btn.addEventListener('click', () => {
                        Array.from(listEl.querySelectorAll('button')).forEach(b => b.classList.remove('bg-blue-50'));
                        btn.classList.add('bg-blue-50');
                        renderNomineeDetail(n, i);
                    });
                    listEl.appendChild(btn);
                });

                setTimeout(() => {
                    const firstBtn = listEl.querySelector('button');
                    if (firstBtn) firstBtn.click();
                }, 20);
            }
        }
    } catch (e) { console.error('Nominee render failed', e); }

    // Show modal and activate overview tab
    document.getElementById('row-details-modal').classList.remove('hidden');
    activateOverview();

    try {
        const modal = document.getElementById('row-details-modal');
        const modalContent = modal.querySelector('.modal-content');
        UIModule.scrollElementToTop(modalContent);
        const overview = document.getElementById('row-modal-overview');
        if (overview) UIModule.scrollElementToTop(overview);
    } catch (e) { /* ignore */ }
}

// Previous Policy Repeater Functions
function createPreviousPolicyNode(data = {}) {
    const tpl = document.getElementById('previous-policy-template');
    if (!tpl) return null;
    const node = tpl.content.firstElementChild.cloneNode(true);
    const map = ['prev_policy_no', 'prev_branch', 'prev_plan_term', 'prev_sa', 'prev_y_premium', 'prev_ab_addb', 'prev_doc', 'prev_mode', 'prev_or', 'prev_m_nm', 'prev_inforce'];
    const classMap = {
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
    map.forEach(k => {
        const cls = classMap[k] || k.replace(/_/g, '-');
        const el = node.querySelector('.' + cls);
        if (el && data[k] !== undefined && data[k] !== null) el.value = data[k];
    });
    const removeBtn = node.querySelector('.remove-previous-policy');
    if (removeBtn) {
        removeBtn.addEventListener('click', () => node.remove());
    }
    return node;
}

function getPreviousPoliciesFromRepeater() {
    const container = document.getElementById('previous-policies-repeater');
    if (!container) return [];
    const items = Array.from(container.querySelectorAll('.previous-policy-item'));
    return items.map(item => {
        const obj = {};
        const keys = ['prev_policy_no', 'prev_branch', 'prev_plan_term', 'prev_sa', 'prev_y_premium', 'prev_ab_addb', 'prev_doc', 'prev_mode', 'prev_or', 'prev_m_nm', 'prev_inforce'];
        const classMap = {
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
        keys.forEach(k => {
            const cls = classMap[k] || k.replace(/_/g, '-');
            const el = item.querySelector('.' + cls);
            obj[k] = el ? el.value : '';
        });
        return obj;
    }).filter(x => Object.values(x).some(v => v && v.toString().trim() !== ''));
}

function clearPreviousPoliciesRepeater() {
    const container = document.getElementById('previous-policies-repeater');
    if (container) container.innerHTML = '';
}

function loadPreviousPoliciesIntoRepeater(list) {
    clearPreviousPoliciesRepeater();
    const container = document.getElementById('previous-policies-repeater');
    if (!Array.isArray(list) || !container) return;
    list.forEach(item => {
        const node = createPreviousPolicyNode(item);
        if (node) container.appendChild(node);
    });
}

// Siblings & Children Repeater Functions
function createSiblingNode(data = {}, role = 'Sibling', index = null) {
    const tpl = document.getElementById('sibling-template');
    if (!tpl) return null;
    const node = tpl.content.firstElementChild.cloneNode(true);
    const ageEl = node.querySelector('.sibling-age');
    const stateEl = node.querySelector('.sibling-state');
    const diedAgeEl = node.querySelector('.sibling-died-age');
    const diedYearEl = node.querySelector('.sibling-died-year');
    const diedCauseEl = node.querySelector('.sibling-died-cause');
    const deathContainer = node.querySelector('.sibling-death-container');

    const header = node.querySelector('.sibling-header');
    if (header) header.textContent = `${role}${index ? ' ' + index : ''}`;

    if (ageEl && typeof data.age !== 'undefined') ageEl.value = data.age;
    if (stateEl && data.state) stateEl.value = data.state;
    if (diedAgeEl && data.died_age) diedAgeEl.value = data.died_age;
    if (diedYearEl && data.died_year) diedYearEl.value = data.died_year;
    if (diedCauseEl && data.died_cause) diedCauseEl.value = data.died_cause;

    const show = stateEl && stateEl.value === 'Dead';
    if (deathContainer) {
        deathContainer.classList.toggle('hidden', !show);
        [diedAgeEl, diedYearEl, diedCauseEl].forEach(el => {
            if (!el) return;
            if (show) el.setAttribute('required', 'required');
            else el.removeAttribute('required');
        });
    }

    const removeBtn = node.querySelector('.remove-sibling');
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            const numEl = document.getElementById(role.toLowerCase() === 'brother' ? 'num_brothers' : 'num_sisters');
            if (numEl) numEl.value = Math.max(0, (parseInt(numEl.value || '0', 10) - 1));
            node.remove();
            renumberRepeaters(role);
        });
    }

    if (stateEl) {
        stateEl.addEventListener('change', (e) => {
            const show = e.target.value === 'Dead';
            if (deathContainer) deathContainer.classList.toggle('hidden', !show);
            [diedAgeEl, diedYearEl, diedCauseEl].forEach(el => {
                if (!el) return;
                if (show) el.setAttribute('required', 'required');
                else {
                    el.removeAttribute('required');
                    el.value = '';
                }
            });
        });
    }
    return node;
}

function createChildNode(data = {}, role = 'Child', index = null) {
    const tpl = document.getElementById('child-template');
    if (!tpl) return null;
    const node = tpl.content.firstElementChild.cloneNode(true);
    const ageEl = node.querySelector('.child-age');
    const stateEl = node.querySelector('.child-state');
    const diedAgeEl = node.querySelector('.child-died-age');
    const diedYearEl = node.querySelector('.child-died-year');
    const diedCauseEl = node.querySelector('.child-died-cause');
    const deathContainer = node.querySelector('.child-death-container');

    const header = node.querySelector('.child-header');
    if (header) header.textContent = `${role}${index ? ' ' + index : ''}`;

    if (ageEl && typeof data.age !== 'undefined') ageEl.value = data.age;
    if (stateEl && data.state) stateEl.value = data.state;
    if (diedAgeEl && data.died_age) diedAgeEl.value = data.died_age;
    if (diedYearEl && data.died_year) diedYearEl.value = data.died_year;
    if (diedCauseEl && data.died_cause) diedCauseEl.value = data.died_cause;

    const show = stateEl && stateEl.value === 'Dead';
    if (deathContainer) {
        deathContainer.classList.toggle('hidden', !show);
        [diedAgeEl, diedYearEl, diedCauseEl].forEach(el => {
            if (!el) return;
            if (show) el.setAttribute('required', 'required');
            else el.removeAttribute('required');
        });
    }

    const removeBtn = node.querySelector('.remove-child');
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            const numEl = document.getElementById('num_children');
            if (numEl) numEl.value = Math.max(0, (parseInt(numEl.value || '0', 10) - 1));
            node.remove();
            renumberRepeaters('Child');
            updateDeliveryVisibility();
        });
    }

    if (stateEl) {
        stateEl.addEventListener('change', (e) => {
            const show = e.target.value === 'Dead';
            if (deathContainer) deathContainer.classList.toggle('hidden', !show);
            [diedAgeEl, diedYearEl, diedCauseEl].forEach(el => {
                if (!el) return;
                if (show) el.setAttribute('required', 'required');
                else {
                    el.removeAttribute('required');
                    el.value = '';
                }
            });
        });
    }
    return node;
}

function renumberRepeaters(role) {
    let selector = '';
    let headerClass = '';
    if (role.toLowerCase() === 'brother') {
        selector = '#brothers-repeater .sibling-item';
        headerClass = 'sibling-header';
    } else if (role.toLowerCase() === 'sister') {
        selector = '#sisters-repeater .sibling-item';
        headerClass = 'sibling-header';
    } else if (role.toLowerCase() === 'child') {
        selector = '#children-repeater .child-item';
        headerClass = 'child-header';
    }
    if (!selector) return;

    const items = Array.from(document.querySelectorAll(selector));
    items.forEach((node, i) => {
        const header = node.querySelector('.' + headerClass);
        if (header) header.textContent = `${role} ${i + 1}`;
    });
}

function syncRepeatersFromCounts() {
    const bCount = parseInt(document.getElementById('num_brothers')?.value || '0', 10);
    const sCount = parseInt(document.getElementById('num_sisters')?.value || '0', 10);
    const cCount = parseInt(document.getElementById('num_children')?.value || '0', 10);
    const bContainer = document.getElementById('brothers-repeater');
    const sContainer = document.getElementById('sisters-repeater');
    const cContainer = document.getElementById('children-repeater');

    if (bContainer) {
        while (bContainer.children.length < bCount) {
            const idx = bContainer.children.length + 1;
            const node = createSiblingNode({}, 'Brother', idx);
            if (node) bContainer.appendChild(node);
        }
        while (bContainer.children.length > bCount && bContainer.lastElementChild) {
            bContainer.lastElementChild.remove();
        }
        renumberRepeaters('Brother');
    }

    if (sContainer) {
        while (sContainer.children.length < sCount) {
            const idx = sContainer.children.length + 1;
            const node = createSiblingNode({}, 'Sister', idx);
            if (node) sContainer.appendChild(node);
        }
        while (sContainer.children.length > sCount && sContainer.lastElementChild) {
            sContainer.lastElementChild.remove();
        }
        renumberRepeaters('Sister');
    }

    if (cContainer) {
        while (cContainer.children.length < cCount) {
            const idx = cContainer.children.length + 1;
            const node = createChildNode({}, 'Child', idx);
            if (node) cContainer.appendChild(node);
        }
        while (cContainer.children.length > cCount && cContainer.lastElementChild) {
            cContainer.lastElementChild.remove();
        }
        renumberRepeaters('Child');
        updateDeliveryVisibility();
    }
}

function getRepeatersData() {
    const brothers = Array.from(document.querySelectorAll('#brothers-repeater .sibling-item')).map(node => ({
        age: (node.querySelector('.sibling-age') || { value: '' }).value,
        state: (node.querySelector('.sibling-state') || { value: '' }).value,
        died_age: (node.querySelector('.sibling-died-age') || { value: '' }).value,
        died_year: (node.querySelector('.sibling-died-year') || { value: '' }).value,
        died_cause: (node.querySelector('.sibling-died-cause') || { value: '' }).value
    }));
    const sisters = Array.from(document.querySelectorAll('#sisters-repeater .sibling-item')).map(node => ({
        age: (node.querySelector('.sibling-age') || { value: '' }).value,
        state: (node.querySelector('.sibling-state') || { value: '' }).value,
        died_age: (node.querySelector('.sibling-died-age') || { value: '' }).value,
        died_year: (node.querySelector('.sibling-died-year') || { value: '' }).value,
        died_cause: (node.querySelector('.sibling-died-cause') || { value: '' }).value
    }));
    const children = Array.from(document.querySelectorAll('#children-repeater .child-item')).map(node => ({
        age: (node.querySelector('.child-age') || { value: '' }).value,
        state: (node.querySelector('.child-state') || { value: '' }).value,
        died_age: (node.querySelector('.child-died-age') || { value: '' }).value,
        died_year: (node.querySelector('.child-died-year') || { value: '' }).value,
        died_cause: (node.querySelector('.child-died-cause') || { value: '' }).value
    }));
    return { brothers, sisters, children };
}

function loadRepeatersFromData(data = {}) {
    const bContainer = document.getElementById('brothers-repeater');
    const sContainer = document.getElementById('sisters-repeater');
    const cContainer = document.getElementById('children-repeater');

    if (bContainer) bContainer.innerHTML = '';
    if (sContainer) sContainer.innerHTML = '';
    if (cContainer) cContainer.innerHTML = '';

    if (Array.isArray(data.brothers) && bContainer) {
        data.brothers.forEach((b, i) => {
            const node = createSiblingNode(b, 'Brother', i + 1);
            if (node) bContainer.appendChild(node);
        });
    }
    if (Array.isArray(data.sisters) && sContainer) {
        data.sisters.forEach((s, i) => {
            const node = createSiblingNode(s, 'Sister', i + 1);
            if (node) sContainer.appendChild(node);
        });
    }
    if (Array.isArray(data.children) && cContainer) {
        data.children.forEach((c, i) => {
            const node = createChildNode(c, 'Child', i + 1);
            if (node) cContainer.appendChild(node);
        });
    }

    const numBrothersEl = document.getElementById('num_brothers');
    const numSistersEl = document.getElementById('num_sisters');
    const numChildrenEl = document.getElementById('num_children');

    if (numBrothersEl) numBrothersEl.value = (data.brothers && data.brothers.length) || 0;
    if (numSistersEl) numSistersEl.value = (data.sisters && data.sisters.length) || 0;
    if (numChildrenEl) numChildrenEl.value = (data.children && data.children.length) || 0;

    renumberRepeaters('Brother');
    renumberRepeaters('Sister');
    renumberRepeaters('Child');
    updateDeliveryVisibility();
}

// Correspondence Address Visibility
function updateCorrAddressVisibility() {
    const corrCheckbox = document.getElementById('corr_same_kyc');
    const corrAddressInput = document.getElementById('corr_address');
    const kycAddressInput = document.getElementById('address');

    if (!corrCheckbox) return;

    if (corrCheckbox.checked) {
        // Make correspondence address readonly and copy KYC address value
        if (corrAddressInput) {
            corrAddressInput.readOnly = true;
            corrAddressInput.style.backgroundColor = 'var(--surface-elevated)';
            corrAddressInput.style.opacity = '0.7';
            corrAddressInput.style.cursor = 'not-allowed';
            if (kycAddressInput) {
                corrAddressInput.value = kycAddressInput.value || '';
            }
        }
    } else {
        // Make correspondence address editable
        if (corrAddressInput) {
            corrAddressInput.readOnly = false;
            corrAddressInput.style.backgroundColor = '';
            corrAddressInput.style.opacity = '';
            corrAddressInput.style.cursor = '';
        }
    }
}

// Function to reset visited tabs (used when form is reset)
function resetVisitedTabs() {
    visitedTabs.clear();
    visitedTabs.add(0); // First tab is always visited by default
}

// Expose functions globally
window.currentFormTabIndex = currentFormTabIndex;
window.editingIndex = editingIndex;
window.visitedTabs = visitedTabs;
window.resetVisitedTabs = resetVisitedTabs;
window.stripFormatting = stripFormatting;
window.formatIndianNumber = formatIndianNumber;
window.updateMarriageDependentVisibility = updateMarriageDependentVisibility;
window.updateDatingBackVisibility = updateDatingBackVisibility;
window.updateParentDeathVisibility = updateParentDeathVisibility;
window.updateOperationsVisibility = updateOperationsVisibility;
window.updateDiseasesVisibility = updateDiseasesVisibility;
window.updatePregnancyVisibility = updatePregnancyVisibility;
window.updateDeliveryVisibility = updateDeliveryVisibility;
window.updateCorrAddressVisibility = updateCorrAddressVisibility;
window.initializeFormTabs = initializeFormTabs;
window.updateProgress = updateProgress;
window.showFormTab = showFormTab;
window.navigateFormTab = navigateFormTab;
window.createNomineeNode = createNomineeNode;
window.getNomineesFromRepeater = getNomineesFromRepeater;
window.clearNomineesRepeater = clearNomineesRepeater;
window.loadNomineesIntoRepeater = loadNomineesIntoRepeater;
window.createPreviousPolicyNode = createPreviousPolicyNode;
window.getPreviousPoliciesFromRepeater = getPreviousPoliciesFromRepeater;
window.clearPreviousPoliciesRepeater = clearPreviousPoliciesRepeater;
window.loadPreviousPoliciesIntoRepeater = loadPreviousPoliciesIntoRepeater;
window.createSiblingNode = createSiblingNode;
window.createChildNode = createChildNode;
window.renumberRepeaters = renumberRepeaters;
window.syncRepeatersFromCounts = syncRepeatersFromCounts;
window.getRepeatersData = getRepeatersData;
window.loadRepeatersFromData = loadRepeatersFromData;
window.editRow = editRow;
window.openRowDetails = openRowDetails;

console.log('App module loaded');
