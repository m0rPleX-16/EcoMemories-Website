import { useEffect, useRef } from 'react';

// EcoMemories Brand Palette: Forest greens, warm golds, champagne & mint
const BRAND_COLORS = [
    '#D4AF37', // Gold Light
    '#C5A059', // Warm Gold
    '#0E3E2B', // Forest Deep
    '#1B5E43', // Forest Light
    '#10B981', // Emerald
    '#34D399', // Mint
    '#FBF3DC', // Champagne
    '#F59E0B', // Amber
];

interface Particle {
    x: number;
    y: number;
    w: number;
    h: number;
    color: string;
    vx: number;
    vy: number;
    rotation: number;
    rotationSpeed: number;
    opacity: number;
}

export default function Confetti() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        // Set canvas size with device pixel ratio for crisp rendering without lag
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = window.innerWidth;
        const height = window.innerHeight;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.scale(dpr, dpr);

        // Adjust particle count for mobile vs desktop for optimal 60fps performance
        const isMobile = width < 768;
        const particleCount = isMobile ? 45 : 75;

        // Create particles
        const particles: Particle[] = Array.from({ length: particleCount }, () => ({
            x: width * 0.5 + (Math.random() - 0.5) * width * 0.4,
            y: Math.random() * -60 - 20,
            w: (Math.random() * 6 + 6),
            h: (Math.random() * 4 + 4),
            color: BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)],
            vx: (Math.random() - 0.5) * 6,
            vy: Math.random() * 3 + 3.5,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 8,
            opacity: 1,
        }));

        let animationFrameId: number;
        let isRunning = true;

        const render = () => {
            if (!isRunning) return;

            ctx.clearRect(0, 0, width, height);
            let activeCount = 0;

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];

                // Physics update
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.12; // Gravity
                p.vx *= 0.99; // Air resistance
                p.rotation += p.rotationSpeed;

                // Fade out when reaching lower half
                if (p.y > height * 0.65) {
                    p.opacity -= 0.015;
                }

                if (p.opacity > 0 && p.y < height + 50) {
                    activeCount++;

                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate((p.rotation * Math.PI) / 180);
                    ctx.globalAlpha = Math.max(0, p.opacity);
                    ctx.fillStyle = p.color;
                    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                    ctx.restore();
                }
            }

            if (activeCount > 0) {
                animationFrameId = requestAnimationFrame(render);
            }
        };

        animationFrameId = requestAnimationFrame(render);

        return () => {
            isRunning = false;
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-50"
            style={{ width: '100vw', height: '100vh' }}
        />
    );
}
