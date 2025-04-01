// 存储历史记录的最大长度
const MAX_HISTORY_LENGTH = 10;

// 存储商品信息的函数
function saveProductInfo(productInfo) {
    // 保存当前商品信息
    chrome.storage.local.set({ 'currentProduct': productInfo }, function() {
        console.log('当前商品信息已保存:', productInfo);
    });
    
    // 获取历史记录，并将新商品添加到历史记录中
    chrome.storage.local.get(['productHistory'], function(result) {
        let history = result.productHistory || [];
        
        // 检查是否已经存在相同URL的商品
        const existingIndex = history.findIndex(item => item.url === productInfo.url);
        
        if (existingIndex !== -1) {
            // 如果存在相同商品，则更新信息
            history.splice(existingIndex, 1);
        }
        
        // 添加新商品到历史记录开头
        history.unshift(productInfo);
        
        // 限制历史记录长度
        if (history.length > MAX_HISTORY_LENGTH) {
            history = history.slice(0, MAX_HISTORY_LENGTH);
        }
        
        // 保存更新后的历史记录
        chrome.storage.local.set({ 'productHistory': history }, function() {
            console.log('商品历史记录已更新，当前包含', history.length, '个商品');
        });
    });
    
    // 生成模拟的价格历史数据
    generatePriceHistory(productInfo);
}

// 生成模拟的价格历史数据（在实际应用中，这部分可能需要通过API或数据库获取）
function generatePriceHistory(productInfo) {
    const currentPrice = parseFloat(productInfo.price);
    
    // 生成过去30天的模拟价格数据
    const today = new Date();
    const priceHistory = [];
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
        // 在当前价格的基础上随机波动
        const randomFactor = 0.9 + Math.random() * 0.2; // 0.9到1.1之间的随机数
        const historicalPrice = (currentPrice * randomFactor).toFixed(2);
        
        priceHistory.push({
            date: date.toISOString().split('T')[0], // 仅保留日期部分
            price: historicalPrice
        });
    }
    
    // 存储价格历史
    chrome.storage.local.set({ 
        'priceHistory': priceHistory,
        'productUrl': productInfo.url 
    }, function() {
        console.log('价格历史数据已生成并保存');
    });
}

// 监听来自content script的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('收到消息:', request);
    
    if (request.action === "productInfo") {
        // 处理商品信息
        saveProductInfo(request.product);
        
        // 向popup发送消息更新界面
        chrome.runtime.sendMessage({
            action: "updateProductInfo",
            product: request.product
        });
        
        // 显示通知
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'images/icon48.png',
            title: '商品信息已提取',
            message: `成功提取商品: ${request.product.title}`
        });
        
        // 回复content script
        sendResponse({ status: "success", message: "商品信息已接收" });
    }
    
    // 返回true以支持异步回复
    return true;
});

// 监听扩展安装或更新事件
chrome.runtime.onInstalled.addListener(function(details) {
    console.log('扩展已安装/更新:', details.reason);
    
    // 初始化存储
    chrome.storage.local.set({
        'productHistory': [],
        'currentProduct': null,
        'priceHistory': []
    }, function() {
        console.log('存储已初始化');
    });
});

// 处理标签页更新事件，当用户导航到新页面时重新运行内容脚本
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('amazon.com')) {
        console.log('Amazon页面已加载，重新运行内容脚本');
        
        // 向该标签页发送消息，通知内容脚本页面已更新
        chrome.tabs.sendMessage(tabId, { action: "pageUpdated" }, function(response) {
            // 忽略错误，因为如果内容脚本尚未加载会失败
            if (chrome.runtime.lastError) {
                console.log('无法发送消息到内容脚本，可能是该脚本还未加载');
            }
        });
    }
});
