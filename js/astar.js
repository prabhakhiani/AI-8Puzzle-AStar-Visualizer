const AStar = (() => {
  function misplacedTiles(state, goal) {
    let count = 0;
    for (let i = 0; i < state.length; i++) {
      if (state[i] !== 0 && state[i] !== goal[i]) count++;
    }
    return count;
  }

  function manhattanDistance(state, goal) {
    let distance = 0;
    const goalPositions = new Map();
    goal.forEach((tile, index) => goalPositions.set(tile, index));

    for (let i = 0; i < state.length; i++) {
      const tile = state[i];
      if (tile === 0) continue;
      const goalIndex = goalPositions.get(tile);
      const currentRow = Math.floor(i / 3);
      const currentCol = i % 3;
      const goalRow = Math.floor(goalIndex / 3);
      const goalCol = goalIndex % 3;
      distance += Math.abs(currentRow - goalRow) + Math.abs(currentCol - goalCol);
    }
    return distance;
  }

  function heuristic(state, goal, type) {
    return type === "misplaced"
      ? misplacedTiles(state, goal)
      : manhattanDistance(state, goal);
  }

  // Min-heap priority queue: the node with the lowest f-value is removed first.
  class PriorityQueue {
    constructor() {
      this.items = [];
    }

    push(node) {
      this.items.push(node);
      let index = this.items.length - 1;

      while (index > 0) {
        const parentIndex = Math.floor((index - 1) / 2);
        if (this.items[parentIndex].f <= node.f) break;
        this.items[index] = this.items[parentIndex];
        index = parentIndex;
      }
      this.items[index] = node;
    }

    pop() {
      if (this.items.length === 0) return null;

      const minimum = this.items[0];
      const last = this.items.pop();

      if (this.items.length > 0) {
        this.items[0] = last;
        let index = 0;

        while (true) {
          const left = 2 * index + 1;
          const right = left + 1;
          let smallest = index;

          if (
            left < this.items.length &&
            this.items[left].f < this.items[smallest].f
          ) {
            smallest = left;
          }

          if (
            right < this.items.length &&
            this.items[right].f < this.items[smallest].f
          ) {
            smallest = right;
          }

          if (smallest === index) break;

          [this.items[index], this.items[smallest]] =
            [this.items[smallest], this.items[index]];

          index = smallest;
        }
      }
      return minimum;
    }

    get size() {
      return this.items.length;
    }
  }

  function reconstructPath(node) {
    const path = [];
    while (node !== null) {
      path.push({
        state: [...node.state],
        g: node.g,
        h: node.h,
        f: node.f,
        move: node.move
      });
      node = node.parent;
    }
    return path.reverse();
  }

  function solve(start, goal, heuristicType = "manhattan") {
    const startTime = performance.now();

    if (!Puzzle.isValidState(start) || !Puzzle.isValidState(goal)) {
      return { found: false, error: "Invalid puzzle. Use each number from 0 to 8 once." };
    }
    if (!Puzzle.isSolvable(start, goal)) {
      return { found: false, error: "This initial state cannot reach the selected goal." };
    }

    const open = new PriorityQueue();
    const bestG = new Map();
    const closed = new Set();
    const events = [];
    let generated = 1;
    let expanded = 0;
    let maxDepth = 0;

    const startNode = {
      state: [...start],
      parent: null,
      move: "Start",
      g: 0,
      h: heuristic(start, goal, heuristicType),
      f: 0
    };
    startNode.f = startNode.g + startNode.h;
    open.push(startNode);
    bestG.set(Puzzle.stateKey(start), 0);

    while (open.size > 0) {
      const current = open.pop();
      const currentKey = Puzzle.stateKey(current.state);

      // Ignore an outdated queue entry if a better path has already been found.
      if (current.g !== bestG.get(currentKey)) continue;
      if (closed.has(currentKey)) continue;

      closed.add(currentKey);
      expanded++;
      maxDepth = Math.max(maxDepth, current.g);

      if (currentKey === Puzzle.stateKey(goal)) {
        events.push({
          type: "expand",
          state: [...current.state],
          g: current.g,
          h: current.h,
          f: current.f,
          expanded,
          generated,
          depth: current.g,
          frontier: open.items.map(node => ({
            state: [...node.state], g: node.g, h: node.h, f: node.f
          })),
          explored: [...closed]
        });

        const path = reconstructPath(current);
        return {
          found: true,
          path,
          events,
          moves: path.length - 1,
          pathCost: current.g,
          generated,
          expanded,
          maxDepth,
          executionTime: performance.now() - startTime,
          heuristic: heuristicType,
          // Approximation only; browser JavaScript memory usage is not directly measured.
          approximateMemoryBytes: generated * 200
        };
      }

      for (const neighbor of Puzzle.getNeighbors(current.state)) {
        const nextState = neighbor.state;
        const nextKey = Puzzle.stateKey(nextState);
        const tentativeG = current.g + 1;

        if (bestG.has(nextKey) && tentativeG >= bestG.get(nextKey)) continue;

        bestG.set(nextKey, tentativeG);
        closed.delete(nextKey);

        const h = heuristic(nextState, goal, heuristicType);
        const nextNode = {
          state: [...nextState],
          parent: current,
          move: neighbor.move,
          g: tentativeG,
          h,
          f: tentativeG + h
        };
        open.push(nextNode);
        generated++;
      }

      // Record the queue after this state's successors have been generated.
      events.push({
        type: "expand",
        state: [...current.state],
        g: current.g,
        h: current.h,
        f: current.f,
        expanded,
        generated,
        depth: current.g,
        frontier: open.items.map(node => ({
          state: [...node.state], g: node.g, h: node.h, f: node.f
        })),
        explored: [...closed]
      });
    }

    return {
      found: false,
      error: "No solution was found.",
      events,
      generated,
      expanded,
      maxDepth,
      executionTime: performance.now() - startTime
    };
  }

  return { misplacedTiles, manhattanDistance, heuristic, solve };
})();
