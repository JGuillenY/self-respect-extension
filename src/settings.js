// Settings page for Self Respect extension
// Note: We can't use ES6 imports in Chrome extension content scripts
// We'll use a different approach

// Define DOMAIN_CATEGORIES inline since we can't import
const DOMAIN_CATEGORIES = [
  {
    name: "Adult Content",
    description: "Adult websites that users may want to avoid for self-respect and wellbeing",
    domains: [
      "pornhub.com",
      "www.pornhub.com",
      "xvideos.com",
      "www.xvideos.com",
      "xhamster.com",
      "www.xhamster.com",
      "youporn.com",
      "www.youporn.com",
      "brazzers.com",
      "www.brazzers.com",
      "redtube.com",
      "www.redtube.com",
      "xnxx.com",
      "www.xnxx.com",
      "onlyfans.com",
      "www.onlyfans.com",
      "chaturbate.com",
      "www.chaturbate.com",
      "myfreecams.com",
      "www.myfreecams.com",
      "stripchat.com",
      "www.stripchat.com",
      "bongacams.com",
      "www.bongacams.com",
      "cam4.com",
      "www.cam4.com",
      "livejasmin.com",
      "www.livejasmin.com",
      "adultfriendfinder.com",
      "www.adultfriendfinder.com",
      "ashleymadison.com",
      "www.ashleymadison.com",
    ],
    redirectTo: "https://www.yourbrainonporn.com",
  },
  {
    name: "Social Media",
    description: "Major social networking platforms that can be time-consuming and affect self-esteem",
    domains: [
      "facebook.com",
      "www.facebook.com",
      "fb.com",
      "messenger.com",
      "instagram.com",
      "www.instagram.com",
      "twitter.com",
      "www.twitter.com",
      "x.com",
      "tiktok.com",
      "www.tiktok.com",
      "snapchat.com",
      "www.snapchat.com",
    ],
    redirectTo: "https://www.psychologytoday.com/us/basics/social-media",
  },
  {
    name: "Gambling",
    description: "Online gambling sites that can lead to addiction and financial harm",
    domains: [
      "pokerstars.com",
      "www.pokerstars.com",
      "888poker.com",
      "www.888poker.com",
      "bet365.com",
      "www.bet365.com",
      "draftkings.com",
      "www.draftkings.com",
      "fanduel.com",
      "www.fanduel.com",
      "bovada.lv",
      "www.bovada.lv",
      "williamhill.com",
      "www.williamhill.com",
      "betway.com",
      "www.betway.com",
      "unibet.com",
      "www.unibet.com",
    ],
    redirectTo: "https://www.ncpgambling.org/help-treatment/help-by-state/",
  },
];

// Storage management functions
const STORAGE_KEYS = {
  SETTINGS: "selfRespectSettings",
  BLOCKED_SITES: "blockedSites",
  STATS: "blockingStats",
};

async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get([STORAGE_KEYS.SETTINGS], (result) => {
      resolve(result[STORAGE_KEYS.SETTINGS] || null);
    });
  });
}

async function saveSettings(settings) {
  return new Promise((resolve) => {
    chrome.storage.sync.set(
      {
        [STORAGE_KEYS.SETTINGS]: {
          ...settings,
          lastUpdated: Date.now(),
        },
      },
      resolve,
    );
  });
}

async function getBlockedSites() {
  return new Promise((resolve) => {
    chrome.storage.sync.get([STORAGE_KEYS.BLOCKED_SITES], (result) => {
      resolve(result[STORAGE_KEYS.BLOCKED_SITES] || []);
    });
  });
}

async function saveBlockedSites(sites) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [STORAGE_KEYS.BLOCKED_SITES]: sites }, resolve);
  });
}

async function addCustomDomain(domain, category = "Custom") {
  const sites = await getBlockedSites();
  const settings = await getSettings();
  
  const newSite = {
    id: generateId(),
    domain: normalizeDomain(domain),
    category: category,
    custom: true,
    enabled: true,
    createdAt: Date.now(),
  };

  sites.push(newSite);
  await saveBlockedSites(sites);

  if (settings) {
    settings.customDomains = settings.customDomains || [];
    settings.customDomains.push(newSite);
    await saveSettings(settings);
  }

  return newSite;
}

async function removeBlockedSite(id) {
  const sites = await getBlockedSites();
  const settings = await getSettings();
  
  const initialLength = sites.length;
  const filteredSites = sites.filter((site) => site.id !== id);
  
  if (filteredSites.length < initialLength) {
    await saveBlockedSites(filteredSites);
    
    if (settings) {
      settings.customDomains = (settings.customDomains || []).filter(
        (site) => site.id !== id,
      );
      await saveSettings(settings);
    }
    
    return true;
  }
  
  return false;
}

async function toggleSiteBlocking(id, enabled) {
  const sites = await getBlockedSites();
  const siteIndex = sites.findIndex((site) => site.id === id);
  
  if (siteIndex !== -1) {
    sites[siteIndex].enabled = enabled;
    await saveBlockedSites(sites);
    return true;
  }
  
  return false;
}

async function getBlockingStats() {
  return new Promise((resolve) => {
    chrome.storage.sync.get([STORAGE_KEYS.STATS], (result) => {
      const stats = result[STORAGE_KEYS.STATS] || {
        totalBlocks: 0,
        todayBlocks: 0,
        customDomains: 0,
        lastReset: Date.now(),
      };
      resolve(stats);
    });
  });
}

function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function normalizeDomain(domain) {
  return domain.toLowerCase().trim().replace(/^https?:\/\//, "").replace(/^www\./, "");
}

async function initializeStorage() {
  const settings = await getSettings();
  if (!settings) {
    await saveSettings({
      enabled: true,
      customDomains: [],
      blockedCategories: ["Adult Content", "Social Media", "Gambling"],
      showNotifications: true,
      autoRedirect: true,
      redirectDelay: 3,
      blockingLevel: "soft",
      lastUpdated: Date.now(),
    });
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", async function () {
  // Initialize storage
  await initializeStorage();
  
  // Load all data
  await loadSettings();
  await loadCategories();
  await loadCustomDomains();
  await loadStatistics();
  
  // Setup event listeners
  setupEventListeners();
});

// Load and display settings
async function loadSettings() {
  const settings = await getSettings();
  if (!settings) return;

  // Extension enabled toggle
  const extensionToggle = document.getElementById("extensionEnabled");
  extensionToggle.checked = settings.enabled;

  // Show notifications toggle
  const notificationsToggle = document.getElementById("showNotifications");
  notificationsToggle.checked = settings.showNotifications;

  // Auto redirect toggle
  const autoRedirectToggle = document.getElementById("autoRedirect");
  autoRedirectToggle.checked = settings.autoRedirect !== false; // default to true

  // Redirect delay
  const redirectDelay = document.getElementById("redirectDelay");
  redirectDelay.value = settings.redirectDelay.toString();
  
  // Blocking level
  const blockingLevel = document.getElementById("blockingLevel");
  blockingLevel.value = settings.blockingLevel || "soft";
  
  // Show/hide redirect delay based on auto redirect setting
  const redirectDelayContainer = document.getElementById("redirectDelayContainer");
  redirectDelayContainer.style.display = autoRedirectToggle.checked ? "flex" : "none";

  // Update extension status in real-time
  extensionToggle.addEventListener("change", async function () {
    const updatedSettings = await getSettings();
    if (updatedSettings) {
      updatedSettings.enabled = this.checked;
      await saveSettings(updatedSettings);
      showNotification(
        this.checked
          ? "Extension enabled"
          : "Extension disabled",
      );
    }
  });

  notificationsToggle.addEventListener("change", async function () {
    const updatedSettings = await getSettings();
    if (updatedSettings) {
      updatedSettings.showNotifications = this.checked;
      await saveSettings(updatedSettings);
      showNotification(
        this.checked
          ? "Notifications enabled"
          : "Notifications disabled",
      );
    }
  });

  autoRedirectToggle.addEventListener("change", async function () {
    const updatedSettings = await getSettings();
    if (updatedSettings) {
      updatedSettings.autoRedirect = this.checked;
      await saveSettings(updatedSettings);
      
      // Show/hide redirect delay input
      const redirectDelayContainer = document.getElementById("redirectDelayContainer");
      redirectDelayContainer.style.display = this.checked ? "flex" : "none";
      
      showNotification(
        this.checked
          ? "Auto redirect enabled"
          : "Auto redirect disabled",
      );
    }
  });

  redirectDelay.addEventListener("change", async function () {
    const updatedSettings = await getSettings();
    if (updatedSettings) {
      updatedSettings.redirectDelay = parseInt(this.value);
      await saveSettings(updatedSettings);
      showNotification(`Redirect delay set to ${this.value} seconds`);
    }
  });

  blockingLevel.addEventListener("change", async function () {
    const updatedSettings = await getSettings();
    if (updatedSettings) {
      updatedSettings.blockingLevel = this.value;
      await saveSettings(updatedSettings);
      showNotification(`Blocking level set to ${this.value}`);
    }
  });
}

// Load and display categories
async function loadCategories() {
  const settings = await getSettings();
  const categoriesList = document.getElementById("categoriesList");
  categoriesList.innerHTML = "";

  DOMAIN_CATEGORIES.forEach((category) => {
    const isEnabled = settings?.blockedCategories?.includes(category.name);

    const categoryItem = document.createElement("div");
    categoryItem.className = "category-item";
    categoryItem.innerHTML = `
      <input type="checkbox" id="category-${category.name
        .toLowerCase()
        .replace(/\s+/g, "-")}" ${isEnabled ? "checked" : ""} />
      <div class="category-info">
        <div class="category-name">${category.name}</div>
        <div class="category-description">${category.description}</div>
      </div>
      <div class="category-stats">${category.domains.length} sites</div>
    `;

    // Add event listener for category toggle
    const checkbox = categoryItem.querySelector("input");
    checkbox.addEventListener("change", async function () {
      const updatedSettings = await getSettings();
      if (updatedSettings) {
        if (this.checked) {
          if (!updatedSettings.blockedCategories.includes(category.name)) {
            updatedSettings.blockedCategories.push(category.name);
          }
        } else {
          updatedSettings.blockedCategories =
            updatedSettings.blockedCategories.filter(
              (name) => name !== category.name,
            );
        }
        await saveSettings(updatedSettings);
        showNotification(
          this.checked
            ? `${category.name} blocking enabled`
            : `${category.name} blocking disabled`,
        );
      }
    });

    categoriesList.appendChild(categoryItem);
  });
}

// Load and display custom domains
async function loadCustomDomains() {
  const sites = await getBlockedSites();
  const customDomains = sites.filter((site) => site.custom);
  const domainsList = document.getElementById("domainsList");
  const emptyDomains = document.getElementById("emptyDomains");

  // Clear existing list (except empty state)
  domainsList.innerHTML = "";
  if (customDomains.length === 0) {
    emptyDomains.style.display = "block";
    domainsList.appendChild(emptyDomains);
    return;
  }

  emptyDomains.style.display = "none";

  // Add each custom domain
  customDomains.forEach((site) => {
    const domainItem = document.createElement("div");
    domainItem.className = "domain-item";
    domainItem.dataset.id = site.id;
    domainItem.innerHTML = `
      <div class="domain-info">
        <span class="domain-name">${site.domain}</span>
        <span class="domain-category">${site.category || "Custom"}</span>
      </div>
      <div class="domain-actions">
        <button class="action-button toggle-domain" data-enabled="${
          site.enabled
        }">
          ${site.enabled ? "Disable" : "Enable"}
        </button>
        <button class="action-button delete">Remove</button>
      </div>
    `;

    // Add event listeners
    const toggleBtn = domainItem.querySelector(".toggle-domain");
    const deleteBtn = domainItem.querySelector(".delete");

    toggleBtn.addEventListener("click", async function () {
      const newEnabled = !site.enabled;
      const success = await toggleSiteBlocking(site.id, newEnabled);
      if (success) {
        site.enabled = newEnabled;
        this.textContent = newEnabled ? "Disable" : "Enable";
        this.dataset.enabled = newEnabled;
        showNotification(
          newEnabled
            ? `${site.domain} enabled`
            : `${site.domain} disabled`,
        );
      }
    });

    deleteBtn.addEventListener("click", async function () {
      const success = await removeBlockedSite(site.id);
      if (success) {
        domainItem.remove();
        showNotification(`${site.domain} removed`);
        
        // Show empty state if no domains left
        const remainingDomains = await getBlockedSites();
        const remainingCustom = remainingDomains.filter((s) => s.custom);
        if (remainingCustom.length === 0) {
          emptyDomains.style.display = "block";
          domainsList.appendChild(emptyDomains);
        }
      }
    });

    domainsList.appendChild(domainItem);
  });
}

// Load and display statistics
async function loadStatistics() {
  const stats = await getBlockingStats();
  const statsGrid = document.getElementById("statsGrid");
  
  statsGrid.innerHTML = `
    <div class="stat-card">
      <div class="stat-value">${stats.totalBlocks || 0}</div>
      <div class="stat-label">Total Blocks</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.todayBlocks || 0}</div>
      <div class="stat-label">Blocks Today</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.customDomains || 0}</div>
      <div class="stat-label">Custom Domains</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${new Date().toLocaleDateString()}</div>
      <div class="stat-label">Last Updated</div>
    </div>
  `;
}

// Setup event listeners
function setupEventListeners() {
  // Back button
  document.getElementById("backBtn").addEventListener("click", function () {
    window.close(); // Close settings page
  });

  // Add domain button
  document.getElementById("addDomainBtn").addEventListener("click", addNewDomain);

  // Domain input enter key
  document.getElementById("domainInput").addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      addNewDomain();
    }
  });

  // Reset statistics button
  document.getElementById("resetStatsBtn").addEventListener("click", async function () {
    if (confirm("Are you sure you want to reset all statistics?")) {
      // Reset stats in storage
      const resetStats = {
        totalBlocks: 0,
        todayBlocks: 0,
        customDomains: 0,
        lastReset: Date.now(),
      };
      
      chrome.storage.sync.set({ blockingStats: resetStats }, function () {
        showNotification("Statistics reset");
        loadStatistics();
      });
    }
  });
}

// Add new custom domain
async function addNewDomain() {
  const domainInput = document.getElementById("domainInput");
  const categorySelect = document.getElementById("domainCategory");
  
  const domain = domainInput.value.trim();
  const category = categorySelect.value;
  
  if (!domain) {
    showNotification("Please enter a domain", "error");
    return;
  }
  
  // Basic domain validation
  if (!isValidDomain(domain)) {
    showNotification("Please enter a valid domain (e.g., example.com)", "error");
    return;
  }
  
  try {
    const newSite = await addCustomDomain(domain, category);
    showNotification(`${domain} added to blocked list`);
    
    // Clear input
    domainInput.value = "";
    
    // Reload domains list
    await loadCustomDomains();
    await loadStatistics();
  } catch (error) {
    showNotification("Error adding domain", "error");
    console.error("Error adding domain:", error);
  }
}

// Show notification
function showNotification(message, type = "success") {
  const notification = document.getElementById("notification");
  notification.textContent = message;
  notification.style.background = type === "error" ? "#f44336" : "#4CAF50";
  notification.style.display = "block";
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    notification.style.display = "none";
  }, 3000);
}

// Basic domain validation
function isValidDomain(domain) {
  // Simple domain validation - can be enhanced
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
  return domainRegex.test(domain) || domain.includes(".");
}

// Export for testing
window.SettingsManager = {
  loadSettings,
  loadCategories,
  loadCustomDomains,
  loadStatistics,
  addNewDomain,
};