const GOOGLE_DOMAIN = ".google.com";

// Clears cookies & metadata on browser startup
async function initializeSession() {
  console.log("Initializing session: clearing cookies & metadata.");
  const cookies = await chrome.cookies.getAll({ domain: GOOGLE_DOMAIN });
  for (const cookie of cookies) {
    chrome.cookies.remove({
      url: (cookie.secure ? "https://" : "http://") + cookie.domain + cookie.path,
      name: cookie.name
    });
  }

  await chrome.storage.local.clear();
  console.log("Cleared google.com cookies and session metadata.");
}

// Save cookies to metadata after successful login
async function saveGoogleCookies() {
  const cookies = await chrome.cookies.getAll({ domain: GOOGLE_DOMAIN });
  const sessionCookies = cookies.map(c => ({
    name: c.name,
    value: c.value,
    path: c.path,
    secure: c.secure,
    httpOnly: c.httpOnly,
    sameSite: c.sameSite,
    expirationDate: c.expirationDate
  }));
  await chrome.storage.local.set({ sessionCookies });
  console.log("Saved current Google session cookies.");
}

// Checks if we already have session cookies saved
async function hasSessionCookies() {
  const result = await chrome.storage.local.get("sessionCookies");
  return result.sessionCookies && result.sessionCookies.length > 0;
}

// On browser startup
initializeSession();

// Listen for navigation to a Google service
chrome.webRequest.onCompleted.addListener(
  async (details) => {
    const loggedIn = await hasSessionCookies();

    if (!loggedIn) {
      console.log("No session metadata yet — saving cookies.");
      await saveGoogleCookies();
    }
  },
  {
    urls: [
      "*://mail.google.com/*",
      "*://drive.google.com/*",
      "*://docs.google.com/*",
      "*://calendar.google.com/*"
    ],
    types: ["main_frame"]
  }
);
