/**
 * API SERVICE
 * Communication with backend Google Apps Script API
 */

class ApiService {
    constructor() {
        this.baseUrl = APP_CONFIG.API_BASE_URL;
        this.token = null;
    }

    setToken(token) {
        this.token = token;
        setStorage('auth_token', token);
    }

    getToken() {
        if (!this.token) {
            this.token = getStorage('auth_token');
        }
        return this.token;
    }

    clearToken() {
        this.token = null;
        removeStorage('auth_token');
    }

    // ============ GENERIC REQUEST ============

    // api.js
async request(method, path, data = null, requireAuth = true) {
    const url = new URL(this.baseUrl);
    url.searchParams.set('path', path);

    const token = this.getToken();

    // 1. Tambahkan token ke query string jika ada
    if (requireAuth && token) {
        url.searchParams.set('token', token);
    }

    // 2. Siapkan konfigurasi Fetch
    const options = {
        method: method === 'GET' ? 'GET' : 'POST', // Kirim POST/PUT/DELETE via POST ke GAS
        headers: {
            'Content-Type': 'text/plain;charset=utf-8' // Menghindari Preflight OPTIONS
        },
        redirect: 'follow'
    };

    let bodyData = data || {};
    if (requireAuth && token) {
        bodyData.token = token;
    }

    if (method !== 'GET') {
        bodyData._method = method; // Kirim HTTP method asli di dalam body
        options.body = JSON.stringify(bodyData);
    }

    try {
        const response = await fetch(url.toString(), options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        
        if (result.status === 'error') {
            throw new Error(result.message || 'API error');
        }
        
        return result.data;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

    // ============ AUTH ENDPOINTS ============

async login(username, password) {
    return this.request('POST', 'api/auth/login', {
        username: username,
        password: password
    }, false);
}

    async verifyToken() {
        const token = this.getToken();
        if (!token) return null;
        
        try {
            const result = await this.request('GET', 'api/auth/verify', {
                token: token
            }, false);
            return result;
        } catch (error) {
            this.clearToken();
            return null;
        }
    }

    async logout() {
        try {
            await this.request('POST', 'api/auth/logout', {}, true);
        } catch (e) {}
        this.clearToken();
        removeStorage('user');
    }

    // ============ SCHOOLS ENDPOINTS ============

    async getSchools() {
        return this.request('GET', 'api/schools');
    }

    async getSchool(schoolId) {
        return this.request('GET', `api/schools/${schoolId}`);
    }

    async createSchool(data) {
        return this.request('POST', 'api/schools', data);
    }

    async updateSchool(schoolId, data) {
        return this.request('PUT', `api/schools/${schoolId}`, data);
    }

    async deleteSchool(schoolId) {
        return this.request('DELETE', `api/schools/${schoolId}`);
    }

    // ============ STUDENTS ENDPOINTS ============

    async getStudents(params = {}) {
        return this.request('GET', 'api/students', params);
    }

    async getStudent(studentId) {
        return this.request('GET', `api/students/${studentId}`);
    }

    async createStudent(data) {
        return this.request('POST', 'api/students', data);
    }

    async updateStudent(studentId, data) {
        return this.request('PUT', `api/students/${studentId}`, data);
    }

    async deleteStudent(studentId) {
        return this.request('DELETE', `api/students/${studentId}`);
    }

    // ============ SYNC ENDPOINTS ============

    async syncUpload(pendingData) {
        return this.request('POST', 'api/sync/upload', {
            data: pendingData
        });
    }

    async syncDownload(since) {
        return this.request('GET', 'api/sync/download', {
            since: since || new Date(0).toISOString()
        });
    }

    // ============ REPORTS ENDPOINTS ============

    async generateReport(studentId, semester, year) {
        return this.request('POST', 'api/reports/generate', {
            studentId,
            semester,
            academicYear: year
        });
    }

    async finalizeReport(reportId) {
        return this.request('POST', 'api/reports/finalize', { reportId });
    }

    async getReportPDF(reportId) {
        return this.request('GET', 'api/reports/pdf', { reportId });
    }
}

// Singleton instance
let apiInstance = null;

function getApi() {
    if (!apiInstance) {
        apiInstance = new ApiService();
    }
    return apiInstance;
}
