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
    Eye,
    Loader2,
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
    .footer { text-align: center; border-top: 2px dashed #000; padding-top: 3mm; margin-top: 3mm; width: 100%; font-size: 8px; line-height: 1.5; }
    .ref { font-weight: 900; font-size: 11px; letter-spacing: 1px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">ECOMEMORIES</div>
    <div class="sub">RECYCLING REWARD SOUVENIR</div>
  </div>
  <img src="${ditheredUrl}" alt="Photostrip ${photo?.reference_code}" />
  <div class="footer">
    <div class="ref">REF: ${photo?.reference_code}</div>
    <div>${capturedDate}</div>
    <div style="margin-top:2mm;font-weight:bold;">5 Items Recycled • 1 Souvenir Earned</div>
    <div style="margin-top:1mm;font-style:italic;">Thank you for helping reduce waste!</div>
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
        if (printing || !photo) return;
        setPrinting(true);
        setPrintProgress(10);
        try {
            // 1. Convert photostrip to high-contrast Atkinson dithered 1-bit ESC/POS raster bitmap
            const dither = await convertToThermalBitmap(imageSrc, {
                targetWidth: 384,
                contrast: 1.25,
                gamma: 0.68,
                algorithm: 'atkinson',
                cleanWhitePaper: true,
            });
            setPrintProgress(30);

            // 2. Attempt direct wireless streaming to ESP32 local server /print-chunk
            const base64Data = dither.escposBase64;
            const CHUNK_SIZE = 2048; // Base64 chunk size
            const totalChunks = Math.ceil(base64Data.length / CHUNK_SIZE);
            let sentViaBridge = false;

            try {
                for (let i = 0; i < totalChunks; i++) {
                    const chunk = base64Data.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
                    const isFirst = i === 0;
                    const isLast = i === totalChunks - 1;

                    const res = await fetch(`${BRIDGE_URL}/print-chunk`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            data: chunk,
                            is_first: isFirst,
                            is_last: isLast,
                        }),
                        signal: AbortSignal.timeout(5000),
                    });

                    if (res.ok) {
                        sentViaBridge = true;
                        setPrintProgress(30 + Math.round(((i + 1) / totalChunks) * 65));
                    } else {
                        break;
                    }
                }
            } catch (err) {
                console.warn('[Print] ESP32 stream unreachable, opening native thermal print window:', err);
            }

            // 3. If ESP32 hardware bridge was offline or not responding, fallback to tablet native print
            if (!sentViaBridge) {
                triggerNativeThermalPrint(dither.previewDataUrl);
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
        <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-10 max-w-6xl mx-auto w-full">
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8 animate-fade-in-up px-2">
                <div className="inline-flex items-center gap-2 mb-2 sm:mb-3 flex-wrap justify-center">
                    <span className="pill-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        04 SOUVENIR READY
                    </span>
                    <span className="pill-gold">
                        REF #{photo.reference_code}
                    </span>
                </div>
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-serif-editorial text-[#0E3E2B] mb-2 leading-tight">
                    Your photostrip is ready.{' '}
                    <span className="highlight-gold block sm:inline">
                        Scan to keep forever.
                    </span>
                </h1>
                <p className="text-xs sm:text-sm text-[#52635C] max-w-md mx-auto">
                    Earned by recycling 5 items at the EcoMemories station.
                </p>
            </div>

            {/* Main Content Grid */}
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start mb-6 sm:mb-8">
                {/* 4-Photo Photostrip Showcase with Zoom Overlay */}
                <div className="lg:col-span-5 flex justify-center animate-scale-in">
                    <div className="editorial-card p-3 sm:p-3.5 max-w-xs w-full shadow-md flex flex-col items-center group">
                        {/* View Mode Toggle: Color Digital Strip vs Thermal Dithered Souvenir */}
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
                                <span>Thermal Print (58mm)</span>
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
                                    className={`max-h-[460px] sm:max-h-[580px] w-auto object-contain transition-transform duration-300 group-hover:scale-[1.02] ${showThermalPreview ? 'contrast-115 grayscale bg-white' : ''}`}
                                />
                            )}

                            {/* Floating Hover Badge */}
                            <div className="absolute bottom-3 inset-x-3 flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0E3E2B]/85 backdrop-blur-xs text-white text-[10px] sm:text-[11px] font-mono tracking-wider uppercase font-semibold shadow-md">
                                    <ZoomIn className="w-3.5 h-3.5 text-[#D4AF37]" />
                                    <span>Click to Preview & Zoom</span>
                                </span>
                            </div>
                        </div>

                        {/* Actions under image */}
                        <div className="flex items-center justify-between w-full mt-3 px-1 text-xs font-mono">
                            <button
                                onClick={() => setLightboxOpen(true)}
                                className="text-[#52635C] hover:text-[#0E3E2B] flex items-center gap-1 transition-colors uppercase tracking-wider py-1 font-semibold"
                            >
                                <ZoomIn className="w-3.5 h-3.5 text-[#C5A059]" />
                                <span>Inspect Detail</span>
                            </button>
                            <button
                                onClick={handleDownload}
                                className="text-[#0E3E2B] hover:text-[#145239] flex items-center gap-1 transition-colors uppercase tracking-wider py-1 font-bold"
                            >
                                <Download className="w-3.5 h-3.5 text-[#C5A059]" />
                                <span>Download</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Side: QR Code & Thermal Ticket Simulation */}
                <div className="lg:col-span-7 space-y-4 sm:space-y-5 animate-fade-in-up stagger-1">
                    {/* QR Code Card */}
                    <div className="editorial-card p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                        <div className="qr-container flex-shrink-0">
                            <QRCodeSVG
                                value={photoUrl}
                                size={120}
                                bgColor="#ffffff"
                                fgColor="#0E3E2B"
                                level="M"
                            />
                        </div>
                        <div className="text-center sm:text-left space-y-2">
                            <div className="flex items-center justify-center sm:justify-start gap-2">
                                <QrCode className="w-4 h-4 text-[#C5A059]" />
                                <h3 className="text-base sm:text-lg font-bold font-serif-editorial text-[#0E3E2B]">
                                    Scan to Save on Phone
                                </h3>
                            </div>
                            <p className="text-xs sm:text-sm text-[#52635C] leading-relaxed">
                                Scan the QR code with your phone camera to view, download, or share your digital 4-pose photostrip instantly!
                            </p>
                            <a
                                href={photoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-mono font-bold text-[#0E3E2B] hover:text-[#145239] hover:underline pt-1 break-all"
                            >
                                <span>{photoUrl}</span>
                                <ExternalLink className="w-3 h-3 text-[#C5A059] flex-shrink-0" />
                            </a>
                        </div>
                    </div>

                    {/* Simulated Thermal Ticket Preview */}
                    <div className="warm-sand-card p-4 sm:p-5 font-mono text-xs text-[#14221D] shadow-xs space-y-2.5">
                        <div className="text-center border-b border-dashed border-[#D1C9B6] pb-2">
                            <div className="flex items-center justify-center gap-1.5 font-bold text-sm text-[#0E3E2B] mb-0.5">
                                <Receipt className="w-4 h-4 text-[#C5A059]" />
                                <span className="font-serif-editorial text-base">ECOMEMORIES</span>
                            </div>
                            <p className="text-[9px] sm:text-[10px] tracking-widest uppercase text-[#83948C]">PHYSICAL THERMAL ROLL PREVIEW</p>
                        </div>

                        {/* Embedded Miniature Thermal Strip in Receipt */}
                        {thermalPreviewUrl && (
                            <div className="flex justify-center py-1">
                                <div className="bg-white p-1.5 border border-dashed border-[#C5BBA4] rounded shadow-xs max-w-[160px] w-full text-center">
                                    <img
                                        src={thermalPreviewUrl}
                                        alt="Thermal Print Preview"
                                        className="w-full h-auto object-contain"
                                    />
                                    <span className="block text-[8px] text-[#83948C] mt-1 font-mono tracking-wider uppercase">
                                        58mm Dithered Output
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between py-1 border-b border-dotted border-[#E6DDC8] text-[11px] sm:text-xs">
                            <span>Items Recycled:</span>
                            <span className="font-bold text-[#0E3E2B]">5 Valid Items</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-dotted border-[#E6DDC8] text-[11px] sm:text-xs">
                            <span>Photo Session:</span>
                            <span className="font-bold text-[#0E3E2B]">4-Pose Souvenir Strip</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-dotted border-[#E6DDC8] text-[11px] sm:text-xs">
                            <span>Session:</span>
                            <span className="font-bold text-[#0E3E2B] font-mono tracking-wider">
                                {photoSession?.session_id ? `#${String(photoSession.session_id).padStart(4,'0')}` : '—'}
                            </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-dotted border-[#E6DDC8] text-[11px] sm:text-xs">
                            <span>Reference Code:</span>
                            <span className="font-bold text-[#C5A059]">{photo.reference_code}</span>
                        </div>
                        <div className="text-center pt-2">
                            <p className="font-serif-editorial italic text-xs sm:text-sm text-[#0E3E2B]">Thank you for helping reduce waste.</p>
                            <p className="text-[9px] sm:text-[10px] text-[#83948C] mt-0.5">
                            {photo.created_at
                                ? new Date(photo.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
                                : new Date().toLocaleString()}
                        </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2.5 sm:gap-3 animate-fade-in-up stagger-2 w-full max-w-md sm:max-w-none">
                <button onClick={() => setLightboxOpen(true)} className="btn-primary text-sm px-6 py-3 w-full sm:w-auto">
                    <ZoomIn className="w-4 h-4 text-[#D4AF37]" />
                    <span>Preview & Zoom</span>
                </button>
                <button onClick={handleDownload} className="btn-secondary text-sm px-6 py-3 w-full sm:w-auto">
                    <Download className="w-4 h-4 text-[#C5A059]" />
                    <span>Download Photostrip</span>
                </button>
                <button
                    onClick={handleThermalPrint}
                    disabled={printing}
                    className="btn-primary text-sm px-6 py-3 w-full sm:w-auto"
                >
                    {printSuccess ? (
                        <>
                            <Check className="w-4 h-4 text-emerald-300" />
                            <span>Photostrip Printed!</span>
                        </>
                    ) : printing ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                            <span>{printProgress ? `Printing (${printProgress}%)...` : 'Printing Photostrip...'}</span>
                        </>
                    ) : (
                        <>
                            <Printer className="w-4 h-4 text-[#D4AF37]" />
                            <span>Print Photostrip Souvenir</span>
                        </>
                    )}
                </button>
                <button onClick={() => navigate(`/session/${sessionCode}`)} className="btn-secondary text-sm px-6 py-3 w-full sm:w-auto">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Session</span>
                </button>
                <button onClick={() => navigate('/')} className="btn-secondary text-sm px-6 py-3 w-full sm:w-auto">
                    <Plus className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>New Session</span>
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
