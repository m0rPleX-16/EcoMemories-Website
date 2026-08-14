import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import type { Session as SessionType, DepositResponse } from '@/types';
import { RewardService } from '@/lib/constants';
import ProgressRing from '@/components/ProgressRing';
import Confetti from '@/components/Confetti';
import {
    Camera,
    Recycle,
    Sparkles,
    ArrowLeft,
    Loader2,
    CheckCircle2,
    History,
    ArrowUpRight,
    Leaf,
} from 'lucide-react';

export default function SessionPage() {
    const { sessionCode } = useParams<{ sessionCode: string }>();
    const navigate = useNavigate();
    const [session, setSession] = useState<SessionType | null>(null);
    const [loading, setLoading] = useState(true);
    const [depositing, setDepositing] = useState(false);
    const [depositCount, setDepositCount] = useState(0);
    const [credits, setCredits] = useState(0);
    const [showCelebration, setShowCelebration] = useState(false);
    const [recentDeposit, setRecentDeposit] = useState(false);

    const requiredDeposits = RewardService.REQUIRED_DEPOSITS;

    const fetchSession = useCallback(async () => {
        if (!sessionCode) return;
        try {
            const { data } = await api.get(`/sessions/${sessionCode}`);
            if (data.success) {
                setSession(data.session);
                setDepositCount(data.session.valid_deposits_count);
                setCredits(data.session.available_credits);
            }
        } catch (err) {
            console.error('Failed to fetch session:', err);
        } finally {
            setLoading(false);
        }
    }, [sessionCode]);

    useEffect(() => {
        fetchSession();
    }, [fetchSession]);

    const simulateDeposit = async () => {
        if (!sessionCode || depositing) return;
        setDepositing(true);
        setRecentDeposit(false);

        try {
            const { data } = await api.post<DepositResponse>(`/sessions/${sessionCode}/deposits`);
            if (data.success) {
                setDepositCount(data.session.deposits);
                setCredits(data.session.credits);
                setRecentDeposit(true);

                if (data.reward_earned) {
                    setShowCelebration(true);
                    setTimeout(() => setShowCelebration(false), 3500);
                }

                // Refresh full session data
                fetchSession();
            }
        } catch (err) {
            console.error('Failed to simulate deposit:', err);
        } finally {
            setDepositing(false);
        }
    };

    const startPhotoSession = async () => {
        if (!sessionCode) return;
        try {
            const { data } = await api.post(`/sessions/${sessionCode}/photo-sessions`);
            if (data.success) {
                navigate(`/session/${sessionCode}/camera`, {
                    state: { photoSessionId: data.photo_session.id },
                });
            }
        } catch (err) {
            console.error('Failed to start photo session:', err);
        }
    };

    if (loading) {
        return (
            <main className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-[#0E3E2B] animate-spin mx-auto mb-3" />
                    <p className="text-[#52635C] font-mono text-xs uppercase tracking-widest">
                        Connecting to session station...
                    </p>
                </div>
            </main>
        );
    }

    if (!session) {
        return (
            <main className="flex-1 flex items-center justify-center px-6">
                <div className="editorial-card p-8 text-center max-w-md">
                    <h2 className="text-2xl font-bold font-serif-editorial text-[#0E3E2B] mb-2">Session Not Found</h2>
                    <p className="text-[#52635C] text-sm mb-6">This session may have expired or does not exist.</p>
                    <button onClick={() => navigate('/')} className="btn-primary">
                        Start New Session
                    </button>
                </div>
            </main>
        );
    }

    const progressPercent = (depositCount % requiredDeposits) / requiredDeposits;
    const depositsInCurrentCycle = depositCount % requiredDeposits;

    return (
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-4xl mx-auto w-full">
            {showCelebration && <Confetti />}

            {/* Top Monospace Tag & Session Code */}
            <div className="animate-fade-in-up mb-6 flex items-center gap-2">
                <span className="pill-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    SESSION #{session.session_code}
                </span>
                <span className="pill-gold">
                    HARDWARE ACTIVE
                </span>
            </div>

            {/* Progress Ring */}
            <div className="animate-scale-in mb-6">
                <ProgressRing
                    progress={credits > 0 ? 1 : progressPercent}
                    current={credits > 0 ? requiredDeposits : depositsInCurrentCycle}
                    total={requiredDeposits}
                    hasCredits={credits > 0}
                    animate={recentDeposit}
                />
            </div>

            {/* Status Text (Editorial Headline with Italic Accent) */}
            <div className="text-center mb-8 animate-fade-in-up stagger-1 max-w-md">
                {credits > 0 ? (
                    <>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FBF3DC] border border-[#E5D6A8] text-[#8C6D1F] font-mono text-[11px] font-bold uppercase tracking-wider mb-2">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{credits} Photo Credit Available</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-serif-editorial text-[#0E3E2B] mb-2 leading-tight">
                            Reward earned.{' '}
                            <span className="highlight-gold">
                                Ready for your 4 poses.
                            </span>
                        </h2>
                        <p className="text-sm text-[#52635C]">
                            Step into the photobooth to capture your 4-shot souvenir strip.
                        </p>
                    </>
                ) : (
                    <>
                        <h2 className="text-3xl sm:text-4xl font-serif-editorial text-[#0E3E2B] mb-2 leading-tight">
                            Deposit recyclables.{' '}
                            <span className="highlight-gold">
                                Unlock booth.
                            </span>
                        </h2>
                        <p className="text-sm text-[#52635C]">
                            {depositsInCurrentCycle} of {requiredDeposits} items collected
                            {depositCount > 0 && (
                                <span className="font-mono text-xs text-[#0E3E2B] font-semibold"> • {depositCount} total</span>
                            )}
                        </p>
                    </>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 animate-fade-in-up stagger-2">
                {credits > 0 && (
                    <button
                        id="take-photo-btn"
                        onClick={startPhotoSession}
                        className="btn-gold text-base px-8 py-3.5"
                    >
                        <Camera className="w-4 h-4" />
                        <span>Enter Camera Booth (4 Shots)</span>
                        <ArrowUpRight className="w-4 h-4" />
                    </button>
                )}

                <button
                    id="simulate-deposit-btn"
                    onClick={simulateDeposit}
                    disabled={depositing}
                    className={credits > 0 ? 'btn-secondary text-sm' : 'btn-primary text-base px-8 py-3.5'}
                >
                    {depositing ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin text-[#FAF8F5]" />
                            <span>Validating Intake...</span>
                        </>
                    ) : (
                        <>
                            <Recycle className="w-4 h-4 text-emerald-600" />
                            <span>Simulate Recyclable Deposit</span>
                        </>
                    )}
                </button>
            </div>

            {/* Deposit History Log (BuildAI School Bento Style) */}
            {session.deposits && session.deposits.length > 0 && (
                <div className="mt-10 w-full max-w-md animate-fade-in-up stagger-3">
                    <div className="flex items-center justify-between border-b border-[#E8E3D5] pb-2 mb-3">
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider text-[#0E3E2B] uppercase">
                            <History className="w-3.5 h-3.5 text-[#C5A059]" />
                            <span>INTAKE LOG</span>
                        </div>
                        <span className="font-mono text-[11px] text-[#83948C]">
                            {session.deposits.length} ENTRIES
                        </span>
                    </div>

                    <div className="editorial-card p-4 space-y-2 max-h-40 overflow-y-auto">
                        {[...session.deposits].reverse().slice(0, 10).map((deposit) => (
                            <div key={deposit.id} className="flex items-center justify-between text-xs py-1 border-b border-[#F4EFE6] last:border-0">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                    <span className="text-[#14221D] font-mono text-[11px] font-medium">
                                        ITEM #{deposit.id}
                                    </span>
                                </div>
                                <span className="text-[#83948C] font-mono text-[11px]">
                                    {deposit.weight ? `${deposit.weight}g` : 'VERIFIED'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Return link */}
            <div className="mt-8 animate-fade-in-up stagger-4">
                <button
                    onClick={() => navigate('/')}
                    className="text-xs font-mono text-[#52635C] hover:text-[#0E3E2B] transition-colors flex items-center gap-1.5 uppercase tracking-wider"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Return to Station Home</span>
                </button>
            </div>
        </main>
    );
}
