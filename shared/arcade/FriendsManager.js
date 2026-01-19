// shared/arcade/FriendsManager.js
// Friends system for arcade - add friends, see status, send battle invites

class FriendsManager {
    constructor(arcade) {
        this.arcade = arcade;
        this.firebase = arcade?.firebase;
        this.friends = {};
        this.friendRequests = { incoming: {}, outgoing: {} };
        this.invites = {};
        this._listeners = [];
        this._inviteListeners = [];
        this._unsubscribers = [];
    }

    /**
     * Initialize friends system and set up listeners
     */
    async initialize() {
        if (!this.firebase?.isAuthenticated) {
            console.warn('FriendsManager: Not authenticated');
            return;
        }

        await this._loadFriends();
        await this._loadFriendRequests();
        this._setupRealtimeListeners();
        this._setupInviteListener();

        console.log('FriendsManager initialized');
    }

    /**
     * Get current user's Supabase ID
     */
    get myId() {
        return this.firebase?.supabaseUserId;
    }

    // ==========================================
    // Friend Management
    // ==========================================

    /**
     * Send a friend request to another player
     * @param {string} targetUserId - Supabase user ID to send request to
     */
    async sendFriendRequest(targetUserId) {
        if (!this.myId || targetUserId === this.myId) return { success: false, error: 'Invalid request' };

        // Check if already friends
        if (this.friends[targetUserId]) {
            return { success: false, error: 'Already friends' };
        }

        // Check if request already sent
        if (this.friendRequests.outgoing[targetUserId]) {
            return { success: false, error: 'Request already sent' };
        }

        // Check if they already sent us a request - auto-accept
        if (this.friendRequests.incoming[targetUserId]) {
            return await this.acceptFriendRequest(targetUserId);
        }

        try {
            const requestData = {
                from_id: this.myId,
                from_name: this.arcade.player?.display_name || 'Player',
                sent_at: this.firebase.serverTimestamp,
                status: 'pending'
            };

            // Add to target's incoming requests
            await this.firebase.ref(`arcade/friends/${targetUserId}/requests/incoming/${this.myId}`).set(requestData);

            // Add to my outgoing requests
            await this.firebase.ref(`arcade/friends/${this.myId}/requests/outgoing/${targetUserId}`).set({
                to_id: targetUserId,
                sent_at: this.firebase.serverTimestamp,
                status: 'pending'
            });

            this.friendRequests.outgoing[targetUserId] = requestData;
            this._notifyListeners();

            return { success: true };
        } catch (error) {
            console.error('Error sending friend request:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Accept a friend request
     * @param {string} fromUserId - User ID who sent the request
     */
    async acceptFriendRequest(fromUserId) {
        if (!this.myId) return { success: false, error: 'Not authenticated' };

        try {
            const timestamp = this.firebase.serverTimestamp;

            // Add to both users' friend lists
            const myFriendData = {
                user_id: fromUserId,
                added_at: timestamp,
                display_name: this.friendRequests.incoming[fromUserId]?.from_name || 'Player'
            };

            const theirFriendData = {
                user_id: this.myId,
                added_at: timestamp,
                display_name: this.arcade.player?.display_name || 'Player'
            };

            // Batch updates
            const updates = {};
            updates[`arcade/friends/${this.myId}/list/${fromUserId}`] = myFriendData;
            updates[`arcade/friends/${fromUserId}/list/${this.myId}`] = theirFriendData;
            updates[`arcade/friends/${this.myId}/requests/incoming/${fromUserId}`] = null;
            updates[`arcade/friends/${fromUserId}/requests/outgoing/${this.myId}`] = null;

            await this.firebase.ref().update(updates);

            // Update local state
            this.friends[fromUserId] = myFriendData;
            delete this.friendRequests.incoming[fromUserId];
            this._notifyListeners();

            return { success: true };
        } catch (error) {
            console.error('Error accepting friend request:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Decline a friend request
     * @param {string} fromUserId - User ID who sent the request
     */
    async declineFriendRequest(fromUserId) {
        if (!this.myId) return { success: false, error: 'Not authenticated' };

        try {
            const updates = {};
            updates[`arcade/friends/${this.myId}/requests/incoming/${fromUserId}`] = null;
            updates[`arcade/friends/${fromUserId}/requests/outgoing/${this.myId}`] = null;

            await this.firebase.ref().update(updates);

            delete this.friendRequests.incoming[fromUserId];
            this._notifyListeners();

            return { success: true };
        } catch (error) {
            console.error('Error declining friend request:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Remove a friend
     * @param {string} friendId - Friend's user ID
     */
    async removeFriend(friendId) {
        if (!this.myId) return { success: false, error: 'Not authenticated' };

        try {
            const updates = {};
            updates[`arcade/friends/${this.myId}/list/${friendId}`] = null;
            updates[`arcade/friends/${friendId}/list/${this.myId}`] = null;

            await this.firebase.ref().update(updates);

            delete this.friends[friendId];
            this._notifyListeners();

            return { success: true };
        } catch (error) {
            console.error('Error removing friend:', error);
            return { success: false, error: error.message };
        }
    }

    // ==========================================
    // Friend Status
    // ==========================================

    /**
     * Get friend list with current status
     * @returns {Array} Friends with status info
     */
    async getFriendsWithStatus() {
        const friendsList = [];

        for (const [friendId, friendData] of Object.entries(this.friends)) {
            try {
                // Get friend's player data for status
                const playerSnapshot = await this.firebase.ref(`arcade/players/${friendId}`).once('value');
                const playerData = playerSnapshot.val() || {};

                friendsList.push({
                    id: friendId,
                    display_name: playerData.display_name || friendData.display_name || 'Player',
                    status: playerData.status || 'offline',
                    current_match: playerData.current_match || null,
                    current_game: playerData.current_game || null,
                    last_seen: playerData.last_seen || friendData.added_at,
                    added_at: friendData.added_at
                });
            } catch (error) {
                console.error(`Error getting status for friend ${friendId}:`, error);
            }
        }

        // Sort: online first, then in_game, then by name
        return friendsList.sort((a, b) => {
            const statusOrder = { 'online': 0, 'in_game': 1, 'offline': 2 };
            const aOrder = statusOrder[a.status] ?? 2;
            const bOrder = statusOrder[b.status] ?? 2;
            if (aOrder !== bOrder) return aOrder - bOrder;
            return (a.display_name || '').localeCompare(b.display_name || '');
        });
    }

    /**
     * Check if a user is a friend
     * @param {string} userId - User ID to check
     */
    isFriend(userId) {
        return !!this.friends[userId];
    }

    // ==========================================
    // Battle Invites
    // ==========================================

    /**
     * Send a battle invite to a friend
     * @param {string} friendId - Friend's user ID
     * @param {string} gameId - Game to play (e.g., 'riutiz')
     * @param {Object} options - Additional options like lobby_id
     */
    async sendBattleInvite(friendId, gameId, options = {}) {
        if (!this.myId || !this.isFriend(friendId)) {
            return { success: false, error: 'Not a friend' };
        }

        try {
            const inviteId = this.firebase.generateId();
            const inviteData = {
                id: inviteId,
                from_id: this.myId,
                from_name: this.arcade.player?.display_name || 'Player',
                game_id: gameId,
                lobby_id: options.lobby_id || null,
                message: options.message || null,
                sent_at: this.firebase.serverTimestamp,
                status: 'pending',
                expires_at: Date.now() + (5 * 60 * 1000) // 5 minute expiry
            };

            await this.firebase.ref(`arcade/friends/${friendId}/invites/${inviteId}`).set(inviteData);

            return { success: true, inviteId };
        } catch (error) {
            console.error('Error sending battle invite:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Accept a battle invite
     * @param {string} inviteId - Invite ID
     */
    async acceptBattleInvite(inviteId) {
        const invite = this.invites[inviteId];
        if (!invite) return { success: false, error: 'Invite not found' };

        try {
            // Mark as accepted
            await this.firebase.ref(`arcade/friends/${this.myId}/invites/${inviteId}`).update({
                status: 'accepted'
            });

            // Remove invite after short delay
            setTimeout(() => {
                this.firebase.ref(`arcade/friends/${this.myId}/invites/${inviteId}`).remove();
            }, 1000);

            delete this.invites[inviteId];
            this._notifyInviteListeners();

            return {
                success: true,
                gameId: invite.game_id,
                lobbyId: invite.lobby_id,
                fromId: invite.from_id
            };
        } catch (error) {
            console.error('Error accepting invite:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Decline a battle invite
     * @param {string} inviteId - Invite ID
     */
    async declineBattleInvite(inviteId) {
        try {
            await this.firebase.ref(`arcade/friends/${this.myId}/invites/${inviteId}`).remove();
            delete this.invites[inviteId];
            this._notifyInviteListeners();
            return { success: true };
        } catch (error) {
            console.error('Error declining invite:', error);
            return { success: false, error: error.message };
        }
    }

    // ==========================================
    // Search Players
    // ==========================================

    /**
     * Search for players by display name
     * @param {string} query - Search query
     * @returns {Array} Matching players
     */
    async searchPlayers(query) {
        if (!query || query.length < 2) return [];

        try {
            // Search in players collection
            const snapshot = await this.firebase.ref('arcade/players')
                .orderByChild('display_name')
                .startAt(query)
                .endAt(query + '\uf8ff')
                .limitToFirst(20)
                .once('value');

            const results = [];
            snapshot.forEach(child => {
                const player = child.val();
                if (child.key !== this.myId) {
                    results.push({
                        id: child.key,
                        display_name: player.display_name || 'Player',
                        status: player.status || 'offline',
                        isFriend: this.isFriend(child.key),
                        hasPendingRequest: !!this.friendRequests.outgoing[child.key]
                    });
                }
            });

            return results;
        } catch (error) {
            console.error('Error searching players:', error);
            return [];
        }
    }

    // ==========================================
    // Spectating
    // ==========================================

    /**
     * Get a friend's current match for spectating
     * @param {string} friendId - Friend's user ID
     */
    async getFriendMatch(friendId) {
        if (!this.isFriend(friendId)) return null;

        try {
            const playerSnapshot = await this.firebase.ref(`arcade/players/${friendId}`).once('value');
            const playerData = playerSnapshot.val();

            if (playerData?.current_match && playerData?.current_game) {
                return {
                    matchId: playerData.current_match,
                    gameId: playerData.current_game
                };
            }
            return null;
        } catch (error) {
            console.error('Error getting friend match:', error);
            return null;
        }
    }

    /**
     * Join as spectator to a match
     * @param {string} gameId - Game ID
     * @param {string} matchId - Match ID
     */
    async joinAsSpectator(gameId, matchId) {
        if (!this.myId) return { success: false };

        try {
            await this.firebase.ref(`arcade/spectating/${matchId}/spectators/${this.myId}`).set({
                user_id: this.myId,
                display_name: this.arcade.player?.display_name || 'Spectator',
                joined_at: this.firebase.serverTimestamp
            });

            // Set up disconnect handler
            this.firebase.ref(`arcade/spectating/${matchId}/spectators/${this.myId}`)
                .onDisconnect().remove();

            return { success: true };
        } catch (error) {
            console.error('Error joining as spectator:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Leave spectator mode
     * @param {string} matchId - Match ID
     */
    async leaveSpectating(matchId) {
        if (!this.myId) return;

        try {
            await this.firebase.ref(`arcade/spectating/${matchId}/spectators/${this.myId}`).remove();
        } catch (error) {
            console.error('Error leaving spectator mode:', error);
        }
    }

    // ==========================================
    // Internal Methods
    // ==========================================

    async _loadFriends() {
        if (!this.myId) return;

        try {
            const snapshot = await this.firebase.ref(`arcade/friends/${this.myId}/list`).once('value');
            this.friends = snapshot.val() || {};
        } catch (error) {
            console.error('Error loading friends:', error);
            this.friends = {};
        }
    }

    async _loadFriendRequests() {
        if (!this.myId) return;

        try {
            const incomingSnapshot = await this.firebase.ref(`arcade/friends/${this.myId}/requests/incoming`).once('value');
            const outgoingSnapshot = await this.firebase.ref(`arcade/friends/${this.myId}/requests/outgoing`).once('value');

            this.friendRequests.incoming = incomingSnapshot.val() || {};
            this.friendRequests.outgoing = outgoingSnapshot.val() || {};
        } catch (error) {
            console.error('Error loading friend requests:', error);
        }
    }

    _setupRealtimeListeners() {
        if (!this.myId) return;

        // Listen for friend list changes
        const friendsRef = this.firebase.ref(`arcade/friends/${this.myId}/list`);
        friendsRef.on('value', (snapshot) => {
            this.friends = snapshot.val() || {};
            this._notifyListeners();
        });
        this._unsubscribers.push(() => friendsRef.off());

        // Listen for incoming requests
        const incomingRef = this.firebase.ref(`arcade/friends/${this.myId}/requests/incoming`);
        incomingRef.on('value', (snapshot) => {
            this.friendRequests.incoming = snapshot.val() || {};
            this._notifyListeners();
        });
        this._unsubscribers.push(() => incomingRef.off());

        // Listen for outgoing requests
        const outgoingRef = this.firebase.ref(`arcade/friends/${this.myId}/requests/outgoing`);
        outgoingRef.on('value', (snapshot) => {
            this.friendRequests.outgoing = snapshot.val() || {};
            this._notifyListeners();
        });
        this._unsubscribers.push(() => outgoingRef.off());
    }

    _setupInviteListener() {
        if (!this.myId) return;

        const invitesRef = this.firebase.ref(`arcade/friends/${this.myId}/invites`);
        invitesRef.on('value', (snapshot) => {
            const invites = snapshot.val() || {};

            // Filter out expired invites
            const now = Date.now();
            this.invites = {};
            for (const [id, invite] of Object.entries(invites)) {
                if (invite.expires_at > now && invite.status === 'pending') {
                    this.invites[id] = invite;
                } else if (invite.expires_at <= now) {
                    // Clean up expired invite
                    this.firebase.ref(`arcade/friends/${this.myId}/invites/${id}`).remove();
                }
            }

            this._notifyInviteListeners();
        });
        this._unsubscribers.push(() => invitesRef.off());
    }

    // ==========================================
    // Event Listeners
    // ==========================================

    /**
     * Subscribe to friend list changes
     */
    onFriendsChange(callback) {
        this._listeners.push(callback);
        // Immediately call with current data
        callback({
            friends: this.friends,
            incoming: this.friendRequests.incoming,
            outgoing: this.friendRequests.outgoing
        });
    }

    offFriendsChange(callback) {
        this._listeners = this._listeners.filter(cb => cb !== callback);
    }

    _notifyListeners() {
        const data = {
            friends: this.friends,
            incoming: this.friendRequests.incoming,
            outgoing: this.friendRequests.outgoing
        };
        this._listeners.forEach(cb => cb(data));
    }

    /**
     * Subscribe to battle invite changes
     */
    onBattleInvite(callback) {
        this._inviteListeners.push(callback);
        // Immediately call with current invites
        if (Object.keys(this.invites).length > 0) {
            callback(this.invites);
        }
    }

    offBattleInvite(callback) {
        this._inviteListeners = this._inviteListeners.filter(cb => cb !== callback);
    }

    _notifyInviteListeners() {
        this._inviteListeners.forEach(cb => cb(this.invites));
    }

    /**
     * Get counts for UI badges
     */
    getCounts() {
        return {
            friends: Object.keys(this.friends).length,
            incomingRequests: Object.keys(this.friendRequests.incoming).length,
            pendingInvites: Object.keys(this.invites).length
        };
    }

    /**
     * Clean up listeners
     */
    destroy() {
        this._unsubscribers.forEach(unsub => unsub());
        this._unsubscribers = [];
        this._listeners = [];
        this._inviteListeners = [];
    }
}

// Export
window.FriendsManager = FriendsManager;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FriendsManager };
}
