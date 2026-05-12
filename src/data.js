export const ARENA = {
  width: 960 * 3,
  height: 540 * 3,
};

export const ROUND_DURATION_SECONDS = 15 * 60;

export function normalizeDifficultyLevel(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return 1;
  }
  return Math.max(1, Math.min(10, parsed));
}

export function getDifficultyProfile(value) {
  const level = normalizeDifficultyLevel(value);
  const bonus = level - 1;

  return {
    level,
    monsterHealthMultiplier: Number((1 + bonus * 0.32).toFixed(2)),
    monsterDamageMultiplier: Number((1 + bonus * 0.18).toFixed(2)),
    monsterSpeedMultiplier: Number((1 + bonus * 0.06).toFixed(2)),
    spawnRateMultiplier: Number((1 + bonus * 0.12).toFixed(2)),
    coinMultiplier: Number((1 + bonus * 0.28).toFixed(2)),
    typeAdvanceSeconds: bonus * 80,
    eliteWeightMultiplier: Number((1 + bonus * 0.14).toFixed(2)),
    bossHealthMultiplier: Number((1 + bonus * 0.38).toFixed(2)),
    bossDamageMultiplier: Number((1 + bonus * 0.2).toFixed(2)),
    bossSpeedMultiplier: Number((1 + bonus * 0.05).toFixed(2)),
    bossBulletSpeedMultiplier: Number((1 + bonus * 0.08).toFixed(2)),
    bossAttackRateMultiplier: Number((1 + bonus * 0.05).toFixed(2)),
  };
}

export function getDifficultySummary(value) {
  const profile = getDifficultyProfile(value);
  return `怪物生命 x${profile.monsterHealthMultiplier}，伤害 x${profile.monsterDamageMultiplier}，刷新 x${profile.spawnRateMultiplier}，金币 x${profile.coinMultiplier}，高阶怪会提前 ${profile.typeAdvanceSeconds} 秒出现。`;
}

export const PLAYER_BASE = {
  maxHealth: 100,
  speed: 220,
  radius: 18,
  expPickupRange: 96,
  attackMultiplier: 1,
  cooldownScale: 1,
  rangeMultiplier: 1,
  projectileSpeedMultiplier: 1,
  projectileSizeMultiplier: 1,
  expMultiplier: 1,
  critChance: 0.05,
  critDamage: 1.5,
  dodgeChance: 0.05,
  armor: 0,
  blinkChargesMax: 1,
  blinkRechargeSeconds: 10,
  barrier: 0,
};

export const MONSTER_LIBRARY = [
  {
    id: "sproutSlime",
    name: "芽芽史莱姆",
    description: "从草地缝隙钻出的圆润小怪，移动慢但数量最多。",
    color: "#7ac95f",
    accent: "#4f8e44",
    minTime: 0,
    weight: 8,
    health: 26,
    speed: 52,
    damage: 8,
    radius: 15,
    exp: 4,
  },
  {
    id: "dandelionBat",
    name: "蒲公英蝠",
    description: "带着绒球尾巴高速俯冲，适合拉开走位节奏。",
    color: "#f0c86d",
    accent: "#bb8731",
    minTime: 70,
    weight: 6,
    health: 38,
    speed: 74,
    damage: 10,
    radius: 14,
    exp: 5,
  },
  {
    id: "sunbudBrute",
    name: "向阳苞卫",
    description: "生命厚、移动稳，会在中期形成明显压迫。",
    color: "#e4a24a",
    accent: "#9c6018",
    minTime: 180,
    weight: 4,
    health: 82,
    speed: 48,
    damage: 15,
    radius: 19,
    exp: 8,
  },
  {
    id: "thistleWitch",
    name: "蒺藜小巫",
    description: "后期登场的高压单位，速度与血量都更突出。",
    color: "#9e7bda",
    accent: "#6441a2",
    minTime: 420,
    weight: 3,
    health: 130,
    speed: 66,
    damage: 20,
    radius: 17,
    exp: 12,
  },
  {
    id: "twilightMower",
    name: "黄昏收割者",
    description: "15 分钟出现的超巨型最终首领，拥有高压弹幕攻击，击败后立即胜利。",
    color: "#e85f6a",
    accent: "#97212f",
    minTime: ROUND_DURATION_SECONDS,
    weight: 0,
    health: 1000000,
    speed: 72,
    damage: 48,
    radius: 118,
    exp: 500,
    boss: true,
  },
];

export const SKILL_LIBRARY = [
  {
    id: "flyingSword",
    name: "飞剑术",
    description: "朝最近敌人的方向射出直线飞剑，初始不带追踪效果，命中后消失。",
    color: "#6cb9ff",
    startsUnlocked: true,
    unlockCost: 0,
    starterExclusiveId: "swordPierce",
    maxLevel: 5,
    statsByLevel: [
      { cooldown: 0.9, damage: 24, count: 1, speed: 470, pierce: 0, size: 11, range: 430 },
      { cooldown: 0.78, damage: 34, count: 1, speed: 495, pierce: 0, size: 12, range: 450 },
      { cooldown: 0.7, damage: 46, count: 2, speed: 520, pierce: 1, size: 13, range: 470 },
      { cooldown: 0.62, damage: 59, count: 2, speed: 545, pierce: 1, size: 14, range: 500 },
      { cooldown: 0.54, damage: 74, count: 3, speed: 575, pierce: 2, size: 15, range: 530 },
    ],
    exclusiveUpgrades: [
      {
        id: "swordPierce",
        name: "虹光穿透",
        description: "首次选择即让飞剑获得 1 层穿透，之后每级继续 +1。",
        maxLevel: 3,
        unlockCost: 0,
        startsUnlocked: true,
      },
      {
        id: "swordTracking",
        name: "寻敌剑心",
        description: "飞剑持续追踪目标，转向能力显著增强。",
        maxLevel: 1,
        unlockCost: 130,
      },
      {
        id: "swordGiant",
        name: "巨刃奇袭",
        description: "飞剑有概率化作巨型飞剑，体积、伤害大幅提升且拥有无限射程。",
        maxLevel: 2,
        unlockCost: 180,
      },
      {
        id: "swordGlow",
        name: "亮闪闪",
        description: "飞剑获得明亮发光效果和拖尾高光。",
        maxLevel: 1,
        unlockCost: 90,
      },
      {
        id: "swordGlowColor",
        name: "闪亮亮",
        description: "每次选择都会随机修改一次飞剑的发光颜色。",
        maxLevel: 8,
        unlockCost: 110,
        requiresExclusive: "swordGlow",
        metaPrerequisite: "swordGlow",
      },
    ],
  },
  {
    id: "solarPulse",
    name: "向日脉冲",
    description: "周期性释放灿光波纹，对周围怪物造成范围伤害。",
    color: "#ffd15f",
    unlockCost: 180,
    starterExclusiveId: "solarEcho",
    maxLevel: 5,
    statsByLevel: [
      { cooldown: 4.2, damage: 42, radius: 120, waves: 1, growth: 300 },
      { cooldown: 3.8, damage: 58, radius: 140, waves: 1, growth: 320 },
      { cooldown: 3.4, damage: 76, radius: 160, waves: 2, growth: 340 },
      { cooldown: 3.05, damage: 96, radius: 180, waves: 2, growth: 360 },
      { cooldown: 2.75, damage: 120, radius: 205, waves: 3, growth: 380 },
    ],
    exclusiveUpgrades: [
      {
        id: "solarEcho",
        name: "回响日晕",
        description: "每级额外生成 1 道延迟波纹。",
        maxLevel: 2,
        unlockCost: 0,
      },
      {
        id: "solarBloom",
        name: "暖阳回春",
        description: "波纹命中敌人时回复少量生命。",
        maxLevel: 2,
        unlockCost: 120,
      },
      {
        id: "solarScorch",
        name: "焦糖灼痕",
        description: "波纹附带持续灼烧效果。",
        maxLevel: 2,
        unlockCost: 140,
      },
    ],
  },
  {
    id: "bubbleBurst",
    name: "泡泡轰鸣",
    description: "朝怪物发射泡泡弹，命中或飞行结束时爆开。",
    color: "#5bc2d8",
    unlockCost: 220,
    starterExclusiveId: "bubbleSplit",
    maxLevel: 5,
    statsByLevel: [
      { cooldown: 2.8, damage: 36, count: 1, speed: 250, size: 14, splash: 44 },
      { cooldown: 2.45, damage: 48, count: 1, speed: 270, size: 15, splash: 48 },
      { cooldown: 2.15, damage: 64, count: 2, speed: 290, size: 16, splash: 54 },
      { cooldown: 1.92, damage: 82, count: 2, speed: 310, size: 17, splash: 60 },
      { cooldown: 1.68, damage: 104, count: 3, speed: 330, size: 18, splash: 68 },
    ],
    exclusiveUpgrades: [
      {
        id: "bubbleSplit",
        name: "泡泡裂变",
        description: "爆炸后分裂出更多小泡泡追击附近目标。",
        maxLevel: 2,
        unlockCost: 0,
      },
      {
        id: "bubbleSlow",
        name: "清凉黏附",
        description: "爆炸命中的怪物会被减速。",
        maxLevel: 2,
        unlockCost: 120,
      },
      {
        id: "bubbleGiant",
        name: "云朵泡影",
        description: "每级显著增加泡泡体积与爆炸范围。",
        maxLevel: 2,
        unlockCost: 140,
      },
    ],
  },
  {
    id: "petalOrbit",
    name: "花瓣回旋",
    description: "让花瓣围绕角色旋转，对靠近的敌人持续切割。",
    color: "#f07f9b",
    unlockCost: 240,
    starterExclusiveId: "petalCount",
    maxLevel: 5,
    statsByLevel: [
      { damage: 18, count: 2, orbitRadius: 68, size: 11, angularSpeed: 2.6 },
      { damage: 26, count: 2, orbitRadius: 72, size: 12, angularSpeed: 2.9 },
      { damage: 36, count: 3, orbitRadius: 78, size: 13, angularSpeed: 3.15 },
      { damage: 48, count: 3, orbitRadius: 84, size: 14, angularSpeed: 3.4 },
      { damage: 62, count: 4, orbitRadius: 90, size: 15, angularSpeed: 3.75 },
    ],
    exclusiveUpgrades: [
      {
        id: "petalCount",
        name: "繁花重影",
        description: "每级额外增加 1 枚花瓣。",
        maxLevel: 2,
        unlockCost: 0,
      },
      {
        id: "petalBloom",
        name: "盛放外环",
        description: "增大花瓣半径与环绕范围。",
        maxLevel: 2,
        unlockCost: 120,
      },
      {
        id: "petalSustain",
        name: "花蜜回流",
        description: "花瓣命中怪物时回复少量生命。",
        maxLevel: 2,
        unlockCost: 140,
      },
    ],
  },
  {
    id: "thornVolley",
    name: "荆棘飞簇",
    description: "朝最近敌人扇形射出一组荆棘刺，具备基础穿透能力。",
    color: "#7da44a",
    unlockCost: 260,
    starterExclusiveId: "thornFork",
    maxLevel: 5,
    statsByLevel: [
      { cooldown: 2.4, damage: 22, count: 3, speed: 390, pierce: 1, size: 8, range: 330, spread: 0.22 },
      { cooldown: 2.15, damage: 32, count: 3, speed: 410, pierce: 1, size: 9, range: 350, spread: 0.23 },
      { cooldown: 1.95, damage: 44, count: 4, speed: 430, pierce: 1, size: 9, range: 375, spread: 0.24 },
      { cooldown: 1.78, damage: 57, count: 4, speed: 450, pierce: 2, size: 10, range: 400, spread: 0.25 },
      { cooldown: 1.6, damage: 72, count: 5, speed: 470, pierce: 2, size: 11, range: 430, spread: 0.26 },
    ],
    exclusiveUpgrades: [
      {
        id: "thornFork",
        name: "蔓刺加簇",
        description: "每级额外增加 2 枚荆棘刺。",
        maxLevel: 2,
        unlockCost: 0,
      },
      {
        id: "thornRoot",
        name: "缠根绞锁",
        description: "荆棘命中后会短暂缠住敌人并显著减速。",
        maxLevel: 2,
        unlockCost: 120,
      },
      {
        id: "thornBurst",
        name: "棘刺裂响",
        description: "荆棘首次命中后会裂出侧向棘刺。",
        maxLevel: 2,
        unlockCost: 140,
      },
    ],
  },
  {
    id: "dewGarden",
    name: "露水花圃",
    description: "在敌人脚下铺开露水花圃，持续伤害并减速其中的目标。",
    color: "#6fd9c7",
    unlockCost: 280,
    starterExclusiveId: "dewSpread",
    maxLevel: 5,
    statsByLevel: [
      { cooldown: 5, damage: 16, radius: 90, duration: 4.4, count: 1, tickInterval: 0.42 },
      { cooldown: 4.55, damage: 22, radius: 98, duration: 4.9, count: 1, tickInterval: 0.4 },
      { cooldown: 4.1, damage: 30, radius: 106, duration: 5.4, count: 2, tickInterval: 0.38 },
      { cooldown: 3.7, damage: 40, radius: 114, duration: 5.9, count: 2, tickInterval: 0.36 },
      { cooldown: 3.3, damage: 52, radius: 124, duration: 6.4, count: 2, tickInterval: 0.34 },
    ],
    exclusiveUpgrades: [
      {
        id: "dewSpread",
        name: "雨露扩繁",
        description: "每级额外生成 1 片露水花圃。",
        maxLevel: 2,
        unlockCost: 0,
      },
      {
        id: "dewChill",
        name: "凝露迟滞",
        description: "露水花圃会持续强化减速效果。",
        maxLevel: 2,
        unlockCost: 120,
      },
      {
        id: "dewMend",
        name: "晨露回甘",
        description: "花圃命中敌人时为玩家回复少量生命。",
        maxLevel: 2,
        unlockCost: 140,
      },
    ],
  },
  {
    id: "stormBloom",
    name: "雷芽裁决",
    description: "锁定最近敌人的位置，短暂延迟后降下雷击。",
    color: "#e8da7d",
    unlockCost: 300,
    starterExclusiveId: "stormCount",
    maxLevel: 5,
    statsByLevel: [
      { cooldown: 4.4, damage: 58, radius: 52, count: 1, delay: 0.72 },
      { cooldown: 3.95, damage: 76, radius: 58, count: 1, delay: 0.64 },
      { cooldown: 3.55, damage: 98, radius: 64, count: 2, delay: 0.56 },
      { cooldown: 3.15, damage: 123, radius: 70, count: 2, delay: 0.5 },
      { cooldown: 2.8, damage: 152, radius: 78, count: 2, delay: 0.44 },
    ],
    exclusiveUpgrades: [
      {
        id: "stormCount",
        name: "连株追雷",
        description: "每级额外追加 1 道落雷。",
        maxLevel: 2,
        unlockCost: 0,
      },
      {
        id: "stormChain",
        name: "电弧续命",
        description: "落雷命中后会向附近敌人跳跃电弧。",
        maxLevel: 2,
        unlockCost: 120,
      },
      {
        id: "stormField",
        name: "感电花幕",
        description: "落雷后留下短暂感电区域。",
        maxLevel: 2,
        unlockCost: 140,
      },
    ],
  },
  {
    id: "mushroomMine",
    name: "蘑菇伏雷",
    description: "在角色周围种下蘑菇地雷，敌人靠近后会自动爆炸。",
    color: "#c98d5a",
    unlockCost: 320,
    starterExclusiveId: "mineStock",
    maxLevel: 5,
    statsByLevel: [
      { cooldown: 4.8, damage: 72, radius: 62, count: 1, armTime: 0.6, duration: 8 },
      { cooldown: 4.3, damage: 92, radius: 68, count: 1, armTime: 0.56, duration: 8.6 },
      { cooldown: 3.85, damage: 118, radius: 74, count: 2, armTime: 0.5, duration: 9.2 },
      { cooldown: 3.45, damage: 148, radius: 80, count: 2, armTime: 0.46, duration: 9.7 },
      { cooldown: 3.1, damage: 182, radius: 88, count: 3, armTime: 0.42, duration: 10.2 },
    ],
    exclusiveUpgrades: [
      {
        id: "mineStock",
        name: "孢床扩建",
        description: "每级额外布置 1 枚蘑菇地雷。",
        maxLevel: 2,
        unlockCost: 0,
      },
      {
        id: "mineToxic",
        name: "菌雾残留",
        description: "蘑菇地雷爆炸后会留下毒雾。",
        maxLevel: 2,
        unlockCost: 120,
      },
      {
        id: "mineBurst",
        name: "爆伞蘑潮",
        description: "地雷爆炸范围增大，并射出孢子破片。",
        maxLevel: 2,
        unlockCost: 140,
      },
    ],
  },
];

export const GENERAL_UPGRADES = [
  {
    id: "attackGrowth",
    name: "攻击成长",
    description: "伤害提高 18%。",
    maxLevel: 8,
    apply: (player, session) => {
      player.attackMultiplier *= 1.18;
    },
  },
  {
    id: "moveSpeed",
    name: "移速成长",
    description: "移动速度提高 12%。",
    maxLevel: 6,
    apply: (player, session) => {
      player.speed *= 1.12;
    },
  },
  {
    id: "attackRange",
    name: "攻击范围成长",
    description: "攻击范围提高 14%。",
    maxLevel: 5,
    apply: (player, session) => {
      player.rangeMultiplier *= 1.14;
    },
  },
  {
    id: "cooldownReduction",
    name: "冷却缩减",
    description: "技能冷却减少 8%。",
    maxLevel: 6,
    apply: (player, session) => {
      player.cooldownScale *= 0.92;
    },
  },
  {
    id: "expGrowth",
    name: "经验获取成长",
    description: "经验收益提高 20%。",
    maxLevel: 5,
    apply: (player, session) => {
      player.expMultiplier *= 1.2;
    },
  },
  {
    id: "expPickupRange",
    name: "吸取经验范围",
    description: "经验球会在更远距离被吸向角色。",
    maxLevel: 6,
    apply: (player, session) => {
      player.expPickupRange *= 1.28;
    },
  },
  {
    id: "projectileSpeed",
    name: "弹道速度成长",
    description: "飞行类技能速度提高 16%。",
    maxLevel: 5,
    apply: (player, session) => {
      player.projectileSpeedMultiplier *= 1.16;
    },
  },
  {
    id: "projectileSize",
    name: "抛射物体积成长",
    description: "投射物体积提高 14%。",
    maxLevel: 5,
    apply: (player, session) => {
      player.projectileSizeMultiplier *= 1.14;
    },
  },
  {
    id: "healthGrowth",
    name: "生命成长",
    description: "生命上限 +22，并回复同等生命。",
    maxLevel: 6,
    apply: (player, session) => {
      player.maxHealth += 22;
      player.health = Math.min(player.maxHealth, player.health + 22);
    },
  },
  {
    id: "armorGrowth",
    name: "护甲成长",
    description: "护甲 +2。",
    maxLevel: 5,
    apply: (player, session) => {
      player.armor += 2;
    },
  },
  {
    id: "monsterPressure",
    name: "怪物数量增加",
    description: "刷新速度提高 12%，但本局金币奖励额外提高 10%。",
    maxLevel: 4,
    apply: (player, session) => {
      session.spawnRateMultiplier *= 1.12;
      session.coinRewardMultiplier *= 1.1;
    },
  },
  {
    id: "critChance",
    name: "暴击几率成长",
    description: "暴击率提高 8%。",
    maxLevel: 5,
    apply: (player, session) => {
      player.critChance += 0.08;
    },
  },
  {
    id: "critDamage",
    name: "暴击伤害成长",
    description: "暴击伤害倍率提高 0.25。",
    maxLevel: 5,
    apply: (player, session) => {
      player.critDamage += 0.25;
    },
  },
  {
    id: "dodgeGrowth",
    name: "闪避成长",
    description: "闪避率提高 7%。",
    maxLevel: 5,
    apply: (player, session) => {
      player.dodgeChance += 0.07;
    },
  },
  {
    id: "blinkCharge",
    name: "闪现次数增加",
    description: "闪现上限 +1，并立即恢复 1 次。",
    maxLevel: 3,
    apply: (player, session) => {
      player.blinkChargesMax += 1;
      player.blinkCharges = Math.min(player.blinkChargesMax, player.blinkCharges + 1);
    },
  },
];

export const TALENT_LIBRARY = [
  {
    id: "sunheart",
    name: "向阳之心",
    description: "每级额外获得 18 点生命上限。",
    maxLevel: 5,
    baseCost: 40,
    apply: (player, level) => {
      player.maxHealth += level * 18;
      player.health += level * 18;
    },
  },
  {
    id: "swiftLeaf",
    name: "疾风叶鞋",
    description: "每级移动速度提升 5%。",
    maxLevel: 5,
    baseCost: 45,
    apply: (player, level) => {
      player.speed *= 1 + level * 0.05;
    },
  },
  {
    id: "shiningQuill",
    name: "晨光翎羽",
    description: "每级伤害提升 6%。",
    maxLevel: 5,
    baseCost: 55,
    apply: (player, level) => {
      player.attackMultiplier *= 1 + level * 0.06;
    },
  },
  {
    id: "crystalDew",
    name: "露珠晶瓶",
    description: "每级经验获取提升 10%。",
    maxLevel: 5,
    baseCost: 60,
    apply: (player, level) => {
      player.expMultiplier *= 1 + level * 0.1;
    },
  },
  {
    id: "goldPouch",
    name: "松果钱袋",
    description: "每级本局结算金币提升 8%。",
    maxLevel: 5,
    baseCost: 65,
    apply: (player, level, session) => {
      session.coinRewardMultiplier *= 1 + level * 0.08;
    },
  },
];

export const BOOST_CODEX = [
  ...GENERAL_UPGRADES.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    type: "局内成长",
  })),
  ...TALENT_LIBRARY.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    type: "局外天赋",
  })),
];

export function getTalentCost(talent, currentLevel) {
  return talent.baseCost + currentLevel * Math.ceil(talent.baseCost * 0.55);
}

export function getSkillDefinition(skillId) {
  return SKILL_LIBRARY.find((skill) => skill.id === skillId);
}

export function getExclusiveDefinition(exclusiveId) {
  for (const skill of SKILL_LIBRARY) {
    const found = skill.exclusiveUpgrades?.find((exclusive) => exclusive.id === exclusiveId);
    if (found) {
      return found;
    }
  }
  return null;
}

export function getSkillForExclusive(exclusiveId) {
  return SKILL_LIBRARY.find((skill) => skill.exclusiveUpgrades?.some((exclusive) => exclusive.id === exclusiveId)) || null;
}

export function getMonsterDefinition(monsterId) {
  return MONSTER_LIBRARY.find((monster) => monster.id === monsterId);
}

export function createDefaultUnlockState() {
  const skills = {};
  const exclusives = {};
  const disabledExclusives = {};

  for (const skill of SKILL_LIBRARY) {
    skills[skill.id] = Boolean(skill.startsUnlocked);
    for (const exclusive of skill.exclusiveUpgrades || []) {
      exclusives[exclusive.id] = Boolean(exclusive.startsUnlocked);
      disabledExclusives[exclusive.id] = false;
    }
  }

  return {
    skills,
    exclusives,
    disabledExclusives,
  };
}

export function formatDuration(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, "0");
  const remain = String(safeSeconds % 60).padStart(2, "0");
  return `${minutes}:${remain}`;
}