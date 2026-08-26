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

    async request(method, path, data = null, requireAuth = true) {
        const url = new URL(this.baseUrl);
        url.searchParams.set('path', path);

        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        // Add token if required
        if (requireAuth) {
            const token = this.getToken();
            if (token) {
                options.headers['Authorization'] = `Bearer ${token}`;
                // Also add as query param for GET requests
                if (method === 'GET') {
                    url.searchParams.set('token', token);
                }
            }
        }

        // Add body for POST/PUT
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        } else if (data && method === 'GET') {
            // Add data as query params for GET
            Object.entries(data).forEach(([key, value]) => {
                url.searchParams.set(key, value);
            });
        }

        try {
            const response = await fetch(url.toString(), options);
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
        const result = await this.request('POST', 'api/auth/login', {
            username,
            password
        }, false);
        
        if (result.token) {
            this.setToken(result.token);
            setStorage('user', result.user);
        }
        
        return result;
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
        } catch (e) {
            // Ignore
        }
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
