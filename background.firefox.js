// Firefox. Twitch's chat embed runs as a third-party iframe on patreon.com,
// and Total Cookie Protection gives twitch.tv its own cookie jar inside
// patreon.com, so the embed can't see the Twitch login and chat stays logged
// out. Firefox has no cookie-exception API, so the Twitch login cookies are
// copied into that jar and kept in sync. Only twitch.tv frames on
// patreon.com can read the copies, and they never leave the browser.
//
// Chrome and Brave use background.js instead (see manifest.json).

const LOGIN_COOKIES = new Set([
    "auth-token",
    "twilight-user",
    "login",
    "name",
    "persistent",
    "api_token",
    "unique_id",
    "unique_id_durable",
    "server_session_id",
]);

const PATREON_PARTITION = { topLevelSite: "https://patreon.com" };

function cookieUrl(cookie) {
    return `https://${cookie.domain.replace(/^\./, "")}${cookie.path}`;
}

function isLoginCookie(cookie) {
    return (
        LOGIN_COOKIES.has(cookie.name) &&
        !cookie.partitionKey &&
        /(^|\.)twitch\.tv$/.test(cookie.domain)
    );
}

function copyToPartition(cookie) {
    return browser.cookies.set({
        url: cookieUrl(cookie),
        name: cookie.name,
        value: cookie.value,
        path: cookie.path,
        ...(cookie.hostOnly ? {} : { domain: cookie.domain }),
        ...(cookie.session ? {} : { expirationDate: cookie.expirationDate }),
        secure: true,
        httpOnly: cookie.httpOnly,
        sameSite: "no_restriction",
        partitionKey: PATREON_PARTITION,
    });
}

// Overwrites the copy with an already-expired cookie, which only ever
// touches the partitioned jar and never the real Twitch login.
function expireCopy(cookie) {
    return browser.cookies.set({
        url: cookieUrl(cookie),
        name: cookie.name,
        value: "",
        path: cookie.path,
        ...(cookie.hostOnly ? {} : { domain: cookie.domain }),
        secure: true,
        sameSite: "no_restriction",
        partitionKey: PATREON_PARTITION,
        expirationDate: 1,
    });
}

async function copyLoginToPartition() {
    try {
        const cookies = await browser.cookies.getAll({ domain: "twitch.tv" });
        await Promise.all(cookies.filter(isLoginCookie).map(copyToPartition));
    } catch {
        // No access to twitch.tv yet; retried when it's granted.
    }
}

browser.cookies.onChanged.addListener(({ cookie, removed, cause }) => {
    // An updated cookie fires a removal ("overwrite") and then a set.
    if (!isLoginCookie(cookie) || (removed && cause === "overwrite")) {
        return;
    }
    const update = removed ? expireCopy(cookie) : copyToPartition(cookie);
    update.catch(() => {});
});

browser.runtime.onInstalled.addListener(copyLoginToPartition);
browser.runtime.onStartup.addListener(copyLoginToPartition);
// Firefox may only grant site access after install, from the popup.
browser.permissions.onAdded.addListener(copyLoginToPartition);
