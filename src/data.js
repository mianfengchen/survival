import { REGION_SPECIAL_MONSTERS } from "./garden-data.js";
import { SKILL_LIBRARY } from "./skills.js";
export { SKILL_LIBRARY };

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
    monsterSpeedMultiplier: Number((0.64 + bonus * 0.025).toFixed(2)),
    spawnRateMultiplier: Number((0.42 + bonus * 0.055).toFixed(2)),
    expMultiplier: Number((1 + bonus * 0.16).toFixed(2)),
    coinMultiplier: Number((1 + bonus * 0.12).toFixed(2)),
    typeAdvanceSeconds: bonus * 80,
    eliteWeightMultiplier: Number((1 + bonus * 0.14).toFixed(2)),
    bossHealthMultiplier: Number((1 + bonus * 0.38).toFixed(2)),
    bossDamageMultiplier: Number((1 + bonus * 0.2).toFixed(2)),
    bossSpeedMultiplier: Number((0.62 + bonus * 0.025).toFixed(2)),
    bossBulletSpeedMultiplier: Number((0.36 + bonus * 0.02).toFixed(2)),
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

export const TALENT_MAX_LEVEL = 100;

function normalizeTalentLevel(level) {
  return Math.max(0, Math.min(TALENT_MAX_LEVEL, Number(level) || 0));
}

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
    health: 1850000,
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
    health: 60000,
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
    health: 135000,
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
    health: 220000,
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
    health: 340000,
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
    health: 500000,
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
    health: 700000,
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
    health: 920000,
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
    health: 1180000,
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
    health: 1480000,
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
    health: Math.round(2200000 + index * 500000),
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

export const GENERAL_UPGRADES = [
  {
    id: "attackGrowth",
    name: "攻击成长",
    description: "总伤害 +9%。",
    maxLevel: 10,
    apply: (player, session) => {
      player.attackMultiplier += 0.09;
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
    description: "技能冷却减少 5%。",
    maxLevel: 7,
    apply: (player, session) => {
      player.cooldownScale = Math.max(0.65, player.cooldownScale - 0.05);
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
    description: "刷新速度提高 8%，但本局金币奖励额外提高 7%。",
    maxLevel: 6,
    apply: (player, session) => {
      session.spawnRateMultiplier *= 1.08;
      session.coinRewardMultiplier *= 1.07;
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
    description: "暴击率提高 4%。",
    maxLevel: 6,
    apply: (player, session) => {
      player.critChance += 0.04;
    },
  },
  {
    id: "critDamage",
    name: "暴击伤害成长",
    description: "暴击伤害倍率提高 0.15。",
    maxLevel: 6,
    apply: (player, session) => {
      player.critDamage += 0.15;
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
    description: "使用闪现或传送后，在原地留下持续 10 秒的镜像。镜像复制当时本体的技能与属性，会自动攻击，且不会被攻击。",
  },
  {
    id: "echoSpiral",
    name: "残响回旋",
    description: "投射物或技能命中敌人后有 5% 概率在命中点产生残响。残响沿原方向再次释放，初始伤害为 40%，最多连续残响 3 次，每次再衰减 20%，且不会触发其他概率效果。",
  },
  {
    id: "emberSeed",
    name: "余烬之种",
    description: "击杀敌人时有 30% 概率留下种子。3 秒后爆炸；若你提前站在上面 1 秒，则成长为持续 8 秒的余烬之树，但自身移速永久降低 5%，最多叠加 5 次。",
  },
  {
    id: "chargedStrike",
    name: "蓄力",
    description: "每次施放技能时，初始有 1% 概率触发蓄力一击；每次未触发概率 +1%，触发后重置为 1%。蓄力一击使本次技能伤害、范围和投射物体积均提高至 2 倍。",
  },
  {
    id: "killingIntent",
    name: "杀心",
    description: "每造成 100 次伤害后进入杀心状态，持续 5 秒。状态内暴击率 +100%，暴击伤害 +100%。杀心结束后进入 15 秒冷却。",
  },
  {
    id: "frostBud",
    name: "冰霜花苞",
    description: "累计受伤达到最大生命值 30% 时，在附近随机位置生成持续 10 秒、直径 200 的冰霜领域。领域内你的伤害 +15%，敌人与敌方投射物无法进入。领域消失后进入 60 秒冷却并触发一次安全传送；传送技能会优先传送到领域内。",
  },
  {
    id: "iceThorn",
    name: "冰棘",
    description: "单次受到伤害超过最大生命值 15% 时，将该次伤害强制降低为最大生命值 15%，并冻结所有敌人 5 秒。该效果每 50 秒最多触发一次。",
  },
];

export const TALENT_LIBRARY = [
  {
    id: "sunheart",
    name: "向阳之心",
    description: "生命上限每级 +5。",
    maxLevel: TALENT_MAX_LEVEL,
    baseCost: 40,
    apply: (player, level) => {
      const bonus = normalizeTalentLevel(level) * 5;
      player.maxHealth += bonus;
      player.health += bonus;
    },
  },
  {
    id: "verdantMend",
    name: "晨露回春",
    description: "生命恢复每级 +0.02/秒。",
    maxLevel: TALENT_MAX_LEVEL,
    baseCost: 50,
    apply: (player, level) => {
      player.healthRegen += normalizeTalentLevel(level) * 0.02;
    },
  },
  {
    id: "swiftLeaf",
    name: "疾风叶鞋",
    description: "移动速度每级 +0.5。",
    maxLevel: TALENT_MAX_LEVEL,
    baseCost: 45,
    apply: (player, level) => {
      player.speed += normalizeTalentLevel(level) * 0.5;
    },
  },
  {
    id: "shiningQuill",
    name: "晨光翎羽",
    description: "总伤害每级 +2%。",
    maxLevel: TALENT_MAX_LEVEL,
    baseCost: 55,
    apply: (player, level) => {
      player.attackMultiplier += normalizeTalentLevel(level) * 0.02;
    },
  },
  {
    id: "crystalDew",
    name: "露珠晶瓶",
    description: "经验获取每级 +3%。",
    maxLevel: TALENT_MAX_LEVEL,
    baseCost: 60,
    apply: (player, level) => {
      player.expMultiplier += normalizeTalentLevel(level) * 0.03;
    },
  },
  {
    id: "goldPouch",
    name: "松果钱袋",
    description: "结算金币每级 +1%。",
    maxLevel: TALENT_MAX_LEVEL,
    baseCost: 65,
    apply: (player, level, session) => {
      session.coinRewardMultiplier *= 1 + normalizeTalentLevel(level) * 0.01;
    },
  },
  {
    id: "barkArmor",
    name: "树皮护甲",
    description: "护甲每级 +0.2。",
    maxLevel: TALENT_MAX_LEVEL,
    baseCost: 55,
    apply: (player, level) => {
      player.armor += normalizeTalentLevel(level) * 0.2;
    },
  },
];

const TALENT_DESCRIPTION_OVERRIDES = {
  sunheart: "生命上限每级 +5，等级上限 100。",
  verdantMend: "生命恢复每级 +0.02/秒，等级上限 100。",
  swiftLeaf: "移动速度每级 +0.5，等级上限 100。",
  shiningQuill: "总伤害每级 +2%，等级上限 100。",
  crystalDew: "经验获取每级 +3%，等级上限 100。",
  goldPouch: "结算金币每级 +1%，等级上限 100。",
  barkArmor: "护甲每级 +0.2，等级上限 100。",
};

export function getTalentDescription(talent) {
  return TALENT_DESCRIPTION_OVERRIDES[talent?.id] || talent?.description || "";
}

export function getTalentValueText(talent, level) {
  const safeLevel = normalizeTalentLevel(level);
  switch (talent?.id) {
    case "sunheart":
      return `当前：生命上限 +${safeLevel * 5}`;
    case "verdantMend":
      return `当前：生命恢复 +${(safeLevel * 0.02).toFixed(2)}/秒`;
    case "swiftLeaf":
      return `当前：移动速度 +${(safeLevel * 0.5).toFixed(1)}`;
    case "shiningQuill":
      return `当前：总伤害 +${safeLevel * 2}%`;
    case "crystalDew":
      return `当前：经验获取 +${safeLevel * 3}%`;
    case "goldPouch":
      return `当前：结算金币 +${safeLevel}%`;
    case "barkArmor":
      return `当前：护甲 +${(safeLevel * 0.2).toFixed(1)}`;
    default:
      return "当前：无";
  }
}

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
    description: getTalentDescription(item),
    type: "局外天赋",
  })),
];

export function getTalentCost(talent, currentLevel) {
  const level = Math.max(0, Number(currentLevel) || 0);
  return Math.ceil(talent.baseCost * (1 + level * 0.22 + level * level * 0.018));
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
