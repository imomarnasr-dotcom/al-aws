import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ToggleLeft, ToggleRight, UserCheck, Camera, AlertTriangle, Calendar } from 'lucide-react';
import CameraScanner from './CameraScanner';
import { isWorkingDay } from '../utils/dataManager';

const AdminDailyScanner = () => {
  const [autoMode, setAutoMode] = useState(() => {
    return JSON.parse(localStorage.getItem('moo_auto_attendance_enabled') || 'false');
  });

  const toggleAutoMode = () => {
    const newVal = !autoMode;
    setAutoMode(newVal);
    localStorage.setItem('moo_auto_attendance_enabled', JSON.stringify(newVal));
  };

  const calculateDailyAttendance = () => {
    const _d = new Date();
    const today = `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, '0')}-${String(_d.getDate()).padStart(2, '0')}`;
    const attendanceHistory = JSON.parse(localStorage.getItem('moo_attendance') || '{}');
    const whitelist = JSON.parse(localStorage.getItem('moo_whitelist') || '[]');
    
    const studentAbsences = {};
    whitelist.filter(s => !s.isExempted).forEach(s => { studentAbsences[s.id] = { student: s, missedCount: 0, missedClasses: [] }; });
    
    Object.entries(attendanceHistory).forEach(([key, record]) => {
      if (key.endsWith('_' + today)) {
        const className = key.split('_')[0];
        Object.entries(record).forEach(([studentId, status]) => {
          if (status === 'غائب') {
            if (studentAbsences[studentId]) {
              studentAbsences[studentId].missedCount++;
              studentAbsences[studentId].missedClasses.push(className);
            }
          }
        });
      }
    });
    
    return Object.values(studentAbsences).filter(s => s.missedCount > 0);
  };

  const getDiscrepancies = () => {
    if (autoMode) return []; // Discrepancies only apply when using Camera Mode
    
    const _d = new Date();
    const today = `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, '0')}-${String(_d.getDate()).padStart(2, '0')}`;
    const manualAttendance = JSON.parse(localStorage.getItem('moo_daily_attendance_manual') || '{}')[today] || {};
    const attendanceHistory = JSON.parse(localStorage.getItem('moo_attendance') || '{}');
    const whitelist = JSON.parse(localStorage.getItem('moo_whitelist') || '[]');

    const discrepancies = [];

    // Find students who are NOT in manualAttendance (missed the scanner)
    whitelist.filter(s => !s.isExempted).forEach(student => {
      if (!manualAttendance[student.id]) {
        // Did they attend any class?
        const attendedClasses = [];
        Object.entries(attendanceHistory).forEach(([key, record]) => {
          if (key.endsWith('_' + today)) {
            const className = key.split('_')[0];
            const status = record[student.id];
            if (status === 'حاضر' || status === 'حضور' || status === '') {
              attendedClasses.push(className);
            }
          }
        });

        if (attendedClasses.length > 0) {
          discrepancies.push({
            student,
            classes: attendedClasses
          });
        }
      }
    });

    return discrepancies;
  };

  const todayAbsencesData = calculateDailyAttendance();
  const discrepancies = getDiscrepancies();
  const _d = new Date();
  const todayDate = `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, '0')}-${String(_d.getDate()).padStart(2, '0')}`;
  const isHoliday = !isWorkingDay(todayDate);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm text-right">
      <div className="mb-10 flex justify-between items-center">
        <div>
          <h3 className="text-3xl font-black text-gray-900 flex items-center gap-3 mb-2">
            <Camera className="text-emerald-600" /> الماسح الذكي (الغياب اليومي)
          </h3>
          <p className="text-gray-500 font-bold">إدارة حضور الطلاب في الصباح وتجميع الغياب الكلي والجزئي.</p>
        </div>
      </div>

      {isHoliday ? (
        <div className="bg-emerald-50 border border-emerald-100 rounded-[32px] p-12 text-center mb-12 animate-in fade-in zoom-in duration-500">
          <Calendar className="text-emerald-500 mx-auto mb-6" size={64} />
          <h4 className="text-2xl font-black text-emerald-900 mb-2">اليوم إجازة رسمية (أو نهاية أسبوع)</h4>
          <p className="text-emerald-700 font-bold">الماسح الذكي للطلاب وتجميع الغياب متوقفان اليوم.</p>
        </div>
      ) : (
        <>
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-[32px] p-8 border border-indigo-100 mb-12">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h4 className="text-xl font-black text-indigo-900 mb-2">تفعيل التجميع التلقائي (الاعتماد على الحصص)</h4>
            <p className="text-sm text-indigo-700/80 font-bold w-5/6 leading-relaxed">
              عند التفعيل: سيتم إغلاق كاميرا الصباح، وسيعتمد النظام على غياب الحصص (1-3 حصص = غياب جزئي 🟡، 4 فأكثر = غياب كلي 🔴).
              <br/>
              عند التعطيل: سيتم فتح الماسح لطلاب المدارس واستخدام الكاميرا لتسجيل الغياب في الصباح.
            </p>
          </div>
          <button onClick={toggleAutoMode} className={`p-2 rounded-2xl transition-all ${autoMode ? 'text-indigo-600 bg-indigo-100' : 'text-gray-400 bg-gray-100'}`}>
            {autoMode ? <ToggleRight size={48} /> : <ToggleLeft size={48} />}
          </button>
        </div>
      </div>

      {autoMode ? (
        <div className="bg-amber-50/50 border border-amber-100 rounded-[32px] p-8 mb-12">
          <h4 className="text-xl font-black text-amber-900 mb-6 flex items-center gap-3">
            <UserCheck className="text-amber-500" /> لوحة التجميع اللحظي (غياب كلي وجزئي)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayAbsencesData.map((data, idx) => {
              const isPartial = data.missedCount > 0 && data.missedCount < 4;
              return (
                <div key={idx} className={`p-4 rounded-2xl border ${isPartial ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
                  <p className="font-black text-gray-900">{data.student.name}</p>
                  <p className="text-xs font-bold text-gray-500 mt-1">{data.student.className} | {data.student.id}</p>
                  <div className={`mt-3 inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${isPartial ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                    {isPartial ? `🟡 غياب جزئي (${data.missedCount} حصص)` : `🔴 غياب كلي (${data.missedCount} حصص)`}
                  </div>
                </div>
              );
            })}
            {todayAbsencesData.length === 0 && (
               <p className="text-gray-500 font-bold col-span-3 text-center py-6">الجميع حاضر بالكامل اليوم 🟢</p>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-12">
           <CameraScanner />
        </div>
      )}
        </>
      )}
    </motion.div>
  );
};

export default AdminDailyScanner;
