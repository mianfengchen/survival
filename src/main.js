import {
  BOOST_CODEX,
  MONSTER_LIBRARY,
  SKILL_LIBRARY,
  TALENT_LIBRARY,
  formatDuration,
  getExclusiveDefinition,
  getSkillDefinition,
  getSkillForExclusive,
  getTalentCost,
} from "./data.js";
import {
  CHARACTER_LIBRARY,
  GARDEN_REGIONS,
  LANDSCAPE_LIBRARY,
  WAR_DIFFICULTIES,
  getCharacterDefinition,
  getLandscapeDefinition,
  getRegionDefinition,
  getWarDifficulty,
  isRegionAdjacentToLiberated,
} from "./garden-data.js";
import { GameRuntime } from "./game.js";
import {
  applyRunResult,
  loadProgress,
  purchaseExclusiveUnlock,
  purchaseTalent,
  saveProgress,
  setExclusiveEnabled,
  unlockRegionReward,
  updateWorldState,
} from "./storage.js";

const INITIAL_REGION_ID = GARDEN_REGIONS[0].id;

const STATUS_LABELS = {
  menu: "待机",
  running: "进行中",
  paused: "已暂停",
  levelup: "升级中",
  ended: "已结束",
};

const REGION_MAP_COLUMNS = 6;
const REGION_TILE_WIDTH = 102;
const REGION_TILE_HEIGHT = 118;
const REGION_TILE_ROW_STEP = 88;
const REGION_TILE_STAGGER_OFFSET = 51;
const REGION_TILE_PADDING_X = 24;
const REGION_TILE_PADDING_Y = 18;

function getRegionMapLayout(index) {
  const row = Math.floor(index / REGION_MAP_COLUMNS);
  const column = index % REGION_MAP_COLUMNS;
  const x = REGION_TILE_PADDING_X + column * REGION_TILE_WIDTH + (row % 2) * REGION_TILE_STAGGER_OFFSET;
  const y = REGION_TILE_PADDING_Y + row * REGION_TILE_ROW_STEP;
  return {
    x,
    y,
    width: REGION_TILE_WIDTH,
    height: REGION_TILE_HEIGHT,
  };
}

function getRegionTileLabel(region) {
  return region.name.replace(/\s+\d+$/, "");
}

const elements = {
  menuView: document.querySelector("#menuView"),
  gameView: document.querySelector("#gameView"),
  canvas: document.querySelector("#gameCanvas"),
  overlays: Array.from(document.querySelectorAll(".screen-overlay")),
  openWarButton: document.querySelector("#openWarButton"),
  openLabButton: document.querySelector("#openLabButton"),
  openLibraryButton: document.querySelector("#openLibraryButton"),
  openBugPlanetButton: document.querySelector("#openBugPlanetButton"),
  openWarPrepButton: document.querySelector("#openWarPrepButton"),
  confirmWarButton: document.querySelector("#confirmWarButton"),
  storyEyebrow: document.querySelector("#storyEyebrow"),
  storyTitle: document.querySelector("#storyTitle"),
  storyBody: document.querySelector("#storyBody"),
  storyPrimaryButton: document.querySelector("#storyPrimaryButton"),
  storySecondaryButton: document.querySelector("#storySecondaryButton"),
  regionGrid: document.querySelector("#regionGrid"),
  regionSummary: document.querySelector("#regionSummary"),
  prepRegionName: document.querySelector("#prepRegionName"),
  prepRegionMeta: document.querySelector("#prepRegionMeta"),
  prepRegionDescription: document.querySelector("#prepRegionDescription"),
  prepSelectedDifficulty: document.querySelector("#prepSelectedDifficulty"),
  prepSelectedCharacter: document.querySelector("#prepSelectedCharacter"),
  prepRuleText: document.querySelector("#prepRuleText"),
  warDifficultyOptions: document.querySelector("#warDifficultyOptions"),
  warCharacterOptions: document.querySelector("#warCharacterOptions"),
  liberationBadge: document.querySelector("#liberationBadge"),
  characterBadge: document.querySelector("#characterBadge"),
  prepDifficultyBadge: document.querySelector("#prepDifficultyBadge"),
  mainTagline: document.querySelector("#mainTagline"),
  worldSummaryText: document.querySelector("#worldSummaryText"),
  characterRosterPreview: document.querySelector("#characterRosterPreview"),
  prepSummary: document.querySelector("#prepSummary"),
  talentList: document.querySelector("#talentList"),
  skillUnlockShop: document.querySelector("#skillUnlockShop"),
  exclusiveUnlockShop: document.querySelector("#exclusiveUnlockShop"),
  libraryCharacters: document.querySelector("#libraryCharacters"),
  codexMonsters: document.querySelector("#codexMonsters"),
  codexSkills: document.querySelector("#codexSkills"),
  libraryRegions: document.querySelector("#libraryRegions"),
  libraryLandscapes: document.querySelector("#libraryLandscapes"),
  codexBoosts: document.querySelector("#codexBoosts"),
  hudFields: document.querySelectorAll("#hudStats [data-field]"),
  hudTimerText: document.querySelector("#hudTimerText"),
  hudHealthText: document.querySelector("#hudHealthText"),
  hudLevelText: document.querySelector("#hudLevelText"),
  speedToggleButton: document.querySelector("#speedToggleButton"),
  activeSkills: document.querySelector("#activeSkills"),
  levelChoices: document.querySelector("#levelChoices"),
  menuSummary: document.querySelector("#menuSummary"),
  resultSummary: document.querySelector("#resultSummary"),
  resultTitle: document.querySelector("#resultTitle"),
  restartRunButton: document.querySelector("#restartRunButton"),
  backToMenuButton: document.querySelector("#backToMenuButton"),
  resumeRunButton: document.querySelector("#resumeRunButton"),
  giveUpButton: document.querySelector("#giveUpButton"),
  sessionLabel: document.querySelector("#sessionLabel"),
  sessionHint: document.querySelector("#sessionHint"),
  toastLayer: document.querySelector("#toastLayer"),
  globalCoins: Array.from(document.querySelectorAll('[data-global-field="coins"]')),
  globalRuns: Array.from(document.querySelectorAll('[data-global-field="runs"]')),
  globalWins: Array.from(document.querySelectorAll('[data-global-field="wins"]')),
};

let progress = loadProgress();
let selectedRegionId = progress.world?.selectedRegionId || progress.world?.pendingRegionId || INITIAL_REGION_ID;
let selectedCharacterId = progress.world?.selectedCharacterId || "spriteScout";
let selectedWarDifficultyId = progress.world?.selectedWarDifficultyId || "normal";
let activeRunConfig = null;
let storyPrimaryHandler = null;
let storySecondaryHandler = null;

syncCampaignSelections();

const hudMap = new Map(Array.from(elements.hudFields, (field) => [field.dataset.field, field]));

const game = new GameRuntime({
  canvas: elements.canvas,
  callbacks: {
    onHudUpdate: renderHud,
    onLevelChoices: renderLevelChoices,
    onRunEnd: handleRunEnd,
    onOverlayChange: showOverlay,
    onSessionLabel: updateSessionLabel,
    onSpeedChange: renderSpeedButton,
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
renderSpeedButton(1);

if (!progress.world.tutorialCompleted) {
  openIntroStory();
} else {
  updateSessionLabel("花园待命", "选择一个入口，继续推进花园解放战线。");
}

function bindUi() {
  elements.openWarButton.addEventListener("click", () => {
    if (!progress.world.tutorialCompleted) {
      openIntroStory();
      return;
    }
    renderGardenMap();
    showOverlay("gardenMapScreen");
  });

  elements.openLabButton.addEventListener("click", () => {
    renderLab();
    showOverlay("labScreen");
  });

  elements.openLibraryButton.addEventListener("click", () => {
    renderLibrary();
    showOverlay("libraryScreen");
  });

  elements.openBugPlanetButton.addEventListener("click", () => {
    showOverlay("bugPlanetScreen");
  });

  elements.openWarPrepButton.addEventListener("click", () => {
    const region = getRegionDefinition(selectedRegionId);
    if (!region || !canDeployToRegion(region)) {
      return;
    }
    renderWarPrep();
    showOverlay("warPrepScreen");
  });

  elements.confirmWarButton.addEventListener("click", () => {
    startSelectedWar();
  });

  elements.storyPrimaryButton.addEventListener("click", () => {
    storyPrimaryHandler?.();
  });

  elements.storySecondaryButton.addEventListener("click", () => {
    storySecondaryHandler?.();
  });

  for (const button of document.querySelectorAll("[data-close-overlay]")) {
    button.addEventListener("click", () => {
      showOverlay(null);
    });
  }

  elements.resumeRunButton.addEventListener("click", () => {
    game.resume();
  });

  elements.speedToggleButton.addEventListener("click", () => {
    game.toggleGameSpeed();
  });

  elements.giveUpButton.addEventListener("click", () => {
    game.abandonRun();
  });

  elements.restartRunButton.addEventListener("click", () => {
    if (!activeRunConfig) {
      return;
    }
    startRunConfig(activeRunConfig);
  });

  elements.backToMenuButton.addEventListener("click", () => {
    setActiveView("menu");
    showOverlay(null);
    updateSessionLabel("花园待命", "选择一个入口，继续推进花园解放战线。");
  });

  window.addEventListener("resize", resizeGameCanvas);
}

function syncCampaignSelections() {
  const unlockedCharacterIds = Array.isArray(progress.world?.unlockedCharacters) && progress.world.unlockedCharacters.length > 0
    ? progress.world.unlockedCharacters
    : ["spriteScout"];

  const preferredCharacterId = unlockedCharacterIds.includes(progress.world?.selectedCharacterId)
    ? progress.world.selectedCharacterId
    : unlockedCharacterIds[0];
  const preferredRegionId = getRegionDefinition(progress.world?.selectedRegionId)
    ? progress.world.selectedRegionId
    : getRegionDefinition(progress.world?.pendingRegionId)
      ? progress.world.pendingRegionId
      : INITIAL_REGION_ID;

  selectedCharacterId = preferredCharacterId;
  selectedRegionId = preferredRegionId;
  selectedWarDifficultyId = getWarDifficulty(progress.world?.selectedWarDifficultyId).id;
}

function persistWorldSelection(partialWorld) {
  progress = updateWorldState(progress, partialWorld);
  saveProgress(progress);
  syncCampaignSelections();
  renderPersistentPanels();
}

function getUnlockedCharacters() {
  const unlocked = progress.world.unlockedCharacters
    .map((characterId) => getCharacterDefinition(characterId))
    .filter(Boolean);
  return unlocked.length > 0 ? unlocked : [getCharacterDefinition("spriteScout")].filter(Boolean);
}

function getCharacterRuleDescription(character) {
  if (!character) {
    return "暂无可用角色。";
  }
  if (character.battleRule === "allUnlockedSkills") {
    return "小精灵可在战斗中解锁所有已获得角色的技能。";
  }
  return `${character.name} 只能使用自己的专属技能 ${getSkillDefinition(character.skillId)?.name || "未知技能"}。`;
}

function getCharacterAllowedSkillIds(character) {
  if (!character) {
    return [];
  }

  if (character.battleRule === "allUnlockedSkills") {
    return getUnlockedCharacters()
      .map((item) => item.skillId)
      .filter((skillId, index, array) => array.indexOf(skillId) === index && getSkillDefinition(skillId));
  }

  return getSkillDefinition(character.skillId) ? [character.skillId] : [];
}

function getRewardMeta(region) {
  if (!region?.reward) {
    return "无奖励";
  }

  if (region.reward.type === "character") {
    const character = getCharacterDefinition(region.reward.targetId);
    return `解锁角色：${character?.name || region.reward.targetId}`;
  }

  const landscape = getLandscapeDefinition(region.reward.targetId);
  return `解锁景观：${landscape?.name || region.reward.targetId}`;
}

function isLiberated(regionId) {
  return progress.world.liberatedRegions.includes(regionId);
}

function isFrontier(regionId) {
  return !isLiberated(regionId) && isRegionAdjacentToLiberated(regionId, progress.world.liberatedRegions);
}

function canDeployToRegion(region) {
  return Boolean(region) && (isLiberated(region.id) || isFrontier(region.id));
}

function renderSpeedButton(multiplier) {
  elements.speedToggleButton.textContent = `速度 ${multiplier}x`;
  elements.speedToggleButton.dataset.mode = String(multiplier);
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
    elements.activeSkills.innerHTML = '<div class="skill-chip"><p>尚未进入战斗</p><small>开始保卫战后会在这里显示当前技能与专属成长。</small></div>';
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

function renderPersistentPanels() {
  syncCampaignSelections();

  const liberatedCount = progress.world.liberatedRegions.length;
  const frontierCount = GARDEN_REGIONS.filter((region) => isFrontier(region.id)).length;
  const unlockedCharacters = getUnlockedCharacters();
  const selectedRegion = getRegionDefinition(selectedRegionId) || GARDEN_REGIONS[0];
  const selectedCharacter = getCharacterDefinition(selectedCharacterId) || unlockedCharacters[0];
  const selectedDifficulty = getWarDifficulty(selectedWarDifficultyId);

  for (const node of elements.globalCoins) {
    node.textContent = String(progress.meta.totalCoins);
  }
  for (const node of elements.globalRuns) {
    node.textContent = String(progress.meta.runs);
  }
  for (const node of elements.globalWins) {
    node.textContent = String(progress.meta.wins);
  }

  elements.liberationBadge.textContent = `${liberatedCount} / ${GARDEN_REGIONS.length}`;
  elements.characterBadge.textContent = String(unlockedCharacters.length);
  elements.prepDifficultyBadge.textContent = selectedDifficulty.name;
  elements.mainTagline.textContent = progress.world.tutorialCompleted
    ? `花园仍有 ${GARDEN_REGIONS.length - liberatedCount} 片区域被害虫控制，你的下一次部署将从 ${selectedRegion.name} 开始。`
    : "小精灵刚刚苏醒，必须先守住最后的花心。";
  elements.worldSummaryText.textContent = progress.world.tutorialCompleted
    ? `当前前线区域 ${frontierCount} 处，已解锁角色 ${unlockedCharacters.length} 名，已恢复景观 ${progress.world.unlockedLandscapes.length} 处。`
    : "先完成三分钟首战，再从主菜单自由切换战争、研究所、图书馆与害虫星球入口。";

  elements.menuSummary.innerHTML = [
    ["已解放区域", `${liberatedCount} / ${GARDEN_REGIONS.length}`],
    ["前线区域", `${frontierCount}`],
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

  elements.characterRosterPreview.innerHTML = unlockedCharacters
    .slice(0, 6)
    .map(
      (character) => `
        <article class="roster-preview-item">
          <strong>${character.name}</strong>
          <span class="card-note">${character.title}</span>
          <small>${getSkillDefinition(character.skillId)?.name || "未知技能"}</small>
        </article>
      `,
    )
    .join("");

  elements.prepSummary.innerHTML = [
    ["目标区域", selectedRegion.name],
    ["出战角色", selectedCharacter?.name || "小精灵"],
    ["战役难度", selectedDifficulty.name],
    ["区域奖励", getRewardMeta(selectedRegion)],
  ]
    .map(
      ([label, value]) => `
        <article class="map-summary-card">
          <strong>${label}</strong>
          <span class="card-note">${value}</span>
        </article>
      `,
    )
    .join("");

  renderGardenMap();
  renderLab();
  renderLibrary();
}

function renderGardenMap() {
  const selectedRegion = getRegionDefinition(selectedRegionId) || GARDEN_REGIONS[0];

  elements.regionGrid.innerHTML = `
    <div class="region-board">
      ${GARDEN_REGIONS.map((region, index) => {
        const layout = getRegionMapLayout(index);
        const liberated = isLiberated(region.id);
        const frontier = isFrontier(region.id);
        const locked = !liberated && !frontier;
        return `
      <button
        class="region-tile ${liberated ? "is-liberated" : frontier ? "is-frontier" : "is-locked"} ${selectedRegion.id === region.id ? "is-selected" : ""}"
        data-region-id="${region.id}"
        style="--tile-x:${layout.x}px; --tile-y:${layout.y}px; --tile-width:${layout.width}px; --tile-height:${layout.height}px;"
        ${locked ? "disabled" : ""}
      >
        <span class="region-tile__terrain"></span>
        <strong>${getRegionTileLabel(region)}</strong>
      </button>
    `;
      }).join("")}
    </div>
  `;

  for (const button of elements.regionGrid.querySelectorAll("[data-region-id]")) {
    button.addEventListener("click", () => {
      persistWorldSelection({
        selectedRegionId: button.dataset.regionId,
        pendingRegionId: button.dataset.regionId,
      });
      renderGardenMap();
    });
  }

  renderSelectedRegionSummary(selectedRegion);
}

function renderSelectedRegionSummary(region) {
  const boss = MONSTER_LIBRARY.find((monster) => monster.id === region.bossId);
  const canDeploy = canDeployToRegion(region);
  const statusText = isLiberated(region.id) ? "已解放，可重复部署" : isFrontier(region.id) ? "与已解放区域相邻，可发起新的解放战" : "尚未与解放区域相邻";

  elements.regionSummary.innerHTML = `
    <article class="map-summary-card">
      <strong>${getRegionTileLabel(region)}</strong>
      <span class="card-note">${region.description}</span>
    </article>
    <article class="map-summary-card">
      <strong>镇守目标</strong>
      <span class="card-note">${boss?.name || region.bossId} · Boss 阶位 ${region.bossTier}</span>
    </article>
    <article class="map-summary-card">
      <strong>区域奖励</strong>
      <span class="card-note">${getRewardMeta(region)}</span>
    </article>
    <article class="map-summary-card">
      <strong>状态</strong>
      <span class="card-note">${statusText}</span>
    </article>
  `;

  elements.openWarPrepButton.disabled = !canDeploy;
  elements.openWarPrepButton.textContent = canDeploy ? (isLiberated(region.id) ? "重新部署" : "发起战争") : "区域未连通";
}

function renderWarPrep() {
  const region = getRegionDefinition(selectedRegionId) || GARDEN_REGIONS[0];
  const selectedDifficulty = getWarDifficulty(selectedWarDifficultyId);
  const unlockedCharacters = getUnlockedCharacters();
  const selectedCharacter = getCharacterDefinition(selectedCharacterId) || unlockedCharacters[0];
  const boss = MONSTER_LIBRARY.find((monster) => monster.id === region.bossId);

  elements.prepRegionName.textContent = region.name;
  elements.prepRegionMeta.textContent = `镇守 Boss：${boss?.name || region.bossId} · 战斗时长 ${Math.round(region.durationSeconds / 60)} 分钟 · ${getRewardMeta(region)}`;
  elements.prepRegionDescription.textContent = region.description;
  elements.prepSelectedDifficulty.textContent = selectedDifficulty.name;
  elements.prepSelectedCharacter.textContent = selectedCharacter?.name || "小精灵";
  elements.prepRuleText.textContent = getCharacterRuleDescription(selectedCharacter);
  elements.confirmWarButton.disabled = !canDeployToRegion(region);

  elements.warDifficultyOptions.innerHTML = WAR_DIFFICULTIES.map((difficulty) => `
    <button class="prep-option ${difficulty.id === selectedWarDifficultyId ? "is-selected" : ""}" data-war-difficulty="${difficulty.id}">
      <strong>${difficulty.name}</strong>
      <span class="card-note">${difficulty.description}</span>
      <small>敌潮 ${difficulty.enemyScale.toFixed(2)}x · 奖励 ${difficulty.energyScale.toFixed(2)}x</small>
    </button>
  `).join("");

  for (const button of elements.warDifficultyOptions.querySelectorAll("[data-war-difficulty]")) {
    button.addEventListener("click", () => {
      persistWorldSelection({ selectedWarDifficultyId: button.dataset.warDifficulty });
      renderWarPrep();
    });
  }

  elements.warCharacterOptions.innerHTML = unlockedCharacters.map((character) => {
    const skill = getSkillDefinition(character.skillId);
    return `
      <button class="prep-option ${character.id === selectedCharacterId ? "is-selected" : ""}" data-character-id="${character.id}">
        <strong>${character.name}</strong>
        <span class="card-note">${character.description}</span>
        <small>${skill?.name || "未知技能"} · ${character.battleRule === "allUnlockedSkills" ? "可切换全部已解锁角色技能" : "只能使用自身专属技能"}</small>
      </button>
    `;
  }).join("");

  for (const button of elements.warCharacterOptions.querySelectorAll("[data-character-id]")) {
    button.addEventListener("click", () => {
      persistWorldSelection({ selectedCharacterId: button.dataset.characterId });
      renderWarPrep();
    });
  }
}

function renderLab() {
  const unlockedCharacters = getUnlockedCharacters();
  const unlockedSkillIds = new Set(unlockedCharacters.map((character) => character.skillId));

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
      if (!talent) {
        return;
      }
      const currentLevel = progress.talents[talent.id] || 0;
      const cost = getTalentCost(talent, currentLevel);
      if (progress.meta.totalCoins < cost || currentLevel >= talent.maxLevel) {
        return;
      }
      progress.meta.totalCoins -= cost;
      progress = purchaseTalent(progress, talent, currentLevel);
      saveProgress(progress);
      renderPersistentPanels();
      showToast(`基础研究提升：${talent.name}`);
    });
  }

  elements.skillUnlockShop.innerHTML = unlockedCharacters
    .map((character) => {
      const skill = getSkillDefinition(character.skillId);
      return `
        <article class="shop-card">
          <div>
            <strong>${character.name}</strong>
            <p class="card-note">${character.description}</p>
            <p class="card-note">专属技能：${skill?.name || "未知技能"}</p>
          </div>
          <footer>
            <span>${character.battleRule === "allUnlockedSkills" ? "全技能调度型角色" : "专属技能守园者"}</span>
          </footer>
        </article>
      `;
    })
    .join("");

  const exclusiveEntries = SKILL_LIBRARY.flatMap((skill) =>
    (skill.exclusiveUpgrades || []).map((exclusive) => ({ skill, exclusive })),
  ).filter(({ skill }) => unlockedSkillIds.has(skill.id));

  elements.exclusiveUnlockShop.innerHTML = exclusiveEntries
    .map(({ skill, exclusive }) => {
      const unlocked = progress.unlocks.exclusives[exclusive.id];
      const prerequisiteUnlocked = !exclusive.metaPrerequisite || progress.unlocks.exclusives[exclusive.metaPrerequisite];
      const affordable = progress.meta.totalCoins >= (exclusive.unlockCost || 0);
      const lockedReason = !prerequisiteUnlocked
        ? `需先完成 ${getExclusiveDefinition(exclusive.metaPrerequisite)?.name}`
        : `价格 ${exclusive.unlockCost || 0}`;

      return `
        <article class="shop-card ${unlocked ? "is-unlocked" : ""}">
          <div>
            <strong>${skill.name} · ${exclusive.name}</strong>
            <p class="card-note">${exclusive.description}</p>
          </div>
          <footer>
            <span>${unlocked ? "已完成" : lockedReason}</span>
            <button class="talent-button" data-exclusive-purchase="${exclusive.id}" ${unlocked || !prerequisiteUnlocked || !affordable ? "disabled" : ""}>
              ${unlocked ? "已研究" : `研究 ${exclusive.unlockCost || 0}`}
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
      const prerequisiteUnlocked = !exclusive.metaPrerequisite || progress.unlocks.exclusives[exclusive.metaPrerequisite];
      const cost = exclusive.unlockCost || 0;
      if (!prerequisiteUnlocked || progress.unlocks.exclusives[exclusive.id] || progress.meta.totalCoins < cost) {
        return;
      }
      progress.meta.totalCoins -= cost;
      progress = purchaseExclusiveUnlock(progress, exclusive.id);
      saveProgress(progress);
      renderPersistentPanels();
      showToast(`完成研究：${exclusive.name}`);
    });
  }
}

function renderLibrary() {
  const unlockedSkillIds = new Set(getUnlockedCharacters().map((character) => character.skillId));

  elements.libraryCharacters.innerHTML = CHARACTER_LIBRARY.map((character) => {
    const unlocked = progress.world.unlockedCharacters.includes(character.id);
    return createCodexCard(
      character.name,
      unlocked ? character.description : "尚未在战线上与这位守园者建立联络。",
      unlocked ? getSkillDefinition(character.skillId)?.name || "已记录" : "未解锁",
      !unlocked,
    );
  }).join("");

  elements.codexMonsters.innerHTML = MONSTER_LIBRARY.map((monster) => {
    const discovered = progress.codex.monsters.includes(monster.id);
    return createCodexCard(monster.name, discovered ? monster.description : "尚未遭遇，等待在战斗中发现。", discovered ? "已记录" : "未记录", !discovered);
  }).join("");

  elements.codexSkills.innerHTML = SKILL_LIBRARY.map((skill) => {
    const available = unlockedSkillIds.has(skill.id) || skill.startsUnlocked;
    const discovered = progress.codex.skills.includes(skill.id) || available;
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
            ${unlocked ? `<button class="mini-button" data-exclusive-toggle="${exclusive.id}">${enabled ? "禁用" : "启用"}</button>` : '<button class="mini-button is-disabled" disabled>未研究</button>'}
          </div>
        `;
      })
      .join("");

    return `
      <article class="codex-card codex-skill-card ${available ? "" : "locked"}">
        <div>
          <strong>${skill.name}</strong>
          <p class="card-note">${discovered ? skill.description : "尚未通过角色或战斗获得这项技能的记录。"}</p>
        </div>
        <footer>
          <span class="codex-meta">${available ? "角色可用" : skill.startsUnlocked ? "初始数据" : "未解锁"}</span>
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
      renderLibrary();
      showToast(`${enabled ? "启用" : "禁用"}专属：${getExclusiveDefinition(exclusiveId)?.name || exclusiveId}`);
    });
  }

  elements.libraryRegions.innerHTML = GARDEN_REGIONS.map((region) => {
    const known = isLiberated(region.id) || isFrontier(region.id);
    return createCodexCard(region.name, known ? region.description : "该区域仍被迷雾遮蔽，需先从相邻区域推进。", getRewardMeta(region), !known);
  }).join("");

  elements.libraryLandscapes.innerHTML = LANDSCAPE_LIBRARY.map((landscape) => {
    const unlocked = progress.world.unlockedLandscapes.includes(landscape.id);
    return createCodexCard(landscape.name, unlocked ? landscape.description : "尚未恢复该景观。", unlocked ? landscape.bonusText : "未恢复", !unlocked);
  }).join("");

  elements.codexBoosts.innerHTML = BOOST_CODEX.map((boost) => createCodexCard(boost.name, boost.description, boost.type, false)).join("");
}

function openIntroStory() {
  const introSeen = progress.world.introSeen;
  openStoryScene({
    eyebrow: introSeen ? "First Defense" : "Prologue",
    title: introSeen ? "花园仍在等待第一场胜利" : "花园的最后一夜",
    paragraphs: introSeen
      ? [
          "外星害虫已经撕开了最后一片护壁，花心区域随时会被吞没。",
          "小精灵仍旧是第一位可出战的守园者。守住三分钟，击退精英害虫，主菜单才会完全开放。",
        ]
      : [
          "平静的夜里，来自虫星的陨群穿过云层，把 36 片花园区域逐一污染。花朵、植物与益虫守卫先后失联，只剩最中心的花心还在发光。",
          "濒临枯竭的花心唤醒了最后一只小精灵。它在风中第一次听见花园的语言，并以风元素凝成灵箭，准备顶住首轮虫潮。",
          "接下来是一场三分钟的新手保卫战。失败时花园会被攻陷，胜利后才会开启完整的花园战争主菜单。",
        ],
    primaryLabel: introSeen ? "继续首战" : "进入首场保卫战",
    primaryAction: () => {
      progress = updateWorldState(progress, {
        introSeen: true,
        selectedRegionId: INITIAL_REGION_ID,
        pendingRegionId: INITIAL_REGION_ID,
        selectedCharacterId: "spriteScout",
        selectedWarDifficultyId: "normal",
      });
      saveProgress(progress);
      syncCampaignSelections();
      renderPersistentPanels();
      startTutorialRun();
    },
    secondaryLabel: progress.world.tutorialCompleted ? "返回主菜单" : null,
    secondaryAction: progress.world.tutorialCompleted ? () => showOverlay(null) : null,
  });
}

function openStoryScene({ eyebrow, title, paragraphs, primaryLabel, primaryAction, secondaryLabel, secondaryAction }) {
  setActiveView("menu");
  elements.storyEyebrow.textContent = eyebrow;
  elements.storyTitle.textContent = title;
  elements.storyBody.innerHTML = paragraphs.map((text) => `<p>${text}</p>`).join("");
  elements.storyPrimaryButton.textContent = primaryLabel;
  elements.storySecondaryButton.textContent = secondaryLabel || "返回";
  elements.storySecondaryButton.hidden = !secondaryLabel;
  storyPrimaryHandler = primaryAction || null;
  storySecondaryHandler = secondaryAction || null;
  showOverlay("storyScreen");
}

function buildRunConfig(regionId, characterId, difficultyId, tutorial = false) {
  const region = getRegionDefinition(regionId) || GARDEN_REGIONS[0];
  const character = getCharacterDefinition(characterId) || getCharacterDefinition("spriteScout");
  const difficulty = getWarDifficulty(difficultyId);
  const allowedSkillIds = getCharacterAllowedSkillIds(character);

  return {
    region,
    character,
    difficulty,
    options: {
      difficultyLevel: region.bossTier,
      bossId: region.bossId,
      roundDurationSeconds: region.durationSeconds,
      initialSkillId: character.skillId,
      allowedSkillIds,
      profileScales: difficulty,
      energyRewardScale: tutorial ? 0.9 : 0.95 + region.index * 0.03,
      mode: tutorial ? "tutorial" : "regionWar",
      characterId: character.id,
      regionId: region.id,
    },
  };
}

function startRunConfig(runConfig) {
  activeRunConfig = runConfig;
  setActiveView("game");
  showOverlay(null);
  resizeGameCanvas();
  game.startRun(progress, runConfig.options);
}

function startTutorialRun() {
  const config = buildRunConfig(INITIAL_REGION_ID, "spriteScout", "normal", true);
  startRunConfig(config);
}

function startSelectedWar() {
  const region = getRegionDefinition(selectedRegionId);
  if (!region || !canDeployToRegion(region)) {
    return;
  }

  const config = buildRunConfig(selectedRegionId, selectedCharacterId, selectedWarDifficultyId, false);
  startRunConfig(config);
}

function handleRunEnd(result) {
  progress = applyRunResult(progress, result);
  renderPersistentPanels();

  const region = result.regionId ? getRegionDefinition(result.regionId) : null;
  const difficulty = activeRunConfig?.difficulty || getWarDifficulty(selectedWarDifficultyId);

  if (result.mode === "tutorial") {
    setActiveView("menu");

    if (result.victory) {
      progress = updateWorldState(progress, {
        introSeen: true,
        tutorialCompleted: true,
        selectedRegionId: INITIAL_REGION_ID,
        pendingRegionId: INITIAL_REGION_ID,
      });
      saveProgress(progress);
      renderPersistentPanels();
      openStoryScene({
        eyebrow: "Liberation",
        title: "第一片花园重新恢复了呼吸",
        paragraphs: [
          "精英害虫被击退后，花心重新亮起。你已经守住了第一片区域，主菜单的四大入口正式开放。",
          "从现在开始，新的区域必须从相邻区域逐步解放。你可以前往花园战争继续推进，也可以先去研究所和图书馆整理战力。",
        ],
        primaryLabel: "进入主菜单",
        primaryAction: () => {
          showOverlay(null);
          updateSessionLabel("花园待命", "选择一个入口，继续推进花园解放战线。");
        },
      });
      return;
    }

    openStoryScene({
      eyebrow: "Overrun",
      title: "花园被攻陷",
      paragraphs: [
        "首场防线已经崩溃，虫潮正在啃食最后一圈花瓣。",
        "重新整队后再试一次。只要撑住三分钟并击败首领，你就能把主菜单从濒危状态中救回来。",
      ],
      primaryLabel: "再次迎战",
      primaryAction: () => {
        startTutorialRun();
      },
    });
    return;
  }

  if (result.mode === "regionWar" && result.victory && region) {
    progress = unlockRegionReward(progress, region.id, region.reward);
    progress = updateWorldState(progress, {
      tutorialCompleted: true,
      selectedRegionId: region.id,
      pendingRegionId: region.id,
      selectedCharacterId,
      selectedWarDifficultyId,
    });
    saveProgress(progress);
    renderPersistentPanels();
    setActiveView("menu");
    openStoryScene({
      eyebrow: "Victory",
      title: `${region.name} 已解放`,
      paragraphs: [
        `镇守 ${region.name} 的 ${MONSTER_LIBRARY.find((monster) => monster.id === region.bossId)?.name || "Boss"} 已被击退。`,
        `${getRewardMeta(region)}。新的相邻区域现在已经对你开放。`,
      ],
      primaryLabel: "继续查看战线",
      primaryAction: () => {
        renderGardenMap();
        showOverlay("gardenMapScreen");
      },
      secondaryLabel: "返回主菜单",
      secondaryAction: () => {
        showOverlay(null);
      },
    });
    return;
  }

  elements.resultTitle.textContent = result.victory ? "守卫成功" : result.abandoned ? "主动撤退" : "挑战失败";
  elements.resultSummary.innerHTML = [
    ["战场", region?.name || "花园战场"],
    ["战役难度", difficulty.name],
    ["生存时间", formatDuration(result.survivalTime)],
    ["角色等级", `Lv.${result.level}`],
    ["击败害虫", `${result.kills}`],
    ["获得植物能量", `${result.coinsEarned}`],
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
  updateSessionLabel(result.victory ? "战役结算" : "战斗结束", "本次获得的植物能量已经计入花园研究所。");
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