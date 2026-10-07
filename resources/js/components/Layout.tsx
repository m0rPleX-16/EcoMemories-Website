import { Outlet, Link, useLocation } from 'react-router-dom';
import { Leaf, ArrowUpRight, ShieldCheck, FileText } from 'lucide-react';

export default function Layout() {
    const location = useLocation();
    const isHome = location.pathname === '/';

    return (
        <div className="canvas-bg relative flex flex-col min-h-screen">
            {/* Top Minimal Editorial Navigation Bar (BuildAI School Style) */}
            <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E8E3D5] px-4 sm:px-6 py-3 sm:py-3.5">
                <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
                    {/* Brand */}
                    <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#0E3E2B] flex items-center justify-center text-[#FAF8F5] shadow-xs group-hover:bg-[#145239] transition-colors">
                            <Leaf className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D4AF37]" />
                        </div>
                        <div className="flex items-baseline gap-1 sm:gap-1.5">
                            <span className="font-serif-editorial text-base sm:text-lg font-bold tracking-tight text-[#0E3E2B]">
                                EcoMemories
                            </span>
                            <span className="hidden xs:inline font-mono text-[9px] sm:text-[10px] tracking-widest text-[#C5A059] uppercase font-semibold">
                                SOUVENIR
                            </span>
                        </div>
                    </Link>

                    {/* Middle Status Pill */}
                    <div className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFFFFF] border border-[#E8E3D5] text-[11px] font-mono font-medium text-[#52635C] shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        <span className="tracking-wider uppercase">RECYCLING REWARD STATION</span>
                    </div>

                    {/* Action */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                        {!isHome ? (
                            <Link
                                to="/"
                                className="text-[11px] sm:text-xs font-mono font-semibold text-[#0E3E2B] hover:text-[#145239] px-2.5 sm:px-3 py-1.5 rounded-lg border border-[#E8E3D5] bg-white hover:bg-[#F4EFE6] transition-all flex items-center gap-1"
                            >
                                <span>NEW SESSION</span>
                                <ArrowUpRight className="w-3 h-3 text-[#C5A059]" />
                            </Link>
                        ) : (
                            <span className="text-[10px] sm:text-xs font-mono text-[#83948C]">
                                5 DEPOSITS = 1 CREDIT
                            </span>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Application Content */}
            <div className="flex-1 flex flex-col relative">
                <Outlet />
            </div>

            {/* Minimal Editorial Footer */}
            <footer className="border-t border-[#E8E3D5] bg-[#FAF8F5] py-6 sm:py-8 px-4 sm:px-6 text-center text-[11px] sm:text-xs text-[#83948C] font-mono tracking-wider uppercase">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-2 flex-wrap justify-center">
                        <span className="font-serif-editorial normal-case text-[#14221D] font-bold text-sm">
                            EcoMemories
                        </span>
                        <span>•</span>
                        <span>TURN WASTE INTO LASTING MEMORIES</span>
                    </div>

                    {/* Compliance & Policy Links */}
                    <div className="flex items-center gap-4 text-[10px] sm:text-[11px] font-semibold text-[#52635C]">
                        <Link
                            to="/privacy"
                            className="hover:text-[#0E3E2B] hover:underline transition-colors flex items-center gap-1"
                        >
                            <ShieldCheck className="w-3 h-3 text-emerald-700" />
                            <span>Privacy Policy</span>
                        </Link>
                        <span>•</span>
                        <Link
                            to="/terms"
                            className="hover:text-[#0E3E2B] hover:underline transition-colors flex items-center gap-1"
                        >
                            <FileText className="w-3 h-3 text-[#C5A059]" />
                            <span>Terms of Use</span>
                        </Link>
                    </div>

                    <div>
                        <span>AUTONOMOUS ECO KIOSK © {new Date().getFullYear()}</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
