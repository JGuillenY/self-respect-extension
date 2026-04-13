#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🌱 Building Self Respect Chrome Extension...\n");

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, "dist");
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log("Created dist directory");
}

// Check if TypeScript is installed
try {
  console.log("Checking TypeScript installation...");
  execSync("npx tsc --version", { stdio: "pipe" });
} catch (error) {
  console.error("❌ TypeScript not found. Installing...");
  execSync("npm install typescript --no-save", { stdio: "inherit" });
}

// Compile TypeScript
try {
  console.log("\nCompiling TypeScript files...");
  execSync("npx tsc", { stdio: "inherit" });
  console.log("✅ TypeScript compiled successfully");
} catch (error) {
  console.error("❌ TypeScript compilation failed");
  process.exit(1);
}

// Copy HTML files
console.log("\nCopying HTML files...");
const htmlFiles = ["popup.html"];
htmlFiles.forEach((file) => {
  const source = path.join(__dirname, "src", file);
  const dest = path.join(distDir, file);

  if (fs.existsSync(source)) {
    fs.copyFileSync(source, dest);
    console.log(`✅ ${file} copied`);
  }
});

// Check for icons
console.log("\nChecking icons...");
const iconsDir = path.join(__dirname, "icons");
if (fs.existsSync(iconsDir)) {
  const icons = fs.readdirSync(iconsDir);
  if (icons.length > 0) {
    console.log(`✅ Found ${icons.length} icon(s)`);

    // Copy icons to dist
    icons.forEach((icon) => {
      const source = path.join(iconsDir, icon);
      const dest = path.join(distDir, "icons", icon);

      // Create icons directory in dist
      const distIconsDir = path.join(distDir, "icons");
      if (!fs.existsSync(distIconsDir)) {
        fs.mkdirSync(distIconsDir, { recursive: true });
      }

      fs.copyFileSync(source, dest);
    });
  } else {
    console.log("⚠️  Icons directory exists but is empty");
    console.log("   Create these PNG files in icons/:");
    console.log("   - icon-16.png (16x16)");
    console.log("   - icon-32.png (32x32)");
    console.log("   - icon-48.png (48x48)");
    console.log("   - icon-128.png (128x128)");
  }
} else {
  console.log("⚠️  Icons directory not found");
  console.log('   Create an "icons" directory with PNG files');
}

// Create a simple popup.js if it doesn't exist
const popupJsPath = path.join(__dirname, "src", "popup.js");
if (!fs.existsSync(popupJsPath)) {
  console.log("\nCreating basic popup.js...");
  const popupJsContent = `// Self Respect Extension Popup
document.addEventListener('DOMContentLoaded', function() {
  const toggle = document.getElementById('toggleEnabled');
  const statusText = document.getElementById('statusText');
  
  // Load saved state
  chrome.storage.sync.get(['enabled'], function(result) {
    toggle.checked = result.enabled !== false; // default to true
    updateStatus(toggle.checked);
  });
  
  // Toggle event
  toggle.addEventListener('change', function() {
    const enabled = this.checked;
    chrome.storage.sync.set({ enabled: enabled });
    updateStatus(enabled);
    
    // Send message to content script
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'EXTENSION_TOGGLE',
        enabled: enabled
      });
    });
  });
  
  // Button events
  document.getElementById('customizeBtn').addEventListener('click', function() {
    alert('Customization feature coming soon!');
  });
  
  document.getElementById('viewStatsBtn').addEventListener('click', function() {
    alert('Statistics feature coming soon!');
  });
  
  function updateStatus(enabled) {
    statusText.textContent = enabled ? 'Active' : 'Paused';
    statusText.style.color = enabled ? '#4CAF50' : '#FF9800';
  }
});`;

  fs.writeFileSync(popupJsPath, popupJsContent);
  console.log("✅ Created popup.js");

  // Copy to dist
  fs.copyFileSync(popupJsPath, path.join(distDir, "popup.js"));
  console.log("✅ popup.js copied to dist");
}

console.log("\n🎉 Build complete!");
console.log("\nTo load in Chrome:");
console.log("1. Open chrome://extensions/");
console.log('2. Enable "Developer mode" (toggle in top-right)');
console.log('3. Click "Load unpacked"');
console.log('4. Select the "dist" directory in this project');
console.log("\nThe extension will:");
console.log("• Block adult content sites");
console.log("• Redirect to educational resources");
console.log("• Show a respectful blocking overlay");
console.log("\nTest by visiting one of the blocked domains.");
