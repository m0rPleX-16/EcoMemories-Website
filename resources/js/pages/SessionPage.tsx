import { useState, useEffect, useCallback, useRef } from 'react';
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
    Usb,
} from 'lucide-react';

// ─── Bridge Integration ───────────────────────────────────────────────────────

/** Base URL of the local ESP32 hardware server. */
const BRIDGE_URL = (import.meta.env.VITE_BRIDGE_URL as string | undefined) || 'http://192.168.1.8:3333';

type HardwareStatus = 'connected' | 'offline' | 'unreachable';

/**
 * Register the active session with the local bridge (best-effort).
 * If the bridge is not running, this silently does nothing.
 */
async function registerSessionWithBridge(sessionCode: string): Promise<void> {
    try {
        const isHttps = window.location.protocol === 'https:';
        const host = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? '192.168.1.2'
            : window.location.hostname;
        const eventUrl = isHttps
            ? `${window.location.origin}/api/devices/events`
            : `http://${host}:8000/api/devices/events`;

        await fetch(`${BRIDGE_URL}/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_code: sessionCode,
                event_url: eventUrl,
            }),
            signal: AbortSignal.timeout(3000),
        });
    } catch {
        // Bridge not running — kiosk continues normally.
    }
}

/**
 * Clear the active session from the bridge (best-effort).
 */
async function clearSessionFromBridge(): Promise<void> {
    try {
        await fetch(`${BRIDGE_URL}/session`, {
            method: 'DELETE',
            signal: AbortSignal.timeout(3000),
        });
    } catch {
        // Ignore — bridge may not be running.
    }
}

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

    // Hardware status badge state
    const [hardwareStatus, setHardwareStatus] = useState<HardwareStatus>('unreachable');
    const statusPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

    // High-frequency polling (700ms during deposit collection, 2000ms once complete)
    // Ensures real-time responsiveness when physical items are inserted into the ESP32 chute
    useEffect(() => {
        if (!sessionCode || loading) return;

        const isCollecting = depositCount < requiredDeposits;
        const intervalMs = isCollecting ? 700 : 2000;

        const pollInterval = setInterval(async () => {
            try {
                const { data } = await api.get(`/sessions/${sessionCode}`);
                if (data.success) {
                    setSession(data.session);
                    const newCount = data.session.valid_deposits_count;
                    const newCredits = data.session.available_credits;

                    setDepositCount((prevCount) => {
                        if (newCount > prevCount) {
                            setRecentDeposit(true);
                            setTimeout(() => setRecentDeposit(false), 2000);
                        }
                        return newCount;
                    });

                    setCredits((prevCredits) => {
                        if (newCredits > prevCredits) {
                            setShowCelebration(true);
                            setTimeout(() => setShowCelebration(false), 3500);
                        }
                        return newCredits;
                    });
                }
            } catch {
                // Ignore transient network errors
            }
        }, intervalMs);

        return () => clearInterval(pollInterval);
    }, [sessionCode, loading, depositCount, requiredDeposits]);

    // Register / deregister session with the local hardware bridge / ESP32.
    useEffect(() => {
        if (!sessionCode || loading) return;
        registerSessionWithBridge(sessionCode);
        return () => { clearSessionFromBridge(); };
    }, [sessionCode, loading]);

    // Poll bridge / ESP32 /status every 1.5 seconds for instant local deposit sync & hardware indicator badge.
    useEffect(() => {
        if (!sessionCode) return;

        const pollStatus = async () => {
            try {
                const res = await fetch(`${BRIDGE_URL}/status`, {
                    signal: AbortSignal.timeout(1000),
                });
                if (!res.ok) { setHardwareStatus('unreachable'); return; }
                const data = await res.json();
                const isConnected = !!(data.serial_connected || data.wifi_connected || data.status === 'online');
                setHardwareStatus(isConnected ? 'connected' : 'offline');

                // Instant Local Bridge Deposit Sync (< 50ms)
                if (typeof data.deposits_this_session === 'number') {
                    setDepositCount((prevCount) => {
                        if (data.deposits_this_session > prevCount) {
                            setRecentDeposit(true);
                            setTimeout(() => setRecentDeposit(false), 2000);
                            return data.deposits_this_session;
                        }
                        return prevCount;
                    });
                }
            } catch {
                setHardwareStatus('unreachable');
            }
        };

        pollStatus();
        statusPollRef.current = setInterval(pollStatus, 1500);

        return () => {
            if (statusPollRef.current) clearInterval(statusPollRef.current);
        };
    }, [sessionCode]);

    // Kiosk safety: Auto-return to home after 3 minutes of inactivity
    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>;

        const resetInactivityTimer = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                navigate('/', { replace: true });
            }, 180000); // 3 minutes
        };

        const events = ['mousedown', 'mousemove', 'touchstart', 'keydown'];
        events.forEach((ev) => window.addEventListener(ev, resetInactivityTimer, { passive: true }));
        resetInactivityTimer();

        return () => {
            clearTimeout(timeoutId);
            events.forEach((ev) => window.removeEventListener(ev, resetInactivityTimer));
        };
    }, [navigate]);

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
            <main className="flex-1 flex items-center justify-center p-4">
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
            <main className="flex-1 flex items-center justify-center px-4 sm:px-6">
                <div className="editorial-card p-6 sm:p-8 text-center max-w-md w-full">
                    <h2 className="text-2xl font-bold font-serif-editorial text-[#0E3E2B] mb-2">Session Not Found</h2>
                    <p className="text-[#52635C] text-sm mb-6">This session may have expired or does not exist.</p>
                    <button onClick={() => navigate('/')} className="btn-primary w-full sm:w-auto">
                        Start New Session
                    </button>
                </div>
            </main>
        );
    }

    const progressPercent = (depositCount % requiredDeposits) / requiredDeposits;
    const depositsInCurrentCycle = depositCount % requiredDeposits;

    return (
        <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12 max-w-4xl mx-auto w-full">
            {showCelebration && <Confetti />}

            {/* Top Monospace Tag & Session Code */}
            <div className="animate-fade-in-up mb-5 sm:mb-6 flex items-center gap-2 flex-wrap justify-center">
                <span className="pill-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    SESSION #{session.session_code}
                </span>

                {/* Hardware status badge — reflects bridge /status poll */}
                {hardwareStatus === 'connected' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                        <Usb className="w-3 h-3" />
                        Hardware Connected
                    </span>
                )}
                {hardwareStatus === 'offline' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                        <Usb className="w-3 h-3" />
                        Hardware Offline
                    </span>
                )}
                {/* unreachable = bridge not running — show nothing, kiosk is in software-only mode */}
            </div>

            {/* Progress Ring */}
            <div className="animate-scale-in mb-5 sm:mb-6">
                <ProgressRing
                    progress={credits > 0 ? 1 : progressPercent}
                    current={credits > 0 ? requiredDeposits : depositsInCurrentCycle}
                    total={requiredDeposits}
                    hasCredits={credits > 0}
                    animate={recentDeposit}
                />
            </div>

            {/* Status Text (Editorial Headline with Italic Accent) */}
            <div className="text-center mb-6 sm:mb-8 animate-fade-in-up stagger-1 max-w-md px-2">
                {credits > 0 ? (
                    <>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FBF3DC] border border-[#E5D6A8] text-[#8C6D1F] font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-2">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{credits} Photo Credit Available</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif-editorial text-[#0E3E2B] mb-2 leading-tight">
                            Reward earned.{' '}
                            <span className="highlight-gold">
                                Ready for your 4 poses.
                            </span>
                        </h2>
                        <p className="text-xs sm:text-sm text-[#52635C]">
                            Step into the photobooth to capture your 4-shot souvenir strip.
                        </p>
                    </>
                ) : (
                    <>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif-editorial text-[#0E3E2B] mb-2 leading-tight">
                            Deposit recyclables.{' '}
                            <span className="highlight-gold">
                                Unlock booth.
                            </span>
                        </h2>
                        <p className="text-xs sm:text-sm text-[#52635C]">
                            {depositsInCurrentCycle} of {requiredDeposits} items collected
                            {depositCount > 0 && (
                                <span className="font-mono text-xs text-[#0E3E2B] font-semibold"> • {depositCount} total</span>
                            )}
                        </p>
                    </>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 animate-fade-in-up stagger-2 w-full max-w-xs sm:max-w-none justify-center">
                {credits > 0 && (
                    <button
                        id="take-photo-btn"
                        onClick={startPhotoSession}
                        className="btn-gold text-sm sm:text-base px-6 sm:px-8 py-3.5 w-full sm:w-auto"
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
                    className={`${credits > 0 ? 'btn-secondary text-sm' : 'btn-primary text-sm sm:text-base px-6 sm:px-8 py-3.5'} w-full sm:w-auto`}
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
                <div className="mt-8 sm:mt-10 w-full max-w-md animate-fade-in-up stagger-3">
                    <div className="flex items-center justify-between border-b border-[#E8E3D5] pb-2 mb-3">
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider text-[#0E3E2B] uppercase">
                            <History className="w-3.5 h-3.5 text-[#C5A059]" />
                            <span>INTAKE LOG</span>
                        </div>
                        <span className="font-mono text-[10px] sm:text-[11px] text-[#83948C]">
                            {session.deposits.length} ENTRIES
                        </span>
                    </div>

                    <div className="editorial-card p-3.5 sm:p-4 space-y-1.5 max-h-40 overflow-y-auto">
                        {[...session.deposits].reverse().slice(0, 10).map((deposit) => (
                            <div key={deposit.id} className="flex items-center justify-between text-xs py-1 border-b border-[#F4EFE6] last:border-0">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
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
            <div className="mt-6 sm:mt-8 animate-fade-in-up stagger-4">
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
