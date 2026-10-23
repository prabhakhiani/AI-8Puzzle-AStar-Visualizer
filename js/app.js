document.addEventListener("DOMContentLoaded", () => {
  const $ = id => document.getElementById(id);

  const board = $("puzzle-board");
  const goalBoard = $("goal-board");
  const initialInput = $("initial-state");
  const heuristicSelect = $("heuristic");
  const heuristicDescription = $("heuristic-description");

  const expandedCount = $("expanded-count");
  const generatedCount = $("generated-count");
  const moveCount = $("move-count");
  const timeCount = $("time-count");
  const pathCost = $("path-cost");
  const maxDepth = $("max-depth");
  const memoryCount = $("memory-count");
  const heuristicName = $("heuristic-name");

  const stepCounter = $("step-counter");
  const progressBar = $("solution-progress");
  const statusMessage = $("status-message");

  const solveButton = $("solve-btn");
  const randomButton = $("random-btn");
  const resetButton = $("reset-btn");
  const applyButton = $("apply-state-btn");
  const previousButton = $("previous-btn");
  const nextButton = $("next-btn");
  const pauseButton = $("pause-btn");
  const speedControl = $("speed-control");
  const speedValue = $("speed-value");

  const searchEventSelect = $("search-event-select");
  const traceG = $("trace-g");
  const traceH = $("trace-h");
  const traceF = $("trace-f");
  const traceExpanded = $("trace-expanded");
  const frontierList = $("frontier-list");
  const exploredList = $("explored-list");
  const frontierCount = $("frontier-count");
  const exploredCount = $("explored-count");

  const GOAL = [...Puzzle.DEFAULT_GOAL];
  let initialState = [1, 2, 3, 4, 0, 6, 7, 5, 8];
  let currentState = [...initialState];
  let result = null;
  let playbackIndex = 0;
  let playbackTimer = null;
  let paused = true;

  function renderBoard(target, state, isGoal = false) {
    target.innerHTML = "";
    state.forEach((value, index) => {
      const tile = document.createElement("div");
      tile.className = value === 0 ? "tile blank" : "tile";
      tile.textContent = value === 0 ? "" : value;
      tile.setAttribute("aria-label", value === 0 ? "Empty tile" : `Tile ${value}`);
      tile.dataset.index = String(index);
      target.appendChild(tile);
    });
    if (isGoal) target.classList.add("goal-board");
  }

  function updateStats() {
    expandedCount.textContent = result?.expanded ?? 0;
    generatedCount.textContent = result?.generated ?? 0;
    moveCount.textContent = result?.found ? result.moves : "—";
    timeCount.textContent = result?.executionTime !== undefined
      ? `${result.executionTime.toFixed(2)} ms`
      : "—";
    pathCost.textContent = result?.found ? result.pathCost : "—";
    maxDepth.textContent = result?.maxDepth ?? "—";
    memoryCount.textContent = result?.found
      ? `${(result.approximateMemoryBytes / 1024).toFixed(1)} KB`
      : "—";
    heuristicName.textContent = heuristicSelect.value === "manhattan"
      ? "Manhattan"
      : "Misplaced";
  }

  function updateProgress() {
    const total = result?.path?.length ?? 0;
    stepCounter.textContent = total ? `Step ${playbackIndex} / ${total - 1}` : "Step 0";
    progressBar.style.width = total > 1 ? `${(playbackIndex / (total - 1)) * 100}%` : "0%";
    previousButton.disabled = !result?.found || playbackIndex <= 0;
    nextButton.disabled = !result?.found || playbackIndex >= total - 1;
  }

  function stopPlayback() {
    if (playbackTimer !== null) {
      clearInterval(playbackTimer);
      playbackTimer = null;
    }
    paused = true;
    pauseButton.textContent = "Play";
  }

  function resetExplorer(message = "Run A* to inspect the frontier.") {
    searchEventSelect.innerHTML = "";
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Run a search first";
    searchEventSelect.appendChild(option);
    traceG.textContent = "—";
    traceH.textContent = "—";
    traceF.textContent = "—";
    traceExpanded.textContent = "—";
    frontierCount.textContent = "0";
    exploredCount.textContent = "0";
    frontierList.innerHTML = `<p class="empty-list">${message}</p>`;
    exploredList.innerHTML = '<p class="empty-list">Expanded states will appear here.</p>';
  }

  function clearResults(message = "Puzzle ready. Select a heuristic and solve.") {
    stopPlayback();
    result = null;
    playbackIndex = 0;
    expandedCount.textContent = "0";
    generatedCount.textContent = "0";
    moveCount.textContent = "—";
    timeCount.textContent = "—";
    pathCost.textContent = "—";
    maxDepth.textContent = "—";
    memoryCount.textContent = "—";
    heuristicName.textContent = heuristicSelect.value === "manhattan" ? "Manhattan" : "Misplaced";
    stepCounter.textContent = "Step 0";
    progressBar.style.width = "0%";
    previousButton.disabled = true;
    nextButton.disabled = true;
    pauseButton.disabled = true;
    statusMessage.textContent = message;
    resetExplorer();
  }

  function showPathStep(index) {
    if (!result?.found || !result.path.length) return;
    playbackIndex = Math.max(0, Math.min(index, result.path.length - 1));
    const step = result.path[playbackIndex];
    currentState = [...step.state];
    renderBoard(board, currentState);
    updateProgress();
    statusMessage.textContent =
      `Move: ${step.move} | g(n) = ${step.g} | h(n) = ${step.h} | f(n) = ${step.f}`;
    if (playbackIndex === result.path.length - 1) statusMessage.textContent += " | Goal reached!";
  }

  function createMiniBoard(state) {
    const miniBoard = document.createElement("div");
    miniBoard.className = "mini-board";
    state.forEach(value => {
      const tile = document.createElement("div");
      tile.className = value === 0 ? "mini-tile blank" : "mini-tile";
      tile.textContent = value === 0 ? "" : value;
      miniBoard.appendChild(tile);
    });
    return miniBoard;
  }

  function renderFrontier(frontier) {
    frontierList.innerHTML = "";
    frontierCount.textContent = String(frontier.length);

    if (!frontier.length) {
      frontierList.innerHTML = '<p class="empty-list">The frontier is empty.</p>';
      return;
    }

    const sorted = [...frontier].sort((a, b) => a.f - b.f || a.h - b.h);
    sorted.slice(0, 30).forEach((node, index) => {
      const entry = document.createElement("div");
      entry.className = "state-entry";

      const heading = document.createElement("div");
      heading.className = "state-entry-top";
      heading.textContent = `Candidate ${index + 1}`;

      const scores = document.createElement("div");
      scores.className = "state-scores";
      scores.textContent = `g=${node.g} | h=${node.h} | f=${node.f}`;

      entry.appendChild(heading);
      entry.appendChild(createMiniBoard(node.state));
      entry.appendChild(scores);
      frontierList.appendChild(entry);
    });

    if (sorted.length > 30) {
      const note = document.createElement("p");
      note.className = "empty-list";
      note.textContent = `Showing 30 of ${sorted.length} frontier entries.`;
      frontierList.appendChild(note);
    }
  }

  function renderExplored(explored) {
    exploredList.innerHTML = "";
    exploredCount.textContent = String(explored.length);

    if (!explored.length) {
      exploredList.innerHTML = '<p class="empty-list">No states expanded yet.</p>';
      return;
    }

    explored.slice().reverse().slice(0, 30).forEach((key, index) => {
      const state = key.split(",").map(Number);
      const entry = document.createElement("div");
      entry.className = "state-entry";

      const heading = document.createElement("div");
      heading.className = "state-entry-top";
      heading.textContent = `Recently explored ${index + 1}`;

      entry.appendChild(heading);
      entry.appendChild(createMiniBoard(state));
      exploredList.appendChild(entry);
    });

    if (explored.length > 30) {
      const note = document.createElement("p");
      note.className = "empty-list";
      note.textContent = `Showing the 30 most recently explored states of ${explored.length}.`;
      exploredList.appendChild(note);
    }
  }

  function showSearchEvent(eventIndex) {
    if (!result?.events?.length) return;
    const event = result.events[eventIndex];
    if (!event) return;

    traceG.textContent = event.g;
    traceH.textContent = event.h;
    traceF.textContent = event.f;
    traceExpanded.textContent = event.expanded;
    renderFrontier(event.frontier);
    renderExplored(event.explored);
  }

  function populateSearchEvents() {
    searchEventSelect.innerHTML = "";

    if (!result?.events?.length) {
      resetExplorer();
      return;
    }

    result.events.forEach((event, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent =
        `Expansion ${event.expanded} — g=${event.g}, h=${event.h}, f=${event.f}`;
      searchEventSelect.appendChild(option);
    });

    searchEventSelect.value = "0";
    showSearchEvent(0);
  }

  function solvePuzzle() {
    stopPlayback();

    if (!Puzzle.isValidState(initialState)) {
      statusMessage.textContent = "Invalid board. Enter each number from 0 to 8 exactly once.";
      return;
    }
    if (!Puzzle.isSolvable(initialState, GOAL)) {
      statusMessage.textContent = "This puzzle cannot reach the selected goal. Try another state.";
      return;
    }

    currentState = [...initialState];
    renderBoard(board, currentState);
    const heuristicType = heuristicSelect.value;
    statusMessage.textContent = "A* is searching for a solution...";
    result = AStar.solve([...initialState], [...GOAL], heuristicType);

    if (!result.found) {
      updateStats();
      populateSearchEvents();
      statusMessage.textContent = result.error || "No solution found.";
      return;
    }

    playbackIndex = 0;
    updateStats();
    populateSearchEvents();
    showPathStep(0);
    pauseButton.disabled = false;
    paused = true;
    pauseButton.textContent = "Play";
    statusMessage.textContent =
      `Solution found! ${result.moves} moves using ${heuristicType === "manhattan" ? "Manhattan Distance" : "Misplaced Tiles"}.`;
    showPathStep(0);
  }

  function generateRandomPuzzle() {
    stopPlayback();
    initialState = Puzzle.randomSolvableState(GOAL, 30);
    currentState = [...initialState];
    initialInput.value = initialState.join(",");
    renderBoard(board, currentState);
    clearResults("New solvable puzzle generated. Click Solve puzzle.");
  }

  function applyInitialState() {
    const values = initialInput.value.split(",").map(value => value.trim());
    if (values.length !== 9 || values.some(value => value === "" || !/^\d+$/.test(value))) {
      statusMessage.textContent = "Enter nine comma-separated numbers, for example: 1,2,3,4,0,5,6,7,8";
      return;
    }

    const parsed = values.map(Number);
    if (!Puzzle.isValidState(parsed)) {
      statusMessage.textContent = "Invalid state. Use each number from 0 to 8 exactly once.";
      return;
    }

    initialState = [...parsed];
    currentState = [...parsed];
    renderBoard(board, currentState);
    clearResults(
      Puzzle.isSolvable(initialState, GOAL)
        ? "Initial state applied. Ready to solve."
        : "Initial state applied, but it cannot reach the default goal."
    );
  }

  function playSolution() {
    if (!result?.found) {
      solvePuzzle();
      if (!result?.found) return;
    }
    if (playbackIndex >= result.path.length - 1) showPathStep(0);

    stopPlayback();
    paused = false;
    pauseButton.textContent = "Pause";
    playbackTimer = setInterval(() => {
      if (playbackIndex >= result.path.length - 1) {
        stopPlayback();
        statusMessage.textContent = "Goal reached! Solution playback complete.";
        return;
      }
      showPathStep(playbackIndex + 1);
    }, Number(speedControl.value));
  }

  function togglePlayback() {
    if (!result?.found) {
      solvePuzzle();
      if (!result?.found) return;
    }

    if (paused) {
      playSolution();
    } else {
      stopPlayback();
      pauseButton.textContent = "Resume";
      statusMessage.textContent = "Playback paused. Press Resume to continue.";
    }
  }

  function updateHeuristicDescription() {
    heuristicDescription.textContent = heuristicSelect.value === "manhattan"
      ? "Adds the horizontal and vertical grid distance each numbered tile must travel to reach its goal."
      : "Counts how many numbered tiles are not in their goal positions, excluding the blank.";
    heuristicName.textContent = heuristicSelect.value === "manhattan" ? "Manhattan" : "Misplaced";
  }

  solveButton.addEventListener("click", solvePuzzle);
  randomButton.addEventListener("click", generateRandomPuzzle);
  resetButton.addEventListener("click", () => {
    initialState = [...GOAL];
    currentState = [...GOAL];
    initialInput.value = GOAL.join(",");
    renderBoard(board, currentState);
    clearResults("Board reset to the goal state.");
  });
  applyButton.addEventListener("click", applyInitialState);
  previousButton.addEventListener("click", () => {
    stopPlayback();
    showPathStep(playbackIndex - 1);
  });
  nextButton.addEventListener("click", () => {
    stopPlayback();
    showPathStep(playbackIndex + 1);
  });
  pauseButton.addEventListener("click", togglePlayback);
  searchEventSelect.addEventListener("change", () => {
    const index = Number(searchEventSelect.value);
    if (Number.isInteger(index)) showSearchEvent(index);
  });
  heuristicSelect.addEventListener("change", () => {
    updateHeuristicDescription();
    clearResults("Heuristic changed. Click Solve puzzle to search again.");
  });
  speedControl.addEventListener("input", () => {
    speedValue.textContent = `${speedControl.value} ms`;
    // If currently playing, restart the interval using the new speed.
    if (!paused && result?.found) {
      stopPlayback();
      playSolution();
    }
  });

  renderBoard(board, currentState);
  renderBoard(goalBoard, GOAL, true);
  updateHeuristicDescription();
  speedValue.textContent = `${speedControl.value} ms`;
  clearResults();
});
