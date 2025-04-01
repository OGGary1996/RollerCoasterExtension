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
                loadPriceHistory();
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
            // 同时加载价格历史数据
            loadPriceHistory(request.data.productId);
            sendResponse({success: true});
        } else if (request.action === 'priceHistoryUpdated') {
            // 更新价格历史图表
            updatePriceHistoryChart(request.priceHistory);
            updatePriceInsights(request.priceHistory);
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
            // 加载价格历史数据
            loadPriceHistory(result.recentProduct.productId);
        } else {
            console.log('No saved product data found');
            // 如果没有保存的产品数据，保留默认显示
            initMockData();
        }
    });
}

// 加载价格历史数据
function loadPriceHistory(productId) {
    if (!productId) {
        // 如果没有产品ID，尝试从存储中获取最近的产品
        chrome.storage.local.get('recentProduct', function(result) {
            if (result.recentProduct && result.recentProduct.productId) {
                loadPriceHistoryData(result.recentProduct.productId);
            } else {
                console.log('No product ID available for price history');
                // 使用模拟数据初始化图表
                updatePriceHistoryChart(null);
            }
        });
    } else {
        loadPriceHistoryData(productId);
    }
}

// 加载特定产品的价格历史数据
function loadPriceHistoryData(productId) {
    chrome.storage.local.get(['priceHistory_' + productId], function(result) {
        if (result && result['priceHistory_' + productId]) {
            console.log('Loaded price history data for product:', productId);
            updatePriceHistoryChart(result['priceHistory_' + productId]);
            updatePriceInsights(result['priceHistory_' + productId]);
        } else {
            console.log('No price history data found for product:', productId);
            // 使用模拟数据初始化图表
            updatePriceHistoryChart(null);
        }
    });
}

// 更新价格历史图表
function updatePriceHistoryChart(priceHistory) {
    // 获取当前显示的产品信息
    chrome.storage.local.get('recentProduct', function(result) {
        const productData = result.recentProduct;
        let chartTitle = "Product Price History";
        
        if (productData && productData.title) {
            chartTitle = productData.title;
        }
        
        // 如果没有价格历史数据，生成一些模拟数据
        if (!priceHistory || priceHistory.length === 0) {
            const mockPriceHistory = generateMockPriceData();
            initChart(chartTitle, mockPriceHistory);
        } else {
            // 确保日期是Date对象
            const formattedPriceHistory = priceHistory.map(point => {
                return {
                    x: new Date(point.x),
                    y: point.y
                };
            });
            
            initChart(chartTitle, formattedPriceHistory);
        }
    });
}

// 生成模拟价格数据
function generateMockPriceData() {
    const now = new Date();
    const priceData = [];
    
    // 生成过去6个月的每周价格数据
    for (let i = 26; i >= 0; i--) {
        const date = new Date();
        date.setDate(now.getDate() - (i * 7)); // 每7天一个数据点
        
        // 添加一些随机波动
        const basePrice = 300;
        const priceVariation = Math.random() * 100 - 50; // -50到+50的随机变化
        
        priceData.push({
            x: date,
            y: Math.max(100, Math.round(basePrice + priceVariation))
        });
    }
    
    return priceData;
}

// 更新价格洞察区域
function updatePriceInsights(priceHistory) {
    if (!priceHistory || priceHistory.length === 0) {
        return;
    }
    
    // 分析价格历史
    const insights = analyzePriceHistory(priceHistory);
    
    // 更新价格比较
    const priceCompareAvg = document.getElementById('priceCompareAvg');
    if (priceCompareAvg) {
        if (insights.priceChangePct > 0) {
            priceCompareAvg.textContent = `${insights.priceChangePct}% higher than last month`;
            document.getElementById('priceChange').className = 'price-change price-up';
            document.getElementById('priceChange').innerHTML = `
                <span class="material-icons">arrow_upward</span>
                <span>${insights.priceChangePct}% from last month</span>
            `;
        } else if (insights.priceChangePct < 0) {
            priceCompareAvg.textContent = `${Math.abs(insights.priceChangePct)}% lower than last month`;
            document.getElementById('priceChange').className = 'price-change price-down';
            document.getElementById('priceChange').innerHTML = `
                <span class="material-icons">arrow_downward</span>
                <span>${Math.abs(insights.priceChangePct)}% from last month</span>
            `;
        } else {
            priceCompareAvg.textContent = `Same as last month`;
            document.getElementById('priceChange').className = 'price-change';
            document.getElementById('priceChange').innerHTML = `
                <span class="material-icons">drag_handle</span>
                <span>No change from last month</span>
            `;
        }
    }
    
    // 更新最低价格
    const lowestPriceElement = document.getElementById('lowestPrice');
    if (lowestPriceElement) {
        const lowestDate = new Date(priceHistory.find(p => p.y === insights.lowestPrice).x);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        lowestPriceElement.textContent = `$${insights.lowestPrice} (${months[lowestDate.getMonth()]} ${lowestDate.getDate()})`;
    }
    
    // 更新价格推荐
    const priceRecommendation = document.getElementById('priceRecommendation');
    if (priceRecommendation) {
        priceRecommendation.textContent = insights.recommendation;
    }
}

// 分析价格历史，生成洞察
function analyzePriceHistory(priceHistory) {
    if (!priceHistory || priceHistory.length === 0) {
        return {
            currentPrice: 'N/A',
            lowestPrice: 'N/A',
            highestPrice: 'N/A',
            averagePrice: 'N/A',
            priceChange: 0,
            priceChangePct: 0,
            recommendation: '无足够数据提供购买建议'
        };
    }
    
    // 将日期字符串转换为Date对象
    const processedHistory = priceHistory.map(p => ({
        x: new Date(p.x),
        y: p.y
    }));
    
    // 按日期排序
    processedHistory.sort((a, b) => a.x - b.x);
    
    // 获取当前价格（最新数据点）
    const currentPrice = processedHistory[processedHistory.length - 1].y;
    
    // 计算最低价格
    const lowestPrice = Math.min(...processedHistory.map(p => p.y));
    
    // 计算最高价格
    const highestPrice = Math.max(...processedHistory.map(p => p.y));
    
    // 计算平均价格
    const sum = processedHistory.reduce((acc, curr) => acc + curr.y, 0);
    const averagePrice = Math.round(sum / processedHistory.length);
    
    // 计算过去30天价格变化
    let priceChange = 0;
    let priceChangePct = 0;
    
    if (processedHistory.length > 4) { // 假设每周一个数据点，4个数据点约等于一个月
        const lastMonthPrice = processedHistory[processedHistory.length - 5].y;
        priceChange = currentPrice - lastMonthPrice;
        priceChangePct = Math.round((priceChange / lastMonthPrice) * 100);
    }
    
    // 生成购买建议
    let recommendation = '';
    if (currentPrice <= lowestPrice * 1.05) {
        recommendation = '当前价格接近历史最低，是购买的好时机';
    } else if (currentPrice >= averagePrice * 1.1) {
        recommendation = '当前价格高于平均价格10%以上，建议等待降价';
    } else if (priceChangePct < -5) {
        recommendation = '价格最近下跌，可能继续下跌，建议观望';
    } else if (priceChangePct > 5) {
        recommendation = '价格最近上涨，如需购买建议尽快行动';
    } else {
        recommendation = '价格稳定，接近平均价格，适合购买';
    }
    
    return {
        currentPrice,
        lowestPrice,
        highestPrice,
        averagePrice,
        priceChange,
        priceChangePct,
        recommendation
    };
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

    // 初始化价格历史图表
    updatePriceHistoryChart(null);
}

function initChart(productTitle, priceData) {
    // Initialize chart if CanvasJS is available
    if (typeof CanvasJS !== 'undefined' && document.getElementById('priceChartContainer')) {
        var chart = new CanvasJS.Chart("priceChartContainer", {
            animationEnabled: true,
            theme: "light2",
            title: {
                text: productTitle || "Product Price History",
                fontSize: 16,
                fontWeight: "normal",
                fontFamily: "'Roboto', sans-serif"
            },
            axisX: {
                valueFormatString: "MMM DD, YYYY",
                labelFontSize: 12,
                gridThickness: 1,
                gridColor: "rgba(200,200,200,0.2)"
            },
            axisY: {
                title: "Price",
                titleFontSize: 14,
                prefix: "$",
                gridThickness: 1,
                gridColor: "rgba(200,200,200,0.2)"
            },
            toolTip: {
                shared: true,
                contentFormatter: function(e) {
                    var content = "<div style='padding:10px;'>";
                    content += "<strong>" + CanvasJS.formatDate(e.entries[0].dataPoint.x, "MMM DD, YYYY") + "</strong>";
                    content += "<br/><span style='color: #2979ff;'>Price: $" + e.entries[0].dataPoint.y + "</span>";
                    content += "</div>";
                    return content;
                }
            },
            data: [{
                type: "line",
                xValueFormatString: "MMM DD, YYYY",
                color: "#2979ff",
                lineThickness: 3,
                markerSize: 6,
                dataPoints: priceData
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