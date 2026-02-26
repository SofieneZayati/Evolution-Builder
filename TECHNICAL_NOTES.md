# Technical Notes & Customization Guide

## Project Structure

```
Evolution Builder/
├── manifest.json          # Extension configuration
├── background.js          # Service worker (data storage & communication)
├── content.js            # Runs on Futbin pages (data extraction)
├── popup.html            # Extension popup interface
├── popup.css             # Popup styling
├── popup.js              # Popup logic & prompt generation
├── icons/                # Extension icons (optional)
├── README.md             # User documentation
└── TECHNICAL_NOTES.md    # This file (developer guide)
```

## How It Works

### 1. Content Script (content.js)
- Runs automatically on all Futbin.com pages
- Adds floating "Add to Evo Builder" button
- Extracts data when button is clicked
- Sends data to background script

**Data Extraction:**
- Uses DOM queries to find player/evolution data
- Looks for specific CSS classes and elements
- Fallback logic for different page layouts

### 2. Background Script (background.js)
- Service worker that runs in background
- Stores data using Chrome Storage API
- Handles messages between content script and popup
- Persists data across browser sessions

**Storage Structure:**
```javascript
{
  player: {
    type: 'player',
    name: string,
    rating: string,
    position: string,
    stats: object,
    playstyles: array,
    roles: array,
    // ... more fields
  },
  evolutions: [
    {
      type: 'evolution',
      name: string,
      requirements: object,
      upgrades: object,
      playstyles: array,
      // ... more fields
    }
  ]
}
```

### 3. Popup (popup.html/js/css)
- Opens when extension icon is clicked
- Displays collected data
- Generates formatted prompts
- Manages data (remove items, clear all)

## Customization Options

### Change Button Appearance
Edit `content.js` around line 155:
```javascript
button.style.cssText = `
  // Modify these styles
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  // ... other styles
`;
```

### Modify Data Extraction
If Futbin changes their HTML structure:

**For Players** (content.js, line 9-120):
```javascript
// Update these selectors to match new HTML
const playerHeader = document.querySelector('.player_header h1, .pcdisplay-name');
```

**For Evolutions** (content.js, line 122-175):
```javascript
// Update these selectors
const titleElement = document.querySelector('.evolution-title, h1, .page-title');
```

### Change Prompt Format
Edit `popup.js`:

**Text Format** (line 189-299):
- Modify the `generateTextOutput()` function
- Change text structure, add/remove sections

**JSON Format** (line 301-324):
- Modify the `generateJSONOutput()` function
- Add/remove fields from output

### Add More Data Fields

1. **Extract new field** in `content.js`:
```javascript
// In extractPlayerData() or extractEvolutionData()
playerData.newField = document.querySelector('.new-selector')?.textContent;
```

2. **Display in popup** in `popup.js`:
```javascript
// In updatePlayerDisplay() or updateEvolutionsDisplay()
${player.newField ? `<div>${player.newField}</div>` : ''}
```

3. **Include in output** in `popup.js`:
```javascript
// In generateTextOutput() or generateJSONOutput()
output += `New Field: ${player.newField}\n`;
```

### Change Color Scheme

Edit `popup.css`:
```css
/* Primary colors */
--primary: #667eea;
--secondary: #764ba2;

/* Update gradient backgrounds */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

## Advanced Features You Could Add

### 1. Import/Export Data
Add buttons to save/load data as JSON files:
```javascript
// In popup.js
function exportData() {
  const dataStr = JSON.stringify(currentData);
  const dataBlob = new Blob([dataStr], {type: 'application/json'});
  const url = URL.createObjectURL(dataBlob);
  // Create download link
}
```

### 2. Multiple Player Comparisons
Modify storage to support multiple players:
```javascript
// In background.js
let extensionData = {
  players: [],  // Array instead of single player
  evolutions: []
};
```

### 3. Evolution Chain Validator
Add logic to check if player meets evolution requirements:
```javascript
function checkEligibility(player, evolution) {
  if (evolution.requirements.overall) {
    if (parseInt(player.rating) > parseInt(evolution.requirements.overall)) {
      return false;
    }
  }
  // ... more checks
  return true;
}
```

### 4. Visual Evolution Chain Builder
Add drag-and-drop interface to order evolutions:
- Use HTML5 drag/drop API
- Show which evolutions apply after others
- Display stat changes at each step

### 5. Futbin Link Storage
Store URLs to original pages:
```javascript
// In content.js
playerData.sourceUrl = window.location.href;
```

### 6. Auto-Update Detection
Check for Futbin page updates:
```javascript
// In content.js
const observer = new MutationObserver((mutations) => {
  // Re-extract data when page changes
});
observer.observe(document.body, { childList: true, subtree: true });
```

## Debugging

### View Console Logs
1. Open extension popup
2. Right-click anywhere → "Inspect"
3. Console tab shows logs from popup.js

### View Content Script Logs
1. Open Futbin page
2. Press F12 → Console tab
3. Look for "EA FC Evolution Builder" messages

### View Background Script Logs
1. Go to `chrome://extensions/`
2. Find extension → Click "service worker"
3. Console opens with background.js logs

### Common Issues

**Data not saving:**
- Check Chrome Storage API permissions
- Look for errors in background script console

**Extraction not working:**
- Futbin HTML structure may have changed
- Update CSS selectors in content.js
- Check browser console for errors

**Button not appearing:**
- Check content script is loading
- Verify host_permissions in manifest
- Refresh Futbin page

## Performance Considerations

- Content script is lightweight, minimal DOM queries
- Background script uses efficient storage
- Popup only loads when opened
- Data cached in memory for quick access

## Security & Privacy

- No external network requests
- All data stored locally (Chrome Storage API)
- Only runs on Futbin.com
- No user tracking or analytics
- No data sent to third parties

## Browser Compatibility

**Tested on:**
- Chrome 88+
- Edge 88+
- Brave 1.20+

**Manifest V3:**
- Uses latest Chrome extension standard
- Service worker instead of background page
- More secure and performant

## Future Enhancement Ideas

1. **AI Integration**: Direct API calls to ChatGPT/Claude
2. **Database**: Store common evolutions offline
3. **Calculator**: Show predicted stats after evolution chain
4. **History**: Keep track of past builds
5. **Sharing**: Export builds as shareable links
6. **Templates**: Save common evolution chains
7. **Notifications**: Alert when new evolutions added to Futbin
8. **Mobile**: Create companion app for mobile devices

## Development Workflow

To modify or improve:
1. Edit the relevant files
2. Go to `chrome://extensions/`
3. Click reload icon on the extension
4. Test your changes on Futbin
5. Check console for errors

## Quick Reference

- **User Guide**: README.md
- **Developer Guide**: This file
- **Console Logs**: F12 → Console (on Futbin page)
- **Background Logs**: chrome://extensions/ → "service worker"
- **Reload Extension**: chrome://extensions/ → reload icon

---

Happy coding! ⚽🚀
