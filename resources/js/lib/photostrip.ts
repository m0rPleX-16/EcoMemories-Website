export type StripLayout = 'strip' | 'grid';
export type StripTheme = 'emerald' | 'kraft' | 'midnight' | 'minimalist';

export interface PhotostripOptions {
    layout: StripLayout;
    theme: StripTheme;
    referenceCode: string;
    dateString?: string;
}

export interface ThemeConfig {
    name: string;
    bg: string;
    cardBg: string;
    textColor: string;
    accentColor: string;
    borderColor: string;
    subTextColor: string;
    badgeBg: string;
    badgeText: string;
}

export const THEMES: Record<StripTheme, ThemeConfig> = {
    emerald: {
        name: 'Forest Emerald',
        bg: '#041f11',
        cardBg: '#0a351f',
        textColor: '#ecfdf5',
        accentColor: '#34d399',
        borderColor: '#10b981',
        subTextColor: '#a7f3d0',
        badgeBg: '#10b981',
        badgeText: '#041f11',
    },
    kraft: {
        name: 'Eco Kraft Paper',
        bg: '#ecd5b3',
        cardBg: '#f8eedb',
        textColor: '#291b0f',
        accentColor: '#b45309',
        borderColor: '#a27b5c',
        subTextColor: '#5c4033',
        badgeBg: '#b45309',
        badgeText: '#ffffff',
    },
    midnight: {
        name: 'Midnight Studio',
        bg: '#0b0f19',
        cardBg: '#151c2e',
        textColor: '#f8fafc',
        accentColor: '#38bdf8',
        borderColor: '#334155',
        subTextColor: '#94a3b8',
        badgeBg: '#38bdf8',
        badgeText: '#0b0f19',
    },
    minimalist: {
        name: 'Clean Studio',
        bg: '#ffffff',
        cardBg: '#f8fafc',
        textColor: '#0f172a',
        accentColor: '#059669',
        borderColor: '#e2e8f0',
        subTextColor: '#64748b',
        badgeBg: '#059669',
        badgeText: '#ffffff',
    },
};

/**
 * Load image from data URL or URL into an HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
        img.src = src;
    });
}

/**
 * Draw image object cropped and fitted into destination rect
 */
function drawImageProp(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number,
    y: number,
    w: number,
    h: number,
    radius = 8
) {
    const imgW = img.naturalWidth || img.width;
    const imgH = img.naturalHeight || img.height;
    const imgRatio = imgW / imgH;
    const targetRatio = w / h;

    let sx = 0;
    let sy = 0;
    let sw = imgW;
    let sh = imgH;

    if (imgRatio > targetRatio) {
        sw = imgH * targetRatio;
        sx = (imgW - sw) / 2;
    } else {
        sh = imgW / targetRatio;
        sy = (imgH - sh) / 2;
    }

    ctx.save();
    // Rounded corners
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.clip();
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
    ctx.restore();
}

/**
 * Generate a composite photostrip or 2x2 grid from 4 photos
 */
export async function generatePhotostrip(
    photoDataUrls: string[],
    options: PhotostripOptions
): Promise<string> {
    if (photoDataUrls.length !== 4) {
        throw new Error('Photostrip requires exactly 4 photos');
    }

    // Preload all 4 images
    const images = await Promise.all(photoDataUrls.map(loadImage));
    const theme = THEMES[options.theme] || THEMES.emerald;
    const isStrip = options.layout === 'strip';

    // Set canvas dimensions
    // 2x6 strip: 600 x 1800 px (3:1 aspect ratio)
    // 2x2 grid: 1200 x 1200 px (1:1 square card)
    const canvas = document.createElement('canvas');
    const width = isStrip ? 600 : 1200;
    const height = isStrip ? 1800 : 1200;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // 1. Fill background
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, width, height);

    // Decorative outer border
    ctx.strokeStyle = theme.borderColor;
    ctx.lineWidth = isStrip ? 8 : 12;
    ctx.strokeRect(12, 12, width - 24, height - 24);

    const dateStr = options.dateString || new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    if (isStrip) {
        // --- 2x6 VERTICAL STRIP LAYOUT ---
        const padX = 40;
        const topHeaderH = 115;
        const footerH = 160;
        const availableH = height - topHeaderH - footerH;
        const photoGap = 20;
        const photoW = width - (padX * 2);
        const photoH = (availableH - (photoGap * 3)) / 4;

        // Top Header
        ctx.fillStyle = theme.accentColor;
        ctx.font = 'bold 24px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ECOMEMORIES', width / 2, 54);

        // Elegant cursive slogan
        ctx.fillStyle = theme.subTextColor;
        ctx.font = '22px "Dancing Script", cursive';
        ctx.fillText('Turn Waste into Lasting Memories', width / 2, 88);

        // Draw 4 photos
        images.forEach((img, i) => {
            const py = topHeaderH + (i * (photoH + photoGap));

            // Photo frame background shadow
            ctx.fillStyle = theme.cardBg;
            ctx.fillRect(padX - 4, py - 4, photoW + 8, photoH + 8);

            // Draw photo
            drawImageProp(ctx, img, padX, py, photoW, photoH, 6);

            // Subtle border
            ctx.strokeStyle = theme.borderColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(padX, py, photoW, photoH);
        });

        // Bottom Footer
        const footerY = height - footerH + 30;

        // Reference Code Badge
        ctx.fillStyle = theme.badgeBg;
        const badgeW = 160;
        const badgeH = 32;
        const badgeX = (width - badgeW) / 2;
        ctx.beginPath();
        ctx.roundRect(badgeX, footerY, badgeW, badgeH, 16);
        ctx.fill();

        ctx.fillStyle = theme.badgeText;
        ctx.font = 'bold 15px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(options.referenceCode, width / 2, footerY + 21);

        // Date and Environmental Note with cursive touch
        ctx.fillStyle = theme.textColor;
        ctx.font = '600 13px "Inter", sans-serif';
        ctx.fillText('5 ITEMS RECYCLED • REWARD EDITION', width / 2, footerY + 62);

        ctx.fillStyle = theme.subTextColor;
        ctx.font = '18px "Caveat", cursive';
        ctx.fillText(dateStr, width / 2, footerY + 86);
    } else {
        // --- 2x2 GRID LAYOUT ---
        const pad = 60;
        const headerH = 140;
        const footerH = 150;
        const gap = 30;

        // Header
        ctx.fillStyle = theme.accentColor;
        ctx.font = 'bold 40px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ECOMEMORIES', width / 2, 70);

        // Elegant cursive subtitle
        ctx.fillStyle = theme.subTextColor;
        ctx.font = '32px "Dancing Script", cursive';
        ctx.fillText('Recycled with Love & Memories', width / 2, 112);

        const availableW = width - (pad * 2) - gap;
        const photoW = availableW / 2;
        const availableH = height - headerH - footerH - gap;
        const photoH = availableH / 2;

        images.forEach((img, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const px = pad + col * (photoW + gap);
            const py = headerH + row * (photoH + gap);

            ctx.fillStyle = theme.cardBg;
            ctx.fillRect(px - 6, py - 6, photoW + 12, photoH + 12);

            drawImageProp(ctx, img, px, py, photoW, photoH, 10);

            ctx.strokeStyle = theme.borderColor;
            ctx.lineWidth = 3;
            ctx.strokeRect(px, py, photoW, photoH);
        });

        // Footer
        const footerY = height - footerH + 35;
        ctx.fillStyle = theme.badgeBg;
        const badgeW = 200;
        const badgeH = 38;
        const badgeX = (width - badgeW) / 2;
        ctx.beginPath();
        ctx.roundRect(badgeX, footerY, badgeW, badgeH, 19);
        ctx.fill();

        ctx.fillStyle = theme.badgeText;
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(options.referenceCode, width / 2, footerY + 25);

        ctx.fillStyle = theme.textColor;
        ctx.font = 'bold 16px "Inter", sans-serif';
        ctx.fillText('5 ITEMS RECYCLED', width / 2, footerY + 68);

        ctx.fillStyle = theme.subTextColor;
        ctx.font = '24px "Caveat", cursive';
        ctx.fillText(dateStr, width / 2, footerY + 95);
    }

    return canvas.toDataURL('image/jpeg', 0.95);
}
