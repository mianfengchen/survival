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
  getDifficultyProfile,
  getMonsterDefinition,
  getSkillDefinition,
  normalizeDifficultyLevel,
} from "./data.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
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

const SWORD_GLOW_COLORS = ["#ffe58f", "#8fe9ff", "#ffb4f6", "#b7ff84", "#ffd2a8", "#d7b7ff"];

function pickSwordGlowColor(currentColor) {
  const options = SWORD_GLOW_COLORS.filter((color) => color !== currentColor);
  return options[Math.floor(Math.random() * options.length)] || SWORD_GLOW_COLORS[0];
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
    this.ctx = canvas.getContext("2d");
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
    this.pickups = [];
    this.orbitAngle = 0;
    this.lastTimestamp = 0;
    this.hudClock = 0;
    this.pendingChoices = [];
    this.keysBound = false;
    this.metaUnlocks = createDefaultUnlockState();

    this.bindKeys();
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

  startRun(progress, options = {}) {
    const difficultyLevel = normalizeDifficultyLevel(options.difficultyLevel ?? progress?.settings?.difficultyLevel ?? 1);
    const difficultyProfile = getDifficultyProfile(difficultyLevel);
    const defaultUnlocks = createDefaultUnlockState();
    this.metaUnlocks = {
      skills: { ...defaultUnlocks.skills, ...(progress?.unlocks?.skills || {}) },
      exclusives: { ...defaultUnlocks.exclusives, ...(progress?.unlocks?.exclusives || {}) },
      disabledExclusives: { ...defaultUnlocks.disabledExclusives, ...(progress?.unlocks?.disabledExclusives || {}) },
    };
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
      coinRewardMultiplier: difficultyProfile.coinMultiplier,
      bossSpawned: false,
      resultShown: false,
      difficultyLevel,
      difficultyProfile,
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
    this.pickups = [];
    this.orbitAngle = 0;
    this.pendingChoices = [];

    this.applyTalents(progress?.talents || {});
    this.unlockSkill("flyingSword", false);
    this.state = "running";
    this.lastTimestamp = 0;
    this.callbacks.onSessionLabel?.("战斗进行中", "撑过 15 分钟并击败最终 Boss");
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

    for (const general of GENERAL_UPGRADES) {
      const level = this.generalLevels[general.id] || 0;
      if (level < general.maxLevel) {
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
      const purchased = unlockedSkills[skill.id] || skill.startsUnlocked;
      if (!purchased) {
        continue;
      }

      const state = this.skillStates[skill.id];
      if (!state && !skill.startsUnlocked) {
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
    this.update(delta);
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

    if (!session.bossSpawned && session.elapsed >= ROUND_DURATION_SECONDS) {
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
    this.updateOrbitals(delta);
    this.updateEnemies(delta);
    this.updateEnemyProjectiles(delta);
    this.updatePickups(delta);

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
    return {
      width: this.canvas.width || 1280,
      height: this.canvas.height || 720,
    };
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
      const eligible = MONSTER_LIBRARY.filter((monster) => !monster.boss && monster.minTime <= elapsed + profile.typeAdvanceSeconds);
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
      exp: definition.exp,
      color: definition.color,
      accent: definition.accent,
      boss: Boolean(definition.boss),
      contactCooldown: 0,
      burnTimer: 0,
      burnDamage: 0,
      slowTimer: 0,
      hitCooldowns: {},
      attackClock: definition.boss ? 1.5 : 0,
      attackPhase: 0,
    };
  }

  spawnBoss() {
    const definition = getMonsterDefinition("twilightMower");
    this.session.bossSpawned = true;
    const boss = this.createEnemy(definition);
    const camera = this.getCamera();
    boss.x = clamp(camera.x + camera.width / 2, 90, ARENA.width - 90);
    boss.y = clamp(camera.y - 70, -70, ARENA.height + 70);
    this.enemies.push(boss);
    this.session.discoveries.monsters.add(definition.id);
    this.callbacks.onToast?.("最终 Boss 出现");
    this.callbacks.onSessionLabel?.("Boss 战", "击败黄昏收割者即可获胜");
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

      if (skillId === "flyingSword") this.castFlyingSword(state, stats);
      if (skillId === "solarPulse") this.castSolarPulse(state, stats);
      if (skillId === "bubbleBurst") this.castBubbleBurst(state, stats);
      if (skillId === "thornVolley") this.castThornVolley(state, stats);
      if (skillId === "dewGarden") this.castDewGarden(state, stats);
      if (skillId === "stormBloom") this.castStormBloom(state, stats);
      if (skillId === "mushroomMine") this.castMushroomMine(state, stats);
    }
  }

  castFlyingSword(state, stats) {
    const giantLevel = state.exclusives.swordGiant || 0;
    const tracking = (state.exclusives.swordTracking || 0) > 0;
    const extraPierce = state.exclusives.swordPierce || 0;
    const target = this.findNearestEnemy(this.player.x, this.player.y);
    if (!target) {
      return;
    }

    for (let index = 0; index < stats.count; index += 1) {
      const giant = giantLevel > 0 && Math.random() < 0.08 * giantLevel;
      const angleOffset = stats.count === 1 ? 0 : (-0.08 * (stats.count - 1)) / 2 + index * 0.08;
      const direction = this.getDirectionToTarget(target, angleOffset);
      const speed = stats.speed * this.player.projectileSpeedMultiplier * (giant ? 0.84 : 1);
      const radius = stats.size * this.player.projectileSizeMultiplier * (giant ? 4.5 : 1);
      const range = stats.range * this.player.rangeMultiplier;

      this.projectiles.push({
        id: crypto.randomUUID(),
        skillId: "flyingSword",
        x: this.player.x,
        y: this.player.y,
        vx: direction.x * speed,
        vy: direction.y * speed,
        speed,
        radius,
        damage: this.rollDamage(stats.damage * (giant ? 8.5 : 1)),
        pierce: stats.pierce + extraPierce + (giant ? 99 : 0),
        maxDistance: giant ? Number.POSITIVE_INFINITY : range,
        distanceTravelled: 0,
        tracking: tracking && !giant,
        color: giant ? "#ffcb61" : definitionColor("flyingSword"),
        giant,
        glowColor: state.exclusives.swordGlow > 0 ? state.glowColor || "#ffe58f" : null,
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

    for (let index = 0; index < stats.count; index += 1) {
      const offset = stats.count === 1 ? 0 : (-0.15 * (stats.count - 1)) / 2 + index * 0.15;
      const direction = this.getDirectionToTarget(target, offset);
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
    const totalCount = stats.count + extraCount;
    const rootLevel = state.exclusives.thornRoot || 0;
    const burstLevel = state.exclusives.thornBurst || 0;

    for (let index = 0; index < totalCount; index += 1) {
      const angleOffset = totalCount === 1 ? 0 : (-stats.spread * (totalCount - 1)) / 2 + index * stats.spread;
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
    const totalCount = stats.count + spreadLevel;
    const chillLevel = state.exclusives.dewChill || 0;
    const mendLevel = state.exclusives.dewMend || 0;
    const anchors = this.findNearestEnemies(this.player.x, this.player.y, totalCount);

    for (let index = 0; index < totalCount; index += 1) {
      const anchorCount = Math.max(1, anchors.length);
      const anchor = anchors[index % anchorCount] || this.player;
      const ringAngle = (Math.PI * 2 * index) / Math.max(1, totalCount);
      const ringDistance = anchors.length > 0 && totalCount > anchors.length ? 30 + 14 * Math.floor(index / anchorCount) : 0;
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
    const totalCount = stats.count + (state.exclusives.mineStock || 0);
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
      if (projectile.tracking) {
        const target = this.findNearestEnemy(projectile.x, projectile.y);
        if (target) {
          const direction = this.getDirectionVector(target.x - projectile.x, target.y - projectile.y);
          projectile.vx += direction.x * projectile.speed * 0.12 * delta * 60;
          projectile.vy += direction.y * projectile.speed * 0.12 * delta * 60;
          const length = magnitude(projectile.vx, projectile.vy);
          projectile.vx = (projectile.vx / length) * projectile.speed;
          projectile.vy = (projectile.vy / length) * projectile.speed;
        }
      }

      projectile.x += projectile.vx * delta;
      projectile.y += projectile.vy * delta;
      projectile.distanceTravelled += Math.hypot(projectile.vx * delta, projectile.vy * delta);
      let removed = false;

      for (const enemy of this.enemies) {
        if (circleDistance(projectile, enemy) > projectile.radius + enemy.radius) {
          continue;
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

        projectile.pierce -= 1;
        if (projectile.pierce < 0) {
          removed = true;
          break;
        }
      }

      if (!removed && projectile.distanceTravelled >= projectile.maxDistance) {
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
    const count = stats.count + (state.exclusives.petalCount || 0);
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
    enemy.attackClock = Math.max(0.55, 2.35 / profile.bossAttackRateMultiplier);
    this.fireBossFan(enemy, profile);
    if (enemy.attackPhase % 2 === 0) {
      this.fireBossRing(enemy, profile);
    }
  }

  fireBossFan(enemy, profile) {
    const direction = this.getDirectionVector(this.player.x - enemy.x, this.player.y - enemy.y);
    const baseAngle = Math.atan2(direction.y, direction.x);
    const count = 7 + Math.floor(profile.level / 2);
    const spread = Math.PI / 2.6;
    const speed = 250 * profile.bossBulletSpeedMultiplier;
    for (let index = 0; index < count; index += 1) {
      const angle = baseAngle - spread / 2 + (spread * index) / Math.max(1, count - 1);
      this.enemyProjectiles.push({
        x: enemy.x,
        y: enemy.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 11,
        damage: 14 + profile.level * 2,
        life: 6.5,
        color: "#ffef86",
      });
    }
  }

  fireBossRing(enemy, profile) {
    const count = 12 + profile.level * 2;
    const speed = 170 * profile.bossBulletSpeedMultiplier;
    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count;
      this.enemyProjectiles.push({
        x: enemy.x,
        y: enemy.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 9,
        damage: 10 + profile.level,
        life: 7,
        color: "#ff9ea3",
      });
    }
  }

  updateEnemyProjectiles(delta) {
    const next = [];
    for (const projectile of this.enemyProjectiles) {
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
    });

    if (enemy.boss) {
      this.finishRun(true, false);
    }
  }

  updatePickups(delta) {
    const remaining = [];
    for (const pickup of this.pickups) {
      const distance = circleDistance(pickup, this.player);
      if (distance < 22) {
        this.gainExp(pickup.value);
        continue;
      }

      if (distance < this.player.expPickupRange) {
        const direction = this.getDirectionVector(this.player.x - pickup.x, this.player.y - pickup.y);
        pickup.x += direction.x * 220 * delta;
        pickup.y += direction.y * 220 * delta;
      }

      remaining.push(pickup);
    }
    this.pickups = remaining;
  }

  gainExp(amount) {
    this.session.exp += amount * this.player.expMultiplier;
    while (this.session.exp >= this.session.expRequired) {
      this.session.exp -= this.session.expRequired;
      this.session.level += 1;
      this.session.expRequired = Math.floor(18 + this.session.level * 10 + this.session.level * this.session.level * 1.15);
      this.state = "levelup";
      this.pendingChoices = this.buildUpgradeChoices();
      this.callbacks.onLevelChoices?.(this.pendingChoices);
      this.callbacks.onOverlayChange?.("levelScreen");
      this.callbacks.onSessionLabel?.("升级中", "从三项成长中选择其一");
      this.emitHud();
      return;
    }
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
    const timeScore = this.session.elapsed / 55;
    const killScore = this.session.kills * 0.05;
    const winBonus = victory ? 28 : abandoned ? 0 : 8;
    const levelBonus = this.session.level * 1.4;
    const coinsEarned = Math.floor((timeScore + killScore + winBonus + levelBonus) * this.session.coinRewardMultiplier);

    this.callbacks.onRunEnd?.({
      victory,
      abandoned,
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
      : formatDuration(ROUND_DURATION_SECONDS - this.session.elapsed);

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
    const ctx = this.ctx;
    const camera = this.getCamera();
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    this.drawArena(ctx, camera);

    if (!this.session && !forceBackground) {
      ctx.restore();
      return;
    }

    this.drawFields(ctx);
    this.drawPickups(ctx);
    this.drawStrikes(ctx);
    this.drawMines(ctx);
    this.drawPulses(ctx);
    this.drawProjectiles(ctx);
    this.drawOrbitals(ctx);
    this.drawEnemies(ctx);
    this.drawEnemyProjectiles(ctx);
    this.drawPlayer(ctx);
    ctx.restore();
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

      const width = enemy.radius * 2.2;
      const ratio = clamp(enemy.health / enemy.maxHealth, 0, 1);
      ctx.fillStyle = "rgba(37, 45, 31, 0.22)";
      ctx.fillRect(enemy.x - width / 2, enemy.y - enemy.radius - 10, width, 4);
      ctx.fillStyle = enemy.boss ? "#e85f6a" : "#ffffff";
      ctx.fillRect(enemy.x - width / 2, enemy.y - enemy.radius - 10, width * ratio, 4);
    }
  }

  drawProjectiles(ctx) {
    for (const projectile of this.projectiles) {
      if (projectile.skillId === "flyingSword") {
        this.drawFlyingSword(ctx, projectile);
        continue;
      }

      ctx.fillStyle = projectile.color;
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawFlyingSword(ctx, projectile) {
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
      ctx.fillStyle = projectile.color;
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.46)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, Math.max(3, projectile.radius * 0.55), 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  drawPulses(ctx) {
    for (const pulse of this.pulses) {
      if (pulse.delay > 0) {
        continue;
      }
      ctx.strokeStyle = pulse.color;
      ctx.lineWidth = 6;
      ctx.globalAlpha = 0.28;
      ctx.beginPath();
      ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  drawFields(ctx) {
    for (const field of this.fields) {
      ctx.fillStyle = field.color;
      ctx.beginPath();
      ctx.arc(field.x, field.y, field.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = field.edgeColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(field.x, field.y, Math.max(12, field.radius - 8), 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  drawStrikes(ctx) {
    for (const strike of this.strikes) {
      ctx.save();
      ctx.setLineDash([10, 8]);
      ctx.strokeStyle = strike.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(strike.x, strike.y, strike.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(strike.x, strike.y - strike.radius - 20);
      ctx.lineTo(strike.x, strike.y + strike.radius + 20);
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

  drawPickups(ctx) {
    for (const pickup of this.pickups) {
      ctx.fillStyle = "#fff7a6";
      ctx.beginPath();
      ctx.arc(pickup.x, pickup.y, pickup.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawOrbitals(ctx) {
    const state = this.skillStates.petalOrbit;
    if (!state) {
      return;
    }

    const definition = getSkillDefinition("petalOrbit");
    const stats = definition.statsByLevel[state.level - 1];
    const count = stats.count + (state.exclusives.petalCount || 0);
    const sizeScale = 1 + (state.exclusives.petalBloom || 0) * 0.2;
    const radius = stats.orbitRadius * this.player.rangeMultiplier * sizeScale;
    const petalRadius = stats.size * this.player.projectileSizeMultiplier * sizeScale;
    for (let index = 0; index < count; index += 1) {
      const angle = this.orbitAngle + (Math.PI * 2 * index) / count;
      const x = this.player.x + Math.cos(angle) * radius;
      const y = this.player.y + Math.sin(angle) * radius;
      ctx.fillStyle = definitionColor("petalOrbit");
      ctx.beginPath();
      ctx.ellipse(x, y, petalRadius, petalRadius * 0.68, angle, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function definitionColor(skillId) {
  return getSkillDefinition(skillId)?.color || "#ffffff";
}