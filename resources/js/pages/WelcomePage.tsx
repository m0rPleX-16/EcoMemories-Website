import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import {
    Leaf,
    Recycle,
    Camera,
    Award,
    ArrowUpRight,
    Loader2,
    Sparkles,
    Check,
    QrCode,
} from 'lucide-react';

export default function WelcomePage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const startSession = async () => {
        setLoading(true);
        try {
            const { data } = await api.post('/sessions');
            if (data.success) {
                navigate(`/session/${data.session.session_code}`);
            }
        } catch (err) {
            console.error('Failed to create session:', err);
            setLoading(false);
        }
    };

    return (
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-14 max-w-5xl mx-auto w-full">
            {/* Hero Section */}
            <div className="text-center max-w-3xl animate-fade-in-up">
                {/* Top Monospace Tag (BuildAI School Style) */}
                <div className="mb-5 inline-flex items-center gap-2">
                    <span className="pill-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        01 RECYCLE TO CAPTURE
                    </span>
                    <span className="pill-gold">
                        4-POSE PHOTOSTRIP
                    </span>
                </div>

                {/* Main Headline (High-Contrast Serif with Italic Gold Accent) */}
                <h1 className="text-4xl sm:text-6xl font-normal leading-[1.15] mb-5 text-[#0E3E2B]">
                    Deposit 5 recyclables.{' '}
                    <span className="highlight-gold block sm:inline">
                        Capture 4 memories.
                    </span>
                </h1>

                {/* Subtitle / Description */}
                <p className="text-base sm:text-lg text-[#52635C] mb-8 max-w-xl mx-auto leading-relaxed">
                    Turn plastic bottles and aluminum cans into a personalized keepsake photostrip. An automated reward station designed to celebrate everyday environmental action.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in-up stagger-1">
                    <button
                        id="start-session-btn"
                        onClick={startSession}
                        disabled={loading}
                        className="btn-primary text-base px-8 py-3.5 w-full sm:w-auto"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin text-[#FAF8F5]" />
                                <span>Initiating Station...</span>
                            </>
                        ) : (
                            <>
                                <span>Start Photobooth Session</span>
                                <ArrowUpRight className="w-4 h-4 text-[#D4AF37]" />
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* 3-Step Experience (Bento Grid Inspired by BuildAI School) */}
            <div className="mt-16 w-full animate-fade-in-up stagger-2">
                <div className="flex items-center justify-between border-b border-[#E8E3D5] pb-3 mb-6">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#0E3E2B] tracking-wider uppercase">
                            02 THE EXPERIENCE
                        </span>
                    </div>
                    <span className="font-mono text-xs text-[#83948C] uppercase">
                        3 SIMPLE STEPS
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Step 1 */}
                    <div className="editorial-card p-6 flex flex-col justify-between group">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <span className="font-mono text-xs font-bold text-[#C5A059] tracking-widest">
                                    STEP 01
                                </span>
                                <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E8E3D5] flex items-center justify-center text-[#0E3E2B]">
                                    <Recycle className="w-4 h-4 text-emerald-700" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-[#0E3E2B] mb-2 font-serif-editorial">
                                Deposit 5 Items
                            </h3>
                            <p className="text-xs sm:text-sm text-[#52635C] leading-relaxed">
                                Place plastic bottles or beverage cans into the smart intake slot. Hardware sensors log valid items in real-time.
                            </p>
                        </div>
                        <div className="mt-5 pt-3 border-t border-[#F4EFE6] flex items-center gap-1.5 text-[11px] font-mono text-[#83948C]">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>AUTOMATED WEIGHT VALIDATION</span>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="editorial-card p-6 flex flex-col justify-between group">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <span className="font-mono text-xs font-bold text-[#C5A059] tracking-widest">
                                    STEP 02
                                </span>
                                <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E8E3D5] flex items-center justify-center text-[#0E3E2B]">
                                    <Award className="w-4 h-4 text-[#D4AF37]" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-[#0E3E2B] mb-2 font-serif-editorial">
                                Unlock Booth Credit
                            </h3>
                            <p className="text-xs sm:text-sm text-[#52635C] leading-relaxed">
                                Once 5 items are accepted, a complimentary photobooth credit token unlocks instantly with celebratory audio-visual cues.
                            </p>
                        </div>
                        <div className="mt-5 pt-3 border-t border-[#F4EFE6] flex items-center gap-1.5 text-[11px] font-mono text-[#83948C]">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            <span>INSTANT REWARD ENGINE</span>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="editorial-card p-6 flex flex-col justify-between group">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <span className="font-mono text-xs font-bold text-[#C5A059] tracking-widest">
                                    STEP 03
                                </span>
                                <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E8E3D5] flex items-center justify-center text-[#0E3E2B]">
                                    <Camera className="w-4 h-4 text-emerald-700" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-[#0E3E2B] mb-2 font-serif-editorial">
                                4-Pose Souvenir
                            </h3>
                            <p className="text-xs sm:text-sm text-[#52635C] leading-relaxed">
                                Strike 4 poses with automated countdown cues. Choose from 4 artisan themes and download or scan your QR code.
                            </p>
                        </div>
                        <div className="mt-5 pt-3 border-t border-[#F4EFE6] flex items-center gap-1.5 text-[11px] font-mono text-[#83948C]">
                            <QrCode className="w-3 h-3 text-emerald-600" />
                            <span>DIGITAL + HIGH-RES EXPORT</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Featured Manifesto / Value Banner (BuildAI School Dark Accent Box) */}
            <div className="mt-12 w-full dark-forest-card p-8 sm:p-10 animate-fade-in-up stagger-3 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center sm:text-left">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-[#D4AF37] font-mono text-[10px] tracking-wider uppercase font-semibold">
                        <Leaf className="w-3 h-3" />
                        <span>ZERO-WASTE REWARD SYSTEM</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-serif-editorial text-[#F4EFE6]">
                        Every bottle recycled is a <span className="italic text-[#D4AF37]">memory preserved.</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-[#FAF8F5]/70 max-w-lg leading-relaxed">
                        EcoMemories bridges environmental stewardship with social enjoyment, incentivizing clean communities one smile at a time.
                    </p>
                </div>
                <button
                    onClick={startSession}
                    className="btn-gold whitespace-nowrap text-sm px-6 py-3"
                >
                    <span>Get Started</span>
                    <ArrowUpRight className="w-4 h-4" />
                </button>
            </div>
        </main>
    );
}
