import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/lib/api';
import type { Photo } from '@/types';
import ImageLightboxModal from '@/components/ImageLightboxModal';
import {
    Download,
    Printer,
    Leaf,
    ArrowLeft,
    Loader2,
    AlertCircle,
    Calendar,
    Sparkles,
    Trash2,
    CheckCircle2,
    X,
    ZoomIn,
    Share2,
} from 'lucide-react';

export default function PhotoPage() {
    const { reference } = useParams<{ reference: string }>();
    const [photo, setPhoto] = useState<Photo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Lightbox & Deletion states
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleted, setDeleted] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    useEffect(() => {
        if (!reference) return;

        const fetchPhoto = async () => {
            try {
                const { data } = await api.get(`/photos/${reference}`);
                if (data.success) {
                    setPhoto(data.photo);
                }
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchPhoto();
    }, [reference]);

    const [copiedLink, setCopiedLink] = useState(false);

    const handleShare = async () => {
        if (!photo) return;
        const currentUrl = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `EcoMemories Photostrip #${photo.reference_code}`,
                    text: `Check out my EcoMemories keepsake photostrip #${photo.reference_code}! Earned by recycling 5 items.`,
                    url: currentUrl,
                });
            } catch {
                // dismissed
            }
        } else {
            try {
                await navigator.clipboard.writeText(currentUrl);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2500);
            } catch {
                // fallback
            }
        }
    };

    const handleDownload = async () => {
        if (!photo) return;
        const imageUrl = photo.public_url || `/storage/${photo.storage_path}`;
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `EcoMemories_${photo.reference_code}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch {
            window.open(imageUrl, '_blank');
        }
    };

    const handlePrint = () => {
        const imageUrl = photo?.public_url || (photo ? `/storage/${photo.storage_path}` : '');
        const referenceCode = photo?.reference_code || '';
        const capturedDate = photo ? new Date(photo.created_at).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
        }) : '';

        const printWindow = window.open('', '_blank', 'width=400,height=700');
        if (!printWindow) return;

        printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <title>EcoMemories – ${referenceCode}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #fff; font-family: 'Courier New', monospace; display: flex; flex-direction: column; align-items: center; padding: 24px 16px; }
    .header { text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 12px; margin-bottom: 16px; width: 100%; }
    .brand { font-size: 18px; font-weight: bold; letter-spacing: 2px; }
    .sub { font-size: 10px; letter-spacing: 3px; color: #666; margin-top: 2px; }
    img { max-width: 300px; width: 100%; border: 1px solid #ddd; display: block; }
    .footer { text-align: center; border-top: 2px dashed #ccc; padding-top: 12px; margin-top: 16px; width: 100%; font-size: 10px; color: #444; line-height: 1.8; }
    .ref { font-weight: bold; font-size: 12px; letter-spacing: 1px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">ECOMEMORIES</div>
    <div class="sub">RECYCLING REWARD RECEIPT</div>
  </div>
  <img src="${imageUrl}" alt="EcoMemories Photostrip ${referenceCode}" />
  <div class="footer">
    <div class="ref">REF: ${referenceCode}</div>
    <div>${capturedDate}</div>
    <div style="margin-top:8px;">5 Items Recycled • 1 Photo Credit Earned</div>
    <div style="margin-top:4px;font-style:italic;">Thank you for helping reduce waste.</div>
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

    const handleDeletePhoto = async () => {
        if (!reference) return;
        setDeleting(true);
        try {
            const { data } = await api.delete(`/photos/${reference}`);
            if (data.success) {
                setDeleted(true);
                setShowDeleteModal(false);
            }
        } catch (err) {
            console.error('Failed to delete photo:', err);
            setDeleteError('Failed to delete photo. Please try again or contact support.');
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <main className="flex-1 flex items-center justify-center p-4">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-[#0E3E2B] animate-spin mx-auto mb-3" />
                    <p className="text-[#52635C] font-mono text-xs uppercase tracking-widest">
                        Retrieving souvenir photostrip...
                    </p>
                </div>
            </main>
        );
    }

    if (deleted) {
        return (
            <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
                <div className="editorial-card p-6 sm:p-8 text-center max-w-md w-full animate-scale-in">
                    <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 mb-4">
                        <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h2 className="text-2xl font-bold font-serif-editorial text-[#0E3E2B] mb-2">
                        Photostrip Permanently Deleted
                    </h2>
                    <p className="text-[#52635C] mb-6 text-xs sm:text-sm leading-relaxed">
                        In accordance with our Data Privacy Policy and GDPR Right to Erasure, photostrip <strong>{reference}</strong> and all associated storage records have been permanently purged from our servers.
                    </p>
                    <Link to="/" className="btn-primary inline-flex w-full sm:w-auto justify-center">
                        Return to Station
                    </Link>
                </div>
            </main>
        );
    }

    if (error || !photo) {
        return (
            <main className="flex-1 flex items-center justify-center px-4 sm:px-6">
                <div className="editorial-card p-6 sm:p-8 text-center max-w-md w-full animate-scale-in">
                    <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#FBF3DC] text-[#8C6D1F] border border-[#E5D6A8] mb-4">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold font-serif-editorial text-[#0E3E2B] mb-2">Photostrip Not Found</h2>
                    <p className="text-[#52635C] mb-6 text-sm">
                        This souvenir link may be incorrect, has expired, or has been erased by the user.
                    </p>
                    <Link to="/" className="btn-primary inline-flex w-full sm:w-auto justify-center">
                        Return to Station
                    </Link>
                </div>
            </main>
        );
    }

    const imageUrl = photo.public_url || `/storage/${photo.storage_path}`;

    return (
        <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-10 max-w-4xl mx-auto w-full">
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8 animate-fade-in-up px-2">
                <div className="inline-flex items-center gap-2 mb-2 sm:mb-3 flex-wrap justify-center">
                    <span className="pill-mono">
                        <Leaf className="w-3 h-3 text-[#C5A059]" />
                        ECO SOUVENIR EDITION
                    </span>
                    <span className="pill-gold">
                        REF #{photo.reference_code}
                    </span>
                </div>

                <h1 className="text-2xl sm:text-4xl md:text-5xl font-serif-editorial text-[#0E3E2B] mb-2 leading-tight">
                    Eco Photostrip{' '}
                    <span className="highlight-gold">
                        {photo.reference_code}
                    </span>
                </h1>
                <p className="text-[11px] sm:text-xs md:text-sm text-[#52635C] flex items-center justify-center gap-1.5 font-mono flex-wrap">
                    <Calendar className="w-3.5 h-3.5 text-[#C5A059] flex-shrink-0" />
                    <span>CAPTURED ON {new Date(photo.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                    }).toUpperCase()} • 5 ITEMS RECYCLED</span>
                </p>
            </div>

            {/* Photostrip Card Container with Click-to-Zoom */}
            <div className="editorial-card p-3 sm:p-4 mb-6 sm:mb-8 shadow-md animate-scale-in max-w-xs sm:max-w-sm w-full flex flex-col items-center group">
                <div
                    onClick={() => setLightboxOpen(true)}
                    className="relative cursor-zoom-in overflow-hidden rounded-lg w-full flex justify-center bg-[#FAF8F5] border border-[#E8E3D5] group-hover:border-[#0E3E2B] transition-colors"
                >
                    <img
                        src={imageUrl}
                        alt={`EcoMemories Photostrip ${photo.reference_code}`}
                        className="max-h-[480px] sm:max-h-[640px] w-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                    />

                    {/* Floating Hover Badge */}
                    <div className="absolute bottom-3 inset-x-3 flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0E3E2B]/85 backdrop-blur-xs text-white text-[10px] sm:text-[11px] font-mono tracking-wider uppercase font-semibold shadow-md">
                            <ZoomIn className="w-3.5 h-3.5 text-[#D4AF37]" />
                            <span>Click to Preview & Zoom</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2.5 sm:gap-3 mb-6 sm:mb-8 animate-fade-in-up stagger-2 w-full max-w-md sm:max-w-none">
                <button onClick={() => setLightboxOpen(true)} className="btn-primary text-sm px-6 py-3 w-full sm:w-auto">
                    <ZoomIn className="w-4 h-4 text-[#D4AF37]" />
                    <span>Preview & Zoom</span>
                </button>
                <button onClick={handleDownload} className="btn-secondary text-sm px-6 py-3 w-full sm:w-auto">
                    <Download className="w-4 h-4 text-[#C5A059]" />
                    <span>Download High-Res</span>
                </button>
                <button onClick={handleShare} className="btn-secondary text-sm px-6 py-3 w-full sm:w-auto">
                    <Share2 className="w-4 h-4 text-[#C5A059]" />
                    <span>{copiedLink ? 'Link Copied!' : 'Share Souvenir'}</span>
                </button>
                <button onClick={handlePrint} className="btn-secondary text-sm px-6 py-3 w-full sm:w-auto">
                    <Printer className="w-4 h-4 text-[#C5A059]" />
                    <span>Print Strip</span>
                </button>
                <Link to="/" className="btn-secondary text-sm px-6 py-3 inline-flex items-center justify-center gap-1.5 w-full sm:w-auto">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>New Session</span>
                </Link>
            </div>

            {/* Compliance Erasure Request Option */}
            <div className="mb-8 text-center animate-fade-in-up stagger-3">
                <button
                    onClick={() => setShowDeleteModal(true)}
                    className="text-xs font-mono text-[#83948C] hover:text-red-700 transition-colors inline-flex items-center gap-1.5 uppercase tracking-wider underline"
                >
                    <Trash2 className="w-3 h-3 text-red-500" />
                    <span>Request Data Erasure / Delete Photo</span>
                </button>
            </div>

            {/* Environmental Footer */}
            <div className="text-center animate-fade-in-up stagger-4 flex items-center justify-center gap-2 px-2">
                <Sparkles className="w-3 h-3 text-[#C5A059] flex-shrink-0" />
                <p className="text-[10px] sm:text-[11px] font-mono text-[#83948C] tracking-wider uppercase">
                    Every recycled item counts • Turn waste into lasting memories
                </p>
            </div>

            {/* Lightbox Zoom Modal */}
            <ImageLightboxModal
                isOpen={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
                imageSrc={imageUrl}
                altText={`EcoMemories Photostrip ${photo.reference_code}`}
                referenceCode={photo.reference_code}
                onDownload={handleDownload}
            />

            {/* CONFIRMATION MODAL FOR DELETION */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 bg-[#08291B]/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
                    <div className="editorial-card p-6 sm:p-8 max-w-md w-full animate-scale-in relative">
                        <button
                            onClick={() => { setShowDeleteModal(false); setDeleteError(null); }}
                            className="absolute top-4 right-4 text-[#83948C] hover:text-[#0E3E2B]"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-red-50 text-red-700 border border-red-200 mb-4">
                            <Trash2 className="w-6 h-6 text-red-600" />
                        </div>

                        <h3 className="text-xl font-bold font-serif-editorial text-[#0E3E2B] mb-2">
                            Permanently Erase Souvenir?
                        </h3>
                        <p className="text-xs sm:text-sm text-[#52635C] leading-relaxed mb-6">
                            This action will permanently delete photostrip <strong>{photo.reference_code}</strong> from our storage disk. Anyone with the QR code or URL will no longer be able to access it.
                        </p>

                        {deleteError && (
                            <div className="flex items-start gap-2 mb-4 px-3 py-2.5 rounded-xl bg-[#FBF3DC] border border-[#E5D6A8] text-[#8C6D1F]">
                                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <p className="text-xs font-mono leading-relaxed">{deleteError}</p>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <button
                                onClick={handleDeletePhoto}
                                disabled={deleting}
                                className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-red-700 hover:bg-red-800 text-white font-semibold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                            >
                                {deleting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                                        <span>Erasing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        <span>Yes, Delete</span>
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => { setShowDeleteModal(false); setDeleteError(null); }}
                                disabled={deleting}
                                className="w-full sm:w-1/2 py-3 px-4 rounded-xl border border-[#E8E3D5] bg-white hover:bg-[#FAF8F5] text-[#52635C] font-semibold text-xs uppercase tracking-wider transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
