import authService from './services/auth.js';

document.addEventListener('DOMContentLoaded', async function() {
    const featuresDiv = document.getElementById('features');
    const welcomeDiv = document.getElementById('welcome');
    const loginDiv = document.getElementById('login');
    const registerDiv = document.getElementById('register');
    const getStartedBtn = document.getElementById('getStartedBtn');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const guestLoginBtn = document.getElementById('guestLoginBtn');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const backToWelcomeFromLogin = document.getElementById('backToWelcomeFromLogin');
    const backToWelcomeFromRegister = document.getElementById('backToWelcomeFromRegister');
    const chartBtn = document.getElementById('chartBtn');
    const backToFeaturesFromChart = document.getElementById('backToFeaturesFromChart');
    
    const loginSpinner = document.getElementById('loginSpinner');
    const registerSpinner = document.getElementById('registerSpinner');
    const loginMessage = document.getElementById('loginMessage');
    const registerMessage = document.getElementById('registerMessage');

    // Function to show message
    function showMessage(element, message, type) {
        element.textContent = message;
        element.className = 'message ' + type;
        element.style.display = 'block';
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }

    // Check if user is already logged in
    const isLoggedIn = await authService.isLoggedIn();
    
    // 检查是否是从logout回来的
    const isLoggedOut = sessionStorage.getItem('loggedOut') === 'true';
    
    if (isLoggedOut) {
        // 清除退出标记
        sessionStorage.removeItem('loggedOut');
        
        // 显示欢迎页面
        featuresDiv.style.display = 'none';
        welcomeDiv.style.display = 'block';
        loginDiv.style.display = 'none';
        registerDiv.style.display = 'none';
    } else if (isLoggedIn) {
        // 用户已登录，重定向到主页面
        featuresDiv.style.display = 'none';
        welcomeDiv.style.display = 'none';
        loginDiv.style.display = 'none';
        registerDiv.style.display = 'none';
        // Redirect to main page
        window.location.href = 'mainPage.html';
    }

    // Add page transition animation
    function switchPage(hideElement, showElement) {
        // Add exit animation class
        hideElement.style.opacity = '0';
        hideElement.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            hideElement.style.display = 'none';
            
            // Reset and show the new element
            showElement.style.opacity = '0';
            showElement.style.transform = 'translateY(20px)';
            showElement.style.display = 'block';
            
            // Force reflow
            showElement.offsetHeight;
            
            // Add entrance animation
            showElement.style.opacity = '1';
            showElement.style.transform = 'translateY(0)';
        }, 300);
    }

    // Navigate from features to welcome page
    getStartedBtn.addEventListener('click', function() {
        switchPage(featuresDiv, welcomeDiv);
    });

    // Show login form
    loginBtn.addEventListener('click', function() {
        switchPage(welcomeDiv, loginDiv);
    });

    // Show register form
    registerBtn.addEventListener('click', function() {
        switchPage(welcomeDiv, registerDiv);
    });

    // Guest login - direct access to main interface
    guestLoginBtn.addEventListener('click', function() {
        // Set as guest user in localStorage
        localStorage.setItem('username', 'Guest');
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('isGuestMode', 'true');
        
        console.log('Entering as guest...');
        
        // Show a brief notice before redirecting
        const guestNotice = document.createElement('div');
        guestNotice.className = 'message info';
        guestNotice.textContent = 'Entering guest mode. Some features will be limited.';
        guestNotice.style.position = 'absolute';
        guestNotice.style.bottom = '20px';
        guestNotice.style.left = '0';
        guestNotice.style.right = '0';
        guestNotice.style.marginLeft = 'auto';
        guestNotice.style.marginRight = 'auto';
        guestNotice.style.width = '80%';
        guestNotice.style.textAlign = 'center';
        guestNotice.style.zIndex = '9999';
        document.body.appendChild(guestNotice);
        
        // Redirect to main page after a short delay
        setTimeout(() => {
            window.location.href = 'mainPage.html';
        }, 1500);
    });

    // Back to welcome from login
    backToWelcomeFromLogin.addEventListener('click', function() {
        switchPage(loginDiv, welcomeDiv);
    });

    // Back to welcome from register
    backToWelcomeFromRegister.addEventListener('click', function() {
        switchPage(registerDiv, welcomeDiv);
    });

    // Handle login form submission
    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        // Show spinner and hide form
        loginForm.style.display = 'none';
        loginSpinner.style.display = 'block';
        
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const result = await authService.login(username, password);
        
        // Hide spinner and show form
        loginSpinner.style.display = 'none';
        loginForm.style.display = 'block';
        
        if (result.success) {
            showMessage(loginMessage, result.message, 'success');
            
            // Set username in localStorage for display on main page
            localStorage.setItem('username', username);
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('isGuestMode', 'false');
            
            // Redirect to main page after a short delay
            setTimeout(() => {
                console.log('Redirecting to main interface...');
                window.location.href = 'mainPage.html';
            }, 1500);
        } else {
            showMessage(loginMessage, result.message, 'error');
        }
    });

    // Handle register form submission
    registerForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        // Show spinner and hide form
        registerForm.style.display = 'none';
        registerSpinner.style.display = 'block';
        
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Check if passwords match
        if (password !== confirmPassword) {
            // Hide spinner and show form
            registerSpinner.style.display = 'none';
            registerForm.style.display = 'block';
            
            showMessage(registerMessage, 'Passwords do not match!', 'error');
            return;
        }
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const result = await authService.register(username, password);
        
        // Hide spinner and show form
        registerSpinner.style.display = 'none';
        registerForm.style.display = 'block';
        
        if (result.success) {
            showMessage(registerMessage, result.message, 'success');
            
            // Redirect to welcome screen after successful registration
            setTimeout(() => {
                switchPage(registerDiv, welcomeDiv);
            }, 1500);
        } else {
            showMessage(registerMessage, result.message, 'error');
        }
    });


    // Add transition styles to all cards
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    });
});
