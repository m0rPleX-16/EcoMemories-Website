/**
 * EcoMemories Thermal Printer Image Processing & ESC/POS Raster Converter
 *
 * Converts photostrips into clean, high-contrast, portrait-optimized 1-bit monochrome
 * bitmaps specifically engineered for 58mm (384 dots) and 80mm (576 dots) ESC/POS thermal printers.
 *
 * Key features:
 * 1. Smart Clean White Paper: Converts dark theme backgrounds (like Forest Emerald) to clean white receipt paper
 *    with crisp black lettering (preventing muddy black blocks and ink burn).
 * 2. Portrait Gamma Correction: Lifts midtones so facial features and smiles are bright and luminous.
 * 3. Atkinson Dithering: Apple's iconic 1-bit halftone algorithm that prevents grain clusters on skin tones.
 */

export interface DitherOptions {
    /** Target printer paper width in dots (standard 58mm = 384, 80mm = 576) */
    targetWidth?: number;
    /** Contrast adjustment multiplier (1.0 = normal, 1.25 = crisp shadows) */
    contrast?: number;
    /** Brightness adjustment (-50 to +50, default 8) */
    brightness?: number;
    /** Gamma curve (< 1.0 lifts midtones for faces, default 0.68) */
    gamma?: number;
    /** Halftone algorithm: 'atkinson' (clean skin tones) or 'floyd-steinberg' */
    algorithm?: 'atkinson' | 'floyd-steinberg';
    /** Auto-detect dark backgrounds and convert them into clean white receipt paper */
    cleanWhitePaper?: boolean;
}

export interface DitherResult {
    /** 1-bit monochrome data URL (image/png) for displaying high-fidelity preview on the tablet */
    previewDataUrl: string;
    /** Width in dots */
    width: number;
    /** Height in dots */
    height: number;
    /** Raw ESC/POS bytes including GS v 0 raster header ready to write to printer */
    escposBytes: Uint8Array;
    /** Base64 encoded ESC/POS raster payload for streaming over JSON HTTP to ESP32 */
    escposBase64: string;
}

/**
 * Load an image from a URL or Data URL into an HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = src;
    });
}

/**
 * Converts a color image into a clean, high-contrast 1-bit ESC/POS raster bitmap.
 */
export async function convertToThermalBitmap(
    imageSrc: string,
    options: DitherOptions = {}
): Promise<DitherResult> {
    const targetWidth = options.targetWidth || 384; // 58mm standard = 384 dots (48 bytes per line)
    const contrast = options.contrast ?? 1.25;
    const brightness = options.brightness ?? 8;
    const gamma = options.gamma ?? 0.68; // Midtone lift for glowing faces
    const algorithm = options.algorithm ?? 'atkinson';
    const cleanWhitePaper = options.cleanWhitePaper ?? true;

    const img = await loadImage(imageSrc);

    // Calculate aspect ratio height
    const scale = targetWidth / (img.naturalWidth || img.width);
    const targetHeight = Math.round((img.naturalHeight || img.height) * scale);

    // 1. Render scaled image onto an offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Could not obtain 2D canvas context');

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    const data = imgData.data;

    // 2. Analyze border/corner color to check if digital theme is dark (e.g. Forest Emerald)
    const corners = [
        0,
        (targetWidth - 1) * 4,
        ((targetHeight - 1) * targetWidth) * 4,
        ((targetHeight - 1) * targetWidth + targetWidth - 1) * 4,
    ];
    let avgR = 0, avgG = 0, avgB = 0;
    for (const c of corners) {
        avgR += data[c];
        avgG += data[c + 1];
        avgB += data[c + 2];
    }
    avgR /= 4;
    avgG /= 4;
    avgB /= 4;
    const cornerLum = 0.299 * avgR + 0.587 * avgG + 0.114 * avgB;
    const isDarkTheme = cornerLum < 90;

    // 3. Pre-process pixels: Smart white receipt background + Portrait gamma
    const gray = new Float32Array(targetWidth * targetHeight);

    for (let y = 0; y < targetHeight; y++) {
        const isHeader = y < targetHeight * 0.11;
        const isFooter = y > targetHeight * 0.88;
        const isMiddleY = y >= targetHeight * 0.11 && y <= targetHeight * 0.88;

        for (let x = 0; x < targetWidth; x++) {
            const idx = (y * targetWidth + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;

            if (isDarkTheme && cleanWhitePaper) {
                const colorDist = Math.abs(r - avgR) + Math.abs(g - avgG) + Math.abs(b - avgB);
                const isNearBg = colorDist < 55 || (lum < 40 && cornerLum < 40);

                if (isHeader || isFooter) {
                    // Header/Footer text: Dark bg becomes pure white paper, light text becomes crisp black
                    gray[y * targetWidth + x] = isNearBg ? 255 : 0;
                    continue;
                }

                const isSideMargin = isMiddleY && (x < targetWidth * 0.05 || x > targetWidth * 0.95);
                if (isSideMargin || isNearBg) {
                    // Outer margins around photos become clean white paper
                    gray[y * targetWidth + x] = 255;
                    continue;
                }
            }

            // Photo pixel: Apply gamma curve to brighten facial midtones
            let normalized = Math.max(0, Math.min(1, lum / 255));
            let lifted = Math.pow(normalized, gamma); // Lifts midtones from dark shadows

            // Apply contrast curve
            let adjusted = (lifted * 255 - 128) * contrast + 128 + brightness;
            gray[y * targetWidth + x] = Math.max(0, Math.min(255, adjusted));
        }
    }

    // 4. Halftone Dithering
    // Black dot = 1 (heated thermal element), White space = 0 (clean paper)
    const binary = new Uint8Array(targetWidth * targetHeight);
    const threshold = 135; // Slightly biased toward bright highlights

    if (algorithm === 'atkinson') {
        // Atkinson Algorithm (Apple 1-bit portrait standard: 75% error diffused across 6 neighbors)
        for (let y = 0; y < targetHeight; y++) {
            for (let x = 0; x < targetWidth; x++) {
                const idx = y * targetWidth + x;
                const oldVal = gray[idx];
                const newVal = oldVal < threshold ? 0 : 255;
                binary[idx] = newVal === 0 ? 1 : 0;

                const err = Math.round((oldVal - newVal) / 8);
                if (err === 0) continue;

                if (x + 1 < targetWidth) gray[idx + 1] += err;
                if (x + 2 < targetWidth) gray[idx + 2] += err;
                if (y + 1 < targetHeight) {
                    if (x - 1 >= 0) gray[idx + targetWidth - 1] += err;
                    gray[idx + targetWidth] += err;
                    if (x + 1 < targetWidth) gray[idx + targetWidth + 1] += err;
                }
                if (y + 2 < targetHeight) {
                    gray[idx + targetWidth * 2] += err;
                }
            }
        }
    } else {
        // Floyd-Steinberg algorithm
        for (let y = 0; y < targetHeight; y++) {
            for (let x = 0; x < targetWidth; x++) {
                const idx = y * targetWidth + x;
                const oldVal = gray[idx];
                const newVal = oldVal < threshold ? 0 : 255;
                binary[idx] = newVal === 0 ? 1 : 0;

                const err = oldVal - newVal;
                if (x + 1 < targetWidth) gray[idx + 1] += (err * 7) / 16;
                if (y + 1 < targetHeight) {
                    if (x - 1 >= 0) gray[idx + targetWidth - 1] += (err * 3) / 16;
                    gray[idx + targetWidth] += (err * 5) / 16;
                    if (x + 1 < targetWidth) gray[idx + targetWidth + 1] += (err * 1) / 16;
                }
            }
        }
    }

    // 5. Generate high-fidelity preview image data for the tablet screen
    for (let i = 0; i < binary.length; i++) {
        const idx = i * 4;
        const color = binary[i] === 1 ? 0 : 255; // 0 = black pixel, 255 = clean white paper
        data[idx] = color;
        data[idx + 1] = color;
        data[idx + 2] = color;
        data[idx + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
    const previewDataUrl = canvas.toDataURL('image/png');

    // 6. Pack 1-bit pixels into ESC/POS Raster Bit Image format:
    // Command: GS v 0 m xL xH yL yH d1...dk
    // 0x1D 0x76 0x30 0x00 (Normal mode)
    const bytesPerLine = Math.ceil(targetWidth / 8);
    const xL = bytesPerLine % 256;
    const xH = Math.floor(bytesPerLine / 256);
    const yL = targetHeight % 256;
    const yH = Math.floor(targetHeight / 256);

    const header = [0x1D, 0x76, 0x30, 0x00, xL, xH, yL, yH];
    const totalBitmapBytes = bytesPerLine * targetHeight;
    const escposBytes = new Uint8Array(header.length + totalBitmapBytes);
    escposBytes.set(header, 0);

    let byteOffset = header.length;
    for (let y = 0; y < targetHeight; y++) {
        for (let b = 0; b < bytesPerLine; b++) {
            let byteVal = 0;
            for (let bit = 0; bit < 8; bit++) {
                const x = b * 8 + bit;
                if (x < targetWidth) {
                    if (binary[y * targetWidth + x] === 1) {
                        byteVal |= (1 << (7 - bit)); // MSB first
                    }
                }
            }
            escposBytes[byteOffset++] = byteVal;
        }
    }

    // 7. Encode bytes to Base64 for HTTP JSON transfer
    let binaryString = '';
    const chunkSize = 8192;
    for (let i = 0; i < escposBytes.length; i += chunkSize) {
        const chunk = escposBytes.subarray(i, i + chunkSize);
        binaryString += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const escposBase64 = btoa(binaryString);

    return {
        previewDataUrl,
        width: targetWidth,
        height: targetHeight,
        escposBytes,
        escposBase64,
    };
}
