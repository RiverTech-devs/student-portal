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
                // Update last seen and sync display name from Supabase
                const currentDisplayName = this.firebase.displayName;
                const updateData = {
                    last_seen: this.firebase.serverTimestamp,
                    status: 'online'
                };

                // Sync display name (username) if it changed in Supabase
                if (currentDisplayName && currentDisplayName !== player.display_name) {
                    updateData.display_name = currentDisplayName;
                    player.display_name = currentDisplayName;
                    console.log('Synced username from Supabase:', currentDisplayName);
                }

                await playerRef.update(updateData);
                console.log('Loaded existing player profile');
                return player;
            }

            // Create new player
            const newPlayer = {
                supabase_user_id: userId,
                display_name: this.firebase.displayName,
                avatar_id: 'default',
                title_id: 'none',
                frame_id: 'none',
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
            title_id: 'none',
            frame_id: 'none',
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

    // ==========================================
    // Profile Customization
    // ==========================================

    /**
     * Set player's avatar
     * @param {string} avatarId - Avatar ID
     */
    async setAvatar(avatarId) {
        await this.updatePlayer({ avatar_id: avatarId });
    }

    /**
     * Set player's title
     * @param {string} titleId - Title ID
     */
    async setTitle(titleId) {
        await this.updatePlayer({ title_id: titleId });
    }

    /**
     * Set player's avatar frame
     * @param {string} frameId - Frame ID
     */
    async setFrame(frameId) {
        await this.updatePlayer({ frame_id: frameId });
    }

    /**
     * Get player's formatted display name with title
     */
    getFormattedDisplayName() {
        if (!this.player) return 'Player';

        if (window.profileCustomization && this.player.title_id) {
            return window.profileCustomization.formatDisplayName(
                this.player.display_name,
                this.player.title_id
            );
        }
        return this.player.display_name;
    }

    /**
     * Get player's avatar HTML
     * @param {string} size - CSS size value
     */
    getAvatarHTML(size = '2.5rem') {
        if (!this.player) return '';

        if (window.profileCustomization) {
            return window.profileCustomization.renderAvatar(
                this.player.avatar_id || 'default',
                this.player.frame_id || 'none',
                size
            );
        }
        return `<div class="player-avatar-display" style="width:${size};height:${size};border-radius:50%;background:#27272a;display:flex;align-items:center;justify-content:center;">😊</div>`;
    }

    /**
     * Get aggregated stats for profile customization unlocks
     * Combines stats from all games plus global stats
     */
    async getAggregatedStats() {
        const globalStats = {
            total_games: this.player?.total_games_played || 0,
            friends_count: 0
        };

        // Try to get RIUTIZ stats
        try {
            const riutizStats = await this.getStats('riutiz');
            Object.assign(globalStats, {
                wins: riutizStats.wins || 0,
                losses: riutizStats.losses || 0,
                best_streak: riutizStats.best_streak || 0,
                current_streak: riutizStats.current_streak || 0,
                ranked_rating: riutizStats.ranked_rating || 1000,
                peak_rating: riutizStats.peak_rating || 1000,
                ranked_games: riutizStats.ranked_games || 0,
                color_wins: riutizStats.color_wins || {},
                perfect_wins: riutizStats.perfect_wins || 0,
                comebacks: riutizStats.comebacks || 0,
                ai_wins: riutizStats.ai_wins || 0,
                spells_played: riutizStats.spells_played || 0
            });
        } catch (e) {
            console.warn('Could not load riutiz stats:', e);
        }

        // Try to get friends count
        try {
            if (window.friendsManager) {
                const friends = await window.friendsManager.getFriends();
                globalStats.friends_count = friends.length;
            }
        } catch (e) {
            console.warn('Could not load friends count:', e);
        }

        // Try to get decks count
        try {
            const decks = await this.getDecks('riutiz');
            globalStats.decks_created = Object.keys(decks).length;
        } catch (e) {
            console.warn('Could not load decks count:', e);
        }

        // Try to get collection size
        try {
            const collection = await this.getCollection('riutiz');
            globalStats.cards_owned = Object.keys(collection.cards || {}).length;
        } catch (e) {
            console.warn('Could not load collection size:', e);
        }

        return globalStats;
    }

    /**
     * Check for new unlocks after a game and show notification
     * @param {Object} oldStats - Stats before game
     * @param {Object} newStats - Stats after game
     */
    checkForNewUnlocks(oldStats, newStats) {
        if (!window.profileCustomization) return { avatars: [], titles: [], frames: [] };

        return window.profileCustomization.getNewUnlocks(oldStats, newStats);
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
     * @param {Object} result - { won: boolean, opponentRating: number, ranked: boolean }
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
        stats.ranked_games = (stats.ranked_games || 0) + (result.ranked ? 1 : 0);
        stats.last_played = Date.now();

        // ELO rating calculation for ranked matches
        if (result.ranked) {
            const myRating = stats.ranked_rating || 1000;
            const opponentRating = result.opponentRating || 1000;
            const gamesPlayed = stats.ranked_games || 0;

            let ratingResult;
            if (window.ratingManager) {
                // Use proper ELO calculator
                ratingResult = window.ratingManager.calculateNewRating(
                    myRating,
                    opponentRating,
                    result.won,
                    gamesPlayed
                );
                stats.ranked_rating = ratingResult.newRating;
                stats.last_rating_change = ratingResult.change;
            } else {
                // Fallback ELO calculation
                const k = gamesPlayed < 10 ? 40 : 24;
                const expected = 1 / (1 + Math.pow(10, (opponentRating - myRating) / 400));
                const actual = result.won ? 1 : 0;
                const change = Math.round(k * (actual - expected));
                stats.ranked_rating = Math.max(100, myRating + change);
                stats.last_rating_change = change;
            }

            // Track peak rating
            stats.peak_rating = Math.max(stats.peak_rating || 1000, stats.ranked_rating);
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
            ranked_games: 0,
            current_streak: 0,
            best_streak: 0,
            ranked_rating: 1000,
            peak_rating: 1000,
            last_rating_change: 0,
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
