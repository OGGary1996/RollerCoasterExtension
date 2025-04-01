// 判断当前页面是否为Amazon商品详情页面
function isProductPage() {
    // 检测多个可能的商品元素，增加可靠性
    const titleElement = document.querySelector('#productTitle, #title, .product-title-word-break');
    const priceElement = document.querySelector('#priceblock_ourprice, #priceblock_dealprice, .a-price .a-offscreen, .a-color-price');
    
    return titleElement !== null && priceElement !== null;
}

// 提取商品信息
function extractProductInfo() {
    try {
        // 商品标题
        const titleSelectors = [
            '#productTitle',
            '#title',
            '.product-title-word-break'
        ];
        
        // 商品价格
        const priceSelectors = [
            '#priceblock_ourprice',
            '#priceblock_dealprice',
            '.a-price .a-offscreen',
            '.a-color-price',
            '.a-section .a-price .a-offscreen'
        ];
        
        // 商品图片
        const imageSelectors = [
            '#landingImage',
            '#imgBlkFront',
            '#main-image',
            '.a-dynamic-image'
        ];
        
        // 提取函数：尝试多个选择器，返回第一个匹配的文本
        function getFirstMatchingText(selectors, defaultValue = '') {
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    return element.textContent.trim();
                }
            }
            return defaultValue;
        }
        
        // 提取函数：尝试多个选择器，返回第一个匹配的图片链接
        function getFirstMatchingImgSrc(selectors, defaultValue = '') {
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element && element.src) {
                    return element.src;
                }
            }
            return defaultValue;
        }
        
        // 提取商品信息
        const title = getFirstMatchingText(titleSelectors, '未知商品');
        let price = getFirstMatchingText(priceSelectors, '$0');
        const imageSrc = getFirstMatchingImgSrc(imageSelectors, '');
        
        // 清理价格文本，移除货币符号和非数字字符
        price = price.replace(/[^\d.,]/g, '');
        
        // 处理不同区域的小数点符号（有些地区用逗号作为小数点）
        price = price.replace(/,/g, '.');
        
        // 创建商品信息对象
        const productInfo = {
            title: title,
            price: price,
            imageSrc: imageSrc,
            url: window.location.href,
            timestamp: new Date().toISOString()
        };
        
        console.log('提取的商品信息:', productInfo);
        return productInfo;
    } catch (error) {
        console.error('提取商品信息出错:', error);
        return null;
    }
}

// 监听DOM变化，确保在动态加载内容后也能提取信息
function setupObserver() {
    // 设置观察选项
    const config = { attributes: true, childList: true, subtree: true };
    
    // 创建观察者实例
    const observer = new MutationObserver((mutationsList, observer) => {
        // 使用防抖动减少重复检查
        clearTimeout(window.amazonObserverTimeout);
        window.amazonObserverTimeout = setTimeout(() => {
            if (isProductPage()) {
                const productInfo = extractProductInfo();
                if (productInfo) {
                    // 向扩展发送商品信息
                    chrome.runtime.sendMessage({
                        action: "productInfo",
                        product: productInfo
                    });
                    
                    // 提取到信息后停止观察
                    observer.disconnect();
                    console.log('商品信息已发送到扩展');
                }
            }
        }, 1000);
    });
    
    // 开始观察整个文档
    observer.observe(document, config);
}

// 初始化函数
function initialize() {
    console.log('Amazon商品信息提取器已初始化');
    
    // 立即检查是否为商品页面
    if (isProductPage()) {
        const productInfo = extractProductInfo();
        if (productInfo) {
            // 向扩展发送商品信息
            chrome.runtime.sendMessage({
                action: "productInfo",
                product: productInfo
            });
            console.log('商品信息已发送到扩展');
        } else {
            // 如果无法立即提取，则设置观察者
            setupObserver();
        }
    } else {
        // 如果当前页面不是商品页面，设置观察者等待页面变化
        setupObserver();
    }
}

// 在页面加载完成后运行
initialize();
