// 价格历史数据服务
const priceHistoryService = {
    // 获取商品价格历史
    async getPriceHistory(productId) {
        try {
            // 在实际应用中，这里会调用真实的API获取价格历史数据
            // 为了演示，我们创建模拟数据
            
            // 从本地存储获取已保存的价格历史
            const savedData = await this.getSavedPriceHistory(productId);
            if (savedData && savedData.length > 0) {
                console.log('Using saved price history for product:', productId);
                return savedData;
            }
            
            // 如果没有保存的数据，生成模拟数据
            console.log('Generating mock price history for product:', productId);
            return this.generateMockPriceHistory(productId);
        } catch (error) {
            console.error('Error getting price history:', error);
            return [];
        }
    },
    
    // 从本地存储获取已保存的价格历史
    async getSavedPriceHistory(productId) {
        return new Promise((resolve) => {
            chrome.storage.local.get(['priceHistory_' + productId], function(result) {
                if (result && result['priceHistory_' + productId]) {
                    resolve(result['priceHistory_' + productId]);
                } else {
                    resolve(null);
                }
            });
        });
    },
    
    // 保存价格历史数据到本地存储
    async savePriceHistory(productId, priceData) {
        return new Promise((resolve) => {
            chrome.storage.local.set({
                ['priceHistory_' + productId]: priceData
            }, function() {
                console.log('Price history saved for product:', productId);
                resolve(true);
            });
        });
    },
    
    // 生成模拟价格历史数据
    generateMockPriceHistory(productId) {
        const now = new Date();
        const priceHistory = [];
        
        // 模拟当前价格
        let currentPrice = Math.round(Math.random() * 500) + 100; // $100-$600范围内的随机价格
        
        // 生成过去6个月的每周价格数据
        for (let i = 0; i < 26; i++) { // 26周 ≈ 6个月
            const date = new Date();
            date.setDate(now.getDate() - (i * 7)); // 每7天一个数据点
            
            // 添加一些随机波动，但保持价格在合理范围内
            const priceVariation = Math.random() * 20 - 10; // -10到+10的随机变化
            const historicalPrice = Math.max(50, Math.round(currentPrice + priceVariation));
            
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
                currentPrice = price;
            }
        }
        
        // 反转数组，使其按日期升序排列
        return priceHistory.reverse();
    },
    
    // 分析价格历史，生成洞察
    analyzePriceHistory(priceHistory) {
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
        
        // 获取当前价格（最新数据点）
        const currentPrice = priceHistory[priceHistory.length - 1].y;
        
        // 计算最低价格
        const lowestPrice = Math.min(...priceHistory.map(p => p.y));
        
        // 计算最高价格
        const highestPrice = Math.max(...priceHistory.map(p => p.y));
        
        // 计算平均价格
        const sum = priceHistory.reduce((acc, curr) => acc + curr.y, 0);
        const averagePrice = Math.round(sum / priceHistory.length);
        
        // 计算过去30天价格变化
        let priceChange = 0;
        let priceChangePct = 0;
        
        if (priceHistory.length > 4) { // 假设每周一个数据点，4个数据点约等于一个月
            const lastMonthPrice = priceHistory[priceHistory.length - 5].y;
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
};

// 导出服务
window.priceHistoryService = priceHistoryService; 