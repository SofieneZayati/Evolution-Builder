// Background service worker for Chrome extension
// Handles data storage and communication between content script and popup

console.log('EA FC Evolution Builder - Background script loaded');

// Storage structure
let extensionData = {
  player: null,
  evolutions: []
};

// Load data from storage on startup
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['extensionData'], (result) => {
    if (result.extensionData) {
      extensionData = result.extensionData;
    }
  });
});

// Load data from storage on startup
chrome.storage.local.get(['extensionData'], (result) => {
  if (result.extensionData) {
    extensionData = result.extensionData;
  }
});

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  // Add player or evolution data
  if (request.action === 'addData') {
    const data = request.data;
    
    if (data.type === 'player') {
      extensionData.player = data;
      saveData();
      sendResponse({ success: true, message: 'Player added' });
    } else if (data.type === 'evolution') {
      // Check for duplicate evolution (same name)
      const isDuplicate = extensionData.evolutions.some(
        evo => evo.name && data.name && evo.name === data.name
      );
      if (isDuplicate) {
        sendResponse({ success: true, duplicate: true, message: 'Evolution already added' });
      } else {
        extensionData.evolutions.push(data);
        saveData();
        sendResponse({ success: true, message: 'Evolution added' });
      }
    }
  }
  
  // Get all stored data
  else if (request.action === 'getData') {
    sendResponse({ success: true, data: extensionData });
  }
  
  // Clear all data
  else if (request.action === 'clearData') {
    extensionData = {
      player: null,
      evolutions: []
    };
    saveData();
    sendResponse({ success: true, message: 'Data cleared' });
  }
  
  // Remove specific evolution
  else if (request.action === 'removeEvolution') {
    const index = request.index;
    if (index >= 0 && index < extensionData.evolutions.length) {
      extensionData.evolutions.splice(index, 1);
      saveData();
      sendResponse({ success: true, message: 'Evolution removed' });
    }
  }
  
  // Update specific evolution
  else if (request.action === 'updateEvolution') {
    const index = request.index;
    if (index >= 0 && index < extensionData.evolutions.length) {
      extensionData.evolutions[index] = request.evolution;
      saveData();
      sendResponse({ success: true, message: 'Evolution updated' });
    }
  }
  
  // Clear player only
  else if (request.action === 'clearPlayer') {
    extensionData.player = null;
    saveData();
    sendResponse({ success: true, message: 'Player cleared' });
  }
  
  // Clear all data (player + evolutions)
  else if (request.action === 'clearAll') {
    extensionData = {
      player: null,
      evolutions: []
    };
    saveData();
    sendResponse({ success: true, message: 'All data cleared' });
  }
  
  return true;
});

// Save data to storage
function saveData() {
  chrome.storage.local.set({ extensionData: extensionData }, () => {
    console.log('Data saved to storage');
  });
}
