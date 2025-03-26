import authService from './services/auth.js';

document.addEventListener('DOMContentLoaded', async function() {
    const featuresDiv = document.getElementById('features');
    const welcomeDiv = document.getElementById('welcome');
    const loginDiv = document.getElementById('login');
    const registerDiv = document.getElementById('register');
    const chartDiv = document.getElementById('chart'); // 图表容器
    const getStartedBtn = document.getElementById('getStartedBtn');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const chartBtn = document.getElementById('chartBtn'); // 图表按钮
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const backToWelcomeFromLogin = document.getElementById('backToWelcomeFromLogin');
    const backToWelcomeFromRegister = document.getElementById('backToWelcomeFromRegister');
    const backToFeaturesFromChart = document.getElementById('backToFeaturesFromChart'); // 返回按钮
    
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
    if (isLoggedIn) {
        // Hide all other divs and show main interface
        featuresDiv.style.display = 'none';
        welcomeDiv.style.display = 'none';
        loginDiv.style.display = 'none';
        registerDiv.style.display = 'none';
        // TODO: Show main interface
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
            // TODO: Show main interface after a short delay
            setTimeout(() => {
                console.log('Redirecting to main interface...');
                // TODO: Implement redirect
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

    // Show chart page
    if (chartBtn) {
        chartBtn.addEventListener('click', function() {
            switchPage(featuresDiv, chartDiv);
        });
    }

    // Back to features from chart
    if (backToFeaturesFromChart) {
        backToFeaturesFromChart.addEventListener('click', function() {
            switchPage(chartDiv, featuresDiv);
        });
    }

    // Initialize chart if chart container exists
    const chartContainer = document.getElementById('chartContainer');
    if (chartContainer && typeof CanvasJS !== 'undefined') {
        var chart = new CanvasJS.Chart("chartContainer", {
            animationEnabled: true,
            exportEnabled: true,
            title: {
                text: "Acer Computer Price Data for April 2025"
            },
            axisY: {
                title: "Price in CAD",
                interval: 100,
                prefix: "$",
                valueFormatString: "#,###"
            },
            data: [{
                type: "stepLine",
                yValueFormatString: "$#,###",
                xValueFormatString: "MMM DD, YYYY",
                markerSize: 5,
                dataPoints: [
                    { x: new Date(2025, 3, 1), y: 600 },  // April 1, 2025
                    { x: new Date(2025, 3, 5), y: 620 },  // April 5, 2025
                    { x: new Date(2025, 3, 10), y: 615 }, // April 10, 2025
                    { x: new Date(2025, 3, 15), y: 630 }, // April 15, 2025
                    { x: new Date(2025, 3, 20), y: 640 }, // April 20, 2025
                    { x: new Date(2025, 3, 25), y: 650 }, // April 25, 2025
                    { x: new Date(2025, 3, 30), y: 670 }  // April 30, 2025
                ]
            }]
        });
        chart.render();
    }

    // Add transition styles to all cards - UI分支的功能
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    });
});
