/**
 * Review Module - Handles form summary/review rendering
 * Displays all form data organized by section with validation highlighting
 */

// Helper to reliably get field value
function getVal(id) {
    const el = document.getElementById(id);
    if (!el) return '';
    if (el.type === 'checkbox') return el.checked ? 'Yes' : 'No';
    return el.value;
}

// Helper to check if field is visible
function isVisible(id) {
    const el = document.getElementById(id);
    if (!el) return false;

    // Find the parent tab panel
    const panel = el.closest('.form-tab-panel');
    if (!panel) return true; // Should be in a panel, but if not, assume visible

    // Check internal parents up to panel
    // We only care if a parent *inside* the tab is hidden (e.g. conditional visibility)
    // We do NOT care if the panel itself is hidden (because review tab is active)
    let parent = el.parentElement;
    while (parent && parent !== panel) {
        if (parent.classList.contains('hidden')) return false;
        parent = parent.parentElement;
    }

    return true;
}

/**
 * Render the full review panel
 */
function renderReviewPanel() {
    const container = document.getElementById('review-summary-container');
    if (!container) return;

    container.innerHTML = '';

    // 1. Applicant Details
    renderSection(container, 'Applicant Details', 0, [
        { id: 'name_of_la', label: 'Name of Life Assured' },
        { id: 'proposer', label: 'Proposer Name' },
        { id: 'aadhaar', label: 'Aadhaar' },
        { id: 'ckyc', label: 'CKYC' },
        { id: 'abha', label: 'ABHA' },
        { id: 'pan', label: 'PAN' },
        { id: 'f_name', label: "Father's Name" },
        { id: 'm_name', label: "Mother's Name" },
        { id: 'gender', label: 'Gender' },
        { id: 'is_married', label: 'Is Married' },
        { id: 'spouse', label: "Spouse's Name", conditional: true },
        { id: 'd_marriage', label: 'Date of Marriage', conditional: true }
    ]);

    // 2. Contact & Personal Details
    renderSection(container, 'Contact & Personal Details', 1, [
        { id: 'mobile_adhar', label: 'Mobile (Aadhaar)' },
        { id: 'mobile', label: 'Mobile' },
        { id: 'email', label: 'E-mail' },
        { id: 'whatsapp', label: 'Whatsapp' },
        { id: 'dob', label: 'Date of Birth' },
        { id: 'birth_place', label: 'Birth Place' },
        { id: 'near_lb_age', label: 'Age (Calculated)' },
        { id: 'residential_status', label: 'Residential Status' },
        { id: 'address', label: 'Address as per KYC' },
        { id: 'corr_address', label: 'Correspondence Address', conditional: true } // Logic for same-as-kyc handled by isVisible check
    ]);

    // 3. Education & Qualification
    renderSection(container, 'Education & Qualification', 2, [
        { id: 'education', label: 'Education' },
        { id: 'current_job', label: 'Current Job' },
        { id: 'type_of_duty', label: 'Type of Duty' },
        { id: 'co_name', label: 'Company Name' },
        { id: 'since', label: 'Since' },
        { id: 'total_experience', label: 'Total Experience' },
        { id: 'a_income', label: 'Annual Income' },
        { id: 'ly_income1', label: 'LY Income 1' },
        { id: 'ly_income2', label: 'LY Income 2' },
        { id: 'ly_income3', label: 'LY Income 3' },
        { id: 'husband_occupation', label: 'Husband Occupation', conditional: true },
        { id: 'husband_annual_income', label: 'Husband Annual Income', conditional: true }
    ]);

    // 4. Proposed Plan
    renderSection(container, 'Proposed Plan', 3, [
        { id: 'plan_term', label: 'PLAN / Term' },
        { id: 'ppt', label: 'PPT' },
        { id: 'mode', label: 'Mode' },
        { id: 'sum_assured', label: 'Sum Assured' },
        { id: 'ab_addb', label: 'Accidental Benefit' },
        { id: 'term_rider', label: 'Term Rider' },
        { id: 'premium', label: 'Premium' },
        { id: 'dating_back', label: 'Dating Back' },
        { id: 'dating_back_date', label: 'Dating Back Date', conditional: true },
        { id: 'pwb', label: 'PWB' },
        { id: 'boc_number', label: 'BOC Number' },
        { id: 'boc_date', label: 'BOC Date' },
        { id: 'boc_amt', label: 'BOC Amt' },
        { id: 'doc', label: 'DOC' },
        { id: 'policy_no', label: 'Policy No' }
    ]);

    // 5. Nominee & Appointee
    renderNomineeSection(container);

    // 6. Bank Details
    renderSection(container, 'Bank Details', 5, [
        { id: 'bank_name', label: 'Bank Name' },
        { id: 'ac_type', label: 'A/c Type' },
        { id: 'ac_holder_name', label: "A/c Holder's Name" },
        { id: 'bank_address', label: 'Address' },
        { id: 'ac_no', label: 'A/C No.' },
        { id: 'micr_code', label: 'MICR Code' },
        { id: 'ifsc_code', label: 'IFSC Code' }
    ]);

    // 7. Family & Medical Details (Complex)
    renderMedicalSection(container);

    // 8. Previous Policy Details
    renderPreviousPoliciesSection(container);

    // Update validation summary
    updateReviewValidationSummary();
}

/**
 * Generic function to render a standard section
 */
function renderSection(container, title, tabIndex, fields) {
    const sectionEl = document.createElement('div');
    sectionEl.className = 'review-section';

    // Header
    const header = document.createElement('div');
    header.className = 'review-section-header';
    header.innerHTML = `
        <span>${title}</span>
        <span class="transform transition-transform duration-200">▼</span>
    `;
    header.onclick = () => toggleReviewSection(sectionEl);
    sectionEl.appendChild(header);

    // Content
    const content = document.createElement('div');
    content.className = 'review-section-content mt-3 text-sm'; // Default collapsed (no 'expanded' class)

    let hasVisibleFields = false;

    fields.forEach(f => {
        if (!isVisible(f.id)) return;

        hasVisibleFields = true;
        const val = getVal(f.id);
        const el = document.getElementById(f.id);
        const isMissing = el.hasAttribute('required') && !val;
        const isInvalid = el.classList.contains('border-red-500');

        const row = document.createElement('div');
        row.className = 'review-field-row';
        row.innerHTML = `
            <div class="review-field-label">${f.label}</div>
            <div class="review-field-value ${isMissing ? 'missing' : ''} ${isInvalid ? 'invalid' : ''}">
                ${(val === '' && isMissing) ? 'Required' : (val || '-')}
            </div>
            <div class="text-right">
                <span class="review-edit-link" onclick="editReviewField(${tabIndex}, '${f.id}')">Edit</span>
            </div>
        `;
        content.appendChild(row);
    });

    if (!hasVisibleFields) {
        content.innerHTML = '<div class="text-gray-400 italic">No details required for this section.</div>';
    }

    sectionEl.appendChild(content);
    container.appendChild(sectionEl);
}

/**
 * Render Nominee Section
 */
function renderNomineeSection(container) {
    const sectionEl = document.createElement('div');
    sectionEl.className = 'review-section';

    const header = document.createElement('div');
    header.className = 'review-section-header';
    header.innerHTML = `
        <span>Nominee & Appointee</span>
        <span class="transform transition-transform duration-200">▼</span>
    `;
    header.onclick = () => toggleReviewSection(sectionEl);
    sectionEl.appendChild(header);

    const content = document.createElement('div');
    content.className = 'review-section-content mt-3';

    // Nominees Repeater
    let nominees = [];
    try {
        nominees = window.getNomineesFromRepeater ? window.getNomineesFromRepeater() : [];
    } catch (e) { console.error("Error getting nominees", e); }

    const nomContainer = document.createElement('div');
    nomContainer.className = 'mb-4';
    nomContainer.innerHTML = '<h4 class="font-medium text-gray-800 mb-2 border-b pb-1">Nominees</h4>';

    if (nominees.length === 0) {
        nomContainer.innerHTML += '<div class="text-gray-500 italic p-2">No nominees added</div>';
    } else {
        nominees.forEach((nom, idx) => {
            const nomDiv = document.createElement('div');
            nomDiv.className = 'mb-3 pb-2 border-b border-gray-100 text-sm';
            // Note: keys match getNomineesFromRepeater return values
            nomDiv.innerHTML = `
                <div class="font-medium text-xs text-gray-500 mb-1">Nominee ${idx + 1}</div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div><span class="text-gray-500">Name:</span> <b>${nom.name || '-'}</b></div>
                    <div><span class="text-gray-500">Relation:</span> ${nom.relation || '-'}</div>
                    <div><span class="text-gray-500">Share:</span> ${nom.share || '-'}%</div>
                    <div><span class="text-gray-500">DOB:</span> ${nom.dob || '-'}</div>
                    <div class="sm:col-span-2"><span class="text-gray-500">Aadhaar:</span> ${nom.aadhaar || '-'}</div>
                </div>
            `;
            nomContainer.appendChild(nomDiv);
        });
    }
    // Edit link for nominees
    const nomEdit = document.createElement('div');
    nomEdit.className = 'text-right mt-1';
    nomEdit.innerHTML = `<span class="review-edit-link" onclick="editReviewField(4, 'nominees-repeater')">Edit Nominees</span>`;
    nomContainer.appendChild(nomEdit);

    content.appendChild(nomContainer);

    // Appointee
    const appContainer = document.createElement('div');
    const appFields = [
        { id: 'appointee', label: 'Appointee Name' },
        { id: 'appointee_relation', label: 'Relation' },
        { id: 'appointee_age', label: 'Age' }
    ];

    let hasAppointee = false;
    appFields.forEach(f => {
        if (getVal(f.id)) hasAppointee = true;
    });

    if (hasAppointee || isVisible('appointee')) { // Show if filled or visible
        appContainer.innerHTML = '<h4 class="font-medium text-gray-800 mb-2 border-b pb-1 mt-4">Appointee</h4>';
        appFields.forEach(f => {
            const val = getVal(f.id);
            const row = document.createElement('div');
            row.className = 'review-field-row';
            row.innerHTML = `
                <div class="review-field-label">${f.label}</div>
                <div class="review-field-value">${val || '-'}</div>
                <div class="text-right">
                    <span class="review-edit-link" onclick="editReviewField(4, '${f.id}')">Edit</span>
                </div>
            `;
            appContainer.appendChild(row);
        });
        content.appendChild(appContainer);
    }

    sectionEl.appendChild(content);
    container.appendChild(sectionEl);
}

/**
 * Render Medical Section
 */
function renderMedicalSection(container) {
    const sectionEl = document.createElement('div');
    sectionEl.className = 'review-section';

    const header = document.createElement('div');
    header.className = 'review-section-header';
    header.innerHTML = `
        <span>Family & Medical Details</span>
        <span class="transform transition-transform duration-200">▼</span>
    `;
    header.onclick = () => toggleReviewSection(sectionEl);
    sectionEl.appendChild(header);

    const content = document.createElement('div');
    content.className = 'review-section-content mt-3';

    // Subsections: Father, Mother, Spouse, Siblings, Children, Medical, Pregnancy

    // Helper to render simple subsection
    function renderSub(title, fields, editId) {
        let html = `<h4 class="font-medium text-gray-800 mb-2 border-b pb-1 mt-3 bg-gray-50 p-1 rounded">${title}</h4>`;
        let visibleCount = 0;
        fields.forEach(f => {
            if (!isVisible(f.id)) return;
            visibleCount++;
            const val = getVal(f.id);
            const isMissing = document.getElementById(f.id)?.hasAttribute('required') && !val;
            html += `
                <div class="review-field-row">
                    <div class="review-field-label">${f.label}</div>
                    <div class="review-field-value ${isMissing ? 'missing' : ''}">${(val === '' && isMissing) ? 'Required' : (val || '-')}</div>
                    <div class="text-right"><span class="review-edit-link" onclick="editReviewField(6, '${editId || f.id}')">Edit</span></div>
                </div>
            `;
        });
        if (visibleCount > 0) {
            const div = document.createElement('div');
            div.innerHTML = html;
            content.appendChild(div);
        }
    }

    // Father
    renderSub("Father's Details", [
        { id: 'fam_father_age', label: 'Age' },
        { id: 'fam_father_state', label: 'State of Health' },
        { id: 'fam_father_died_age', label: 'Age at Death' },
        { id: 'fam_father_died_year', label: 'Death Year' },
        { id: 'fam_father_died_cause', label: 'Cause of Death' }
    ], 'fam_father_age');

    // Mother
    renderSub("Mother's Details", [
        { id: 'fam_mother_age', label: 'Age' },
        { id: 'fam_mother_state', label: 'State of Health' },
        { id: 'fam_mother_died_age', label: 'Age at Death' },
        { id: 'fam_mother_died_year', label: 'Death Year' },
        { id: 'fam_mother_died_cause', label: 'Cause of Death' }
    ], 'fam_mother_age');

    // Spouse
    if (isVisible('fam_spouse_age')) { // Only if married
        renderSub("Spouse's Details", [
            { id: 'fam_spouse_age', label: 'Age' },
            { id: 'fam_spouse_state', label: 'State of Health' },
            { id: 'fam_spouse_died_age', label: 'Age at Death' },
            { id: 'fam_spouse_died_year', label: 'Death Year' },
            { id: 'fam_spouse_died_cause', label: 'Cause of Death' }
        ], 'fam_spouse_age');
    }

    // Siblings & Children (Summary)
    const sibDiv = document.createElement('div');
    sibDiv.innerHTML = `<h4 class="font-medium text-gray-800 mb-2 border-b pb-1 mt-3 bg-gray-50 p-1 rounded">Siblings & Children</h4>`;

    // Read counts
    const nBros = getVal('num_brothers') || '0';
    const nSis = getVal('num_sisters') || '0';
    const nChild = getVal('num_children') || '0';

    sibDiv.innerHTML += `
        <div class="review-field-row">
            <div class="review-field-label">Numbers</div>
            <div class="review-field-value">Brothers: ${nBros}, Sisters: ${nSis}, Children: ${nChild}</div>
            <div class="text-right"><span class="review-edit-link" onclick="editReviewField(6, 'num_brothers')">Edit</span></div>
        </div>
    `;

    // Read repeater data directly from DOM since getRepeatersData might be tricky to access/parse
    function extractRepeater(id, labelPrefix) {
        const p = document.getElementById(id);
        if (!p) return '';
        let html = '';
        const items = p.querySelectorAll('.sibling-item, .child-item');
        items.forEach((item, idx) => {
            const ageInput = item.querySelector('.sibling-age, .child-age');
            const stateInput = item.querySelector('.sibling-state, .child-state');

            if (ageInput && stateInput) {
                // Header for the item
                html += `
                    <div class="mt-2 mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">${labelPrefix} ${idx + 1}</div>
                `;

                // Age Row
                const ageVal = ageInput.value || '-';
                html += `
                    <div class="review-field-row">
                        <div class="review-field-label">Age</div>
                        <div class="review-field-value">${ageVal}</div>
                        <div class="text-right"></div>
                    </div>
                `;

                // State Row
                const stateVal = stateInput.value || '-';
                html += `
                    <div class="review-field-row">
                        <div class="review-field-label">State</div>
                        <div class="review-field-value">${stateVal}</div>
                        <div class="text-right"></div>
                    </div>
                `;

                // If dead, show death details
                if (stateVal === 'Dead') {
                    const diedAge = item.querySelector('.sibling-died-age, .child-died-age')?.value || '-';
                    const diedYear = item.querySelector('.sibling-died-year, .child-died-year')?.value || '-';
                    const diedCause = item.querySelector('.sibling-died-cause, .child-died-cause')?.value || '-';

                    html += `
                        <div class="review-field-row">
                            <div class="review-field-label">Age at Death</div>
                            <div class="review-field-value">${diedAge}</div>
                            <div class="text-right"></div>
                        </div>
                        <div class="review-field-row">
                            <div class="review-field-label">Death Year</div>
                            <div class="review-field-value">${diedYear}</div>
                            <div class="text-right"></div>
                        </div>
                        <div class="review-field-row">
                            <div class="review-field-label">Cause of Death</div>
                            <div class="review-field-value">${diedCause}</div>
                            <div class="text-right"></div>
                        </div>
                     `;
                }
            }
        });
        return html;
    }

    if (nBros > 0) sibDiv.innerHTML += extractRepeater('brothers-repeater', 'Brother');
    if (nSis > 0) sibDiv.innerHTML += extractRepeater('sisters-repeater', 'Sister');
    if (nChild > 0) sibDiv.innerHTML += extractRepeater('children-repeater', 'Child');

    content.appendChild(sibDiv);

    // Personal Medical
    renderSub("Medical History", [
        { id: 'height', label: 'Height (Cm)' },
        { id: 'weight', label: 'Weight (Kg)' },
        { id: 'abd', label: 'Abd (Cm)' },
        { id: 'any_operations', label: 'Any Operations?' },
        { id: 'operation_details', label: 'Operation Details' },
        { id: 'any_diseases', label: 'Any Diseases?' },
        { id: 'disease_details', label: 'Disease Details' }
    ], 'height');

    // Pregnancy
    if (isVisible('are_pregnant')) {
        renderSub("Pregnancy Details", [
            { id: 'are_pregnant', label: 'Are pregnant?' },
            { id: 'last_delivery_date', label: 'Date of last delivery' }
        ], 'are_pregnant');
    }

    sectionEl.appendChild(content);
    container.appendChild(sectionEl);
}

/**
 * Render Previous Policies
 */
function renderPreviousPoliciesSection(container) {
    const sectionEl = document.createElement('div');
    sectionEl.className = 'review-section';

    const header = document.createElement('div');
    header.className = 'review-section-header';
    header.innerHTML = `
        <span>Previous Policy Details</span>
        <span class="transform transition-transform duration-200">▼</span>
    `;
    header.onclick = () => toggleReviewSection(sectionEl);
    sectionEl.appendChild(header);

    const content = document.createElement('div');
    content.className = 'review-section-content mt-3';

    let policies = [];
    try {
        policies = window.getPreviousPoliciesFromRepeater ? window.getPreviousPoliciesFromRepeater() : [];
    } catch (e) { console.error("Error getting policies", e); } // fall back to manual extraction if needed

    // Manual extraction fallback if the global function isn't found
    if (!window.getPreviousPoliciesFromRepeater) {
        const pContainer = document.getElementById('previous-policies-repeater');
        if (pContainer) {
            pContainer.querySelectorAll('.previous-policy-item').forEach(item => {
                policies.push({
                    prev_policy_no: item.querySelector('.prev-policy-no')?.value,
                    prev_sa: item.querySelector('.prev-sa')?.value,
                    prev_plan_term: item.querySelector('.prev-plan-term')?.value
                });
            });
        }
    }

    if (policies.length === 0) {
        content.innerHTML = `
            <div class="text-gray-500 italic p-2">No previous policies</div>
            <div class="text-right mt-2">
                <span class="review-edit-link" onclick="editReviewField(7, 'previous-policies-repeater')">Add Previous Policy</span>
            </div>
        `;
    } else {
        content.innerHTML = `<div class="mb-2 text-sm font-medium text-gray-700">${policies.length} previous policy(ies)</div>`;
        policies.forEach((pol, idx) => {
            const row = document.createElement('div');
            row.className = 'mb-2 pb-2 border-b border-gray-100 text-sm';
            row.innerHTML = `
                <div class="font-medium text-xs text-gray-500 mb-1">Policy ${idx + 1}</div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div><span class="text-gray-500">Pol No:</span> ${pol.prev_policy_no || '-'}</div>
                    <div><span class="text-gray-500">Sum Assured:</span> ${pol.prev_sa || '-'}</div>
                    <div><span class="text-gray-500">Plan:</span> ${pol.prev_plan_term || '-'}</div>
                </div>
             `;
            content.appendChild(row);
        });

        const editLink = document.createElement('div');
        editLink.className = 'text-right mt-2';
        editLink.innerHTML = `<span class="review-edit-link" onclick="editReviewField(7, 'previous-policies-repeater')">Edit Policies</span>`;
        content.appendChild(editLink);
    }

    sectionEl.appendChild(content);
    container.appendChild(sectionEl);
}

/**
 * Toggle section collapse/expand with exclusive behavior (accordion)
 */
function toggleReviewSection(sectionEl) {
    const content = sectionEl.querySelector('.review-section-content');
    const arrow = sectionEl.querySelector('.review-section-header span:last-child');

    // If it's currently expanded (has 'expanded' class), then close it
    if (content.classList.contains('expanded')) {
        content.classList.remove('expanded');
        content.style.maxHeight = '0';
        arrow.style.transform = 'rotate(0deg)';
        return;
    }

    // Otherwise, we are opening. First close ALL others
    document.querySelectorAll('.review-section').forEach(sec => {
        const c = sec.querySelector('.review-section-content');
        const a = sec.querySelector('.review-section-header span:last-child');
        if (c.classList.contains('expanded')) {
            c.classList.remove('expanded');
            c.style.maxHeight = '0';
            if (a) a.style.transform = 'rotate(0deg)';
        }
    });

    // Now open this one
    content.classList.add('expanded');
    content.style.maxHeight = content.scrollHeight + 'px';
    arrow.style.transform = 'rotate(180deg)';

    // Scroll into view if needed, but wait for animation slightly
    setTimeout(() => {
        // Recalculate max-height in case content loaded asynchronously or layout shifted,
        // though typically synchronous here.
        // Also handling if content is large, don't clip.
        // Actually for dynamic content, setting a large max-height is risky if content grows.
        // But for review panel static content, scrollHeight is fine.
        // For 'auto' height animation we can't easily do it, so max-height is the standard trick.
        // Or transitioning grid-template-rows.
        // But scrollHeight is good.
    }, 10);

    sectionEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Navigate to a specific field for editing
 */
function editReviewField(tabIndex, fieldId) {
    if (window.showFormTab) {
        window.showFormTab(tabIndex);
    }

    setTimeout(() => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.scrollIntoView({ behavior: 'smooth', block: 'center' });
            field.focus();
            field.classList.add('ring-2', 'ring-blue-500');
            setTimeout(() => field.classList.remove('ring-2', 'ring-blue-500'), 2000);
        }
    }, 300);
}

/**
 * Update validation summary in review tab
 */
function updateReviewValidationSummary() {
    const container = document.getElementById('review-validation-summary');
    if (!container) return;

    const formTabPanels = document.querySelectorAll('.form-tab-panel');
    let errors = [];
    const totalTabs = formTabPanels.length - 1;

    for (let i = 0; i < totalTabs; i++) {
        const panel = formTabPanels[i];
        const tabName = panel.getAttribute('data-tab-name');

        const requiredInputs = panel.querySelectorAll('input[required], select[required], textarea[required]');
        let missingCount = 0;

        requiredInputs.forEach(input => {
            if (input.closest('.hidden') && !input.closest('.form-tab-panel.hidden')) return;
            if (!input.value.trim()) missingCount++;
        });

        if (missingCount > 0) {
            errors.push(`${tabName}: ${missingCount} required field(s) missing`);
        }
    }

    if (errors.length > 0) {
        container.innerHTML = `
            <div class="review-validation-summary">
                <h4 class="font-bold text-red-700 mb-2">Please fix the following issues before submitting:</h4>
                ${errors.map(err => `<div class="review-validation-item text-red-600">⚠️ ${err}</div>`).join('')}
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center">
                <span class="text-xl mr-2">✅</span>
                <span class="font-medium">All details look good! You can submit the form.</span>
            </div>
        `;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        renderReviewPanel,
        editReviewField
    };
}
