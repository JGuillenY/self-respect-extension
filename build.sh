#!/bin/bash

echo "🌱 Building Self Respect Chrome Extension..."
echo ""

# Creating directory
rm -rf ./dist
mkdir ./dist

# Copy non-javascript files
echo ""
echo "Copying files..."

cp -r src/icons dist/icons
cp src/manifest.json dist/manifest.json
cp src/popup.html dist/popup.html
cp src/settings.html dist/settings.html

# Compile TypeScript
echo ""
echo "Compiling TypeScript and JavaScript files..."

esbuild src/popup.js --bundle --minify --sourcemap --target=chrome58,firefox57,safari11,edge16 --outfile=dist/popup.js
esbuild src/content.ts --bundle --minify --sourcemap --target=chrome58,firefox57,safari11,edge16 --outfile=dist/content.js
esbuild src/settings.js --bundle --minify --sourcemap --target=chrome58,firefox57,safari11,edge16 --outfile=dist/settings.js

echo ""
echo "🎉 Build complete!"
echo ""
echo "To load in Chrome:"
echo "1. Open chrome://extensions/"
echo '2. Enable "Developer mode" (toggle in top-right)'
echo '3. Click "Load unpacked"'
echo '4. Select the "dist" directory in this project'
echo ""
echo "The extension will:"
echo "• Block adult content sites"
echo "• Redirect to educational resources"
echo "• Show a respectful blocking overlay"
echo "• Allow custom domain blocking"
echo "• Provide detailed settings"
echo ""
echo "Test by visiting one of the blocked domains."