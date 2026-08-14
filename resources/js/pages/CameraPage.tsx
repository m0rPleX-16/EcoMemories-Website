import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '@/lib/api';
import {
    generatePhotostrip,
    THEMES,
    type StripLayout,
    type StripTheme,
} from '@/lib/photostrip';
import {
    Camera,
    Sparkles,
    RotateCcw,
    Check,
    ArrowLeft,
    AlertCircle,
    Layers,
    LayoutGrid,
    Columns3,
    Leaf,
    FileText,
    Moon,
    Sun,
    Loader2,
    Smile,
    ThumbsUp,
    Star,
    Heart,
    ArrowUpRight,
} from 'lucide-react';

const POSE_PROMPTS = [
    { title: 'Pose 1 of 4', subtitle: 'Big Smile for the Planet', icon: Smile },
    { title: 'Pose 2 of 4', subtitle: 'Thumbs Up for Recycling', icon: ThumbsUp },
    { title: 'Pose 3 of 4', subtitle: 'Strike Your Best Eco Pose', icon: Star },
    { title: 'Pose 4 of 4', subtitle: 'Peace & Love for Earth', icon: Heart },
];

const THEME_ICONS: Record<StripTheme, React.ComponentType<{ className?: string }>> = {
    emerald: Leaf,
    kraft: FileText,
    midnight: Moon,
    minimalist: Sun,
};

type BoothState =
    | 'requesting'
    | 'ready'
    | 'countdown'
    | 'flash'
    | 'next_pause'
    | 'review'
    | 'uploading'
    | 'error';

export default function CameraPage() {
    const { sessionCode } = useParams<{ sessionCode: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const photoSessionId = (location.state as { photoSessionId?: number })?.photoSessionId;

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // State
    const [boothState, setBoothState] = useState<BoothState>('requesting');
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Multi-shot state
    const [currentShotIndex, setCurrentShotIndex] = useState(0); // 0, 1, 2, 3
    const [capturedShots, setCapturedShots] = useState<string[]>([]);
    const [retakeTargetIndex, setRetakeTargetIndex] = useState<number | null>(null);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [flashActive, setFlashActive] = useState(false);

    // Compositor state
    const [selectedLayout, setSelectedLayout] = useState<StripLayout>('strip');
    const [selectedTheme, setSelectedTheme] = useState<StripTheme>('emerald');
    const [compositePreview, setCompositePreview] = useState<string | null>(null);
    const [compositing, setCompositing] = useState(false);

    // Start Camera
    const startCamera = useCallback(async () => {
        try {
            setBoothState('requesting');
            setError(null);

            let mediaStream: MediaStream;
            try {
                mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280, min: 640 },
                        height: { ideal: 960, min: 480 },
                        facingMode: 'user',
                    },
                    audio: false,
                });
            } catch {
                mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false,
                });
            }

            streamRef.current = mediaStream;
            setStream(mediaStream);
            setBoothState('ready');
        } catch (err) {
            console.error('Camera initialization error:', err);
            setError('Could not access camera. Please check permissions or use Sample Mode.');
            setBoothState('error');
        }
    }, []);

    // Sync stream to video element
    useEffect(() => {
        const video = videoRef.current;
        if (video && stream) {
            video.srcObject = stream;
            video.play().catch((e) => console.warn('Video play error:', e));
        }
    }, [stream]);

    // Initial load check
    useEffect(() => {
        if (!photoSessionId) {
            navigate(`/session/${sessionCode}`, { replace: true });
            return;
        }
        startCamera();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, [startCamera, photoSessionId, sessionCode, navigate]);

    // Capture a single frame from video
    const grabFrame = useCallback((): string => {
        const video = videoRef.current;
        const canvas = canvasRef.current || document.createElement('canvas');
        if (!video) return '';

        const w = video.videoWidth || 640;
        const h = video.videoHeight || 480;
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext('2d');
        if (!ctx) return '';

        ctx.translate(w, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, w, h);

        return canvas.toDataURL('image/jpeg', 0.92);
    }, []);

    // Execute capture sequence for a specific shot
    const triggerCaptureForShot = useCallback((shotIdx: number, existingShots: string[]) => {
        setBoothState('countdown');
        let count = 3;
        setCountdown(count);

        const countdownTimer = setInterval(() => {
            count--;
            if (count > 0) {
                setCountdown(count);
            } else {
                clearInterval(countdownTimer);
                setCountdown(null);

                // Shutter flash
                setFlashActive(true);
                setTimeout(() => setFlashActive(false), 180);

                // Capture image
                const frame = grabFrame();
                const updated = [...existingShots];
                updated[shotIdx] = frame;
                setCapturedShots(updated);

                if (retakeTargetIndex !== null) {
                    setRetakeTargetIndex(null);
                    setBoothState('review');
                } else if (shotIdx < 3) {
                    setBoothState('next_pause');
                    setCurrentShotIndex(shotIdx + 1);
                    setTimeout(() => {
                        triggerCaptureForShot(shotIdx + 1, updated);
                    }, 2000);
                } else {
                    setBoothState('review');
                }
            }
        }, 1000);
    }, [grabFrame, retakeTargetIndex]);

    // Start 4-shot sequence
    const startBoothSequence = () => {
        setCapturedShots([]);
        setCurrentShotIndex(0);
        setRetakeTargetIndex(null);
        triggerCaptureForShot(0, []);
    };

    // Retake a specific shot
    const retakeSpecificShot = (index: number) => {
        setRetakeTargetIndex(index);
        setCurrentShotIndex(index);
        triggerCaptureForShot(index, capturedShots);
    };

    // Simulated test mode
    const useTestMode = () => {
        const samples: string[] = [];
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            const poses = [
                { bg1: '#0E3E2B', bg2: '#145239', text: 'Big Smile for Earth', sub: 'Pose 1' },
                { bg1: '#145239', bg2: '#08291B', text: 'Thumbs Up for Recycling', sub: 'Pose 2' },
                { bg1: '#1B5E43', bg2: '#0E3E2B', text: 'Eco Hero Moment', sub: 'Pose 3' },
                { bg1: '#08291B', bg2: '#1B5E43', text: 'Peace for the Planet', sub: 'Pose 4' },
            ];

            poses.forEach((p) => {
                const grad = ctx.createLinearGradient(0, 0, 640, 480);
                grad.addColorStop(0, p.bg1);
                grad.addColorStop(1, p.bg2);
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, 640, 480);

                ctx.fillStyle = 'rgba(255,255,255,0.06)';
                ctx.beginPath();
                ctx.arc(320, 240, 160, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#D4AF37';
                ctx.font = 'bold 20px "Newsreader", serif';
                ctx.textAlign = 'center';
                ctx.fillText('ECOMEMORIES', 320, 195);

                ctx.fillStyle = '#FAF8F5';
                ctx.font = '30px "Newsreader", serif';
                ctx.fillText(p.text, 320, 245);

                ctx.fillStyle = '#C5A059';
                ctx.font = '12px monospace';
                ctx.fillText(`${p.sub} • SOUVENIR CAPTURE`, 320, 295);

                samples.push(canvas.toDataURL('image/jpeg', 0.95));
            });
        }

        setCapturedShots(samples);
        setBoothState('review');
    };

    // Re-render photostrip when layout, theme, or captured shots change
    useEffect(() => {
        if (capturedShots.length === 4 && boothState === 'review') {
            setCompositing(true);
            generatePhotostrip(capturedShots, {
                layout: selectedLayout,
                theme: selectedTheme,
                referenceCode: sessionCode ? `SESSION-${sessionCode}` : 'ECO-BOOTH',
            })
                .then((url) => {
                    setCompositePreview(url);
                    setCompositing(false);
                })
                .catch((err) => {
                    console.error('Failed to generate photostrip:', err);
                    setCompositing(false);
                });
        }
    }, [capturedShots, selectedLayout, selectedTheme, boothState, sessionCode]);

    // Save final photostrip to server
    const confirmAndSave = async () => {
        if (!compositePreview || !sessionCode || !photoSessionId) return;

        setBoothState('uploading');

        try {
            const { data } = await api.post(
                `/sessions/${sessionCode}/photo-sessions/${photoSessionId}/photos`,
                {
                    image: compositePreview,
                }
            );

            if (data.success) {
                navigate(`/session/${sessionCode}/result`, {
                    state: {
                        photo: data.photo,
                        photoSession: data.photo_session,
                    },
                    replace: true,
                });
            }
        } catch (err) {
            console.error('Failed to upload photo:', err);
            setError('Failed to save photostrip. Please try again.');
            setBoothState('review');
        }
    };

    const CurrentPoseIcon = POSE_PROMPTS[currentShotIndex]?.icon || Camera;

    return (
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-5xl mx-auto w-full relative">
            <canvas ref={canvasRef} className="hidden" />

            {/* White Shutter Flash Animation */}
            {flashActive && (
                <div className="fixed inset-0 bg-white z-50 pointer-events-none transition-opacity duration-150 animate-fade-in" />
            )}

            {/* ERROR STATE */}
            {boothState === 'error' && (
                <div className="editorial-card p-8 text-center max-w-md animate-scale-in">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#FBF3DC] text-[#8C6D1F] border border-[#E5D6A8] mb-4">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold font-serif-editorial text-[#0E3E2B] mb-2">Camera Unavailable</h2>
                    <p className="text-[#52635C] mb-6 text-sm">{error}</p>
                    <div className="flex flex-col gap-2.5 justify-center">
                        <button
                            id="use-sample-photo-btn"
                            onClick={useTestMode}
                            className="btn-gold text-sm py-3"
                        >
                            <Camera className="w-4 h-4" />
                            <span>Generate 4-Photo Souvenir (Demo)</span>
                        </button>
                        <div className="flex gap-2 justify-center">
                            <button onClick={startCamera} className="btn-secondary text-xs py-2.5">
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Retry Camera</span>
                            </button>
                            <button onClick={() => navigate(`/session/${sessionCode}`)} className="btn-secondary text-xs py-2.5">
                                <span>Back</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* REQUESTING / LOADING */}
            {boothState === 'requesting' && (
                <div className="text-center animate-fade-in py-12">
                    <Loader2 className="w-10 h-10 text-[#0E3E2B] animate-spin mx-auto mb-3" />
                    <p className="text-[#52635C] font-mono text-xs uppercase tracking-widest">
                        Initializing photobooth hardware...
                    </p>
                </div>
            )}

            {/* LIVE CAMERA CAPTURE FLOW */}
            {(boothState === 'ready' || boothState === 'countdown' || boothState === 'next_pause') && (
                <div className="w-full max-w-4xl flex flex-col items-center animate-scale-in">
                    {/* Top Bar */}
                    <div className="w-full flex items-center justify-between mb-4 px-2">
                        <button
                            onClick={() => navigate(`/session/${sessionCode}`)}
                            className="text-xs font-mono text-[#52635C] hover:text-[#0E3E2B] transition-colors flex items-center gap-1.5 uppercase"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>EXIT BOOTH</span>
                        </button>

                        {/* Pose Cue Banner */}
                        <div className="text-center flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E8E3D5] flex items-center justify-center text-[#0E3E2B]">
                                <CurrentPoseIcon className="w-4 h-4 text-[#C5A059]" />
                            </div>
                            <div className="text-left">
                                <span className="text-[10px] font-mono uppercase tracking-widest text-[#C5A059] font-bold block">
                                    {POSE_PROMPTS[currentShotIndex]?.title}
                                </span>
                                <h3 className="text-lg font-serif-editorial text-[#0E3E2B] font-bold leading-tight">
                                    {POSE_PROMPTS[currentShotIndex]?.subtitle}
                                </h3>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-full bg-white border border-[#E8E3D5] text-[#52635C]">
                            <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                            <span className="font-semibold text-[10px]">LIVE FEED</span>
                        </div>
                    </div>

                    {/* Main Stage: Camera + Live Sidebar Thumbnails */}
                    <div className="w-full flex flex-col md:flex-row items-center justify-center gap-6">
                        {/* Video Viewport */}
                        <div className="camera-viewport relative flex-1 max-w-2xl">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                            />

                            {/* Countdown Pulse Overlay */}
                            {boothState === 'countdown' && countdown !== null && (
                                <div className="countdown-overlay">
                                    <div className="text-center">
                                        <span key={countdown} className="countdown-number">
                                            {countdown}
                                        </span>
                                        <p className="text-[#FAF8F5] text-xl font-serif-editorial italic mt-2">
                                            {POSE_PROMPTS[currentShotIndex]?.subtitle}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Pause / Next Shot Transition Overlay */}
                            {boothState === 'next_pause' && (
                                <div className="countdown-overlay">
                                    <div className="editorial-card px-8 py-6 text-center animate-scale-in max-w-xs">
                                        <Sparkles className="w-6 h-6 text-[#C5A059] mx-auto mb-2" />
                                        <h4 className="text-lg font-bold font-serif-editorial text-[#0E3E2B] mb-1">
                                            Shot {currentShotIndex} Saved!
                                        </h4>
                                        <p className="text-xs font-mono text-[#52635C] uppercase tracking-wider">
                                            Get ready for Shot {currentShotIndex + 1}...
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Viewport Framing Brackets */}
                            <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[#D4AF37]/60" />
                            <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[#D4AF37]/60" />
                            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-[#D4AF37]/60" />
                            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-[#D4AF37]/60" />
                        </div>

                        {/* Live 4-Shot Progress Strip on Side */}
                        <div className="flex md:flex-col gap-2.5 justify-center">
                            {[0, 1, 2, 3].map((idx) => {
                                const shot = capturedShots[idx];
                                const isCurrent = currentShotIndex === idx;

                                return (
                                    <div
                                        key={idx}
                                        className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 flex items-center justify-center transition-all bg-white ${
                                            shot
                                                ? 'border-[#0E3E2B] shadow-xs'
                                                : isCurrent
                                                ? 'border-[#C5A059] bg-[#FBF3DC]'
                                                : 'border-[#E8E3D5] bg-[#FAF8F5]'
                                        }`}
                                    >
                                        {shot ? (
                                            <img
                                                src={shot}
                                                alt={`Pose ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="text-center">
                                                <span className="text-xs font-mono font-bold text-[#83948C]">
                                                    #{idx + 1}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bottom Action Controls */}
                    {boothState === 'ready' && (
                        <div className="flex flex-col items-center gap-3 mt-8">
                            <button
                                id="start-booth-btn"
                                onClick={startBoothSequence}
                                className="btn-primary text-base px-9 py-3.5"
                            >
                                <Camera className="w-4 h-4 text-[#D4AF37]" />
                                <span>Start 4-Photo Sequence</span>
                                <ArrowUpRight className="w-4 h-4 text-[#D4AF37]" />
                            </button>
                            <button
                                onClick={useTestMode}
                                className="text-xs font-mono text-[#52635C] hover:text-[#0E3E2B] underline uppercase tracking-wider"
                            >
                                Or generate test souvenir strip
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* REVIEW & CUSTOMIZE PHOTOSTRIP */}
            {(boothState === 'review' || boothState === 'uploading') && (
                <div className="w-full max-w-5xl flex flex-col items-center animate-fade-in-up">
                    <div className="text-center mb-8">
                        <span className="pill-mono mb-2">
                            §03 CUSTOMIZE PHOTOSTRIP
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-serif-editorial text-[#0E3E2B] mt-2">
                            Personalize your{' '}
                            <span className="highlight-gold">
                                keepsake souvenir.
                            </span>
                        </h2>
                    </div>

                    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Photostrip Canvas Live Preview */}
                        <div className="lg:col-span-6 flex justify-center">
                            <div className="editorial-card p-4 flex flex-col items-center max-w-sm w-full">
                                {compositing ? (
                                    <div className="h-96 flex flex-col items-center justify-center">
                                        <Loader2 className="w-8 h-8 text-[#0E3E2B] animate-spin mb-3" />
                                        <p className="text-xs font-mono text-[#52635C] uppercase tracking-wider">
                                            Compositing photostrip...
                                        </p>
                                    </div>
                                ) : compositePreview ? (
                                    <img
                                        src={compositePreview}
                                        alt="Generated Photostrip"
                                        className="rounded-xl border border-[#E8E3D5] max-h-[560px] object-contain shadow-xs"
                                    />
                                ) : null}
                            </div>
                        </div>

                        {/* Customizer Sidebar */}
                        <div className="lg:col-span-6 space-y-5">
                            {/* Layout Selection */}
                            <div className="editorial-card p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <Layers className="w-4 h-4 text-[#C5A059]" />
                                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0E3E2B]">
                                        1. SELECT LAYOUT
                                    </h4>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setSelectedLayout('strip')}
                                        className={`p-3.5 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                                            selectedLayout === 'strip'
                                                ? 'border-[#0E3E2B] bg-[#F4EFE6] text-[#0E3E2B] shadow-xs'
                                                : 'border-[#E8E3D5] bg-white text-[#52635C] hover:border-[#D1C9B6]'
                                        }`}
                                    >
                                        <Columns3 className="w-4 h-4 text-[#C5A059]" />
                                        <span>Classic 2x6 Strip</span>
                                    </button>
                                    <button
                                        onClick={() => setSelectedLayout('grid')}
                                        className={`p-3.5 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                                            selectedLayout === 'grid'
                                                ? 'border-[#0E3E2B] bg-[#F4EFE6] text-[#0E3E2B] shadow-xs'
                                                : 'border-[#E8E3D5] bg-white text-[#52635C] hover:border-[#D1C9B6]'
                                        }`}
                                    >
                                        <LayoutGrid className="w-4 h-4 text-[#C5A059]" />
                                        <span>2x2 Grid Card</span>
                                    </button>
                                </div>
                            </div>

                            {/* Theme Selection */}
                            <div className="editorial-card p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <Sparkles className="w-4 h-4 text-[#C5A059]" />
                                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0E3E2B]">
                                        2. SELECT FRAME THEME
                                    </h4>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {(Object.keys(THEMES) as StripTheme[]).map((thm) => {
                                        const ThemeIcon = THEME_ICONS[thm];
                                        return (
                                            <button
                                                key={thm}
                                                onClick={() => setSelectedTheme(thm)}
                                                className={`p-3 rounded-xl border text-xs sm:text-sm font-semibold text-left flex items-center gap-2.5 transition-all ${
                                                    selectedTheme === thm
                                                        ? 'border-[#0E3E2B] bg-[#F4EFE6] text-[#0E3E2B] shadow-xs'
                                                        : 'border-[#E8E3D5] bg-white text-[#52635C] hover:border-[#D1C9B6]'
                                                }`}
                                            >
                                                <ThemeIcon className="w-4 h-4 text-[#C5A059] flex-shrink-0" />
                                                <span>{THEMES[thm].name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Review Poses */}
                            <div className="editorial-card p-5">
                                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0E3E2B] mb-3">
                                    3. REVIEW POSES
                                </h4>
                                <div className="grid grid-cols-4 gap-2">
                                    {capturedShots.map((shot, idx) => (
                                        <div key={idx} className="relative group rounded-lg overflow-hidden border border-[#E8E3D5]">
                                            <img src={shot} alt={`Pose ${idx + 1}`} className="w-full h-16 object-cover" />
                                            <button
                                                onClick={() => retakeSpecificShot(idx)}
                                                className="absolute inset-0 bg-[#0E3E2B]/85 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-[10px] text-white font-mono font-bold gap-1"
                                            >
                                                <RotateCcw className="w-3 h-3 text-[#D4AF37]" />
                                                <span>RETAKE #{idx + 1}</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-3 text-right">
                                    <button
                                        onClick={startBoothSequence}
                                        className="text-xs font-mono text-[#8C6D1F] hover:text-[#0E3E2B] underline uppercase tracking-wider font-semibold"
                                    >
                                        Retake All 4 Shots
                                    </button>
                                </div>
                            </div>

                            {/* Final Action Buttons */}
                            <div className="pt-2">
                                <button
                                    id="confirm-btn"
                                    onClick={confirmAndSave}
                                    disabled={boothState === 'uploading'}
                                    className="btn-primary w-full py-3.5 text-base"
                                >
                                    {boothState === 'uploading' ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin text-[#FAF8F5]" />
                                            <span>Saving Souvenir Photostrip...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4 text-[#D4AF37]" />
                                            <span>Confirm & Save Photostrip</span>
                                            <ArrowUpRight className="w-4 h-4 text-[#D4AF37]" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
