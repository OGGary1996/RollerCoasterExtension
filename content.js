// Content script that runs on Amazon Canada product pages
console.log('Content script loaded');

// Beauty product categories and keywords
const BEAUTY_CATEGORIES = [
    'Beauty & Personal Care',
    'Health & Beauty',
    'Beauty',
    'Makeup',
    'Skincare',
    'Hair Care',
    'Fragrances',
    'Tools & Accessories'
];

const BEAUTY_KEYWORDS = [
    'makeup', 'cosmetics', 'skincare', 'beauty', 'fragrance', 'perfume',
    'shampoo', 'conditioner', 'hair care', 'skin care', 'moisturizer',
    'serum', 'foundation', 'lipstick', 'mascara', 'eyeshadow', 'blush',
    'concealer', 'powder', 'brush', 'sponge', 'mirror', 'palette'
];

// Function to check if product is in beauty category
function isBeautyProduct() {
    // Check breadcrumb navigation
    const breadcrumb = document.querySelector('#wayfinding-breadcrumbs_container');
    if (breadcrumb) {
        const breadcrumbText = breadcrumb.textContent.toLowerCase();
        return BEAUTY_CATEGORIES.some(category => 
            breadcrumbText.includes(category.toLowerCase())
        );
    }

    // Check product title and description
    const title = document.getElementById('productTitle')?.textContent.toLowerCase() || '';
    const description = document.getElementById('productDescription')?.textContent.toLowerCase() || '';
    
    return BEAUTY_KEYWORDS.some(keyword => 
        title.includes(keyword) || description.includes(keyword)
    );
}

// Function to extract price from Amazon Canada page
function extractPrice() {
    // Try different price selectors used by Amazon Canada
    const priceSelectors = [
        '#priceblock_ourprice',
        '#priceblock_dealprice',
        '.a-price .a-offscreen',
        '.a-price-whole',
        '#price_inside_buybox',
        '.a-price .a-text-price span',
        '.a-color-price',
        '.a-price .a-offscreen',
        '.a-price .a-text-price',
        '.a-price .a-text-normal'
    ];

    for (const selector of priceSelectors) {
        const element = document.querySelector(selector);
        if (element) {
            const priceText = element.textContent.trim();
            // Extract numbers from price text, handling Canadian currency format
            const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
            if (!isNaN(price)) {
                return price;
            }
        }
    }
    return null;
}

// Function to extract product information
function extractProductInfo() {
    const price = extractPrice();
    if (!price) return null;

    const productInfo = {
        title: document.getElementById('productTitle')?.textContent.trim() || '',
        price: price,
        asin: window.location.pathname.match(/\/dp\/([A-Z0-9]{10})/)?.[1] || '',
        url: window.location.href,
        timestamp: new Date().toISOString(),
        currency: 'CAD',
        category: isBeautyProduct() ? 'beauty' : 'other',
        brand: document.querySelector('#bylineInfo')?.textContent.replace('Brand: ', '').trim() || '',
        rating: document.querySelector('#acrPopover')?.getAttribute('title') || '',
        reviewCount: document.querySelector('#acrCustomerReviewText')?.textContent.split(' ')[0] || '0',
        isPrime: !!document.querySelector('.a-icon-prime'),
        isOnSale: !!document.querySelector('.a-price-savings')
    };

    return productInfo;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getProductInfo') {
        const productInfo = extractProductInfo();
        sendResponse(productInfo);
    }
    return true;
});

// Check if we're on a product page
if (window.location.pathname.includes('/dp/')) {
    // Extract and store product info when page loads
    const productInfo = extractProductInfo();
    if (productInfo && productInfo.category === 'beauty') {
        chrome.runtime.sendMessage({
            action: 'storeProductInfo',
            data: productInfo
        });
    }
}
