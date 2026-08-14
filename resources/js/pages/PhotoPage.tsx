import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/lib/api';
import type { Photo } from '@/types';
import {
    Download,
    Printer,
    Leaf,
    ArrowLeft,
    Loader2,
    AlertCircle,
    Calendar,
    Sparkles,
} from 'lucide-react';

export default function PhotoPage() {
    const { reference } = useParams<{ reference: string }>();
    const [photo, setPhoto] = useState<Photo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

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

    if (error || !photo) {
        return (
            <main className="flex-1 flex items-center justify-center px-4 sm:px-6">
                <div className="editorial-card p-6 sm:p-8 text-center max-w-md w-full animate-scale-in">
                    <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#FBF3DC] text-[#8C6D1F] border border-[#E5D6A8] mb-4">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold font-serif-editorial text-[#0E3E2B] mb-2">Photostrip Not Found</h2>
                    <p className="text-[#52635C] mb-6 text-sm">
                        This souvenir link may be incorrect or has expired.
                    </p>
                    <Link to="/" className="btn-primary inline-flex w-full sm:w-auto justify-center">
                        Return to Station
                    </Link>
                </div>
            </main>
        );
    }

    const imageUrl = photo.public_url || `/storage/${photo.storage_path}`;

    const handleDownload = async () => {
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
        window.print();
    };

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

            {/* Photostrip Card Container */}
            <div className="editorial-card p-3 sm:p-4 mb-6 sm:mb-8 shadow-md animate-scale-in max-w-xs sm:max-w-sm w-full flex justify-center">
                <img
                    src={imageUrl}
                    alt={`EcoMemories Photostrip ${photo.reference_code}`}
                    className="rounded-xl max-h-[480px] sm:max-h-[640px] w-auto object-contain border border-[#E8E3D5]"
                />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2.5 sm:gap-3 mb-6 sm:mb-8 animate-fade-in-up stagger-2 w-full max-w-md sm:max-w-none">
                <button onClick={handleDownload} className="btn-primary text-sm px-6 py-3 w-full sm:w-auto">
                    <Download className="w-4 h-4 text-[#D4AF37]" />
                    <span>Download High-Res</span>
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

            {/* Environmental Footer */}
            <div className="text-center animate-fade-in-up stagger-3 flex items-center justify-center gap-2 px-2">
                <Sparkles className="w-3 h-3 text-[#C5A059] flex-shrink-0" />
                <p className="text-[10px] sm:text-[11px] font-mono text-[#83948C] tracking-wider uppercase">
                    Every recycled item counts • Turn waste into lasting memories
                </p>
            </div>
        </main>
    );
}
