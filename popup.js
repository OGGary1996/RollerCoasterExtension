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
