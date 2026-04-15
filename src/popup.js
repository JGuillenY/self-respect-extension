// Self Respect Extension Popup
document.addEventListener("DOMContentLoaded", function () {
  const toggle = document.getElementById("toggleEnabled");
  const statusText = document.getElementById("statusText");

  // Load saved state
  chrome.storage.sync.get(["enabled"], function (result) {
    toggle.checked = result.enabled !== false; // default to true
    updateStatus(toggle.checked);
  });

  // Toggle event
  toggle.addEventListener("change", function () {
    const enabled = this.checked;
    chrome.storage.sync.set({ enabled: enabled });
    updateStatus(enabled);

    // Send message to content script
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "EXTENSION_TOGGLE",
        enabled: enabled,
      });
    });
  });

  // Button events
  document
    .getElementById("customizeBtn")
    .addEventListener("click", function () {
      alert("Customization feature coming soon!");
    });

  document
    .getElementById("viewStatsBtn")
    .addEventListener("click", function () {
      alert("Statistics feature coming soon!");
    });

  function updateStatus(enabled) {
    statusText.textContent = enabled ? "Active" : "Paused";
    statusText.style.color = enabled ? "#4CAF50" : "#FF9800";
  }
});
