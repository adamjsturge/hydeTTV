# hydeTTV privacy policy

Last updated: October 19, 2026

hydeTTV doesn't collect, store, sell or send any personal data. It has no
analytics, no tracking, no ads, no accounts and no server of its own, and it
doesn't load any remote code.

## What stays in your browser

- **Settings:** whether the chat is on, placement, theme, whether to show it
  on every Patreon page, and the Twitch channel you set for a creator. These
  are kept in the browser's extension storage. If browser sync is on, your
  browser syncs them through your own browser account (Google, Mozilla, and
  so on), like any other extension setting. hydeTTV never sees that sync.
- **Panel size and position:** kept in local extension storage on this
  device only.
- **Patreon pages:** hydeTTV reads the address of the Patreon page you're on
  to work out the creator's name and pick their Twitch channel. It reads
  nothing else from Patreon and sends nothing anywhere.

## Twitch login

The chat is Twitch's official chat embed, loaded straight from twitch.tv.
Whatever you type in it goes to Twitch under
[Twitch's privacy notice](https://legal.twitch.com/legal/privacy-notice/),
the same as on twitch.tv.

So the embedded chat can use your existing Twitch login:

- **Chrome, Brave and other Chromium browsers:** hydeTTV adds a browser
  cookie exception that lets twitch.tv use its cookies while it's embedded
  on www.patreon.com, and nowhere else. It's the same as allowing it
  yourself in the browser's site settings. hydeTTV never reads the cookies,
  and the browser removes the exception if you uninstall the extension.
- **Firefox:** Firefox gives embedded sites a separate cookie jar per
  website. hydeTTV copies your Twitch login cookies from twitch.tv into the
  jar Firefox uses for Twitch inside patreon.com, and keeps that copy in
  sync when you log in or out. The copy stays in your browser, only twitch.tv
  frames on patreon.com can use it, and it's never sent anywhere else.

## Network requests

hydeTTV itself makes no network requests. The only traffic it causes is the
Twitch chat embed (and the pop-out chat window, if you open it), which your
browser loads from twitch.tv.

## Contact

Questions or problems: open an issue at
https://github.com/adamjsturge/hydeTTV/issues.
