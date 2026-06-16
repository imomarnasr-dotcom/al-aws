import React, { useState } from 'react';
import { saveDoc, getAllDocs } from '../services/dbService';

const DataMigration = () => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [status, setStatus] = useState('');

  const collections = [
    { localKey: 'moo_whitelist', cloudCollection: 'whitelist' },
    { localKey: 'moo_staff', cloudCollection: 'staff' },
    { localKey: 'moo_classes', cloudCollection: 'classes' },
    { localKey: 'moo_schedule', cloudCollection: 'schedule' },
    { localKey: 'moo_attendance', cloudCollection: 'attendance' },
    { localKey: 'moo_grades', cloudCollection: 'grades' },
    { localKey: 'moo_cafeteria_menu', cloudCollection: 'cafeteria_menu' },
    { localKey: 'moo_cafeteria_orders', cloudCollection: 'cafeteria_orders' },
    { localKey: 'moo_wallets', cloudCollection: 'wallets' },
    { localKey: 'moo_wallet_transactions', cloudCollection: 'wallet_transactions' },
    { localKey: 'moo_complaints', cloudCollection: 'complaints' },
    { localKey: 'moo_announcements', cloudCollection: 'announcements' },
    { localKey: 'moo_global_notifications', cloudCollection: 'global_notifications' },
    { localKey: 'moo_parent_notifications', cloudCollection: 'parent_notifications' },
    { localKey: 'moo_behavior_logs', cloudCollection: 'behavior_logs' },
    { localKey: 'moo_achievements', cloudCollection: 'achievements' },
    { localKey: 'moo_tests', cloudCollection: 'tests' },
    { localKey: 'GLOBAL_ACADEMIC_MASTER', cloudCollection: 'academic_master' }
  ];

  const handleMigration = async () => {
    setIsMigrating(true);
    setStatus('بدأ الترحيل إلى السحابة...');
    
    try {
      for (const item of collections) {
        setStatus(`جاري ترحيل ${item.localKey}...`);
        
        let dataStr = localStorage.getItem(item.localKey);
        if (!dataStr) continue;

        let parsedData;
        try {
          parsedData = JSON.parse(dataStr);
        } catch (e) {
          continue;
        }

        // Determine how to save based on data type
        if (Array.isArray(parsedData)) {
          // If it's an array, save each item as a separate document
          for (let i = 0; i < parsedData.length; i++) {
            const obj = parsedData[i];
            const docId = obj.id ? String(obj.id) : `doc_${i}`;
            await saveDoc(item.cloudCollection, docId, obj);
          }
        } else if (typeof parsedData === 'object' && parsedData !== null) {
          // If it's an object (like wallets mapping), save it as one document or key-value pairs
          // For simplicity, save the whole object as a single document named "all"
          await saveDoc(item.cloudCollection, "all_data", parsedData);
        }
      }
      
      setStatus('✅ اكتمل ترحيل جميع البيانات بنجاح!');
    } catch (error) {
      console.error(error);
      setStatus('❌ حدث خطأ أثناء الترحيل. راجع الـ Console.');
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 my-6 text-center shadow-sm max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-blue-800 mb-2">أداة ترحيل البيانات للسحابة (Cloud Migration)</h2>
      <p className="text-sm text-blue-600 mb-6">
        هذه الأداة تقوم بنسخ جميع البيانات الموجودة حالياً على هذا الجهاز (الذاكرة المحلية) ونقلها إلى قاعدة بيانات Firebase السحابية لتصبح متاحة لجميع الأجهزة.
      </p>
      <button 
        onClick={handleMigration}
        disabled={isMigrating}
        className={`px-6 py-3 rounded-xl font-bold text-white transition-all shadow-md ${isMigrating ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {isMigrating ? 'جاري الترحيل...' : 'بدأ ترحيل البيانات الآن ☁️'}
      </button>
      {status && (
        <div className="mt-4 p-3 bg-white rounded-lg text-sm font-bold text-gray-700 border border-gray-100 shadow-sm inline-block">
          {status}
        </div>
      )}
    </div>
  );
};

export default DataMigration;
