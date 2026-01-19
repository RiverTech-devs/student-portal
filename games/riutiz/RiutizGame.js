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
            OVERWHELM: 'overwhelm',
            INTERJECT: 'interject',
            LOCKDOWN: 'lockdown',
            CLOSED_MINDED: 'closed-minded'
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

        // === BLACK (Bk) INTERRUPTION EFFECTS ===

        // System Crash (id 226) - Spend target, doesn't ready next turn
        if (ability.includes('spend target') && ability.includes("doesn't ready")) {
            if (target) {
                target.isSpent = true;
                target.skipNextReady = true;
                target.tempBuffs.push({ type: 'skipReady', expiresAt: 'nextTurn' });
                this.emitEvent('systemCrash', { card: target });
            }
            return { needsTarget: !target, targetType: 'anyPupil', effect: 'systemCrash' };
        }

        // Data Breach (id 227) - Look at hand, they discard your choice
        if (ability.includes("look at opponent's hand") && ability.includes('discard') && ability.includes('your choice')) {
            this.emitEvent('dataBreach', {
                player: playerNum,
                targetPlayer: playerNum === 1 ? 2 : 1,
                hand: opponent.hand
            });
            return { needsOpponentDiscardChoice: true };
        }

        // Overclock (id 228) - +3 die rolls, deal 2 damage at end of turn
        if (ability.includes('+3 to die rolls') || (ability.includes('die rolls') && ability.includes('+3'))) {
            if (target) {
                target.dieRollBonus = (target.dieRollBonus || 0) + 3;
                target.tempBuffs.push({ type: 'dieRollBonus', value: 3, expiresAt: 'endOfTurn' });
                target.tempBuffs.push({ type: 'endOfTurnDamage', damage: 2, expiresAt: 'endOfTurn' });
                this.emitEvent('overclock', { card: target, bonus: 3, damage: 2 });
            }
            return { needsTarget: !target, targetType: 'anyPupil', effect: 'overclock' };
        }

        // Debugging (id 229) - Remove all counters
        if (ability.includes('remove all counters')) {
            if (target) {
                target.counters = { plusOne: 0 };
                this.emitEvent('countersRemoved', { card: target });
            }
            return { needsTarget: !target, targetType: 'anyPupilOrTool', effect: 'removeCounters' };
        }

        // Firmware Update (id 230) - Ready target, gains Relentless
        if (ability.includes('ready target') && ability.includes('relentless')) {
            if (target) {
                target.isSpent = false;
                target.tempBuffs.push({ type: 'keyword', keyword: 'relentless', expiresAt: 'endOfTurn' });
                target.tempRelentless = true;
                this.emitEvent('firmwareUpdate', { card: target });
            }
            return { needsTarget: !target, targetType: 'anyPupil', effect: 'firmwareUpdate' };
        }

        // Network Effect (id 231) - Draw for each Tool
        if (ability.includes('draw') && ability.includes('for each tool')) {
            const toolCount = player.field.filter(c => c.type === 'Tool').length;
            for (let i = 0; i < toolCount && player.deck.length > 0; i++) {
                player.hand.push(player.deck.shift());
            }
            this.emitEvent('networkEffect', { player: playerNum, cardsDrawn: toolCount });
            return { success: true };
        }

        // Malware (id 232) - Gain control of target Tool until end of turn
        if (ability.includes('gain control') && ability.includes('tool')) {
            if (target && target.type === 'Tool') {
                // Move tool to player's field temporarily
                const oppIndex = opponent.field.findIndex(c => c.instanceId === target.instanceId);
                if (oppIndex !== -1) {
                    const tool = opponent.field.splice(oppIndex, 1)[0];
                    tool.tempControlledBy = playerNum;
                    tool.originalOwner = playerNum === 1 ? 2 : 1;
                    player.field.push(tool);
                    this.emitEvent('malware', { tool, newController: playerNum });
                }
            }
            return { needsTarget: !target, targetType: 'enemyTool', effect: 'stealTool' };
        }

        // Hard Reset (id 233) - Return all Tools to hands
        if (ability.includes('return all tools') && ability.includes('hands')) {
            [player, opponent].forEach((p, idx) => {
                const tools = p.field.filter(c => c.type === 'Tool');
                tools.forEach(tool => {
                    p.field = p.field.filter(c => c.instanceId !== tool.instanceId);
                    p.hand.push(tool);
                });
            });
            this.emitEvent('hardReset', { player: playerNum });
            return { success: true };
        }

        // Viral Content (id 254) - Deal 3 damage, draw for each point dealt
        if (ability.includes('deal') && ability.includes('damage') && ability.includes('draw') && ability.includes('for each')) {
            const damageMatch = ability.match(/deal\s*(\d+)\s*damage/);
            const damage = damageMatch ? parseInt(damageMatch[1]) : 3;
            if (target) {
                const actualDamage = Math.min(damage, target.currentEndurance);
                target.currentEndurance -= damage;
                for (let i = 0; i < actualDamage && player.deck.length > 0; i++) {
                    player.hand.push(player.deck.shift());
                }
                this.emitEvent('viralContent', { target, damage: actualDamage, cardsDrawn: actualDamage });

                // Check if target died
                if (target.currentEndurance <= 0) {
                    this.emitEvent('pupilExhausted', { card: target });
                }
            }
            return { needsTarget: !target, targetType: 'anyPupil', effect: 'viralContent', damage };
        }

        // Laziness (id 190) - Spend all pupils you don't control
        if (ability.includes('spend all pupils') && ability.includes('do not control')) {
            opponent.field.forEach(card => {
                if (card.type?.includes('Pupil')) {
                    card.isSpent = true;
                }
            });
            this.emitEvent('laziness', { player: playerNum });
            return { success: true };
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
        const opponent = this.getOpponent(playerNum);

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
            const topCards = opponent.deck.slice(0, count);
            this.emitEvent('etbRevealOpponentDeck', {
                player: playerNum,
                card: card,
                topCards: topCards
            });
        }

        // === BLACK (Bk) CARD ETB ABILITIES ===

        // The Gamer (id 119) - Draw a card when enters
        if (ability.includes('when') && ability.includes('enters') && ability.includes('draw a card') && !ability.includes('target')) {
            if (player.deck.length > 0) {
                player.hand.push(player.deck.shift());
                this.emitEvent('etbDraw', { player: playerNum, card, count: 1 });
            }
        }

        // The Hacker (id 120) - Look at opponent's hand, choose a pupil to discard
        if (ability.includes("opponent's hand") && ability.includes('choose') && ability.includes('discard')) {
            const opponentHand = opponent.hand;
            const pupils = opponentHand.filter(c => c.type?.includes('Pupil'));
            this.emitEvent('etbChooseDiscard', {
                player: playerNum,
                card: card,
                targetHand: opponentHand,
                filterPupils: true,
                validTargets: pupils
            });
        }

        // AI Enthusiast (id 126) - Return target pupil to hand (bounce)
        if (ability.includes('target pupil goes back to hand') || ability.includes('target pupil returns to hand')) {
            this.emitEvent('etbNeedsTarget', {
                player: playerNum,
                card: card,
                effect: 'bounce',
                targetType: 'anyPupil'
            });
        }

        // The Vlogger (id 127) - Target pupil gains Non-Sequitur
        if (ability.includes('gains non-sequitur')) {
            this.emitEvent('etbNeedsTarget', {
                player: playerNum,
                card: card,
                effect: 'grantNonSequitur',
                targetType: 'anyPupil'
            });
        }

        // Film Enthusiast (id 128) - Target becomes Spent and doesn't Ready
        if (ability.includes('becomes spent') && ability.includes("doesn't ready")) {
            this.emitEvent('etbNeedsTarget', {
                player: playerNum,
                card: card,
                effect: 'lockdown',
                targetType: 'anyPupil'
            });
        }

        // The QA Tester (id 130) - Endurance = number of Gamers
        if (ability.includes('endurance starts as the number of gamers')) {
            const gamerCount = player.field.filter(c =>
                c.subTypes?.toLowerCase().includes('gamer')
            ).length + opponent.field.filter(c =>
                c.subTypes?.toLowerCase().includes('gamer')
            ).length;
            card.currentEndurance = Math.max(1, gamerCount);
            card.baseEndurance = card.currentEndurance;
            this.emitEvent('dynamicEndurance', { card, endurance: card.currentEndurance });
        }

        // AI Instructor (id 135) - Create token copy of target pupil
        if (ability.includes('create') && ability.includes('token copy')) {
            this.emitEvent('etbNeedsTarget', {
                player: playerNum,
                card: card,
                effect: 'tokenCopy',
                targetType: 'anyPupil'
            });
        }

        // Resource Officer (id 137) - Lockdown: target student can't attack/block
        if (ability.includes('lockdown') && ability.includes('cannot attack or block')) {
            this.emitEvent('etbNeedsTarget', {
                player: playerNum,
                card: card,
                effect: 'lockdownStudent',
                targetType: 'anyStudent',
                sourceCard: card.instanceId
            });
        }

        // Traveling Missionary, Paul (id 251) - Each player draws 2 cards
        if (ability.includes('each player draws') && ability.includes('cards')) {
            const match = ability.match(/draws?\s*(\d+)\s*cards?/);
            const count = match ? parseInt(match[1]) : 2;
            for (let i = 0; i < count && player.deck.length > 0; i++) {
                player.hand.push(player.deck.shift());
            }
            for (let i = 0; i < count && opponent.deck.length > 0; i++) {
                opponent.hand.push(opponent.deck.shift());
            }
            this.emitEvent('etbBothDraw', { player: playerNum, card, count });
        }

        // Digital Artist (id 241) - Handled in combat (when deals damage, draw)

        // Biotech Intern (id 247) - Gets +1/+1 when another pupil exhausted (tracked via triggerPupilExhausted)
    }

    /**
     * Trigger effects when a pupil is exhausted (destroyed/killed)
     */
    triggerPupilExhausted(exhaustedCard, ownerPlayerNum) {
        // Check both players for "when another pupil is exhausted" triggers
        [1, 2].forEach(playerNum => {
            const player = this.state.players[playerNum];

            player.field.forEach(card => {
                if (card.abilitiesDisabled) return;
                if (card.instanceId === exhaustedCard.instanceId) return; // Don't trigger on self
                const ability = card.ability?.toLowerCase() || '';

                // Biotech Intern (id 247) - Gets +1/+1 when another pupil is exhausted
                if (ability.includes('when another pupil is exhausted') && ability.includes('+1/+1')) {
                    card.counters = card.counters || { plusOne: 0 };
                    card.counters.plusOne++;
                    card.currentEndurance++;
                    this.emitEvent('biotechInternTrigger', {
                        card,
                        exhaustedPupil: exhaustedCard.name,
                        newCounters: card.counters.plusOne
                    });
                }

                // Gene Sequencer (id 261) - May pay (1) to draw when pupil exhausted
                if (ability.includes('when a pupil is exhausted') && ability.includes('pay') && ability.includes('draw')) {
                    const availableResources = player.resources.filter(r => !r.spent);
                    if (availableResources.length > 0) {
                        this.emitEvent('geneSequencerTrigger', {
                            player: playerNum,
                            card,
                            exhaustedPupil: exhaustedCard.name,
                            canPay: true
                        });
                    }
                }
            });
        });
    }

    /**
     * Pay for Gene Sequencer triggered ability
     */
    payGeneSequencerTrigger(playerNum) {
        const player = this.state.players[playerNum];
        const availableResource = player.resources.find(r => !r.spent);

        if (!availableResource) {
            return { success: false, error: 'No available resources' };
        }

        availableResource.spent = true;

        if (player.deck.length > 0) {
            player.hand.push(player.deck.shift());
            this.emitEvent('geneSequencerDraw', { player: playerNum });
        }

        return { success: true };
    }

    /**
     * Handle drawing cards with trigger checks (Confusion Matrix)
     * @param {number} playerNum - Player drawing cards
     * @param {number} count - Number of cards to draw
     * @param {boolean} skipTriggers - Whether to skip draw triggers (to prevent infinite loops)
     */
    drawCards(playerNum, count, skipTriggers = false) {
        const player = this.state.players[playerNum];
        let cardsDrawn = 0;

        for (let i = 0; i < count && player.deck.length > 0; i++) {
            player.hand.push(player.deck.shift());
            cardsDrawn++;
        }

        // Check for Confusion Matrix trigger (opponent's tool)
        if (!skipTriggers && cardsDrawn > 0) {
            this.triggerOnOpponentDraw(playerNum, cardsDrawn);
        }

        return cardsDrawn;
    }

    /**
     * Trigger effects when a player draws (Confusion Matrix)
     */
    triggerOnOpponentDraw(drawingPlayerNum, cardsDrawn) {
        const opponentNum = drawingPlayerNum === 1 ? 2 : 1;
        const opponent = this.state.players[opponentNum];

        opponent.field.forEach(card => {
            if (card.abilitiesDisabled) return;
            const ability = card.ability?.toLowerCase() || '';

            // Confusion Matrix - When opponent draws, you draw
            if (ability.includes('when') && ability.includes('opponent') && ability.includes('draws') && ability.includes('you draw')) {
                // Draw without triggering (to prevent infinite loop)
                if (opponent.deck.length > 0) {
                    opponent.hand.push(opponent.deck.shift());
                    this.emitEvent('confusionMatrixTrigger', {
                        player: opponentNum,
                        card,
                        triggeredBy: drawingPlayerNum
                    });
                }
            }
        });
    }

    /**
     * Handle bounce effect (return pupil to hand)
     */
    bounceCard(targetCard, targetPlayerNum) {
        const targetPlayer = this.state.players[targetPlayerNum];
        const cardIndex = targetPlayer.field.findIndex(c => c.instanceId === targetCard.instanceId);
        if (cardIndex === -1) return { success: false, error: 'Card not on field' };

        const card = targetPlayer.field.splice(cardIndex, 1)[0];
        // Reset card state
        card.currentEndurance = card.baseEndurance || card.endurance;
        card.isSpent = false;
        card.hasGettingBearings = true;
        card.counters = { plusOne: 0 };
        card.tempBuffs = [];
        card.dieRollBonus = 0;

        targetPlayer.hand.push(card);
        this.emitEvent('cardBounced', { card, player: targetPlayerNum });
        return { success: true };
    }

    /**
     * Create a token copy of a card
     */
    createTokenCopy(sourceCard, ownerPlayerNum) {
        const player = this.state.players[ownerPlayerNum];
        const token = {
            ...sourceCard,
            instanceId: `token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            currentEndurance: sourceCard.endurance,
            baseEndurance: sourceCard.endurance,
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
        this.recalculateAuras(ownerPlayerNum);
        this.emitEvent('tokenCreated', { player: ownerPlayerNum, token, copiedFrom: sourceCard.name });
        return { success: true, token };
    }

    /**
     * Apply lockdown effect (can't attack or block while source is in play)
     */
    applyLockdown(targetCard, sourceCardInstanceId) {
        targetCard.lockedBy = sourceCardInstanceId;
        targetCard.cannotAttack = true;
        targetCard.cannotBlock = true;
        this.emitEvent('lockdownApplied', { target: targetCard, source: sourceCardInstanceId });
    }

    /**
     * Check and remove lockdown when source card leaves
     */
    checkLockdownRemoval(removedCardInstanceId) {
        // Check all players' fields for locked cards
        [1, 2].forEach(playerNum => {
            const player = this.state.players[playerNum];
            player.field.forEach(card => {
                if (card.lockedBy === removedCardInstanceId) {
                    card.lockedBy = null;
                    card.cannotAttack = false;
                    card.cannotBlock = false;
                    this.emitEvent('lockdownRemoved', { card });
                }
            });
        });
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

            // === BLACK (Bk) AURA EFFECTS ===

            // Backend Principal, Luke (id 139) - -1 to all opponent's attack rolls
            if (ability.includes('-1 to all opponent') && ability.includes('attack')) {
                opponent.field.forEach(card => {
                    if (card.type?.includes('Pupil')) {
                        card.auraDieRollPenalty = (card.auraDieRollPenalty || 0) - 1;
                    }
                });
            }

            // Robotics Professor (id 134) - Tool cards cost (1) less
            if (ability.includes('tool cards cost') && ability.includes('less')) {
                player.toolCostReduction = (player.toolCostReduction || 0) + 1;
            }

            // Robotics Club Captain (id 249) - Your Tools cost (1) less
            if (ability.includes('your tools cost') && ability.includes('less')) {
                player.toolCostReduction = (player.toolCostReduction || 0) + 1;
            }

            // STEM Initiative Director, Mary (id 252) - Interruptions and Tools cost (1) less
            if (ability.includes('interruptions and tools cost') && ability.includes('less')) {
                player.toolCostReduction = (player.toolCostReduction || 0) + 1;
                player.interruptionCostReduction = (player.interruptionCostReduction || 0) + 1;
            }
        });

        // Also reset opponent aura penalties
        opponent.field.forEach(card => {
            card.auraDieRollPenalty = 0;
        });

        // Re-apply opponent debuffs from this player's cards
        player.field.forEach(sourceCard => {
            if (sourceCard.abilitiesDisabled) return;
            const ability = sourceCard.ability?.toLowerCase() || '';

            if (ability.includes('-1 to all opponent') && ability.includes('attack')) {
                opponent.field.forEach(card => {
                    if (card.type?.includes('Pupil')) {
                        card.auraDieRollPenalty = (card.auraDieRollPenalty || 0) - 1;
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

        // === BLACK (Bk) SPEND ABILITIES ===

        // Librarian (id 88) - Draw a card, then discard a card
        if (ability.includes('draw a card') && ability.includes('discard a card') && ability.includes('spend:')) {
            if (player.deck.length > 0) {
                player.hand.push(player.deck.shift());
            }
            this.emitEvent('needDiscard', {
                player: playerNum,
                card: card,
                count: 1,
                reason: 'Librarian'
            });
            return { success: true, needsDiscard: true };
        }

        // The Server Fanatic (id 131) - Spend/Ready target pupil (same as Classic Nerd)
        // Already handled above

        // Electronics Enthusiast (id 125) - Prevent a pupil from entering
        if (ability.includes('prevent') && ability.includes('from entering')) {
            player.preventNextEntry = true;
            this.emitEvent('entryPrevented', { player: playerNum });
            return { success: true };
        }

        // Robotics Professor (id 134) - Ready target Tool
        if (ability.includes('ready target tool')) {
            if (target && target.type === 'Tool') {
                target.isSpent = false;
                this.emitEvent('toolReadied', { card: target });
                return { success: true };
            }
            return { needsTarget: true, targetType: 'friendlyTool', effect: 'readyTool' };
        }

        // Robotics Club Captain (id 249) - Ready target Tool (same as above)

        // Battery (id 142) - Put charge counter OR remove to gain resource
        if (ability.includes('charge counter')) {
            if (ability.includes('put') && ability.includes('on battery')) {
                card.counters = card.counters || {};
                card.counters.charge = (card.counters.charge || 0) + 1;
                this.emitEvent('counterAdded', { card, counterType: 'charge', count: card.counters.charge });
                return { success: true };
            }
            if (ability.includes('remove') && ability.includes('gain resource')) {
                if (card.counters?.charge > 0) {
                    card.counters.charge--;
                    // Need to choose a color
                    this.emitEvent('needColorChoice', {
                        player: playerNum,
                        card: card,
                        effect: 'gainResource'
                    });
                    return { success: true, needsColorChoice: true };
                }
                return { success: false, error: 'No charge counters' };
            }
        }

        // Journal (id 195) - Look at top 3, put 1 in hand, rest on bottom
        if (ability.includes('look at the top') && ability.includes('put one in your hand') && ability.includes('rest on bottom')) {
            const topCards = player.deck.slice(0, 3);
            this.emitEvent('spendChooseFromTop', {
                player: playerNum,
                card: card,
                topCards: topCards,
                choose: 1,
                putRestOnBottom: true
            });
            return { success: true, needsChoice: true };
        }

        // Synthesizer (id 259) - Target +2 die rolls OR draw then discard
        if (ability.includes('+2 to die rolls')) {
            if (target) {
                target.dieRollBonus = (target.dieRollBonus || 0) + 2;
                target.tempBuffs.push({ type: 'dieRollBonus', value: 2, expiresAt: 'endOfTurn' });
                this.emitEvent('dieRollBonusApplied', { card: target, bonus: 2 });
                return { success: true };
            }
            return { needsTarget: true, targetType: 'anyPupil', effect: 'dieRollBonus', amount: 2 };
        }

        // Gene Sequencer (id 261) - Put -1/-1 counter on target
        if (ability.includes('-1/-1 counter')) {
            if (target) {
                target.counters = target.counters || { plusOne: 0 };
                target.counters.minusOne = (target.counters.minusOne || 0) + 1;
                // Apply the stat reduction
                target.currentEndurance = Math.max(1, target.currentEndurance - 1);
                this.emitEvent('counterAdded', { card: target, counterType: 'minusOne' });
                return { success: true };
            }
            return { needsTarget: true, targetType: 'anyPupil', effect: 'minusCounter' };
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
                const isRelentless = att.ability?.toLowerCase().includes('relentless') || card.tempRelentless;
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

        // === ATTACK TRIGGERS ===

        // The Techno (id 124) - When he attacks, other attacking pupils get +1 to die rolls
        this.state.attackers.forEach(att => {
            const ability = att.ability?.toLowerCase() || '';
            if (ability.includes('when') && ability.includes('attacks') && ability.includes('other attacking') && ability.includes('+1')) {
                this.state.attackers.forEach(otherAtt => {
                    if (otherAtt.instanceId !== att.instanceId) {
                        const otherCard = player.field.find(c => c.instanceId === otherAtt.instanceId);
                        if (otherCard) {
                            otherCard.tempBuffs = otherCard.tempBuffs || [];
                            otherCard.tempBuffs.push({ type: 'dieRollBonus', value: 1, expiresAt: 'endOfCombat' });
                            otherCard.dieRollBonus = (otherCard.dieRollBonus || 0) + 1;
                        }
                    }
                });
                this.emitEvent('technoBonus', { card: att });
            }
        });

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

                    // Digital Artist (id 241) - Draw when deals damage
                    if (damageToBlocker > 0 && !attCard.abilitiesDisabled) {
                        const attAbility = attCard.ability?.toLowerCase() || '';
                        if (attAbility.includes('when') && attAbility.includes('deals damage') && attAbility.includes('draw')) {
                            if (attacker.deck.length > 0) {
                                attacker.hand.push(attacker.deck.shift());
                                logEntry.digitalArtistDraw = true;
                            }
                        }
                    }
                }
            } else {
                // Unblocked - deal points
                pointsScored += roll;
                combatLog.push({ attacker: att.name, attackRoll: roll, unblocked: true, points: roll });

                // Digital Artist (id 241) - Draw when deals damage (unblocked damage counts)
                if (!attCard.abilitiesDisabled) {
                    const attAbility = attCard.ability?.toLowerCase() || '';
                    if (attAbility.includes('when') && attAbility.includes('deals damage') && attAbility.includes('draw')) {
                        if (attacker.deck.length > 0) {
                            attacker.hand.push(attacker.deck.shift());
                            combatLog[combatLog.length - 1].digitalArtistDraw = true;
                        }
                    }
                }

                // Unblocked creature abilities - Shop Teacher recovers full HP
                if (attCard.ability?.toLowerCase().includes('if unblocked') && attCard.ability?.toLowerCase().includes('recover')) {
                    attCard.currentEndurance = attCard.baseEndurance || attCard.endurance;
                }
            }
        });

        // Remove dead creatures and trigger exhaust events
        const deadAttackerPupils = [];
        const deadDefenderPupils = [];

        attacker.field = attacker.field.filter(c => {
            if (!c.currentEndurance) return true; // Tools, locations
            if (c.currentEndurance <= 0) {
                // Move to discard
                attacker.discard.push(c);
                if (c.type?.includes('Pupil')) {
                    deadAttackerPupils.push(c);
                }
                return false;
            }
            return true;
        });
        defender.field = defender.field.filter(c => {
            if (!c.currentEndurance) return true;
            if (c.currentEndurance <= 0) {
                defender.discard.push(c);
                if (c.type?.includes('Pupil')) {
                    deadDefenderPupils.push(c);
                }
                return false;
            }
            return true;
        });

        // Trigger exhaust effects for each dead pupil
        deadAttackerPupils.forEach(deadPupil => {
            this.triggerPupilExhausted(deadPupil, attackingPlayer);
        });
        deadDefenderPupils.forEach(deadPupil => {
            this.triggerPupilExhausted(deadPupil, defendingPlayer);
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
        let cardsToDraw = 1;

        // Cinematography Instructor, Luke (id 140) - Draw extra card
        player.field.forEach(card => {
            if (card.abilitiesDisabled) return;
            const ability = card.ability?.toLowerCase() || '';
            if (ability.includes('draw an extra card') && ability.includes('when you would draw')) {
                cardsToDraw++;
            }
        });

        // Draw cards (triggers Confusion Matrix for opponent if applicable)
        this.drawCards(playerNum, cardsToDraw);

        // Ready phase - untap everything (except System Crashed cards)
        player.field.forEach(c => {
            // Check for System Crash effect - skip ready
            if (c.skipNextReady) {
                c.skipNextReady = false;
                // Keep spent
            } else {
                c.isSpent = false;
            }
            c.hasGettingBearings = false;
            c.usedReroll = false;
            c.tempRelentless = false;
        });
        player.resources.forEach(r => r.spent = false);
        player.interruptionPlayed = false;
        player.canReroll = false;

        // Return temporarily controlled Tools
        player.field.forEach(card => {
            if (card.tempControlledBy && card.originalOwner !== playerNum) {
                // Return to original owner
                const originalOwner = this.state.players[card.originalOwner];
                player.field = player.field.filter(c => c.instanceId !== card.instanceId);
                delete card.tempControlledBy;
                delete card.originalOwner;
                originalOwner.field.push(card);
            }
        });

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
