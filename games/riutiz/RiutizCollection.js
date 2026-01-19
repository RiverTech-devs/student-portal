// games/riutiz/RiutizCollection.js
// Card collection management for RIUTIZ

class RiutizCollection {
    constructor(arcade, cardData) {
        this.arcade = arcade;
        this.cardData = cardData;
        this.collection = { cards: {}, starter_deck_claimed: false };
        this.gameId = 'riutiz';
    }

    /**
     * Load collection from Firebase
     */
    async load() {
        if (this.arcade && this.arcade.isOnline) {
            this.collection = await this.arcade.getCollection(this.gameId);
        } else {
            // Load from localStorage for offline play
            const saved = localStorage.getItem('riutiz_collection');
            if (saved) {
                this.collection = JSON.parse(saved);
            }
        }

        // Grant starter deck if first time
        if (!this.collection.starter_deck_claimed) {
            await this.grantStarterCollection();
        }

        return this.collection;
    }

    /**
     * Save collection
     */
    async save() {
        if (this.arcade && this.arcade.isOnline) {
            await this.arcade.saveCollection(this.gameId, this.collection);
        } else {
            localStorage.setItem('riutiz_collection', JSON.stringify(this.collection));
        }
    }

    /**
     * Grant starter collection to new players
     */
    async grantStarterCollection() {
        // Load starter collection from JSON or use defaults
        const starterCards = await this.getStarterCollection();

        for (const [cardId, quantity] of Object.entries(starterCards)) {
            this.collection.cards[cardId] = {
                quantity: quantity,
                earned_at: Date.now()
            };
        }

        this.collection.starter_deck_claimed = true;
        this.collection.total_cards = this.getTotalCards();

        await this.save();
        console.log('Starter collection granted');
    }

    /**
     * Get starter collection definition
     */
    async getStarterCollection() {
        try {
            const response = await fetch('Data/Riutiz/starter-decks.json');
            if (response.ok) {
                const data = await response.json();
                return data.starter_collection?.cards || this.getDefaultStarterCards();
            }
        } catch (e) {
            console.warn('Could not load starter decks, using defaults');
        }

        return this.getDefaultStarterCards();
    }

    /**
     * Default starter cards if no JSON available
     */
    getDefaultStarterCards() {
        const cards = {};

        // Give 4 copies of first 30 common cards (or all cards if fewer)
        const commonCards = this.cardData.filter(c => c.rarity === 'C').slice(0, 30);
        commonCards.forEach(c => {
            cards[c.id] = 4;
        });

        // Give 2 copies of first 10 uncommon cards
        const uncommonCards = this.cardData.filter(c => c.rarity === 'U').slice(0, 10);
        uncommonCards.forEach(c => {
            cards[c.id] = 2;
        });

        // Give 1 copy of first 5 rare cards
        const rareCards = this.cardData.filter(c => c.rarity === 'R').slice(0, 5);
        rareCards.forEach(c => {
            cards[c.id] = 1;
        });

        return cards;
    }

    /**
     * Get quantity of a specific card owned
     */
    getQuantity(cardId) {
        return this.collection.cards[cardId]?.quantity || 0;
    }

    /**
     * Check if player owns at least one copy of a card
     */
    owns(cardId) {
        return this.getQuantity(cardId) > 0;
    }

    /**
     * Add cards to collection
     */
    async addCards(cardsToAdd) {
        for (const [cardId, quantity] of Object.entries(cardsToAdd)) {
            if (!this.collection.cards[cardId]) {
                this.collection.cards[cardId] = { quantity: 0, earned_at: Date.now() };
            }
            this.collection.cards[cardId].quantity += quantity;
        }

        this.collection.total_cards = this.getTotalCards();
        await this.save();
    }

    /**
     * Get total number of cards in collection
     */
    getTotalCards() {
        return Object.values(this.collection.cards)
            .reduce((sum, c) => sum + (c.quantity || 0), 0);
    }

    /**
     * Get all owned cards with full data
     */
    getOwnedCards() {
        return this.cardData.filter(card => this.owns(card.id))
            .map(card => ({
                ...card,
                owned: this.getQuantity(card.id)
            }));
    }

    /**
     * Get cards by color
     */
    getCardsByColor(color) {
        return this.getOwnedCards().filter(card => {
            const primaryColor = this.getPrimaryColor(card.cost);
            return primaryColor === color;
        });
    }

    /**
     * Get cards by type
     */
    getCardsByType(type) {
        return this.getOwnedCards().filter(card =>
            card.type?.toLowerCase().includes(type.toLowerCase())
        );
    }

    /**
     * Get cards by rarity
     */
    getCardsByRarity(rarity) {
        return this.getOwnedCards().filter(card => card.rarity === rarity);
    }

    /**
     * Get collection stats
     */
    getStats() {
        const owned = this.getOwnedCards();
        const total = this.cardData.length;

        const byRarity = {
            C: { owned: 0, total: 0 },
            U: { owned: 0, total: 0 },
            R: { owned: 0, total: 0 }
        };

        this.cardData.forEach(card => {
            byRarity[card.rarity || 'C'].total++;
        });

        owned.forEach(card => {
            byRarity[card.rarity || 'C'].owned++;
        });

        return {
            uniqueOwned: owned.length,
            uniqueTotal: total,
            completionPercent: Math.round((owned.length / total) * 100),
            totalCards: this.getTotalCards(),
            byRarity
        };
    }

    /**
     * Helper to get primary color from cost string
     */
    getPrimaryColor(costStr) {
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
window.RiutizCollection = RiutizCollection;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RiutizCollection };
}
