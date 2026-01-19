// games/riutiz/RiutizGame.js
// Core RIUTIZ game logic - state management, rules, and game flow

class RiutizGame extends EventTarget {
    constructor(options = {}) {
        super();

        this.mode = options.mode || 'vs-ai'; // 'vs-ai', 'local-pvp', 'online-pvp'
        this.cardData = options.cardData || [];
        this.player1Deck = options.player1Deck || null;
        this.player2Deck = options.player2Deck || null;

        this.state = null;
        this.winCondition = 25; // Points to win

        // Ability system - pending actions that need targeting
        this.pendingAbility = null;
    }

    // ==========================================
    // Ability Keywords & Patterns
    // ==========================================

    static get KEYWORDS() {
        return {
            IMPULSIVE: 'impulsive',
            RELENTLESS: 'relentless',
            GROUNDED: 'grounded',
            LETHAL: 'lethal',
            STUBBORN: 'stubborn',
            NON_SEQUITUR: 'non-sequitur',
            OVERWHELM: 'overwhelm'
        };
    }

    /**
     * Check if a card has a specific keyword
     */
    hasKeyword(card, keyword) {
        return card.ability?.toLowerCase().includes(keyword.toLowerCase());
    }

    /**
     * Parse ability text to identify type and effects
     */
    parseAbility(abilityText) {
        if (!abilityText) return null;
        const lower = abilityText.toLowerCase();

        const parsed = {
            raw: abilityText,
            isSpend: lower.includes('spend:'),
            isETB: lower.includes('when') && (lower.includes('enters') || lower.includes('enter')),
            isStartOfTurn: lower.includes('start of') && lower.includes('turn'),
            isEndOfTurn: lower.includes('end of turn'),
            isAttackTrigger: lower.includes('when') && lower.includes('attack'),
            isBlockTrigger: lower.includes('when') && lower.includes('block'),
            isDamageTrigger: lower.includes('when') && (lower.includes('damage') || lower.includes('absorb')),
            isAura: lower.includes('other pupils') || lower.includes('your pupils') || lower.includes('all your'),
            isProtection: lower.includes('protection from'),
            needsTarget: lower.includes('target'),
            keywords: []
        };

        // Extract keywords
        Object.values(RiutizGame.KEYWORDS).forEach(kw => {
            if (lower.includes(kw)) parsed.keywords.push(kw);
        });

        return parsed;
    }

    // ==========================================
    // Constants
    // ==========================================

    static get PHASES() {
        return ['draw', 'ready', 'main', 'combat', 'end'];
    }

    static get COMBAT_STEPS() {
        return ['declare-attackers', 'declare-blockers', 'resolve'];
    }

    static get COLORS() {
        return {
            O: { name: 'Orange', hex: '#f97316', bg: '#431407' },
            G: { name: 'Green', hex: '#22c55e', bg: '#052e16' },
            P: { name: 'Purple', hex: '#a855f7', bg: '#3b0764' },
            B: { name: 'Blue', hex: '#3b82f6', bg: '#172554' },
            Bk: { name: 'Black', hex: '#a1a1aa', bg: '#18181b' },
            C: { name: 'Colorless', hex: '#d4d4d8', bg: '#27272a' }
        };
    }

    // ==========================================
    // Game Initialization
    // ==========================================

    /**
     * Create initial game state
     */
    createInitialState() {
        return {
            turn: 1,
            currentPlayer: 1,
            phase: 'main',
            combatStep: null,
            attackers: [],
            blockers: {},
            selectedCard: null,
            selectedFieldCard: null,
            players: {
                1: this.createPlayerState(this.player1Deck),
                2: this.createPlayerState(this.player2Deck)
            },
            gameOver: false,
            winner: null
        };
    }

    /**
     * Create player state
     */
    createPlayerState(deckCards = null) {
        const deck = deckCards ? this.createDeckFromCards(deckCards) : this.createRandomDeck();
        return {
            points: 0,
            deck: deck.slice(7),
            hand: deck.slice(0, 7),
            field: [],
            resources: [],
            discard: [],
            interruptionPlayed: false
        };
    }

    /**
     * Create deck from card IDs
     */
    createDeckFromCards(cardIds) {
        const deck = [];
        cardIds.forEach((cardId, index) => {
            const cardData = this.cardData.find(c => c.id === cardId);
            if (cardData) {
                deck.push(this.createCardInstance(cardData, index));
            }
        });
        return this.shuffle(deck);
    }

    /**
     * Create random deck (for AI or quick play)
     */
    createRandomDeck() {
        const pool = this.cardData.filter(c => c.type !== 'Location');
        const deck = [];
        for (let i = 0; i < 40; i++) {
            const card = pool[Math.floor(Math.random() * pool.length)];
            deck.push(this.createCardInstance(card, i));
        }
        return this.shuffle(deck);
    }

    /**
     * Create a card instance with unique ID
     */
    createCardInstance(cardData, index = 0) {
        return {
            ...cardData,
            instanceId: `${cardData.id}-${index}-${Math.random().toString(36).substr(2, 9)}`,
            currentEndurance: cardData.endurance,
            baseEndurance: cardData.endurance,
            hasGettingBearings: true,
            isSpent: false,
            // Ability tracking
            counters: { plusOne: 0 },  // +1/+1 counters
            tempBuffs: [],              // Temporary effects that expire
            dieRollBonus: 0,            // Cumulative die roll bonuses
            damageReduction: 0,         // Damage reduction
            protection: [],             // Protection from colors/types
            abilitiesDisabled: false,   // Logical Fallacy effect
            maxBlockers: null,          // Prime Numbers effect (null = unlimited)
            usedReroll: false           // For Statistics Enthusiast
        };
    }

    /**
     * Start a new game
     */
    startGame() {
        this.state = this.createInitialState();
        this.emitEvent('gameStarted', { state: this.state });
        return this.state;
    }

    // ==========================================
    // Cost Parsing & Resources
    // ==========================================

    /**
     * Parse cost string like "(1)(O)(O)"
     */
    parseCost(costStr) {
        if (!costStr) return { colors: {}, generic: 0, total: 0 };
        const colors = {};
        let generic = 0;
        const matches = costStr.match(/\(([^)]+)\)/g) || [];
        matches.forEach(m => {
            const val = m.replace(/[()]/g, '');
            if (/^\d+$/.test(val)) {
                generic += parseInt(val);
            } else {
                colors[val] = (colors[val] || 0) + 1;
            }
        });
        const total = generic + Object.values(colors).reduce((a, b) => a + b, 0);
        return { colors, generic, total };
    }

    /**
     * Get primary color from cost
     */
    getPrimaryColor(costStr) {
        const { colors } = this.parseCost(costStr);
        const keys = Object.keys(colors);
        return keys.length > 0 ? keys[0] : 'C';
    }

    /**
     * Check if player can afford a card
     */
    canAfford(card, player) {
        const cost = this.parseCost(card.cost);
        const available = player.resources.filter(r => !r.spent);

        // Check colored requirements
        for (const [color, count] of Object.entries(cost.colors)) {
            if (available.filter(r => r.color === color).length < count) return false;
        }

        return available.length >= cost.total;
    }

    /**
     * Pay the cost for a card
     */
    payCost(card, player) {
        const cost = this.parseCost(card.cost);

        // Pay colored first
        for (const [color, count] of Object.entries(cost.colors)) {
            let paid = 0;
            for (const r of player.resources) {
                if (r.color === color && !r.spent && paid < count) {
                    r.spent = true;
                    paid++;
                }
            }
        }

        // Pay generic
        let genericPaid = 0;
        for (const r of player.resources) {
            if (!r.spent && genericPaid < cost.generic) {
                r.spent = true;
                genericPaid++;
            }
        }
    }

    // ==========================================
    // Card Actions
    // ==========================================

    /**
     * Play a card from hand
     * @param {number} playerNum - Player number (1 or 2)
     * @param {string} instanceId - Card instance ID
     * @param {boolean} asResource - Play as resource instead
     */
    playCard(playerNum, instanceId, asResource = false) {
        const player = this.state.players[playerNum];
        const cardIndex = player.hand.findIndex(c => c.instanceId === instanceId);

        if (cardIndex === -1) {
            return { success: false, error: 'Card not in hand' };
        }

        const card = player.hand[cardIndex];

        if (asResource) {
            // Play as resource - store full card data for preview
            const color = this.getPrimaryColor(card.cost) || 'C';
            player.hand.splice(cardIndex, 1);
            player.resources.push({
                color,
                spent: false,
                id: card.instanceId,
                cardName: card.name,
                card: card  // Store full card for preview
            });

            this.emitEvent('cardPlayedAsResource', { player: playerNum, card, color });
            return { success: true, action: 'resource', color };
        }

        // Play normally
        if (!this.canAfford(card, player)) {
            return { success: false, error: 'Not enough resources' };
        }

        if (card.type === 'Interruption' && player.interruptionPlayed) {
            return { success: false, error: 'Already played an Interruption this turn' };
        }

        this.payCost(card, player);
        player.hand.splice(cardIndex, 1);

        if (card.type?.includes('Pupil')) {
            const hasImpulsive = card.ability?.toLowerCase().includes('impulsive');
            const newCard = {
                ...card,
                hasGettingBearings: !hasImpulsive,
                isSpent: false,
                counters: { plusOne: 0 },
                tempBuffs: [],
                dieRollBonus: 0,
                damageReduction: 0,
                protection: [],
                abilitiesDisabled: false,
                maxBlockers: null,
                usedReroll: false
            };
            player.field.push(newCard);

            // Trigger ETB abilities
            this.triggerETB(playerNum, newCard);

            // Recalculate aura effects
            this.recalculateAuras(playerNum);
        } else if (card.type === 'Interruption') {
            player.discard.push(card);
            player.interruptionPlayed = true;

            // Trigger "when you play an Interruption" effects
            this.triggerOnInterruption(playerNum, card);

            this.resolveInterruption(playerNum, card);
        } else {
            // Tool or Location
            player.field.push({ ...card, isSpent: false, hasGettingBearings: false });
            // Recalculate auras (Tools like Drafting Table have passive effects)
            this.recalculateAuras(playerNum);
        }

        this.emitEvent('cardPlayed', { player: playerNum, card });
        return { success: true, action: 'play', card };
    }

    /**
     * Resolve interruption effects
     */
    resolveInterruption(playerNum, card, target = null) {
        const ability = card.ability?.toLowerCase() || '';
        const player = this.state.players[playerNum];
        const opponent = this.getOpponent(playerNum);

        // Draw cards
        if (ability.includes('draw')) {
            const match = ability.match(/draw (\d+)/);
            const numCards = match ? parseInt(match[1]) : 1;
            for (let i = 0; i < numCards && player.deck.length > 0; i++) {
                player.hand.push(player.deck.shift());
            }
            this.emitEvent('cardsDrawn', { player: playerNum, count: numCards });
        }

        // Prevent damage - Calculated Risk (id 218)
        if (ability.includes('prevent') && ability.includes('damage')) {
            const match = ability.match(/prevent.*?(\d+)\s*damage/);
            const amount = match ? parseInt(match[1]) : 3;
            if (target) {
                target.tempBuffs.push({
                    type: 'damagePrevent',
                    amount: amount,
                    expiresAt: 'endOfTurn'
                });
                this.emitEvent('buffApplied', { card: target, effect: `Prevent ${amount} damage` });
            }
            return { needsTarget: !target, targetType: 'friendlyPupil', effect: 'damagePrevent', amount };
        }

        // Look at opponent's hand - Statistical Analysis (id 220)
        if (ability.includes("look at opponent's hand") || ability.includes('look at opponent')) {
            this.emitEvent('revealHand', { player: playerNum, targetPlayer: playerNum === 1 ? 2 : 1, hand: opponent.hand });
            return { success: true };
        }

        // Rearrange top cards - Order of Operations (id 221)
        if (ability.includes('rearrange') && ability.includes('top')) {
            const match = ability.match(/top (\d+)/);
            const count = match ? parseInt(match[1]) : 4;
            const topCards = player.deck.slice(0, count);
            this.emitEvent('rearrangeCards', { player: playerNum, cards: topCards, count });
            return { needsRearrange: true, cards: topCards, count };
        }

        // Disable abilities - Logical Fallacy (id 222)
        if (ability.includes('abilities are ignored') || ability.includes('abilities ignored')) {
            if (target) {
                target.abilitiesDisabled = true;
                target.tempBuffs.push({ type: 'abilitiesDisabled', expiresAt: 'endOfTurn' });
                this.emitEvent('abilitiesDisabled', { card: target });
            }
            return { needsTarget: !target, targetType: 'anyPupil', effect: 'disableAbilities' };
        }

        // Restore endurance - Balance Equation (id 223)
        if (ability.includes('equal to its starting endurance') || ability.includes('starting endurance')) {
            if (target) {
                target.currentEndurance = target.baseEndurance || target.endurance;
                this.emitEvent('enduranceRestored', { card: target, amount: target.currentEndurance });
            }
            return { needsTarget: !target, targetType: 'anyPupil', effect: 'restoreEndurance' };
        }

        // Limit blockers - Prime Numbers (id 224)
        if (ability.includes('cannot be blocked by more than one')) {
            if (target) {
                target.maxBlockers = 1;
                target.tempBuffs.push({ type: 'maxBlockers', value: 1, expiresAt: 'endOfTurn' });
                this.emitEvent('blockerLimited', { card: target });
            }
            return { needsTarget: !target, targetType: 'friendlyPupil', effect: 'limitBlockers' };
        }

        // Counter interruption - Proof of Concept (id 219)
        if (ability.includes('refute') || ability.includes('counter')) {
            // This would need a stack system to properly implement
            this.emitEvent('interruptionCountered', { player: playerNum });
            return { success: true };
        }

        // Look at top cards and choose - Hypothesis (id 258)
        if (ability.includes('look at the top') && ability.includes('put') && ability.includes('in your hand')) {
            const topMatch = ability.match(/top (\d+)/);
            const handMatch = ability.match(/put (\d+)/);
            const topCount = topMatch ? parseInt(topMatch[1]) : 5;
            const handCount = handMatch ? parseInt(handMatch[1]) : 2;
            const topCards = player.deck.slice(0, topCount);
            this.emitEvent('chooseFromTop', { player: playerNum, cards: topCards, choose: handCount, discardRest: true });
            return { needsChoice: true, cards: topCards, choose: handCount };
        }

        // Discard - Information Overload (id 256)
        if (ability.includes('discard')) {
            const match = ability.match(/discard.*?(\d+)?.*?card/);
            const count = match && match[1] ? parseInt(match[1]) : 1;
            this.emitEvent('forceDiscard', { targetPlayer: playerNum === 1 ? 2 : 1, count });
            return { needsOpponentDiscard: true, count };
        }

        // Die roll bonus - Structural Analysis (id 253)
        if (ability.includes('die rolls') && ability.includes('+')) {
            const match = ability.match(/\+(\d+)\s*to\s*die/);
            const bonus = match ? parseInt(match[1]) : 2;
            if (target) {
                target.dieRollBonus += bonus;
                target.tempBuffs.push({ type: 'dieRollBonus', value: bonus, expiresAt: 'endOfTurn' });
            }
            // Also check for damage prevention in same ability
            if (ability.includes('prevent all damage')) {
                if (target) {
                    target.tempBuffs.push({ type: 'damagePrevent', amount: 999, expiresAt: 'endOfTurn' });
                }
            }
            return { needsTarget: !target, targetType: 'friendlyPupil', effect: 'dieRollBonus', amount: bonus };
        }

        return { success: true };
    }

    // ==========================================
    // ETB (Enter the Battlefield) Triggers
    // ==========================================

    /**
     * Trigger ETB abilities when a card enters play
     */
    triggerETB(playerNum, card) {
        const ability = card.ability?.toLowerCase() || '';
        const player = this.state.players[playerNum];

        // Analytics Enthusiast (id 101) - Look at top 3, put 1 in hand
        if (ability.includes('look at the top') && ability.includes('put one in your hand')) {
            const match = ability.match(/top (\d+)/);
            const count = match ? parseInt(match[1]) : 3;
            const topCards = player.deck.slice(0, count);
            this.emitEvent('etbChooseFromTop', {
                player: playerNum,
                card: card,
                topCards: topCards,
                choose: 1,
                putRestOnBottom: true
            });
        }

        // Data Analyst (id 243) - Look at top 3 of opponent's deck
        if (ability.includes("top") && ability.includes("opponent's deck") && ability.includes('look')) {
            const match = ability.match(/top (\d+)/);
            const count = match ? parseInt(match[1]) : 3;
            const opponent = this.getOpponent(playerNum);
            const topCards = opponent.deck.slice(0, count);
            this.emitEvent('etbRevealOpponentDeck', {
                player: playerNum,
                card: card,
                topCards: topCards
            });
        }
    }

    /**
     * Trigger effects when an Interruption is played
     */
    triggerOnInterruption(playerNum, interruptionCard) {
        const player = this.state.players[playerNum];

        player.field.forEach(card => {
            if (card.abilitiesDisabled) return;
            const ability = card.ability?.toLowerCase() || '';

            // Calculus Teacher (id 110) - Draw a card when you play an Interruption
            if (ability.includes('when you play an interruption') && ability.includes('draw')) {
                if (player.deck.length > 0) {
                    player.hand.push(player.deck.shift());
                    this.emitEvent('triggerDraw', { card: card, reason: 'Calculus Teacher' });
                }
            }

            // Music Theory Student (id 248) - Give -1 die rolls to target
            if (ability.includes('whenever you play an interruption') && ability.includes('-1 to die rolls')) {
                this.emitEvent('needTargetForDebuff', {
                    player: playerNum,
                    card: card,
                    effect: 'dieRollPenalty',
                    amount: -1
                });
            }
        });
    }

    // ==========================================
    // Aura Effects (Passive Stat Modifications)
    // ==========================================

    /**
     * Recalculate all aura effects for a player
     */
    recalculateAuras(playerNum) {
        const player = this.state.players[playerNum];
        const opponent = this.getOpponent(playerNum);

        // Reset aura-based stats (keep counters and temp buffs)
        player.field.forEach(card => {
            card.auraEnduranceBonus = 0;
            card.auraDamageBonus = 0;
            card.auraDamageReduction = 0;
            card.auraProtection = [];
        });

        // Apply auras from each card
        player.field.forEach(sourceCard => {
            if (sourceCard.abilitiesDisabled) return;
            const ability = sourceCard.ability?.toLowerCase() || '';

            // Structural Design Teacher (id 15) - Other pupils get +2 Endurance
            if (ability.includes('other pupils') && ability.includes('+') && ability.includes('endurance')) {
                const match = ability.match(/\+(\d+)\s*endurance/);
                const bonus = match ? parseInt(match[1]) : 2;
                player.field.forEach(card => {
                    if (card.instanceId !== sourceCard.instanceId && card.type?.includes('Pupil')) {
                        card.auraEnduranceBonus = (card.auraEnduranceBonus || 0) + bonus;
                    }
                });
            }

            // Applied Mathematics Teacher (id 112) - Other pupils get +1/+0
            if (ability.includes('other pupils') && ability.includes('+1/+0')) {
                player.field.forEach(card => {
                    if (card.instanceId !== sourceCard.instanceId && card.type?.includes('Pupil')) {
                        card.auraDamageBonus = (card.auraDamageBonus || 0) + 1;
                    }
                });
            }

            // Authoritative Principal Jordan (id 115) - All your pupils take 2 less damage
            if (ability.includes('your pupils take') && ability.includes('less damage')) {
                const match = ability.match(/(\d+)\s*less damage/);
                const reduction = match ? parseInt(match[1]) : 2;
                player.field.forEach(card => {
                    if (card.type?.includes('Pupil')) {
                        card.auraDamageReduction = (card.auraDamageReduction || 0) + reduction;
                    }
                });
            }

            // Trigonometry Teacher (id 109) - Protection from Arts
            if (ability.includes('protection from arts')) {
                player.field.forEach(card => {
                    if (card.instanceId !== sourceCard.instanceId && card.type?.includes('Pupil')) {
                        if (!card.auraProtection) card.auraProtection = [];
                        if (!card.auraProtection.includes('P')) card.auraProtection.push('P'); // Purple = Arts
                    }
                });
            }

            // Drafting Table (id 260) - Your pupils get +1 Endurance
            if (sourceCard.type === 'Tool' && ability.includes('your pupils get') && ability.includes('endurance')) {
                const match = ability.match(/\+(\d+)\s*endurance/);
                const bonus = match ? parseInt(match[1]) : 1;
                player.field.forEach(card => {
                    if (card.type?.includes('Pupil')) {
                        card.auraEnduranceBonus = (card.auraEnduranceBonus || 0) + bonus;
                    }
                });
            }
        });

        this.emitEvent('aurasRecalculated', { player: playerNum });
    }

    /**
     * Get effective stats for a card (including auras, counters, buffs)
     */
    getEffectiveStats(card) {
        const endurance = (card.currentEndurance || 0) +
            (card.auraEnduranceBonus || 0) +
            (card.counters?.plusOne || 0);

        const damageBonus = (card.auraDamageBonus || 0) +
            (card.counters?.plusOne || 0);

        const dieRollBonus = (card.dieRollBonus || 0);

        const damageReduction = (card.auraDamageReduction || 0) +
            (card.damageReduction || 0);

        return { endurance, damageBonus, dieRollBonus, damageReduction };
    }

    /**
     * Activate a card's spend ability
     */
    activateAbility(playerNum, instanceId, target = null) {
        const player = this.state.players[playerNum];
        const opponent = this.getOpponent(playerNum);
        const card = player.field.find(c => c.instanceId === instanceId);

        if (!card) {
            return { success: false, error: 'Card not on field' };
        }

        if (card.isSpent) {
            return { success: false, error: 'Card is already spent' };
        }

        // Pupils with Getting Bearings can't use spend abilities (summoning sickness)
        if (card.hasGettingBearings && card.type?.includes('Pupil')) {
            return { success: false, error: 'Has Getting Bearings - wait a turn' };
        }

        const hasSpend = card.ability?.toLowerCase().includes('spend:');
        if (!hasSpend) {
            return { success: false, error: 'Card has no Spend ability' };
        }

        const ability = card.ability.toLowerCase();

        // Parse and execute the spend ability
        const result = this.executeSpendAbility(playerNum, card, ability, target);

        if (result.needsTarget && !target) {
            // Return info about what target is needed
            return { success: false, needsTarget: true, targetType: result.targetType, card, ability: result };
        }

        card.isSpent = true;

        this.emitEvent('abilityActivated', { player: playerNum, card, result });
        return { success: true, card, result };
    }

    /**
     * Execute a spend ability with optional target
     */
    executeSpendAbility(playerNum, card, ability, target) {
        const player = this.state.players[playerNum];
        const opponent = this.getOpponent(playerNum);

        // Counselor (id 87) - Target pupil recovers 2 Endurance
        if (ability.includes('recovers') && ability.includes('endurance')) {
            const match = ability.match(/recovers?\s*(\d+)\s*endurance/i);
            const amount = match ? parseInt(match[1]) : 2;
            if (target) {
                target.currentEndurance = Math.min(
                    (target.baseEndurance || target.endurance) + (target.auraEnduranceBonus || 0),
                    target.currentEndurance + amount
                );
                this.emitEvent('enduranceRecovered', { card: target, amount });
                return { success: true };
            }
            return { needsTarget: true, targetType: 'anyPupil', effect: 'heal', amount };
        }

        // Classic Nerd (id 98) - Spend/Ready target pupil
        if (ability.includes('spend/ready') || (ability.includes('spend') && ability.includes('ready') && ability.includes('target'))) {
            if (target) {
                target.isSpent = !target.isSpent;
                this.emitEvent('cardToggled', { card: target, isSpent: target.isSpent });
                return { success: true };
            }
            return { needsTarget: true, targetType: 'anyPupil', effect: 'toggleSpent' };
        }

        // Statistics Enthusiast (id 97) - Reroll any die
        if (ability.includes('reroll')) {
            // This sets a flag that the player can use a reroll
            player.canReroll = true;
            this.emitEvent('rerollAvailable', { player: playerNum });
            return { success: true, effect: 'rerollEnabled' };
        }

        // Number Theory Enthusiast (id 106) - Create 1/1 token
        if (ability.includes('create') && ability.includes('1/1')) {
            const token = {
                id: 9999,
                instanceId: `token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: 'Average Joe',
                type: 'Basic Pupil',
                subTypes: 'Token',
                cost: '(0)',
                dice: '1d4',
                ad: 1,
                endurance: 1,
                baseEndurance: 1,
                currentEndurance: 1,
                ability: null,
                hasGettingBearings: true,
                isSpent: false,
                counters: { plusOne: 0 },
                tempBuffs: [],
                dieRollBonus: 0,
                damageReduction: 0,
                protection: [],
                isToken: true
            };
            player.field.push(token);
            this.recalculateAuras(playerNum);
            this.emitEvent('tokenCreated', { player: playerNum, token });
            return { success: true, token };
        }

        // Receptionist (id 111) - Give protection from color
        if (ability.includes('protection from') && ability.includes('color')) {
            if (target) {
                // This would need UI to select a color
                return { needsColorChoice: true, target, effect: 'giveProtection' };
            }
            return { needsTarget: true, targetType: 'friendlyPupil', effect: 'giveProtection' };
        }

        // Calculator (id 116) - +1 die roll, if 6+ draw
        if (ability.includes('die rolls') && ability.includes('+1')) {
            if (target) {
                target.dieRollBonus += 1;
                target.tempBuffs.push({ type: 'dieRollBonus', value: 1, expiresAt: 'endOfTurn' });
                // The "if 6+ draw" is checked during combat resolution
                target.calculatorBonus = true;
                this.emitEvent('dieRollBonusApplied', { card: target, bonus: 1 });
                return { success: true };
            }
            return { needsTarget: true, targetType: 'friendlyPupil', effect: 'dieRollBonus' };
        }

        // Drafting Table (id 260) - Prevent 2 damage
        if (ability.includes('prevent') && ability.includes('damage') && ability.includes('target')) {
            const match = ability.match(/prevent.*?(\d+)\s*damage/);
            const amount = match ? parseInt(match[1]) : 2;
            if (target) {
                target.tempBuffs.push({ type: 'damagePrevent', amount, expiresAt: 'endOfTurn' });
                this.emitEvent('damagePreventionApplied', { card: target, amount });
                return { success: true };
            }
            return { needsTarget: true, targetType: 'friendlyPupil', effect: 'damagePrevent', amount };
        }

        // Game Theory Enthusiast (id 107) - If Support, spend for any resource
        if (ability.includes('spend for any resource')) {
            // Check if in support position (blocking)
            // For now, just add a wildcard resource
            player.resources.push({
                color: 'C',
                spent: false,
                isWildcard: true,
                id: `wildcard-${Date.now()}`,
                cardName: 'Wildcard'
            });
            this.emitEvent('wildcardResourceAdded', { player: playerNum });
            return { success: true };
        }

        return { success: true };
    }

    /**
     * Give protection from a specific color to a card
     */
    giveProtection(card, color) {
        if (!card.protection) card.protection = [];
        if (!card.protection.includes(color)) {
            card.protection.push(color);
        }
        card.tempBuffs.push({ type: 'protection', color, expiresAt: 'endOfTurn' });
        this.emitEvent('protectionGranted', { card, color });
    }

    // ==========================================
    // Combat
    // ==========================================

    /**
     * Enter combat phase
     */
    startCombat(playerNum) {
        if (this.state.currentPlayer !== playerNum) {
            return { success: false, error: 'Not your turn' };
        }

        this.state.phase = 'combat';
        this.state.combatStep = 'declare-attackers';
        this.state.attackers = [];
        this.state.blockers = {};

        this.emitEvent('combatStarted', { player: playerNum });
        return { success: true };
    }

    /**
     * Toggle attacker
     */
    toggleAttacker(playerNum, instanceId) {
        if (this.state.combatStep !== 'declare-attackers') {
            return { success: false, error: 'Not in attacker declaration' };
        }

        const player = this.state.players[playerNum];
        const card = player.field.find(c => c.instanceId === instanceId);

        if (!card) {
            return { success: false, error: 'Card not found' };
        }

        if (!card.type?.includes('Pupil')) {
            return { success: false, error: 'Only pupils can attack' };
        }

        if (card.hasGettingBearings) {
            return { success: false, error: 'Card has Getting Bearings' };
        }

        // Grounded - cannot attack
        const isGrounded = card.ability?.toLowerCase().includes('grounded');
        if (isGrounded && !card.abilitiesDisabled) {
            return { success: false, error: 'Card is Grounded and cannot attack' };
        }

        const isRelentless = card.ability?.toLowerCase().includes('relentless');
        if (card.isSpent && !isRelentless) {
            return { success: false, error: 'Card is spent' };
        }

        const idx = this.state.attackers.findIndex(a => a.instanceId === instanceId);
        if (idx !== -1) {
            this.state.attackers.splice(idx, 1);
        } else {
            this.state.attackers.push(card);
        }

        this.emitEvent('attackerToggled', { card, attacking: idx === -1 });
        return { success: true };
    }

    /**
     * Confirm attackers and move to blocker step
     */
    confirmAttackers(playerNum) {
        if (this.state.combatStep !== 'declare-attackers') {
            return { success: false, error: 'Not in attacker declaration' };
        }

        // Spend attackers (except relentless)
        const player = this.state.players[playerNum];
        this.state.attackers.forEach(att => {
            const card = player.field.find(c => c.instanceId === att.instanceId);
            if (card) {
                const isRelentless = att.ability?.toLowerCase().includes('relentless');
                if (!isRelentless) card.isSpent = true;
            }
        });

        if (this.state.attackers.length === 0) {
            // No attackers, skip to end
            this.state.combatStep = null;
            this.state.phase = 'end';
            this.emitEvent('combatSkipped', {});
            return { success: true, skipped: true };
        }

        this.state.combatStep = 'declare-blockers';
        this.emitEvent('attackersDeclared', { attackers: this.state.attackers });
        return { success: true };
    }

    /**
     * Toggle blocker assignment
     */
    toggleBlocker(defenderNum, blockerInstanceId, attackerInstanceId) {
        if (this.state.combatStep !== 'declare-blockers') {
            return { success: false, error: 'Not in blocker declaration' };
        }

        const defender = this.state.players[defenderNum];
        const attacker = this.state.players[defenderNum === 1 ? 2 : 1];
        const blocker = defender.field.find(c => c.instanceId === blockerInstanceId);
        const attackingCard = this.state.attackers.find(a => a.instanceId === attackerInstanceId);

        if (!blocker) {
            return { success: false, error: 'Blocker not found' };
        }

        if (!blocker.type?.includes('Pupil')) {
            return { success: false, error: 'Only pupils can block' };
        }

        if (blocker.isSpent) {
            return { success: false, error: 'Blocker is spent' };
        }

        // Check protection - can't block creatures you have protection from
        if (attackingCard) {
            const attackerColor = this.getPrimaryColor(attackingCard.cost);
            const allProtection = [...(blocker.protection || []), ...(blocker.auraProtection || [])];
            // Actually, protection means the protected creature can't be DAMAGED by that color
            // So blocking is allowed, but damage is prevented (handled in combat resolution)
        }

        // Check if attacker has max blocker limit (Prime Numbers effect)
        if (attackingCard?.maxBlockers) {
            const currentBlockers = Object.entries(this.state.blockers)
                .filter(([attId, _]) => attId === attackerInstanceId).length;
            if (currentBlockers >= attackingCard.maxBlockers) {
                // Check if we're toggling off an existing blocker
                const existing = Object.entries(this.state.blockers).find(([_, bId]) => bId === blockerInstanceId);
                if (!existing) {
                    return { success: false, error: `Can only be blocked by ${attackingCard.maxBlockers} creature(s)` };
                }
            }
        }

        // Check The Tool (id 11) - Must be blocked if possible
        // This is a UI hint, not enforced here

        // Check if already blocking something
        const existing = Object.entries(this.state.blockers).find(([_, bId]) => bId === blockerInstanceId);
        if (existing) {
            delete this.state.blockers[existing[0]];
        } else {
            this.state.blockers[attackerInstanceId] = blockerInstanceId;
        }

        this.emitEvent('blockerToggled', { blocker, attackerId: attackerInstanceId });
        return { success: true };
    }

    /**
     * Confirm blockers and resolve combat
     */
    confirmBlockers() {
        if (this.state.combatStep !== 'declare-blockers') {
            return { success: false, error: 'Not in blocker declaration' };
        }

        return this.resolveCombat();
    }

    /**
     * Resolve combat damage
     */
    resolveCombat() {
        const attackingPlayer = this.state.currentPlayer;
        const defendingPlayer = attackingPlayer === 1 ? 2 : 1;

        const attacker = this.state.players[attackingPlayer];
        const defender = this.state.players[defendingPlayer];

        let pointsScored = 0;
        let defenderPointsLost = 0;
        const combatLog = [];

        // Check Authoritative Principal Jordan - opponent loses 1 point per attacker
        defender.field.forEach(card => {
            if (card.abilitiesDisabled) return;
            const ability = card.ability?.toLowerCase() || '';
            if (ability.includes('opponent loses') && ability.includes('point') && ability.includes('attack')) {
                const match = ability.match(/loses?\s*(\d+)\s*point/);
                const pointsPerAttacker = match ? parseInt(match[1]) : 1;
                defenderPointsLost += this.state.attackers.length * pointsPerAttacker;
            }
        });

        this.state.attackers.forEach(att => {
            const attCard = attacker.field.find(c => c.instanceId === att.instanceId);
            if (!attCard) return; // Card might have been removed

            // Calculate attack roll with bonuses
            let roll = this.rollAttackDice(attCard);
            const blockerId = this.state.blockers[att.instanceId];

            if (blockerId) {
                const blocker = defender.field.find(c => c.instanceId === blockerId);
                if (blocker) {
                    let blockerRoll = this.rollDice(blocker.dice);
                    blockerRoll += (blocker.dieRollBonus || 0);

                    const logEntry = {
                        attacker: att.name,
                        attackRoll: roll,
                        blocker: blocker.name,
                        blockerRoll: blockerRoll
                    };

                    // Calculate damage with reductions
                    let damageToBlocker = roll;
                    let damageToAttacker = blockerRoll;

                    // Apply damage reduction from auras and abilities
                    const blockerReduction = this.calculateDamageReduction(blocker);
                    const attackerReduction = this.calculateDamageReduction(attCard);

                    // Geometry Teacher (id 108) - Takes 4 less damage
                    if (blocker.ability?.toLowerCase().includes('takes') && blocker.ability?.toLowerCase().includes('less damage')) {
                        const match = blocker.ability.match(/(\d+)\s*less damage/);
                        const selfReduction = match ? parseInt(match[1]) : 4;
                        damageToBlocker = Math.max(0, damageToBlocker - selfReduction);
                        logEntry.blockerReduction = selfReduction;
                    }

                    // Apply temp damage prevention
                    const blockerPrevention = this.consumeDamagePrevention(blocker, damageToBlocker);
                    damageToBlocker = Math.max(0, damageToBlocker - blockerPrevention);

                    const attackerPrevention = this.consumeDamagePrevention(attCard, damageToAttacker);
                    damageToAttacker = Math.max(0, damageToAttacker - attackerPrevention);

                    // Apply aura damage reduction
                    damageToBlocker = Math.max(0, damageToBlocker - blockerReduction);
                    damageToAttacker = Math.max(0, damageToAttacker - attackerReduction);

                    // Check Lethal - any damage exhausts
                    const hasLethal = attCard.ability?.toLowerCase().includes('lethal');
                    if (hasLethal && damageToBlocker > 0) {
                        blocker.isSpent = true;
                        logEntry.lethal = true;
                    }

                    // Check Rebuttal - damage back to attacker
                    const rebuttalMatch = blocker.ability?.match(/rebuttal\s*(\d+)?/i);
                    if (rebuttalMatch && damageToBlocker > 0 && !blocker.abilitiesDisabled) {
                        const rebuttalDamage = rebuttalMatch[1] ? parseInt(rebuttalMatch[1]) : damageToBlocker;
                        damageToAttacker += rebuttalDamage;
                        logEntry.rebuttal = rebuttalDamage;
                    }

                    // Apply damage
                    blocker.currentEndurance -= damageToBlocker;

                    // Stubborn - cannot be exhausted by damage
                    const hasStubborn = attCard.ability?.toLowerCase().includes('stubborn');
                    if (!hasStubborn) {
                        attCard.currentEndurance -= damageToAttacker;
                    } else {
                        logEntry.stubborn = true;
                    }

                    logEntry.finalDamageToBlocker = damageToBlocker;
                    logEntry.finalDamageToAttacker = damageToAttacker;
                    combatLog.push(logEntry);

                    // Check Overwhelm / Trample
                    const hasOverwhelm = att.ability?.toLowerCase().includes('overwhelm') ||
                        att.ability?.toLowerCase().includes('over blocker becomes');
                    if (hasOverwhelm && blocker.currentEndurance <= 0) {
                        const excess = Math.abs(blocker.currentEndurance);
                        if (excess > 0) {
                            pointsScored += excess;
                            combatLog[combatLog.length - 1].overwhelm = excess;
                        }
                    }

                    // Physics Enthusiast (id 246) - Draw when exhaust opponent
                    if (blocker.currentEndurance <= 0 || blocker.isSpent) {
                        if (attCard.ability?.toLowerCase().includes('exhausts') && attCard.ability?.toLowerCase().includes('draw')) {
                            if (attacker.deck.length > 0) {
                                attacker.hand.push(attacker.deck.shift());
                                logEntry.drewCard = true;
                            }
                        }
                    }

                    // Calculator bonus - if roll was 6+, draw a card
                    if (attCard.calculatorBonus && roll >= 6) {
                        if (attacker.deck.length > 0) {
                            attacker.hand.push(attacker.deck.shift());
                            logEntry.calculatorDraw = true;
                        }
                        delete attCard.calculatorBonus;
                    }
                }
            } else {
                // Unblocked - deal points
                pointsScored += roll;
                combatLog.push({ attacker: att.name, attackRoll: roll, unblocked: true, points: roll });

                // Unblocked creature abilities - Shop Teacher recovers full HP
                if (attCard.ability?.toLowerCase().includes('if unblocked') && attCard.ability?.toLowerCase().includes('recover')) {
                    attCard.currentEndurance = attCard.baseEndurance || attCard.endurance;
                }
            }
        });

        // Remove dead creatures (but not Stubborn ones damaged to 0)
        attacker.field = attacker.field.filter(c => {
            if (!c.currentEndurance) return true; // Tools, locations
            if (c.currentEndurance <= 0) {
                // Move to discard
                attacker.discard.push(c);
                return false;
            }
            return true;
        });
        defender.field = defender.field.filter(c => {
            if (!c.currentEndurance) return true;
            if (c.currentEndurance <= 0) {
                defender.discard.push(c);
                return false;
            }
            return true;
        });

        // Recalculate auras after creatures die
        this.recalculateAuras(attackingPlayer);
        this.recalculateAuras(defendingPlayer);

        // Award points
        attacker.points += pointsScored;

        // Handle Jock scoring (die upgrade on point scored)
        if (pointsScored > 0) {
            this.handleJockScoring(attackingPlayer, pointsScored);
        }

        // Apply defender point loss (Principal Jordan ability)
        if (defenderPointsLost > 0) {
            defender.points = Math.max(0, defender.points - defenderPointsLost);
            this.emitEvent('pointsLost', { player: defendingPlayer, amount: defenderPointsLost, reason: 'Authoritative Principal' });
        }

        // Check win condition
        if (attacker.points >= this.winCondition) {
            this.state.gameOver = true;
            this.state.winner = attackingPlayer;
            this.emitEvent('gameOver', { winner: attackingPlayer, points: attacker.points });
        }

        // Reset combat state
        this.state.combatStep = null;
        this.state.attackers = [];
        this.state.blockers = {};
        this.state.phase = 'end';

        this.emitEvent('combatResolved', { pointsScored, defenderPointsLost, combatLog });
        return { success: true, pointsScored, defenderPointsLost, combatLog };
    }

    /**
     * Roll attack dice with all bonuses
     */
    rollAttackDice(card) {
        const ability = card.ability?.toLowerCase() || '';

        // Probability Enthusiast (id 105) - Flip 4 coins
        if (ability.includes('flip') && ability.includes('coin')) {
            const match = ability.match(/flip\s*(\d+)\s*coins?/);
            const numCoins = match ? parseInt(match[1]) : 4;
            let heads = 0;
            for (let i = 0; i < numCoins; i++) {
                if (Math.random() < 0.5) heads++;
            }
            this.emitEvent('coinsFlipped', { card, numCoins, heads });
            return heads + (card.dieRollBonus || 0);
        }

        // Normal dice roll
        let roll = this.rollDice(card.dice);

        // Add die roll bonus from abilities, buffs, and auras
        roll += (card.dieRollBonus || 0);

        // Add damage bonus from +1/+1 counters and auras
        roll += (card.counters?.plusOne || 0);
        roll += (card.auraDamageBonus || 0);

        // Calculus Enthusiast cumulative bonus
        roll += (card.cumulativeDieBonus || 0);

        return Math.max(0, roll);
    }

    /**
     * Calculate total damage reduction for a card
     */
    calculateDamageReduction(card) {
        let reduction = 0;
        reduction += (card.auraDamageReduction || 0);
        reduction += (card.damageReduction || 0);
        return reduction;
    }

    /**
     * Consume damage prevention from temp buffs
     */
    consumeDamagePrevention(card, incomingDamage) {
        let prevented = 0;
        const newBuffs = [];

        for (const buff of (card.tempBuffs || [])) {
            if (buff.type === 'damagePrevent' && buff.amount > 0) {
                const toPrevent = Math.min(buff.amount, incomingDamage - prevented);
                prevented += toPrevent;
                buff.amount -= toPrevent;
                if (buff.amount > 0) {
                    newBuffs.push(buff);
                }
            } else {
                newBuffs.push(buff);
            }
        }

        card.tempBuffs = newBuffs;
        return prevented;
    }

    // ==========================================
    // Turn Management
    // ==========================================

    /**
     * End the current turn
     */
    endTurn(playerNum) {
        if (this.state.currentPlayer !== playerNum) {
            return { success: false, error: 'Not your turn' };
        }

        const nextPlayer = playerNum === 1 ? 2 : 1;

        // Increment turn counter when player 2 ends their turn
        if (playerNum === 2) {
            this.state.turn++;
        }

        this.state.currentPlayer = nextPlayer;
        this.state.phase = 'draw';
        this.state.combatStep = null;
        this.state.attackers = [];
        this.state.blockers = {};
        this.state.selectedCard = null;
        this.state.selectedFieldCard = null;

        // Begin next player's turn
        this.beginTurn(nextPlayer);

        this.emitEvent('turnEnded', { player: playerNum, nextPlayer });
        return { success: true, nextPlayer };
    }

    /**
     * Begin a player's turn (draw, ready, etc.)
     */
    beginTurn(playerNum) {
        const player = this.state.players[playerNum];

        // Clear end-of-turn effects from previous turn
        this.clearExpiredEffects(playerNum);

        // Draw phase
        if (player.deck.length > 0) {
            player.hand.push(player.deck.shift());
        }

        // Ready phase - untap everything
        player.field.forEach(c => {
            c.isSpent = false;
            c.hasGettingBearings = false;
            c.usedReroll = false;
        });
        player.resources.forEach(r => r.spent = false);
        player.interruptionPlayed = false;
        player.canReroll = false;

        // Start of turn triggers
        this.triggerStartOfTurn(playerNum);

        this.state.phase = 'main';

        this.emitEvent('turnStarted', { player: playerNum, handSize: player.hand.length });
    }

    /**
     * Clear effects that expire at end of turn
     */
    clearExpiredEffects(playerNum) {
        const player = this.state.players[playerNum];

        player.field.forEach(card => {
            // Clear temp buffs that expired
            card.tempBuffs = (card.tempBuffs || []).filter(buff => buff.expiresAt !== 'endOfTurn');

            // Reset temporary flags
            card.abilitiesDisabled = false;
            card.maxBlockers = null;
            card.dieRollBonus = 0;
            card.calculatorBonus = false;

            // Reset protection from temp buffs (keep aura protection)
            card.protection = card.auraProtection ? [...card.auraProtection] : [];
        });
    }

    /**
     * Trigger start of turn abilities
     */
    triggerStartOfTurn(playerNum) {
        const player = this.state.players[playerNum];

        player.field.forEach(card => {
            if (card.abilitiesDisabled) return;
            const ability = card.ability?.toLowerCase() || '';

            // Calculus Enthusiast (id 104) - Cumulative +1 to die rolls
            if (ability.includes('start of your turn') && ability.includes('+1 to die rolls')) {
                card.cumulativeDieBonus = (card.cumulativeDieBonus || 0) + 1;
                this.emitEvent('cumulativeBonusIncreased', { card, bonus: card.cumulativeDieBonus });
            }

            // The Apprentice (id 2) - Generate full HP at end of turn (we do it at start of next)
            if (ability.includes('generates full hp') || ability.includes('full hp at end of turn')) {
                card.currentEndurance = card.baseEndurance || card.endurance;
                this.emitEvent('enduranceRegenerated', { card });
            }
        });

        // Recalculate auras in case anything changed
        this.recalculateAuras(playerNum);
    }

    /**
     * End of turn processing
     */
    processEndOfTurn(playerNum) {
        const player = this.state.players[playerNum];

        player.field.forEach(card => {
            if (card.abilitiesDisabled) return;
            const ability = card.ability?.toLowerCase() || '';

            // Jock (id 8) - Die roll increases when scoring points (handled in combat)
        });
    }

    // ==========================================
    // Dice Rolling
    // ==========================================

    /**
     * Roll dice from string like "1d6", "2d4 adv"
     */
    rollDice(diceStr) {
        if (!diceStr) return 0;
        const match = diceStr.match(/(\d*)d(\d+)/);
        if (!match) return 0;

        const count = parseInt(match[1]) || 1;
        const sides = parseInt(match[2]);
        const results = [];

        for (let i = 0; i < count; i++) {
            results.push(Math.floor(Math.random() * sides) + 1);
        }

        // Advantage: take highest
        if (diceStr.includes('adv') || count > 1) {
            return Math.max(...results);
        }

        return results.reduce((a, b) => a + b, 0);
    }

    // ==========================================
    // Utility
    // ==========================================

    shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    /**
     * Get current player
     */
    getCurrentPlayer() {
        return this.state.players[this.state.currentPlayer];
    }

    /**
     * Get opponent of a player
     */
    getOpponent(playerNum) {
        return this.state.players[playerNum === 1 ? 2 : 1];
    }

    /**
     * Check if it's a specific player's turn
     */
    isPlayerTurn(playerNum) {
        return this.state.currentPlayer === playerNum;
    }

    /**
     * Use a reroll (Statistics Enthusiast ability)
     */
    useReroll(playerNum, originalRoll, diceStr) {
        const player = this.state.players[playerNum];

        if (!player.canReroll) {
            return { success: false, error: 'No reroll available' };
        }

        player.canReroll = false;
        const newRoll = this.rollDice(diceStr);

        this.emitEvent('diceRerolled', { player: playerNum, original: originalRoll, newRoll });
        return { success: true, originalRoll, newRoll };
    }

    /**
     * Upgrade a card's die (Jock ability)
     */
    upgradeDie(card) {
        if (!card.dice) return;

        const diceMap = {
            '1d4': '1d6',
            '1d6': '1d8',
            '1d8': '1d10',
            '1d10': '1d12',
            '1d12': '1d20',
            '2d4': '2d6',
            '2d6': '2d8'
        };

        const baseDice = card.dice.split(' ')[0]; // Handle "1d4 (adv)" format
        const suffix = card.dice.includes('adv') ? ' (adv)' : '';

        if (diceMap[baseDice]) {
            card.dice = diceMap[baseDice] + suffix;
            this.emitEvent('dieUpgraded', { card, newDice: card.dice });
        }
    }

    /**
     * Handle Jock scoring (die upgrade)
     */
    handleJockScoring(attackingPlayer, pointsScored) {
        if (pointsScored <= 0) return;

        const player = this.state.players[attackingPlayer];
        player.field.forEach(card => {
            if (card.abilitiesDisabled) return;
            const ability = card.ability?.toLowerCase() || '';

            // Jock (id 8) - Die roll goes up when scoring
            if (ability.includes('scores a point') && ability.includes('die roll goes up')) {
                this.upgradeDie(card);
            }
        });
    }

    /**
     * Check if a card has protection from a color
     */
    hasProtectionFrom(card, color) {
        const allProtection = [
            ...(card.protection || []),
            ...(card.auraProtection || [])
        ];
        return allProtection.includes(color);
    }

    /**
     * Rearrange top cards of deck (Order of Operations)
     */
    rearrangeTopCards(playerNum, newOrder) {
        const player = this.state.players[playerNum];
        const count = newOrder.length;

        // Verify all cards are from the top of the deck
        const topCards = player.deck.slice(0, count);
        const topIds = topCards.map(c => c.instanceId);

        if (!newOrder.every(id => topIds.includes(id))) {
            return { success: false, error: 'Invalid card order' };
        }

        // Reorder
        const reordered = newOrder.map(id => topCards.find(c => c.instanceId === id));
        player.deck.splice(0, count, ...reordered);

        this.emitEvent('deckRearranged', { player: playerNum, count });
        return { success: true };
    }

    /**
     * Choose cards from top of deck (Analytics Enthusiast, Hypothesis)
     */
    chooseFromTop(playerNum, chosenIds, putRestOnBottom = true, discardRest = false) {
        const player = this.state.players[playerNum];

        const topCards = [];
        const remaining = [];

        // Get the cards that were being chosen from
        const count = chosenIds.length + (putRestOnBottom || discardRest ? 2 : 0); // Estimate
        player.deck.slice(0, 5).forEach(card => {
            if (chosenIds.includes(card.instanceId)) {
                topCards.push(card);
            } else {
                remaining.push(card);
            }
        });

        // Remove chosen cards from deck
        player.deck = player.deck.filter(c => !chosenIds.includes(c.instanceId));

        // Add chosen to hand
        topCards.forEach(card => player.hand.push(card));

        // Handle remaining cards
        if (discardRest) {
            remaining.forEach(card => {
                player.deck = player.deck.filter(c => c.instanceId !== card.instanceId);
                player.discard.push(card);
            });
        } else if (putRestOnBottom) {
            remaining.forEach(card => {
                player.deck = player.deck.filter(c => c.instanceId !== card.instanceId);
                player.deck.push(card);
            });
        }

        this.emitEvent('cardsChosen', { player: playerNum, chosen: topCards.length });
        return { success: true, chosenCards: topCards };
    }

    /**
     * Force opponent to discard (Information Overload)
     */
    forceDiscard(playerNum, cardInstanceId) {
        const player = this.state.players[playerNum];
        const cardIndex = player.hand.findIndex(c => c.instanceId === cardInstanceId);

        if (cardIndex === -1) {
            return { success: false, error: 'Card not in hand' };
        }

        const card = player.hand.splice(cardIndex, 1)[0];
        player.discard.push(card);

        this.emitEvent('cardDiscarded', { player: playerNum, card });
        return { success: true, card };
    }

    /**
     * Emit game event
     */
    emitEvent(type, detail) {
        this.dispatchEvent(new CustomEvent(type, { detail }));
    }

    /**
     * Get serializable state for multiplayer sync
     */
    getSerializableState() {
        return JSON.parse(JSON.stringify(this.state));
    }

    /**
     * Load state from serialized data
     */
    loadState(serializedState) {
        this.state = JSON.parse(JSON.stringify(serializedState));
        this.emitEvent('stateLoaded', { state: this.state });
    }
}

// Export
window.RiutizGame = RiutizGame;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RiutizGame };
}
