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
async function loadPriceHistoryData(productId) {
    try {
        // 显示加载中状态
        showLoadingState();
        
        // 尝试从amazonPriceHistoryService获取30天价格历史
        const result = await amazonPriceHistoryService.getPriceHistory(productId);
        
        if (result && result.priceHistory && result.priceHistory.length > 0) {
            console.log('Loaded 30-day price history data for product:', productId);
            console.log('Analysis:', result.analysis);
            
            // 更新价格历史图表
            updatePriceHistoryChart(result.priceHistory);
            
            // 更新价格洞察
            updatePriceInsightsWithAnalysis(result.analysis);
            
            // 保存价格历史数据到本地存储（可选，用于缓存）
            savePriceHistoryToStorage(productId, result);
        } else {
            console.log('Failed to get price history, falling back to mock data');
            // 回退到普通模拟数据
            fallbackToMockPriceHistory(productId);
        }
    } catch (error) {
        console.error('Error loading price history data:', error);
        // 出错时回退到模拟数据
        fallbackToMockPriceHistory(productId);
    } finally {
        // 隐藏加载状态
        hideLoadingState();
    }
}

// 显示加载中状态
function showLoadingState() {
    const chartContainer = document.getElementById('priceChartContainer');
    if (chartContainer) {
        chartContainer.innerHTML = `
            <div class="loading-container" style="display: flex; justify-content: center; align-items: center; height: 100%;">
                <div class="loading-spinner" style="border: 4px solid rgba(0, 0, 0, 0.1); width: 36px; height: 36px; border-radius: 50%; border-left-color: #2979ff; animation: spin 1s linear infinite;"></div>
                <p style="margin-left: 12px;">正在加载价格历史数据...</p>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
    }
    
    // 也可以为洞察区域添加加载状态
    const insightElements = document.querySelectorAll('.price-insights .insight-text p');
    insightElements.forEach(element => {
        element.innerHTML = '<span style="color: #aaa;">加载中...</span>';
    });
}

// 隐藏加载状态
function hideLoadingState() {
    // 图表区域的加载状态会被图表替换，不需要特别处理
    
    // 如果洞察区域还保留着加载状态，可以清除
    const insightElements = document.querySelectorAll('.price-insights .insight-text p');
    insightElements.forEach(element => {
        if (element.innerHTML.includes('加载中')) {
            element.innerHTML = '';
        }
    });
}

// 回退到模拟价格历史数据
function fallbackToMockPriceHistory(productId) {
    chrome.storage.local.get(['priceHistory_' + productId], function(result) {
        if (result && result['priceHistory_' + productId]) {
            console.log('Using previously stored price history for product:', productId);
            updatePriceHistoryChart(result['priceHistory_' + productId]);
            updatePriceInsights(result['priceHistory_' + productId]);
        } else {
            console.log('No stored price history, using generated mock data');
            updatePriceHistoryChart(null);
        }
    });
}

// 将价格历史数据保存到本地存储（用于缓存）
function savePriceHistoryToStorage(productId, data) {
    if (!productId || !data || !data.priceHistory) return;
    
    chrome.storage.local.set({
        ['priceHistory_' + productId]: data.priceHistory,
        ['priceHistoryAnalysis_' + productId]: data.analysis,
        ['priceHistoryTimestamp_' + productId]: new Date().toISOString()
    }, function() {
        console.log('Saved price history data to storage for product:', productId);
    });
}

// 使用分析数据更新价格洞察区域
function updatePriceInsightsWithAnalysis(analysis) {
    if (!analysis) return;
    
    // 更新价格比较
    const priceCompareAvg = document.getElementById('priceCompareAvg');
    if (priceCompareAvg) {
        if (analysis.priceChangePct > 0) {
            priceCompareAvg.textContent = `${analysis.priceChangePct}% higher than 30 days ago`;
            document.getElementById('priceChange').className = 'price-change price-up';
            document.getElementById('priceChange').innerHTML = `
                <span class="material-icons">arrow_upward</span>
                <span>${analysis.priceChangePct}% from 30 days ago</span>
            `;
        } else if (analysis.priceChangePct < 0) {
            priceCompareAvg.textContent = `${Math.abs(analysis.priceChangePct)}% lower than 30 days ago`;
            document.getElementById('priceChange').className = 'price-change price-down';
            document.getElementById('priceChange').innerHTML = `
                <span class="material-icons">arrow_downward</span>
                <span>${Math.abs(analysis.priceChangePct)}% from 30 days ago</span>
            `;
        } else {
            priceCompareAvg.textContent = `Same as 30 days ago`;
            document.getElementById('priceChange').className = 'price-change';
            document.getElementById('priceChange').innerHTML = `
                <span class="material-icons">drag_handle</span>
                <span>No change from 30 days ago</span>
            `;
        }
    }
    
    // 更新最低价格
    const lowestPriceElement = document.getElementById('lowestPrice');
    if (lowestPriceElement) {
        lowestPriceElement.textContent = `$${analysis.lowestPrice} (30-day low)`;
    }
    
    // 更新价格推荐
    const priceRecommendation = document.getElementById('priceRecommendation');
    if (priceRecommendation) {
        priceRecommendation.textContent = analysis.recommendation;
    }
}

// 更新价格历史图表
function updatePriceHistoryChart(priceHistory) {
    // 获取当前显示的产品信息
    chrome.storage.local.get('recentProduct', function(result) {
        const productData = result.recentProduct;
        let chartTitle = "30-Day Price History";
        
        if (productData && productData.title) {
            // 限制标题长度，防止标题过长影响图表显示
            const maxTitleLength = 70;
            chartTitle = productData.title.length > maxTitleLength 
                ? productData.title.substring(0, maxTitleLength) + '...' 
                : productData.title;
        }
        
        // 如果没有价格历史数据，生成一些模拟数据
        if (!priceHistory || priceHistory.length === 0) {
            const mockPriceHistory = generateMockPriceData();
            initChart(chartTitle, mockPriceHistory, true);
        } else {
            // 确保日期是Date对象
            const formattedPriceHistory = priceHistory.map(point => {
                return {
                    x: point.x instanceof Date ? point.x : new Date(point.x),
                    y: point.y
                };
            });
            
            // 对数据进行排序，确保按时间顺序显示
            formattedPriceHistory.sort((a, b) => a.x - b.x);
            
            initChart(chartTitle, formattedPriceHistory, false);
        }
    });
}

// 生成模拟价格数据（现在专门生成30天的每日数据）
function generateMockPriceData() {
    const now = new Date();
    const priceData = [];
    
    // 生成过去30天的每日价格数据
    for (let i = 30; i >= 0; i--) {
        const date = new Date();
        date.setDate(now.getDate() - i);
        
        // 添加一些随机波动
        const basePrice = 300;
        const priceVariation = Math.random() * 60 - 30; // -30到+30的随机变化
        
        priceData.push({
            x: date,
            y: Math.max(100, Math.round(basePrice + priceVariation))
        });
    }
    
    return priceData;
}

function initChart(productTitle, priceData, isMockData) {
    // Initialize chart if CanvasJS is available
    if (typeof CanvasJS !== 'undefined' && document.getElementById('priceChartContainer')) {
        // 设置适当的X轴时间间隔
        const timeInterval = getAppropriateTimeInterval(priceData);
        
        // 添加价格趋势线和平均价格线
        const additionalDataSeries = [];
        
        // 如果不是模拟数据，添加趋势线和平均价格线
        if (!isMockData && priceData.length > 5) {
            // 计算平均价格
            const avgPrice = priceData.reduce((sum, point) => sum + point.y, 0) / priceData.length;
            
            // 添加平均价格线
            additionalDataSeries.push({
                type: "line",
                name: "Average Price",
                color: "rgba(128, 128, 128, 0.7)",
                lineDashType: "dash",
                markerSize: 0,
                lineThickness: 2,
                showInLegend: true,
                legendText: "Average Price",
                dataPoints: [
                    { x: priceData[0].x, y: avgPrice },
                    { x: priceData[priceData.length - 1].x, y: avgPrice }
                ]
            });
            
            // 如果数据点足够，添加趋势线
            if (priceData.length >= 10) {
                const trendLinePoints = calculateTrendLine(priceData);
                additionalDataSeries.push({
                    type: "line",
                    name: "Price Trend",
                    color: "rgba(255, 127, 80, 0.7)",
                    lineDashType: "solid",
                    markerSize: 0,
                    lineThickness: 2,
                    showInLegend: true,
                    legendText: "Price Trend",
                    dataPoints: trendLinePoints
                });
            }
        }
        
        // 突出显示价格最低点
        let lowestPricePoint = null;
        if (priceData.length > 0) {
            lowestPricePoint = priceData.reduce((lowest, point) => 
                point.y < lowest.y ? point : lowest, priceData[0]);
        }
        
        var chart = new CanvasJS.Chart("priceChartContainer", {
            animationEnabled: true,
            theme: "light2",
            title: {
                text: productTitle,
                fontSize: 16,
                fontWeight: "normal",
                fontFamily: "'Roboto', sans-serif",
                padding: 10
            },
            axisX: {
                valueFormatString: "MMM DD",
                labelFontSize: 12,
                gridThickness: 1,
                gridColor: "rgba(200,200,200,0.2)",
                interval: timeInterval.interval,
                intervalType: timeInterval.intervalType,
                labelAngle: -25,
                crosshair: {
                    enabled: true,
                    snapToDataPoint: true
                }
            },
            axisY: {
                title: "Price",
                titleFontSize: 14,
                prefix: "$",
                gridThickness: 1,
                gridColor: "rgba(200,200,200,0.2)",
                crosshair: {
                    enabled: true,
                    snapToDataPoint: true
                }
            },
            toolTip: {
                shared: true,
                contentFormatter: function(e) {
                    var content = "<div style='padding:10px;'>";
                    content += "<strong>" + CanvasJS.formatDate(e.entries[0].dataPoint.x, "MMM DD, YYYY") + "</strong><br/>";
                    
                    // 主价格数据
                    if (e.entries[0]) {
                        content += "<span style='color: " + e.entries[0].dataSeries.color + ";'>●</span> ";
                        content += "Price: <strong>$" + e.entries[0].dataPoint.y + "</strong><br/>";
                    }
                    
                    // 其他数据系列
                    for (let i = 1; i < e.entries.length; i++) {
                        content += "<span style='color: " + e.entries[i].dataSeries.color + ";'>●</span> ";
                        content += e.entries[i].dataSeries.name + ": <strong>$" + e.entries[i].dataPoint.y.toFixed(2) + "</strong><br/>";
                    }
                    
                    content += "</div>";
                    return content;
                }
            },
            legend: {
                cursor: "pointer",
                fontSize: 12,
                itemclick: toggleDataSeries
            },
            data: [
                {
                    type: "line",
                    name: "Price",
                    xValueFormatString: "MMM DD, YYYY",
                    color: "#2979ff",
                    lineThickness: 3,
                    markerSize: 6,
                    showInLegend: true,
                    legendText: "Daily Price",
                    dataPoints: priceData
                },
                ...additionalDataSeries
            ]
        });
        
        // 如果有最低价格点，添加注释
        if (lowestPricePoint && !isMockData) {
            chart.options.annotations = [{
                type: "circle",
                x: lowestPricePoint.x,
                y: lowestPricePoint.y,
                radius: 10,
                borderColor: "#22CC22",
                backgroundColor: "rgba(34, 204, 34, 0.3)",
                toolTipContent: "Lowest Price: $" + lowestPricePoint.y
            }];
        }
        
        chart.render();
    }
}

// 切换数据系列显示
function toggleDataSeries(e) {
    if (typeof e.dataSeries.visible === "undefined" || e.dataSeries.visible) {
        e.dataSeries.visible = false;
    } else {
        e.dataSeries.visible = true;
    }
    e.chart.render();
}

// 根据数据点选择合适的时间间隔
function getAppropriateTimeInterval(priceData) {
    if (!priceData || priceData.length <= 1) {
        return { interval: 5, intervalType: "day" };
    }
    
    // 计算数据的总天数范围
    const firstDate = new Date(priceData[0].x);
    const lastDate = new Date(priceData[priceData.length - 1].x);
    const totalDays = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24));
    
    // 根据天数范围选择合适的间隔
    if (totalDays <= 7) {
        return { interval: 1, intervalType: "day" }; // 每天
    } else if (totalDays <= 14) {
        return { interval: 2, intervalType: "day" }; // 每两天
    } else if (totalDays <= 31) {
        return { interval: 5, intervalType: "day" }; // 每5天
    } else if (totalDays <= 90) {
        return { interval: 2, intervalType: "week" }; // 每两周
    } else {
        return { interval: 1, intervalType: "month" }; // 每月
    }
}

// 计算价格趋势线（简单线性回归）
function calculateTrendLine(priceData) {
    const n = priceData.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    // 使用时间戳作为x值
    const xValues = priceData.map(p => p.x.getTime());
    const yValues = priceData.map(p => p.y);
    
    for (let i = 0; i < n; i++) {
        sumX += xValues[i];
        sumY += yValues[i];
        sumXY += xValues[i] * yValues[i];
        sumX2 += xValues[i] * xValues[i];
    }
    
    const avgX = sumX / n;
    const avgY = sumY / n;
    
    // 计算斜率和y轴截距
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = avgY - slope * avgX;
    
    // 创建趋势线的数据点（只需要起点和终点）
    return [
        { x: priceData[0].x, y: slope * xValues[0] + intercept },
        { x: priceData[n-1].x, y: slope * xValues[n-1] + intercept }
    ];
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