import {
  ARENA,
  GENERAL_UPGRADES,
  MONSTER_LIBRARY,
  PLAYER_BASE,
  ROUND_DURATION_SECONDS,
  SKILL_LIBRARY,
  TALENT_LIBRARY,
  createDefaultUnlockState,
  formatDuration,
  getBossDefinitionForDifficulty,
  getDifficultyProfile,
  getMonsterDefinition,
  getSkillDefinition,
  normalizeInitialSkillId,
  normalizeDifficultyLevel,
} from "./data.js";
import { getRegionDefinition } from "./garden-data.js";
import { PixiRenderer } from "./pixi-renderer.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function pickRandom(items, count) {
  const pool = [...items];
  const picks = [];
  while (pool.length > 0 && picks.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    picks.push(pool.splice(index, 1)[0]);
  }
  return picks;
}

function magnitude(dx, dy) {
  return Math.hypot(dx, dy) || 1;
}

function circleDistance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function formatMultiplier(value) {
  return `${value.toFixed(2)}x`;
}

function scaleProfile(baseProfile, scales = {}) {
  return {
    ...baseProfile,
    monsterHealthMultiplier: Number((baseProfile.monsterHealthMultiplier * (scales.enemyScale || 1)).toFixed(2)),
    monsterDamageMultiplier: Number((baseProfile.monsterDamageMultiplier * (scales.enemyScale || 1)).toFixed(2)),
    monsterSpeedMultiplier: Number((baseProfile.monsterSpeedMultiplier * (scales.enemyScale || 1)).toFixed(2)),
    spawnRateMultiplier: Number((baseProfile.spawnRateMultiplier * (scales.spawnScale || 1)).toFixed(2)),
    expMultiplier: Number((baseProfile.expMultiplier * (scales.expScale || 1)).toFixed(2)),
    coinMultiplier: Number((baseProfile.coinMultiplier * (scales.energyScale || 1)).toFixed(2)),
    bossHealthMultiplier: Number((baseProfile.bossHealthMultiplier * (scales.bossScale || 1)).toFixed(2)),
    bossDamageMultiplier: Number((baseProfile.bossDamageMultiplier * (scales.bossScale || 1)).toFixed(2)),
    bossSpeedMultiplier: Number((baseProfile.bossSpeedMultiplier * (scales.bossScale || 1)).toFixed(2)),
    bossBulletSpeedMultiplier: Number((baseProfile.bossBulletSpeedMultiplier * (scales.bossScale || 1)).toFixed(2)),
    bossAttackRateMultiplier: Number((baseProfile.bossAttackRateMultiplier * (scales.spawnScale || 1)).toFixed(2)),
  };
}

const SWORD_GLOW_COLORS = ["#ffe58f", "#8fe9ff", "#ffb4f6", "#b7ff84", "#ffd2a8", "#d7b7ff"];
const PROJECTILE_COUNT_SKILLS = new Set(["elfArrow", "flyingSword", "bubbleBurst", "thornVolley", "meteorSeed", "ribbonBlade"]);
const SUMMON_COUNT_SKILLS = new Set(["petalOrbit", "dewGarden", "mushroomMine", "lotusBeacon"]);
const PROJECTILE_GENERAL_UPGRADES = new Set(["projectileSpeed", "projectileSize", "projectileOverload"]);
const SUMMON_GENERAL_UPGRADES = new Set(["summonOverload"]);

function pickSwordGlowColor(currentColor) {
  const options = SWORD_GLOW_COLORS.filter((color) => color !== currentColor);
  return options[Math.floor(Math.random() * options.length)] || SWORD_GLOW_COLORS[0];
}

function traceDiamond(ctx, width, height) {
  ctx.beginPath();
  ctx.moveTo(0, -height / 2);
  ctx.lineTo(width / 2, 0);
  ctx.lineTo(0, height / 2);
  ctx.lineTo(-width / 2, 0);
  ctx.closePath();
}

function traceStar(ctx, outerRadius, innerRadius, points = 5) {
  ctx.beginPath();
  for (let index = 0; index < points * 2; index += 1) {
    const angle = -Math.PI / 2 + (Math.PI * index) / points;
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
}

function tracePetal(ctx, length, width) {
  ctx.beginPath();
  ctx.moveTo(0, -length / 2);
  ctx.bezierCurveTo(width, -length * 0.22, width, length * 0.18, 0, length / 2);
  ctx.bezierCurveTo(-width, length * 0.18, -width, -length * 0.22, 0, -length / 2);
  ctx.closePath();
}

function traceCrescent(ctx, outerRadius, innerRadius, offsetX) {
  ctx.beginPath();
  ctx.arc(0, 0, outerRadius, -Math.PI * 0.72, Math.PI * 0.72);
  ctx.arc(offsetX, 0, innerRadius, Math.PI * 0.72, -Math.PI * 0.72, true);
  ctx.closePath();
}

function createPlayer() {
  return {
    x: ARENA.width / 2,
    y: ARENA.height / 2,
    health: PLAYER_BASE.maxHealth,
    maxHealth: PLAYER_BASE.maxHealth,
    speed: PLAYER_BASE.speed,
    radius: PLAYER_BASE.radius,
    expPickupRange: PLAYER_BASE.expPickupRange,
    attackMultiplier: PLAYER_BASE.attackMultiplier,
    cooldownScale: PLAYER_BASE.cooldownScale,
    rangeMultiplier: PLAYER_BASE.rangeMultiplier,
    projectileSpeedMultiplier: PLAYER_BASE.projectileSpeedMultiplier,
    projectileSizeMultiplier: PLAYER_BASE.projectileSizeMultiplier,
    projectileCountBonus: 0,
    summonCountBonus: 0,
    expMultiplier: PLAYER_BASE.expMultiplier,
    critChance: PLAYER_BASE.critChance,
    critDamage: PLAYER_BASE.critDamage,
    dodgeChance: PLAYER_BASE.dodgeChance,
    armor: PLAYER_BASE.armor,
    blinkChargesMax: PLAYER_BASE.blinkChargesMax,
    blinkCharges: PLAYER_BASE.blinkChargesMax,
    blinkRechargeSeconds: PLAYER_BASE.blinkRechargeSeconds,
    blinkRechargeClock: 0,
    barrier: PLAYER_BASE.barrier,
    invulnerableFor: 0,
  };
}

export class GameRuntime {
  constructor({ canvas, callbacks = {} }) {
    this.canvas = canvas;
    this.renderer = new PixiRenderer({ canvas });
    this.callbacks = callbacks;

    this.state = "menu";
    this.input = {
      up: false,
      down: false,
      left: false,
      right: false,
    };

    this.player = createPlayer();
    this.generalLevels = Object.fromEntries(GENERAL_UPGRADES.map((item) => [item.id, 0]));
    this.skillStates = {};
    this.session = null;
    this.enemies = [];
    this.enemyProjectiles = [];
    this.projectiles = [];
    this.pulses = [];
    this.fields = [];
    this.strikes = [];
    this.mines = [];
    this.skillEffects = [];
    this.meteors = [];
    this.beacons = [];
    this.pickups = [];
    this.orbitAngle = 0;
    this.lastTimestamp = 0;
    this.hudClock = 0;
    this.gameSpeedMultiplier = 1;
    this.pendingChoices = [];
    this.keysBound = false;
    this.metaUnlocks = createDefaultUnlockState();

    this.bindKeys();
    this.callbacks.onSpeedChange?.(this.gameSpeedMultiplier);
    this.renderIdleFrame();
  }

  bindKeys() {
    if (this.keysBound) {
      return;
    }

    window.addEventListener("keydown", (event) => {
      if (event.key === "w" || event.key === "ArrowUp") this.input.up = true;
      if (event.key === "s" || event.key === "ArrowDown") this.input.down = true;
      if (event.key === "a" || event.key === "ArrowLeft") this.input.left = true;
      if (event.key === "d" || event.key === "ArrowRight") this.input.right = true;
      if (event.code === "Space") {
        event.preventDefault();
        this.tryBlink();
      }
      if (event.key === "Escape") {
        if (this.state === "running") {
          this.pause();
        } else if (this.state === "paused") {
          this.resume();
        }
      }
    });

    window.addEventListener("keyup", (event) => {
      if (event.key === "w" || event.key === "ArrowUp") this.input.up = false;
      if (event.key === "s" || event.key === "ArrowDown") this.input.down = false;
      if (event.key === "a" || event.key === "ArrowLeft") this.input.left = false;
      if (event.key === "d" || event.key === "ArrowRight") this.input.right = false;
    });

    this.keysBound = true;
  }

  resizeViewport(width, height) {
    this.renderer.resize(width, height);
  }

  setEyeComfortMode(enabled) {
    this.renderer.setEyeComfortMode(enabled);
    if (this.state === "menu") {
      this.renderIdleFrame();
      return;
    }
    this.render();
  }

  startRun(progress, options = {}) {
    const difficultyLevel = normalizeDifficultyLevel(options.difficultyLevel ?? progress?.settings?.difficultyLevel ?? 1);
    const difficultyProfile = scaleProfile(getDifficultyProfile(difficultyLevel), options.profileScales);
    const bossDefinition = options.bossId ? getMonsterDefinition(options.bossId) || getBossDefinitionForDifficulty(difficultyLevel) : getBossDefinitionForDifficulty(difficultyLevel);
    const regionDefinition = options.regionId ? getRegionDefinition(options.regionId) : null;
    const defaultUnlocks = createDefaultUnlockState();
    this.metaUnlocks = {
      skills: { ...defaultUnlocks.skills, ...(progress?.unlocks?.skills || {}) },
      exclusives: { ...defaultUnlocks.exclusives, ...(progress?.unlocks?.exclusives || {}) },
      disabledExclusives: { ...defaultUnlocks.disabledExclusives, ...(progress?.unlocks?.disabledExclusives || {}) },
    };
    if (Array.isArray(options.allowedSkillIds) && options.allowedSkillIds.length > 0) {
      const allowedSkillSet = new Set(options.allowedSkillIds);
      for (const skillId of Object.keys(this.metaUnlocks.skills)) {
        this.metaUnlocks.skills[skillId] = allowedSkillSet.has(skillId);
      }
    }
    const preferredSkillId = options.initialSkillId ?? progress?.settings?.initialSkillId ?? "flyingSword";
    const unlockedSkillIds = Array.isArray(options.allowedSkillIds) && options.allowedSkillIds.length > 0
      ? options.allowedSkillIds.filter((skillId) => Boolean(getSkillDefinition(skillId)))
      : SKILL_LIBRARY.filter((skill) => this.metaUnlocks.skills[skill.id] || skill.startsUnlocked).map((skill) => skill.id);
    const startingSkillId = unlockedSkillIds.includes(preferredSkillId)
      ? preferredSkillId
      : normalizeInitialSkillId(unlockedSkillIds[0] || preferredSkillId, this.metaUnlocks);
    this.player = createPlayer();
    this.input = {
      up: false,
      down: false,
      left: false,
      right: false,
    };
    this.generalLevels = Object.fromEntries(GENERAL_UPGRADES.map((item) => [item.id, 0]));
    this.skillStates = {};
    this.session = {
      elapsed: 0,
      kills: 0,
      level: 1,
      exp: 0,
      expRequired: 18,
      spawnTimer: 0.85,
      spawnRateMultiplier: difficultyProfile.spawnRateMultiplier,
      coinRewardMultiplier: difficultyProfile.coinMultiplier * (options.energyRewardScale || 1),
      expVacuumEnabled: false,
      expVacuumInterval: 0,
      expVacuumTimer: 0,
      bossSpawned: false,
      resultShown: false,
      mode: options.mode || "survival",
      selectedCharacterId: options.characterId || null,
      regionId: options.regionId || null,
      regionMonsterId: regionDefinition?.specialMonsterId || null,
      allowedSkillIds: unlockedSkillIds,
      roundDurationSeconds: options.roundDurationSeconds || ROUND_DURATION_SECONDS,
      difficultyLevel,
      difficultyProfile,
      bossId: bossDefinition.id,
      startingSkillId,
      upgradesExhaustedNotified: false,
      discoveries: {
        monsters: new Set(),
        skills: new Set(),
      },
    };
    this.enemies = [];
    this.enemyProjectiles = [];
    this.projectiles = [];
    this.pulses = [];
    this.fields = [];
    this.strikes = [];
    this.mines = [];
    this.skillEffects = [];
    this.meteors = [];
    this.beacons = [];
    this.pickups = [];
    this.orbitAngle = 0;
    this.pendingChoices = [];
    this.setGameSpeed(1);

    this.applyTalents(progress?.talents || {});
    this.unlockSkill(startingSkillId, false);
    this.state = "running";
    this.lastTimestamp = 0;
    this.callbacks.onSessionLabel?.(
      "战斗进行中",
      `起始技能：${getSkillDefinition(startingSkillId)?.name || "飞剑术"}，撑过 ${Math.round(this.session.roundDurationSeconds / 60)} 分钟并击败最终 Boss`
    );
    this.callbacks.onOverlayChange?.(null);
    this.emitHud();
    window.requestAnimationFrame((timestamp) => this.loop(timestamp));
  }

  applyTalents(talentLevels) {
    for (const talent of TALENT_LIBRARY) {
      const level = talentLevels[talent.id] || 0;
      if (level > 0) {
        talent.apply(this.player, level, this.session);
      }
    }

    this.player.health = this.player.maxHealth;
  }

  unlockSkill(skillId, showToast = true) {
    const definition = getSkillDefinition(skillId);
    if (!definition || this.skillStates[skillId]) {
      return;
    }

    this.skillStates[skillId] = {
      level: 1,
      cooldown: 0.1,
      exclusives: Object.fromEntries((definition.exclusiveUpgrades || []).map((upgrade) => [upgrade.id, 0])),
      glowColor: null,
    };
    this.session.discoveries.skills.add(skillId);
    if (showToast) {
      this.callbacks.onToast?.(`解锁技能：${definition.name}`);
    }
  }

  setGameSpeed(multiplier) {
    const nextMultiplier = multiplier >= 2 ? 2 : 1;
    this.gameSpeedMultiplier = nextMultiplier;
    this.callbacks.onSpeedChange?.(nextMultiplier);
    return nextMultiplier;
  }

  toggleGameSpeed() {
    return this.setGameSpeed(this.gameSpeedMultiplier === 2 ? 1 : 2);
  }

  pause() {
    if (this.state !== "running") {
      return;
    }
    this.state = "paused";
    this.callbacks.onOverlayChange?.("pauseScreen");
    this.callbacks.onSessionLabel?.("战斗暂停", "按 Esc 或按钮继续");
    this.emitHud();
  }

  resume() {
    if (this.state !== "paused") {
      return;
    }
    this.state = "running";
    this.callbacks.onOverlayChange?.(null);
    this.callbacks.onSessionLabel?.("战斗进行中", "撑过 15 分钟并击败最终 Boss");
    this.lastTimestamp = 0;
    window.requestAnimationFrame((timestamp) => this.loop(timestamp));
  }

  abandonRun() {
    if (!this.session) {
      return;
    }
    this.finishRun(false, true);
  }

  chooseUpgrade(choiceKey) {
    if (this.state !== "levelup") {
      return;
    }

    const picked = this.pendingChoices.find((choice) => choice.key === choiceKey);
    if (!picked) {
      return;
    }

    this.applyUpgradeChoice(picked);
    this.pendingChoices = [];
    if (this.tryStartLevelUp()) {
      this.lastTimestamp = 0;
      return;
    }

    this.state = "running";
    this.callbacks.onOverlayChange?.(null);
    this.callbacks.onSessionLabel?.("战斗进行中", "升级完成，继续推进局内成长");
    this.emitHud();
    this.lastTimestamp = 0;
    window.requestAnimationFrame((timestamp) => this.loop(timestamp));
  }

  applyUpgradeChoice(choice) {
    if (choice.type === "general") {
      const upgrade = GENERAL_UPGRADES.find((item) => item.id === choice.id);
      if (!upgrade) {
        return;
      }
      this.generalLevels[upgrade.id] += 1;
      upgrade.apply(this.player, this.session);
      this.callbacks.onToast?.(`获得成长：${upgrade.name}`);
      return;
    }

    if (choice.type === "skill-unlock") {
      this.unlockSkill(choice.id, true);
      return;
    }

    if (choice.type === "skill-level") {
      const skillState = this.skillStates[choice.id];
      const definition = getSkillDefinition(choice.id);
      if (!skillState || !definition) {
        return;
      }
      skillState.level = clamp(skillState.level + 1, 1, definition.maxLevel);
      this.callbacks.onToast?.(`技能提升：${definition.name} Lv.${skillState.level}`);
      return;
    }

    if (choice.type === "exclusive") {
      const skillState = this.skillStates[choice.skillId];
      const definition = getSkillDefinition(choice.skillId);
      const exclusive = definition?.exclusiveUpgrades.find((item) => item.id === choice.id);
      if (!skillState || !exclusive) {
        return;
      }
      skillState.exclusives[choice.id] += 1;
      if (choice.id === "swordGlow") {
        skillState.glowColor = skillState.glowColor || pickSwordGlowColor();
      }
      if (choice.id === "swordGlowColor") {
        skillState.glowColor = pickSwordGlowColor(skillState.glowColor);
      }
      this.callbacks.onToast?.(`专属成长：${exclusive.name}`);
    }
  }

  buildUpgradeChoices() {
    const choices = [];
    const unlockedSkills = this.metaUnlocks.skills || {};
    const unlockedExclusives = this.metaUnlocks.exclusives || {};
    const disabledExclusives = this.metaUnlocks.disabledExclusives || {};
    const allowedSkillSet = this.session?.allowedSkillIds?.length ? new Set(this.session.allowedSkillIds) : null;

    for (const general of GENERAL_UPGRADES) {
      const level = this.generalLevels[general.id] || 0;
      if (level < general.maxLevel && this.isGeneralUpgradeAvailable(general.id)) {
        choices.push({
          key: `general:${general.id}`,
          type: "general",
          id: general.id,
          title: general.name,
          description: general.description,
          detail: `当前 ${level} / ${general.maxLevel}`,
        });
      }
    }

    for (const skill of SKILL_LIBRARY) {
      if (allowedSkillSet && !allowedSkillSet.has(skill.id)) {
        continue;
      }

      const purchased = unlockedSkills[skill.id] || skill.startsUnlocked;
      if (!purchased) {
        continue;
      }

      const state = this.skillStates[skill.id];
      if (!state) {
        choices.push({
          key: `skill-unlock:${skill.id}`,
          type: "skill-unlock",
          id: skill.id,
          title: `解锁 ${skill.name}`,
          description: skill.description,
          detail: "新技能",
        });
        continue;
      }

      if (!state) {
        continue;
      }

      if (state.level < skill.maxLevel) {
        choices.push({
          key: `skill-level:${skill.id}`,
          type: "skill-level",
          id: skill.id,
          title: `${skill.name} Lv.${state.level + 1}`,
          description: skill.description,
          detail: `当前 ${state.level} / ${skill.maxLevel}`,
        });
      }

      for (const exclusive of skill.exclusiveUpgrades || []) {
        if (!unlockedExclusives[exclusive.id] || disabledExclusives[exclusive.id]) {
          continue;
        }

        if (exclusive.requiresExclusive && (state.exclusives[exclusive.requiresExclusive] || 0) <= 0) {
          continue;
        }

        const currentLevel = state.exclusives[exclusive.id] || 0;
        if (currentLevel < exclusive.maxLevel) {
          choices.push({
            key: `exclusive:${skill.id}:${exclusive.id}`,
            type: "exclusive",
            id: exclusive.id,
            skillId: skill.id,
            title: `${skill.name} · ${exclusive.name}`,
            description: exclusive.description,
            detail: `当前 ${currentLevel} / ${exclusive.maxLevel}`,
          });
        }
      }
    }

    return pickRandom(choices, 3);
  }

  getAvailableMonsters(elapsed, profile) {
    return MONSTER_LIBRARY.filter((monster) => {
      const availableElapsed = monster.regionExclusive ? elapsed : elapsed + profile.typeAdvanceSeconds;
      if (monster.boss || monster.minTime > availableElapsed) {
        return false;
      }

      if (monster.regionExclusive) {
        return monster.id === this.session?.regionMonsterId;
      }

      return true;
    });
  }

  loop(timestamp) {
    if (this.state !== "running") {
      this.render();
      return;
    }

    if (!this.lastTimestamp) {
      this.lastTimestamp = timestamp;
    }

    const delta = Math.min(0.033, (timestamp - this.lastTimestamp) / 1000);
    this.lastTimestamp = timestamp;
    const steps = this.gameSpeedMultiplier === 2 ? 2 : 1;
    for (let step = 0; step < steps && this.state === "running"; step += 1) {
      this.update(delta);
    }
    this.render();

    if (this.state === "running") {
      window.requestAnimationFrame((nextTimestamp) => this.loop(nextTimestamp));
    }
  }

  update(delta) {
    const player = this.player;
    const session = this.session;

    session.elapsed += delta;
    player.invulnerableFor = Math.max(0, player.invulnerableFor - delta);
    player.blinkRechargeClock += delta;
    if (player.blinkRechargeClock >= player.blinkRechargeSeconds) {
      player.blinkRechargeClock = 0;
      player.blinkCharges = Math.min(player.blinkChargesMax, player.blinkCharges + 1);
    }

    if (!session.bossSpawned && session.elapsed >= session.roundDurationSeconds) {
      this.spawnBoss();
    }

    this.movePlayer(delta);
    this.spawnEnemies(delta);
    this.updateSkillCooldowns(delta);
    this.updateProjectiles(delta);
    this.updatePulses(delta);
    this.updateFields(delta);
    this.updateStrikes(delta);
    this.updateMines(delta);
    this.updateSkillEffects(delta);
    this.updateMeteors(delta);
    this.updateBeacons(delta);
    this.updateOrbitals(delta);
    this.updateEnemies(delta);
    this.updateEnemyProjectiles(delta);
    this.updatePickups(delta);

    if (session.expVacuumEnabled) {
      session.expVacuumTimer -= delta;
      if (session.expVacuumTimer <= 0) {
        while (session.expVacuumTimer <= 0) {
          session.expVacuumTimer += session.expVacuumInterval;
        }
        this.pullAllExpPickups();
      }
    }

    this.hudClock += delta;
    if (this.hudClock >= 0.12) {
      this.hudClock = 0;
      this.emitHud();
    }
  }

  movePlayer(delta) {
    let dx = 0;
    let dy = 0;
    if (this.input.up) dy -= 1;
    if (this.input.down) dy += 1;
    if (this.input.left) dx -= 1;
    if (this.input.right) dx += 1;
    if (dx !== 0 || dy !== 0) {
      const length = magnitude(dx, dy);
      this.player.x += (dx / length) * this.player.speed * delta;
      this.player.y += (dy / length) * this.player.speed * delta;
    }
    this.player.x = clamp(this.player.x, 22, ARENA.width - 22);
    this.player.y = clamp(this.player.y, 22, ARENA.height - 22);
  }

  tryBlink() {
    if (this.state !== "running" || this.player.blinkCharges <= 0) {
      return;
    }

    let dx = 0;
    let dy = 0;
    if (this.input.up) dy -= 1;
    if (this.input.down) dy += 1;
    if (this.input.left) dx -= 1;
    if (this.input.right) dx += 1;
    if (dx === 0 && dy === 0) {
      dy = -1;
    }

    const length = magnitude(dx, dy);
    this.player.x = clamp(this.player.x + (dx / length) * 110, 24, ARENA.width - 24);
    this.player.y = clamp(this.player.y + (dy / length) * 110, 24, ARENA.height - 24);
    this.player.blinkCharges -= 1;
    this.player.invulnerableFor = 0.45;
    this.callbacks.onToast?.("闪现完成");
    this.emitHud();
  }

  getViewport() {
    return this.renderer.getViewportSize();
  }

  getCamera() {
    const viewport = this.getViewport();
    return {
      width: viewport.width,
      height: viewport.height,
      x: clamp(this.player.x - viewport.width / 2, 0, Math.max(0, ARENA.width - viewport.width)),
      y: clamp(this.player.y - viewport.height / 2, 0, Math.max(0, ARENA.height - viewport.height)),
    };
  }

  getSpawnPoint() {
    const camera = this.getCamera();
    const margin = 72;
    const side = Math.floor(Math.random() * 4);
    let x = 0;
    let y = 0;

    if (side === 0) {
      x = camera.x - margin;
      y = randomBetween(camera.y - margin, camera.y + camera.height + margin);
    } else if (side === 1) {
      x = camera.x + camera.width + margin;
      y = randomBetween(camera.y - margin, camera.y + camera.height + margin);
    } else if (side === 2) {
      x = randomBetween(camera.x - margin, camera.x + camera.width + margin);
      y = camera.y - margin;
    } else {
      x = randomBetween(camera.x - margin, camera.x + camera.width + margin);
      y = camera.y + camera.height + margin;
    }

    return {
      x: clamp(x, -40, ARENA.width + 40),
      y: clamp(y, -40, ARENA.height + 40),
    };
  }

  spawnEnemies(delta) {
    if (this.session.bossSpawned) {
      return;
    }

    this.session.spawnTimer -= delta;
    if (this.session.spawnTimer > 0) {
      return;
    }

    const elapsed = this.session.elapsed;
    const spawnCount = elapsed > 540 ? 4 : elapsed > 300 ? 3 : elapsed > 120 ? 2 : 1;
    const profile = this.session.difficultyProfile;
    for (let index = 0; index < spawnCount; index += 1) {
      const eligible = this.getAvailableMonsters(elapsed, profile);
      if (eligible.length === 0) {
        continue;
      }
      const totalWeight = eligible.reduce((sum, monster) => {
        const weight = monster.weight * (monster.minTime > elapsed ? profile.eliteWeightMultiplier : 1);
        return sum + weight;
      }, 0);
      let roll = Math.random() * totalWeight;
      let picked = eligible[0];
      for (const monster of eligible) {
        roll -= monster.weight * (monster.minTime > elapsed ? profile.eliteWeightMultiplier : 1);
        if (roll <= 0) {
          picked = monster;
          break;
        }
      }
      this.enemies.push(this.createEnemy(picked));
      this.session.discoveries.monsters.add(picked.id);
    }

    const pace = clamp(0.85 - elapsed * 0.0009, 0.22, 0.85);
    this.session.spawnTimer = pace / this.session.spawnRateMultiplier;
  }

  createEnemy(definition) {
    const spawn = this.getSpawnPoint();
    const profile = this.session?.difficultyProfile || getDifficultyProfile(1);
    const healthMultiplier = definition.boss ? profile.bossHealthMultiplier : profile.monsterHealthMultiplier;
    const speedMultiplier = definition.boss ? profile.bossSpeedMultiplier : profile.monsterSpeedMultiplier;
    const damageMultiplier = definition.boss ? profile.bossDamageMultiplier : profile.monsterDamageMultiplier;

    return {
      id: crypto.randomUUID(),
      typeId: definition.id,
      x: spawn.x,
      y: spawn.y,
      health: Math.ceil(definition.health * healthMultiplier),
      maxHealth: Math.ceil(definition.health * healthMultiplier),
      speed: definition.speed * speedMultiplier,
      damage: Math.ceil(definition.damage * damageMultiplier),
      radius: definition.radius,
      exp: Math.ceil(definition.exp * profile.expMultiplier),
      color: definition.color,
      accent: definition.accent,
      detailColor: definition.detailColor || "#fff7d8",
      boss: Boolean(definition.boss),
      bossTier: definition.bossTier || 0,
      shapeId: definition.shapeId || null,
      familyId: definition.familyId || null,
      effectId: definition.effectId || null,
      regionExclusive: Boolean(definition.regionExclusive),
      attackPattern: definition.attackPattern || "petalFan",
      contactCooldown: 0,
      burnTimer: 0,
      burnDamage: 0,
      slowTimer: 0,
      hitCooldowns: {},
      attackClock: definition.boss ? Math.max(0.55, 2.1 - (definition.bossTier || 1) * 0.08) : 0,
      attackPhase: 0,
      specialPhase: Math.random() * Math.PI * 2,
    };
  }

  spawnBoss() {
    const definition = getMonsterDefinition(this.session.bossId) || getBossDefinitionForDifficulty(this.session.difficultyLevel);
    this.session.bossSpawned = true;
    const boss = this.createEnemy(definition);
    const camera = this.getCamera();
    boss.x = clamp(camera.x + camera.width / 2, boss.radius + 26, ARENA.width - boss.radius - 26);
    boss.y = clamp(camera.y + camera.height * 0.22, boss.radius + 26, ARENA.height - boss.radius - 26);
    this.enemies.push(boss);
    this.session.discoveries.monsters.add(definition.id);
    this.callbacks.onToast?.(`${definition.name} 出现`);
    this.callbacks.onSessionLabel?.("Boss 战", `击败 ${definition.name} 即可获胜`);
  }

  getProjectileCountBonus(skillId) {
    return PROJECTILE_COUNT_SKILLS.has(skillId) ? this.player.projectileCountBonus : 0;
  }

  getSummonCountBonus(skillId) {
    return SUMMON_COUNT_SKILLS.has(skillId) ? this.player.summonCountBonus : 0;
  }

  hasOwnedSkillFromSet(skillSet) {
    return Object.keys(this.skillStates).some((skillId) => this.skillStates[skillId] && skillSet.has(skillId));
  }

  isGeneralUpgradeAvailable(generalId) {
    if (PROJECTILE_GENERAL_UPGRADES.has(generalId)) {
      return this.hasOwnedSkillFromSet(PROJECTILE_COUNT_SKILLS);
    }

    if (SUMMON_GENERAL_UPGRADES.has(generalId)) {
      return this.hasOwnedSkillFromSet(SUMMON_COUNT_SKILLS);
    }

    return true;
  }

  getSpreadAngle(index, totalCount, step) {
    return totalCount === 1 ? 0 : (-step * (totalCount - 1)) / 2 + index * step;
  }

  getProjectileAim(primaryTarget, index, totalCount, spreadStep, assignedTargets = []) {
    const assignedTarget = assignedTargets[index] || null;
    const target = assignedTarget || primaryTarget;
    if (!target) {
      return null;
    }

    return {
      target,
      direction: assignedTarget
        ? this.getDirectionVector(assignedTarget.x - this.player.x, assignedTarget.y - this.player.y)
        : this.getDirectionToTarget(primaryTarget, this.getSpreadAngle(index, totalCount, spreadStep)),
    };
  }

  updateSkillCooldowns(delta) {
    for (const [skillId, state] of Object.entries(this.skillStates)) {
      const definition = getSkillDefinition(skillId);
      if (!definition) {
        continue;
      }

      const stats = definition.statsByLevel[state.level - 1];
      if (skillId !== "petalOrbit") {
        state.cooldown -= delta;
        if (state.cooldown > 0) {
          continue;
        }
        state.cooldown = stats.cooldown * this.player.cooldownScale;
      }

      if (skillId === "flyingSword" || skillId === "elfArrow") this.castFlyingSword(skillId, state, stats);
      if (skillId === "solarPulse") this.castSolarPulse(state, stats);
      if (skillId === "bubbleBurst") this.castBubbleBurst(state, stats);
      if (skillId === "thornVolley") this.castThornVolley(state, stats);
      if (skillId === "dewGarden") this.castDewGarden(state, stats);
      if (skillId === "stormBloom") this.castStormBloom(state, stats);
      if (skillId === "mushroomMine") this.castMushroomMine(state, stats);
      if (skillId === "vineSnare") this.castVineSnare(state, stats);
      if (skillId === "meteorSeed") this.castMeteorSeed(state, stats);
      if (skillId === "ribbonBlade") this.castRibbonBlade(state, stats);
      if (skillId === "lotusBeacon") this.castLotusBeacon(state, stats);
    }
  }

  castFlyingSword(skillId, state, stats) {
    const arrowMode = skillId === "elfArrow";
    const giantLevel = arrowMode ? 0 : state.exclusives.swordGiant || 0;
    const tracking = arrowMode ? (state.exclusives.arrowTracking || 0) > 0 : (state.exclusives.swordTracking || 0) > 0;
    const extraPierce = arrowMode ? state.exclusives.arrowPierce || 0 : state.exclusives.swordPierce || 0;
    const extraVolley = arrowMode ? state.exclusives.arrowVolley || 0 : 0;
    const tailwindLevel = arrowMode ? state.exclusives.arrowTailwind || 0 : 0;
    const burstLevel = arrowMode ? state.exclusives.arrowBurst || 0 : 0;
    const totalCount = stats.count + this.getProjectileCountBonus(skillId) + extraVolley;
    const target = this.findNearestEnemy(this.player.x, this.player.y);
    const assignedTargets = !arrowMode && totalCount > 1 ? this.findNearestEnemies(this.player.x, this.player.y, totalCount) : [];
    const trackingTargets = tracking && totalCount > 1 ? this.findNearestEnemies(this.player.x, this.player.y, totalCount) : [];
    if (!target) {
      return;
    }

    for (let index = 0; index < totalCount; index += 1) {
      const giant = giantLevel > 0 && Math.random() < 0.08 * giantLevel;
      const aim = this.getProjectileAim(target, index, totalCount, arrowMode ? 0.12 : 0.08, assignedTargets);
      if (!aim) {
        continue;
      }

      const { direction, target: assignedTarget } = aim;
      const homingTarget = trackingTargets[index] || assignedTarget || target;
      const speedMultiplier = arrowMode ? 1 + tailwindLevel * 0.12 : giant ? 0.84 : 1;
      const damageMultiplier = arrowMode ? 1 + burstLevel * 0.24 : giant ? 8.5 : 1;
      const speed = stats.speed * this.player.projectileSpeedMultiplier * speedMultiplier;
      const radius = stats.size * this.player.projectileSizeMultiplier * (giant ? 4.5 : 1);
      const range = stats.range * this.player.rangeMultiplier * (arrowMode ? 1 + tailwindLevel * 0.18 : 1);

      this.projectiles.push({
        id: crypto.randomUUID(),
        skillId,
        sourceSkillId: skillId,
        x: this.player.x,
        y: this.player.y,
        vx: direction.x * speed,
        vy: direction.y * speed,
        speed,
        radius,
        damage: this.rollDamage(stats.damage * damageMultiplier),
        pierce: stats.pierce + extraPierce + (giant ? 99 : 0),
        maxDistance: giant ? Number.POSITIVE_INFINITY : range,
        distanceTravelled: 0,
        tracking: tracking && !giant,
        trackingTargetId: tracking && homingTarget ? homingTarget.id : null,
        color: giant ? "#ffcb61" : definitionColor(skillId),
        giant,
        glowColor: arrowMode ? "rgba(143, 223, 255, 0.76)" : state.exclusives.swordGlow > 0 ? state.glowColor || "#ffe58f" : null,
      });
    }
  }

  castSolarPulse(state, stats) {
    const waveBonus = state.exclusives.solarEcho || 0;
    const healLevel = state.exclusives.solarBloom || 0;
    const scorchLevel = state.exclusives.solarScorch || 0;
    const totalWaves = stats.waves + waveBonus;
    for (let waveIndex = 0; waveIndex < totalWaves; waveIndex += 1) {
      this.pulses.push({
        id: crypto.randomUUID(),
        x: this.player.x,
        y: this.player.y,
        radius: 0,
        maxRadius: stats.radius * this.player.rangeMultiplier,
        growth: stats.growth,
        damage: this.rollDamage(stats.damage),
        healLevel,
        scorchLevel,
        delay: waveIndex * 0.18,
        hitSet: new Set(),
        color: definitionColor("solarPulse"),
      });
    }
  }

  castBubbleBurst(state, stats) {
    const target = this.findNearestEnemy(this.player.x, this.player.y);
    if (!target) {
      return;
    }

    const totalCount = stats.count + this.getProjectileCountBonus("bubbleBurst");
    const assignedTargets = totalCount > 1 ? this.findNearestEnemies(this.player.x, this.player.y, totalCount) : [];

    for (let index = 0; index < totalCount; index += 1) {
      const aim = this.getProjectileAim(target, index, totalCount, 0.15, assignedTargets);
      if (!aim) {
        continue;
      }

      const { direction } = aim;
      const giantLevel = state.exclusives.bubbleGiant || 0;
      this.projectiles.push({
        id: crypto.randomUUID(),
        skillId: "bubbleBurst",
        x: this.player.x,
        y: this.player.y,
        vx: direction.x * stats.speed * this.player.projectileSpeedMultiplier,
        vy: direction.y * stats.speed * this.player.projectileSpeedMultiplier,
        speed: stats.speed,
        radius: stats.size * this.player.projectileSizeMultiplier * (1 + giantLevel * 0.35),
        damage: this.rollDamage(stats.damage),
        splash: stats.splash * this.player.rangeMultiplier * (1 + giantLevel * 0.3),
        maxDistance: 320 * this.player.rangeMultiplier,
        distanceTravelled: 0,
        color: definitionColor("bubbleBurst"),
        splitLevel: state.exclusives.bubbleSplit || 0,
        slowLevel: state.exclusives.bubbleSlow || 0,
      });
    }
  }

  castThornVolley(state, stats) {
    const target = this.findNearestEnemy(this.player.x, this.player.y);
    if (!target) {
      return;
    }

    const extraCount = (state.exclusives.thornFork || 0) * 2;
    const totalCount = stats.count + extraCount + this.getProjectileCountBonus("thornVolley");
    const rootLevel = state.exclusives.thornRoot || 0;
    const burstLevel = state.exclusives.thornBurst || 0;

    for (let index = 0; index < totalCount; index += 1) {
      const angleOffset = this.getSpreadAngle(index, totalCount, stats.spread);
      const direction = this.getDirectionToTarget(target, angleOffset);
      const speed = stats.speed * this.player.projectileSpeedMultiplier;
      this.projectiles.push({
        id: crypto.randomUUID(),
        skillId: "thornVolley",
        sourceSkillId: "thornVolley",
        x: this.player.x,
        y: this.player.y,
        vx: direction.x * speed,
        vy: direction.y * speed,
        speed,
        radius: stats.size * this.player.projectileSizeMultiplier,
        damage: this.rollDamage(stats.damage),
        pierce: stats.pierce,
        maxDistance: stats.range * this.player.rangeMultiplier,
        distanceTravelled: 0,
        color: definitionColor("thornVolley"),
        slowLevel: rootLevel,
        burstLevel,
        hasBurst: false,
      });
    }
  }

  castDewGarden(state, stats) {
    const spreadLevel = state.exclusives.dewSpread || 0;
    const totalCount = stats.count + spreadLevel + this.getSummonCountBonus("dewGarden");
    const chillLevel = state.exclusives.dewChill || 0;
    const mendLevel = state.exclusives.dewMend || 0;
    const anchors = this.findNearestEnemies(this.player.x, this.player.y, totalCount);
    const hasAnchors = anchors.length > 0;

    for (let index = 0; index < totalCount; index += 1) {
      const anchorCount = Math.max(1, anchors.length);
      const anchor = anchors[index % anchorCount] || this.player;
      const ringAngle = (Math.PI * 2 * index) / Math.max(1, totalCount);
      const ringDistance = hasAnchors
        ? totalCount > anchors.length
          ? 30 + 14 * Math.floor(index / anchorCount)
          : 0
        : totalCount > 1
          ? 42
          : 0;
      this.spawnField({
        sourceSkillId: "dewGarden",
        x: anchor.x + Math.cos(ringAngle) * ringDistance,
        y: anchor.y + Math.sin(ringAngle) * ringDistance,
        radius: stats.radius * this.player.rangeMultiplier,
        duration: stats.duration,
        tickInterval: stats.tickInterval,
        damage: this.rollDamage(stats.damage),
        slowLevel: 1 + chillLevel,
        healLevel: mendLevel,
        burnLevel: 0,
        color: "rgba(111, 217, 199, 0.22)",
        edgeColor: "rgba(207, 255, 245, 0.82)",
      });
    }
  }

  castStormBloom(state, stats) {
    const totalCount = stats.count + (state.exclusives.stormCount || 0);
    const chainLevel = state.exclusives.stormChain || 0;
    const fieldLevel = state.exclusives.stormField || 0;
    const anchors = this.findNearestEnemies(this.player.x, this.player.y, totalCount);

    for (let index = 0; index < totalCount; index += 1) {
      const anchorCount = Math.max(1, anchors.length);
      const anchor = anchors[index % anchorCount] || this.player;
      const ringAngle = (Math.PI * 2 * index) / Math.max(1, totalCount);
      const ringDistance = anchors.length > 0 && totalCount > anchors.length ? 26 + 12 * Math.floor(index / anchorCount) : 0;
      this.strikes.push({
        id: crypto.randomUUID(),
        x: clamp(anchor.x + Math.cos(ringAngle) * ringDistance, 28, ARENA.width - 28),
        y: clamp(anchor.y + Math.sin(ringAngle) * ringDistance, 28, ARENA.height - 28),
        radius: stats.radius * this.player.rangeMultiplier,
        delay: stats.delay,
        damage: this.rollDamage(stats.damage),
        chainLevel,
        fieldLevel,
        color: definitionColor("stormBloom"),
      });
    }
  }

  castMushroomMine(state, stats) {
    const totalCount = stats.count + (state.exclusives.mineStock || 0) + this.getSummonCountBonus("mushroomMine");
    const toxicLevel = state.exclusives.mineToxic || 0;
    const burstLevel = state.exclusives.mineBurst || 0;
    const baseAngle = this.orbitAngle + Math.PI / Math.max(1, totalCount);

    for (let index = 0; index < totalCount; index += 1) {
      const angle = baseAngle + (Math.PI * 2 * index) / Math.max(1, totalCount);
      const distance = 42 + (index % 2) * 18;
      this.mines.push({
        id: crypto.randomUUID(),
        x: clamp(this.player.x + Math.cos(angle) * distance, 24, ARENA.width - 24),
        y: clamp(this.player.y + Math.sin(angle) * distance, 24, ARENA.height - 24),
        radius: 13,
        explosionRadius: stats.radius * this.player.rangeMultiplier * (1 + burstLevel * 0.18),
        damage: this.rollDamage(stats.damage * (1 + burstLevel * 0.08)),
        armTime: stats.armTime,
        duration: stats.duration,
        toxicLevel,
        burstLevel,
      });
    }
  }

  castVineSnare(state, stats) {
    const totalCount = stats.count + (state.exclusives.vineCount || 0) * 2;
    const rootLevel = state.exclusives.vineRoot || 0;
    const bloomLevel = state.exclusives.vineBloom || 0;
    const maxRange = stats.range * this.player.rangeMultiplier;
    const targets = this.findNearestEnemies(this.player.x, this.player.y, totalCount * 2)
      .filter((enemy) => circleDistance(enemy, this.player) <= maxRange + enemy.radius)
      .slice(0, totalCount);

    if (targets.length === 0) {
      return;
    }

    for (const target of targets) {
      const damage = this.rollDamage(stats.damage * (1 + rootLevel * 0.12));
      this.damageEnemy(target, damage, "vineSnare");
      target.slowTimer = Math.max(target.slowTimer, stats.root + rootLevel * 0.42);
      this.spawnSkillEffect({
        kind: "vineWhip",
        x: this.player.x,
        y: this.player.y,
        targetX: target.x,
        targetY: target.y,
        duration: 0.18,
        color: definitionColor("vineSnare"),
        accent: "#efffdc",
        thickness: 4 + rootLevel,
      });

      if (bloomLevel > 0) {
        const bloomRadius = stats.bloomRadius * (1 + bloomLevel * 0.18);
        this.spawnSkillEffect({
          kind: "vineBloom",
          x: target.x,
          y: target.y,
          radius: bloomRadius,
          duration: 0.28,
          color: definitionColor("vineSnare"),
          accent: "#fff2da",
        });
        for (const enemy of this.enemies) {
          if (enemy.id === target.id) {
            continue;
          }
          if (circleDistance(enemy, target) <= bloomRadius + enemy.radius) {
            this.damageEnemy(enemy, damage * (0.34 + bloomLevel * 0.12), "vineSnare");
            enemy.slowTimer = Math.max(enemy.slowTimer, 0.4 + bloomLevel * 0.28);
          }
        }
      }
    }
  }

  castMeteorSeed(state, stats) {
    const totalCount = stats.count + (state.exclusives.meteorCount || 0) + this.getProjectileCountBonus("meteorSeed");
    const scorchLevel = state.exclusives.meteorScorch || 0;
    const shardLevel = state.exclusives.meteorShard || 0;
    const anchors = this.findNearestEnemies(this.player.x, this.player.y, totalCount);

    for (let index = 0; index < totalCount; index += 1) {
      const anchorCount = Math.max(1, anchors.length);
      const anchor = anchors[index % anchorCount] || this.player;
      const ringAngle = (Math.PI * 2 * index) / Math.max(1, totalCount);
      const ringDistance = anchors.length > 0 && totalCount > anchors.length ? 26 + 14 * Math.floor(index / anchorCount) : 0;
      const targetX = clamp(anchor.x + Math.cos(ringAngle) * ringDistance, 24, ARENA.width - 24);
      const targetY = clamp(anchor.y + Math.sin(ringAngle) * ringDistance, 24, ARENA.height - 24);
      this.meteors.push({
        id: crypto.randomUUID(),
        startX: targetX + randomBetween(-220, 220),
        startY: targetY - (260 + randomBetween(40, 150)),
        targetX,
        targetY,
        radius: stats.radius * this.player.rangeMultiplier,
        damage: this.rollDamage(stats.damage),
        fallTime: stats.fallTime,
        progress: 0,
        spin: randomBetween(-2.4, 2.4),
        scorchLevel,
        shardLevel,
        color: definitionColor("meteorSeed"),
      });
    }
  }

  castRibbonBlade(state, stats) {
    const target = this.findNearestEnemy(this.player.x, this.player.y);
    if (!target) {
      return;
    }

    const totalCount = stats.count + (state.exclusives.ribbonCount || 0) + this.getProjectileCountBonus("ribbonBlade");
    const returnLevel = state.exclusives.ribbonReturn || 0;
    const frayLevel = state.exclusives.ribbonFray || 0;
    const assignedTargets = totalCount > 1 ? this.findNearestEnemies(this.player.x, this.player.y, totalCount) : [];

    for (let index = 0; index < totalCount; index += 1) {
      const aim = this.getProjectileAim(target, index, totalCount, 0.22, assignedTargets);
      if (!aim) {
        continue;
      }

      const { direction } = aim;
      const speed = stats.speed * this.player.projectileSpeedMultiplier;
      this.projectiles.push({
        id: crypto.randomUUID(),
        skillId: "ribbonBlade",
        sourceSkillId: "ribbonBlade",
        x: this.player.x,
        y: this.player.y,
        vx: direction.x * speed,
        vy: direction.y * speed,
        speed,
        baseSpeed: speed,
        radius: stats.size * this.player.projectileSizeMultiplier,
        damage: this.rollDamage(stats.damage),
        pierce: stats.pierce + returnLevel,
        maxDistance: stats.range * this.player.rangeMultiplier,
        distanceTravelled: 0,
        color: definitionColor("ribbonBlade"),
        returnLevel,
        frayLevel,
        returning: false,
        recentHits: {},
      });
    }
  }

  castLotusBeacon(state, stats) {
    const totalCount = stats.count + (state.exclusives.lotusCount || 0) + this.getSummonCountBonus("lotusBeacon");
    const chainLevel = state.exclusives.lotusChain || 0;
    const wardLevel = state.exclusives.lotusWard || 0;
    const anchors = this.findNearestEnemies(this.player.x, this.player.y, totalCount);

    for (let index = 0; index < totalCount; index += 1) {
      const anchorCount = Math.max(1, anchors.length);
      const anchor = anchors[index % anchorCount] || this.player;
      const angle = (Math.PI * 2 * index) / Math.max(1, totalCount);
      const distance = anchors.length > 0 ? 28 + 16 * Math.floor(index / anchorCount) : 74 + (index % 2) * 18;
      this.beacons.push({
        id: crypto.randomUUID(),
        x: clamp(anchor.x + Math.cos(angle) * distance, 26, ARENA.width - 26),
        y: clamp(anchor.y + Math.sin(angle) * distance, 26, ARENA.height - 26),
        radius: 18,
        duration: stats.duration,
        shotClock: 0.18 + index * 0.12,
        shotInterval: stats.interval,
        damage: this.rollDamage(stats.damage),
        range: stats.range * this.player.rangeMultiplier,
        chainLevel,
        wardLevel,
        pulse: randomBetween(0, Math.PI * 2),
        color: definitionColor("lotusBeacon"),
      });
    }
  }

  spawnSkillEffect(config) {
    this.skillEffects.push({
      id: crypto.randomUUID(),
      ...config,
      duration: config.duration,
      maxDuration: config.duration,
    });
  }

  spawnMeteorShards(meteor) {
    const count = 4 + meteor.shardLevel * 2;
    const speed = 210 + meteor.shardLevel * 32;
    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count;
      this.projectiles.push({
        id: crypto.randomUUID(),
        skillId: "meteorShard",
        sourceSkillId: "meteorSeed",
        x: meteor.targetX,
        y: meteor.targetY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        speed,
        radius: 6,
        damage: meteor.damage * 0.28,
        pierce: 0,
        maxDistance: 120 + meteor.shardLevel * 20,
        distanceTravelled: 0,
        color: "#ffd4b2",
        recentHits: {},
      });
    }
  }

  spawnRibbonFray(projectile) {
    const count = 2 + projectile.frayLevel;
    const spread = 0.92;
    const baseAngle = Math.atan2(projectile.vy, projectile.vx) + Math.PI / 2;
    const speed = projectile.speed * 0.78;
    for (let index = 0; index < count; index += 1) {
      const angle = count === 1 ? baseAngle : baseAngle - (spread * (count - 1)) / 2 + index * spread;
      this.projectiles.push({
        id: crypto.randomUUID(),
        skillId: "ribbonShard",
        sourceSkillId: "ribbonBlade",
        x: projectile.x,
        y: projectile.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        speed,
        radius: Math.max(5, projectile.radius * 0.52),
        damage: projectile.damage * 0.3,
        pierce: 0,
        maxDistance: 96 + projectile.frayLevel * 18,
        distanceTravelled: 0,
        color: "#dbe2ff",
        recentHits: {},
      });
    }
  }

  spawnField(config) {
    this.fields.push({
      id: crypto.randomUUID(),
      x: clamp(config.x, 12, ARENA.width - 12),
      y: clamp(config.y, 12, ARENA.height - 12),
      radius: config.radius,
      duration: config.duration,
      tickInterval: config.tickInterval,
      tickClock: 0,
      damage: config.damage,
      sourceSkillId: config.sourceSkillId,
      slowLevel: config.slowLevel || 0,
      healLevel: config.healLevel || 0,
      burnLevel: config.burnLevel || 0,
      color: config.color || "rgba(255,255,255,0.18)",
      edgeColor: config.edgeColor || "rgba(255,255,255,0.68)",
    });
  }

  spawnThornBurst(projectile) {
    const count = 2 + projectile.burstLevel;
    const baseAngle = Math.atan2(projectile.vy, projectile.vx);
    const spread = 0.78;
    const shardSpeed = projectile.speed * 0.82;
    for (let index = 0; index < count; index += 1) {
      const angle = count === 1 ? baseAngle : baseAngle - spread / 2 + (spread * index) / (count - 1);
      this.projectiles.push({
        id: crypto.randomUUID(),
        skillId: "thornShard",
        sourceSkillId: "thornVolley",
        x: projectile.x,
        y: projectile.y,
        vx: Math.cos(angle) * shardSpeed,
        vy: Math.sin(angle) * shardSpeed,
        speed: shardSpeed,
        radius: Math.max(4, projectile.radius * 0.6),
        damage: projectile.damage * 0.42,
        pierce: 0,
        maxDistance: 120,
        distanceTravelled: 0,
        color: "#cde796",
        slowLevel: Math.max(0, projectile.slowLevel - 1),
        burstLevel: 0,
        hasBurst: true,
      });
    }
  }

  updateProjectiles(delta) {
    const next = [];

    for (const projectile of this.projectiles) {
      if (projectile.recentHits) {
        for (const enemyId of Object.keys(projectile.recentHits)) {
          projectile.recentHits[enemyId] = Math.max(0, projectile.recentHits[enemyId] - delta);
          if (projectile.recentHits[enemyId] <= 0) {
            delete projectile.recentHits[enemyId];
          }
        }
      }

      if (projectile.tracking) {
        const trackedTarget = projectile.trackingTargetId ? this.findEnemyById(projectile.trackingTargetId) : null;
        const target = trackedTarget || this.findNearestEnemy(projectile.x, projectile.y);
        if (target) {
          projectile.trackingTargetId = target.id;
          const direction = this.getDirectionVector(target.x - projectile.x, target.y - projectile.y);
          projectile.vx += direction.x * projectile.speed * 0.12 * delta * 60;
          projectile.vy += direction.y * projectile.speed * 0.12 * delta * 60;
          const length = magnitude(projectile.vx, projectile.vy);
          projectile.vx = (projectile.vx / length) * projectile.speed;
          projectile.vy = (projectile.vy / length) * projectile.speed;
        }
      }

      if (projectile.skillId === "ribbonBlade" && projectile.returning) {
        const returnSpeed = (projectile.baseSpeed || projectile.speed) * (1.08 + (projectile.returnLevel || 0) * 0.14);
        const direction = this.getDirectionVector(this.player.x - projectile.x, this.player.y - projectile.y);
        projectile.vx = direction.x * returnSpeed;
        projectile.vy = direction.y * returnSpeed;
        projectile.speed = returnSpeed;
      }

      projectile.x += projectile.vx * delta;
      projectile.y += projectile.vy * delta;
      projectile.distanceTravelled += Math.hypot(projectile.vx * delta, projectile.vy * delta);
      let removed = false;

      if (projectile.skillId === "ribbonBlade" && !projectile.returning && projectile.distanceTravelled >= projectile.maxDistance) {
        projectile.returning = true;
        projectile.distanceTravelled = 0;
      }

      if (
        projectile.skillId === "ribbonBlade" &&
        projectile.returning &&
        circleDistance(projectile, this.player) <= projectile.radius + this.player.radius + 6
      ) {
        removed = true;
      }

      for (const enemy of this.enemies) {
        if (removed) {
          break;
        }
        if (circleDistance(projectile, enemy) > projectile.radius + enemy.radius) {
          continue;
        }

        if (projectile.recentHits?.[enemy.id] > 0) {
          continue;
        }

        if (projectile.recentHits) {
          projectile.recentHits[enemy.id] = projectile.skillId === "ribbonBlade" ? 0.24 : 0.12;
        }

        this.damageEnemy(enemy, projectile.damage, projectile.sourceSkillId || projectile.skillId);
        if (projectile.skillId === "bubbleBurst") {
          this.explodeBubble(projectile);
          removed = true;
          break;
        }

        if (projectile.slowLevel > 0) {
          enemy.slowTimer = Math.max(enemy.slowTimer, 0.55 + projectile.slowLevel * 0.38);
        }

        if (projectile.burstLevel > 0 && !projectile.hasBurst) {
          projectile.hasBurst = true;
          this.spawnThornBurst(projectile);
        }

        if (projectile.skillId === "ribbonBlade" && projectile.frayLevel > 0) {
          this.spawnRibbonFray(projectile);
        }

        projectile.pierce -= 1;
        if (projectile.pierce < 0) {
          removed = true;
          break;
        }
      }

      if (!removed && projectile.distanceTravelled >= projectile.maxDistance && projectile.skillId !== "ribbonBlade") {
        if (projectile.skillId === "bubbleBurst") {
          this.explodeBubble(projectile);
        }
        removed = true;
      }

      if (
        !removed &&
        (projectile.x < -800 || projectile.x > ARENA.width + 800 || projectile.y < -800 || projectile.y > ARENA.height + 800)
      ) {
        removed = true;
      }

      if (!removed) {
        next.push(projectile);
      }
    }

    this.projectiles = next;
  }

  explodeBubble(projectile) {
    this.spawnSkillEffect({
      kind: "bubblePop",
      x: projectile.x,
      y: projectile.y,
      radius: projectile.splash * 0.58,
      duration: 0.34,
      color: "rgba(146, 231, 255, 0.92)",
      accent: "rgba(255, 255, 255, 0.94)",
    });

    for (const enemy of this.enemies) {
      const distance = circleDistance(projectile, enemy);
      if (distance <= projectile.splash + enemy.radius) {
        this.damageEnemy(enemy, projectile.damage, "bubbleBurst");
        if (projectile.slowLevel > 0) {
          enemy.slowTimer = Math.max(enemy.slowTimer, 1.3 + projectile.slowLevel * 0.5);
        }
      }
    }

    if (projectile.splitLevel > 0) {
      const target = this.findNearestEnemy(projectile.x, projectile.y);
      for (let index = 0; index < projectile.splitLevel + 1; index += 1) {
        const baseAngle = (Math.PI * 2 * index) / (projectile.splitLevel + 1);
        const direction = target
          ? this.getDirectionVector(target.x - projectile.x, target.y - projectile.y)
          : { x: Math.cos(baseAngle), y: Math.sin(baseAngle) };
        this.projectiles.push({
          id: crypto.randomUUID(),
          skillId: "bubbleShard",
          x: projectile.x,
          y: projectile.y,
          vx: direction.x * 240,
          vy: direction.y * 240,
          speed: 240,
          radius: Math.max(6, projectile.radius * 0.45),
          damage: projectile.damage * 0.5,
          pierce: 0,
          maxDistance: 120,
          distanceTravelled: 0,
          color: "#9be6ef",
        });
      }
    }
  }

  updatePulses(delta) {
    const next = [];
    for (const pulse of this.pulses) {
      if (pulse.delay > 0) {
        pulse.delay -= delta;
        next.push(pulse);
        continue;
      }

      pulse.radius += pulse.growth * delta;
      for (const enemy of this.enemies) {
        if (pulse.hitSet.has(enemy.id)) {
          continue;
        }
        if (circleDistance(pulse, enemy) <= pulse.radius + enemy.radius) {
          pulse.hitSet.add(enemy.id);
          this.damageEnemy(enemy, pulse.damage, "solarPulse");
          if (pulse.healLevel > 0) {
            this.player.health = Math.min(this.player.maxHealth, this.player.health + 1.2 * pulse.healLevel);
          }
          if (pulse.scorchLevel > 0) {
            enemy.burnTimer = Math.max(enemy.burnTimer, 1.8 + pulse.scorchLevel * 0.5);
            enemy.burnDamage = Math.max(enemy.burnDamage, pulse.damage * 0.18 * pulse.scorchLevel);
          }
        }
      }

      if (pulse.radius <= pulse.maxRadius) {
        next.push(pulse);
      }
    }

    this.pulses = next;
  }

  updateFields(delta) {
    const next = [];
    for (const field of this.fields) {
      field.duration -= delta;
      field.tickClock -= delta;

      if (field.tickClock <= 0) {
        field.tickClock += field.tickInterval;
        let hitCount = 0;
        for (const enemy of this.enemies) {
          if (circleDistance(field, enemy) > field.radius + enemy.radius) {
            continue;
          }
          hitCount += 1;
          this.damageEnemy(enemy, field.damage, field.sourceSkillId);
          if (field.slowLevel > 0) {
            enemy.slowTimer = Math.max(enemy.slowTimer, 0.45 + field.slowLevel * 0.35);
          }
          if (field.burnLevel > 0) {
            enemy.burnTimer = Math.max(enemy.burnTimer, 1.2 + field.burnLevel * 0.55);
            enemy.burnDamage = Math.max(enemy.burnDamage, field.damage * 0.14 * field.burnLevel);
          }
        }

        if (hitCount > 0 && field.healLevel > 0) {
          this.player.health = Math.min(this.player.maxHealth, this.player.health + hitCount * 0.3 * field.healLevel);
        }
      }

      if (field.duration > 0) {
        next.push(field);
      }
    }

    this.fields = next;
  }

  updateStrikes(delta) {
    const next = [];
    for (const strike of this.strikes) {
      strike.delay -= delta;
      if (strike.delay > 0) {
        next.push(strike);
        continue;
      }

      const hitIds = new Set();
      for (const enemy of this.enemies) {
        if (circleDistance(strike, enemy) > strike.radius + enemy.radius) {
          continue;
        }
        hitIds.add(enemy.id);
        this.damageEnemy(enemy, strike.damage, "stormBloom");
      }

      if (strike.chainLevel > 0) {
        const chainTargets = this.findNearestEnemies(strike.x, strike.y, strike.chainLevel + 1)
          .filter((enemy) => !hitIds.has(enemy.id))
          .slice(0, strike.chainLevel + 1);
        for (const enemy of chainTargets) {
          this.damageEnemy(enemy, strike.damage * (0.58 + strike.chainLevel * 0.08), "stormBloom");
          enemy.slowTimer = Math.max(enemy.slowTimer, 0.35 + strike.chainLevel * 0.2);
        }
      }

      if (strike.fieldLevel > 0) {
        this.spawnField({
          sourceSkillId: "stormBloom",
          x: strike.x,
          y: strike.y,
          radius: strike.radius * (0.74 + strike.fieldLevel * 0.08),
          duration: 1.6 + strike.fieldLevel * 0.6,
          tickInterval: 0.35,
          damage: strike.damage * 0.22,
          slowLevel: 1 + strike.fieldLevel,
          healLevel: 0,
          burnLevel: 0,
          color: "rgba(232, 218, 125, 0.18)",
          edgeColor: "rgba(255, 250, 200, 0.88)",
        });
      }
    }

    this.strikes = next;
  }

  updateMines(delta) {
    const next = [];
    for (const mine of this.mines) {
      mine.armTime -= delta;
      mine.duration -= delta;

      let triggered = mine.duration <= 0;
      if (!triggered && mine.armTime <= 0) {
        for (const enemy of this.enemies) {
          if (circleDistance(mine, enemy) <= mine.radius + enemy.radius + 14) {
            triggered = true;
            break;
          }
        }
      }

      if (triggered) {
        this.explodeMine(mine);
        continue;
      }

      next.push(mine);
    }

    this.mines = next;
  }

  updateSkillEffects(delta) {
    const next = [];
    for (const effect of this.skillEffects) {
      effect.duration -= delta;
      if (effect.duration > 0) {
        next.push(effect);
      }
    }
    this.skillEffects = next;
  }

  updateMeteors(delta) {
    const next = [];
    for (const meteor of this.meteors) {
      meteor.progress += delta / meteor.fallTime;
      meteor.spin += delta * 7.5;
      if (meteor.progress < 1) {
        next.push(meteor);
        continue;
      }

      for (const enemy of this.enemies) {
        if (circleDistance({ x: meteor.targetX, y: meteor.targetY }, enemy) <= meteor.radius + enemy.radius) {
          this.damageEnemy(enemy, meteor.damage, "meteorSeed");
        }
      }

      this.spawnSkillEffect({
        kind: "meteorBurst",
        x: meteor.targetX,
        y: meteor.targetY,
        radius: meteor.radius,
        duration: 0.3,
        color: meteor.color,
        accent: "#fff1df",
      });

      if (meteor.scorchLevel > 0) {
        this.spawnField({
          sourceSkillId: "meteorSeed",
          x: meteor.targetX,
          y: meteor.targetY,
          radius: meteor.radius * (0.56 + meteor.scorchLevel * 0.08),
          duration: 1.9 + meteor.scorchLevel * 0.7,
          tickInterval: 0.28,
          damage: meteor.damage * 0.16 * meteor.scorchLevel,
          slowLevel: 0,
          healLevel: 0,
          burnLevel: 1 + meteor.scorchLevel,
          color: "rgba(255, 146, 98, 0.2)",
          edgeColor: "rgba(255, 222, 180, 0.86)",
        });
      }

      if (meteor.shardLevel > 0) {
        this.spawnMeteorShards(meteor);
      }
    }

    this.meteors = next;
  }

  updateBeacons(delta) {
    const next = [];
    for (const beacon of this.beacons) {
      beacon.duration -= delta;
      beacon.shotClock -= delta;
      beacon.pulse += delta * 2.1;

      if (beacon.shotClock <= 0) {
        beacon.shotClock += beacon.shotInterval;
        const targets = this.findNearestEnemies(beacon.x, beacon.y, 1 + beacon.chainLevel)
          .filter((enemy) => circleDistance(beacon, enemy) <= beacon.range + enemy.radius)
          .slice(0, 1 + beacon.chainLevel);

        if (targets.length > 0) {
          let previous = { x: beacon.x, y: beacon.y };
          for (let index = 0; index < targets.length; index += 1) {
            const enemy = targets[index];
            const damageScale = index === 0 ? 1 : 0.55 + beacon.chainLevel * 0.08;
            this.damageEnemy(enemy, beacon.damage * damageScale, "lotusBeacon");
            if (beacon.wardLevel > 0) {
              enemy.slowTimer = Math.max(enemy.slowTimer, 0.32 + beacon.wardLevel * 0.24);
              this.player.health = Math.min(this.player.maxHealth, this.player.health + 0.28 * beacon.wardLevel);
            }
            this.spawnSkillEffect({
              kind: "lotusBeam",
              x: previous.x,
              y: previous.y,
              targetX: enemy.x,
              targetY: enemy.y,
              duration: 0.16,
              color: beacon.color,
              accent: "#fff2c9",
              thickness: Math.max(2, 4 - index),
            });
            previous = { x: enemy.x, y: enemy.y };
          }
        }
      }

      if (beacon.duration > 0) {
        next.push(beacon);
      }
    }

    this.beacons = next;
  }

  explodeMine(mine) {
    for (const enemy of this.enemies) {
      if (circleDistance(mine, enemy) <= mine.explosionRadius + enemy.radius) {
        this.damageEnemy(enemy, mine.damage, "mushroomMine");
      }
    }

    if (mine.burstLevel > 0) {
      const count = 4 + mine.burstLevel * 2;
      const speed = 210 + mine.burstLevel * 30;
      for (let index = 0; index < count; index += 1) {
        const angle = (Math.PI * 2 * index) / count;
        this.projectiles.push({
          id: crypto.randomUUID(),
          skillId: "sporeShard",
          sourceSkillId: "mushroomMine",
          x: mine.x,
          y: mine.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          speed,
          radius: 5,
          damage: mine.damage * 0.34,
          pierce: 0,
          maxDistance: 110 + mine.burstLevel * 20,
          distanceTravelled: 0,
          color: "#f3d7aa",
          slowLevel: 0,
          burstLevel: 0,
          hasBurst: true,
        });
      }
    }

    if (mine.toxicLevel > 0) {
      this.spawnField({
        sourceSkillId: "mushroomMine",
        x: mine.x,
        y: mine.y,
        radius: mine.explosionRadius * 0.72,
        duration: 2.8 + mine.toxicLevel * 0.8,
        tickInterval: 0.38,
        damage: mine.damage * 0.16 * mine.toxicLevel,
        slowLevel: 1,
        healLevel: 0,
        burnLevel: mine.toxicLevel,
        color: "rgba(188, 214, 112, 0.2)",
        edgeColor: "rgba(240, 255, 200, 0.78)",
      });
    }
  }

  updateOrbitals(delta) {
    const state = this.skillStates.petalOrbit;
    if (!state) {
      return;
    }

    const definition = getSkillDefinition("petalOrbit");
    const stats = definition.statsByLevel[state.level - 1];
    const count = stats.count + (state.exclusives.petalCount || 0) + this.getSummonCountBonus("petalOrbit");
    const sizeScale = 1 + (state.exclusives.petalBloom || 0) * 0.2;
    const radius = stats.orbitRadius * this.player.rangeMultiplier * sizeScale;
    const hitSize = stats.size * this.player.projectileSizeMultiplier * sizeScale;
    const healLevel = state.exclusives.petalSustain || 0;

    this.orbitAngle += delta * stats.angularSpeed;
    for (let index = 0; index < count; index += 1) {
      const angle = this.orbitAngle + (Math.PI * 2 * index) / count;
      const orb = {
        x: this.player.x + Math.cos(angle) * radius,
        y: this.player.y + Math.sin(angle) * radius,
        radius: hitSize,
      };

      for (const enemy of this.enemies) {
        enemy.hitCooldowns.petalOrbit = Math.max(0, (enemy.hitCooldowns.petalOrbit || 0) - delta);
        if (enemy.hitCooldowns.petalOrbit > 0) {
          continue;
        }
        if (circleDistance(orb, enemy) <= orb.radius + enemy.radius) {
          enemy.hitCooldowns.petalOrbit = 0.28;
          this.damageEnemy(enemy, this.rollDamage(stats.damage), "petalOrbit");
          if (healLevel > 0) {
            this.player.health = Math.min(this.player.maxHealth, this.player.health + 0.55 * healLevel);
          }
        }
      }
    }
  }

  updateEnemies(delta) {
    const remaining = [];
    for (const enemy of this.enemies) {
      if (enemy.health <= 0) {
        this.handleEnemyDefeat(enemy);
        continue;
      }

      if (enemy.burnTimer > 0) {
        enemy.burnTimer -= delta;
        enemy.health -= enemy.burnDamage * delta;
      }

      const direction = this.getDirectionVector(this.player.x - enemy.x, this.player.y - enemy.y);
      const slowFactor = enemy.slowTimer > 0 ? 0.68 : 1;
      enemy.slowTimer = Math.max(0, enemy.slowTimer - delta);
      enemy.contactCooldown = Math.max(0, enemy.contactCooldown - delta);
      if (enemy.boss) {
        this.updateBossAttack(enemy, delta);
      }
      enemy.x += direction.x * enemy.speed * slowFactor * delta;
      enemy.y += direction.y * enemy.speed * slowFactor * delta;

      if (circleDistance(enemy, this.player) <= enemy.radius + this.player.radius && enemy.contactCooldown <= 0) {
        enemy.contactCooldown = 0.85;
        this.damagePlayer(enemy.damage);
      }

      remaining.push(enemy);
    }

    this.enemies = remaining;
  }

  updateBossAttack(enemy, delta) {
    enemy.attackClock -= delta;
    if (enemy.attackClock > 0) {
      return;
    }

    const profile = this.session.difficultyProfile;
    enemy.attackPhase += 1;
    enemy.attackClock = Math.max(
      0.42,
      ((enemy.attackPattern === "cataclysm" ? 1.55 : 2.3) - enemy.bossTier * 0.08) / profile.bossAttackRateMultiplier,
    );

    if (enemy.attackPattern === "petalFan") this.fireBossPetalFan(enemy, profile);
    if (enemy.attackPattern === "spiralBloom") this.fireBossSpiralBloom(enemy, profile);
    if (enemy.attackPattern === "crossBurst") this.fireBossCrossBurst(enemy, profile);
    if (enemy.attackPattern === "mothSwarm") this.fireBossMothSwarm(enemy, profile);
    if (enemy.attackPattern === "prismLance") this.fireBossPrismLance(enemy, profile);
    if (enemy.attackPattern === "sporeBurst") this.fireBossSporeBurst(enemy, profile);
    if (enemy.attackPattern === "tempestWheel") this.fireBossTempestWheel(enemy, profile);
    if (enemy.attackPattern === "eclipseRain") this.fireBossEclipseRain(enemy, profile);
    if (enemy.attackPattern === "lanternWall") this.fireBossLanternWall(enemy, profile);
    if (enemy.attackPattern === "cataclysm") this.fireBossCataclysm(enemy, profile);
  }

  spawnEnemyProjectile(config) {
    const angle = config.angle ?? 0;
    const speed = config.speed ?? 180;
    this.enemyProjectiles.push({
      x: config.x,
      y: config.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      speed,
      radius: config.radius ?? 9,
      damage: config.damage ?? 12,
      life: config.life ?? 6,
      color: config.color ?? "#ffffff",
      accentColor: config.accentColor ?? "rgba(255,255,255,0.7)",
      kind: config.kind ?? "orb",
      homingStrength: config.homingStrength ?? 0,
      angularVelocity: config.angularVelocity ?? 0,
      splitCount: config.splitCount ?? 0,
      splitDamageScale: config.splitDamageScale ?? 0.4,
      splitSpeed: config.splitSpeed ?? speed * 0.75,
      splitRadius: config.splitRadius ?? Math.max(4, (config.radius ?? 9) * 0.55),
      splitKind: config.splitKind ?? "seed",
      spawnedChildren: false,
    });
  }

  spawnEnemySplitBurst(projectile) {
    for (let index = 0; index < projectile.splitCount; index += 1) {
      const angle = (Math.PI * 2 * index) / projectile.splitCount;
      this.spawnEnemyProjectile({
        x: projectile.x,
        y: projectile.y,
        angle,
        speed: projectile.splitSpeed,
        radius: projectile.splitRadius,
        damage: projectile.damage * projectile.splitDamageScale,
        life: 2.2,
        color: projectile.accentColor,
        accentColor: projectile.color,
        kind: projectile.splitKind,
      });
    }
  }

  spawnRegionalKinBurst(enemy) {
    if (!enemy.regionExclusive || !enemy.familyId) {
      return;
    }

    const baseDamage = Math.max(6, enemy.damage * 0.42);
    const playerAngle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);

    if (enemy.familyId === "bud") {
      for (let index = 0; index < 5; index += 1) {
        this.spawnEnemyProjectile({
          x: enemy.x,
          y: enemy.y,
          angle: (Math.PI * 2 * index) / 5,
          speed: 140,
          radius: 6,
          damage: baseDamage * 0.55,
          life: 2.2,
          color: enemy.color,
          accentColor: enemy.detailColor,
          kind: "petal",
        });
      }
      return;
    }

    if (enemy.familyId === "serpent") {
      for (const offset of [-0.24, 0, 0.24]) {
        this.spawnEnemyProjectile({
          x: enemy.x,
          y: enemy.y,
          angle: playerAngle + offset,
          speed: 176,
          radius: 6,
          damage: baseDamage * 0.62,
          life: 2.5,
          color: enemy.color,
          accentColor: enemy.detailColor,
          kind: "seed",
        });
      }
      return;
    }

    if (enemy.familyId === "shell") {
      for (let index = 0; index < 4; index += 1) {
        this.spawnEnemyProjectile({
          x: enemy.x,
          y: enemy.y,
          angle: (Math.PI / 2) * index,
          speed: 210,
          radius: 7,
          damage: baseDamage * 0.72,
          life: 2.4,
          color: enemy.color,
          accentColor: enemy.detailColor,
          kind: "shard",
        });
      }
      return;
    }

    if (enemy.familyId === "moth") {
      for (const offset of [-0.32, 0, 0.32]) {
        this.spawnEnemyProjectile({
          x: enemy.x,
          y: enemy.y,
          angle: playerAngle + offset,
          speed: 156,
          radius: 6,
          damage: baseDamage * 0.54,
          life: 2.9,
          color: enemy.color,
          accentColor: enemy.detailColor,
          kind: "moth",
          homingStrength: 0.04,
        });
      }
      return;
    }

    if (enemy.familyId === "prism") {
      for (const offset of [-0.14, 0.14]) {
        this.spawnEnemyProjectile({
          x: enemy.x,
          y: enemy.y,
          angle: playerAngle + offset,
          speed: 246,
          radius: 7,
          damage: baseDamage * 0.82,
          life: 2.1,
          color: enemy.color,
          accentColor: enemy.detailColor,
          kind: "shard",
        });
      }
      return;
    }

    if (enemy.familyId === "spore") {
      for (let index = 0; index < 4; index += 1) {
        this.spawnEnemyProjectile({
          x: enemy.x,
          y: enemy.y,
          angle: (Math.PI * 2 * index) / 4 + Math.PI / 4,
          speed: 122,
          radius: 7,
          damage: baseDamage * 0.6,
          life: 2.4,
          color: enemy.color,
          accentColor: enemy.detailColor,
          kind: "seed",
          splitCount: 3,
          splitDamageScale: 0.42,
          splitSpeed: 158,
          splitRadius: 4.5,
          splitKind: "seed",
        });
      }
      return;
    }

    if (enemy.familyId === "tempest") {
      for (let index = 0; index < 6; index += 1) {
        this.spawnEnemyProjectile({
          x: enemy.x,
          y: enemy.y,
          angle: (Math.PI * 2 * index) / 6,
          speed: 172,
          radius: 6,
          damage: baseDamage * 0.58,
          life: 2.8,
          color: enemy.color,
          accentColor: enemy.detailColor,
          kind: "seed",
          angularVelocity: index % 2 === 0 ? 1.5 : -1.5,
        });
      }
      return;
    }

    if (enemy.familyId === "eclipse") {
      for (const offset of [-0.38, -0.12, 0.12, 0.38]) {
        this.spawnEnemyProjectile({
          x: enemy.x,
          y: enemy.y,
          angle: playerAngle + offset,
          speed: 228,
          radius: 6,
          damage: baseDamage * 0.65,
          life: 2.25,
          color: enemy.color,
          accentColor: enemy.detailColor,
          kind: "shard",
        });
      }
      return;
    }

    if (enemy.familyId === "lantern") {
      for (const angle of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
        this.spawnEnemyProjectile({
          x: enemy.x,
          y: enemy.y,
          angle,
          speed: 186,
          radius: 7,
          damage: baseDamage * 0.62,
          life: 2.9,
          color: enemy.color,
          accentColor: enemy.detailColor,
          kind: "lantern",
        });
      }
      return;
    }

    if (enemy.familyId === "twilight") {
      for (let index = 0; index < 6; index += 1) {
        this.spawnEnemyProjectile({
          x: enemy.x,
          y: enemy.y,
          angle: (Math.PI * 2 * index) / 6,
          speed: 206,
          radius: 7,
          damage: baseDamage * 0.74,
          life: 2.6,
          color: enemy.color,
          accentColor: enemy.detailColor,
          kind: index % 2 === 0 ? "petal" : "shard",
          splitCount: index % 2 === 0 ? 0 : 2,
          splitDamageScale: 0.36,
          splitSpeed: 148,
          splitRadius: 4.5,
          splitKind: "seed",
        });
      }
    }
  }

  fireBossPetalFan(enemy, profile) {
    const direction = this.getDirectionVector(this.player.x - enemy.x, this.player.y - enemy.y);
    const baseAngle = Math.atan2(direction.y, direction.x);
    const count = 6 + Math.floor(profile.level / 2);
    const spread = Math.PI / 2.7;
    const speed = 225 * profile.bossBulletSpeedMultiplier;
    for (let index = 0; index < count; index += 1) {
      const angle = baseAngle - spread / 2 + (spread * index) / Math.max(1, count - 1);
      this.spawnEnemyProjectile({
        x: enemy.x,
        y: enemy.y,
        angle,
        speed,
        radius: 12,
        damage: 14 + profile.level * 2,
        life: 6.5,
        color: enemy.color,
        accentColor: enemy.detailColor,
        kind: "petal",
      });
    }
  }

  fireBossSpiralBloom(enemy, profile) {
    const arms = 3;
    const baseAngle = enemy.attackPhase * 0.52;
    for (let arm = 0; arm < arms; arm += 1) {
      const angle = baseAngle + (Math.PI * 2 * arm) / arms;
      this.spawnEnemyProjectile({
        x: enemy.x,
        y: enemy.y,
        angle,
        speed: 170 * profile.bossBulletSpeedMultiplier,
        radius: 10,
        damage: 12 + profile.level * 1.8,
        life: 6.8,
        color: enemy.color,
        accentColor: enemy.detailColor,
        kind: "seed",
        angularVelocity: arm % 2 === 0 ? 1.2 : -1.2,
      });
      this.spawnEnemyProjectile({
        x: enemy.x,
        y: enemy.y,
        angle: angle + Math.PI / 6,
        speed: 150 * profile.bossBulletSpeedMultiplier,
        radius: 8,
        damage: 10 + profile.level * 1.4,
        life: 6.2,
        color: enemy.accent,
        accentColor: enemy.detailColor,
        kind: "seed",
        angularVelocity: arm % 2 === 0 ? -0.9 : 0.9,
      });
    }
  }

  fireBossCrossBurst(enemy, profile) {
    const diagonal = enemy.attackPhase % 2 === 0;
    const baseAngle = diagonal ? Math.PI / 4 : 0;
    for (let index = 0; index < 4; index += 1) {
      this.spawnEnemyProjectile({
        x: enemy.x,
        y: enemy.y,
        angle: baseAngle + (Math.PI / 2) * index,
        speed: 255 * profile.bossBulletSpeedMultiplier,
        radius: 11,
        damage: 14 + profile.level * 2.2,
        life: 5.8,
        color: enemy.color,
        accentColor: enemy.detailColor,
        kind: "shard",
      });
    }
  }

  fireBossMothSwarm(enemy, profile) {
    const count = 4 + Math.floor(profile.level / 2);
    const baseAngle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
    for (let index = 0; index < count; index += 1) {
      const wingOffset = (index - (count - 1) / 2) * 16;
      this.spawnEnemyProjectile({
        x: enemy.x + wingOffset,
        y: enemy.y - enemy.radius * 0.2,
        angle: baseAngle + randomBetween(-0.28, 0.28),
        speed: 155 * profile.bossBulletSpeedMultiplier,
        radius: 10,
        damage: 13 + profile.level * 1.8,
        life: 7.4,
        color: enemy.color,
        accentColor: enemy.detailColor,
        kind: "moth",
        homingStrength: 0.06 + enemy.bossTier * 0.004,
      });
    }
  }

  fireBossPrismLance(enemy, profile) {
    const baseAngle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
    const sources = [
      { x: enemy.x - enemy.radius * 0.7, y: enemy.y - enemy.radius * 0.3 },
      { x: enemy.x, y: enemy.y - enemy.radius * 0.55 },
      { x: enemy.x + enemy.radius * 0.7, y: enemy.y - enemy.radius * 0.3 },
    ];

    for (const source of sources) {
      for (const offset of [-0.12, 0, 0.12]) {
        this.spawnEnemyProjectile({
          x: source.x,
          y: source.y,
          angle: baseAngle + offset,
          speed: 285 * profile.bossBulletSpeedMultiplier,
          radius: 9,
          damage: 15 + profile.level * 2.3,
          life: 5.2,
          color: enemy.color,
          accentColor: enemy.detailColor,
          kind: "prism",
        });
      }
    }
  }

  fireBossSporeBurst(enemy, profile) {
    const count = 5 + Math.floor(profile.level / 3);
    const baseAngle = enemy.attackPhase * 0.37;
    for (let index = 0; index < count; index += 1) {
      this.spawnEnemyProjectile({
        x: enemy.x,
        y: enemy.y,
        angle: baseAngle + (Math.PI * 2 * index) / count,
        speed: 135 * profile.bossBulletSpeedMultiplier,
        radius: 14,
        damage: 15 + profile.level * 1.7,
        life: 2.7,
        color: enemy.color,
        accentColor: enemy.detailColor,
        kind: "spore",
        splitCount: 4 + Math.floor(profile.level / 2),
        splitSpeed: 190 * profile.bossBulletSpeedMultiplier,
        splitRadius: 6,
        splitKind: "sporeShard",
      });
    }
  }

  fireBossTempestWheel(enemy, profile) {
    const outerCount = 10 + profile.level;
    const innerCount = 6 + Math.floor(profile.level / 2);
    const baseAngle = enemy.attackPhase * 0.33;
    for (let index = 0; index < outerCount; index += 1) {
      this.spawnEnemyProjectile({
        x: enemy.x,
        y: enemy.y,
        angle: baseAngle + (Math.PI * 2 * index) / outerCount,
        speed: 220 * profile.bossBulletSpeedMultiplier,
        radius: 10,
        damage: 16 + profile.level * 1.8,
        life: 6.4,
        color: enemy.color,
        accentColor: enemy.detailColor,
        kind: "gust",
        angularVelocity: index % 2 === 0 ? 0.55 : -0.55,
      });
    }
    for (let index = 0; index < innerCount; index += 1) {
      this.spawnEnemyProjectile({
        x: enemy.x,
        y: enemy.y,
        angle: -baseAngle + (Math.PI * 2 * index) / innerCount,
        speed: 170 * profile.bossBulletSpeedMultiplier,
        radius: 8,
        damage: 12 + profile.level * 1.4,
        life: 5.5,
        color: enemy.accent,
        accentColor: enemy.detailColor,
        kind: "gust",
        angularVelocity: index % 2 === 0 ? -0.42 : 0.42,
      });
    }
  }

  fireBossEclipseRain(enemy, profile) {
    const count = 4 + Math.floor(profile.level / 2);
    for (let index = 0; index < count; index += 1) {
      const offset = (index - (count - 1) / 2) * 82;
      const x = clamp(this.player.x + offset + randomBetween(-18, 18), 24, ARENA.width - 24);
      const y = clamp(this.player.y - 420 - randomBetween(0, 140), 24, ARENA.height - 24);
      this.spawnEnemyProjectile({
        x,
        y,
        angle: Math.PI / 2,
        speed: 360 * profile.bossBulletSpeedMultiplier,
        radius: 12,
        damage: 18 + profile.level * 2,
        life: 2.4,
        color: enemy.color,
        accentColor: enemy.detailColor,
        kind: "eclipse",
      });
    }
  }

  fireBossLanternWall(enemy, profile) {
    const horizontal = enemy.attackPhase % 2 === 1;
    const layers = 5 + Math.floor(profile.level / 3);
    const spread = 88;
    if (horizontal) {
      const leftX = clamp(this.player.x - 540, 24, ARENA.width - 24);
      const rightX = clamp(this.player.x + 540, 24, ARENA.width - 24);
      for (let index = 0; index < layers; index += 1) {
        const y = clamp(this.player.y + (index - (layers - 1) / 2) * spread, 30, ARENA.height - 30);
        this.spawnEnemyProjectile({ x: leftX, y, angle: 0, speed: 250 * profile.bossBulletSpeedMultiplier, radius: 10, damage: 17 + profile.level * 1.9, life: 5.6, color: enemy.color, accentColor: enemy.detailColor, kind: "lantern" });
        this.spawnEnemyProjectile({ x: rightX, y, angle: Math.PI, speed: 250 * profile.bossBulletSpeedMultiplier, radius: 10, damage: 17 + profile.level * 1.9, life: 5.6, color: enemy.color, accentColor: enemy.detailColor, kind: "lantern" });
      }
    } else {
      const topY = clamp(this.player.y - 420, 24, ARENA.height - 24);
      const bottomY = clamp(this.player.y + 420, 24, ARENA.height - 24);
      for (let index = 0; index < layers; index += 1) {
        const x = clamp(this.player.x + (index - (layers - 1) / 2) * spread, 30, ARENA.width - 30);
        this.spawnEnemyProjectile({ x, y: topY, angle: Math.PI / 2, speed: 250 * profile.bossBulletSpeedMultiplier, radius: 10, damage: 17 + profile.level * 1.9, life: 5.6, color: enemy.color, accentColor: enemy.detailColor, kind: "lantern" });
        this.spawnEnemyProjectile({ x, y: bottomY, angle: -Math.PI / 2, speed: 250 * profile.bossBulletSpeedMultiplier, radius: 10, damage: 17 + profile.level * 1.9, life: 5.6, color: enemy.color, accentColor: enemy.detailColor, kind: "lantern" });
      }
    }
  }

  fireBossCataclysm(enemy, profile) {
    this.fireBossPetalFan(enemy, profile);
    this.fireBossSpiralBloom(enemy, profile);
    if (enemy.attackPhase % 2 === 0) {
      this.fireBossLanternWall(enemy, profile);
    }
    if (enemy.attackPhase % 3 === 0) {
      this.fireBossEclipseRain(enemy, profile);
    }
    if (enemy.attackPhase % 2 === 1) {
      this.fireBossMothSwarm(enemy, profile);
    }
  }

  updateEnemyProjectiles(delta) {
    const next = [];
    for (const projectile of this.enemyProjectiles) {
      if (projectile.angularVelocity) {
        const angle = projectile.angularVelocity * delta;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const nextVx = projectile.vx * cos - projectile.vy * sin;
        const nextVy = projectile.vx * sin + projectile.vy * cos;
        projectile.vx = nextVx;
        projectile.vy = nextVy;
      }

      if (projectile.homingStrength > 0) {
        const direction = this.getDirectionVector(this.player.x - projectile.x, this.player.y - projectile.y);
        projectile.vx += direction.x * projectile.speed * projectile.homingStrength * delta * 60;
        projectile.vy += direction.y * projectile.speed * projectile.homingStrength * delta * 60;
        const length = magnitude(projectile.vx, projectile.vy);
        projectile.vx = (projectile.vx / length) * projectile.speed;
        projectile.vy = (projectile.vy / length) * projectile.speed;
      }

      projectile.x += projectile.vx * delta;
      projectile.y += projectile.vy * delta;
      projectile.life -= delta;

      if (circleDistance(projectile, this.player) <= projectile.radius + this.player.radius) {
        this.damagePlayer(projectile.damage);
        continue;
      }

      if (
        projectile.life <= 0 ||
        projectile.x < -220 ||
        projectile.x > ARENA.width + 220 ||
        projectile.y < -220 ||
        projectile.y > ARENA.height + 220
      ) {
        if (projectile.splitCount > 0 && !projectile.spawnedChildren) {
          projectile.spawnedChildren = true;
          this.spawnEnemySplitBurst(projectile);
        }
        continue;
      }

      next.push(projectile);
    }

    this.enemyProjectiles = next;
  }

  handleEnemyDefeat(enemy) {
    this.session.kills += 1;
    this.pickups.push({
      x: enemy.x,
      y: enemy.y,
      value: enemy.exp,
      radius: 7,
      pullSpeed: 0,
      vacuuming: false,
      spin: Math.random() * Math.PI * 2,
    });

    this.spawnRegionalKinBurst(enemy);

    if (enemy.boss) {
      this.finishRun(true, false);
    }
  }

  updatePickups(delta) {
    const remaining = [];
    for (const pickup of this.pickups) {
      const distance = circleDistance(pickup, this.player);
      pickup.spin += delta * (pickup.vacuuming ? 9.6 : 3.8);
      if (distance < 22) {
        this.gainExp(pickup.value);
        continue;
      }

      if (pickup.vacuuming || distance < this.player.expPickupRange) {
        const direction = this.getDirectionVector(this.player.x - pickup.x, this.player.y - pickup.y);
        if (pickup.vacuuming) {
          const mapSpan = Math.max(1, Math.hypot(ARENA.width, ARENA.height));
          const attractionRatio = 1 - Math.min(1, distance / mapSpan);
          pickup.pullSpeed = Math.min(2650, Math.max(420, pickup.pullSpeed) + delta * (1900 + attractionRatio * 1800 + distance * 0.28));
        } else {
          const attractionRatio = 1 - distance / Math.max(1, this.player.expPickupRange);
          pickup.pullSpeed = Math.min(920, Math.max(140, pickup.pullSpeed) + delta * (520 + attractionRatio * 980));
        }
        pickup.x += direction.x * pickup.pullSpeed * delta;
        pickup.y += direction.y * pickup.pullSpeed * delta;
      } else {
        pickup.pullSpeed = 0;
      }

      remaining.push(pickup);
    }
    this.pickups = remaining;
  }

  pullAllExpPickups() {
    if (this.pickups.length === 0) {
      return;
    }

    const totalExp = this.pickups.reduce((sum, pickup) => sum + pickup.value, 0);
    for (const pickup of this.pickups) {
      pickup.vacuuming = true;
      pickup.pullSpeed = Math.max(pickup.pullSpeed, 420);
    }
    this.spawnVacuumSiphonEffects(this.pickups, totalExp);
    this.callbacks.onToast?.("时针虹吸");
  }

  spawnVacuumSiphonEffects(pickups, totalExp) {
    if (pickups.length === 0) {
      return;
    }

    const farthestDistance = pickups.reduce((maxDistance, pickup) => Math.max(maxDistance, circleDistance(pickup, this.player)), 0);

    this.spawnSkillEffect({
      kind: "vacuumField",
      x: this.player.x,
      y: this.player.y,
      radius: Math.max(farthestDistance + 80, Math.hypot(ARENA.width, ARENA.height) * 0.55),
      duration: 0.66,
      color: "rgba(255, 219, 92, 0.9)",
      accent: "rgba(255, 246, 191, 0.9)",
    });

    this.spawnSkillEffect({
      kind: "vacuumBurst",
      x: this.player.x,
      y: this.player.y,
      radius: Math.min(220, 72 + Math.sqrt(totalExp) * 7),
      duration: 0.54,
      color: "rgba(255, 219, 92, 0.92)",
      accent: "rgba(255, 248, 214, 0.9)",
    });
  }

  advanceLevel() {
    this.session.exp -= this.session.expRequired;
    this.session.level += 1;
    this.session.expRequired = Math.floor(18 + this.session.level * 10 + this.session.level * this.session.level * 1.15);
  }

  tryStartLevelUp() {
    if (!this.session || this.session.exp < this.session.expRequired) {
      return false;
    }

    this.advanceLevel();
    this.pendingChoices = this.buildUpgradeChoices();
    if (this.pendingChoices.length === 0) {
      if (!this.session.upgradesExhaustedNotified) {
        this.session.upgradesExhaustedNotified = true;
        this.callbacks.onToast?.("成长已达上限");
      }
      if (this.session.exp >= this.session.expRequired) {
        return this.tryStartLevelUp();
      }
      this.emitHud();
      return false;
    }

    this.state = "levelup";
    this.callbacks.onLevelChoices?.(this.pendingChoices);
    this.callbacks.onOverlayChange?.("levelScreen");
    this.callbacks.onSessionLabel?.("升级中", "从三项成长中选择其一");
    this.emitHud();
    return true;
  }

  gainExp(amount) {
    if (!this.session || amount <= 0) {
      return;
    }

    this.session.exp += amount * this.player.expMultiplier;
    if (this.tryStartLevelUp()) {
      return;
    }

    this.emitHud();
  }

  damageEnemy(enemy, damage, source) {
    enemy.health -= damage;
  }

  damagePlayer(rawDamage) {
    if (this.player.invulnerableFor > 0) {
      return;
    }
    if (Math.random() < this.player.dodgeChance) {
      this.callbacks.onToast?.("闪避");
      return;
    }

    let damage = Math.max(1, rawDamage - this.player.armor);
    if (this.player.barrier > 0) {
      const absorbed = Math.min(this.player.barrier, damage);
      this.player.barrier -= absorbed;
      damage -= absorbed;
    }

    this.player.health -= damage;
    this.player.invulnerableFor = 0.55;
    if (this.player.health <= 0) {
      this.player.health = 0;
      this.finishRun(false, false);
    }
  }

  finishRun(victory, abandoned) {
    if (!this.session || this.session.resultShown) {
      return;
    }

    this.state = "ended";
    this.session.resultShown = true;
    const timeScore = this.session.elapsed / 90;
    const killScore = this.session.kills * 0.018;
    const winBonus = victory ? 12 : abandoned ? 0 : 4;
    const levelBonus = this.session.level * 0.6;
    const coinsEarned = Math.floor((timeScore + killScore + winBonus + levelBonus) * this.session.coinRewardMultiplier);

    this.callbacks.onRunEnd?.({
      victory,
      abandoned,
      mode: this.session.mode,
      regionId: this.session.regionId,
      characterId: this.session.selectedCharacterId,
      survivalTime: this.session.elapsed,
      level: this.session.level,
      kills: this.session.kills,
      coinsEarned,
      discoveries: {
        monsters: [...this.session.discoveries.monsters],
        skills: [...this.session.discoveries.skills],
      },
    });
  }

  emitHud() {
    if (!this.session) {
      return;
    }

    const remainingTime = this.session.bossSpawned
      ? "Boss"
      : formatDuration(this.session.roundDurationSeconds - this.session.elapsed);

    const skills = Object.entries(this.skillStates).map(([skillId, state]) => {
      const definition = getSkillDefinition(skillId);
      const exclusives = Object.entries(state.exclusives)
        .filter(([, level]) => level > 0)
        .map(([exclusiveId, level]) => {
          const exclusive = definition.exclusiveUpgrades.find((item) => item.id === exclusiveId);
          return `${exclusive.name} Lv.${level}`;
        });

      return {
        id: skillId,
        name: definition.name,
        level: state.level,
        description: definition.description,
        exclusives,
      };
    });

    this.callbacks.onHudUpdate?.({
      status: this.state,
      time: remainingTime,
      level: this.session.level,
      exp: `${Math.floor(this.session.exp)} / ${this.session.expRequired}`,
      expRatio: this.session.expRequired > 0 ? this.session.exp / this.session.expRequired : 0,
      health: `${Math.ceil(this.player.health)} / ${this.player.maxHealth}`,
      attack: formatMultiplier(this.player.attackMultiplier),
      speed: `${Math.round(this.player.speed)}`,
      crit: `${Math.round(this.player.critChance * 100)}%`,
      dodge: `${Math.round(this.player.dodgeChance * 100)}%`,
      armor: `${this.player.armor}`,
      cooldown: `${Math.round(Math.max(0, 1 - this.player.cooldownScale) * 100)}%`,
      blink: `${this.player.blinkCharges} / ${this.player.blinkChargesMax}`,
      expPickupRange: `${Math.round(this.player.expPickupRange)}`,
      kills: `${this.session.kills}`,
      skills,
    });
  }

  rollDamage(baseDamage) {
    const crit = Math.random() < this.player.critChance;
    return baseDamage * this.player.attackMultiplier * (crit ? this.player.critDamage : 1);
  }

  findNearestEnemy(x, y) {
    let target = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const enemy of this.enemies) {
      const distance = Math.hypot(enemy.x - x, enemy.y - y);
      if (distance < bestDistance) {
        bestDistance = distance;
        target = enemy;
      }
    }
    return target;
  }

  findEnemyById(enemyId) {
    return this.enemies.find((enemy) => enemy.id === enemyId) || null;
  }

  findNearestEnemies(x, y, count = 1) {
    return [...this.enemies]
      .sort((left, right) => Math.hypot(left.x - x, left.y - y) - Math.hypot(right.x - x, right.y - y))
      .slice(0, count);
  }

  getDirectionVector(dx, dy) {
    const length = magnitude(dx, dy);
    return { x: dx / length, y: dy / length };
  }

  getDirectionToTarget(target, angleOffset = 0) {
    const base = this.getDirectionVector(target.x - this.player.x, target.y - this.player.y);
    const angle = Math.atan2(base.y, base.x) + angleOffset;
    return { x: Math.cos(angle), y: Math.sin(angle) };
  }

  renderIdleFrame() {
    this.render(true);
  }

  render(forceBackground = false) {
    this.renderer.render(this, forceBackground);
  }

  drawArena(ctx, camera) {
    ctx.fillStyle = "#a3d57d";
    ctx.fillRect(0, 0, ARENA.width, ARENA.height);

    ctx.fillStyle = "rgba(255,255,255,0.16)";
    for (let x = Math.floor(camera.x / 64) * 64; x <= camera.x + camera.width + 64; x += 64) {
      ctx.fillRect(x, 0, 2, ARENA.height);
    }
    for (let y = Math.floor(camera.y / 64) * 64; y <= camera.y + camera.height + 64; y += 64) {
      ctx.fillRect(0, y, ARENA.width, 2);
    }

    ctx.strokeStyle = "rgba(69, 101, 54, 0.3)";
    ctx.lineWidth = 8;
    ctx.strokeRect(0, 0, ARENA.width, ARENA.height);

    for (let x = Math.floor(camera.x / 192) * 192; x <= camera.x + camera.width + 192; x += 192) {
      for (let y = Math.floor(camera.y / 160) * 160; y <= camera.y + camera.height + 160; y += 160) {
        if (((Math.floor(x / 192) + Math.floor(y / 160)) % 3) !== 0) {
          continue;
        }
        ctx.fillStyle = "rgba(95, 164, 106, 0.26)";
        ctx.beginPath();
        ctx.arc(x + 18, y + 22, 14, 0, Math.PI * 2);
        ctx.arc(x + 32, y + 14, 10, 0, Math.PI * 2);
        ctx.arc(x + 44, y + 26, 12, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  drawPlayer(ctx) {
    ctx.save();
    ctx.translate(this.player.x, this.player.y);
    ctx.fillStyle = this.player.invulnerableFor > 0 ? "#ffffff" : "#fef7dc";
    ctx.beginPath();
    ctx.arc(0, 0, this.player.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f0b76b";
    ctx.beginPath();
    ctx.arc(-6, -8, 6, 0, Math.PI * 2);
    ctx.arc(6, -8, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#31452d";
    ctx.beginPath();
    ctx.arc(-5, -2, 2.2, 0, Math.PI * 2);
    ctx.arc(5, -2, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#31452d";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 5, 6, 0.1 * Math.PI, 0.9 * Math.PI, false);
    ctx.stroke();
    ctx.restore();
  }

  drawEnemies(ctx) {
    for (const enemy of this.enemies) {
      if (enemy.boss) {
        this.drawBoss(ctx, enemy);
      } else {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = enemy.accent;
        ctx.beginPath();
        ctx.arc(0, -enemy.radius * 0.3, enemy.radius * 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#20311d";
        ctx.beginPath();
        ctx.arc(-enemy.radius * 0.22, -enemy.radius * 0.05, Math.max(2, enemy.radius * 0.1), 0, Math.PI * 2);
        ctx.arc(enemy.radius * 0.22, -enemy.radius * 0.05, Math.max(2, enemy.radius * 0.1), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      const width = enemy.radius * 2.2;
      const ratio = clamp(enemy.health / enemy.maxHealth, 0, 1);
      ctx.fillStyle = "rgba(37, 45, 31, 0.22)";
      ctx.fillRect(enemy.x - width / 2, enemy.y - enemy.radius - 10, width, 4);
      ctx.fillStyle = enemy.boss ? "#e85f6a" : "#ffffff";
      ctx.fillRect(enemy.x - width / 2, enemy.y - enemy.radius - 10, width * ratio, 4);
    }
  }

  drawBoss(ctx, enemy) {
    const radius = enemy.radius;
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.shadowColor = enemy.color;
    ctx.shadowBlur = 18;

    if (enemy.shapeId === "budSentinel") {
      for (let index = 0; index < 6; index += 1) {
        ctx.save();
        ctx.rotate((Math.PI * 2 * index) / 6);
        ctx.fillStyle = enemy.detailColor;
        tracePetal(ctx, radius * 1.6, radius * 0.5);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = enemy.color;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.68, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = enemy.accent;
      ctx.beginPath();
      ctx.ellipse(0, radius * 0.36, radius * 0.34, radius * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (enemy.shapeId === "clockvineSerpent") {
      for (let index = 0; index < 3; index += 1) {
        const offset = index - 1;
        ctx.fillStyle = index === 0 ? enemy.detailColor : enemy.color;
        ctx.beginPath();
        ctx.arc(offset * radius * 0.28, offset * radius * 0.38, radius * (0.46 - index * 0.06), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = enemy.accent;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-radius * 0.52, radius * 0.42);
      ctx.bezierCurveTo(-radius * 0.18, 0, radius * 0.12, -radius * 0.32, radius * 0.46, -radius * 0.56);
      ctx.stroke();
    }

    if (enemy.shapeId === "amberShellCrab") {
      ctx.fillStyle = enemy.color;
      ctx.beginPath();
      for (let index = 0; index < 6; index += 1) {
        const angle = -Math.PI / 2 + (Math.PI * 2 * index) / 6;
        const x = Math.cos(angle) * radius * 0.86;
        const y = Math.sin(angle) * radius * 0.72;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = enemy.accent;
      ctx.fillRect(-radius * 0.66, -radius * 0.1, radius * 1.32, radius * 0.22);
      ctx.beginPath();
      ctx.moveTo(-radius * 0.95, -radius * 0.05);
      ctx.lineTo(-radius * 1.35, -radius * 0.32);
      ctx.lineTo(-radius * 1.08, radius * 0.16);
      ctx.closePath();
      ctx.moveTo(radius * 0.95, -radius * 0.05);
      ctx.lineTo(radius * 1.35, -radius * 0.32);
      ctx.lineTo(radius * 1.08, radius * 0.16);
      ctx.closePath();
      ctx.fill();
    }

    if (enemy.shapeId === "moonpetalMoth") {
      ctx.fillStyle = enemy.detailColor;
      ctx.beginPath();
      ctx.ellipse(-radius * 0.52, 0, radius * 0.56, radius * 0.82, -0.55, 0, Math.PI * 2);
      ctx.ellipse(radius * 0.52, 0, radius * 0.56, radius * 0.82, 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = enemy.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 0.24, radius * 0.78, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = enemy.accent;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-radius * 0.1, -radius * 0.62);
      ctx.quadraticCurveTo(-radius * 0.28, -radius * 0.95, -radius * 0.44, -radius * 0.72);
      ctx.moveTo(radius * 0.1, -radius * 0.62);
      ctx.quadraticCurveTo(radius * 0.28, -radius * 0.95, radius * 0.44, -radius * 0.72);
      ctx.stroke();
    }

    if (enemy.shapeId === "prismStag") {
      ctx.fillStyle = enemy.color;
      traceDiamond(ctx, radius * 1.1, radius * 1.45);
      ctx.fill();
      ctx.fillStyle = enemy.detailColor;
      traceDiamond(ctx, radius * 0.52, radius * 0.86);
      ctx.fill();
      ctx.strokeStyle = enemy.accent;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-radius * 0.22, -radius * 0.62);
      ctx.lineTo(-radius * 0.62, -radius * 1.02);
      ctx.lineTo(-radius * 0.86, -radius * 0.82);
      ctx.moveTo(radius * 0.22, -radius * 0.62);
      ctx.lineTo(radius * 0.62, -radius * 1.02);
      ctx.lineTo(radius * 0.86, -radius * 0.82);
      ctx.stroke();
    }

    if (enemy.shapeId === "myceliumLord") {
      ctx.fillStyle = enemy.color;
      ctx.beginPath();
      ctx.ellipse(0, -radius * 0.12, radius * 0.98, radius * 0.64, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = enemy.detailColor;
      ctx.fillRect(-radius * 0.28, -radius * 0.08, radius * 0.56, radius * 0.92);
      ctx.fillStyle = enemy.accent;
      for (const x of [-0.46, -0.18, 0.12, 0.38]) {
        ctx.beginPath();
        ctx.arc(radius * x, -radius * 0.3, radius * 0.12, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (enemy.shapeId === "tempestTulip") {
      for (const offset of [-0.4, 0, 0.4]) {
        ctx.save();
        ctx.translate(offset * radius * 0.42, -radius * 0.08);
        ctx.rotate(offset * 0.24);
        ctx.fillStyle = offset === 0 ? enemy.color : enemy.detailColor;
        tracePetal(ctx, radius * 1.7, radius * 0.48);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = enemy.accent;
      ctx.beginPath();
      ctx.ellipse(0, radius * 0.52, radius * 0.32, radius * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (enemy.shapeId === "eclipsePeony") {
      for (let index = 0; index < 10; index += 1) {
        ctx.save();
        ctx.rotate((Math.PI * 2 * index) / 10);
        ctx.fillStyle = index % 2 === 0 ? enemy.color : enemy.detailColor;
        tracePetal(ctx, radius * 1.55, radius * 0.42);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = enemy.accent;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.48, 0, Math.PI * 2);
      ctx.fill();
    }

    if (enemy.shapeId === "voidLantern") {
      ctx.fillStyle = enemy.accent;
      ctx.fillRect(-radius * 0.14, -radius * 0.08, radius * 0.28, radius * 0.9);
      for (const offset of [-0.52, 0, 0.52]) {
        ctx.save();
        ctx.translate(offset * radius, -radius * 0.22 + Math.abs(offset) * radius * 0.12);
        ctx.fillStyle = offset === 0 ? enemy.color : enemy.detailColor;
        traceDiamond(ctx, radius * 0.62, radius * 0.82);
        ctx.fill();
        ctx.restore();
      }
    }

    if (enemy.shapeId === "twilightMower") {
      for (let index = 0; index < 3; index += 1) {
        ctx.save();
        ctx.rotate((Math.PI * 2 * index) / 3 + enemy.attackPhase * 0.18);
        ctx.translate(radius * 0.28, 0);
        ctx.fillStyle = index === 0 ? enemy.detailColor : enemy.color;
        traceCrescent(ctx, radius * 0.74, radius * 0.44, radius * 0.22);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = enemy.accent;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = enemy.detailColor;
      traceStar(ctx, radius * 0.28, radius * 0.14, 6);
      ctx.fill();
    }

    ctx.fillStyle = "#20311d";
    ctx.beginPath();
    ctx.arc(-radius * 0.18, -radius * 0.06, Math.max(2, radius * 0.08), 0, Math.PI * 2);
    ctx.arc(radius * 0.18, -radius * 0.06, Math.max(2, radius * 0.08), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#20311d";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, radius * 0.12, radius * 0.18, 0.08 * Math.PI, 0.92 * Math.PI, false);
    ctx.stroke();
    ctx.restore();
  }

  drawProjectiles(ctx) {
    for (const projectile of this.projectiles) {
      if (projectile.skillId === "flyingSword" || projectile.skillId === "elfArrow") {
        this.drawFlyingSword(ctx, projectile);
        continue;
      }

      if (projectile.skillId === "bubbleBurst" || projectile.skillId === "bubbleShard") {
        this.drawBubbleProjectile(ctx, projectile);
        continue;
      }

      if (projectile.skillId === "thornVolley" || projectile.skillId === "thornShard") {
        this.drawThornProjectile(ctx, projectile);
        continue;
      }

      if (projectile.skillId === "sporeShard") {
        this.drawSporeProjectile(ctx, projectile);
        continue;
      }

      if (projectile.skillId === "meteorShard") {
        this.drawMeteorShard(ctx, projectile);
        continue;
      }

      if (projectile.skillId === "ribbonBlade" || projectile.skillId === "ribbonShard") {
        this.drawRibbonProjectile(ctx, projectile);
        continue;
      }

      ctx.fillStyle = projectile.color;
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawBubbleProjectile(ctx, projectile) {
    ctx.save();
    ctx.translate(projectile.x, projectile.y);
    ctx.fillStyle = `${projectile.color}cc`;
    ctx.beginPath();
    ctx.arc(0, 0, projectile.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, projectile.radius * 0.92, 0.2, Math.PI * 1.85);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.beginPath();
    ctx.arc(-projectile.radius * 0.28, -projectile.radius * 0.24, projectile.radius * 0.22, 0, Math.PI * 2);
    ctx.arc(projectile.radius * 0.14, -projectile.radius * 0.38, projectile.radius * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawThornProjectile(ctx, projectile) {
    const angle = Math.atan2(projectile.vy, projectile.vx) + Math.PI / 2;
    ctx.save();
    ctx.translate(projectile.x, projectile.y);
    ctx.rotate(angle);
    ctx.fillStyle = projectile.color;
    tracePetal(ctx, projectile.radius * 3.2, projectile.radius * 0.48);
    ctx.fill();
    ctx.fillStyle = "rgba(245,255,222,0.82)";
    ctx.beginPath();
    ctx.moveTo(0, -projectile.radius * 1.55);
    ctx.lineTo(projectile.radius * 0.18, projectile.radius * 0.85);
    ctx.lineTo(-projectile.radius * 0.18, projectile.radius * 0.85);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawSporeProjectile(ctx, projectile) {
    ctx.save();
    ctx.translate(projectile.x, projectile.y);
    ctx.fillStyle = projectile.color;
    traceStar(ctx, projectile.radius * 1.25, projectile.radius * 0.56, 6);
    ctx.fill();
    ctx.fillStyle = "rgba(255,245,222,0.86)";
    ctx.beginPath();
    ctx.arc(0, 0, projectile.radius * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawMeteorShard(ctx, projectile) {
    ctx.save();
    ctx.translate(projectile.x, projectile.y);
    ctx.rotate(Math.atan2(projectile.vy, projectile.vx) + Math.PI / 4);
    ctx.fillStyle = projectile.color;
    traceStar(ctx, projectile.radius * 1.55, projectile.radius * 0.72, 5);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 244, 223, 0.82)";
    ctx.lineWidth = 1.6;
    traceDiamond(ctx, projectile.radius * 0.92, projectile.radius * 2.1);
    ctx.stroke();
    ctx.restore();
  }

  drawRibbonProjectile(ctx, projectile) {
    const angle = Math.atan2(projectile.vy, projectile.vx) + Math.PI / 2;
    ctx.save();
    ctx.translate(projectile.x, projectile.y);
    ctx.rotate(angle);
    ctx.shadowColor = projectile.returning ? "rgba(255,255,255,0.75)" : "rgba(163, 180, 255, 0.68)";
    ctx.shadowBlur = projectile.returning ? 18 : 10;
    ctx.fillStyle = projectile.returning ? "#eef4ff" : projectile.color;
    traceCrescent(ctx, projectile.radius * 1.22, projectile.radius * 0.74, projectile.radius * 0.34);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.78)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-projectile.radius * 0.18, -projectile.radius * 1.18);
    ctx.quadraticCurveTo(projectile.radius * 0.82, projectile.radius * 0.1, projectile.radius * 0.14, projectile.radius * 1.08);
    ctx.stroke();
    ctx.restore();
  }

  drawFlyingSword(ctx, projectile) {
    if (projectile.skillId === "elfArrow") {
      const angle = Math.atan2(projectile.vy, projectile.vx) + Math.PI / 2;
      const shaftLength = projectile.radius * 3.4;
      const headLength = projectile.radius * 1.9;
      const wingWidth = projectile.radius * 1.1;

      ctx.save();
      ctx.translate(projectile.x, projectile.y);
      ctx.rotate(angle);
      ctx.shadowColor = projectile.glowColor || "rgba(143, 223, 255, 0.72)";
      ctx.shadowBlur = 18;

      ctx.strokeStyle = "rgba(223, 251, 255, 0.92)";
      ctx.lineWidth = Math.max(2, projectile.radius * 0.18);
      ctx.beginPath();
      ctx.moveTo(0, shaftLength * 0.72);
      ctx.lineTo(0, -shaftLength * 0.34);
      ctx.stroke();

      ctx.fillStyle = projectile.color;
      ctx.beginPath();
      ctx.moveTo(0, -shaftLength * 0.78);
      ctx.lineTo(wingWidth * 0.72, -shaftLength * 0.18);
      ctx.lineTo(0, headLength * 0.02);
      ctx.lineTo(-wingWidth * 0.72, -shaftLength * 0.18);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0, shaftLength * 0.28);
      ctx.lineTo(wingWidth, shaftLength * 0.62);
      ctx.lineTo(0, shaftLength * 0.5);
      ctx.lineTo(-wingWidth, shaftLength * 0.62);
      ctx.closePath();
      ctx.fillStyle = "rgba(196, 246, 255, 0.78)";
      ctx.fill();

      if (projectile.tracking) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.72)";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(0, 0, projectile.radius * 2.4, -0.95, 0.95);
        ctx.stroke();
      }

      ctx.restore();
      return;
    }

    const angle = Math.atan2(projectile.vy, projectile.vx) + Math.PI / 2;
    const bladeLength = projectile.radius * (projectile.giant ? 4.4 : 2.6);
    const bladeWidth = projectile.radius * (projectile.giant ? 1.15 : 0.72);
    const guardWidth = bladeWidth * 2.1;
    const handleLength = projectile.radius * (projectile.giant ? 1.45 : 0.95);

    ctx.save();
    ctx.translate(projectile.x, projectile.y);
    ctx.rotate(angle);

    if (projectile.glowColor) {
      ctx.shadowColor = projectile.glowColor;
      ctx.shadowBlur = projectile.giant ? 34 : 22;
    }

    ctx.fillStyle = projectile.giant ? "#ffe08c" : "#f8fdff";
    ctx.strokeStyle = projectile.color;
    ctx.lineWidth = Math.max(2, projectile.radius * 0.18);
    ctx.beginPath();
    ctx.moveTo(0, -bladeLength * 0.78);
    ctx.lineTo(bladeWidth, -bladeLength * 0.12);
    ctx.lineTo(bladeWidth * 0.56, bladeLength * 0.24);
    ctx.lineTo(0, bladeLength * 0.38);
    ctx.lineTo(-bladeWidth * 0.56, bladeLength * 0.24);
    ctx.lineTo(-bladeWidth, -bladeLength * 0.12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = projectile.color;
    ctx.fillRect(-guardWidth / 2, bladeLength * 0.26, guardWidth, Math.max(4, bladeWidth * 0.55));

    ctx.fillStyle = projectile.giant ? "#8d5c20" : "#6b84b0";
    ctx.fillRect(-bladeWidth * 0.25, bladeLength * 0.28, bladeWidth * 0.5, handleLength);

    ctx.beginPath();
    ctx.arc(0, bladeLength * 0.28 + handleLength, Math.max(3, bladeWidth * 0.42), 0, Math.PI * 2);
    ctx.fill();

    if (projectile.tracking) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, bladeLength * 0.9, -0.8, 0.8);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawEnemyProjectiles(ctx) {
    for (const projectile of this.enemyProjectiles) {
      ctx.save();
      ctx.translate(projectile.x, projectile.y);
      ctx.rotate(Math.atan2(projectile.vy, projectile.vx) + Math.PI / 2);
      ctx.fillStyle = projectile.color;
      ctx.strokeStyle = projectile.accentColor;
      ctx.lineWidth = 2;

      if (projectile.kind === "petal") {
        tracePetal(ctx, projectile.radius * 2.8, projectile.radius * 0.6);
        ctx.fill();
      } else if (projectile.kind === "seed") {
        ctx.beginPath();
        ctx.arc(0, 0, projectile.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (projectile.kind === "shard" || projectile.kind === "prism") {
        traceDiamond(ctx, projectile.radius * 1.3, projectile.radius * 2.4);
        ctx.fill();
        ctx.stroke();
      } else if (projectile.kind === "moth") {
        ctx.beginPath();
        ctx.ellipse(-projectile.radius * 0.45, 0, projectile.radius * 0.5, projectile.radius * 0.82, -0.45, 0, Math.PI * 2);
        ctx.ellipse(projectile.radius * 0.45, 0, projectile.radius * 0.5, projectile.radius * 0.82, 0.45, 0, Math.PI * 2);
        ctx.fill();
      } else if (projectile.kind === "spore" || projectile.kind === "sporeShard") {
        traceStar(ctx, projectile.radius * 1.15, projectile.radius * 0.54, 6);
        ctx.fill();
      } else if (projectile.kind === "gust") {
        ctx.beginPath();
        ctx.moveTo(-projectile.radius * 0.8, projectile.radius * 0.2);
        ctx.quadraticCurveTo(0, -projectile.radius * 1.15, projectile.radius * 0.82, projectile.radius * 0.1);
        ctx.quadraticCurveTo(projectile.radius * 0.22, projectile.radius * 0.72, -projectile.radius * 0.52, projectile.radius * 0.44);
        ctx.closePath();
        ctx.fill();
      } else if (projectile.kind === "eclipse") {
        traceCrescent(ctx, projectile.radius * 1.12, projectile.radius * 0.72, projectile.radius * 0.38);
        ctx.fill();
      } else if (projectile.kind === "lantern") {
        traceDiamond(ctx, projectile.radius * 1.7, projectile.radius * 1.9);
        ctx.fill();
        ctx.stroke();
        ctx.fillRect(-projectile.radius * 0.12, -projectile.radius * 1.18, projectile.radius * 0.24, projectile.radius * 0.38);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, projectile.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  drawPulses(ctx) {
    for (const pulse of this.pulses) {
      if (pulse.delay > 0) {
        continue;
      }
      ctx.save();
      ctx.translate(pulse.x, pulse.y);
      ctx.strokeStyle = pulse.color;
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.68;
      for (let index = 0; index < 12; index += 1) {
        const angle = (Math.PI * 2 * index) / 12;
        const inner = pulse.radius * 0.72;
        const outer = pulse.radius * 1.06;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
        ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
        ctx.stroke();
      }
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, pulse.radius * 0.86, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, pulse.radius * 0.58, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawSkillEffects(ctx) {
    for (const effect of this.skillEffects) {
      const progress = 1 - effect.duration / Math.max(0.001, effect.maxDuration || effect.duration || 1);

      if (effect.kind === "vineWhip") {
        const controlX = (effect.x + effect.targetX) / 2 + (effect.targetY - effect.y) * 0.12;
        const controlY = (effect.y + effect.targetY) / 2 - (effect.targetX - effect.x) * 0.12;
        ctx.save();
        ctx.globalAlpha = 0.95 - progress * 0.65;
        ctx.strokeStyle = effect.color;
        ctx.lineWidth = effect.thickness * (1 - progress * 0.3);
        ctx.beginPath();
        ctx.moveTo(effect.x, effect.y);
        ctx.quadraticCurveTo(controlX, controlY, effect.targetX, effect.targetY);
        ctx.stroke();
        ctx.strokeStyle = effect.accent;
        ctx.lineWidth = 2;
        for (const ratio of [0.26, 0.5, 0.74]) {
          const x = lerp(lerp(effect.x, controlX, ratio), lerp(controlX, effect.targetX, ratio), ratio);
          const y = lerp(lerp(effect.y, controlY, ratio), lerp(controlY, effect.targetY, ratio), ratio);
          ctx.beginPath();
          ctx.moveTo(x - 5, y + 4);
          ctx.lineTo(x, y - 4);
          ctx.lineTo(x + 5, y + 4);
          ctx.stroke();
        }
        ctx.restore();
        continue;
      }

      if (effect.kind === "vineBloom") {
        ctx.save();
        ctx.translate(effect.x, effect.y);
        ctx.rotate(progress * 0.6);
        ctx.globalAlpha = 0.88 - progress * 0.5;
        for (let index = 0; index < 6; index += 1) {
          ctx.save();
          ctx.rotate((Math.PI * 2 * index) / 6);
          ctx.fillStyle = index % 2 === 0 ? effect.color : effect.accent;
          tracePetal(ctx, effect.radius * 0.82, effect.radius * 0.22);
          ctx.fill();
          ctx.restore();
        }
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.beginPath();
        ctx.arc(0, 0, effect.radius * 0.16, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        continue;
      }

      if (effect.kind === "lotusBeam") {
        ctx.save();
        ctx.globalAlpha = 0.94 - progress * 0.72;
        ctx.strokeStyle = effect.color;
        ctx.shadowColor = effect.accent;
        ctx.shadowBlur = 12;
        ctx.lineWidth = effect.thickness;
        ctx.beginPath();
        ctx.moveTo(effect.x, effect.y);
        ctx.lineTo(effect.targetX, effect.targetY);
        ctx.stroke();
        ctx.strokeStyle = effect.accent;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(effect.x, effect.y);
        ctx.lineTo(effect.targetX, effect.targetY);
        ctx.stroke();
        ctx.fillStyle = effect.accent;
        ctx.beginPath();
        ctx.arc(effect.targetX, effect.targetY, 3.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        continue;
      }

      if (effect.kind === "meteorBurst") {
        ctx.save();
        ctx.translate(effect.x, effect.y);
        ctx.globalAlpha = 0.82 - progress * 0.5;
        ctx.strokeStyle = effect.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, effect.radius * (0.42 + progress * 0.4), 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = effect.accent;
        traceStar(ctx, effect.radius * (0.52 + progress * 0.16), effect.radius * 0.22, 6);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  drawFields(ctx) {
    for (const field of this.fields) {
      ctx.save();
      ctx.translate(field.x, field.y);

      if (field.sourceSkillId === "dewGarden") {
        ctx.fillStyle = field.color;
        for (let index = 0; index < 8; index += 1) {
          ctx.save();
          ctx.rotate((Math.PI * 2 * index) / 8);
          ctx.beginPath();
          ctx.ellipse(0, field.radius * 0.42, field.radius * 0.24, field.radius * 0.52, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        ctx.fillStyle = "rgba(232, 255, 246, 0.24)";
        ctx.beginPath();
        ctx.arc(0, 0, field.radius * 0.46, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = field.edgeColor;
        ctx.setLineDash([10, 8]);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, field.radius * 0.92, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (field.sourceSkillId === "stormBloom") {
        ctx.strokeStyle = field.edgeColor;
        ctx.lineWidth = 3;
        traceStar(ctx, field.radius * 0.78, field.radius * 0.36, 7);
        ctx.stroke();
        ctx.strokeStyle = field.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-field.radius * 0.22, -field.radius * 0.66);
        ctx.lineTo(field.radius * 0.08, -field.radius * 0.18);
        ctx.lineTo(-field.radius * 0.08, -field.radius * 0.18);
        ctx.lineTo(field.radius * 0.22, field.radius * 0.54);
        ctx.stroke();
      } else if (field.sourceSkillId === "mushroomMine") {
        ctx.fillStyle = field.color;
        for (const [x, y, scale] of [[-0.32, -0.16, 0.42], [0.08, -0.24, 0.52], [0.34, 0.06, 0.38], [-0.08, 0.22, 0.46]]) {
          ctx.beginPath();
          ctx.arc(field.radius * x, field.radius * y, field.radius * scale, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = field.edgeColor;
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 7]);
        ctx.beginPath();
        ctx.arc(0, 0, field.radius * 0.86, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (field.sourceSkillId === "meteorSeed") {
        ctx.fillStyle = field.color;
        traceStar(ctx, field.radius * 0.68, field.radius * 0.28, 6);
        ctx.fill();
        ctx.strokeStyle = field.edgeColor;
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 7]);
        ctx.beginPath();
        ctx.arc(0, 0, field.radius * 0.82, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle = "rgba(255, 190, 143, 0.72)";
        ctx.beginPath();
        ctx.moveTo(-field.radius * 0.38, -field.radius * 0.12);
        ctx.lineTo(field.radius * 0.18, field.radius * 0.1);
        ctx.lineTo(-field.radius * 0.08, field.radius * 0.34);
        ctx.lineTo(field.radius * 0.36, field.radius * 0.48);
        ctx.stroke();
      } else {
        ctx.fillStyle = field.color;
        ctx.beginPath();
        ctx.arc(0, 0, field.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  drawStrikes(ctx) {
    for (const strike of this.strikes) {
      ctx.save();
      ctx.translate(strike.x, strike.y);
      ctx.strokeStyle = strike.color;
      ctx.lineWidth = 3;
      traceDiamond(ctx, strike.radius * 0.95, strike.radius * 1.3);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-strike.radius * 0.18, -strike.radius * 1.18);
      ctx.lineTo(strike.radius * 0.08, -strike.radius * 0.36);
      ctx.lineTo(-strike.radius * 0.04, -strike.radius * 0.36);
      ctx.lineTo(strike.radius * 0.22, strike.radius * 0.82);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawMines(ctx) {
    for (const mine of this.mines) {
      ctx.save();
      ctx.translate(mine.x, mine.y);
      ctx.fillStyle = mine.armTime <= 0 ? "#e6c27e" : "#d9b27a";
      ctx.beginPath();
      ctx.arc(0, 0, mine.radius, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#8b5b39";
      ctx.fillRect(-3, -1, 6, 12);
      if (mine.armTime <= 0) {
        ctx.strokeStyle = "rgba(255, 242, 191, 0.86)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -mine.radius * 0.2, mine.radius * 0.45, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  drawMeteors(ctx) {
    for (const meteor of this.meteors) {
      const progress = clamp(meteor.progress, 0, 1);
      const x = lerp(meteor.startX, meteor.targetX, progress);
      const y = lerp(meteor.startY, meteor.targetY, progress);
      const angle = Math.atan2(meteor.targetY - meteor.startY, meteor.targetX - meteor.startX) + Math.PI / 2;

      ctx.save();
      ctx.translate(meteor.targetX, meteor.targetY);
      ctx.globalAlpha = 0.28 + progress * 0.26;
      ctx.strokeStyle = meteor.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, meteor.radius * 0.72, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-meteor.radius * 0.42, 0);
      ctx.lineTo(meteor.radius * 0.42, 0);
      ctx.moveTo(0, -meteor.radius * 0.42);
      ctx.lineTo(0, meteor.radius * 0.42);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + meteor.spin * 0.08);
      ctx.strokeStyle = "rgba(255, 233, 205, 0.72)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, meteor.radius * 0.3);
      ctx.lineTo(0, meteor.radius * 2.2);
      ctx.stroke();
      ctx.fillStyle = meteor.color;
      ctx.shadowColor = meteor.color;
      ctx.shadowBlur = 16;
      traceDiamond(ctx, meteor.radius * 0.48, meteor.radius * 0.9);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 246, 231, 0.86)";
      traceStar(ctx, meteor.radius * 0.24, meteor.radius * 0.1, 5);
      ctx.fill();
      ctx.restore();
    }
  }

  drawBeacons(ctx) {
    for (const beacon of this.beacons) {
      const flash = clamp(1 - beacon.shotClock / beacon.shotInterval, 0, 1);
      ctx.save();
      ctx.translate(beacon.x, beacon.y);
      ctx.shadowColor = beacon.color;
      ctx.shadowBlur = 14;
      for (let index = 0; index < 6; index += 1) {
        ctx.save();
        ctx.rotate((Math.PI * 2 * index) / 6 + beacon.pulse * 0.06);
        ctx.fillStyle = index % 2 === 0 ? "rgba(255, 236, 189, 0.72)" : beacon.color;
        tracePetal(ctx, beacon.radius * 1.75, beacon.radius * 0.42);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = "#fff5d8";
      ctx.beginPath();
      ctx.arc(0, 0, beacon.radius * 0.34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#9a6d2d";
      ctx.fillRect(-2.5, beacon.radius * 0.1, 5, beacon.radius * 0.9);
      ctx.strokeStyle = `rgba(255, 247, 218, ${0.42 + flash * 0.34})`;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, 0, beacon.radius * (0.72 + flash * 0.08), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawPickups(ctx) {
    for (const pickup of this.pickups) {
      const dx = pickup.x - this.player.x;
      const dy = pickup.y - this.player.y;
      const tailAngle = Math.atan2(dy, dx);
      const tailLength = Math.min(22, (pickup.pullSpeed || 0) * 0.03);
      ctx.save();
      ctx.translate(pickup.x, pickup.y);
      ctx.rotate(pickup.spin);
      if (tailLength > 0) {
        ctx.strokeStyle = "rgba(255, 247, 166, 0.42)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(Math.cos(tailAngle) * 2, Math.sin(tailAngle) * 2);
        ctx.lineTo(Math.cos(tailAngle) * tailLength, Math.sin(tailAngle) * tailLength);
        ctx.stroke();
      }
      ctx.fillStyle = "#fff7a6";
      traceStar(ctx, pickup.radius * 1.45, pickup.radius * 0.72, 4);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.beginPath();
      ctx.arc(0, 0, pickup.radius * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawOrbitals(ctx) {
    const state = this.skillStates.petalOrbit;
    if (!state) {
      return;
    }

    const definition = getSkillDefinition("petalOrbit");
    const stats = definition.statsByLevel[state.level - 1];
    const count = stats.count + (state.exclusives.petalCount || 0) + this.getSummonCountBonus("petalOrbit");
    const sizeScale = 1 + (state.exclusives.petalBloom || 0) * 0.2;
    const radius = stats.orbitRadius * this.player.rangeMultiplier * sizeScale;
    const petalRadius = stats.size * this.player.projectileSizeMultiplier * sizeScale;
    for (let index = 0; index < count; index += 1) {
      const angle = this.orbitAngle + (Math.PI * 2 * index) / count;
      const x = this.player.x + Math.cos(angle) * radius;
      const y = this.player.y + Math.sin(angle) * radius;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = definitionColor("petalOrbit");
      tracePetal(ctx, petalRadius * 2.3, petalRadius * 0.58);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 240, 247, 0.82)";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(0, -petalRadius * 1.08);
      ctx.lineTo(0, petalRadius * 0.92);
      ctx.stroke();
      ctx.restore();
    }
  }
}

function definitionColor(skillId) {
  return getSkillDefinition(skillId)?.color || "#ffffff";
}