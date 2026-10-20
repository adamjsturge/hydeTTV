const form = document.querySelector("form");
const enabledInput = document.getElementById("enabled");
const channelField = document.getElementById("channel-field");
const channelLabel = document.getElementById("channel-label");
const channelInput = document.getElementById("channel");
const channelHint = document.getElementById("channel-hint");
const noCreatorNote = document.getElementById("no-creator");
const allPagesInput = document.getElementById("all-pages");
const savedSection = document.getElementById("saved");
const savedList = document.getElementById("saved-list");
const resetButton = document.getElementById("reset");
const accessNotice = document.getElementById("access");
const grantButton = document.getElementById("grant");
const status = document.querySelector(".status");

// Firefox may not grant site access at install; Chrome always does.
const ORIGINS = ext.runtime.getManifest().host_permissions;

let statusTimer = 0;
// Patreon handle of the creator in the active tab, or null.
let creator = null;
let channels = {};

function showStatus(message) {
    status.textContent = message;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => {
        status.textContent = "";
    }, 1500);
}

function save(values) {
    ext.storage.sync.set(values).then(() => showStatus("Saved"));
}

function setChannelHint(message, hasError = false) {
    channelInput.setAttribute("aria-invalid", String(hasError));
    channelHint.classList.toggle("is-error", hasError);
    channelHint.textContent = message;
}

function renderChannel() {
    channelField.hidden = !creator;
    noCreatorNote.hidden = Boolean(creator);
    if (!creator) {
        return;
    }
    const guess = guessChannel(creator);
    const saved = channels[creatorKey(creator)];
    channelLabel.textContent = `Twitch channel for ${creator}`;
    channelInput.value = saved ?? guess ?? "";
    channelInput.placeholder = guess ?? "Channel name or twitch.tv link";
    if (saved) {
        setChannelHint(
            guess
                ? `Saved for ${creator}. Clear it to use ${guess} again.`
                : `Saved for ${creator}.`
        );
    } else if (guess) {
        setChannelHint(
            "Guessed from their Patreon name. Enter a different channel " +
                "or twitch.tv link to save it for them."
        );
    } else {
        setChannelHint(
            "Couldn't guess one from their Patreon name. Enter their " +
                "channel or twitch.tv link."
        );
    }
}

function renderSaved() {
    const entries = Object.entries(channels).sort(([a], [b]) =>
        a.localeCompare(b)
    );
    savedSection.hidden = entries.length === 0;
    savedList.replaceChildren(
        ...entries.map(([key, savedChannel]) => {
            const item = document.createElement("li");
            const label = document.createElement("span");
            label.textContent = `${key} → ${savedChannel}`;
            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "small";
            remove.textContent = "Remove";
            remove.setAttribute(
                "aria-label",
                `Remove the saved Twitch channel for ${key}`
            );
            remove.addEventListener("click", () => saveChannels(key, null));
            item.append(label, remove);
            return item;
        })
    );
}

// Stores a creator's channel, or forgets it (null) so the guess is used.
function saveChannels(key, channel) {
    const next = { ...channels };
    if (channel) {
        next[key] = channel;
    } else {
        delete next[key];
    }
    channels = next;
    renderChannel();
    renderSaved();
    save({ channels: next });
}

function saveChannel() {
    const value = channelInput.value.trim();
    const channel = parseChannel(value);
    if (value && !channel) {
        setChannelHint("Enter a valid Twitch channel name", true);
        return;
    }
    const guess = guessChannel(creator);
    saveChannels(creatorKey(creator), channel === guess ? null : channel);
}

// The creator in the tab the popup was opened from. Desktop popups aren't
// tabs, but Firefox for Android opens the popup as its own tab, so there the
// most recently used Patreon tab is used instead of the active one.
async function findCreator() {
    const isPopupTab = Boolean(await ext.tabs.getCurrent());
    const tabs = await ext.tabs.query(
        isPopupTab
            ? { url: "https://www.patreon.com/*" }
            : { active: true, currentWindow: true }
    );
    const [tab] = tabs.sort(
        (a, b) => (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0)
    );
    return tab?.url ? parseCreator(tab.url) : null;
}

Promise.all([ext.storage.sync.get(DEFAULT_SETTINGS), findCreator()]).then(
    ([settings, tabCreator]) => {
        creator = tabCreator;
        channels = settings.channels;
        enabledInput.checked = settings.isEnabled;
        allPagesInput.checked = settings.isOnAllPages;
        form.elements.theme.value =
            settings.theme === "light" ? "light" : "dark";
        form.elements.placement.value =
            settings.placement === "float" ? "float" : "dock";
        renderChannel();
        renderSaved();
    }
);

ext.permissions.contains({ origins: ORIGINS }).then((hasAccess) => {
    accessNotice.hidden = hasAccess;
});

// Firefox only allows the request directly in the click handler.
grantButton.addEventListener("click", () => {
    ext.permissions.request({ origins: ORIGINS }).then((isGranted) => {
        if (isGranted) {
            accessNotice.hidden = true;
            showStatus("Access allowed. Refresh the Patreon tab.");
        }
    });
});

enabledInput.addEventListener("change", () => {
    save({ isEnabled: enabledInput.checked });
});

allPagesInput.addEventListener("change", () => {
    save({ isOnAllPages: allPagesInput.checked });
});

channelInput.addEventListener("change", saveChannel);

form.addEventListener("submit", (event) => {
    event.preventDefault();
    saveChannel();
});

for (const name of ["theme", "placement"]) {
    for (const radio of form.elements[name]) {
        radio.addEventListener("change", () => save({ [name]: radio.value }));
    }
}

resetButton.addEventListener("click", () => {
    ext.storage.local.remove("layout").then(() => {
        showStatus("Panel position reset");
    });
});
