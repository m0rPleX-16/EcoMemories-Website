import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import {
    Shield,
    Camera,
    EyeOff,
    Database,
    Lock,
    Trash2,
    Cookie,
    CheckCircle2,
    ArrowLeft,
    Sparkles,
    Scale,
    Loader2,
    AlertCircle,
    Check,
} from 'lucide-react';

export default function PrivacyPage() {
    const [referenceInput, setReferenceInput] = useState('');
    const [erasing, setErasing] = useState(false);
    const [erasedStatus, setErasedStatus] = useState<string | null>(null);
    const [eraseError, setEraseError] = useState<string | null>(null);

    const handleSelfServiceErasure = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = referenceInput.trim().toUpperCase();
        if (!code) return;

        setErasing(true);
        setErasedStatus(null);
        setEraseError(null);

        try {
            const { data } = await api.delete(`/photos/${code}`);
            if (data.success) {
                setErasedStatus(`Photostrip ${code} and its digital records have been permanently purged from our servers.`);
                setReferenceInput('');
            }
        } catch (err: any) {
            if (err.response?.status === 404) {
                setEraseError(`No photo found with reference code "${code}" (it may have already been deleted).`);
            } else {
                setEraseError('Failed to process deletion request. Please verify the reference code.');
            }
        } finally {
            setErasing(false);
        }
    };

    return (
        <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-14 max-w-4xl mx-auto w-full">
            {/* Header */}
            <div className="text-center mb-10 animate-fade-in-up">
                <div className="inline-flex items-center gap-2 mb-3">
                    <span className="pill-mono">
                        <Shield className="w-3.5 h-3.5 text-emerald-700" />
                        DATA INTEGRITY & COMPLIANCE
                    </span>
                    <span className="pill-gold">
                        UPDATED {new Date().getFullYear()}
                    </span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-serif-editorial text-[#0E3E2B] mb-3 leading-tight">
                    Privacy Policy & <span className="highlight-gold">Data Safety</span>
                </h1>
                <p className="text-sm sm:text-base text-[#52635C] max-w-xl mx-auto leading-relaxed">
                    EcoMemories is engineered with privacy-by-design. We believe that celebrating environmental action must never compromise user security or personal data.
                </p>
            </div>

            {/* Content Sections */}
            <div className="w-full space-y-6 animate-fade-in-up stagger-1">
                {/* 1. Camera & Image Capture Policy */}
                <div className="editorial-card p-6 sm:p-8">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E8E3D5] flex items-center justify-center text-[#0E3E2B] flex-shrink-0 mt-0.5">
                            <Camera className="w-5 h-5 text-emerald-700" />
                        </div>
                        <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-[#C5A059] tracking-widest uppercase">
                                    SECTION 01
                                </span>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold font-serif-editorial text-[#0E3E2B]">
                                Camera Operations & Photo Capture
                            </h2>
                            <p className="text-xs sm:text-sm text-[#52635C] leading-relaxed">
                                Our camera system operates under strict user-initiated protocols:
                            </p>
                            <ul className="space-y-2 pt-2 text-xs sm:text-sm text-[#52635C]">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    <span><strong>No Background Surveillance:</strong> The camera is active only during an explicit 4-pose photobooth session unlocked by valid recycling credits.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    <span><strong>No Facial Recognition:</strong> We do not perform biometric analysis, facial indexing, emotion tracking, or identity recognition.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    <span><strong>User Retake Control:</strong> You maintain full preview control with the ability to retake individual shots before confirming souvenir strip export.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* 2. Hardware Telemetry & Anonymous Metrics */}
                <div className="editorial-card p-6 sm:p-8">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E8E3D5] flex items-center justify-center text-[#0E3E2B] flex-shrink-0 mt-0.5">
                            <Scale className="w-5 h-5 text-[#C5A059]" />
                        </div>
                        <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-[#C5A059] tracking-widest uppercase">
                                    SECTION 02
                                </span>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold font-serif-editorial text-[#0E3E2B]">
                                Recycling Telemetry & Environmental Data
                            </h2>
                            <p className="text-xs sm:text-sm text-[#52635C] leading-relaxed">
                                The smart intake hardware measures weight and logs deposit events to prevent fraud and calculate collective eco-impact:
                            </p>
                            <ul className="space-y-2 pt-2 text-xs sm:text-sm text-[#52635C]">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    <span><strong>Non-PII Logging:</strong> Telemetry logs include item count, approximate weight (in grams), and transaction timestamps—none of which are linked to personal identities.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    <span><strong>Aggregate Impact Statistics:</strong> Recycling metrics are aggregated to quantify total plastic/aluminum diverted from landfills.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* 3. Storage, Encryption & QR Codes */}
                <div className="editorial-card p-6 sm:p-8">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E8E3D5] flex items-center justify-center text-[#0E3E2B] flex-shrink-0 mt-0.5">
                            <Lock className="w-5 h-5 text-emerald-700" />
                        </div>
                        <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-[#C5A059] tracking-widest uppercase">
                                    SECTION 03
                                </span>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold font-serif-editorial text-[#0E3E2B]">
                                Souvenir Storage & QR Code Access
                            </h2>
                            <p className="text-xs sm:text-sm text-[#52635C] leading-relaxed">
                                Once finalized, composite photostrips are stored in encrypted cloud/object storage and made accessible via unique reference keys:
                            </p>
                            <ul className="space-y-2 pt-2 text-xs sm:text-sm text-[#52635C]">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    <span><strong>Unique Randomized Identifiers:</strong> Each photostrip is assigned a distinct reference code (e.g. <code>ECO-XXXXX</code>) resistant to sequential scraping.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    <span><strong>Ephemeral / Retention Choice:</strong> Photos remain available for digital keepsake downloading and sharing by the session creator.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* 4. Self-Service User Rights & Data Erasure Portal */}
                <div className="editorial-card p-6 sm:p-8">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E8E3D5] flex items-center justify-center text-[#0E3E2B] flex-shrink-0 mt-0.5">
                            <Trash2 className="w-5 h-5 text-[#8C6D1F]" />
                        </div>
                        <div className="space-y-4 flex-1">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-[#C5A059] tracking-widest uppercase">
                                        SECTION 04
                                    </span>
                                </div>
                                <h2 className="text-xl sm:text-2xl font-bold font-serif-editorial text-[#0E3E2B] mb-2">
                                    Self-Service Data Erasure Portal (GDPR / Privacy Compliance)
                                </h2>
                                <p className="text-xs sm:text-sm text-[#52635C] leading-relaxed">
                                    In compliance with global data privacy regulations, you have the right to permanently purge your photostrip from our servers at any time.
                                </p>
                            </div>

                            {/* Live Interactive Erasure Form */}
                            <div className="p-4 sm:p-5 rounded-xl bg-[#FBF3DC]/60 border border-[#E5D6A8] space-y-3">
                                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0E3E2B] flex items-center gap-1.5">
                                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                    <span>Instant Self-Service Erasure</span>
                                </h4>
                                <p className="text-xs text-[#52635C]">
                                    Enter your photostrip reference code printed on your receipt or found in the souvenir URL to permanently delete it:
                                </p>

                                <form onSubmit={handleSelfServiceErasure} className="flex flex-col sm:flex-row items-center gap-2.5">
                                    <input
                                        type="text"
                                        value={referenceInput}
                                        onChange={(e) => setReferenceInput(e.target.value)}
                                        placeholder="e.g. ECO-00001"
                                        className="w-full sm:flex-1 px-3.5 py-2.5 rounded-lg border border-[#D1C9B6] bg-white font-mono text-xs text-[#0E3E2B] uppercase placeholder:normal-case focus:outline-none focus:border-[#0E3E2B]"
                                    />
                                    <button
                                        type="submit"
                                        disabled={erasing || !referenceInput.trim()}
                                        className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                                    >
                                        {erasing ? (
                                            <>
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                <span>Purging...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="w-3.5 h-3.5" />
                                                <span>Purge Photo</span>
                                            </>
                                        )}
                                    </button>
                                </form>

                                {erasedStatus && (
                                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 animate-fade-in">
                                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                        <span>{erasedStatus}</span>
                                    </div>
                                )}

                                {eraseError && (
                                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2 animate-fade-in">
                                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                        <span>{eraseError}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. Cookies & Tracking Disclaimer */}
                <div className="editorial-card p-6 sm:p-8">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E8E3D5] flex items-center justify-center text-[#0E3E2B] flex-shrink-0 mt-0.5">
                            <Cookie className="w-5 h-5 text-emerald-700" />
                        </div>
                        <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-[#C5A059] tracking-widest uppercase">
                                    SECTION 05
                                </span>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold font-serif-editorial text-[#0E3E2B]">
                                Cookies & Third-Party Trackers
                            </h2>
                            <p className="text-xs sm:text-sm text-[#52635C] leading-relaxed">
                                EcoMemories uses <strong>zero third-party advertising trackers</strong>. We utilize only essential session cookies and CSRF security tokens required to maintain station connectivity and authenticate legitimate recycling transactions.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Back Navigation */}
            <div className="mt-10 flex items-center justify-center animate-fade-in-up stagger-2">
                <Link to="/" className="btn-primary text-sm px-6 py-3">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Return to Station Home</span>
                </Link>
            </div>
        </main>
    );
}
