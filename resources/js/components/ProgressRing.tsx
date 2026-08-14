import { Sparkles, Check } from 'lucide-react';

interface ProgressRingProps {
    progress: number; // 0 to 1
    current: number;
    total: number;
    hasCredits: boolean;
    animate?: boolean;
}

export default function ProgressRing({
    progress,
    current,
    total,
    hasCredits,
    animate,
}: ProgressRingProps) {
    const size = 190;
    const strokeWidth = 7;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - progress * circumference;

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width={size} height={size} className="-rotate-90">
                <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0E3E2B" />
                        <stop offset="100%" stopColor="#C5A059" />
                    </linearGradient>
                </defs>
                <circle
                    className="progress-ring-track"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                />
                <circle
                    className="progress-ring-fill"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={offset}
                />
            </svg>

            {/* Center Content */}
            <div
                className={`absolute inset-0 flex flex-col items-center justify-center transition-all ${
                    animate ? 'animate-scale-in' : ''
                }`}
            >
                {hasCredits ? (
                    <>
                        <div className="w-8 h-8 rounded-full bg-[#FBF3DC] border border-[#E5D6A8] flex items-center justify-center mb-1 shadow-xs">
                            <Sparkles className="w-4 h-4 text-[#C5A059]" />
                        </div>
                        <span className="text-xl font-serif-editorial italic font-bold text-[#0E3E2B]">
                            Ready to shoot!
                        </span>
                        <span className="text-[10px] font-mono tracking-widest text-[#C5A059] uppercase font-semibold">
                            1 CREDIT UNLOCKED
                        </span>
                    </>
                ) : (
                    <>
                        <span className="text-4xl font-normal font-serif-editorial text-[#0E3E2B]">
                            {current}
                        </span>
                        <span className="text-[11px] font-mono tracking-wider uppercase font-semibold text-[#83948C]">
                            OF {total} ITEMS
                        </span>
                    </>
                )}
            </div>
        </div>
    );
}
