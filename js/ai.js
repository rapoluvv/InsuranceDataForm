/**
 * AI Module - Handles Gemini AI integration
 * Manages API calls and summary generation
 */

// API Configuration
// SECURITY WARNING (SEC-001): API key is exposed in client-side code
// RECOMMENDATION: For production deployment, implement a server-side proxy
// to handle AI API calls and protect the API key from exposure.
// Current implementation is suitable for development/demo purposes only.
const API_KEY = "AIzaSyBaH3Um6fbT8zxMoiTF4lyNFhn-HWzC_RQ";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`;

/**
 * Call Gemini AI API with retry logic
 * @param {string} prompt - The prompt to send to the AI
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<string>} AI response text
 */
async function callGeminiAPI(prompt, maxRetries = 3) {
    const payload = { contents: [{ parts: [{ text: prompt }] }] };
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
            const result = await response.json();
            if (result.candidates && result.candidates[0].content.parts[0].text) {
                return result.candidates[0].content.parts[0].text;
            } else {
                throw new Error("Invalid response structure from API.");
            }
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error);
            if (i < maxRetries - 1) await new Promise(res => setTimeout(res, 1000 * Math.pow(2, i)));
            else return "Sorry, there was an error contacting the AI. Please try again later.";
        }
    }
}

/**
 * Generate AI summary for a specific data entry
 * @param {number} index - Index of the data entry
 */
async function generateSummary(index) {
    if (!API_KEY || API_KEY.trim() === '') {
        alert('AI summary requires a valid Gemini API key. Please configure the API_KEY variable in the code.');
        return;
    }
    try {
        // Open modal using UIModule if available
        if (typeof window.UIModule !== 'undefined') {
            window.UIModule.openModal('Generating Client Summary...');
        } else if (typeof window.openModal === 'function') {
            window.openModal('Generating Client Summary...');
        }

        // Get row data from DataModule if available
        const allData = (typeof window.DataModule !== 'undefined') 
            ? await window.DataModule.getStoredData()
            : (typeof window.getStoredData === 'function' ? await window.getStoredData() : []);
        
        const rowData = allData[index];
        
        if (!rowData) {
            throw new Error('Data not found');
        }

        const prompt = `Act as a professional insurance agent. Based on the following data, write a concise summary for an internal client file. Focus on the key details like name, age, profession, proposed policy, sum assured, premium, and nominee.\nData: ${JSON.stringify(rowData)}`;
        const summary = await callGeminiAPI(prompt);
        
        // Show content using UIModule if available
        if (typeof window.UIModule !== 'undefined') {
            window.UIModule.showModalContent(summary);
        } else if (typeof window.showModalContent === 'function') {
            window.showModalContent(summary);
        }
    } catch (err) {
        console.error('generateSummary failed', err);
        const errorMsg = 'Error generating summary: ' + (err && err.message ? err.message : String(err));
        if (typeof window.UIModule !== 'undefined') {
            window.UIModule.showModalContent(errorMsg);
        } else if (typeof window.showModalContent === 'function') {
            window.showModalContent(errorMsg);
        }
    }
}

// Browser-compatible exports
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        API_KEY,
        API_URL,
        callGeminiAPI,
        generateSummary
    };
} else {
    window.AIModule = {
        API_KEY,
        API_URL,
        callGeminiAPI,
        generateSummary
    };
}
