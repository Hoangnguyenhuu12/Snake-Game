# Snake Game
A clean, minimal Snake web game built with vanilla HTML, CSS, and JavaScript — no frameworks or dependencies required.

🔗 **Live demo:** `https://Hoangnguyenhuu12.github.io/Snake-Game`

---

## Features

- **Two game modes** — Box mode (walls kill) and Infinity mode (walk through walls)
- **Two visual themes** — Light / Dark mode toggle, starts in light mode
- **20 levels** — Speed increases evenly from level 1 to level 20
- **Win condition** — Reach level 20 to win the game
- **Revive system** — One free revive per match to continue your personal best run
- **Score tracking** — Best score persists across sessions via `localStorage`
- **New PR signal** — Flashing "NEW BEST!" on screen when you beat your record
- **Touch support** — Swipe to control on mobile
- **SVG favicon** — Custom snake logo shown in the browser tab

---

## Project Structure

```
snake-game/
├── index.html    # Markup only — no inline styles or scripts
├── style.css     # Theme variables, layout, and component styles
├── game.js       # All game logic: state, snake, scoring, controls
├── black.png     # Favicon image
└── README.md     # This file
```

---

## How to Run Locally

No build step needed. Just open the file in a browser:

```bash
# Clone the repo
git clone https://github.com/Hoangnguyenhuu12/Snake-Game.git
cd Snake-Game

# Open directly
open index.html          # macOS
start index.html         # Windows
xdg-open index.html      # Linux
```

Or use a local server (recommended to avoid font-loading quirks):

```bash
# Python
python -m http.server 3000

# Node.js
npx serve .
```

Then visit `http://localhost:3000`.

---

## Deploy to GitHub Pages

1. Push the project to a **public** GitHub repository.
2. Go to **Settings → Pages**.
3. Under *Source*, select **Deploy from a branch → main → / (root)**.
4. Save — your game will be live at `https://Hoangnguyenhuu12.github.io/Snake-Game` within a minute.

---

## Game Rules

### Box Mode
Classic Snake. The snake dies if it **hits a wall or itself**. Plan your path carefully — the board has hard borders on all four sides.

### Infinity Mode
The walls wrap around. The snake **exits one side and re-enters from the opposite side**, giving more room to maneuver but making self-collision more surprising.

---

## Scoring & Levels

| Apples Eaten | Level | Speed (ms/tick) |
|---|---|---|
| 0  | 1  | 200ms — slowest |
| 5  | 2  | ~193ms |
| 10 | 3  | ~186ms |
| …  | …  | … |
| 95 | 20 | 60ms — fastest (**You Win!**) |

- Score increases by **+1 per apple**
- Level up every **5 apples**
- Speed is spread evenly across all 20 levels using the formula:
  ```js
  speedAt(lv) = round(200 - (lv - 1) × 140 / 19)
  ```

---

## Controls

| Key | Action |
|-----|--------|
| `↑ ↓ ← →` or `W A S D` | Move snake |
| `P` | Pause / Resume |
| `R` | Restart game |
| Swipe | Move on mobile |

---

## Customisation

All visual tokens are CSS variables in `style.css`:

```css
:root[data-theme="dark"] {
  --bg:      #000000;
  --snake:   #22c55e;   /* snake body color */
  --apple:   #ef4444;   /* apple color */
}

:root[data-theme="light"] {
  --bg:      #ffffff;
  --snake:   #16a34a;
  --apple:   #dc2626;
}
```

Game constants are defined at the top of `game.js`:

```js
const COLS        = 24;    // grid columns
const ROWS        = 24;    // grid rows
const CELL        = 20;    // px per cell
const MAX_LEVEL   = 20;    // win at this level
const APPLES_PER  = 5;     // apples needed per level-up
const SPEED_START = 200;   // ms at level 1 (slowest)
const SPEED_END   = 60;    // ms at level 20 (fastest)
```

To change the grid size or win condition, just edit these values.

---

## Tech Stack

- **HTML5** — semantic markup, SVG favicon via data URI
- **CSS3** — custom properties, Flexbox, keyframe animations
- **Vanilla JavaScript** — Canvas API, no libraries or build tools

---

## License

MIT — free to use, modify, and distribute.
