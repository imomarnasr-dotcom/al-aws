import React, { useEffect, useRef } from 'react';

/**
 * ParticlesBackground — خلفية جسيمات عائمة سينمائية
 * لا تحتاج مكتبات خارجية، تعتمد على Canvas API
 */
const ParticlesBackground = ({
    count = 50,
    color = '#34D399',
    opacity = 0.12,
    speed = 0.8,
    size = { min: 2, max: 5 },
    connection = true,
    connectionDistance = 140,
    className = '',
}) => {
    const canvasRef = useRef(null);
    const particlesRef = useRef([]);
    const animationRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let width, height;

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width * window.devicePixelRatio;
            canvas.height = height * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';
        };

        resize();
        window.addEventListener('resize', resize);

        const createParticles = () => {
            particlesRef.current = [];
            for (let i = 0; i < count; i++) {
                particlesRef.current.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * speed,
                    vy: (Math.random() - 0.5) * speed,
                    radius: Math.random() * (size.max - size.min) + size.min,
                    alpha: Math.random() * opacity + 0.05,
                });
            }
        };

        createParticles();

        const drawConnection = (p1, p2) => {
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < connectionDistance) {
                const alpha = (1 - dist / connectionDistance) * 0.1;
                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.globalAlpha = alpha;
                ctx.lineWidth = 0.8;
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            particlesRef.current.forEach((p, i) => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;

                // Glow
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3);
                gradient.addColorStop(0, color);
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.globalAlpha = p.alpha * 0.25;
                ctx.fill();

                // Core
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.globalAlpha = p.alpha;
                ctx.fill();
                ctx.globalAlpha = 1;

                if (connection) {
                    for (let j = i + 1; j < particlesRef.current.length; j++) {
                        drawConnection(p, particlesRef.current[j]);
                    }
                }
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resize);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [count, color, opacity, speed, size.min, size.max, connection, connectionDistance]);

    return (
        <canvas
            ref={canvasRef}
            className={`particles-canvas ${className}`}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
                pointerEvents: 'none',
            }}
        />
    );
};

export default ParticlesBackground;