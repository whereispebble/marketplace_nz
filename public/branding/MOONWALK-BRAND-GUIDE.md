# Moonwalk

Current visual identity: mint green, deep forest ink and warm cream. The brand
connects finding a car or camper with starting a new journey in New Zealand.
Use “Cars & campers” when a short category description is helpful.

## Assets

- `moonwalk-logo.svg`: horizontal crescent and outlined lowercase wordmark,
  390 × 64. No font downloads or raster scaling are required.
- `moonwalk-moon.svg`: standalone transparent crescent, 64 × 64. Use for the
  mobile header and loading indicator.
- `/favicon.svg`: the same crescent on a rounded cream tile.

Keep the proportions and give the mark breathing room. The full wordmark appears
in desktop navigation, the mobile menu, login, registration and footer. At widths
up to 640 px, the main navigation displays the crescent on its own.

## Palette

| Role | Colour |
| --- | --- |
| Mint / accent | `#14BC7D` |
| Deep forest / ink | `#101815` |
| Cream / page background | `#F3F7F1` |
| Accessible darker green | `#0A8F5D` |

## Loading

The only visible loading element is the mint crescent rotating around its
centre. A matching loader is present in the initial HTML, before React starts,
and in the shared `LoadingScreen` component. Assistive technology receives a
descriptive status. `prefers-reduced-motion` disables rotation.

## Typography

Use the Google Fonts OFL edition of **Manrope** throughout the interface. The
logo stays as outlined vector artwork; interface type complements its rounded
forms without changing the wordmark.

- Body text: 400; secondary emphasis and navigation: 500–600.
- Buttons and labels: 600–700.
- Headings and prices: 700–800.
- Do not use weights above 800; the variable font supports 200–800.

The WOFF2 Latin and Latin Extended subsets are served locally from
`/fonts/manrope/`, including macrons used in Māori names. Preload the Latin font
and use `font-display: swap`. The distributed license is in the same folder.

## Integration

Keep existing account data, browser storage keys, events and service addresses.
Changing the visual brand does not register a domain, create email addresses or
rename the legal entity. Existing legal entity and contact details remain as
configured until separately confirmed.
