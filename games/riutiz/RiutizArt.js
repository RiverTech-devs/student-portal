// games/riutiz/RiutizArt.js
// Card art management for RIUTIZ - handles placeholders and actual art

class RiutizArt {
    constructor(basePath = 'Data/Riutiz/Art') {
        this.basePath = basePath;
        this.loadedImages = new Map();
        this.failedImages = new Set();
    }

    /**
     * Get the art URL for a card
     * Falls back to type-based placeholder if card art doesn't exist
     */
    getCardArtUrl(cardId, cardType) {
        // First try the specific card art
        const cardPath = `${this.basePath}/cards/${cardId}.png`;

        // If we already know this failed, use placeholder
        if (this.failedImages.has(cardPath)) {
            return this.getPlaceholderUrl(cardType);
        }

        return cardPath;
    }

    /**
     * Get placeholder URL based on card type
     */
    getPlaceholderUrl(cardType) {
        if (!cardType) return `${this.basePath}/placeholders/unknown.svg`;

        if (cardType.includes('Pupil')) {
            return `${this.basePath}/placeholders/pupil.svg`;
        } else if (cardType === 'Interruption') {
            return `${this.basePath}/placeholders/interruption.svg`;
        } else if (cardType === 'Tool') {
            return `${this.basePath}/placeholders/tool.svg`;
        } else if (cardType === 'Location') {
            return `${this.basePath}/placeholders/location.svg`;
        }

        return `${this.basePath}/placeholders/unknown.svg`;
    }

    /**
     * Get inline SVG placeholder for a card type
     * Used when external files aren't available
     */
    getInlinePlaceholder(cardType, color = '#71717a') {
        const colorHex = this.getColorHex(color);

        if (!cardType) {
            return this.createSvg('?', colorHex);
        }

        if (cardType.includes('Pupil')) {
            return this.createPupilSvg(colorHex);
        } else if (cardType === 'Interruption') {
            return this.createInterruptionSvg(colorHex);
        } else if (cardType === 'Tool') {
            return this.createToolSvg(colorHex);
        } else if (cardType === 'Location') {
            return this.createLocationSvg(colorHex);
        }

        return this.createSvg('?', colorHex);
    }

    /**
     * Create a simple SVG with text
     */
    createSvg(text, color) {
        return `data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <rect width="100" height="100" fill="${color}" opacity="0.2"/>
                <text x="50" y="60" text-anchor="middle" font-family="sans-serif" font-size="40" fill="${color}">${text}</text>
            </svg>
        `)}`;
    }

    /**
     * Create pupil placeholder SVG (person silhouette)
     */
    createPupilSvg(color) {
        return `data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <rect width="100" height="100" fill="${color}" opacity="0.1"/>
                <circle cx="50" cy="30" r="18" fill="${color}" opacity="0.6"/>
                <ellipse cx="50" cy="80" rx="28" ry="30" fill="${color}" opacity="0.6"/>
            </svg>
        `)}`;
    }

    /**
     * Create interruption placeholder SVG (lightning bolt)
     */
    createInterruptionSvg(color) {
        return `data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <rect width="100" height="100" fill="${color}" opacity="0.1"/>
                <polygon points="55,10 30,50 45,50 40,90 70,45 52,45" fill="${color}" opacity="0.7"/>
            </svg>
        `)}`;
    }

    /**
     * Create tool placeholder SVG (wrench)
     */
    createToolSvg(color) {
        return `data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <rect width="100" height="100" fill="${color}" opacity="0.1"/>
                <rect x="25" y="45" width="50" height="12" rx="3" fill="${color}" opacity="0.7" transform="rotate(-45 50 50)"/>
                <circle cx="28" cy="28" r="12" fill="none" stroke="${color}" stroke-width="6" opacity="0.7"/>
            </svg>
        `)}`;
    }

    /**
     * Create location placeholder SVG (building)
     */
    createLocationSvg(color) {
        return `data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <rect width="100" height="100" fill="${color}" opacity="0.1"/>
                <rect x="20" y="35" width="60" height="55" fill="${color}" opacity="0.6"/>
                <polygon points="50,15 15,40 85,40" fill="${color}" opacity="0.7"/>
                <rect x="35" y="55" width="12" height="15" fill="${color}" opacity="0.3"/>
                <rect x="53" y="55" width="12" height="15" fill="${color}" opacity="0.3"/>
                <rect x="40" y="75" width="20" height="15" fill="${color}" opacity="0.3"/>
            </svg>
        `)}`;
    }

    /**
     * Preload an image and track failures
     */
    async preloadImage(url) {
        if (this.loadedImages.has(url)) {
            return this.loadedImages.get(url);
        }

        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                this.loadedImages.set(url, true);
                resolve(true);
            };
            img.onerror = () => {
                this.failedImages.add(url);
                resolve(false);
            };
            img.src = url;
        });
    }

    /**
     * Preload all card images
     */
    async preloadAllCards(cardData) {
        const promises = cardData.map(card => {
            const url = this.getCardArtUrl(card.id, card.type);
            return this.preloadImage(url);
        });

        await Promise.all(promises);
        console.log(`Preloaded ${this.loadedImages.size} images, ${this.failedImages.size} will use placeholders`);
    }

    /**
     * Get color hex for a color code
     */
    getColorHex(colorCode) {
        const colors = {
            'O': '#f97316',
            'G': '#22c55e',
            'P': '#a855f7',
            'B': '#3b82f6',
            'Bk': '#a1a1aa',
            'C': '#d4d4d8'
        };
        return colors[colorCode] || colors['C'];
    }

    /**
     * Render card art element
     * Returns either an img element or inline SVG
     */
    renderCardArt(card, size = 'small') {
        const color = this.getCardPrimaryColor(card.cost);
        const colorHex = this.getColorHex(color);

        // For now, always use inline placeholders for consistency
        // Real implementation would check if image exists first
        const inlineSvg = this.getInlinePlaceholder(card.type, color);

        const sizes = {
            'small': { width: '100%', height: '2rem' },
            'medium': { width: '100%', height: '4rem' },
            'large': { width: '100%', height: '6rem' },
            'preview': { width: '100%', height: '8rem' }
        };

        const s = sizes[size] || sizes['small'];

        return `<img src="${inlineSvg}" style="width: ${s.width}; height: ${s.height}; object-fit: contain;" alt="${card.name}">`;
    }

    /**
     * Get primary color from cost string
     */
    getCardPrimaryColor(costStr) {
        if (!costStr) return 'C';
        const matches = costStr.match(/\(([^)]+)\)/g) || [];
        for (const m of matches) {
            const val = m.replace(/[()]/g, '');
            if (!/^\d+$/.test(val)) return val;
        }
        return 'C';
    }
}

// Export
window.RiutizArt = RiutizArt;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RiutizArt };
}
