import {
  BOOST_CODEX,
  MONSTER_LIBRARY,
  SKILL_LIBRARY,
  TALENT_LIBRARY,
  formatDuration,
  getExclusiveDefinition,
  getSkillDefinition,
  getSkillForExclusive,
  getTalentDescription,
  getTalentValueText,
  getTalentCost,
} from "./data.js";
import {
  BLESSING_LIBRARY,
  GARDEN_REGIONS,
  INNATE_SKILL_IDS,
  LANDSCAPE_LIBRARY,
  MAX_SKILL_SLOTS,
  PROTAGONIST_BLESSING_ID,
  WAR_DIFFICULTIES,
  getBlessingDefinition,
  getBlessingEquippableSkillIds,
  getLandscapeDefinition,
  getRegionDefinition,
  getSkillSlotCost,
  getWarDifficulty,
  isRegionAdjacentToLiberated,
} from "./garden-data.js";
import { GameRuntime } from "./game.js";
import {
  applyRunResult,
  expandSkillSlots,
  getGrantedSkillIds,
  isBlessingGranted,
  loadProgress,
  purchaseExclusiveUnlock,
  purchaseTalent,
  saveProgress,
  setExclusiveEnabled,
  setLoadoutSkills,
  unlockRegionReward,
  updateSettings,
  updateWorldState,
} from "./storage.js";
import { RENDERER_EXTERNAL_ASSET_PATHS } from "./pixi-renderer.js";

const INITIAL_REGION_ID = GARDEN_REGIONS[0].id;
const MIN_GAME_VIEWPORT_WIDTH = 640;
const MIN_GAME_VIEWPORT_HEIGHT = 360;
const TOUCH_JOYSTICK_MAX_OFFSET = 46;
const TOUCH_JOYSTICK_DEADZONE = 20;
const MAP_TOUCH_TAP_THRESHOLD = 10;
const STORY_TYPEWRITER_CHARACTER_DELAY = 32;
const STORY_TYPEWRITER_SHORT_PAUSE = 120;
const STORY_TYPEWRITER_LONG_PAUSE = 260;

const STATUS_LABELS = {
  menu: "待机",
  running: "进行中",
  paused: "已暂停",
  levelup: "升级中",
  shop: "波间商店",
  ended: "已结束",
};

const REGION_MAP_COLUMNS = 6;
const REGION_MAP_ROWS = Math.ceil(GARDEN_REGIONS.length / REGION_MAP_COLUMNS);
const REGION_MAP_VIEWBOX_WIDTH = 860;
const REGION_MAP_VIEWBOX_HEIGHT = 700;
const REGION_VERTEX_ROW_X_SWAY = [-24, 18, -14, 26, -18, 12, -22];
const REGION_VERTEX_COLUMN_X_SWAY = [-30, 4, 22, -18, 14, -8, 26];
const REGION_VERTEX_ROW_Y_SWAY = [-34, 10, -16, 16, -10, 14, 30];
const REGION_VERTEX_COLUMN_Y_SWAY = [0, -18, 12, -10, 18, -14, 8];

function getMapSway(values, index) {
  return values[index % values.length];
}

function getRegionMapVertex(row, column) {
  const xBase = 108 + column * 102 + getMapSway(REGION_VERTEX_ROW_X_SWAY, row) + getMapSway(REGION_VERTEX_COLUMN_X_SWAY, column);
  const yBase = 96 + row * 80 + getMapSway(REGION_VERTEX_ROW_Y_SWAY, row) + getMapSway(REGION_VERTEX_COLUMN_Y_SWAY, column);
  let x = xBase + ((((row + 1) * 17 + (column + 3) * 13) % 7) - 3) * 5;
  let y = yBase + ((((row + 2) * 11 + (column + 1) * 19) % 7) - 3) * 4;

  if (column === 0) {
    x -= 42 + row * 4;
  }

  if (column === REGION_MAP_COLUMNS) {
    x += 28 + (REGION_MAP_ROWS - row) * 5;
  }

  if (row === 0) {
    y -= 30 + Math.abs(column - REGION_MAP_COLUMNS / 2) * 7;
  }

  if (row === REGION_MAP_ROWS) {
    y += 34 + Math.abs(column - REGION_MAP_COLUMNS / 2) * 6;
  }

  if (row === 0 && column >= 4) {
    y += 14;
  }

  if (row === REGION_MAP_ROWS && column <= 1) {
    y -= 12;
  }

  if (column === 0 && row >= 4) {
    x += 14;
  }

  if (column === REGION_MAP_COLUMNS && row <= 1) {
    x -= 12;
  }

  return { x, y };
}

const REGION_MAP_VERTICES = Array.from({ length: REGION_MAP_ROWS + 1 }, (_, row) =>
  Array.from({ length: REGION_MAP_COLUMNS + 1 }, (_, column) => getRegionMapVertex(row, column)),
);

function getHorizontalEdgePoint(row, column) {
  const start = REGION_MAP_VERTICES[row][column];
  const end = REGION_MAP_VERTICES[row][column + 1];
  const bend = ((((row + 1) * 13) + ((column + 2) * 17)) % 5 - 2) * 5;
  return {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2 + bend,
  };
}

function getVerticalEdgePoint(row, column) {
  const start = REGION_MAP_VERTICES[row][column];
  const end = REGION_MAP_VERTICES[row + 1][column];
  const bend = ((((row + 3) * 19) + ((column + 1) * 11)) % 5 - 2) * 5;
  return {
    x: (start.x + end.x) / 2 + bend,
    y: (start.y + end.y) / 2,
  };
}

function formatMapPoint(point) {
  return `${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
}

function buildCurvedPath(start, segments, close = true) {
  let path = `M ${formatMapPoint(start)}`;

  for (const [control, end] of segments) {
    path += ` Q ${formatMapPoint(control)} ${formatMapPoint(end)}`;
  }

  if (close) {
    path += " Z";
  }

  return path;
}

function getRegionCellGeometry(index) {
  const row = Math.floor(index / REGION_MAP_COLUMNS);
  const column = index % REGION_MAP_COLUMNS;
  const topLeft = REGION_MAP_VERTICES[row][column];
  const topRight = REGION_MAP_VERTICES[row][column + 1];
  const bottomRight = REGION_MAP_VERTICES[row + 1][column + 1];
  const bottomLeft = REGION_MAP_VERTICES[row + 1][column];
  return {
    path: buildCurvedPath(topLeft, [
      [getHorizontalEdgePoint(row, column), topRight],
      [getVerticalEdgePoint(row, column + 1), bottomRight],
      [getHorizontalEdgePoint(row + 1, column), bottomLeft],
      [getVerticalEdgePoint(row, column), topLeft],
    ]),
    labelX: (topLeft.x + topRight.x + bottomRight.x + bottomLeft.x) / 4,
    labelY: (topLeft.y + topRight.y + bottomRight.y + bottomLeft.y) / 4 + 5,
  };
}

function getRegionMapOutlinePath() {
  const start = REGION_MAP_VERTICES[0][0];
  const segments = [];

  for (let column = 0; column < REGION_MAP_COLUMNS; column += 1) {
    segments.push([getHorizontalEdgePoint(0, column), REGION_MAP_VERTICES[0][column + 1]]);
  }

  for (let row = 0; row < REGION_MAP_ROWS; row += 1) {
    segments.push([getVerticalEdgePoint(row, REGION_MAP_COLUMNS), REGION_MAP_VERTICES[row + 1][REGION_MAP_COLUMNS]]);
  }

  for (let column = REGION_MAP_COLUMNS - 1; column >= 0; column -= 1) {
    segments.push([getHorizontalEdgePoint(REGION_MAP_ROWS, column), REGION_MAP_VERTICES[REGION_MAP_ROWS][column]]);
  }

  for (let row = REGION_MAP_ROWS - 1; row >= 0; row -= 1) {
    segments.push([getVerticalEdgePoint(row, 0), REGION_MAP_VERTICES[row][0]]);
  }

  return buildCurvedPath(start, segments);
}

function getRegionBoundaryPaths() {
  const paths = [];

  for (let row = 1; row < REGION_MAP_ROWS; row += 1) {
    for (let column = 0; column < REGION_MAP_COLUMNS; column += 1) {
      const start = REGION_MAP_VERTICES[row][column];
      const mid = getHorizontalEdgePoint(row, column);
      const end = REGION_MAP_VERTICES[row][column + 1];
      paths.push(buildCurvedPath(start, [[mid, end]], false));
    }
  }

  for (let row = 0; row < REGION_MAP_ROWS; row += 1) {
    for (let column = 1; column < REGION_MAP_COLUMNS; column += 1) {
      const start = REGION_MAP_VERTICES[row][column];
      const mid = getVerticalEdgePoint(row, column);
      const end = REGION_MAP_VERTICES[row + 1][column];
      paths.push(buildCurvedPath(start, [[mid, end]], false));
    }
  }

  return paths;
}

function getRegionLabelLines(label) {
  if (label.length <= 4) {
    return [label];
  }

  const midpoint = Math.ceil(label.length / 2);
  return [label.slice(0, midpoint), label.slice(midpoint)];
}

function renderRegionLabelText(label, x, y, className) {
  const lines = getRegionLabelLines(label);
  const startY = y - (lines.length - 1) * 10;
  return `
    <text class="${className}" x="${x.toFixed(1)}" y="${startY.toFixed(1)}">
      ${lines
        .map((line, index) => `<tspan x="${x.toFixed(1)}" dy="${index === 0 ? 0 : 18}">${line}</tspan>`)
        .join("")}
    </text>
  `;
}

function getRegionTileLabel(region) {
  return region.name.replace(/\s+\d+$/, "");
}

const elements = {
  bootScreen: document.querySelector("#bootScreen"),
  bootStatus: document.querySelector("#bootStatus"),
  bootProgressFill: document.querySelector("#bootProgressFill"),
  menuView: document.querySelector("#menuView"),
  gameView: document.querySelector("#gameView"),
  gameStage: document.querySelector("#gameStage"),
  canvas: document.querySelector("#gameCanvas"),
  overlays: Array.from(document.querySelectorAll(".screen-overlay")),
  storyScreen: document.querySelector("#storyScreen"),
  openWarButton: document.querySelector("#openWarButton"),
  openLabButton: document.querySelector("#openLabButton"),
  openLibraryButton: document.querySelector("#openLibraryButton"),
  openBugPlanetButton: document.querySelector("#openBugPlanetButton"),
  openSettingsButton: document.querySelector("#openSettingsButton"),
  openWarPrepButton: document.querySelector("#openWarPrepButton"),
  confirmWarButton: document.querySelector("#confirmWarButton"),
  startBossTestButton: document.querySelector("#startBossTestButton"),
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

  prepRuleText: document.querySelector("#prepRuleText"),
  warDifficultyOptions: document.querySelector("#warDifficultyOptions"),

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
  skillSlotShop: document.querySelector("#skillSlotShop"),
  labSlotBadge: document.querySelector("#labSlotBadge"),
  prepSlotSummary: document.querySelector("#prepSlotSummary"),
  loadoutSlots: document.querySelector("#loadoutSlots"),
  loadoutBlessings: document.querySelector("#loadoutBlessings"),
  loadoutEssenceSection: document.querySelector("#loadoutEssenceSection"),
  loadoutEssenceSlots: document.querySelector("#loadoutEssenceSlots"),
  libraryCharacters: document.querySelector("#libraryCharacters"),
  codexMonsters: document.querySelector("#codexMonsters"),
  codexSkills: document.querySelector("#codexSkills"),
  libraryRegions: document.querySelector("#libraryRegions"),
  libraryLandscapes: document.querySelector("#libraryLandscapes"),
  codexBoosts: document.querySelector("#codexBoosts"),
  hudFields: document.querySelectorAll("#hudStats [data-field]"),
  hudTimerText: document.querySelector("#hudTimerText"),
  hudHealthText: document.querySelector("#hudHealthText"),
  hudBlinkCharges: document.querySelector("#hudBlinkCharges"),
  hudLevelText: document.querySelector("#hudLevelText"),
  hudExpFill: document.querySelector("#hudExpFill"),
  hudExpText: document.querySelector("#hudExpText"),
  hudDewText: document.querySelector("#hudDewText"),
  eyeComfortButton: document.querySelector("#eyeComfortButton"),
  muteButton: document.querySelector("#muteButton"),
  reducedMotionButton: document.querySelector("#reducedMotionButton"),
  perspectiveButton: document.querySelector("#perspectiveButton"),
  speedToggleButton: document.querySelector("#speedToggleButton"),
  touchControls: document.querySelector("#touchControls"),
  touchJoystick: document.querySelector("#touchJoystick"),
  touchJoystickThumb: document.querySelector("#touchJoystickThumb"),
  touchBlinkButton: document.querySelector("#touchBlinkButton"),
  touchPauseButton: document.querySelector("#touchPauseButton"),
  activeSkills: document.querySelector("#activeSkills"),
  levelChoices: document.querySelector("#levelChoices"),
  shopOffers: document.querySelector("#shopOffers"),
  shopWalletText: document.querySelector("#shopWalletText"),
  shopRefreshButton: document.querySelector("#shopRefreshButton"),
  shopContinueButton: document.querySelector("#shopContinueButton"),
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

let selectedWarDifficultyId = progress.world?.selectedWarDifficultyId || "normal";
let activeRunConfig = null;
let storyPrimaryHandler = null;
let storySecondaryHandler = null;
let storyTypewriterToken = 0;
let storyTypewriterTimerId = 0;
let storyTypewriterActive = false;
let storyTypewriterParagraphs = [];
let storyRevealPrimaryAfterTypewriter = false;
let activeTouchJoystickPointerId = null;
let activeMapTouchPointerId = null;
let mapTouchStartX = 0;
let mapTouchStartY = 0;
let mapTouchScrollLeft = 0;
let mapTouchScrollTop = 0;
let mapTouchMoved = false;
let lastTouchRegionSelectionAt = 0;

if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
  window.addEventListener("load", () => {
    const serviceWorkerUrl = new URL("../service-worker.js", import.meta.url);
    navigator.serviceWorker.register(serviceWorkerUrl).catch((error) => {
      console.warn("PWA service worker registration failed:", error);
    });
  });
}

syncCampaignSelections();

const hudMap = new Map(Array.from(elements.hudFields, (field) => [field.dataset.field, field]));

const game = new GameRuntime({
  canvas: elements.canvas,
  callbacks: {
    onHudUpdate: renderHud,
    onLevelChoices: renderLevelChoices,
    onWaveShop: renderWaveShop,
    onRunEnd: handleRunEnd,
    onOverlayChange: showOverlay,
    onSessionLabel: updateSessionLabel,
    onSpeedChange: renderSpeedButton,
    onToast: showToast,
  },
});
game.setEyeComfortMode(progress.settings?.eyeComfortMode ?? false);
game.setMuted(progress.settings?.muted ?? false);
game.setReducedMotion(progress.settings?.reducedMotion ?? false);
game.setPerspectiveMode(progress.settings?.perspectiveMode ?? false);

// Browsers block audio until a user gesture; resume the context on the first interaction.
function primeAudioOnGesture() {
  game.resumeAudio();
  window.removeEventListener("pointerdown", primeAudioOnGesture);
  window.removeEventListener("keydown", primeAudioOnGesture);
}
window.addEventListener("pointerdown", primeAudioOnGesture);
window.addEventListener("keydown", primeAudioOnGesture);

bindUi();
bindBattleTouchControls();
bindMenuTouchFeedback();
bootApp();

function updateBootProgress(progressRatio, label) {
  const clampedRatio = Math.max(0, Math.min(progressRatio, 1));
  if (elements.bootProgressFill) {
    elements.bootProgressFill.style.width = `${Math.round(clampedRatio * 100)}%`;
  }
  if (typeof label === "string") {
    elements.bootStatus.textContent = label;
  }
}

function preloadImageAsset(assetPath) {
  return new Promise((resolve) => {
    const image = new Image();
    const finish = () => {
      image.onload = null;
      image.onerror = null;
      resolve();
    };

    image.decoding = "async";
    image.onload = finish;
    image.onerror = finish;
    image.src = new URL(assetPath, window.location.href).href;

    if (image.complete) {
      finish();
    }
  });
}

async function preloadAppResources() {
  const assetPaths = [...new Set(RENDERER_EXTERNAL_ASSET_PATHS)];
  if (!assetPaths.length) {
    updateBootProgress(1, "花园核心已唤醒");
    return;
  }

  updateBootProgress(0.08, "正在收拢花园碎片...");
  let completedCount = 0;

  await Promise.all(
    assetPaths.map(async (assetPath) => {
      await preloadImageAsset(assetPath);
      completedCount += 1;
      const progressRatio = completedCount / assetPaths.length;
      const statusText = completedCount === assetPaths.length ? "花园核心已唤醒" : "正在编织开场场景...";
      updateBootProgress(progressRatio, statusText);
    }),
  );
}

async function bootApp() {
  updateBootProgress(0.04, "正在唤醒花园核心...");
  await preloadAppResources();

  resizeGameCanvas();
  renderPersistentPanels();
  renderHud({
    status: "menu",
    time: "15:00",
    level: "1",
    exp: "0 / 18",
    expRatio: 0,
    health: "100 / 100",
    attack: "1.00x",
    speed: "220",
    crit: "5%",
    dodge: "5%",
    armor: "0",
    healthRegen: "0.0 / 秒",
    cooldown: "0%",
    blink: "1 / 1",
    blinkCharges: 1,
    blinkChargesMax: 1,
    blinkRechargeProgress: 1,
    expPickupRange: "96",
    kills: "0",
    skills: [],
  });
  renderSpeedButton(1);
  renderEyeComfortButton(progress.settings?.eyeComfortMode ?? false);
  renderMuteButton(progress.settings?.muted ?? false);
  renderReducedMotionButton(progress.settings?.reducedMotion ?? false);
  renderPerspectiveButton(progress.settings?.perspectiveMode ?? false);

  if (!progress.world.tutorialCompleted) {
    openIntroStory();
  } else {
    setActiveView("menu");
    showOverlay(null);
    updateSessionLabel("花园待命", "选择一个入口，继续推进花园解放战线。");
  }

  window.requestAnimationFrame(() => {
    document.body.dataset.bootState = "ready";
  });
}

function clearStoryTypewriterTimer() {
  if (storyTypewriterTimerId) {
    window.clearTimeout(storyTypewriterTimerId);
    storyTypewriterTimerId = 0;
  }
}

function renderStoryParagraphs(paragraphs) {
  elements.storyBody.replaceChildren();
  const paragraphEntries = [];

  paragraphs.forEach((text) => {
    const paragraphElement = document.createElement("p");
    paragraphElement.className = "story-paragraph";

    const textElement = document.createElement("span");
    textElement.className = "story-typewriter";
    paragraphElement.append(textElement);
    elements.storyBody.append(paragraphElement);
    paragraphEntries.push({ paragraphElement, textElement, fullText: text });
  });

  return paragraphEntries;
}

function finishStoryTypewriter(paragraphs = storyTypewriterParagraphs) {
  clearStoryTypewriterTimer();
  storyTypewriterToken += 1;
  storyTypewriterActive = false;
  elements.storyBody.dataset.typing = "false";
  elements.storyScreen.dataset.typing = "false";

  const paragraphEntries = renderStoryParagraphs(paragraphs);
  for (const entry of paragraphEntries) {
    entry.textElement.textContent = entry.fullText;
  }

  if (storyRevealPrimaryAfterTypewriter) {
    elements.storyPrimaryButton.hidden = false;
  }
}

function getStoryTypewriterDelay(character) {
  if (/[。！？!?]/u.test(character)) {
    return STORY_TYPEWRITER_LONG_PAUSE;
  }
  if (/[，、；：,;:]/u.test(character)) {
    return STORY_TYPEWRITER_SHORT_PAUSE;
  }
  return STORY_TYPEWRITER_CHARACTER_DELAY;
}

function startStoryTypewriter(paragraphs) {
  clearStoryTypewriterTimer();
  storyTypewriterToken += 1;
  storyTypewriterParagraphs = [...paragraphs];

  if (!paragraphs.length) {
    storyTypewriterActive = false;
    elements.storyBody.dataset.typing = "false";
    elements.storyScreen.dataset.typing = "false";
    elements.storyBody.replaceChildren();
    if (storyRevealPrimaryAfterTypewriter) {
      elements.storyPrimaryButton.hidden = false;
    }
    return;
  }

  const activeToken = storyTypewriterToken;
  const paragraphEntries = renderStoryParagraphs(paragraphs);
  let paragraphIndex = 0;
  let characterIndex = 0;

  storyTypewriterActive = true;
  elements.storyBody.dataset.typing = "true";
  elements.storyScreen.dataset.typing = "true";

  const step = () => {
    if (activeToken !== storyTypewriterToken) {
      return;
    }

    const activeParagraph = paragraphEntries[paragraphIndex];
    if (!activeParagraph) {
      storyTypewriterActive = false;
      elements.storyBody.dataset.typing = "false";
      elements.storyScreen.dataset.typing = "false";
      storyTypewriterTimerId = 0;
      if (storyRevealPrimaryAfterTypewriter) {
        elements.storyPrimaryButton.hidden = false;
      }
      return;
    }

    activeParagraph.paragraphElement.classList.add("is-active");
    characterIndex += 1;
    activeParagraph.textElement.textContent = activeParagraph.fullText.slice(0, characterIndex);

    if (characterIndex < activeParagraph.fullText.length) {
      const lastCharacter = activeParagraph.fullText.charAt(characterIndex - 1);
      storyTypewriterTimerId = window.setTimeout(step, getStoryTypewriterDelay(lastCharacter));
      return;
    }

    activeParagraph.paragraphElement.classList.remove("is-active");
    paragraphIndex += 1;
    characterIndex = 0;

    if (paragraphIndex < paragraphEntries.length) {
      paragraphEntries[paragraphIndex].paragraphElement.classList.add("is-active");
      storyTypewriterTimerId = window.setTimeout(step, STORY_TYPEWRITER_LONG_PAUSE);
      return;
    }

    storyTypewriterActive = false;
    elements.storyBody.dataset.typing = "false";
    elements.storyScreen.dataset.typing = "false";
    storyTypewriterTimerId = 0;

    if (storyRevealPrimaryAfterTypewriter) {
      elements.storyPrimaryButton.hidden = false;
    }
  };

  step();
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

  elements.openSettingsButton?.addEventListener("click", () => {
    showOverlay("settingsScreen");
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
  elements.startBossTestButton?.addEventListener("click", () => {
    startSelectedBossTest();
  });

  elements.storyPrimaryButton.addEventListener("click", () => {
    if (storyTypewriterActive) {
      finishStoryTypewriter();
      return;
    }
    storyPrimaryHandler?.();
  });

  elements.storySecondaryButton.addEventListener("click", () => {
    storySecondaryHandler?.();
  });

  elements.storyBody.addEventListener("click", () => {
    if (storyTypewriterActive) {
      finishStoryTypewriter();
    }
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

  elements.eyeComfortButton.addEventListener("click", () => {
    setEyeComfortMode(!(progress.settings?.eyeComfortMode ?? false));
  });

  elements.muteButton?.addEventListener("click", () => {
    setMuted(!(progress.settings?.muted ?? false));
  });

  elements.reducedMotionButton?.addEventListener("click", () => {
    setReducedMotion(!(progress.settings?.reducedMotion ?? false));
  });

  elements.perspectiveButton?.addEventListener("click", () => {
    setPerspectiveMode(!(progress.settings?.perspectiveMode ?? false));
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
  window.visualViewport?.addEventListener("resize", resizeGameCanvas);
  window.visualViewport?.addEventListener("scroll", resizeGameCanvas);
}

function bindMenuTouchFeedback() {
  const interactiveButtons = document.querySelectorAll(
    ".primary-button, .ghost-button, .choice-button, .talent-button, .hud-speed-button"
  );

  const clearPressedState = (button) => {
    button.dataset.touchPressed = "false";
  };

  for (const button of interactiveButtons) {
    button.addEventListener("pointerdown", (event) => {
      if (event.pointerType !== "touch") {
        return;
      }
      button.dataset.touchPressed = "true";
    });

    for (const eventName of ["pointerup", "pointercancel", "pointerleave", "lostpointercapture"]) {
      button.addEventListener(eventName, () => {
        clearPressedState(button);
      });
    }
  }
}

function renderTouchPauseButton() {
  if (!elements.touchPauseButton) {
    return;
  }
  const paused = game.state === "paused";
  elements.touchPauseButton.textContent = paused ? "继续" : "暂停";
  elements.touchPauseButton.dataset.mode = paused ? "resume" : "pause";
}

function setTouchJoystickThumbPosition(offsetX, offsetY) {
  if (!elements.touchJoystickThumb) {
    return;
  }
  elements.touchJoystickThumb.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
}

function resetTouchJoystick() {
  activeTouchJoystickPointerId = null;
  game.clearTouchMovement();
  setTouchJoystickThumbPosition(0, 0);
  if (elements.touchJoystick) {
    elements.touchJoystick.dataset.active = "false";
  }
}

function updateTouchJoystick(event) {
  if (!elements.touchJoystick) {
    return;
  }

  const bounds = elements.touchJoystick.getBoundingClientRect();
  const centerX = bounds.left + bounds.width / 2;
  const centerY = bounds.top + bounds.height / 2;
  const deltaX = event.clientX - centerX;
  const deltaY = event.clientY - centerY;
  const distance = Math.hypot(deltaX, deltaY);
  const limitedDistance = Math.min(TOUCH_JOYSTICK_MAX_OFFSET, distance);
  const activeDistance = Math.max(0, limitedDistance - TOUCH_JOYSTICK_DEADZONE);
  const activeRange = Math.max(1, TOUCH_JOYSTICK_MAX_OFFSET - TOUCH_JOYSTICK_DEADZONE);
  const directionX = distance > 0 ? deltaX / distance : 0;
  const directionY = distance > 0 ? deltaY / distance : 0;
  const strength = TOUCH_JOYSTICK_MAX_OFFSET > 0 ? activeDistance / activeRange : 0;
  const offsetX = directionX * strength * TOUCH_JOYSTICK_MAX_OFFSET;
  const offsetY = directionY * strength * TOUCH_JOYSTICK_MAX_OFFSET;

  setTouchJoystickThumbPosition(offsetX, offsetY);
  game.setTouchMovement(directionX * strength, directionY * strength);
  elements.touchJoystick.dataset.active = strength > 0 ? "true" : "false";
}

function bindBattleTouchControls() {
  if (!elements.touchJoystick || !elements.touchJoystickThumb || !elements.touchBlinkButton || !elements.touchPauseButton) {
    return;
  }

  elements.touchJoystick.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || game.state !== "running") {
      return;
    }
    event.preventDefault();
    activeTouchJoystickPointerId = event.pointerId;
    try {
      elements.touchJoystick.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic pointer events used in tests do not always create capturable pointers.
    }
    updateTouchJoystick(event);
  });

  elements.touchJoystick.addEventListener("pointermove", (event) => {
    if (event.pointerId !== activeTouchJoystickPointerId) {
      return;
    }
    event.preventDefault();
    updateTouchJoystick(event);
  });

  for (const eventName of ["pointerup", "pointercancel", "lostpointercapture"]) {
    elements.touchJoystick.addEventListener(eventName, (event) => {
      if (event.pointerId !== activeTouchJoystickPointerId) {
        return;
      }
      resetTouchJoystick();
    });
  }

  let touchBlinkHandled = false;
  elements.touchBlinkButton.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "touch" || game.state !== "running") {
      return;
    }
    event.preventDefault();
    touchBlinkHandled = true;
    window.setTimeout(() => {
      touchBlinkHandled = false;
    }, 320);
    game.tryBlink();
  });
  elements.touchBlinkButton.addEventListener("click", () => {
    if (touchBlinkHandled) {
      touchBlinkHandled = false;
      return;
    }
    game.tryBlink();
  });

  elements.touchPauseButton.addEventListener("click", () => {
    if (game.state === "running") {
      game.pause();
    } else if (game.state === "paused") {
      game.resume();
    }
  });

  window.addEventListener("blur", resetTouchJoystick);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") {
      resetTouchJoystick();
    }
  });

  renderTouchPauseButton();
}

function syncCampaignSelections() {
  const preferredRegionId = getRegionDefinition(progress.world?.selectedRegionId)
    ? progress.world.selectedRegionId
    : getRegionDefinition(progress.world?.pendingRegionId)
      ? progress.world.pendingRegionId
      : INITIAL_REGION_ID;

  selectedRegionId = preferredRegionId;
  selectedWarDifficultyId = getWarDifficulty(progress.world?.selectedWarDifficultyId).id;
}

function persistWorldSelection(partialWorld) {
  progress = updateWorldState(progress, partialWorld);
  saveProgress(progress);
  syncCampaignSelections();
  renderPersistentPanels();
}

// 已获赐福的提供者（含主角自身）。
function getGrantedBlessings() {
  const granted = BLESSING_LIBRARY.filter((blessing) => isBlessingGranted(progress.world, blessing.id));
  return granted.length > 0 ? granted : [getBlessingDefinition(PROTAGONIST_BLESSING_ID)].filter(Boolean);
}

function getLoadout() {
  return progress.world.loadout;
}

// 本局实际可用的技能：固有技能 + 已装备技能。
function getEquippedSkillIds() {
  return [...INNATE_SKILL_IDS, ...getLoadout().skillIds];
}

function getLoadoutRuleDescription() {
  const loadout = getLoadout();
  const innateNames = INNATE_SKILL_IDS.map((skillId) => getSkillDefinition(skillId)?.name).filter(Boolean).join("、");
  if (loadout.skillIds.length === 0) {
    return `小精灵固有携带 ${innateNames}。从已获赐福中装配技能，只有装配上的技能才会进入局内升级池。`;
  }
  const equippedNames = loadout.skillIds.map((skillId) => getSkillDefinition(skillId)?.name).filter(Boolean).join("、");
  return `小精灵固有携带 ${innateNames}，本次出战另外装配 ${equippedNames}。局内升级池只会出现这些技能。`;
}

function getRewardMeta(region) {
  if (!region?.reward) {
    return "无奖励";
  }

  if (region.reward.type === "blessing" || region.reward.type === "character") {
    const blessing = getBlessingDefinition(region.reward.targetId);
    const skillName = getSkillDefinition(blessing?.skillId)?.name;
    return `获得赐福：${blessing?.name || region.reward.targetId}${skillName ? `（${skillName}）` : ""}`;
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

function renderEyeComfortButton(enabled) {
  elements.eyeComfortButton.textContent = enabled ? "护眼 开" : "护眼 关";
  elements.eyeComfortButton.dataset.active = enabled ? "true" : "false";
}

function setEyeComfortMode(enabled) {
  progress = updateSettings(progress, { eyeComfortMode: enabled });
  saveProgress(progress);
  game.setEyeComfortMode(enabled);
  renderEyeComfortButton(enabled);
}

function renderMuteButton(muted) {
  if (!elements.muteButton) return;
  elements.muteButton.textContent = muted ? "音效 关" : "音效 开";
  elements.muteButton.dataset.active = muted ? "false" : "true";
}

function setMuted(muted) {
  progress = updateSettings(progress, { muted });
  saveProgress(progress);
  game.resumeAudio();
  game.setMuted(muted);
  renderMuteButton(muted);
}

function renderReducedMotionButton(reduced) {
  if (!elements.reducedMotionButton) return;
  // Button reflects screen-shake state: 开 = shake on (reducedMotion off).
  elements.reducedMotionButton.textContent = reduced ? "震屏 关" : "震屏 开";
  elements.reducedMotionButton.dataset.active = reduced ? "false" : "true";
}

function setReducedMotion(reduced) {
  progress = updateSettings(progress, { reducedMotion: reduced });
  saveProgress(progress);
  game.setReducedMotion(reduced);
  renderReducedMotionButton(reduced);
}

function renderPerspectiveButton(enabled) {
  if (!elements.perspectiveButton) return;
  elements.perspectiveButton.textContent = enabled ? "立体 开" : "立体 关";
  elements.perspectiveButton.dataset.active = enabled ? "true" : "false";
}

function setPerspectiveMode(enabled) {
  progress = updateSettings(progress, { perspectiveMode: enabled });
  saveProgress(progress);
  game.setPerspectiveMode(enabled);
  renderPerspectiveButton(enabled);
}

function renderHud(snapshot) {
  renderTouchPauseButton();
  elements.hudTimerText.textContent = snapshot.waveText || (snapshot.time === "Boss" ? "Boss 战" : `倒计时 ${snapshot.time}`);
  elements.hudHealthText.textContent = `生命 ${snapshot.health}`;
  renderBlinkCharges(snapshot);
  elements.hudLevelText.textContent = `LV ${snapshot.level}`;
  elements.hudExpText.textContent = snapshot.exp;
  elements.hudExpFill.style.width = `${Math.max(0, Math.min(100, (snapshot.expRatio || 0) * 100))}%`;
  if (elements.hudDewText) {
    elements.hudDewText.textContent = `${snapshot.dewCoinsValue ?? 0}`;
  }

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

function renderBlinkCharges(snapshot) {
  const container = elements.hudBlinkCharges;
  if (!container) {
    return;
  }

  const total = Math.max(1, Number(snapshot.blinkChargesMax) || 1);
  const ready = Math.max(0, Number(snapshot.blinkCharges) || 0);
  const progress = Math.max(0, Math.min(1, Number(snapshot.blinkRechargeProgress) || 0));

  if (container.children.length !== total) {
    container.replaceChildren();
    for (let index = 0; index < total; index += 1) {
      const icon = document.createElement("span");
      icon.className = "hud-blink-charge";
      const fill = document.createElement("span");
      fill.className = "hud-blink-charge__fill";
      icon.append(fill);
      container.append(icon);
    }
  }

  container.querySelectorAll(".hud-blink-charge").forEach((icon, index) => {
    const fill = icon.querySelector(".hud-blink-charge__fill");
    if (index < ready) {
      icon.classList.add("is-ready");
      icon.classList.remove("is-recharging", "is-empty");
      fill.style.height = "100%";
    } else if (index === ready) {
      icon.classList.add("is-recharging");
      icon.classList.remove("is-ready", "is-empty");
      fill.style.height = `${progress * 100}%`;
    } else {
      icon.classList.add("is-empty");
      icon.classList.remove("is-ready", "is-recharging");
      fill.style.height = "0%";
    }
  });
}

function renderLevelChoices(choices) {
  elements.levelChoices.innerHTML = choices
    .map(
      (choice) => `
        <button class="choice-button" data-choice-key="${choice.key}" data-choice-variant="${getLevelChoiceVariant(choice)}">
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

  const allNewSkills = choices.length > 0 && choices.every((choice) => choice.type === "skill-unlock");
  if (allNewSkills) {
    const fallbackButton = document.createElement("button");
    fallbackButton.className = "choice-button choice-button--passive-fallback";
    fallbackButton.type = "button";
    fallbackButton.textContent = "替换为被动技能 / 技能增益";
    fallbackButton.addEventListener("click", () => {
      game.rerollLevelChoicesToPassives();
    });
    elements.levelChoices.append(fallbackButton);
  }
}

function renderWaveShop(snapshot) {
  elements.shopWalletText.textContent = `${snapshot.dewCoins}`;
  elements.shopOffers.innerHTML = snapshot.offers
    .map((offer) => {
      // Three states so the price list stays legible: buyable, too expensive, already taken.
      const state = offer.purchased ? "purchased" : offer.affordable ? "ready" : "locked";
      const priceText = offer.purchased ? "已购入" : `${offer.cost} 露金`;
      return `
        <button class="choice-button" type="button" data-offer-key="${offer.key}" data-shop-state="${state}" ${state === "ready" ? "" : "disabled"}>
          <strong>${offer.name}</strong>
          <span>${offer.description}</span>
          <small class="shop-price">${priceText}</small>
        </button>
      `;
    })
    .join("");

  for (const button of elements.shopOffers.querySelectorAll("[data-offer-key]")) {
    button.addEventListener("click", () => {
      game.buyWaveShopOffer(button.dataset.offerKey);
    });
  }

  elements.shopRefreshButton.disabled = !snapshot.canRefresh;
  elements.shopRefreshButton.textContent = `刷新货品（${snapshot.refreshCost} 露金）`;
}

elements.shopRefreshButton?.addEventListener("click", () => {
  game.refreshWaveShop();
});

elements.shopContinueButton?.addEventListener("click", () => {
  game.closeWaveShop();
});

const SPECIAL_LEVEL_CHOICE_IDS = new Set(["monsterPressure", "minuteVacuum", "projectileOverload", "summonOverload"]);

function getLevelChoiceVariant(choice) {
  if (choice.type === "exclusive") {
    return "exclusive";
  }

  if (choice.type === "special-boon") {
    return "special";
  }

  if (choice.type === "skill-unlock" || choice.type === "skill-level") {
    return "special";
  }

  if (choice.type === "general" && SPECIAL_LEVEL_CHOICE_IDS.has(choice.id)) {
    return "special";
  }

  return "basic";
}

function renderPersistentPanels() {
  syncCampaignSelections();

  const liberatedCount = progress.world.liberatedRegions.length;
  const frontierCount = GARDEN_REGIONS.filter((region) => isFrontier(region.id)).length;
  const grantedBlessings = getGrantedBlessings();
  const selectedRegion = getRegionDefinition(selectedRegionId) || GARDEN_REGIONS[0];
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

  if (elements.liberationBadge) elements.liberationBadge.textContent = `${liberatedCount} / ${GARDEN_REGIONS.length}`;
  if (elements.characterBadge) elements.characterBadge.textContent = String(grantedBlessings.length);
  if (elements.prepDifficultyBadge) elements.prepDifficultyBadge.textContent = selectedDifficulty.name;
  if (elements.mainTagline) {
    elements.mainTagline.textContent = progress.world.tutorialCompleted
      ? `花园仍有 ${GARDEN_REGIONS.length - liberatedCount} 片区域被害虫控制，你的下一次部署将从 ${getRegionTileLabel(selectedRegion)} 开始。`
      : "小精灵刚刚成形，必须先守住众愿苗圃。";
  }
  if (elements.worldSummaryText) {
    elements.worldSummaryText.textContent = progress.world.tutorialCompleted
      ? `当前前线区域 ${frontierCount} 处，已获赐福 ${grantedBlessings.length} 份，已恢复景观 ${progress.world.unlockedLandscapes.length} 处。`
      : "先完成三分钟首战，再从主菜单自由切换战争、研究所、图书馆与害虫星球入口。";
  }

  if (elements.menuSummary) {
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
  }

  if (elements.characterRosterPreview) {
    elements.characterRosterPreview.innerHTML = grantedBlessings
      .slice(0, 6)
      .map(
        (blessing) => `
          <article class="roster-preview-item">
            <strong>${blessing.name}</strong>
            <span class="card-note">${blessing.title}</span>
            <small>${getSkillDefinition(blessing.skillId)?.name || "未知技能"}</small>
          </article>
        `,
      )
      .join("");
  }

  if (elements.prepSummary) {
    elements.prepSummary.innerHTML = [
      ["目标区域", getRegionTileLabel(selectedRegion)],
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
  }

  renderGardenMap();
  renderLab();
  renderLibrary();
}

function renderGardenMap() {
  const selectedRegion = getRegionDefinition(selectedRegionId) || GARDEN_REGIONS[0];
  const continentOutline = getRegionMapOutlinePath();
  const internalBoundaries = getRegionBoundaryPaths();
  const regionNodes = GARDEN_REGIONS.map((region, index) => {
    const geometry = getRegionCellGeometry(index);
    const regionName = getRegionTileLabel(region);
    const liberated = isLiberated(region.id);
    const frontier = isFrontier(region.id);
    const locked = !liberated && !frontier;
    const stateClass = `${liberated ? "is-liberated" : frontier ? "is-frontier" : "is-locked"} ${selectedRegion.id === region.id ? "is-selected" : ""}`.trim();
    return {
      shape: `
        <path
          class="region-shape ${stateClass}"
          data-region-id="${region.id}"
          data-locked="${locked ? "true" : "false"}"
          role="button"
          tabindex="${locked ? "-1" : "0"}"
          aria-label="${regionName}"
          aria-disabled="${locked ? "true" : "false"}"
          d="${geometry.path}"
        ></path>
      `,
      fog: locked
        ? `
          <path class="region-fog region-fog--base" d="${geometry.path}" fill="url(#regionFogPattern)"></path>
          <path class="region-fog region-fog--veil" d="${geometry.path}" fill="url(#regionFogGradient)" filter="url(#regionFogBlur)"></path>
        `
        : "",
      label: renderRegionLabelText(regionName, geometry.labelX, geometry.labelY, `region-label ${stateClass}`.trim()),
    };
  });

  elements.regionGrid.innerHTML = `
    <div class="region-board">
      <svg class="region-map" viewBox="0 0 ${REGION_MAP_VIEWBOX_WIDTH} ${REGION_MAP_VIEWBOX_HEIGHT}" role="img" aria-label="花园大陆分区地图">
        <defs>
          <linearGradient id="regionFogGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f7faf7" stop-opacity="0.88"></stop>
            <stop offset="52%" stop-color="#ebf0ec" stop-opacity="0.54"></stop>
            <stop offset="100%" stop-color="#dde7df" stop-opacity="0.8"></stop>
          </linearGradient>
          <pattern id="regionFogPattern" width="180" height="160" patternUnits="userSpaceOnUse">
            <rect width="180" height="160" fill="#eef3ef" fill-opacity="0.28"></rect>
            <ellipse cx="52" cy="48" rx="40" ry="18" fill="#ffffff" fill-opacity="0.22"></ellipse>
            <ellipse cx="124" cy="76" rx="54" ry="22" fill="#ffffff" fill-opacity="0.18"></ellipse>
            <ellipse cx="96" cy="122" rx="48" ry="18" fill="#e4ece5" fill-opacity="0.24"></ellipse>
          </pattern>
          <filter id="regionFogBlur" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="6"></feGaussianBlur>
          </filter>
        </defs>
        <path class="region-continent-shadow" d="${continentOutline}"></path>
        <path class="region-continent" d="${continentOutline}"></path>
        <g class="region-shapes">
          ${regionNodes.map((node) => node.shape).join("")}
        </g>
        <g class="region-fogs" aria-hidden="true">
          ${regionNodes.map((node) => node.fog).join("")}
        </g>
        <g class="region-boundaries" aria-hidden="true">
          ${internalBoundaries.map((path) => `<path class="region-boundary" d="${path}"></path>`).join("")}
        </g>
        <g class="region-labels" aria-hidden="true">
          ${regionNodes.map((node) => node.label).join("")}
        </g>
      </svg>
    </div>
  `;

  const selectRegion = (regionId) => {
    persistWorldSelection({
      selectedRegionId: regionId,
      pendingRegionId: regionId,
    });
    renderGardenMap();
  };

  const finishMapTouchInteraction = (pointerId, regionId = null) => {
    if (pointerId !== activeMapTouchPointerId) {
      return;
    }

    const shouldSelect = !mapTouchMoved && regionId;
    activeMapTouchPointerId = null;
    mapTouchMoved = false;
    elements.regionGrid.dataset.dragging = "false";

    if (shouldSelect) {
      lastTouchRegionSelectionAt = Date.now();
      selectRegion(regionId);
    }
  };

  elements.regionGrid.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "touch") {
      return;
    }

    activeMapTouchPointerId = event.pointerId;
    mapTouchStartX = event.clientX;
    mapTouchStartY = event.clientY;
    mapTouchScrollLeft = elements.regionGrid.scrollLeft;
    mapTouchScrollTop = elements.regionGrid.scrollTop;
    mapTouchMoved = false;
    elements.regionGrid.dataset.dragging = "false";

    try {
      elements.regionGrid.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic test events may not be capturable.
    }
  });

  elements.regionGrid.addEventListener("pointermove", (event) => {
    if (event.pointerId !== activeMapTouchPointerId || event.pointerType !== "touch") {
      return;
    }

    const deltaX = event.clientX - mapTouchStartX;
    const deltaY = event.clientY - mapTouchStartY;
    if (!mapTouchMoved && Math.hypot(deltaX, deltaY) >= MAP_TOUCH_TAP_THRESHOLD) {
      mapTouchMoved = true;
      elements.regionGrid.dataset.dragging = "true";
    }

    if (!mapTouchMoved) {
      return;
    }

    event.preventDefault();
    elements.regionGrid.scrollLeft = mapTouchScrollLeft - deltaX;
    elements.regionGrid.scrollTop = mapTouchScrollTop - deltaY;
  }, { passive: false });

  for (const eventName of ["pointerup", "pointercancel", "lostpointercapture"]) {
    elements.regionGrid.addEventListener(eventName, (event) => {
      finishMapTouchInteraction(event.pointerId);
    });
  }

  for (const shape of elements.regionGrid.querySelectorAll(".region-shape[data-region-id]")) {
    if (shape.dataset.locked === "true") {
      continue;
    }

    shape.addEventListener("click", () => {
      if (Date.now() - lastTouchRegionSelectionAt < 600) {
        return;
      }
      selectRegion(shape.dataset.regionId);
    });

    shape.addEventListener("pointerup", (event) => {
      if (event.pointerType !== "touch") {
        return;
      }
      finishMapTouchInteraction(event.pointerId, shape.dataset.regionId);
    });

    shape.addEventListener("pointerdown", (event) => {
      if (event.pointerType !== "touch") {
        return;
      }
      shape.dataset.touchPressed = "true";
    });

    for (const eventName of ["pointerup", "pointercancel", "pointerleave", "lostpointercapture"]) {
      shape.addEventListener(eventName, () => {
        shape.dataset.touchPressed = "false";
      });
    }

    shape.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();
      selectRegion(shape.dataset.regionId);
    });
  }

  renderSelectedRegionSummary(selectedRegion);
}

function renderSelectedRegionSummary(region) {
  const boss = MONSTER_LIBRARY.find((monster) => monster.id === region.bossId);
  const specialMonster = MONSTER_LIBRARY.find((monster) => monster.id === region.specialMonsterId);
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
      <strong>亲属部队</strong>
      <span class="card-note">${specialMonster?.name || region.specialMonsterId}</span>
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
  const boss = MONSTER_LIBRARY.find((monster) => monster.id === region.bossId);
  const specialMonster = MONSTER_LIBRARY.find((monster) => monster.id === region.specialMonsterId);

  elements.prepRegionName.textContent = getRegionTileLabel(region);
  elements.prepRegionMeta.textContent = `镇守 Boss：${boss?.name || region.bossId} · 亲属部队：${specialMonster?.name || region.specialMonsterId} · 战斗时长 ${Math.round(region.durationSeconds / 60)} 分钟 · ${getRewardMeta(region)}`;
  elements.prepRegionDescription.textContent = region.description;
  elements.prepSelectedDifficulty.textContent = selectedDifficulty.name;
  elements.prepRuleText.textContent = getLoadoutRuleDescription();
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

  renderLoadout();
}

function renderLoadout() {
  const loadout = getLoadout();
  const equipped = loadout.skillIds;

  if (elements.prepSlotSummary) {
    elements.prepSlotSummary.textContent = `技能槽 ${equipped.length} / ${loadout.skillSlots}`;
  }

  // 槽位区：固有技能 + 已装备（可点击卸下）+ 空位 + 未开放的锁定位。
  if (elements.loadoutSlots) {
    const innateCards = INNATE_SKILL_IDS.map((skillId) => {
      const skill = getSkillDefinition(skillId);
      return `
        <div class="loadout-slot is-innate">
          <strong>${skill?.name || skillId}</strong>
          <small>固有 · 不占槽</small>
        </div>
      `;
    });

    const equippedCards = equipped.map((skillId) => {
      const skill = getSkillDefinition(skillId);
      return `
        <button class="loadout-slot" data-unequip-skill="${skillId}" title="点击卸下">
          <strong>${skill?.name || skillId}</strong>
          <small>已装配 · 点击卸下</small>
        </button>
      `;
    });

    const emptyCards = Array.from({ length: Math.max(0, loadout.skillSlots - equipped.length) }, () => `
      <div class="loadout-slot is-empty">
        <small>空槽位 · 从下方赐福中选择</small>
      </div>
    `);

    const lockedCards = Array.from({ length: Math.max(0, MAX_SKILL_SLOTS - loadout.skillSlots) }, () => `
      <div class="loadout-slot is-locked">
        <small>未开放 · 可在研究所扩充</small>
      </div>
    `);

    elements.loadoutSlots.innerHTML = [...innateCards, ...equippedCards, ...emptyCards, ...lockedCards].join("");

    for (const button of elements.loadoutSlots.querySelectorAll("[data-unequip-skill]")) {
      button.addEventListener("click", () => {
        const skillId = button.dataset.unequipSkill;
        progress = setLoadoutSkills(progress, equipped.filter((item) => item !== skillId));
        saveProgress(progress);
        renderPersistentPanels();
        renderWarPrep();
        showToast(`已卸下：${getSkillDefinition(skillId)?.name || skillId}`);
      });
    }
  }

  // 赐福列表：已获赐福可装配，未获得的显示来源区域。
  if (elements.loadoutBlessings) {
    const slotsFull = equipped.length >= loadout.skillSlots;

    elements.loadoutBlessings.innerHTML = BLESSING_LIBRARY.map((blessing) => {
      const granted = isBlessingGranted(progress.world, blessing.id);
      const equippableSkills = getBlessingEquippableSkillIds(blessing.id);

      if (!granted) {
        const region = getRegionDefinition(blessing.sourceRegionId);
        return `
          <div class="blessing-option is-locked">
            <strong>${blessing.name}</strong>
            <span class="card-note">尚未获得这份赐福。</span>
            <small>来源：${region ? getRegionTileLabel(region) : blessing.sourceRegionId}</small>
          </div>
        `;
      }

      // 主角自身：固有技能不可装配，但其挂靠技能可以。
      const selectable = equippableSkills.filter((skillId) => !equipped.includes(skillId));
      const alreadyEquipped = equippableSkills.filter((skillId) => equipped.includes(skillId));

      if (equippableSkills.length === 0) {
        return `
          <div class="blessing-option">
            <strong>${blessing.name}</strong>
            <span class="card-note">${blessing.description}</span>
            <small>固有力量 · 无需装配</small>
          </div>
        `;
      }

      const skillNames = equippableSkills
        .map((skillId) => getSkillDefinition(skillId)?.name || skillId)
        .join("、");
      const stateClass = alreadyEquipped.length > 0 ? "is-equipped" : slotsFull && selectable.length > 0 ? "is-full" : "";
      const canEquip = selectable.length > 0 && !slotsFull;
      const footnote = alreadyEquipped.length > 0
        ? `已装配 ${alreadyEquipped.length} / ${equippableSkills.length}`
        : slotsFull
          ? "技能槽已满"
          : "点击装配";

      return `
        <button class="blessing-option ${stateClass}" data-equip-blessing="${blessing.id}" ${canEquip ? "" : "disabled"}>
          <strong>${blessing.name}</strong>
          <span class="card-note">${blessing.description}</span>
          <small>${skillNames} · ${footnote}</small>
        </button>
      `;
    }).join("");

    for (const button of elements.loadoutBlessings.querySelectorAll("[data-equip-blessing]")) {
      button.addEventListener("click", () => {
        const blessingId = button.dataset.equipBlessing;
        const next = getBlessingEquippableSkillIds(blessingId).find((skillId) => !equipped.includes(skillId));
        if (!next) {
          return;
        }
        progress = setLoadoutSkills(progress, [...equipped, next]);
        saveProgress(progress);
        renderPersistentPanels();
        renderWarPrep();
        showToast(`已装配：${getSkillDefinition(next)?.name || next}`);
      });
    }
  }

  // 本源槽：P3 内容，槽位为 0 时整段隐藏。
  if (elements.loadoutEssenceSection) {
    elements.loadoutEssenceSection.hidden = loadout.essenceSlots <= 0;
  }
}

function renderSkillSlotShop() {
  const loadout = getLoadout();
  const cost = getSkillSlotCost(loadout.skillSlots);
  const affordable = cost !== null && progress.meta.totalCoins >= cost;

  if (elements.labSlotBadge) {
    elements.labSlotBadge.textContent = `${loadout.skillSlots} / ${MAX_SKILL_SLOTS}`;
  }

  if (!elements.skillSlotShop) {
    return;
  }

  elements.skillSlotShop.innerHTML = `
    <article class="shop-card">
      <div>
        <strong>技能槽扩充</strong>
        <p class="card-note">提高出战时可装配的赐福技能数量。拥有的赐福很多，但能带上场的始终有限。</p>
        <p class="card-note">当前上限：${loadout.skillSlots} / ${MAX_SKILL_SLOTS}</p>
      </div>
      <footer>
        <span>${cost === null ? "已达上限" : `需要 ${cost} 植物能量`}</span>
        <button class="talent-button" data-expand-slot="1" ${cost === null || !affordable ? "disabled" : ""}>
          ${cost === null ? "已满" : `扩充 ${cost}`}
        </button>
      </footer>
    </article>
  `;

  for (const button of elements.skillSlotShop.querySelectorAll("[data-expand-slot]")) {
    button.addEventListener("click", () => {
      const slotCost = getSkillSlotCost(getLoadout().skillSlots);
      if (slotCost === null || progress.meta.totalCoins < slotCost) {
        return;
      }
      progress.meta.totalCoins -= slotCost;
      progress = expandSkillSlots(progress, 1);
      saveProgress(progress);
      renderPersistentPanels();
      renderLab();
      showToast(`技能槽扩充至 ${getLoadout().skillSlots}`);
    });
  }
}

function renderLab() {
  const grantedBlessings = getGrantedBlessings();
  // 专属研究以「已获赐福的技能」为门槛，而不是是否装配。
  const unlockedSkillIds = new Set(getGrantedSkillIds(progress.world));

  elements.talentList.innerHTML = TALENT_LIBRARY.map((talent) => {
    const currentLevel = progress.talents[talent.id] || 0;
    const canUpgrade = currentLevel < talent.maxLevel;
    const cost = getTalentCost(talent, currentLevel);
    const affordable = progress.meta.totalCoins >= cost;
    return `
      <article class="talent-card">
        <div>
          <strong>${talent.name}</strong>
          <p class="card-note">${getTalentDescription(talent)}</p>
          <p class="card-note">${getTalentValueText(talent, currentLevel)}</p>
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

  renderSkillSlotShop();

  elements.skillUnlockShop.innerHTML = grantedBlessings
    .map((blessing) => {
      const skill = getSkillDefinition(blessing.skillId);
      const signature = (skill?.exclusiveUpgrades || []).find((exclusive) =>
        (exclusive.description || "").includes("【专属】"),
      );
      const signatureUnlocked = signature ? progress.unlocks.exclusives[signature.id] : false;
      const signatureLine = signature
        ? `<p class="card-note">签名专属：${signature.name}${signatureUnlocked ? "（已研究）" : "（待研究）"}</p>`
        : "";
      const equipped = getLoadout().skillIds.includes(blessing.skillId);
      const statusText = blessing.innate ? "固有力量" : equipped ? "已装配出战" : "已获赐福 · 未装配";
      return `
        <article class="shop-card">
          <div>
            <strong>${blessing.name}</strong>
            <p class="card-note">${blessing.description}</p>
            <p class="card-note">赐福技能：${skill?.name || "未知技能"}</p>
            ${signatureLine}
          </div>
          <footer>
            <span>${statusText}</span>
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
  const unlockedSkillIds = new Set(getGrantedSkillIds(progress.world));

  elements.libraryCharacters.innerHTML = BLESSING_LIBRARY.map((blessing) => {
    const granted = isBlessingGranted(progress.world, blessing.id);
    return createCodexCard(
      blessing.name,
      granted ? blessing.description : "尚未获得这份赐福，对应的力量仍在沉眠。",
      granted ? getSkillDefinition(blessing.skillId)?.name || "已记录" : "未获赐福",
      !granted,
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
    return createCodexCard(getRegionTileLabel(region), known ? region.description : "该区域仍被迷雾遮蔽，需先从相邻区域推进。", getRewardMeta(region), !known);
  }).join("");

  elements.libraryLandscapes.innerHTML = LANDSCAPE_LIBRARY.map((landscape) => {
    const unlocked = progress.world.unlockedLandscapes.includes(landscape.id);
    return createCodexCard(landscape.name, unlocked ? landscape.description : "尚未恢复该景观。", unlocked ? landscape.bonusText : "未恢复", !unlocked);
  }).join("");

  elements.codexBoosts.innerHTML = BOOST_CODEX.map((boost) => createCodexCard(boost.name, boost.description, boost.type, false)).join("");
}

function openIntroStory() {
  openStoryScene({
    eyebrow: "Prologue",
    title: "花园的最后一夜",
    paragraphs: [
      "害虫星球的远征军穿过云层落了下来。它们不杀守卫，而是改写守卫——藤钟、琥壳、月鳞、虚灯，花园十支血脉被逐一夺走，昨天还在守门的同伴，今天成了镇守各区的敌人。",
      "常规的抵抗已经证明无效。于是花园里的大家做了最后一件事：把各自剩下的力量全部凝聚起来，送出一个载体——一只小精灵。",
      "它不是花园派出的士兵，它是花园所有人剩下的部分。那些力量本来就在它身体里，只是一次用不出来，要随着战线推进一点点重新醒过来。",
      "现在，先在众愿苗圃顶住第一波虫潮。这里是防线还没被击穿的最后一片土地。",
    ],
    primaryLabel: "保卫花园",
    presentation: "cinematic",
    sceneTheme: "prologue",
    typewriter: true,
    revealPrimaryAfterTypewriter: true,
    primaryAction: () => {
      progress = updateWorldState(progress, {
        introSeen: true,
        selectedRegionId: INITIAL_REGION_ID,
        pendingRegionId: INITIAL_REGION_ID,
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

function openStoryScene({
  eyebrow,
  title,
  paragraphs,
  primaryLabel,
  primaryAction,
  secondaryLabel,
  secondaryAction,
  presentation = "card",
  sceneTheme = "default",
  typewriter = false,
  revealPrimaryAfterTypewriter = false,
}) {
  setActiveView("menu");
  elements.storyScreen.classList.toggle("is-cinematic", presentation === "cinematic");
  elements.storyScreen.dataset.scene = sceneTheme;
  elements.storyEyebrow.textContent = eyebrow;
  elements.storyTitle.textContent = title;
  storyTypewriterParagraphs = [...paragraphs];
  storyRevealPrimaryAfterTypewriter = revealPrimaryAfterTypewriter;
  clearStoryTypewriterTimer();
  storyTypewriterActive = false;
  elements.storyBody.dataset.typing = "false";
  elements.storyScreen.dataset.typing = "false";
  elements.storyPrimaryButton.textContent = primaryLabel;
  elements.storyPrimaryButton.hidden = revealPrimaryAfterTypewriter && typewriter;
  elements.storySecondaryButton.textContent = secondaryLabel || "返回";
  elements.storySecondaryButton.hidden = !secondaryLabel;
  storyPrimaryHandler = primaryAction || null;
  storySecondaryHandler = secondaryAction || null;
  showOverlay("storyScreen");

  if (typewriter) {
    startStoryTypewriter(paragraphs);
  } else {
    finishStoryTypewriter(paragraphs);
  }
}

// 教学关的专用缩放：玩家此时只有 1–2 个技能、几乎没有成长项，
// 不能套用常规战役的敌人与 Boss 强度。
//
// 注意 spawnScale 是**放大**而不是缩小：难度 1 的基准刷怪率只有 0.42
// （见 data.js 的 getDifficultyProfile），本身已经相当稀疏。再往下调会让
// 整波只刷出十几只怪，击杀目标直接变成不可能完成。教学关需要的是
// "大量很弱的怪"——有东西可打、目标可达，而不是"很少但很硬的怪"。
//
// enemySpeedScale 必须单列：enemyScale 同时作用于生命、伤害和**移速**，
// 而难度 1 的基准移速倍率只有 0.64。若让 0.7 的削弱也压在移速上，
// 露珠软虫的实际速度只有 38 × 0.64 × 0.7 ≈ 17 px/s，
// 在 9 倍大的地图上要走 40 秒以上才能到玩家身边——大部分怪在本波结束前
// 根本走不过来，于是"刷出了很多怪"却"打不到几只"。
const TUTORIAL_PROFILE_SCALES = Object.freeze({
  enemyScale: 0.7,
  enemySpeedScale: 1.95,
  spawnScale: 1.6,
  bossScale: 0.45,
  expScale: 1.5,
  energyScale: 1,
});

function buildRunConfig(regionId, difficultyId, tutorial = false) {
  const region = getRegionDefinition(regionId) || GARDEN_REGIONS[0];
  const difficulty = getWarDifficulty(difficultyId);
  // 局内可用技能完全由装配决定：固有技能 + 已装配的赐福技能。
  const allowedSkillIds = getEquippedSkillIds().filter((skillId) => getSkillDefinition(skillId));
  // 起始技能优先用首个装配技能，未装配时回落到固有技能。
  const initialSkillId = allowedSkillIds[0] || INNATE_SKILL_IDS[0];

  return {
    region,
    difficulty,
    options: {
      difficultyLevel: region.bossTier,
      bossId: region.bossId,
      roundDurationSeconds: region.durationSeconds,
      initialSkillId,
      allowedSkillIds,
      profileScales: tutorial ? TUTORIAL_PROFILE_SCALES : difficulty,
      energyRewardScale: tutorial ? 0.9 : 0.95 + region.index * 0.03,
      mode: tutorial ? "tutorial" : "regionWar",
      characterId: PROTAGONIST_BLESSING_ID,
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
  const config = buildRunConfig(INITIAL_REGION_ID, "normal", true);
  startRunConfig(config);
}

function startSelectedWar() {
  const region = getRegionDefinition(selectedRegionId);
  if (!region || !canDeployToRegion(region)) {
    return;
  }

  const config = buildRunConfig(selectedRegionId, selectedWarDifficultyId, false);
  startRunConfig(config);
}

function startSelectedBossTest() {
  const region = getRegionDefinition(selectedRegionId) || GARDEN_REGIONS[0];
  const config = buildRunConfig(region.id, selectedWarDifficultyId, false);
  config.options = {
    ...config.options,
    mode: "bossTest",
    roundDurationSeconds: 30,
    energyRewardScale: 0,
  };
  config.difficulty = {
    ...config.difficulty,
    name: `${config.difficulty.name} · Boss 模拟`,
  };
  startRunConfig(config);
}

function handleRunEnd(result) {
  const region = result.regionId ? getRegionDefinition(result.regionId) : null;
  const difficulty = activeRunConfig?.difficulty || getWarDifficulty(selectedWarDifficultyId);

  if (result.mode === "bossTest") {
    elements.resultTitle.textContent = result.victory ? "模拟完成" : result.abandoned ? "模拟中止" : "模拟失败";
    elements.resultSummary.innerHTML = [
      ["测试区域", region?.name || "模拟关卡"],
      ["Boss 阶位", region?.bossTier ? `${region.bossTier}` : "-"],
      ["测试难度", difficulty.name],
      ["战斗时长", formatDuration(result.survivalTime)],
      ["角色等级", `Lv.${result.level}`],
      ["击败害虫", `${result.kills}`],
      ["进度写入", "否"],
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
    updateSessionLabel("Boss 模拟结算", "本次模拟不计入资源、图鉴或花园解放进度。");
    return;
  }

  progress = applyRunResult(progress, result);
  renderPersistentPanels();

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
        title: "众愿苗圃守住了",
        paragraphs: [
          "镇守者被击退的那一刻，苗圃里有一份力量醒了过来——那是曾经凝聚出你的人之一。它把自己的赐福交到你手上。",
          "这就是接下来的规则：每解放一片区域，就有一位旧日守护者恢复神智，并把力量作为赐福交给你。出战前能带上场的赐福有限，带什么由你决定。",
          "主菜单的四大入口已经开放。新的区域必须从相邻区域逐步推进，你也可以先去研究所扩充技能槽、整理战力。",
        ],
        presentation: "cinematic",
        sceneTheme: "liberation",
        typewriter: true,
        revealPrimaryAfterTypewriter: true,
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
      title: "众愿苗圃失守了",
      paragraphs: [
        "最后一片苗圃被虫潮淹过去了。凝聚出你的那些力量还在，所以这件事可以重来。",
        "再试一次：用 W A S D 移动、Space 闪现躲开冲上来的虫子，技能会自动开火。撑过三波并击退镇守者就算守住。",
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
      selectedWarDifficultyId,
    });
    saveProgress(progress);
    renderPersistentPanels();
    setActiveView("menu");
    openStoryScene({
      eyebrow: "Victory",
      title: `${getRegionTileLabel(region)} 已解放`,
      paragraphs: [
        `镇守 ${getRegionTileLabel(region)} 的 ${MONSTER_LIBRARY.find((monster) => monster.id === region.bossId)?.name || "Boss"} 已被击退。`,
        `${getRewardMeta(region)}。新的相邻区域现在已经对你开放。`,
      ],
      presentation: "cinematic",
      sceneTheme: "victory",
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
  renderTouchPauseButton();
}

function setActiveView(viewName) {
  elements.menuView.classList.toggle("is-active", viewName === "menu");
  elements.gameView.classList.toggle("is-active", viewName === "game");
  renderTouchPauseButton();
  resizeGameCanvas();
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

function showToast(_message) {
  /* Toast notifications disabled per user request */
}

function getViewportBounds() {
  const viewport = window.visualViewport;
  return {
    width: Math.max(1, Math.round(viewport?.width || window.innerWidth || document.documentElement.clientWidth || MIN_GAME_VIEWPORT_WIDTH)),
    height: Math.max(1, Math.round(viewport?.height || window.innerHeight || document.documentElement.clientHeight || MIN_GAME_VIEWPORT_HEIGHT)),
  };
}

function getGameStageSize(availableWidth, availableHeight) {
  return {
    width: Math.max(1, Math.round(availableWidth)),
    height: Math.max(1, Math.round(availableHeight)),
  };
}

function resizeGameCanvas() {
  const viewIsActive = elements.gameView.classList.contains("is-active");
  const viewport = getViewportBounds();
  const availableWidth = viewIsActive ? Math.max(1, elements.gameView.clientWidth) : viewport.width;
  const availableHeight = viewIsActive ? Math.max(1, elements.gameView.clientHeight) : viewport.height;
  const stage = getGameStageSize(availableWidth, availableHeight);
  const logicalWidth = Math.max(MIN_GAME_VIEWPORT_WIDTH, stage.width);
  const logicalHeight = Math.max(MIN_GAME_VIEWPORT_HEIGHT, stage.height);

  elements.gameStage.style.width = `${stage.width}px`;
  elements.gameStage.style.height = `${stage.height}px`;
  game.resizeViewport(logicalWidth, logicalHeight);
  game.renderIdleFrame();
}
