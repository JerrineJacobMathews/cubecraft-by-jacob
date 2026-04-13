const footerMessage = document.getElementById("footerMessage");
const startBtn = document.getElementById("startBtn");
const demoBtn = document.getElementById("demoBtn");

function setFooterMessage(message) {
  if (footerMessage) {
    footerMessage.textContent = message;
  }
}

if (startBtn) {
  startBtn.addEventListener("click", () => {
    document.getElementById("roadmap")?.scrollIntoView({ behavior: "smooth" });
    setFooterMessage("Project shell created. Next: real animated cube integration.");
  });
}

if (demoBtn) {
  demoBtn.addEventListener("click", () => {
    alert(
      "CubeCraft by Jacob\\n\\n" +
      "Step 1 completed: branded project shell\\n" +
      "Step 2: integrate real cube animation\\n" +
      "Step 3: scramble/solve controls\\n" +
      "Step 4: manual editor and camera assistant"
    );
    setFooterMessage("Demo flow opened.");
  });
}

setFooterMessage("Starter page ready.");
