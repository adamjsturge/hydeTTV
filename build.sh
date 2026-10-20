#!/usr/bin/env bash
# Builds the store zips into dist/:
#   hydettv-chrome-<version>.zip   Chrome Web Store (Chrome, Brave, Edge...)
#   hydettv-firefox-<version>.zip  addons.mozilla.org
#   firefox/                       unpacked, for about:debugging
set -euo pipefail
cd "$(dirname "$0")"

version=$(jq -r .version manifest.json)
firefox_version=$(jq -r .version manifest.firefox.json)
if [[ "$version" != "$firefox_version" ]]; then
    echo "Version mismatch: manifest.json is $version," \
        "manifest.firefox.json is $firefox_version" >&2
    exit 1
fi

shared=(shared.js content.js popup.html popup.css popup.js icons fonts)

rm -rf dist
mkdir -p dist/firefox

zip -qr -X "dist/hydettv-chrome-$version.zip" \
    manifest.json background.js "${shared[@]}" -x "*.DS_Store"

cp -R "${shared[@]}" background.firefox.js dist/firefox/
cp manifest.firefox.json dist/firefox/manifest.json
find dist/firefox -name .DS_Store -delete
(cd dist/firefox && zip -qr -X "../hydettv-firefox-$version.zip" .)

echo "Built dist/hydettv-chrome-$version.zip"
echo "Built dist/hydettv-firefox-$version.zip (unpacked: dist/firefox)"
