import {
  isDomainBlocked as isPredefinedDomainBlocked,
  getRedirectUrlForDomain,
} from "./constants";
import {
  isDomainBlocked as isCustomDomainBlocked,
  incrementBlockCounter,
  getSettings,
} from "./storage";
import { generatePuzzle, validateAnswer, getHint } from "./puzzle";

declare const chrome: any;

// Check current domain on page load
async function checkAndRedirect() {
  console.log("Running check and redirect");
  const currentDomain = window.location.hostname;

  console.log({ currentDomain });

  // Check if domain is blocked (either predefined or custom)
  const isBlocked =
    isPredefinedDomainBlocked(currentDomain) ||
    (await isCustomDomainBlocked(currentDomain));

  if (isBlocked) {
    console.log(`[Self Respect] Blocking domain: ${currentDomain}`);

    // Increment block counter
    await incrementBlockCounter();

    // Get user settings
    const settings = await getSettings();
    const blockingLevel = settings?.blockingLevel || "soft";
    const autoRedirect = settings?.autoRedirect !== false; // default to true
    const redirectDelay = settings?.redirectDelay || 3;
    const redirectUrl = getRedirectUrlForDomain(currentDomain);

    // Handle different blocking levels
    switch (blockingLevel) {
      case "soft":
        showSoftBlockOverlay(
          currentDomain,
          redirectUrl,
          autoRedirect,
          redirectDelay,
        );
        break;
      case "puzzle":
        showPuzzleBlockOverlay(
          currentDomain,
          redirectUrl,
          autoRedirect,
          redirectDelay,
        );
        break;
      case "hard":
        showHardBlockOverlay(
          currentDomain,
          redirectUrl,
          autoRedirect,
          redirectDelay,
        );
        break;
      default:
        showSoftBlockOverlay(
          currentDomain,
          redirectUrl,
          autoRedirect,
          redirectDelay,
        );
    }
  }
}

// Helper function to remove existing overlay
function removeExistingOverlay() {
  const existingOverlay = document.getElementById("self-respect-overlay");
  if (existingOverlay) {
    existingOverlay.remove();
  }
}

// Helper function to create base overlay
function createBaseOverlay(): HTMLDivElement {
  const overlay = document.createElement("div");
  overlay.id = "self-respect-overlay";
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #1b1b1b;
    color: white;
    z-index: 999999;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    text-align: center;
    padding: 20px;
    overflow-y: auto;
  `;

  // Add CSS for buttons
  const style = document.createElement("style");
  style.textContent = `
    .overlay-button {
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 1em;
      cursor: pointer;
      transition: all 0.3s;
      border: none;
      font-weight: 500;
    }
    .overlay-button.primary {
      background: #4CAF50;
      color: white;
    }
    .overlay-button.primary:hover {
      background: #45a049;
      transform: translateY(-2px);
    }
    .overlay-button.secondary {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
    .overlay-button.secondary:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-2px);
    }
    .overlay-button.small {
      padding: 8px 16px;
      font-size: 0.9em;
    }
    .overlay-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none !important;
    }
  `;
  document.head.appendChild(style);

  return overlay;
}

// Soft Block - Current implementation with redirect option
function showSoftBlockOverlay(
  blockedDomain: string,
  redirectUrl: string,
  autoRedirect: boolean = true,
  redirectDelay: number = 3,
) {
  console.log("Running soft block overlay", { autoRedirect, redirectDelay });
  removeExistingOverlay();

  const countdownMessage = autoRedirect
    ? chrome.i18n.getMessage("redirectDelayMessage", [redirectDelay])
    : chrome.i18n.getMessage("noRedirectDelayMessage");

  const redirectInfo = autoRedirect
    ? `<div style="background: rgba(255, 255, 255, 0.2); padding: 20px; border-radius: 10px; margin-bottom: 30px;">
        <p style="margin: 0; font-size: 1em;">
          ${chrome.i18n.getMessage("redirectingTo")} <br>
          <a href="${redirectUrl}" style="color: #a3e4d7; text-decoration: underline; word-break: break-all;">
            ${redirectUrl}
          </a>
        </p>
      </div>`
    : "";

  const overlay = createBaseOverlay();
  overlay.innerHTML = `
    <div style="max-width: 600px; background: rgba(255, 255, 255, 0.1); padding: 40px; border-radius: 20px; backdrop-filter: blur(10px);">
      <h1 style="font-size: 2.5em; margin-bottom: 20px;">Self Respect ✊</h1>
      <p style="font-size: 1.2em; margin-bottom: 30px; line-height: 1.6;">
        ${chrome.i18n.getMessage("youWereAboutToVisit")} <strong>${blockedDomain}</strong>.
      </p>
      <p style="font-size: 1.1em; margin-bottom: 40px; line-height: 1.6;">
        ${countdownMessage}
      </p>
      ${redirectInfo}
      <div style="display: flex; gap: 15px; justify-content: center;">
        <button id="redirect-now" class="overlay-button primary">
          ${autoRedirect ? chrome.i18n.getMessage("redirectNow") : chrome.i18n.getMessage("healthierAlternative")}
        </button>
        <button id="cancel-redirect" class="overlay-button secondary">
          ${chrome.i18n.getMessage("cancelMessage")}
        </button>
      </div>
      <div style="margin-top: 40px; font-size: 0.9em; opacity: 0.8;">
        <p>${chrome.i18n.getMessage("phrase1")}</p>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Start auto-redirect timer if enabled
  let redirectTimer: number | null = null;
  if (autoRedirect) {
    redirectTimer = window.setTimeout(() => {
      window.location.href = redirectUrl;
    }, redirectDelay * 1000);

    // Update countdown display every second
    let timeLeft = redirectDelay;
    const countdownInterval = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(countdownInterval);
      }
    }, 1000);
  }

  document.getElementById("redirect-now")?.addEventListener("click", () => {
    if (redirectTimer) {
      clearTimeout(redirectTimer);
    }
    window.location.href = redirectUrl;
  });

  document.getElementById("cancel-redirect")?.addEventListener("click", () => {
    if (redirectTimer) {
      clearTimeout(redirectTimer);
    }
    overlay.remove();
  });
}

// Puzzle Block - Requires solving a hard puzzle
function showPuzzleBlockOverlay(
  blockedDomain: string,
  redirectUrl: string,
  autoRedirect: boolean = true,
  redirectDelay: number = 3,
) {
  console.log("Running puzzle block overlay", { autoRedirect, redirectDelay });
  removeExistingOverlay();

  const puzzle = generatePuzzle(8); // Generate hard puzzle (difficulty 8+)
  let attemptCount = 0;
  const maxAttempts = 5;
  const timeoutMinutes = 10; // 10 minute timeout

  const overlay = createBaseOverlay();
  overlay.innerHTML = `
    <div style="max-width: 700px; background: rgba(255, 255, 255, 0.1); padding: 40px; border-radius: 20px; backdrop-filter: blur(10px);">
      <h1 style="font-size: 2.5em; margin-bottom: 20px;">Self Respect ✊ - ${chrome.i18n.getMessage("puzzleBlockTitle")}</h1>
      <p style="font-size: 1.2em; margin-bottom: 30px; line-height: 1.6;">
        ${chrome.i18n.getMessage("youWereAboutToVisit")} <strong>${blockedDomain}</strong>.
      </p>
      <p style="font-size: 1.1em; margin-bottom: 20px; line-height: 1.6;">
        ${chrome.i18n.getMessage("puzzleBlockDescription")}
      </p>
      
      <div style="background: rgba(0, 0, 0, 0.3); padding: 25px; border-radius: 15px; margin-bottom: 30px;">
        <h2 style="font-size: 1.5em; margin-bottom: 15px; color: #a3e4d7;">Puzzle Challenge</h2>
        <p style="font-size: 1.3em; margin-bottom: 20px; font-weight: 500;">${puzzle.question}</p>
        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
          <input 
            type="text" 
            id="puzzle-answer" 
            placeholder="${chrome.i18n.getMessage("placeholderEnterAnswer")}" 
            style="
              flex: 1;
              padding: 12px 15px;
              border: 2px solid rgba(255, 255, 255, 0.3);
              background: rgba(255, 255, 255, 0.1);
              border-radius: 8px;
              color: white;
              font-size: 1em;
            "
          />
          <button id="submit-puzzle" class="overlay-button primary">${chrome.i18n.getMessage("buttonSubmit")}</button>
        </div>
        <div id="puzzle-feedback" style="min-height: 24px; margin-top: 10px;"></div>
        <div style="display: flex; justify-content: space-between; margin-top: 20px; font-size: 0.9em; opacity: 0.8;">
          <div>${chrome.i18n.getMessage("labelAttempts")} <span id="attempt-count">0</span>/${maxAttempts}</div>
          <div>${chrome.i18n.getMessage("labelTimeout")} ${timeoutMinutes} minutes</div>
          <button id="show-hint" class="overlay-button small">${chrome.i18n.getMessage("buttonShowHint")}</button>
        </div>
      </div>
      
      <div id="puzzle-success" style="display: none;">
        <div style="background: rgba(76, 175, 80, 0.2); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
          <p style="font-size: 1.2em; margin: 0; color: #4CAF50;">
            ✅ ${chrome.i18n.getMessage("puzzleSuccessMessage")}
          </p>
        </div>
        <div style="display: flex; gap: 15px; justify-content: center;">
          <button id="proceed-to-site" class="overlay-button primary">${chrome.i18n.getMessage("buttonProceedToSite", [blockedDomain])}</button>
          <button id="choose-alternative" class="overlay-button secondary">
            ${autoRedirect ? chrome.i18n.getMessage("buttonChooseAlternative") : chrome.i18n.getMessage("healthierAlternative")}
          </button>
        </div>
      </div>
      
      <div style="margin-top: 30px; font-size: 0.9em; opacity: 0.8;">
        <p>${chrome.i18n.getMessage("puzzleFooter")}</p>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const answerInput = document.getElementById(
    "puzzle-answer",
  ) as HTMLInputElement;
  const submitButton = document.getElementById("submit-puzzle");
  const feedbackDiv = document.getElementById("puzzle-feedback");
  const attemptCountSpan = document.getElementById("attempt-count");
  const showHintButton = document.getElementById("show-hint");
  const puzzleSuccessDiv = document.getElementById("puzzle-success");
  const proceedButton = document.getElementById("proceed-to-site");
  const alternativeButton = document.getElementById("choose-alternative");

  // Start timeout timer
  let timeLeft = timeoutMinutes * 60;
  const timerInterval = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      feedbackDiv!.innerHTML = `<p style="color: #f44336;">⏰ ${chrome.i18n.getMessage("feedbackTimeout")}</p>`;
      setTimeout(() => location.reload(), 3000);
    }
  }, 1000);

  submitButton?.addEventListener("click", () => {
    const userAnswer = answerInput.value.trim();
    if (!userAnswer) {
      feedbackDiv!.innerHTML = `<p style="color: #ff9800;">${chrome.i18n.getMessage("errorPleaseEnterAnswer")}</p>`;
      return;
    }

    attemptCount++;
    attemptCountSpan!.textContent = attemptCount.toString();

    if (validateAnswer(puzzle, userAnswer)) {
      // Puzzle solved!
      clearInterval(timerInterval);
      feedbackDiv!.innerHTML = `<p style="color: #4CAF50;">✅ ${chrome.i18n.getMessage("feedbackCorrectAnswer")}</p>`;
      puzzleSuccessDiv!.style.display = "block";
      submitButton.setAttribute("disabled", "true");
      answerInput.setAttribute("disabled", "true");
    } else {
      // Wrong answer
      if (attemptCount >= maxAttempts) {
        feedbackDiv!.innerHTML = `<p style="color: #f44336;">❌ ${chrome.i18n.getMessage("feedbackMaxAttempts")}</p>`;
        submitButton.setAttribute("disabled", "true");
        answerInput.setAttribute("disabled", "true");
        setTimeout(() => location.reload(), 3000);
      } else {
        feedbackDiv!.innerHTML = `<p style="color: #ff9800;">❌ ${chrome.i18n.getMessage("feedbackIncorrectAnswer", [`${attemptCount}/${maxAttempts}`])}</p>`;
      }
    }
  });

  showHintButton?.addEventListener("click", () => {
    const hint = getHint(puzzle, attemptCount);
    feedbackDiv!.innerHTML = `<p style="color: #a3e4d7;">💡 ${chrome.i18n.getMessage("hintMessage", [hint])}</p>`;
  });

  proceedButton?.addEventListener("click", () => {
    overlay.remove();
    // Allow access to the site
  });

  alternativeButton?.addEventListener("click", () => {
    window.location.href = redirectUrl;
  });

  // Allow Enter key to submit
  answerInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      submitButton?.click();
    }
  });
}

// Hard Block - No access allowed
function showHardBlockOverlay(
  blockedDomain: string,
  redirectUrl: string,
  autoRedirect: boolean = true,
  redirectDelay: number = 3,
) {
  console.log("Running hard block overlay", { autoRedirect, redirectDelay });
  removeExistingOverlay();

  const overlay = createBaseOverlay();
  overlay.innerHTML = `
    <div style="max-width: 600px; background: rgba(255, 255, 255, 0.1); padding: 40px; border-radius: 20px; backdrop-filter: blur(10px);">
      <h1 style="font-size: 2.5em; margin-bottom: 20px;">Self Respect ✊ - ${chrome.i18n.getMessage("hardBlockTitle")}</h1>
      <p style="font-size: 1.2em; margin-bottom: 30px; line-height: 1.6;">
        ${chrome.i18n.getMessage("hardBlockMessage", [blockedDomain])}
      </p>
      <p style="font-size: 1.1em; margin-bottom: 40px; line-height: 1.6;">
        ${chrome.i18n.getMessage("hardBlockDescription")}
        ${autoRedirect ? chrome.i18n.getMessage("redirectDelayMessage", [redirectDelay]) : ""}
      </p>
      <div style="background: rgba(244, 67, 54, 0.2); padding: 25px; border-radius: 15px; margin-bottom: 30px; border: 2px solid rgba(244, 67, 54, 0.5);">
        <p style="font-size: 1.3em; margin: 0; color: #f44336; text-align: center;">
          ⚠️ ${chrome.i18n.getMessage("hardBlockWarning")} ⚠️
        </p>
        <p style="margin: 15px 0 0 0; font-size: 1.1em; opacity: 0.9;">
          ${chrome.i18n.getMessage("hardBlockWarningDesc")}
        </p>
      </div>
      ${
        autoRedirect
          ? `
      <div style="background: rgba(255, 255, 255, 0.2); padding: 20px; border-radius: 10px; margin-bottom: 30px;">
        <p style="margin: 0; font-size: 1em;">
          ${chrome.i18n.getMessage("redirectingTo")} <br>
          <a href="${redirectUrl}" style="color: #a3e4d7; text-decoration: underline; word-break: break-all;">
            ${redirectUrl}
          </a>
        </p>
      </div>`
          : ""
      }
      <div style="display: flex; gap: 15px; justify-content: center;">
        <button id="redirect-now" class="overlay-button primary">
          ${chrome.i18n.getMessage("healthierAlternative")}
        </button>
      </div>
      <div style="margin-top: 40px; font-size: 0.9em; opacity: 0.8;">
        <p>${chrome.i18n.getMessage("hardBlockFooter")}</p>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Start auto-redirect timer if enabled
  let redirectTimer: number | null = null;
  if (autoRedirect) {
    redirectTimer = window.setTimeout(() => {
      window.location.href = redirectUrl;
    }, redirectDelay * 1000);

    // Update countdown display every second
    let timeLeft = redirectDelay;
    const countdownInterval = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(countdownInterval);
      }
    }, 1000);
  }

  document.getElementById("redirect-now")?.addEventListener("click", () => {
    if (redirectTimer) {
      clearTimeout(redirectTimer);
    }
    window.location.href = redirectUrl;
  });
}

checkAndRedirect();

// Export for testing
export {
  checkAndRedirect,
  showSoftBlockOverlay,
  showPuzzleBlockOverlay,
  showHardBlockOverlay,
};
