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
            if (tabId === 'priceTrends') {
                initPriceChart();
            }

            // 游客模式下，点击某些功能时显示限制提示
            if (isGuestMode && (tabId === 'reviewAnalysis' || tabId === 'priceComparison')) {
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

    // 初始化价格趋势图表
    function initPriceChart() {
        if (typeof CanvasJS !== 'undefined') {
            const chart = new CanvasJS.Chart("priceHistoryChart", {
                animationEnabled: true,
                theme: "light2",
                title: {
                    text: "价格历史走势",
                    fontSize: 16,
                    fontFamily: "'Roboto', 'Noto Sans SC', sans-serif",
                    fontWeight: "normal"
                },
                axisX: {
                    valueFormatString: "MMM DD",
                    crosshair: {
                        enabled: true,
                        snapToDataPoint: true
                    }
                },
                axisY: {
                    title: "价格 (¥)",
                    titleFontSize: 14,
                    includeZero: false,
                    suffix: "¥"
                },
                legend: {
                    cursor: "pointer",
                    verticalAlign: "bottom",
                    horizontalAlign: "center",
                    fontSize: 12
                },
                toolTip: {
                    shared: true
                },
                data: [{
                    type: "line",
                    name: "商品价格",
                    showInLegend: true,
                    xValueFormatString: "MMM DD, YYYY",
                    color: "#2979ff",
                    dataPoints: [
                        { x: new Date(2023, 9, 1), y: 2599 },
                        { x: new Date(2023, 9, 15), y: 2599 },
                        { x: new Date(2023, 10, 1), y: 2499 },
                        { x: new Date(2023, 10, 15), y: 2399 },
                        { x: new Date(2023, 11, 1), y: 2299 },
                        { x: new Date(2023, 11, 15), y: 2399 },
                        { x: new Date(2024, 0, 1), y: 2499 },
                        { x: new Date(2024, 0, 15), y: 2199 },
                        { x: new Date(2024, 1, 1), y: 2149 },
                        { x: new Date(2024, 1, 15), y: 2099 }
                    ]
                }]
            });
            chart.render();
        } else {
            console.error("CanvasJS library not loaded");
            document.getElementById("priceHistoryChart").innerHTML = `
                <div style="height: 100%; display: flex; align-items: center; justify-content: center;">
                    <p>图表库未加载，请检查网络连接</p>
                </div>
            `;
        }
    }

    // 处理退出登录
    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.removeItem('username');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('isGuestMode');
        window.location.href = 'popup.html';
    });

    // 初始化UI - 默认显示第一个标签
    tabButtons[0].click();

    // 填充模拟数据
    initMockData();
});

// 初始化模拟数据
function initMockData() {
    // 初始化评论统计数据
    initReviewStats();
    
    // 初始化相似产品数据
    initSimilarProducts();
    
    // 初始化价格比较数据
    initPriceComparison();
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