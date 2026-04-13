import { TwistyPlayer } from "https://cdn.cubing.net/v0/js/cubing/twisty";
import { randomScrambleForEvent } from "https://cdn.cubing.net/v0/js/cubing/scramble";

const Cube = window.Cube;

const cubeMount = document.getElementById("cubeMount");
const scrambleBox = document.getElementById("scrambleBox");
const solutionBox = document.getElementById("solutionBox");
const solverStatus = document.getElementById("solverStatus");
const inputStatus = document.getElementById("inputStatus");
const modeStatus = document.getElementById("modeStatus");
const playerStatus = document.getElementById("playerStatus");
const footerMessage = document.getElementById("footerMessage");
const validationBox = document.getElementById("validationBox");
const validationBanner = document.getElementById("validationBanner");
const faceletBox = document.getElementById("faceletBox");
const selectedPaintLabel = document.getElementById("selectedPaintLabel");

const scrambleBtn = document.getElementById("scrambleBtn");
const solveBtn = document.getElementById("solveBtn");
const resetBtn = document.getElementById("resetBtn");
const solveInputBtn = document.getElementById("solveInputBtn");
const validateBtn = document.getElementById("validateBtn");
const fillSolvedBtn = document.getElementById("fillSolvedBtn");
const clearInputBtn = document.getElementById("clearInputBtn");
const jumpToSolverBtn = document.getElementById("jumpToSolverBtn");
const jumpToInputBtn = document.getElementById("jumpToInputBtn");

const colorPickButtons = Array.from(document.querySelectorAll(".color-pick"));

const FACE_ORDER = ["U", "R", "F", "D", "L", "B"];
const NET_FACES = ["U", "L", "F", "R", "B", "D"];
const CENTER_COLORS = {
  U: "U",
  R: "R",
  F: "F",
  D: "D",
  L: "L",
  B: "B"
};

const COLOR_LABELS = {
  U: "White (U)",
  R: "Red (R)",
  F: "Green (F)",
  D: "Yellow (D)",
  L: "Orange (L)",
  B: "Blue (B)",
  X: "Empty (X)"
};

let selectedColor = "U";
let currentScramble = "";
let currentSolution = "";
let solverInitialized = false;
let currentCube = null;

const faceState = {
  U: Array(9).fill("X"),
  R: Array(9).fill("X"),
  F: Array(9).fill("X"),
  D: Array(9).fill("X"),
  L: Array(9).fill("X"),
  B: Array(9).fill("X")
};

const player = new TwistyPlayer({
  puzzle: "3x3x3",
  alg: "",
  hintFacelets: "floating",
  background: "none",
  controlPanel: "bottom-row",
  backView: "none",
  experimentalSetupAnchor: "end"
});

cubeMount.appendChild(player);

function setStatus(message) {
  playerStatus.textContent = message;
  footerMessage.textContent = message;
}

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

function setBanner(kind, message) {
  validationBanner.className = "validation-banner";
  if (kind === "success") {
    validationBanner.classList.add("validation-success");
  } else if (kind === "warning") {
    validationBanner.classList.add("validation-warning");
  } else if (kind === "danger") {
    validationBanner.classList.add("validation-danger");
  } else {
    validationBanner.classList.add("validation-neutral");
  }
  validationBanner.textContent = message;
}

function setSolvedView() {
  player.experimentalSetupAlg = "";
  player.experimentalSetupAnchor = "end";
  player.alg = "";
}

function setScrambleView(scramble) {
  player.experimentalSetupAlg = "";
  player.experimentalSetupAnchor = "start";
  player.alg = scramble;
}

function setSolutionPlayback(scramble, solution) {
  player.experimentalSetupAlg = scramble;
  player.experimentalSetupAnchor = "end";
  player.alg = solution;
}

function resetAll() {
  currentScramble = "";
  currentSolution = "";
  currentCube = null;
  scrambleBox.textContent = "No scramble loaded yet.";
  solutionBox.textContent = "No solution yet.";
  modeStatus.textContent = "Generated scramble solve";
  setSolvedView();
  setStatus("Cube reset to solved state.");
}

async function ensureSolverReady() {
  if (!Cube) {
    throw new Error("cube.js library did not load.");
  }

  if (solverInitialized) {
    return;
  }

  solverStatus.textContent = "Initializing...";
  setStatus("Initializing solver tables. This may take a few seconds on first use...");

  await new Promise((resolve) => {
    setTimeout(() => {
      Cube.initSolver();
      solverInitialized = true;
      resolve();
    }, 30);
  });

  solverStatus.textContent = "Ready";
  setStatus("Solver initialized and ready.");
}

async function generateScramble() {
  scrollToSection("solver");

  try {
    setStatus("Generating random 3×3 scramble...");
    const scramble = await randomScrambleForEvent("333");
    const scrambleText = scramble.toString().trim();

    currentScramble = scrambleText;
    currentSolution = "";
    currentCube = new Cube();
    currentCube.move(scrambleText);

    scrambleBox.textContent = scrambleText;
    solutionBox.textContent = "No solution yet.";
    setScrambleView(scrambleText);
    modeStatus.textContent = "Generated scramble solve";
    setStatus("Random scramble loaded. Press Solve Scramble to compute the solution.");
  } catch (error) {
    console.error(error);
    setStatus("Could not generate scramble.");
  }
}

async function solveCurrentScramble() {
  scrollToSection("solver");

  if (!currentCube || !currentScramble) {
    setStatus("Generate a scramble first.");
    return;
  }

  try {
    await ensureSolverReady();
    solverStatus.textContent = "Solving...";
    setStatus("Computing solution for generated scramble...");

    const cubeToSolve = new Cube(currentCube);
    const solution = cubeToSolve.solve();

    currentSolution = solution;
    solutionBox.textContent = solution;
    setSolutionPlayback(currentScramble, solution);

    solverStatus.textContent = "Solved";
    modeStatus.textContent = "Generated scramble solve";
    setStatus("Solution computed and loaded into animated playback.");
  } catch (error) {
    console.error(error);
    solverStatus.textContent = "Error";
    setStatus("Could not solve the current scramble.");
  }
}

function initializeCenters() {
  for (const face of FACE_ORDER) {
    faceState[face][4] = CENTER_COLORS[face];
  }
}

function getStickerClass(value) {
  return `sticker-${value || "X"}`;
}

function renderFace(face) {
  const container = document.getElementById(`face-${face}`);
  if (!container) return;

  const stickers = container.querySelectorAll(".sticker");
  stickers.forEach((sticker, idx) => {
    const value = faceState[face][idx] || "X";
    sticker.className = "sticker";
    sticker.classList.add(getStickerClass(value));

    if (idx === 4) {
      sticker.classList.add("center-locked");
      sticker.setAttribute("aria-disabled", "true");
    }

    sticker.dataset.face = face;
    sticker.dataset.index = String(idx);
    sticker.title = `${face}${idx + 1}: ${value}`;
  });
}

function getColorCounts() {
  const counts = { U: 0, R: 0, F: 0, D: 0, L: 0, B: 0, X: 0 };
  for (const face of FACE_ORDER) {
    for (const value of faceState[face]) {
      counts[value] = (counts[value] || 0) + 1;
    }
  }
  return counts;
}

function updateCountsUI() {
  const counts = getColorCounts();
  const map = {
    U: document.querySelector(".count-u"),
    R: document.querySelector(".count-r"),
    F: document.querySelector(".count-f"),
    D: document.querySelector(".count-d"),
    L: document.querySelector(".count-l"),
    B: document.querySelector(".count-b"),
    X: document.querySelector(".count-x")
  };

  map.U.textContent = `U: ${counts.U} / 9`;
  map.R.textContent = `R: ${counts.R} / 9`;
  map.F.textContent = `F: ${counts.F} / 9`;
  map.D.textContent = `D: ${counts.D} / 9`;
  map.L.textContent = `L: ${counts.L} / 9`;
  map.B.textContent = `B: ${counts.B} / 9`;
  map.X.textContent = `X: ${counts.X}`;
}

function renderAllFaces() {
  for (const face of NET_FACES) {
    renderFace(face);
  }
  faceletBox.textContent = getFaceletString();
  updateCountsUI();
}

function buildFaceGrid(face) {
  const container = document.getElementById(`face-${face}`);
  if (!container) return;

  container.innerHTML = "";

  for (let i = 0; i < 9; i++) {
    const sticker = document.createElement("button");
    sticker.type = "button";
    sticker.className = "sticker";
    sticker.dataset.face = face;
    sticker.dataset.index = String(i);

    if (i === 4) {
      sticker.classList.add("center-locked");
      sticker.setAttribute("aria-disabled", "true");
    }

    container.appendChild(sticker);
  }
}

function createFaceGrids() {
  for (const face of NET_FACES) {
    buildFaceGrid(face);
  }
  renderAllFaces();
}

function liveInputHealth() {
  const counts = getColorCounts();
  if (counts.X > 0) {
    setBanner("warning", `Input incomplete: ${counts.X} sticker(s) still empty.`);
    return;
  }

  for (const color of FACE_ORDER) {
    if (counts[color] !== 9) {
      setBanner("danger", `Color counts are off: ${color} has ${counts[color]} sticker(s).`);
      return;
    }
  }

  setBanner("success", "Color counts look complete. Run Validate for full checking.");
}

function handleStickerClick(face, index, colorToApply = selectedColor) {
  if (index === 4) return;

  faceState[face][index] = colorToApply;
  renderFace(face);
  faceletBox.textContent = getFaceletString();
  updateCountsUI();
  inputStatus.textContent = `Applied ${colorToApply} to ${face}${index + 1}`;
  validationBox.textContent = "Input updated. Run Validate to check the current state.";
  liveInputHealth();
}

function wireFaceGridClicks() {
  for (const face of NET_FACES) {
    const container = document.getElementById(`face-${face}`);
    if (!container) continue;

    container.addEventListener("click", (event) => {
      const target = event.target.closest(".sticker");
      if (!target) return;

      const clickedFace = target.dataset.face;
      const clickedIndex = Number(target.dataset.index);

      if (!clickedFace || Number.isNaN(clickedIndex)) return;
      handleStickerClick(clickedFace, clickedIndex, selectedColor);
    });

    container.addEventListener("contextmenu", (event) => {
      const target = event.target.closest(".sticker");
      if (!target) return;

      event.preventDefault();

      const clickedFace = target.dataset.face;
      const clickedIndex = Number(target.dataset.index);

      if (!clickedFace || Number.isNaN(clickedIndex) || clickedIndex === 4) return;
      handleStickerClick(clickedFace, clickedIndex, "X");
    });
  }
}

function clearNonCenters() {
  for (const face of FACE_ORDER) {
    for (let i = 0; i < 9; i++) {
      faceState[face][i] = i === 4 ? CENTER_COLORS[face] : "X";
    }
  }

  renderAllFaces();
  validationBox.textContent = "Cleared all non-center stickers.";
  inputStatus.textContent = "Cleared";
  setBanner("warning", "Input cleared. Paint the cube state again.");
}

function fillSolved() {
  for (const face of FACE_ORDER) {
    for (let i = 0; i < 9; i++) {
      faceState[face][i] = CENTER_COLORS[face];
    }
  }

  renderAllFaces();
  validationBox.textContent = "Filled with solved cube colors.";
  inputStatus.textContent = "Solved template loaded";
  setBanner("success", "Solved template loaded.");
}

function setSelectedColor(colorCode) {
  selectedColor = colorCode;
  colorPickButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.color === colorCode);
  });
  selectedPaintLabel.textContent = COLOR_LABELS[colorCode] || colorCode;
}

function getFaceletString() {
  return FACE_ORDER.map((face) => faceState[face].join("")).join("");
}

function validateFaceCounts() {
  const counts = getColorCounts();
  const issues = [];

  for (const face of FACE_ORDER) {
    if (faceState[face][4] !== CENTER_COLORS[face]) {
      issues.push(`Center of ${face} is invalid.`);
    }
  }

  if (counts.X > 0) {
    issues.push(`There are ${counts.X} unfilled stickers.`);
  }

  for (const color of FACE_ORDER) {
    if (counts[color] !== 9) {
      issues.push(`${color} has ${counts[color]} stickers instead of 9.`);
    }
  }

  return {
    ok: issues.length === 0,
    counts,
    issues
  };
}

async function validateManualInput() {
  const facelet = getFaceletString();
  faceletBox.textContent = facelet;

  const basic = validateFaceCounts();

  if (!basic.ok) {
    validationBox.textContent =
      "Validation failed:\n" +
      basic.issues.map((x) => `• ${x}`).join("\n");
    inputStatus.textContent = "Validation failed";
    setBanner("danger", "Validation failed. Fix the highlighted count or completeness issues.");
    return { ok: false, facelet };
  }

  try {
    const parsedCube = Cube.fromString(facelet);
    await ensureSolverReady();
    parsedCube.solve();

    validationBox.textContent =
      "Validation passed.\n" +
      "• Counts are correct\n" +
      "• Centers are correct\n" +
      "• Solver accepted the facelet string\n" +
      "• State appears solvable";
    inputStatus.textContent = "Validation passed";
    setBanner("success", "Validation passed. This cube state is ready to solve.");
    return { ok: true, facelet };
  } catch (error) {
    validationBox.textContent =
      "Validation failed:\n" +
      "• Counts may be correct, but the solver rejected this state\n" +
      "• The arrangement may be impossible or inconsistent";
    inputStatus.textContent = "Validation failed";
    setBanner("danger", "The state is not solver-valid. Check sticker placement again.");
    return { ok: false, facelet };
  }
}

async function solveManualInput() {
  scrollToSection("solver");

  const result = await validateManualInput();
  if (!result.ok) {
    setStatus("Manual input is not valid yet.");
    return;
  }

  try {
    await ensureSolverReady();
    solverStatus.textContent = "Solving...";
    setStatus("Computing solution for entered cube...");

    const cube = Cube.fromString(result.facelet);
    const solution = cube.solve();

    currentSolution = solution;
    scrambleBox.textContent = "Manual cube state loaded";
    solutionBox.textContent = solution || "(already solved)";
    modeStatus.textContent = "Manual entered cube solve";
    inputStatus.textContent = "Solved";

    player.experimentalSetupAlg = "";
    player.experimentalSetupAnchor = "end";
    player.alg = solution || "";

    solverStatus.textContent = "Solved";
    setStatus("Entered cube solved. Solution loaded into the viewer.");
  } catch (error) {
    console.error(error);
    solverStatus.textContent = "Error";
    inputStatus.textContent = "Solver error";
    setStatus("Could not solve the entered cube state.");
    setBanner("danger", "Solver failed on this state.");
  }
}

colorPickButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    setSelectedColor(btn.dataset.color);
  });
});

scrambleBtn?.addEventListener("click", generateScramble);
solveBtn?.addEventListener("click", solveCurrentScramble);
resetBtn?.addEventListener("click", resetAll);
validateBtn?.addEventListener("click", validateManualInput);
solveInputBtn?.addEventListener("click", solveManualInput);
fillSolvedBtn?.addEventListener("click", fillSolved);
clearInputBtn?.addEventListener("click", clearNonCenters);

jumpToSolverBtn?.addEventListener("click", () => {
  scrollToSection("solver");
  setStatus("Solver workspace opened.");
});

jumpToInputBtn?.addEventListener("click", () => {
  scrollToSection("input");
  setStatus("Manual input panel opened.");
});

initializeCenters();
createFaceGrids();
wireFaceGridClicks();
clearNonCenters();
setSelectedColor("U");
solverStatus.textContent = "Not initialized";
resetAll();
validationBox.textContent = "No validation run yet.";
faceletBox.textContent = getFaceletString();
inputStatus.textContent = "Waiting for input";
updateCountsUI();
setBanner("neutral", "No validation run yet.");
