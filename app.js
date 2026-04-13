import { TwistyPlayer } from "https://cdn.cubing.net/v0/js/cubing/twisty";
import { randomScrambleForEvent } from "https://cdn.cubing.net/v0/js/cubing/scramble";

const cubeMount = document.getElementById("cubeMount");
const sequenceBox = document.getElementById("sequenceBox");
const playerStatus = document.getElementById("playerStatus");
const footerMessage = document.getElementById("footerMessage");

const scrambleBtn = document.getElementById("scrambleBtn");
const demoAlgBtn = document.getElementById("demoAlgBtn");
const resetBtn = document.getElementById("resetBtn");
const jumpToSolverBtn = document.getElementById("jumpToSolverBtn");
const demoFlowBtn = document.getElementById("demoFlowBtn");

const defaultAlg = "R U R' U'";
const demoAlg = "R U R' U R U2 R'";

let currentSequence = defaultAlg;

const player = new TwistyPlayer({
  puzzle: "3x3x3",
  alg: defaultAlg,
  hintFacelets: "floating",
  background: "none",
  controlPanel: "bottom-row",
  backView: "none",
  experimentalSetupAnchor: "start"
});

cubeMount.appendChild(player);

function updateSequenceDisplay(sequence, label) {
  currentSequence = sequence && sequence.trim().length > 0 ? sequence : "(solved)";
  sequenceBox.textContent = currentSequence;
  if (label) {
    playerStatus.textContent = label;
    footerMessage.textContent = label;
  }
}

function scrollToSolver() {
  document.getElementById("solver")?.scrollIntoView({ behavior: "smooth" });
}

async function loadRandomScramble() {
  try {
    updateSequenceDisplay(currentSequence, "Generating random scramble...");
    const scramble = await randomScrambleForEvent("333");
    const scrambleText = scramble.toString();

    player.alg = scrambleText;
    updateSequenceDisplay(
      scrambleText,
      "Random 3×3 scramble loaded into the viewer."
    );
  } catch (error) {
    console.error(error);
    updateSequenceDisplay(
      currentSequence,
      "Could not generate scramble. Check browser support or network access."
    );
  }
}

function loadDemoAlg() {
  player.alg = demoAlg;
  updateSequenceDisplay(
    demoAlg,
    "Demo algorithm loaded."
  );
}

function resetCube() {
  player.alg = "";
  updateSequenceDisplay(
    "(solved)",
    "Cube reset to solved state."
  );
}

scrambleBtn?.addEventListener("click", async () => {
  scrollToSolver();
  await loadRandomScramble();
});

demoAlgBtn?.addEventListener("click", () => {
  scrollToSolver();
  loadDemoAlg();
});

resetBtn?.addEventListener("click", () => {
  scrollToSolver();
  resetCube();
});

jumpToSolverBtn?.addEventListener("click", () => {
  scrollToSolver();
  updateSequenceDisplay(currentSequence, "Solver workspace opened.");
});

demoFlowBtn?.addEventListener("click", () => {
  scrollToSolver();
  loadDemoAlg();
  alert(
    "CubeCraft by Jacob\n\n" +
    "Step 2 is now live:\n" +
    "• real 3D cube viewer\n" +
    "• random scramble button\n" +
    "• demo algorithm loading\n" +
    "• reset to solved state\n\n" +
    "Next: connect actual solving logic and face input."
  );
});

updateSequenceDisplay(defaultAlg, "Interactive cube ready.");
