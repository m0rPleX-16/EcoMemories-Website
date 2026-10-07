import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Download } from 'lucide-react';

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
    altText = 'Photostrip Showcase',
    referenceCode,
    onDownload,
}: ImageLightboxModalProps) {
    // Keyboard Escape to dismiss & lock body scroll while modal is active
    useEffect(() => {
        if (!isOpen) return;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const modalContent = (
        <div
            className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in select-none cursor-pointer"
            onClick={onClose}
        >
            {/* Minimal Top-Right Floating Controls */}
            <div
                className="absolute top-3 sm:top-5 right-3 sm:right-5 z-20 flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
            >
                {referenceCode && (
                    <span className="hidden sm:inline-block font-mono text-[11px] text-[#D4AF37] px-2.5 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-xs">
                        #{referenceCode}
                    </span>
                )}

                {onDownload && (
                    <button
                        onClick={onDownload}
                        title="Download High-Res"
                        aria-label="Download"
                        className="p-2 sm:p-2.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition-all backdrop-blur-xs border border-white/20 active:scale-95"
                    >
                        <Download className="w-4 h-4 text-[#D4AF37]" />
                    </button>
                )}

                <button
                    onClick={onClose}
                    title="Close (Esc)"
                    aria-label="Close"
                    className="p-2 sm:p-2.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition-all backdrop-blur-xs border border-white/20 active:scale-95"
                >
                    <X className="w-5 h-5 text-white" />
                </button>
            </div>

            {/* Clean Hero Image Showcase (No Distractions) */}
            <div
                className="relative max-h-[92vh] max-w-[94vw] flex items-center justify-center cursor-default"
                onClick={(e) => e.stopPropagation()}
            >
                <img
                    src={imageSrc}
                    alt={altText}
                    draggable={false}
                    className="max-h-[92vh] max-w-[94vw] w-auto h-auto object-contain rounded-xl shadow-2xl border border-white/15 animate-scale-in"
                />
            </div>
        </div>
    );

    // Render directly into document.body to stay in top-level stacking context above navbar & layout
    return typeof document !== 'undefined'
        ? createPortal(modalContent, document.body)
        : modalContent;
}
