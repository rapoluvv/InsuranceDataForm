/**
 * Validation Module - Handles all validation logic
 * Validates fields, Aadhaar, PAN, age calculations, nominee shares
 */

/**
 * Calculate age from date of birth
 * @param {string} dobString - Date of birth in ISO format
 * @returns {Object|null} Age object with years, months, days or null if invalid
 */
function calculateAgeFromDOB(dobString) {
    if (!dobString) return null;
    const dob = new Date(dobString);
    if (isNaN(dob)) return null;
    const now = new Date();
    const y1 = dob.getFullYear(), m1 = dob.getMonth(), d1 = dob.getDate();
    const y2 = now.getFullYear(), m2 = now.getMonth(), d2 = now.getDate();

    let years = y2 - y1;
    let months = m2 - m1;
    let days = d2 - d1;

    if (days < 0) {
        const prevMonth = new Date(y2, m2, 0);
        days += prevMonth.getDate();
        months -= 1;
    }
    if (months < 0) {
        months += 12;
        years -= 1;
    }
    if (years < 0) return null;
    return { years, months, days };
}

/**
 * Format age object to readable string
 * @param {Object} ageObj - Age object with years, months, days
 * @returns {string} Formatted age string
 */
function formatAgeObject(ageObj) {
    if (!ageObj) return '';
    const parts = [];
    if (typeof ageObj.years === 'number') parts.push(`${ageObj.years} Year${ageObj.years !== 1 ? 's' : ''}`);
    if (typeof ageObj.months === 'number') parts.push(`${ageObj.months} Month${ageObj.months !== 1 ? 's' : ''}`);
    if (typeof ageObj.days === 'number') parts.push(`${ageObj.days} Day${ageObj.days !== 1 ? 's' : ''}`);
    return parts.join(', ');
}

/**
 * Update age field from DOB input
 * @param {string} dobValue - Date of birth value
 */
function updateAgeFieldFromDOB(dobValue) {
    const ageStr = formatAgeObject(calculateAgeFromDOB(dobValue));
    const ageEl = document.getElementById('near_lb_age');
    if (ageEl) ageEl.value = ageStr || '';
}

/**
 * Determine the validation message for a single field if invalid
 * @param {HTMLElement} field - Form control element to validate
 * @returns {string} The validation message or an empty string when the field is valid
 */
function getFieldValidationMessage(field) {
    if (!field) return '';
    const rawValue = field.value || '';
    const trimmedValue = rawValue.trim();
    if (field.required && trimmedValue === '') {
        return 'This field is required.';
    }
    const type = String(field.type || '').toLowerCase();
    if (type === 'email' && rawValue && !validateEmail(rawValue)) {
        return 'Please enter a valid email address.';
    }
    if (type === 'tel' && rawValue && field.pattern) {
        try {
            if (!new RegExp(field.pattern).test(rawValue)) {
                return field.title || 'Please enter a valid number.';
            }
        } catch (e) {
            // Malformed pattern should not crash validation
        }
    }
    if (type === 'number' && field.min !== '' && trimmedValue !== '' && parseFloat(rawValue) < parseFloat(field.min)) {
        return `Value cannot be less than ${field.min}.`;
    }
    if (field.id === 'aadhaar' && rawValue && !validateAadhaar(rawValue)) {
        return 'Aadhaar must be exactly 12 digits (e.g., 1234 2345 3456).';
    }
    if (field.id === 'pan' && rawValue && !validatePAN(rawValue)) {
        return 'PAN must be in format: AAAAA9999A (5 letters, 4 digits, 1 letter).';
    }
    return '';
}

/**
 * Validate Aadhaar number (must be 12 digits, can be formatted with spaces or dashes)
 * @param {string} aadhaar - Aadhaar number to validate
 * @returns {boolean} True if valid
 */
function validateAadhaar(aadhaar) {
    if (!aadhaar) return true; // Optional field
    // Remove spaces and dashes to get just the digits
    const digits = aadhaar.replace(/[\s-]/g, '');
    return /^\d{12}$/.test(digits);
}

/**
 * Validate PAN number (format: AAAAA9999A)
 * @param {string} pan - PAN number to validate
 * @returns {boolean} True if valid
 */
function validatePAN(pan) {
    if (!pan) return true; // Optional field
    return /^[A-Z]{5}\d{4}[A-Z]$/.test(pan);
}

/**
 * Validate email address
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid
 */
function validateEmail(email) {
    if (!email) return true; // Optional field
    return /^\S+@\S+\.\S+$/.test(email);
}

/**
 * Validate mobile number (10 digits)
 * @param {string} mobile - Mobile number to validate
 * @returns {boolean} True if valid
 */
function validateMobile(mobile) {
    if (!mobile) return true; // Check required separately
    return /^\d{10}$/.test(mobile);
}

/**
 * Validate that nominee shares add up to 100%
 * @returns {boolean} True if valid
 */
function validateNomineeShares() {
    const errEl = document.getElementById('nominee-error');
    if (!errEl) return true;

    // Get nominees from repeater if getNomineesFromRepeater is available
    const nominees = (typeof window.getNomineesFromRepeater === 'function')
        ? window.getNomineesFromRepeater()
        : [];

    if (nominees.length === 0) {
        errEl.textContent = '';
        return true;
    }

    const sum = nominees.reduce((s, n) => s + (parseFloat(n.share) || 0), 0);
    if (Math.abs(sum - 100) > 0.001) {
        errEl.textContent = `Total nominee shares must equal 100%. Current total: ${sum}%`;
        return false;
    }
    errEl.textContent = '';
    return true;
}

/**
 * Validate a single form tab
 * @param {number} tabIndex - Index of the tab to validate
 * @param {NodeList} formTabPanels - All form tab panels
 * @returns {boolean} True if valid
 */
function validateTab(tabIndex, formTabPanels) {
    let isValid = true;
    const panel = formTabPanels[tabIndex];
    panel.querySelectorAll('.error-message').forEach(err => err.textContent = '');

    const inputs = panel.querySelectorAll('input[required], select[required], input[type="email"], input[type="tel"], input[min]');
    inputs.forEach(input => {
        const errorMessage = getFieldValidationMessage(input);
        if (errorMessage) {
            isValid = false;
            const errorSpan = input.parentElement.querySelector('.error-message');
            if (errorSpan) errorSpan.textContent = errorMessage;
        }
    });
    return isValid;
}

/**
 * Validate all form tabs
 * @param {NodeList} formTabPanels - All form tab panels
 * @returns {Object} Validation result with isValid flag and first invalid details
 */
function validateAllTabs(formTabPanels) {
    let allTabsValid = true;
    let firstInvalidInput = null;
    let firstInvalidTab = null;

    for (let i = 0; i < formTabPanels.length; i++) {
        const panel = formTabPanels[i];
        panel.querySelectorAll('.error-message').forEach(err => err.textContent = '');
        const inputs = panel.querySelectorAll('input[required], select[required], input[type="email"], input[type="tel"], input[min]');
        inputs.forEach(input => {
            const errorMessage = getFieldValidationMessage(input);
            if (errorMessage) {
                allTabsValid = false;
                const errorSpan = input.parentElement.querySelector('.error-message');
                if (errorSpan) errorSpan.textContent = errorMessage;
                if (!firstInvalidInput) {
                    firstInvalidInput = input;
                    firstInvalidTab = i;
                }
            }
        });
    }

    const nomineeSharesValid = validateNomineeShares();
    if (!nomineeSharesValid) {
        allTabsValid = false;
    }

    return {
        isValid: allTabsValid,
        firstInvalidInput,
        firstInvalidTab
    };
}

// Browser-compatible exports
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateAgeFromDOB,
        formatAgeObject,
        updateAgeFieldFromDOB,
        validateAadhaar,
        validatePAN,
        validateEmail,
        validateMobile,
        validateNomineeShares,
        validateTab,
        validateAllTabs,
        getFieldValidationMessage
    };
} else {
    window.ValidationModule = {
        calculateAgeFromDOB,
        formatAgeObject,
        updateAgeFieldFromDOB,
        validateAadhaar,
        validatePAN,
        validateEmail,
        validateMobile,
        validateNomineeShares,
        validateTab,
        validateAllTabs,
        getFieldValidationMessage
    };
}
