import { useEffect, useRef } from 'react';
import { db } from '../config/firebase';
import { collection, doc, setDoc, onSnapshot, writeBatch, getDocs } from 'firebase/firestore';
import appStorage from '../utils/appStorage';

// Small settings that don't need partitioning
const GENERAL_KEYS = [
  'GLOBAL_ACADEMIC_MASTER', 'exams', 'moo_admin_credentials', 'moo_announcements',
  'moo_auto_attendance_enabled', 'moo_cafeteria_menu', 'moo_cafeteria_orders',
  'moo_cart', 'moo_complaints', 'moo_dismissed_results', 'moo_exams_migrated',
  'moo_global_schedule', 'moo_grace_periods', 'moo_graduates', 'moo_hidden_announcements',
  'moo_holidays', 'moo_notifications', 'moo_paper_exam_archive', 'moo_paper_exam_grades',
  'moo_phases', 'moo_pinned_badges', 'moo_question_bank',
  'moo_saturday_enabled', 'moo_school_vault', 'moo_spent_points', 'moo_staff',
  'moo_store_purchases', 'moo_tests', 'moo_truancy_penalized',
  'moo_wallet_transactions', 'moo_young_classes', 'schoolMasterSchedule',
  'schoolTemplate', 'moo_attendance_periods'
];

// Keys that will be split into their own separate collections for infinite scaling
const PARTITIONED_COLLECTIONS = {
  'moo_whitelist': 'students',
  'moo_attendance': 'attendance',
  'moo_daily_attendance_manual': 'manual_attendance',
  'moo_grades': 'grades',
  'moo_wallets': 'wallets',
  'moo_behavior_logs': 'behavior_logs',
  'moo_achievements': 'achievements',
  'moo_student_notifications': 'student_notifications',
  'moo_parent_notifications': 'parent_notifications'
};

export default function CloudSyncV3({ onReady }) {
  const isSyncingFromCloud = useRef(true);
  const localCache = useRef({});
  const debounceTimers = useRef({});
  const debounceOldValues = useRef({});

  useEffect(() => {
    let unsubs = [];
    let loadedCount = 0;
    const totalCollectionsToLoad = 1 + Object.keys(PARTITIONED_COLLECTIONS).length; // 1 general + partitioned

    const checkReady = () => {
      loadedCount++;
      if (loadedCount === totalCollectionsToLoad) {
        isSyncingFromCloud.current = false;
        onReady && onReady();
      }
    };

    // 1. Subscribe to General Keys
    const genUnsub = onSnapshot(collection(db, 'system_v3_general'), (snapshot) => {
      if (snapshot.empty && isSyncingFromCloud.current) {
         // Fallback/Seed from localStorage on first run
         GENERAL_KEYS.forEach(k => {
           const val = localStorage.getItem(k);
           if (val) setDoc(doc(db, 'system_v3_general', k), { value: val }, { merge: true });
         });
      }

      let changed = false;
      snapshot.docChanges().forEach(change => {
        if (change.doc.metadata.hasPendingWrites && !isSyncingFromCloud.current) return;
        const key = change.doc.id;
        const val = change.doc.data().value;
        if (appStorage.getItem(key) !== val) {
          appStorage.seed(key, val);
          localCache.current[key] = val;
          changed = true;
        }
      });
      if (changed && !isSyncingFromCloud.current) {
        window.dispatchEvent(new CustomEvent('moo-sync'));
        window.dispatchEvent(new Event('storage'));
      }
      if (isSyncingFromCloud.current) checkReady();
    });
    unsubs.push(genUnsub);

    // 2. Subscribe to Partitioned Collections
    Object.entries(PARTITIONED_COLLECTIONS).forEach(([storageKey, collName]) => {
      const unsub = onSnapshot(collection(db, `system_v3_${collName}`), (snapshot) => {
        const isArray = storageKey === 'moo_whitelist';
        
        if (snapshot.empty && isSyncingFromCloud.current) {
           // Seed from localStorage
           const val = localStorage.getItem(storageKey);
           if (val) pushToCloud(storageKey, val, collName);
        }

        let currentLocal = undefined;
        try { currentLocal = JSON.parse(appStorage.getItem(storageKey) || (isArray ? '[]' : '{}')); } catch(e) { currentLocal = isArray ? [] : {}; }
        
        let changed = false;
        
        snapshot.docChanges().forEach(change => {
          if (change.doc.metadata.hasPendingWrites && !isSyncingFromCloud.current) return;
          const docId = change.doc.id;
          const data = change.doc.data();
          
          if (change.type === 'added' || change.type === 'modified') {
             if (isArray) {
                const idx = currentLocal.findIndex(item => String(item.id || item.key) === String(docId));
                if (idx > -1) currentLocal[idx] = data;
                else currentLocal.push(data);
             } else {
                currentLocal[docId] = data.value !== undefined ? data.value : data;
             }
             changed = true;
          } else if (change.type === 'removed') {
             if (isArray) {
                currentLocal = currentLocal.filter(item => String(item.id || item.key) !== String(docId));
             } else {
                delete currentLocal[docId];
             }
             changed = true;
          }
        });

        if (changed || isSyncingFromCloud.current) {
          const newVal = JSON.stringify(currentLocal);
          appStorage.seed(storageKey, newVal);
          localCache.current[storageKey] = newVal;
        }

        if (changed && !isSyncingFromCloud.current) {
          window.dispatchEvent(new CustomEvent('moo-sync'));
          window.dispatchEvent(new Event('storage'));
        }

        if (isSyncingFromCloud.current) checkReady();
      });
      unsubs.push(unsub);
    });

    // 3. Listen to our custom 'appStorage-updated' event to push local changes to Firebase
    const handleLocalUpdate = (e) => {
      if (isSyncingFromCloud.current) return;
      const { key, value } = e.detail;

      if (localCache.current[key] === value) return; // No real change
      
      // Capture the old value only if this is the start of a new burst
      if (!debounceTimers.current[key]) {
        debounceOldValues.current[key] = localCache.current[key];
      }
      
      localCache.current[key] = value;

      if (debounceTimers.current[key]) clearTimeout(debounceTimers.current[key]);

      debounceTimers.current[key] = setTimeout(() => {
        pushToCloud(key, value, PARTITIONED_COLLECTIONS[key], debounceOldValues.current[key]);
        delete debounceTimers.current[key];
      }, 1500); // Debounce
    };

    const handleHardReset = async () => {
      try {
        const collectionsToClear = [
          'system_v3_students', 'system_v3_attendance', 'system_v3_manual_attendance', 
          'system_v3_grades', 'system_v3_wallets', 'system_v3_behavior_logs', 
          'system_v3_achievements', 'system_v3_student_notifications', 'system_v3_parent_notifications',
          'system_v3_general'
        ];
        
        for (const coll of collectionsToClear) {
          const snap = await getDocs(collection(db, coll));
          const chunks = chunkArray(snap.docs, 450);
          for (const chunk of chunks) {
            const batch = writeBatch(db);
            chunk.forEach(docSnap => batch.delete(docSnap.ref));
            await batch.commit();
          }
        }
        
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('moo_') || key === 'GLOBAL_ACADEMIC_MASTER' || key === 'exams') {
            if (key !== 'moo_admin_credentials') {
               localStorage.removeItem(key);
            }
          }
        });
        
        window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: 'تم إعادة تهيئة النظام بالكامل بنجاح', type: 'success' }}));
        setTimeout(() => window.location.reload(), 1500);
      } catch (e) {
        console.error("Factory Reset Error:", e);
        window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: 'حدث خطأ أثناء مسح قاعدة البيانات', type: 'error' }}));
      }
    };

    window.addEventListener('appStorage-updated', handleLocalUpdate);
    window.addEventListener('moo-hard-factory-reset', handleHardReset);

    return () => {
      unsubs.forEach(u => u());
      window.removeEventListener('appStorage-updated', handleLocalUpdate);
      window.removeEventListener('moo-hard-factory-reset', handleHardReset);
      Object.values(debounceTimers.current).forEach(clearTimeout);
    };
  }, []);

  const chunkArray = (array, size) => {
    const chunked = [];
    for (let i = 0; i < array.length; i += size) chunked.push(array.slice(i, i + size));
    return chunked;
  };

  const pushToCloud = async (key, value, collName, oldValue) => {
    try {
      if (!collName) {
        await setDoc(doc(db, 'system_v3_general', key), { value }, { merge: true });
        return;
      }

      const isArray = key === 'moo_whitelist';
      let parsed = [];
      let oldParsed = [];
      try { parsed = JSON.parse(value || (isArray ? '[]' : '{}')); } catch(e){}
      try { oldParsed = JSON.parse(oldValue || (isArray ? '[]' : '{}')); } catch(e){}
      
      let operations = [];

      if (Array.isArray(parsed)) {
        parsed.forEach(item => {
          const docId = String(item.id || item.key);
          if (!docId) return;
          const oldItem = Array.isArray(oldParsed) ? oldParsed.find(o => String(o.id || o.key) === docId) : null;
          if (JSON.stringify(oldItem) !== JSON.stringify(item)) {
            operations.push({ ref: doc(db, `system_v3_${collName}`, docId), data: item });
          }
        });
      } else {
        Object.entries(parsed).forEach(([docId, item]) => {
          if (!docId) return;
          const oldItem = oldParsed ? oldParsed[docId] : null;
          if (JSON.stringify(oldItem) !== JSON.stringify(item)) {
            const dataToSave = (typeof item === 'object' && item !== null) ? item : { value: item };
            operations.push({ ref: doc(db, `system_v3_${collName}`, String(docId)), data: dataToSave });
          }
        });
      }

      // Firestore batches support up to 500 writes. We chunk it.
      const chunks = chunkArray(operations, 450);
      for (const chunk of chunks) {
         const batch = writeBatch(db);
         chunk.forEach(op => batch.set(op.ref, op.data, { merge: true }));
         await batch.commit();
      }
    } catch (err) {
      console.error(`Error syncing ${key} to cloud:`, err);
    }
  };

  return null;
}
