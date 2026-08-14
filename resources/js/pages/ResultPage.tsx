import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import type { Photo, PhotoSession } from '@/types';
import {
    Download,
    QrCode,
    ArrowLeft,
    Plus,
    ExternalLink,
    Receipt,
} from 'lucide-react';

export default function ResultPage() {
    const { sessionCode } = useParams<{ sessionCode: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as { photo?: Photo; photoSession?: PhotoSession } | null;

    const photo = state?.photo;

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
                {/* 4-Photo Photostrip Showcase */}
                <div className="lg:col-span-5 flex justify-center animate-scale-in">
                    <div className="editorial-card p-3 sm:p-3.5 max-w-xs w-full shadow-md flex flex-col items-center">
                        <img
                            src={imageSrc}
                            alt={`EcoMemories Souvenir Strip ${photo.reference_code}`}
                            className="rounded-lg max-h-[460px] sm:max-h-[580px] w-auto object-contain border border-[#E8E3D5]"
                        />
                        <button
                            onClick={handleDownload}
                            className="mt-3 text-xs font-mono font-semibold text-[#0E3E2B] hover:text-[#145239] flex items-center gap-1.5 transition-colors uppercase tracking-wider py-1"
                        >
                            <Download className="w-3.5 h-3.5 text-[#C5A059]" />
                            <span>Download High-Res</span>
                        </button>
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
                    <div className="warm-sand-card p-4 sm:p-5 font-mono text-xs text-[#14221D] shadow-xs space-y-2">
                        <div className="text-center border-b border-dashed border-[#D1C9B6] pb-2">
                            <div className="flex items-center justify-center gap-1.5 font-bold text-sm text-[#0E3E2B] mb-0.5">
                                <Receipt className="w-4 h-4 text-[#C5A059]" />
                                <span className="font-serif-editorial text-base">ECOMEMORIES</span>
                            </div>
                            <p className="text-[9px] sm:text-[10px] tracking-widest uppercase text-[#83948C]">RECYCLING REWARD RECEIPT</p>
                        </div>
                        <div className="flex justify-between py-1 border-b border-dotted border-[#E6DDC8] text-[11px] sm:text-xs">
                            <span>Items Recycled:</span>
                            <span className="font-bold text-[#0E3E2B]">5 Valid Items</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-dotted border-[#E6DDC8] text-[11px] sm:text-xs">
                            <span>Photo Session:</span>
                            <span className="font-bold text-[#0E3E2B]">4-Pose Souvenir Strip</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-dotted border-[#E6DDC8] text-[11px] sm:text-xs">
                            <span>Reference Code:</span>
                            <span className="font-bold text-[#C5A059]">{photo.reference_code}</span>
                        </div>
                        <div className="text-center pt-2">
                            <p className="font-serif-editorial italic text-xs sm:text-sm text-[#0E3E2B]">Thank you for helping reduce waste.</p>
                            <p className="text-[9px] sm:text-[10px] text-[#83948C] mt-0.5">{new Date().toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2.5 sm:gap-3 animate-fade-in-up stagger-2 w-full max-w-md sm:max-w-none">
                <button onClick={handleDownload} className="btn-primary text-sm px-6 py-3 w-full sm:w-auto">
                    <Download className="w-4 h-4 text-[#D4AF37]" />
                    <span>Download Photostrip</span>
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
        </main>
    );
}
