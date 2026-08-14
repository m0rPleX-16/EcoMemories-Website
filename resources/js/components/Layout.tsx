import { Outlet, Link, useLocation } from 'react-router-dom';
import { Leaf, ArrowUpRight } from 'lucide-react';

export default function Layout() {
    const location = useLocation();
    const isHome = location.pathname === '/';

    return (
        <div className="canvas-bg relative flex flex-col min-h-screen">
            {/* Top Minimal Editorial Navigation Bar (BuildAI School Style) */}
            <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E8E3D5] px-6 py-3.5">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    {/* Brand */}
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <div className="w-8 h-8 rounded-lg bg-[#0E3E2B] flex items-center justify-center text-[#FAF8F5] shadow-xs group-hover:bg-[#145239] transition-colors">
                            <Leaf className="w-4 h-4 text-[#D4AF37]" />
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="font-serif-editorial text-lg font-bold tracking-tight text-[#0E3E2B]">
                                EcoMemories
                            </span>
                            <span className="font-mono text-[10px] tracking-widest text-[#C5A059] uppercase font-semibold">
                                SOUVENIR
                            </span>
                        </div>
                    </Link>

                    {/* Middle Status Pill */}
                    <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFFFFF] border border-[#E8E3D5] text-[11px] font-mono font-medium text-[#52635C] shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        <span className="tracking-wider uppercase">RECYCLING REWARD STATION</span>
                    </div>

                    {/* Action */}
                    <div className="flex items-center gap-3">
                        {!isHome ? (
                            <Link
                                to="/"
                                className="text-xs font-mono font-semibold text-[#0E3E2B] hover:text-[#145239] px-3 py-1.5 rounded-lg border border-[#E8E3D5] bg-white hover:bg-[#F4EFE6] transition-all flex items-center gap-1"
                            >
                                <span>NEW SESSION</span>
                                <ArrowUpRight className="w-3 h-3 text-[#C5A059]" />
                            </Link>
                        ) : (
                            <span className="text-xs font-mono text-[#83948C]">
                                5 DEPOSITS = 1 BOOTH CREDIT
                            </span>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Application Content */}
            <div className="flex-1 flex flex-col relative z-10">
                <Outlet />
            </div>

            {/* Minimal Editorial Footer */}
            <footer className="border-t border-[#E8E3D5] bg-[#FAF8F5] py-8 px-6 text-center text-xs text-[#83948C] font-mono tracking-wider uppercase">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <span className="font-serif-editorial normal-case text-[#14221D] font-bold text-sm">
                            EcoMemories
                        </span>
                        <span>•</span>
                        <span>TURN WASTE INTO LASTING MEMORIES</span>
                    </div>
                    <div>
                        <span>AUTONOMOUS ECO RECYCLING KIOSK © {new Date().getFullYear()}</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
