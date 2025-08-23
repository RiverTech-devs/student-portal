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
            
            // Set up auth state listener
            this.supabase.auth.onAuthStateChange(async (event, session) => {
                console.log('🔐 Auth state changed:', event);
                
                if (event === 'SIGNED_IN' && session) {
                    this.currentUser = session.user;
                    await this.loadUserProfile();
                    this.notifyAuthChange('SIGNED_IN');
                } else if (event === 'SIGNED_OUT') {
                    this.currentUser = null;
                    this.userProfile = null;
                    this.notifyAuthChange('SIGNED_OUT');
                }
            });

            this.initialized = true;
            console.log('✅ PortalAuth initialized');
            
        } catch (error) {
            console.error('❌ PortalAuth initialization failed:', error);
        }
        
        return this;
    }

    async loadSupabase() {
        return new Promise((resolve, reject) => {
            if (typeof supabase !== 'undefined') {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
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

    async loadUserProfile() {
        if (!this.currentUser) return null;
        
        try {
            const { data, error } = await this.supabase
                .from('user_profiles')
                .select('*')
                .eq('id', this.currentUser.id)
                .single();
            
            if (error) {
                console.warn('Profile load error:', error.message);
                return null;
            }
            
            this.userProfile = data;
            return data;
        } catch (error) {
            console.warn('Profile load failed:', error.message);
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
        return !!(this.currentUser && this.userProfile);
    }

    getUserInfo() {
        return {
            user: this.currentUser,
            profile: this.userProfile,
            isAuthenticated: this.isAuthenticated()
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
                    <a href="${currentPortal === 'classes' ? '../index.html' : 'index.html'}" 
                       class="nav-link ${currentPortal === 'main' && currentSection === 'dashboard' ? 'active' : ''}"
                       title="Dashboard">
                        <span class="nav-icon">🏠</span>
                        <span class="nav-text">Dashboard</span>
                    </a>
                    
                    ${isStudent ? `
                    <a href="../index.html#games" 
                       class="nav-link ${currentPortal === 'main' && currentSection === 'games' ? 'active' : ''}"
                       title="Educational Games">
                        <span class="nav-icon">🎮</span>
                        <span class="nav-text">Games</span>
                    </a>
                    
                    <a href="../index.html#skills" 
                       class="nav-link ${currentPortal === 'main' && currentSection === 'skills' ? 'active' : ''}"
                       title="Skill Trees">
                        <span class="nav-icon">🌟</span>
                        <span class="nav-text">Skills</span>
                    </a>
                    ` : ''}
                    
                    <a href="${currentPortal === 'classes' ? './index.html' : './portal/index.html'}" 
                       class="nav-link ${currentPortal === 'classes' ? 'active' : ''}"
                       title="Classes & Assignments">
                        <span class="nav-icon">📚</span>
                        <span class="nav-text">Classes</span>
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
