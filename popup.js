document.addEventListener('DOMContentLoaded', function() {
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
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        
        // Add login logic here
        console.log('Login attempt:', username);
        
        // For demo purposes, just show an alert
        alert('Logged in as ' + username);
    });

    // Handle register form submission
    registerForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Check if passwords match
        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }
        
        // Add registration logic here
        console.log('Registration attempt:', username);
        
        // For demo purposes, just show an alert
        alert('Registered as ' + username);
        
        // Redirect to welcome screen after successful registration
        registerDiv.style.display = 'none';
        welcomeDiv.style.display = 'block';
    });
});
