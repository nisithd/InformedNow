class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        await this.checkAuthStatus();
        this.setupEventListeners();
    }

    async checkAuthStatus() {
        try {
            const response = await fetch('/api/user/', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const username = await response.json();
                
                if (username && username !== 'null' && username !== '""' && username !== '') {
                    this.setLoggedIn(username);
                } else {
                    this.setLoggedOut();
                }
            } else {
                this.setLoggedOut();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.setLoggedOut();
        }
    }

    setupEventListeners() {
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('signup-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignup();
        });

        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });
    }

    async handleLogin() {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        const errorElement = document.getElementById('login-error');

        errorElement.style.display = 'none';

        if (!username || !password) {
            errorElement.textContent = 'Please fill in all fields';
            errorElement.style.display = 'block';
            return;
        }

        try {
            await this.login(username, password);
            document.getElementById('login-form').reset();
        } catch (error) {
            errorElement.textContent = error.message;
            errorElement.style.display = 'block';
        }
    }

    async handleSignup() {
        const username = document.getElementById('signup-username').value;
        const password = document.getElementById('signup-password').value;
        const errorElement = document.getElementById('signup-error');
        const successElement = document.getElementById('signup-success');

        errorElement.style.display = 'none';
        successElement.style.display = 'none';

        if (!username || !password) {
            errorElement.textContent = 'Please fill in all fields';
            errorElement.style.display = 'block';
            return;
        }

        if (username.length < 1 || username.length > 50) {
            errorElement.textContent = 'Username must be 1-50 characters';
            errorElement.style.display = 'block';
            return;
        }

        try {
            const response = await fetch('/api/signup/', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            });

            if (!response.ok) {
                const errorText = await response.text();
                
                if (response.status === 409) {
                    throw new Error('Username already exists');
                } else if (response.status === 400) {
                    throw new Error('Invalid username or password');
                } else {
                    throw new Error(errorText || 'Signup failed');
                }
            }

            const newUsername = await response.json();
            
            await this.login(username, password);
            
            successElement.textContent = 'Signup successful! You are now logged in.';
            successElement.style.display = 'block';
            document.getElementById('signup-form').reset();
            
        } catch (error) {
            errorElement.textContent = error.message;
            errorElement.style.display = 'block';
        }
    }

    async login(username, password) {
        const response = await fetch('/api/signin/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
            credentials: 'include'
        });

        if (!response.ok) {
            const errorText = await response.text();
            
            if (response.status === 401) {
                throw new Error('Invalid username or password');
            } else if (response.status === 400) {
                throw new Error('Invalid input');
            } else {
                throw new Error(errorText || 'Login failed');
            }
        }

        const loggedInUsername = await response.json();
        this.setLoggedIn(loggedInUsername);
    }

    async signup(username, password) {
        const response = await fetch('/api/signup/', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error);
        }

        const newUsername = await response.json();
        await this.login(username, password);
    }

    async logout() {
        try {
            await fetch('/api/signout/', {
                credentials: 'include'
            });
            this.setLoggedOut();
            window.location.reload();
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    setLoggedIn(username) {
        this.currentUser = username;
        document.body.classList.add('logged-in');
        document.body.classList.remove('logged-out');
        document.getElementById('username-display').textContent = username;
        document.getElementById('guest-buttons').style.display = 'none';
        document.getElementById('user-info').style.display = 'block';
        
        document.dispatchEvent(new CustomEvent('authStateChanged'));
    }

    setLoggedOut() {
        this.currentUser = null;
        document.body.classList.add('logged-out');
        document.body.classList.remove('logged-in');
        document.getElementById('guest-buttons').style.display = 'block';
        document.getElementById('user-info').style.display = 'none';
        
        document.dispatchEvent(new CustomEvent('authStateChanged'));
    }

    updateUserSpecificUI() {
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }
}

const authManager = new AuthManager();
export default authManager;