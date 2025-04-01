// 从Amazon页面提取产品数据的内容脚本
console.log('Amazon Smart Shopping Assistant activated');

// 等待页面完全加载
window.addEventListener('load', function() {
    // 检查是否在Amazon产品页面
    if (window.location.href.includes('/dp/') || 
        window.location.href.includes('/gp/product/')) {
        console.log('Detected Amazon product page');
        extractProductData();
    }
});

// 提取产品数据
function extractProductData() {
    try {
        // 提取产品标题
        const productTitle = document.getElementById('productTitle') ? 
            document.getElementById('productTitle').innerText.trim() : 
            document.querySelector('.product-title-word-break') ? 
                document.querySelector('.product-title-word-break').innerText.trim() : '';
        
        // 提取产品价格
        let productPrice = '';
        
        // 尝试多种可能的价格选择器
        const priceWhole = document.querySelector('.a-price-whole');
        const priceFraction = document.querySelector('.a-price-fraction');
        
        if (priceWhole && priceFraction) {
            productPrice = priceWhole.innerText + '.' + priceFraction.innerText;
        } else {
            // 尝试其他价格选择器
            const priceElement = document.querySelector('.a-price .a-offscreen') || 
                                document.querySelector('#priceblock_ourprice') || 
                                document.querySelector('#priceblock_dealprice') ||
                                document.querySelector('.a-price');
            
            if (priceElement) {
                productPrice = priceElement.innerText.trim();
            }
        }
        
        // 提取产品图片URL
        let productImageUrl = '';
        const imgElement = document.getElementById('landingImage') || 
                           document.getElementById('imgBlkFront') ||
                           document.querySelector('.a-dynamic-image');
        
        if (imgElement) {
            productImageUrl = imgElement.src;
        }
        
        // 创建产品数据对象
        const productData = {
            title: productTitle,
            price: productPrice,
            imageUrl: productImageUrl,
            url: window.location.href,
            timestamp: new Date().toISOString()
        };
        
        console.log('Extracted product data:', productData);
        
        // 将数据发送给background脚本
        chrome.runtime.sendMessage({
            action: 'productData',
            data: productData
        });
        
    } catch (error) {
        console.error('Error extracting product data:', error);
    }
}

// 监听来自popup或背景脚本的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'getProductData') {
        extractProductData();
        sendResponse({success: true});
    }
});
