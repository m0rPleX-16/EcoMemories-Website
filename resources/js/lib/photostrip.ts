export type StripLayout = 'strip' | 'grid';

export type StripTheme =
    | 'emerald'
    | 'kraft'
    | 'midnight'
    | 'minimalist'
    | 'sakura'
    | 'retro'
    | 'lavender'
    | 'terracotta'
    | 'cyberpunk'
    | 'ocean'
    | 'sunflower'
    | 'matcha';

export type PhotoFilter =
    | 'normal'
    | 'vintage'
    | 'retro_fuji'
    | 'polaroid'
    | 'bw'
    | 'bw_soft'
    | 'noir'
    | 'golden'
    | 'sunset'
    | 'pastel'
    | 'nordic'
    | 'emerald'
    | 'matcha'
    | 'vivid'
    | 'y2k'
    | 'cyberpunk';

export type EcoSticker =
    | 'none'
    | 'recycled'
    | 'hero'
    | 'memories'
    | 'warrior'
    | 'climate'
    | 'ocean'
    | 'love'
    | 'certified';

export type CaptionFont = 'handwriting' | 'editorial' | 'modern' | 'typewriter';

export type DateStyle = 'standard' | 'timestamp' | 'season' | 'hide';

export type FrameCorner = 'rounded' | 'classic';

export interface PhotostripOptions {
    layout: StripLayout;
    theme: StripTheme;
    filter?: PhotoFilter;
    customCaption?: string;
    captionFont?: CaptionFont;
    sticker?: EcoSticker;
    dateStyle?: DateStyle;
    cornerStyle?: FrameCorner;
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
    sakura: {
        name: 'Blush Sakura',
        bg: '#fdf2f8',
        cardBg: '#fff1f2',
        textColor: '#881337',
        accentColor: '#e11d48',
        borderColor: '#fecdd3',
        subTextColor: '#9f1239',
        badgeBg: '#f43f5e',
        badgeText: '#ffffff',
    },
    retro: {
        name: 'Retro 35mm Film',
        bg: '#18181b',
        cardBg: '#27272a',
        textColor: '#fef3c7',
        accentColor: '#f59e0b',
        borderColor: '#78350f',
        subTextColor: '#d97706',
        badgeBg: '#d97706',
        badgeText: '#18181b',
    },
    lavender: {
        name: 'Lilac Dream',
        bg: '#2e1065',
        cardBg: '#3b0764',
        textColor: '#faf5ff',
        accentColor: '#c084fc',
        borderColor: '#6b21a8',
        subTextColor: '#e9d5ff',
        badgeBg: '#a855f7',
        badgeText: '#ffffff',
    },
    terracotta: {
        name: 'Earth Terracotta',
        bg: '#431407',
        cardBg: '#7c2d12',
        textColor: '#ffedd5',
        accentColor: '#fb923c',
        borderColor: '#9a3412',
        subTextColor: '#fed7aa',
        badgeBg: '#ea580c',
        badgeText: '#ffffff',
    },
    cyberpunk: {
        name: 'Cyber Neon',
        bg: '#0f172a',
        cardBg: '#1e293b',
        textColor: '#f1f5f9',
        accentColor: '#06b6d4',
        borderColor: '#d946ef',
        subTextColor: '#f472b6',
        badgeBg: '#06b6d4',
        badgeText: '#0f172a',
    },
    ocean: {
        name: 'Ocean Breeze',
        bg: '#082f49',
        cardBg: '#0c4a6e',
        textColor: '#f0f9ff',
        accentColor: '#38bdf8',
        borderColor: '#0284c7',
        subTextColor: '#bae6fd',
        badgeBg: '#38bdf8',
        badgeText: '#082f49',
    },
    sunflower: {
        name: 'Warm Sunflower',
        bg: '#fefce8',
        cardBg: '#fef9c3',
        textColor: '#422006',
        accentColor: '#ca8a04',
        borderColor: '#eab308',
        subTextColor: '#713f12',
        badgeBg: '#eab308',
        badgeText: '#422006',
    },
    matcha: {
        name: 'Matcha Zen',
        bg: '#14291e',
        cardBg: '#1f3d2e',
        textColor: '#ecfdf5',
        accentColor: '#84cc16',
        borderColor: '#4d7c0f',
        subTextColor: '#bef264',
        badgeBg: '#84cc16',
        badgeText: '#14291e',
    },
};

export interface FilterConfig {
    id: PhotoFilter;
    name: string;
    category: 'Essential' | 'Vintage' | 'Monochrome' | 'Aesthetic';
    description: string;
    cssFilter: string;
    previewColor: string;
}

export const PHOTO_FILTERS: FilterConfig[] = [
    {
        id: 'normal',
        name: 'Original',
        category: 'Essential',
        description: 'True-to-life crisp natural colors',
        cssFilter: 'none',
        previewColor: '#10b981',
    },
    {
        id: 'vivid',
        name: 'Vivid Party',
        category: 'Essential',
        description: 'Punchy saturated celebration pop',
        cssFilter: 'saturate(1.55) contrast(1.2) brightness(1.02)',
        previewColor: '#f43f5e',
    },
    {
        id: 'y2k',
        name: 'Y2K Flash',
        category: 'Essential',
        description: 'Bright 2000s digicam flash contrast',
        cssFilter: 'brightness(1.16) contrast(1.22) saturate(1.25)',
        previewColor: '#fbbf24',
    },
    {
        id: 'vintage',
        name: 'Warm 90s Film',
        category: 'Vintage',
        description: 'Nostalgic golden analog film tones',
        cssFilter: 'sepia(0.38) contrast(1.15) brightness(1.05) saturate(1.2)',
        previewColor: '#d97706',
    },
    {
        id: 'retro_fuji',
        name: '35mm Fuji',
        category: 'Vintage',
        description: 'Matte green shadows & film warmth',
        cssFilter: 'sepia(0.18) contrast(1.12) brightness(1.03) saturate(1.18) hue-rotate(-8deg)',
        previewColor: '#059669',
    },
    {
        id: 'polaroid',
        name: 'Polaroid Soft',
        category: 'Vintage',
        description: 'Soft shadows & nostalgic instant fade',
        cssFilter: 'contrast(1.08) brightness(1.1) saturate(0.95) sepia(0.12)',
        previewColor: '#a1a1aa',
    },
    {
        id: 'bw',
        name: 'B&W Editorial',
        category: 'Monochrome',
        description: 'Timeless high-contrast monochrome',
        cssFilter: 'grayscale(1) contrast(1.3) brightness(1.04)',
        previewColor: '#18181b',
    },
    {
        id: 'bw_soft',
        name: 'Silver Luster',
        category: 'Monochrome',
        description: 'Dreamy luminous soft black & white',
        cssFilter: 'grayscale(1) brightness(1.14) contrast(0.96)',
        previewColor: '#71717a',
    },
    {
        id: 'noir',
        name: 'Cinematic Noir',
        category: 'Monochrome',
        description: 'Dramatic deep shadows & dark mood',
        cssFilter: 'grayscale(1) contrast(1.5) brightness(0.92)',
        previewColor: '#09090b',
    },
    {
        id: 'golden',
        name: 'Golden Hour',
        category: 'Aesthetic',
        description: 'Sun-drenched radiant sunset glow',
        cssFilter: 'sepia(0.24) saturate(1.38) contrast(1.08) brightness(1.08)',
        previewColor: '#eab308',
    },
    {
        id: 'sunset',
        name: 'Coral Sunset',
        category: 'Aesthetic',
        description: 'Radiant peach-pink dusk radiance',
        cssFilter: 'sepia(0.32) saturate(1.42) contrast(1.12) hue-rotate(-22deg)',
        previewColor: '#f97316',
    },
    {
        id: 'pastel',
        name: 'Pastel Dream',
        category: 'Aesthetic',
        description: 'Soft dreamy K-pop booth look',
        cssFilter: 'contrast(0.92) brightness(1.14) saturate(0.9) hue-rotate(350deg)',
        previewColor: '#f472b6',
    },
    {
        id: 'nordic',
        name: 'Nordic Chill',
        category: 'Aesthetic',
        description: 'Cool crisp cinematic icy blues',
        cssFilter: 'contrast(1.12) brightness(1.03) saturate(0.85) hue-rotate(185deg)',
        previewColor: '#0ea5e9',
    },
    {
        id: 'emerald',
        name: 'Emerald Pop',
        category: 'Aesthetic',
        description: 'Vibrant eco greens & jewel tones',
        cssFilter: 'contrast(1.15) saturate(1.35) hue-rotate(-15deg)',
        previewColor: '#10b981',
    },
    {
        id: 'matcha',
        name: 'Matcha Zen',
        category: 'Aesthetic',
        description: 'Organic muted sage calmness',
        cssFilter: 'contrast(1.05) saturate(0.95) hue-rotate(35deg) brightness(1.04)',
        previewColor: '#84cc16',
    },
    {
        id: 'cyberpunk',
        name: 'Cyber Neon',
        category: 'Aesthetic',
        description: 'Futuristic electric magenta-cyan contrast',
        cssFilter: 'contrast(1.28) saturate(1.45) hue-rotate(290deg) brightness(1.04)',
        previewColor: '#a855f7',
    },
];

export const STICKER_CONFIG: Record<
    EcoSticker,
    { label: string; text: string; icon: string; subtitle: string }
> = {
    none: { label: 'None', text: '', icon: '', subtitle: '' },
    recycled: {
        label: '100% Recycled',
        text: '♻️ 100% RECYCLED SOUVENIR',
        icon: '♻️',
        subtitle: '5 PLASTIC BOTTLES DIVERTED',
    },
    hero: {
        label: 'Planet Hero',
        text: '🌍 PLANET HERO EDITION',
        icon: '🌍',
        subtitle: 'COMMITTED TO ZERO WASTE',
    },
    memories: {
        label: 'Eco Memories',
        text: '✨ ECO MEMORIES KEEPSAKE',
        icon: '✨',
        subtitle: 'CAPTURED WITH GREEN PRIDE',
    },
    warrior: {
        label: 'Waste Warrior',
        text: '🌿 WASTE WARRIOR SQUAD',
        icon: '🌿',
        subtitle: 'KEEPING OUR CAMPUS CLEAN',
    },
    climate: {
        label: 'Climate Champion',
        text: '🌱 CLIMATE CHAMPION',
        icon: '🌱',
        subtitle: 'ONE DEPOSIT AT A TIME',
    },
    ocean: {
        label: 'Ocean Guard',
        text: '🌊 CLEAN SEAS GUARD',
        icon: '🌊',
        subtitle: 'PROTECTING AQUATIC LIFE',
    },
    love: {
        label: 'Earth Lover',
        text: '💚 EARTH LOVER BADGE',
        icon: '💚',
        subtitle: 'NURTURE OUR FUTURE',
    },
    certified: {
        label: 'Eco Legend',
        text: '⭐ 5-BOTTLE LEGEND',
        icon: '⭐',
        subtitle: 'CERTIFIED RECYCLER',
    },
};

export const CAPTION_PRESETS = [
    'Turn Waste into Memories 🌱',
    'Best Friends Forever 👯‍♀️',
    'Zero Waste Crew ♻️',
    'Planet Over Plastics 🌍',
    'Eco Date Night 💕',
    'Making A Difference ✨',
    'Small Acts, Big Impact 🌿',
    'Campus Green Team 🎓',
];

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
 * Draw image object cropped and fitted into destination rect with optional filter and corners
 */
function drawImageProp(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number,
    y: number,
    w: number,
    h: number,
    radius = 8,
    filterId: PhotoFilter = 'normal'
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
    // Rounded or straight corners
    if (radius > 0) {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, radius);
        ctx.clip();
    } else {
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();
    }

    // Apply color filter
    const activeFilter = PHOTO_FILTERS.find((f) => f.id === filterId);
    if (activeFilter && activeFilter.cssFilter !== 'none') {
        ctx.filter = activeFilter.cssFilter;
    } else {
        ctx.filter = 'none';
    }

    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
    ctx.restore();
}

/**
 * Format date string based on chosen style
 */
function formatDisplayDate(dateStyle: DateStyle = 'standard', dateObj = new Date()): string | null {
    if (dateStyle === 'hide') return null;

    if (dateStyle === 'timestamp') {
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        const hh = String(dateObj.getHours()).padStart(2, '0');
        const mm = String(dateObj.getMinutes()).padStart(2, '0');
        return `${y}.${m}.${d} • ${hh}:${mm}`;
    }

    if (dateStyle === 'season') {
        const month = dateObj.getMonth();
        let season = 'Autumn';
        if (month >= 2 && month <= 4) season = 'Spring';
        else if (month >= 5 && month <= 7) season = 'Summer';
        else if (month >= 8 && month <= 10) season = 'Autumn';
        else season = 'Winter';
        return `${season} ${dateObj.getFullYear()}`;
    }

    return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
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
    const activeFilter = options.filter || 'normal';
    const activeSticker = options.sticker || 'none';
    const fontChoice = options.captionFont || 'handwriting';
    const cornerRadius = options.cornerStyle === 'classic' ? 0 : isStrip ? 8 : 12;

    // Canvas dimensions
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

    const dateStr = options.dateString || formatDisplayDate(options.dateStyle);
    const slogan = options.customCaption?.trim() || 'Turn Waste into Lasting Memories';

    // Caption Font Mapping
    const getCaptionFont = (isLarge: boolean) => {
        switch (fontChoice) {
            case 'editorial':
                return isLarge
                    ? 'italic 600 30px "Playfair Display", serif'
                    : 'italic 600 21px "Playfair Display", serif';
            case 'modern':
                return isLarge
                    ? 'bold 26px "Outfit", sans-serif'
                    : 'bold 18px "Outfit", sans-serif';
            case 'typewriter':
                return isLarge
                    ? '24px "JetBrains Mono", monospace'
                    : '16px "JetBrains Mono", monospace';
            case 'handwriting':
            default:
                return isLarge
                    ? '32px "Dancing Script", cursive'
                    : '23px "Dancing Script", cursive';
        }
    };

    if (isStrip) {
        // --- 2x6 VERTICAL STRIP LAYOUT ---
        const padX = 40;
        const topHeaderH = 115;
        const footerH = 185;
        const availableH = height - topHeaderH - footerH;
        const photoGap = 20;
        const photoW = width - padX * 2;
        const photoH = (availableH - photoGap * 3) / 4;

        // Top Header
        ctx.fillStyle = theme.accentColor;
        ctx.font = 'bold 24px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ECOMEMORIES', width / 2, 52);

        // Personalized slogan / custom caption
        ctx.fillStyle = theme.subTextColor;
        ctx.font = getCaptionFont(false);
        ctx.fillText(slogan, width / 2, 88);

        // Draw 4 photos
        images.forEach((img, i) => {
            const py = topHeaderH + i * (photoH + photoGap);

            // Photo frame background backing
            ctx.fillStyle = theme.cardBg;
            ctx.fillRect(padX - 4, py - 4, photoW + 8, photoH + 8);

            // Draw photo with filter and corners
            drawImageProp(ctx, img, padX, py, photoW, photoH, cornerRadius, activeFilter);

            // Subtle border
            ctx.strokeStyle = theme.borderColor;
            ctx.lineWidth = 2;
            if (cornerRadius > 0) {
                ctx.beginPath();
                ctx.roundRect(padX, py, photoW, photoH, cornerRadius);
                ctx.stroke();
            } else {
                ctx.strokeRect(padX, py, photoW, photoH);
            }
        });

        // Bottom Footer
        const footerY = height - footerH + 24;

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

        // Optional Eco Sticker Stamp
        if (activeSticker !== 'none' && STICKER_CONFIG[activeSticker]) {
            const sticker = STICKER_CONFIG[activeSticker];
            ctx.fillStyle = theme.accentColor;
            ctx.font = 'bold 14px "Outfit", sans-serif';
            ctx.fillText(sticker.text, width / 2, footerY + 60);

            ctx.fillStyle = theme.textColor;
            ctx.font = '600 12px "Inter", sans-serif';
            ctx.fillText(sticker.subtitle || '5 ITEMS RECYCLED • SOUVENIR EDITION', width / 2, footerY + 82);

            if (dateStr) {
                ctx.fillStyle = theme.subTextColor;
                ctx.font = '17px "Caveat", cursive';
                ctx.fillText(dateStr, width / 2, footerY + 106);
            }
        } else {
            ctx.fillStyle = theme.textColor;
            ctx.font = '600 13px "Inter", sans-serif';
            ctx.fillText('5 ITEMS RECYCLED • REWARD EDITION', width / 2, footerY + 64);

            if (dateStr) {
                ctx.fillStyle = theme.subTextColor;
                ctx.font = '18px "Caveat", cursive';
                ctx.fillText(dateStr, width / 2, footerY + 92);
            }
        }
    } else {
        // --- 2x2 GRID LAYOUT ---
        const pad = 60;
        const headerH = 140;
        const footerH = 170;
        const gap = 30;

        // Header
        ctx.fillStyle = theme.accentColor;
        ctx.font = 'bold 40px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ECOMEMORIES', width / 2, 68);

        // Personalized subtitle / custom caption
        ctx.fillStyle = theme.subTextColor;
        ctx.font = getCaptionFont(true);
        ctx.fillText(slogan, width / 2, 114);

        const availableW = width - pad * 2 - gap;
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

            drawImageProp(ctx, img, px, py, photoW, photoH, cornerRadius, activeFilter);

            ctx.strokeStyle = theme.borderColor;
            ctx.lineWidth = 3;
            if (cornerRadius > 0) {
                ctx.beginPath();
                ctx.roundRect(px, py, photoW, photoH, cornerRadius);
                ctx.stroke();
            } else {
                ctx.strokeRect(px, py, photoW, photoH);
            }
        });

        // Footer
        const footerY = height - footerH + 32;
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

        // Optional Eco Sticker Stamp
        if (activeSticker !== 'none' && STICKER_CONFIG[activeSticker]) {
            const sticker = STICKER_CONFIG[activeSticker];
            ctx.fillStyle = theme.accentColor;
            ctx.font = 'bold 17px "Outfit", sans-serif';
            ctx.fillText(sticker.text, width / 2, footerY + 68);

            ctx.fillStyle = theme.textColor;
            ctx.font = 'bold 14px "Inter", sans-serif';
            ctx.fillText(sticker.subtitle || '5 ITEMS RECYCLED • GREEN HERO', width / 2, footerY + 92);

            if (dateStr) {
                ctx.fillStyle = theme.subTextColor;
                ctx.font = '22px "Caveat", cursive';
                ctx.fillText(dateStr, width / 2, footerY + 118);
            }
        } else {
            ctx.fillStyle = theme.textColor;
            ctx.font = 'bold 16px "Inter", sans-serif';
            ctx.fillText('5 ITEMS RECYCLED', width / 2, footerY + 70);

            if (dateStr) {
                ctx.fillStyle = theme.subTextColor;
                ctx.font = '24px "Caveat", cursive';
                ctx.fillText(dateStr, width / 2, footerY + 98);
            }
        }
    }

    return canvas.toDataURL('image/jpeg', 0.95);
}
