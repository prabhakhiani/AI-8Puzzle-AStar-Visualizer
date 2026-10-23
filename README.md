# Puzzle Lab — Interactive A* 8-Puzzle Visualizer

**Student:** Prabha Khiani  
**Registration number:** 24BDS0354

A browser-based case study that visualizes A* informed search on the 8-puzzle problem. The project uses HTML5, CSS3, JavaScript ES6, and Bootstrap 5.

## Features
- Interactive 3×3 puzzle board and default goal state.
- Manual initial-state input with validation.
- Random solvable puzzle generation.
- A* search with Manhattan Distance and Misplaced Tiles heuristics.
- Step-by-step solution playback, pause/resume, previous/next controls, and adjustable speed.
- Search metrics: nodes generated/expanded, solution moves, execution time, path cost, maximum search depth, and an explicitly approximate memory estimate.
- Search explorer with expansion history, OPEN/frontier entries, CLOSED/explored states, and `g(n)`, `h(n)`, `f(n)` scores.
- Responsive interface and concept guide.

## Run locally
1. Download or clone this repository.
2. Open the project folder.
3. Open `index.html` in a modern browser. No build step or package installation is required.
4. An internet connection is needed to load Bootstrap and Google Fonts from their CDNs; the app logic itself is local.

## A* evaluation
`f(n) = g(n) + h(n)`

- `g(n)`: number of moves made from the initial state.
- `h(n)`: estimate of remaining moves.
- Manhattan Distance: sum of row and column distances for each numbered tile, excluding the blank.
- Misplaced Tiles: number of numbered tiles not in their goal positions, excluding the blank.

For the standard 8-puzzle with unit move costs, these heuristics are admissible. A* returns an optimal solution when implemented correctly.

## Notes
- The memory figure is a rough estimate based on generated nodes, not an exact measurement of JavaScript/browser memory.
- The project visualizes simulated puzzle-search states; it does not inspect or change system settings.
- If the assignment requires running all six algorithms in the comparison rubric, confirm with the instructor whether the assigned-algorithm-only rule takes precedence. This version implements A* and compares its two heuristics rather than fabricating results for other algorithms.

## Technologies
- HTML5
- CSS3
- JavaScript ES6
- Bootstrap 5.3.3 (CDN)

## Student details
- Prabha Khiani
- 24BDS0354

## Suggested future improvements
- Export search trace as CSV/JSON.
- Add a measured side-by-side comparison of both heuristics on the same start state.
- Add screenshots and the published GitHub Pages URL after deployment.
