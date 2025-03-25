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

            // Set current user
            await this.storage.set({ currentUser: username });

            return { success: true, message: 'Login successful' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Logout user
    async logout() {
        try {
            await this.storage.remove('currentUser');
            return { success: true, message: 'Logout successful' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Get current user
    async getCurrentUser() {
        try {
            const { currentUser } = await this.storage.get('currentUser');
            return currentUser;
        } catch (error) {
            return null;
        }
    }

    // Check if user is logged in
    async isLoggedIn() {
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