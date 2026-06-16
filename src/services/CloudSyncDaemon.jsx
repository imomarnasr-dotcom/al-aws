import { useEffect, useRef } from 'react';
import { db } from '../config/firebase';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';

const STORE_KEYS = [
  'GLOBAL_ACADEMIC_MASTER',
  'exams',
  'moo_achievements',
  'moo_admin_credentials',
  'moo_announcements',
  'moo_attendance',
  'moo_auto_attendance_enabled',
  'moo_behavior_logs',
  'moo_cafeteria_menu',
  'moo_cafeteria_orders',
  'moo_cart',
  'moo_complaints',
  'moo_daily_attendance_manual',
  'moo_dismissed_results',
  'moo_exams_migrated',
  'moo_global_schedule',
  'moo_grace_periods',
  'moo_grades',
  'moo_graduates',
  'moo_hidden_announcements',
  'moo_holidays',
  'moo_notifications',
  'moo_paper_exam_archive',
  'moo_paper_exam_grades',
  'moo_parent_notifications',
  'moo_phases',
  'moo_pinned_badges',
  'moo_question_bank',
  'moo_saturday_enabled',
  'moo_school_vault',
  'moo_spent_points',
  'moo_staff',
  'moo_store_purchases',
  'moo_student_notifications',
  'moo_tests',
  'moo_theme_color',
  'moo_truancy_penalized',
  'moo_wallet_transactions',
  'moo_wallets',
  'moo_whitelist',
  'moo_young_classes',
  'schoolMasterSchedule',
  'schoolTemplate'
];

export default function CloudSyncDaemon() {
  const isSyncingFromCloud = useRef(false);

  useEffect(() => {
    // 1. Listen to Firebase 'system_data_v2' collection and update LocalStorage
    const colRef = collection(db, 'system_data_v2');
    
    const unsubscribe = onSnapshot(colRef, async (snapshot) => {
      if (snapshot.empty) {
        // Firebase collection is empty! Let's upload whatever we currently have in localStorage to seed it.
        console.log('system_data_v2 is empty. Seeding from localStorage...');
        STORE_KEYS.forEach(async (key) => {
          const val = localStorage.getItem(key);
          if (val) {
            try {
              await setDoc(doc(db, 'system_data_v2', key), { value: val }, { merge: true });
            } catch (e) {
              console.error(`Seed error for ${key}:`, e);
            }
          }
        });
      } else {
        isSyncingFromCloud.current = true;
        let changed = false;

        snapshot.docChanges().forEach((change) => {
          // We process added or modified documents
          if (change.type === 'added' || change.type === 'modified') {
            const key = change.doc.id;
            if (STORE_KEYS.includes(key)) {
              const cloudVal = change.doc.data().value;
              const localVal = localStorage.getItem(key);
              
              if (localVal !== cloudVal && cloudVal !== undefined) {
                localStorage.setItem(key, cloudVal);
                changed = true;
              }
            }
          }
        });

        // Trigger the app to re-render if something changed
        if (changed) {
          window.dispatchEvent(new CustomEvent('moo-sync'));
        }
        
        setTimeout(() => {
          isSyncingFromCloud.current = false;
        }, 100);
      }
    }, (error) => {
      console.error('CloudSyncDaemon Error:', error);
    });

    // 2. Override localStorage.setItem to catch local changes and push to Firebase
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function (key, value) {
      originalSetItem.apply(this, arguments);
      
      if (!isSyncingFromCloud.current && STORE_KEYS.includes(key)) {
        // Push this specific key to its own document instantly
        setDoc(doc(db, 'system_data_v2', key), {
          value: value
        }, { merge: true }).catch(err => console.error(`Cloud Upload Error for ${key}:`, err));
      }
    };

    return () => {
      unsubscribe();
      localStorage.setItem = originalSetItem;
    };
  }, []);

  // Daemon has no UI
  return null;
}
