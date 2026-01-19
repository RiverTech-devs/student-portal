// shared/arcade/RatingManager.js
// Chess-style ELO rating system for arcade games

class RatingManager {
    constructor() {
        // ELO Configuration
        this.DEFAULT_RATING = 1000;
        this.K_FACTOR_NEW = 40;      // Higher K for new players (first 10 games)
        this.K_FACTOR_NORMAL = 24;   // Standard K factor
        this.K_FACTOR_HIGH = 16;     // Lower K for high-rated players (2000+)
        this.NEW_PLAYER_GAMES = 10;
        this.HIGH_RATING_THRESHOLD = 2000;

        // Rating tiers (like chess titles)
        this.TIERS = [
            { name: 'Beginner', min: 0, max: 799, icon: '🌱', color: '#71717a' },
            { name: 'Apprentice', min: 800, max: 999, icon: '📚', color: '#22c55e' },
            { name: 'Student', min: 1000, max: 1199, icon: '🎓', color: '#3b82f6' },
            { name: 'Scholar', min: 1200, max: 1399, icon: '📖', color: '#8b5cf6' },
            { name: 'Expert', min: 1400, max: 1599, icon: '⭐', color: '#f59e0b' },
            { name: 'Master', min: 1600, max: 1799, icon: '🏅', color: '#f97316' },
            { name: 'Grandmaster', min: 1800, max: 1999, icon: '👑', color: '#ef4444' },
            { name: 'Legend', min: 2000, max: Infinity, icon: '🏆', color: '#fbbf24' }
        ];
    }

    /**
     * Calculate expected score (probability of winning)
     * @param {number} playerRating - Player's current rating
     * @param {number} opponentRating - Opponent's current rating
     * @returns {number} Expected score between 0 and 1
     */
    getExpectedScore(playerRating, opponentRating) {
        return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
    }

    /**
     * Get K-factor based on player's experience and rating
     * @param {number} rating - Player's current rating
     * @param {number} gamesPlayed - Total ranked games played
     * @returns {number} K-factor to use
     */
    getKFactor(rating, gamesPlayed) {
        if (gamesPlayed < this.NEW_PLAYER_GAMES) {
            return this.K_FACTOR_NEW; // Provisional rating - high volatility
        }
        if (rating >= this.HIGH_RATING_THRESHOLD) {
            return this.K_FACTOR_HIGH; // Protect high ratings
        }
        return this.K_FACTOR_NORMAL;
    }

    /**
     * Calculate new rating after a match
     * @param {number} playerRating - Player's current rating
     * @param {number} opponentRating - Opponent's current rating
     * @param {boolean} won - Whether the player won
     * @param {number} gamesPlayed - Player's total ranked games
     * @returns {Object} { newRating, change, expectedScore }
     */
    calculateNewRating(playerRating, opponentRating, won, gamesPlayed = 10) {
        const expected = this.getExpectedScore(playerRating, opponentRating);
        const actual = won ? 1 : 0;
        const k = this.getKFactor(playerRating, gamesPlayed);

        const change = Math.round(k * (actual - expected));
        const newRating = Math.max(100, playerRating + change); // Floor at 100

        return {
            newRating,
            change,
            expectedScore: expected,
            kFactor: k
        };
    }

    /**
     * Calculate rating changes for both players in a match
     * @param {Object} player1 - { rating, gamesPlayed }
     * @param {Object} player2 - { rating, gamesPlayed }
     * @param {number} winner - 1 or 2
     * @returns {Object} { player1Change, player2Change, player1NewRating, player2NewRating }
     */
    calculateMatchResult(player1, player2, winner) {
        const p1Won = winner === 1;
        const p2Won = winner === 2;

        const p1Result = this.calculateNewRating(
            player1.rating,
            player2.rating,
            p1Won,
            player1.gamesPlayed
        );

        const p2Result = this.calculateNewRating(
            player2.rating,
            player1.rating,
            p2Won,
            player2.gamesPlayed
        );

        return {
            player1: {
                oldRating: player1.rating,
                newRating: p1Result.newRating,
                change: p1Result.change
            },
            player2: {
                oldRating: player2.rating,
                newRating: p2Result.newRating,
                change: p2Result.change
            }
        };
    }

    /**
     * Get tier info for a rating
     * @param {number} rating - Player's rating
     * @returns {Object} Tier info { name, icon, color, min, max }
     */
    getTier(rating) {
        for (const tier of this.TIERS) {
            if (rating >= tier.min && rating <= tier.max) {
                return tier;
            }
        }
        return this.TIERS[0]; // Default to beginner
    }

    /**
     * Get progress to next tier
     * @param {number} rating - Player's rating
     * @returns {Object} { currentTier, nextTier, progress, pointsNeeded }
     */
    getTierProgress(rating) {
        const currentTier = this.getTier(rating);
        const currentIndex = this.TIERS.indexOf(currentTier);
        const nextTier = this.TIERS[currentIndex + 1] || null;

        if (!nextTier) {
            return {
                currentTier,
                nextTier: null,
                progress: 100,
                pointsNeeded: 0
            };
        }

        const tierRange = currentTier.max - currentTier.min + 1;
        const pointsInTier = rating - currentTier.min;
        const progress = Math.round((pointsInTier / tierRange) * 100);
        const pointsNeeded = nextTier.min - rating;

        return {
            currentTier,
            nextTier,
            progress,
            pointsNeeded
        };
    }

    /**
     * Format rating with tier badge
     * @param {number} rating - Player's rating
     * @returns {string} Formatted string like "🎓 1150"
     */
    formatRating(rating) {
        const tier = this.getTier(rating);
        return `${tier.icon} ${rating}`;
    }

    /**
     * Get matchmaking rating range
     * Expands over time to find matches
     * @param {number} rating - Player's rating
     * @param {number} waitTime - Seconds in queue
     * @returns {Object} { minRating, maxRating }
     */
    getMatchmakingRange(rating, waitTime = 0) {
        // Start with tight range, expand over time
        const baseRange = 100;
        const expansionRate = 50; // Expand by 50 every 10 seconds
        const maxExpansion = 500; // Never match more than 500 apart

        const expansion = Math.min(maxExpansion, Math.floor(waitTime / 10) * expansionRate);
        const range = baseRange + expansion;

        return {
            minRating: Math.max(100, rating - range),
            maxRating: rating + range,
            range
        };
    }

    /**
     * Score a potential matchup quality (0-100)
     * @param {number} rating1 - First player's rating
     * @param {number} rating2 - Second player's rating
     * @returns {number} Match quality score
     */
    getMatchQuality(rating1, rating2) {
        const diff = Math.abs(rating1 - rating2);

        // Perfect match: 0 difference = 100 quality
        // Quality decreases as difference increases
        if (diff <= 50) return 100;
        if (diff <= 100) return 90;
        if (diff <= 200) return 75;
        if (diff <= 300) return 50;
        if (diff <= 500) return 25;
        return 10;
    }

    /**
     * Get display info for rating change
     * @param {number} change - Rating change amount
     * @returns {Object} { text, color, icon }
     */
    formatRatingChange(change) {
        if (change > 0) {
            return {
                text: `+${change}`,
                color: '#22c55e',
                icon: '▲'
            };
        } else if (change < 0) {
            return {
                text: `${change}`,
                color: '#ef4444',
                icon: '▼'
            };
        }
        return {
            text: '±0',
            color: '#71717a',
            icon: '─'
        };
    }
}

// Create global instance
window.RatingManager = RatingManager;
window.ratingManager = new RatingManager();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RatingManager };
}
