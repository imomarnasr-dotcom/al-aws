import React from 'react';
import PropTypes from 'prop-types';

const StatCard = ({ label, value, icon, color }) => {
  return (
    <div className="glass-card rounded-3xl p-6 soft-shadow group hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
      {/* Accent Glow */}
      <div className={`absolute -top-10 -left-10 w-24 h-24 ${color} opacity-5 blur-[40px] rounded-full group-hover:scale-150 transition-transform`} />
      
      <div className="relative z-10 flex items-center gap-5">
        <div className={`w-14 h-14 rounded-2xl ${color} bg-opacity-10 flex items-center justify-center text-primary shadow-sm border border-primary/10 group-hover:scale-110 transition-transform`}>
          {React.cloneElement(icon, { size: 24, className: 'text-primary' })}
        </div>
        
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-800 font-title">{value}</p>
        </div>
      </div>
    </div>
  );
};

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.node.isRequired,
  color: PropTypes.string,
};

export default StatCard;
