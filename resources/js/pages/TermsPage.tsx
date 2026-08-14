import { Link } from 'react-router-dom';
import {
    Scale,
    Recycle,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    ArrowLeft,
    Camera,
    Sparkles,
    FileText,
} from 'lucide-react';

export default function TermsPage() {
    return (
        <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-14 max-w-4xl mx-auto w-full">
            {/* Header */}
            <div className="text-center mb-10 animate-fade-in-up">
                <div className="inline-flex items-center gap-2 mb-3">
                    <span className="pill-mono">
                        <Scale className="w-3.5 h-3.5 text-emerald-700" />
                        TERMS & SAFETY GUIDELINES
                    </span>
                    <span className="pill-gold">
                        EFFECTIVE {new Date().getFullYear()}
                    </span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-serif-editorial text-[#0E3E2B] mb-3 leading-tight">
                    Terms of Use & <span className="highlight-gold">Kiosk Safety</span>
                </h1>
                <p className="text-sm sm:text-base text-[#52635C] max-w-xl mx-auto leading-relaxed">
                    Guidelines for safe, responsible, and enjoyable use of the EcoMemories automated recycling reward station.
                </p>
            </div>

            {/* Content Cards */}
            <div className="w-full space-y-6 animate-fade-in-up stagger-1">
                {/* 1. Acceptable Recycling Items */}
                <div className="editorial-card p-6 sm:p-8">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E8E3D5] flex items-center justify-center text-[#0E3E2B] flex-shrink-0 mt-0.5">
                            <Recycle className="w-5 h-5 text-emerald-700" />
                        </div>
                        <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-[#C5A059] tracking-widest uppercase">
                                    GUIDELINE 01
                                </span>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold font-serif-editorial text-[#0E3E2B]">
                                Acceptable Recyclable Materials
                            </h2>
                            <p className="text-xs sm:text-sm text-[#52635C] leading-relaxed">
                                To ensure machine longevity and sensor accuracy, please adhere to accepted item categories:
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                <div className="p-3.5 rounded-xl bg-[#F4EFE6] border border-[#E8E3D5] space-y-2">
                                    <span className="font-mono text-xs font-bold text-emerald-800 flex items-center gap-1.5 uppercase">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        ACCEPTED ITEMS
                                    </span>
                                    <ul className="text-xs text-[#52635C] space-y-1">
                                        <li>• Clean, empty PET plastic bottles</li>
                                        <li>• Aluminum soda & beverage cans</li>
                                        <li>• Standard beverage containers (up to 1.5L)</li>
                                    </ul>
                                </div>

                                <div className="p-3.5 rounded-xl bg-[#FBF3DC] border border-[#E5D6A8] space-y-2">
                                    <span className="font-mono text-xs font-bold text-[#8C6D1F] flex items-center gap-1.5 uppercase">
                                        <XCircle className="w-4 h-4 text-amber-700" />
                                        PROHIBITED ITEMS
                                    </span>
                                    <ul className="text-xs text-[#52635C] space-y-1">
                                        <li>• Glass bottles or breakables</li>
                                        <li>• Containers containing liquid residue</li>
                                        <li>• Hazardous or chemical waste</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Reward Rules & Photobooth Credits */}
                <div className="editorial-card p-6 sm:p-8">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E8E3D5] flex items-center justify-center text-[#0E3E2B] flex-shrink-0 mt-0.5">
                            <Sparkles className="w-5 h-5 text-[#C5A059]" />
                        </div>
                        <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-[#C5A059] tracking-widest uppercase">
                                    GUIDELINE 02
                                </span>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold font-serif-editorial text-[#0E3E2B]">
                                Reward Rules & Credit Allocation
                            </h2>
                            <p className="text-xs sm:text-sm text-[#52635C] leading-relaxed">
                                Photobooth credits are earned strictly on a <strong>5:1 ratio</strong> (5 verified recyclable deposits equal 1 photobooth session credit).
                            </p>
                            <ul className="space-y-1.5 pt-1 text-xs sm:text-sm text-[#52635C]">
                                <li>• Credits are bound to the active session and do not carry cash value.</li>
                                <li>• Each completed session generates one high-definition 4-pose souvenir photostrip with QR code retrieval.</li>
                                <li>• Tampering with sensors or attempting simulated manual bypass voids active session rewards.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* 3. Content Standards & Appropriate Conduct */}
                <div className="editorial-card p-6 sm:p-8">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E8E3D5] flex items-center justify-center text-[#0E3E2B] flex-shrink-0 mt-0.5">
                            <Camera className="w-5 h-5 text-emerald-700" />
                        </div>
                        <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-[#C5A059] tracking-widest uppercase">
                                    GUIDELINE 03
                                </span>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold font-serif-editorial text-[#0E3E2B]">
                                Photobooth Content Standards
                            </h2>
                            <p className="text-xs sm:text-sm text-[#52635C] leading-relaxed">
                                EcoMemories kiosks are community-centered installations. Users are expected to maintain courteous conduct:
                            </p>
                            <ul className="space-y-1.5 pt-1 text-xs sm:text-sm text-[#52635C]">
                                <li>• Inappropriate, explicit, or offensive imagery captured via the photobooth will be subject to immediate deletion.</li>
                                <li>• Users are solely responsible for content shared publicly via QR code URLs.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* 4. Hardware Maintenance & Disclaimers */}
                <div className="editorial-card p-6 sm:p-8">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E8E3D5] flex items-center justify-center text-[#0E3E2B] flex-shrink-0 mt-0.5">
                            <AlertTriangle className="w-5 h-5 text-[#8C6D1F]" />
                        </div>
                        <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-[#C5A059] tracking-widest uppercase">
                                    GUIDELINE 04
                                </span>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold font-serif-editorial text-[#0E3E2B]">
                                Maintenance & Availability
                            </h2>
                            <p className="text-xs sm:text-sm text-[#52635C] leading-relaxed">
                                While we strive for 100% kiosk uptime, hardware maintenance, storage capacity, and internet connectivity may periodically require temporary servicing. System status is updated live on the station dashboard.
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
