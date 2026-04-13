# Self Respect Chrome Extension

A Chrome extension that helps you maintain self-respect by redirecting from websites that don't align with your values to healthier, educational alternatives.

## 🌟 Features

- **Smart Blocking**: Automatically detects and blocks access to sites in predefined categories
- **Respectful Redirection**: Shows a thoughtful overlay before redirecting to positive alternatives
- **Three Main Categories**:
  1. **Adult Content** (30+ sites) - Redirects to educational resources about addiction
  2. **Social Media** (10+ sites) - Redirects to psychology resources about social media effects
  3. **Gambling** (15+ sites) - Redirects to problem gambling help resources
- **Customizable**: Enable/disable with one click
- **Beautiful UI**: Modern, respectful interface with gradient design
- **Privacy First**: No data collection, all processing happens locally

## 🚀 Installation

### Development Setup

1. **Navigate to your project:**
   ```bash
   cd /home/yasue/Projects/self-respect-extension
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the extension:**
   ```bash
   npm run build
   # or
   ./build.js
   ```

4. **Load in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `dist` directory in your project

### Testing
Visit one of the blocked domains (like `pornhub.com` or `facebook.com`) to see the extension in action.

## 📁 Project Structure

```
self-respect-extension/
├── src/
│   ├── constants.ts      # Domain lists and categories (50+ domains)
│   ├── content.ts        # Content script with blocking logic
│   ├── popup.html        # Settings popup UI
│   └── popup.js          # Popup functionality
├── dist/                 # Built files (created by build script)
├── icons/                # Extension icons (16x16, 32x32, 48x48, 128x128)
├── manifest.json         # Chrome extension configuration
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── build.js              # Build script
└── README.md            # This file
```

## 🔧 Customization

### Adding More Domains
Edit `src/constants.ts` to add domains to existing categories or create new ones:

```typescript
{
  name: "Your Category",
  description: "Description of what this category blocks",
  domains: [
    "example.com",
    "www.example.com"
  ],
  redirectTo: "https://positive-alternative.com"
}
```

### Suggested Additional Categories
Consider adding:
- **Shopping Addiction** (Amazon, eBay, etc.)
- **News Overload** (CNN, Fox News, etc.)
- **Gaming Addiction** (Steam, Epic Games, etc.)
- **Dating Apps** (Tinder, Bumble, etc.)
- **Crypto Trading** (Coinbase, Binance, etc.)

### Changing Redirect URLs
Update the `redirectTo` property in any category to point to your preferred educational or self-help resources.

## 🛠 Development

```bash
# Build once
npm run build

# Watch for changes (recompiles on save)
npm run watch

# Clean build directory
npm run clean
```

## 🧠 How It Works

1. **Detection**: The content script runs on every page load and checks the current domain
2. **Matching**: Compares against the domain lists in `constants.ts`
3. **Blocking**: If a match is found, shows an overlay explaining the redirect
4. **Redirection**: After 3 seconds (or immediately if user clicks), redirects to the alternative URL
5. **User Control**: Users can temporarily allow a site via the overlay

## 🔒 Privacy

This extension:
- Does not collect any personal data
- Does not track browsing history
- Processes URLs locally in your browser
- Only communicates with redirect websites when blocking occurs
- Stores settings locally in Chrome's sync storage

## 📝 License

MIT License - see LICENSE file

## 🙏 Acknowledgments

Inspired by the need for digital tools that support mental health and self-respect rather than just productivity.

Built with care for those working on personal growth and digital wellbeing.