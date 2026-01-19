// shared/arcade/LeaderboardManager.js
// Manages leaderboards, rankings, and player progression

class LeaderboardManager {
    constructor(arcade) {
        this.arcade = arcade;
        this.firebase = arcade.firebase;
        this._cache = {};
        this._cacheTimeout = 60000; // 1 minute cache
    }

    // ==========================================
    // Leaderboard Queries
    // ==========================================

    /**
     * Get top players for a game
     * @param {string} gameId - Game identifier
     * @param {Object} options - Query options
     * @returns {Promise<Array>}
     */
    async getLeaderboard(gameId, options = {}) {
        const {
            type = 'ranked',  // 'ranked', 'wins', 'weekly'
            limit = 100,
            forceRefresh = false
        } = options;

        // Check cache
        const cacheKey = `${gameId}_${type}`;
        if (!forceRefresh && this._cache[cacheKey] && Date.now() - this._cache[cacheKey].time < this._cacheTimeout) {
            return this._cache[cacheKey].data;
        }

        const statsRef = this.firebase?.ref(`arcade/games/${gameId}/stats`);
        if (!statsRef) return [];

        try {
            // Query based on type
            let query;
            let orderField;

            switch (type) {
                case 'ranked':
                    orderField = 'ranked_rating';
                    break;
                case 'wins':
                    orderField = 'wins';
                    break;
                case 'weekly':
                    // For weekly, we'd need to filter by last_played date
                    orderField = 'weekly_score';
                    break;
                default:
                    orderField = 'ranked_rating';
            }

            query = statsRef.orderByChild(orderField).limitToLast(limit);
            const snapshot = await query.once('value');

            const leaderboard = [];
            snapshot.forEach(child => {
                const stats = child.val();
                leaderboard.push({
                    user_id: child.key,
                    ...stats
                });
            });

            // Sort descending (Firebase returns ascending)
            leaderboard.reverse();

            // Add ranks
            leaderboard.forEach((entry, index) => {
                entry.rank = index + 1;
            });

            // Enrich with player names
            await this._enrichWithPlayerNames(leaderboard);

            // Cache result
            this._cache[cacheKey] = { data: leaderboard, time: Date.now() };

            return leaderboard;
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            return [];
        }
    }

    /**
     * Get current player's rank
     * @param {string} gameId - Game identifier
     * @param {string} type - Leaderboard type
     * @returns {Promise<Object>}
     */
    async getPlayerRank(gameId, type = 'ranked') {
        const userId = this.firebase?.supabaseUserId;
        if (!userId) return { rank: null, stats: null };

        // Get player's stats
        const stats = await this.arcade.getStats(gameId);

        // Get players with higher rating
        const statsRef = this.firebase.ref(`arcade/games/${gameId}/stats`);
        const orderField = type === 'ranked' ? 'ranked_rating' : 'wins';
        const playerValue = type === 'ranked' ? stats.ranked_rating || 1000 : stats.wins || 0;

        try {
            // Count players with higher scores
            const snapshot = await statsRef
                .orderByChild(orderField)
                .startAt(playerValue + 1)
                .once('value');

            const playersAbove = snapshot.numChildren();
            const rank = playersAbove + 1;

            return {
                rank,
                stats,
                percentile: await this._calculatePercentile(gameId, playerValue, orderField)
            };
        } catch (error) {
            console.error('Error getting player rank:', error);
            return { rank: null, stats };
        }
    }

    /**
     * Calculate percentile
     */
    async _calculatePercentile(gameId, value, field) {
        try {
            const statsRef = this.firebase.ref(`arcade/games/${gameId}/stats`);

            // Get total count
            const totalSnapshot = await statsRef.once('value');
            const total = totalSnapshot.numChildren();

            if (total === 0) return 100;

            // Get count below
            const belowSnapshot = await statsRef.orderByChild(field).endAt(value - 1).once('value');
            const below = belowSnapshot.numChildren();

            return Math.round((below / total) * 100);
        } catch {
            return null;
        }
    }

    /**
     * Enrich leaderboard entries with player names
     */
    async _enrichWithPlayerNames(entries) {
        const playerIds = entries.map(e => e.user_id);
        const uniqueIds = [...new Set(playerIds)];

        const namePromises = uniqueIds.map(async (id) => {
            try {
                const playerRef = this.firebase.ref(`arcade/players/${id}`);
                const snapshot = await playerRef.once('value');
                return { id, name: snapshot.val()?.display_name || 'Unknown' };
            } catch {
                return { id, name: 'Unknown' };
            }
        });

        const names = await Promise.all(namePromises);
        const nameMap = Object.fromEntries(names.map(n => [n.id, n.name]));

        entries.forEach(entry => {
            entry.display_name = nameMap[entry.user_id] || 'Unknown';
        });
    }

    // ==========================================
    // Weekly/Seasonal Reset
    // ==========================================

    /**
     * Get current season info
     * @param {string} gameId - Game identifier
     */
    async getCurrentSeason(gameId) {
        const ref = this.firebase?.ref(`arcade/games/${gameId}/season`);
        if (!ref) return this._getDefaultSeason();

        try {
            const snapshot = await ref.once('value');
            return snapshot.val() || this._getDefaultSeason();
        } catch {
            return this._getDefaultSeason();
        }
    }

    _getDefaultSeason() {
        const now = new Date();
        const seasonStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const seasonEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);

        return {
            number: Math.floor(now.getMonth() / 3) + 1,
            year: now.getFullYear(),
            start: seasonStart.toISOString(),
            end: seasonEnd.toISOString(),
            name: ['Winter', 'Spring', 'Summer', 'Fall'][Math.floor(now.getMonth() / 3)]
        };
    }

    // ==========================================
    // Achievements & Rewards
    // ==========================================

    /**
     * Get player achievements
     * @returns {Promise<Array>}
     */
    async getAchievements() {
        const userId = this.firebase?.supabaseUserId;
        if (!userId) return [];

        try {
            const ref = this.firebase.ref(`arcade/players/${userId}/achievements`);
            const snapshot = await ref.once('value');
            return snapshot.val() || [];
        } catch {
            return [];
        }
    }

    /**
     * Award an achievement
     * @param {string} achievementId - Achievement identifier
     * @param {Object} data - Additional data
     */
    async awardAchievement(achievementId, data = {}) {
        const userId = this.firebase?.supabaseUserId;
        if (!userId) return;

        const achievement = {
            id: achievementId,
            awarded_at: this.firebase.serverTimestamp,
            ...data
        };

        try {
            const ref = this.firebase.ref(`arcade/players/${userId}/achievements`);
            await ref.push(achievement);
            console.log('Achievement awarded:', achievementId);
        } catch (error) {
            console.error('Error awarding achievement:', error);
        }
    }

    /**
     * Check and award achievements based on stats
     * @param {string} gameId - Game identifier
     * @param {Object} stats - Current stats
     */
    async checkAchievements(gameId, stats) {
        const currentAchievements = await this.getAchievements();
        const earnedIds = currentAchievements.map(a => a.id);

        const achievementsToCheck = [
            { id: `${gameId}_first_win`, condition: stats.wins >= 1, name: 'First Victory' },
            { id: `${gameId}_10_wins`, condition: stats.wins >= 10, name: '10 Wins' },
            { id: `${gameId}_50_wins`, condition: stats.wins >= 50, name: '50 Wins' },
            { id: `${gameId}_100_wins`, condition: stats.wins >= 100, name: '100 Wins' },
            { id: `${gameId}_streak_5`, condition: stats.best_streak >= 5, name: '5 Win Streak' },
            { id: `${gameId}_streak_10`, condition: stats.best_streak >= 10, name: '10 Win Streak' },
            { id: `${gameId}_rating_1200`, condition: stats.ranked_rating >= 1200, name: 'Rating: 1200' },
            { id: `${gameId}_rating_1500`, condition: stats.ranked_rating >= 1500, name: 'Rating: 1500' },
            { id: `${gameId}_rating_1800`, condition: stats.ranked_rating >= 1800, name: 'Rating: Master' },
        ];

        for (const ach of achievementsToCheck) {
            if (ach.condition && !earnedIds.includes(ach.id)) {
                await this.awardAchievement(ach.id, { game: gameId, name: ach.name });
            }
        }
    }

    // ==========================================
    // Card Rewards (RIUTIZ specific)
    // ==========================================

    /**
     * Calculate card rewards for a game result
     * @param {string} gameId - Game identifier
     * @param {Object} result - Game result
     * @returns {Promise<Object>} Cards earned
     */
    async calculateCardRewards(gameId, result) {
        const rewards = { cards: {} };

        if (result.won) {
            // Winner gets 1-3 random cards
            const numCards = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < numCards; i++) {
                // Random card ID (would be based on actual card pool)
                const cardId = Math.floor(Math.random() * 100) + 1;
                rewards.cards[cardId] = (rewards.cards[cardId] || 0) + 1;
            }

            // Ranked wins give bonus cards
            if (result.ranked) {
                const bonusCardId = Math.floor(Math.random() * 100) + 1;
                rewards.cards[bonusCardId] = (rewards.cards[bonusCardId] || 0) + 1;
            }
        } else {
            // Loser gets 0-1 card
            if (Math.random() > 0.5) {
                const cardId = Math.floor(Math.random() * 100) + 1;
                rewards.cards[cardId] = 1;
            }
        }

        // Add cards to collection
        if (Object.keys(rewards.cards).length > 0) {
            await this.arcade.addToCollection(gameId, rewards.cards);
        }

        return rewards;
    }

    // ==========================================
    // Daily Rewards
    // ==========================================

    /**
     * Check and claim daily reward
     * @param {string} gameId - Game identifier
     * @returns {Promise<Object>} Reward if claimable
     */
    async claimDailyReward(gameId) {
        const userId = this.firebase?.supabaseUserId;
        if (!userId) return null;

        const ref = this.firebase.ref(`arcade/games/${gameId}/daily_rewards/${userId}`);

        try {
            const snapshot = await ref.once('value');
            const lastClaim = snapshot.val()?.last_claim;

            const now = Date.now();
            const oneDayMs = 24 * 60 * 60 * 1000;

            if (lastClaim && (now - lastClaim) < oneDayMs) {
                // Already claimed today
                const nextClaimTime = new Date(lastClaim + oneDayMs);
                return {
                    success: false,
                    message: 'Already claimed today',
                    nextClaimAt: nextClaimTime
                };
            }

            // Calculate streak
            let streak = snapshot.val()?.streak || 0;
            if (lastClaim && (now - lastClaim) < 2 * oneDayMs) {
                streak++;
            } else {
                streak = 1;
            }

            // Generate reward based on streak
            const reward = this._generateDailyReward(streak);

            // Save claim
            await ref.set({
                last_claim: now,
                streak: streak
            });

            // Add cards to collection
            if (reward.cards) {
                await this.arcade.addToCollection(gameId, reward.cards);
            }

            return {
                success: true,
                streak,
                reward
            };
        } catch (error) {
            console.error('Error claiming daily reward:', error);
            return null;
        }
    }

    _generateDailyReward(streak) {
        const numCards = Math.min(1 + Math.floor(streak / 7), 5); // Max 5 cards
        const cards = {};

        for (let i = 0; i < numCards; i++) {
            const cardId = Math.floor(Math.random() * 100) + 1;
            cards[cardId] = (cards[cardId] || 0) + 1;
        }

        return { cards, streak };
    }

    // ==========================================
    // Utility
    // ==========================================

    /**
     * Clear cache
     */
    clearCache() {
        this._cache = {};
    }
}

// Export
window.LeaderboardManager = LeaderboardManager;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LeaderboardManager };
}
