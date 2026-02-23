// shared/config.js
// Shared configuration and authentication manager for both portals

class PortalAuth {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.userProfile = null;
        this.config = {
            supabaseUrl: 'https://joxvhzxkrcigknsdrusr.supabase.co',
            supabaseKey: 'sb_publishable_xgvdFBaHCJKl9p-Lu61aZw_3oLkeTtc',
            mainPortalUrl: '../index.html',
            classesPortalUrl: './portal/',
            theme: {
                primary: '#6aa9ff',
                secondary: '#8bffb0',
                background: '#0f1216',
                cardBg: '#151a21',
                textColor: '#e6edf3',
                mutedColor: '#97a2b0',
                borderColor: '#2a3140',
                danger: '#ff6a6a',
                warning: '#ffd36a'
            }
        };
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return this;

        try {
            // Wait for Supabase to be available
            if (typeof supabase === 'undefined') {
                await this.loadSupabase();
            }

            this.supabase = supabase.createClient(this.config.supabaseUrl, this.config.supabaseKey, {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: true
                }
            });

            // Check current session
            await this.checkCurrentSession();

            // Set up auth state listener and store the unsubscribe function
            this._setupAuthListener();

            this.initialized = true;
            console.log('✅ PortalAuth initialized');

        } catch (error) {
            console.error('❌ PortalAuth initialization failed:', error);
        }

        return this;
    }

    _setupAuthListener() {
        // Clean up previous listener if exists
        if (this._authUnsubscribe) {
            this._authUnsubscribe();
            this._authUnsubscribe = null;
        }

        const { data: { subscription } } = this.supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('🔐 Auth state changed:', event);

            if (event === 'PASSWORD_RECOVERY') {
                // User clicked password reset link - show reset form
                console.log('🔑 Password recovery mode detected');
                this.currentUser = session?.user || null;
                this.notifyAuthChange('PASSWORD_RECOVERY');
                this.showPasswordResetForm();
            } else if (event === 'SIGNED_IN' && session) {
                this.currentUser = session.user;
                await this.loadUserProfile();
                this.notifyAuthChange('SIGNED_IN');
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                this.userProfile = null;
                this.notifyAuthChange('SIGNED_OUT');
            } else if (event === 'TOKEN_REFRESHED') {
                console.log('🔄 Token refreshed');
                // Update current user from refreshed session
                if (session?.user) {
                    this.currentUser = session.user;
                }
            }
        });

        this._authUnsubscribe = () => subscription.unsubscribe();
    }

    showPasswordResetForm() {
        // Create modal overlay for password reset
        const existingModal = document.getElementById('password-reset-modal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.id = 'password-reset-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 100000;
            padding: 20px;
        `;

        modal.innerHTML = `
            <div style="
                background: #151a21;
                border: 1px solid #2a3140;
                border-radius: 12px;
                padding: 30px;
                max-width: 400px;
                width: 100%;
                color: #e6edf3;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
                <h2 style="margin: 0 0 10px 0; color: #6aa9ff;">🔐 Reset Your Password</h2>
                <p style="color: #97a2b0; margin-bottom: 20px;">Enter your new password below.</p>

                <form id="password-reset-form" onsubmit="window.portalAuth.handlePasswordReset(event)">
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">New Password</label>
                        <input type="password" id="reset-new-password" required minlength="6"
                               placeholder="Enter new password (min 6 characters)"
                               style="width: 100%; padding: 12px; border: 1px solid #2a3140; border-radius: 8px; background: #0f1216; color: #e6edf3; font-size: 14px; box-sizing: border-box;">
                    </div>

                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Confirm Password</label>
                        <input type="password" id="reset-confirm-password" required minlength="6"
                               placeholder="Confirm new password"
                               style="width: 100%; padding: 12px; border: 1px solid #2a3140; border-radius: 8px; background: #0f1216; color: #e6edf3; font-size: 14px; box-sizing: border-box;">
                    </div>

                    <div id="reset-error" style="color: #ff6a6a; font-size: 14px; margin-bottom: 15px; display: none;"></div>

                    <button type="submit" id="reset-submit-btn" style="
                        width: 100%;
                        padding: 12px;
                        background: linear-gradient(135deg, #6aa9ff 0%, #8bffb0 100%);
                        border: none;
                        border-radius: 8px;
                        color: #0f1216;
                        font-weight: 600;
                        font-size: 16px;
                        cursor: pointer;
                        transition: opacity 0.2s;
                    ">
                        Update Password
                    </button>
                </form>
            </div>
        `;

        document.body.appendChild(modal);
    }

    async handlePasswordReset(event) {
        event.preventDefault();

        const newPassword = document.getElementById('reset-new-password')?.value;
        const confirmPassword = document.getElementById('reset-confirm-password')?.value;
        const errorDiv = document.getElementById('reset-error');
        const submitBtn = document.getElementById('reset-submit-btn');

        // Clear previous errors
        if (errorDiv) {
            errorDiv.style.display = 'none';
            errorDiv.textContent = '';
        }

        // Validate passwords match
        if (newPassword !== confirmPassword) {
            if (errorDiv) {
                errorDiv.textContent = 'Passwords do not match.';
                errorDiv.style.display = 'block';
            }
            return;
        }

        // Validate password length
        if (newPassword.length < 6) {
            if (errorDiv) {
                errorDiv.textContent = 'Password must be at least 6 characters.';
                errorDiv.style.display = 'block';
            }
            return;
        }

        try {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Updating...';
            }

            const { error } = await this.supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            // Success - remove modal and show notification
            const modal = document.getElementById('password-reset-modal');
            if (modal) modal.remove();

            PortalUI.showNotification('Password updated successfully! You can now log in with your new password.', 'success', 5000);

            // Clean up URL hash (remove recovery tokens)
            window.history.replaceState(null, '', window.location.pathname);

            // Redirect to login after short delay
            setTimeout(() => {
                window.location.href = window.location.pathname;
            }, 2000);

        } catch (error) {
            console.error('Password reset error:', error);
            if (errorDiv) {
                errorDiv.textContent = error.message || 'Failed to update password. Please try again.';
                errorDiv.style.display = 'block';
            }
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Update Password';
            }
        }
    }

    async loadSupabase() {
        return new Promise((resolve, reject) => {
            if (typeof supabase !== 'undefined') {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = '/student-portal/shared/supabase.min.js';
            script.onload = () => {
                console.log('📦 Supabase loaded');
                resolve();
            };
            script.onerror = () => reject(new Error('Failed to load Supabase'));
            document.head.appendChild(script);
        });
    }

    async checkCurrentSession() {
        try {
            const { data: { session }, error } = await this.supabase.auth.getSession();
            
            if (error) {
                console.warn('Session check error:', error.message);
                return false;
            }
            
            if (session?.user) {
                this.currentUser = session.user;
                await this.loadUserProfile();
                return true;
            }
            
            return false;
        } catch (error) {
            console.warn('Session check failed:', error.message);
            return false;
        }
    }

    async reconnect() {
        console.log('🔄 Reconnecting to Supabase...');

        try {
            // Clean up old auth listener before creating new client
            if (this._authUnsubscribe) {
                this._authUnsubscribe();
                this._authUnsubscribe = null;
            }

            // Recreate the Supabase client
            this.supabase = supabase.createClient(this.config.supabaseUrl, this.config.supabaseKey, {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: true
                }
            });

            // Re-setup the auth listener for the new client
            this._setupAuthListener();

            // Restore the session
            const { data: { session }, error } = await this.supabase.auth.getSession();

            if (error) {
                console.error('❌ Reconnect session error:', error);
                return false;
            }

            if (session?.user) {
                this.currentUser = session.user;
                await this.loadUserProfile();
                console.log('✅ Reconnected successfully');
                return true;
            }

            console.warn('⚠️ Reconnected but no session');
            return false;

        } catch (error) {
            console.error('❌ Reconnect failed:', error);
            return false;
        }
    }

    // Synchronous reconnect - creates new client immediately without waiting for session
    reconnectSync() {
        try {
            // Clean up old auth listener
            if (this._authUnsubscribe) {
                this._authUnsubscribe();
                this._authUnsubscribe = null;
            }

            // Recreate the Supabase client immediately
            this.supabase = supabase.createClient(this.config.supabaseUrl, this.config.supabaseKey, {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: true
                }
            });

            // Re-setup auth listener
            this._setupAuthListener();

            return true;
        } catch (error) {
            return false;
        }
    }

    async loadUserProfile() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) return null;
    
            // Fetch profile by auth_user_id (for activated accounts) or id (for legacy accounts)
            const { data: profiles, error } = await this.supabase
                .from('user_profiles')
                .select('*')
                .or(`auth_user_id.eq.${user.id},id.eq.${user.id}`);
    
            if (error) {
                console.error('Profile fetch error:', error);
                return null;
            }
    
            // If profile exists, use it
            if (profiles && profiles.length > 0) {
                this.userProfile = profiles[0];
                return profiles[0];
            }
    
            // No profile found - this shouldn't happen for properly registered users
            console.warn('⚠️ No profile found for authenticated user:', user.email);
            console.warn('User may have incomplete registration');
            
            // Return null - don't try to create profiles here
            // Profile creation should only happen during registration
            this.userProfile = null;
            return null;
    
        } catch (error) {
            console.error('Profile load error:', error);
            return null;
        }
    }

    // Navigation helpers
    goToMainPortal(section = '') {
        const url = this.config.mainPortalUrl + (section ? '#' + section : '');
        window.location.href = url;
    }

    goToClassesPortal(section = '') {
        const url = this.config.classesPortalUrl + (section ? '#' + section : '');
        window.location.href = url;
    }

    requireAuth(redirectToMain = true) {
        if (!this.isAuthenticated()) {
            console.log('🔒 Authentication required');
            if (redirectToMain) {
                this.goToMainPortal();
            }
            return false;
        }
        return true;
    }

    isAuthenticated() {
        // User is authenticated if they have a session, even if profile is missing
        return !!this.currentUser;
    }
    
    hasCompleteProfile() {
        // Check if user has both auth and profile
        return !!(this.currentUser && this.userProfile);
    }

    getUserInfo() {
        return {
            user: this.currentUser,
            profile: this.userProfile,
            isAuthenticated: this.isAuthenticated(),
            hasProfile: !!this.userProfile
        };
    }

    // Auth state notification system
    notifyAuthChange(event) {
        window.dispatchEvent(new CustomEvent('portalAuthChange', {
            detail: { event, user: this.currentUser, profile: this.userProfile }
        }));
    }

    // Logout across both portals
    async logout() {
        try {
            await this.supabase.auth.signOut();
            this.currentUser = null;
            this.userProfile = null;
            this.goToMainPortal();
        } catch (error) {
            console.error('Logout error:', error);
            // Force logout anyway
            this.currentUser = null;
            this.userProfile = null;
            this.goToMainPortal();
        }
    }
}

// Shared UI utilities
class PortalUI {
    static applyTheme(theme) {
        const root = document.documentElement;
        Object.entries(theme).forEach(([key, value]) => {
            root.style.setProperty(`--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value);
        });
    }

    static showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `portal-notification portal-notification--${type}`;
        notification.textContent = message;
        
        const styles = {
            info: { bg: '#2196f3', color: '#fff' },
            success: { bg: '#4caf50', color: '#fff' },
            error: { bg: '#f44336', color: '#fff' },
            warning: { bg: '#ff9800', color: '#fff' }
        };
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            border-radius: 8px;
            color: ${styles[type].color};
            background: ${styles[type].bg};
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 400px;
            animation: slideInRight 0.3s ease-out;
            font-family: inherit;
            font-size: 14px;
            line-height: 1.4;
        `;
        
        // Add animation styles if not already present
        if (!document.getElementById('portal-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'portal-notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, duration);
    }

    static createUnifiedNavigation(currentPortal = 'main', currentSection = '') {
        const auth = window.portalAuth;
        const userInfo = auth ? auth.getUserInfo() : { isAuthenticated: false };
        
        if (!userInfo.isAuthenticated) return '';
        
        const isTeacher = userInfo.profile?.user_type === 'teacher';
        const isParent = userInfo.profile?.user_type === 'parent';
        const isStudent = userInfo.profile?.user_type === 'student';
        
        return `
            <nav class="unified-portal-nav">
                <div class="nav-brand">
                    <span class="nav-logo">🎓</span>
                    <span class="nav-title">EduPortal</span>
                </div>
                
                <div class="nav-links">
                    <a href="${currentPortal === 'classes' ? '../index.html' : window.location.pathname}#dashboard" 
                       class="nav-link ${currentPortal === 'main' && currentSection === 'dashboard' ? 'active' : ''}"
                       title="Dashboard">
                        <span class="nav-icon">🏠</span>
                        <span class="nav-text">Dashboard</span>
                    </a>
                    
                    ${isStudent ? `
                        <a href="${currentPortal === 'classes' ? '../index.html#games' : window.location.pathname + '#games'}" 
                           class="nav-link ${currentPortal === 'main' && currentSection === 'games' ? 'active' : ''}"
                           title="Educational Games">
                            <span class="nav-icon">🎮</span>
                            <span class="nav-text">Games</span>
                        </a>
                        
                        <a href="${currentPortal === 'classes' ? '../index.html#skills' : window.location.pathname + '#skills'}" 
                           class="nav-link ${currentPortal === 'main' && currentSection === 'skills' ? 'active' : ''}"
                           title="Skill Trees">
                            <span class="nav-icon">🌟</span>
                            <span class="nav-text">Skills</span>
                        </a>
                        ` : ''}
                    
                    <a href="${currentPortal === 'classes' ? './index.html#classes' : './portal/index.html#classes'}"
                       class="nav-link ${currentPortal === 'classes' && currentSection === 'classes' ? 'active' : ''}"
                       title="${isParent ? "Children's Classes" : 'Classes & Assignments'}">
                        <span class="nav-icon">📚</span>
                        <span class="nav-text">${isParent ? "Children's Classes" : 'Classes'}</span>
                    </a>

                    <a href="${currentPortal === 'classes' ? './index.html#messaging' : './portal/index.html#messaging'}"
                       class="nav-link ${currentPortal === 'classes' && currentSection === 'messaging' ? 'active' : ''}"
                       title="Messages">
                        <span class="nav-icon">💬</span>
                        <span class="nav-text">Messages</span>
                    </a>
                </div>
                
                <div class="nav-user">
                    <div class="user-info">
                        <span class="user-name">${userInfo.profile?.first_name || 'User'}</span>
                        <span class="user-type">${userInfo.profile?.user_type || 'student'}</span>
                    </div>
                    <button class="nav-logout" onclick="window.portalAuth?.logout()" title="Logout">
                        <span class="nav-icon">🚪</span>
                    </button>
                </div>
            </nav>
        `;
    }

    static addNavigationStyles() {
        if (document.getElementById('unified-nav-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'unified-nav-styles';
        style.textContent = `
            .unified-portal-nav {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 20px;
                background: rgba(15, 18, 22, 0.95);
                backdrop-filter: blur(10px);
                border-bottom: 1px solid var(--border-color, #2a3140);
                position: sticky;
                top: 0;
                z-index: 1000;
                font-family: inherit;
            }
            
            .nav-brand {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 600;
                color: var(--text-color, #e6edf3);
            }
            
            .nav-logo {
                font-size: 24px;
            }
            
            .nav-title {
                font-size: 18px;
            }
            
            .nav-links {
                display: flex;
                gap: 4px;
            }
            
            .nav-link {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 8px 12px;
                border-radius: 6px;
                text-decoration: none;
                color: var(--muted-color, #97a2b0);
                font-size: 14px;
                transition: all 0.2s ease;
                position: relative;
            }
            
            .nav-link:hover {
                background: rgba(106, 169, 255, 0.1);
                color: var(--primary, #6aa9ff);
            }
            
            .nav-link.active {
                background: rgba(106, 169, 255, 0.2);
                color: var(--primary, #6aa9ff);
            }
            
            .nav-icon {
                font-size: 16px;
            }
            
            .nav-text {
                font-weight: 500;
            }
            
            .nav-user {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .user-info {
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                font-size: 12px;
            }
            
            .user-name {
                color: var(--text-color, #e6edf3);
                font-weight: 600;
            }
            
            .user-type {
                color: var(--muted-color, #97a2b0);
                text-transform: capitalize;
            }
            
            .nav-logout {
                background: none;
                border: 1px solid var(--border-color, #2a3140);
                color: var(--muted-color, #97a2b0);
                padding: 6px;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 16px;
            }
            
            .nav-logout:hover {
                border-color: var(--danger, #ff6a6a);
                color: var(--danger, #ff6a6a);
                background: rgba(255, 106, 106, 0.1);
            }
            
            @media (max-width: 768px) {
                .unified-portal-nav {
                    padding: 8px 12px;
                }
                
                .nav-text {
                    display: none;
                }
                
                .nav-links {
                    gap: 2px;
                }
                
                .nav-link {
                    padding: 8px;
                }
                
                .user-info {
                    display: none;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize shared portal system
window.portalAuth = new PortalAuth();
window.PortalUI = PortalUI;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.portalAuth.initialize();
        PortalUI.addNavigationStyles();
        PortalUI.applyTheme(window.portalAuth.config.theme);
    });
} else {
    window.portalAuth.initialize();
    PortalUI.addNavigationStyles();
    PortalUI.applyTheme(window.portalAuth.config.theme);

}









