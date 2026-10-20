// Loaded by both the content script and the popup.

// These are `var` (not `const`) because Firefox only shares `var`s and
// functions between content scripts, not top-level `const`/`let`.

// Firefox (and newer Chrome) expose the promise-based extension APIs as
// `browser`; older Chrome only has `chrome`.
var ext = globalThis.browser ?? globalThis.chrome;

var DEFAULT_SETTINGS = {
    // Twitch channel per creator, keyed by lowercase Patreon handle. Only
    // channels that differ from guessChannel() are stored.
    channels: {},
    isEnabled: true,
    theme: "dark",
    placement: "dock",
    isOnAllPages: false,
};

// Top-level patreon.com paths that aren't creator pages.
var PATREON_ROUTES = new Set([
    "about",
    "api",
    "apps",
    "c",
    "checkout",
    "collection",
    "create",
    "dashboard",
    "discover",
    "events",
    "explore",
    "home",
    "insights",
    "join",
    "library",
    "login",
    "messages",
    "notifications",
    "policy",
    "portal",
    "posts",
    "pricing",
    "product",
    "search",
    "settings",
    "signup",
    "user",
]);

// Accepts a bare channel name or any twitch.tv link (channel, popout, embed).
function parseChannel(value) {
    const trimmed = String(value || "").trim();
    const match = trimmed.match(
        /twitch\.tv\/(?:popout\/|embed\/)?([a-z0-9_]+)/i
    );
    const name = (match ? match[1] : trimmed).toLowerCase();
    return /^[a-z0-9_]{3,25}$/.test(name) ? name : null;
}

// The creator's Patreon handle from a patreon.com URL, e.g. "MisterHyde55"
// from /MisterHyde55/events/123 or /c/MisterHyde55.
function parseCreator(url) {
    let parsed;
    try {
        parsed = new URL(url);
    } catch {
        return null;
    }
    if (!/(^|\.)patreon\.com$/.test(parsed.hostname)) {
        return null;
    }
    const segments = parsed.pathname.split("/").filter(Boolean);
    const handle = segments[0] === "c" ? segments[1] : segments[0];
    if (!handle || PATREON_ROUTES.has(handle.toLowerCase())) {
        return null;
    }
    return decodeURIComponent(handle);
}

function creatorKey(creator) {
    return creator.toLowerCase();
}

// Most creators use the same name on both sites (MisterHyde55 is
// misterhyde55 on Twitch), so the guess is their handle minus anything a
// Twitch name can't contain.
function guessChannel(creator) {
    return parseChannel(creator.replace(/[^A-Za-z0-9_]/g, ""));
}

function channelFor(creator, channels) {
    return channels[creatorKey(creator)] ?? guessChannel(creator);
}
