import * as PIXI from "pixi.js";
import { ARENA, getSkillDefinition } from "./data.js";

const SCREEN_BLEND = typeof PIXI.BLEND_MODES.SCREEN === "number" ? PIXI.BLEND_MODES.SCREEN : PIXI.BLEND_MODES.ADD;
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
    this.world.position.set(-camera.x, -camera.y);

    this.updateParticles(delta);
    this.drawArena(camera);
    /* Decoration layer temporarily disabled
    this.drawDecorations(camera);
    */

    if (!runtime.session && !forceBackground) {
      this.finishFrame();
      this.app.renderer.render(this.app.stage);
      return;
    }

    this.drawFields(runtime.fields || [], delta);
    this.drawMeteors(runtime.meteors || [], delta);
    this.drawBeacons(runtime.beacons || [], delta);
    this.drawPickups(runtime.pickups || [], runtime.player, delta);
    this.drawStrikes(runtime.strikes || [], delta);
    this.drawMines(runtime.mines || []);
    this.drawPulses(runtime.pulses || [], delta);
    this.drawProjectiles(runtime.projectiles || [], delta);
    this.drawOrbitals(runtime, delta);
    this.drawEnemies(runtime.enemies || [], delta);
    this.drawSkillEffects(runtime.skillEffects || [], delta);
    this.drawEnemyProjectiles(runtime.enemyProjectiles || [], delta);
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
        return this.getCachedTexture("proj-glassPrism", 96, 14, (g, x, y, r) => {
          setLine(g, 4, "rgba(255,255,255,0.9)");
          g.moveTo(x - r, y); g.lineTo(x + r, y);
          setLine(g, 2, "rgba(200,230,255,0.5)");
          g.moveTo(x - r * 0.6, y - r * 0.3); g.lineTo(x + r * 0.6, y - r * 0.3);
          g.moveTo(x - r * 0.6, y + r * 0.3); g.lineTo(x + r * 0.6, y + r * 0.3);
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
      case "antlerBolt":
        return this.getCachedTexture("proj-antler", 96, 16, (g, x, y, r) => {
          beginFill(g, "#73d1ff");
          g.moveTo(x - r, y); g.lineTo(x + r * 0.2, y - r * 0.6); g.lineTo(x + r * 0.2, y + r * 0.6); g.closePath();
          g.endFill();
          beginFill(g, "rgba(200,240,255,0.3)");
          g.drawRect(x - r * 0.6, y - r * 0.15, r * 1.2, r * 0.3);
          g.endFill();
        });
      case "auroraNeedle":
        return this.getCachedTexture("proj-aurora", 96, 10, (g, x, y, r) => {
          beginFill(g, "#c9a9ff");
          g.moveTo(x - r * 0.3, y - r); g.lineTo(x, y + r); g.lineTo(x + r * 0.3, y - r); g.closePath();
          g.endFill();
        });
      case "brambleBoomerang":
      case "harvestCrescent":
      case "operaMothBlade":
        return this.getCachedTexture("proj-boomerang", 96, 16, (g, x, y, r) => {
          setLine(g, 3, "rgba(255,255,255,0.9)");
          g.arc(x, y, r * 0.6, -0.6, 0.6);
          g.arc(x, y, r * 0.6, Math.PI - 0.6, Math.PI + 0.6);
          setLine(g, 0, "rgba(0,0,0,0)");
        });
      case "pearlBubble":
        return this.getCachedTexture("proj-pearl", 96, 18, (g, x, y, r) => {
          beginFill(g, "rgba(241,209,138,0.7)");
          g.drawCircle(x, y, r * 0.7);
          g.endFill();
          beginFill(g, "rgba(255,255,255,0.35)");
          g.drawCircle(x - r * 0.15, y - r * 0.2, r * 0.25);
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

  getMeteorTexture(color) {
    return this.getExternalTexture("projectileMeteor");
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

    const sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
    sprite.anchor.set(0.5);

    container.addChild(shadow, glow, sprite);
    container.shadowSprite = shadow;
    container.glowSprite = glow;
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
    this.playerVisual.shadowSprite.scale.set((player.radius / 24) * 1.38 * PLAYER_VISUAL_SCALE, (player.radius / 24) * 0.74 * PLAYER_VISUAL_SCALE);
    this.playerVisual.shadowSprite.alpha = player.phaseFadeFor > 0 ? 0.08 : 0.16;
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
    for (const enemy of enemies) {
      const visual = this.acquireFromPool("enemies", this.spriteLayers.enemies, () => this.createEnemyVisual());
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
      visual.mainSprite.tint = mixColors(enemy.color, 0xffffff, enemy.boss ? 0.15 : enemy.elite ? 0.08 : 0.22);
      visual.mainSprite.alpha = enemy.boss ? 0.98 : enemy.elite ? 1 : enemy.regionExclusive ? 0.98 : 0.96;
      visual.mainSprite.scale.set(mainScale);
      visual.mainSprite.rotation = enemy.boss && enemy.shapeId === "twilightMower"
        ? (enemy.attackPhase || 0) * 0.18
        : enemy.regionExclusive && (enemy.shapeId === "serpentKin" || enemy.shapeId === "tempestKin" || enemy.shapeId === "twilightKin")
          ? Math.sin(this.getMotionTime(0.002) + enemy.specialPhase) * 0.16
          : 0;
      visual.shadowSprite.scale.set(mainScale * 1.4, mainScale * 0.82);
      visual.shadowSprite.alpha = enemy.boss ? 0.28 : enemy.elite ? 0.26 : enemy.regionExclusive ? 0.22 : 0.18;
      visual.glowSprite.tint = glowTint;
      visual.glowSprite.scale.set(mainScale * (enemy.boss ? 2.45 : enemy.elite ? 2.08 : enemy.regionExclusive ? 1.88 : 1.54) * pulse);
      visual.glowSprite.alpha = (enemy.boss ? 0.24 : enemy.elite ? 0.2 : enemy.regionExclusive ? 0.18 : 0.09) * this.visualProfile.effectLayerAlpha;

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
      const mainScale = scale * (projectile.skillId === "flyingSword" ? 1.35 : isBubble ? 1.26 : 1.18);
      const glowTint = parseColor(projectile.color).color;

      visual.position.set(projectile.x, projectile.y);
      visual.mainSprite.texture = textureData.texture;
      visual.mainSprite.tint = projectile.skillId === "flyingSword"
        ? (projectile.giant ? 0xffe3a2 : mixColors(projectile.color, 0xffffff, 0.28))
        : mixColors(projectile.color, 0xffffff, isBubble ? 0.2 : 0.2);
      visual.mainSprite.scale.set(mainScale * (projectile.giant ? 1.08 : 1));
      visual.mainSprite.alpha = isBubble ? 0.84 : 1;
      visual.mainSprite.rotation = isBubble ? this.getMotionTime(0.0018) + projectile.x * 0.0006 : angle;
      visual.glowSprite.tint = isBubble ? 0xe6fbff : glowTint;
      visual.glowSprite.scale.set(mainScale * (projectile.skillId === "meteorShard" ? 1.75 : projectile.skillId === "flyingSword" ? 1.92 : isBubble ? 1.72 : 1.38));
      visual.glowSprite.alpha = (isBubble
        ? 0.18
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

      if (Math.random() < delta * this.getSpawnRate(projectile.skillId === "flyingSword" ? 22 : projectile.skillId === "meteorShard" ? 26 : 14)) {
        this.spawnParticle({
          x: projectile.x - Math.cos(angle) * projectile.radius * 0.8,
          y: projectile.y - Math.sin(angle) * projectile.radius * 0.8,
          vx: -Math.cos(angle) * (isBubble ? 11 : 16) + (Math.random() - 0.5) * 8,
          vy: -Math.sin(angle) * (isBubble ? 11 : 16) + (Math.random() - 0.5) * 8,
          life: projectile.skillId === "meteorShard" ? 0.42 : isBubble ? 0.28 : 0.34,
          scale: projectile.skillId === "flyingSword" ? 0.36 : isBubble ? 0.22 : 0.28,
          color: projectile.skillId === "meteorShard" ? "#ffba87" : projectile.skillId === "ribbonBlade" || projectile.skillId === "ribbonShard" ? "#f2ecff" : isBubble ? "#c8f7ff" : projectile.color,
          alpha: 0.42,
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

  drawStrikes(strikes, delta) {
    const graphics = this.layers.strikes;
    for (const strike of strikes) {
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

      visual.position.set(x, y);
      visual.mainSprite.texture = textureData.texture;
      visual.mainSprite.scale.set(scale * 1.1);
      visual.mainSprite.rotation = meteor.spin || 0;
      visual.glowSprite.tint = parseColor(meteor.color).color;
      visual.glowSprite.scale.set(scale * 2.1);
      visual.glowSprite.alpha = 0.26;

      setLine(glowGraphics, 8, "rgba(255, 194, 142, 0.14)");
      glowGraphics.drawCircle(meteor.targetX, meteor.targetY, meteor.radius * (0.74 + progress * 0.16));
      setLine(glowGraphics, 3, meteor.color);
      glowGraphics.drawCircle(meteor.targetX, meteor.targetY, meteor.radius * (0.62 + progress * 0.12));

      if (Math.random() < delta * 26) {
        this.spawnParticle({
          x,
          y,
          vx: (Math.random() - 0.5) * 14,
          vy: 10 + Math.random() * 20,
          life: 0.38,
          scale: 0.32,
          color: "#ffca96",
          alpha: 0.38,
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
}
