/**
 * MAIN APPLICATION
 * Initialization and routing
 */

class App {
    constructor() {
        this.api = getApi();
        this.db = null;
        this.currentPage = 'login';
        this.user = null;
        
        this.init();
    }

    async init() {
        console.log(`🚀 ${APP_CONFIG.APP_NAME} v${APP_CONFIG.APP_VERSION}`);
        
        // Check for saved session
        const savedUser = getStorage('user');
        if (savedUser) {
            this.user = savedUser;
            this.api.setToken(getStorage('auth_token'));
            
            // Verify token
            try {
                const result = await this.api.verifyToken();
                if (result && result.valid) {
                    await this.loadDashboard();
                    return;
                }
            } catch (e) {
                // Token invalid
                this.api.clearToken();
                removeStorage('user');
                this.user = null;
            }
        }
        
        // Show login page
        this.showPage('login');
        this.setupLoginForm();
        
        // Initialize IndexedDB
        this.db = await getDB();
        
        // Setup service worker
        this.setupServiceWorker();
        
        // Setup sync interval
        this.setupSyncInterval();
        
        // Check connection status
        this.updateConnectionStatus();
        
        // Setup event listeners
        this.setupEventListeners();
    }

    // ============ PAGE NAVIGATION ============

    showPage(pageName) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(el => {
            el.classList.add('hidden');
        });
        
        // Show target page
        const page = document.getElementById(`page-${pageName}`);
        if (page) {
            page.classList.remove('hidden');
            this.currentPage = pageName;
        }
        
        // Update nav
        document.querySelectorAll('.nav-menu a[data-page]').forEach(el => {
            el.classList.toggle('active', el.dataset.page === pageName);
        });
        
        // Show/hide navbar
        const navbar = document.getElementById('navbar');
        if (pageName === 'login') {
            navbar.classList.add('hidden');
        } else {
            navbar.classList.remove('hidden');
        }
    }

    // ============ LOGIN ============

    setupLoginForm() {
        const form = document.getElementById('loginForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            
            if (!username || !password) {
                showError('Username dan password wajib diisi');
                return;
            }
            
            const btn = document.getElementById('loginBtn');
            const btnText = document.getElementById('loginText');
            const btnLoading = document.getElementById('loginLoading');
            
            btn.disabled = true;
            btnText.classList.add('hidden');
            btnLoading.classList.remove('hidden');
            
            try {
                const result = await this.api.login(username, password);
                this.user = result.user;
                await this.loadDashboard();
            } catch (error) {
                showError(error.message || 'Login gagal. Periksa koneksi atau coba lagi.');
            } finally {
                btn.disabled = false;
                btnText.classList.remove('hidden');
                btnLoading.classList.add('hidden');
            }
        });
    }

    // ============ DASHBOARD ============

    async loadDashboard() {
        this.showPage('dashboard');
        
        // Update user info
        if (this.user) {
            document.querySelector('.nav-title').textContent = 
                `E-Rapor Sine - ${this.user.fullName || this.user.username}`;
        }
        
        // Load dashboard data
        await this.loadDashboardStats();
        
        // Load schools data
        await this.loadSchools();
        
        // Update sync status
        this.updateConnectionStatus();
    }

    async loadDashboardStats() {
        try {
            const schools = await this.api.getSchools();
            const students = await this.api.getStudents({ schoolId: this.user.schoolId });
            
            const grid = document.getElementById('dashboardGrid');
            grid.innerHTML = `
                <div class="dashboard-card">
                    <div class="number">${schools ? schools.length : 0}</div>
                    <div class="label">Total Sekolah</div>
                </div>
                <div class="dashboard-card">
                    <div class="number">${students ? students.length : 0}</div>
                    <div class="label">Total Siswa</div>
                </div>
                <div class="dashboard-card">
                    <div class="number">${this.user.role}</div>
                    <div class="label">Role Anda</div>
                </div>
                <div class="dashboard-card">
                    <div class="number">${this.user.schoolId || '-'}</div>
                    <div class="label">ID Sekolah</div>
                </div>
            `;
        } catch (error) {
            console.error('Load dashboard error:', error);
        }
    }

    // ============ SCHOOLS ============

    async loadSchools() {
        try {
            const schools = await this.api.getSchools();
            const tbody = document.getElementById('schoolsTableBody');
            
            if (!schools || schools.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center">Belum ada data sekolah</td></tr>';
                return;
            }
            
            tbody.innerHTML = schools.map(s => `
                <tr>
                    <td>${s.npsn || '-'}</td>
                    <td>${s.schoolName || '-'}</td>
                    <td>${s.address || '-'}</td>
                    <td>${s.principal || '-'}</td>
                    <td><span class="badge ${s.status === 'active' ? 'badge-success' : 'badge-danger'}">${s.status || '-'}</span></td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="window.app.editSchool('${s.schoolId}')">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="window.app.deleteSchool('${s.schoolId}')">Hapus</button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Load schools error:', error);
            document.getElementById('schoolsTableBody').innerHTML = 
                '<tr><td colspan="6" class="text-center text-danger">Gagal memuat data</td></tr>';
        }
    }

    // ============ SYNC ============

    setupSyncInterval() {
        setInterval(() => {
            if (navigator.onLine) {
                this.performSync();
            }
        }, APP_CONFIG.SYNC_INTERVAL);
    }

    async performSync() {
        const syncBtn = document.getElementById('syncBtn');
        if (syncBtn) {
            syncBtn.disabled = true;
            syncBtn.textContent = '🔄 Menyinkronkan...';
        }
        
        try {
            const db = await getDB();
            const pending = await db.getPendingSync();
            
            if (pending.length > 0) {
                // Upload pending data
                const result = await this.api.syncUpload(pending);
                // Mark as synced
                for (const item of pending) {
                    await db.markSynced(item.localId, result.serverId);
                }
                // Update status
                this.updateSyncStatus('synced', pending.length);
            }
            
            // Download new data from server
            const lastSync = getStorage('lastSync') || new Date(0).toISOString();
            const changes = await this.api.syncDownload(lastSync);
            
            if (changes && changes.length > 0) {
                // Save to IndexedDB
                // TODO: Implement merge logic
            }
            
            setStorage('lastSync', new Date().toISOString());
            this.updateConnectionStatus();
            
        } catch (error) {
            console.error('Sync error:', error);
            this.updateSyncStatus('error');
        } finally {
            if (syncBtn) {
                syncBtn.disabled = false;
                syncBtn.textContent = '🔄 Sinkronkan';
            }
        }
    }

    updateSyncStatus(status, count = 0) {
        const statusEl = document.querySelector('.sync-status .status-text');
        const dotEl = document.querySelector('.sync-status .status-dot');
        
        if (status === 'synced') {
            dotEl.className = 'status-dot online';
            statusEl.textContent = '🟢 Tersinkron';
        } else if (status === 'pending') {
            dotEl.className = 'status-dot offline';
            statusEl.textContent = `🟡 ${count} data menunggu sync`;
        } else if (status === 'error') {
            dotEl.className = 'status-dot offline';
            statusEl.textContent = '🔴 Gagal sinkron';
        } else {
            dotEl.className = 'status-dot offline';
            statusEl.textContent = '🔴 Offline';
        }
    }

    // ============ CONNECTION STATUS ============

    updateConnectionStatus() {
        const online = navigator.onLine;
        const statusEl = document.querySelector('.sync-status .status-text');
        const dotEl = document.querySelector('.sync-status .status-dot');
        
        if (online) {
            dotEl.className = 'status-dot online';
            statusEl.textContent = '🟢 Online - Tersinkron';
        } else {
            dotEl.className = 'status-dot offline';
            statusEl.textContent = '🔴 Offline - Data tersimpan lokal';
        }
    }

    // ============ SERVICE WORKER ============

    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js')
                .then(reg => {
                    console.log('Service Worker registered:', reg);
                })
                .catch(err => {
                    console.error('Service Worker registration failed:', err);
                });
        }
    }

    // ============ EVENT LISTENERS ============

    setupEventListeners() {
        // Nav toggle (mobile)
        const navToggle = document.getElementById('navToggle');
        const navMenu = document.getElementById('navMenu');
        if (navToggle) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('open');
            });
        }

        // Nav links
        document.querySelectorAll('.nav-menu a[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                this.showPage(page);
                navMenu.classList.remove('open');
                
                // Load page data
                if (page === 'schools') this.loadSchools();
                if (page === 'dashboard') this.loadDashboardStats();
            });
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', async (e) => {
            e.preventDefault();
            await this.api.logout();
            this.user = null;
            this.showPage('login');
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
        });

        // Sync button
        document.getElementById('syncBtn').addEventListener('click', () => {
            this.performSync();
        });

        // Add school button
        document.getElementById('addSchoolBtn')?.addEventListener('click', () => {
            this.showAddSchoolModal();
        });

        // Modal close
        document.getElementById('modalClose').addEventListener('click', () => {
            document.getElementById('modal').classList.add('hidden');
        });

        // Connection status
        window.addEventListener('online', () => {
            this.updateConnectionStatus();
            this.performSync();
        });
        window.addEventListener('offline', () => {
            this.updateConnectionStatus();
        });
    }

    // ============ MODAL ============

    showModal(title, bodyHTML) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = bodyHTML;
        document.getElementById('modal').classList.remove('hidden');
    }

    showAddSchoolModal() {
        this.showModal('Tambah Sekolah', `
            <form id="schoolForm">
                <div class="form-group">
                    <label>NPSN</label>
                    <input type="text" id="schoolNPSN" required>
                </div>
                <div class="form-group">
                    <label>Nama Sekolah</label>
                    <input type="text" id="schoolName" required>
                </div>
                <div class="form-group">
                    <label>Alamat</label>
                    <input type="text" id="schoolAddress">
                </div>
                <div class="form-group">
                    <label>Kepala Sekolah</label>
                    <input type="text" id="schoolPrincipal">
                </div>
                <button type="submit" class="btn btn-primary btn-block">Simpan</button>
            </form>
        `);
        
        document.getElementById('schoolForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                npsn: document.getElementById('schoolNPSN').value,
                schoolName: document.getElementById('schoolName').value,
                address: document.getElementById('schoolAddress').value,
                principal: document.getElementById('schoolPrincipal').value
            };
            
            try {
                await this.api.createSchool(data);
                document.getElementById('modal').classList.add('hidden');
                await this.loadSchools();
                showToast('Sekolah berhasil ditambahkan');
            } catch (error) {
                showError('Gagal menambah sekolah: ' + error.message);
            }
        });
    }

    // ============ PUBLIC METHODS ============

    async editSchool(schoolId) {
        try {
            const school = await this.api.getSchool(schoolId);
            this.showModal('Edit Sekolah', `
                <form id="editSchoolForm">
                    <div class="form-group">
                        <label>NPSN</label>
                        <input type="text" id="editNPSN" value="${school.npsn || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Nama Sekolah</label>
                        <input type="text" id="editName" value="${school.schoolName || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Alamat</label>
                        <input type="text" id="editAddress" value="${school.address || ''}">
                    </div>
                    <div class="form-group">
                        <label>Kepala Sekolah</label>
                        <input type="text" id="editPrincipal" value="${school.principal || ''}">
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">Update</button>
                </form>
            `);
            
            document.getElementById('editSchoolForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const data = {
                    npsn: document.getElementById('editNPSN').value,
                    schoolName: document.getElementById('editName').value,
                    address: document.getElementById('editAddress').value,
                    principal: document.getElementById('editPrincipal').value
                };
                
                try {
                    await this.api.updateSchool(schoolId, data);
                    document.getElementById('modal').classList.add('hidden');
                    await this.loadSchools();
                    showToast('Sekolah berhasil diupdate');
                } catch (error) {
                    showError('Gagal update: ' + error.message);
                }
            });
        } catch (error) {
            showError('Gagal memuat data: ' + error.message);
        }
    }

    async deleteSchool(schoolId) {
        if (!confirm('Yakin ingin menghapus sekolah ini?')) return;
        
        try {
            await this.api.deleteSchool(schoolId);
            await this.loadSchools();
            showToast('Sekolah berhasil dihapus');
        } catch (error) {
            showError('Gagal hapus: ' + error.message);
        }
    }
}

// ============ INITIALIZE ============

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
