import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, X } from 'lucide-react';

const AnnouncementBanner = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [hidden, setHidden] = useState(() => JSON.parse(localStorage.getItem('moo_hidden_announcements') || '[]'));

    const handleHide = (id) => {
        const newHidden = [...hidden, id];
        setHidden(newHidden);
        localStorage.setItem('moo_hidden_announcements', JSON.stringify(newHidden));
        
    };

    useEffect(() => {
        const update = () => {
            const all = JSON.parse(localStorage.getItem('moo_announcements') || '[]');
            const now = new Date();
            setAnnouncements(all.filter(a => {
                if (a.target !== 'all' && a.target !== 'students') return false;
                if (a.startDate && new Date(a.startDate) > now) return false;
                if (a.endDate && new Date(a.endDate) < now) return false;
                return true;
            }));
        };

        update();
        window.addEventListener('storage', update);
        window.addEventListener('moo-sync', update);

        return () => {
            window.removeEventListener('storage', update);
            window.removeEventListener('moo-sync', update);
        };
    }, []);

    return (
        <AnimatePresence>
            {announcements.filter(a => !hidden.includes(a.id)).map(ann => (
                <motion.div key={ann.id}
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, height: 0 }}
                    className={`p-4 sm:p-5 rounded-[32px] shadow-sm border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${ann.priority === 'high'
                            ? 'bg-red-50/90 border-red-200 text-red-900'
                            : 'bg-blue-50/90 border-blue-200 text-blue-900'
                        }`}
                >
                    <div className="flex items-start sm:items-center gap-4">
                        <div className={`p-3.5 rounded-2xl shrink-0 ${ann.priority === 'high' ? 'bg-red-100' : 'bg-blue-100'}`}>
                            <Megaphone size={26} className={ann.priority === 'high' ? 'text-red-600 animate-pulse' : 'text-blue-600'} />
                        </div>
                        <div>
                            <p className="font-black text-sm mb-1">{ann.priority === 'high' ? 'تنبيه إداري عاجل:' : 'إعلان مدرسي هام:'}</p>
                            <p className="font-bold text-sm leading-relaxed opacity-90">{ann.text}</p>
                        </div>
                    </div>
                    <button onClick={() => handleHide(ann.id)}
                        className={`p-2.5 rounded-xl self-end sm:self-auto shrink-0 ${ann.priority === 'high' ? 'bg-red-100/50 hover:bg-red-200 text-red-700' : 'bg-blue-100/50 hover:bg-blue-200 text-blue-700'
                            }`}>
                        <X size={20} />
                    </button>
                </motion.div>
            ))}
        </AnimatePresence>
    );
};

export default AnnouncementBanner;
AnnouncementBanner.propTypes = {};
