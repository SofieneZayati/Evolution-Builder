# EA FC Evolution Builder 🎮⚽

A Chrome browser extension that extracts player stats and evolution data from Futbin, then generates AI-ready prompts to help you build optimal evolution chains for EA Sports FC 26.

## 🚀 Quick Start (3 Steps)

### 1. Install Extension
1. Open Chrome and go to `chrome://extensions/`
2. Turn ON "Developer mode" (top-right toggle)
3. Click "Load unpacked" → Select the `Evolution Builder` folder
4. Done! The extension is installed ✅

### 2. Extract Data from Futbin
1. Visit [Futbin.com](https://www.futbin.com) and open any FC 26 player page
2. Click the floating **"⚽ Add to Evo Builder"** button (appears on right side)
3. Visit evolution pages and click the button to add evolutions
4. Add as many evolutions as you want

### 3. Generate AI Prompt
1. Click the extension icon in your browser toolbar
2. Review your selections in the popup
3. Click **"Generate AI Prompt"**
4. Click **"Copy to Clipboard"**
5. Paste into ChatGPT/Claude to get optimal evolution chain!

## ✨ Features

- ✅ **One-Click Extraction** - No manual typing needed
- ✅ **Complete Data** - All stats, playstyles, roles, requirements
- ✅ **Multiple Evolutions** - Add and compare as many as you want
- ✅ **Dual Formats** - Text (for AI) or JSON (for technical use)
- ✅ **Local Storage** - Data persists across browser sessions
- ✅ **Clean Interface** - Visual cards and badges for easy reading
- ✅ **Privacy First** - All data stored locally, no external servers

## 📊 What Gets Extracted

### From Player Pages:
- Name, rating, position, nation, league, club
- All 6 main stats + 30+ sub-stats
- PlayStyles and PlayStyles+
- Roles with ratings
- Skills, weak foot, height, etc.

### From Evolution Pages:
- Evolution name and requirements
- Stat upgrades with caps
- PlayStyles added
- Repeatability info

## 🎯 Example Output

```
Help me build the best possible Frimpong evolution in EA FC for a Right Back (RB)...

BASE PLAYER
Position: Right Back (RB)

BASE STATS
Pace: 96
  Acceleration: 97
  Sprint Speed: 95

Shooting: 81
  Finishing: 84
  Shot Power: 80
...

PLAYSTYLES
Quick Step+
Slide Tackle
...

AVAILABLE EVOLUTIONS

Brute Defense
Requirements: Overall Max 86, PlayStyles Max 10
Upgrades: Defending +10 (capped at 88), Overall +1
PlayStyles Added: Bruiser
...
```

## 🔧 Troubleshooting

### Button doesn't appear
- Refresh the Futbin page
- Make sure you're on a player/evolution page (not homepage)
- Check extension is enabled at `chrome://extensions/`

### Data not saving
- Open browser console (F12) and check for errors
- Reload the extension at `chrome://extensions/`
- Try clearing data and adding again

### Extension won't load
- Ensure Developer Mode is ON
- Select the correct folder with all extension files
- Check for error messages in red

### Debug Mode
1. **Content script** (on Futbin): Press F12 → Console → Look for "EA FC Evolution Builder" messages
2. **Background script**: Go to `chrome://extensions/` → Click "service worker"
3. **Popup**: Right-click popup → Inspect → Console

## 🎨 How to Use the Interface

### Popup Layout
- **Player Section**: Shows selected player with stats badges
- **Evolutions Section**: Lists all added evolutions with requirements/upgrades
- **Actions**: Generate button and format options (Text/JSON)
- **Output**: Generated prompt with copy button

### Managing Data
- **Remove Evolution**: Click "Remove" button on individual evolution cards
- **Clear Player**: Click "Clear" next to player header
- **Clear All Evolutions**: Click "Clear All" button
- **Data Persists**: Close popup anytime - data is saved automatically

## 🔒 Privacy & Security

- ✅ Only runs on Futbin.com
- ✅ No external network requests
- ✅ No tracking or analytics
- ✅ All data stored locally (Chrome Storage API)
- ✅ Open source - all code visible

## 💡 Tips

- Wait for Futbin pages to fully load before clicking the button
- Add multiple evolutions to compare different chains
- Use Text format for AI assistants (ChatGPT, Claude)
- Use JSON format if you want structured data
- Data persists - you can close the browser and come back later

## 🛠️ Browser Compatibility

| Browser | Status |
|---------|--------|
| Chrome 88+ | ✅ Full Support |
| Edge 88+ | ✅ Full Support |
| Brave 1.20+ | ✅ Full Support |
| Firefox | ❌ Not compatible (Manifest V3) |

## 📝 Version

**v1.0.0** - Initial Release
- Player & evolution data extraction
- Text and JSON output formats
- Popup interface with data management
- Copy to clipboard functionality

---

**Need to customize the code?** Check [TECHNICAL_NOTES.md](TECHNICAL_NOTES.md)

**Created for EA Sports FC 26 Ultimate Team players** 🎮
