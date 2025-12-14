/**
 * Module Loader - Loads and initializes all application modules
 * Ensures all modules are loaded in the correct order and exposes global functions
 * 
 * PERFORMANCE NOTE (PERF-001): Module loading is optimized for minimal overhead
 * - Synchronous loading in dependency order prevents race conditions
 * - No additional processing or bundling overhead
 * - Direct function exposure for inline event handlers
 * Monitor application load times if additional modules are added in future.
 */

(function () {
    'use strict';

    // Track loaded modules
    const loadedModules = {
        data: false,
        validation: false,
        ui: false,
        ai: false,
        utils: false,
        app: false
    };

    // Configuration: paths to module files
    const MODULE_PATHS = {
        data: 'js/data.js',
        validation: 'js/validation.js',
        ui: 'js/ui.js',
        ai: 'js/ai.js',
        utils: 'js/utils.js',
        app: 'js/app.js'
    };

    /**
     * Load a script dynamically
     * @param {string} src - Script source URL
     * @returns {Promise} Promise that resolves when script loads
     */
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = false; // Ensure sequential loading
            script.onload = () => resolve(src);
            script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
            document.head.appendChild(script);
        });
    }

    /**
     * Load all modules in sequence
     */
    async function loadModules() {
        try {
            console.log('Loading modules...');

            // Load modules in dependency order
            await loadScript(MODULE_PATHS.data);
            loadedModules.data = true;
            console.log('✓ Data module loaded');

            await loadScript(MODULE_PATHS.validation);
            loadedModules.validation = true;
            console.log('✓ Validation module loaded');

            await loadScript(MODULE_PATHS.ui);
            loadedModules.ui = true;
            console.log('✓ UI module loaded');

            await loadScript(MODULE_PATHS.ai);
            loadedModules.ai = true;
            console.log('✓ AI module loaded');

            await loadScript(MODULE_PATHS.utils);
            loadedModules.utils = true;
            console.log('✓ Utils module loaded');

            await loadScript(MODULE_PATHS.app);
            loadedModules.app = true;
            console.log('✓ App module loaded');

            // All modules loaded successfully
            console.log('All modules loaded successfully!');
            exposeGlobalFunctions();

            // Dispatch custom event to notify that modules are ready
            window.dispatchEvent(new CustomEvent('modulesLoaded'));

        } catch (error) {
            console.error('Error loading modules:', error);
            alert('Failed to load application modules. Please refresh the page.');
        }
    }

    /**
     * Expose module functions globally for backward compatibility
     * This ensures existing onclick handlers and inline scripts continue to work
     */
    function exposeGlobalFunctions() {
        // Data Module functions
        if (window.DataModule) {
            window.getStoredData = window.DataModule.getStoredData;
            window.saveData = window.DataModule.saveData;
            window.exportDataAsJSON = window.DataModule.exportDataAsJSON;
            window.importDataFromJSON = window.DataModule.importDataFromJSON;
            window.deleteRow = window.DataModule.deleteRow;
            window.clearAllData = window.DataModule.clearAllData;
            window.CSV_HEADERS = window.DataModule.CSV_HEADERS;
        }

        // Validation Module functions
        if (window.ValidationModule) {
            window.calculateAgeFromDOB = window.ValidationModule.calculateAgeFromDOB;
            window.formatAgeObject = window.ValidationModule.formatAgeObject;
            window.updateAgeFieldFromDOB = window.ValidationModule.updateAgeFieldFromDOB;
            window.validateAadhaar = window.ValidationModule.validateAadhaar;
            window.validatePAN = window.ValidationModule.validatePAN;
            window.validateEmail = window.ValidationModule.validateEmail;
            window.validateMobile = window.ValidationModule.validateMobile;
            window.validateNomineeShares = window.ValidationModule.validateNomineeShares;
            window.validateTab = window.ValidationModule.validateTab;
            window.validateAllTabs = window.ValidationModule.validateAllTabs;
            window.getFieldValidationMessage = window.ValidationModule.getFieldValidationMessage;
        }

        // UI Module functions
        if (window.UIModule) {
            window.openModal = window.UIModule.openModal;
            window.closeModal = window.UIModule.closeModal;
            window.closeRowDetails = window.UIModule.closeRowDetails;
            window.openRowDetailsModal = window.UIModule.openRowDetailsModal;
            window.escapeHtml = window.UIModule.escapeHtml;
            window.formatAIContentToHTML = window.UIModule.formatAIContentToHTML;
            window.showModalContent = window.UIModule.showModalContent;
            window.scrollElementToTop = window.UIModule.scrollElementToTop;
            window.showMainTab = window.UIModule.showMainTab;
            window.renderDataTable = window.UIModule.renderDataTable;
            window.filterDataTable = window.UIModule.filterDataTable;
            window.showToast = window.UIModule.showToast;
            window.showConfirmationModal = window.UIModule.showConfirmationModal;
            window.showAlertModal = window.UIModule.showAlertModal;
            window.closeConfirmationModal = window.UIModule.closeConfirmationModal;
        }

        // AI Module functions
        if (window.AIModule) {
            window.callGeminiAPI = window.AIModule.callGeminiAPI;
            window.generateSummary = window.AIModule.generateSummary;
            window.API_KEY = window.AIModule.API_KEY;
            window.API_URL = window.AIModule.API_URL;
        }

        // Utils Module functions
        if (window.UtilsModule) {
            window.PREV_POLICY_KEYS = window.UtilsModule.PREV_POLICY_KEYS;
            window.PREV_POLICY_CLASS_MAP = window.UtilsModule.PREV_POLICY_CLASS_MAP;
            window.FAMILY_MEMBER_CONFIG = window.UtilsModule.FAMILY_MEMBER_CONFIG;
            window.updateConditionalVisibility = window.UtilsModule.updateConditionalVisibility;
            window.setRequiredIfVisible = window.UtilsModule.setRequiredIfVisible;
            window.getClassForKey = window.UtilsModule.getClassForKey;
            window.createFamilyMemberNode = window.UtilsModule.createFamilyMemberNode;
        }

        console.log('Global functions exposed for backward compatibility');
    }

    /**
     * Check if all required modules are loaded
     * @returns {boolean} True if all modules loaded
     */
    function areModulesLoaded() {
        return Object.values(loadedModules).every(loaded => loaded === true);
    }

    // Expose loader utilities
    window.ModuleLoader = {
        loadModules,
        areModulesLoaded,
        loadedModules
    };

    // Auto-load modules when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadModules);
    } else {
        // DOM already loaded
        loadModules();
    }

})();
