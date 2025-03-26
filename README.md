# Roller Coaster Dealer - Chrome Extension

## Overview
Roller Coaster Dealer is a Chrome extension designed to help amusement park owners and enthusiasts track historical prices of roller coasters and amusement park equipment. It provides detailed price insights, trend analysis, and helps make informed purchasing decisions for amusement park equipment.

## Key Features

### 1. Price Tracking
- Tracks historical prices of roller coasters and amusement equipment
- Displays price trends in easy-to-understand visual charts
- Helps identify optimal purchase timing
- Shows price fluctuations over time

### 2. Equipment Categories
- Roller Coasters
- Amusement Park Rides
- Theme Park Equipment
- Thrill Rides
- Family Rides
- Water Rides
- Park Attractions

### 3. Price History
- Maintains detailed price history for each piece of equipment
- Shows price changes over time
- Helps identify seasonal price patterns
- Tracks sale and promotional prices

### 4. Product Information
- Detailed product specifications
- Brand information
- Ratings and reviews
- Prime and sale status indicators

## Installation

1. Download the extension files or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the top right corner
4. Click "Load unpacked" and select the extension directory
5. The Roller Coaster Dealer icon should now appear in your browser toolbar

## Usage

1. Navigate to any amusement equipment product page
2. Click the Roller Coaster Dealer icon in your toolbar
3. View the current price and price history
4. Analyze price trends to make informed purchasing decisions

## Development

### Project Structure
```
├── manifest.json         # Extension configuration
├── background.js         # Background service worker
├── content.js           # Content script for page interaction
├── popup.html           # Extension popup interface
├── popup.js             # Popup interface logic
├── options.html         # Options page
├── options.js           # Options page logic
├── styles/              # CSS stylesheets
│   └── style.css        # Main stylesheet
├── icons/               # Extension icons
│   ├── icon16.png       # 16x16 icon
│   ├── icon48.png       # 48x48 icon
│   └── icon128.png      # 128x128 icon
└── images/              # Other image resources
```

### Technology Stack
- HTML5, CSS3, and JavaScript
- Chart.js for price visualization
- Chrome Extension APIs for browser integration

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## Privacy Policy
Roller Coaster Dealer collects only the information necessary to provide its services. No personal data is sold or shared with third parties.

## Contact
For any questions or suggestions, please open an issue in this repository. 