import { isDomainBlocked as isPredefinedDomainBlocked, getRedirectUrlForDomain } from "./constants";
import { isDomainBlocked as isCustomDomainBlocked, incrementBlockCounter } from "./storage";

// Check current domain on page load
async function checkAndRedirect() {
  console.log("Running check and redirect");
  const currentDomain = window.location.hostname;

  console.log({ currentDomain });

  // Check if domain is blocked (either predefined or custom)
  const isBlocked = isPredefinedDomainBlocked(currentDomain) || await isCustomDomainBlocked(currentDomain);

  if (isBlocked) {
    console.log(`[Self Respect] Blocking domain: ${currentDomain}`);

    // Increment block counter
    await incrementBlockCounter();

    const redirectUrl = getRedirectUrlForDomain(currentDomain);

    // Create a blocking overlay before redirecting
    showBlockingOverlay(currentDomain, redirectUrl);

    // Redirect after a short delay to show the message
    // setTimeout(() => {
    //   window.location.href = redirectUrl;
    // }, 3000);
  }
}

function showBlockingOverlay(blockedDomain: string, redirectUrl: string) {
  console.log("Running show blocking overlay");
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
    background: linear-gradient(
      90deg,
      hsla(205, 46%, 10%, 1) 0%,
      hsla(191, 28%, 23%, 1) 50%,
      hsla(207, 41%, 27%, 1) 100%
    );

    background: -moz-linear-gradient(
      90deg,
      hsla(205, 46%, 10%, 1) 0%,
      hsla(191, 28%, 23%, 1) 50%,
      hsla(207, 41%, 27%, 1) 100%
    );

    background: -webkit-linear-gradient(
      90deg,
      hsla(205, 46%, 10%, 1) 0%,
      hsla(191, 28%, 23%, 1) 50%,
      hsla(207, 41%, 27%, 1) 100%
    );
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
      <h1 style="font-size: 2.5em; margin-bottom: 20px;">Self Respect ✊</h1>
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

  console.log(document.body);
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

checkAndRedirect();

// Export for testing
export { checkAndRedirect, showBlockingOverlay };
