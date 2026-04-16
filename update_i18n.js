// Script to help update i18n messages in settings.js
const fs = require('fs');
const path = require('path');

const settingsJsPath = path.join(__dirname, 'src', 'settings.js');
let content = fs.readFileSync(settingsJsPath, 'utf8');

// Map of hardcoded strings to i18n message keys
const stringMap = {
  // Notification messages
  '"Extension enabled"': 'chrome.i18n.getMessage("notificationExtensionEnabled")',
  '"Extension disabled"': 'chrome.i18n.getMessage("notificationExtensionDisabled")',
  '"Notifications enabled"': 'chrome.i18n.getMessage("notificationNotificationsEnabled")',
  '"Notifications disabled"': 'chrome.i18n.getMessage("notificationNotificationsDisabled")',
  '"Auto redirect enabled"': 'chrome.i18n.getMessage("notificationAutoRedirectEnabled")',
  '"Auto redirect disabled"': 'chrome.i18n.getMessage("notificationAutoRedirectDisabled")',
  '"Redirect delay set to"': 'chrome.i18n.getMessage("notificationRedirectDelaySet", [this.value])',
  '"Blocking level set to"': 'chrome.i18n.getMessage("notificationBlockingLevelSet", [this.value])',
  '"blocking enabled"': 'chrome.i18n.getMessage("notificationCategoryEnabled", [category.name])',
  '"blocking disabled"': 'chrome.i18n.getMessage("notificationCategoryDisabled", [category.name])',
  '"enabled"': 'chrome.i18n.getMessage("notificationDomainEnabled", [site.domain])',
  '"disabled"': 'chrome.i18n.getMessage("notificationDomainDisabled", [site.domain])',
  '"removed"': 'chrome.i18n.getMessage("notificationDomainRemoved", [site.domain])',
  '"Are you sure you want to reset all statistics?"': 'chrome.i18n.getMessage("confirmResetStatistics")',
  '"Statistics reset"': 'chrome.i18n.getMessage("notificationStatisticsReset")',
  '"Please enter a domain"': 'chrome.i18n.getMessage("errorPleaseEnterDomain")',
  '"Please enter a valid domain (e.g., example.com)"': 'chrome.i18n.getMessage("errorInvalidDomain")',
  '"added to blocked list"': 'chrome.i18n.getMessage("notificationDomainAdded", [domain])',
  '"Error adding domain"': 'chrome.i18n.getMessage("errorAddingDomain")',
};

// Simple replacement for now - in a real scenario we'd need more sophisticated parsing
console.log('This script shows what needs to be updated in settings.js:');
console.log('\nHardcoded strings that need i18n:');
for (const [key, value] of Object.entries(stringMap)) {
  if (content.includes(key)) {
    console.log(`- ${key} -> ${value}`);
  }
}

// Also check for DOMAIN_CATEGORIES strings
console.log('\nDOMAIN_CATEGORIES strings that need i18n:');
if (content.includes('"Adult Content"')) {
  console.log('- "Adult Content" -> chrome.i18n.getMessage("categoryAdultContentName")');
}
if (content.includes('"Adult websites that users may want to avoid for self-respect and wellbeing"')) {
  console.log('- "Adult websites that users may want to avoid for self-respect and wellbeing" -> chrome.i18n.getMessage("categoryAdultContentDesc")');
}
if (content.includes('"Social Media"')) {
  console.log('- "Social Media" -> chrome.i18n.getMessage("categorySocialMediaName")');
}
if (content.includes('"Major social networking platforms that can be time-consuming and affect self-esteem"')) {
  console.log('- "Major social networking platforms that can be time-consuming and affect self-esteem" -> chrome.i18n.getMessage("categorySocialMediaDesc")');
}
if (content.includes('"Gambling"')) {
  console.log('- "Gambling" -> chrome.i18n.getMessage("categoryGamblingName")');
}
if (content.includes('"Online gambling sites that can lead to addiction and financial harm"')) {
  console.log('- "Online gambling sites that can lead to addiction and financial harm" -> chrome.i18n.getMessage("categoryGamblingDesc")');
}