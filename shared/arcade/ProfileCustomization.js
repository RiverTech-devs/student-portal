// shared/arcade/ProfileCustomization.js
// Player profile customization - avatars, titles, and cosmetics

class ProfileCustomization {
    constructor() {
        // ==========================================
        // AVATARS / ICONS
        // ==========================================
        this.AVATARS = [
            // Default avatars (always available)
            { id: 'default', icon: '😊', name: 'Smile', category: 'default', unlocked: true },
            { id: 'student', icon: '🎓', name: 'Student', category: 'default', unlocked: true },
            { id: 'star', icon: '⭐', name: 'Star', category: 'default', unlocked: true },
            { id: 'lightning', icon: '⚡', name: 'Lightning', category: 'default', unlocked: true },
            { id: 'fire', icon: '🔥', name: 'Fire', category: 'default', unlocked: true },
            { id: 'heart', icon: '❤️', name: 'Heart', category: 'default', unlocked: true },

            // Achievement avatars
            { id: 'trophy', icon: '🏆', name: 'Champion', category: 'achievement', unlock: { type: 'wins', value: 10 } },
            { id: 'crown', icon: '👑', name: 'Royalty', category: 'achievement', unlock: { type: 'wins', value: 50 } },
            { id: 'diamond', icon: '💎', name: 'Diamond', category: 'achievement', unlock: { type: 'wins', value: 100 } },
            { id: 'medal', icon: '🏅', name: 'Medalist', category: 'achievement', unlock: { type: 'streak', value: 5 } },
            { id: 'rocket', icon: '🚀', name: 'Rising Star', category: 'achievement', unlock: { type: 'streak', value: 10 } },

            // Rating tier avatars
            { id: 'apprentice', icon: '📚', name: 'Apprentice', category: 'rating', unlock: { type: 'rating', value: 800 } },
            { id: 'scholar', icon: '📖', name: 'Scholar', category: 'rating', unlock: { type: 'rating', value: 1200 } },
            { id: 'expert', icon: '🌟', name: 'Expert', category: 'rating', unlock: { type: 'rating', value: 1400 } },
            { id: 'master', icon: '🎖️', name: 'Master', category: 'rating', unlock: { type: 'rating', value: 1600 } },
            { id: 'grandmaster', icon: '👑', name: 'Grandmaster', category: 'rating', unlock: { type: 'rating', value: 1800 } },
            { id: 'legend', icon: '🌠', name: 'Legend', category: 'rating', unlock: { type: 'rating', value: 2000 } },

            // Game-specific avatars (RIUTIZ colors)
            { id: 'orange_flame', icon: '🔶', name: 'Orange Flame', category: 'riutiz', unlock: { type: 'color_wins', value: 10, color: 'O' } },
            { id: 'green_leaf', icon: '🍀', name: 'Green Leaf', category: 'riutiz', unlock: { type: 'color_wins', value: 10, color: 'G' } },
            { id: 'purple_crystal', icon: '🔮', name: 'Purple Crystal', category: 'riutiz', unlock: { type: 'color_wins', value: 10, color: 'P' } },
            { id: 'blue_wave', icon: '🌊', name: 'Blue Wave', category: 'riutiz', unlock: { type: 'color_wins', value: 10, color: 'B' } },
            { id: 'black_void', icon: '🖤', name: 'Black Void', category: 'riutiz', unlock: { type: 'color_wins', value: 10, color: 'K' } },

            // Special/rare avatars
            { id: 'dragon', icon: '🐉', name: 'Dragon', category: 'special', unlock: { type: 'games', value: 100 } },
            { id: 'phoenix', icon: '🦅', name: 'Phoenix', category: 'special', unlock: { type: 'comeback', value: 5 } },
            { id: 'ninja', icon: '🥷', name: 'Ninja', category: 'special', unlock: { type: 'perfect_wins', value: 3 } },
            { id: 'wizard', icon: '🧙', name: 'Wizard', category: 'special', unlock: { type: 'spells_played', value: 100 } },
            { id: 'robot', icon: '🤖', name: 'Bot Slayer', category: 'special', unlock: { type: 'ai_wins', value: 25 } },
        ];

        // ==========================================
        // TITLES / PREFIXES
        // ==========================================
        this.TITLES = [
            // Default titles
            { id: 'none', prefix: '', name: 'No Title', category: 'default', unlocked: true },
            { id: 'player', prefix: '', name: 'Player', category: 'default', unlocked: true },

            // Achievement titles
            { id: 'newcomer', prefix: 'Newcomer', name: 'Newcomer', category: 'achievement', unlock: { type: 'games', value: 1 } },
            { id: 'regular', prefix: 'Regular', name: 'Regular', category: 'achievement', unlock: { type: 'games', value: 25 } },
            { id: 'veteran', prefix: 'Veteran', name: 'Veteran', category: 'achievement', unlock: { type: 'games', value: 100 } },
            { id: 'elite', prefix: 'Elite', name: 'Elite', category: 'achievement', unlock: { type: 'games', value: 250 } },

            // Win-based titles
            { id: 'winner', prefix: 'Winner', name: 'Winner', category: 'wins', unlock: { type: 'wins', value: 5 } },
            { id: 'victor', prefix: 'Victor', name: 'Victor', category: 'wins', unlock: { type: 'wins', value: 25 } },
            { id: 'champion', prefix: 'Champion', name: 'Champion', category: 'wins', unlock: { type: 'wins', value: 50 } },
            { id: 'conqueror', prefix: 'Conqueror', name: 'Conqueror', category: 'wins', unlock: { type: 'wins', value: 100 } },
            { id: 'dominator', prefix: 'Dominator', name: 'Dominator', category: 'wins', unlock: { type: 'wins', value: 200 } },

            // Streak titles
            { id: 'hot_streak', prefix: 'Hot', name: 'Hot Streak', category: 'streak', unlock: { type: 'streak', value: 3 } },
            { id: 'unstoppable', prefix: 'Unstoppable', name: 'Unstoppable', category: 'streak', unlock: { type: 'streak', value: 7 } },
            { id: 'legendary', prefix: 'Legendary', name: 'Legendary', category: 'streak', unlock: { type: 'streak', value: 10 } },
            { id: 'godlike', prefix: 'Godlike', name: 'Godlike', category: 'streak', unlock: { type: 'streak', value: 15 } },

            // Rating titles
            { id: 'apprentice_t', prefix: 'Apprentice', name: 'Apprentice', category: 'rating', unlock: { type: 'rating', value: 800 } },
            { id: 'scholar_t', prefix: 'Scholar', name: 'Scholar', category: 'rating', unlock: { type: 'rating', value: 1200 } },
            { id: 'expert_t', prefix: 'Expert', name: 'Expert', category: 'rating', unlock: { type: 'rating', value: 1400 } },
            { id: 'master_t', prefix: 'Master', name: 'Master', category: 'rating', unlock: { type: 'rating', value: 1600 } },
            { id: 'grandmaster_t', prefix: 'Grandmaster', name: 'Grandmaster', category: 'rating', unlock: { type: 'rating', value: 1800 } },
            { id: 'legend_t', prefix: 'Legend', name: 'Legend', category: 'rating', unlock: { type: 'rating', value: 2000 } },

            // Special titles
            { id: 'perfectionist', prefix: 'Perfect', name: 'Perfectionist', category: 'special', unlock: { type: 'perfect_wins', value: 1 } },
            { id: 'comeback_kid', prefix: 'Comeback', name: 'Comeback Kid', category: 'special', unlock: { type: 'comeback', value: 1 } },
            { id: 'deck_master', prefix: 'Deck Master', name: 'Deck Master', category: 'special', unlock: { type: 'decks_created', value: 5 } },
            { id: 'collector', prefix: 'Collector', name: 'Collector', category: 'special', unlock: { type: 'cards_owned', value: 100 } },
            { id: 'social', prefix: 'Social', name: 'Social Butterfly', category: 'special', unlock: { type: 'friends', value: 10 } },

            // Ranked season titles (would be granted manually/seasonally)
            { id: 'season1_bronze', prefix: 'S1 Bronze', name: 'Season 1 Bronze', category: 'season', unlock: { type: 'manual' } },
            { id: 'season1_silver', prefix: 'S1 Silver', name: 'Season 1 Silver', category: 'season', unlock: { type: 'manual' } },
            { id: 'season1_gold', prefix: 'S1 Gold', name: 'Season 1 Gold', category: 'season', unlock: { type: 'manual' } },
            { id: 'season1_champion', prefix: 'S1 Champion', name: 'Season 1 Champion', category: 'season', unlock: { type: 'manual' } },
        ];

        // ==========================================
        // AVATAR FRAMES / BORDERS
        // ==========================================
        this.FRAMES = [
            { id: 'none', name: 'No Frame', style: 'none', color: 'transparent', category: 'default', unlocked: true },
            { id: 'basic', name: 'Basic', style: 'solid', color: '#3f3f46', category: 'default', unlocked: true },
            { id: 'bronze', name: 'Bronze', style: 'solid', color: '#cd7f32', category: 'rating', unlock: { type: 'rating', value: 1000 } },
            { id: 'silver', name: 'Silver', style: 'solid', color: '#c0c0c0', category: 'rating', unlock: { type: 'rating', value: 1200 } },
            { id: 'gold', name: 'Gold', style: 'solid', color: '#ffd700', category: 'rating', unlock: { type: 'rating', value: 1400 } },
            { id: 'platinum', name: 'Platinum', style: 'solid', color: '#e5e4e2', category: 'rating', unlock: { type: 'rating', value: 1600 } },
            { id: 'diamond', name: 'Diamond', style: 'gradient', color: 'linear-gradient(135deg, #b9f2ff, #00bfff)', category: 'rating', unlock: { type: 'rating', value: 1800 } },
            { id: 'legendary', name: 'Legendary', style: 'gradient', color: 'linear-gradient(135deg, #ff6b6b, #ffd93d, #6bff6b, #4dabf7, #cc5de8)', category: 'rating', unlock: { type: 'rating', value: 2000 } },
            { id: 'fire', name: 'Fire', style: 'gradient', color: 'linear-gradient(135deg, #ff4500, #ff8c00)', category: 'special', unlock: { type: 'streak', value: 10 } },
            { id: 'ice', name: 'Ice', style: 'gradient', color: 'linear-gradient(135deg, #00bfff, #e0ffff)', category: 'special', unlock: { type: 'wins', value: 50 } },
        ];

        // Category display names
        this.CATEGORIES = {
            default: 'Default',
            achievement: 'Achievements',
            rating: 'Rating Rewards',
            riutiz: 'RIUTIZ',
            special: 'Special',
            wins: 'Victory',
            streak: 'Streaks',
            season: 'Seasonal'
        };
    }

    // ==========================================
    // AVATAR METHODS
    // ==========================================

    /**
     * Get all avatars
     */
    getAllAvatars() {
        return this.AVATARS;
    }

    /**
     * Get avatar by ID
     */
    getAvatar(avatarId) {
        return this.AVATARS.find(a => a.id === avatarId) || this.AVATARS[0];
    }

    /**
     * Get unlocked avatars based on player stats
     */
    getUnlockedAvatars(stats) {
        return this.AVATARS.filter(avatar => this.isUnlocked(avatar, stats));
    }

    /**
     * Get locked avatars with unlock requirements
     */
    getLockedAvatars(stats) {
        return this.AVATARS.filter(avatar => !this.isUnlocked(avatar, stats));
    }

    /**
     * Get avatars by category
     */
    getAvatarsByCategory(category) {
        return this.AVATARS.filter(a => a.category === category);
    }

    // ==========================================
    // TITLE METHODS
    // ==========================================

    /**
     * Get all titles
     */
    getAllTitles() {
        return this.TITLES;
    }

    /**
     * Get title by ID
     */
    getTitle(titleId) {
        return this.TITLES.find(t => t.id === titleId) || this.TITLES[0];
    }

    /**
     * Get unlocked titles based on player stats
     */
    getUnlockedTitles(stats) {
        return this.TITLES.filter(title => this.isUnlocked(title, stats));
    }

    /**
     * Get locked titles with unlock requirements
     */
    getLockedTitles(stats) {
        return this.TITLES.filter(title => !this.isUnlocked(title, stats));
    }

    // ==========================================
    // FRAME METHODS
    // ==========================================

    /**
     * Get all frames
     */
    getAllFrames() {
        return this.FRAMES;
    }

    /**
     * Get frame by ID
     */
    getFrame(frameId) {
        return this.FRAMES.find(f => f.id === frameId) || this.FRAMES[0];
    }

    /**
     * Get unlocked frames
     */
    getUnlockedFrames(stats) {
        return this.FRAMES.filter(frame => this.isUnlocked(frame, stats));
    }

    // ==========================================
    // UNLOCK CHECKING
    // ==========================================

    /**
     * Check if an item is unlocked
     */
    isUnlocked(item, stats = {}) {
        if (item.unlocked) return true;
        if (!item.unlock) return false;

        const { type, value, color } = item.unlock;

        switch (type) {
            case 'wins':
                return (stats.wins || 0) >= value;
            case 'games':
                return (stats.total_games || 0) >= value;
            case 'streak':
                return (stats.best_streak || 0) >= value;
            case 'rating':
                return (stats.ranked_rating || stats.peak_rating || 1000) >= value;
            case 'color_wins':
                return (stats.color_wins?.[color] || 0) >= value;
            case 'perfect_wins':
                return (stats.perfect_wins || 0) >= value;
            case 'comeback':
                return (stats.comebacks || 0) >= value;
            case 'ai_wins':
                return (stats.ai_wins || 0) >= value;
            case 'spells_played':
                return (stats.spells_played || 0) >= value;
            case 'decks_created':
                return (stats.decks_created || 0) >= value;
            case 'cards_owned':
                return (stats.cards_owned || 0) >= value;
            case 'friends':
                return (stats.friends_count || 0) >= value;
            case 'manual':
                return stats.manual_unlocks?.includes(item.id) || false;
            default:
                return false;
        }
    }

    /**
     * Get unlock progress for an item
     */
    getUnlockProgress(item, stats = {}) {
        if (item.unlocked || !item.unlock) {
            return { unlocked: true, progress: 100, current: 0, required: 0 };
        }

        const { type, value, color } = item.unlock;
        let current = 0;

        switch (type) {
            case 'wins': current = stats.wins || 0; break;
            case 'games': current = stats.total_games || 0; break;
            case 'streak': current = stats.best_streak || 0; break;
            case 'rating': current = stats.peak_rating || stats.ranked_rating || 1000; break;
            case 'color_wins': current = stats.color_wins?.[color] || 0; break;
            case 'perfect_wins': current = stats.perfect_wins || 0; break;
            case 'comeback': current = stats.comebacks || 0; break;
            case 'ai_wins': current = stats.ai_wins || 0; break;
            case 'spells_played': current = stats.spells_played || 0; break;
            case 'decks_created': current = stats.decks_created || 0; break;
            case 'cards_owned': current = stats.cards_owned || 0; break;
            case 'friends': current = stats.friends_count || 0; break;
            case 'manual': return { unlocked: false, progress: 0, current: 0, required: 1, special: true };
            default: return { unlocked: false, progress: 0, current: 0, required: value };
        }

        const progress = Math.min(100, Math.round((current / value) * 100));
        return {
            unlocked: current >= value,
            progress,
            current,
            required: value
        };
    }

    /**
     * Get human-readable unlock requirement
     */
    getUnlockRequirement(item) {
        if (item.unlocked || !item.unlock) return 'Always available';

        const { type, value, color } = item.unlock;

        switch (type) {
            case 'wins': return `Win ${value} games`;
            case 'games': return `Play ${value} games`;
            case 'streak': return `${value} win streak`;
            case 'rating': return `Reach ${value} rating`;
            case 'color_wins': return `Win ${value} games with ${this._getColorName(color)}`;
            case 'perfect_wins': return `Win ${value} perfect games`;
            case 'comeback': return `Win ${value} comeback games`;
            case 'ai_wins': return `Beat AI ${value} times`;
            case 'spells_played': return `Play ${value} spells`;
            case 'decks_created': return `Create ${value} decks`;
            case 'cards_owned': return `Collect ${value} cards`;
            case 'friends': return `Add ${value} friends`;
            case 'manual': return 'Special unlock';
            default: return 'Unknown requirement';
        }
    }

    _getColorName(colorCode) {
        const colors = { O: 'Orange', G: 'Green', P: 'Purple', B: 'Blue', K: 'Black' };
        return colors[colorCode] || colorCode;
    }

    // ==========================================
    // DISPLAY FORMATTING
    // ==========================================

    /**
     * Format player display name with title
     */
    formatDisplayName(displayName, titleId) {
        const title = this.getTitle(titleId);
        if (title && title.prefix) {
            return `${title.prefix} ${displayName}`;
        }
        return displayName;
    }

    /**
     * Generate avatar HTML
     */
    renderAvatar(avatarId, frameId = 'none', size = '2.5rem') {
        const avatar = this.getAvatar(avatarId);
        const frame = this.getFrame(frameId);

        let borderStyle = '';
        if (frame.style === 'solid') {
            borderStyle = `border: 3px solid ${frame.color};`;
        } else if (frame.style === 'gradient') {
            borderStyle = `border: 3px solid transparent; background: ${frame.color}; background-clip: padding-box;`;
        }

        return `
            <div class="player-avatar-display" style="
                width: ${size};
                height: ${size};
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: calc(${size} * 0.5);
                background: #27272a;
                ${borderStyle}
            ">
                ${avatar.icon}
            </div>
        `;
    }

    /**
     * Get newly unlocked items based on old and new stats
     */
    getNewUnlocks(oldStats, newStats) {
        const newUnlocks = {
            avatars: [],
            titles: [],
            frames: []
        };

        this.AVATARS.forEach(avatar => {
            if (!this.isUnlocked(avatar, oldStats) && this.isUnlocked(avatar, newStats)) {
                newUnlocks.avatars.push(avatar);
            }
        });

        this.TITLES.forEach(title => {
            if (!this.isUnlocked(title, oldStats) && this.isUnlocked(title, newStats)) {
                newUnlocks.titles.push(title);
            }
        });

        this.FRAMES.forEach(frame => {
            if (!this.isUnlocked(frame, oldStats) && this.isUnlocked(frame, newStats)) {
                newUnlocks.frames.push(frame);
            }
        });

        return newUnlocks;
    }
}

// Create global instance
window.ProfileCustomization = ProfileCustomization;
window.profileCustomization = new ProfileCustomization();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ProfileCustomization };
}
