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
        
        // 将数据存储到Chrome存储中
        chrome.storage.local.set({
            'recentProduct': request.data
        }, function() {
            console.log('Product data saved to storage');
        });
        
        // 通知任何正在打开的popup或mainPage
        chrome.runtime.sendMessage({
            action: 'updateProductData',
            data: request.data
        });
        
        sendResponse({success: true});
    }
    
    // 必须返回true以支持异步响应
    return true;
});

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
