// Amazon价格历史数据服务
const amazonPriceHistoryService = {
    // API密钥（需要替换为实际的API密钥）
    // 注意：这里使用的是模拟API调用，真实实现时需要替换为实际的API
    apiKey: 'YOUR_API_KEY_HERE',
    
    // 获取产品的30天价格历史
    async getPriceHistory(productId, region = 'us') {
        if (!productId) {
            console.error('Product ID is required to fetch price history');
            return null;
        }
        
        try {
            console.log(`Fetching price history for product ${productId} in region ${region}`);
            
            // 这里应该是实际的API调用，例如：
            // const response = await fetch(`https://api.keepa.com/product?key=${this.apiKey}&domain=1&asin=${productId}`)
            // const data = await response.json();
            
            // 由于我们没有实际的API，这里模拟API调用并返回过去30天的模拟数据
            return await this.simulateAPIResponse(productId, region);
        } catch (error) {
            console.error('Error fetching Amazon price history:', error);
            return null;
        }
    },
    
    // 模拟API响应，生成30天的模拟价格数据
    async simulateAPIResponse(productId, region) {
        // 模拟API延迟
        await new Promise(resolve => setTimeout(resolve, 700));
        
        const priceHistory = [];
        const today = new Date();
        
        // 获取当前价格（如果可用）
        let currentPrice = await this.getCurrentPrice(productId);
        if (!currentPrice || isNaN(currentPrice)) {
            // 如果无法获取当前价格，使用随机价格
            currentPrice = Math.floor(Math.random() * 400) + 100; // $100-$500范围内的随机价格
        }
        
        // 生成过去30天的每日价格数据
        for (let i = 30; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            
            // 根据市场规律生成价格
            let dayPrice = this.generateRealisticPrice(currentPrice, i, date);
            
            priceHistory.push({
                x: date,
                y: dayPrice
            });
        }
        
        // 添加区域特定信息
        const result = {
            productId: productId,
            region: region,
            currency: region === 'us' ? 'USD' : (region === 'uk' ? 'GBP' : 'EUR'),
            priceHistory: priceHistory,
            // 添加一些分析数据
            analysis: this.analyzePriceData(priceHistory)
        };
        
        return result;
    },
    
    // 从本地存储中获取当前价格
    async getCurrentPrice(productId) {
        return new Promise((resolve) => {
            chrome.storage.local.get('recentProduct', function(result) {
                if (result.recentProduct && result.recentProduct.productId === productId && result.recentProduct.price) {
                    // 转换价格字符串为数字
                    try {
                        const priceStr = result.recentProduct.price;
                        const numericPrice = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
                        resolve(numericPrice);
                    } catch (e) {
                        console.error('Error parsing price:', e);
                        resolve(null);
                    }
                } else {
                    resolve(null);
                }
            });
        });
    },
    
    // 生成符合市场规律的真实价格
    generateRealisticPrice(currentPrice, daysAgo, date) {
        // 基础价格波动（±5%）
        const volatility = 0.05;
        let basePrice = currentPrice * (1 + (Math.random() * volatility * 2 - volatility));
        
        // 考虑周末和特殊日期的价格变化
        const dayOfWeek = date.getDay();
        const dayOfMonth = date.getDate();
        const month = date.getMonth();
        
        // 周末价格可能略高（电商平台周末流量大）
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            basePrice *= 1.01;  // 周末价格上浮1%
        }
        
        // 月初可能有促销
        if (dayOfMonth <= 5) {
            basePrice *= 0.97;  // 月初价格下降3%
        }
        
        // 特殊节日和购物季考虑
        // 黑色星期五期间（11月最后一周）
        if (month === 10 && dayOfMonth >= 23) {
            basePrice *= 0.85;  // 黑五价格下降15%
        }
        
        // Prime Day（通常在7月）
        if (month === 6 && (dayOfMonth >= 10 && dayOfMonth <= 17)) {
            basePrice *= 0.90;  // Prime Day价格下降10%
        }
        
        // 确保价格在合理范围内
        return Math.max(currentPrice * 0.7, Math.min(currentPrice * 1.3, Math.round(basePrice)));
    },
    
    // 分析价格数据，提供有用的洞察
    analyzePriceData(priceHistory) {
        if (!priceHistory || priceHistory.length === 0) {
            return {
                averagePrice: 0,
                lowestPrice: 0,
                highestPrice: 0,
                priceChange30d: 0,
                priceChangePct: 0,
                recommendation: '无足够数据提供购买建议'
            };
        }
        
        // 获取当前价格和30天前价格
        const currentPrice = priceHistory[priceHistory.length - 1].y;
        const oldestPrice = priceHistory[0].y;
        
        // 计算最低价和最高价
        const lowestPrice = Math.min(...priceHistory.map(p => p.y));
        const highestPrice = Math.max(...priceHistory.map(p => p.y));
        
        // 计算平均价格
        const sum = priceHistory.reduce((acc, curr) => acc + curr.y, 0);
        const averagePrice = Math.round(sum / priceHistory.length);
        
        // 计算30天价格变化
        const priceChange30d = currentPrice - oldestPrice;
        const priceChangePct = Math.round((priceChange30d / oldestPrice) * 100);
        
        // 价格趋势（简单线性回归）
        const priceTrend = this.calculatePriceTrend(priceHistory);
        
        // 生成购买建议
        let recommendation = '';
        if (currentPrice <= lowestPrice * 1.05) {
            recommendation = 'Current price is close to 30-day low, good time to buy';
        } else if (currentPrice >= averagePrice * 1.1) {
            recommendation = 'Price is over 10% higher than 30-day average, consider waiting for a drop';
        } else if (priceTrend < -0.5) {
            recommendation = 'Price shows a clear downward trend, may continue to drop';
        } else if (priceTrend > 0.5) {
            recommendation = 'Price shows a clear upward trend, buy soon if needed';
        } else {
            recommendation = 'Price is relatively stable and close to average, suitable for purchase';
        }
        
        return {
            averagePrice,
            lowestPrice,
            highestPrice,
            priceChange30d,
            priceChangePct,
            priceTrend,
            recommendation
        };
    },
    
    // 计算价格趋势（简单线性回归斜率）
    calculatePriceTrend(priceHistory) {
        const n = priceHistory.length;
        
        // 计算x和y的平均值
        let sumX = 0;
        let sumY = 0;
        
        for (let i = 0; i < n; i++) {
            sumX += i;
            sumY += priceHistory[i].y;
        }
        
        const avgX = sumX / n;
        const avgY = sumY / n;
        
        // 计算斜率（趋势）
        let numerator = 0;
        let denominator = 0;
        
        for (let i = 0; i < n; i++) {
            numerator += (i - avgX) * (priceHistory[i].y - avgY);
            denominator += Math.pow(i - avgX, 2);
        }
        
        // 防止除零错误
        if (denominator === 0) return 0;
        
        // 返回标准化的斜率（-1到1之间）
        const slope = numerator / denominator;
        const maxPrice = Math.max(...priceHistory.map(p => p.y));
        const normalizedSlope = slope / (maxPrice / n);
        
        return normalizedSlope;
    }
};

// 导出服务
window.amazonPriceHistoryService = amazonPriceHistoryService; 