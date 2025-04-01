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
    if (isLoggedIn) {
        // Hide all other divs and show main interface
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

    // Show chart page
    if (chartBtn) {
        chartBtn.addEventListener('click', function() {
            if (typeof $ !== 'undefined') {
                $('#features').hide();
                $('#chart').show();
                $('#chartContainer').show();
            } else {
                // Fallback if jQuery is not available
                document.getElementById('features').style.display = 'none';
                document.getElementById('chart').style.display = 'block';
                document.getElementById('chartContainer').style.display = 'block';
            }
        });
    }

    // Back to features from chart
    if (backToFeaturesFromChart) {
        backToFeaturesFromChart.addEventListener('click', function() {
            if (typeof $ !== 'undefined') {
                $('#features').show();
                $('#chart').hide();
                $('#chartContainer').hide();
            } else {
                // Fallback if jQuery is not available
                document.getElementById('features').style.display = 'block';
                document.getElementById('chart').style.display = 'none';
                document.getElementById('chartContainer').style.display = 'none';
            }
        });
    }

    // Initialize chart if CanvasJS is available
    if (typeof CanvasJS !== 'undefined' && document.getElementById('chartContainer')) {
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

    // Add transition styles to all cards
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    });
});

// Function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Function to format price
function formatPrice(price) {
    return new Intl.NumberFormat('en-CA', {
        style: 'currency',
        currency: 'CAD'
    }).format(price);
}

// Function to create price history chart
function createPriceChart(priceHistory) {
    const ctx = document.createElement('canvas');
    ctx.id = 'priceChart';
    
    const data = {
        labels: priceHistory.map(point => formatDate(point.timestamp)),
        datasets: [{
            label: 'Price History',
            data: priceHistory.map(point => point.price),
            borderColor: '#B12704',
            backgroundColor: 'rgba(177, 39, 4, 0.1)',
            tension: 0.1
        }]
    };
    
    const config = {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return formatPrice(value);
                        }
                    }
                }
            }
        }
    };
    
    new Chart(ctx, config);
    return ctx;
}

// Function to display product information
function displayProductInfo(productInfo) {
    const currentProductDiv = document.getElementById('current-product');
    
    if (!productInfo) {
        currentProductDiv.innerHTML = '<div class="no-data">No beauty product information available</div>';
        return;
    }
    
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    
    // Create badges for Prime and Sale status
    const badges = [];
    if (productInfo.isPrime) badges.push('<span class="badge prime">Prime</span>');
    if (productInfo.isOnSale) badges.push('<span class="badge sale">Sale</span>');
    
    productCard.innerHTML = `
        <div class="product-header">
            <div class="product-title">${productInfo.title}</div>
            <div class="product-badges">${badges.join('')}</div>
        </div>
        <div class="product-details">
            <div class="brand">${productInfo.brand}</div>
            <div class="rating">
                ${productInfo.rating} ⭐ (${productInfo.reviewCount} reviews)
            </div>
        </div>
        <div class="current-price">
            Current Price: <span class="price">${formatPrice(productInfo.price)}</span>
        </div>
        <div class="chart-container"></div>
    `;
    
    currentProductDiv.innerHTML = '';
    currentProductDiv.appendChild(productCard);
    
    // Add price history chart
    if (productInfo.priceHistory && productInfo.priceHistory.length > 0) {
        const chartContainer = productCard.querySelector('.chart-container');
        const chart = createPriceChart(productInfo.priceHistory);
        chartContainer.appendChild(chart);
    }
}

// Function to display price history
function displayPriceHistory(priceHistory) {
    const priceHistoryDiv = document.getElementById('price-history');
    
    if (!priceHistory || priceHistory.length === 0) {
        priceHistoryDiv.innerHTML = '<div class="no-data">No price history available</div>';
        return;
    }
    
    const historyList = document.createElement('div');
    historyList.className = 'price-history';
    
    // Sort price history by date (newest first)
    const sortedHistory = [...priceHistory].sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    sortedHistory.forEach(point => {
        const pricePoint = document.createElement('div');
        pricePoint.className = 'price-point';
        pricePoint.innerHTML = `
            <span class="price">${formatPrice(point.price)}</span>
            <span class="date">${formatDate(point.timestamp)}</span>
        `;
        historyList.appendChild(pricePoint);
    });
    
    priceHistoryDiv.innerHTML = '';
    priceHistoryDiv.appendChild(historyList);
}

// Get current tab information
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentTab = tabs[0];
    
    // Check if we're on an Amazon Canada product page
    if (currentTab.url.includes('amazon.ca') && currentTab.url.includes('/dp/')) {
        // Get product information from content script
        chrome.tabs.sendMessage(currentTab.id, {action: 'getProductInfo'}, function(response) {
            if (response && response.asin) {
                // Get price history from background script
                chrome.runtime.sendMessage({action: 'getProductHistory', asin: response.asin}, function(productData) {
                    if (productData) {
                        displayProductInfo(productData);
                        displayPriceHistory(productData.priceHistory);
                    } else {
                        displayProductInfo(response);
                        displayPriceHistory([]);
                    }
                });
            } else {
                displayProductInfo(null);
                displayPriceHistory([]);
            }
        });
    } else {
        displayProductInfo(null);
        displayPriceHistory([]);
    }
});
