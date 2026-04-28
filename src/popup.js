// Self Respect Extension Popup
document.addEventListener("DOMContentLoaded", function () {
  const toggle = document.getElementById("toggleEnabled");
  const statusText = document.getElementById("statusText");
  const blockingLevelText = document.getElementById("blockingLevelText");
  const totalBlocksEl = document.getElementById("totalBlocks");
  const todayBlocksEl = document.getElementById("todayBlocks");
  const customDomainsEl = document.getElementById("customDomains");

  // Load saved state and statistics
  chrome.storage.sync.get(["blockingStats", "blockedSites", "selfRespectSettings"], function (result) {
    // Extension enabled state — stored inside selfRespectSettings, not as a top-level key
    const settings = result.selfRespectSettings || {};
    toggle.checked = settings.enabled !== false; // default to true
    updateStatus(toggle.checked);
    const blockingLevel = settings.blockingLevel || "soft";
    updateBlockingLevel(blockingLevel);
    
    // Statistics
    const stats = result.blockingStats || { totalBlocks: 0, todayBlocks: 0, customDomains: 0 };
    totalBlocksEl.textContent = stats.totalBlocks || 0;
    todayBlocksEl.textContent = stats.todayBlocks || 0;
    
    // Custom domains count
    const blockedSites = result.blockedSites || [];
    const customDomainsCount = blockedSites.filter(site => site.custom).length;
    customDomainsEl.textContent = customDomainsCount;
    
    // Update custom domains count in stats if different
    if (stats.customDomains !== customDomainsCount) {
      stats.customDomains = customDomainsCount;
      chrome.storage.sync.set({ blockingStats: stats });
    }
  });

  // Toggle event
  toggle.addEventListener("change", function () {
    const enabled = this.checked;
    // Write enabled into selfRespectSettings so content.ts reads the same key
    chrome.storage.sync.get(['selfRespectSettings'], function (result) {
      const settings = result.selfRespectSettings || {};
      settings.enabled = enabled;
      chrome.storage.sync.set({ selfRespectSettings: settings });
    });
    updateStatus(enabled);

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: "EXTENSION_TOGGLE",
          enabled: enabled,
        });
      }
    });
  });

  // Settings button event
  document
    .getElementById("settingsBtn")
    .addEventListener("click", function () {
      // Open settings page
      chrome.tabs.create({ url: chrome.runtime.getURL("settings.html") });
    });

  function updateStatus(enabled) {
    statusText.textContent = enabled ? "Active" : "Paused";
    statusText.style.color = enabled ? "#4CAF50" : "#FF9800";
  }
  
  function updateBlockingLevel(level) {
    const levelMap = {
      "soft": "Soft",
      "puzzle": "Puzzle",
      "hard": "Hard"
    };

    const levelColors = {
      "soft": "#4CAF50",
      "puzzle": "#FF9800",
      "hard": "#F44336"
    };

    blockingLevelText.textContent = levelMap[level] || "Soft";
    blockingLevelText.style.color = levelColors[level] || "#4CAF50";
  }
  
  // Listen for storage changes to update statistics in real-time
  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'sync') {
      if (changes.blockingStats) {
        const stats = changes.blockingStats.newValue || { totalBlocks: 0, todayBlocks: 0, customDomains: 0 };
        totalBlocksEl.textContent = stats.totalBlocks || 0;
        todayBlocksEl.textContent = stats.todayBlocks || 0;
        customDomainsEl.textContent = stats.customDomains || 0;
      }
      
      if (changes.blockedSites) {
        const blockedSites = changes.blockedSites.newValue || [];
        const customDomainsCount = blockedSites.filter(site => site.custom).length;
        customDomainsEl.textContent = customDomainsCount;
        
        // Also update the stats
        chrome.storage.sync.get(['blockingStats'], function(result) {
          const stats = result.blockingStats || { totalBlocks: 0, todayBlocks: 0, customDomains: 0 };
          if (stats.customDomains !== customDomainsCount) {
            stats.customDomains = customDomainsCount;
            chrome.storage.sync.set({ blockingStats: stats });
          }
        });
      }
      
      if (changes.selfRespectSettings) {
        const settings = changes.selfRespectSettings.newValue || {};
        const blockingLevel = settings.blockingLevel || "soft";
        updateBlockingLevel(blockingLevel);
      }
    }
  });
});
