// ============================================================================
// REPLACEMENT SCRIPT FOR DATA FORM-1.HTML
// This should replace the entire <script> section (lines ~760-2789)
// ============================================================================
// The modules handle all the heavy lifting. This script just initializes everything.

// Wait for modules to load before initializing
window.addEventListener('modulesLoaded', function () {
    console.log('Modules loaded, initializing application...');

    // Initialize form tabs
    window.initializeFormTabs();

    // Disable HTML5 validation to use custom validation
    const formEl = document.getElementById('data-form');
    if (formEl) formEl.noValidate = true;

    // Update progress indicator when any required field changes (real-time feedback)
    if (formEl) {
        formEl.addEventListener('input', function (event) {
            // Only update progress for required fields to avoid performance issues
            const target = event.target;
            if (target.hasAttribute('required') || target.tagName === 'SELECT') {
                // Debounce the update
                if (window._progressUpdateTimeout) {
                    clearTimeout(window._progressUpdateTimeout);
                }
                window._progressUpdateTimeout = setTimeout(() => {
                    window.updateProgress();
                }, 150);
            }
        });

        // Also update on change events (for select dropdowns)
        formEl.addEventListener('change', function (event) {
            const target = event.target;
            if (target.hasAttribute('required') || target.tagName === 'SELECT') {
                setTimeout(() => {
                    window.updateProgress();
                }, 50);
            }
        });
    }

    // Prevent Enter key from submitting the form, make it navigate tabs instead
    if (formEl) {
        formEl.addEventListener('keydown', function (event) {
            // Check if Enter key was pressed
            if (event.key === 'Enter' && event.target.tagName !== 'TEXTAREA') {
                event.preventDefault();

                // Get current tab index
                const currentTab = window.currentFormTabIndex;
                const formTabPanels = document.querySelectorAll('.form-tab-panel');
                const totalTabs = formTabPanels.length;

                // If on last tab, trigger submit
                if (currentTab === totalTabs - 1) {
                    const submitBtn = document.querySelector('button[type="submit"]');
                    if (submitBtn) submitBtn.click();
                } else {
                    // Otherwise, go to next tab
                    window.navigateFormTab(1);
                }
            }
        });
    }

    // Set up main form submit handler
    if (formEl) {
        formEl.addEventListener('submit', async function (event) {
            event.preventDefault();

            // Validate all tabs
            const formTabPanels = document.querySelectorAll('.form-tab-panel');
            const validation = window.validateAllTabs(formTabPanels);

            if (validation.isValid) {
                // Sanitize income fields
                ['a_income', 'ly_income1', 'ly_income2', 'ly_income3', 'husband_annual_income'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) {
                        const raw = window.stripFormatting(el.value);
                        el.value = raw;
                    }
                });

                const formData = new FormData(this);

                // Handle checkbox
                try {
                    const corrCheckboxEl = document.getElementById('corr_same_kyc');
                    if (corrCheckboxEl) formData.set('corr_same_kyc', corrCheckboxEl.checked ? 'true' : 'false');
                } catch (e) { /* ignore */ }

                const entry = {};
                window.CSV_HEADERS.forEach(header => entry[header] = formData.get(header));

                // Collect repeaters
                try {
                    entry.nominees = window.getNomineesFromRepeater();
                } catch (e) { entry.nominees = []; }

                try {
                    entry.previous_policies = window.getPreviousPoliciesFromRepeater();
                } catch (e) { entry.previous_policies = []; }

                try {
                    const repData = window.getRepeatersData();
                    entry.fam_brothers = repData.brothers;
                    entry.fam_sisters = repData.sisters;
                    entry.fam_children = repData.children;
                } catch (e) {
                    entry.fam_brothers = [];
                    entry.fam_sisters = [];
                    entry.fam_children = [];
                }

                const allData = await window.getStoredData();
                if (window.editingIndex !== null && window.editingIndex >= 0 && window.editingIndex < allData.length) {
                    allData[window.editingIndex] = entry;
                } else {
                    allData.push(entry);
                }
                await window.saveData(allData);
                window.editingIndex = null;
                this.reset();

                // Reset visited tabs for new entry
                if (window.resetVisitedTabs) {
                    window.resetVisitedTabs();
                }

                alert('Data saved successfully!');
                window.showMainTab('data-view');
            } else {
                alert('Please fill all mandatory fields before submitting.');
                if (validation.firstInvalidTab !== null) {
                    window.showFormTab(validation.firstInvalidTab);
                    if (validation.firstInvalidInput) {
                        setTimeout(() => {
                            validation.firstInvalidInput.focus();
                            validation.firstInvalidInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 100);
                    }
                }
            }
        });
    }

    // Set up other event listeners
    const clearBtn = document.getElementById('clear-data');
    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            if (window.clearAllData()) {
                window.renderDataTable();
                alert('All data has been cleared.');
            }
        });
    }

    const copyBtn = document.getElementById('copy-button');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const content = document.getElementById('modal-body').innerText;
            navigator.clipboard.writeText(content).then(() => {
                alert('Copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy text: ', err);
                alert('Failed to copy text. Please copy it manually.');
            });
        });
    }

    // Add nominee button
    const addNomBtn = document.getElementById('add-nominee');
    if (addNomBtn) {
        addNomBtn.addEventListener('click', () => {
            const container = document.getElementById('nominees-repeater');
            if (!container) return;
            container.appendChild(window.createNomineeNode());
        });
    }
    window.clearNomineesRepeater();

    // DOB -> Age
    const dobInput = document.getElementById('dob');
    if (dobInput) {
        dobInput.addEventListener('change', (e) => window.updateAgeFieldFromDOB(e.target.value));
        dobInput.addEventListener('input', (e) => window.updateAgeFieldFromDOB(e.target.value));
        if (dobInput.value) window.updateAgeFieldFromDOB(dobInput.value);
    }

    // Search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', window.filterDataTable);
    }

    // Income formatting
    ['a_income', 'ly_income1', 'ly_income2', 'ly_income3', 'husband_annual_income'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('blur', (e) => {
            const raw = window.stripFormatting(e.target.value);
            e.target.value = raw ? window.formatIndianNumber(raw) : '';
        });
        el.addEventListener('focus', (e) => {
            const raw = window.stripFormatting(e.target.value);
            e.target.value = raw;
            try { e.target.select(); } catch (err) { /* ignore */ }
        });
        el.addEventListener('input', (e) => {
            const cleaned = e.target.value.replace(/[^0-9.-]/g, '');
            if (cleaned !== e.target.value) e.target.value = cleaned;
        });
        if (el.value) {
            el.value = window.formatIndianNumber(window.stripFormatting(el.value));
        }
    });

    // Aadhaar formatting (split into 3 groups: XXXX XXXX XXXX or XXXX-XXXX-XXXX)
    const aadhaarInput = document.getElementById('aadhaar');
    if (aadhaarInput) {
        aadhaarInput.addEventListener('input', function (e) {
            // Get only digits from the input
            let value = e.target.value.replace(/[^0-9]/g, '');

            // Limit to 12 digits
            if (value.length > 12) {
                value = value.substring(0, 12);
            }

            // Format as XXXX XXXX XXXX
            let formatted = '';
            for (let i = 0; i < value.length; i++) {
                if (i > 0 && i % 4 === 0) {
                    formatted += ' ';
                }
                formatted += value[i];
            }

            e.target.value = formatted;
        });

        // Clean up on blur - normalize to space-separated format
        aadhaarInput.addEventListener('blur', function (e) {
            // Replace dashes with spaces for consistency
            let value = e.target.value.replace(/-/g, ' ');
            // Remove extra whitespace
            value = value.replace(/\s+/g, ' ').trim();
            e.target.value = value;
        });

        // Format existing value if present
        if (aadhaarInput.value) {
            let value = aadhaarInput.value.replace(/[^0-9]/g, '');
            if (value.length === 12) {
                aadhaarInput.value = value.substring(0, 4) + ' ' + value.substring(4, 8) + ' ' + value.substring(8, 12);
            }
        }
    }

    // Is Married visibility
    const isMarriedEl = document.getElementById('is_married');
    if (isMarriedEl) {
        isMarriedEl.addEventListener('change', (e) => window.updateMarriageDependentVisibility(e.target.value));
        if (isMarriedEl.value) window.updateMarriageDependentVisibility(isMarriedEl.value);
    }

    // Gender visibility
    const genderEl = document.getElementById('gender');
    if (genderEl) {
        genderEl.addEventListener('change', (e) => window.updatePregnancyVisibility(e.target.value));
        if (genderEl.value) window.updatePregnancyVisibility(genderEl.value);
    }

    // Family state visibility
    const mapRoles = [
        { id: 'fam_father_state', role: 'father' },
        { id: 'fam_mother_state', role: 'mother' },
        { id: 'fam_spouse_state', role: 'spouse' }
    ];
    mapRoles.forEach(m => {
        const el = document.getElementById(m.id);
        if (!el) return;
        el.addEventListener('change', (e) => window.updateParentDeathVisibility(m.role, e.target.value));
        if (el.value) window.updateParentDeathVisibility(m.role, el.value);
    });

    // Dating Back visibility
    const datingBackEl = document.getElementById('dating_back');
    if (datingBackEl) {
        datingBackEl.addEventListener('change', (e) => window.updateDatingBackVisibility(e.target.value));
        if (datingBackEl.value) window.updateDatingBackVisibility(datingBackEl.value);
    }

    // Operations visibility
    const anyOpsEl = document.getElementById('any_operations');
    if (anyOpsEl) {
        anyOpsEl.addEventListener('change', (e) => window.updateOperationsVisibility(e.target.value));
        if (anyOpsEl.value) window.updateOperationsVisibility(anyOpsEl.value);
    }

    // Diseases visibility
    const anyDisEl = document.getElementById('any_diseases');
    if (anyDisEl) {
        anyDisEl.addEventListener('change', (e) => window.updateDiseasesVisibility(e.target.value));
        if (anyDisEl.value) window.updateDiseasesVisibility(anyDisEl.value);
    }

    // Export/Import buttons
    const exportBtn = document.getElementById('export-json');
    if (exportBtn) {
        exportBtn.addEventListener('click', window.exportDataAsJSON);
    }

    const importInput = document.getElementById('import-json');
    if (importInput) {
        importInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                window.importDataFromJSON(file);
                e.target.value = '';
            }
        });
    }

    // Add Previous Policy button
    const addPrevPolicyBtn = document.getElementById('add-previous-policy');
    if (addPrevPolicyBtn) {
        addPrevPolicyBtn.addEventListener('click', () => {
            const container = document.getElementById('previous-policies-repeater');
            if (!container) return;
            const node = window.createPreviousPolicyNode();
            if (node) container.appendChild(node);
        });
    }

    // Siblings/Children count inputs
    const numBrothersEl = document.getElementById('num_brothers');
    const numSistersEl = document.getElementById('num_sisters');
    const numChildrenEl = document.getElementById('num_children');

    if (numBrothersEl) {
        numBrothersEl.addEventListener('change', window.syncRepeatersFromCounts);
    }
    if (numSistersEl) {
        numSistersEl.addEventListener('change', window.syncRepeatersFromCounts);
    }
    if (numChildrenEl) {
        numChildrenEl.addEventListener('change', window.syncRepeatersFromCounts);
    }

    // Correspondence address checkbox
    const corrCheckbox = document.getElementById('corr_same_kyc');
    const kycAddressInput = document.getElementById('address');
    const corrAddressInput = document.getElementById('corr_address');

    if (corrCheckbox) {
        corrCheckbox.addEventListener('change', window.updateCorrAddressVisibility);
        if (kycAddressInput && corrAddressInput) {
            kycAddressInput.addEventListener('input', () => {
                if (corrCheckbox.checked && corrAddressInput) {
                    corrAddressInput.value = kycAddressInput.value || '';
                }
            });
        }
        window.updateCorrAddressVisibility();
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (document.getElementById('form-view').classList.contains('hidden')) return;
        if (e.key === 'ArrowLeft' && e.ctrlKey) {
            e.preventDefault();
            window.navigateFormTab(-1);
        } else if (e.key === 'ArrowRight' && e.ctrlKey) {
            e.preventDefault();
            window.navigateFormTab(1);
        }
    });

    // ========================================================================
    // PREVENT FUTURE DATES ON ALL DATE INPUTS
    // ========================================================================
    function setMaxDateToToday() {
        const today = new Date().toISOString().split('T')[0];
        document.querySelectorAll('input[type="date"]').forEach(input => {
            input.setAttribute('max', today);
        });
    }
    setMaxDateToToday();

    // Observer for dynamically created date inputs (e.g., nominee DOB in repeaters)
    const dateObserver = new MutationObserver((mutations) => {
        const today = new Date().toISOString().split('T')[0];
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) {
                    // Check if the added node itself is a date input
                    if (node.matches && node.matches('input[type="date"]')) {
                        node.setAttribute('max', today);
                    }
                    // Check for date inputs within the added node
                    if (node.querySelectorAll) {
                        node.querySelectorAll('input[type="date"]').forEach(input => {
                            input.setAttribute('max', today);
                        });
                    }
                }
            });
        });
    });
    dateObserver.observe(document.body, { childList: true, subtree: true });

    console.log('Application initialized successfully');
});
