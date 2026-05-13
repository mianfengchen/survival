const REGION_COLUMNS = 6;
const REGION_ROWS = 6;

export const WAR_DIFFICULTIES = [
  {
    id: "easy",
    name: "简单",
    description: "适合熟悉区域规则，敌人压力较低。",
    enemyScale: 0.82,
    bossScale: 0.84,
    spawnScale: 0.9,
    expScale: 0.9,
    energyScale: 0.9,
  },
  {
    id: "normal",
    name: "正常",
    description: "标准保卫战强度。",
    enemyScale: 1,
    bossScale: 1,
    spawnScale: 1,
    expScale: 1,
    energyScale: 1,
  },
  {
    id: "hard",
    name: "困难",
    description: "害虫更加凶猛，适合已有研究强化后挑战。",
    enemyScale: 1.16,
    bossScale: 1.2,
    spawnScale: 1.14,
    expScale: 1.12,
    energyScale: 1.16,
  },
  {
    id: "extreme",
    name: "极难",
    description: "敌潮与 Boss 压力显著抬升。",
    enemyScale: 1.34,
    bossScale: 1.42,
    spawnScale: 1.28,
    expScale: 1.2,
    energyScale: 1.28,
  },
  {
    id: "inferno",
    name: "炼狱",
    description: "高压歼灭战，适合后期反复刷取植物能量。",
    enemyScale: 1.56,
    bossScale: 1.7,
    spawnScale: 1.42,
    expScale: 1.3,
    energyScale: 1.42,
  },
];

export const CHARACTER_LIBRARY = [
  {
    id: "spriteScout",
    name: "小精灵",
    title: "初始守园者",
    kind: "精灵",
    description: "在最后一片花园区域觉醒风元素之力，能够释放精灵箭术。",
    skillId: "elfArrow",
    unlockedByDefault: true,
    battleRule: "allUnlockedSkills",
    color: "#8fdfff",
  },
  {
    id: "sunblossom",
    name: "向日花灵",
    title: "灿光观测者",
    kind: "花朵",
    description: "守在日照最足的暖阳花坛，以日冕脉冲撕开虫潮。",
    skillId: "solarPulse",
    color: "#ffd870",
  },
  {
    id: "foambud",
    name: "泡泡花苞",
    title: "露池试验员",
    kind: "植物",
    description: "能把露珠吹成高压泡弹，适合封锁窄路。",
    skillId: "bubbleBurst",
    color: "#84e3ff",
  },
  {
    id: "petalwing",
    name: "回旋花蝶",
    title: "花环护卫",
    kind: "益虫",
    description: "借助旋翼与花瓣环守护近身区域。",
    skillId: "petalOrbit",
    color: "#ff9fc0",
  },
  {
    id: "thornwarden",
    name: "棘篱守卫",
    title: "荆墙前锋",
    kind: "植物",
    description: "发射成簇荆棘来阻断成群害虫。",
    skillId: "thornVolley",
    color: "#92b85a",
  },
  {
    id: "dewcaller",
    name: "晨露花精",
    title: "湿地培育者",
    kind: "花朵",
    description: "能将一整片土地浸成减速花圃。",
    skillId: "dewGarden",
    color: "#7ee4d3",
  },
  {
    id: "stormbud",
    name: "雷芽裁缝",
    title: "电花织雷者",
    kind: "植物",
    description: "提前为虫群缝好落雷的缝隙。",
    skillId: "stormBloom",
    color: "#efe187",
  },
  {
    id: "mushglen",
    name: "菇林伏兵",
    title: "菌伞埋伏者",
    kind: "植物",
    description: "在根系之间埋下会成片引爆的蘑菇雷。",
    skillId: "mushroomMine",
    color: "#d3a274",
  },
  {
    id: "vinewhisper",
    name: "藤语侦猎",
    title: "盘根巡林者",
    kind: "植物",
    description: "以藤鞭瞬间绞杀并定住高威胁害虫。",
    skillId: "vineSnare",
    color: "#82d56f",
  },
  {
    id: "cometseed",
    name: "彗种旅者",
    title: "坠星播种者",
    kind: "花朵",
    description: "召来燃烧的种星轰击被污染的土地。",
    skillId: "meteorSeed",
    color: "#ffae84",
  },
  {
    id: "ribbonmoth",
    name: "绫月蛾灵",
    title: "回潮织刃者",
    kind: "益虫",
    description: "擅长用来回折返的丝刃切开虫阵。",
    skillId: "ribbonBlade",
    color: "#aab5ff",
  },
  {
    id: "lotuskeeper",
    name: "莲灯引路者",
    title: "灵辉守夜人",
    kind: "景观守灵",
    description: "点起会自行射击的莲灯，把害虫从夜色里照出来。",
    skillId: "lotusBeacon",
    color: "#ffd98a",
  },
];

export const LANDSCAPE_LIBRARY = [
  {
    id: "sunDial",
    name: "日晷花坛",
    description: "永久提高经验吸取范围。",
    bonusText: "吸取经验范围 +10%",
  },
  {
    id: "glassPond",
    name: "镜露池",
    description: "永久提高经验获取效率。",
    bonusText: "经验收益 +8%",
  },
  {
    id: "windArch",
    name: "风拱廊",
    description: "永久提高移动速度。",
    bonusText: "移速 +5%",
  },
  {
    id: "moonBridge",
    name: "月桥石径",
    description: "永久提高冷却压缩。",
    bonusText: "冷却缩减 +4%",
  },
  {
    id: "fernMaze",
    name: "蕨影迷宫",
    description: "永久提高最大生命。",
    bonusText: "生命上限 +10",
  },
  {
    id: "amberGazebo",
    name: "琥珀凉亭",
    description: "永久提升投射物速度。",
    bonusText: "弹道速度 +6%",
  },
  {
    id: "sporeTower",
    name: "孢风塔",
    description: "永久提升召唤物持续时间。",
    bonusText: "召唤持续时间 +8%",
  },
  {
    id: "ivyGate",
    name: "常春门",
    description: "永久减少触碰伤害。",
    bonusText: "护甲 +1",
  },
  {
    id: "starWell",
    name: "星泉井",
    description: "永久提升暴击几率。",
    bonusText: "暴击率 +3%",
  },
  {
    id: "mossLab",
    name: "苔光实验台",
    description: "永久提升研究效率。",
    bonusText: "研究所强化价格 -5%",
  },
  {
    id: "pollinatorGate",
    name: "授粉回廊",
    description: "永久提升投射物体积。",
    bonusText: "抛射物体积 +6%",
  },
  {
    id: "crystalTerrace",
    name: "晶露露台",
    description: "永久提升局内能量获取。",
    bonusText: "植物能量收益 +6%",
  },
];

const REGION_THEMES = [
  "晨露苗圃",
  "烈阳花廊",
  "蘑风湿地",
  "藤根峡湾",
  "蜂鸣草坡",
  "月辉莲泽",
  "风叶廊桥",
  "蔷薇围庭",
  "碎晶苗圃",
  "孢幕林湾",
  "萤灯坡道",
  "潮汐花港",
];

const REGION_THEME_PALETTES = [
  { color: "#93df83", accent: "#4e8e47", detail: "#f1ffd6" },
  { color: "#ffd46f", accent: "#c17a29", detail: "#fff4c7" },
  { color: "#92d1a6", accent: "#4d7a63", detail: "#e6fff1" },
  { color: "#9dd48a", accent: "#527b38", detail: "#ecffdd" },
  { color: "#f3b168", accent: "#a55f22", detail: "#ffe9ca" },
  { color: "#8eb9ff", accent: "#4868b1", detail: "#e3ecff" },
  { color: "#88e3d8", accent: "#33857b", detail: "#defffb" },
  { color: "#ff8eb8", accent: "#a64572", detail: "#ffe0ec" },
  { color: "#b7f1ff", accent: "#518ea2", detail: "#effcff" },
  { color: "#c7d879", accent: "#72832a", detail: "#f7ffd8" },
  { color: "#f3d37f", accent: "#9e7422", detail: "#fff4cf" },
  { color: "#7fd6ff", accent: "#32769b", detail: "#e8f8ff" },
];

const BOSS_KIN_FAMILIES = [
  {
    key: "bud",
    kinTitle: "芽庭近卫",
    bossName: "萌芽守门人",
    description: "靠近时会抖落护芽光粉，留下柔亮花尘尾迹。",
    shapeId: "budKin",
    effectId: "pollenTrail",
    color: "#9ad56e",
    accent: "#4f863a",
    detailColor: "#efffd0",
    health: 44,
    speed: 60,
    damage: 9,
    radius: 16,
    exp: 6,
    weight: 3.3,
    minTime: 34,
  },
  {
    key: "serpent",
    kinTitle: "钟藤侍环",
    bossName: "藤钟长蛇",
    description: "身体节环会拖出藤辉弧线，死亡时甩出细藤子弹。",
    shapeId: "serpentKin",
    effectId: "vineArc",
    color: "#7ebc77",
    accent: "#3d6a49",
    detailColor: "#ddf6d7",
    health: 54,
    speed: 66,
    damage: 10,
    radius: 17,
    exp: 7,
    weight: 3.1,
    minTime: 58,
  },
  {
    key: "shell",
    kinTitle: "琥壳巡卫",
    bossName: "琥珀壳将",
    description: "外壳会闪出琥珀裂纹，倒下时崩出交叉壳片。",
    shapeId: "shellKin",
    effectId: "amberChip",
    color: "#f1b36b",
    accent: "#88531d",
    detailColor: "#ffe5b8",
    health: 76,
    speed: 52,
    damage: 14,
    radius: 19,
    exp: 9,
    weight: 2.8,
    minTime: 92,
  },
  {
    key: "moth",
    kinTitle: "月鳞翼侍",
    bossName: "月瓣蛾后",
    description: "翼面会持续抖落月鳞微光，死亡时散出追踪鳞片。",
    shapeId: "mothKin",
    effectId: "mothDust",
    color: "#cfb0f5",
    accent: "#6e54a8",
    detailColor: "#f7e6ff",
    health: 62,
    speed: 80,
    damage: 12,
    radius: 16,
    exp: 8,
    weight: 2.9,
    minTime: 118,
  },
  {
    key: "prism",
    kinTitle: "棱冠角侍",
    bossName: "棱镜鹿王",
    description: "棱面会折出冰亮碎光，破碎时朝玩家方向抛射镜棱。",
    shapeId: "prismKin",
    effectId: "prismGlint",
    color: "#74caff",
    accent: "#2d6993",
    detailColor: "#def7ff",
    health: 74,
    speed: 72,
    damage: 14,
    radius: 18,
    exp: 10,
    weight: 2.7,
    minTime: 146,
  },
  {
    key: "spore",
    kinTitle: "菌幕伞从",
    bossName: "沼孢菌主",
    description: "头冠会逸散孢雾，死亡时裂成会继续分生的毒孢。",
    shapeId: "sporeKin",
    effectId: "sporeMist",
    color: "#acc579",
    accent: "#5a6f2f",
    detailColor: "#f2f8cb",
    health: 88,
    speed: 58,
    damage: 15,
    radius: 20,
    exp: 11,
    weight: 2.6,
    minTime: 176,
  },
  {
    key: "tempest",
    kinTitle: "风裁花枪",
    bossName: "风暴郁金统领",
    description: "周身会卷起细窄风缎，倒下时放出旋压风轮。",
    shapeId: "tempestKin",
    effectId: "windRibbon",
    color: "#ffab84",
    accent: "#a94d2d",
    detailColor: "#ffe6db",
    health: 66,
    speed: 86,
    damage: 16,
    radius: 17,
    exp: 11,
    weight: 2.8,
    minTime: 208,
  },
  {
    key: "eclipse",
    kinTitle: "蚀瓣侍丛",
    bossName: "蚀光牡丹",
    description: "花瓣边缘带有暗蚀火屑，死亡时洒下斜坠蚀雨。",
    shapeId: "eclipseKin",
    effectId: "eclipseSpark",
    color: "#ef7ca7",
    accent: "#8c234d",
    detailColor: "#ffdceb",
    health: 82,
    speed: 76,
    damage: 18,
    radius: 18,
    exp: 12,
    weight: 2.4,
    minTime: 238,
  },
  {
    key: "lantern",
    kinTitle: "虚灯巡根",
    bossName: "虚灯古树",
    description: "灯叶会不断逸出幽蓝灵火，折断时会点亮四向灯阵。",
    shapeId: "lanternKin",
    effectId: "lanternWisp",
    color: "#93a9ff",
    accent: "#334996",
    detailColor: "#e2e8ff",
    health: 94,
    speed: 62,
    damage: 19,
    radius: 21,
    exp: 13,
    weight: 2.3,
    minTime: 270,
  },
  {
    key: "twilight",
    kinTitle: "暮割卫簇",
    bossName: "黄昏收割者",
    description: "镰瓣边缘会闪出暮红残影，倒下时引爆收割碎潮。",
    shapeId: "twilightKin",
    effectId: "twilightScythe",
    color: "#f07a83",
    accent: "#952632",
    detailColor: "#ffd9d0",
    health: 112,
    speed: 84,
    damage: 21,
    radius: 20,
    exp: 14,
    weight: 2.1,
    minTime: 300,
  },
];

function parseHex(hex) {
  return Number.parseInt(hex.replace("#", ""), 16);
}

function mixHex(left, right, amount = 0.5) {
  const safeAmount = Math.max(0, Math.min(1, amount));
  const leftColor = parseHex(left);
  const rightColor = parseHex(right);
  const leftRed = (leftColor >> 16) & 0xff;
  const leftGreen = (leftColor >> 8) & 0xff;
  const leftBlue = leftColor & 0xff;
  const rightRed = (rightColor >> 16) & 0xff;
  const rightGreen = (rightColor >> 8) & 0xff;
  const rightBlue = rightColor & 0xff;
  const red = Math.round(leftRed + (rightRed - leftRed) * safeAmount);
  const green = Math.round(leftGreen + (rightGreen - leftGreen) * safeAmount);
  const blue = Math.round(leftBlue + (rightBlue - leftBlue) * safeAmount);
  return `#${[red, green, blue].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function createRegionalSpecialMonster(regionIndex) {
  const family = BOSS_KIN_FAMILIES[regionIndex % BOSS_KIN_FAMILIES.length];
  const theme = REGION_THEME_PALETTES[regionIndex % REGION_THEME_PALETTES.length];
  const areaLabel = regionIndex === 0 ? "花心" : REGION_THEMES[regionIndex % REGION_THEMES.length];
  const statScale = 1 + regionIndex * 0.038;
  const speedBonus = (regionIndex % 6) * 2;
  const damageBonus = regionIndex * 0.42;

  return {
    id: `region-kin-${regionIndex + 1}`,
    name: `${areaLabel}${family.kinTitle}`,
    description: `${areaLabel}中为${family.bossName}效命的亲族部队，${family.description}`,
    color: mixHex(family.color, theme.color, 0.34),
    accent: mixHex(family.accent, theme.accent, 0.38),
    detailColor: mixHex(family.detailColor, theme.detail, 0.46),
    minTime: 300,
    weight: Number((family.weight + (regionIndex % 3) * 0.16).toFixed(2)),
    health: Math.round(family.health * statScale),
    speed: Math.round(family.speed + speedBonus + regionIndex * 0.25),
    damage: Math.round(family.damage + damageBonus),
    radius: family.radius + (regionIndex % 2),
    exp: Math.round(family.exp + regionIndex * 0.55),
    shapeId: family.shapeId,
    effectId: family.effectId,
    familyId: family.key,
    regionExclusive: true,
  };
}

export const REGION_SPECIAL_MONSTERS = Array.from({ length: REGION_COLUMNS * REGION_ROWS }, (_, index) => createRegionalSpecialMonster(index));

function createRegionReward(regionIndex) {
  if (regionIndex === 0) {
    return {
      type: "character",
      targetId: "spriteScout",
    };
  }

  const characterIndex = regionIndex - 1;
  if (characterIndex < CHARACTER_LIBRARY.length - 1) {
    return {
      type: "character",
      targetId: CHARACTER_LIBRARY[characterIndex + 1].id,
    };
  }

  const landscapeIndex = (regionIndex - CHARACTER_LIBRARY.length) % LANDSCAPE_LIBRARY.length;
  return {
    type: "landscape",
    targetId: LANDSCAPE_LIBRARY[landscapeIndex].id,
  };
}

function getRegionBoss(regionIndex) {
  const bossTier = 1 + (regionIndex % 10);
  return {
    bossTier,
    bossId: [
      "budSentinel",
      "clockvineSerpent",
      "amberShellCrab",
      "moonpetalMoth",
      "prismStag",
      "myceliumLord",
      "tempestTulip",
      "eclipsePeony",
      "voidLantern",
      "twilightMower",
    ][bossTier - 1],
  };
}

function createRegion(regionIndex) {
  const column = regionIndex % REGION_COLUMNS;
  const row = Math.floor(regionIndex / REGION_COLUMNS);
  const reward = createRegionReward(regionIndex);
  const boss = getRegionBoss(regionIndex);
  const specialMonster = REGION_SPECIAL_MONSTERS[regionIndex];
  return {
    id: `region-${regionIndex + 1}`,
    index: regionIndex,
    name: regionIndex === 0 ? "最后的花心" : `${REGION_THEMES[regionIndex % REGION_THEMES.length]} ${regionIndex + 1}`,
    description:
      regionIndex === 0
        ? "花园最后仍未沦陷的核心区域，小精灵将在这里觉醒并发起第一场保卫战。"
        : "被外星害虫侵蚀的花园区域，需要先击退镇守 Boss 才能恢复生机。",
    row,
    column,
    reward,
    bossId: boss.bossId,
    bossTier: boss.bossTier,
    specialMonsterId: specialMonster.id,
    tutorialRegion: regionIndex === 0,
    durationSeconds: regionIndex === 0 ? 180 : 15 * 60,
    energyReward: regionIndex === 0 ? 24 : 40 + regionIndex * 3,
  };
}

export const GARDEN_REGIONS = Array.from({ length: REGION_COLUMNS * REGION_ROWS }, (_, index) => createRegion(index));

export function getCharacterDefinition(characterId) {
  return CHARACTER_LIBRARY.find((character) => character.id === characterId) || null;
}

export function getLandscapeDefinition(landscapeId) {
  return LANDSCAPE_LIBRARY.find((landscape) => landscape.id === landscapeId) || null;
}

export function getRegionDefinition(regionId) {
  return GARDEN_REGIONS.find((region) => region.id === regionId) || null;
}

export function getWarDifficulty(difficultyId) {
  return WAR_DIFFICULTIES.find((item) => item.id === difficultyId) || WAR_DIFFICULTIES[1];
}

export function getAdjacentRegionIds(regionId) {
  const region = getRegionDefinition(regionId);
  if (!region) {
    return [];
  }

  const neighbors = [];
  const offsets = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  for (const [columnOffset, rowOffset] of offsets) {
    const nextColumn = region.column + columnOffset;
    const nextRow = region.row + rowOffset;
    if (nextColumn < 0 || nextColumn >= REGION_COLUMNS || nextRow < 0 || nextRow >= REGION_ROWS) {
      continue;
    }
    const nextIndex = nextRow * REGION_COLUMNS + nextColumn;
    neighbors.push(GARDEN_REGIONS[nextIndex].id);
  }

  return neighbors;
}

export function isRegionAdjacentToLiberated(regionId, liberatedRegionIds) {
  const liberatedSet = new Set(liberatedRegionIds);
  return getAdjacentRegionIds(regionId).some((adjacentId) => liberatedSet.has(adjacentId));
}

export function createDefaultWorldState() {
  return {
    introSeen: false,
    tutorialCompleted: false,
    liberatedRegions: [GARDEN_REGIONS[0].id],
    unlockedCharacters: ["spriteScout"],
    unlockedLandscapes: [],
    selectedCharacterId: "spriteScout",
    selectedRegionId: GARDEN_REGIONS[0].id,
    selectedWarDifficultyId: "normal",
    pendingRegionId: GARDEN_REGIONS[0].id,
  };
}
