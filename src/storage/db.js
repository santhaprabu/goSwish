/**
 * ============================================================================
 * INDEXED DB STORAGE LAYER
 * ============================================================================
 * 
 * Purpose:
 * This acts as our "Database". Instead of a remote server (SQL/NoSQL), we use
 * the browser's persistent IndexedDB. This makes the app:
 * 1. Offline-first: Works without internet.
 * 2. Prototype-friendly: No backend setup required.
 * 3. Fast: Local read/writes.
 * 
 * We use a "Doc-based" API pattern (addDoc, getDoc) to mimic Firebase/Firestore,
 * making future migration to a real backend easy.
 */

const DB_NAME = 'GoSwishDB';
const DB_VERSION = 4;

// Collection names
export const COLLECTIONS = {
    USERS: 'users',
    CLEANERS: 'cleaners',
    BOOKINGS: 'bookings',
    JOBS: 'jobs',
    HOUSES: 'houses',
    PAYMENT_METHODS: 'paymentMethods',
    REVIEWS: 'reviews',
    SERVICE_TYPES: 'serviceTypes',
    ADD_ONS: 'addOns',
    PROMO_CODES: 'promoCodes',
    SETTINGS: 'settings',
    NOTIFICATIONS: 'notifications',
    MESSAGES: 'messages',
};

let db = null;

/**
 * Initialize IndexedDB
 */
export const initDB = () => {
    return new Promise((resolve, reject) => {
        if (db) {
            resolve(db);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('IndexedDB error:', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            db = request.result;
            console.log('✅ IndexedDB initialized successfully');
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            // Create object stores (collections)
            Object.values(COLLECTIONS).forEach((collectionName) => {
                if (!database.objectStoreNames.contains(collectionName)) {
                    const objectStore = database.createObjectStore(collectionName, {
                        keyPath: 'id',
                        autoIncrement: false,
                    });

                    // Create indexes for common queries
                    objectStore.createIndex('createdAt', 'createdAt', { unique: false });
                    objectStore.createIndex('updatedAt', 'updatedAt', { unique: false });

                    // Collection-specific indexes
                    if (collectionName === COLLECTIONS.USERS) {
                        objectStore.createIndex('email', 'email', { unique: true });
                        objectStore.createIndex('role', 'role', { unique: false });
                    }

                    if (collectionName === COLLECTIONS.BOOKINGS) {
                        objectStore.createIndex('customerId', 'customerId', { unique: false });
                        objectStore.createIndex('cleanerId', 'cleanerId', { unique: false });
                        objectStore.createIndex('status', 'status', { unique: false });
                    }

                    if (collectionName === COLLECTIONS.JOBS) {
                        objectStore.createIndex('bookingId', 'bookingId', { unique: false });
                        objectStore.createIndex('cleanerId', 'cleanerId', { unique: false });
                        objectStore.createIndex('status', 'status', { unique: false });
                    }

                    if (collectionName === COLLECTIONS.HOUSES) {
                        objectStore.createIndex('userId', 'userId', { unique: false });
                    }

                    if (collectionName === COLLECTIONS.REVIEWS) {
                        objectStore.createIndex('cleanerId', 'cleanerId', { unique: false });
                        objectStore.createIndex('customerId', 'customerId', { unique: false });
                    }

                    if (collectionName === COLLECTIONS.NOTIFICATIONS) {
                        objectStore.createIndex('userId', 'userId', { unique: false });
                        objectStore.createIndex('type', 'type', { unique: false });
                        objectStore.createIndex('relatedId', 'relatedId', { unique: false });
                    }
                } else {
                    // Update existing store indexes for version upgrades
                    const transaction = event.target.transaction;
                    const objectStore = transaction.objectStore(collectionName);

                    if (collectionName === COLLECTIONS.NOTIFICATIONS) {
                        if (!objectStore.indexNames.contains('userId')) {
                            objectStore.createIndex('userId', 'userId', { unique: false });
                        }
                        if (!objectStore.indexNames.contains('type')) {
                            objectStore.createIndex('type', 'type', { unique: false });
                        }
                        if (!objectStore.indexNames.contains('relatedId')) {
                            objectStore.createIndex('relatedId', 'relatedId', { unique: false });
                        }
                    }
                }
            });

            console.log('✅ Database schema created');
        };
    });
};

/**
 * Generate unique ID
 */
export const generateId = (prefix = '') => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
};

/**
 * Add document to collection
 */
export const addDoc = async (collection, data) => {
    await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([collection], 'readwrite');
        const objectStore = transaction.objectStore(collection);

        const doc = {
            ...data,
            id: data.id || generateId(),
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const request = objectStore.add(doc);

        request.onsuccess = () => {
            resolve({ id: doc.id, ...doc });
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
};

/**
 * Set document (create or update)
 */
export const setDoc = async (collection, id, data) => {
    await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([collection], 'readwrite');
        const objectStore = transaction.objectStore(collection);

        const doc = {
            ...data,
            id,
            updatedAt: new Date().toISOString(),
        };

        // Check if document exists
        const getRequest = objectStore.get(id);

        getRequest.onsuccess = () => {
            const existing = getRequest.result;

            if (existing) {
                // Update existing
                doc.createdAt = existing.createdAt;
                const updateRequest = objectStore.put(doc);

                updateRequest.onsuccess = () => resolve({ id, ...doc });
                updateRequest.onerror = () => reject(updateRequest.error);
            } else {
                // Create new
                doc.createdAt = new Date().toISOString();
                const addRequest = objectStore.add(doc);

                addRequest.onsuccess = () => resolve({ id, ...doc });
                addRequest.onerror = () => reject(addRequest.error);
            }
        };

        getRequest.onerror = () => reject(getRequest.error);
    });
};

/**
 * Update document
 */
export const updateDoc = async (collection, id, updates) => {
    await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([collection], 'readwrite');
        const objectStore = transaction.objectStore(collection);

        const getRequest = objectStore.get(id);

        getRequest.onsuccess = () => {
            const existing = getRequest.result;

            if (!existing) {
                reject(new Error('Document not found'));
                return;
            }

            const updated = {
                ...existing,
                ...updates,
                id,
                createdAt: existing.createdAt,
                updatedAt: new Date().toISOString(),
            };

            const updateRequest = objectStore.put(updated);

            updateRequest.onsuccess = () => resolve({ id, ...updated });
            updateRequest.onerror = () => reject(updateRequest.error);
        };

        getRequest.onerror = () => reject(getRequest.error);
    });
};

/**
 * Conditional update with optimistic locking
 * Updates document only if condition matches current state
 * @param {string} collection - Collection name
 * @param {string} id - Document ID
 * @param {object} updates - Updates to apply
 * @param {object} condition - Condition that must match (e.g., { version: 1, status: 'pending' })
 * @returns {Promise<{success: boolean, doc?: object, error?: string}>}
 */
export const conditionalUpdate = async (collection, id, updates, condition) => {
    await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([collection], 'readwrite');
        const objectStore = transaction.objectStore(collection);

        const getRequest = objectStore.get(id);

        getRequest.onsuccess = () => {
            const existing = getRequest.result;

            if (!existing) {
                resolve({ success: false, error: 'Document not found' });
                return;
            }

            // Check if all conditions match
            const conditionsMet = Object.keys(condition).every(key => {
                return existing[key] === condition[key];
            });

            if (!conditionsMet) {
                resolve({ success: false, error: 'Condition not met', doc: existing });
                return;
            }

            // Conditions met, apply update
            const updated = {
                ...existing,
                ...updates,
                id,
                createdAt: existing.createdAt,
                updatedAt: new Date().toISOString(),
            };

            const updateRequest = objectStore.put(updated);

            updateRequest.onsuccess = () => {
                resolve({ success: true, doc: { id, ...updated } });
            };

            updateRequest.onerror = () => {
                reject(updateRequest.error);
            };
        };

        getRequest.onerror = () => reject(getRequest.error);
    });
};

/**
 * Atomic increment operation
 * @param {string} collection - Collection name
 * @param {string} id - Document ID
 * @param {string} field - Field to increment
 * @param {number} amount - Amount to increment by (default: 1)
 * @returns {Promise<object>} Updated document
 */
export const atomicIncrement = async (collection, id, field, amount = 1) => {
    await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([collection], 'readwrite');
        const objectStore = transaction.objectStore(collection);

        const getRequest = objectStore.get(id);

        getRequest.onsuccess = () => {
            const existing = getRequest.result;

            if (!existing) {
                reject(new Error('Document not found'));
                return;
            }

            const currentValue = existing[field] || 0;
            const updated = {
                ...existing,
                [field]: currentValue + amount,
                updatedAt: new Date().toISOString(),
            };

            const updateRequest = objectStore.put(updated);

            updateRequest.onsuccess = () => resolve({ id, ...updated });
            updateRequest.onerror = () => reject(updateRequest.error);
        };

        getRequest.onerror = () => reject(getRequest.error);
    });
};

/**
 * Get document by ID
 */
export const getDoc = async (collection, id) => {
    await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([collection], 'readonly');
        const objectStore = transaction.objectStore(collection);
        const request = objectStore.get(id);

        request.onsuccess = () => {
            resolve(request.result || null);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
};

/**
 * Get all documents from collection
 */
export const getDocs = async (collection) => {
    await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([collection], 'readonly');
        const objectStore = transaction.objectStore(collection);
        const request = objectStore.getAll();

        request.onsuccess = () => {
            resolve(request.result || []);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
};

/**
 * Query documents by index
 */
export const queryDocs = async (collection, indexName, value) => {
    await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([collection], 'readonly');
        const objectStore = transaction.objectStore(collection);
        const index = objectStore.index(indexName);
        const request = index.getAll(value);

        request.onsuccess = () => {
            resolve(request.result || []);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
};

/**
 * Delete document
 */
export const deleteDoc = async (collection, id) => {
    await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([collection], 'readwrite');
        const objectStore = transaction.objectStore(collection);
        const request = objectStore.delete(id);

        request.onsuccess = () => {
            resolve(true);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
};

/**
 * Clear all data from collection
 */
export const clearCollection = async (collection) => {
    await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([collection], 'readwrite');
        const objectStore = transaction.objectStore(collection);
        const request = objectStore.clear();

        request.onsuccess = () => {
            resolve(true);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
};

/**
 * Clear entire database
 */
export const clearDatabase = async () => {
    await initDB();

    const promises = Object.values(COLLECTIONS).map(collection =>
        clearCollection(collection)
    );

    return Promise.all(promises);
};

/**
 * Export database (for backup)
 */
export const exportDatabase = async () => {
    await initDB();

    const data = {};

    for (const collection of Object.values(COLLECTIONS)) {
        data[collection] = await getDocs(collection);
    }

    return data;
};

/**
 * Import database (from backup)
 */
export const importDatabase = async (data) => {
    await initDB();

    for (const [collection, docs] of Object.entries(data)) {
        if (COLLECTIONS[collection.toUpperCase()]) {
            await clearCollection(collection);

            for (const doc of docs) {
                await setDoc(collection, doc.id, doc);
            }
        }
    }

    return true;
};
