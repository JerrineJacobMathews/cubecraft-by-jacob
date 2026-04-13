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

const cameraVideo = document.getElementById("cameraVideo");
const captureCanvas = document.getElementById("captureCanvas");
const cameraStatus = document.getElementById("cameraStatus");
const cameraDebugBox = document.getElementById("cameraDebugBox");
const cameraResultGrid = document.getElementById("cameraResultGrid");

const scrambleBtn = document.getElementById("scrambleBtn");
const solveBtn = document.getElementById("solveBtn");
const resetBtn = document.getElementById("resetBtn");
const solveInputBtn = document.getElementById("solveInputBtn");
const validateBtn = document.getElementById("validateBtn");
const fillSolvedBtn = document.getElementById("fillSolvedBtn");
const clearInputBtn = document.getElementById("clearInputBtn");
const jumpToSolverBtn = document.getElementById("jumpToSolverBtn");
const jumpToCameraBtn = document.getElementById("jumpToCameraBtn");

const openCameraBtn = document.getElementById("openCameraBtn");
const captureFaceBtn = document.getElementById("captureFaceBtn");
const closeCameraBtn = document.getElementById("closeCameraBtn");
const applyScanBtn = document.getElementById("applyScanBtn");

const colorPickButtons = Array.from(document.querySelectorAll(".color-pick"));
const targetFaceButtons = Array.from(document.querySelectorAll(".target-face-btn"));

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

const COLOR_RGB = {
  U: [245, 247, 250],
  R: [255, 90, 90],
  F: [68, 210, 124],
  D: [255, 216, 77],
  L: [255, 154, 60],
  B: [76, 162, 255]
};

let selectedColor = "U";
let targetFace = "U";
let currentScramble = "";
let currentSolution = "";
let solverInitialized = false;
let currentCube = null;
let cameraStream = null;
let lastScanColors = Array(9).fill("X");

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
  validationBanner.classList.add(
    kind === "success" ? "validation-success" :
    kind === "warning" ? "validation-warning" :
    kind === "danger" ? "validation-danger" :
    "validation-neutral"
  );
  validationBanner.textContent = message;
}

function setButtonBusy(button, busyText) {
  if (!button) return () => {};
  const oldText = button.textContent;
  button.disabled = true;
  button.textContent = busyText;
  button.style.opacity = "0.7";
  return () => {
    button.disabled = false;
    button.textContent = oldText;
    button.style.opacity = "";
  };
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
  if (!Cube) throw new Error("cube.js library did not load.");
  if (solverInitialized) return;

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
  document.querySelector(".count-u").textContent = `U: ${counts.U} / 9`;
  document.querySelector(".count-r").textContent = `R: ${counts.R} / 9`;
  document.querySelector(".count-f").textContent = `F: ${counts.F} / 9`;
  document.querySelector(".count-d").textContent = `D: ${counts.D} / 9`;
  document.querySelector(".count-l").textContent = `L: ${counts.L} / 9`;
  document.querySelector(".count-b").textContent = `B: ${counts.B} / 9`;
  document.querySelector(".count-x").textContent = `X: ${counts.X}`;
}

function renderAllFaces() {
  for (const face of NET_FACES) renderFace(face);
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
  for (const face of NET_FACES) buildFaceGrid(face);
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

  if (counts.X > 0) issues.push(`There are ${counts.X} unfilled stickers.`);
  for (const color of FACE_ORDER) {
    if (counts[color] !== 9) issues.push(`${color} has ${counts[color]} stickers instead of 9.`);
  }

  return { ok: issues.length === 0, counts, issues };
}

async function validateManualInput() {
  const facelet = getFaceletString();
  faceletBox.textContent = facelet;
  const basic = validateFaceCounts();

  if (!basic.ok) {
    validationBox.textContent =
      "Validation failed:\n" + basic.issues.map((x) => `• ${x}`).join("\n");
    inputStatus.textContent = "Validation failed";
    setBanner("danger", "Validation failed. Fix the count or completeness issues.");
    return { ok: false, facelet };
  }

  try {
    validationBox.textContent = "Running deep validation...";
    inputStatus.textContent = "Validating...";
    setBanner("warning", "Checking solver validity...");

    await ensureSolverReady();
    const parsedCube = Cube.fromString(facelet);
    const testSolution = parsedCube.solve();

    validationBox.textContent =
      "Validation passed.\n" +
      "• Counts are correct\n" +
      "• Centers are correct\n" +
      "• Solver accepted the facelet string\n" +
      "• State appears solvable\n" +
      `• Preview solution: ${testSolution || "(already solved)"}`;

    inputStatus.textContent = "Validation passed";
    setBanner("success", "Validation passed. This cube state is ready to solve.");
    return { ok: true, facelet };
  } catch (error) {
    console.error(error);
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
  const restoreButton = setButtonBusy(solveInputBtn, "Solving...");

  try {
    const result = await validateManualInput();
    if (!result.ok) {
      setStatus("Manual input is not valid yet.");
      return;
    }

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
    setBanner("success", "Solve completed.");
  } catch (error) {
    console.error(error);
    solverStatus.textContent = "Error";
    inputStatus.textContent = "Solver error";
    setStatus("Could not solve the entered cube state.");
    setBanner("danger", "Solver failed on this state.");
  } finally {
    restoreButton();
  }
}

/* Camera */
function setTargetFace(face) {
  targetFace = face;
  targetFaceButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.targetFace === face);
  });
}

function renderCameraResult(colors) {
  const cells = cameraResultGrid.querySelectorAll(".camera-result-cell");
  cells.forEach((cell, i) => {
    const value = colors[i] || "X";
    cell.className = "camera-result-cell";
    cell.classList.add(`sticker-${value}`);
    cell.textContent = value;
    if (value === "U" || value === "D") {
      cell.style.color = "#071016";
    } else if (value === "X") {
      cell.style.color = "#a8bbcd";
    } else {
      cell.style.color = "#071016";
    }
  });
}

function colorDistance(a, b) {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function nearestCubeColor(rgb) {
  let best = "U";
  let bestDist = Number.POSITIVE_INFINITY;

  for (const [code, ref] of Object.entries(COLOR_RGB)) {
    const dist = colorDistance(rgb, ref);
    if (dist < bestDist) {
      bestDist = dist;
      best = code;
    }
  }

  return { code: best, distance: bestDist };
}

async function openCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    cameraStatus.textContent = "Camera API not available in this browser.";
    return;
  }

  try {
    const restore = setButtonBusy(openCameraBtn, "Opening...");
    cameraStatus.textContent = "Requesting camera permission...";

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });

    cameraStream = stream;
    cameraVideo.srcObject = stream;

    const track = stream.getVideoTracks()[0];
    if (track?.applyConstraints) {
      try {
        await track.applyConstraints({
          advanced: [{ focusMode: "continuous" }]
        });
      } catch {
        // ignore unsupported focus constraint
      }
    }

    cameraStatus.textContent = "Camera opened. Align one face inside the grid.";
    cameraDebugBox.textContent = "Camera ready. Capture a face when the cube is aligned.";
    restore();
  } catch (error) {
    console.error(error);
    cameraStatus.textContent = "Could not open camera. Check permission and HTTPS.";
    cameraDebugBox.textContent = String(error);
  }
}

function closeCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
  }
  cameraVideo.srcObject = null;
  cameraStatus.textContent = "Camera is closed.";
}

function sampleGridColors(ctx, width, height) {
  const results = [];
  const gridSize = Math.min(width, height) * 0.52;
  const startX = (width - gridSize) / 2;
  const startY = (height - gridSize) / 2;
  const cell = gridSize / 3;
  const patch = cell * 0.28;

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const centerX = startX + (col + 0.5) * cell;
      const centerY = startY + (row + 0.5) * cell;
      const x = Math.max(0, Math.floor(centerX - patch / 2));
      const y = Math.max(0, Math.floor(centerY - patch / 2));
      const w = Math.max(1, Math.floor(patch));
      const h = Math.max(1, Math.floor(patch));

      const imageData = ctx.getImageData(x, y, w, h).data;

      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < imageData.length; i += 4) {
        r += imageData[i];
        g += imageData[i + 1];
        b += imageData[i + 2];
        count++;
      }

      const avg = [
        Math.round(r / count),
        Math.round(g / count),
        Math.round(b / count)
      ];

      const guess = nearestCubeColor(avg);
      results.push({
        rgb: avg,
        code: guess.code,
        distance: Math.round(guess.distance)
      });
    }
  }

  return results;
}

function forceCenterColor(colors, face) {
  const out = [...colors];
  out[4] = CENTER_COLORS[face];
  return out;
}

function captureFace() {
  if (!cameraStream || !cameraVideo.videoWidth || !cameraVideo.videoHeight) {
    cameraStatus.textContent = "Camera is not ready yet.";
    return;
  }

  const width = cameraVideo.videoWidth;
  const height = cameraVideo.videoHeight;
  captureCanvas.width = width;
  captureCanvas.height = height;

  const ctx = captureCanvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(cameraVideo, 0, 0, width, height);

  const samples = sampleGridColors(ctx, width, height);
  const guessed = forceCenterColor(samples.map((s) => s.code), targetFace);

  lastScanColors = guessed;
  renderCameraResult(guessed);

  const lines = samples.map((s, i) => {
    return `${i + 1}: rgb(${s.rgb.join(", ")}) -> ${guessed[i]} (distance ${s.distance})`;
  });

  cameraStatus.textContent = `Face captured for target ${targetFace}. Review and apply if it looks correct.`;
  cameraDebugBox.textContent =
    `Target face: ${targetFace}\n` +
    `Guessed colors: ${guessed.join(" ")}\n\n` +
    lines.join("\n");
}

function applyScanToFace() {
  if (!lastScanColors || lastScanColors.length !== 9) {
    cameraStatus.textContent = "No scan result available yet.";
    return;
  }

  for (let i = 0; i < 9; i++) {
    faceState[targetFace][i] = i === 4 ? CENTER_COLORS[targetFace] : lastScanColors[i];
  }

  renderFace(targetFace);
  faceletBox.textContent = getFaceletString();
  updateCountsUI();
  inputStatus.textContent = `Applied scanned colors to face ${targetFace}`;
  setBanner("warning", `Scan applied to face ${targetFace}. Review and correct any mistakes, then validate.`);
  cameraStatus.textContent = `Scan applied to face ${targetFace}.`;
  scrollToSection("input");
}

/* Events */
colorPickButtons.forEach((btn) => {
  btn.addEventListener("click", () => setSelectedColor(btn.dataset.color));
});

targetFaceButtons.forEach((btn) => {
  btn.addEventListener("click", () => setTargetFace(btn.dataset.targetFace));
});

scrambleBtn?.addEventListener("click", generateScramble);
solveBtn?.addEventListener("click", solveCurrentScramble);
resetBtn?.addEventListener("click", resetAll);

validateBtn?.addEventListener("click", async () => {
  const restore = setButtonBusy(validateBtn, "Validating...");
  try {
    await validateManualInput();
  } finally {
    restore();
  }
});

solveInputBtn?.addEventListener("click", solveManualInput);
fillSolvedBtn?.addEventListener("click", fillSolved);
clearInputBtn?.addEventListener("click", clearNonCenters);

jumpToSolverBtn?.addEventListener("click", () => {
  scrollToSection("solver");
  setStatus("Solver workspace opened.");
});

jumpToCameraBtn?.addEventListener("click", () => {
  scrollToSection("camera");
  setStatus("Camera section opened.");
});

openCameraBtn?.addEventListener("click", openCamera);
captureFaceBtn?.addEventListener("click", captureFace);
closeCameraBtn?.addEventListener("click", closeCamera);
applyScanBtn?.addEventListener("click", applyScanToFace);

/* Face grid clicks */
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
      if (clickedIndex === 4) return;
      faceState[clickedFace][clickedIndex] = selectedColor;
      renderFace(clickedFace);
      faceletBox.textContent = getFaceletString();
      updateCountsUI();
      inputStatus.textContent = `Applied ${selectedColor} to ${clickedFace}${clickedIndex + 1}`;
      validationBox.textContent = "Input updated. Run Validate to check the current state.";
      liveInputHealth();
    });

    container.addEventListener("contextmenu", (event) => {
      const target = event.target.closest(".sticker");
      if (!target) return;
      event.preventDefault();
      const clickedFace = target.dataset.face;
      const clickedIndex = Number(target.dataset.index);
      if (!clickedFace || Number.isNaN(clickedIndex) || clickedIndex === 4) return;
      faceState[clickedFace][clickedIndex] = "X";
      renderFace(clickedFace);
      faceletBox.textContent = getFaceletString();
      updateCountsUI();
      inputStatus.textContent = `Cleared ${clickedFace}${clickedIndex + 1}`;
      validationBox.textContent = "Input updated. Run Validate to check the current state.";
      liveInputHealth();
    });
  }
}

/* Init */
initializeCenters();
createFaceGrids();
wireFaceGridClicks();
clearNonCenters();
setSelectedColor("U");
setTargetFace("U");
solverStatus.textContent = "Not initialized";
resetAll();
validationBox.textContent = "No validation run yet.";
faceletBox.textContent = getFaceletString();
inputStatus.textContent = "Waiting for input";
updateCountsUI();
setBanner("neutral", "No validation run yet.");
renderCameraResult(lastScanColors);

window.addEventListener("beforeunload", closeCamera);
