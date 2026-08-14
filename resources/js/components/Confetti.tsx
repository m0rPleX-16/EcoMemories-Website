import { useMemo } from 'react';

const COLORS = ['#10b981', '#34d399', '#f59e0b', '#fbbf24', '#6ee7b7', '#a7f3d0', '#f97316'];

export default function Confetti() {
    const pieces = useMemo(() => {
        return Array.from({ length: 40 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            delay: Math.random() * 2,
            duration: 2 + Math.random() * 2,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            rotation: Math.random() * 360,
            size: 6 + Math.random() * 8,
        }));
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-50">
            {pieces.map((p) => (
                <div
                    key={p.id}
                    className="confetti-piece"
                    style={{
                        left: `${p.left}%`,
                        backgroundColor: p.color,
                        width: p.size,
                        height: p.size / 2,
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.duration}s`,
                        transform: `rotate(${p.rotation}deg)`,
                    }}
                />
            ))}
        </div>
    );
}
