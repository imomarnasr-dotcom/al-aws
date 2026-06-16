import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const CustomCursor = () => {
const [mousePosition, setMousePosition] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const [isEnabled, setIsEnabled] = useState(localStorage.getItem('moo_magic_cursor') !== 'false');

  useEffect(() => {
    const handleToggle = () => {
      setIsEnabled(localStorage.getItem('moo_magic_cursor') !== 'false');
    };
    window.addEventListener('magic_cursor_toggled', handleToggle);
    return () => window.removeEventListener('magic_cursor_toggled', handleToggle);
  }, [isEnabled]);

  useEffect(() => {
    if (!isEnabled) return;
    const updateMousePosition = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e) => {
      const target = e.target;
      // Check if hovering over clickable elements or cards
      if (
        target.tagName?.toLowerCase() === 'button' ||
        target.tagName?.toLowerCase() === 'a' ||
        target.closest('button') ||
        target.closest('a') ||
        target.classList?.contains('glass-card') ||
        target.closest('.glass-card')
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', updateMousePosition);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [isEnabled]);

  if (!isEnabled) return null;

  return (
    <>
      {/* Outer Hollow Circle */}
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 rounded-full pointer-events-none z-[9998]"
        style={{
          border: '2px solid var(--primary-color)',
          backgroundColor: isHovering ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent',
          boxShadow: isHovering ? '0 0 15px rgba(var(--primary-rgb), 0.5)' : 'none'
        }}
        animate={{
          x: mousePosition.x - 16,
          y: mousePosition.y - 16,
          scale: isHovering ? 1.5 : 1,
        }}
        transition={{
          type: 'spring',
          stiffness: 150,
          damping: 15,
          mass: 0.5,
        }}
      />
      {/* Inner Solid Ball */}
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 rounded-full pointer-events-none z-[9999]"
        style={{
          backgroundColor: 'var(--primary-color)',
          boxShadow: '0 0 8px var(--primary-color)',
        }}
        animate={{
          x: mousePosition.x - 4,
          y: mousePosition.y - 4,
          scale: isHovering ? 0 : 1, // Shrinks when hovering
        }}
        transition={{
          type: 'tween',
          ease: 'backOut',
          duration: 0.1,
        }}
      />
    </>
  );
};

export default CustomCursor;
