// 背景脚本 - 处理产品数据和消息传递
console.log('Smart Shopping Assistant background script loaded');

// 存储最近提取的产品数据
let recentProductData = null;

// 监听来自content脚本的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'productData') {
        console.log('Received product data from content script:', request.data);
        
        // 存储产品数据
        recentProductData = request.data;
        
        // 从URL中提取产品ID
        const productId = extractProductId(request.data.url);
        
        // 添加产品ID到数据中
        if (productId) {
            recentProductData.productId = productId;
        }
        
        // 将数据存储到Chrome存储中
        chrome.storage.local.set({
            'recentProduct': recentProductData
        }, function() {
            console.log('Product data saved to storage');
            
            // 如果提取到了产品ID，生成并保存价格历史数据
            if (productId) {
                generatePriceHistory(productId, request.data.price);
            }
        });
        
        // 通知任何正在打开的popup或mainPage
        chrome.runtime.sendMessage({
            action: 'updateProductData',
            data: recentProductData
        });
        
        sendResponse({success: true});
    }
    
    // 必须返回true以支持异步响应
    return true;
});

// 从Amazon URL中提取产品ID
function extractProductId(url) {
    if (!url) return null;
    
    try {
        // 尝试提取产品ID，格式通常是：/dp/XXXXXXXXXX/ 或 /gp/product/XXXXXXXXXX/
        let productId = null;
        
        // 匹配/dp/后面的产品ID
        const dpMatch = url.match(/\/dp\/([A-Z0-9]{10})/i);
        if (dpMatch && dpMatch[1]) {
            productId = dpMatch[1];
        }
        
        // 如果没有找到，尝试匹配/product/后面的产品ID
        if (!productId) {
            const productMatch = url.match(/\/product\/([A-Z0-9]{10})/i);
            if (productMatch && productMatch[1]) {
                productId = productMatch[1];
            }
        }
        
        return productId;
    } catch (error) {
        console.error('Error extracting product ID:', error);
        return null;
    }
}

// 生成并保存价格历史数据
function generatePriceHistory(productId, currentPrice) {
    if (!productId) return;
    
    // 检查是否已经有该产品的价格历史数据
    chrome.storage.local.get(['priceHistory_' + productId], function(result) {
        if (result && result['priceHistory_' + productId]) {
            console.log('Price history already exists for product:', productId);
            
            // 如果已有数据，更新最新价格点并通知主页面
            updateLatestPricePoint(productId, currentPrice);
        } else {
            console.log('Generating new price history for product:', productId);
            
            // 创建一个模拟的价格历史数据
            createMockPriceHistory(productId, currentPrice);
        }
    });
}

// 更新最新价格点
function updateLatestPricePoint(productId, currentPrice) {
    if (!productId || !currentPrice) return;
    
    // 获取已有的价格历史数据
    chrome.storage.local.get(['priceHistory_' + productId], function(result) {
        if (result && result['priceHistory_' + productId]) {
            const priceHistory = result['priceHistory_' + productId];
            
            // 解析当前价格（移除货币符号和逗号）
            let numericPrice = currentPrice;
            if (typeof currentPrice === 'string') {
                numericPrice = parseFloat(currentPrice.replace(/[^0-9.]/g, ''));
            }
            
            // 如果无法解析为数字，则退出
            if (isNaN(numericPrice)) return;
            
            // 添加最新价格点
            const now = new Date();
            
            // 检查最后一个价格点的日期，如果是今天的就更新它
            const lastPoint = priceHistory[priceHistory.length - 1];
            const lastDate = new Date(lastPoint.x);
            
            if (lastDate.toDateString() === now.toDateString()) {
                // 更新今天的价格点
                lastPoint.y = numericPrice;
            } else {
                // 添加新的价格点
                priceHistory.push({
                    x: now,
                    y: numericPrice
                });
            }
            
            // 保存更新后的价格历史
            chrome.storage.local.set({
                ['priceHistory_' + productId]: priceHistory
            }, function() {
                console.log('Updated price history with latest price for product:', productId);
                
                // 通知主页面价格历史已更新
                chrome.runtime.sendMessage({
                    action: 'priceHistoryUpdated',
                    productId: productId,
                    priceHistory: priceHistory
                });
            });
        }
    });
}

// 创建模拟价格历史数据
function createMockPriceHistory(productId, currentPrice) {
    if (!productId) return;
    
    const now = new Date();
    const priceHistory = [];
    
    // 解析当前价格（移除货币符号和逗号）
    let basePrice = 300; // 默认基础价格
    if (currentPrice) {
        try {
            if (typeof currentPrice === 'string') {
                basePrice = parseFloat(currentPrice.replace(/[^0-9.]/g, ''));
            } else {
                basePrice = currentPrice;
            }
            
            if (isNaN(basePrice)) {
                basePrice = 300;
            }
        } catch (e) {
            console.error('Error parsing current price:', e);
        }
    }
    
    // 生成过去6个月的每周价格数据
    for (let i = 0; i < 26; i++) { // 26周 ≈ 6个月
        const date = new Date();
        date.setDate(now.getDate() - (i * 7)); // 每7天一个数据点
        
        // 添加一些随机波动，但保持价格在合理范围内
        const priceVariation = Math.random() * (basePrice * 0.2) - (basePrice * 0.1); // 在 ±10% 的范围内波动
        const historicalPrice = Math.max(basePrice * 0.5, Math.round(basePrice + priceVariation));
        
        // 特定时期添加促销折扣（例如黑色星期五、Prime Day等）
        let price = historicalPrice;
        
        // 模拟黑色星期五折扣（11月最后一周）
        const month = date.getMonth();
        const dayOfMonth = date.getDate();
        
        if (month === 10 && dayOfMonth >= 25) { // 11月下旬（黑色星期五附近）
            price = Math.round(price * 0.8); // 20%折扣
        }
        // 模拟假日季折扣（12月）
        else if (month === 11) {
            price = Math.round(price * 0.9); // 10%折扣
        }
        // 模拟Prime Day折扣（7月中旬）
        else if (month === 6 && dayOfMonth >= 10 && dayOfMonth <= 17) {
            price = Math.round(price * 0.85); // 15%折扣
        }
        
        priceHistory.push({
            x: date,
            y: price
        });
        
        // 更新基准价格，使历史价格看起来更自然
        if (Math.random() > 0.7) { // 30%的概率价格会稍微变化
            basePrice = price;
        }
    }
    
    // 确保最后一个数据点与当前价格相符
    if (priceHistory.length > 0) {
        let numericPrice = basePrice;
        if (currentPrice) {
            try {
                if (typeof currentPrice === 'string') {
                    numericPrice = parseFloat(currentPrice.replace(/[^0-9.]/g, ''));
                } else {
                    numericPrice = currentPrice;
                }
                
                if (!isNaN(numericPrice)) {
                    priceHistory[priceHistory.length - 1].y = numericPrice;
                }
            } catch (e) {
                console.error('Error parsing current price for last data point:', e);
            }
        }
    }
    
    // 反转数组，使其按日期升序排列
    priceHistory.sort((a, b) => new Date(a.x) - new Date(b.x));
    
    // 保存价格历史数据
    chrome.storage.local.set({
        ['priceHistory_' + productId]: priceHistory
    }, function() {
        console.log('Generated and saved price history for product:', productId);
        
        // 通知主页面价格历史已更新
        chrome.runtime.sendMessage({
            action: 'priceHistoryUpdated',
            productId: productId,
            priceHistory: priceHistory
        });
    });
}

// 监听标签页更新事件
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    // 检查标签页是否已完成加载且URL是Amazon产品页面
    if (changeInfo.status === 'complete' && 
        tab.url && 
        (tab.url.includes('amazon.com') || tab.url.includes('amazon.ca') || tab.url.includes('amazon.co.uk')) &&
        (tab.url.includes('/dp/') || tab.url.includes('/gp/product/'))) {
        
        // 向内容脚本发送消息，请求提取产品数据
        chrome.tabs.sendMessage(tabId, {
            action: 'getProductData'
        }, function(response) {
            if (chrome.runtime.lastError) {
                console.error('Error sending message to content script:', chrome.runtime.lastError);
            } else if (response && response.success) {
                console.log('Successfully requested product data');
            }
        });
    }
});
