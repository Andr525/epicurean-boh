# Pending POS and iPad updates

This Cloud Agent can push only `Andr525/epicurean-boh`. The POS and iPad menu changes below are ready to copy into their repositories:

- `epicurean-pos/` → https://github.com/Andr525/epicurean-pos
- `epicurean-names/` → https://github.com/Andr525/epicurean-names

Replace the matching files on `main`, then GitHub Pages will pick them up.

## POS app icons

`epicurean-pos/` now includes the home-screen app icons that `manifest.json`
and `index.html` reference:

- `icon-192.png` (192×192)
- `icon-512.png` (512×512)

These must be copied into the live `Andr525/epicurean-pos` repo alongside
`index.html`/`manifest.json` so the branded icon shows when the POS is added
to a phone's home screen. Without them the icon falls back to a screenshot
(iOS) or a generic letter (Android).
