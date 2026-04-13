import { TwistyPlayer } from "https://cdn.cubing.net/v0/js/cubing/twisty";
import { randomScrambleForEvent } from "https://cdn.cubing.net/v0/js/cubing/scramble";

const Cube = window.Cube;

const cubeMount = document.getElementById("cubeMount");
const scrambleBox = document.getElementById("scrambleBox");
const solutionBox = document.getElementById("solutionBox");
const solverStatus = document.getElementById("solverStatus");
const playerStatus = document.getElementById("playerStatus");
const footerMessage = document.getElementById("footerMessage");

const scrambleBtn = document.getElementById("scrambleBtn");
const solveBtn = document.getElementById("solveBtn");
const resetBtn = document.getElementById("resetBtn");
const jumpToSolverBtn = document.getElementById("jumpToSolverBtn");
const demoFlowBtn = document.getElementById("demoFlowBtn");

let currentScramble = "";
let currentSolution = "";
let solverInitialized = false;
let currentCube = null;

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

function scrollToSolver() {
  document.getElementById("solver")?.scrollIntoView({ behavior: "smooth" });
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
  scrollToSolver();

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
    setStatus("Random scramble loaded. Press Solve to compute the solution.");
  } catch (error) {
    console.error(error);
    setStatus("Could not generate scramble.");
  }
}

async function solveCurrentScramble() {
  scrollToSolver();

  if (!currentCube || !currentScramble) {
    setStatus("Generate a scramble first.");
    return;
  }

  try {
    await ensureSolverReady();

    solverStatus.textContent = "Solving...";
    setStatus("Computing solution...");

    const cubeToSolve = new Cube(currentCube);
    const solution = cubeToSolve.solve();

    currentSolution = solution;
    solutionBox.textContent = solution;
    setSolutionPlayback(currentScramble, solution);

    solverStatus.textContent = "Solved";
    setStatus("Solution computed and loaded into animated playback.");
  } catch (error) {
    console.error(error);
    solverStatus.textContent = "Error";
    setStatus("Could not solve the current scramble.");
  }
}

scrambleBtn?.addEventListener("click", generateScramble);
solveBtn?.addEventListener("click", solveCurrentScramble);
resetBtn?.addEventListener("click", resetAll);

jumpToSolverBtn?.addEventListener("click", () => {
  scrollToSolver();
  setStatus("Solver workspace opened.");
});

demoFlowBtn?.addEventListener("click", () => {
  scrollToSolver();
  alert(
    "CubeCraft by Jacob\n\n" +
    "Step 3 is now live:\n" +
    "• generate random scramble\n" +
    "• initialize real solver\n" +
    "• compute solution sequence\n" +
    "• animate solve playback\n\n" +
    "Next: manual face input and validation."
  );
  setStatus("How-it-works dialog opened.");
});

solverStatus.textContent = "Not initialized";
resetAll();
