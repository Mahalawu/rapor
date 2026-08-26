/**
 * INDEXEDDB SERVICE
 * Local database for offline-first capability
 */

class RaporDB {
    constructor() {
        this.db = null;
        this.dbName = APP_CONFIG.DB_NAME;
        this.dbVersion = APP_CONFIG.DB_VERSION;
        this.stores = {
            users: '++localId, userId, username',
            schools: '++localId, schoolId, name',
            students: '++localId, studentId, schoolId, classId',
            classes: '++localId, classId, schoolId',
            subjects: '++localId, subjectId, schoolId',
            objectives: '++localId, tpId, schoolId, subjectId',
            assessments: '++localId, assessmentId, schoolId, studentId',
            grades: '++localId, gradeId, schoolId, studentId',
            attendance: '++localId, attendanceId, schoolId, studentId',
            reports: '++localId, reportId, schoolId, studentId',
            syncQueue: '++id, entity, action, status',
            settings: '++localId, settingId, schoolId'
        };
    }

    // ============ OPEN DATABASE ============

    async open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                this.createStores(db);
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    createStores(db) {
        Object.entries(this.stores).forEach(([name, keyPath]) => {
            if (!db.objectStoreNames.contains(name)) {
                const store = db.createObjectStore(name, { 
                    keyPath: 'localId',
                    autoIncrement: true 
                });
                
                // Create indexes
                const keys = keyPath.split(', ');
                keys.forEach(key => {
                    if (key !== '++localId') {
                        store.createIndex(key, key);
                    }
                });
            }
        });
    }

    // ============ GENERIC CRUD ============

    async getAll(storeName, filter = null) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            
            request.onsuccess = () => {
                let data = request.result;
                if (filter) {
                    data = data.filter(item => {
                        return Object.entries(filter).every(([key, value]) => {
                            return item[key] === value;
                        });
                    });
                }
                resolve(data);
            };
            
            request.onerror = () => reject(request.error);
        });
    }

    async get(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async put(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            
            // Add metadata
            data.updatedAt = new Date().toISOString();
            if (!data.localId) {
                data.syncStatus = 'pending';
                data.createdAt = data.updatedAt;
            }
            
            const request = store.put(data);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async batchPut(storeName, dataArray) {
        const transaction = this.db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        const promises = dataArray.map(data => {
            data.updatedAt = new Date().toISOString();
            if (!data.localId) {
                data.syncStatus = 'pending';
                data.createdAt = data.updatedAt;
            }
            return new Promise((resolve, reject) => {
                const request = store.put(data);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        });
        
        return Promise.all(promises);
    }

    async delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    // ============ SYNC QUEUE ============

    async getPendingSync() {
        return this.getAll('syncQueue', { status: 'pending' });
    }

    async addToSyncQueue(data) {
        const queueItem = {
            entity: data.entity,
            action: data.action,
            data: JSON.stringify(data.data),
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        return this.put('syncQueue', queueItem);
    }

    async markSynced(id, serverId) {
        const item = await this.get('syncQueue', id);
        if (item) {
            item.status = 'synced';
            item.serverId = serverId;
            item.syncedAt = new Date().toISOString();
            return this.put('syncQueue', item);
        }
    }

    async clearSyncQueue() {
        const items = await this.getAll('syncQueue');
        for (const item of items) {
            await this.delete('syncQueue', item.localId);
        }
    }

    // ============ CLEAR DATA ============

    async clearStore(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async clearAll() {
        const storeNames = Object.keys(this.stores);
        for (const name of storeNames) {
            await this.clearStore(name);
        }
    }
}

// Singleton instance
let dbInstance = null;

async function getDB() {
    if (!dbInstance) {
        dbInstance = new RaporDB();
        await dbInstance.open();
    }
    return dbInstance;
}
