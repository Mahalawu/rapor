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
        
        // Load classes & students (untuk persiapan halaman Siswa)
        await this.loadClasses();
        await this.loadStudents();
        
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

    // ============ CLASSES ============

    async loadClasses() {
        try {
            const classes = await this.api.getClasses();
            // Update class filter dropdown di halaman Siswa
            const select = document.getElementById('classFilter');
            if (select) {
                select.innerHTML = '<option value="">Semua Kelas</option>';
                if (classes && classes.length > 0) {
                    classes.forEach(c => {
                        const option = document.createElement('option');
                        option.value = c.classId;
                        option.textContent = `${c.className} (Kelas ${c.grade})`;
                        select.appendChild(option);
                    });
                }
            }
            return classes || [];
        } catch (error) {
            console.error('Load classes error:', error);
            return [];
        }
    }

    // ============ STUDENTS ============

    async loadStudents() {
        try {
            const classId = document.getElementById('classFilter')?.value || '';
            const search = document.getElementById('searchStudent')?.value || '';
            
            let params = {};
            if (classId) params.classId = classId;
            
            const students = await this.api.getStudents(params);
            const tbody = document.getElementById('studentsTableBody');
            
            if (!students || students.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center">Belum ada data siswa</td></tr>';
                return;
            }
            
            // Filter by search
            let filtered = students;
            if (search) {
                filtered = students.filter(s => 
                    s.fullName.toLowerCase().includes(search.toLowerCase()) ||
                    (s.nisn && s.nisn.includes(search))
                );
            }
            
            tbody.innerHTML = filtered.map(s => `
                <tr>
                    <td>${s.nisn || '-'}</td>
                    <td>${s.fullName || '-'}</td>
                    <td>${s.classId || '-'}</td>
                    <td><span class="badge ${s.status === 'active' ? 'badge-success' : 'badge-danger'}">${s.status || '-'}</span></td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="window.app.editStudent('${s.studentId}')">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="window.app.deleteStudent('${s.studentId}')">Hapus</button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Load students error:', error);
            document.getElementById('studentsTableBody').innerHTML = 
                '<tr><td colspan="5" class="text-center text-danger">Gagal memuat data</td></tr>';
        }
    }

    // ============ STUDENT MODAL ============

    showAddStudentModal() {
        // Load classes untuk dropdown
        this.loadClasses().then(classes => {
            const classOptions = (classes || []).map(c => 
                `<option value="${c.classId}">${c.className} (Kelas ${c.grade})</option>`
            ).join('');
            
            this.showModal('Tambah Siswa', `
                <form id="studentForm">
                    <div class="form-group">
                        <label>NISN (10 digit)</label>
                        <input type="text" id="studentNISN" maxlength="10" pattern="[0-9]{10}" required>
                        <small>Harus 10 digit angka</small>
                    </div>
                    <div class="form-group">
                        <label>Nama Lengkap</label>
                        <input type="text" id="studentName" required>
                    </div>
                    <div class="form-group">
                        <label>Kelas</label>
                        <select id="studentClass" required>
                            <option value="">Pilih Kelas</option>
                            ${classOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Tempat Lahir</label>
                        <input type="text" id="studentBirthPlace">
                    </div>
                    <div class="form-group">
                        <label>Tanggal Lahir</label>
                        <input type="date" id="studentBirthDate">
                    </div>
                    <div class="form-group">
                        <label>Jenis Kelamin</label>
                        <select id="studentGender">
                            <option value="">Pilih</option>
                            <option value="M">Laki-laki</option>
                            <option value="F">Perempuan</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Alamat</label>
                        <textarea id="studentAddress" rows="2"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Nama Orang Tua</label>
                        <input type="text" id="studentParentName">
                    </div>
                    <div class="form-group">
                        <label>Telepon Orang Tua</label>
                        <input type="text" id="studentParentPhone">
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">Simpan</button>
                </form>
            `);
            
            document.getElementById('studentForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const data = {
                    classId: document.getElementById('studentClass').value,
                    nisn: document.getElementById('studentNISN').value,
                    fullName: document.getElementById('studentName').value,
                    birthPlace: document.getElementById('studentBirthPlace').value,
                    birthDate: document.getElementById('studentBirthDate').value,
                    gender: document.getElementById('studentGender').value,
                    address: document.getElementById('studentAddress').value,
                    parentName: document.getElementById('studentParentName').value,
                    parentPhone: document.getElementById('studentParentPhone').value
                };
                
                // Validasi NISN
                if (!/^\d{10}$/.test(data.nisn)) {
                    showError('NISN harus 10 digit angka');
                    return;
                }
                
                try {
                    await this.api.createStudent(data);
                    document.getElementById('modal').classList.add('hidden');
                    await this.loadStudents();
                    showToast('Siswa berhasil ditambahkan');
                } catch (error) {
                    showError('Gagal menambah siswa: ' + error.message);
                }
            });
        });
    }

    async editStudent(studentId) {
        try {
            const student = await this.api.getStudent(studentId);
            const classes = await this.api.getClasses();
            
            const classOptions = (classes || []).map(c => 
                `<option value="${c.classId}" ${c.classId === student.classId ? 'selected' : ''}>
                    ${c.className} (Kelas ${c.grade})
                </option>`
            ).join('');
            
            this.showModal('Edit Siswa', `
                <form id="editStudentForm">
                    <div class="form-group">
                        <label>NISN (10 digit)</label>
                        <input type="text" id="editNISN" value="${student.nisn || ''}" maxlength="10" pattern="[0-9]{10}" required>
                    </div>
                    <div class="form-group">
                        <label>Nama Lengkap</label>
                        <input type="text" id="editName" value="${student.fullName || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Kelas</label>
                        <select id="editClass" required>
                            <option value="">Pilih Kelas</option>
                            ${classOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Tempat Lahir</label>
                        <input type="text" id="editBirthPlace" value="${student.birthPlace || ''}">
                    </div>
                    <div class="form-group">
                        <label>Tanggal Lahir</label>
                        <input type="date" id="editBirthDate" value="${student.birthDate || ''}">
                    </div>
                    <div class="form-group">
                        <label>Jenis Kelamin</label>
                        <select id="editGender">
                            <option value="">Pilih</option>
                            <option value="M" ${student.gender === 'M' ? 'selected' : ''}>Laki-laki</option>
                            <option value="F" ${student.gender === 'F' ? 'selected' : ''}>Perempuan</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Alamat</label>
                        <textarea id="editAddress" rows="2">${student.address || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Nama Orang Tua</label>
                        <input type="text" id="editParentName" value="${student.parentName || ''}">
                    </div>
                    <div class="form-group">
                        <label>Telepon Orang Tua</label>
                        <input type="text" id="editParentPhone" value="${student.parentPhone || ''}">
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">Update</button>
                </form>
            `);
            
            document.getElementById('editStudentForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const data = {
                    ClassID: document.getElementById('editClass').value,
                    NISN: document.getElementById('editNISN').value,
                    FullName: document.getElementById('editName').value,
                    BirthPlace: document.getElementById('editBirthPlace').value,
                    BirthDate: document.getElementById('editBirthDate').value,
                    Gender: document.getElementById('editGender').value,
                    Address: document.getElementById('editAddress').value,
                    ParentName: document.getElementById('editParentName').value,
                    ParentPhone: document.getElementById('editParentPhone').value
                };
                
                if (!/^\d{10}$/.test(data.NISN)) {
                    showError('NISN harus 10 digit angka');
                    return;
                }
                
                try {
                    await this.api.updateStudent(studentId, data);
                    document.getElementById('modal').classList.add('hidden');
                    await this.loadStudents();
                    showToast('Siswa berhasil diupdate');
                } catch (error) {
                    showError('Gagal update: ' + error.message);
                }
            });
        } catch (error) {
            showError('Gagal memuat data: ' + error.message);
        }
    }

    async deleteStudent(studentId) {
        if (!confirm('Yakin ingin menghapus siswa ini?')) return;
        
        try {
            await this.api.deleteStudent(studentId);
            await this.loadStudents();
            showToast('Siswa berhasil dihapus');
        } catch (error) {
            showError('Gagal hapus: ' + error.message);
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
            navigator.serviceWorker.register('./service-worker.js')
                .then(reg => console.log('Service Worker registered:', reg))
                .catch(err => console.error('Service Worker registration failed:', err));
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
                if (page === 'students') {
                    this.loadClasses();
                    this.loadStudents();
                }
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

        // Students page - Add student
        document.getElementById('addStudentBtn')?.addEventListener('click', () => {
            this.showAddStudentModal();
        });

        // Students page - Class filter
        document.getElementById('classFilter')?.addEventListener('change', () => {
            this.loadStudents();
        });

        // Students page - Search
        document.getElementById('searchStudent')?.addEventListener('input', () => {
            this.loadStudents();
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
