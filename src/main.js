import {
  BOOST_CODEX,
  MONSTER_LIBRARY,
  SKILL_LIBRARY,
  TALENT_LIBRARY,
  formatDuration,
  getDifficultyProfile,
  getDifficultySummary,
  getExclusiveDefinition,
  getSkillForExclusive,
  getTalentCost,
  normalizeDifficultyLevel,
} from "./data.js";
import { GameRuntime } from "./game.js";
import {
  applyRunResult,
  loadProgress,
  purchaseExclusiveUnlock,
  purchaseSkillUnlock,
  purchaseTalent,
  saveProgress,
  setExclusiveEnabled,
  updateSettings,
} from "./storage.js";

const STATUS_LABELS = {
  menu: "待机",
  running: "进行中",
  paused: "已暂停",
  levelup: "升级中",
  ended: "已结束",
};

const elements = {
  menuView: document.querySelector("#menuView"),
  gameView: document.querySelector("#gameView"),
  canvas: document.querySelector("#gameCanvas"),
  difficultyInput: document.querySelector("#difficultyInput"),
  difficultyBadge: document.querySelector("#difficultyBadge"),
  difficultySummary: document.querySelector("#difficultySummary"),
  overlays: Array.from(document.querySelectorAll(".screen-overlay")),
  hudFields: document.querySelectorAll("#hudStats [data-field]"),
  hudTimerText: document.querySelector("#hudTimerText"),
  hudHealthText: document.querySelector("#hudHealthText"),
  hudLevelText: document.querySelector("#hudLevelText"),
  activeSkills: document.querySelector("#activeSkills"),
  levelChoices: document.querySelector("#levelChoices"),
  talentList: document.querySelector("#talentList"),
  skillUnlockShop: document.querySelector("#skillUnlockShop"),
  exclusiveUnlockShop: document.querySelector("#exclusiveUnlockShop"),
  codexMonsters: document.querySelector("#codexMonsters"),
  codexSkills: document.querySelector("#codexSkills"),
  codexBoosts: document.querySelector("#codexBoosts"),
  menuSummary: document.querySelector("#menuSummary"),
  resultSummary: document.querySelector("#resultSummary"),
  resultTitle: document.querySelector("#resultTitle"),
  sessionLabel: document.querySelector("#sessionLabel"),
  sessionHint: document.querySelector("#sessionHint"),
  toastLayer: document.querySelector("#toastLayer"),
  globalCoins: Array.from(document.querySelectorAll('[data-global-field="coins"]')),
  globalRuns: Array.from(document.querySelectorAll('[data-global-field="runs"]')),
  globalWins: Array.from(document.querySelectorAll('[data-global-field="wins"]')),
};

let progress = loadProgress();
let selectedDifficulty = normalizeDifficultyLevel(progress.settings?.difficultyLevel ?? 1);

const hudMap = new Map(Array.from(elements.hudFields, (field) => [field.dataset.field, field]));

const game = new GameRuntime({
  canvas: elements.canvas,
  callbacks: {
    onHudUpdate: renderHud,
    onLevelChoices: renderLevelChoices,
    onRunEnd: handleRunEnd,
    onOverlayChange: showOverlay,
    onSessionLabel: updateSessionLabel,
    onToast: showToast,
  },
});

bindUi();
resizeGameCanvas();
renderPersistentPanels();
renderHud({
  status: "menu",
  time: "15:00",
  level: "1",
  exp: "0 / 18",
  health: "100 / 100",
  attack: "1.00x",
  speed: "220",
  crit: "5%",
  dodge: "5%",
  armor: "0",
  cooldown: "0%",
  blink: "1 / 1",
  expPickupRange: "96",
  kills: "0",
  skills: [],
});
setActiveView("menu");
showOverlay(null);

function bindUi() {
  document.querySelector("#startRunButton").addEventListener("click", () => {
    setActiveView("game");
    showOverlay(null);
    resizeGameCanvas();
    game.startRun(progress, { difficultyLevel: selectedDifficulty });
  });

  document.querySelector("#openTalentButton").addEventListener("click", () => {
    renderTalents();
    setActiveView("menu");
    showOverlay("talentScreen");
  });

  document.querySelector("#openCodexButton").addEventListener("click", () => {
    renderCodex();
    setActiveView("menu");
    showOverlay("codexScreen");
  });

  document.querySelector("#resumeRunButton").addEventListener("click", () => {
    game.resume();
  });

  document.querySelector("#giveUpButton").addEventListener("click", () => {
    game.abandonRun();
  });

  document.querySelector("#restartRunButton").addEventListener("click", () => {
    setActiveView("game");
    showOverlay(null);
    resizeGameCanvas();
    game.startRun(progress, { difficultyLevel: selectedDifficulty });
  });

  document.querySelector("#backToMenuButton").addEventListener("click", () => {
    setActiveView("menu");
    showOverlay(null);
    updateSessionLabel("战斗准备", "点击开始进入游戏界面");
  });

  for (const button of document.querySelectorAll("[data-close-overlay]")) {
    button.addEventListener("click", () => {
      showOverlay(null);
    });
  }

  elements.difficultyInput.addEventListener("change", () => {
    updateDifficulty(elements.difficultyInput.value);
  });

  elements.difficultyInput.addEventListener("input", () => {
    updateDifficulty(elements.difficultyInput.value);
  });

  window.addEventListener("resize", resizeGameCanvas);
}

function updateDifficulty(rawValue) {
  const nextDifficulty = normalizeDifficultyLevel(rawValue);
  selectedDifficulty = nextDifficulty;
  progress = updateSettings(progress, { difficultyLevel: nextDifficulty });
  saveProgress(progress);
  renderDifficultyPanel();
}

function renderHud(snapshot) {
  elements.hudTimerText.textContent = snapshot.time === "Boss" ? "Boss 战" : `倒计时 ${snapshot.time}`;
  elements.hudHealthText.textContent = `生命 ${snapshot.health}`;
  elements.hudLevelText.textContent = `等级 Lv.${snapshot.level}`;

  for (const [key, value] of Object.entries(snapshot)) {
    if (key === "skills") {
      continue;
    }
    const field = hudMap.get(key);
    if (field) {
      field.textContent = key === "status" ? STATUS_LABELS[value] || value : value;
    }
  }

  if (snapshot.skills.length === 0) {
    elements.activeSkills.innerHTML = '<div class="skill-chip"><p>尚未进入战斗</p><small>开始一局后会显示已解锁技能与专属成长。</small></div>';
    return;
  }

  elements.activeSkills.innerHTML = snapshot.skills
    .map(
      (skill) => `
        <article class="skill-chip">
          <header>
            <strong>${skill.name}</strong>
            <span>Lv.${skill.level}</span>
          </header>
          <p>${skill.description}</p>
          <small>${skill.exclusives.length > 0 ? skill.exclusives.join(" / ") : "暂无专属成长"}</small>
        </article>
      `,
    )
    .join("");
}

function renderLevelChoices(choices) {
  elements.levelChoices.innerHTML = choices
    .map(
      (choice) => `
        <button class="choice-button" data-choice-key="${choice.key}">
          <strong>${choice.title}</strong>
          <span>${choice.description}</span>
          <small>${choice.detail}</small>
        </button>
      `,
    )
    .join("");

  for (const button of elements.levelChoices.querySelectorAll("[data-choice-key]")) {
    button.addEventListener("click", () => {
      game.chooseUpgrade(button.dataset.choiceKey);
    });
  }
}

function handleRunEnd(result) {
  progress = applyRunResult(progress, result);
  renderPersistentPanels();

  elements.resultTitle.textContent = result.victory ? "胜利" : result.abandoned ? "主动撤退" : "挑战失败";
  elements.resultSummary.innerHTML = [
    ["生存时间", formatDuration(result.survivalTime)],
    ["困难等级", `Lv.${selectedDifficulty}`],
    ["角色等级", `Lv.${result.level}`],
    ["击败怪物", `${result.kills}`],
    ["获得金币", `${result.coinsEarned}`],
  ]
    .map(
      ([label, value]) => `
        <div class="result-item">
          <span>${label}</span>
          <strong>${value}</strong>
        </div>
      `,
    )
    .join("");

  setActiveView("game");
  showOverlay("resultScreen");
  updateSessionLabel(result.victory ? "胜利结算" : "战斗结束", "结算金币已计入局外成长");
}

function showOverlay(overlayId) {
  for (const overlay of elements.overlays) {
    overlay.classList.toggle("visible", Boolean(overlayId) && overlay.id === overlayId);
  }
}

function setActiveView(viewName) {
  elements.menuView.classList.toggle("is-active", viewName === "menu");
  elements.gameView.classList.toggle("is-active", viewName === "game");
}

function updateSessionLabel(title, hint) {
  elements.sessionLabel.textContent = title;
  elements.sessionHint.textContent = hint;
}

function renderPersistentPanels() {
  for (const node of elements.globalCoins) {
    node.textContent = String(progress.meta.totalCoins);
  }
  for (const node of elements.globalRuns) {
    node.textContent = String(progress.meta.runs);
  }
  for (const node of elements.globalWins) {
    node.textContent = String(progress.meta.wins);
  }

  elements.menuSummary.innerHTML = [
    ["累计金币", `${progress.meta.totalCoins}`],
    ["历史局数", `${progress.meta.runs}`],
    ["历史胜场", `${progress.meta.wins}`],
    ["最高等级", `Lv.${progress.meta.bestLevel}`],
    ["最长生存", formatDuration(progress.meta.bestTime)],
  ]
    .map(
      ([label, value]) => `
        <div>
          <span>${label}</span>
          <strong>${value}</strong>
        </div>
      `,
    )
    .join("");

  renderDifficultyPanel();
  renderTalents();
  renderCodex();
}

function renderDifficultyPanel() {
  const profile = getDifficultyProfile(selectedDifficulty);
  elements.difficultyInput.value = String(selectedDifficulty);
  elements.difficultyBadge.textContent = `Lv.${selectedDifficulty}`;
  elements.difficultySummary.textContent = getDifficultySummary(profile.level);
}

function renderTalents() {
  elements.talentList.innerHTML = TALENT_LIBRARY.map((talent) => {
    const currentLevel = progress.talents[talent.id] || 0;
    const canUpgrade = currentLevel < talent.maxLevel;
    const cost = getTalentCost(talent, currentLevel);
    const affordable = progress.meta.totalCoins >= cost;
    return `
      <article class="talent-card">
        <div>
          <strong>${talent.name}</strong>
          <p class="card-note">${talent.description}</p>
        </div>
        <footer>
          <span>Lv.${currentLevel} / ${talent.maxLevel}</span>
          <button class="talent-button" data-talent-id="${talent.id}" ${!canUpgrade || !affordable ? "disabled" : ""}>
            ${canUpgrade ? `升级 ${cost}` : "已满级"}
          </button>
        </footer>
      </article>
    `;
  }).join("");

  for (const button of elements.talentList.querySelectorAll("[data-talent-id]")) {
    button.addEventListener("click", () => {
      const talent = TALENT_LIBRARY.find((item) => item.id === button.dataset.talentId);
      const currentLevel = progress.talents[talent.id] || 0;
      const cost = getTalentCost(talent, currentLevel);
      if (progress.meta.totalCoins < cost || currentLevel >= talent.maxLevel) {
        return;
      }
      progress.meta.totalCoins -= cost;
      progress = purchaseTalent(progress, talent, currentLevel);
      saveProgress(progress);
      renderPersistentPanels();
      showToast(`天赋升级：${talent.name}`);
    });
  }

  elements.skillUnlockShop.innerHTML = SKILL_LIBRARY.filter((skill) => !skill.startsUnlocked)
    .map((skill) => {
      const unlocked = progress.unlocks.skills[skill.id];
      const starterExclusive = getExclusiveDefinition(skill.starterExclusiveId);
      const affordable = progress.meta.totalCoins >= skill.unlockCost;
      return `
        <article class="shop-card ${unlocked ? "is-unlocked" : ""}">
          <div>
            <strong>${skill.name}</strong>
            <p class="card-note">${skill.description}</p>
            <p class="card-note">购买附带基础专属：${starterExclusive?.name || "无"}</p>
          </div>
          <footer>
            <span>${unlocked ? "已解锁" : `价格 ${skill.unlockCost}`}</span>
            <button class="talent-button" data-skill-purchase="${skill.id}" ${unlocked || !affordable ? "disabled" : ""}>
              ${unlocked ? "已拥有" : `购买 ${skill.unlockCost}`}
            </button>
          </footer>
        </article>
      `;
    })
    .join("");

  for (const button of elements.skillUnlockShop.querySelectorAll("[data-skill-purchase]")) {
    button.addEventListener("click", () => {
      const skill = SKILL_LIBRARY.find((item) => item.id === button.dataset.skillPurchase);
      if (!skill || progress.unlocks.skills[skill.id] || progress.meta.totalCoins < skill.unlockCost) {
        return;
      }
      progress.meta.totalCoins -= skill.unlockCost;
      progress = purchaseSkillUnlock(progress, skill);
      saveProgress(progress);
      renderPersistentPanels();
      showToast(`技能解锁：${skill.name}`);
    });
  }

  const exclusiveEntries = SKILL_LIBRARY.flatMap((skill) =>
    (skill.exclusiveUpgrades || []).map((exclusive) => ({
      skill,
      exclusive,
    })),
  );

  elements.exclusiveUnlockShop.innerHTML = exclusiveEntries
    .map(({ skill, exclusive }) => {
      const unlocked = progress.unlocks.exclusives[exclusive.id];
      const ownerUnlocked = progress.unlocks.skills[skill.id] || skill.startsUnlocked;
      const prerequisiteUnlocked = !exclusive.metaPrerequisite || progress.unlocks.exclusives[exclusive.metaPrerequisite];
      const affordable = progress.meta.totalCoins >= (exclusive.unlockCost || 0);
      const lockedReason = !ownerUnlocked
        ? `需先解锁 ${skill.name}`
        : !prerequisiteUnlocked
          ? `需先解锁 ${getExclusiveDefinition(exclusive.metaPrerequisite)?.name}`
          : `价格 ${exclusive.unlockCost || 0}`;

      return `
        <article class="shop-card ${unlocked ? "is-unlocked" : ""}">
          <div>
            <strong>${skill.name} · ${exclusive.name}</strong>
            <p class="card-note">${exclusive.description}</p>
          </div>
          <footer>
            <span>${unlocked ? "已解锁" : lockedReason}</span>
            <button class="talent-button" data-exclusive-purchase="${exclusive.id}" ${unlocked || !ownerUnlocked || !prerequisiteUnlocked || !affordable ? "disabled" : ""}>
              ${unlocked ? "已拥有" : `购买 ${exclusive.unlockCost || 0}`}
            </button>
          </footer>
        </article>
      `;
    })
    .join("");

  for (const button of elements.exclusiveUnlockShop.querySelectorAll("[data-exclusive-purchase]")) {
    button.addEventListener("click", () => {
      const exclusive = getExclusiveDefinition(button.dataset.exclusivePurchase);
      const ownerSkill = getSkillForExclusive(button.dataset.exclusivePurchase);
      if (!exclusive || !ownerSkill) {
        return;
      }
      const ownerUnlocked = progress.unlocks.skills[ownerSkill.id] || ownerSkill.startsUnlocked;
      const prerequisiteUnlocked = !exclusive.metaPrerequisite || progress.unlocks.exclusives[exclusive.metaPrerequisite];
      const cost = exclusive.unlockCost || 0;
      if (!ownerUnlocked || !prerequisiteUnlocked || progress.unlocks.exclusives[exclusive.id] || progress.meta.totalCoins < cost) {
        return;
      }
      progress.meta.totalCoins -= cost;
      progress = purchaseExclusiveUnlock(progress, exclusive.id);
      saveProgress(progress);
      renderPersistentPanels();
      showToast(`专属解锁：${exclusive.name}`);
    });
  }
}

function renderCodex() {
  elements.codexMonsters.innerHTML = MONSTER_LIBRARY.map((monster) => {
    const discovered = progress.codex.monsters.includes(monster.id);
    return createCodexCard(monster.name, discovered ? monster.description : "尚未遭遇，等待在战斗中发现。", discovered ? "已记录" : "未记录", !discovered);
  }).join("");

  elements.codexSkills.innerHTML = SKILL_LIBRARY.map((skill) => {
    const purchased = progress.unlocks.skills[skill.id] || skill.startsUnlocked;
    const discovered = progress.codex.skills.includes(skill.id) || purchased;
    const exclusiveMarkup = (skill.exclusiveUpgrades || [])
      .map((exclusive) => {
        const unlocked = progress.unlocks.exclusives[exclusive.id];
        const enabled = !progress.unlocks.disabledExclusives[exclusive.id];
        return `
          <div class="exclusive-row ${unlocked ? "" : "locked"}">
            <div class="exclusive-copy">
              <strong>${exclusive.name}</strong>
              <span class="card-note">${exclusive.description}</span>
            </div>
            ${unlocked ? `<button class="mini-button" data-exclusive-toggle="${exclusive.id}">${enabled ? "禁用" : "启用"}</button>` : '<button class="mini-button is-disabled" disabled>未解锁</button>'}
          </div>
        `;
      })
      .join("");

    return `
      <article class="codex-card codex-skill-card ${purchased ? "" : "locked"}">
        <div>
          <strong>${skill.name}</strong>
          <p class="card-note">${discovered ? skill.description : "尚未进入战斗发现。"}</p>
        </div>
        <footer>
          <span class="codex-meta">${purchased ? "已购买" : skill.startsUnlocked ? "初始技能" : "未购买"}</span>
        </footer>
        <div class="exclusive-list">${exclusiveMarkup}</div>
      </article>
    `;
  }).join("");

  for (const button of elements.codexSkills.querySelectorAll("[data-exclusive-toggle]")) {
    button.addEventListener("click", () => {
      const exclusiveId = button.dataset.exclusiveToggle;
      const enabled = progress.unlocks.disabledExclusives[exclusiveId];
      progress = setExclusiveEnabled(progress, exclusiveId, enabled);
      saveProgress(progress);
      renderCodex();
      showToast(`${enabled ? "启用" : "禁用"}专属：${getExclusiveDefinition(exclusiveId)?.name || exclusiveId}`);
    });
  }

  elements.codexBoosts.innerHTML = BOOST_CODEX.map((boost) => createCodexCard(boost.name, boost.description, boost.type, false)).join("");
}

function createCodexCard(title, description, meta, locked) {
  return `
    <article class="codex-card ${locked ? "locked" : ""}">
      <strong>${title}</strong>
      <p class="card-note">${description}</p>
      <footer>
        <span class="codex-meta">${meta}</span>
      </footer>
    </article>
  `;
}

function showToast(message) {
  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = message;
  elements.toastLayer.appendChild(node);
  window.setTimeout(() => node.remove(), 2200);
}

function resizeGameCanvas() {
  elements.canvas.width = Math.max(window.innerWidth, 960);
  elements.canvas.height = Math.max(window.innerHeight, 540);
  game.renderIdleFrame();
}