import * as PIXI from "pixi.js";
import { ARENA, getSkillDefinition } from "./data.js";

const SCREEN_BLEND = typeof PIXI.BLEND_MODES.SCREEN === "number" ? PIXI.BLEND_MODES.SCREEN : PIXI.BLEND_MODES.ADD;

// Visual width of the 菌杯雾雷 mist band. Mirrors SPORE_RING_THICKNESS in game.js, which
// is the width actually used for hit detection.
const SPORE_RING_BAND_WIDTH = 42;
const DECORATION_STEP_X = 176;
const DECORATION_STEP_Y = 148;
const MAX_PARTICLES = 220;
const MAX_RENDER_RESOLUTION = 1.5;
const PLAYER_VISUAL_SCALE = 0.76;
const NORMAL_ENEMY_VISUAL_SCALE = 0.8;
const BOSS_VISUAL_SCALE = 0.5;
const DEFAULT_VISUAL_PROFILE = Object.freeze({
  canvasFilter: "none",
  groundBaseColor: "#b9e08a",
  groundPatchColor: "rgba(255,255,255,0.07)",
  groundBorderColor: "rgba(111, 157, 78, 0.24)",
  particleBudget: 28,
  particleAlphaScale: 1,
  particleScale: 1,
  particleLayerAlpha: 1,
  particleBlur: 2.2,
  fieldGlowAlpha: 1,
  fieldGlowBlur: 4,
  effectLayerAlpha: 1,
  motionRate: 1,
  spawnRateScale: 1,
});
const EYE_COMFORT_VISUAL_PROFILE = Object.freeze({
  canvasFilter: "brightness(0.88) saturate(0.82) contrast(0.94)",
  groundBaseColor: "#96ae76",
  groundPatchColor: "rgba(255, 249, 224, 0.035)",
  groundBorderColor: "rgba(97, 123, 79, 0.18)",
  particleBudget: 12,
  particleAlphaScale: 0.58,
  particleScale: 0.9,
  particleLayerAlpha: 0.72,
  particleBlur: 1.4,
  fieldGlowAlpha: 0.72,
  fieldGlowBlur: 2.6,
  effectLayerAlpha: 0.76,
  motionRate: 0.68,
  spawnRateScale: 0.6,
});

const EXTERNAL_ASSET_DEFS = {
  playerFairy: { path: "./assets/sprites/fairy-scout.svg", baseRadius: 40 },
  playerSunblossom: { path: "./assets/sprites/player-sunblossom.svg", baseRadius: 40 },
  playerFoambud: { path: "./assets/sprites/player-foambud.svg", baseRadius: 40 },
  playerPetalwing: { path: "./assets/sprites/player-petalwing.svg", baseRadius: 40 },
  playerThornwarden: { path: "./assets/sprites/player-thornwarden.svg", baseRadius: 40 },
  playerDewcaller: { path: "./assets/sprites/player-dewcaller.svg", baseRadius: 40 },
  playerStormbud: { path: "./assets/sprites/player-stormbud.svg", baseRadius: 40 },
  playerMushglen: { path: "./assets/sprites/player-mushglen.svg", baseRadius: 40 },
  playerVinewhisper: { path: "./assets/sprites/player-vinewhisper.svg", baseRadius: 40 },
  playerCometseed: { path: "./assets/sprites/player-cometseed.svg", baseRadius: 40 },
  playerRibbonmoth: { path: "./assets/sprites/player-ribbonmoth.svg", baseRadius: 40 },
  playerLotuskeeper: { path: "./assets/sprites/player-lotuskeeper.svg", baseRadius: 40 },
  enemyBugRound: { path: "./assets/sprites/bug-minion.svg", baseRadius: 72 },
  enemyBugTall: { path: "./assets/sprites/bug-minion-tall.svg", baseRadius: 72 },
  enemyBugStout: { path: "./assets/sprites/bug-minion-stout.svg", baseRadius: 76 },
  bossBug: { path: "./assets/sprites/bug-boss.svg", baseRadius: 60 },
  bossAura: { path: "./assets/sprites/boss-aura.svg", baseRadius: 34 },
  projectileArrow: { path: "./assets/sprites/projectile-arrow.svg", baseRadius: 44 },
  projectileSword: { path: "./assets/sprites/projectile-sword.svg", baseRadius: 50 },
  projectileOrb: { path: "./assets/sprites/projectile-orb.svg", baseRadius: 38 },
  projectileThorn: { path: "./assets/sprites/projectile-thorn.svg", baseRadius: 44 },
  projectileMeteor: { path: "./assets/sprites/projectile-meteor.svg", baseRadius: 46 },
  projectileRibbon: { path: "./assets/sprites/projectile-ribbon.svg", baseRadius: 46 },
  fieldDew: { path: "./assets/sprites/field-dew-ring.svg", baseRadius: 44 },
  fieldStorm: { path: "./assets/sprites/field-storm-sigil.svg", baseRadius: 44 },
  fieldMushroom: { path: "./assets/sprites/field-mushroom-patch.svg", baseRadius: 44 },
  fieldMeteor: { path: "./assets/sprites/field-meteor-rune.svg", baseRadius: 44 },
  enemyBulletPetal: { path: "./assets/sprites/enemy-bullet-petal.svg", baseRadius: 54 },
  enemyBulletSeed: { path: "./assets/sprites/enemy-bullet-seed.svg", baseRadius: 54 },
  enemyBulletShard: { path: "./assets/sprites/enemy-bullet-shard.svg", baseRadius: 54 },
  enemyBulletMoth: { path: "./assets/sprites/enemy-bullet-moth.svg", baseRadius: 52 },
  enemyBulletLantern: { path: "./assets/sprites/enemy-bullet-lantern.svg", baseRadius: 58 },
};

const PLAYER_CHARACTER_TEXTURES = Object.freeze({
  spriteScout: "playerFairy",
  sunblossom: "playerSunblossom",
  foambud: "playerFoambud",
  petalwing: "playerPetalwing",
  thornwarden: "playerThornwarden",
  dewcaller: "playerDewcaller",
  stormbud: "playerStormbud",
  mushglen: "playerMushglen",
  vinewhisper: "playerVinewhisper",
  cometseed: "playerCometseed",
  ribbonmoth: "playerRibbonmoth",
  lotuskeeper: "playerLotuskeeper",
});

const ADVANCED_CHARACTER_VISUALS = Object.freeze({
  glassprout: ["#7fd8ff", "#2d7898", "prism"],
  honeybell: ["#f0b95f", "#935f24", "bell"],
  rainroot: ["#78d4b5", "#3f7951", "root"],
  orchidnova: ["#d69cff", "#744ca6", "star"],
  bramblebee: ["#9bcf63", "#4c7b31", "wing"],
  dewdropper: ["#8adfd6", "#3e817a", "drop"],
  stormlily: ["#9fb8ff", "#3f5ca6", "bolt"],
  moonwell: ["#ef91c2", "#8c315a", "moon"],
  lanternbud: ["#f4c86d", "#9e7422", "lantern"],
  harvestdoll: ["#ee7778", "#9b2630", "crescent"],
  seedvault: ["#badb69", "#657d2e", "seed"],
  pearlshell: ["#f1d18a", "#8f6428", "pearl"],
  clockivy: ["#7bc489", "#3a6f4b", "clock"],
  operamoth: ["#c6a0f2", "#6750a7", "moth"],
  antlerleaf: ["#73d1ff", "#2c6f9a", "antler"],
  sporecup: ["#b8c978", "#607333", "cup"],
  tulipbolt: ["#ffab86", "#a34d2d", "bolt"],
  eclipsebud: ["#f073a4", "#8d2651", "eclipse"],
  blueflame: ["#92a7ff", "#344999", "flame"],
  scissorvine: ["#ef6872", "#992334", "scissor"],
  royalbud: ["#a8d46b", "#587c2f", "crown"],
  ambergear: ["#f1b86b", "#8d5720", "gear"],
  aurorapetal: ["#c9a9ff", "#7050b0", "aurora"],
  grandprism: ["#72cbff", "#2e6f9a", "prism"],
});

export const RENDERER_EXTERNAL_ASSET_PATHS = Object.freeze(Object.values(EXTERNAL_ASSET_DEFS).map((definition) => definition.path));

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function mixColors(left, right, amount = 0.5) {
  const leftColor = typeof left === "number" ? left : parseColor(left).color;
  const rightColor = typeof right === "number" ? right : parseColor(right).color;
  const leftRed = (leftColor >> 16) & 0xff;
  const leftGreen = (leftColor >> 8) & 0xff;
  const leftBlue = leftColor & 0xff;
  const rightRed = (rightColor >> 16) & 0xff;
  const rightGreen = (rightColor >> 8) & 0xff;
  const rightBlue = rightColor & 0xff;
  const red = Math.round(leftRed + (rightRed - leftRed) * amount);
  const green = Math.round(leftGreen + (rightGreen - leftGreen) * amount);
  const blue = Math.round(leftBlue + (rightBlue - leftBlue) * amount);
  return (red << 16) + (green << 8) + blue;
}

function hashString(value) {
  let hash = 0;
  const text = String(value || "");
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) | 0;
  }
  return hash;
}

function fract(value) {
  return value - Math.floor(value);
}

function hashNoise(x, y, seed = 0) {
  return fract(Math.sin(x * 127.1 + y * 311.7 + seed * 19.19) * 43758.5453123);
}

function parseColor(value, fallback = 0xffffff, fallbackAlpha = 1) {
  if (!value || typeof value !== "string") {
    return { color: fallback, alpha: fallbackAlpha };
  }

  if (value.startsWith("#")) {
    const hex = value.slice(1);
    if (hex.length === 3) {
      return {
        color: Number.parseInt(hex.split("").map((char) => char + char).join(""), 16),
        alpha: 1,
      };
    }
    if (hex.length === 6) {
      return {
        color: Number.parseInt(hex, 16),
        alpha: 1,
      };
    }
    if (hex.length === 8) {
      return {
        color: Number.parseInt(hex.slice(0, 6), 16),
        alpha: Number.parseInt(hex.slice(6, 8), 16) / 255,
      };
    }
  }

  const rgba = value.match(/rgba?\(([^)]+)\)/i);
  if (rgba) {
    const [red, green, blue, alpha = "1"] = rgba[1].split(",").map((part) => part.trim());
    return {
      color: (Number(red) << 16) + (Number(green) << 8) + Number(blue),
      alpha: Number(alpha),
    };
  }

  return { color: fallback, alpha: fallbackAlpha };
}

function beginFill(graphics, value, fallback = 0xffffff, fallbackAlpha = 1) {
  const { color, alpha } = parseColor(value, fallback, fallbackAlpha);
  graphics.beginFill(color, alpha);
}

function beginFillWithAlpha(graphics, value, alpha, fallback = 0xffffff) {
  const { color } = parseColor(value, fallback, alpha);
  graphics.beginFill(color, alpha);
}

function setLine(graphics, width, value, alignment = 0.5) {
  const { color, alpha } = parseColor(value, 0xffffff, 1);
  graphics.lineStyle({ width, color, alpha, alignment });
}

function drawArcStroke(graphics, x, y, radius, startAngle, endAngle, steps = 24) {
  for (let index = 0; index <= steps; index += 1) {
    const ratio = index / steps;
    const angle = startAngle + (endAngle - startAngle) * ratio;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (index === 0) {
      graphics.moveTo(px, py);
    } else {
      graphics.lineTo(px, py);
    }
  }
}

function drawPolyline(graphics, points, close = false) {
  if (points.length === 0) {
    return;
  }
  graphics.moveTo(points[0][0], points[0][1]);
  for (let index = 1; index < points.length; index += 1) {
    graphics.lineTo(points[index][0], points[index][1]);
  }
  if (close) {
    graphics.closePath();
  }
}

function drawStar(graphics, x, y, outerRadius, innerRadius, points = 5) {
  const vertices = [];
  for (let index = 0; index < points * 2; index += 1) {
    const angle = -Math.PI / 2 + (Math.PI * index) / points;
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    vertices.push([x + Math.cos(angle) * radius, y + Math.sin(angle) * radius]);
  }
  drawPolyline(graphics, vertices, true);
}

function drawRotatedDiamond(graphics, x, y, width, height, angle = 0) {
  const vertices = [
    [0, -height / 2],
    [width / 2, 0],
    [0, height / 2],
    [-width / 2, 0],
  ].map(([vx, vy]) => [
    x + vx * Math.cos(angle) - vy * Math.sin(angle),
    y + vx * Math.sin(angle) + vy * Math.cos(angle),
  ]);
  drawPolyline(graphics, vertices, true);
}

function drawLeaf(graphics, x, y, length, width, angle, fill) {
  const tip = [x + Math.cos(angle) * length, y + Math.sin(angle) * length];
  const left = [x + Math.cos(angle + Math.PI / 2) * width, y + Math.sin(angle + Math.PI / 2) * width];
  const bottom = [x - Math.cos(angle) * length * 0.45, y - Math.sin(angle) * length * 0.45];
  const right = [x + Math.cos(angle - Math.PI / 2) * width, y + Math.sin(angle - Math.PI / 2) * width];
  beginFill(graphics, fill);
  drawPolyline(graphics, [tip, left, bottom, right], true);
  graphics.endFill();
}

function paintFace(graphics, x, y, radius, eyeColor = "#2d3c2b") {
  beginFill(graphics, eyeColor);
  graphics.drawCircle(x - radius * 0.28, y - radius * 0.08, Math.max(2, radius * 0.12));
  graphics.drawCircle(x + radius * 0.28, y - radius * 0.08, Math.max(2, radius * 0.12));
  graphics.endFill();
  setLine(graphics, Math.max(1.5, radius * 0.08), eyeColor);
  drawArcStroke(graphics, x, y + radius * 0.18, radius * 0.24, 0.12 * Math.PI, 0.88 * Math.PI);
}

function paintNormalEnemy(graphics, x, y, radius, enemy) {
  beginFill(graphics, enemy.color);
  graphics.drawCircle(x, y, radius * 0.9);
  graphics.endFill();

  beginFill(graphics, enemy.accent);
  graphics.drawEllipse(x, y - radius * 0.28, radius * 0.46, radius * 0.28);
  graphics.endFill();

  beginFill(graphics, "rgba(255,255,255,0.34)");
  graphics.drawCircle(x - radius * 0.24, y - radius * 0.32, radius * 0.18);
  graphics.endFill();

  paintFace(graphics, x, y + radius * 0.08, radius * 0.82);
}

function paintAdvancedPlayer(graphics, x, y, radius, visual) {
  const [color, accent, motif] = visual;
  beginFill(graphics, "rgba(42, 54, 35, 0.18)");
  graphics.drawEllipse(x, y + radius * 0.62, radius * 0.72, radius * 0.22);
  graphics.endFill();
  beginFill(graphics, color);
  graphics.drawEllipse(x, y + radius * 0.08, radius * 0.5, radius * 0.62);
  graphics.endFill();
  beginFill(graphics, accent);
  graphics.drawCircle(x, y - radius * 0.5, radius * 0.42);
  graphics.endFill();
  beginFill(graphics, "rgba(255,255,255,0.38)");
  graphics.drawCircle(x - radius * 0.16, y - radius * 0.62, radius * 0.12);
  graphics.endFill();

  if (motif === "wing" || motif === "moth" || motif === "aurora") {
    beginFill(graphics, "rgba(255,255,255,0.52)");
    graphics.drawEllipse(x - radius * 0.52, y - radius * 0.1, radius * 0.28, radius * 0.48);
    graphics.drawEllipse(x + radius * 0.52, y - radius * 0.1, radius * 0.28, radius * 0.48);
    graphics.endFill();
  } else if (motif === "prism" || motif === "pearl") {
    beginFill(graphics, "rgba(255,255,255,0.58)");
    drawRotatedDiamond(graphics, x, y - radius * 0.94, radius * 0.34, radius * 0.46);
    graphics.endFill();
  } else if (motif === "bolt") {
    beginFill(graphics, "#fff7b0");
    drawPolyline(graphics, [[x, y - radius * 1.05], [x - radius * 0.18, y - radius * 0.58], [x + radius * 0.08, y - radius * 0.58], [x - radius * 0.04, y - radius * 0.22]], false);
    graphics.endFill();
  } else if (motif === "crown") {
    beginFill(graphics, "#ffe28a");
    drawStar(graphics, x, y - radius * 0.98, radius * 0.34, radius * 0.18, 5);
    graphics.endFill();
  } else {
    for (let index = 0; index < 5; index += 1) {
      const angle = -Math.PI / 2 + (Math.PI * 2 * index) / 5;
      drawLeaf(graphics, x + Math.cos(angle) * radius * 0.18, y - radius * 0.56 + Math.sin(angle) * radius * 0.08, radius * 0.38, radius * 0.12, angle, index % 2 === 0 ? color : "rgba(255,255,255,0.68)");
    }
  }

  paintFace(graphics, x, y - radius * 0.48, radius * 0.38);
}

function paintAdvancedBossBody(graphics, x, y, radius, enemy) {
  const variant = Math.abs(hashString(enemy.shapeId || enemy.id || "boss")) % 9;
  const petalCount = 6 + (variant % 5);
  for (let index = 0; index < petalCount; index += 1) {
    const angle = (Math.PI * 2 * index) / petalCount + variant * 0.08;
    drawLeaf(graphics, x + Math.cos(angle) * radius * 0.18, y + Math.sin(angle) * radius * 0.12, radius * (0.72 + (variant % 3) * 0.08), radius * 0.2, angle, index % 2 === 0 ? enemy.detailColor : enemy.color);
  }
  beginFill(graphics, enemy.color);
  if (variant % 3 === 0) {
    drawRotatedDiamond(graphics, x, y, radius * 1.0, radius * 1.24, variant * 0.08);
  } else if (variant % 3 === 1) {
    graphics.drawEllipse(x, y, radius * 0.82, radius * 0.66);
  } else {
    drawStar(graphics, x, y, radius * 0.82, radius * 0.48, 6 + (variant % 4));
  }
  graphics.endFill();
  beginFill(graphics, enemy.accent);
  graphics.drawCircle(x, y + radius * 0.02, radius * 0.32);
  graphics.endFill();
  beginFill(graphics, "rgba(255,255,255,0.42)");
  graphics.drawCircle(x - radius * 0.16, y - radius * 0.22, radius * 0.12);
  graphics.endFill();
  paintFace(graphics, x, y + radius * 0.03, radius * 0.42, "rgba(35, 35, 42, 0.82)");
}

function paintBossBody(graphics, x, y, radius, enemy) {
  switch (enemy.shapeId) {
    case "budSentinel":
      for (let index = 0; index < 6; index += 1) {
        const angle = (Math.PI * 2 * index) / 6;
        drawLeaf(graphics, x + Math.cos(angle) * radius * 0.28, y + Math.sin(angle) * radius * 0.28, radius * 0.82, radius * 0.26, angle, enemy.detailColor);
      }
      beginFill(graphics, enemy.color);
      graphics.drawCircle(x, y, radius * 0.66);
      graphics.endFill();
      break;
    case "clockvineSerpent":
      for (let index = 0; index < 3; index += 1) {
        const offset = index - 1;
        beginFill(graphics, index === 0 ? enemy.detailColor : enemy.color);
        graphics.drawCircle(x + offset * radius * 0.32, y + offset * radius * 0.34, radius * (0.5 - index * 0.07));
        graphics.endFill();
      }
      setLine(graphics, radius * 0.18, enemy.accent);
      graphics.moveTo(x - radius * 0.58, y + radius * 0.5);
      graphics.bezierCurveTo(
        x - radius * 0.18,
        y + radius * 0.12,
        x + radius * 0.14,
        y - radius * 0.18,
        x + radius * 0.52,
        y - radius * 0.56,
      );
      break;
    case "amberShellCrab":
      beginFill(graphics, enemy.color);
      drawPolyline(
        graphics,
        Array.from({ length: 6 }, (_, index) => {
          const angle = -Math.PI / 2 + (Math.PI * 2 * index) / 6;
          return [x + Math.cos(angle) * radius * 0.9, y + Math.sin(angle) * radius * 0.74];
        }),
        true,
      );
      graphics.endFill();
      beginFill(graphics, enemy.accent);
      graphics.drawRoundedRect(x - radius * 0.66, y - radius * 0.1, radius * 1.32, radius * 0.24, radius * 0.08);
      graphics.endFill();
      break;
    case "moonpetalMoth":
      beginFill(graphics, enemy.detailColor);
      graphics.drawEllipse(x - radius * 0.5, y, radius * 0.54, radius * 0.8);
      graphics.drawEllipse(x + radius * 0.5, y, radius * 0.54, radius * 0.8);
      graphics.endFill();
      beginFill(graphics, enemy.color);
      graphics.drawEllipse(x, y, radius * 0.22, radius * 0.82);
      graphics.endFill();
      break;
    case "prismStag":
      beginFill(graphics, enemy.color);
      drawRotatedDiamond(graphics, x, y, radius * 1.12, radius * 1.48, 0);
      graphics.endFill();
      beginFill(graphics, enemy.detailColor);
      drawRotatedDiamond(graphics, x, y, radius * 0.56, radius * 0.88, 0);
      graphics.endFill();
      break;
    case "myceliumLord":
      beginFill(graphics, enemy.color);
      graphics.drawEllipse(x, y - radius * 0.14, radius * 1.02, radius * 0.66);
      graphics.endFill();
      beginFill(graphics, enemy.detailColor);
      graphics.drawRoundedRect(x - radius * 0.3, y - radius * 0.04, radius * 0.6, radius * 0.88, radius * 0.1);
      graphics.endFill();
      break;
    case "tempestTulip":
      for (const offset of [-0.44, 0, 0.44]) {
        drawLeaf(graphics, x + offset * radius * 0.42, y - radius * 0.06, radius * 0.96, radius * 0.26, -Math.PI / 2 + offset * 0.22, offset === 0 ? enemy.color : enemy.detailColor);
      }
      beginFill(graphics, enemy.accent);
      graphics.drawCircle(x, y + radius * 0.18, radius * 0.28);
      graphics.endFill();
      break;
    case "eclipsePeony":
      for (let index = 0; index < 10; index += 1) {
        const angle = (Math.PI * 2 * index) / 10;
        drawLeaf(graphics, x + Math.cos(angle) * radius * 0.16, y + Math.sin(angle) * radius * 0.16, radius * 0.84, radius * 0.18, angle, index % 2 === 0 ? enemy.color : enemy.detailColor);
      }
      beginFill(graphics, enemy.accent);
      graphics.drawCircle(x, y, radius * 0.22);
      graphics.endFill();
      break;
    case "voidLantern":
      beginFill(graphics, enemy.accent);
      graphics.drawRoundedRect(x - radius * 0.14, y - radius * 0.08, radius * 0.28, radius * 0.92, radius * 0.08);
      graphics.endFill();
      for (const offset of [-0.54, 0, 0.54]) {
        beginFill(graphics, offset === 0 ? enemy.color : enemy.detailColor);
        drawRotatedDiamond(graphics, x + offset * radius, y - radius * 0.18 + Math.abs(offset) * radius * 0.12, radius * 0.62, radius * 0.84);
        graphics.endFill();
      }
      break;
    case "twilightMower":
      for (let index = 0; index < 3; index += 1) {
        const angle = (Math.PI * 2 * index) / 3;
        drawLeaf(graphics, x + Math.cos(angle) * radius * 0.16, y + Math.sin(angle) * radius * 0.16, radius * 0.88, radius * 0.28, angle, index === 0 ? enemy.detailColor : enemy.color);
      }
      beginFill(graphics, enemy.accent);
      graphics.drawCircle(x, y, radius * 0.4);
      graphics.endFill();
      break;
    default:
      beginFill(graphics, enemy.color);
      graphics.drawCircle(x, y, radius * 0.92);
      graphics.endFill();
      break;
  }
}

// 鹿角突刺 的鹿之虚影. Drawn facing +x because drawProjectiles rotates the sprite to the
// travel heading. Kept mostly white/blue-white so the per-projectile tint still reads;
// `crystal` is the 晶华鹿角 level, which brightens the body and lights up the antlers.
function paintDeerPhantom(graphics, x, y, radius, crystal = 0) {
  const bodyAlpha = 0.46 + crystal * 0.14;
  const rimAlpha = 0.72 + crystal * 0.12;
  const rim = crystal > 0 ? "#eaffff" : "#cdeeff";

  // Trailing phantom smear, so the charge reads as motion even when still.
  beginFill(graphics, `rgba(160, 220, 255, ${0.14 + crystal * 0.06})`);
  graphics.drawEllipse(x - radius * 0.72, y + radius * 0.06, radius * 0.72, radius * 0.3);
  graphics.endFill();

  // Four legs mid-gallop: front pair reaching forward, rear pair thrown back.
  setLine(graphics, radius * 0.11, rim);
  for (const [hipX, kneeX, hoofX, hipY] of [
    [0.22, 0.52, 0.78, 0.26],
    [0.1, 0.38, 0.6, 0.3],
    [-0.3, -0.6, -0.84, 0.26],
    [-0.42, -0.72, -0.9, 0.3],
  ]) {
    graphics.moveTo(x + radius * hipX, y + radius * hipY);
    graphics.lineTo(x + radius * kneeX, y + radius * (hipY + 0.3));
    graphics.lineTo(x + radius * hoofX, y + radius * (hipY + 0.56));
  }

  // Barrel of the body.
  beginFill(graphics, `rgba(214, 244, 255, ${bodyAlpha})`);
  graphics.drawEllipse(x - radius * 0.08, y + radius * 0.06, radius * 0.6, radius * 0.3);
  graphics.endFill();
  setLine(graphics, radius * 0.08, rim);
  graphics.drawEllipse(x - radius * 0.08, y + radius * 0.06, radius * 0.6, radius * 0.3);

  // Neck sweeping up to the head, and a short muzzle.
  beginFill(graphics, `rgba(224, 248, 255, ${bodyAlpha + 0.08})`);
  graphics.drawPolygon([
    x + radius * 0.3, y + radius * 0.16,
    x + radius * 0.46, y - radius * 0.36,
    x + radius * 0.66, y - radius * 0.3,
    x + radius * 0.5, y + radius * 0.2,
  ]);
  graphics.endFill();
  beginFill(graphics, `rgba(236, 252, 255, ${bodyAlpha + 0.14})`);
  graphics.drawEllipse(x + radius * 0.62, y - radius * 0.4, radius * 0.2, radius * 0.14);
  graphics.endFill();

  // Tail flick.
  setLine(graphics, radius * 0.09, rim);
  graphics.moveTo(x - radius * 0.66, y - radius * 0.02);
  graphics.lineTo(x - radius * 0.86, y - radius * 0.18);

  // Antlers: two swept racks with three tines each. This is the part 晶华鹿角 lights up,
  // so it is drawn last, thickest, and brightest.
  const antlerColor = crystal > 0 ? "#ffffff" : "#e4f7ff";
  if (crystal > 0) {
    // Bloom pass underneath the tines.
    setLine(graphics, radius * 0.3, "rgba(255, 255, 255, 0.3)");
    for (const lean of [-0.12, 0.16]) {
      graphics.moveTo(x + radius * 0.6, y - radius * 0.5);
      graphics.lineTo(x + radius * (0.82 + lean), y - radius * 1.02);
    }
  }
  setLine(graphics, radius * (0.1 + crystal * 0.03), antlerColor);
  for (const lean of [-0.12, 0.16]) {
    const baseX = x + radius * 0.6;
    const baseY = y - radius * 0.5;
    const tipX = x + radius * (0.82 + lean);
    const tipY = y - radius * 1.02;
    graphics.moveTo(baseX, baseY);
    graphics.lineTo(tipX, tipY);
    // Forward-raking tines off the main beam.
    for (const t of [0.34, 0.62, 0.86]) {
      const px = baseX + (tipX - baseX) * t;
      const py = baseY + (tipY - baseY) * t;
      graphics.moveTo(px, py);
      graphics.lineTo(px + radius * 0.26, py - radius * 0.14);
    }
  }
  setLine(graphics, radius * 0.05, "rgba(255,255,255,0.95)");
  graphics.moveTo(x + radius * 0.6, y - radius * 0.5);
  graphics.lineTo(x + radius * 0.74, y - radius * 1.0);
}

// 虫巢 (净化 objective). Deliberately not bug-shaped: a rooted, bulbous hive with a dark
// mouth, so the player can tell the objective apart from the trash it keeps hatching.
function paintGardenNest(graphics, x, y, radius, enemy) {
  // Roots splayed on the ground to sell "this thing does not move".
  setLine(graphics, radius * 0.11, enemy.accent);
  for (let index = 0; index < 6; index += 1) {
    const angle = Math.PI * 0.15 + (Math.PI * 0.7 * index) / 5;
    graphics.moveTo(x, y + radius * 0.34);
    graphics.quadraticCurveTo(
      x + Math.cos(angle) * radius * 0.5,
      y + radius * 0.62,
      x + Math.cos(angle) * radius * 0.92,
      y + radius * 0.78,
    );
  }

  beginFill(graphics, enemy.color);
  graphics.drawEllipse(x, y + radius * 0.08, radius * 0.74, radius * 0.82);
  graphics.endFill();

  // Horizontal comb banding.
  setLine(graphics, radius * 0.07, enemy.accent);
  for (const offset of [-0.42, -0.12, 0.2, 0.5]) {
    graphics.moveTo(x - radius * 0.66, y + radius * offset);
    graphics.quadraticCurveTo(x, y + radius * (offset + 0.16), x + radius * 0.66, y + radius * offset);
  }

  // The mouth: dark opening with a pale rim, where brood comes out.
  beginFill(graphics, "rgba(26, 12, 36, 0.86)");
  graphics.drawEllipse(x, y + radius * 0.3, radius * 0.26, radius * 0.2);
  graphics.endFill();
  setLine(graphics, radius * 0.06, enemy.detailColor);
  graphics.drawEllipse(x, y + radius * 0.3, radius * 0.28, radius * 0.22);

  // Crown spines.
  beginFill(graphics, enemy.detailColor);
  for (let index = 0; index < 3; index += 1) {
    const angle = -Math.PI / 2 + (index - 1) * 0.42;
    drawLeaf(graphics, x + Math.cos(angle) * radius * 0.3, y - radius * 0.58, radius * 0.46, radius * 0.13, angle, enemy.detailColor);
  }
  graphics.endFill();
}

function paintRegionalKin(graphics, x, y, radius, enemy) {
  switch (enemy.shapeId) {
    case "budKin":
      for (let index = 0; index < 4; index += 1) {
        const angle = -Math.PI / 2 + (Math.PI * 2 * index) / 4;
        drawLeaf(graphics, x + Math.cos(angle) * radius * 0.18, y + Math.sin(angle) * radius * 0.12, radius * 0.62, radius * 0.22, angle, index % 2 === 0 ? enemy.detailColor : enemy.accent);
      }
      beginFill(graphics, enemy.color);
      graphics.drawCircle(x, y + radius * 0.06, radius * 0.42);
      graphics.endFill();
      break;
    case "serpentKin":
      for (let index = 0; index < 3; index += 1) {
        beginFill(graphics, index === 2 ? enemy.detailColor : enemy.color);
        graphics.drawCircle(x + (index - 1) * radius * 0.28, y + (index - 1) * radius * 0.2, radius * (0.28 - index * 0.03));
        graphics.endFill();
      }
      setLine(graphics, radius * 0.12, enemy.accent);
      graphics.moveTo(x - radius * 0.56, y + radius * 0.34);
      graphics.quadraticCurveTo(x - radius * 0.06, y + radius * 0.02, x + radius * 0.56, y - radius * 0.34);
      break;
    case "shellKin":
      beginFill(graphics, enemy.color);
      drawPolyline(
        graphics,
        Array.from({ length: 6 }, (_, index) => {
          const angle = -Math.PI / 2 + (Math.PI * 2 * index) / 6;
          return [x + Math.cos(angle) * radius * 0.62, y + Math.sin(angle) * radius * 0.52];
        }),
        true,
      );
      graphics.endFill();
      beginFill(graphics, enemy.detailColor);
      drawRotatedDiamond(graphics, x, y, radius * 0.54, radius * 0.74);
      graphics.endFill();
      setLine(graphics, radius * 0.07, enemy.accent);
      for (const offset of [-0.5, -0.18, 0.18, 0.5]) {
        graphics.moveTo(x + offset * radius, y + radius * 0.08);
        graphics.lineTo(x + offset * radius * 1.18, y + radius * 0.4);
      }
      break;
    case "mothKin":
      beginFill(graphics, enemy.detailColor);
      graphics.drawEllipse(x - radius * 0.34, y, radius * 0.32, radius * 0.48);
      graphics.drawEllipse(x + radius * 0.34, y, radius * 0.32, radius * 0.48);
      graphics.endFill();
      beginFill(graphics, enemy.color);
      graphics.drawEllipse(x, y + radius * 0.02, radius * 0.14, radius * 0.52);
      graphics.endFill();
      break;
    case "prismKin":
      beginFill(graphics, enemy.color);
      drawRotatedDiamond(graphics, x, y + radius * 0.06, radius * 0.7, radius * 0.92);
      graphics.endFill();
      beginFill(graphics, enemy.detailColor);
      drawRotatedDiamond(graphics, x, y + radius * 0.06, radius * 0.34, radius * 0.44);
      graphics.endFill();
      setLine(graphics, radius * 0.06, enemy.accent);
      graphics.moveTo(x - radius * 0.12, y - radius * 0.12);
      graphics.lineTo(x - radius * 0.34, y - radius * 0.5);
      graphics.moveTo(x + radius * 0.12, y - radius * 0.12);
      graphics.lineTo(x + radius * 0.34, y - radius * 0.5);
      break;
    case "sporeKin":
      beginFill(graphics, enemy.color);
      graphics.drawEllipse(x, y - radius * 0.08, radius * 0.62, radius * 0.42);
      graphics.endFill();
      beginFill(graphics, enemy.detailColor);
      graphics.drawRoundedRect(x - radius * 0.18, y - radius * 0.04, radius * 0.36, radius * 0.62, radius * 0.08);
      graphics.endFill();
      beginFill(graphics, enemy.accent);
      graphics.drawCircle(x - radius * 0.24, y - radius * 0.16, radius * 0.07);
      graphics.drawCircle(x + radius * 0.06, y - radius * 0.2, radius * 0.06);
      graphics.drawCircle(x + radius * 0.26, y - radius * 0.1, radius * 0.05);
      graphics.endFill();
      break;
    case "tempestKin":
      for (const offset of [-0.34, 0, 0.34]) {
        drawLeaf(graphics, x + offset * radius * 0.72, y - radius * 0.04, radius * 0.62, radius * 0.18, -Math.PI / 2 + offset * 0.32, offset === 0 ? enemy.color : enemy.detailColor);
      }
      beginFill(graphics, enemy.accent);
      graphics.drawCircle(x, y + radius * 0.16, radius * 0.18);
      graphics.endFill();
      break;
    case "eclipseKin":
      for (let index = 0; index < 6; index += 1) {
        const angle = (Math.PI * 2 * index) / 6;
        drawLeaf(graphics, x + Math.cos(angle) * radius * 0.1, y + Math.sin(angle) * radius * 0.1, radius * 0.58, radius * 0.14, angle, index % 2 === 0 ? enemy.color : enemy.detailColor);
      }
      beginFill(graphics, enemy.accent);
      graphics.drawCircle(x, y, radius * 0.16);
      graphics.endFill();
      break;
    case "lanternKin":
      beginFill(graphics, enemy.accent);
      graphics.drawRoundedRect(x - radius * 0.08, y - radius * 0.08, radius * 0.16, radius * 0.7, radius * 0.06);
      graphics.endFill();
      for (const offset of [-0.28, 0.28]) {
        beginFill(graphics, offset < 0 ? enemy.color : enemy.detailColor);
        drawRotatedDiamond(graphics, x + offset * radius, y - radius * 0.02, radius * 0.36, radius * 0.5);
        graphics.endFill();
      }
      break;
    case "twilightKin":
      for (let index = 0; index < 3; index += 1) {
        const angle = -Math.PI / 2 + (Math.PI * 2 * index) / 3;
        drawLeaf(graphics, x + Math.cos(angle) * radius * 0.12, y + Math.sin(angle) * radius * 0.12, radius * 0.64, radius * 0.2, angle, index === 0 ? enemy.detailColor : enemy.color);
      }
      beginFill(graphics, enemy.accent);
      graphics.drawCircle(x, y, radius * 0.24);
      graphics.endFill();
      break;
    default:
      paintNormalEnemy(graphics, x, y, radius, enemy);
      return;
  }

  paintFace(graphics, x, y + radius * 0.12, radius * 0.42, "rgba(42, 52, 39, 0.9)");
}

function paintSoftDisc(graphics, x, y, radius, color) {
  for (let index = 4; index >= 1; index -= 1) {
    const ratio = index / 4;
    beginFillWithAlpha(graphics, color, 0.06 * ratio);
    graphics.drawCircle(x, y, radius * ratio);
    graphics.endFill();
  }
}

function getProgress(effect) {
  return 1 - effect.duration / Math.max(0.001, effect.maxDuration || effect.duration || 1);
}

export class PixiRenderer {
  constructor({ canvas }) {
    this.canvas = canvas;
    this.logicalWidth = Math.max(1, Math.round(canvas.width || 1280));
    this.logicalHeight = Math.max(1, Math.round(canvas.height || 720));
    this.app = new PIXI.Application({
      view: canvas,
      antialias: true,
      backgroundAlpha: 0,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, MAX_RENDER_RESOLUTION),
      width: this.logicalWidth,
      height: this.logicalHeight,
    });
    this.app.stop();
    this.eyeComfortMode = false;
    this.perspectiveMode = false;
    this.visualProfile = DEFAULT_VISUAL_PROFILE;
    this.syncViewStyle();

    this.textureCache = new Map();
    this.externalTextureCache = new Map();
    this.preloadExternalTextures();
    this.pools = {
      decorations: [],
      fields: [],
      enemies: [],
      bossEffects: [],
      projectiles: [],
      meteors: [],
      beacons: [],
      pickups: [],
      enemyProjectiles: [],
      orbitals: [],
      damageNumbers: [],
    };
    this.poolUsage = Object.create(null);
    this.particlePool = [];
    this.lastRenderTime = performance.now();
    this.frameParticleBudget = 0;

    this.world = new PIXI.Container();
    this.app.stage.addChild(this.world);

    this.layers = {
      arena: new PIXI.Graphics(),
      arenaTile: null,
      fieldGlow: new PIXI.Graphics(),
      bossHazards: new PIXI.Graphics(),
      // Wave objective markers (净土圈 / 灵露). Ground level, above fields, below enemies.
      waveMarkers: new PIXI.Graphics(),
      // 凝时钟域 dials. Painted on the floor, so they sit under enemies, nests, the hold
      // zone and all bullets — the dial is a readable ground marking, not an overlay.
      clockDials: new PIXI.Graphics(),
      strikes: new PIXI.Graphics(),
      mines: new PIXI.Graphics(),
      pulses: new PIXI.Graphics(),
      projectileFallbacks: new PIXI.Graphics(),
      enemyBars: new PIXI.Graphics(),
      skillEffects: new PIXI.Graphics(),
      playerOverlay: new PIXI.Graphics(),
    };

    this.layers.fieldGlow.filters = [new PIXI.BlurFilter(4)];
    this.layers.fieldGlow.blendMode = PIXI.BLEND_MODES.ADD;

    this.spriteLayers = {
      decorations: new PIXI.Container(),
      fields: new PIXI.Container(),
      meteors: new PIXI.Container(),
      beacons: new PIXI.Container(),
      pickups: new PIXI.Container(),
      projectiles: new PIXI.Container(),
      enemyProjectiles: new PIXI.Container(),
      bossEffects: new PIXI.Container(),
      orbitals: new PIXI.Container(),
      enemies: new PIXI.Container(),
      particles: new PIXI.Container(),
      player: new PIXI.Container(),
      damageNumbers: new PIXI.Container(),
    };

    this.spriteLayers.particles.filters = [new PIXI.BlurFilter(2.2)];
    this.spriteLayers.particles.blendMode = PIXI.BLEND_MODES.ADD;

    this.playerVisual = this.createPlayerVisual();
    this.spriteLayers.player.addChild(this.playerVisual);

    const drawOrder = [
      this.layers.arena,
      this.layers.arenaTile ? this.layers.arenaTile : null,
      this.spriteLayers.decorations,
      this.layers.fieldGlow,
      this.spriteLayers.fields,
      // The dial goes down first so everything else — telegraphs, objective markers,
      // bullets, enemies and nests — reads on top of it.
      this.layers.clockDials,
      this.layers.bossHazards,
      this.layers.waveMarkers,
      this.spriteLayers.meteors,
      this.spriteLayers.beacons,
      this.spriteLayers.pickups,
      this.layers.strikes,
      this.layers.mines,
      this.layers.pulses,
      this.layers.projectileFallbacks,
      this.spriteLayers.projectiles,
      this.spriteLayers.enemyProjectiles,
      this.spriteLayers.bossEffects,
      this.spriteLayers.orbitals,
      this.spriteLayers.enemies,
      this.layers.skillEffects,
      this.spriteLayers.player,
      this.layers.playerOverlay,
      this.layers.enemyBars,
      this.spriteLayers.damageNumbers,
      this.spriteLayers.particles,
    ];

    for (const layer of drawOrder) {
      if (layer) {
        this.world.addChild(layer);
      }
    }

    this.initArenaTile();
    this.applyVisualProfile();
  }

  preloadExternalTextures() {
    for (const assetId of Object.keys(EXTERNAL_ASSET_DEFS)) {
      this.getExternalTexture(assetId);
    }
  }

  initArenaTile() {
    try {
      const texture = PIXI.Texture.from("./designs/map.jpg");
      if (texture) {
        const tile = new PIXI.TilingSprite(texture, ARENA.width, ARENA.height);
        tile.position.set(0, 0);
        tile.tilePosition.set(0, 0);
        this.layers.arenaTile = tile;
        this.world.addChildAt(tile, 1);
      }
    } catch {
      this.layers.arenaTile = null;
    }
  }

  getViewportSize() {
    return {
      width: this.logicalWidth,
      height: this.logicalHeight,
    };
  }

  resize(width, height) {
    const nextWidth = Math.max(1, Math.round(width));
    const nextHeight = Math.max(1, Math.round(height));
    if (this.logicalWidth === nextWidth && this.logicalHeight === nextHeight) {
      this.syncViewStyle();
      return;
    }

    this.logicalWidth = nextWidth;
    this.logicalHeight = nextHeight;
    this.app.renderer.resize(this.logicalWidth, this.logicalHeight);
    this.syncViewStyle();
  }

  ensureSize() {
    const screenWidth = this.app.screen?.width ?? this.app.renderer.screen.width;
    const screenHeight = this.app.screen?.height ?? this.app.renderer.screen.height;
    if (screenWidth !== this.logicalWidth || screenHeight !== this.logicalHeight) {
      this.app.renderer.resize(this.logicalWidth, this.logicalHeight);
    }
    this.syncViewStyle();
  }

  syncViewStyle() {
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.canvas.style.filter = this.visualProfile.canvasFilter;
  }

  applyVisualProfile() {
    if (!this.layers || !this.spriteLayers) {
      return;
    }

    this.layers.fieldGlow.filters = [new PIXI.BlurFilter(this.visualProfile.fieldGlowBlur)];
    this.layers.fieldGlow.blendMode = PIXI.BLEND_MODES.ADD;
    this.layers.fieldGlow.alpha = this.visualProfile.fieldGlowAlpha;
    this.layers.pulses.alpha = this.visualProfile.effectLayerAlpha;
    this.layers.strikes.alpha = this.visualProfile.effectLayerAlpha;
    this.layers.skillEffects.alpha = this.visualProfile.effectLayerAlpha;
    this.spriteLayers.bossEffects.alpha = this.visualProfile.effectLayerAlpha;
    this.spriteLayers.particles.filters = [new PIXI.BlurFilter(this.visualProfile.particleBlur)];
    this.spriteLayers.particles.blendMode = PIXI.BLEND_MODES.ADD;
    this.spriteLayers.particles.alpha = this.visualProfile.particleLayerAlpha;
  }

  setEyeComfortMode(enabled) {
    const nextEnabled = Boolean(enabled);
    if (this.eyeComfortMode === nextEnabled) {
      this.syncViewStyle();
      return;
    }

    this.eyeComfortMode = nextEnabled;
    this.visualProfile = nextEnabled ? EYE_COMFORT_VISUAL_PROFILE : DEFAULT_VISUAL_PROFILE;
    this.applyVisualProfile();
    this.syncViewStyle();
  }

  setPerspectiveMode(enabled) {
    this.perspectiveMode = Boolean(enabled);
  }

  getMotionTime(rate = 1) {
    return this.lastRenderTime * rate * this.visualProfile.motionRate;
  }

  getSpawnRate(rate) {
    return rate * this.visualProfile.spawnRateScale;
  }

  resetFrameState() {
    this.poolUsage = {
      decorations: 0,
      fields: 0,
      enemies: 0,
      bossEffects: 0,
      projectiles: 0,
      meteors: 0,
      beacons: 0,
      pickups: 0,
      enemyProjectiles: 0,
      orbitals: 0,
      damageNumbers: 0,
    };

    for (const layer of Object.values(this.layers)) {
      if (layer && typeof layer.clear === "function") {
        layer.clear();
      }
    }
  }

  finishFrame() {
    for (const [poolName, pool] of Object.entries(this.pools)) {
      const used = this.poolUsage[poolName] || 0;
      for (let index = used; index < pool.length; index += 1) {
        pool[index].visible = false;
      }
    }
  }

  acquireFromPool(poolName, layer, factory) {
    const index = this.poolUsage[poolName] || 0;
    if (index >= this.pools[poolName].length) {
      const displayObject = factory();
      this.pools[poolName].push(displayObject);
      layer.addChild(displayObject);
    }
    const displayObject = this.pools[poolName][index];
    displayObject.visible = true;
    this.poolUsage[poolName] = index + 1;
    return displayObject;
  }

  render(runtime, forceBackground = false) {
    this.ensureSize();
    this.resetFrameState();

    const now = performance.now();
    const delta = clamp((now - this.lastRenderTime) / 1000, 1 / 120, 0.05);
    this.lastRenderTime = now;
    this.frameParticleBudget = this.visualProfile.particleBudget;

    const camera = runtime.getCamera();
    // Screen shake: read magnitude from the runtime, apply a random offset, and decay over wall-clock time.
    let shakeX = 0;
    let shakeY = 0;
    const shakeMag = runtime.screenShake || 0;
    if (shakeMag > 0.2) {
      const angle = Math.random() * Math.PI * 2;
      shakeX = Math.cos(angle) * shakeMag;
      shakeY = Math.sin(angle) * shakeMag;
      // Exponential-ish decay, framerate independent.
      runtime.screenShake = shakeMag * Math.max(0, 1 - delta * 12) - delta * 8;
      if (runtime.screenShake < 0.2) runtime.screenShake = 0;
    } else if (shakeMag) {
      runtime.screenShake = 0;
    }
    this.world.position.set(-camera.x + shakeX, -camera.y + shakeY);

    this.updateParticles(delta);
    this.drawArena(camera);
    if (this.perspectiveMode && runtime.session) {
      this.drawPerspectiveGround(camera);
    }
    /* Decoration layer temporarily disabled
    this.drawDecorations(camera);
    */

    if (!runtime.session && !forceBackground) {
      this.finishFrame();
      this.app.renderer.render(this.app.stage);
      return;
    }

    this.drawFields(runtime.fields || [], delta);
    // Ground markings first, so bullets and bodies always read on top of them.
    this.drawClockDials(runtime.strikes || []);
    this.drawScissorBlades(runtime.strikes || []);
    this.drawTulipRods(runtime.tulipRods || [], delta);
    this.drawGears(runtime.gears || []);
    this.drawMeteors(runtime.meteors || [], delta);
    this.drawBeacons(runtime.beacons || [], delta);
    this.drawPickups(runtime.pickups || [], runtime.player, delta);
    this.drawStrikes(runtime.strikes || [], delta);
    this.drawMines(runtime.mines || []);
    this.drawPulses(runtime.pulses || [], delta);
    this.drawProjectiles(runtime.projectiles || [], delta);
    this.drawOrbitals(runtime, delta);
    this.drawThunderSprites(runtime, delta);
    this.drawEnemies(runtime.enemies || [], delta);
    this.drawSkillEffects(runtime.skillEffects || [], delta);
    this.drawEnemyProjectiles(runtime.enemyProjectiles || [], delta);
    this.drawBossHazards(runtime.bossHazards || [], delta);
    this.drawWaveMarkers(runtime.waveMarkers || [], runtime.player, delta);
    this.drawPlayer(runtime.player, delta, runtime.session?.selectedCharacterId);
    this.drawDamageNumbers(runtime.damageNumbers || []);

    this.finishFrame();
    this.app.renderer.render(this.app.stage);
  }

  getCachedTexture(key, size, baseRadius, painter) {
    if (!this.textureCache.has(key)) {
      const container = new PIXI.Container();
      const graphics = new PIXI.Graphics();
      container.addChild(graphics);
      painter(graphics, size / 2, size / 2, baseRadius);
      const texture = this.app.renderer.generateTexture(container, {
        region: new PIXI.Rectangle(0, 0, size, size),
        resolution: 2,
      });
      container.destroy({ children: true });
      this.textureCache.set(key, { texture, baseRadius });
    }
    return this.textureCache.get(key);
  }

  getExternalTexture(assetId) {
    if (!this.externalTextureCache.has(assetId)) {
      const definition = EXTERNAL_ASSET_DEFS[assetId];
      const texture = PIXI.Texture.from(definition.path);
      this.externalTextureCache.set(assetId, {
        texture,
        baseRadius: definition.baseRadius,
      });
    }
    return this.externalTextureCache.get(assetId);
  }

  getSoftDiscTexture() {
    return this.getCachedTexture("soft-disc", 96, 24, (graphics, x, y, radius) => {
      paintSoftDisc(graphics, x, y, radius, "rgba(255,255,255,0.7)");
    });
  }

  getRingTexture() {
    return this.getCachedTexture("soft-ring", 96, 28, (graphics, x, y, radius) => {
      setLine(graphics, 6, "rgba(255,255,255,0.7)");
      graphics.drawCircle(x, y, radius);
      setLine(graphics, 2, "rgba(255,255,255,0.4)");
      graphics.drawCircle(x, y, radius * 0.72);
    });
  }

  getPlayerTexture(characterId = "spriteScout") {
    const advancedVisual = ADVANCED_CHARACTER_VISUALS[characterId];
    if (advancedVisual) {
      return this.getCachedTexture(`player-advanced-${characterId}`, 128, 40, (graphics, x, y, radius) => {
        paintAdvancedPlayer(graphics, x, y, radius, advancedVisual);
      });
    }
    const assetId = PLAYER_CHARACTER_TEXTURES[characterId] || "playerFairy";
    return this.getExternalTexture(assetId);
  }

  getDecorationTexture(kind) {
    switch (kind) {
      case "grass":
        return this.getCachedTexture("decoration-grass", 80, 24, (graphics, x, y, radius) => {
          for (let index = 0; index < 5; index += 1) {
            const angle = -Math.PI / 2 + (index - 2) * 0.24;
            drawLeaf(graphics, x + (index - 2) * 2, y + radius * 0.2, radius * 0.86, radius * 0.18, angle, index % 2 === 0 ? "rgba(170, 221, 158, 0.95)" : "rgba(193, 235, 177, 0.92)");
          }
        });
      case "flowers":
        return this.getCachedTexture("decoration-flowers", 84, 26, (graphics, x, y, radius) => {
          beginFill(graphics, "rgba(182, 226, 162, 0.7)");
          graphics.drawEllipse(x, y + radius * 0.2, radius * 0.86, radius * 0.3);
          graphics.endFill();
          for (const offset of [-0.4, 0, 0.4]) {
            for (let index = 0; index < 6; index += 1) {
              const angle = (Math.PI * 2 * index) / 6;
              drawLeaf(graphics, x + offset * radius + Math.cos(angle) * radius * 0.14, y + Math.sin(angle) * radius * 0.14, radius * 0.32, radius * 0.1, angle, index % 2 === 0 ? "rgba(255,255,255,0.95)" : "rgba(255, 241, 247, 0.96)");
            }
            beginFill(graphics, offset === 0 ? "#f7d969" : "#f8c584");
            graphics.drawCircle(x + offset * radius, y, radius * 0.12);
            graphics.endFill();
          }
        });
      case "clover":
        return this.getCachedTexture("decoration-clover", 84, 24, (graphics, x, y, radius) => {
          for (let index = 0; index < 4; index += 1) {
            const angle = (Math.PI / 2) * index - Math.PI / 4;
            drawLeaf(graphics, x + Math.cos(angle) * radius * 0.22, y + Math.sin(angle) * radius * 0.14, radius * 0.5, radius * 0.24, angle, index % 2 === 0 ? "rgba(189, 233, 168, 0.96)" : "rgba(171, 223, 153, 0.95)");
          }
          setLine(graphics, 2, "rgba(132, 194, 122, 0.78)");
          graphics.moveTo(x, y + radius * 0.1);
          graphics.lineTo(x + radius * 0.2, y + radius * 0.62);
        });
      case "butterfly":
        return this.getCachedTexture("decoration-butterfly", 92, 26, (graphics, x, y, radius) => {
          beginFill(graphics, "rgba(255, 229, 188, 0.94)");
          graphics.drawEllipse(x - radius * 0.3, y, radius * 0.36, radius * 0.46);
          graphics.drawEllipse(x + radius * 0.3, y, radius * 0.36, radius * 0.46);
          graphics.endFill();
          beginFill(graphics, "rgba(255, 244, 215, 0.92)");
          graphics.drawEllipse(x - radius * 0.46, y + radius * 0.06, radius * 0.22, radius * 0.28);
          graphics.drawEllipse(x + radius * 0.46, y + radius * 0.06, radius * 0.22, radius * 0.28);
          graphics.endFill();
          beginFill(graphics, "#5d7455");
          graphics.drawRoundedRect(x - radius * 0.06, y - radius * 0.44, radius * 0.12, radius * 0.88, radius * 0.08);
          graphics.endFill();
        });
      case "bunny":
      default:
        return this.getCachedTexture("decoration-bunny", 96, 26, (graphics, x, y, radius) => {
          beginFill(graphics, "rgba(255, 248, 239, 0.95)");
          graphics.drawEllipse(x, y + radius * 0.08, radius * 0.5, radius * 0.36);
          graphics.drawEllipse(x - radius * 0.24, y - radius * 0.48, radius * 0.16, radius * 0.36);
          graphics.drawEllipse(x + radius * 0.14, y - radius * 0.52, radius * 0.16, radius * 0.42);
          graphics.endFill();
          beginFill(graphics, "rgba(255, 214, 223, 0.86)");
          graphics.drawEllipse(x - radius * 0.24, y - radius * 0.52, radius * 0.08, radius * 0.24);
          graphics.drawEllipse(x + radius * 0.14, y - radius * 0.56, radius * 0.08, radius * 0.28);
          graphics.endFill();
          beginFill(graphics, "#7c8b71");
          graphics.drawCircle(x - radius * 0.14, y + radius * 0.02, radius * 0.05);
          graphics.drawCircle(x + radius * 0.06, y + radius * 0.02, radius * 0.05);
          graphics.endFill();
        });
    }
  }

  getEnemyTexture(enemy) {
    if (enemy.boss) {
      return this.getCachedTexture(`boss-${enemy.shapeId || enemy.typeId}`, 180, 60, (graphics, x, y, radius) => {
        if (enemy.shapeId?.startsWith?.("glasshouse") || enemy.attackPattern?.startsWith?.("advancedBoss-")) {
          paintAdvancedBossBody(graphics, x, y, radius, enemy);
        } else {
          paintBossBody(graphics, x, y, radius, enemy);
        }
      });
    }

    if (enemy.elite) {
      return this.getExternalTexture("enemyBugStout");
    }

    if (enemy.nest) {
      return this.getCachedTexture("garden-nest", 140, 36, (graphics, x, y, radius) => {
        paintGardenNest(graphics, x, y, radius, enemy);
      });
    }

    if (enemy.regionExclusive) {
      return this.getCachedTexture(`region-kin-${enemy.typeId}`, 132, 32, (graphics, x, y, radius) => {
        paintRegionalKin(graphics, x, y, radius, enemy);
      });
    }

    switch (enemy.typeId) {
      case "sproutSlime":
        return this.getExternalTexture("enemyBugRound");
      case "dandelionBat":
      case "thistleWitch":
        return this.getExternalTexture("enemyBugTall");
      case "sunbudBrute":
        return this.getExternalTexture("enemyBugStout");
      case "brambleShell":
        return this.getExternalTexture("enemyBugStout");
      case "sporeDrifter":
        return this.getExternalTexture("enemyBugTall");
      case "mossColossus":
        return this.getExternalTexture("enemyBugStout");
      case "crystalWeaver":
        return this.getExternalTexture("enemyBugRound");
      default:
        return this.getExternalTexture("enemyBugRound");
    }
  }

  getBubbleProjectileTexture(shard = false) {
    const key = shard ? "projectile-bubble-shard" : "projectile-bubble-burst";
    const size = shard ? 88 : 108;
    const baseRadius = shard ? 18 : 24;
    return this.getCachedTexture(key, size, baseRadius, (graphics, x, y, radius) => {
      beginFill(graphics, shard ? "rgba(184, 241, 255, 0.3)" : "rgba(170, 235, 255, 0.26)");
      graphics.drawCircle(x, y, radius * 0.78);
      graphics.endFill();
      setLine(graphics, shard ? 3 : 4, "rgba(255,255,255,0.72)");
      graphics.drawCircle(x, y, radius * 0.72);
      setLine(graphics, 1.6, shard ? "rgba(126, 225, 255, 0.82)" : "rgba(136, 227, 255, 0.8)");
      graphics.drawCircle(x, y, radius * 0.54);
      beginFill(graphics, "rgba(255,255,255,0.42)");
      graphics.drawCircle(x - radius * 0.22, y - radius * 0.24, radius * 0.16);
      graphics.endFill();
      beginFill(graphics, "rgba(255,255,255,0.18)");
      graphics.drawEllipse(x + radius * 0.08, y + radius * 0.16, radius * 0.18, radius * 0.1);
      graphics.endFill();
    });
  }

  getProjectileTexture(projectile) {
    switch (projectile.skillId) {
      case "elfArrow":
        return this.getExternalTexture("projectileArrow");
      case "flyingSword":
        return this.getExternalTexture("projectileSword");
      case "bubbleBurst":
        return this.getBubbleProjectileTexture(false);
      case "bubbleShard":
        return this.getBubbleProjectileTexture(true);
      case "thornVolley":
      case "thornShard":
        return this.getExternalTexture("projectileThorn");
      case "meteorShard":
        return this.getExternalTexture("projectileMeteor");
      case "sporeShard":
        return this.getExternalTexture("projectileOrb");
      case "ribbonBlade":
      case "ribbonShard":
        return this.getExternalTexture("projectileRibbon");
      case "glassPrismRay":
        // A bold elongated crystal lens with a bright core so it reads clearly and tints to any refracted color.
        return this.getCachedTexture("proj-glassPrism", 128, 20, (g, x, y, r) => {
          beginFill(g, "rgba(255,255,255,0.9)");
          g.moveTo(x - r * 1.35, y);
          g.lineTo(x, y - r * 0.62);
          g.lineTo(x + r * 1.35, y);
          g.lineTo(x, y + r * 0.62);
          g.closePath();
          g.endFill();
          beginFill(g, "#ffffff");
          g.drawEllipse(x, y, r * 0.55, r * 0.34);
          g.endFill();
        });
      case "honeyBomb":
        return this.getCachedTexture("proj-honey", 96, 18, (g, x, y, r) => {
          beginFill(g, "#f0b95f");
          g.drawCircle(x, y, r * 0.7);
          g.endFill();
          beginFill(g, "rgba(255,240,200,0.4)");
          g.drawCircle(x - r * 0.2, y - r * 0.2, r * 0.3);
          g.endFill();
        });
      case "lanternSpark":
        return this.getCachedTexture("proj-lantern", 96, 12, (g, x, y, r) => {
          beginFill(g, "#f4c86d");
          g.drawCircle(x, y, r * 0.45);
          g.endFill();
          beginFill(g, "rgba(255,220,150,0.3)");
          g.drawCircle(x, y, r * 0.8);
          g.endFill();
        });
      case "antlerBolt": {
        // A galloping deer phantom rather than a dart. 晶华鹿角 gets its own cached
        // variant: brighter body, heavier rim and lit antlers.
        const crystal = Math.min(2, projectile.crystalLevel || 0);
        return this.getCachedTexture(`proj-deer-${crystal}`, 150, 26, (g, x, y, r) => {
          paintDeerPhantom(g, x, y, r, crystal);
        });
      }
      case "auroraNeedle":
        return this.getCachedTexture("proj-aurora", 96, 10, (g, x, y, r) => {
          beginFill(g, "#c9a9ff");
          g.moveTo(x - r * 0.3, y - r); g.lineTo(x, y + r); g.lineTo(x + r * 0.3, y - r); g.closePath();
          g.endFill();
        });
      case "brambleBoomerang":
      case "brambleBoomerangShard":
        return this.getCachedTexture("proj-thornseed", 96, 10, (g, x, y, r) => {
          beginFill(g, "#9bcf63");
          g.moveTo(x, y - r * 0.9);
          g.lineTo(x + r * 0.5, y);
          g.lineTo(x, y + r * 0.9);
          g.lineTo(x - r * 0.5, y);
          g.closePath();
          g.endFill();
          beginFill(g, "rgba(255,255,255,0.4)");
          g.drawCircle(x - r * 0.1, y, r * 0.16);
          g.endFill();
        });
      case "harvestCrescent":
      case "harvestCrescentShard":
        // A bold crimson crescent-moon scythe blade.
        return this.getCachedTexture("proj-crescent", 96, 18, (g, x, y, r) => {
          beginFill(g, "#ee7778");
          g.arc(x, y, r, -1.15, 1.15);
          g.arc(x + r * 0.55, y, r * 0.92, 1.05, -1.05, true);
          g.closePath();
          g.endFill();
          beginFill(g, "rgba(255,240,238,0.85)");
          g.arc(x, y, r * 0.96, -1.0, 1.0);
          g.arc(x + r * 0.5, y, r * 0.9, 0.9, -0.9, true);
          g.closePath();
          g.endFill();
        });
      case "operaMothBlade":
      case "operaMothBladeShard":
        // A winged moth blade: two swept wings around a slim body.
        return this.getCachedTexture("proj-moth", 96, 16, (g, x, y, r) => {
          beginFill(g, "#c6a0f2");
          g.moveTo(x, y);
          g.lineTo(x - r, y - r * 0.9);
          g.lineTo(x - r * 0.3, y);
          g.lineTo(x - r, y + r * 0.9);
          g.closePath();
          g.moveTo(x, y);
          g.lineTo(x + r, y - r * 0.9);
          g.lineTo(x + r * 0.3, y);
          g.lineTo(x + r, y + r * 0.9);
          g.closePath();
          g.endFill();
          beginFill(g, "rgba(247,235,255,0.9)");
          g.drawEllipse(x, y, r * 0.18, r * 0.5);
          g.endFill();
        });
      case "cometPlow":
        return this.getCachedTexture("proj-comet", 96, 20, (g, x, y, r) => {
          setLine(g, 4, "rgba(255, 220, 170, 0.28)");
          g.moveTo(x - r * 1.1, y);
          g.lineTo(x + r * 0.5, y);
          setLine(g, 2, "rgba(255, 190, 120, 0.5)");
          g.moveTo(x - r * 0.9, y - r * 0.2);
          g.lineTo(x + r * 0.2, y - r * 0.2);
          g.moveTo(x - r * 0.9, y + r * 0.2);
          g.lineTo(x + r * 0.2, y + r * 0.2);
          beginFill(g, "#fff3dd");
          g.drawCircle(x + r * 0.4, y, r * 0.34);
          g.endFill();
          beginFill(g, "rgba(255, 150, 90, 0.9)");
          g.drawCircle(x - r * 0.1, y, r * 0.22);
          g.endFill();
        });
      case "pearlRoll":
        // A heavy opaque pearl with banding + a specular highlight so its spin reads clearly.
        return this.getCachedTexture("proj-pearlroll", 128, 22, (g, x, y, r) => {
          beginFill(g, "#fff8e4");
          g.drawCircle(x, y, r);
          g.endFill();
          beginFill(g, "rgba(214, 176, 112, 0.55)");
          g.drawEllipse(x, y + r * 0.34, r * 0.92, r * 0.3);
          g.endFill();
          beginFill(g, "rgba(190, 150, 88, 0.4)");
          g.drawEllipse(x, y - r * 0.38, r * 0.78, r * 0.2);
          g.endFill();
          beginFill(g, "rgba(255,255,255,0.95)");
          g.drawCircle(x - r * 0.3, y - r * 0.32, r * 0.26);
          g.endFill();
        });
      case "amberGearBurst":
        return this.getCachedTexture("proj-gear", 96, 18, (g, x, y, r) => {
          beginFill(g, "#f1b86b");
          g.drawCircle(x, y, r * 0.55);
          g.endFill();
          for (let i = 0; i < 8; i++) {
            const a = (Math.PI * 2 * i) / 8;
            beginFill(g, "#d4944a");
            g.drawRect(x + Math.cos(a) * r * 0.5 - r * 0.08, y + Math.sin(a) * r * 0.5 - r * 0.08, r * 0.16, r * 0.3);
            g.endFill();
          }
        });
      default:
        {
          const definition = getSkillDefinition(projectile.sourceSkillId || projectile.skillId);
          if (definition?.advancedBehavior === "beam") return this.getExternalTexture("projectileArrow");
          if (definition?.advancedBehavior === "lobbedBomb") return this.getBubbleProjectileTexture(projectile.skillId.endsWith("Shard"));
          if (definition?.advancedBehavior === "boomerang") return this.getExternalTexture("projectileRibbon");
          if (definition?.advancedBehavior === "meteor") return this.getExternalTexture("projectileMeteor");
        }
        return this.getExternalTexture("projectileOrb");
    }
  }

  getPickupTexture() {
    return this.getCachedTexture("pickup-exp", 96, 16, (graphics, x, y, radius) => {
      beginFill(graphics, "#fff7ad");
      drawStar(graphics, x, y, radius * 1.08, radius * 0.48, 4);
      graphics.endFill();
      beginFill(graphics, "rgba(255,255,255,0.56)");
      graphics.drawCircle(x, y, radius * 0.16);
      graphics.endFill();
    });
  }

  getBeaconTexture() {
    return this.getCachedTexture("lotus-beacon", 132, 22, (graphics, x, y, radius) => {
      for (let index = 0; index < 6; index += 1) {
        const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
        drawLeaf(graphics, x + Math.cos(angle) * radius * 0.08, y + Math.sin(angle) * radius * 0.08, radius * 0.94, radius * 0.28, angle, index % 2 === 0 ? "rgba(255, 238, 208, 0.96)" : "rgba(255, 204, 154, 0.9)");
      }
      beginFill(graphics, "#fff4d8");
      graphics.drawCircle(x, y, radius * 0.26);
      graphics.endFill();
      beginFill(graphics, "#ffd18d");
      graphics.drawCircle(x, y, radius * 0.1);
      graphics.endFill();
    });
  }

  getOrbitalTexture() {
    return this.getCachedTexture("orbital-petal", 96, 18, (graphics, x, y, radius) => {
      drawLeaf(graphics, x, y, radius * 1.16, radius * 0.34, 0, getSkillDefinition("petalOrbit").color);
      beginFill(graphics, "rgba(255,255,255,0.28)");
      graphics.drawEllipse(x + radius * 0.14, y, radius * 0.26, radius * 0.1);
      graphics.endFill();
    });
  }

  getMeteorTexture() {
    return this.getCachedTexture("proj-meteor", 128, 28, (g, x, y, r) => {
      // Opaque comet head + tail so the sprite tint reads strongly for any skill color.
      beginFill(g, "rgba(255, 236, 205, 0.92)");
      g.moveTo(x - r * 1.1, y);
      g.lineTo(x - r * 0.1, y - r * 0.52);
      g.lineTo(x + r * 0.32, y - r * 0.14);
      g.lineTo(x + r * 0.32, y + r * 0.14);
      g.lineTo(x - r * 0.1, y + r * 0.52);
      g.closePath();
      g.endFill();
      beginFill(g, "#ffffff");
      g.drawCircle(x + r * 0.18, y, r * 0.5);
      g.endFill();
      beginFill(g, "rgba(255,255,255,0.98)");
      g.drawCircle(x + r * 0.36, y, r * 0.26);
      g.endFill();
    });
  }

  getFieldTexture(field) {
    switch (field.sourceSkillId) {
      case "dewGarden":
        return this.getExternalTexture("fieldDew");
      case "stormBloom":
        return this.getExternalTexture("fieldStorm");
      case "mushroomMine":
        return this.getExternalTexture("fieldMushroom");
      case "meteorSeed":
        return this.getExternalTexture("fieldMeteor");
      default:
        return this.getExternalTexture("fieldDew");
    }
  }

  getEnemyProjectileTexture(projectile) {
    switch (projectile.kind) {
      case "petal":
      case "gust":
      case "eclipse":
        return this.getExternalTexture("enemyBulletPetal");
      case "seed":
      case "spore":
      case "sporeShard":
        return this.getExternalTexture("enemyBulletSeed");
      case "shard":
      case "prism":
        return this.getExternalTexture("enemyBulletShard");
      case "moth":
        return this.getExternalTexture("enemyBulletMoth");
      case "lantern":
        return this.getExternalTexture("enemyBulletLantern");
      default:
        return this.getExternalTexture("enemyBulletSeed");
    }
  }

  getBossEffectTexture() {
    return this.getExternalTexture("bossAura");
  }

  createPlayerVisual() {
    const container = new PIXI.Container();
    const shadow = new PIXI.Sprite(this.getSoftDiscTexture().texture);
    shadow.anchor.set(0.5);
    shadow.tint = 0x4d6c46;
    shadow.alpha = 0.16;
    shadow.scale.set(1.3, 0.72);
    shadow.y = 12;

    const glow = new PIXI.Sprite(this.getSoftDiscTexture().texture);
    glow.anchor.set(0.5);
    glow.tint = 0xffefc9;
    glow.alpha = 0.22;
    glow.blendMode = SCREEN_BLEND;
    glow.scale.set(1.18);

    const sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
    sprite.anchor.set(0.5);

    container.addChild(shadow, glow, sprite);
    container.shadowSprite = shadow;
    container.glowSprite = glow;
    container.mainSprite = sprite;
    return container;
  }

  createEnemyVisual() {
    const container = new PIXI.Container();
    const shadow = new PIXI.Sprite(this.getSoftDiscTexture().texture);
    shadow.anchor.set(0.5);
    shadow.tint = 0x416042;
    shadow.alpha = 0.2;
    shadow.scale.set(1.4, 0.8);
    shadow.y = 12;

    const glow = new PIXI.Sprite(this.getSoftDiscTexture().texture);
    glow.anchor.set(0.5);
    glow.alpha = 0.16;
    glow.blendMode = SCREEN_BLEND;
    glow.scale.set(1.2);

    // Dark silhouette halo behind the body so enemies read as hostile "others"
    // against the green field and pastel allied units.
    const rim = new PIXI.Sprite(this.getSoftDiscTexture().texture);
    rim.anchor.set(0.5);
    rim.alpha = 0.55;

    const sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
    sprite.anchor.set(0.5);

    container.addChild(shadow, glow, rim, sprite);
    container.shadowSprite = shadow;
    container.glowSprite = glow;
    container.rimSprite = rim;
    container.mainSprite = sprite;
    return container;
  }

  createProjectileVisual() {
    const container = new PIXI.Container();
    const glow = new PIXI.Sprite(this.getSoftDiscTexture().texture);
    glow.anchor.set(0.5);
    glow.alpha = 0.18;
    glow.blendMode = PIXI.BLEND_MODES.ADD;

    const ring = new PIXI.Sprite(this.getRingTexture().texture);
    ring.anchor.set(0.5);
    ring.visible = false;
    ring.alpha = 0.22;
    ring.blendMode = SCREEN_BLEND;

    const sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
    sprite.anchor.set(0.5);

    container.addChild(glow, ring, sprite);
    container.glowSprite = glow;
    container.ringSprite = ring;
    container.mainSprite = sprite;
    return container;
  }

  createFieldVisual() {
    const container = new PIXI.Container();
    const aura = new PIXI.Sprite(this.getSoftDiscTexture().texture);
    aura.anchor.set(0.5);
    aura.alpha = 0.16;
    aura.blendMode = PIXI.BLEND_MODES.ADD;

    const ring = new PIXI.Sprite(this.getRingTexture().texture);
    ring.anchor.set(0.5);
    ring.alpha = 0.24;
    ring.blendMode = SCREEN_BLEND;

    const sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
    sprite.anchor.set(0.5);

    container.addChild(aura, ring, sprite);
    container.auraSprite = aura;
    container.ringSprite = ring;
    container.mainSprite = sprite;
    return container;
  }

  createEnemyProjectileVisual() {
    const container = new PIXI.Container();
    const glow = new PIXI.Sprite(this.getSoftDiscTexture().texture);
    glow.anchor.set(0.5);
    glow.alpha = 0.16;
    glow.blendMode = PIXI.BLEND_MODES.ADD;

    const sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
    sprite.anchor.set(0.5);

    container.addChild(glow, sprite);
    container.glowSprite = glow;
    container.mainSprite = sprite;
    return container;
  }

  createBossEffectVisual() {
    const container = new PIXI.Container();
    const halo = new PIXI.Sprite(this.getSoftDiscTexture().texture);
    halo.anchor.set(0.5);
    halo.alpha = 0.18;
    halo.blendMode = PIXI.BLEND_MODES.ADD;

    const aura = new PIXI.Sprite(this.getBossEffectTexture().texture);
    aura.anchor.set(0.5);
    aura.blendMode = SCREEN_BLEND;

    container.addChild(halo, aura);
    container.haloSprite = halo;
    container.mainSprite = aura;
    return container;
  }

  createMeteorVisual() {
    const container = new PIXI.Container();
    const glow = new PIXI.Sprite(this.getSoftDiscTexture().texture);
    glow.anchor.set(0.5);
    glow.blendMode = PIXI.BLEND_MODES.ADD;
    glow.alpha = 0.24;

    const sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
    sprite.anchor.set(0.5);

    container.addChild(glow, sprite);
    container.glowSprite = glow;
    container.mainSprite = sprite;
    return container;
  }

  createBeaconVisual() {
    const container = new PIXI.Container();
    const halo = new PIXI.Sprite(this.getSoftDiscTexture().texture);
    halo.anchor.set(0.5);
    halo.tint = 0xffdcb3;
    halo.alpha = 0.24;
    halo.blendMode = SCREEN_BLEND;

    const ring = new PIXI.Sprite(this.getRingTexture().texture);
    ring.anchor.set(0.5);
    ring.tint = 0xffedc7;
    ring.alpha = 0.28;
    ring.blendMode = PIXI.BLEND_MODES.ADD;

    const sprite = new PIXI.Sprite(this.getBeaconTexture().texture);
    sprite.anchor.set(0.5);

    container.addChild(halo, ring, sprite);
    container.haloSprite = halo;
    container.ringSprite = ring;
    container.mainSprite = sprite;
    return container;
  }

  createPickupVisual() {
    const container = new PIXI.Container();
    const glow = new PIXI.Sprite(this.getSoftDiscTexture().texture);
    glow.anchor.set(0.5);
    glow.tint = 0xfff2a8;
    glow.alpha = 0.18;
    glow.blendMode = PIXI.BLEND_MODES.ADD;

    const sprite = new PIXI.Sprite(this.getPickupTexture().texture);
    sprite.anchor.set(0.5);

    container.addChild(glow, sprite);
    container.glowSprite = glow;
    container.mainSprite = sprite;
    return container;
  }

  createOrbitalVisual() {
    const container = new PIXI.Container();
    const glow = new PIXI.Sprite(this.getSoftDiscTexture().texture);
    glow.anchor.set(0.5);
    glow.tint = parseColor(getSkillDefinition("petalOrbit").color).color;
    glow.alpha = 0.12;
    glow.blendMode = SCREEN_BLEND;

    const sprite = new PIXI.Sprite(this.getOrbitalTexture().texture);
    sprite.anchor.set(0.5);

    container.addChild(glow, sprite);
    container.glowSprite = glow;
    container.mainSprite = sprite;
    return container;
  }

  acquireParticle() {
    for (const particle of this.particlePool) {
      if (!particle.active) {
        particle.active = true;
        particle.sprite.visible = true;
        return particle;
      }
    }

    if (this.particlePool.length >= MAX_PARTICLES) {
      return null;
    }

    const sprite = new PIXI.Sprite(this.getSoftDiscTexture().texture);
    sprite.anchor.set(0.5);
    sprite.visible = false;
    sprite.blendMode = PIXI.BLEND_MODES.ADD;
    this.spriteLayers.particles.addChild(sprite);

    const particle = {
      sprite,
      active: true,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 0,
      scale: 1,
      drift: 1,
    };
    this.particlePool.push(particle);
    return particle;
  }

  spawnParticle(config) {
    if (this.frameParticleBudget <= 0) {
      return;
    }
    const particle = this.acquireParticle();
    if (!particle) {
      return;
    }

    this.frameParticleBudget -= 1;
    particle.x = config.x;
    particle.y = config.y;
    particle.vx = config.vx || 0;
    particle.vy = config.vy || 0;
    particle.life = config.life || 0.4;
    particle.maxLife = particle.life;
    particle.scale = (config.scale || 0.4) * this.visualProfile.particleScale;
    particle.drift = config.drift || 0.92;
    particle.sprite.position.set(config.x, config.y);
    particle.sprite.tint = parseColor(config.color || "#ffffff").color;
    particle.sprite.alpha = (config.alpha || 0.4) * this.visualProfile.particleAlphaScale;
    particle.sprite.scale.set(particle.scale);
    particle.sprite.blendMode = config.blendMode || PIXI.BLEND_MODES.ADD;
  }

  updateParticles(delta) {
    for (const particle of this.particlePool) {
      if (!particle.active) {
        continue;
      }
      particle.life -= delta;
      if (particle.life <= 0) {
        particle.active = false;
        particle.sprite.visible = false;
        continue;
      }
      particle.vx *= particle.drift;
      particle.vy *= particle.drift;
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.sprite.position.set(particle.x, particle.y);
      particle.sprite.alpha = (particle.life / particle.maxLife) * 0.6 * this.visualProfile.particleAlphaScale;
      particle.sprite.scale.set(particle.scale * (0.65 + (particle.life / particle.maxLife) * 0.85));
    }
  }

  drawArena(camera) {
    const graphics = this.layers.arena;
    if (this.layers.arenaTile) {
      // Tile moves with world container → auto-scrolls with camera
    } else {
      beginFill(graphics, this.visualProfile.groundBaseColor);
      graphics.drawRect(0, 0, ARENA.width, ARENA.height);
      graphics.endFill();

      beginFill(graphics, this.visualProfile.groundPatchColor);
      for (let x = Math.floor(camera.x / 240) * 240; x <= camera.x + camera.width + 240; x += 240) {
        for (let y = Math.floor(camera.y / 220) * 220; y <= camera.y + camera.height + 220; y += 220) {
          graphics.drawEllipse(x + 80, y + 68, 64, 28);
          graphics.drawEllipse(x + 144, y + 114, 46, 20);
        }
      }
      graphics.endFill();
    }

    setLine(graphics, 8, this.visualProfile.groundBorderColor);
    graphics.drawRect(0, 0, ARENA.width, ARENA.height);
  }

  // Faux-3D ground: a screen-space vertical gradient (dark/far at top, bright/near at
  // bottom) plus a soft edge vignette, implying the flat arena is a tilted plane.
  drawPerspectiveGround(camera) {
    const graphics = this.layers.arena;
    const alphaScale = this.visualProfile.effectLayerAlpha;
    const left = camera.x - 40;
    const right = camera.x + camera.width + 40;
    const top = camera.y - 40;
    const height = camera.height + 80;
    const width = right - left;
    // Vertical depth gradient: stacked translucent bands, darker toward the top (far).
    const bands = 14;
    for (let index = 0; index < bands; index += 1) {
      const t = index / (bands - 1); // 0 at top (far) -> 1 at bottom (near)
      const bandY = top + height * (index / bands);
      const bandH = height / bands + 1;
      // Far = cool shade (depth), near = warm highlight (light hitting the ground).
      if (t < 0.5) {
        const k = (0.5 - t) * 2; // strongest at very top
        beginFill(graphics, "#16331f", 0.26 * k * alphaScale);
      } else {
        const k = (t - 0.5) * 2; // strongest at very bottom
        beginFill(graphics, "#fff3c4", 0.1 * k * alphaScale);
      }
      graphics.drawRect(left, bandY, width, bandH);
      graphics.endFill();
    }
    // Edge vignette: darken the four screen borders so the plane reads as receding.
    const vig = 90;
    beginFill(graphics, "#0d2415", 0.3 * alphaScale);
    graphics.drawRect(left, top, width, vig);
    graphics.drawRect(left, top + height - vig, width, vig);
    graphics.drawRect(left, top, vig, height);
    graphics.drawRect(right - vig, top, vig, height);
    graphics.endFill();
  }

  drawDecorations(camera) {
    const startX = Math.floor(camera.x / DECORATION_STEP_X) * DECORATION_STEP_X;
    const startY = Math.floor(camera.y / DECORATION_STEP_Y) * DECORATION_STEP_Y;

    for (let x = startX; x <= camera.x + camera.width + DECORATION_STEP_X; x += DECORATION_STEP_X) {
      for (let y = startY; y <= camera.y + camera.height + DECORATION_STEP_Y; y += DECORATION_STEP_Y) {
        const gridX = Math.round(x / DECORATION_STEP_X);
        const gridY = Math.round(y / DECORATION_STEP_Y);
        const placementNoise = hashNoise(gridX, gridY, 1);
        if (placementNoise < 0.38) {
          continue;
        }

        const typeRoll = hashNoise(gridX, gridY, 7);
        const type = typeRoll < 0.22
          ? "grass"
          : typeRoll < 0.48
            ? "flowers"
            : typeRoll < 0.7
              ? "clover"
              : typeRoll < 0.86
                ? "butterfly"
                : "bunny";

        const visual = this.acquireFromPool("decorations", this.spriteLayers.decorations, () => {
          const sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
          sprite.anchor.set(0.5);
          return sprite;
        });
        const textureData = this.getDecorationTexture(type);
        const jitterX = (hashNoise(gridX, gridY, 11) - 0.5) * 48;
        const jitterY = (hashNoise(gridX, gridY, 13) - 0.5) * 42;
        const scale = 0.72 + hashNoise(gridX, gridY, 17) * 0.34;

        visual.texture = textureData.texture;
        visual.position.set(x + 40 + jitterX, y + 34 + jitterY);
        visual.rotation = (hashNoise(gridX, gridY, 19) - 0.5) * (type === "butterfly" ? 0.9 : 0.32);
        visual.scale.set(scale);
        visual.alpha = type === "butterfly" ? 0.84 : type === "bunny" ? 0.82 : 0.74 + hashNoise(gridX, gridY, 23) * 0.12;
      }
    }
  }

  drawPlayer(player, delta, characterId = "spriteScout") {
    const glowPulse = 1 + Math.sin(this.getMotionTime(0.006)) * 0.04;
    const textureData = this.getPlayerTexture(characterId);
    const mainScale = (player.radius / textureData.baseRadius) * 0.93 * PLAYER_VISUAL_SCALE;
    const visualRadius = textureData.baseRadius * mainScale;
    this.playerVisual.position.set(player.x, player.y);
    this.playerVisual.mainSprite.texture = textureData.texture;
    this.playerVisual.mainSprite.tint = 0xffffff;
    this.playerVisual.mainSprite.alpha = player.phaseFadeFor > 0 ? 0.48 : 1;
    this.playerVisual.mainSprite.scale.set(mainScale);
    this.playerVisual.mainSprite.rotation = 0;
    // Faux-3D billboard bob for the player, matching enemies.
    const playerBob = this.perspectiveMode
      ? (Math.sin(this.getMotionTime(0.005)) * 0.5 + 0.5) * visualRadius * 0.1
      : 0;
    const playerLift = this.perspectiveMode ? visualRadius * 0.14 + playerBob : 0;
    this.playerVisual.mainSprite.y = -playerLift;
    this.playerVisual.shadowSprite.y = this.perspectiveMode ? 14 : 12;
    this.playerVisual.shadowSprite.scale.set((player.radius / 24) * 1.38 * PLAYER_VISUAL_SCALE, (player.radius / 24) * (this.perspectiveMode ? 0.64 : 0.74) * PLAYER_VISUAL_SCALE);
    this.playerVisual.shadowSprite.alpha = (player.phaseFadeFor > 0 ? 0.08 : 0.16) * (this.perspectiveMode ? 1.6 : 1);
    this.playerVisual.glowSprite.scale.set((player.radius / 24) * 1.24 * PLAYER_VISUAL_SCALE * glowPulse);
    this.playerVisual.glowSprite.alpha = (player.invulnerableFor > 0 || player.phaseFadeFor > 0 ? 0.34 : 0.22) * this.visualProfile.effectLayerAlpha;

    const graphics = this.layers.playerOverlay;
    if (player.invulnerableFor > 0) {
      setLine(graphics, 3, "rgba(255, 255, 255, 0.78)");
      graphics.drawCircle(player.x, player.y, visualRadius + 8 + Math.sin(this.getMotionTime(0.012)) * 2);
    }

    if (Math.random() < delta * this.getSpawnRate(3.5)) {
      this.spawnParticle({
        x: player.x + (Math.random() - 0.5) * visualRadius * 0.7,
        y: player.y - visualRadius * 0.24,
        vx: (Math.random() - 0.5) * 12,
        vy: -10 - Math.random() * 12,
        life: 0.4,
        scale: 0.28,
        color: "#fff3d8",
        alpha: 0.3,
        blendMode: SCREEN_BLEND,
      });
    }
  }

  drawEnemies(enemies, delta) {
    const barGraphics = this.layers.enemyBars;
    // Y-sort so nearer (lower on screen) enemies overlap the ones behind them.
    this.spriteLayers.enemies.sortableChildren = this.perspectiveMode;
    for (const enemy of enemies) {
      const visual = this.acquireFromPool("enemies", this.spriteLayers.enemies, () => this.createEnemyVisual());
      if (this.perspectiveMode) {
        visual.zIndex = enemy.y;
      }
      const textureData = this.getEnemyTexture(enemy);
      const scale = enemy.radius / textureData.baseRadius;
      const mainScale = scale * (enemy.boss ? 0.98 * BOSS_VISUAL_SCALE : enemy.elite ? 1.54 * NORMAL_ENEMY_VISUAL_SCALE : 1.33 * NORMAL_ENEMY_VISUAL_SCALE);
      const visualRadius = textureData.baseRadius * mainScale;
      const glowTint = parseColor(enemy.boss ? enemy.detailColor || enemy.accent : enemy.elite ? enemy.detailColor || enemy.color : enemy.accent).color;
      const pulse = enemy.boss
        ? 1 + Math.sin(this.getMotionTime(0.008) + enemy.x * 0.01) * 0.06
        : enemy.elite
          ? 1 + Math.sin(this.getMotionTime(0.01) + enemy.specialPhase) * 0.12
        : enemy.regionExclusive
          ? 1 + Math.sin(this.getMotionTime(0.01) + enemy.specialPhase) * 0.08
          : 1;

      visual.position.set(enemy.x, enemy.y);
      visual.mainSprite.texture = textureData.texture;
      // Faction readability: keep each enemy's hue, but ground it toward its own darker
      // accent (rather than brightening toward white) so pale/warm bugs still read as
      // saturated threats against the green field + pastel allies.
      const enemyAccent = enemy.accent || enemy.color;
      // 灵魂剥离: a stripped soul reads as a pale violet spectre, not a solid body.
      const isSoul = Boolean(enemy.isSoul);
      const baseTint = isSoul
        ? mixColors(mixColors(enemy.color, 0xb9a6ff, 0.62), 0xffffff, 0.28)
        : enemy.boss
          ? mixColors(enemy.color, 0xffffff, 0.1)
          : enemy.elite
            ? mixColors(enemy.color, enemyAccent, 0.32)
            : mixColors(enemy.color, enemyAccent, 0.5);
      // Hit flash: briefly blend the sprite toward white when recently damaged.
      const flash = enemy.hitFlash > 0 ? Math.min(1, enemy.hitFlash / 0.09) : 0;
      visual.mainSprite.tint = flash > 0 ? mixColors(baseTint, 0xffffff, 0.7 * flash) : baseTint;
      visual.mainSprite.alpha = isSoul
        ? 0.46 + Math.sin(this.getMotionTime(0.004) + enemy.specialPhase) * 0.08
        : enemy.boss ? 0.98 : enemy.elite ? 1 : enemy.regionExclusive ? 0.98 : 0.96;
      visual.mainSprite.scale.set(mainScale);
      const enemyRotation = enemy.boss && enemy.shapeId === "twilightMower"
        ? (enemy.attackPhase || 0) * 0.18
        : enemy.regionExclusive && (enemy.shapeId === "serpentKin" || enemy.shapeId === "tempestKin" || enemy.shapeId === "twilightKin")
          ? Math.sin(this.getMotionTime(0.002) + enemy.specialPhase) * 0.16
          : 0;
      visual.mainSprite.rotation = enemyRotation;

      // Faux-3D billboard bob: lift the body off the ground a little so sprites feel like
      // stand-up cutouts, while the shadow stays planted. Disabled when perspective is off.
      const bob = this.perspectiveMode
        ? (Math.sin(this.getMotionTime(0.004) + enemy.x * 0.03 + enemy.y * 0.02) * 0.5 + 0.5) * visualRadius * 0.12
        : 0;
      const baseLift = this.perspectiveMode ? visualRadius * 0.14 : 0;
      const bodyLift = baseLift + bob;
      visual.mainSprite.y = -bodyLift;

      // Dark hostile silhouette rim behind the body (a scaled-up copy of the sprite);
      // tiered so higher ranks look more menacing. Aligned to the body's rotation.
      const rimColor = isSoul
        ? 0x7d5fc4
        : enemy.boss || enemy.regionExclusive
          ? 0x2a0d24
          : enemy.elite
            ? 0x3a1410
            : parseColor(enemyAccent).color;
      visual.rimSprite.texture = textureData.texture;
      visual.rimSprite.tint = flash > 0 ? 0xffffff : rimColor;
      visual.rimSprite.scale.set(mainScale * (enemy.boss ? 1.16 : enemy.elite ? 1.2 : 1.22));
      visual.rimSprite.rotation = enemyRotation;
      visual.rimSprite.y = -bodyLift;
      // Souls get only a faint spectral halo instead of a solid dark silhouette.
      visual.rimSprite.alpha = (isSoul ? 0.26 : enemy.boss || enemy.elite || enemy.regionExclusive ? 0.72 : 0.5) * (flash > 0 ? 0.4 : 1);
      // Grounded contact shadow: stronger/offset in perspective mode, and it shrinks a
      // touch as the body lifts, reinforcing the sense of height.
      const shadowShrink = this.perspectiveMode ? 1 - (bodyLift / Math.max(1, visualRadius)) * 0.3 : 1;
      visual.shadowSprite.y = this.perspectiveMode ? 14 : 12;
      visual.shadowSprite.scale.set(mainScale * 1.4 * shadowShrink, mainScale * (this.perspectiveMode ? 0.7 : 0.82) * shadowShrink);
      // A soul barely touches the ground, so its contact shadow is almost gone.
      visual.shadowSprite.alpha = (enemy.boss ? 0.28 : enemy.elite ? 0.26 : enemy.regionExclusive ? 0.22 : 0.18) * (this.perspectiveMode ? 1.5 : 1) * (isSoul ? 0.28 : 1);
      visual.glowSprite.tint = isSoul ? 0xb9a6ff : glowTint;
      visual.glowSprite.scale.set(mainScale * (enemy.boss ? 2.45 : enemy.elite ? 2.08 : enemy.regionExclusive ? 1.88 : 1.54) * pulse);
      visual.glowSprite.alpha = (isSoul ? 0.3 : enemy.boss ? 0.24 : enemy.elite ? 0.2 : enemy.regionExclusive ? 0.18 : 0.09) * this.visualProfile.effectLayerAlpha;

      if (enemy.boss) {
        const bossEffect = this.acquireFromPool("bossEffects", this.spriteLayers.bossEffects, () => this.createBossEffectVisual());
        const bossAuraTexture = this.getBossEffectTexture();
        bossEffect.position.set(enemy.x, enemy.y);
        bossEffect.mainSprite.texture = bossAuraTexture.texture;
        bossEffect.mainSprite.tint = mixColors(enemy.detailColor || enemy.accent, 0xffffff, 0.22);
        bossEffect.mainSprite.scale.set((enemy.radius / bossAuraTexture.baseRadius) * (2 + pulse * 0.08) * BOSS_VISUAL_SCALE);
        bossEffect.mainSprite.alpha = 0.28 * this.visualProfile.effectLayerAlpha;
        bossEffect.mainSprite.rotation = this.getMotionTime(0.0012) + enemy.attackPhase * 0.04;
        bossEffect.haloSprite.tint = parseColor(enemy.accent).color;
        bossEffect.haloSprite.scale.set((enemy.radius / 24) * 2.7 * BOSS_VISUAL_SCALE);
        bossEffect.haloSprite.alpha = 0.16 * this.visualProfile.effectLayerAlpha;
      } else if (enemy.regionExclusive) {
        setLine(barGraphics, 1.6, enemy.detailColor);
        barGraphics.drawCircle(enemy.x, enemy.y, visualRadius * (0.62 + Math.sin(this.getMotionTime(0.006) + enemy.specialPhase) * 0.04));
        if (Math.random() < delta * this.getSpawnRate(10)) {
          const angle = Math.random() * Math.PI * 2;
          const distance = visualRadius * (0.22 + Math.random() * 0.46);
          let particleColor = enemy.detailColor;
          let velocityX = Math.cos(angle) * 8;
          let velocityY = Math.sin(angle) * 8 - 6;

          if (enemy.effectId === "vineArc") {
            particleColor = enemy.accent;
            velocityX = Math.cos(angle) * 10;
            velocityY = Math.sin(angle) * 6 - 4;
          } else if (enemy.effectId === "amberChip") {
            particleColor = "#ffdba3";
            velocityX = Math.cos(angle) * 14;
            velocityY = Math.sin(angle) * 14;
          } else if (enemy.effectId === "mothDust") {
            particleColor = "#f7e6ff";
            velocityX = Math.cos(angle) * 5;
            velocityY = Math.sin(angle) * 5 - 7;
          } else if (enemy.effectId === "prismGlint") {
            particleColor = "#e4fbff";
            velocityX = Math.cos(angle) * 12;
            velocityY = Math.sin(angle) * 10;
          } else if (enemy.effectId === "sporeMist") {
            particleColor = "#f2f8cb";
            velocityX = Math.cos(angle) * 4;
            velocityY = -8 - Math.random() * 6;
          } else if (enemy.effectId === "windRibbon") {
            particleColor = "#ffe6db";
            velocityX = Math.cos(angle) * 16;
            velocityY = Math.sin(angle) * 10;
          } else if (enemy.effectId === "eclipseSpark") {
            particleColor = "#ffd8e8";
            velocityX = Math.cos(angle) * 10;
            velocityY = Math.sin(angle) * 10 + 4;
          } else if (enemy.effectId === "lanternWisp") {
            particleColor = "#dfe8ff";
            velocityX = Math.cos(angle) * 6;
            velocityY = -10 - Math.random() * 4;
          } else if (enemy.effectId === "twilightScythe") {
            particleColor = "#ffd8d0";
            velocityX = Math.cos(angle) * 14;
            velocityY = Math.sin(angle) * 12;
          }

          this.spawnParticle({
            x: enemy.x + Math.cos(angle) * distance,
            y: enemy.y + Math.sin(angle) * distance,
            vx: velocityX,
            vy: velocityY,
            life: 0.36,
            scale: 0.22,
            color: particleColor,
            alpha: 0.32,
            blendMode: SCREEN_BLEND,
          });
        }
      }

      const width = Math.max(enemy.radius * 2.28, visualRadius * 1.5);
      const healthBarY = enemy.y - visualRadius - 11;
      const ratio = clamp(enemy.health / enemy.maxHealth, 0, 1);
      beginFill(barGraphics, "rgba(37, 45, 31, 0.2)");
      barGraphics.drawRoundedRect(enemy.x - width / 2, healthBarY, width, 5, 3);
      barGraphics.endFill();
      beginFill(barGraphics, enemy.boss ? "#ef6677" : "#ffffff");
      barGraphics.drawRoundedRect(enemy.x - width / 2, healthBarY, width * ratio, 5, 3);
      barGraphics.endFill();

      // Boss shield: its own bar above the health bar plus a hard ring around the body,
      // so "chew through this before you can hurt it" is immediately readable.
      if (enemy.bossShieldHp > 0 && enemy.bossShieldMax > 0) {
        const shieldRatio = clamp(enemy.bossShieldHp / enemy.bossShieldMax, 0, 1);
        const shieldBarY = healthBarY - 8;
        beginFill(barGraphics, "rgba(28, 44, 62, 0.34)");
        barGraphics.drawRoundedRect(enemy.x - width / 2, shieldBarY, width, 5, 3);
        barGraphics.endFill();
        beginFill(barGraphics, "#8fd4ff");
        barGraphics.drawRoundedRect(enemy.x - width / 2, shieldBarY, width * shieldRatio, 5, 3);
        barGraphics.endFill();
        const shieldPulse = 1 + Math.sin(this.getMotionTime(0.009)) * 0.04;
        setLine(barGraphics, 3.4, "rgba(143, 212, 255, 0.9)");
        barGraphics.drawCircle(enemy.x, enemy.y, visualRadius * 1.22 * shieldPulse);
        setLine(barGraphics, 1.6, "rgba(226, 246, 255, 0.7)");
        barGraphics.drawCircle(enemy.x, enemy.y, visualRadius * 1.1 * shieldPulse);
      } else if (enemy.bossVulnerableFor > 0) {
        // Stagger window: broken shards orbit the exposed boss.
        const spin = this.getMotionTime(0.004);
        setLine(barGraphics, 3, "rgba(255, 226, 138, 0.9)");
        for (let index = 0; index < 6; index += 1) {
          const a = (Math.PI * 2 * index) / 6 + spin;
          const inner = visualRadius * 1.16;
          const outer = visualRadius * 1.42;
          barGraphics.moveTo(enemy.x + Math.cos(a) * inner, enemy.y + Math.sin(a) * inner);
          barGraphics.lineTo(enemy.x + Math.cos(a) * outer, enemy.y + Math.sin(a) * outer);
        }
      }

      if (enemy.boss && Math.random() < delta * 7) {
        const angle = Math.random() * Math.PI * 2;
        const distance = enemy.radius * (0.8 + Math.random() * 0.5);
        this.spawnParticle({
          x: enemy.x + Math.cos(angle) * distance,
          y: enemy.y + Math.sin(angle) * distance,
          vx: Math.cos(angle) * 12,
          vy: Math.sin(angle) * 12,
          life: 0.48,
          scale: 0.34,
          color: enemy.detailColor || enemy.accent,
          alpha: 0.4,
          blendMode: SCREEN_BLEND,
        });
      }
    }
  }

  drawProjectiles(projectiles, delta) {
    const fallbackGraphics = this.layers.projectileFallbacks;
    for (const projectile of projectiles) {
      const isBubble = projectile.skillId === "bubbleBurst" || projectile.skillId === "bubbleShard";
      const isPrism = projectile.skillId === "glassPrismRay";
      const isRollingPearl = Boolean(projectile.rollingPearl);
      const isDeerCharge = Boolean(projectile.antlerCharge);
      const definition = getSkillDefinition(projectile.sourceSkillId || projectile.skillId);
      const advancedProjectile = Boolean(definition?.advancedBehavior || projectile.advancedBomb || projectile.advancedBoomerang || projectile.skillId.endsWith("Shard"));
      const supported = [
        "elfArrow",
        "flyingSword",
        "bubbleBurst",
        "bubbleShard",
        "thornVolley",
        "thornShard",
        "meteorShard",
        "sporeShard",
        "ribbonBlade",
        "ribbonShard",
        "cometPlow",
        "brambleBoomerang",
      ].includes(projectile.skillId) || advancedProjectile;

      if (!supported) {
        beginFill(fallbackGraphics, projectile.color);
        fallbackGraphics.drawCircle(projectile.x, projectile.y, projectile.radius);
        fallbackGraphics.endFill();
        continue;
      }

      const visual = this.acquireFromPool("projectiles", this.spriteLayers.projectiles, () => this.createProjectileVisual());
      const textureData = this.getProjectileTexture(projectile);
      const angle = Math.atan2(projectile.vy, projectile.vx);
      const scale = projectile.radius / textureData.baseRadius;
      // The rolling pearl grows, so keep its sprite matched to the real hitbox radius.
      // The deer sprite is drawn long and low, so it is sized off the hitbox directly
      // instead of being padded out like the compact projectiles.
      const mainScale = scale * (projectile.skillId === "flyingSword" ? 1.35 : isBubble ? 1.26 : isRollingPearl ? 1.02 : isDeerCharge ? 1.05 : 1.18);
      const glowTint = parseColor(projectile.color).color;

      visual.position.set(projectile.x, projectile.y);
      visual.mainSprite.texture = textureData.texture;
      visual.mainSprite.tint = projectile.skillId === "flyingSword"
        ? (projectile.giant ? 0xffe3a2 : mixColors(projectile.color, 0xffffff, 0.28))
        : mixColors(projectile.color, 0xffffff, isBubble ? 0.2 : 0.2);
      visual.mainSprite.scale.set(mainScale * (projectile.giant ? 1.08 : 1));
      // A phantom is translucent; the crystal variant is more solid.
      visual.mainSprite.alpha = isBubble ? 0.84 : isDeerCharge ? 0.78 + (projectile.crystalLevel || 0) * 0.08 : 1;
      visual.mainSprite.rotation = isRollingPearl
        ? projectile.spin || 0
        : isBubble ? this.getMotionTime(0.0018) + projectile.x * 0.0006 : angle;
      visual.glowSprite.tint = isBubble ? 0xe6fbff : glowTint;
      visual.glowSprite.scale.set(mainScale * (projectile.skillId === "meteorShard" ? 1.75 : projectile.skillId === "flyingSword" ? 1.92 : isPrism ? 2.2 : isBubble ? 1.72 : isRollingPearl ? 1.6 : isDeerCharge ? 1.85 : 1.38));
      visual.glowSprite.alpha = (isRollingPearl
        ? 0.34
        : isBubble
        ? 0.18
        : isPrism
          ? 0.42
          // The phantom is made of light, and 晶华鹿角 makes it brighter still. It also
          // dims as stamina drains, so the charge visibly runs out of steam.
          : isDeerCharge
            ? (0.3 + (projectile.crystalLevel || 0) * 0.12)
              * (0.45 + 0.55 * Math.max(0, Math.min(1, projectile.stamina / Math.max(1, projectile.staminaMax))))
          : projectile.skillId === "flyingSword"
            ? (projectile.giant ? 0.34 : 0.22)
            : projectile.skillId === "ribbonBlade" || projectile.skillId === "ribbonShard"
              ? 0.18
              : 0.15) * this.visualProfile.effectLayerAlpha;
      visual.ringSprite.visible = Boolean(projectile.tracking) || isBubble;
      if (projectile.tracking || isBubble) {
        visual.ringSprite.tint = 0xdff6ff;
        visual.ringSprite.scale.set(scale * (isBubble ? 1.46 : 1.8));
        visual.ringSprite.alpha = 0.22 * this.visualProfile.effectLayerAlpha;
        visual.ringSprite.rotation = isBubble ? -this.getMotionTime(0.0026) : angle + this.getMotionTime(0.002);
      }

      if (Math.random() < delta * this.getSpawnRate(projectile.skillId === "flyingSword" ? 22 : projectile.skillId === "meteorShard" ? 26 : isPrism ? 30 : 14)) {
        this.spawnParticle({
          x: projectile.x - Math.cos(angle) * projectile.radius * 0.8,
          y: projectile.y - Math.sin(angle) * projectile.radius * 0.8,
          vx: -Math.cos(angle) * (isBubble ? 11 : 16) + (Math.random() - 0.5) * 8,
          vy: -Math.sin(angle) * (isBubble ? 11 : 16) + (Math.random() - 0.5) * 8,
          life: projectile.skillId === "meteorShard" ? 0.42 : isBubble ? 0.28 : isPrism ? 0.4 : 0.34,
          scale: projectile.skillId === "flyingSword" ? 0.36 : isBubble ? 0.22 : isPrism ? 0.34 : 0.28,
          color: projectile.skillId === "meteorShard" ? "#ffba87" : projectile.skillId === "ribbonBlade" || projectile.skillId === "ribbonShard" ? "#f2ecff" : isBubble ? "#c8f7ff" : projectile.color,
          alpha: isPrism ? 0.6 : 0.42,
          blendMode: projectile.skillId === "ribbonBlade" || projectile.skillId === "ribbonShard" || isBubble ? SCREEN_BLEND : PIXI.BLEND_MODES.ADD,
        });
      }
    }
  }

  drawEnemyProjectiles(projectiles, delta) {
    for (const projectile of projectiles) {
      const visual = this.acquireFromPool("enemyProjectiles", this.spriteLayers.enemyProjectiles, () => this.createEnemyProjectileVisual());
      const textureData = this.getEnemyProjectileTexture(projectile);
      const angle = Math.atan2(projectile.vy, projectile.vx);
      const scale = projectile.radius / textureData.baseRadius;
      const mainScale = scale * (projectile.kind === "moth" ? 1.2 : projectile.kind === "lantern" ? 1.27 : 1.12);
      visual.position.set(projectile.x, projectile.y);
      visual.mainSprite.texture = textureData.texture;
      visual.mainSprite.tint = mixColors(projectile.color, 0xffffff, 0.18);
      visual.mainSprite.scale.set(mainScale);
      visual.mainSprite.rotation = projectile.kind === "seed" || projectile.kind === "spore" || projectile.kind === "sporeShard"
        ? 0
        : angle;
      visual.glowSprite.tint = parseColor(projectile.color).color;
      visual.glowSprite.scale.set(mainScale * (projectile.kind === "lantern" ? 1.72 : 1.34));
      visual.glowSprite.alpha = (projectile.kind === "seed" ? 0.12 : 0.18) * this.visualProfile.effectLayerAlpha;

      if (Math.random() < delta * this.getSpawnRate(8)) {
        this.spawnParticle({
          x: projectile.x,
          y: projectile.y,
          vx: (Math.random() - 0.5) * 16,
          vy: (Math.random() - 0.5) * 16,
          life: 0.28,
          scale: 0.22,
          color: projectile.color,
          alpha: 0.22,
          blendMode: SCREEN_BLEND,
        });
      }
    }
  }

  createDamageNumberVisual() {
    const text = new PIXI.Text("", {
      fontFamily: "\"Arial Rounded MT Bold\", \"Trebuchet MS\", sans-serif",
      fontSize: 24,
      fontWeight: "900",
      fill: "#fff6d8",
      stroke: "#6e3c6b",
      strokeThickness: 5,
      dropShadow: true,
      dropShadowColor: "#4a2354",
      dropShadowBlur: 0,
      dropShadowAngle: Math.PI / 2,
      dropShadowDistance: 3,
      letterSpacing: 0,
      lineJoin: "round",
    });
    text.anchor.set(0.5);
    return text;
  }

  drawDamageNumbers(numbers) {
    for (const number of numbers) {
      const visual = this.acquireFromPool("damageNumbers", this.spriteLayers.damageNumbers, () => this.createDamageNumberVisual());
      const progress = clamp(number.age / Math.max(0.001, number.maxDuration || 1), 0, 1);
      const crit = Boolean(number.crit);
      const stackSlot = number.stackSlot || 0;
      const stackScale = stackSlot >= 5 ? 0.52 : Math.max(0.7, 1 - stackSlot * 0.08);
      const stackAlpha = stackSlot >= 5 ? 0.18 : Math.max(0.42, 1 - stackSlot * 0.14);
      const pop = crit
        ? 1 + Math.sin(Math.min(1, progress * 2.4) * Math.PI) * 0.28
        : 1 + Math.sin(Math.min(1, progress * 2.2) * Math.PI) * 0.12;

      visual.text = crit ? `*${number.value}*` : String(number.value);
      visual.style.fontSize = crit ? 34 : 23;
      visual.style.fill = crit ? "#ffe76d" : "#fff7dc";
      visual.style.stroke = crit ? "#b44773" : "#6d4a8d";
      visual.style.strokeThickness = crit ? 7 : 5;
      visual.position.set(number.x, number.y);
      visual.scale.set(pop * stackScale);
      visual.rotation = Math.sin((number.age + number.x * 0.001) * 8) * (crit ? 0.08 : 0.04);
      const fadeStart = number.fadeOut ? 0 : 0.62;
      visual.alpha = stackAlpha * clamp(1 - Math.max(0, progress - fadeStart) / Math.max(0.001, 1 - fadeStart), 0, 1);
    }
  }

  drawPulses(pulses, delta) {
    const graphics = this.layers.pulses;
    for (const pulse of pulses) {
      if (pulse.delay > 0) {
        continue;
      }
      setLine(graphics, 9, "rgba(255,255,255,0.12)");
      graphics.drawCircle(pulse.x, pulse.y, pulse.radius * 0.92);
      setLine(graphics, 4, pulse.color);
      graphics.drawCircle(pulse.x, pulse.y, pulse.radius * 0.84);
      setLine(graphics, 2, "rgba(255,255,255,0.76)");
      graphics.drawCircle(pulse.x, pulse.y, pulse.radius * 0.58);
      for (let index = 0; index < 12; index += 1) {
        const angle = (Math.PI * 2 * index) / 12;
        const inner = pulse.radius * 0.7;
        const outer = pulse.radius * 1.02;
        graphics.moveTo(pulse.x + Math.cos(angle) * inner, pulse.y + Math.sin(angle) * inner);
        graphics.lineTo(pulse.x + Math.cos(angle) * outer, pulse.y + Math.sin(angle) * outer);
      }
      if (Math.random() < delta * this.getSpawnRate(18)) {
        const angle = Math.random() * Math.PI * 2;
        const radius = pulse.radius * (0.5 + Math.random() * 0.42);
        this.spawnParticle({
          x: pulse.x + Math.cos(angle) * radius,
          y: pulse.y + Math.sin(angle) * radius,
          vx: Math.cos(angle) * 18,
          vy: Math.sin(angle) * 18,
          life: 0.34,
          scale: 0.26,
          color: pulse.color,
          alpha: 0.28,
        });
      }
    }
  }

  drawSkillEffects(effects, delta) {
    const graphics = this.layers.skillEffects;
    for (const effect of effects) {
      const progress = getProgress(effect);
      if (effect.kind === "frostBudZone") {
        const pulse = Math.sin(this.getMotionTime(0.006) + effect.x * 0.004) * 0.04;
        const radius = effect.radius * (1 + pulse);
        beginFill(graphics, "rgba(178, 238, 255, 0.13)");
        graphics.drawCircle(effect.x, effect.y, radius);
        graphics.endFill();
        setLine(graphics, 8, "rgba(217, 250, 255, 0.18)");
        graphics.drawCircle(effect.x, effect.y, radius * (0.9 + progress * 0.05));
        setLine(graphics, 3.5, effect.color || "rgba(150, 226, 255, 0.72)");
        graphics.drawCircle(effect.x, effect.y, radius * 0.96);
        setLine(graphics, 1.6, "rgba(255,255,255,0.78)");
        graphics.drawCircle(effect.x, effect.y, radius * 0.68);
        for (let index = 0; index < 10; index += 1) {
          const angle = (Math.PI * 2 * index) / 10 + this.getMotionTime(0.0014);
          const inner = radius * 0.26;
          const outer = radius * (0.78 + (index % 2) * 0.08);
          graphics.moveTo(effect.x + Math.cos(angle) * inner, effect.y + Math.sin(angle) * inner);
          graphics.lineTo(effect.x + Math.cos(angle) * outer, effect.y + Math.sin(angle) * outer);
          drawLeaf(
            graphics,
            effect.x + Math.cos(angle) * radius * 0.42,
            effect.y + Math.sin(angle) * radius * 0.42,
            radius * 0.28,
            radius * 0.075,
            angle + Math.PI / 2,
            index % 2 === 0 ? "rgba(232, 252, 255, 0.9)" : "rgba(142, 226, 255, 0.82)",
          );
        }
        beginFill(graphics, effect.accent || "rgba(245,253,255,0.92)", 0.8);
        drawStar(graphics, effect.x, effect.y, radius * 0.22, radius * 0.09, 6);
        graphics.endFill();
        if (Math.random() < delta * this.getSpawnRate(34)) {
          const angle = Math.random() * Math.PI * 2;
          const dist = radius * (0.18 + Math.random() * 0.74);
          this.spawnParticle({
            x: effect.x + Math.cos(angle) * dist,
            y: effect.y + Math.sin(angle) * dist,
            vx: Math.cos(angle) * 12,
            vy: Math.sin(angle) * 12 - 12,
            life: 0.56,
            scale: 0.26,
            color: "#e8fbff",
            alpha: 0.44,
            blendMode: SCREEN_BLEND,
          });
        }
      } else if (effect.kind === "mirrorClone") {
        const bob = Math.sin(this.getMotionTime(0.01) + effect.x * 0.01) * 2;
        beginFill(graphics, effect.color, 0.36 * (1 - progress * 0.4));
        graphics.drawEllipse(effect.x, effect.y + effect.radius * 0.18 + bob, effect.radius * 0.34, effect.radius * 0.48);
        graphics.endFill();
        beginFill(graphics, effect.accent, 0.44 * (1 - progress * 0.28));
        graphics.drawCircle(effect.x, effect.y - effect.radius * 0.32 + bob, effect.radius * 0.22);
        graphics.endFill();
        drawLeaf(graphics, effect.x - effect.radius * 0.22, effect.y - effect.radius * 0.04 + bob, effect.radius * 0.82, effect.radius * 0.24, -0.38, effect.color);
        drawLeaf(graphics, effect.x + effect.radius * 0.22, effect.y - effect.radius * 0.04 + bob, effect.radius * 0.82, effect.radius * 0.24, 0.38, effect.color);
        setLine(graphics, 2.6, effect.accent);
        graphics.drawCircle(effect.x, effect.y + bob, effect.radius * (0.72 + progress * 0.18));
      } else if (effect.kind === "vineWhip") {
        const controlX = (effect.x + effect.targetX) / 2 + (effect.targetY - effect.y) * 0.12;
        const controlY = (effect.y + effect.targetY) / 2 - (effect.targetX - effect.x) * 0.12;
        setLine(graphics, effect.thickness * 1.7, "rgba(194, 255, 178, 0.24)");
        graphics.moveTo(effect.x, effect.y);
        graphics.quadraticCurveTo(controlX, controlY, effect.targetX, effect.targetY);
        setLine(graphics, effect.thickness * (1 - progress * 0.22), effect.color);
        graphics.moveTo(effect.x, effect.y);
        graphics.quadraticCurveTo(controlX, controlY, effect.targetX, effect.targetY);
        if (Math.random() < delta * 20) {
          const ratio = Math.random();
          this.spawnParticle({
            x: lerp(effect.x, effect.targetX, ratio),
            y: lerp(effect.y, effect.targetY, ratio),
            vx: (Math.random() - 0.5) * 10,
            vy: -14 - Math.random() * 12,
            life: 0.32,
            scale: 0.22,
            color: effect.color,
            alpha: 0.32,
            blendMode: SCREEN_BLEND,
          });
        }
      } else if (effect.kind === "vineBloom") {
        beginFill(graphics, "rgba(200, 255, 197, 0.1)");
        graphics.drawCircle(effect.x, effect.y, effect.radius * (0.3 + progress * 0.5));
        graphics.endFill();
        for (let index = 0; index < 8; index += 1) {
          const angle = (Math.PI * 2 * index) / 8 + progress * 0.8;
          drawLeaf(graphics, effect.x + Math.cos(angle) * effect.radius * 0.16, effect.y + Math.sin(angle) * effect.radius * 0.16, effect.radius * 0.6, effect.radius * 0.18, angle, index % 2 === 0 ? effect.color : effect.accent);
        }
      } else if (effect.kind === "lotusBeam") {
        setLine(graphics, effect.thickness * 2.8, "rgba(255, 219, 184, 0.18)");
        graphics.moveTo(effect.x, effect.y);
        graphics.lineTo(effect.targetX, effect.targetY);
        setLine(graphics, effect.thickness * 1.65, effect.color);
        graphics.moveTo(effect.x, effect.y);
        graphics.lineTo(effect.targetX, effect.targetY);
        setLine(graphics, Math.max(2, effect.thickness * 0.42), "rgba(255,255,255,0.85)");
        graphics.moveTo(effect.x, effect.y);
        graphics.lineTo(effect.targetX, effect.targetY);
        if (Math.random() < delta * 26) {
          const ratio = Math.random();
          this.spawnParticle({
            x: lerp(effect.x, effect.targetX, ratio),
            y: lerp(effect.y, effect.targetY, ratio),
            vx: (Math.random() - 0.5) * 16,
            vy: (Math.random() - 0.5) * 16,
            life: 0.28,
            scale: 0.24,
            color: "#fff0db",
            alpha: 0.4,
          });
        }
      } else if (effect.kind === "meteorBurst") {
        setLine(graphics, 10, "rgba(255, 190, 135, 0.1)");
        graphics.drawCircle(effect.x, effect.y, effect.radius * (0.4 + progress * 0.42));
        setLine(graphics, 3, effect.color);
        graphics.drawCircle(effect.x, effect.y, effect.radius * (0.46 + progress * 0.38));
        beginFill(graphics, effect.accent);
        drawStar(graphics, effect.x, effect.y, effect.radius * (0.54 + progress * 0.14), effect.radius * 0.24, 6);
        graphics.endFill();
        for (let index = 0; index < 6; index += 1) {
          const angle = (Math.PI * 2 * index) / 6 + progress * 0.35;
          graphics.moveTo(effect.x, effect.y);
          graphics.lineTo(effect.x + Math.cos(angle) * effect.radius * (0.58 + progress * 0.36), effect.y + Math.sin(angle) * effect.radius * (0.58 + progress * 0.36));
        }
      } else if (effect.kind === "thunderArc") {
        const startX = effect.x;
        const startY = effect.y;
        const endX = effect.targetX;
        const endY = effect.targetY;
        const length = Math.hypot(endX - startX, endY - startY) || 1;
        const perpX = -(endY - startY) / length;
        const perpY = (endX - startX) / length;
        const drawArc = (width, color) => {
          setLine(graphics, width, color);
          graphics.moveTo(startX, startY);
          const segments = 7;
          for (let index = 1; index <= segments; index += 1) {
            const ratio = index / segments;
            const jitter = (Math.random() - 0.5) * 14;
            graphics.lineTo(
              startX + (endX - startX) * ratio + perpX * jitter,
              startY + (endY - startY) * ratio + perpY * jitter,
            );
          }
          graphics.lineTo(endX, endY);
        };
        drawArc(effect.thickness * 2.6, "rgba(210, 190, 255, 0.18)");
        drawArc(effect.thickness, effect.color);
        drawArc(Math.max(1.5, effect.thickness * 0.4), "rgba(255,255,255,0.85)");
      } else if (effect.kind === "thunderBurst") {
        setLine(graphics, 12, "rgba(210, 190, 255, 0.12)");
        graphics.drawCircle(effect.x, effect.y, effect.radius * (0.35 + progress * 0.5));
        setLine(graphics, 3, effect.color);
        graphics.drawCircle(effect.x, effect.y, effect.radius * (0.4 + progress * 0.44));
        beginFill(graphics, effect.accent);
        drawStar(graphics, effect.x, effect.y, effect.radius * (0.5 + progress * 0.12), effect.radius * 0.2, 8);
        graphics.endFill();
        for (let index = 0; index < 8; index += 1) {
          const angle = (Math.PI * 2 * index) / 8 + progress * 0.3;
          graphics.moveTo(effect.x, effect.y);
          graphics.lineTo(effect.x + Math.cos(angle) * effect.radius * (0.55 + progress * 0.34), effect.y + Math.sin(angle) * effect.radius * (0.55 + progress * 0.34));
        }
      } else if (effect.kind === "dewPop") {
        const popRadius = effect.radius * (0.3 + progress * 0.7);
        setLine(graphics, 8 * (1 - progress * 0.4), "rgba(170, 240, 230, 0.16)");
        graphics.drawCircle(effect.x, effect.y, popRadius);
        setLine(graphics, 2.6, effect.color);
        graphics.drawCircle(effect.x, effect.y, popRadius * 0.8);
        beginFill(graphics, effect.accent, 0.3 * (1 - progress));
        graphics.drawCircle(effect.x, effect.y, popRadius * 0.5);
        graphics.endFill();
        for (let index = 0; index < 6; index += 1) {
          const angle = (Math.PI * 2 * index) / 6 + progress * 0.5;
          graphics.moveTo(effect.x + Math.cos(angle) * popRadius * 0.2, effect.y + Math.sin(angle) * popRadius * 0.2);
          graphics.lineTo(effect.x + Math.cos(angle) * popRadius * 0.9, effect.y + Math.sin(angle) * popRadius * 0.9);
        }
      } else if (effect.kind === "brambleBurst") {
        beginFill(graphics, "rgba(150, 220, 70, 0.1)");
        graphics.drawCircle(effect.x, effect.y, effect.radius * (0.35 + progress * 0.5));
        graphics.endFill();
        for (let index = 0; index < 10; index += 1) {
          const angle = (Math.PI * 2 * index) / 10 + progress * 0.5;
          const dist = effect.radius * (0.3 + progress * 0.55);
          drawLeaf(graphics, effect.x + Math.cos(angle) * dist, effect.y + Math.sin(angle) * dist, effect.radius * 0.34, effect.radius * 0.12, angle, index % 2 === 0 ? "#9bcf63" : "#c7e88a");
        }
      } else if (effect.kind === "orchidBloom") {
        const fade = 1 - progress * 0.7;
        // Bold saturated core + expanding ring so the orchid impact is clearly visible.
        beginFill(graphics, effect.color, 0.42 * fade);
        graphics.drawCircle(effect.x, effect.y, effect.radius * (0.32 + progress * 0.5));
        graphics.endFill();
        setLine(graphics, 5 * fade, effect.color);
        graphics.drawCircle(effect.x, effect.y, effect.radius * (0.4 + progress * 0.62));
        setLine(graphics, 2, "rgba(255,255,255,0.9)");
        graphics.drawCircle(effect.x, effect.y, effect.radius * (0.34 + progress * 0.5));
        const petalCount = 10;
        for (let index = 0; index < petalCount; index += 1) {
          const angle = (Math.PI * 2 * index) / petalCount + progress * 0.6;
          const dist = effect.radius * (0.42 + progress * 0.52);
          drawLeaf(graphics, effect.x + Math.cos(angle) * dist, effect.y + Math.sin(angle) * dist, effect.radius * 0.6, effect.radius * 0.24, angle, index % 2 === 0 ? effect.color : "#f0ccff");
        }
        beginFill(graphics, "rgba(255,255,255,0.92)", fade);
        drawStar(graphics, effect.x, effect.y, effect.radius * 0.22, effect.radius * 0.09, 6);
        graphics.endFill();
        if (Math.random() < delta * 46) {
          const angle = Math.random() * Math.PI * 2;
          const dist = effect.radius * (0.3 + Math.random() * 0.7);
          this.spawnParticle({
            x: effect.x + Math.cos(angle) * dist,
            y: effect.y + Math.sin(angle) * dist,
            vx: Math.cos(angle) * 70,
            vy: Math.sin(angle) * 70,
            life: 0.45,
            scale: 0.28,
            color: "#e2b8ff",
            alpha: 0.66,
            blendMode: SCREEN_BLEND,
          });
        }
      } else if (effect.kind === "orchidPollen") {
        // 醉兰花粉: a drifting lavender pollen haze that lingers where the comet burst.
        const fade = 1 - progress;
        beginFill(graphics, effect.color, 0.2 * fade);
        graphics.drawCircle(effect.x, effect.y, effect.radius * (0.55 + progress * 0.6));
        graphics.endFill();
        setLine(graphics, 2.4 * fade, effect.accent || "#f0ccff");
        graphics.drawCircle(effect.x, effect.y, effect.radius * (0.6 + progress * 0.55));
        for (let index = 0; index < 6; index += 1) {
          const angle = (Math.PI * 2 * index) / 6 + this.getMotionTime(0.001);
          const dist = effect.radius * (0.4 + progress * 0.5);
          drawLeaf(graphics, effect.x + Math.cos(angle) * dist, effect.y + Math.sin(angle) * dist, effect.radius * 0.34, effect.radius * 0.14, angle, "#e9c8ff");
        }
        if (Math.random() < delta * 30) {
          const angle = Math.random() * Math.PI * 2;
          const dist = effect.radius * (0.2 + Math.random() * 0.7);
          this.spawnParticle({
            x: effect.x + Math.cos(angle) * dist,
            y: effect.y + Math.sin(angle) * dist,
            vx: Math.cos(angle) * 12,
            vy: Math.sin(angle) * 12 - 8,
            life: 0.6,
            scale: 0.22,
            color: "#e9c8ff",
            alpha: 0.5,
            blendMode: SCREEN_BLEND,
          });
        }
      } else if (effect.kind === "bubblePop") {
        const burstRadius = effect.radius * (0.28 + progress * 0.72);
        setLine(graphics, 9 * (1 - progress * 0.45), "rgba(171, 235, 255, 0.12)");
        graphics.drawCircle(effect.x, effect.y, burstRadius);
        setLine(graphics, 3, effect.color);
        graphics.drawCircle(effect.x, effect.y, burstRadius * 0.74);
        beginFill(graphics, "rgba(255,255,255,0.16)");
        graphics.drawCircle(effect.x, effect.y, burstRadius * 0.52);
        graphics.endFill();
        for (let index = 0; index < 5; index += 1) {
          const angle = (Math.PI * 2 * index) / 5 + progress * 0.32;
          graphics.moveTo(effect.x + Math.cos(angle) * burstRadius * 0.24, effect.y + Math.sin(angle) * burstRadius * 0.24);
          graphics.lineTo(effect.x + Math.cos(angle) * burstRadius * 0.92, effect.y + Math.sin(angle) * burstRadius * 0.92);
        }
        if (Math.random() < delta * 30) {
          const angle = Math.random() * Math.PI * 2;
          const distance = burstRadius * (0.2 + Math.random() * 0.5);
          this.spawnParticle({
            x: effect.x + Math.cos(angle) * distance,
            y: effect.y + Math.sin(angle) * distance,
            vx: Math.cos(angle) * 16,
            vy: Math.sin(angle) * 16,
            life: 0.26,
            scale: 0.2,
            color: "#dcfbff",
            alpha: 0.34,
            blendMode: SCREEN_BLEND,
          });
        }
      } else if (effect.kind === "vacuumSiphon") {
        const pullX = lerp(effect.x, effect.targetX, progress);
        const pullY = lerp(effect.y, effect.targetY, progress);
        const controlX = lerp(effect.x, effect.targetX, 0.45) + (effect.targetY - effect.y) * 0.08;
        const controlY = lerp(effect.y, effect.targetY, 0.45) - (effect.targetX - effect.x) * 0.08;
        setLine(graphics, effect.thickness * 2.2 * (1 - progress * 0.3), "rgba(255, 224, 118, 0.14)");
        graphics.moveTo(effect.x, effect.y);
        graphics.quadraticCurveTo(controlX, controlY, pullX, pullY);
        setLine(graphics, Math.max(1.5, effect.thickness * (1 - progress * 0.42)), effect.color);
        graphics.moveTo(effect.x, effect.y);
        graphics.quadraticCurveTo(controlX, controlY, pullX, pullY);
        beginFill(graphics, effect.accent, 0.88 - progress * 0.3);
        graphics.drawCircle(pullX, pullY, Math.max(3, effect.thickness * (1.18 - progress * 0.4)));
        graphics.endFill();
        if (Math.random() < delta * 26) {
          const ratio = Math.random() * progress;
          const px = lerp(effect.x, effect.targetX, ratio);
          const py = lerp(effect.y, effect.targetY, ratio);
          this.spawnParticle({
            x: px,
            y: py,
            vx: (Math.random() - 0.5) * 12,
            vy: -8 - Math.random() * 10,
            life: 0.3,
            scale: 0.24,
            color: "#fff3b1",
            alpha: 0.34,
            blendMode: SCREEN_BLEND,
          });
        }
      } else if (effect.kind === "vacuumField") {
        const radius = effect.radius * progress;
        setLine(graphics, 18 * (1 - progress * 0.35), "rgba(255, 224, 116, 0.08)");
        graphics.drawCircle(effect.x, effect.y, radius);
        setLine(graphics, 4.6 * (1 - progress * 0.22), effect.color);
        graphics.drawCircle(effect.x, effect.y, radius);
        setLine(graphics, 2.2, effect.accent);
        graphics.drawCircle(effect.x, effect.y, Math.max(0, radius - 16));
        for (let index = 0; index < 12; index += 1) {
          const angle = (Math.PI * 2 * index) / 12 + progress * 0.6;
          const inner = Math.max(0, radius - 20);
          const outer = radius + 12;
          graphics.moveTo(effect.x + Math.cos(angle) * inner, effect.y + Math.sin(angle) * inner);
          graphics.lineTo(effect.x + Math.cos(angle) * outer, effect.y + Math.sin(angle) * outer);
        }
        if (Math.random() < delta * 22) {
          const angle = Math.random() * Math.PI * 2;
          this.spawnParticle({
            x: effect.x + Math.cos(angle) * radius,
            y: effect.y + Math.sin(angle) * radius,
            vx: Math.cos(angle) * 16,
            vy: Math.sin(angle) * 16,
            life: 0.32,
            scale: 0.26,
            color: "#ffe58c",
            alpha: 0.32,
            blendMode: SCREEN_BLEND,
          });
        }
      } else if (effect.kind === "vacuumBurst") {
        setLine(graphics, 12, "rgba(255, 222, 111, 0.1)");
        graphics.drawCircle(effect.x, effect.y, effect.radius * (0.28 + progress * 0.52));
        setLine(graphics, 3.5, effect.color);
        graphics.drawCircle(effect.x, effect.y, effect.radius * (0.22 + progress * 0.42));
        beginFill(graphics, effect.accent, 0.24 * (1 - progress));
        graphics.drawCircle(effect.x, effect.y, effect.radius * (0.16 + progress * 0.24));
        graphics.endFill();
        beginFill(graphics, effect.accent);
        drawStar(graphics, effect.x, effect.y, effect.radius * (0.2 + progress * 0.12), effect.radius * 0.08, 8);
        graphics.endFill();
        for (let index = 0; index < 8; index += 1) {
          const angle = (Math.PI * 2 * index) / 8 + progress * 0.55;
          graphics.moveTo(effect.x, effect.y);
          graphics.lineTo(effect.x + Math.cos(angle) * effect.radius * (0.24 + progress * 0.38), effect.y + Math.sin(angle) * effect.radius * (0.24 + progress * 0.38));
        }
        if (Math.random() < delta * 36) {
          const angle = Math.random() * Math.PI * 2;
          const distance = effect.radius * (0.12 + progress * 0.38);
          this.spawnParticle({
            x: effect.x + Math.cos(angle) * distance,
            y: effect.y + Math.sin(angle) * distance,
            vx: Math.cos(angle) * 20,
            vy: Math.sin(angle) * 20,
            life: 0.34,
            scale: 0.26,
            color: "#ffe27c",
            alpha: 0.38,
            blendMode: SCREEN_BLEND,
          });
        }
      } else if (effect.kind === "stormSweep") {
        // A crackling lightning ribbon oriented perpendicular to its travel direction.
        const dirX = effect.dirX || 1;
        const dirY = effect.dirY || 0;
        const axisX = -dirY;
        const axisY = dirX;
        const half = effect.ribbonLength * 0.5;
        const ax = effect.x - axisX * half;
        const ay = effect.y - axisY * half;
        const bx = effect.x + axisX * half;
        const by = effect.y + axisY * half;
        setLine(graphics, (effect.halfWidth || 20) * 1.6, "rgba(159, 184, 255, 0.12)");
        graphics.moveTo(ax, ay);
        graphics.lineTo(bx, by);
        // Jagged bright core.
        const drawBolt = (width, color) => {
          setLine(graphics, width, color);
          graphics.moveTo(ax, ay);
          const segments = 8;
          for (let index = 1; index < segments; index += 1) {
            const ratio = index / segments;
            const jitter = (Math.random() - 0.5) * (effect.halfWidth || 20) * 0.9;
            graphics.lineTo(
              ax + (bx - ax) * ratio + dirX * jitter,
              ay + (by - ay) * ratio + dirY * jitter,
            );
          }
          graphics.lineTo(bx, by);
        };
        drawBolt(4.4, effect.color);
        drawBolt(1.8, "rgba(255,255,255,0.9)");
        if (Math.random() < delta * 40) {
          const ratio = Math.random();
          this.spawnParticle({
            x: lerp(ax, bx, ratio),
            y: lerp(ay, by, ratio),
            vx: dirX * (40 + Math.random() * 40),
            vy: dirY * (40 + Math.random() * 40),
            life: 0.26,
            scale: 0.24,
            color: "#dfe6ff",
            alpha: 0.5,
            blendMode: SCREEN_BLEND,
          });
        }
      } else if (effect.kind === "crescentSlash") {
        // A sweeping moon-blade arc anchored at the caster, drawn as an explicit polyline.
        const baseAngle = effect.angle || 0;
        const arcSpan = 1.7;
        const radius = effect.radius * (0.7 + progress * 0.7);
        const drawArcBand = (bandRadius, width, color) => {
          setLine(graphics, width, color);
          const segments = 14;
          for (let index = 0; index <= segments; index += 1) {
            const a = baseAngle - arcSpan / 2 + (arcSpan * index) / segments;
            const px = effect.x + Math.cos(a) * bandRadius;
            const py = effect.y + Math.sin(a) * bandRadius;
            if (index === 0) graphics.moveTo(px, py);
            else graphics.lineTo(px, py);
          }
        };
        drawArcBand(radius, 9 * (1 - progress * 0.5), "rgba(255, 190, 190, 0.16)");
        drawArcBand(radius * 0.94, 4 * (1 - progress * 0.4), effect.color);
        drawArcBand(radius * 0.88, 1.8, effect.accent || "rgba(255,255,255,0.85)");
        if (Math.random() < delta * 34) {
          const a = baseAngle - arcSpan / 2 + Math.random() * arcSpan;
          this.spawnParticle({
            x: effect.x + Math.cos(a) * radius,
            y: effect.y + Math.sin(a) * radius,
            vx: Math.cos(a) * 30,
            vy: Math.sin(a) * 30,
            life: 0.3,
            scale: 0.24,
            color: "#ffd3d0",
            alpha: 0.4,
            blendMode: SCREEN_BLEND,
          });
        }
      } else if (effect.kind === "clockDialDrop") {
        // The dial lands: a bright ring snaps outward to its final radius.
        const fade = 1 - progress;
        setLine(graphics, 7 * fade, effect.accent || "#fff3c4");
        graphics.drawCircle(effect.x, effect.y, effect.radius * (0.35 + progress * 0.7));
        setLine(graphics, 2.4 * fade, effect.color || "#f2c14b");
        graphics.drawCircle(effect.x, effect.y, effect.radius * (0.2 + progress * 0.95));
      } else if (effect.kind === "timeFold") {
        // 时间折叠: concentric gold shells pinched around the target, one per stack, so
        // the stack count is readable on the enemy itself.
        const fade = 1 - progress;
        const stacks = Math.max(1, effect.stacks || 1);
        const r = effect.radius;
        for (let index = 0; index < stacks; index += 1) {
          const shell = r * (0.5 + index * 0.22) * (1 + progress * 0.2);
          setLine(graphics, 2.6 * fade, index === stacks - 1 ? "#ffffff" : effect.color || "#f2c14b");
          graphics.drawCircle(effect.x, effect.y, shell);
        }
        // A folded-over clock hand, pointing nowhere.
        setLine(graphics, 3 * fade, effect.accent || "#fff3c4");
        const a = -Math.PI / 2 + stacks * 0.8;
        graphics.moveTo(effect.x, effect.y);
        graphics.lineTo(effect.x + Math.cos(a) * r * 0.5, effect.y + Math.sin(a) * r * 0.5);
        graphics.lineTo(effect.x + Math.cos(a + 1.9) * r * 0.34, effect.y + Math.sin(a + 1.9) * r * 0.34);
      } else if (effect.kind === "timeSnap") {
        // Time collapses inward: rings rush toward the center.
        const r = effect.radius;
        setLine(graphics, 14 * (1 - progress), "rgba(242, 193, 75, 0.2)");
        graphics.drawCircle(effect.x, effect.y, r * (1 - progress) + r * 0.1);
        setLine(graphics, 4, effect.color);
        graphics.drawCircle(effect.x, effect.y, r * (1 - progress) * 0.7 + r * 0.06);
        beginFill(graphics, effect.accent || "rgba(255,255,255,0.9)", 0.5 * (1 - progress));
        drawStar(graphics, effect.x, effect.y, r * 0.3 * (1 - progress) + 6, r * 0.12, 12);
        graphics.endFill();
        for (let index = 0; index < 12; index += 1) {
          const a = (Math.PI * 2 * index) / 12;
          const outer = r * (1 - progress) + r * 0.14;
          graphics.moveTo(effect.x + Math.cos(a) * outer, effect.y + Math.sin(a) * outer);
          graphics.lineTo(effect.x + Math.cos(a) * r * 0.08, effect.y + Math.sin(a) * r * 0.08);
        }
      } else if (effect.kind === "mothDust") {
        // Soft drifting scale-dust puff.
        beginFill(graphics, effect.color, 0.16 * (1 - progress));
        graphics.drawCircle(effect.x, effect.y, effect.radius * (0.6 + progress * 0.8));
        graphics.endFill();
        beginFill(graphics, effect.accent || "rgba(243,230,255,0.8)", 0.22 * (1 - progress));
        graphics.drawCircle(effect.x, effect.y, effect.radius * (0.3 + progress * 0.4));
        graphics.endFill();
        if (Math.random() < delta * 24) {
          const a = Math.random() * Math.PI * 2;
          this.spawnParticle({
            x: effect.x + Math.cos(a) * effect.radius * 0.4,
            y: effect.y + Math.sin(a) * effect.radius * 0.4,
            vx: Math.cos(a) * 8,
            vy: Math.sin(a) * 8 - 6,
            life: 0.5,
            scale: 0.2,
            color: "#e7d4ff",
            alpha: 0.36,
            blendMode: SCREEN_BLEND,
          });
        }
      } else if (effect.kind === "moonTether") {
        // A luminous moon thread from caster to the summoned well.
        setLine(graphics, (effect.thickness || 4) * 2, "rgba(239, 145, 194, 0.14)");
        graphics.moveTo(effect.x, effect.y);
        graphics.lineTo(effect.targetX, effect.targetY);
        setLine(graphics, effect.thickness || 4, effect.color);
        graphics.moveTo(effect.x, effect.y);
        graphics.lineTo(effect.targetX, effect.targetY);
        setLine(graphics, 1.6, effect.accent || "rgba(255,255,255,0.85)");
        graphics.moveTo(effect.x, effect.y);
        graphics.lineTo(effect.targetX, effect.targetY);
      } else if (effect.kind === "moonWell") {
        // A pulling well: outer pull ring + inner moon disc, with inward-drawn crescents.
        const r = effect.radius;
        const pr = effect.pullRadius || r * 1.6;
        const spin = this.getMotionTime(0.0018);
        setLine(graphics, 2.4, "rgba(239, 145, 194, 0.3)");
        graphics.drawCircle(effect.x, effect.y, pr * (0.98 - (effect.progress ?? 0) * 0.1));
        beginFill(graphics, effect.color, 0.14);
        graphics.drawCircle(effect.x, effect.y, r);
        graphics.endFill();
        setLine(graphics, 3, effect.accent || "rgba(255,240,248,0.9)");
        graphics.drawCircle(effect.x, effect.y, r * 0.7);
        for (let index = 0; index < 8; index += 1) {
          const a = (Math.PI * 2 * index) / 8 + spin;
          const outer = pr * 0.9;
          const inner = r * 0.75;
          graphics.moveTo(effect.x + Math.cos(a) * outer, effect.y + Math.sin(a) * outer);
          graphics.lineTo(effect.x + Math.cos(a) * inner, effect.y + Math.sin(a) * inner);
        }
        if (Math.random() < delta * 30) {
          const a = Math.random() * Math.PI * 2;
          const dist = pr * (0.6 + Math.random() * 0.4);
          this.spawnParticle({
            x: effect.x + Math.cos(a) * dist,
            y: effect.y + Math.sin(a) * dist,
            vx: -Math.cos(a) * 40,
            vy: -Math.sin(a) * 40,
            life: 0.4,
            scale: 0.22,
            color: "#ffd9ee",
            alpha: 0.4,
            blendMode: SCREEN_BLEND,
          });
        }
      } else if (effect.kind === "impactSpark") {
        // A quick bright flash + a few radial spark lines at the point of impact.
        const fade = 1 - progress;
        const r = effect.radius * (0.5 + progress * 0.7);
        beginFill(graphics, effect.accent || "#ffffff", 0.7 * fade);
        graphics.drawCircle(effect.x, effect.y, r * 0.45);
        graphics.endFill();
        setLine(graphics, 2.2 * fade, effect.color || "#ffffff");
        for (let index = 0; index < 5; index += 1) {
          const a = (Math.PI * 2 * index) / 5 + effect.x * 0.03;
          graphics.moveTo(effect.x + Math.cos(a) * r * 0.3, effect.y + Math.sin(a) * r * 0.3);
          graphics.lineTo(effect.x + Math.cos(a) * r, effect.y + Math.sin(a) * r);
        }
      } else if (effect.kind === "killBurst") {
        // Expanding ring + scattered debris marking a kill; bosses get an extra shockwave.
        const fade = 1 - progress;
        const r = effect.radius * (0.35 + progress * 0.85);
        setLine(graphics, (effect.boss ? 8 : 4) * fade, effect.accent || "#fff6e0");
        graphics.drawCircle(effect.x, effect.y, r);
        setLine(graphics, (effect.boss ? 4 : 2) * fade, effect.color || "#ffffff");
        graphics.drawCircle(effect.x, effect.y, r * 0.7);
        if (effect.boss) {
          setLine(graphics, 3 * fade, "rgba(255,255,255,0.8)");
          graphics.drawCircle(effect.x, effect.y, r * 1.25);
        }
        const debris = effect.boss ? 12 : 6;
        for (let index = 0; index < debris; index += 1) {
          const a = (Math.PI * 2 * index) / debris + effect.y * 0.02;
          const inner = r * 0.55;
          const outer = r * (0.95 + (index % 2) * 0.12);
          graphics.moveTo(effect.x + Math.cos(a) * inner, effect.y + Math.sin(a) * inner);
          graphics.lineTo(effect.x + Math.cos(a) * outer, effect.y + Math.sin(a) * outer);
        }
        if (progress < 0.25 && Math.random() < delta * (effect.boss ? 120 : 50)) {
          const a = Math.random() * Math.PI * 2;
          this.spawnParticle({
            x: effect.x,
            y: effect.y,
            vx: Math.cos(a) * (effect.boss ? 120 : 70),
            vy: Math.sin(a) * (effect.boss ? 120 : 70),
            life: 0.4,
            scale: effect.boss ? 0.34 : 0.24,
            color: effect.color || "#fff6e0",
            alpha: 0.6,
            blendMode: SCREEN_BLEND,
          });
        }
      } else if (effect.kind === "bossPhase") {
        // Phase break: a wide shockwave announcing the boss escalating.
        const fade = 1 - progress;
        const r = effect.radius * (0.3 + progress * 0.95);
        setLine(graphics, 10 * fade, effect.color || "#ffd9a8");
        graphics.drawCircle(effect.x, effect.y, r);
        setLine(graphics, 4 * fade, effect.accent || "#ffffff");
        graphics.drawCircle(effect.x, effect.y, r * 0.72);
        for (let index = 0; index < 14; index += 1) {
          const a = (Math.PI * 2 * index) / 14 + progress * 0.5;
          graphics.moveTo(effect.x + Math.cos(a) * r * 0.74, effect.y + Math.sin(a) * r * 0.74);
          graphics.lineTo(effect.x + Math.cos(a) * r * 1.12, effect.y + Math.sin(a) * r * 1.12);
        }
      } else if (effect.kind === "bossShield") {
        // Shield raise: rings converge inward and lock.
        const fade = 1 - progress;
        const r = effect.radius * (1.7 - progress * 0.7);
        setLine(graphics, 6 * fade, effect.color || "#9fd0ff");
        graphics.drawCircle(effect.x, effect.y, r);
        setLine(graphics, 2.4 * fade, effect.accent || "#ffffff");
        graphics.drawCircle(effect.x, effect.y, r * 0.8);
        for (let index = 0; index < 10; index += 1) {
          const a = (Math.PI * 2 * index) / 10;
          graphics.moveTo(effect.x + Math.cos(a) * r, effect.y + Math.sin(a) * r);
          graphics.lineTo(effect.x + Math.cos(a) * r * 1.3, effect.y + Math.sin(a) * r * 1.3);
        }
      } else if (effect.kind === "bossShieldBreak") {
        // Shield break: shards blow outward, signalling the burst window.
        const fade = 1 - progress;
        const r = effect.radius * (0.4 + progress * 1.1);
        setLine(graphics, 5 * fade, effect.color || "#ffe9a8");
        graphics.drawCircle(effect.x, effect.y, r);
        for (let index = 0; index < 12; index += 1) {
          const a = (Math.PI * 2 * index) / 12 + 0.2;
          const inner = r * 0.72;
          const outer = r * (1.08 + (index % 2) * 0.2);
          graphics.moveTo(effect.x + Math.cos(a) * inner, effect.y + Math.sin(a) * inner);
          graphics.lineTo(effect.x + Math.cos(a) * outer, effect.y + Math.sin(a) * outer);
        }
        if (progress < 0.35 && Math.random() < delta * 90) {
          const a = Math.random() * Math.PI * 2;
          this.spawnParticle({
            x: effect.x + Math.cos(a) * r * 0.7,
            y: effect.y + Math.sin(a) * r * 0.7,
            vx: Math.cos(a) * 150,
            vy: Math.sin(a) * 150,
            life: 0.45,
            scale: 0.3,
            color: "#fff1c4",
            alpha: 0.7,
            blendMode: SCREEN_BLEND,
          });
        }
      } else if (effect.kind === "bossSlamBurst") {
        // Ground slam landing: a hard ring plus radial cracks.
        const fade = 1 - progress;
        const r = effect.radius * (0.6 + progress * 0.6);
        beginFill(graphics, effect.color || "#ffb27a", 0.3 * fade);
        graphics.drawCircle(effect.x, effect.y, r * 0.8);
        graphics.endFill();
        setLine(graphics, 9 * fade, effect.accent || "#fff3df");
        graphics.drawCircle(effect.x, effect.y, r);
        setLine(graphics, 3.4 * fade, effect.color || "#ffb27a");
        for (let index = 0; index < 10; index += 1) {
          const a = (Math.PI * 2 * index) / 10 + 0.15;
          graphics.moveTo(effect.x + Math.cos(a) * r * 0.25, effect.y + Math.sin(a) * r * 0.25);
          graphics.lineTo(effect.x + Math.cos(a) * r * 1.05, effect.y + Math.sin(a) * r * 1.05);
        }
      } else if (effect.kind === "bossChargeBurst") {
        // Charge sweep: the lane flashes along its length as the boss tears through.
        const fade = 1 - progress;
        const ex = effect.targetX ?? effect.x;
        const ey = effect.targetY ?? effect.y;
        const dx = ex - effect.x;
        const dy = ey - effect.y;
        const len = Math.hypot(dx, dy) || 1;
        const px = -(dy / len);
        const py = dx / len;
        const w = (effect.radius || 20) * (1 - progress * 0.4);
        beginFill(graphics, effect.color || "#ff9d7a", 0.3 * fade);
        graphics.drawPolygon([
          effect.x + px * w, effect.y + py * w,
          ex + px * w, ey + py * w,
          ex - px * w, ey - py * w,
          effect.x - px * w, effect.y - py * w,
        ]);
        graphics.endFill();
        setLine(graphics, 3 * fade, effect.accent || "#fff0e4");
        graphics.moveTo(effect.x, effect.y);
        graphics.lineTo(ex, ey);
      } else if (effect.kind === "pearlShatter") {
        // 珍珠滚碾: the spent pearl cracks apart into an outward pressure wave.
        const fade = 1 - progress;
        const r = effect.radius * (0.35 + progress * 0.8);
        const heavy = (effect.avalanche || 0) > 0;
        setLine(graphics, (heavy ? 9 : 6) * fade, effect.color || "#f1d18a");
        graphics.drawCircle(effect.x, effect.y, r);
        setLine(graphics, (heavy ? 4 : 2.6) * fade, effect.accent || "#fff6dc");
        graphics.drawCircle(effect.x, effect.y, r * 0.62);
        const shards = heavy ? 12 : 8;
        for (let index = 0; index < shards; index += 1) {
          const a = (Math.PI * 2 * index) / shards + effect.x * 0.01;
          const inner = r * 0.45;
          const outer = r * (1.0 + (index % 2) * 0.16);
          graphics.moveTo(effect.x + Math.cos(a) * inner, effect.y + Math.sin(a) * inner);
          graphics.lineTo(effect.x + Math.cos(a) * outer, effect.y + Math.sin(a) * outer);
        }
        if (progress < 0.3 && Math.random() < delta * (heavy ? 90 : 55)) {
          const a = Math.random() * Math.PI * 2;
          this.spawnParticle({
            x: effect.x,
            y: effect.y,
            vx: Math.cos(a) * (heavy ? 130 : 90),
            vy: Math.sin(a) * (heavy ? 130 : 90),
            life: 0.42,
            scale: 0.3,
            color: "#fff1cf",
            alpha: 0.6,
            blendMode: SCREEN_BLEND,
          });
        }
      } else if (effect.kind === "chargedStrike") {
        // 蓄力: the cast flares as the stored charge discharges. Converging arrowheads so
        // it reads as power being pulled *into* the strike rather than exploding outward.
        const fade = 1 - progress;
        const r = effect.radius * (1.05 - progress * 0.45);
        setLine(graphics, 5 * fade, effect.accent || "rgba(255,255,235,0.9)");
        graphics.drawCircle(effect.x, effect.y, r);
        setLine(graphics, 2.4 * fade, effect.color || "rgba(255,232,144,0.34)");
        graphics.drawCircle(effect.x, effect.y, r * 1.28);
        for (let index = 0; index < 8; index += 1) {
          const a = (Math.PI * 2 * index) / 8 + progress * 0.9;
          const outer = r * 1.5;
          const inner = r * 0.85;
          const ox = effect.x + Math.cos(a) * outer;
          const oy = effect.y + Math.sin(a) * outer;
          const ix = effect.x + Math.cos(a) * inner;
          const iy = effect.y + Math.sin(a) * inner;
          setLine(graphics, 3.4 * fade, effect.accent || "#fffbe8");
          graphics.moveTo(ox, oy);
          graphics.lineTo(ix, iy);
          graphics.lineTo(ix + Math.cos(a + 2.3) * r * 0.2, iy + Math.sin(a + 2.3) * r * 0.2);
          graphics.moveTo(ix, iy);
          graphics.lineTo(ix + Math.cos(a - 2.3) * r * 0.2, iy + Math.sin(a - 2.3) * r * 0.2);
        }
      } else if (effect.kind === "killingIntent") {
        // 杀心: a crimson blood-moon halo with inward fangs.
        const fade = 1 - progress;
        const r = effect.radius * (0.6 + progress * 0.5);
        beginFill(graphics, effect.color || "rgba(255,92,130,0.34)", 0.2 * fade);
        graphics.drawCircle(effect.x, effect.y, r);
        graphics.endFill();
        setLine(graphics, 6 * fade, effect.accent || "rgba(255,240,246,0.88)");
        graphics.drawCircle(effect.x, effect.y, r);
        setLine(graphics, 2.2 * fade, "#ff6c8c");
        graphics.drawCircle(effect.x, effect.y, r * 0.66);
        beginFill(graphics, effect.accent || "#fff0f6", 0.8 * fade);
        for (let index = 0; index < 10; index += 1) {
          const a = (Math.PI * 2 * index) / 10 - progress * 0.6;
          const tipR = r * 0.78;
          const baseR = r * 1.02;
          graphics.drawPolygon([
            effect.x + Math.cos(a) * tipR, effect.y + Math.sin(a) * tipR,
            effect.x + Math.cos(a + 0.09) * baseR, effect.y + Math.sin(a + 0.09) * baseR,
            effect.x + Math.cos(a - 0.09) * baseR, effect.y + Math.sin(a - 0.09) * baseR,
          ]);
        }
        graphics.endFill();
      } else if (effect.kind === "iceThorn") {
        // 冰棘: the damage cap shatters into a ring of ice spikes as everything freezes.
        const fade = 1 - progress;
        const r = effect.radius * (0.45 + progress * 0.7);
        setLine(graphics, 5 * fade, effect.accent || "#eaffff");
        graphics.drawCircle(effect.x, effect.y, r);
        beginFill(graphics, effect.color || "rgba(176, 236, 255, 0.3)", 0.26 * fade);
        for (let index = 0; index < 12; index += 1) {
          const a = (Math.PI * 2 * index) / 12 + 0.12;
          const tip = r * (1.18 + (index % 3) * 0.14);
          const base = r * 0.82;
          graphics.drawPolygon([
            effect.x + Math.cos(a) * tip, effect.y + Math.sin(a) * tip,
            effect.x + Math.cos(a + 0.16) * base, effect.y + Math.sin(a + 0.16) * base,
            effect.x + Math.cos(a - 0.16) * base, effect.y + Math.sin(a - 0.16) * base,
          ]);
        }
        graphics.endFill();
        setLine(graphics, 2 * fade, "rgba(255,255,255,0.9)");
        for (let index = 0; index < 6; index += 1) {
          const a = (Math.PI * 2 * index) / 6;
          graphics.moveTo(effect.x + Math.cos(a) * r * 0.3, effect.y + Math.sin(a) * r * 0.3);
          graphics.lineTo(effect.x + Math.cos(a) * r * 0.92, effect.y + Math.sin(a) * r * 0.92);
        }
      } else if (effect.kind === "tulipArc") {
        // 郁金雷网: a jagged bolt strung between two rods. Drawn as a fixed-seed zigzag so
        // it stays put for its whole (very short) life instead of jittering.
        const fade = 1 - progress;
        const dx = effect.targetX - effect.x;
        const dy = effect.targetY - effect.y;
        const span = Math.hypot(dx, dy) || 1;
        const px = -dy / span;
        const py = dx / span;
        const seed = Math.floor(effect.x + effect.targetY);
        setLine(graphics, 7 * fade, "rgba(255, 171, 134, 0.25)");
        graphics.moveTo(effect.x, effect.y);
        graphics.lineTo(effect.targetX, effect.targetY);
        setLine(graphics, 3 * fade, effect.color || "#ffab86");
        graphics.moveTo(effect.x, effect.y);
        for (let step = 1; step < 7; step += 1) {
          const ratio = step / 7;
          // Deterministic pseudo-random offset per segment.
          const jitter = (((seed * step * 9301 + 49297) % 233280) / 233280 - 0.5) * span * 0.14;
          graphics.lineTo(
            effect.x + dx * ratio + px * jitter,
            effect.y + dy * ratio + py * jitter,
          );
        }
        graphics.lineTo(effect.targetX, effect.targetY);
        setLine(graphics, 1.4 * fade, effect.accent || "#fff0d8");
        graphics.moveTo(effect.x, effect.y);
        graphics.lineTo(effect.targetX, effect.targetY);
      } else if (effect.kind === "tulipOverload") {
        // 雷池过载: a rod dumps its charge as a ring of thunder.
        const fade = 1 - progress;
        const r = effect.radius * (0.4 + progress * 0.75);
        setLine(graphics, 8 * fade, effect.color || "#ffab86");
        graphics.drawCircle(effect.x, effect.y, r);
        setLine(graphics, 3 * fade, effect.accent || "#ffffff");
        graphics.drawCircle(effect.x, effect.y, r * 0.62);
        for (let index = 0; index < 10; index += 1) {
          const a = (Math.PI * 2 * index) / 10 + progress;
          setLine(graphics, 2.4 * fade, "#fff0d8");
          graphics.moveTo(effect.x + Math.cos(a) * r * 0.5, effect.y + Math.sin(a) * r * 0.5);
          graphics.lineTo(effect.x + Math.cos(a + 0.2) * r, effect.y + Math.sin(a + 0.2) * r);
        }
      } else if (effect.kind === "scissorClose") {
        // 剪刃藤蔓: the snap. A bright X slammed shut across the facing line.
        const fade = 1 - progress;
        const r = effect.radius;
        const a = effect.facing ?? 0;
        setLine(graphics, 10 * fade, "rgba(239, 104, 114, 0.4)");
        graphics.moveTo(effect.x - Math.cos(a) * r * 0.2, effect.y - Math.sin(a) * r * 0.2);
        graphics.lineTo(effect.x + Math.cos(a) * r, effect.y + Math.sin(a) * r);
        setLine(graphics, 4 * fade, effect.accent || "#ffe4e6");
        for (const side of [-1, 1]) {
          const cut = a + side * 0.18 * progress;
          graphics.moveTo(effect.x, effect.y);
          graphics.lineTo(effect.x + Math.cos(cut) * r, effect.y + Math.sin(cut) * r);
        }
        beginFill(graphics, "#ffffff", 0.7 * fade);
        drawStar(graphics, effect.x, effect.y, 16 * fade + 6, 5, 4);
        graphics.endFill();
      } else if (effect.kind === "gearEmbed") {
        // 琥珀齿轮: amber chips kick out as the gear bites into the ground.
        const fade = 1 - progress;
        setLine(graphics, 5 * fade, effect.color || "#f1b86b");
        graphics.drawCircle(effect.x, effect.y, effect.radius * (0.4 + progress * 0.7));
        beginFill(graphics, effect.accent || "#fff0cf", 0.5 * fade);
        for (let index = 0; index < 7; index += 1) {
          const a = (Math.PI * 2 * index) / 7 + effect.x * 0.01;
          const d = effect.radius * (0.6 + progress * 0.6);
          graphics.drawCircle(effect.x + Math.cos(a) * d, effect.y + Math.sin(a) * d, 3.4 * fade);
        }
        graphics.endFill();
      } else if (effect.kind === "prismBeam") {
        // 大棱镜彗星: a hard-edged prism beam from the planted core.
        const fade = 1 - progress;
        const thickness = effect.thickness || 4;
        setLine(graphics, thickness * 2.6 * fade, "rgba(114, 203, 255, 0.2)");
        graphics.moveTo(effect.x, effect.y);
        graphics.lineTo(effect.targetX, effect.targetY);
        setLine(graphics, thickness * fade, effect.color || "#72cbff");
        graphics.moveTo(effect.x, effect.y);
        graphics.lineTo(effect.targetX, effect.targetY);
        setLine(graphics, Math.max(1.4, thickness * 0.35) * fade, "#ffffff");
        graphics.moveTo(effect.x, effect.y);
        graphics.lineTo(effect.targetX, effect.targetY);
      } else if (effect.kind === "antlerBurst") {
        // 鹿角突刺: the charge spends itself in a goring burst — a shock ring plus a pair
        // of antler-shaped gouges raking outward.
        const fade = 1 - progress;
        const crystal = effect.crystal || 0;
        const r = effect.radius * (0.4 + progress * 0.75);
        setLine(graphics, (6 + crystal * 2.5) * fade, effect.color || "#73d1ff");
        graphics.drawCircle(effect.x, effect.y, r);
        setLine(graphics, (2.6 + crystal) * fade, effect.accent || "#d8f4ff");
        graphics.drawCircle(effect.x, effect.y, r * 0.58);
        const tines = 6 + crystal * 2;
        setLine(graphics, (3.4 + crystal) * fade, effect.accent || "#d8f4ff");
        for (let index = 0; index < tines; index += 1) {
          const a = (Math.PI * 2 * index) / tines + effect.x * 0.008;
          const inner = r * 0.4;
          const outer = r * (1.02 + (index % 2) * 0.18);
          const bx = effect.x + Math.cos(a) * inner;
          const by = effect.y + Math.sin(a) * inner;
          const tx = effect.x + Math.cos(a) * outer;
          const ty = effect.y + Math.sin(a) * outer;
          graphics.moveTo(bx, by);
          graphics.lineTo(tx, ty);
          // Little forked tip so the gouge reads as an antler, not a generic spike.
          graphics.moveTo(tx, ty);
          graphics.lineTo(tx + Math.cos(a + 0.6) * r * 0.16, ty + Math.sin(a + 0.6) * r * 0.16);
          graphics.moveTo(tx, ty);
          graphics.lineTo(tx + Math.cos(a - 0.6) * r * 0.16, ty + Math.sin(a - 0.6) * r * 0.16);
        }
        if (progress < 0.35 && Math.random() < delta * (crystal > 0 ? 80 : 50)) {
          const a = Math.random() * Math.PI * 2;
          this.spawnParticle({
            x: effect.x,
            y: effect.y,
            vx: Math.cos(a) * 110,
            vy: Math.sin(a) * 110,
            life: 0.4,
            scale: 0.28,
            color: crystal > 0 ? "#ffffff" : "#d8f4ff",
            alpha: 0.6,
            blendMode: SCREEN_BLEND,
          });
        }
      } else if (effect.kind === "sporeCupLand") {
        // 菌杯雾雷: the cup thumps down and puffs a little collar of spores.
        const fade = 1 - progress;
        const r = effect.radius * (0.4 + progress * 0.7);
        setLine(graphics, 4 * fade, effect.color || "#b8c978");
        graphics.drawEllipse(effect.x, effect.y + r * 0.3, r, r * 0.42);
        beginFill(graphics, effect.accent || "#f2ffd0", 0.3 * fade);
        for (let index = 0; index < 6; index += 1) {
          const a = (Math.PI * 2 * index) / 6;
          graphics.drawCircle(effect.x + Math.cos(a) * r * 0.8, effect.y + r * 0.3 + Math.sin(a) * r * 0.3, r * 0.2 * fade);
        }
        graphics.endFill();
      } else if (effect.kind === "sporeSpread") {
        // 孢潮蔓延: a venom-green thread crossing from a poisoned body to its neighbour.
        const fade = 1 - progress;
        setLine(graphics, 3.2 * fade, effect.color || "#4fd962");
        const midX = (effect.x + effect.targetX) / 2 + (effect.targetY - effect.y) * 0.18;
        const midY = (effect.y + effect.targetY) / 2 - (effect.targetX - effect.x) * 0.18;
        graphics.moveTo(effect.x, effect.y);
        graphics.quadraticCurveTo(midX, midY, effect.targetX, effect.targetY);
        const beadX = lerp(effect.x, effect.targetX, progress);
        const beadY = lerp(effect.y, effect.targetY, progress);
        beginFill(graphics, effect.color || "#4fd962", 0.3 * fade);
        graphics.drawCircle(beadX, beadY, 7 * fade);
        graphics.endFill();
        beginFill(graphics, effect.accent || "#c8ffb8", 0.65 * fade);
        graphics.drawCircle(beadX, beadY, 3.6 * fade);
        graphics.endFill();
      } else if (effect.kind === "soulStrip") {
        // 灵魂剥离: a spectral ring tears open and wisps peel outward as the soul leaves.
        const fade = 1 - progress;
        const r = effect.radius * (0.3 + progress * 0.8);
        setLine(graphics, 5 * fade, effect.color || "#b9a6ff");
        graphics.drawCircle(effect.x, effect.y, r);
        setLine(graphics, 2 * fade, effect.accent || "#f1ebff");
        graphics.drawCircle(effect.x, effect.y, r * 0.66);
        for (let index = 0; index < 7; index += 1) {
          const a = (Math.PI * 2 * index) / 7 + progress * 1.4;
          const inner = r * 0.5;
          const outer = r * (1.05 + (index % 2) * 0.14);
          graphics.moveTo(effect.x + Math.cos(a) * inner, effect.y + Math.sin(a) * inner);
          graphics.lineTo(effect.x + Math.cos(a) * outer, effect.y + Math.sin(a) * outer);
        }
        if (Math.random() < delta * 44) {
          const a = Math.random() * Math.PI * 2;
          this.spawnParticle({
            x: effect.x + Math.cos(a) * r * 0.5,
            y: effect.y + Math.sin(a) * r * 0.5,
            vx: Math.cos(a) * 46,
            vy: Math.sin(a) * 46 - 18,
            life: 0.55,
            scale: 0.26,
            color: "#d9ccff",
            alpha: 0.55,
            blendMode: SCREEN_BLEND,
          });
        }
      }
    }
  }

  drawFields(fields, delta) {
    for (const field of fields) {
      const visual = this.acquireFromPool("fields", this.spriteLayers.fields, () => this.createFieldVisual());
      const textureData = this.getFieldTexture(field);
      const scale = field.radius / textureData.baseRadius;
      const tint = mixColors(field.edgeColor || field.color, 0xffffff, 0.18);
      visual.position.set(field.x, field.y);
      visual.mainSprite.texture = textureData.texture;
      visual.mainSprite.tint = tint;
      visual.mainSprite.scale.set(scale);
      visual.mainSprite.rotation = field.sourceSkillId === "stormBloom" ? this.getMotionTime(0.0008) : field.sourceSkillId === "meteorSeed" ? -this.getMotionTime(0.0006) : 0;
      visual.auraSprite.tint = parseColor(field.color).color;
      visual.auraSprite.scale.set(scale * (field.sourceSkillId === "mushroomMine" ? 2.15 : 2.4));
      visual.auraSprite.alpha = (field.sourceSkillId === "stormBloom" ? 0.18 : 0.14) * this.visualProfile.effectLayerAlpha;
      visual.ringSprite.tint = parseColor(field.edgeColor || field.color).color;
      visual.ringSprite.scale.set(scale * (field.sourceSkillId === "stormBloom" ? 1.6 : 1.8));
      visual.ringSprite.rotation = this.getMotionTime(0.001) + field.x * 0.0002;
      visual.ringSprite.alpha = 0.18 * this.visualProfile.effectLayerAlpha;

      if (Math.random() < delta * this.getSpawnRate(8)) {
        const angle = Math.random() * Math.PI * 2;
        this.spawnParticle({
          x: field.x + Math.cos(angle) * field.radius * (0.28 + Math.random() * 0.52),
          y: field.y + Math.sin(angle) * field.radius * (0.28 + Math.random() * 0.52),
          vx: (Math.random() - 0.5) * 8,
          vy: -4 - Math.random() * 8,
          life: 0.34,
          scale: 0.22,
          color: field.edgeColor || field.color,
          alpha: 0.24,
          blendMode: SCREEN_BLEND,
        });
      }
    }
  }

  // Boss telegraphs drawn as ground markings: they fill up and flush red as they arm,
  // so the player can read exactly where and when the hit lands.
  drawBossHazards(hazards, delta) {
    const graphics = this.layers.bossHazards;
    for (const hazard of hazards) {
      const total = hazard.maxTelegraph || 1;
      const charge = clamp(1 - hazard.telegraph / total, 0, 1);
      const imminent = charge > 0.75;
      const warnColor = imminent ? "#ff5f52" : hazard.color || "#ffb27a";

      if (hazard.kind === "groundSlam") {
        const r = hazard.radius;
        // Danger floor fills from the middle outward as the slam arms.
        beginFill(graphics, warnColor, 0.16 + charge * 0.2);
        graphics.drawCircle(hazard.x, hazard.y, r * charge);
        graphics.endFill();
        setLine(graphics, imminent ? 6 : 4, warnColor);
        graphics.drawCircle(hazard.x, hazard.y, r);
        setLine(graphics, 2, "rgba(255,255,255,0.8)");
        graphics.drawCircle(hazard.x, hazard.y, r * 0.5);
        for (let index = 0; index < 8; index += 1) {
          const a = (Math.PI * 2 * index) / 8 + charge * 0.7;
          graphics.moveTo(hazard.x + Math.cos(a) * r * 0.82, hazard.y + Math.sin(a) * r * 0.82);
          graphics.lineTo(hazard.x + Math.cos(a) * r, hazard.y + Math.sin(a) * r);
        }
        if (imminent && Math.random() < delta * 46) {
          const a = Math.random() * Math.PI * 2;
          this.spawnParticle({
            x: hazard.x + Math.cos(a) * r * 0.8,
            y: hazard.y + Math.sin(a) * r * 0.8,
            vx: 0,
            vy: -40 - Math.random() * 30,
            life: 0.36,
            scale: 0.28,
            color: "#ffd0b4",
            alpha: 0.6,
            blendMode: SCREEN_BLEND,
          });
        }
        continue;
      }

      if (hazard.kind === "chargeLane") {
        const ax = Math.cos(hazard.angle);
        const ay = Math.sin(hazard.angle);
        const px = -ay;
        const py = ax;
        const w = hazard.halfWidth;
        const endX = hazard.x + ax * hazard.length;
        const endY = hazard.y + ay * hazard.length;
        // The lane body fills forward from the boss as the dash winds up.
        const fillX = hazard.x + ax * hazard.length * charge;
        const fillY = hazard.y + ay * hazard.length * charge;
        beginFill(graphics, warnColor, 0.14 + charge * 0.2);
        graphics.drawPolygon([
          hazard.x + px * w, hazard.y + py * w,
          fillX + px * w, fillY + py * w,
          fillX - px * w, fillY - py * w,
          hazard.x - px * w, hazard.y - py * w,
        ]);
        graphics.endFill();
        setLine(graphics, imminent ? 5 : 3, warnColor);
        graphics.moveTo(hazard.x + px * w, hazard.y + py * w);
        graphics.lineTo(endX + px * w, endY + py * w);
        graphics.moveTo(hazard.x - px * w, hazard.y - py * w);
        graphics.lineTo(endX - px * w, endY - py * w);
        // Direction chevrons so the dash path is unmistakable.
        setLine(graphics, 2.4, "rgba(255,255,255,0.78)");
        for (let index = 1; index <= 5; index += 1) {
          const t = index / 6;
          const cx = hazard.x + ax * hazard.length * t;
          const cy = hazard.y + ay * hazard.length * t;
          graphics.moveTo(cx - ax * 14 + px * w * 0.55, cy - ay * 14 + py * w * 0.55);
          graphics.lineTo(cx + ax * 14, cy + ay * 14);
          graphics.lineTo(cx - ax * 14 - px * w * 0.55, cy - ay * 14 - py * w * 0.55);
        }
        continue;
      }
    }
  }

  // 凝时钟域 dials, painted on the floor. Drawn from the live strikes rather than from a
  // per-frame skill effect so they sit on their own ground layer underneath enemies,
  // nests, the hold zone and every bullet. The face is kept translucent for the same
  // reason: the dial must never obscure what is standing on it.
  drawClockDials(strikes) {
    const graphics = this.layers.clockDials;
    for (const strike of strikes) {
      if (strike.kind !== "clockRewind") {
        continue;
      }
      const p = clamp(strike.elapsed / Math.max(0.01, strike.windup), 0, 1);
      const r = strike.radius;
      const color = strike.color || "#f2c14b";
      // Translucent plate that darkens a little as the hand closes in.
      beginFill(graphics, color, 0.07 + p * 0.07);
      graphics.drawCircle(strike.x, strike.y, r);
      graphics.endFill();
      setLine(graphics, 3.5, `rgba(242, 193, 75, ${0.5 + p * 0.3})`);
      graphics.drawCircle(strike.x, strike.y, r);
      setLine(graphics, 1.3, "rgba(255, 243, 196, 0.34)");
      graphics.drawCircle(strike.x, strike.y, r * 0.72);
      // Hour marks, quarters drawn longer like a real face.
      for (let index = 0; index < 12; index += 1) {
        const a = (Math.PI * 2 * index) / 12;
        const quarter = index % 3 === 0;
        const inner = r * (quarter ? 0.76 : 0.84);
        const outer = r * 0.96;
        setLine(graphics, quarter ? 3 : 1.8, `rgba(255, 243, 196, ${quarter ? 0.72 : 0.5})`);
        graphics.moveTo(strike.x + Math.cos(a) * inner, strike.y + Math.sin(a) * inner);
        graphics.lineTo(strike.x + Math.cos(a) * outer, strike.y + Math.sin(a) * outer);
      }
      // Swept sector: the time already spent fills in behind the hand.
      const handAngle = -Math.PI / 2 + p * Math.PI * 2;
      beginFill(graphics, "rgba(255, 243, 196, 0.12)");
      graphics.moveTo(strike.x, strike.y);
      graphics.arc(strike.x, strike.y, r * 0.9, -Math.PI / 2, handAngle);
      graphics.lineTo(strike.x, strike.y);
      graphics.endFill();
      // The hand and hub.
      setLine(graphics, 4, "rgba(255,255,255,0.8)");
      graphics.moveTo(strike.x, strike.y);
      graphics.lineTo(strike.x + Math.cos(handAngle) * r * 0.82, strike.y + Math.sin(handAngle) * r * 0.82);
      beginFill(graphics, "rgba(255, 243, 196, 0.85)");
      graphics.drawCircle(strike.x, strike.y, 5 + p * 4);
      graphics.endFill();
      // Closing ring: a second read on how little time is left.
      setLine(graphics, 2.5 + p * 4, `rgba(242, 193, 75, ${0.45 + p * 0.35})`);
      graphics.drawCircle(strike.x, strike.y, r * (1 - p) * 0.86 + r * 0.1);
    }
  }

  // 剪刃藤蔓: the open blades are the telegraph, so they are drawn on the ground layer
  // where they can't be lost behind bodies. They swing shut as the timer runs.
  drawScissorBlades(strikes) {
    const graphics = this.layers.clockDials;
    for (const strike of strikes) {
      if (strike.kind !== "scissorSnap") continue;
      const t = clamp(strike.elapsed / Math.max(0.01, strike.closeTime), 0, 1);
      // Blades start at the full spread and converge on the facing line.
      const open = strike.spread * (1 - t);
      const length = strike.armLength;
      // Danger wedge the cut will sweep.
      beginFill(graphics, strike.color || "#ef6872", 0.08 + t * 0.14);
      graphics.moveTo(strike.x, strike.y);
      graphics.arc(strike.x, strike.y, length, strike.facing - strike.spread, strike.facing + strike.spread);
      graphics.lineTo(strike.x, strike.y);
      graphics.endFill();
      for (const side of [-1, 1]) {
        const a = strike.facing + open * side;
        const tipX = strike.x + Math.cos(a) * length;
        const tipY = strike.y + Math.sin(a) * length;
        // Blade body: thick near the pivot, tapering to the tip.
        setLine(graphics, 9 - t * 3, "rgba(239, 104, 114, 0.5)");
        graphics.moveTo(strike.x, strike.y);
        graphics.lineTo(tipX, tipY);
        setLine(graphics, 3.4, "#ffe4e6");
        graphics.moveTo(strike.x, strike.y);
        graphics.lineTo(tipX, tipY);
        // Leaf serrations along the edge, so it reads as a vine blade not a laser.
        setLine(graphics, 2, "rgba(255, 228, 230, 0.7)");
        for (let step = 1; step <= 4; step += 1) {
          const ratio = step / 5;
          const px = strike.x + Math.cos(a) * length * ratio;
          const py = strike.y + Math.sin(a) * length * ratio;
          graphics.moveTo(px, py);
          graphics.lineTo(px + Math.cos(a + side * 1.2) * 13, py + Math.sin(a + side * 1.2) * 13);
        }
      }
      // Pivot hub.
      beginFill(graphics, "#ffe4e6", 0.85);
      graphics.drawCircle(strike.x, strike.y, 6 + t * 4);
      graphics.endFill();
    }
  }

  // 郁金雷网: the rods themselves. The arcs between them are spawned as skill effects,
  // so this pass only has to draw the standing tulip rods and their charge state.
  drawTulipRods(rods, delta) {
    const graphics = this.layers.clockDials;
    const sway = this.getMotionTime(0.0022);
    for (const rod of rods) {
      const lean = Math.sin(sway + rod.x * 0.01) * 0.12;
      const r = rod.radius;
      // Stem.
      setLine(graphics, 4, "#8fbf63");
      graphics.moveTo(rod.x, rod.y + r * 0.9);
      graphics.quadraticCurveTo(rod.x + lean * 10, rod.y, rod.x + lean * 16, rod.y - r * 1.5);
      // Tulip cup acting as the lightning rod.
      const cupX = rod.x + lean * 16;
      const cupY = rod.y - r * 1.5;
      beginFill(graphics, rod.color || "#ffab86", 0.92);
      graphics.drawPolygon([
        cupX - r * 0.62, cupY,
        cupX - r * 0.34, cupY - r * 0.95,
        cupX, cupY - r * 0.6,
        cupX + r * 0.34, cupY - r * 0.95,
        cupX + r * 0.62, cupY,
      ]);
      graphics.endFill();
      setLine(graphics, 1.8, "#fff0d8");
      graphics.drawCircle(cupX, cupY - r * 0.1, r * 0.3);
      // Charge ring: how close this rod is to an overload discharge.
      if (rod.overloadLevel > 0) {
        const charge = clamp(rod.charge / 12, 0, 1);
        setLine(graphics, 2.4, `rgba(255, 240, 216, ${0.3 + charge * 0.6})`);
        graphics.drawCircle(cupX, cupY, r * (1.1 + charge * 0.5));
      }
      // Base glow on the floor so the rod's footprint is visible in a crowd.
      beginFill(graphics, rod.color || "#ffab86", 0.14);
      graphics.drawEllipse(rod.x, rod.y + r * 0.9, r * 1.1, r * 0.4);
      graphics.endFill();
      if (Math.random() < delta * 6) {
        this.spawnParticle({
          x: cupX,
          y: cupY,
          vx: (Math.random() - 0.5) * 18,
          vy: -22 - Math.random() * 14,
          life: 0.4,
          scale: 0.2,
          color: "#ffe0b8",
          alpha: 0.5,
          blendMode: SCREEN_BLEND,
        });
      }
    }
  }

  // 琥珀齿轮: a spinning amber cog. Flying gears sit above the floor; embedded ones are
  // drawn with a ground shadow so you can tell which phase they're in.
  drawGears(gears) {
    const graphics = this.layers.mines;
    for (const gear of gears) {
      const r = gear.radius;
      if (!gear.flying) {
        beginFill(graphics, "rgba(90, 60, 20, 0.22)");
        graphics.drawEllipse(gear.x, gear.y + r * 0.5, r * 1.05, r * 0.4);
        graphics.endFill();
      }
      // Teeth.
      const teeth = 10;
      beginFill(graphics, gear.color || "#f1b86b", gear.flying ? 0.95 : 0.88);
      for (let index = 0; index < teeth; index += 1) {
        const a = gear.spin + (Math.PI * 2 * index) / teeth;
        graphics.drawPolygon([
          gear.x + Math.cos(a - 0.12) * r * 0.82, gear.y + Math.sin(a - 0.12) * r * 0.82,
          gear.x + Math.cos(a) * r * 1.16, gear.y + Math.sin(a) * r * 1.16,
          gear.x + Math.cos(a + 0.12) * r * 0.82, gear.y + Math.sin(a + 0.12) * r * 0.82,
        ]);
      }
      graphics.endFill();
      // Body + hub.
      beginFill(graphics, gear.color || "#f1b86b", 0.95);
      graphics.drawCircle(gear.x, gear.y, r * 0.82);
      graphics.endFill();
      setLine(graphics, 2.4, "#fff0cf");
      graphics.drawCircle(gear.x, gear.y, r * 0.82);
      beginFill(graphics, "rgba(120, 70, 20, 0.6)");
      graphics.drawCircle(gear.x, gear.y, r * 0.26);
      graphics.endFill();
      // Spokes, so the rotation is legible.
      setLine(graphics, 2, "rgba(255, 240, 207, 0.75)");
      for (let index = 0; index < 4; index += 1) {
        const a = gear.spin * 0.6 + (Math.PI * index) / 2;
        graphics.moveTo(gear.x + Math.cos(a) * r * 0.3, gear.y + Math.sin(a) * r * 0.3);
        graphics.lineTo(gear.x + Math.cos(a) * r * 0.74, gear.y + Math.sin(a) * r * 0.74);
      }
      if (gear.sawLevel > 0 && !gear.flying) {
        setLine(graphics, 2, "rgba(255, 230, 170, 0.5)");
        graphics.drawCircle(gear.x, gear.y, r * 1.5);
      }
    }
  }

  // Wave objective markers. These are navigation aids first and decoration second, so
  // both kinds carry an off-screen direction hint drawn at the edge of the player's view.
  drawWaveMarkers(markers, player, delta) {
    const graphics = this.layers.waveMarkers;
    const pulse = this.getMotionTime(0.0022);

    for (const marker of markers) {
      if (marker.kind === "holdZone") {
        const occupied = Boolean(marker.occupied);
        const color = occupied ? "#9bf0c4" : "#ffe6a8";
        const r = marker.radius;
        // Fill reads "safe" when you're standing in it and "come here" when you're not.
        beginFill(graphics, color, occupied ? 0.17 : 0.1);
        graphics.drawCircle(marker.x, marker.y, r);
        graphics.endFill();
        setLine(graphics, occupied ? 5 : 3.5, color);
        graphics.drawCircle(marker.x, marker.y, r);
        // Inward-travelling ring so the circle always reads as a destination.
        const breathe = (Math.sin(pulse * 2) + 1) / 2;
        setLine(graphics, 2, "rgba(255,255,255,0.6)");
        graphics.drawCircle(marker.x, marker.y, r * (0.4 + breathe * 0.45));
        setLine(graphics, 2.2, color);
        for (let index = 0; index < 12; index += 1) {
          const a = (Math.PI * 2 * index) / 12 + pulse * 0.4;
          graphics.moveTo(marker.x + Math.cos(a) * r * 0.9, marker.y + Math.sin(a) * r * 0.9);
          graphics.lineTo(marker.x + Math.cos(a) * r * 1.08, marker.y + Math.sin(a) * r * 1.08);
        }
        if (occupied && Math.random() < delta * 24) {
          const a = Math.random() * Math.PI * 2;
          const d = Math.random() * r;
          this.spawnParticle({
            x: marker.x + Math.cos(a) * d,
            y: marker.y + Math.sin(a) * d,
            vx: 0,
            vy: -34 - Math.random() * 26,
            life: 0.6,
            scale: 0.24,
            color: "#d8ffe9",
            alpha: 0.5,
            blendMode: SCREEN_BLEND,
          });
        }
        this.drawMarkerCompass(graphics, marker, player, color);
        continue;
      }

      if (marker.kind === "dewOrb") {
        const r = marker.radius;
        const bob = Math.sin(pulse * 2.6 + marker.spin) * 3;
        const y = marker.y + bob;
        // Ground halo keeps the orb findable against busy terrain.
        beginFill(graphics, "#5fd8ff", 0.12);
        graphics.drawCircle(marker.x, marker.y, r * 2.6);
        graphics.endFill();
        beginFill(graphics, "#8fe6ff", 0.92);
        graphics.drawCircle(marker.x, y, r * 0.62);
        graphics.endFill();
        beginFill(graphics, "rgba(255,255,255,0.95)", 0.9);
        graphics.drawCircle(marker.x - r * 0.18, y - r * 0.2, r * 0.22);
        graphics.endFill();
        setLine(graphics, 2.4, "#d6f7ff");
        graphics.drawCircle(marker.x, y, r * (0.9 + Math.sin(pulse * 3 + marker.spin) * 0.12));
        setLine(graphics, 1.6, "rgba(143, 230, 255, 0.55)");
        graphics.drawCircle(marker.x, marker.y, r * 1.9);
        if (Math.random() < delta * 14) {
          this.spawnParticle({
            x: marker.x + (Math.random() - 0.5) * r,
            y: y + (Math.random() - 0.5) * r,
            vx: 0,
            vy: -26 - Math.random() * 18,
            life: 0.5,
            scale: 0.22,
            color: "#e8fbff",
            alpha: 0.55,
            blendMode: SCREEN_BLEND,
          });
        }
        this.drawMarkerCompass(graphics, marker, player, "#8fe6ff");
        continue;
      }
    }
  }

  // A chevron at the rim of the player's immediate view pointing at an objective that is
  // too far away to see. Without this the 采集 and 坚守 waves turn into blind wandering.
  drawMarkerCompass(graphics, marker, player, color) {
    if (!player) {
      return;
    }
    const dx = marker.x - player.x;
    const dy = marker.y - player.y;
    const distance = Math.hypot(dx, dy);
    const hintRadius = 210;
    if (distance <= hintRadius + marker.radius) {
      return;
    }
    const ax = dx / distance;
    const ay = dy / distance;
    const cx = player.x + ax * hintRadius;
    const cy = player.y + ay * hintRadius;
    const px = -ay;
    const py = ax;
    setLine(graphics, 3, color);
    graphics.moveTo(cx - ax * 12 + px * 10, cy - ay * 12 + py * 10);
    graphics.lineTo(cx + ax * 12, cy + ay * 12);
    graphics.lineTo(cx - ax * 12 - px * 10, cy - ay * 12 - py * 10);
  }

  drawStrikes(strikes, delta) {
    const graphics = this.layers.strikes;
    for (const strike of strikes) {
      // 菌杯雾雷: an upturned cup that swells between eruptions and throws an expanding
      // mist ring. The damage is in the ring edge, so the edge is the brightest thing.
      if (strike.kind === "sporeGeyser") {
        const pulse = this.getMotionTime(0.0024);
        // The cup itself: a squat dome that swells as the next eruption charges.
        const charge = strike.ringActive
          ? 0
          : clamp(1 - strike.clock / Math.max(0.2, strike.interval), 0, 1);
        const cupR = 15 + charge * 7;
        beginFill(graphics, "rgba(120, 150, 70, 0.3)");
        graphics.drawEllipse(strike.x, strike.y + cupR * 0.4, cupR * 1.15, cupR * 0.42);
        graphics.endFill();
        beginFill(graphics, strike.color, 0.82);
        graphics.drawEllipse(strike.x, strike.y, cupR, cupR * 0.78);
        graphics.endFill();
        setLine(graphics, 2.4, "#f2ffd0");
        graphics.drawEllipse(strike.x, strike.y, cupR, cupR * 0.78);
        // Stem + remaining-eruption pips so the cup's budget is readable.
        setLine(graphics, 3, "rgba(242, 255, 208, 0.8)");
        graphics.moveTo(strike.x, strike.y + cupR * 0.7);
        graphics.lineTo(strike.x, strike.y + cupR * 1.25);
        beginFill(graphics, "#f2ffd0", 0.85);
        for (let index = 0; index < Math.max(0, strike.eruptsLeft); index += 1) {
          graphics.drawCircle(strike.x - 9 + index * 6, strike.y - cupR - 7, 2.1);
        }
        graphics.endFill();

        if (strike.ringActive) {
          const fade = 1 - clamp(strike.ringRadius / Math.max(1, strike.radius), 0, 1);
          // Thick stroked band rather than a filled annulus — Graphics has no hole fill,
          // and a wide line is both cheaper and a better match for the damage window.
          setLine(graphics, SPORE_RING_BAND_WIDTH, `rgba(190, 220, 130, ${0.2 + fade * 0.16})`);
          graphics.drawCircle(strike.x, strike.y, Math.max(1, strike.ringRadius - SPORE_RING_BAND_WIDTH * 0.5));
          // The leading wall of mist.
          setLine(graphics, 7 + fade * 4, "#dff3a8");
          graphics.drawCircle(strike.x, strike.y, strike.ringRadius);
          setLine(graphics, 2.2, "rgba(255,255,255,0.75)");
          graphics.drawCircle(strike.x, strike.y, strike.ringRadius - 4);
          // Puffs riding the wavefront.
          for (let index = 0; index < 10; index += 1) {
            const a = (Math.PI * 2 * index) / 10 + pulse * 0.5;
            const px = strike.x + Math.cos(a) * strike.ringRadius;
            const py = strike.y + Math.sin(a) * strike.ringRadius;
            beginFill(graphics, "#eaffc0", 0.26 + fade * 0.2);
            graphics.drawCircle(px, py, 7 + fade * 5);
            graphics.endFill();
          }
          if (Math.random() < delta * 30) {
            const a = Math.random() * Math.PI * 2;
            this.spawnParticle({
              x: strike.x + Math.cos(a) * strike.ringRadius,
              y: strike.y + Math.sin(a) * strike.ringRadius,
              vx: Math.cos(a) * 26,
              vy: Math.sin(a) * 26 - 14,
              life: 0.5,
              scale: 0.3,
              color: "#e8ffbe",
              alpha: 0.42,
              blendMode: SCREEN_BLEND,
            });
          }
        }
        continue;
      }

      // Reworked skills carry their own spawnSkillEffect visuals; skip the generic diamond stamp.
      if (strike.kind === "stormSweep" || strike.kind === "clockRewind" || strike.kind === "moonWell") {
        continue;
      }
      setLine(graphics, 7, "rgba(255, 227, 173, 0.12)");
      drawRotatedDiamond(graphics, strike.x, strike.y, strike.radius * 1.22, strike.radius * 1.68);
      setLine(graphics, 3, strike.color);
      drawRotatedDiamond(graphics, strike.x, strike.y, strike.radius * 0.95, strike.radius * 1.3);
      setLine(graphics, 2, "rgba(255, 255, 255, 0.7)");
      graphics.moveTo(strike.x - strike.radius * 0.18, strike.y - strike.radius * 1.18);
      graphics.lineTo(strike.x + strike.radius * 0.08, strike.y - strike.radius * 0.36);
      graphics.lineTo(strike.x - strike.radius * 0.04, strike.y - strike.radius * 0.36);
      graphics.lineTo(strike.x + strike.radius * 0.22, strike.y + strike.radius * 0.82);
      if (Math.random() < delta * 10) {
        this.spawnParticle({
          x: strike.x,
          y: strike.y,
          vx: (Math.random() - 0.5) * 16,
          vy: -10 - Math.random() * 8,
          life: 0.22,
          scale: 0.2,
          color: strike.color,
        });
      }
    }
  }

  drawMines(mines) {
    const graphics = this.layers.mines;
    for (const mine of mines) {
      if (mine.kind === "dewChain") {
        const ready = mine.armTime <= 0;
        beginFill(graphics, ready ? "#c6fff2" : "#8adfd6", ready ? 0.95 : 0.78);
        graphics.drawCircle(mine.x, mine.y, mine.radius * 0.85);
        graphics.endFill();
        beginFill(graphics, "rgba(255,255,255,0.9)", 0.85);
        graphics.drawCircle(mine.x - mine.radius * 0.22, mine.y - mine.radius * 0.22, mine.radius * 0.26);
        graphics.endFill();
        setLine(graphics, 2, ready ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.4)");
        graphics.drawCircle(mine.x, mine.y, mine.radius * (0.85 + (ready ? 0.25 : 0)));
        continue;
      }
      if (mine.kind === "emberSeed") {
        beginFill(graphics, "rgba(255, 156, 102, 0.88)");
        graphics.drawCircle(mine.x, mine.y, mine.radius);
        graphics.endFill();
        beginFill(graphics, "rgba(255, 228, 170, 0.9)");
        graphics.drawEllipse(mine.x, mine.y - mine.radius * 0.38, mine.radius * 0.24, mine.radius * 0.36);
        graphics.endFill();
        setLine(graphics, 2, "rgba(255, 244, 214, 0.76)");
        graphics.drawCircle(mine.x, mine.y, mine.radius * (0.66 + (mine.growProgress || 0) * 0.18));
        continue;
      }

      beginFill(graphics, mine.armTime <= 0 ? "#f0d2a6" : "#e2c191");
      graphics.drawCircle(mine.x, mine.y, mine.radius);
      graphics.endFill();
      beginFill(graphics, "#8b5b39");
      graphics.drawRoundedRect(mine.x - 3, mine.y - 1, 6, 12, 2);
      graphics.endFill();
      beginFill(graphics, "rgba(255,255,255,0.24)");
      graphics.drawCircle(mine.x - mine.radius * 0.16, mine.y - mine.radius * 0.14, mine.radius * 0.12);
      graphics.endFill();
    }
  }

  drawMeteors(meteors, delta) {
    const glowGraphics = this.layers.fieldGlow;
    for (const meteor of meteors) {
      const progress = clamp(meteor.progress, 0, 1);
      const x = lerp(meteor.startX, meteor.targetX, progress);
      const y = lerp(meteor.startY, meteor.targetY, progress);
      const visual = this.acquireFromPool("meteors", this.spriteLayers.meteors, () => this.createMeteorVisual());
      const textureData = this.getMeteorTexture(meteor.color);
      const scale = meteor.radius / textureData.baseRadius;

      const fallAngle = Math.atan2(meteor.targetY - meteor.startY, meteor.targetX - meteor.startX);
      const meteorColor = parseColor(meteor.color).color;
      visual.position.set(x, y);
      visual.mainSprite.texture = textureData.texture;
      // Deepen the tint (mix toward the pure hue) so light-colored comets like the orchid stay vivid.
      visual.mainSprite.tint = mixColors(meteorColor, 0x000000, 0.12);
      visual.mainSprite.scale.set(scale * 1.28);
      visual.mainSprite.rotation = fallAngle + Math.sin(this.getMotionTime(0.004) + meteor.x * 0.001) * 0.05;
      visual.glowSprite.tint = meteorColor;
      visual.glowSprite.scale.set(scale * 2.35);
      visual.glowSprite.alpha = 0.5;

      // Bright, saturated target marker so the impact point is clearly telegraphed.
      setLine(glowGraphics, 10, `${meteor.color}55`);
      glowGraphics.drawCircle(meteor.targetX, meteor.targetY, meteor.radius * (0.78 + progress * 0.18));
      setLine(glowGraphics, 4, meteor.color);
      glowGraphics.drawCircle(meteor.targetX, meteor.targetY, meteor.radius * (0.62 + progress * 0.12));
      setLine(glowGraphics, 2, "rgba(255,255,255,0.85)");
      glowGraphics.drawCircle(meteor.targetX, meteor.targetY, meteor.radius * (0.5 + progress * 0.1));

      const backX = x - Math.cos(fallAngle) * meteor.radius * 1.1;
      const backY = y - Math.sin(fallAngle) * meteor.radius * 1.1;
      if (Math.random() < delta * 48) {
        this.spawnParticle({
          x: backX + (Math.random() - 0.5) * 8,
          y: backY + (Math.random() - 0.5) * 8,
          vx: -Math.cos(fallAngle) * 26 + (Math.random() - 0.5) * 10,
          vy: -Math.sin(fallAngle) * 26 + (Math.random() - 0.5) * 10,
          life: 0.5,
          scale: 0.36,
          color: meteor.color,
          alpha: 0.62,
          blendMode: SCREEN_BLEND,
        });
      }
      if (Math.random() < delta * 14) {
        this.spawnParticle({
          x,
          y,
          vx: (Math.random() - 0.5) * 10,
          vy: -8 - Math.random() * 8,
          life: 0.3,
          scale: 0.2,
          color: "#fff1d8",
          alpha: 0.3,
        });
      }
    }
  }

  drawBeacons(beacons, delta) {
    const textureData = this.getBeaconTexture();
    for (const beacon of beacons) {
      const flash = clamp(1 - beacon.shotClock / beacon.shotInterval, 0, 1);
      const visual = this.acquireFromPool("beacons", this.spriteLayers.beacons, () => this.createBeaconVisual());
      const scale = beacon.radius / textureData.baseRadius;
      const tint = beacon.kind === "emberTree" ? parseColor(beacon.color).color : 0xffffff;
      visual.position.set(beacon.x, beacon.y);
      visual.mainSprite.texture = textureData.texture;
      visual.mainSprite.tint = tint;
      visual.mainSprite.scale.set(scale * 1.08);
      visual.mainSprite.rotation = beacon.pulse * 0.04;
      visual.haloSprite.tint = beacon.kind === "emberTree" ? mixColors(tint, 0xffffff, 0.18) : 0xffdcb3;
      visual.haloSprite.scale.set(scale * (2.2 + flash * 0.22));
      visual.haloSprite.alpha = (0.18 + flash * 0.16) * this.visualProfile.effectLayerAlpha;
      visual.ringSprite.tint = beacon.kind === "emberTree" ? mixColors(tint, 0xffffff, 0.36) : 0xffedc7;
      visual.ringSprite.scale.set(scale * (1.6 + flash * 0.22));
      visual.ringSprite.alpha = (0.22 + flash * 0.14) * this.visualProfile.effectLayerAlpha;
      visual.ringSprite.rotation = beacon.pulse * 0.05;

      if (Math.random() < delta * this.getSpawnRate(14)) {
        const angle = Math.random() * Math.PI * 2;
        this.spawnParticle({
          x: beacon.x + Math.cos(angle) * beacon.radius * 0.5,
          y: beacon.y + Math.sin(angle) * beacon.radius * 0.5,
          vx: Math.cos(angle) * 8,
          vy: Math.sin(angle) * 8 - 12,
          life: 0.42,
          scale: 0.24,
          color: "#fff4d8",
          alpha: 0.38,
          blendMode: SCREEN_BLEND,
        });
      }
    }
  }

  drawPickups(pickups, player, delta) {
    const textureData = this.getPickupTexture();
    for (const pickup of pickups) {
      const dx = pickup.x - player.x;
      const dy = pickup.y - player.y;
      const tailAngle = Math.atan2(dy, dx);
      const tailLength = pickup.vacuuming
        ? Math.min(72, 12 + (pickup.pullSpeed || 0) * 0.042)
        : Math.min(28, (pickup.pullSpeed || 0) * 0.034);
      const visual = this.acquireFromPool("pickups", this.spriteLayers.pickups, () => this.createPickupVisual());
      const scale = pickup.radius / textureData.baseRadius;

      visual.position.set(pickup.x, pickup.y);
      visual.mainSprite.texture = textureData.texture;
      visual.mainSprite.tint = pickup.vacuuming ? 0xfff2aa : 0xffffff;
      visual.mainSprite.scale.set(scale * (pickup.vacuuming ? 1.18 : 1) * (1 + Math.sin(this.getMotionTime(0.01) + pickup.x * 0.02) * 0.05));
      visual.mainSprite.rotation = this.getMotionTime(0.0018);
      visual.glowSprite.tint = pickup.vacuuming ? 0xffd75b : 0xffffff;
      visual.glowSprite.scale.set(scale * (pickup.vacuuming ? 2.4 + tailLength * 0.026 : 1.8 + tailLength * 0.02));
      visual.glowSprite.alpha = (pickup.vacuuming ? 0.28 + tailLength * 0.004 : 0.16 + tailLength * 0.01) * this.visualProfile.effectLayerAlpha;

      if (tailLength > 0) {
        this.spawnParticle({
          x: pickup.x + Math.cos(tailAngle) * pickup.radius * 0.4,
          y: pickup.y + Math.sin(tailAngle) * pickup.radius * 0.4,
          vx: Math.cos(tailAngle) * (pickup.vacuuming ? 22 : 14),
          vy: Math.sin(tailAngle) * (pickup.vacuuming ? 22 : 14),
          life: 0.24,
          scale: pickup.vacuuming ? 0.24 : 0.2,
          color: pickup.vacuuming ? "#ffe27b" : "#fff2a2",
          alpha: pickup.vacuuming ? 0.36 : 0.28,
          blendMode: SCREEN_BLEND,
        });
      }

      if (Math.random() < delta * this.getSpawnRate(pickup.vacuuming ? 16 : 7)) {
        this.spawnParticle({
          x: pickup.x + (Math.random() - 0.5) * pickup.radius,
          y: pickup.y + (Math.random() - 0.5) * pickup.radius,
          vx: (Math.random() - 0.5) * 10,
          vy: -6 - Math.random() * 10,
          life: 0.3,
          scale: 0.18,
          color: pickup.vacuuming ? "#fff0aa" : "#fffbe6",
          alpha: pickup.vacuuming ? 0.36 : 0.3,
          blendMode: SCREEN_BLEND,
        });
      }
    }
  }

  drawOrbitals(runtime, delta) {
    const state = runtime.skillStates.petalOrbit;
    if (!state) {
      return;
    }
    const definition = getSkillDefinition("petalOrbit");
    const stats = definition.statsByLevel[state.level - 1];
    const count = stats.count + (state.exclusives.petalCount || 0) + runtime.player.summonCountBonus;
    const sizeScale = 1 + (state.exclusives.petalBloom || 0) * 0.2;
    const radius = stats.orbitRadius * runtime.player.rangeMultiplier * sizeScale;
    const petalRadius = stats.size * runtime.player.projectileSizeMultiplier * sizeScale;
    const textureData = this.getOrbitalTexture();

    for (let index = 0; index < count; index += 1) {
      const angle = runtime.orbitAngle + (Math.PI * 2 * index) / count;
      const x = runtime.player.x + Math.cos(angle) * radius;
      const y = runtime.player.y + Math.sin(angle) * radius;
      const visual = this.acquireFromPool("orbitals", this.spriteLayers.orbitals, () => this.createOrbitalVisual());
      const scale = petalRadius / textureData.baseRadius;
      visual.position.set(x, y);
      visual.mainSprite.texture = textureData.texture;
      visual.mainSprite.scale.set(scale * 1.12);
      visual.mainSprite.rotation = angle;
      visual.glowSprite.scale.set(scale * 1.6);
      visual.glowSprite.alpha = 0.16;

      if (Math.random() < delta * 8) {
        this.spawnParticle({
          x,
          y,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6,
          life: 0.26,
          scale: 0.16,
          color: definition.color,
          alpha: 0.2,
          blendMode: SCREEN_BLEND,
        });
      }
    }
  }

  drawThunderSprites(runtime, delta) {
    const companions = runtime.companions || [];
    if (companions.length === 0) {
      return;
    }
    const graphics = this.layers.skillEffects;
    for (const companion of companions) {
      const bob = Math.sin(this.getMotionTime(0.011) + companion.orbitAngle) * 2;
      const y = companion.y + bob;
      setLine(graphics, 6, "rgba(195, 178, 255, 0.14)");
      graphics.drawCircle(companion.x, y, 11);
      beginFill(graphics, companion.color || "#c3b2ff", 0.3);
      graphics.drawCircle(companion.x, y, 7);
      graphics.endFill();
      beginFill(graphics, "rgba(255,255,255,0.9)", 0.55);
      drawStar(graphics, companion.x, y, 5, 2.2, 4);
      graphics.endFill();
      if (Math.random() < delta * 10) {
        this.spawnParticle({
          x: companion.x + (Math.random() - 0.5) * 4,
          y: y + (Math.random() - 0.5) * 4,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          life: 0.3,
          scale: 0.18,
          color: companion.color || "#c3b2ff",
          alpha: 0.3,
          blendMode: SCREEN_BLEND,
        });
      }
    }
  }
}
