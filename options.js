// Options page script
document.addEventListener('DOMContentLoaded', () => {
  // Load saved settings
  chrome.storage.sync.get(['settings'], (result) => {
    if (result.settings) {
      // Apply saved settings to the options page
      console.log('Loaded settings:', result.settings);
    }
  });

  // Save settings when changed
  document.querySelectorAll('input, select').forEach(element => {
    element.addEventListener('change', () => {
      const settings = {
        // Add your settings here
      };
      chrome.storage.sync.set({ settings });
    });
  });
});
