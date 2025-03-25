import authService from './services/auth.js';

document.addEventListener('DOMContentLoaded', async function() {
    const featuresDiv = document.getElementById('features');
    const welcomeDiv = document.getElementById('welcome');
    const loginDiv = document.getElementById('login');
    const registerDiv = document.getElementById('register');
    
    const getStartedBtn = document.getElementById('getStartedBtn');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const backToWelcomeFromLogin = document.getElementById('backToWelcomeFromLogin');
    const backToWelcomeFromRegister = document.getElementById('backToWelcomeFromRegister');

    // Check if user is already logged in
    const isLoggedIn = await authService.isLoggedIn();
    if (isLoggedIn) {
        // Hide all other divs and show main interface
        featuresDiv.style.display = 'none';
        welcomeDiv.style.display = 'none';
        loginDiv.style.display = 'none';
        registerDiv.style.display = 'none';
        // TODO: Show main interface
    }

    // Navigate from features to welcome page
    getStartedBtn.addEventListener('click', function() {
        featuresDiv.style.display = 'none';
        welcomeDiv.style.display = 'block';
    });

    // Show login form
    loginBtn.addEventListener('click', function() {
        welcomeDiv.style.display = 'none';
        loginDiv.style.display = 'block';
    });

    // Show register form
    registerBtn.addEventListener('click', function() {
        welcomeDiv.style.display = 'none';
        registerDiv.style.display = 'block';
    });

    // Back to welcome from login
    backToWelcomeFromLogin.addEventListener('click', function() {
        loginDiv.style.display = 'none';
        welcomeDiv.style.display = 'block';
    });

    // Back to welcome from register
    backToWelcomeFromRegister.addEventListener('click', function() {
        registerDiv.style.display = 'none';
        welcomeDiv.style.display = 'block';
    });

    // Handle login form submission
    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        
        const result = await authService.login(username, password);
        
        if (result.success) {
            alert(result.message);
            // TODO: Show main interface
        } else {
            alert(result.message);
        }
    });

    // Handle register form submission
    registerForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Check if passwords match
        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }
        
        const result = await authService.register(username, password);
        
        if (result.success) {
            alert(result.message);
            // Redirect to welcome screen after successful registration
            registerDiv.style.display = 'none';
            welcomeDiv.style.display = 'block';
        } else {
            alert(result.message);
        }
    });
});
