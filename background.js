// Background script for the extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  chrome.storage.local.get(['products', 'lastUpdate'], (result) => {
    if (!result.products) {
      chrome.storage.local.set({ products: {} });
    }
    if (!result.lastUpdate) {
      chrome.storage.local.set({ lastUpdate: {} });
    }
  });
});

// Function to clean old data (older than 30 days)
function cleanOldData(products) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  for (const asin in products) {
    if (products[asin].priceHistory) {
      products[asin].priceHistory = products[asin].priceHistory.filter(
        entry => new Date(entry.timestamp) > thirtyDaysAgo
      );
    }
  }
  return products;
}

// Function to update product data
function updateProductData(productInfo) {
  const { asin, ...newData } = productInfo;
  
  chrome.storage.local.get(['products'], (result) => {
    const products = result.products || {};
    
    // Initialize product data if it doesn't exist
    if (!products[asin]) {
      products[asin] = {
        title: newData.title,
        url: newData.url,
        brand: newData.brand,
        category: newData.category,
        priceHistory: []
      };
    }
    
    // Add new price point
    products[asin].priceHistory.push({
      price: newData.price,
      timestamp: newData.timestamp,
      isPrime: newData.isPrime,
      isOnSale: newData.isOnSale,
      rating: newData.rating,
      reviewCount: newData.reviewCount
    });
    
    // Clean old data
    const cleanedProducts = cleanOldData(products);
    
    // Update storage
    chrome.storage.local.set({ products: cleanedProducts });
    
    // Update last update timestamp
    chrome.storage.local.get(['lastUpdate'], (result) => {
      const lastUpdate = result.lastUpdate || {};
      lastUpdate[asin] = new Date().toISOString();
      chrome.storage.local.set({ lastUpdate });
    });
  });
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'storeProductInfo') {
    updateProductData(request.data);
  }
  
  if (request.action === 'getProductHistory') {
    chrome.storage.local.get(['products'], (result) => {
      const products = result.products || {};
      const productData = products[request.asin];
      
      if (productData) {
        // Sort price history by date
        productData.priceHistory.sort((a, b) => 
          new Date(a.timestamp) - new Date(b.timestamp)
        );
      }
      
      sendResponse(productData);
    });
    return true; // Required for async response
  }
  
  if (request.action === 'getAllProducts') {
    chrome.storage.local.get(['products'], (result) => {
      const products = result.products || {};
      // Sort all products' price history
      for (const asin in products) {
        if (products[asin].priceHistory) {
          products[asin].priceHistory.sort((a, b) => 
            new Date(a.timestamp) - new Date(b.timestamp)
          );
        }
      }
      sendResponse(products);
    });
    return true; // Required for async response
  }
  
  if (request.action === 'getLastUpdate') {
    chrome.storage.local.get(['lastUpdate'], (result) => {
      sendResponse(result.lastUpdate || {});
    });
    return true; // Required for async response
  }
});

// Set up periodic price checks (every 6 hours)
chrome.alarms.create('checkPrices', { periodInMinutes: 360 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkPrices') {
    // Get all tracked products
    chrome.storage.local.get(['products'], (result) => {
      const products = result.products || {};
      
      // Check each product's last update time
      chrome.storage.local.get(['lastUpdate'], (result) => {
        const lastUpdate = result.lastUpdate || {};
        const now = new Date();
        
        for (const asin in products) {
          const lastUpdateTime = lastUpdate[asin] ? new Date(lastUpdate[asin]) : null;
          
          // If product hasn't been updated in 6 hours, check it
          if (!lastUpdateTime || (now - lastUpdateTime) > 6 * 60 * 60 * 1000) {
            // Open product page in background to check price
            chrome.tabs.create({
              url: products[asin].url,
              active: false
            });
          }
        }
      });
    });
  }
});
