/**
 * CONFIGURATION
 * Centralized configuration for the app
 */

const APP_CONFIG = {
    // Backend API
    API_BASE_URL: 'https://script.google.com/macros/s/AKfycbzZ2h5CciA9V8AHN3uAG_2XPfvHIGaMuf2T969mbWUyJCAP65SYwPY0KPICgM9jTzZt/exec',
    
    // App Info
    APP_NAME: 'Sistem Rapor SD Kecamatan Sine',
    APP_VERSION: '1.0.0',
    
    // IndexedDB
    DB_NAME: 'RaporSineDB',
    DB_VERSION: 1,
    
    // Sync
    SYNC_INTERVAL: 300000, // 5 minutes
    BATCH_SIZE: 50,
    
    // Default values
    DEFAULT_ROLE: 'teacher',
    DEFAULT_SEMESTER: '1',
    
    // Cache
    CACHE_EXPIRY: 86400000, // 24 hours
};

// Spreadsheet ID (for reference)
const SPREADSHEET_ID = '1E2fkHd5TEJtKqm86_9JdTaRpEHWjzMC3xGWwOVAAr-s';
