import React from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';

const GlassScheduleTable = ({ timeSlots = [], days = [], title, subtitle, onClose, renderDayLabel, renderCell }) => {
  // 🔥 الحماية الأساسية: بنأكد على المتصفح إن دي مصفوفات حتى لو الداتا اتأخرت
  const safeTimeSlots = timeSlots || [];
  const safeDays = days || [];

  return (
    <div className="fixed inset-0 z-[1000] bg-gray-950/95 backdrop-blur-2xl flex flex-col overflow-hidden animate-fade-in">
      <div className="p-8 border-b border-white/10 flex justify-between items-center bg-black/40">
        <div className="text-right pr-6">
          <h2 className="text-3xl md:text-5xl font-black text-white drop-shadow-lg">{title}</h2>
          <p className="text-white/40 font-bold text-sm mt-2">{subtitle}</p>
        </div>
        <button onClick={onClose} className="bg-red-500/20 hover:bg-red-500 text-white p-4 rounded-[24px] border border-red-500/50 transition-all shadow-2xl">
          <X size={32} />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6 lg:p-10">
        <div className="min-w-max w-full bg-white/5 rounded-[48px] border border-white/10 overflow-hidden shadow-2xl">
          <div className="grid w-full" style={{ gridTemplateColumns: `160px repeat(${safeTimeSlots.length}, 1fr)` }}>

            {/* التوقيت فوق بالعرض */}
            <div className="bg-black/60 h-20 flex items-center justify-center border-b border-l border-white/10 text-white/20 font-black text-xs uppercase tracking-widest">
              الزمان \ اليوم
            </div>
            {safeTimeSlots.map((time) => (
              <div key={time} className="bg-black/40 h-20 flex items-center justify-center border-b border-l border-white/10">
                <span className="text-blue-400 font-mono font-black text-2xl tracking-tighter drop-shadow-sm">{time}</span>
              </div>
            ))}

            {/* الأيام تحت بعض على اليمين */}
            {safeDays.map((day) => (
              <React.Fragment key={day}>
                <div className="bg-black/20 h-28 flex items-center justify-center border-b border-l border-white/10 sticky right-0 z-20 backdrop-blur-md">
                  {renderDayLabel ? renderDayLabel(day) : <span className="text-white font-black text-lg">{day}</span>}
                </div>
                {/* خلايا الحصص */}
                {safeTimeSlots.map((time) => (
                  <div key={`${day}-${time}`} className="h-28 border-b border-l border-white/5 p-2 bg-transparent hover:bg-white/5 transition-colors">
                    {renderCell(day, time)}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(GlassScheduleTable);
GlassScheduleTable.propTypes = { timeSlots: PropTypes.array, days: PropTypes.array, title: PropTypes.string, subtitle: PropTypes.string, onClose: PropTypes.func, renderDayLabel: PropTypes.func, renderCell: PropTypes.func };
