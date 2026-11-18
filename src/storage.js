import { TALENT_LIBRARY, createDefaultUnlockState, normalizeDifficultyLevel, normalizeInitialSkillId } from "./data.js";
import {
  INNATE_SKILL_IDS,
  MAX_ESSENCE_SLOTS,
  MAX_SKILL_SLOTS,
  PROTAGONIST_BLESSING_ID,
  createDefaultBlessingState,
  createDefaultLoadout,
  createDefaultWorldState,
  getBlessingDefinition,
  getBlessingEquippableSkillIds,
} from "./garden-data.js";

const STORAGE_KEY = "sunny-survival-progress-v1";

function createTalentState() {
  return Object.fromEntries(TALENT_LIBRARY.map((talent) => [talent.id, 0]));
}

export function createDefaultProgress() {
  return {
    version: 4,
    meta: {
      totalCoins: 0,
      runs: 0,
      wins: 0,
      bestTime: 0,
      bestLevel: 1,
    },
    settings: {
      difficultyLevel: 1,
      initialSkillId: "flyingSword",
      eyeComfortMode: false,
      muted: false,
      reducedMotion: false,
      perspectiveMode: false,
    },
    talents: createTalentState(),
    unlocks: createDefaultUnlockState(),
    codex: {
      monsters: [],
      skills: [],
    },
    world: createDefaultWorldState(),
  };
}

function clampInt(value, fallbackValue, min, max) {
  const parsed = Number.isFinite(Number(value)) ? Math.floor(Number(value)) : fallbackValue;
  return Math.max(min, Math.min(max, parsed));
}

function normalizeBlessings(rawWorld, legacyCharacters) {
  const blessings = createDefaultBlessingState();

  // 迁移：旧存档的 world.unlockedCharacters 直接转为「已授予初赐」。
  for (const characterId of Array.isArray(legacyCharacters) ? legacyCharacters : []) {
    if (!getBlessingDefinition(characterId)) {
      continue;
    }
    blessings[characterId] = { granted: true, resonance: 0, essence: false };
  }

  const rawBlessings = rawWorld?.blessings && typeof rawWorld.blessings === "object" ? rawWorld.blessings : {};
  for (const [blessingId, entry] of Object.entries(rawBlessings)) {
    const definition = getBlessingDefinition(blessingId);
    if (!definition || !entry || typeof entry !== "object") {
      continue;
    }
    blessings[blessingId] = {
      granted: Boolean(entry.granted),
      resonance: clampInt(entry.resonance, 0, 0, definition.resonanceMax || 0),
      // 本源是 P3 内容；只有当该提供者确实定义了本源时才保留标记。
      essence: Boolean(entry.essence) && Boolean(definition.essence),
    };
  }

  // 主角赐福恒定已授予。
  blessings[PROTAGONIST_BLESSING_ID] = {
    ...(blessings[PROTAGONIST_BLESSING_ID] || { resonance: 0, essence: false }),
    granted: true,
  };

  return blessings;
}

function collectEquippableSkillIds(blessings) {
  const skillIds = new Set();
  for (const [blessingId, entry] of Object.entries(blessings || {})) {
    if (!entry?.granted) {
      continue;
    }
    for (const skillId of getBlessingEquippableSkillIds(blessingId)) {
      skillIds.add(skillId);
    }
  }
  return skillIds;
}

function collectGrantedEssenceIds(blessings) {
  const essenceIds = new Set();
  for (const [blessingId, entry] of Object.entries(blessings || {})) {
    if (!entry?.granted || !entry.essence) {
      continue;
    }
    const essenceId = getBlessingDefinition(blessingId)?.essence?.id;
    if (essenceId) {
      essenceIds.add(essenceId);
    }
  }
  return essenceIds;
}

function normalizeLoadout(rawWorld, blessings) {
  const fallback = createDefaultLoadout();
  const raw = rawWorld?.loadout && typeof rawWorld.loadout === "object" ? rawWorld.loadout : {};

  const skillSlots = clampInt(raw.skillSlots, fallback.skillSlots, 1, MAX_SKILL_SLOTS);
  const essenceSlots = clampInt(raw.essenceSlots, fallback.essenceSlots, 0, MAX_ESSENCE_SLOTS);

  const equippable = collectEquippableSkillIds(blessings);
  const innate = new Set(INNATE_SKILL_IDS);
  const skillIds = [];
  for (const skillId of Array.isArray(raw.skillIds) ? raw.skillIds : []) {
    if (skillIds.length >= skillSlots) {
      break;
    }
    // 固有技能恒定可用，不占槽也不入列；未授予的技能一律剔除。
    if (innate.has(skillId) || !equippable.has(skillId) || skillIds.includes(skillId)) {
      continue;
    }
    skillIds.push(skillId);
  }

  const grantedEssences = collectGrantedEssenceIds(blessings);
  const essenceIds = [];
  for (const essenceId of Array.isArray(raw.essenceIds) ? raw.essenceIds : []) {
    if (essenceIds.length >= essenceSlots) {
      break;
    }
    if (!grantedEssences.has(essenceId) || essenceIds.includes(essenceId)) {
      continue;
    }
    essenceIds.push(essenceId);
  }

  return { skillIds, essenceIds, skillSlots, essenceSlots };
}

function mergeProgress(raw) {
  const fallback = createDefaultProgress();
  if (!raw || typeof raw !== "object") {
    return fallback;
  }

  const meta = { ...fallback.meta, ...(raw.meta || {}) };
  const talents = { ...fallback.talents, ...(raw.talents || {}) };
  const defaultUnlocks = createDefaultUnlockState();
  const unlocks = {
    skills: { ...defaultUnlocks.skills, ...(raw.unlocks?.skills || {}) },
    exclusives: { ...defaultUnlocks.exclusives, ...(raw.unlocks?.exclusives || {}) },
    disabledExclusives: { ...defaultUnlocks.disabledExclusives, ...(raw.unlocks?.disabledExclusives || {}) },
  };
  const settings = {
    ...fallback.settings,
    ...(raw.settings || {}),
    difficultyLevel: normalizeDifficultyLevel(raw.settings?.difficultyLevel ?? fallback.settings.difficultyLevel),
    initialSkillId: normalizeInitialSkillId(raw.settings?.initialSkillId ?? fallback.settings.initialSkillId, unlocks),
    eyeComfortMode: Boolean(raw.settings?.eyeComfortMode ?? fallback.settings.eyeComfortMode),
    muted: Boolean(raw.settings?.muted ?? fallback.settings.muted),
    reducedMotion: Boolean(raw.settings?.reducedMotion ?? fallback.settings.reducedMotion),
    perspectiveMode: Boolean(raw.settings?.perspectiveMode ?? fallback.settings.perspectiveMode),
  };
  const codex = {
    monsters: Array.isArray(raw.codex?.monsters) ? [...new Set(raw.codex.monsters)] : [],
    skills: Array.isArray(raw.codex?.skills) ? [...new Set(raw.codex.skills)] : [],
  };
  const fallbackWorld = createDefaultWorldState();
  // 旧字段：角色选择模型已被赐福系统取代，解构出来避免残留在存档里。
  const { unlockedCharacters: legacyCharacters, selectedCharacterId: _legacySelectedCharacter, ...rawWorld } = raw.world || {};
  const blessings = normalizeBlessings(raw.world, legacyCharacters);
  const world = {
    ...fallbackWorld,
    ...rawWorld,
    liberatedRegions: Array.isArray(raw.world?.liberatedRegions)
      ? [...new Set(raw.world.liberatedRegions)]
      : fallbackWorld.liberatedRegions,
    unlockedLandscapes: Array.isArray(raw.world?.unlockedLandscapes)
      ? [...new Set(raw.world.unlockedLandscapes)]
      : fallbackWorld.unlockedLandscapes,
    blessings,
    loadout: normalizeLoadout(raw.world, blessings),
  };

  return {
    version: 4,
    meta,
    settings,
    talents,
    unlocks,
    codex,
    world,
  };
}

export function loadProgress() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaultProgress();
    }
    return mergeProgress(JSON.parse(raw));
  } catch {
    return createDefaultProgress();
  }
}

export function saveProgress(progress) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    return;
  }
}

export function applyRunResult(progress, result) {
  const next = mergeProgress(progress);
  next.meta.totalCoins += result.coinsEarned;
  next.meta.runs += 1;
  next.meta.wins += result.victory ? 1 : 0;
  next.meta.bestTime = Math.max(next.meta.bestTime, Math.floor(result.survivalTime));
  next.meta.bestLevel = Math.max(next.meta.bestLevel, result.level);

  for (const monsterId of result.discoveries.monsters) {
    if (!next.codex.monsters.includes(monsterId)) {
      next.codex.monsters.push(monsterId);
    }
  }

  for (const skillId of result.discoveries.skills) {
    if (!next.codex.skills.includes(skillId)) {
      next.codex.skills.push(skillId);
    }
  }

  saveProgress(next);
  return next;
}

export function purchaseTalent(progress, talent, currentLevel) {
  const next = mergeProgress(progress);
  next.talents[talent.id] = currentLevel + 1;
  return next;
}

export function updateSettings(progress, partialSettings) {
  const next = mergeProgress(progress);
  next.settings = {
    ...next.settings,
    ...partialSettings,
    difficultyLevel: normalizeDifficultyLevel(partialSettings?.difficultyLevel ?? next.settings.difficultyLevel),
    initialSkillId: normalizeInitialSkillId(partialSettings?.initialSkillId ?? next.settings.initialSkillId, next.unlocks),
    eyeComfortMode: Boolean(partialSettings?.eyeComfortMode ?? next.settings.eyeComfortMode),
    muted: Boolean(partialSettings?.muted ?? next.settings.muted),
    reducedMotion: Boolean(partialSettings?.reducedMotion ?? next.settings.reducedMotion),
    perspectiveMode: Boolean(partialSettings?.perspectiveMode ?? next.settings.perspectiveMode),
  };
  return next;
}

export function purchaseSkillUnlock(progress, skill) {
  const next = mergeProgress(progress);
  next.unlocks.skills[skill.id] = true;
  if (skill.starterExclusiveId) {
    next.unlocks.exclusives[skill.starterExclusiveId] = true;
    next.unlocks.disabledExclusives[skill.starterExclusiveId] = false;
  }
  return next;
}

export function purchaseExclusiveUnlock(progress, exclusiveId) {
  const next = mergeProgress(progress);
  next.unlocks.exclusives[exclusiveId] = true;
  next.unlocks.disabledExclusives[exclusiveId] = false;
  return next;
}

export function setExclusiveEnabled(progress, exclusiveId, enabled) {
  const next = mergeProgress(progress);
  next.unlocks.disabledExclusives[exclusiveId] = !enabled;
  return next;
}

export function updateWorldState(progress, partialWorld) {
  const next = mergeProgress(progress);
  next.world = {
    ...next.world,
    ...partialWorld,
    liberatedRegions: Array.isArray(partialWorld?.liberatedRegions)
      ? [...new Set(partialWorld.liberatedRegions)]
      : next.world.liberatedRegions,
    unlockedLandscapes: Array.isArray(partialWorld?.unlockedLandscapes)
      ? [...new Set(partialWorld.unlockedLandscapes)]
      : next.world.unlockedLandscapes,
    blessings: partialWorld?.blessings && typeof partialWorld.blessings === "object"
      ? normalizeBlessings({ blessings: partialWorld.blessings })
      : next.world.blessings,
  };
  // 赐福或槽位可能被一并改动，统一过一遍装配校验。
  next.world.loadout = normalizeLoadout(next.world, next.world.blessings);
  return next;
}

// 已授予的赐福（含主角固有技能）中，当前可供装备的技能 id。
export function getGrantedSkillIds(world) {
  return [...new Set([...INNATE_SKILL_IDS, ...collectEquippableSkillIds(world?.blessings)])];
}

export function isBlessingGranted(world, blessingId) {
  return Boolean(world?.blessings?.[blessingId]?.granted);
}

// 授予初赐。若技能槽尚有空位，顺手装备上去——避免玩家刚拿到赐福却带不出场。
function grantBlessingInPlace(world, blessingId) {
  const definition = getBlessingDefinition(blessingId);
  if (!definition) {
    return false;
  }

  const existing = world.blessings[blessingId];
  if (existing?.granted) {
    return false;
  }

  world.blessings[blessingId] = {
    granted: true,
    resonance: existing?.resonance || 0,
    essence: Boolean(existing?.essence) && Boolean(definition.essence),
  };

  const innate = new Set(INNATE_SKILL_IDS);
  for (const skillId of getBlessingEquippableSkillIds(blessingId)) {
    if (world.loadout.skillIds.length >= world.loadout.skillSlots) {
      break;
    }
    if (innate.has(skillId) || world.loadout.skillIds.includes(skillId)) {
      continue;
    }
    world.loadout.skillIds.push(skillId);
  }

  return true;
}

export function grantBlessing(progress, blessingId) {
  const next = mergeProgress(progress);
  grantBlessingInPlace(next.world, blessingId);
  return next;
}

export function setLoadoutSkills(progress, skillIds) {
  const next = mergeProgress(progress);
  const equippable = collectEquippableSkillIds(next.world.blessings);
  const innate = new Set(INNATE_SKILL_IDS);
  const resolved = [];

  for (const skillId of Array.isArray(skillIds) ? skillIds : []) {
    if (resolved.length >= next.world.loadout.skillSlots) {
      break;
    }
    if (innate.has(skillId) || !equippable.has(skillId) || resolved.includes(skillId)) {
      continue;
    }
    resolved.push(skillId);
  }

  next.world.loadout = { ...next.world.loadout, skillIds: resolved };
  return next;
}

export function expandSkillSlots(progress, amount = 1) {
  const next = mergeProgress(progress);
  next.world.loadout = {
    ...next.world.loadout,
    skillSlots: clampInt(next.world.loadout.skillSlots + amount, next.world.loadout.skillSlots, 1, MAX_SKILL_SLOTS),
  };
  return next;
}

export function unlockRegionReward(progress, regionId, reward) {
  const next = mergeProgress(progress);
  if (!next.world.liberatedRegions.includes(regionId)) {
    next.world.liberatedRegions.push(regionId);
  }

  // "character" 为旧版奖励类型，保留以兼容途中存档。
  if ((reward?.type === "blessing" || reward?.type === "character") && reward.targetId) {
    grantBlessingInPlace(next.world, reward.targetId);
  }

  if (reward?.type === "landscape" && reward.targetId && !next.world.unlockedLandscapes.includes(reward.targetId)) {
    next.world.unlockedLandscapes.push(reward.targetId);
  }

  return next;
}