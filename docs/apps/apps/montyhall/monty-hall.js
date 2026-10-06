(() => {
  "use strict";

  const OPENING_STAGGER_MS = 95;
  const CURTAIN_OPEN_MS = 850;
  const SAVE_SCORE_ON_THIS_DEVICE = true;
  const THEMES = {
    trophy: { prize: "🏆", prizeName: "trophy", wrong: [""] },
    car: { prize: "🚗", prizeName: "new convertible", wrong: ["🐐", "🦆", "🦙", "🐓", "🐖", "🦃", "🫏", "🐑", "🦤", "🦀"] },
    purdue: { prize: "images/IUwinner.jpg", prizeName: "IU national championship trophy", wrong: (window.PURDUE_MEDIA || ["images/purduegoat.mp4", "images/purduesheep.mp4"]), media: true, animateMedia: true },
    purdueStill: { prize: "images/IUwinner.jpg", prizeName: "IU national championship trophy", wrong: (window.PURDUE_MEDIA || ["images/purduegoat.mp4", "images/purduesheep.mp4"]), media: true, animateMedia: false }
  };

  const grid = document.getElementById("door-grid");
  if (!grid) return;
  const instruction = document.getElementById("monty-instruction");
  const decisionPanel = document.getElementById("decision-panel");
  const decisionText = document.getElementById("decision-text");
  const stayButton = document.getElementById("stay-button");
  const switchButton = document.getElementById("switch-button");
  const resultPanel = document.getElementById("result-panel");
  const resultIcon = document.getElementById("result-icon");
  const resultTitle = document.getElementById("result-title");
  const resultText = document.getElementById("result-text");
  const lessonText = document.getElementById("lesson-text");
  const playAgain = document.getElementById("play-again");
  const scoreModeLabel = document.getElementById("score-mode-label");
  const modeButtons = Array.from(document.querySelectorAll(".mode-button"));
  const scaleInput = document.getElementById("door-scale");
  const scaleLabel = document.getElementById("door-scale-label");
  const layoutButtons = Array.from(document.querySelectorAll("[data-layout]"));
  const themeSelect = document.getElementById("prize-theme");

  let numberOfDoors = 50, prizeDoor = null, chosenDoor = null, otherDoor = null;
  let gameLocked = false, gameToken = 0, doorScale = 115, gridLayout = "10x5", themeName = "trophy";
  const blankStats = { games: 0, stayGames: 0, stayWins: 0, switchGames: 0, switchWins: 0 };
  let statsByMode = { 3: loadStats(3), 50: loadStats(50) };

  function loadStats(mode) {
    if (!SAVE_SCORE_ON_THIS_DEVICE) return { ...blankStats };
    try { return { ...blankStats, ...JSON.parse(localStorage.getItem(`montyStats${mode}`)) }; }
    catch (_) { return { ...blankStats }; }
  }
  function saveStats() {
    if (SAVE_SCORE_ON_THIS_DEVICE) localStorage.setItem(`montyStats${numberOfDoors}`, JSON.stringify(statsByMode[numberOfDoors]));
  }
  function randomDoor(excluding = []) {
    const options = Array.from({ length: numberOfDoors }, (_, i) => i + 1).filter(n => !excluding.includes(n));
    return options[Math.floor(Math.random() * options.length)];
  }
  function doorElement(n) { return grid.querySelector(`[data-door="${n}"]`); }
  function randomWrong() {
    const choices = THEMES[themeName].wrong;
    return choices[Math.floor(Math.random() * choices.length)];
  }
  function applyGridSettings() {
    grid.classList.toggle("three-doors", numberOfDoors === 3);
    grid.classList.toggle("five-across", numberOfDoors === 50 && gridLayout === "5x10");
    const base = numberOfDoors === 3 ? 560 : (gridLayout === "5x10" ? 560 : 920);
    const factor = doorScale / 100;
    // Width grows normally until it reaches the available kiosk width. After that,
    // keep increasing curtain height so the size slider never appears to stop working.
    grid.style.width = `min(${Math.round(base * factor)}px, calc(100vw - 32px))`;
    grid.style.maxWidth = "none";
    grid.style.setProperty("--mh-height-scale", String(Math.max(1, factor / 1.15)));
  }
  function buildDoors() {
    grid.innerHTML = "";
    applyGridSettings();
    grid.setAttribute("aria-label", `${numberOfDoors} doors`);
    for (let n = 1; n <= numberOfDoors; n++) {
      const button = document.createElement("button");
      button.type = "button"; button.className = "door"; button.dataset.door = n;
      button.innerHTML = `<span class="door-reveal" aria-hidden="true"></span><span class="curtain curtain-left" aria-hidden="true"></span><span class="curtain curtain-right" aria-hidden="true"></span><span class="door-number">${n}</span>`;
      button.setAttribute("aria-label", `Door ${n}`);
      button.addEventListener("click", () => chooseDoor(n));
      grid.appendChild(button);
    }
  }
  function revealWrongDoor(n) {
    const el = doorElement(n); if (!el) return;
    el.classList.add("open", "wrong-reveal"); el.disabled = true;
    const reveal = el.querySelector(".door-reveal");
    const value = randomWrong();
    reveal.replaceChildren();
    if (THEMES[themeName].media) {
      const isVideo = /\.(mp4|webm|mov|m4v)$/i.test(value);
      if (isVideo) {
        const video = document.createElement("video");
        video.src = value; video.muted = true; video.playsInline = true; video.preload = "auto";
        video.setAttribute("aria-hidden", "true");
        reveal.appendChild(video);
        if (THEMES[themeName].animateMedia) {
          video.autoplay = true; video.loop = true;
          video.play().catch(() => {});
        } else {
          // Static Purdue mode: show a representative frame from the video without playing it.
          video.classList.add("static-animal");
          video.addEventListener("loadedmetadata", () => {
            const target = Number.isFinite(video.duration) && video.duration > 0.8 ? Math.min(0.6, video.duration * 0.2) : 0.1;
            try { video.currentTime = target; } catch (_) {}
          }, { once: true });
          video.addEventListener("seeked", () => video.pause(), { once: true });
          video.pause();
        }
      } else {
        const img = document.createElement("img");
        img.src = value; img.alt = "Purdue surprise";
        reveal.appendChild(img);
      }
    } else { reveal.textContent = value; }
  }
  function revealPrizeDoor() {
    const el = doorElement(prizeDoor); if (!el) return;
    el.classList.remove("open", "wrong-reveal"); el.classList.add("prize");
    const reveal = el.querySelector(".door-reveal");
    reveal.replaceChildren();
    if (THEMES[themeName].media) {
      const img = document.createElement("img");
      img.src = THEMES[themeName].prize; img.alt = THEMES[themeName].prizeName;
      reveal.appendChild(img);
    } else { reveal.textContent = THEMES[themeName].prize; }
    el.setAttribute("aria-label", `Door ${prizeDoor}: ${THEMES[themeName].prizeName}`);
  }

  async function chooseDoor(n) {
    if (gameLocked || chosenDoor !== null) return;
    gameLocked = true; const token = gameToken; chosenDoor = n;
    doorElement(n).classList.add("selected");
    instruction.textContent = `You picked Door ${n}. Monty knows where the prize is...`;
    otherDoor = chosenDoor === prizeDoor ? randomDoor([chosenDoor]) : prizeDoor;
    const doorsToOpen = Array.from({ length: numberOfDoors }, (_, i) => i + 1).filter(d => d !== chosenDoor && d !== otherDoor);
    for (let i = doorsToOpen.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1)); [doorsToOpen[i], doorsToOpen[j]] = [doorsToOpen[j], doorsToOpen[i]];
    }
    const openCount = numberOfDoors - 2;
    instruction.textContent = `Monty is opening ${openCount} door${openCount === 1 ? "" : "s"} he knows ${openCount === 1 ? "is" : "are"} wrong...`;
    for (const d of doorsToOpen) {
      if (token !== gameToken) return;
      revealWrongDoor(d);
      if (numberOfDoors > 3) await sleep(OPENING_STAGGER_MS);
    }
    if (token !== gameToken) return;
    doorElement(otherDoor).classList.add("other-final");
    instruction.textContent = `Only Door ${chosenDoor} and Door ${otherDoor} are left!`;
    decisionText.innerHTML = `You chose <strong>Door ${chosenDoor}</strong>. Monty left <strong>Door ${otherDoor}</strong> closed. What do you want to do?`;
    stayButton.textContent = `STAY with Door ${chosenDoor}`; switchButton.textContent = `SWITCH to Door ${otherDoor}`;
    decisionPanel.hidden = false; gameLocked = false;
  }

  function finishGame(switched) {
    if (gameLocked) return; gameLocked = true; decisionPanel.hidden = true;
    const finalDoor = switched ? otherDoor : chosenDoor; const won = finalDoor === prizeDoor;
    doorElement(prizeDoor)?.classList.add("final-reveal");
    const finalOther = finalDoor === chosenDoor ? otherDoor : chosenDoor;
    doorElement(finalOther)?.classList.add("final-reveal");
    revealPrizeDoor();
    const winningEl = doorElement(prizeDoor);
    window.setTimeout(() => {
      if (winningEl && winningEl.classList.contains("prize")) winningEl.classList.add("prize-expanded");
    }, 1550);
    const losingFinal = finalDoor === chosenDoor ? otherDoor : chosenDoor;
    if (losingFinal !== prizeDoor) revealWrongDoor(losingFinal);
    const stats = statsByMode[numberOfDoors]; stats.games += 1;
    if (switched) { stats.switchGames += 1; if (won) stats.switchWins += 1; }
    else { stats.stayGames += 1; if (won) stats.stayWins += 1; }
    saveStats(); updateScoreboard();
    const initialChance = Math.round(100 / numberOfDoors), switchChance = Math.round(((numberOfDoors - 1) / numberOfDoors) * 100);
    resultIcon.textContent = won ? "★" : "○"; resultTitle.textContent = won ? "You won!" : "Not this time!";
    resultText.innerHTML = `The <strong>${THEMES[themeName].prizeName}</strong> was behind <strong>Door ${prizeDoor}</strong>. You ${switched ? "switched to" : "stayed with"} Door ${finalDoor}.`;
    lessonText.innerHTML = switched ? `Your first pick had about a ${initialChance}% chance. Switching takes advantage of the roughly ${switchChance}% chance that your first pick was wrong.` : `Your first pick had only about a ${initialChance}% chance of being right. Try switching next time and watch the scoreboard!`;
    resultPanel.hidden = false; instruction.textContent = won ? "You found the prize!" : "Try another round.";
  }

  function setMode(mode) {
    numberOfDoors = mode; gameToken += 1;
    modeButtons.forEach(btn => { const active = Number(btn.dataset.doors) === mode; btn.classList.toggle("active", active); btn.setAttribute("aria-pressed", active ? "true" : "false"); });
    scoreModeLabel.textContent = `${mode} doors`; updateScoreboard(); resetGame(false);
  }
  function resetGame() {
    gameToken += 1; prizeDoor = randomDoor(); chosenDoor = null; otherDoor = null; gameLocked = false;
    decisionPanel.hidden = true; resultPanel.hidden = true;
    instruction.textContent = `A prize is hidden behind one of ${numberOfDoors} doors. Pick a door!`; buildDoors();
  }
  function updateScoreboard() {
    const stats = statsByMode[numberOfDoors];
    document.getElementById("games-played").textContent = stats.games;
    document.getElementById("stay-record").textContent = `${stats.stayWins} / ${stats.stayGames} wins`;
    document.getElementById("switch-record").textContent = `${stats.switchWins} / ${stats.switchGames} wins`;
    document.getElementById("stay-rate").textContent = rate(stats.stayWins, stats.stayGames);
    document.getElementById("switch-rate").textContent = rate(stats.switchWins, stats.switchGames);
  }
  function rate(wins, games) { return games ? `${Math.round((wins / games) * 100)}% win rate` : "—"; }
  function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

  stayButton.addEventListener("click", () => finishGame(false));
  switchButton.addEventListener("click", () => finishGame(true));
  playAgain.addEventListener("click", resetGame);
  modeButtons.forEach(btn => btn.addEventListener("click", () => setMode(Number(btn.dataset.doors))));
  scaleInput.addEventListener("input", () => { doorScale = Number(scaleInput.value); scaleLabel.textContent = `${doorScale}%`; applyGridSettings(); });
  layoutButtons.forEach(btn => btn.addEventListener("click", () => {
    gridLayout = btn.dataset.layout; layoutButtons.forEach(b => b.classList.toggle("active", b === btn)); applyGridSettings();
  }));
  themeSelect.addEventListener("change", () => { themeName = themeSelect.value; resetGame(); });

  setMode(50);
})();
