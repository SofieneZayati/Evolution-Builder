IMPORTANT: Chrome Extension Icons

The manifest.json requires PNG format icons, but I've created SVG placeholders.

You have 3 options:

1. EASY OPTION - Use online converter:
   - Go to https://svgtopng.com/ or https://cloudconvert.com/svg-to-png
   - Upload each SVG file (icon16.svg, icon48.svg, icon128.svg)
   - Download as PNG with same dimensions
   - Replace the .svg files with .png files

2. QUICK FIX - Use any simple icon:
   - Find a 128x128 PNG image (like a football emoji or simple logo)
   - Resize it to create 16x16, 48x48, and 128x128 versions
   - Name them icon16.png, icon48.png, icon128.png

3. TEMPORARY WORKAROUND - Update manifest.json:
   - Remove the "icons" section from manifest.json temporarily
   - The extension will work but won't have custom icons
   - Chrome will use default placeholder icons

For now, you can update manifest.json to remove icon requirements:
Remove these lines from manifest.json:
- The "default_icon" section in "action"
- The entire "icons" section at the bottom

Or simply create any 128x128 PNG image and name it appropriately.

The extension will work perfectly fine without custom icons - they're only cosmetic!
