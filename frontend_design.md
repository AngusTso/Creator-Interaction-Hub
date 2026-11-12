# Frontend Design System

## Direction

Use a tactile neo-brutalist and Swiss-utility style for a livestream Q&A
companion. Keep labels short and functional. The application does not host
livestream video, replace chat, or integrate with a streaming provider.

## Implementation rules

- Write modular plain CSS with custom properties.
- Do not use Tailwind, CSS-in-JS, or a component library.
- Avoid gradients, neon glow, glass effects, soft shadows, and marketing copy.
- Keep the interface dark, high-contrast, responsive, and keyboard accessible.
- Bundle the licensed font files locally; do not request fonts from a CDN.

## Color tokens

| Purpose | Value |
| --- | --- |
| Canvas | `#111111` |
| Surface | `#1A1A1A` |
| Surface hover | `#242424` |
| Main border | `#FFFFFF` |
| Divider | `#3A3A3A` |
| Primary text | `#FFFFFF` |
| Secondary text | `#B3B3B3` |
| Inverse text | `#111111` |
| Signal yellow | `#FACC15` |
| Active/confirmed green | `#22C55E` |

Use dark inverse text on solid yellow actions and bars.

## Typography

- Display: Space Grotesk, then Inter and system sans-serif fallbacks.
- Body: Inter, then system sans-serif; target 14px and 1.4 line height.
- Counts and timestamps: JetBrains Mono with tabular numerals.
- Keep headings and compact labels bold, uppercase, and clearly separated.

## Geometry and interaction

- Use square corners or a 2px maximum radius; status dots may be round.
- Use 1.5px white structural borders and 1px `#3A3A3A` dividers.
- Prefer borders to shadows. If used, button shadows must be hard and offset
  with no blur, and should depress when pressed.
- Provide visible keyboard focus and respect reduced-motion preferences.

## Q&A patterns

- Stack questions in full-width rows with horizontal dividers.
- Show status, display name, and timestamp clearly.
- Use rectangular approve, reject, and answer controls.
- Public views show approved and answered questions only.

## Poll patterns

Use a rectangular white-bordered track with a solid yellow result bar. Keep
counts and percentages legible over the fill and use JetBrains Mono for
numbers. Display active and closed results; show voting controls only while
the poll and its event are active.

The current CSS tokens and components live in `frontend/src/styles.css`.