import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '@/lib/api';
import {
    generatePhotostrip,
    THEMES,
    PHOTO_FILTERS,
    STICKER_CONFIG,
    CAPTION_PRESETS,
    type StripLayout,
    type StripTheme,
    type PhotoFilter,
    type EcoSticker,
    type CaptionFont,
    type DateStyle,
    type FrameCorner,
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
    Heart,
    Film,
    Wand2,
    Palette,
    Type,
    Tag,
    Loader2,
    Smile,
    ThumbsUp,
    Star,
    ArrowUpRight,
    FlipHorizontal,
    Eye,
    Calendar,
    SlidersHorizontal,
    Waves,
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
    sakura: Heart,
    retro: Film,
    lavender: Wand2,
    terracotta: Palette,
    cyberpunk: Sparkles,
    ocean: Waves,
    sunflower: Sun,
    matcha: Leaf,
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
    const [error, setError] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

    // Multi-shot state
    const [currentShotIndex, setCurrentShotIndex] = useState(0); // 0, 1, 2, 3
    const [capturedShots, setCapturedShots] = useState<string[]>([]);
    const [retakeTargetIndex, setRetakeTargetIndex] = useState<number | null>(null);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [flashActive, setFlashActive] = useState(false);

    // Personalization & Compositor state
    const [selectedLayout, setSelectedLayout] = useState<StripLayout>('strip');
    const [selectedTheme, setSelectedTheme] = useState<StripTheme>('emerald');
    const [selectedFilter, setSelectedFilter] = useState<PhotoFilter>('normal');
    const [customCaption, setCustomCaption] = useState<string>('');
    const [captionFont, setCaptionFont] = useState<CaptionFont>('handwriting');
    const [cornerStyle, setCornerStyle] = useState<FrameCorner>('rounded');
    const [dateStyle, setDateStyle] = useState<DateStyle>('standard');
    const [selectedSticker, setSelectedSticker] = useState<EcoSticker>('none');
    const [filterCategory, setFilterCategory] = useState<'All' | 'Essential' | 'Vintage' | 'Monochrome' | 'Aesthetic'>('All');

    // Mobile specific tab for review step ('customize' vs 'preview')
    const [mobileStudioTab, setMobileStudioTab] = useState<'customize' | 'preview'>('customize');

    const [compositePreview, setCompositePreview] = useState<string | null>(null);
    const [compositing, setCompositing] = useState(false);

    // Start Camera
    const startCamera = useCallback(async (facing: 'user' | 'environment' = facingMode) => {
        try {
            setBoothState('requesting');
            setError(null);

            // Clean up existing stream
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }

            let mediaStream: MediaStream;
            try {
                mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280, min: 640 },
                        height: { ideal: 960, min: 480 },
                        facingMode: facing,
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
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                await videoRef.current.play();
            }
            setBoothState('ready');
        } catch (err: unknown) {
            console.error('Camera access error:', err);
            setError('Camera access denied or webcam unavailable. Please grant browser camera permissions.');
            setBoothState('error');
        }
    }, [facingMode]);

    // Flip Camera (Front / Back on Mobile)
    const toggleCameraFacing = () => {
        const nextFacing = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(nextFacing);
        startCamera(nextFacing);
    };

    // Cleanup camera on unmount
    useEffect(() => {
        startCamera('user');

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
                streamRef.current = null;
            }
        };
    }, [startCamera]);

    // Grab frame from video feed
    const grabFrame = useCallback((): string => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return '';

        const w = video.videoWidth || 640;
        const h = video.videoHeight || 480;
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext('2d');
        if (!ctx) return '';

        // Mirror only if user-facing selfie camera
        if (facingMode === 'user') {
            ctx.translate(w, 0);
            ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, w, h);

        return canvas.toDataURL('image/jpeg', 0.92);
    }, [facingMode]);

    // Execute capture sequence for a specific shot
    const triggerCaptureForShot = useCallback(
        (shotIdx: number, existingShots: string[]) => {
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

                    // Shutter flash animation
                    setFlashActive(true);
                    setTimeout(() => setFlashActive(false), 180);

                    // Capture image
                    const frameData = grabFrame();
                    const newShots = [...existingShots];
                    newShots[shotIdx] = frameData;
                    setCapturedShots(newShots);

                    // Next step check
                    if (retakeTargetIndex !== null) {
                        setRetakeTargetIndex(null);
                        setBoothState('review');
                    } else if (shotIdx < 3) {
                        setBoothState('next_pause');
                        setCurrentShotIndex(shotIdx + 1);
                        setTimeout(() => {
                            triggerCaptureForShot(shotIdx + 1, newShots);
                        }, 2200);
                    } else {
                        setBoothState('review');
                    }
                }
            }, 1000);
        },
        [grabFrame, retakeTargetIndex]
    );

    // Start 4-shot sequence
    const startBoothSequence = () => {
        setCapturedShots([]);
        setCurrentShotIndex(0);
        setRetakeTargetIndex(null);
        triggerCaptureForShot(0, []);
    };

    // Retake a specific shot
    const retakeSpecificShot = (shotIdx: number) => {
        setRetakeTargetIndex(shotIdx);
        setCurrentShotIndex(shotIdx);
        triggerCaptureForShot(shotIdx, capturedShots);
    };

    // Synthesize sample test shots (for development or fallback)
    const useTestMode = () => {
        const samples: string[] = [];
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const poses = [
            { text: 'Smile for Earth', bg: '#064e3b' },
            { text: 'Thumbs Up Green', bg: '#047857' },
            { text: 'Eco Warrior Pose', bg: '#0f766e' },
            { text: 'Peace & Love', bg: '#15803d' },
        ];

        poses.forEach((p) => {
            ctx.fillStyle = p.bg;
            ctx.fillRect(0, 0, 640, 480);

            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.beginPath();
            ctx.arc(320, 240, 180, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#FAF8F5';
            ctx.font = '32px "Newsreader", serif';
            ctx.textAlign = 'center';
            ctx.fillText(p.text, 320, 235);

            ctx.fillStyle = '#C5A059';
            ctx.font = '14px "JetBrains Mono", monospace';
            ctx.fillText('ECO KEEPSAKE SOUVENIR', 320, 275);

            samples.push(canvas.toDataURL('image/jpeg', 0.92));
        });

        setCapturedShots(samples);
        setBoothState('review');
    };

    // Re-composite photostrip when any customization changes
    useEffect(() => {
        if (capturedShots.length === 4 && (boothState === 'review' || boothState === 'uploading')) {
            setCompositing(true);
            generatePhotostrip(capturedShots, {
                theme: selectedTheme,
                layout: selectedLayout,
                filter: selectedFilter,
                customCaption: customCaption,
                captionFont: captionFont,
                cornerStyle: cornerStyle,
                dateStyle: dateStyle,
                sticker: selectedSticker,
                referenceCode: sessionCode || 'ECO-00001',
            })
                .then((dataUrl) => {
                    setCompositePreview(dataUrl);
                    setCompositing(false);
                })
                .catch((err) => {
                    console.error('Compositing failed:', err);
                    setCompositing(false);
                });
        }
    }, [
        capturedShots,
        selectedTheme,
        selectedLayout,
        selectedFilter,
        customCaption,
        captionFont,
        cornerStyle,
        dateStyle,
        selectedSticker,
        sessionCode,
        boothState,
    ]);

    // Save final photostrip
    const confirmAndSave = async () => {
        if (!sessionCode || !photoSessionId || !compositePreview) return;
        setBoothState('uploading');

        try {
            const { data } = await api.post(
                `/sessions/${sessionCode}/photo-sessions/${photoSessionId}/photos`,
                { image: compositePreview }
            );

            if (data.success) {
                navigate(`/session/${sessionCode}/result`, {
                    state: {
                        photo: data.photo,
                        photoSession: data.photo_session,
                    },
                });
            }
        } catch (err) {
            console.error('Failed to save photostrip:', err);
            setError('Failed to save photostrip. Please try again.');
            setBoothState('review');
        }
    };

    const CurrentPoseIcon = POSE_PROMPTS[currentShotIndex]?.icon || Sparkles;
    const currentFilterCss = PHOTO_FILTERS.find((f) => f.id === selectedFilter)?.cssFilter || 'none';

    const visibleFilters = filterCategory === 'All'
        ? PHOTO_FILTERS
        : PHOTO_FILTERS.filter((f) => f.category === filterCategory);

    return (
        <main className="flex-1 flex flex-col items-center justify-center px-3 sm:px-6 py-3 sm:py-6 max-w-6xl mx-auto w-full">
            <canvas ref={canvasRef} className="hidden" />

            {/* Shutter Flash Animation */}
            {flashActive && <div className="fixed inset-0 bg-white z-50 animate-fade-out pointer-events-none" />}

            {/* TOP BAR / NAVIGATION */}
            <div className="w-full flex items-center justify-between mb-3 sm:mb-5 flex-wrap gap-2">
                <button
                    onClick={() => navigate(`/session/${sessionCode}`)}
                    className="btn-secondary text-xs sm:text-sm px-3 py-1.5 sm:px-3.5 sm:py-2 inline-flex items-center gap-1.5"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Session</span>
                </button>

                <div className="flex items-center gap-2">
                    <span className="pill-mono text-[10px] sm:text-xs">
                        PHOTOBOOTH
                    </span>
                    <span className="pill-gold text-[10px] sm:text-xs">
                        #{sessionCode}
                    </span>
                </div>
            </div>

            {/* ERROR NOTIFICATION */}
            {error && boothState === 'error' && (
                <div className="editorial-card p-5 sm:p-6 mb-6 max-w-md w-full text-center animate-fade-in-up">
                    <AlertCircle className="w-8 h-8 text-[#8C6D1F] mx-auto mb-2" />
                    <h3 className="font-serif-editorial text-lg text-[#0E3E2B] mb-1 font-bold">
                        Camera Connection Error
                    </h3>
                    <p className="text-xs font-mono text-[#52635C] mb-4">{error}</p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <button onClick={() => startCamera(facingMode)} className="btn-primary text-xs px-4 py-2.5">
                            Retry Camera
                        </button>
                        <button onClick={useTestMode} className="btn-secondary text-xs px-4 py-2.5">
                            Use Sample Demo
                        </button>
                    </div>
                </div>
            )}

            {/* LIVE CAMERA CAPTURE VIEW */}
            {boothState !== 'review' && boothState !== 'uploading' && boothState !== 'error' && (
                <div className="w-full max-w-3xl flex flex-col items-center animate-fade-in-up">
                    {/* Pose Guidance Banner */}
                    <div className="w-full editorial-card px-3.5 sm:px-4 py-2.5 sm:py-3.5 mb-3 flex items-center justify-between border-b-2 border-[#C5A059]">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#0E3E2B] text-[#D4AF37] flex items-center justify-center flex-shrink-0">
                                <CurrentPoseIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div>
                                <span className="font-mono text-[9px] sm:text-xs text-[#8C6D1F] uppercase font-bold tracking-wider">
                                    {POSE_PROMPTS[currentShotIndex]?.title}
                                </span>
                                <h3 className="font-serif-editorial text-sm sm:text-base md:text-lg text-[#0E3E2B] leading-tight">
                                    {POSE_PROMPTS[currentShotIndex]?.subtitle}
                                </h3>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="font-mono text-xs sm:text-sm font-bold text-[#0E3E2B]">
                                {currentShotIndex + 1}/4
                            </span>
                        </div>
                    </div>

                    {/* Camera Feed Container */}
                    <div className="w-full flex flex-col md:flex-row items-center gap-3">
                        <div className="relative w-full aspect-[4/3] max-h-[42vh] sm:max-h-[480px] rounded-2xl overflow-hidden bg-black shadow-lg border-2 border-[#0E3E2B] flex items-center justify-center">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className={`w-full h-full object-cover transition-[filter] duration-300 ${
                                    facingMode === 'user' ? 'scale-x-[-1]' : ''
                                }`}
                                style={{ filter: currentFilterCss }}
                            />

                            {/* Camera Flip Button (Mobile Friendly) */}
                            {boothState === 'ready' && (
                                <button
                                    onClick={toggleCameraFacing}
                                    title="Flip camera (front / back)"
                                    className="absolute top-3 right-3 z-20 p-2 sm:p-2.5 rounded-full bg-[#0E3E2B]/80 hover:bg-[#0E3E2B] text-white backdrop-blur-xs border border-white/20 shadow-md transition-all active:scale-95"
                                >
                                    <FlipHorizontal className="w-4 h-4 text-[#D4AF37]" />
                                </button>
                            )}

                            {/* Countdown Timer Display */}
                            {countdown !== null && (
                                <div className="countdown-overlay">
                                    <span className="countdown-number animate-pulse font-serif-editorial">
                                        {countdown}
                                    </span>
                                </div>
                            )}

                            {/* Pause / Next Shot Transition Overlay */}
                            {boothState === 'next_pause' && (
                                <div className="countdown-overlay">
                                    <div className="editorial-card px-5 sm:px-8 py-4 sm:py-6 text-center animate-scale-in max-w-xs w-full">
                                        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-[#C5A059] mx-auto mb-2" />
                                        <h4 className="text-sm sm:text-base font-bold font-serif-editorial text-[#0E3E2B] mb-1">
                                            Pose {currentShotIndex} Saved!
                                        </h4>
                                        <p className="text-[10px] sm:text-xs font-mono text-[#52635C] uppercase tracking-wider">
                                            Ready for Pose {currentShotIndex + 1}...
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Framing Corner Accents */}
                            <div className="absolute top-3 left-3 w-4 sm:w-5 h-4 sm:h-5 border-t-2 border-l-2 border-[#D4AF37]/70" />
                            <div className="absolute bottom-3 left-3 w-4 sm:w-5 h-4 sm:h-5 border-b-2 border-l-2 border-[#D4AF37]/70" />
                            <div className="absolute bottom-3 right-3 w-4 sm:w-5 h-4 sm:h-5 border-b-2 border-r-2 border-[#D4AF37]/70" />
                        </div>

                        {/* 4-Shot Progress Strip (Horizontal on Mobile, Vertical on Tablet/Desktop) */}
                        <div className="flex md:flex-col gap-2 justify-center w-full md:w-auto overflow-x-auto py-1 flex-shrink-0">
                            {[0, 1, 2, 3].map((idx) => {
                                const shot = capturedShots[idx];
                                const isCurrent = currentShotIndex === idx;

                                return (
                                    <div
                                        key={idx}
                                        className={`w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 flex items-center justify-center transition-all bg-white flex-shrink-0 ${
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
                                                style={{ filter: currentFilterCss }}
                                            />
                                        ) : (
                                            <div className="text-center">
                                                <span className="text-[11px] sm:text-xs font-mono font-bold text-[#83948C]">
                                                    #{idx + 1}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Pre-Shot Live Filter Bar with Category Tabs */}
                    {boothState === 'ready' && (
                        <div className="w-full mt-3 sm:mt-4">
                            <div className="flex items-center justify-between mb-1.5 px-1">
                                <div className="flex items-center gap-1.5">
                                    <Wand2 className="w-3.5 h-3.5 text-[#C5A059]" />
                                    <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-[#52635C]">
                                        Filter: {PHOTO_FILTERS.find((f) => f.id === selectedFilter)?.name}
                                    </span>
                                </div>
                                <span className="text-[10px] font-mono text-[#83948C]">
                                    {PHOTO_FILTERS.length} curated filters
                                </span>
                            </div>

                            {/* Filter Chips Scrollable Carousel */}
                            <div className="flex gap-1.5 overflow-x-auto pb-1.5 no-scrollbar w-full">
                                {PHOTO_FILTERS.map((f) => (
                                    <button
                                        key={f.id}
                                        onClick={() => setSelectedFilter(f.id)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border flex items-center gap-1.5 flex-shrink-0 ${
                                            selectedFilter === f.id
                                                ? 'bg-[#0E3E2B] text-white border-[#0E3E2B] shadow-xs font-semibold'
                                                : 'bg-white text-[#52635C] border-[#E8E3D5] hover:border-[#C5A059]'
                                        }`}
                                    >
                                        <span
                                            className="w-2 h-2 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: f.previewColor }}
                                        />
                                        <span>{f.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Bottom Action Controls */}
                    {boothState === 'ready' && (
                        <div className="flex flex-col items-center gap-2 mt-4 sm:mt-5 w-full max-w-xs sm:max-w-none">
                            <button
                                id="start-booth-btn"
                                onClick={startBoothSequence}
                                className="btn-primary text-sm sm:text-base px-6 sm:px-9 py-3.5 w-full sm:w-auto shadow-md"
                            >
                                <Camera className="w-4 h-4 text-[#D4AF37]" />
                                <span>Start 4-Photo Sequence</span>
                                <ArrowUpRight className="w-4 h-4 text-[#D4AF37]" />
                            </button>
                            <button
                                onClick={useTestMode}
                                className="text-xs font-mono text-[#52635C] hover:text-[#0E3E2B] underline uppercase tracking-wider py-1"
                            >
                                Or generate sample keepsake strip
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* REVIEW & CUSTOMIZE PHOTOSTRIP STUDIO */}
            {(boothState === 'review' || boothState === 'uploading') && (
                <div className="w-full max-w-5xl flex flex-col items-center animate-fade-in-up pb-20 sm:pb-6">
                    {/* Header */}
                    <div className="text-center mb-4 sm:mb-6 px-2">
                        <span className="pill-mono mb-1.5 text-[10px] sm:text-xs">
                            03 CUSTOMIZE PHOTOSTRIP
                        </span>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif-editorial text-[#0E3E2B]">
                            Personalize your{' '}
                            <span className="highlight-gold">
                                keepsake souvenir.
                            </span>
                        </h2>
                    </div>

                    {/* MOBILE SEGMENT SELECTOR (Customize vs Preview) */}
                    <div className="lg:hidden flex items-center p-1 bg-[#F0EDE6] rounded-xl mb-4 w-full max-w-md text-xs font-mono">
                        <button
                            onClick={() => setMobileStudioTab('customize')}
                            className={`flex-1 py-2 rounded-lg transition-all font-bold flex items-center justify-center gap-1.5 ${
                                mobileStudioTab === 'customize'
                                    ? 'bg-[#0E3E2B] text-white shadow-xs'
                                    : 'text-[#52635C] hover:text-[#0E3E2B]'
                            }`}
                        >
                            <SlidersHorizontal className="w-3.5 h-3.5 text-[#D4AF37]" />
                            <span>1. Personalize Studio</span>
                        </button>
                        <button
                            onClick={() => setMobileStudioTab('preview')}
                            className={`flex-1 py-2 rounded-lg transition-all font-bold flex items-center justify-center gap-1.5 ${
                                mobileStudioTab === 'preview'
                                    ? 'bg-[#0E3E2B] text-white shadow-xs'
                                    : 'text-[#52635C] hover:text-[#0E3E2B]'
                            }`}
                        >
                            <Eye className="w-3.5 h-3.5 text-[#D4AF37]" />
                            <span>2. View Strip Preview</span>
                        </button>
                    </div>

                    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-start">
                        {/* LEFT: Photostrip Canvas Live Preview */}
                        <div
                            className={`lg:col-span-5 flex justify-center sticky top-4 ${
                                mobileStudioTab === 'customize' ? 'hidden lg:flex' : 'flex'
                            }`}
                        >
                            <div className="editorial-card p-3 sm:p-4 flex flex-col items-center max-w-xs sm:max-w-sm w-full">
                                {compositing ? (
                                    <div className="h-80 sm:h-96 flex flex-col items-center justify-center">
                                        <Loader2 className="w-8 h-8 text-[#0E3E2B] animate-spin mb-3" />
                                        <p className="text-xs font-mono text-[#52635C] uppercase tracking-wider">
                                            Compositing photostrip...
                                        </p>
                                    </div>
                                ) : compositePreview ? (
                                    <div className="flex flex-col items-center w-full">
                                        <img
                                            src={compositePreview}
                                            alt="Generated Photostrip"
                                            className="rounded-xl border border-[#E8E3D5] max-h-[440px] sm:max-h-[580px] w-auto object-contain shadow-md"
                                        />
                                        <div className="flex items-center justify-between w-full mt-2.5 px-1 text-[10px] font-mono text-[#83948C]">
                                            <span>THEME: {THEMES[selectedTheme].name.toUpperCase()}</span>
                                            <span className="uppercase">{selectedLayout === 'strip' ? '2x6 STRIP' : '2x2 GRID'}</span>
                                        </div>
                                    </div>
                                ) : null}

                                {/* Mobile button to jump back to editing */}
                                <div className="lg:hidden mt-3 w-full">
                                    <button
                                        onClick={() => setMobileStudioTab('customize')}
                                        className="btn-secondary w-full text-xs py-2.5 flex items-center justify-center gap-1.5"
                                    >
                                        <SlidersHorizontal className="w-3.5 h-3.5" />
                                        <span>Back to Personalize Options</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Customizer Studio Controls */}
                        <div
                            className={`lg:col-span-7 space-y-4 sm:space-y-4.5 ${
                                mobileStudioTab === 'preview' ? 'hidden lg:block' : 'block'
                            }`}
                        >
                            {/* 1. PHOTO COLOR FILTERS (16 Choices with category filter) */}
                            <div className="editorial-card p-4 sm:p-5">
                                <div className="flex items-center justify-between mb-2.5">
                                    <div className="flex items-center gap-2">
                                        <Wand2 className="w-4 h-4 text-[#C5A059]" />
                                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0E3E2B]">
                                            1. PHOTO COLOR FILTER
                                        </h4>
                                    </div>
                                    <span className="text-[11px] font-mono text-[#8C6D1F] font-bold">
                                        {PHOTO_FILTERS.find((f) => f.id === selectedFilter)?.name}
                                    </span>
                                </div>

                                {/* Category Switcher */}
                                <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 no-scrollbar text-[11px] font-mono">
                                    {(['All', 'Essential', 'Vintage', 'Monochrome', 'Aesthetic'] as const).map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => setFilterCategory(cat)}
                                            className={`px-2.5 py-1 rounded-lg transition-all ${
                                                filterCategory === cat
                                                    ? 'bg-[#0E3E2B] text-white font-semibold'
                                                    : 'bg-[#F4EFE6] text-[#52635C] hover:text-[#0E3E2B]'
                                            }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {visibleFilters.map((f) => (
                                        <button
                                            key={f.id}
                                            onClick={() => setSelectedFilter(f.id)}
                                            className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                                                selectedFilter === f.id
                                                    ? 'border-[#0E3E2B] bg-[#F4EFE6] shadow-xs'
                                                    : 'border-[#E8E3D5] bg-white hover:border-[#C5A059]'
                                            }`}
                                        >
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <span
                                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: f.previewColor }}
                                                />
                                                <span className="text-xs font-semibold text-[#0E3E2B] truncate">
                                                    {f.name}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-[#52635C] line-clamp-1">
                                                {f.description}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 2. FRAME THEME (12 Themes) */}
                            <div className="editorial-card p-4 sm:p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-[#C5A059]" />
                                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0E3E2B]">
                                            2. FRAME THEME
                                        </h4>
                                    </div>
                                    <span className="text-[11px] font-mono text-[#8C6D1F] font-bold">
                                        {THEMES[selectedTheme].name}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {(Object.keys(THEMES) as StripTheme[]).map((thm) => {
                                        const themeCfg = THEMES[thm];
                                        const isSelected = selectedTheme === thm;

                                        return (
                                            <button
                                                key={thm}
                                                onClick={() => setSelectedTheme(thm)}
                                                className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                                                    isSelected
                                                        ? 'border-[#0E3E2B] bg-[#F4EFE6] shadow-xs'
                                                        : 'border-[#E8E3D5] bg-white hover:border-[#C5A059]'
                                                }`}
                                            >
                                                <div
                                                    className="w-4 h-4 rounded-full border border-black/15 flex-shrink-0"
                                                    style={{ backgroundColor: themeCfg.bg }}
                                                />
                                                <div className="truncate">
                                                    <span className="text-xs font-semibold text-[#0E3E2B] block truncate">
                                                        {themeCfg.name}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 3. LAYOUT SELECTION */}
                            <div className="editorial-card p-4 sm:p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <Layers className="w-4 h-4 text-[#C5A059]" />
                                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0E3E2B]">
                                        3. LAYOUT STYLE
                                    </h4>
                                </div>
                                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                                    <button
                                        onClick={() => setSelectedLayout('strip')}
                                        className={`p-3 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                                            selectedLayout === 'strip'
                                                ? 'border-[#0E3E2B] bg-[#F4EFE6] text-[#0E3E2B] shadow-xs'
                                                : 'border-[#E8E3D5] bg-white text-[#52635C] hover:border-[#D1C9B6]'
                                        }`}
                                    >
                                        <Columns3 className="w-4 h-4 text-[#C5A059] flex-shrink-0" />
                                        <span>Classic 2x6 Strip</span>
                                    </button>
                                    <button
                                        onClick={() => setSelectedLayout('grid')}
                                        className={`p-3 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                                            selectedLayout === 'grid'
                                                ? 'border-[#0E3E2B] bg-[#F4EFE6] text-[#0E3E2B] shadow-xs'
                                                : 'border-[#E8E3D5] bg-white text-[#52635C] hover:border-[#D1C9B6]'
                                        }`}
                                    >
                                        <LayoutGrid className="w-4 h-4 text-[#C5A059] flex-shrink-0" />
                                        <span>2x2 Grid Card</span>
                                    </button>
                                </div>
                            </div>

                            {/* 4. PERSONALIZED DEDICATION, FONT & PRESET PILLS */}
                            <div className="editorial-card p-4 sm:p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Type className="w-4 h-4 text-[#C5A059]" />
                                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0E3E2B]">
                                            4. PERSONALIZED DEDICATION
                                        </h4>
                                    </div>
                                    <span className="text-[10px] font-mono text-[#83948C]">
                                        {customCaption.length}/38 chars
                                    </span>
                                </div>

                                <input
                                    type="text"
                                    maxLength={38}
                                    value={customCaption}
                                    onChange={(e) => setCustomCaption(e.target.value)}
                                    placeholder="e.g. Best Friends Forever, Date Night 2026 💕"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E3D5] text-xs sm:text-sm text-[#0E3E2B] bg-white focus:outline-none focus:border-[#0E3E2B] transition-colors placeholder:text-[#83948C] mb-2.5"
                                />

                                {/* Quick Presets Chips */}
                                <div className="mb-3">
                                    <span className="text-[10px] font-mono text-[#83948C] uppercase tracking-wider block mb-1.5">
                                        Quick Slogan Presets (Tap to Apply):
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {CAPTION_PRESETS.map((preset) => (
                                            <button
                                                key={preset}
                                                onClick={() => setCustomCaption(preset)}
                                                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                                                    customCaption === preset
                                                        ? 'bg-[#0E3E2B] text-white border-[#0E3E2B]'
                                                        : 'bg-white text-[#52635C] border-[#E8E3D5] hover:border-[#C5A059]'
                                                }`}
                                            >
                                                {preset}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Font Selector */}
                                <div>
                                    <span className="text-[10px] font-mono text-[#83948C] uppercase tracking-wider block mb-1.5">
                                        Caption Font Style:
                                    </span>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {[
                                            { id: 'handwriting' as CaptionFont, label: 'Handwriting', font: 'font-cursive' },
                                            { id: 'editorial' as CaptionFont, label: 'Serif Classic', font: 'font-serif-editorial' },
                                            { id: 'modern' as CaptionFont, label: 'Modern Bold', font: 'font-sans font-bold' },
                                            { id: 'typewriter' as CaptionFont, label: 'Typewriter', font: 'font-mono' },
                                        ].map((f) => (
                                            <button
                                                key={f.id}
                                                onClick={() => setCaptionFont(f.id)}
                                                className={`py-2 px-2.5 rounded-xl border text-xs transition-all ${f.font} ${
                                                    captionFont === f.id
                                                        ? 'border-[#0E3E2B] bg-[#F4EFE6] text-[#0E3E2B] font-bold shadow-xs'
                                                        : 'border-[#E8E3D5] bg-white text-[#52635C] hover:border-[#C5A059]'
                                                }`}
                                            >
                                                {f.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* 5. FINISH & DATE STAMP */}
                            <div className="editorial-card p-4 sm:p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <Calendar className="w-4 h-4 text-[#C5A059]" />
                                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0E3E2B]">
                                        5. CORNERS & DATE STAMP
                                    </h4>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {/* Corners */}
                                    <div>
                                        <span className="text-[10px] font-mono text-[#83948C] uppercase tracking-wider block mb-1.5">
                                            Photo Corners:
                                        </span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setCornerStyle('rounded')}
                                                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                                                    cornerStyle === 'rounded'
                                                        ? 'bg-[#0E3E2B] text-white border-[#0E3E2B]'
                                                        : 'bg-white text-[#52635C] border-[#E8E3D5]'
                                                }`}
                                            >
                                                Rounded (Modern)
                                            </button>
                                            <button
                                                onClick={() => setCornerStyle('classic')}
                                                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                                                    cornerStyle === 'classic'
                                                        ? 'bg-[#0E3E2B] text-white border-[#0E3E2B]'
                                                        : 'bg-white text-[#52635C] border-[#E8E3D5]'
                                                }`}
                                            >
                                                Straight (Classic)
                                            </button>
                                        </div>
                                    </div>

                                    {/* Date Stamp */}
                                    <div>
                                        <span className="text-[10px] font-mono text-[#83948C] uppercase tracking-wider block mb-1.5">
                                            Date Display:
                                        </span>
                                        <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
                                            {[
                                                { id: 'standard' as DateStyle, label: 'Oct 7, 2026' },
                                                { id: 'timestamp' as DateStyle, label: '2026.10.07' },
                                                { id: 'season' as DateStyle, label: 'Autumn 2026' },
                                                { id: 'hide' as DateStyle, label: 'Hide Date' },
                                            ].map((d) => (
                                                <button
                                                    key={d.id}
                                                    onClick={() => setDateStyle(d.id)}
                                                    className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
                                                        dateStyle === d.id
                                                            ? 'bg-[#0E3E2B] text-white border-[#0E3E2B] font-bold'
                                                            : 'bg-white text-[#52635C] border-[#E8E3D5]'
                                                    }`}
                                                >
                                                    {d.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 6. ECO SOUVENIR STAMP BADGES (9 Badges) */}
                            <div className="editorial-card p-4 sm:p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <Tag className="w-4 h-4 text-[#C5A059]" />
                                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0E3E2B]">
                                        6. ECO SOUVENIR STAMP
                                    </h4>
                                </div>
                                <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
                                    {(Object.keys(STICKER_CONFIG) as EcoSticker[]).map((stk) => {
                                        const cfg = STICKER_CONFIG[stk];
                                        const isSelected = selectedSticker === stk;
                                        return (
                                            <button
                                                key={stk}
                                                onClick={() => setSelectedSticker(stk)}
                                                className={`p-2.5 rounded-xl text-xs font-medium border transition-all text-center flex flex-col items-center justify-center gap-0.5 ${
                                                    isSelected
                                                        ? 'bg-[#0E3E2B] text-white border-[#0E3E2B] shadow-xs font-semibold'
                                                        : 'bg-white text-[#52635C] border-[#E8E3D5] hover:border-[#C5A059]'
                                                }`}
                                            >
                                                {cfg.icon && <span className="text-base">{cfg.icon}</span>}
                                                <span className="truncate">{cfg.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 7. REVIEW & RETAKE POSES */}
                            <div className="editorial-card p-4 sm:p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0E3E2B]">
                                        7. REVIEW POSES
                                    </h4>
                                    <button
                                        onClick={startBoothSequence}
                                        className="text-xs font-mono text-[#8C6D1F] hover:text-[#0E3E2B] underline uppercase tracking-wider font-semibold"
                                    >
                                        Retake All 4 Shots
                                    </button>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {capturedShots.map((shot, idx) => (
                                        <div
                                            key={idx}
                                            className="relative group rounded-lg overflow-hidden border border-[#E8E3D5]"
                                        >
                                            <img
                                                src={shot}
                                                alt={`Pose ${idx + 1}`}
                                                className="w-full h-14 sm:h-16 object-cover"
                                                style={{ filter: currentFilterCss }}
                                            />
                                            <button
                                                onClick={() => retakeSpecificShot(idx)}
                                                className="absolute inset-0 bg-[#0E3E2B]/85 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-[9px] sm:text-[10px] text-white font-mono font-bold gap-1 p-1"
                                            >
                                                <RotateCcw className="w-3 h-3 text-[#D4AF37]" />
                                                <span>RETAKE #{idx + 1}</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PINNED BOTTOM ACTION CTA BAR FOR MOBILE & DESKTOP */}
                    <div className="fixed sm:static bottom-0 inset-x-0 z-30 bg-[#FAF8F5]/95 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none border-t sm:border-0 border-[#E8E3D5] p-3 sm:p-0 sm:mt-6 w-full max-w-5xl">
                        {error && (
                            <div className="flex items-start gap-2 mb-2 px-3 py-2 rounded-xl bg-[#FBF3DC] border border-[#E5D6A8] text-[#8C6D1F]">
                                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <p className="text-xs font-mono leading-relaxed">{error}</p>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setMobileStudioTab(mobileStudioTab === 'preview' ? 'customize' : 'preview')}
                                className="lg:hidden p-3.5 rounded-xl border border-[#E8E3D5] bg-white text-[#0E3E2B] flex items-center justify-center shadow-xs"
                                title="Toggle Preview"
                            >
                                <Eye className="w-5 h-5 text-[#C5A059]" />
                            </button>

                            <button
                                id="confirm-btn"
                                onClick={confirmAndSave}
                                disabled={boothState === 'uploading' || compositing}
                                className="btn-primary flex-1 py-3.5 sm:py-4 text-sm sm:text-base shadow-lg"
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
            )}
        </main>
    );
}
