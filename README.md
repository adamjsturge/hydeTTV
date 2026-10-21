# hydeTTV

Browser extension (Chrome, Brave, Edge, Firefox) that puts each creator's
Twitch chat on their Patreon livestream (event) pages.

Not affiliated with or endorsed by Twitch or Patreon.

## Install

- **Chrome, Brave, Edge, Opera, Vivaldi:** Chrome Web Store (link coming
  soon)
- **Firefox and Firefox for Android:** addons.mozilla.org (link coming soon)

Then open a creator's Patreon event page (`patreon.com/<creator>/events/<id>`).

## Placement

Pick one in the toolbar popup.

- **In Patreon chat** (default): adds **Patreon / Twitch** tabs to the top
  of Patreon's chat sidebar. The Twitch tab swaps Patreon's chat for Twitch
  chat; the Patreon tab switches back. The last tab you picked is remembered.
  If the sidebar isn't showing (closed, narrow window, still loading), the
  floating panel is used instead after a few seconds.
  To make the chat narrower or wider, drag its left edge (a purple line shows
  on hover); the video takes up the rest. Double-click the edge to go back to
  Patreon's width. With the edge focused, arrow keys change the width and
  Enter resets it. The width is remembered.
- **Floating**: a panel you can drag by its header and resize from the
  left, right, or bottom edge. Position and size are remembered. Header
  buttons pop chat out, reload it, or minimize it (double-clicking the header
  also minimizes). Keyboard: focus the channel name, then arrow keys move,
  Shift + arrow keys resize, Enter minimizes.

The popup also switches dark/light chat, can show it on every Patreon page,
and resets the floating panel's position.

## Phones and narrow windows

Chrome and Brave on phones don't run extensions; Firefox for Android does.
On phone-sized layouts (under 768px wide), where Patreon puts the chat under
the video, the resize edge is hidden and Patreon's own width is used. In "In
Patreon chat" mode the tabs appear when Patreon's chat is open and no
floating panel is put over the video; in "Floating" mode the panel starts
across the bottom half of the screen.

## Which Twitch channel

Works on any creator's event page. Each creator's Twitch channel is guessed
from their Patreon handle in the URL, lowercased and stripped of anything
Twitch names can't contain, so `MisterHyde55` → `misterhyde55`. If a creator
streams under a different name, open their Patreon page, click the
extension, and enter their channel (or any twitch.tv link) under **Twitch
channel for <creator>**. It's saved for that creator only; clear the field to
go back to the guess. Saved channels are listed in the popup and sync with
your browser profile.

## Logging in to chat

Log into twitch.tv in the same browser, then reload the chat (reload button
or refresh the page). The chat is a twitch.tv frame inside patreon.com, which
browsers treat as third-party, so with third-party cookies blocked (Chrome's
setting, Brave Shields) it can't see your Twitch login.

- **Chrome, Brave and other Chromium browsers:** the extension adds a cookie
  exception for twitch.tv only while it's embedded on patreon.com, the same
  as allowing it per site in the browser's cookie settings. It works with
  Brave Shields up, and the browser drops it if the extension is removed.
- **Firefox:** there's no cookie-exception API. Total Cookie Protection gives
  twitch.tv a separate cookie jar inside patreon.com, so the extension copies
  your Twitch login cookies into that jar and keeps them in sync. Only
  twitch.tv frames on patreon.com can read them. If chat still says you're
  logged out, log in on twitch.tv, then hit the chat's reload button. If the
  popup shows **Allow access**, click it; Firefox can leave site access off
  until you do.

### Chatting as the channel owner or a mod

Twitch only lets the owner and mods chat in an embed when nothing covers it,
otherwise it shows "Chatting is disabled for channel owner/mods because the
Twitch Chat window is obscured by another element." Patreon keeps invisible
full-page layers above its chat column, so the docked chat is drawn in its own
top layer lined up with the space under the tabs. While the Twitch tab is
showing, a Patreon menu that opens over the chat area appears behind it;
switch to the Patreon tab to use it.

Twitch checks this with an API Firefox doesn't have, so owner/mod chatting
in Firefox depends on how Twitch handles that. If it says the chat is
obscured, use the pop-out button.

## Privacy

Nothing is collected or sent anywhere. See [PRIVACY.md](PRIVACY.md).

## How it works

The chat is Twitch's official embed
(`twitch.tv/embed/<channel>/chat?parent=www.patreon.com`), which Twitch
allows inside `www.patreon.com`.

Docking finds Patreon's chat column by its header's CSS-module class
(`Chat-module__…__sidebarHeader`, ignoring the build hash). If Patreon
renames that, docking stops finding it and the floating panel takes over.

Each browser gets its own manifest and background script, so each asks only
for what it uses:

| | Chrome / Brave (`manifest.json`) | Firefox (`manifest.firefox.json`) |
| --- | --- | --- |
| Background | `background.js` | `background.firefox.js` |
| Permissions | `storage`, `contentSettings` (cookie exception) | `storage`, `cookies` (login copy) |
| Site access | www.patreon.com | www.patreon.com, twitch.tv (for the cookies) |

The content script (`shared.js`, `content.js`) and popup are shared.

## Development

- **Chrome / Brave:** open `chrome://extensions` (`brave://extensions`), turn
  on **Developer mode**, click **Load unpacked** and pick this folder. After
  changes, click the reload arrow on the extension's card and refresh the
  Patreon tab.
- **Build:** `./build.sh` (needs `jq` and `zip`) writes the store zips to
  `dist/` and an unpacked Firefox build to `dist/firefox/`. Both manifests
  must have the same version. `make build` runs the same script.
- **Release:** `make bump` bumps the patch version in both manifests
  (`PART=minor` or `PART=major` for the others); `make release` bumps, then
  builds.
- **Firefox:** run `./build.sh`, open `about:debugging#/runtime/this-firefox`,
  click **Load Temporary Add-on…** and pick `dist/firefox/manifest.json`.
  Temporary add-ons are removed when Firefox quits. Lint with
  `npx web-ext lint --source-dir dist/firefox`.
- **Firefox for Android:** with a phone connected over USB debugging,
  `npx web-ext run --source-dir dist/firefox --target=firefox-android`.

Store listing text and screenshots are in `store/`.

## License

[MIT](LICENSE)
