/**
 * UTILITY FUNCTIONS
 * Shared helper functions
 */

// ============ DOM HELPERS ============

function $(selector, context = document) {
    return context.querySelector(selector);
}

function $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
}

function showElement(el) {
    el.classList.remove('hidden');
}

function hideElement(el) {
    el.classList.add('hidden');
}

function toggleElement(el) {
    el.classList.toggle('hidden');
}

function setText(el, text) {
    el.textContent = text;
}

function setHTML(el, html) {
    el.innerHTML = html;
}

// ============ STORAGE HELPERS ============

function setStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.warn('Storage error:', e);
    }
}

function getStorage(key, defaultValue = null) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : defaultValue;
    } catch (e) {
        return defaultValue;
    }
}

function removeStorage(key) {
    localStorage.removeItem(key);
}

// ============ DATE HELPERS ============

function formatDate(date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
}

function formatDateTime(date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getCurrentSemester() {
    const month = new Date().getMonth();
    return month < 6 ? '2' : '1';
}

function getCurrentYear() {
    const year = new Date().getFullYear();
    return `${year}/${year + 1}`;
}

// ============ ID GENERATION ============

function generateId(prefix) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}${random}`;
}

// ============ VALIDATION ============

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidNISN(nisn) {
    return /^\d{10}$/.test(nisn);
}

function isValidScore(score) {
    const num = Number(score);
    return !isNaN(num) && num >= 0 && num <= 100;
}

// ============ ERROR HANDLING ============

function showError(message) {
    const errorEl = document.getElementById('loginError');
    if (errorEl) {
        setText(errorEl, message);
        showElement(errorEl);
        setTimeout(() => hideElement(errorEl), 5000);
    }
    console.error('Error:', message);
}

function showToast(message, type = 'info') {
    // Simple toast implementation
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ============ LOADING ============

function showLoading(id) {
    const el = document.getElementById(id);
    if (el) {
        el.disabled = true;
        el.innerHTML = '<span class="loading-spinner"></span> Loading...';
    }
}

function hideLoading(id, originalText) {
    const el = document.getElementById(id);
    if (el) {
        el.disabled = false;
        el.textContent = originalText || 'Submit';
    }
}
