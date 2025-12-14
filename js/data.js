/**
 * Data Module - Handles all data management operations
 * Manages localStorage operations, export/import functionality with encryption
 * 
 * SECURITY IMPLEMENTATION (SEC-002): Client-side encryption using Web Crypto API
 * Sensitive fields are encrypted before storage and decrypted on retrieval:
 * - Aadhaar numbers (PII)
 * - PAN numbers (financial)
 * - Bank account details (financial)
 * - Nominee Aadhaar numbers
 * 
 * Encryption method: AES-GCM with 256-bit key derived from password using PBKDF2
 * Note: Encryption key is derived from a default password. For production, consider
 * user-specific passwords or secure key management.
 */

// Sensitive fields that require encryption
const SENSITIVE_FIELDS = ['aadhaar', 'pan', 'ac_no', 'nominee_aadhaar', 'ifsc_code', 'micr_code'];

// Default encryption password (in production, this should be user-provided or securely managed)
const DEFAULT_ENCRYPTION_PASSWORD = 'InsuranceFormSecureKey2024!@#';

/**
 * Derive encryption key from password using PBKDF2
 * @param {string} password - Password to derive key from
 * @param {Uint8Array} salt - Salt for key derivation
 * @returns {Promise<CryptoKey>} Derived encryption key
 */
async function deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
    );

    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypt a string value using AES-GCM
 * @param {string} text - Text to encrypt
 * @param {string} password - Password for encryption
 * @returns {Promise<string>} Encrypted text as base64 string with format: salt.iv.ciphertext
 */
async function encryptValue(text, password = DEFAULT_ENCRYPTION_PASSWORD) {
    if (!text || text === '') return text;

    try {
        const encoder = new TextEncoder();
        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const key = await deriveKey(password, salt);

        const encrypted = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            encoder.encode(text)
        );

        // Combine salt, iv, and encrypted data
        const encryptedArray = new Uint8Array(encrypted);
        const combined = new Uint8Array(salt.length + iv.length + encryptedArray.length);
        combined.set(salt, 0);
        combined.set(iv, salt.length);
        combined.set(encryptedArray, salt.length + iv.length);

        // Convert to base64
        return btoa(String.fromCharCode(...combined));
    } catch (e) {
        console.error('Encryption failed:', e);
        return text; // Fallback to unencrypted if encryption fails
    }
}

/**
 * Decrypt a string value using AES-GCM
 * @param {string} encryptedText - Encrypted text as base64 string
 * @param {string} password - Password for decryption
 * @returns {Promise<string>} Decrypted text
 */
async function decryptValue(encryptedText, password = DEFAULT_ENCRYPTION_PASSWORD) {
    if (!encryptedText || encryptedText === '') return encryptedText;

    try {
        // Convert from base64
        const combined = new Uint8Array(
            atob(encryptedText).split('').map(char => char.charCodeAt(0))
        );

        // Extract salt, iv, and encrypted data
        const salt = combined.slice(0, 16);
        const iv = combined.slice(16, 28);
        const encrypted = combined.slice(28);

        const key = await deriveKey(password, salt);

        const decrypted = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            encrypted
        );

        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    } catch (e) {
        console.error('Decryption failed:', e);
        return encryptedText; // Fallback to returning as-is if decryption fails (might be unencrypted old data)
    }
}

/**
 * Encrypt sensitive fields in a data object
 * @param {Object} dataObj - Data object to encrypt
 * @returns {Promise<Object>} Data object with encrypted sensitive fields
 */
async function encryptSensitiveFields(dataObj) {
    const encrypted = { ...dataObj };

    for (const field of SENSITIVE_FIELDS) {
        if (encrypted[field]) {
            encrypted[field] = await encryptValue(String(encrypted[field]));
        }
    }

    // Encrypt sensitive fields in nested arrays
    if (Array.isArray(encrypted.nominees)) {
        encrypted.nominees = await Promise.all(encrypted.nominees.map(async (nominee) => {
            if (nominee.aadhaar || nominee.nominee_aadhaar) {
                return {
                    ...nominee,
                    aadhaar: nominee.aadhaar ? await encryptValue(String(nominee.aadhaar)) : nominee.aadhaar,
                    nominee_aadhaar: nominee.nominee_aadhaar ? await encryptValue(String(nominee.nominee_aadhaar)) : nominee.nominee_aadhaar
                };
            }
            return nominee;
        }));
    }

    return encrypted;
}

/**
 * Decrypt sensitive fields in a data object
 * @param {Object} dataObj - Data object to decrypt
 * @returns {Promise<Object>} Data object with decrypted sensitive fields
 */
async function decryptSensitiveFields(dataObj) {
    const decrypted = { ...dataObj };

    for (const field of SENSITIVE_FIELDS) {
        if (decrypted[field]) {
            decrypted[field] = await decryptValue(String(decrypted[field]));
        }
    }

    // Decrypt sensitive fields in nested arrays
    if (Array.isArray(decrypted.nominees)) {
        decrypted.nominees = await Promise.all(decrypted.nominees.map(async (nominee) => {
            if (nominee.aadhaar || nominee.nominee_aadhaar) {
                return {
                    ...nominee,
                    aadhaar: nominee.aadhaar ? await decryptValue(String(nominee.aadhaar)) : nominee.aadhaar,
                    nominee_aadhaar: nominee.nominee_aadhaar ? await decryptValue(String(nominee.nominee_aadhaar)) : nominee.nominee_aadhaar
                };
            }
            return nominee;
        }));
    }

    return decrypted;
}

// CSV Headers constant - defines all fields in the data model
const CSV_HEADERS = [
    'name_of_la', 'proposer', 'aadhaar', 'pan', 'ckyc', 'abha', 'f_name', 'm_name', 'gender', 'is_married', 'spouse', 'd_marriage', 'mobile_adhar', 'mobile',
    'whatsapp', 'email', 'dob', 'birth_place', 'near_lb_age', 'residential_status',
    'corr_same_kyc', 'corr_address', 'address', 'bank_name', 'ac_type', 'ac_holder_name', 'bank_address', 'ac_no',
    'micr_code', 'ifsc_code', 'nominee_aadhaar', 'nominee', 'nominee_age', 'nominee_relation', 'appointee', 'appointee_relation', 'appointee_age',
    'plan_term', 'ppt', 'mode', 'sum_assured', 'ab_addb', 'term_rider', 'premium',
    'dating_back', 'dating_back_date', 'pwb', 'boc_number', 'boc_date', 'boc_amt', 'doc', 'policy_no', 'current_job',
    'type_of_duty', 'co_name', 'since', 'education', 'a_income', 'husband_occupation', 'husband_annual_income',
    'total_experience', 'ly_income1', 'ly_income2', 'ly_income3', 'prev_policy_no', 'prev_branch', 'prev_plan_term', 'prev_sa',
    'prev_y_premium', 'prev_ab_addb', 'prev_doc', 'prev_or', 'prev_m_nm', 'prev_inforce', 'fam_father_age', 'fam_father_state', 'fam_father_died_age',
    'fam_father_died_year', 'fam_father_died_cause', 'fam_mother_age', 'fam_mother_state',
    'fam_mother_died_age', 'fam_mother_died_year', 'fam_mother_died_cause', 'fam_spouse_age', 'fam_spouse_state', 'fam_spouse_died_age', 'fam_spouse_died_year', 'fam_spouse_died_cause',
    'fam_brother_age', 'fam_brother_state', 'fam_brother_died_age', 'fam_brother_died_year', 'fam_brother_died_cause',
    'fam_sister_age', 'fam_sister_state', 'fam_sister_died_age', 'fam_sister_died_year', 'fam_sister_died_cause',
    'fam_child_age', 'fam_child_state', 'fam_child_died_age', 'fam_child_died_year', 'fam_child_died_cause',
    'fam_brothers', 'fam_sisters', 'fam_children', 'height', 'weight', 'abd', 'any_operations', 'operation_details',
    'any_diseases', 'disease_details', 'are_pregnant', 'last_delivery_date', 'nominees', 'previous_policies'
];

/**
 * Retrieve stored data from localStorage with decryption
 * @returns {Promise<Array>} Array of data objects with decrypted sensitive fields
 */
async function getStoredData() {
    const data = localStorage.getItem('formData');
    if (!data) return [];

    const parsedData = JSON.parse(data);

    // Decrypt all records
    const decryptedData = await Promise.all(
        parsedData.map(record => decryptSensitiveFields(record))
    );

    return decryptedData;
}

/**
 * Synchronous version of getStoredData for backward compatibility
 * Note: Returns encrypted data as-is. Use getStoredData() for decrypted data.
 * @returns {Array} Array of data objects (with encrypted sensitive fields)
 */
function getStoredDataSync() {
    const data = localStorage.getItem('formData');
    return data ? JSON.parse(data) : [];
}

/**
 * Save data to localStorage with encryption
 * @param {Array} data - Array of data objects to save
 * @returns {Promise<void>}
 */
async function saveData(data) {
    // Encrypt all records
    const encryptedData = await Promise.all(
        data.map(record => encryptSensitiveFields(record))
    );

    localStorage.setItem('formData', JSON.stringify(encryptedData));
}

/**
 * Synchronous version of saveData for backward compatibility
 * Note: Does not encrypt data. Use saveData() for encrypted storage.
 * @param {Array} data - Array of data objects to save
 */
function saveDataSync(data) {
    localStorage.setItem('formData', JSON.stringify(data));
}

/**
 * Export all data as a JSON file (with decrypted data)
 */
async function exportDataAsJSON() {
    const allData = await getStoredData();
    if (allData.length === 0) {
        alert('No data to export.');
        return;
    }

    const jsonData = {
        exportDate: new Date().toISOString(),
        version: "1.0",
        data: allData
    };

    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `insurance_form_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

/**
 * Import data from a JSON file (with encryption)
 * @param {File} file - The JSON file to import
 */
async function importDataFromJSON(file) {
    const reader = new FileReader();
    reader.onload = async function (e) {
        try {
            const jsonData = JSON.parse(e.target.result);

            // Validate the JSON structure
            if (!jsonData.data || !Array.isArray(jsonData.data)) {
                if (window.UIModule && window.UIModule.showAlertModal) {
                    window.UIModule.showAlertModal('Invalid Format', 'Invalid file format. Please select a valid export file.');
                } else {
                    alert('Invalid file format. Please select a valid export file.');
                }
                return;
            }

            // Define processing function to avoid code duplication
            const processImport = async (choice) => {
                const existingData = await getStoredData();
                let finalData;
                if (choice === 'add') {
                    finalData = [...existingData, ...jsonData.data];
                } else {
                    finalData = jsonData.data;
                }

                // Save the data (will be encrypted)
                await saveData(finalData);

                // Refresh the display if renderDataTable is available
                if (typeof window.renderDataTable === 'function') {
                    window.renderDataTable();
                }

                if (window.UIModule && window.UIModule.showAlertModal) {
                    window.UIModule.showAlertModal('Import Successful', `Successfully imported ${jsonData.data.length} record(s).`);
                } else {
                    alert(`Successfully imported ${jsonData.data.length} record(s).`);
                }
            };

            // Merge with existing data or replace (user choice)
            const existingData = await getStoredData();

            if (existingData.length > 0) {
                if (window.UIModule && window.UIModule.showConfirmationModal) {
                    window.UIModule.showConfirmationModal(
                        'Import Options',
                        `You have ${existingData.length} existing record(s).<br>Do you want to MERGE the imported data or REPLACE all existing data?`,
                        () => processImport('add'),
                        () => processImport('replace'),
                        'Merge',
                        'Replace'
                    );
                } else {
                    // Fallback if UI module not loaded
                    const choice = confirm(
                        `You have ${existingData.length} existing record(s).\n` +
                        `Click OK to ADD the imported data to existing records,\n` +
                        `or Cancel to REPLACE all existing data.`
                    ) ? 'add' : 'replace';
                    processImport(choice);
                }
            } else {
                processImport('replace');
            }

        } catch (error) {
            if (window.UIModule && window.UIModule.showAlertModal) {
                window.UIModule.showAlertModal('Import Error', 'Error importing file: ' + error.message);
            } else {
                alert('Error importing file: ' + error.message);
            }
        }
    };

    reader.readAsText(file);
}

/**
 * Delete a row by index
 * @param {number} index - Index of the row to delete
 */
async function deleteRow(index) {
    const allData = await getStoredData();
    if (!allData[index]) {
        alert('Row not found.');
        return false;
    }
    if (!confirm('Are you sure you want to delete this row? This action cannot be undone.')) {
        return false;
    }
    allData.splice(index, 1);
    await saveData(allData);
    return true;
}

/**
 * Clear all data from localStorage
 */
function clearAllData() {
    localStorage.removeItem('formData');
    return true;
}

// Browser-compatible exports (works in both browser and potential Node.js environments)
if (typeof module !== 'undefined' && module.exports) {
    // Node.js/CommonJS environment
    module.exports = {
        CSV_HEADERS,
        getStoredData,
        getStoredDataSync,
        saveData,
        saveDataSync,
        exportDataAsJSON,
        importDataFromJSON,
        deleteRow,
        clearAllData,
        encryptValue,
        decryptValue,
        encryptSensitiveFields,
        decryptSensitiveFields
    };
} else {
    // Browser environment - attach to window
    window.DataModule = {
        CSV_HEADERS,
        getStoredData,
        getStoredDataSync,
        saveData,
        saveDataSync,
        exportDataAsJSON,
        importDataFromJSON,
        deleteRow,
        clearAllData,
        encryptValue,
        decryptValue,
        encryptSensitiveFields,
        decryptSensitiveFields
    };
}
