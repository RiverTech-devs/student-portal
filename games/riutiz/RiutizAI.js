// games/riutiz/RiutizAI.js
// AI opponent logic for RIUTIZ

class RiutizAI {
    constructor(game, playerNum = 2) {
        this.game = game;
        this.playerNum = playerNum;
        this.difficulty = 'normal'; // 'easy', 'normal', 'hard'
        this.thinkingDelay = 800;
        this.actionDelay = 1000;
        this.isRunning = false;
    }

    /**
     * Set AI difficulty
     */
    setDifficulty(level) {
        this.difficulty = level;
        this.thinkingDelay = level === 'easy' ? 1200 : level === 'hard' ? 400 : 800;
    }

    /**
     * Execute AI turn
     */
    async takeTurn() {
        if (this.isRunning) return;
        if (this.game.state.currentPlayer !== this.playerNum) return;
        if (this.game.state.gameOver) return;

        this.isRunning = true;

        try {
            await this.delay(this.thinkingDelay);

            // Play a resource
            await this.playResource();
            await this.delay(this.actionDelay);

            // Play creatures/spells
            await this.playCards();
            await this.delay(this.actionDelay);

            // Combat
            await this.doCombat();

            // End turn
            await this.delay(500);
            this.game.endTurn(this.playerNum);

        } catch (error) {
            console.error('AI error:', error);
        }

        this.isRunning = false;
    }

    /**
     * Declare blockers when being attacked
     */
    async declareBlockers() {
        if (this.game.state.combatStep !== 'declare-blockers') return;
        if (this.game.state.currentPlayer === this.playerNum) return; // We're attacking, not defending

        await this.delay(this.thinkingDelay);

        const player = this.game.state.players[this.playerNum];
        const availableBlockers = player.field.filter(c =>
            c.type?.includes('Pupil') && !c.isSpent
        );

        const attackers = [...this.game.state.attackers];

        // Simple blocking strategy: block from weakest to strongest attacker
        const sortedAttackers = attackers.sort((a, b) => {
            const aValue = this.evaluateCardValue(a);
            const bValue = this.evaluateCardValue(b);
            return aValue - bValue;
        });

        for (const attacker of sortedAttackers) {
            if (availableBlockers.length === 0) break;

            // Find a blocker that can survive
            const blocker = this.findBestBlocker(attacker, availableBlockers);
            if (blocker) {
                this.game.toggleBlocker(this.playerNum, blocker.instanceId, attacker.instanceId);
                availableBlockers.splice(availableBlockers.indexOf(blocker), 1);
            }
        }

        await this.delay(this.actionDelay);
    }

    /**
     * Find best blocker for an attacker
     */
    findBestBlocker(attacker, availableBlockers) {
        // Try to find a blocker that can survive
        const survivors = availableBlockers.filter(b => {
            const avgAttackRoll = this.estimateRoll(attacker.dice);
            return b.currentEndurance > avgAttackRoll;
        });

        if (survivors.length > 0) {
            // Pick the one with lowest value that can survive
            return survivors.sort((a, b) => this.evaluateCardValue(a) - this.evaluateCardValue(b))[0];
        }

        // No survivors - trade if attacker is valuable enough
        if (this.evaluateCardValue(attacker) >= 3) {
            return availableBlockers.sort((a, b) => this.evaluateCardValue(a) - this.evaluateCardValue(b))[0];
        }

        // Let it through
        return null;
    }

    /**
     * Play a card as resource
     */
    async playResource() {
        const player = this.game.state.players[this.playerNum];

        if (player.hand.length === 0) return;

        // Prefer non-creature cards as resources
        let resCard = player.hand.find(c => !c.type?.includes('Pupil'));

        // If no non-creatures, use the weakest card
        if (!resCard) {
            const sorted = [...player.hand].sort((a, b) =>
                this.evaluateCardValue(a) - this.evaluateCardValue(b)
            );
            resCard = sorted[0];
        }

        if (resCard) {
            this.game.playCard(this.playerNum, resCard.instanceId, true);
        }
    }

    /**
     * Play cards from hand
     */
    async playCards() {
        const player = this.game.state.players[this.playerNum];

        // Get playable cards sorted by value (best first)
        const playable = this.getPlayableCards();

        for (const card of playable) {
            // Check if still affordable (resources may have been spent)
            if (this.game.canAfford(card, player)) {
                const result = this.game.playCard(this.playerNum, card.instanceId, false);
                if (result.success) {
                    await this.delay(this.actionDelay);
                }
            }
        }
    }

    /**
     * Get list of playable cards sorted by priority
     */
    getPlayableCards() {
        const player = this.game.state.players[this.playerNum];
        const available = player.resources.filter(r => !r.spent);

        const playable = player.hand.filter(card => {
            // Skip interruptions in main phase (play reactively)
            if (card.type === 'Interruption') return false;

            // Check affordability
            const cost = this.game.parseCost(card.cost);
            if (available.length < cost.total) return false;

            for (const [color, count] of Object.entries(cost.colors)) {
                if (available.filter(r => r.color === color).length < count) return false;
            }

            return true;
        });

        // Sort by value
        return playable.sort((a, b) => this.evaluateCardValue(b) - this.evaluateCardValue(a));
    }

    /**
     * Execute combat phase
     */
    async doCombat() {
        const player = this.game.state.players[this.playerNum];

        // Get available attackers
        const attackers = player.field.filter(c =>
            c.type?.includes('Pupil') &&
            !c.hasGettingBearings &&
            !c.isSpent
        );

        if (attackers.length === 0) return;

        // Start combat
        this.game.startCombat(this.playerNum);
        await this.delay(this.actionDelay);

        // Decide which creatures to attack with
        const opponent = this.game.getOpponent(this.playerNum);
        const shouldAttack = this.evaluateAttackDecision(attackers, opponent);

        if (shouldAttack.length === 0) {
            // Skip combat
            this.game.confirmAttackers(this.playerNum);
            return;
        }

        // Declare attackers
        for (const card of shouldAttack) {
            this.game.toggleAttacker(this.playerNum, card.instanceId);
        }

        await this.delay(this.actionDelay);
        this.game.confirmAttackers(this.playerNum);
    }

    /**
     * Decide which creatures should attack
     */
    evaluateAttackDecision(attackers, opponent) {
        const shouldAttack = [];

        // If opponent has no blockers, attack with everything
        const blockers = opponent.field.filter(c => c.type?.includes('Pupil') && !c.isSpent);

        if (blockers.length === 0) {
            return attackers;
        }

        // Evaluate each attacker
        for (const att of attackers) {
            const isRelentless = att.ability?.toLowerCase().includes('relentless');
            const hasOverwhelm = att.ability?.toLowerCase().includes('overwhelm');

            // Relentless creatures always attack
            if (isRelentless) {
                shouldAttack.push(att);
                continue;
            }

            // Overwhelm creatures are valuable attackers
            if (hasOverwhelm) {
                shouldAttack.push(att);
                continue;
            }

            // Check if likely to get through or trade favorably
            const worstBlocker = blockers.sort((a, b) =>
                this.evaluateCardValue(a) - this.evaluateCardValue(b)
            )[0];

            if (!worstBlocker || this.evaluateCardValue(att) <= this.evaluateCardValue(worstBlocker)) {
                // Favorable or even trade
                if (this.difficulty !== 'easy' || Math.random() > 0.5) {
                    shouldAttack.push(att);
                }
            }
        }

        return shouldAttack;
    }

    /**
     * Evaluate a card's value for decision making
     */
    evaluateCardValue(card) {
        let value = 0;

        // Base value from cost
        const cost = this.game.parseCost(card.cost);
        value += cost.total;

        // Creature stats
        if (card.type?.includes('Pupil')) {
            value += (card.currentEndurance || card.endurance) / 2;
            value += card.ad / 2;
        }

        // Keywords
        const ability = card.ability?.toLowerCase() || '';
        if (ability.includes('relentless')) value += 1;
        if (ability.includes('overwhelm')) value += 1;
        if (ability.includes('impulsive')) value += 0.5;
        if (ability.includes('draw')) value += 1;

        return value;
    }

    /**
     * Estimate average dice roll
     */
    estimateRoll(diceStr) {
        if (!diceStr) return 0;
        const match = diceStr.match(/(\d*)d(\d+)/);
        if (!match) return 0;
        const sides = parseInt(match[2]);
        return (sides + 1) / 2; // Average roll
    }

    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export
window.RiutizAI = RiutizAI;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RiutizAI };
}
