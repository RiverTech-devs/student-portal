// games/riutiz/RiutizUI.js
// UI rendering for RIUTIZ card game

class RiutizUI {
    constructor(game, options = {}) {
        this.game = game;
        this.localPlayer = options.localPlayer || 1; // Which player we're viewing as
        this.onCardClick = options.onCardClick || (() => {});
        this.onCardLongPress = options.onCardLongPress || (() => {});

        this.longPressTimer = null;
        this.didLongPress = false;
        this.selectedCard = null;
        this.selectedFieldCard = null;

        // Element references
        this.elements = {};
    }

    /**
     * Initialize UI with DOM element references
     */
    init(elementIds) {
        const ids = {
            gameScreen: 'game-screen',
            menuScreen: 'menu-screen',
            victoryScreen: 'victory-screen',
            previewOverlay: 'preview-overlay',
            oppPoints: 'opp-points',
            yourPoints: 'your-points',
            oppHandCount: 'opp-hand-count',
            oppDeckCount: 'opp-deck-count',
            yourHandCount: 'your-hand-count',
            yourDeckCount: 'your-deck-count',
            turnNumber: 'turn-number',
            turnIndicator: 'turn-indicator',
            fieldHint: 'field-hint',
            oppResources: 'opp-resources',
            oppField: 'opp-field',
            yourResources: 'your-resources',
            yourField: 'your-field',
            yourHand: 'your-hand',
            actionButtons: 'action-buttons',
            message: 'message',
            winnerText: 'winner-text',
            finalScore: 'final-score',
            ...elementIds
        };

        for (const [key, id] of Object.entries(ids)) {
            this.elements[key] = document.getElementById(id);
        }
    }

    /**
     * Get color data
     */
    getColor(colorCode) {
        return RiutizGame.COLORS[colorCode] || RiutizGame.COLORS.C;
    }

    /**
     * Render full game state
     */
    render() {
        const state = this.game.state;
        if (!state) return;

        const isYourTurn = state.currentPlayer === this.localPlayer;
        const you = state.players[this.localPlayer];
        const opp = state.players[this.localPlayer === 1 ? 2 : 1];

        // Update points
        this.elements.oppPoints.textContent = opp.points + ' pts';
        this.elements.yourPoints.textContent = you.points + ' pts';

        // Update deck/hand counts
        this.elements.oppHandCount.textContent = opp.hand.length;
        this.elements.oppDeckCount.textContent = opp.deck.length;
        this.elements.yourHandCount.textContent = you.hand.length;
        this.elements.yourDeckCount.textContent = you.deck.length;

        // Turn number
        this.elements.turnNumber.textContent = state.turn;

        // Phase indicator
        document.querySelectorAll('.phase').forEach(el => {
            el.classList.toggle('active', el.dataset.phase === state.phase);
        });

        // Turn indicator
        this.elements.turnIndicator.textContent = isYourTurn ? 'Your Turn' : "Opponent's Turn";
        this.elements.turnIndicator.className = 'turn-indicator ' + (isYourTurn ? 'your-turn' : 'opp-turn');

        // Field hint
        this.elements.fieldHint.textContent =
            state.combatStep === 'declare-attackers' && isYourTurn ? '(Tap to attack!)' : '';

        // Render resources
        this.renderResources(this.elements.oppResources, opp.resources);
        this.renderResources(this.elements.yourResources, you.resources, true);

        // Render fields
        this.renderField(this.elements.oppField, opp.field, false);
        this.renderField(this.elements.yourField, you.field, true);

        // Render hand
        this.renderHand(this.elements.yourHand, you.hand);

        // Render action buttons
        this.renderActionButtons();
    }

    /**
     * Render resources
     */
    renderResources(container, resources, isYours = false) {
        container.innerHTML = '';

        if (resources.length === 0) {
            if (isYours) {
                container.innerHTML = '<div style="color: #52525b; font-size: 0.875rem;">Play cards as resources</div>';
            }
            return;
        }

        resources.forEach(res => {
            const c = this.getColor(res.color);
            const div = document.createElement('div');
            div.className = 'resource-token' + (res.spent ? ' spent' : '');
            div.style.cssText = `background: radial-gradient(circle at 30% 30%, ${c.hex}, ${c.bg}); border: 2px solid ${c.hex}; ${res.spent ? '' : `box-shadow: 0 0 10px ${c.hex}60;`}`;
            div.textContent = res.color;
            container.appendChild(div);
        });
    }

    /**
     * Render field
     */
    renderField(container, field, isYours) {
        const state = this.game.state;
        container.innerHTML = '';

        if (field.length === 0) {
            container.innerHTML = `<div class="empty">${isYours ? 'No pupils - play some from your hand!' : 'No pupils'}</div>`;
            return;
        }

        field.forEach(card => {
            const isPupil = card.type?.includes('Pupil');
            const isYourTurn = state.currentPlayer === this.localPlayer;

            // Determine card state
            const isAttacker = state.attackers.find(a => a.instanceId === card.instanceId);
            const isBlocker = Object.values(state.blockers).includes(card.instanceId);

            let targetable = false;
            if (isYours && state.combatStep === 'declare-attackers' && isYourTurn) {
                targetable = isPupil && !card.hasGettingBearings && !card.isSpent;
            } else if (isYours && state.combatStep === 'declare-blockers' && !isYourTurn) {
                targetable = isPupil && !card.isSpent;
            } else if (!isYours && state.combatStep === 'declare-blockers' && isYourTurn) {
                // Opponent's blockers can be clicked to assign
                targetable = isPupil && !card.isSpent;
            }

            const isSelected = this.selectedFieldCard?.instanceId === card.instanceId;

            const el = this.renderCard(card, {
                small: true,
                selected: isSelected,
                attacker: isAttacker,
                blocker: isBlocker,
                targetable: targetable,
                spent: card.isSpent,
                onClick: () => this.handleFieldCardClick(card, isYours)
            });

            container.appendChild(el);
        });
    }

    /**
     * Render hand
     */
    renderHand(container, hand) {
        container.innerHTML = '';

        hand.forEach(card => {
            const wrapper = document.createElement('div');
            const isSelected = this.selectedCard?.instanceId === card.instanceId;

            const el = this.renderCard(card, {
                inHand: true,
                selected: isSelected,
                onClick: () => this.handleHandCardClick(card)
            });

            wrapper.appendChild(el);
            container.appendChild(wrapper);
        });
    }

    /**
     * Render a single card
     */
    renderCard(card, options = {}) {
        const { small, inHand, selected, attacker, blocker, targetable, spent, onClick } = options;
        const color = this.game.getPrimaryColor(card.cost);
        const c = this.getColor(color);
        const isPupil = card.type?.includes('Pupil');
        const hasSpendAbility = card.ability?.toLowerCase().includes('spend:');

        let classes = 'card';
        if (small) classes += ' small';
        else if (inHand) classes += ' in-hand';
        if (selected) classes += ' selected';
        if (attacker) classes += ' attacker';
        if (blocker) classes += ' blocker';
        if (targetable) classes += ' targetable';
        if (spent) classes += ' spent';

        // Build cost HTML
        const cost = this.game.parseCost(card.cost);
        let costHtml = '';
        if (cost.generic > 0) {
            costHtml += `<div class="mana-pip generic">${cost.generic}</div>`;
        }
        for (const [col, count] of Object.entries(cost.colors)) {
            for (let i = 0; i < count; i++) {
                const colData = this.getColor(col);
                costHtml += `<div class="mana-pip" style="background: ${colData.hex}">${col}</div>`;
            }
        }

        const icon = isPupil ? '👤' : card.type === 'Interruption' ? '⚡' : card.type === 'Tool' ? '🔧' : '🏛️';

        let indicatorHtml = '';
        if (card.hasGettingBearings && isPupil) {
            indicatorHtml = '<div class="card-indicator indicator-bearings">💫</div>';
        } else if (hasSpendAbility && !card.isSpent) {
            indicatorHtml = '<div class="card-indicator indicator-activate">⚡</div>';
        }

        const div = document.createElement('div');
        div.className = classes;
        div.style.cssText = `background: linear-gradient(135deg, ${c.bg} 0%, #0a0a0a 100%); border: 2px solid ${c.hex}; box-shadow: 0 0 10px ${c.hex}40;`;

        div.innerHTML = `
            ${indicatorHtml}
            <div class="card-inner">
                <div class="card-header">
                    <div class="card-name" style="color: ${c.hex}">${card.name}</div>
                    <div class="card-cost">${costHtml}</div>
                </div>
                <div class="card-type">${card.type}${card.subTypes ? ' — ' + card.subTypes : ''}</div>
                <div class="card-art" style="background: linear-gradient(180deg, ${c.hex}20 0%, ${c.bg} 100%); border: 1px solid ${c.hex}40;">${icon}</div>
                ${isPupil ? `<div class="card-stats"><span class="stat-dice">🎲 ${card.dice}</span><span class="stat-hp">❤️ ${card.currentEndurance ?? card.endurance}</span></div>` : ''}
                ${card.ability ? `<div class="card-ability">${card.ability}</div>` : ''}
            </div>
            <div class="card-rarity ${card.rarity || 'C'}"></div>
        `;

        // Long press handlers
        const handlePressStart = () => {
            this.didLongPress = false;
            this.longPressTimer = setTimeout(() => {
                this.didLongPress = true;
                this.showPreview(card);
            }, 400);
        };

        const handlePressEnd = () => {
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
            this.hidePreview();
        };

        div.addEventListener('touchstart', handlePressStart, { passive: true });
        div.addEventListener('touchend', handlePressEnd);
        div.addEventListener('touchcancel', handlePressEnd);
        div.addEventListener('mousedown', handlePressStart);
        div.addEventListener('mouseup', handlePressEnd);
        div.addEventListener('mouseleave', handlePressEnd);
        div.addEventListener('contextmenu', (e) => e.preventDefault());

        div.addEventListener('click', () => {
            if (!this.didLongPress && onClick) onClick();
            this.didLongPress = false;
        });

        return div;
    }

    /**
     * Show card preview overlay
     */
    showPreview(card) {
        const color = this.game.getPrimaryColor(card.cost);
        const c = this.getColor(color);
        const isPupil = card.type?.includes('Pupil');
        const cost = this.game.parseCost(card.cost);

        let costHtml = '';
        if (cost.generic > 0) {
            costHtml += `<div class="mana-pip generic">${cost.generic}</div>`;
        }
        for (const [col, count] of Object.entries(cost.colors)) {
            for (let i = 0; i < count; i++) {
                const colData = this.getColor(col);
                costHtml += `<div class="mana-pip" style="background: ${colData.hex}">${col}</div>`;
            }
        }

        const icon = isPupil ? '👤' : card.type === 'Interruption' ? '⚡' : card.type === 'Tool' ? '🔧' : '🏛️';
        const rarityText = card.rarity === 'R' ? '★ Rare' : card.rarity === 'U' ? '◆ Uncommon' : '○ Common';

        this.elements.previewOverlay.innerHTML = `
            <div class="preview-card" style="background: linear-gradient(135deg, ${c.bg} 0%, #0a0a0a 100%); box-shadow: 0 0 60px ${c.hex}60; border: 3px solid ${c.hex};">
                <div class="preview-header">
                    <div class="preview-name-row">
                        <div class="preview-name" style="color: ${c.hex}">${card.name}</div>
                        <div class="preview-cost">${costHtml}</div>
                    </div>
                    <div class="preview-type">${card.type}${card.subTypes ? ' — ' + card.subTypes : ''}</div>
                </div>
                <div class="preview-art" style="background: linear-gradient(180deg, ${c.hex}30 0%, ${c.bg} 100%); border: 1px solid ${c.hex}50;">${icon}</div>
                ${isPupil ? `<div class="preview-stats"><span style="color: #fbbf24">🎲 ${card.dice}</span><span style="color: #3b82f6">⚔️ AD: ${card.ad}</span><span style="color: #ef4444">❤️ ${card.currentEndurance ?? card.endurance}</span></div>` : ''}
                <div class="preview-ability">
                    ${card.ability ? `<p>${card.ability}</p>` : '<p class="no-ability">No ability text.</p>'}
                </div>
                ${card.resourceAbility ? `<div class="preview-resource"><p><span>Resource:</span> ${card.resourceAbility}</p></div>` : ''}
                <div class="preview-footer">
                    <span class="preview-rarity">${rarityText}</span>
                    <div class="card-rarity ${card.rarity || 'C'}" style="width: 1rem; height: 1rem;"></div>
                </div>
                <div class="preview-hint">Release to close</div>
            </div>
        `;
        this.elements.previewOverlay.classList.remove('hidden');

        this.onCardLongPress(card);
    }

    /**
     * Hide card preview
     */
    hidePreview() {
        this.elements.previewOverlay.classList.add('hidden');
    }

    /**
     * Handle hand card click
     */
    handleHandCardClick(card) {
        const state = this.game.state;
        const isYourTurn = state.currentPlayer === this.localPlayer;

        if (!isYourTurn || state.phase !== 'main') return;

        if (this.selectedCard?.instanceId === card.instanceId) {
            this.selectedCard = null;
        } else {
            this.selectedCard = card;
            this.selectedFieldCard = null;
        }

        this.render();
        this.onCardClick(card, 'hand');
    }

    /**
     * Handle field card click
     */
    handleFieldCardClick(card, isYours) {
        const state = this.game.state;
        const isYourTurn = state.currentPlayer === this.localPlayer;

        // Combat actions
        if (state.combatStep === 'declare-attackers' && isYours && isYourTurn) {
            if (card.type?.includes('Pupil')) {
                this.game.toggleAttacker(this.localPlayer, card.instanceId);
                this.render();
            }
            return;
        }

        if (state.combatStep === 'declare-blockers') {
            const isPupil = card.type?.includes('Pupil');
            if (!isPupil || card.isSpent) return;

            // Find first unblocked attacker
            const unblockedAttacker = state.attackers.find(a => !state.blockers[a.instanceId]);
            if (unblockedAttacker) {
                const defenderNum = isYourTurn ? (this.localPlayer === 1 ? 2 : 1) : this.localPlayer;
                this.game.toggleBlocker(defenderNum, card.instanceId, unblockedAttacker.instanceId);
                this.render();
            }
            return;
        }

        // Main phase field card selection
        if (state.phase === 'main' && isYourTurn && isYours && !state.combatStep) {
            if (this.selectedFieldCard?.instanceId === card.instanceId) {
                this.selectedFieldCard = null;
            } else {
                this.selectedFieldCard = card;
                this.selectedCard = null;

                const hasSpend = card.ability?.toLowerCase().includes('spend:');
                if (hasSpend && !card.isSpent) {
                    this.setMessage(card.name + ': ' + card.ability);
                } else if (card.isSpent) {
                    this.setMessage(card.name + ' is Spent - will ready next turn.');
                } else {
                    this.setMessage(card.name + ': ' + (card.ability || 'No activated ability.'));
                }
            }
            this.render();
        }

        this.onCardClick(card, 'field');
    }

    /**
     * Render action buttons
     */
    renderActionButtons() {
        const state = this.game.state;
        const isYourTurn = state.currentPlayer === this.localPlayer;
        const btns = this.elements.actionButtons;
        btns.innerHTML = '';

        // Field card activation
        if (this.selectedFieldCard && state.phase === 'main' && isYourTurn && !state.combatStep) {
            const hasSpend = this.selectedFieldCard.ability?.toLowerCase().includes('spend:');
            if (hasSpend && !this.selectedFieldCard.isSpent) {
                btns.appendChild(this.createButton('⚡ Activate', 'btn-purple', () => {
                    this.game.activateAbility(this.localPlayer, this.selectedFieldCard.instanceId);
                    this.selectedFieldCard = null;
                    this.render();
                }));
            }
            btns.appendChild(this.createButton('✕ Cancel', 'btn-secondary', () => {
                this.selectedFieldCard = null;
                this.render();
            }));
            return;
        }

        // Hand card actions
        if (this.selectedCard && state.phase === 'main' && isYourTurn && !this.selectedFieldCard) {
            btns.appendChild(this.createButton('🔋 Resource', 'btn-secondary', () => {
                this.game.playCard(this.localPlayer, this.selectedCard.instanceId, true);
                this.selectedCard = null;
                this.render();
            }));

            const canPay = this.game.canAfford(this.selectedCard, state.players[this.localPlayer]);
            const playBtn = this.createButton('▶️ Play', canPay ? 'btn-success' : 'btn-secondary', () => {
                const result = this.game.playCard(this.localPlayer, this.selectedCard.instanceId, false);
                if (!result.success) {
                    this.setMessage(result.error);
                }
                this.selectedCard = null;
                this.render();
            });
            if (!canPay) playBtn.style.opacity = '0.5';
            btns.appendChild(playBtn);
            return;
        }

        // Combat button
        if (state.phase === 'main' && isYourTurn && !this.selectedCard && !this.selectedFieldCard) {
            btns.appendChild(this.createButton('⚔️ Combat', 'btn-danger', () => {
                this.game.startCombat(this.localPlayer);
                this.render();
            }));
        }

        // Declare attackers
        if (state.combatStep === 'declare-attackers' && isYourTurn) {
            btns.appendChild(this.createButton('Skip', 'btn-secondary', () => {
                this.game.confirmAttackers(this.localPlayer);
                this.render();
            }));

            const confirmBtn = this.createButton(`✓ Attack! (${state.attackers.length})`, 'btn-danger');
            confirmBtn.style.animation = 'pulse 1s infinite';
            confirmBtn.onclick = () => {
                this.game.confirmAttackers(this.localPlayer);
                this.render();
            };
            btns.appendChild(confirmBtn);
        }

        // Declare blockers
        if (state.combatStep === 'declare-blockers') {
            const doneBtn = this.createButton('✓ Done Blocking', 'btn-primary');
            doneBtn.style.animation = 'pulse 1s infinite';
            doneBtn.onclick = () => {
                this.game.confirmBlockers();
                this.render();
            };
            btns.appendChild(doneBtn);
        }

        // End turn
        if ((state.phase === 'main' || state.phase === 'end') && isYourTurn && !state.combatStep && !this.selectedFieldCard) {
            btns.appendChild(this.createButton('End Turn →', 'btn-warning', () => {
                this.game.endTurn(this.localPlayer);
                this.render();
            }));
        }
    }

    /**
     * Create a button element
     */
    createButton(text, className, onClick) {
        const btn = document.createElement('button');
        btn.className = 'btn ' + className;
        btn.textContent = text;
        if (onClick) btn.onclick = onClick;
        return btn;
    }

    /**
     * Set message bar text
     */
    setMessage(msg) {
        this.elements.message.textContent = msg;
    }

    /**
     * Show game screen
     */
    showGameScreen() {
        this.elements.menuScreen?.classList.add('hidden');
        this.elements.gameScreen?.classList.remove('hidden');
        this.elements.victoryScreen?.classList.add('hidden');
    }

    /**
     * Show menu screen
     */
    showMenuScreen() {
        this.elements.menuScreen?.classList.remove('hidden');
        this.elements.gameScreen?.classList.add('hidden');
        this.elements.victoryScreen?.classList.add('hidden');
    }

    /**
     * Show victory screen
     */
    showVictoryScreen(winner, p1Points, p2Points) {
        this.elements.menuScreen?.classList.add('hidden');
        this.elements.gameScreen?.classList.add('hidden');
        this.elements.victoryScreen?.classList.remove('hidden');

        const localWon = winner === this.localPlayer;
        this.elements.winnerText.textContent = localWon ? 'You Win!' : 'Opponent Wins!';
        this.elements.finalScore.textContent = `Final Score: ${p1Points} - ${p2Points}`;
    }
}

// Export
window.RiutizUI = RiutizUI;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RiutizUI };
}
