import { TALENT_LIBRARY, createDefaultUnlockState, normalizeDifficultyLevel } from "./data.js";

const STORAGE_KEY = "sunny-survival-progress-v1";

function createTalentState() {
  return Object.fromEntries(TALENT_LIBRARY.map((talent) => [talent.id, 0]));
}

export function createDefaultProgress() {
  return {
    version: 2,
    meta: {
      totalCoins: 0,
      runs: 0,
      wins: 0,
      bestTime: 0,
      bestLevel: 1,
    },
    settings: {
      difficultyLevel: 1,
    },
    talents: createTalentState(),
    unlocks: createDefaultUnlockState(),
    codex: {
      monsters: [],
      skills: [],
    },
  };
}

function mergeProgress(raw) {
  const fallback = createDefaultProgress();
  if (!raw || typeof raw !== "object") {
    return fallback;
  }

  const meta = { ...fallback.meta, ...(raw.meta || {}) };
  const settings = {
    ...fallback.settings,
    ...(raw.settings || {}),
    difficultyLevel: normalizeDifficultyLevel(raw.settings?.difficultyLevel ?? fallback.settings.difficultyLevel),
  };
  const talents = { ...fallback.talents, ...(raw.talents || {}) };
  const defaultUnlocks = createDefaultUnlockState();
  const unlocks = {
    skills: { ...defaultUnlocks.skills, ...(raw.unlocks?.skills || {}) },
    exclusives: { ...defaultUnlocks.exclusives, ...(raw.unlocks?.exclusives || {}) },
    disabledExclusives: { ...defaultUnlocks.disabledExclusives, ...(raw.unlocks?.disabledExclusives || {}) },
  };
  const codex = {
    monsters: Array.isArray(raw.codex?.monsters) ? [...new Set(raw.codex.monsters)] : [],
    skills: Array.isArray(raw.codex?.skills) ? [...new Set(raw.codex.skills)] : [],
  };

  return {
    version: 2,
    meta,
    settings,
    talents,
    unlocks,
    codex,
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