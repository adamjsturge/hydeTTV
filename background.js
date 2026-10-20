// Chrome and Brave. Twitch's chat embed runs as a third-party iframe on
// patreon.com, so with third-party cookies blocked (Chrome's setting, Brave
// Shields) it can't see the Twitch login and chat stays logged out. This adds
// a cookie exception for twitch.tv only while it's embedded on patreon.com,
// the same as allowing it per site in the browser's cookie settings. The
// browser drops it if the extension is removed.
//
// Firefox uses background.firefox.js instead (see manifest.firefox.json).

function allowTwitchCookiesOnPatreon() {
    return chrome.contentSettings.cookies.set({
        primaryPattern: "https://*.twitch.tv/*",
        secondaryPattern: "https://www.patreon.com/*",
        setting: "allow",
    });
}

chrome.runtime.onInstalled.addListener(allowTwitchCookiesOnPatreon);
chrome.runtime.onStartup.addListener(allowTwitchCookiesOnPatreon);
