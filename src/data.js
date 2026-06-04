import { REGION_SPECIAL_MONSTERS } from "./garden-data.js";

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
    monsterSpeedMultiplier: Number((0.5 + bonus * 0.02).toFixed(2)),
    spawnRateMultiplier: Number((0.34 + bonus * 0.06).toFixed(2)),
    expMultiplier: Number((1 + bonus * 0.16).toFixed(2)),
    coinMultiplier: Number((1 + bonus * 0.12).toFixed(2)),
    typeAdvanceSeconds: bonus * 80,
    eliteWeightMultiplier: Number((1 + bonus * 0.14).toFixed(2)),
    bossHealthMultiplier: Number((1 + bonus * 0.38).toFixed(2)),
    bossDamageMultiplier: Number((1 + bonus * 0.2).toFixed(2)),
    bossSpeedMultiplier: Number((0.5 + bonus * 0.025).toFixed(2)),
    bossBulletSpeedMultiplier: Number((0.25 + bonus * 0.02).toFixed(2)),
    bossAttackRateMultiplier: Number((1 + bonus * 0.05).toFixed(2)),
  };
}

export function getDifficultySummary(value) {
  const profile = getDifficultyProfile(value);
  const boss = getBossDefinitionForDifficulty(profile.level);
  return `怪物生命 x${profile.monsterHealthMultiplier}，伤害 x${profile.monsterDamageMultiplier}，刷新 x${profile.spawnRateMultiplier}，经验 x${profile.expMultiplier}，金币 x${profile.coinMultiplier}，本级 Boss：${boss?.name || "未知"}。`;
}

export const PLAYER_BASE = {
  maxHealth: 100,
  speed: 100,
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
  healthRegen: 0,
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
    id: "brambleShell",
    name: "棘壳虫兵",
    description: "身披厚荆棘甲壳的精英害虫，移动缓慢但极难击杀。",
    color: "#7a5c3a",
    accent: "#4a3422",
    detailColor: "#d4b896",
    minTime: 0,
    weight: 5,
    health: 240,
    speed: 52,
    damage: 12,
    radius: 20,
    exp: 18,
  },
  {
    id: "sporeDrifter",
    name: "孢尘飘虫",
    description: "体内充满腐蚀性孢子的飞行害虫，死亡时可能留下毒雾。",
    color: "#a3b87c",
    accent: "#6e8048",
    detailColor: "#e3f0c7",
    minTime: 0,
    weight: 4,
    health: 320,
    speed: 64,
    damage: 14,
    radius: 18,
    exp: 22,
  },
  {
    id: "mossColossus",
    name: "苔岩巨虫",
    description: "被厚厚苔藓覆盖的巨型甲虫，是虫群中的移动堡垒。",
    color: "#6b8f5e",
    accent: "#3d5e32",
    detailColor: "#cde0bd",
    minTime: 0,
    weight: 3,
    health: 480,
    speed: 48,
    damage: 18,
    radius: 24,
    exp: 30,
  },
  {
    id: "crystalWeaver",
    name: "晶梭虫",
    description: "能结出透明晶丝的异变害虫，在战场上织出致命的晶网。",
    color: "#9ac7e8",
    accent: "#5186a8",
    detailColor: "#daeeff",
    minTime: 0,
    weight: 2,
    health: 560,
    speed: 70,
    damage: 16,
    radius: 16,
    exp: 28,
  },
  ...REGION_SPECIAL_MONSTERS,
  {
    id: "budSentinel",
    name: "萌芽守门人",
    description: "Lv.10 的终局 Boss，会用扇形花瓣弹持续封锁正面路线。",
    color: "#98d169",
    accent: "#547e34",
    detailColor: "#eff9c9",
    minTime: ROUND_DURATION_SECONDS,
    weight: 0,
    health: 312500000,
    speed: 92,
    damage: 66,
    radius: 124,
    exp: 1000,
    boss: true,
    bossTier: 10,
    shapeId: "budSentinel",
    attackPattern: "petalFan",
  },
  {
    id: "clockvineSerpent",
    name: "藤钟长蛇",
    description: "Lv.1 的起始 Boss，会持续甩出旋转藤种弹幕。",
    color: "#83bc76",
    accent: "#426646",
    detailColor: "#e3f5d6",
    minTime: ROUND_DURATION_SECONDS,
    weight: 0,
    health: 50000,
    speed: 58,
    damage: 16,
    radius: 56,
    exp: 160,
    boss: true,
    bossTier: 1,
    shapeId: "clockvineSerpent",
    attackPattern: "spiralBloom",
  },
  {
    id: "amberShellCrab",
    name: "琥珀壳将",
    description: "Lv.2 的甲壳 Boss，会交替释放十字与斜线碎壳。",
    color: "#efb35f",
    accent: "#8e5b26",
    detailColor: "#ffe3a8",
    minTime: ROUND_DURATION_SECONDS,
    weight: 0,
    health: 1000000,
    speed: 68,
    damage: 20,
    radius: 62,
    exp: 200,
    boss: true,
    bossTier: 2,
    shapeId: "amberShellCrab",
    attackPattern: "crossBurst",
  },
  {
    id: "moonpetalMoth",
    name: "月瓣蛾后",
    description: "Lv.3 的飞翼 Boss，会撒出缓慢追踪的月鳞群。",
    color: "#c9a3ef",
    accent: "#7454a8",
    detailColor: "#f3dcff",
    minTime: ROUND_DURATION_SECONDS,
    weight: 0,
    health: 1000000,
    speed: 70,
    damage: 24,
    radius: 70,
    exp: 240,
    boss: true,
    bossTier: 3,
    shapeId: "moonpetalMoth",
    attackPattern: "mothSwarm",
  },
  {
    id: "prismStag",
    name: "棱镜鹿王",
    description: "Lv.4 的角冠 Boss，会从两侧射出分镜棱枪。",
    color: "#6dc6ff",
    accent: "#2e6e9e",
    detailColor: "#dff6ff",
    minTime: ROUND_DURATION_SECONDS,
    weight: 0,
    health: 1000000,
    speed: 74,
    damage: 30,
    radius: 76,
    exp: 290,
    boss: true,
    bossTier: 4,
    shapeId: "prismStag",
    attackPattern: "prismLance",
  },
  {
    id: "myceliumLord",
    name: "沼孢菌主",
    description: "Lv.5 的菌伞 Boss，会吐出会裂变的毒孢。",
    color: "#a8c270",
    accent: "#5f6f32",
    detailColor: "#f0f5c9",
    minTime: ROUND_DURATION_SECONDS,
    weight: 0,
    health: 1000000,
    speed: 78,
    damage: 36,
    radius: 86,
    exp: 360,
    boss: true,
    bossTier: 5,
    shapeId: "myceliumLord",
    attackPattern: "sporeBurst",
  },
  {
    id: "tempestTulip",
    name: "风暴郁金统领",
    description: "Lv.6 的风暴 Boss，会放出双层反向风轮。",
    color: "#ff9e7a",
    accent: "#b45535",
    detailColor: "#ffe1d4",
    minTime: ROUND_DURATION_SECONDS,
    weight: 0,
    health: 1000000,
    speed: 76,
    damage: 42,
    radius: 96,
    exp: 450,
    boss: true,
    bossTier: 6,
    shapeId: "tempestTulip",
    attackPattern: "tempestWheel",
  },
  {
    id: "eclipsePeony",
    name: "蚀光牡丹",
    description: "Lv.7 的暗蚀 Boss，会召下多段蚀月轰击。",
    color: "#f06f9f",
    accent: "#8f244d",
    detailColor: "#ffd5e4",
    minTime: ROUND_DURATION_SECONDS,
    weight: 0,
    health: 1000000,
    speed: 82,
    damage: 48,
    radius: 104,
    exp: 560,
    boss: true,
    bossTier: 7,
    shapeId: "eclipsePeony",
    attackPattern: "eclipseRain",
  },
  {
    id: "voidLantern",
    name: "虚灯古树",
    description: "Lv.8 的古树 Boss，会织出大范围灯阵弹墙。",
    color: "#8aa2ff",
    accent: "#3a4c98",
    detailColor: "#dfe5ff",
    minTime: ROUND_DURATION_SECONDS,
    weight: 0,
    health: 1000000,
    speed: 86,
    damage: 54,
    radius: 110,
    exp: 680,
    boss: true,
    bossTier: 8,
    shapeId: "voidLantern",
    attackPattern: "lanternWall",
  },
  {
    id: "twilightMower",
    name: "黄昏收割者",
    description: "Lv.9 的收割 Boss，拥有复合弹幕与超巨体型。",
    color: "#e85f6a",
    accent: "#97212f",
    detailColor: "#ffd5c5",
    minTime: ROUND_DURATION_SECONDS,
    weight: 0,
    health: 1000000,
    speed: 90,
    damage: 60,
    radius: 116,
    exp: 820,
    boss: true,
    bossTier: 9,
    shapeId: "twilightMower",
    attackPattern: "cataclysm",
  },
];

const REGION_BOSS_EXPANSION = [
  ["glasshouseMonarch", "Glasshouse Monarch", "A crystal-wing garden tyrant that refracts the restored greenhouse light into lance volleys.", "#7fd8ff", "#2d7898", "#e6fbff", 11, "prismStag", "prismLance"],
  ["honeycombMatron", "Honeycomb Matron", "A golden brood queen that seals paths with amber cross shots and sticky shell guards.", "#f2bd62", "#935f24", "#fff0bd", 12, "amberShellCrab", "crossBurst"],
  ["rainrootHydra", "Rainroot Hydra", "A many-headed root beast that grows spiral seed barrages from wet soil.", "#79c88e", "#3f7951", "#e4ffe9", 13, "clockvineSerpent", "spiralBloom"],
  ["orchidWaltzer", "Orchid Waltzer", "A graceful orchid boss that throws drifting moth petals in sweeping dance patterns.", "#d59cff", "#744ca6", "#f6ddff", 14, "moonpetalMoth", "mothSwarm"],
  ["brambleCrown", "Bramble Crown", "A thorn-crowned war bug that fires petal fans from a living crown of briars.", "#9bcf63", "#4c7b31", "#f3ffd5", 15, "budSentinel", "petalFan"],
  ["dewdropColossus", "Dewdrop Colossus", "A heavy dew-armored beetle that splits toxic spores across the field.", "#9fd9d1", "#3e817a", "#e5fffb", 16, "myceliumLord", "sporeBurst"],
  ["stormglassRook", "Stormglass Rook", "A rook-shaped invader that spins twin wheels of charged petals.", "#8eb8ff", "#3f5ca6", "#e2ebff", 17, "tempestTulip", "tempestWheel"],
  ["moonwellSiren", "Moonwell Siren", "A moonlit boss that calls down eclipse rain from the garden well.", "#ef8fbd", "#8c315a", "#ffe0ef", 18, "eclipsePeony", "eclipseRain"],
  ["lanternMimic", "Lantern Mimic", "A false garden lantern that builds bright walls of spectral fire.", "#9ba8ff", "#3c4c9a", "#e8ebff", 19, "voidLantern", "lanternWall"],
  ["harvestReaper", "Harvest Reaper", "A festival reaper with combined twilight bullet patterns and scythe petals.", "#ee7175", "#9b2630", "#ffd8cf", 20, "twilightMower", "cataclysm"],
  ["seedvaultTitan", "Seedvault Titan", "A vault guardian that protects corrupted seeds behind massive petal fans.", "#b0d66b", "#657d2e", "#f8ffd8", 21, "budSentinel", "petalFan"],
  ["pearlShellDuke", "Pearl Shell Duke", "A polished shell noble that breaks the lane with crossing pearl shards.", "#efc980", "#8f6428", "#fff1ca", 22, "amberShellCrab", "crossBurst"],
  ["clockworkIvy", "Clockwork Ivy", "A clockwork vine serpent that winds spiral bullets through the garden paths.", "#78b983", "#3a6f4b", "#e0f8dd", 23, "clockvineSerpent", "spiralBloom"],
  ["mothOperaDiva", "Moth Opera Diva", "A velvet-wing singer whose notes become homing moth swarms.", "#c6a0f2", "#6750a7", "#f3e0ff", 24, "moonpetalMoth", "mothSwarm"],
  ["prismAntlerKing", "Prism Antler King", "A late-game prism stag that fires wider mirror lances from both flanks.", "#74d1ff", "#2c6f9a", "#e5f9ff", 25, "prismStag", "prismLance"],
  ["sporeTeaLord", "Spore Tea Lord", "A mushroom host that pours splitting spores like poisonous tea.", "#b5c978", "#607333", "#f6fad0", 26, "myceliumLord", "sporeBurst"],
  ["tulipTempestDuchess", "Tulip Tempest Duchess", "A storm tulip ruler that turns the arena into a double wind wheel.", "#ffab86", "#a34d2d", "#ffe5da", 27, "tempestTulip", "tempestWheel"],
  ["eclipseBloomOracle", "Eclipse Bloom Oracle", "A dark-pink oracle that predicts movement with falling eclipse blooms.", "#f073a4", "#8d2651", "#ffdce9", 28, "eclipsePeony", "eclipseRain"],
  ["blueflameArbor", "Blueflame Arbor", "An ancient blueflame tree that lays lantern walls across escape routes.", "#8da5ff", "#374c9d", "#e3e9ff", 29, "voidLantern", "lanternWall"],
  ["twilightScissorQueen", "Twilight Scissor Queen", "A huge scissor-wing queen using layered cataclysm barrages.", "#ef6872", "#992334", "#ffd6cf", 30, "twilightMower", "cataclysm"],
  ["royalBudEngine", "Royal Bud Engine", "A mechanical bud boss that opens and closes with fan-shaped seed fire.", "#a8d46b", "#587c2f", "#f6ffd9", 31, "budSentinel", "petalFan"],
  ["amberClockCrab", "Amber Clock Crab", "A final-row shell boss that alternates diagonal and straight amber bursts.", "#f1b86b", "#8d5720", "#ffe8b5", 32, "amberShellCrab", "crossBurst"],
  ["auroraMothCrown", "Aurora Moth Crown", "A crowned moth wrapped in aurora dust and persistent homing wings.", "#c9a9ff", "#7050b0", "#f5e5ff", 33, "moonpetalMoth", "mothSwarm"],
  ["grandPrismKeeper", "Grand Prism Keeper", "A mirror garden keeper that focuses three crystal lances at once.", "#72cbff", "#2e6f9a", "#e3f8ff", 34, "prismStag", "prismLance"],
  ["lastLanternRoot", "Last Lantern Root", "A penultimate root lantern that cages the garden with blue light walls.", "#92a7ff", "#344999", "#e5eaff", 35, "voidLantern", "lanternWall"],
  ["heartcoreDevourer", "Heartcore Devourer", "The final invader, combining twilight pressure with the corrupted heartcore pulse.", "#f05f6c", "#952232", "#ffd8cb", 36, "twilightMower", "cataclysm"],
];

MONSTER_LIBRARY.push(
  ...REGION_BOSS_EXPANSION.map(([id, name, description, color, accent, detailColor, tier], index) => ({
    id,
    name,
    description,
    color,
    accent,
    detailColor,
    minTime: ROUND_DURATION_SECONDS,
    weight: 0,
    health: Math.round(1200000 + index * 420000),
    speed: 66 + (index % 9) * 3,
    damage: 22 + index * 2,
    radius: 64 + Math.min(62, index * 2),
    exp: 240 + index * 34,
    boss: true,
    bossTier: tier,
    shapeId: id,
    attackPattern: `advancedBoss-${index + 11}`,
  })),
);

export const ELITE_MONSTER_DEFINITION = {
  id: "gardenElite",
  name: "庭域巨祟",
  description: "每隔 3 分钟出现一次的精英害虫，移动缓慢、体型庞大、生命极高，击败后可获得局内特殊增益。",
  color: "#f4b76b",
  accent: "#8d4f22",
  detailColor: "#fff2c7",
  health: 14000,
  speed: 34,
  damage: 10,
  radius: 34,
  exp: 42,
  elite: true,
  shapeId: "eliteBrute",
};

export const SKILL_LIBRARY = [
  {
    id: "elfArrow",
    name: "精灵箭术",
    description: "凝聚风元素形成箭矢，朝最近敌人连射灵风箭，兼具稳定射程与中距离压制能力。",
    color: "#8fdfff",
    unlockCost: 0,
    starterExclusiveId: "arrowPierce",
    maxLevel: 5,
    statsByLevel: [
      { cooldown: 2.64, damage: 56, count: 1, speed: 520, pierce: 0, size: 9, range: 228 },
      { cooldown: 2.44, damage: 60, count: 1, speed: 545, pierce: 0, size: 9, range: 270 },
      { cooldown: 2.28, damage: 80, count: 2, speed: 570, pierce: 1, size: 10, range: 279 },
      { cooldown: 2.12, damage: 106, count: 2, speed: 595, pierce: 1, size: 10, range: 288 },
      { cooldown: 1.96, damage: 132, count: 3, speed: 620, pierce: 2, size: 11, range: 297 },
    ],
    exclusiveUpgrades: [
      {
        id: "arrowPierce",
        name: "流风破甲",
        description: "灵风箭额外获得穿透层数。",
        maxLevel: 3,
        unlockCost: 0,
        startsUnlocked: true,
      },
      {
        id: "arrowTracking",
        name: "风眼锁定",
        description: "箭矢会自动微调轨迹，优先命中不同目标。",
        maxLevel: 1,
        unlockCost: 120,
      },
      {
        id: "arrowVolley",
        name: "林隙齐射",
        description: "每级额外发射 1 支灵风箭。",
        maxLevel: 2,
        unlockCost: 150,
      },
      {
        id: "arrowTailwind",
        name: "尾流加护",
        description: "提升箭矢飞行速度与最大射程。",
        maxLevel: 2,
        unlockCost: 110,
      },
      {
        id: "arrowBurst",
        name: "花冠裂风",
        description: "箭矢伤害显著提升，并带有更强的击退势能。",
        maxLevel: 2,
        unlockCost: 130,
      },
    ],
  },
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
      { cooldown: 5, damage: 16, radius: 45, duration: 4.4, count: 1, tickInterval: 0.42 },
      { cooldown: 4.55, damage: 22, radius: 49, duration: 4.9, count: 1, tickInterval: 0.4 },
      { cooldown: 4.1, damage: 30, radius: 53, duration: 5.4, count: 2, tickInterval: 0.38 },
      { cooldown: 3.7, damage: 40, radius: 57, duration: 5.9, count: 2, tickInterval: 0.36 },
      { cooldown: 3.3, damage: 52, radius: 62, duration: 6.4, count: 2, tickInterval: 0.34 },
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
  {
    id: "vineSnare",
    name: "藤鞭绞猎",
    description: "向附近怪物甩出带刺藤鞭，瞬间抽打并缠住目标。",
    color: "#74c26a",
    unlockCost: 340,
    starterExclusiveId: "vineCount",
    maxLevel: 5,
    statsByLevel: [
      { cooldown: 3.6, damage: 48, count: 2, range: 280, root: 0.9, bloomRadius: 52 },
      { cooldown: 3.2, damage: 62, count: 2, range: 310, root: 1.02, bloomRadius: 56 },
      { cooldown: 2.85, damage: 80, count: 3, range: 340, root: 1.14, bloomRadius: 60 },
      { cooldown: 2.55, damage: 101, count: 3, range: 375, root: 1.28, bloomRadius: 64 },
      { cooldown: 2.25, damage: 126, count: 4, range: 410, root: 1.42, bloomRadius: 70 },
    ],
    exclusiveUpgrades: [
      {
        id: "vineCount",
        name: "繁缠分枝",
        description: "每级额外增加 2 条藤鞭。",
        maxLevel: 2,
        unlockCost: 0,
      },
      {
        id: "vineRoot",
        name: "盘绕定身",
        description: "延长缠绕时间，并额外提高抽打伤害。",
        maxLevel: 2,
        unlockCost: 120,
      },
      {
        id: "vineBloom",
        name: "荆花爆绽",
        description: "藤鞭命中处会炸开花棘，对周围敌人造成额外伤害。",
        maxLevel: 2,
        unlockCost: 140,
      },
    ],
  },
  {
    id: "meteorSeed",
    name: "彗种坠雨",
    description: "召来带尾焰的种星，从空中坠落并砸向敌群。",
    color: "#ff9867",
    unlockCost: 360,
    starterExclusiveId: "meteorCount",
    maxLevel: 5,
    statsByLevel: [
      { cooldown: 5.4, damage: 70, radius: 54, count: 1, fallTime: 0.82 },
      { cooldown: 4.95, damage: 92, radius: 60, count: 1, fallTime: 0.74 },
      { cooldown: 4.5, damage: 118, radius: 66, count: 2, fallTime: 0.66 },
      { cooldown: 4.05, damage: 148, radius: 72, count: 2, fallTime: 0.58 },
      { cooldown: 3.65, damage: 184, radius: 80, count: 3, fallTime: 0.5 },
    ],
    exclusiveUpgrades: [
      {
        id: "meteorCount",
        name: "流星育种",
        description: "每级额外追加 1 枚种星。",
        maxLevel: 2,
        unlockCost: 0,
      },
      {
        id: "meteorScorch",
        name: "焦土花坑",
        description: "种星坠地后留下灼烧花坑。",
        maxLevel: 2,
        unlockCost: 120,
      },
      {
        id: "meteorShard",
        name: "碎芒迸射",
        description: "种星撞击后会向外迸出碎芒破片。",
        maxLevel: 2,
        unlockCost: 140,
      },
    ],
  },
  {
    id: "ribbonBlade",
    name: "绫刃回潮",
    description: "抛出回旋丝刃，飞出后折返角色并沿途反复切割。",
    color: "#8f9fff",
    unlockCost: 380,
    starterExclusiveId: "ribbonCount",
    maxLevel: 5,
    statsByLevel: [
      { cooldown: 2.95, damage: 32, count: 1, speed: 360, size: 10, range: 250, pierce: 2 },
      { cooldown: 2.6, damage: 44, count: 1, speed: 385, size: 11, range: 270, pierce: 2 },
      { cooldown: 2.28, damage: 58, count: 2, speed: 410, size: 12, range: 290, pierce: 2 },
      { cooldown: 1.98, damage: 74, count: 2, speed: 435, size: 13, range: 315, pierce: 3 },
      { cooldown: 1.72, damage: 92, count: 3, speed: 460, size: 14, range: 340, pierce: 3 },
    ],
    exclusiveUpgrades: [
      {
        id: "ribbonCount",
        name: "绫轮增幅",
        description: "每级额外增加 1 枚回旋丝刃。",
        maxLevel: 2,
        unlockCost: 0,
      },
      {
        id: "ribbonReturn",
        name: "回潮切返",
        description: "返程速度、伤害与穿透能力都会增强。",
        maxLevel: 2,
        unlockCost: 120,
      },
      {
        id: "ribbonFray",
        name: "碎绫飞岚",
        description: "丝刃命中时会裂出侧向碎绫。",
        maxLevel: 2,
        unlockCost: 140,
      },
    ],
  },
  {
    id: "lotusBeacon",
    name: "莲灯守望",
    description: "在战场点亮莲灯，持续锁定附近敌人并射出灵辉。",
    color: "#f4c86d",
    unlockCost: 400,
    starterExclusiveId: "lotusCount",
    maxLevel: 5,
    statsByLevel: [
      { cooldown: 6.2, damage: 26, count: 1, duration: 6.2, interval: 0.95, range: 250 },
      { cooldown: 5.6, damage: 34, count: 1, duration: 6.8, interval: 0.88, range: 280 },
      { cooldown: 5.0, damage: 44, count: 2, duration: 7.4, interval: 0.8, range: 310 },
      { cooldown: 4.45, damage: 56, count: 2, duration: 8.0, interval: 0.72, range: 340 },
      { cooldown: 3.95, damage: 70, count: 2, duration: 8.8, interval: 0.64, range: 380 },
    ],
    exclusiveUpgrades: [
      {
        id: "lotusCount",
        name: "双芯点灯",
        description: "每级额外点亮 1 盏莲灯。",
        maxLevel: 2,
        unlockCost: 0,
      },
      {
        id: "lotusChain",
        name: "莲辉转经",
        description: "莲灯射出的灵辉会继续跳向附近敌人。",
        maxLevel: 2,
        unlockCost: 120,
      },
      {
        id: "lotusWard",
        name: "心莲护祷",
        description: "灵辉命中后减速敌人，并为角色回复少量生命。",
        maxLevel: 2,
        unlockCost: 140,
      },
    ],
  },
];

const ADVANCED_SKILL_BLUEPRINTS = [
  ["glassPrismRay", "Glass Prism Ray", "Fires polished greenhouse light bolts that split through clustered invaders.", "#7fd8ff", "beam"],
  ["honeyBomb", "Honey Bomb", "Launches sticky honey bombs that burst into slowing splash damage.", "#f0b95f", "lobbedBomb"],
  ["rainRootSigil", "Rain Root Sigil", "Plants soft rain circles that damage and slow enemies in cute 3D puddles.", "#78d4b5", "field"],
  ["orchidComet", "Orchid Comet", "Calls orchid-tinted falling stars from the sky.", "#d69cff", "meteor"],
  ["brambleBoomerang", "Bramble Boomerang", "Throws a curved bramble blade that returns through the enemy wave.", "#9bcf63", "boomerang"],
  ["dewdropMine", "Dewdrop Mine", "Places glossy dew mines that pop when enemies step close.", "#8adfd6", "mine"],
  ["stormRibbon", "Storm Ribbon", "Drops charged ribbon lightning on the nearest enemy cluster.", "#9fb8ff", "strike"],
  ["moonwellSnare", "Moonwell Snare", "Snaps moonlit vines around priority targets and blooms on impact.", "#ef91c2", "snare"],
  ["lanternSpark", "Lantern Spark", "Shoots warm lantern sparks that chain through nearby invaders.", "#f4c86d", "beam"],
  ["harvestCrescent", "Harvest Crescent", "Throws harvest crescent blades that slice out and return.", "#ee7778", "boomerang"],
  ["seedvaultPulse", "Seedvault Pulse", "Releases a protective seed pulse around the player.", "#badb69", "pulse"],
  ["pearlBubble", "Pearl Bubble", "Fires pearl bubbles that burst into soft splash rings.", "#f1d18a", "lobbedBomb"],
  ["clockIvyLash", "Clock Ivy Lash", "Whips nearby enemies with timed ivy snares.", "#7bc489", "snare"],
  ["operaMothBlade", "Opera Moth Blade", "Sends musical moth blades outward and pulls them back.", "#c6a0f2", "boomerang"],
  ["antlerBolt", "Antler Bolt", "Shoots bright prism antler bolts at the nearest invader.", "#73d1ff", "beam"],
  ["sporeTeacupMine", "Spore Teacup Mine", "Sets tiny teacup mushroom mines that burst into spores.", "#b8c978", "mine"],
  ["tulipThunder", "Tulip Thunder", "Calls tulip-shaped lightning strikes with a short warning mark.", "#ffab86", "strike"],
  ["eclipsePetalRain", "Eclipse Petal Rain", "Drops dark-pink meteor petals from above.", "#f073a4", "meteor"],
  ["blueflameGarden", "Blueflame Garden", "Paints blue lantern fields that burn and slow enemies.", "#92a7ff", "field"],
  ["scissorVine", "Scissor Vine", "Cuts into enemies with snapping twilight vines.", "#ef6872", "snare"],
  ["royalBudPulse", "Royal Bud Pulse", "Expands a royal bud shockwave from the player.", "#a8d46b", "pulse"],
  ["amberGearBurst", "Amber Gear Burst", "Launches amber gear bombs that pop with toy-like splash damage.", "#f1b86b", "lobbedBomb"],
  ["auroraNeedle", "Aurora Needle", "Shoots aurora needles with clean long-range pressure.", "#c9a9ff", "beam"],
  ["grandPrismMeteor", "Grand Prism Meteor", "Calls heavy prism meteors for final-row burst damage.", "#72cbff", "meteor"],
];

function createAdvancedStats(behavior, index) {
  const scale = 1 + index * 0.028;
  const cooldownOffset = index * 0.018;
  const templates = {
    beam: (level) => ({ cooldown: 1.7 - level * 0.14 - cooldownOffset, damage: Math.round((34 + level * 16) * scale), count: 1 + Math.floor(level / 2), speed: 620 + level * 26, pierce: level >= 3 ? 2 : 1, size: 8 + level, range: 430 + level * 34 }),
    lobbedBomb: (level) => ({ cooldown: 3.1 - level * 0.18 - cooldownOffset, damage: Math.round((46 + level * 18) * scale), count: 1 + Math.floor(level / 2), speed: 250 + level * 18, size: 13 + level, splash: 48 + level * 8, range: 290 + level * 18 }),
    field: (level) => ({ cooldown: 4.2 - level * 0.2 - cooldownOffset, damage: Math.round((14 + level * 8) * scale), count: 1 + Math.floor(level / 2), radius: 68 + level * 12, duration: 3.6 + level * 0.45, tickInterval: 0.42 }),
    meteor: (level) => ({ cooldown: 5.3 - level * 0.25 - cooldownOffset, damage: Math.round((72 + level * 26) * scale), radius: 50 + level * 8, count: 1 + Math.floor(level / 2), fallTime: 0.86 - level * 0.06 }),
    boomerang: (level) => ({ cooldown: 2.8 - level * 0.16 - cooldownOffset, damage: Math.round((30 + level * 14) * scale), count: 1 + Math.floor(level / 2), speed: 360 + level * 24, size: 10 + level, range: 250 + level * 24, pierce: 2 + Math.floor(level / 2) }),
    mine: (level) => ({ cooldown: 4.5 - level * 0.24 - cooldownOffset, damage: Math.round((70 + level * 24) * scale), radius: 58 + level * 9, count: 1 + Math.floor(level / 2), armTime: 0.58 - level * 0.035, duration: 7.5 + level * 0.65 }),
    strike: (level) => ({ cooldown: 3.8 - level * 0.19 - cooldownOffset, damage: Math.round((58 + level * 22) * scale), count: 1 + Math.floor(level / 2), radius: 54 + level * 8, delay: 0.52 - level * 0.035 }),
    snare: (level) => ({ cooldown: 3.5 - level * 0.18 - cooldownOffset, damage: Math.round((44 + level * 16) * scale), count: 2 + Math.floor(level / 2), range: 270 + level * 30, root: 0.78 + level * 0.12, bloomRadius: 48 + level * 6 }),
    pulse: (level) => ({ cooldown: 4.0 - level * 0.18 - cooldownOffset, damage: Math.round((40 + level * 18) * scale), radius: 118 + level * 18, waves: 1 + Math.floor(level / 2), growth: 300 + level * 28 }),
  };
  return Array.from({ length: 5 }, (_, index) => {
    const level = index + 1;
    const stats = templates[behavior](level);
    if (typeof stats.cooldown === "number") {
      stats.cooldown = Number(Math.max(0.65, stats.cooldown).toFixed(2));
    }
    if (typeof stats.fallTime === "number") {
      stats.fallTime = Number(Math.max(0.42, stats.fallTime).toFixed(2));
    }
    if (typeof stats.armTime === "number") {
      stats.armTime = Number(Math.max(0.32, stats.armTime).toFixed(2));
    }
    if (typeof stats.delay === "number") {
      stats.delay = Number(Math.max(0.28, stats.delay).toFixed(2));
    }
    return stats;
  });
}

function createAdvancedSkill([id, name, description, color, behavior], index) {
  return {
    id,
    name,
    description,
    color,
    advancedBehavior: behavior,
    unlockCost: 420 + index * 28,
    maxLevel: 5,
    statsByLevel: createAdvancedStats(behavior, index),
    exclusiveUpgrades: [
      {
        id: `${id}Focus`,
        name: "Signature Focus",
        description: "Improves the signature skill's base damage through focused garden energy.",
        maxLevel: 2,
        unlockCost: 120 + index * 4,
      },
      {
        id: `${id}Tempo`,
        name: "Cute Tempo",
        description: "Improves the skill rhythm and makes repeated casts feel snappier.",
        maxLevel: 2,
        unlockCost: 140 + index * 4,
      },
    ],
  };
}

SKILL_LIBRARY.push(...ADVANCED_SKILL_BLUEPRINTS.map(createAdvancedSkill));

export const GENERAL_UPGRADES = [
  {
    id: "attackGrowth",
    name: "攻击成长",
    description: "伤害提高 14%。",
    maxLevel: 10,
    apply: (player, session) => {
      player.attackMultiplier *= 1.14;
    },
  },
  {
    id: "moveSpeed",
    name: "移速成长",
    description: "移动速度提高 10%。",
    maxLevel: 8,
    apply: (player, session) => {
      player.speed *= 1.1;
    },
  },
  {
    id: "attackRange",
    name: "攻击范围成长",
    description: "攻击范围提高 11%。",
    maxLevel: 7,
    apply: (player, session) => {
      player.rangeMultiplier *= 1.11;
    },
  },
  {
    id: "cooldownReduction",
    name: "冷却缩减",
    description: "技能冷却减少 6%。",
    maxLevel: 8,
    apply: (player, session) => {
      player.cooldownScale *= 0.94;
    },
  },
  {
    id: "expGrowth",
    name: "经验获取成长",
    description: "经验收益提高 16%。",
    maxLevel: 7,
    apply: (player, session) => {
      player.expMultiplier *= 1.16;
    },
  },
  {
    id: "expPickupRange",
    name: "吸取经验范围",
    description: "经验球会在更远距离被吸向角色。",
    maxLevel: 8,
    apply: (player, session) => {
      player.expPickupRange *= 1.22;
    },
  },
  {
    id: "projectileSpeed",
    name: "弹道速度成长",
    description: "飞行类技能速度提高 12%。",
    maxLevel: 7,
    apply: (player, session) => {
      player.projectileSpeedMultiplier *= 1.12;
    },
  },
  {
    id: "projectileSize",
    name: "抛射物体积成长",
    description: "投射物体积提高 10%。",
    maxLevel: 7,
    apply: (player, session) => {
      player.projectileSizeMultiplier *= 1.1;
    },
  },
  {
    id: "healthGrowth",
    name: "生命成长",
    description: "生命上限 +18，并回复同等生命。",
    maxLevel: 8,
    apply: (player, session) => {
      player.maxHealth += 18;
      player.health = Math.min(player.maxHealth, player.health + 18);
    },
  },
  {
    id: "armorGrowth",
    name: "护甲成长",
    description: "护甲 +1。",
    maxLevel: 8,
    apply: (player, session) => {
      player.armor += 1;
    },
  },
  {
    id: "healthRegenGrowth",
    name: "生命恢复成长",
    description: "生命恢复 +0.1 / 秒。",
    maxLevel: 8,
    apply: (player, session) => {
      player.healthRegen += 0.1;
    },
  },
  {
    id: "monsterPressure",
    name: "怪物数量增加",
    description: "刷新速度提高 10%，但本局金币奖励额外提高 8%。",
    maxLevel: 6,
    apply: (player, session) => {
      session.spawnRateMultiplier *= 1.1;
      session.coinRewardMultiplier *= 1.08;
    },
  },
  {
    id: "minuteVacuum",
    name: "时针虹吸",
    description: "每过 60 秒，自动吸取地图上的全部经验点。",
    maxLevel: 1,
    apply: (player, session) => {
      session.expVacuumEnabled = true;
      session.expVacuumInterval = 60;
      session.expVacuumTimer = 60;
    },
  },
  {
    id: "projectileOverload",
    name: "弹幕扩编",
    description: "投射物数量 +1，但怪物数量 +5%。",
    maxLevel: 3,
    apply: (player, session) => {
      player.projectileCountBonus += 1;
      session.spawnRateMultiplier *= 1.05;
    },
  },
  {
    id: "summonOverload",
    name: "召群扩列",
    description: "召唤物数量 +1，但怪物数量 +5%。",
    maxLevel: 3,
    apply: (player, session) => {
      player.summonCountBonus += 1;
      session.spawnRateMultiplier *= 1.05;
    },
  },
  {
    id: "critChance",
    name: "暴击几率成长",
    description: "暴击率提高 6%。",
    maxLevel: 7,
    apply: (player, session) => {
      player.critChance += 0.06;
    },
  },
  {
    id: "critDamage",
    name: "暴击伤害成长",
    description: "暴击伤害倍率提高 0.18。",
    maxLevel: 7,
    apply: (player, session) => {
      player.critDamage += 0.18;
    },
  },
  {
    id: "dodgeGrowth",
    name: "闪避成长",
    description: "闪避率提高 5%。",
    maxLevel: 7,
    apply: (player, session) => {
      player.dodgeChance += 0.05;
    },
  },
  {
    id: "blinkCharge",
    name: "闪现次数增加",
    description: "闪现上限 +1，并立即恢复 1 次。",
    maxLevel: 4,
    apply: (player, session) => {
      player.blinkChargesMax += 1;
      player.blinkCharges = Math.min(player.blinkChargesMax, player.blinkCharges + 1);
    },
  },
];

export const SPECIAL_BOON_LIBRARY = [
  {
    id: "multicast",
    name: "多重",
    description: "每次触发技能时有 50% 概率额外触发一次，并尽量锁定不同敌人。",
  },
  {
    id: "phaseFade",
    name: "虚化",
    description: "每隔 10 秒进入 3 秒虚化状态，角色半透明并无视所有伤害。",
  },
  {
    id: "chainTrigger",
    name: "连锁",
    description: "每次触发技能时有 20% 概率随机触发一个冷却中的其他技能。多重额外触发不会再连锁。",
  },
  {
    id: "safeTeleport",
    name: "传送",
    description: "闪现替换为传送，使用后会随机传送到一个相对安全的位置。",
  },
  {
    id: "mirrorImage",
    name: "镜像",
    description: "使用闪现或传送后，在原地留下持续 5 秒的镜像。镜像复制当时本体的技能与属性，会自动攻击，且不会被攻击。",
  },
  {
    id: "echoSpiral",
    name: "残响回旋",
    description: "投射物或技能命中敌人后有 5% 概率在命中点产生残响。残响沿原方向再次释放，初始伤害为 40%，最多连续残响 3 次，每次再衰减 20%，且不会触发其他概率效果。",
  },
  {
    id: "timeDebt",
    name: "时间债务",
    description: "每击杀一个敌人获得 0.2 秒时间信贷。信贷累积到 100 秒时触发 5 秒时停，期间所有敌人和弹幕停止移动，只有你能自由行动。时停结束后信贷清空。",
  },
  {
    id: "emberSeed",
    name: "余烬之种",
    description: "击杀敌人时有 30% 概率留下种子。3 秒后爆炸；若你提前站在上面 1 秒，则成长为持续 8 秒的余烬之树，但自身移速永久降低 5%，最多叠加 5 次。",
  },
  {
    id: "entropyShield",
    name: "熵能护盾",
    description: "获得一个等于最大生命值 50% 的护盾，护盾会衰减并优先吸收伤害。护盾吸伤时提供熵增层数增伤；护盾归零时受到伤害提高 30%，击杀敌人可回复护盾。",
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
    id: "verdantMend",
    name: "晨露回春",
    description: "每级每秒恢复 0.1 生命。",
    maxLevel: 5,
    baseCost: 50,
    apply: (player, level) => {
      player.healthRegen += level * 0.1;
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
  ...SPECIAL_BOON_LIBRARY.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    type: "精英增益",
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

export function getSkillRuntimeId(skillId) {
  const definition = getSkillDefinition(skillId);
  return definition?.baseSkillId || skillId;
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

export function getBossDefinitionForDifficulty(value) {
  const level = normalizeDifficultyLevel(value);
  return MONSTER_LIBRARY.find((monster) => monster.boss && monster.bossTier === level) || getMonsterDefinition("twilightMower");
}

export function getSpecialBoonDefinition(boonId) {
  return SPECIAL_BOON_LIBRARY.find((boon) => boon.id === boonId) || null;
}

export function normalizeInitialSkillId(value, unlocks) {
  const fallback = "flyingSword";
  const definition = getSkillDefinition(value);
  if (!definition) {
    return fallback;
  }

  const unlocked = unlocks ? Boolean(unlocks.skills?.[definition.id] || definition.startsUnlocked) : Boolean(definition.startsUnlocked);
  return unlocked ? definition.id : fallback;
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
