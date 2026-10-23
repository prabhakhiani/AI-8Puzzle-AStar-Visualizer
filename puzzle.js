const Puzzle = (() => {
  const DEFAULT_GOAL = [1, 2, 3, 4, 5, 6, 7, 8, 0];

  function stateKey(state) {
    return state.join(",");
  }

  function isValidState(state) {
    if (!Array.isArray(state) || state.length !== 9) return false;
    const sorted = [...state].sort((a, b) => a - b);
    return sorted.every((value, index) => value === index);
  }

  function findBlank(state) {
    return state.indexOf(0);
  }

  function getNeighbors(state) {
    const blank = findBlank(state);
    const row = Math.floor(blank / 3);
    const col = blank % 3;
    const possibleMoves = [
      { row: row - 1, col, name: "Up" },
      { row: row + 1, col, name: "Down" },
      { row, col: col - 1, name: "Left" },
      { row, col: col + 1, name: "Right" }
    ];
    const neighbors = [];

    for (const move of possibleMoves) {
      if (move.row < 0 || move.row > 2 || move.col < 0 || move.col > 2) continue;
      const target = move.row * 3 + move.col;
      const nextState = [...state];
      nextState[blank] = nextState[target];
      nextState[target] = 0;
      neighbors.push({ state: nextState, move: move.name });
    }
    return neighbors;
  }

  function isSolvable(state, goal = DEFAULT_GOAL) {
    if (!isValidState(state) || !isValidState(goal)) return false;
    const goalPosition = new Map();
    goal.forEach((tile, index) => goalPosition.set(tile, index));
    const ordered = state.filter(tile => tile !== 0).map(tile => goalPosition.get(tile));
    let inversions = 0;

    for (let i = 0; i < ordered.length; i++) {
      for (let j = i + 1; j < ordered.length; j++) {
        if (ordered[i] > ordered[j]) inversions++;
      }
    }
    return inversions % 2 === 0;
  }

  function randomSolvableState(goal = DEFAULT_GOAL, steps = 30) {
    let state = [...goal];
    let previousKey = "";

    for (let i = 0; i < steps; i++) {
      let neighbors = getNeighbors(state);
      neighbors = neighbors.filter(neighbor => stateKey(neighbor.state) !== previousKey);
      if (neighbors.length === 0) neighbors = getNeighbors(state);
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      previousKey = stateKey(state);
      state = [...next.state];
    }
    return state;
  }

  return {
    DEFAULT_GOAL,
    stateKey,
    isValidState,
    findBlank,
    getNeighbors,
    isSolvable,
    randomSolvableState
  };
})();
