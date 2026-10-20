# Store listing

Everything to paste into the Chrome Web Store and addons.mozilla.org (AMO)
dashboards. Upload `dist/hydettv-chrome-<version>.zip` to Chrome and
`dist/hydettv-firefox-<version>.zip` to AMO (run `./build.sh` first).

## Shared

- **Name:** hydeTTV: Twitch chat for Patreon (comes from the manifest)
- **Homepage:** https://github.com/adamjsturge/hydeTTV
- **Support:** https://github.com/adamjsturge/hydeTTV/issues
- **Privacy policy:**
  https://github.com/adamjsturge/hydeTTV/blob/main/PRIVACY.md
- **Screenshots:** `store/screenshots/1-docked.png` through `5-popup.png`
  (1280×800), in that order
- **Chrome small promo tile:** `store/promo-440x280.png`

### Summary

Chrome uses the manifest description (132 characters max):

> Puts each creator's Twitch chat on their Patreon livestream pages.

AMO summary (250 characters max):

> Watching a creator's Patreon livestream while they also stream on Twitch?
> hydeTTV puts their Twitch chat right on the Patreon event page, either as
> a Twitch tab in Patreon's chat or as a floating panel, logged in as you.

### Description

```
Watching a creator's livestream on Patreon while they also stream to Twitch?
hydeTTV puts their Twitch chat right on the Patreon event page, so you can
keep up with both chats without juggling windows.

IN PATREON'S CHAT
Adds Patreon / Twitch tabs to the top of Patreon's chat sidebar. Pick
Twitch to swap in Twitch chat, Patreon to switch back. Drag the sidebar's
left edge to make the chat narrower or wider; the video takes the rest.

OR FLOATING
A Twitch chat panel you can drag anywhere, resize, minimize or pop out into
its own window.

EVERY CREATOR, THEIR OWN CHANNEL
Works on any creator's Patreon event page. The Twitch channel is guessed
from the creator's Patreon name (MisterHyde55 → misterhyde55). If a creator
streams under a different name, set their channel once from the toolbar
button and it's remembered for them.

LOGGED IN AS YOU
It's Twitch's official chat embed, so you chat as yourself after logging
into twitch.tv in the same browser. That includes with Brave Shields up or
third-party cookies blocked. In Chrome, Brave and Edge, channel owners and
moderators can chat too.

ALSO
- Dark or light chat
- Optionally show the chat on every Patreon page, not just event pages
- Works on phone-sized layouts in browsers that run extensions
- Keyboard accessible: tabs, the resize edge and the floating panel all work
  from the keyboard

PRIVACY
hydeTTV collects nothing and sends nothing. No analytics, no accounts, no
remote code. Settings stay in your browser. Source code:
https://github.com/adamjsturge/hydeTTV

Not affiliated with or endorsed by Twitch or Patreon.
```

## Chrome Web Store

- **Category:** Communication
- **Language:** English

### Privacy practices tab

**Single purpose:**

> Shows a creator's Twitch chat on their Patreon livestream (event) pages,
> either inside Patreon's chat sidebar or as a floating panel.

**Permission justifications:**

- **contentSettings:** Adds one cookie exception so twitch.tv can use its
  own cookies while it's embedded on www.patreon.com (pattern
  `https://*.twitch.tv/*` on `https://www.patreon.com/*`). Without it,
  browsers that block third-party cookies (Brave Shields, Chrome's "Block
  third-party cookies") hide the user's Twitch login from the embedded
  chat, so they can't chat. It's the same exception a user could add in
  site settings. No other content setting is read or changed.
- **storage:** Saves the user's settings (on/off, placement, theme, the
  Twitch channel set per creator), the floating panel's size and position,
  the docked chat's width and the last tab picked (Patreon or Twitch).
  Nothing leaves the browser except through the browser's own settings sync.
- **Host permission (www.patreon.com):** Inserts the Twitch chat embed into
  Patreon event pages, and lets the toolbar popup read the current Patreon
  page's address to show which creator's channel is being set.

**Remote code:** No, I am not using remote code. (The chat is Twitch's
embed in an iframe; the extension runs no code that isn't in the package.)

**Data usage:** check none of the data types. Tick all three certifications
(not sold to third parties, not used for unrelated purposes, not used for
creditworthiness or lending).

**Test instructions (optional field):**

> No account needed. Open the toolbar popup and turn on "Show on every
> Patreon page", then open any creator's page, e.g.
> https://www.patreon.com/MisterHyde55. With no live event, Patreon's chat
> sidebar isn't there, so a floating Twitch chat panel appears after a few
> seconds. During a creator's live event
> (patreon.com/<creator>/events/<id>), Patreon / Twitch tabs appear in
> Patreon's chat sidebar instead.

## Firefox (AMO)

- **Categories:** Social & Communication (desktop and Android)
- **License:** MIT
- **Platforms:** Firefox and Firefox for Android
- **Privacy policy:** paste the text of `PRIVACY.md`
- **Source code:** not needed. The files are copied as written, with no
  bundling or minifying.

### Notes to reviewer

```
No account needed to test. Open the toolbar popup, turn on "Show on every
Patreon page", then open any creator page, e.g.
https://www.patreon.com/MisterHyde55. With no live event a floating Twitch
chat panel appears after a few seconds. During a live event
(patreon.com/<creator>/events/<id>) Patreon / Twitch tabs appear in
Patreon's chat sidebar instead.

Why "cookies" and twitch.tv access: the chat is Twitch's official embed
(twitch.tv/embed/<channel>/chat?parent=www.patreon.com) inside
patreon.com. Total Cookie Protection gives it a separate cookie jar there,
so it can't see the user's Twitch login. background.firefox.js copies only
the Twitch login cookies (a fixed list of names) from twitch.tv into the
partitioned jar for top-level site patreon.com, and expires the copies when
the user logs out of Twitch. Nothing is read for any other purpose, and
nothing is sent anywhere.

Linter notes: the three innerHTML assignments in content.js build shadow
DOM from static templates defined in the same file (styles, icons, numeric
constants). No user, page or network data goes into them. The channel name
is set with textContent. popup.js is flagged as possibly minified only
because its first 30 lines are top-level declarations; it isn't minified.
```
