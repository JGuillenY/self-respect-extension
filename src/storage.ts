// Storage management for Self Respect extension
// Handles blocked sites, custom domains, and user preferences

declare const chrome: any;

export interface BlockedSite {
  id: string;
  domain: string;
  category?: string;
  custom: boolean;
  enabled: boolean;
  createdAt: number;
}

export type BlockingLevel = "soft" | "puzzle" | "hard";

export interface UserSettings {
  enabled: boolean;
  customDomains: BlockedSite[];
  blockedCategories: string[]; // Category names that are enabled
  showNotifications: boolean;
  autoRedirect: boolean;
  redirectDelay: number; // in seconds
  blockingLevel: BlockingLevel;
  lastUpdated: number;
}

interface BlockingStats {
  totalBlocks: number;
  todayBlocks: number;
  customDomains: number;
  lastReset?: number;
}

// Default settings
const DEFAULT_SETTINGS: UserSettings = {
  enabled: true,
  customDomains: [],
  blockedCategories: ["Adult Content", "Social Media", "Gambling"],
  showNotifications: true,
  autoRedirect: true,
  redirectDelay: 3,
  blockingLevel: "soft",
  lastUpdated: Date.now(),
};

// Storage keys
const STORAGE_KEYS = {
  SETTINGS: "selfRespectSettings",
  BLOCKED_SITES: "blockedSites",
  STATS: "blockingStats",
} as const;

// Initialize storage with default values
export async function initializeStorage(): Promise<void> {
  const settings = await getSettings();
  if (!settings) {
    await saveSettings(DEFAULT_SETTINGS);
  }
}

// Get user settings
export async function getSettings(): Promise<UserSettings | null> {
  return new Promise((resolve) => {
    chrome.storage.sync.get([STORAGE_KEYS.SETTINGS], (result: any) => {
      resolve(result[STORAGE_KEYS.SETTINGS] || null);
    });
  });
}

// Save user settings
export async function saveSettings(settings: UserSettings): Promise<void> {
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

// Get all blocked sites (including custom ones)
export async function getBlockedSites(): Promise<BlockedSite[]> {
  return new Promise((resolve) => {
    chrome.storage.sync.get([STORAGE_KEYS.BLOCKED_SITES], (result: any) => {
      resolve(result[STORAGE_KEYS.BLOCKED_SITES] || []);
    });
  });
}

// Save blocked sites
export async function saveBlockedSites(sites: BlockedSite[]): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [STORAGE_KEYS.BLOCKED_SITES]: sites }, resolve);
  });
}

// Add a custom domain to block
export async function addCustomDomain(
  domain: string,
  category?: string,
): Promise<BlockedSite> {
  const sites = await getBlockedSites();
  const settings = await getSettings();
  
  const newSite: BlockedSite = {
    id: generateId(),
    domain: normalizeDomain(domain),
    category: category || "Custom",
    custom: true,
    enabled: true,
    createdAt: Date.now(),
  };

  sites.push(newSite);
  await saveBlockedSites(sites);

  // Also add to settings customDomains
  if (settings) {
    settings.customDomains.push(newSite);
    await saveSettings(settings);
  }

  return newSite;
}

// Remove a blocked site
export async function removeBlockedSite(id: string): Promise<boolean> {
  const sites = await getBlockedSites();
  const settings = await getSettings();
  
  const initialLength = sites.length;
  const filteredSites = sites.filter((site) => site.id !== id);
  
  if (filteredSites.length < initialLength) {
    await saveBlockedSites(filteredSites);
    
    // Also remove from settings customDomains
    if (settings) {
      settings.customDomains = settings.customDomains.filter(
        (site) => site.id !== id,
      );
      await saveSettings(settings);
    }
    
    return true;
  }
  
  return false;
}

// Toggle site blocking
export async function toggleSiteBlocking(id: string, enabled: boolean): Promise<boolean> {
  const sites = await getBlockedSites();
  const siteIndex = sites.findIndex((site) => site.id === id);
  
  if (siteIndex !== -1) {
    sites[siteIndex].enabled = enabled;
    await saveBlockedSites(sites);
    return true;
  }
  
  return false;
}

// Get blocking statistics
export async function getBlockingStats(): Promise<BlockingStats> {
  return new Promise((resolve) => {
    chrome.storage.sync.get([STORAGE_KEYS.STATS], (result: any) => {
      const stats: BlockingStats = result[STORAGE_KEYS.STATS] || {
        totalBlocks: 0,
        todayBlocks: 0,
        customDomains: 0,
        lastReset: Date.now(),
      };
      resolve(stats);
    });
  });
}

// Increment block counter
export async function incrementBlockCounter(): Promise<void> {
  const stats = await getBlockingStats();
  const today = new Date().toDateString();
  const lastReset = new Date(stats.lastReset || 0).toDateString();
  
  if (today !== lastReset) {
    stats.todayBlocks = 0;
  }
  
  stats.totalBlocks++;
  stats.todayBlocks++;
  stats.lastReset = Date.now();
  
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [STORAGE_KEYS.STATS]: stats }, resolve);
  });
}

// Check if a domain is blocked
export async function isDomainBlocked(domain: string): Promise<boolean> {
  const settings = await getSettings();
  if (!settings?.enabled) return false;
  
  const sites = await getBlockedSites();
  const normalizedDomain = normalizeDomain(domain);
  
  // Check custom domains first
  const customBlock = sites.find(
    (site) => site.enabled && site.custom && site.domain === normalizedDomain,
  );
  
  if (customBlock) return true;
  
  // Check predefined categories if enabled
  // This would integrate with the existing constants.ts logic
  return false;
}

// Helper functions
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function normalizeDomain(domain: string): string {
  return domain.toLowerCase().trim().replace(/^https?:\/\//, "").replace(/^www\./, "");
}

// Export for testing
export default {
  initializeStorage,
  getSettings,
  saveSettings,
  getBlockedSites,
  saveBlockedSites,
  addCustomDomain,
  removeBlockedSite,
  toggleSiteBlocking,
  getBlockingStats,
  incrementBlockCounter,
  isDomainBlocked,
};