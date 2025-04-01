// Extract price
const priceElement = document.querySelector('#priceblock_ourprice, #priceblock_dealprice, .a-price .a-offscreen, .a-price-whole, #price_inside_buybox, .a-price .a-text-price span');
console.log('Price element found:', priceElement);
if (priceElement) {
    console.log('Price element HTML:', priceElement.outerHTML);
    console.log('Price element text:', priceElement.textContent);
    const priceText = priceElement.textContent.trim();
    console.log('Cleaned price text:', priceText);
    const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
    console.log('Parsed price:', price);
    if (!isNaN(price)) {
        data.price = price;
    } else {
        console.error('Failed to parse price:', priceText);
    }
} else {
    console.error('No price element found on page');
    // Log all price-related elements for debugging
    const allPriceElements = document.querySelectorAll('[class*="price"], [id*="price"]');
    console.log('All price-related elements:', Array.from(allPriceElements).map(el => ({
        tag: el.tagName,
        class: el.className,
        id: el.id,
        text: el.textContent
    })));
} 