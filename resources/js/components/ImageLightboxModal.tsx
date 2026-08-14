import { useState, useEffect, useRef, useCallback } from 'react';
import {
    ZoomIn,
    ZoomOut,
    RotateCcw,
    X,
    Download,
    Maximize2,
    Sparkles,
} from 'lucide-react';

interface ImageLightboxModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageSrc: string;
    altText?: string;
    referenceCode?: string;
    onDownload?: () => void;
}

export default function ImageLightboxModal({
    isOpen,
    onClose,
    imageSrc,
    altText = 'Photostrip Preview',
    referenceCode,
    onDownload,
}: ImageLightboxModalProps) {
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const containerRef = useRef<HTMLDivElement>(null);

    // Reset zoom and position when opened or closed
    useEffect(() => {
        if (isOpen) {
            setZoom(1);
            setPosition({ x: 0, y: 0 });
        }
    }, [isOpen]);

    // Handle keyboard Escape to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === '+' || e.key === '=') {
                handleZoomIn();
            } else if (e.key === '-' || e.key === '_') {
                handleZoomOut();
            } else if (e.key === '0') {
                handleResetZoom();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleZoomIn = useCallback(() => {
        setZoom((prev) => Math.min(prev + 0.35, 3));
    }, []);

    const handleZoomOut = useCallback(() => {
        setZoom((prev) => {
            const next = Math.max(prev - 0.35, 0.75);
            if (next <= 1) {
                setPosition({ x: 0, y: 0 });
            }
            return next;
        });
    }, []);

    const handleResetZoom = useCallback(() => {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
    }, []);

    const toggleZoom = () => {
        if (zoom === 1) {
            setZoom(1.8);
        } else {
            handleResetZoom();
        }
    };

    // Drag to pan when zoomed in
    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoom <= 1) return;
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || zoom <= 1) return;
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Touch support for dragging
    const handleTouchStart = (e: React.TouchEvent) => {
        if (zoom <= 1 || e.touches.length !== 1) return;
        setIsDragging(true);
        setDragStart({
            x: e.touches[0].clientX - position.x,
            y: e.touches[0].clientY - position.y,
        });
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging || zoom <= 1 || e.touches.length !== 1) return;
        setPosition({
            x: e.touches[0].clientX - dragStart.x,
            y: e.touches[0].clientY - dragStart.y,
        });
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 bg-[#08291B]/85 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-6 animate-fade-in select-none"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            {/* Top Bar Controls */}
            <div className="w-full max-w-4xl flex items-center justify-between gap-3 text-white z-20 py-2">
                <div className="flex items-center gap-2">
                    <span className="font-serif-editorial text-lg sm:text-xl font-bold text-[#F4EFE6]">
                        Photostrip Detail
                    </span>
                    {referenceCode && (
                        <span className="font-mono text-xs text-[#D4AF37] px-2 py-0.5 rounded-md bg-white/10 border border-white/15">
                            {referenceCode}
                        </span>
                    )}
                </div>

                {/* Center / Right Control Island */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                    {/* Zoom In / Out Toolbar */}
                    <div className="flex items-center rounded-xl bg-white/10 border border-white/20 p-1 backdrop-blur-sm">
                        <button
                            onClick={handleZoomOut}
                            disabled={zoom <= 0.75}
                            title="Zoom Out (-)"
                            className="p-1.5 rounded-lg hover:bg-white/15 disabled:opacity-30 transition-colors text-[#FAF8F5]"
                        >
                            <ZoomOut className="w-4 h-4" />
                        </button>
                        <span className="font-mono text-xs px-2 min-w-[48px] text-center font-bold text-[#D4AF37]">
                            {Math.round(zoom * 100)}%
                        </span>
                        <button
                            onClick={handleZoomIn}
                            disabled={zoom >= 3}
                            title="Zoom In (+)"
                            className="p-1.5 rounded-lg hover:bg-white/15 disabled:opacity-30 transition-colors text-[#FAF8F5]"
                        >
                            <ZoomIn className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleResetZoom}
                            title="Reset Zoom (0)"
                            className="p-1.5 rounded-lg hover:bg-white/15 transition-colors text-[#FAF8F5] ml-0.5 border-l border-white/15"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Download Button */}
                    {onDownload && (
                        <button
                            onClick={onDownload}
                            title="Download High-Res"
                            className="hidden sm:inline-flex p-2 rounded-xl bg-[#C5A059] hover:bg-[#D4AF37] text-[#0E3E2B] font-bold transition-colors items-center gap-1 text-xs"
                        >
                            <Download className="w-4 h-4" />
                            <span>Download</span>
                        </button>
                    )}

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        title="Close (Esc)"
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#FAF8F5] transition-colors border border-white/20"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Main Interactive Zoom Viewport */}
            <div
                ref={containerRef}
                className="flex-1 w-full flex items-center justify-center overflow-hidden relative"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in' }}
            >
                <div
                    onClick={zoom === 1 ? toggleZoom : undefined}
                    className="transition-transform duration-100 ease-out"
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                        transformOrigin: 'center center',
                    }}
                >
                    <img
                        src={imageSrc}
                        alt={altText}
                        draggable={false}
                        className="max-h-[75vh] sm:max-h-[82vh] w-auto max-w-[90vw] object-contain rounded-xl shadow-2xl border border-white/20 pointer-events-auto"
                    />
                </div>
            </div>

            {/* Bottom Floating Hint Bar */}
            <div className="w-full text-center py-1 z-20">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-[11px] font-mono text-[#FAF8F5]/80 backdrop-blur-sm">
                    <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>
                        {zoom > 1
                            ? 'Drag to pan • Click image or Reset to return'
                            : 'Click image or use (+) to zoom in and inspect poses'}
                    </span>
                </div>
            </div>
        </div>
    );
}
