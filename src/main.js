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
  updateSettings,
  updateWorldState,
} from "./storage.js";
import { RENDERER_EXTERNAL_ASSET_PATHS } from "./pixi-renderer.js";

const INITIAL_REGION_ID = GARDEN_REGIONS[0].id;
const MIN_GAME_VIEWPORT_WIDTH = 640;
const MIN_GAME_VIEWPORT_HEIGHT = 360;
const TOUCH_JOYSTICK_MAX_OFFSET = 46;
const MAP_TOUCH_TAP_THRESHOLD = 10;
const STORY_TYPEWRITER_CHARACTER_DELAY = 32;
const STORY_TYPEWRITER_SHORT_PAUSE = 120;
const STORY_TYPEWRITER_LONG_PAUSE = 260;

const STATUS_LABELS = {
  menu: "待机",
  running: "进行中",
  paused: "已暂停",
  levelup: "升级中",
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
  hudExpFill: document.querySelector("#hudExpFill"),
  hudExpText: document.querySelector("#hudExpText"),
  eyeComfortButton: document.querySelector("#eyeComfortButton"),
  speedToggleButton: document.querySelector("#speedToggleButton"),
  touchControls: document.querySelector("#touchControls"),
  touchJoystick: document.querySelector("#touchJoystick"),
  touchJoystickThumb: document.querySelector("#touchJoystickThumb"),
  touchBlinkButton: document.querySelector("#touchBlinkButton"),
  touchPauseButton: document.querySelector("#touchPauseButton"),
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
    onRunEnd: handleRunEnd,
    onOverlayChange: showOverlay,
    onSessionLabel: updateSessionLabel,
    onSpeedChange: renderSpeedButton,
    onToast: showToast,
  },
});
game.setEyeComfortMode(progress.settings?.eyeComfortMode ?? false);

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
    cooldown: "0%",
    blink: "1 / 1",
    expPickupRange: "96",
    kills: "0",
    skills: [],
  });
  renderSpeedButton(1);
  renderEyeComfortButton(progress.settings?.eyeComfortMode ?? false);

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
  const directionX = distance > 0 ? deltaX / distance : 0;
  const directionY = distance > 0 ? deltaY / distance : 0;
  const offsetX = directionX * limitedDistance;
  const offsetY = directionY * limitedDistance;
  const strength = TOUCH_JOYSTICK_MAX_OFFSET > 0 ? limitedDistance / TOUCH_JOYSTICK_MAX_OFFSET : 0;

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

  elements.touchBlinkButton.addEventListener("click", () => {
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

function renderHud(snapshot) {
  renderTouchPauseButton();
  elements.hudTimerText.textContent = snapshot.time === "Boss" ? "Boss 战" : `倒计时 ${snapshot.time}`;
  elements.hudHealthText.textContent = `生命 ${snapshot.health}`;
  elements.hudLevelText.textContent = `LV ${snapshot.level}`;
  elements.hudExpText.textContent = snapshot.exp;
  elements.hudExpFill.style.width = `${Math.max(0, Math.min(100, (snapshot.expRatio || 0) * 100))}%`;

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
}

const SPECIAL_LEVEL_CHOICE_IDS = new Set(["monsterPressure", "minuteVacuum", "projectileOverload", "summonOverload"]);

function getLevelChoiceVariant(choice) {
  if (choice.type === "exclusive") {
    return "exclusive";
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
    ? `花园仍有 ${GARDEN_REGIONS.length - liberatedCount} 片区域被害虫控制，你的下一次部署将从 ${getRegionTileLabel(selectedRegion)} 开始。`
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
  const unlockedCharacters = getUnlockedCharacters();
  const selectedCharacter = getCharacterDefinition(selectedCharacterId) || unlockedCharacters[0];
  const boss = MONSTER_LIBRARY.find((monster) => monster.id === region.bossId);
  const specialMonster = MONSTER_LIBRARY.find((monster) => monster.id === region.specialMonsterId);

  elements.prepRegionName.textContent = getRegionTileLabel(region);
  elements.prepRegionMeta.textContent = `镇守 Boss：${boss?.name || region.bossId} · 亲属部队：${specialMonster?.name || region.specialMonsterId} · 战斗时长 ${Math.round(region.durationSeconds / 60)} 分钟 · ${getRewardMeta(region)}`;
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
      "平静的夜里，来自虫星的陨群穿过云层，把 36 片花园区域逐一污染。花朵、植物与益虫守卫先后失联，只剩最中心的花心还在发光。",
      "濒临枯竭的花心唤醒了最后一只小精灵。它在风中第一次听见花园的语言，并以风元素凝成灵箭，准备顶住首轮虫潮。",
      "接下来是一场三分钟的新手保卫战。失败时花园会被攻陷，胜利后才会开启完整的花园战争主菜单。",
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
        presentation: "cinematic",
        sceneTheme: "liberation",
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

function showToast(message) {
  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = message;
  elements.toastLayer.appendChild(node);
  window.setTimeout(() => node.remove(), 2200);
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