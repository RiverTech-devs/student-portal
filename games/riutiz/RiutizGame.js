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
            hasGettingBearings: true,
            isSpent: false
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
            player.field.push({
                ...card,
                hasGettingBearings: !hasImpulsive,
                isSpent: false
            });
        } else if (card.type === 'Interruption') {
            player.discard.push(card);
            player.interruptionPlayed = true;
            this.resolveInterruption(playerNum, card);
        } else {
            // Tool or Location
            player.field.push({ ...card, isSpent: false, hasGettingBearings: false });
        }

        this.emitEvent('cardPlayed', { player: playerNum, card });
        return { success: true, action: 'play', card };
    }

    /**
     * Resolve interruption effects (simplified)
     */
    resolveInterruption(playerNum, card) {
        const ability = card.ability?.toLowerCase() || '';
        const player = this.state.players[playerNum];

        if (ability.includes('draw')) {
            const match = ability.match(/draw (\d+)/);
            const numCards = match ? parseInt(match[1]) : 1;
            for (let i = 0; i < numCards && player.deck.length > 0; i++) {
                player.hand.push(player.deck.shift());
            }
        }

        // More ability effects can be added here
    }

    /**
     * Activate a card's spend ability
     */
    activateAbility(playerNum, instanceId) {
        const player = this.state.players[playerNum];
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

        card.isSpent = true;

        this.emitEvent('abilityActivated', { player: playerNum, card });
        return { success: true, card };
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
        const blocker = defender.field.find(c => c.instanceId === blockerInstanceId);

        if (!blocker) {
            return { success: false, error: 'Blocker not found' };
        }

        if (!blocker.type?.includes('Pupil')) {
            return { success: false, error: 'Only pupils can block' };
        }

        if (blocker.isSpent) {
            return { success: false, error: 'Blocker is spent' };
        }

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
        const combatLog = [];

        this.state.attackers.forEach(att => {
            const roll = this.rollDice(att.dice);
            const blockerId = this.state.blockers[att.instanceId];

            if (blockerId) {
                const blocker = defender.field.find(c => c.instanceId === blockerId);
                if (blocker) {
                    const blockerRoll = this.rollDice(blocker.dice);

                    combatLog.push({
                        attacker: att.name,
                        attackRoll: roll,
                        blocker: blocker.name,
                        blockerRoll: blockerRoll
                    });

                    // Apply damage
                    blocker.currentEndurance -= roll;
                    const attCard = attacker.field.find(c => c.instanceId === att.instanceId);
                    if (attCard) attCard.currentEndurance -= blockerRoll;

                    // Check overwhelm
                    if (att.ability?.toLowerCase().includes('overwhelm') && blocker.currentEndurance <= 0) {
                        const excess = Math.abs(blocker.currentEndurance);
                        if (excess > 0) {
                            pointsScored += excess;
                            combatLog[combatLog.length - 1].overwhelm = excess;
                        }
                    }
                }
            } else {
                // Unblocked - deal points
                pointsScored += roll;
                combatLog.push({ attacker: att.name, attackRoll: roll, unblocked: true, points: roll });
            }
        });

        // Remove dead creatures
        attacker.field = attacker.field.filter(c => !c.currentEndurance || c.currentEndurance > 0);
        defender.field = defender.field.filter(c => !c.currentEndurance || c.currentEndurance > 0);

        // Award points
        attacker.points += pointsScored;

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

        this.emitEvent('combatResolved', { pointsScored, combatLog });
        return { success: true, pointsScored, combatLog };
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

        // Draw phase
        if (player.deck.length > 0) {
            player.hand.push(player.deck.shift());
        }

        // Ready phase - untap everything
        player.field.forEach(c => {
            c.isSpent = false;
            c.hasGettingBearings = false;
        });
        player.resources.forEach(r => r.spent = false);
        player.interruptionPlayed = false;

        this.state.phase = 'main';

        this.emitEvent('turnStarted', { player: playerNum, handSize: player.hand.length });
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
