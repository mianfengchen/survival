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
