// shared/arcade/ArcadeManager.js
// Core arcade system for player profiles, statistics, and cross-game functionality

class ArcadeManager {
    constructor() {
        this.firebase = null;
        this.player = null;
        this.currentGame = null;
        this._playerListeners = [];
        this._initialized = false;
    }

    /**
     * Initialize the arcade manager
     * @param {Object} options - Configuration options
     * @param {Object} options.firebaseConfig - Firebase configuration
     * @returns {Promise<ArcadeManager>}
     */
    async initialize(options = {}) {
        if (this._initialized) return this;

        try {
            // Initialize Firebase manager
            this.firebase = new FirebaseManager();

            // Load firebase config
            let config = options.firebaseConfig;
            if (!config) {
                // Try to load from global config
                config = window.FIREBASE_CONFIG || null;
            }

            await this.firebase.initialize(config);

            // Load or create player profile
            if (this.firebase.isAuthenticated) {
                this.player = await this._loadOrCreatePlayer();
            }

            this._initialized = true;
            console.log('ArcadeManager initialized');

        } catch (error) {
            console.error('ArcadeManager initialization failed:', error);
            // Continue in offline mode
            this._initialized = true;
        }

        return this;
    }

    /**
     * Load existing player or create new profile
     * @returns {Promise<Object>}
     */
    async _loadOrCreatePlayer() {
        const userId = this.firebase.supabaseUserId;
        const playerRef = this.firebase.playerRef();

        if (!playerRef) {
            return this._createLocalPlayer();
        }

        try {
            const snapshot = await playerRef.once('value');

            if (snapshot.exists()) {
                const player = snapshot.val();
                // Update last seen
                await playerRef.update({
                    last_seen: this.firebase.serverTimestamp,
                    status: 'online'
                });
                console.log('Loaded existing player profile');
                return player;
            }

            // Create new player
            const newPlayer = {
                supabase_user_id: userId,
                display_name: this.firebase.displayName,
                avatar_id: 'default',
                created_at: this.firebase.serverTimestamp,
                last_seen: this.firebase.serverTimestamp,
                status: 'online',
                current_match: null,
                total_games_played: 0,
                achievements: [],
                verified: true
            };

            await playerRef.set(newPlayer);
            console.log('Created new player profile');
            return newPlayer;

        } catch (error) {
            console.error('Error loading/creating player:', error);
            return this._createLocalPlayer();
        }
    }

    /**
     * Create a local-only player (offline mode)
     */
    _createLocalPlayer() {
        return {
            supabase_user_id: 'local_' + Date.now(),
            display_name: this.firebase?.displayName || 'Player',
            avatar_id: 'default',
            created_at: Date.now(),
            last_seen: Date.now(),
            status: 'offline',
            current_match: null,
            total_games_played: 0,
            achievements: [],
            verified: false
        };
    }

    /**
     * Update player profile
     * @param {Object} updates - Fields to update
     */
    async updatePlayer(updates) {
        if (this.player) {
            Object.assign(this.player, updates);
        }

        const playerRef = this.firebase?.playerRef();
        if (playerRef) {
            try {
                await playerRef.update({
                    ...updates,
                    last_seen: this.firebase.serverTimestamp
                });
            } catch (error) {
                console.error('Error updating player:', error);
            }
        }

        this._notifyPlayerListeners();
    }

    /**
     * Set player's current game
     * @param {string} gameId - Game identifier
     */
    async setCurrentGame(gameId) {
        this.currentGame = gameId;
        await this.updatePlayer({ current_game: gameId });
    }

    /**
     * Set player's current match
     * @param {string} matchId - Match identifier or null
     */
    async setCurrentMatch(matchId) {
        await this.updatePlayer({
            current_match: matchId,
            status: matchId ? 'in_game' : 'online'
        });
    }

    /**
     * Increment total games played
     */
    async incrementGamesPlayed() {
        if (this.player) {
            this.player.total_games_played = (this.player.total_games_played || 0) + 1;
        }

        const playerRef = this.firebase?.playerRef();
        if (playerRef) {
            try {
                await playerRef.child('total_games_played').transaction(count => (count || 0) + 1);
            } catch (error) {
                console.error('Error incrementing games played:', error);
            }
        }
    }

    // ==========================================
    // Game-Specific Data
    // ==========================================

    /**
     * Get collection for a specific game
     * @param {string} gameId - Game identifier
     * @returns {Promise<Object>}
     */
    async getCollection(gameId) {
        const ref = this.firebase?.gameRef(gameId, `collections/${this.firebase.supabaseUserId}`);
        if (!ref) return { cards: {}, starter_deck_claimed: false };

        try {
            const snapshot = await ref.once('value');
            return snapshot.val() || { cards: {}, starter_deck_claimed: false };
        } catch (error) {
            console.error('Error loading collection:', error);
            return { cards: {}, starter_deck_claimed: false };
        }
    }

    /**
     * Update collection for a specific game
     * @param {string} gameId - Game identifier
     * @param {Object} collection - Collection data
     */
    async saveCollection(gameId, collection) {
        const ref = this.firebase?.gameRef(gameId, `collections/${this.firebase.supabaseUserId}`);
        if (!ref) return;

        try {
            await ref.set({
                ...collection,
                last_updated: this.firebase.serverTimestamp
            });
        } catch (error) {
            console.error('Error saving collection:', error);
        }
    }

    /**
     * Add cards to collection
     * @param {string} gameId - Game identifier
     * @param {Object} cardsToAdd - { cardId: quantity }
     */
    async addToCollection(gameId, cardsToAdd) {
        const collection = await this.getCollection(gameId);

        for (const [cardId, qty] of Object.entries(cardsToAdd)) {
            if (!collection.cards[cardId]) {
                collection.cards[cardId] = { quantity: 0, earned_at: Date.now() };
            }
            collection.cards[cardId].quantity += qty;
        }

        await this.saveCollection(gameId, collection);
        return collection;
    }

    /**
     * Get saved decks for a game
     * @param {string} gameId - Game identifier
     * @returns {Promise<Object>}
     */
    async getDecks(gameId) {
        const ref = this.firebase?.gameRef(gameId, `decks/${this.firebase.supabaseUserId}`);
        if (!ref) return {};

        try {
            const snapshot = await ref.once('value');
            return snapshot.val() || {};
        } catch (error) {
            console.error('Error loading decks:', error);
            return {};
        }
    }

    /**
     * Save a deck
     * @param {string} gameId - Game identifier
     * @param {Object} deck - Deck data
     * @returns {Promise<string>} Deck ID
     */
    async saveDeck(gameId, deck) {
        const ref = this.firebase?.gameRef(gameId, `decks/${this.firebase.supabaseUserId}`);
        if (!ref) return null;

        try {
            const deckId = deck.id || this.firebase.generateId();
            await ref.child(deckId).set({
                ...deck,
                id: deckId,
                updated_at: this.firebase.serverTimestamp,
                created_at: deck.created_at || this.firebase.serverTimestamp
            });
            return deckId;
        } catch (error) {
            console.error('Error saving deck:', error);
            return null;
        }
    }

    /**
     * Delete a deck
     * @param {string} gameId - Game identifier
     * @param {string} deckId - Deck ID
     */
    async deleteDeck(gameId, deckId) {
        const ref = this.firebase?.gameRef(gameId, `decks/${this.firebase.supabaseUserId}/${deckId}`);
        if (!ref) return;

        try {
            await ref.remove();
        } catch (error) {
            console.error('Error deleting deck:', error);
        }
    }

    /**
     * Get player statistics for a game
     * @param {string} gameId - Game identifier
     * @returns {Promise<Object>}
     */
    async getStats(gameId) {
        const ref = this.firebase?.gameRef(gameId, `stats/${this.firebase.supabaseUserId}`);
        if (!ref) return this._getDefaultStats();

        try {
            const snapshot = await ref.once('value');
            return snapshot.val() || this._getDefaultStats();
        } catch (error) {
            console.error('Error loading stats:', error);
            return this._getDefaultStats();
        }
    }

    /**
     * Update player statistics
     * @param {string} gameId - Game identifier
     * @param {Object} updates - Stats to update
     */
    async updateStats(gameId, updates) {
        const ref = this.firebase?.gameRef(gameId, `stats/${this.firebase.supabaseUserId}`);
        if (!ref) return;

        try {
            const current = await this.getStats(gameId);
            const newStats = { ...current, ...updates, last_updated: this.firebase.serverTimestamp };
            await ref.set(newStats);
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    /**
     * Record a game result
     * @param {string} gameId - Game identifier
     * @param {Object} result - { won: boolean, opponent: string, score: number }
     */
    async recordGameResult(gameId, result) {
        const stats = await this.getStats(gameId);

        if (result.won) {
            stats.wins = (stats.wins || 0) + 1;
            stats.current_streak = (stats.current_streak || 0) + 1;
            stats.best_streak = Math.max(stats.best_streak || 0, stats.current_streak);
        } else {
            stats.losses = (stats.losses || 0) + 1;
            stats.current_streak = 0;
        }

        stats.total_games = (stats.total_games || 0) + 1;
        stats.last_played = Date.now();

        // Simple rating calculation (ELO-like)
        if (result.ranked) {
            const k = 32;
            const opponentRating = result.opponentRating || 1000;
            const expected = 1 / (1 + Math.pow(10, (opponentRating - (stats.ranked_rating || 1000)) / 400));
            const actual = result.won ? 1 : 0;
            stats.ranked_rating = Math.round((stats.ranked_rating || 1000) + k * (actual - expected));
        }

        await this.updateStats(gameId, stats);
        await this.incrementGamesPlayed();

        return stats;
    }

    _getDefaultStats() {
        return {
            wins: 0,
            losses: 0,
            total_games: 0,
            current_streak: 0,
            best_streak: 0,
            ranked_rating: 1000,
            last_played: null
        };
    }

    // ==========================================
    // Player Listeners
    // ==========================================

    /**
     * Subscribe to player profile changes
     * @param {Function} callback - Called when player data changes
     */
    onPlayerChange(callback) {
        this._playerListeners.push(callback);
        // Immediately call with current data
        if (this.player) callback(this.player);

        // Set up Firebase listener if available
        const playerRef = this.firebase?.playerRef();
        if (playerRef) {
            playerRef.on('value', (snapshot) => {
                if (snapshot.exists()) {
                    this.player = snapshot.val();
                    this._notifyPlayerListeners();
                }
            });
        }
    }

    /**
     * Unsubscribe from player changes
     */
    offPlayerChange(callback) {
        this._playerListeners = this._playerListeners.filter(cb => cb !== callback);
    }

    _notifyPlayerListeners() {
        this._playerListeners.forEach(cb => cb(this.player));
    }

    // ==========================================
    // Utility
    // ==========================================

    /**
     * Check if arcade is online
     */
    get isOnline() {
        return this.firebase?.isOnline || false;
    }

    /**
     * Check if arcade is initialized
     */
    get isInitialized() {
        return this._initialized;
    }

    /**
     * Get current user's Supabase ID
     */
    get userId() {
        return this.firebase?.supabaseUserId || this.player?.supabase_user_id;
    }

    /**
     * Clean up resources
     */
    destroy() {
        this._playerListeners = [];
        this.firebase?.destroy();
    }
}

// Create global instance
window.ArcadeManager = ArcadeManager;

// Global arcade instance (initialized by games)
window.arcade = null;

/**
 * Helper function to initialize arcade system
 * @param {Object} options - Configuration options
 * @returns {Promise<ArcadeManager>}
 */
async function initializeArcade(options = {}) {
    if (window.arcade && window.arcade.isInitialized) {
        return window.arcade;
    }

    window.arcade = new ArcadeManager();
    await window.arcade.initialize(options);
    return window.arcade;
}

window.initializeArcade = initializeArcade;

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ArcadeManager, initializeArcade };
}
