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

// api.js

async request(method, path, data = null, requireAuth = true) {
    const url = new URL(this.baseUrl);
    url.searchParams.set('path', path);

    const token = this.getToken();
    if (requireAuth && token) {
        url.searchParams.set('token', token);
    }

    let bodyData = data || {};
    if (requireAuth && token) {
        bodyData.token = token;
    }

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8'
        },
        redirect: 'follow'
    };

    bodyData._method = method;
    options.body = JSON.stringify(bodyData);

    try {
        const response = await fetch(url.toString(), options);
        const textText = await response.text(); // Ambil sebagai text dulu untuk cegah crash JSON

        let result;
        try {
            result = JSON.parse(textText);
        } catch (e) {
            console.error('Server mengembalikan HTML bukannya JSON:', textText);
            throw new Error('Akses ke backend ditolak atau deployment Apps Script belum diset ke Anyone.');
        }

        if (result.status === 'error') {
            throw new Error(result.message || 'API error');
        }

        return result.data !== undefined ? result.data : result;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

async login(username, password) {
    const result = await this.request('POST', 'api/auth/login', {
        username: username,
        password: password
    }, false);

    console.log('📦 Server Login Response:', result); // Untuk pengecekan di Console

    // Ekstrak data user dan token (toleran terhadap wrapper data)
    const loginData = result.data || result;
    const user = loginData.user;
    const token = loginData.token;

    if (!user) {
        throw new Error('User tidak ditemukan pada respon backend.');
    }

    if (token) {
        this.setToken(token);
    }
    
    if (user) {
        setStorage('user', user);
    }
    
    return loginData;
}

    async verifyToken() {
        const token = this.getToken();
        if (!token) return null;
        
        try {
            return await this.request('GET', 'api/auth/verify', { token: token }, false);
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
        return this.request('POST', 'api/sync/upload', { data: pendingData });
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

let apiInstance = null;

function getApi() {
    if (!apiInstance) {
        apiInstance = new ApiService();
    }
    return apiInstance;
}
