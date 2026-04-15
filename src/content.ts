import { isDomainBlocked as isPredefinedDomainBlocked, getRedirectUrlForDomain } from "./constants";
import { isDomainBlocked as isCustomDomainBlocked, incrementBlockCounter, getSettings } from "./storage";
import { generatePuzzle, validateAnswer, getHint } from "./puzzle";

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

    // Get user settings to determine blocking level
    const settings = await getSettings();
    const blockingLevel = settings?.blockingLevel || "soft";
    const redirectUrl = getRedirectUrlForDomain(currentDomain);

    // Handle different blocking levels
    switch (blockingLevel) {
      case "soft":
        showSoftBlockOverlay(currentDomain, redirectUrl);
        break;
      case "puzzle":
        showPuzzleBlockOverlay(currentDomain, redirectUrl);
        break;
      case "hard":
        showHardBlockOverlay(currentDomain, redirectUrl);
        break;
      default:
        showSoftBlockOverlay(currentDomain, redirectUrl);
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
    background: linear-gradient(
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
function showSoftBlockOverlay(blockedDomain: string, redirectUrl: string) {
  console.log("Running soft block overlay");
  removeExistingOverlay();

  const overlay = createBaseOverlay();
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
        <button id="redirect-now" class="overlay-button primary">
          Redirect Now
        </button>
        <button id="cancel-redirect" class="overlay-button secondary">
          Cancel (Temporarily Allow)
        </button>
      </div>
      <div style="margin-top: 40px; font-size: 0.9em; opacity: 0.8;">
        <p>Remember: Every choice you make shapes who you become.</p>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById("redirect-now")?.addEventListener("click", () => {
    window.location.href = redirectUrl;
  });

  document.getElementById("cancel-redirect")?.addEventListener("click", () => {
    overlay.remove();
  });
}

// Puzzle Block - Requires solving a hard puzzle
function showPuzzleBlockOverlay(blockedDomain: string, redirectUrl: string) {
  console.log("Running puzzle block overlay");
  removeExistingOverlay();

  const puzzle = generatePuzzle(8); // Generate hard puzzle (difficulty 8+)
  let attemptCount = 0;
  const maxAttempts = 5;
  const timeoutMinutes = 10; // 10 minute timeout

  const overlay = createBaseOverlay();
  overlay.innerHTML = `
    <div style="max-width: 700px; background: rgba(255, 255, 255, 0.1); padding: 40px; border-radius: 20px; backdrop-filter: blur(10px);">
      <h1 style="font-size: 2.5em; margin-bottom: 20px;">Self Respect ✊ - Puzzle Block</h1>
      <p style="font-size: 1.2em; margin-bottom: 30px; line-height: 1.6;">
        You were about to visit <strong>${blockedDomain}</strong>.
      </p>
      <p style="font-size: 1.1em; margin-bottom: 20px; line-height: 1.6;">
        To access this site, you must solve a difficult puzzle.
        This is to ensure you truly want to proceed.
      </p>
      
      <div style="background: rgba(0, 0, 0, 0.3); padding: 25px; border-radius: 15px; margin-bottom: 30px;">
        <h2 style="font-size: 1.5em; margin-bottom: 15px; color: #a3e4d7;">Puzzle Challenge</h2>
        <p style="font-size: 1.3em; margin-bottom: 20px; font-weight: 500;">${puzzle.question}</p>
        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
          <input 
            type="text" 
            id="puzzle-answer" 
            placeholder="Enter your answer..." 
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
          <button id="submit-puzzle" class="overlay-button primary">Submit</button>
        </div>
        <div id="puzzle-feedback" style="min-height: 24px; margin-top: 10px;"></div>
        <div style="display: flex; justify-content: space-between; margin-top: 20px; font-size: 0.9em; opacity: 0.8;">
          <div>Attempts: <span id="attempt-count">0</span>/${maxAttempts}</div>
          <div>Timeout: ${timeoutMinutes} minutes</div>
          <button id="show-hint" class="overlay-button small">Show Hint</button>
        </div>
      </div>
      
      <div id="puzzle-success" style="display: none;">
        <div style="background: rgba(76, 175, 80, 0.2); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
          <p style="font-size: 1.2em; margin: 0; color: #4CAF50;">
            ✅ Puzzle solved correctly! You may proceed if you still wish to.
          </p>
        </div>
        <div style="display: flex; gap: 15px; justify-content: center;">
          <button id="proceed-to-site" class="overlay-button primary">Proceed to ${blockedDomain}</button>
          <button id="choose-alternative" class="overlay-button secondary">Choose Healthier Alternative</button>
        </div>
      </div>
      
      <div style="margin-top: 30px; font-size: 0.9em; opacity: 0.8;">
        <p>This puzzle is designed to make you pause and reconsider your choice.</p>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const answerInput = document.getElementById("puzzle-answer") as HTMLInputElement;
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
      feedbackDiv!.innerHTML = `<p style="color: #f44336;">⏰ Time's up! The page will reload with a new puzzle.</p>`;
      setTimeout(() => location.reload(), 3000);
    }
  }, 1000);

  submitButton?.addEventListener("click", () => {
    const userAnswer = answerInput.value.trim();
    if (!userAnswer) {
      feedbackDiv!.innerHTML = `<p style="color: #ff9800;">Please enter an answer.</p>`;
      return;
    }

    attemptCount++;
    attemptCountSpan!.textContent = attemptCount.toString();

    if (validateAnswer(puzzle, userAnswer)) {
      // Puzzle solved!
      clearInterval(timerInterval);
      feedbackDiv!.innerHTML = `<p style="color: #4CAF50;">✅ Correct! Well done.</p>`;
      puzzleSuccessDiv!.style.display = 'block';
      submitButton.setAttribute('disabled', 'true');
      answerInput.setAttribute('disabled', 'true');
    } else {
      // Wrong answer
      if (attemptCount >= maxAttempts) {
        feedbackDiv!.innerHTML = `<p style="color: #f44336;">❌ Maximum attempts reached. Page will reload with a new puzzle.</p>`;
        submitButton.setAttribute('disabled', 'true');
        answerInput.setAttribute('disabled', 'true');
        setTimeout(() => location.reload(), 3000);
      } else {
        feedbackDiv!.innerHTML = `<p style="color: #ff9800;">❌ Incorrect. Try again. Attempts: ${attemptCount}/${maxAttempts}</p>`;
      }
    }
  });

  showHintButton?.addEventListener("click", () => {
    const hint = getHint(puzzle, attemptCount);
    feedbackDiv!.innerHTML = `<p style="color: #a3e4d7;">💡 Hint: ${hint}</p>`;
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
function showHardBlockOverlay(blockedDomain: string, redirectUrl: string) {
  console.log("Running hard block overlay");
  removeExistingOverlay();

  const overlay = createBaseOverlay();
  overlay.innerHTML = `
    <div style="max-width: 600px; background: rgba(255, 255, 255, 0.1); padding: 40px; border-radius: 20px; backdrop-filter: blur(10px);">
      <h1 style="font-size: 2.5em; margin-bottom: 20px;">Self Respect ✊ - Hard Block</h1>
      <p style="font-size: 1.2em; margin-bottom: 30px; line-height: 1.6;">
        Access to <strong>${blockedDomain}</strong> is permanently blocked.
      </p>
      <p style="font-size: 1.1em; margin-bottom: 40px; line-height: 1.6;">
        This site is incompatible with your self-respect goals.
        Access is not permitted under any circumstances.
      </p>
      <div style="background: rgba(244, 67, 54, 0.2); padding: 25px; border-radius: 15px; margin-bottom: 30px; border: 2px solid rgba(244, 67, 54, 0.5);">
        <p style="font-size: 1.3em; margin: 0; color: #f44336; text-align: center;">
          ⚠️ HARD BLOCK ACTIVATED ⚠️
        </p>
        <p style="margin: 15px 0 0 0; font-size: 1.1em; opacity: 0.9;">
          This is your highest level of protection. No bypass options are available.
        </p>
      </div>
      <div style="background: rgba(255, 255, 255, 0.2); padding: 20px; border-radius: 10px; margin-bottom: 30px;">
        <p style="margin: 0; font-size: 1em;">
          You will be redirected to: <br>
          <a href="${redirectUrl}" style="color: #a3e4d7; text-decoration: underline; word-break: break-all;">
            ${redirectUrl}
          </a>
        </p>
      </div>
      <div style="display: flex; gap: 15px; justify-content: center;">
        <button id="redirect-now" class="overlay-button primary">
          Go to Healthier Alternative
        </button>
      </div>
      <div style="margin-top: 40px; font-size: 0.9em; opacity: 0.8;">
        <p>This hard block protects you from sites that conflict with your core values.</p>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById("redirect-now")?.addEventListener("click", () => {
    window.location.href = redirectUrl;
  });
}

checkAndRedirect();

// Export for testing
export { checkAndRedirect, showSoftBlockOverlay, showPuzzleBlockOverlay, showHardBlockOverlay };