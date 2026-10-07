import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import type { Photo, PhotoSession } from '@/types';
import ImageLightboxModal from '@/components/ImageLightboxModal';
import { convertToThermalBitmap } from '@/lib/thermalDither';
import {
    Download,
    QrCode,
    ArrowLeft,
    Plus,
    ExternalLink,
    Receipt,
    ZoomIn,
    Sparkles,
    Printer,
    Check,
    Loader2,
    Share2,
    RotateCcw,
} from 'lucide-react';

const BRIDGE_URL = (import.meta.env.VITE_BRIDGE_URL as string | undefined) || 'http://192.168.1.8:3333';

export default function ResultPage() {
    const { sessionCode } = useParams<{ sessionCode: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as { photo?: Photo; photoSession?: PhotoSession } | null;

    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [printing, setPrinting] = useState(false);
    const [printProgress, setPrintProgress] = useState<number | null>(null);
    const [printSuccess, setPrintSuccess] = useState(false);
    const [showThermalPreview, setShowThermalPreview] = useState(false);
    const [thermalPreviewUrl, setThermalPreviewUrl] = useState<string | null>(null);
    const [generatingThermal, setGeneratingThermal] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);

    const photo = state?.photo;
    const photoSession = state?.photoSession;

    if (!photo) {
        return (
            <main className="flex-1 flex items-center justify-center px-4 sm:px-6">
                <div className="editorial-card p-6 sm:p-8 text-center max-w-md w-full animate-scale-in">
                    <h2 className="text-2xl font-bold font-serif-editorial text-[#0E3E2B] mb-2">No Photo Found</h2>
                    <p className="text-[#52635C] text-sm mb-6">It looks like something went wrong.</p>
                    <button onClick={() => navigate(`/session/${sessionCode}`)} className="btn-primary w-full sm:w-auto">
                        Back to Session
                    </button>
                </div>
            </main>
        );
    }

    const photoUrl = `${window.location.origin}/photo/${photo.reference_code}`;
    const imageSrc = photo.public_url || `/storage/${photo.storage_path}`;

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'EcoMemories Photostrip Souvenir',
                    text: `Check out my EcoMemories photostrip #${photo.reference_code}! Earned by recycling 5 items.`,
                    url: photoUrl,
                });
            } catch {
                // User cancelled or share dismissed
            }
        } else {
            try {
                await navigator.clipboard.writeText(photoUrl);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2500);
            } catch {
                window.open(photoUrl, '_blank');
            }
        }
    };

    const handleDownload = async () => {
        try {
            const res = await fetch(imageSrc);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `EcoMemories_${photo.reference_code}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch {
            window.open(imageSrc, '_blank');
        }
    };

    useEffect(() => {
        if (!imageSrc) return;
        let isMounted = true;
        setGeneratingThermal(true);
        convertToThermalBitmap(imageSrc, {
            targetWidth: 384,
            contrast: 1.25,
            gamma: 0.68,
            algorithm: 'atkinson',
            cleanWhitePaper: true,
        })
            .then((res) => {
                if (isMounted) {
                    setThermalPreviewUrl(res.previewDataUrl);
                    setGeneratingThermal(false);
                }
            })
            .catch((err) => {
                console.error('Failed to generate thermal preview:', err);
                if (isMounted) setGeneratingThermal(false);
            });
        return () => {
            isMounted = false;
        };
    }, [imageSrc]);

    const triggerNativeThermalPrint = (ditheredUrl: string) => {
        const printWindow = window.open('', '_blank', 'width=384,height=800');
        if (!printWindow) return;
        const capturedDate = photo ? new Date(photo.created_at).toLocaleString('en-US', {
            dateStyle: 'medium', timeStyle: 'short',
        }) : new Date().toLocaleString();

        printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <title>EcoMemories Souvenir – ${photo?.reference_code}</title>
  <style>
    @page { size: 58mm auto; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { width: 58mm; background: #fff; font-family: 'Courier New', monospace; display: flex; flex-direction: column; align-items: center; padding: 4mm 2mm; color: #000; }
    .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 3mm; margin-bottom: 3mm; width: 100%; }
    .brand { font-size: 16px; font-weight: 900; letter-spacing: 2px; }
    .sub { font-size: 8px; letter-spacing: 2px; margin-top: 1mm; font-weight: bold; }
    img { width: 100%; max-width: 54mm; display: block; image-rendering: pixelated; margin: 2mm 0; }
    .footer { text-align: center; border-top: 2px dashed #000; padding-top: 3mm; margin-top: 3mm; width: 100%; font-size: 8px; line-height: 1.6; }
    .ref { font-weight: 900; font-size: 11px; letter-spacing: 1px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">ECOMEMORIES</div>
    <div class="sub">PHYSICAL SOUVENIR ROLL</div>
  </div>
  <img src="${ditheredUrl}" alt="Thermal Photostrip ${photo?.reference_code}" />
  <div class="footer">
    <div class="ref">REF: ${photo?.reference_code}</div>
    <div>${capturedDate}</div>
    <div style="margin-top:2mm;font-weight:bold;">5 Items Recycled • Reward Edition</div>
    <div style="margin-top:1mm;font-style:italic;">Thank you for helping reduce waste.</div>
  </div>
</body>
</html>`);

        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 300);
    };

    const handleThermalPrint = async () => {
        setPrinting(true);
        setPrintProgress(null);

        try {
            const endpoint = `${BRIDGE_URL}/print-strip`;
            const payload = {
                image_url: imageSrc,
                reference_code: photo.reference_code,
                session_id: photoSession?.session_id ?? null,
                deposits_count: 5,
            };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(60000),
            });

            if (!response.ok) {
                throw new Error(`Thermal bridge returned HTTP ${response.status}`);
            }

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Bridge print reported failure');
            }

            setPrintSuccess(true);
            setTimeout(() => setPrintSuccess(false), 5000);
        } catch (e) {
            console.error('[Print] Thermal printing failed:', e);
            triggerNativeThermalPrint(thermalPreviewUrl || imageSrc);
        } finally {
            setPrinting(false);
            setPrintProgress(null);
        }
    };

    return (
        <main className="flex-1 flex flex-col items-center justify-center px-3 sm:px-6 py-4 sm:py-8 max-w-5xl mx-auto w-full">
            {/* Header */}
            <div className="text-center mb-4 sm:mb-6 animate-fade-in-up px-2">
                <div className="inline-flex items-center gap-2 mb-1.5 flex-wrap justify-center">
                    <span className="pill-mono text-[10px] sm:text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        04 SOUVENIR READY
                    </span>
                    <span className="pill-gold text-[10px] sm:text-xs">
                        #{photo.reference_code}
                    </span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif-editorial text-[#0E3E2B] mb-1 leading-tight">
                    Your Photostrip Keepsake
                </h1>
                <p className="text-xs sm:text-sm text-[#52635C] max-w-md mx-auto">
                    Earned by recycling 5 items at the EcoMemories station.
                </p>
            </div>

            {/* Main Content Grid */}
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-7 items-start mb-5 sm:mb-6">
                {/* Left: 4-Photo Photostrip Showcase with Integrated Icon Action Dock */}
                <div className="lg:col-span-5 flex justify-center animate-scale-in">
                    <div className="editorial-card p-3 sm:p-3.5 max-w-xs w-full shadow-md flex flex-col items-center group">
                        {/* View Mode Toggle: Digital Color vs Thermal Dithered */}
                        <div className="flex items-center justify-center p-1 bg-[#F0EDE6] rounded-lg mb-2.5 w-full text-[11px] font-mono">
                            <button
                                onClick={() => setShowThermalPreview(false)}
                                className={`flex-1 py-1 rounded-md transition-all font-semibold ${!showThermalPreview ? 'bg-[#0E3E2B] text-white shadow-xs' : 'text-[#52635C] hover:text-[#0E3E2B]'}`}
                            >
                                Digital Color
                            </button>
                            <button
                                onClick={() => setShowThermalPreview(true)}
                                className={`flex-1 py-1 rounded-md transition-all font-semibold flex items-center justify-center gap-1 ${showThermalPreview ? 'bg-[#0E3E2B] text-white shadow-xs' : 'text-[#52635C] hover:text-[#0E3E2B]'}`}
                            >
                                <Receipt className="w-3 h-3 text-[#D4AF37]" />
                                <span>Thermal (58mm)</span>
                            </button>
                        </div>

                        {/* Interactive Click to Zoom Wrapper */}
                        <div
                            onClick={() => setLightboxOpen(true)}
                            className="relative cursor-zoom-in overflow-hidden rounded-lg w-full flex justify-center bg-[#FAF8F5] border border-[#E8E3D5] group-hover:border-[#0E3E2B] transition-colors"
                        >
                            {generatingThermal && showThermalPreview ? (
                                <div className="py-24 flex flex-col items-center justify-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-[#0E3E2B] mb-2" />
                                    <span className="text-[10px] font-mono text-[#52635C]">Dithering for 58mm...</span>
                                </div>
                            ) : (
                                <img
                                    src={showThermalPreview && thermalPreviewUrl ? thermalPreviewUrl : imageSrc}
                                    alt={`EcoMemories Souvenir Strip ${photo.reference_code}`}
                                    className={`max-h-[44vh] sm:max-h-[500px] w-auto object-contain transition-transform duration-300 group-hover:scale-[1.02] ${showThermalPreview ? 'contrast-115 grayscale bg-white' : ''}`}
                                />
                            )}

                            {/* Subtle Top-Right Expand Icon on Hover */}
                            <div className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/40 text-white backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <ZoomIn className="w-3.5 h-3.5 text-white" />
                            </div>
                        </div>

                        {/* STREAMLINED ACTION CLUSTER (Primary Download + Icon Toolbar) */}
                        <div className="w-full mt-3 space-y-2">
                            {/* Primary Button: Download */}
                            <button
                                onClick={handleDownload}
                                className="btn-primary w-full py-3 text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs"
                            >
                                <Download className="w-4 h-4 text-[#D4AF37]" />
                                <span>Download Photostrip</span>
                            </button>

                            {/* Icon Buttons Row */}
                            <div className="flex items-center justify-between gap-1 p-1.5 bg-[#FAF8F5] rounded-xl border border-[#E8E3D5]">
                                {/* Print Thermal */}
                                <button
                                    onClick={handleThermalPrint}
                                    disabled={printing}
                                    title="Print on Physical 58mm Thermal Roll"
                                    aria-label="Thermal Print"
                                    className="flex-1 py-2 px-1 rounded-lg hover:bg-white text-[#0E3E2B] flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 group"
                                >
                                    {printSuccess ? (
                                        <Check className="w-4 h-4 text-emerald-600" />
                                    ) : printing ? (
                                        <Loader2 className="w-4 h-4 text-[#C5A059] animate-spin" />
                                    ) : (
                                        <Printer className="w-4 h-4 text-[#0E3E2B] group-hover:scale-110 transition-transform" />
                                    )}
                                    <span className="text-[9px] font-mono font-semibold text-[#52635C]">
                                        {printSuccess ? 'Printed!' : 'Print'}
                                    </span>
                                </button>

                                <div className="w-px h-5 bg-[#E8E3D5]" />

                                {/* Share Link */}
                                <button
                                    onClick={handleShare}
                                    title="Share Souvenir Link"
                                    aria-label="Share"
                                    className="flex-1 py-2 px-1 rounded-lg hover:bg-white text-[#0E3E2B] flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 group"
                                >
                                    <Share2 className="w-4 h-4 text-[#C5A059] group-hover:scale-110 transition-transform" />
                                    <span className="text-[9px] font-mono font-semibold text-[#52635C]">
                                        {copiedLink ? 'Copied!' : 'Share'}
                                    </span>
                                </button>

                                <div className="w-px h-5 bg-[#E8E3D5]" />

                                {/* Lightbox Zoom */}
                                <button
                                    onClick={() => setLightboxOpen(true)}
                                    title="Zoom & Inspect Detail"
                                    aria-label="Zoom"
                                    className="flex-1 py-2 px-1 rounded-lg hover:bg-white text-[#0E3E2B] flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 group"
                                >
                                    <ZoomIn className="w-4 h-4 text-[#0E3E2B] group-hover:scale-110 transition-transform" />
                                    <span className="text-[9px] font-mono font-semibold text-[#52635C]">Zoom</span>
                                </button>

                                <div className="w-px h-5 bg-[#E8E3D5]" />

                                {/* New Session */}
                                <button
                                    onClick={() => navigate('/')}
                                    title="Start New Session"
                                    aria-label="New Session"
                                    className="flex-1 py-2 px-1 rounded-lg hover:bg-white text-[#0E3E2B] flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 group"
                                >
                                    <RotateCcw className="w-4 h-4 text-[#0E3E2B] group-hover:scale-110 transition-transform" />
                                    <span className="text-[9px] font-mono font-semibold text-[#52635C]">New</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: QR Code & Thermal Ticket Preview */}
                <div className="lg:col-span-7 space-y-4 animate-fade-in-up stagger-1">
                    {/* QR Code Card */}
                    <div className="editorial-card p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-3.5 sm:gap-5">
                        <div className="qr-container flex-shrink-0">
                            <QRCodeSVG
                                value={photoUrl}
                                size={110}
                                bgColor="#ffffff"
                                fgColor="#0E3E2B"
                                level="M"
                            />
                        </div>
                        <div className="text-center sm:text-left space-y-1.5">
                            <div className="flex items-center justify-center sm:justify-start gap-1.5">
                                <QrCode className="w-4 h-4 text-[#C5A059]" />
                                <h3 className="text-base sm:text-lg font-bold font-serif-editorial text-[#0E3E2B]">
                                    Scan to Save on Phone
                                </h3>
                            </div>
                            <p className="text-xs text-[#52635C] leading-relaxed">
                                Scan the QR code with your phone camera to view, save, or share your digital keepsake instantly!
                            </p>
                            <a
                                href={photoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[#0E3E2B] hover:text-[#145239] hover:underline pt-0.5 break-all"
                            >
                                <span>{photoUrl}</span>
                                <ExternalLink className="w-3 h-3 text-[#C5A059] flex-shrink-0" />
                            </a>
                        </div>
                    </div>

                    {/* Simulated Thermal Ticket Preview */}
                    <div className="warm-sand-card p-3.5 sm:p-4 font-mono text-xs text-[#14221D] shadow-xs space-y-2">
                        <div className="text-center border-b border-dashed border-[#D1C9B6] pb-1.5">
                            <div className="flex items-center justify-center gap-1.5 font-bold text-xs sm:text-sm text-[#0E3E2B]">
                                <Receipt className="w-3.5 h-3.5 text-[#C5A059]" />
                                <span className="font-serif-editorial text-sm sm:text-base">ECOMEMORIES</span>
                            </div>
                            <p className="text-[9px] tracking-widest uppercase text-[#83948C]">PHYSICAL THERMAL ROLL PREVIEW</p>
                        </div>

                        {/* Embedded Miniature Thermal Strip in Receipt */}
                        {thermalPreviewUrl && (
                            <div className="flex justify-center py-0.5">
                                <div className="bg-white p-1 border border-dashed border-[#C5BBA4] rounded shadow-xs max-w-[140px] w-full text-center">
                                    <img
                                        src={thermalPreviewUrl}
                                        alt="Thermal Print Preview"
                                        className="w-full h-auto object-contain"
                                    />
                                    <span className="block text-[8px] text-[#83948C] mt-0.5 font-mono tracking-wider uppercase">
                                        58mm Dithered Roll
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between py-0.5 border-b border-dotted border-[#E6DDC8] text-[11px]">
                            <span>Items Recycled:</span>
                            <span className="font-bold text-[#0E3E2B]">5 Valid Items</span>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-dotted border-[#E6DDC8] text-[11px]">
                            <span>Photo Session:</span>
                            <span className="font-bold text-[#0E3E2B]">4-Pose Souvenir Strip</span>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-dotted border-[#E6DDC8] text-[11px]">
                            <span>Session ID:</span>
                            <span className="font-bold text-[#0E3E2B] font-mono tracking-wider">
                                {photoSession?.session_id ? `#${String(photoSession.session_id).padStart(4,'0')}` : '—'}
                            </span>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-dotted border-[#E6DDC8] text-[11px]">
                            <span>Reference Code:</span>
                            <span className="font-bold text-[#C5A059]">{photo.reference_code}</span>
                        </div>
                        <div className="text-center pt-1">
                            <p className="font-serif-editorial italic text-xs text-[#0E3E2B]">Thank you for helping reduce waste.</p>
                            <p className="text-[9px] text-[#83948C] mt-0.5">
                                {photo.created_at
                                    ? new Date(photo.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
                                    : new Date().toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Subtle Clean Bottom Navigation Links */}
            <div className="flex items-center justify-center gap-4 text-xs font-mono text-[#52635C] animate-fade-in-up stagger-2 pt-1">
                <button
                    onClick={() => navigate(`/session/${sessionCode}`)}
                    className="hover:text-[#0E3E2B] underline flex items-center gap-1 transition-colors uppercase tracking-wider text-[11px]"
                >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Return to Session</span>
                </button>
                <span>•</span>
                <button
                    onClick={() => navigate('/')}
                    className="hover:text-[#0E3E2B] underline flex items-center gap-1 transition-colors uppercase tracking-wider text-[11px]"
                >
                    <Plus className="w-3 h-3 text-[#C5A059]" />
                    <span>New Recycling Session</span>
                </button>
            </div>

            {/* Lightbox Zoom Modal */}
            <ImageLightboxModal
                isOpen={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
                imageSrc={imageSrc}
                altText={`EcoMemories Souvenir Strip ${photo.reference_code}`}
                referenceCode={photo.reference_code}
                onDownload={handleDownload}
            />
        </main>
    );
}
