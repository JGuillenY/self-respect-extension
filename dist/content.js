// Digital Wellbeing Chrome Extension - Domain Categories
// Categories designed to help users overcome urges and improve productivity
const DOMAIN_CATEGORIES = [
  {
    name: "Adult Content",
    description:
      "Adult websites that users may want to avoid for self-respect and wellbeing",
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
    redirectTo: "https://www.yourbrainonporn.com", // Educational resource about porn addiction
  },
  {
    name: "Social Media",
    description:
      "Major social networking platforms that can be time-consuming and affect self-esteem",
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
    redirectTo: "https://www.psychologytoday.com/us/basics/social-media", // Resource on social media psychology
  },
  {
    name: "Gambling",
    description:
      "Online gambling sites that can lead to addiction and financial harm",
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
    redirectTo: "https://www.ncpgambling.org/help-treatment/help-by-state/", // National Council on Problem Gambling
  },
];
// RSS/Positive alternatives category
const RSS_DOMAINS = [
  {
    name: "Positive Alternatives",
    description: "Educational and self-improvement websites to redirect to",
    domains: [], // These would be the positive sites you want to encourage
    redirectTo: "", // Would redirect within this category
  },
];
// Default redirect URL if no category-specific redirect is provided
const DEFAULT_REDIRECT_URL =
  "https://www.verywellmind.com/self-respect-4158202"; // Article on self-respect
// Helper function to check if a domain is in any category
function isDomainBlocked(domain) {
  const normalizedDomain = domain.toLowerCase().trim();
  return DOMAIN_CATEGORIES.some((category) =>
    category.domains.some((d) => d.toLowerCase() === normalizedDomain),
  );
}
// Helper function to get redirect URL for a domain
function getRedirectUrlForDomain(domain) {
  const normalizedDomain = domain.toLowerCase().trim();
  const category = DOMAIN_CATEGORIES.find((category) =>
    category.domains.some((d) => d.toLowerCase() === normalizedDomain),
  );
  return category?.redirectTo || DEFAULT_REDIRECT_URL;
}
//  all domains as a flat array for quick lookups
const ALL_BLOCKED_DOMAINS = DOMAIN_CATEGORIES.flatMap(
  (category) => category.domains,
);
// Original arrays for backward compatibility
const pornDomains =
  DOMAIN_CATEGORIES.find((c) => c.name === "Adult Content")?.domains || [];
const rssDomains = RSS_DOMAINS.flatMap((category) => category.domains);

// Check current domain on page load
function checkAndRedirect() {
  const currentDomain = window.location.hostname;
  console.log({ currentDomain });

  if (isDomainBlocked(currentDomain)) {
    console.log(`[Self Respect] Blocking domain: ${currentDomain}`);
    const redirectUrl = getRedirectUrlForDomain(currentDomain);
    // Create a blocking overlay before redirecting
    showBlockingOverlay(currentDomain, redirectUrl);
    // Redirect after a short delay to show the message
    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 3000);
  }
}
function showBlockingOverlay(blockedDomain, redirectUrl) {
  // Remove any existing overlay
  const existingOverlay = document.getElementById("self-respect-overlay");
  if (existingOverlay) {
    existingOverlay.remove();
  }
  // Create overlay
  const overlay = document.createElement("div");
  overlay.id = "self-respect-overlay";
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    z-index: 999999;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    text-align: center;
    padding: 20px;
  `;
  // Create content
  overlay.innerHTML = `
    <div style="max-width: 600px; background: rgba(255, 255, 255, 0.1); padding: 40px; border-radius: 20px; backdrop-filter: blur(10px);">
      <h1 style="font-size: 2.5em; margin-bottom: 20px;">🌱 Self Respect</h1>
      <p style="font-size: 1.2em; margin-bottom: 30px; line-height: 1.6;">
        You were about to visit <strong>${blockedDomain}</strong>.
      </p>
      <p style="font-size: 1.1em; margin-bottom: 40px; line-height: 1.6;">
        This site may not align with your goals for self-respect and wellbeing.
        You'll be redirected to a healthier alternative in 3 seconds.
      </p>
      <div style="background: rgba(255, 255, 255, 0.2); padding: 20px; border-radius: 10px; margin-bottom: 30px;">
        <p style="margin: 0; font-size: 1em;">
          Redirecting to: <br>
          <a href="${redirectUrl}" style="color: #a3e4d7; text-decoration: underline; word-break: break-all;">
            ${redirectUrl}
          </a>
        </p>
      </div>
      <div style="display: flex; gap: 15px; justify-content: center;">
        <button id="redirect-now" style="
          background: #4CAF50;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 1em;
          cursor: pointer;
          transition: background 0.3s;
        ">
          Redirect Now
        </button>
        <button id="cancel-redirect" style="
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 1em;
          cursor: pointer;
          transition: background 0.3s;
        ">
          Cancel (Temporarily Allow)
        </button>
      </div>
      <div style="margin-top: 40px; font-size: 0.9em; opacity: 0.8;">
        <p>Remember: Every choice you make shapes who you become.</p>
      </div>
    </div>
  `;
  // Add to page
  document.body.appendChild(overlay);
  // Add event listeners
  document.getElementById("redirect-now")?.addEventListener("click", () => {
    window.location.href = redirectUrl;
  });
  document.getElementById("cancel-redirect")?.addEventListener("click", () => {
    overlay.remove();
    // Could add temporary allowance logic here (e.g., allow for 5 minutes)
  });
}
// Run check when page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", checkAndRedirect);
} else {
  checkAndRedirect();
}
// Also check on history state changes (for SPAs)
window.addEventListener("popstate", checkAndRedirect);
