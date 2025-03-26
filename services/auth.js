// Authentication service using chrome.storage.local
class AuthService {
    constructor() {
        this.storage = chrome.storage.local;
    }

    // Register a new user
    async register(username, password) {
        try {
            // Check if username already exists
            const users = await this.getUsers();
            if (users[username]) {
                throw new Error('Username already exists');
            }

            // Hash password (in a real app, use a proper hashing algorithm)
            const hashedPassword = this.hashPassword(password);

            // Add new user
            users[username] = {
                password: hashedPassword,
                createdAt: new Date().toISOString()
            };

            // Save to storage
            await this.storage.set({ users });

            return { success: true, message: 'Registration successful' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Login user
    async login(username, password) {
        try {
            const users = await this.getUsers();
            const user = users[username];

            if (!user) {
                throw new Error('User not found');
            }

            // Verify password
            if (user.password !== this.hashPassword(password)) {
                throw new Error('Invalid password');
            }

            // Set current user in chrome storage
            await this.storage.set({ currentUser: username });
            
            // Also set in localStorage for easier access in popup UI
            // This is helpful when the extension UI needs quick access to login state
            localStorage.setItem('username', username);
            localStorage.setItem('isLoggedIn', 'true');

            return { success: true, message: 'Login successful' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Logout user
    async logout() {
        try {
            // Clear from chrome storage
            await this.storage.remove('currentUser');
            
            // Also clear from localStorage
            localStorage.removeItem('username');
            localStorage.removeItem('isLoggedIn');
            
            return { success: true, message: 'Logout successful' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Get current user
    async getCurrentUser() {
        try {
            // First try to get from chrome storage
            const { currentUser } = await this.storage.get('currentUser');
            
            // If not in chrome storage, check localStorage
            if (!currentUser && localStorage.getItem('isLoggedIn')) {
                return localStorage.getItem('username');
            }
            
            return currentUser;
        } catch (error) {
            // Fallback to localStorage if chrome storage fails
            if (localStorage.getItem('isLoggedIn')) {
                return localStorage.getItem('username');
            }
            return null;
        }
    }

    // Check if user is logged in
    async isLoggedIn() {
        // We can use a faster check with localStorage first
        if (localStorage.getItem('isLoggedIn') === 'true') {
            return true;
        }
        
        // Fall back to chrome storage check if localStorage doesn't have it
        const currentUser = await this.getCurrentUser();
        return !!currentUser;
    }

    // Get all users (for internal use)
    async getUsers() {
        try {
            const { users } = await this.storage.get('users');
            return users || {};
        } catch (error) {
            return {};
        }
    }

    // Simple password hashing (for demo purposes)
    hashPassword(password) {
        // In a real app, use a proper hashing algorithm like bcrypt
        return btoa(password);
    }
}

// Export singleton instance
const authService = new AuthService();
export default authService; 