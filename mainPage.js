document.addEventListener('DOMContentLoaded', function() {
    // 显示用户名
    const userName = localStorage.getItem('username');
    if (userName) {
        document.getElementById('userName').textContent = userName;
    }

    // 检查是否是游客模式
    const isGuestMode = localStorage.getItem('isGuestMode') === 'true';
    if (isGuestMode) {
        // 为游客模式添加视觉提示
        document.getElementById('userName').innerHTML = '<span class="material-icons">account_circle</span> Guest';
        document.getElementById('userName').style.color = '#757575';
        
        // 添加游客模式通知条
        const guestBanner = document.createElement('div');
        guestBanner.className = 'guest-banner';
        guestBanner.innerHTML = `
            <span class="material-icons">info</span>
            <div>
                <p><strong>Guest Mode</strong> - Some features are limited</p>
                <p class="guest-banner-detail">Sign in for personalized recommendations and price alerts</p>
            </div>
            <button id="guestSignInBtn" class="btn btn-primary btn-sm">Sign In</button>
        `;
        document.querySelector('.main-container').prepend(guestBanner);
        
        // 绑定登录按钮事件
        document.getElementById('guestSignInBtn').addEventListener('click', function() {
            window.location.href = 'popup.html';
        });
    }

    // 处理标签切换
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 移除所有活动状态
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // 添加当前活动状态
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');

            // 如果切换到价格趋势标签，初始化图表
            if (tabId === 'price-trends') {
                initChart();
            }

            // 游客模式下，点击某些功能时显示限制提示
            if (isGuestMode && (tabId === 'reviews' || tabId === 'price-compare')) {
                const restrictedFeatureMessage = document.createElement('div');
                restrictedFeatureMessage.className = 'restricted-feature-message';
                restrictedFeatureMessage.innerHTML = `
                    <span class="material-icons">lock</span>
                    <p>This feature has limited functionality in guest mode</p>
                    <button id="upgradeAccountBtn" class="btn btn-secondary btn-sm">Sign In to Unlock</button>
                `;
                
                const tabPane = document.getElementById(tabId);
                // 检查是否已经有限制提示
                if (!tabPane.querySelector('.restricted-feature-message')) {
                    tabPane.prepend(restrictedFeatureMessage);
                }
                
                document.getElementById('upgradeAccountBtn').addEventListener('click', function() {
                    window.location.href = 'popup.html';
                });
            }
        });
    });

    // 处理退出登录
    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.removeItem('username');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('isGuestMode');
        window.location.href = 'popup.html';
    });

    // 初始化UI - 默认显示第一个标签
    tabButtons[0].click();

    // 加载最近查看的产品数据
    loadProductData();
    
    // 监听来自background脚本的产品数据更新
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === 'updateProductData') {
            updateProductDisplay(request.data);
            sendResponse({success: true});
        }
        return true;
    });
});

// 从Chrome存储中加载产品数据
function loadProductData() {
    chrome.storage.local.get('recentProduct', function(result) {
        if (result.recentProduct) {
            console.log('Loaded saved product data:', result.recentProduct);
            updateProductDisplay(result.recentProduct);
        } else {
            console.log('No saved product data found');
            // 如果没有保存的产品数据，保留默认显示
            initMockData();
        }
    });
}

// 使用从Amazon提取的数据更新产品显示
function updateProductDisplay(productData) {
    if (!productData) return;
    
    // 更新产品标题
    const productTitleElement = document.getElementById('productTitle');
    if (productTitleElement && productData.title) {
        productTitleElement.textContent = productData.title;
    }
    
    // 更新产品价格
    const productPriceElement = document.getElementById('productPrice');
    if (productPriceElement && productData.price) {
        productPriceElement.textContent = productData.price;
    }
    
    // 更新产品图片
    const productImageElement = document.getElementById('productImage');
    if (productImageElement && productData.imageUrl) {
        productImageElement.src = productData.imageUrl;
        productImageElement.alt = productData.title || 'Product Image';
    }
    
    // 如果图表已经初始化，更新图表标题
    if (typeof CanvasJS !== 'undefined' && 
        CanvasJS.Chart && 
        document.getElementById('priceChartContainer')) {
        initChart(productData.title);
    }
    
    console.log('Product display updated with extracted data');
}

// 初始化模拟数据
function initMockData() {
    // 初始化评论统计数据
    initReviewStats();
    
    // 初始化相似产品数据
    initSimilarProducts();
    
    // 初始化价格比较数据
    initPriceComparison();

    initChart();
}

function initChart(productTitle) {
    // Initialize chart if CanvasJS is available
    if (typeof CanvasJS !== 'undefined' && document.getElementById('priceChartContainer')) {
        var chart = new CanvasJS.Chart("priceChartContainer", {
            animationEnabled: true,
            exportEnabled: true,
            title: {
                text: productTitle || "15.6 Laptop PC 16GB DDR4 512GB SSD, HD Laptop Computer AMD Ryzen 5 3500U Processor AMD"
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
                    { x: new Date(2025, 2, 1), y: 600 },  // March 1, 2025
                    { x: new Date(2025, 2, 5), y: 620 },  // March 5, 2025
                    { x: new Date(2025, 2, 10), y: 615 }, // March 10, 2025
                    { x: new Date(2025, 2, 15), y: 630 }, // March 15, 2025
                    { x: new Date(2025, 2, 20), y: 640 }, // March 20, 2025
                    { x: new Date(2025, 2, 25), y: 650 }, // March 25, 2025
                    { x: new Date(2025, 2, 30), y: 670 }  // March 30, 2025
                ]
            }]
        });
        chart.render();
    }
}

// 初始化评论统计数据
function initReviewStats() {
    const positiveBar = document.querySelector('.positive .fill');
    const neutralBar = document.querySelector('.neutral .fill');
    const negativeBar = document.querySelector('.negative .fill');
    
    const positivePercent = document.querySelector('.positive .percent');
    const neutralPercent = document.querySelector('.neutral .percent');
    const negativePercent = document.querySelector('.negative .percent');
    
    // 设置模拟数据
    positiveBar.style.width = '75%';
    neutralBar.style.width = '15%';
    negativeBar.style.width = '10%';
    
    positivePercent.textContent = '75%';
    neutralPercent.textContent = '15%';
    negativePercent.textContent = '10%';
}

// 初始化相似产品数据
function initSimilarProducts() {
    // 模拟数据已经在HTML中硬编码，这里不需要额外操作
    // 在实际开发中，这里应该通过API获取数据并动态生成产品卡片
}

// 初始化价格比较数据
function initPriceComparison() {
    // 模拟数据已经在HTML中硬编码，这里不需要额外操作
    // 在实际开发中，这里应该通过API获取数据并动态生成商店列表
}

// 更新popup.js中的登录代码，以便登录后跳转到mainPage.html
// 这个函数应该在popup.js中实现，这里只是说明
function updateLoginRedirect() {
    // 在登录成功后:
    // localStorage.setItem('username', username);
    // localStorage.setItem('isLoggedIn', 'true');
    // window.location.href = 'mainPage.html';
} 