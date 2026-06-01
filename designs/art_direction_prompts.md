# Cozy Toy Survival Design Guide

## 目标

为当前生存游戏统一一套偏卡通、可爱、3D、商业手游质感的设计语言，并为各个核心页面提供可直接发送给 `gpt-images2.0` 的视觉生成提示词。

整体方向不是网页 Demo，也不是临时原型，而是完整商业游戏 UI：有统一美术风格、稳定构图、清晰层级、完整 HUD、可复用控件和适配 PC 与安卓横屏的固定画面比例。

## 画面比例与适配规则

- 推荐主比例：`16:9 landscape`
- 推荐生成尺寸：`1920x1080`
- PC 适配：以 1920x1080 为主设计画布，关键 UI 保持在中心安全区内。
- 安卓横屏适配：以 16:9 横屏为基准，兼容 20:9 设备时左右允许扩展背景，不把关键按钮、状态条、文字放到极边缘。
- 安全区建议：左右各保留 120px，顶部保留 80px，底部保留 100px。
- 页面构图：背景可铺满，核心交互区固定在中间 16:9 主画布内。
- UI 元素：按钮、卡片、状态条、物品格保持固定比例和稳定尺寸，不因文字或图标变化产生明显位移。

## 统一设计语言

### 风格关键词

`cute stylized 3D`, `cozy survival`, `toy-like materials`, `rounded shapes`, `commercial mobile game UI`, `polished casual game`, `warm adventure`, `premium game interface`

### 视觉基调

游戏世界应该像一个精致的 3D 玩具生态：森林、营地、资源、角色、建筑都圆润、可爱、有触感。生存压力存在，但不恐怖、不血腥，更多是温暖冒险、采集建造、轻度策略和收集成长。

### 色彩

- 主色：嫩草绿、天空蓝、奶油白、暖黄色。
- 强调色：珊瑚橙、浆果红、湖水青。
- 危险色：番茄红、暖橙红，避免血腥深红。
- 夜晚色：深蓝紫搭配月光蓝和营火橙。
- UI 底色：奶白、浅木色、柔和半透明深色。

### 材质

- 角色和道具：软陶、黏土、手办、玩具般的 3D 材质。
- UI：木牌、奶油色面板、软糖按钮、轻微厚度和柔和高光。
- 环境：低多边形但精致，圆角树木、蓬松草地、柔和石块、明亮水面。

### 控件风格

- 按钮：圆润厚实，带轻微 3D 厚度、投影和高光。
- 卡片：8px 到 16px 圆角，边缘干净，带柔和阴影。
- 图标：全部使用统一的 3D 小物件图标，不使用扁平临时图标。
- 状态条：胶囊形，颜色鲜明，搭配 3D 图标。
- 弹窗：奶油色或木质底板，顶部有小 3D 图标，按钮明确。

## 通用负面提示词

```text
realistic horror, gritty survival, blood, gore, dark depressing mood, placeholder assets, wireframe, prototype, demo UI, flat bootstrap web interface, generic website layout, rough sketch, low quality, pixelated, noisy texture, unreadable text, cluttered layout, inconsistent icon style, harsh sharp shapes, overly realistic materials
```

## GPT-Images 2.0 提示词格式

每个页面都按以下格式使用：

```text
Create a 16:9 landscape game UI concept at 1920x1080 resolution. [页面描述]. Style: cute stylized 3D cartoon, cozy survival adventure, toy-like rounded materials, polished commercial mobile game UI, premium casual game quality. Keep all important UI inside safe margins for PC and Android landscape screens. No placeholder assets, no demo look. Negative: realistic horror, gritty survival, blood, gore, flat web UI, prototype, low quality, unreadable text.
```

## 页面设计要点与提示词

### 1. 首页 / 主菜单

设计要点：

- 第一屏必须有正式商业游戏的完整感：Logo、角色、营地、主按钮、次级入口。
- 背景使用可爱 3D 营地场景，如篝火、木屋、树、浆果、石头和远处小山。
- 主按钮放在右侧或下方中心，按钮材质建议为圆润木牌或软糖质感。
- 安卓横屏下按钮不能贴边，保持拇指容易点击的间距。

提示词：

```text
Create a 16:9 landscape game main menu UI concept at 1920x1080 resolution. A cozy cute 3D survival island camp fills the background, with a tiny rounded survivor character near a warm campfire, a small wooden cabin, berry bushes, soft grass, round trees, stones, and a bright friendly sky. Add a polished chunky game logo area at the top center and a vertical group of large rounded buttons for Start, Continue, Settings, and Collection. Buttons should look like carved wood mixed with soft candy highlights, with subtle 3D thickness and warm shadows. Style: cute stylized 3D cartoon, cozy survival adventure, toy-like rounded materials, polished commercial mobile game UI, premium casual game quality. Keep all important UI inside safe margins for PC and Android landscape screens. No placeholder assets, no demo look. Negative: realistic horror, gritty survival, blood, gore, flat web UI, prototype, low quality, unreadable text.
```

### 2. 游戏主界面 / 探索 HUD

设计要点：

- HUD 层级清晰：顶部状态、左上资源或日期、右上小地图、底部动作栏。
- 场景应是可玩的等距或轻俯视 3D 地图，不是空背景。
- 资源、工具、动作按钮全部使用 3D 小图标。
- PC 鼠标和安卓触控都要舒服，底部按钮不能过小。

提示词：

```text
Create a 16:9 landscape gameplay HUD concept at 1920x1080 resolution. Show an isometric cozy 3D forest survival scene with rounded trees, berry bushes, stones, logs, a small campfire, a simple shelter, and an adorable stylized player character. Add a polished game HUD: top-left capsule status bars for health, hunger, thirst, and energy with colorful 3D icons; top-right rounded minimap; bottom center action toolbar with backpack, axe, pickaxe, build, craft, and map buttons; small resource counters with wood, stone, berry, and water icons. Style: cute stylized 3D cartoon, cozy survival adventure, toy-like rounded materials, polished commercial mobile game UI, premium casual game quality. Keep all important UI inside safe margins for PC and Android landscape screens. No placeholder assets, no demo look. Negative: realistic horror, gritty survival, blood, gore, flat web UI, prototype, low quality, unreadable text.
```

### 3. 背包页面

设计要点：

- 背包不要像普通网页表格，应是商业手游物品栏。
- 左侧或中间为固定网格，右侧为选中物品详情。
- 物品图标必须是统一 3D 材质，数量角标清晰。
- 支持 PC 鼠标选中和安卓横屏点击。

提示词：

```text
Create a 16:9 landscape inventory screen concept at 1920x1080 resolution. Use a warm cream and light wood interface with a large rounded backpack panel. Show a clean grid of item slots filled with cute 3D icons such as wood logs, stones, berries, water bottle, rope, seeds, axe, pickaxe, cooked food, and herbs. Add quantity badges, soft rarity color frames, and a selected item detail panel on the right with a larger 3D item preview, item name area, short stats area, and rounded Use, Drop, and Split buttons. Style: cute stylized 3D cartoon, cozy survival adventure, toy-like rounded materials, polished commercial mobile game UI, premium casual game quality. Keep all important UI inside safe margins for PC and Android landscape screens. No placeholder assets, no demo look. Negative: realistic horror, gritty survival, blood, gore, flat web UI, prototype, low quality, unreadable text.
```

### 4. 建造页面

设计要点：

- 核心是“可建造物卡片 + 3D 建筑预览 + 资源需求”。
- 用木工坊或蓝图桌作为背景氛围。
- 锁定建筑要有商业游戏常见的锁、等级和柔和遮罩。
- 卡片尺寸稳定，横屏下可左右分页或横向滚动。

提示词：

```text
Create a 16:9 landscape building menu concept at 1920x1080 resolution. Design a cozy workshop-style UI with rounded wooden panels and cream cards. Show buildable item cards with tiny polished 3D models: campfire, small hut, fence, workbench, storage box, farm plot, water collector, and watch tower. Each card includes resource requirement chips using 3D wood, stone, rope, and leaf icons. Add a larger selected building preview on the right with a ghost placement look and rounded Build button. Include a few locked cards with soft blur, padlock icons, and level badges. Style: cute stylized 3D cartoon, cozy survival adventure, toy-like rounded materials, polished commercial mobile game UI, premium casual game quality. Keep all important UI inside safe margins for PC and Android landscape screens. No placeholder assets, no demo look. Negative: realistic horror, gritty survival, blood, gore, flat web UI, prototype, low quality, unreadable text.
```

### 5. 制作 / 合成页面

设计要点：

- 表现“用材料做东西”的过程，界面要有工作台感。
- 配方列表、材料需求、产物预览和制作按钮要一眼可懂。
- 可增加制作进度条和成功高光反馈。

提示词：

```text
Create a 16:9 landscape crafting screen concept at 1920x1080 resolution. Use a cute 3D workshop table background with soft tools, blueprints, rope, leaves, and wood pieces. Build a polished crafting UI with recipe cards on the left, a central crafting preview showing selected output as a larger 3D object, and required materials displayed as colorful rounded chips. Include recipes for stone axe, berry jam, campfire kit, rope, wooden spear, and simple backpack. Add a warm glowing Craft button and a cute progress bar. Style: cute stylized 3D cartoon, cozy survival adventure, toy-like rounded materials, polished commercial mobile game UI, premium casual game quality. Keep all important UI inside safe margins for PC and Android landscape screens. No placeholder assets, no demo look. Negative: realistic horror, gritty survival, blood, gore, flat web UI, prototype, low quality, unreadable text.
```

### 6. 角色状态页面

设计要点：

- 角色是情感中心，要可爱、有表情、有装备展示。
- 状态条用彩色胶囊条，避免硬核生存面板。
- 装备槽围绕角色，点击后可替换装备。

提示词：

```text
Create a 16:9 landscape character status screen concept at 1920x1080 resolution. Place an adorable stylized 3D survivor character in the center, with rounded proportions, expressive face, simple outdoor clothes, tiny backpack, and toy-like material. Surround the character with equipment slots for hat, backpack, tool, accessory, and outfit. Add colorful capsule meters for health, hunger, thirst, energy, warmth, and mood. Use warm cream panels, sky blue accents, soft wooden tabs, and small 3D stat icons. Style: cute stylized 3D cartoon, cozy survival adventure, toy-like rounded materials, polished commercial mobile game UI, premium casual game quality. Keep all important UI inside safe margins for PC and Android landscape screens. No placeholder assets, no demo look. Negative: realistic horror, gritty survival, blood, gore, flat web UI, prototype, low quality, unreadable text.
```

### 7. 地图页面

设计要点：

- 地图建议做成立体微缩沙盘，而不是普通平面地图。
- 重要区域用 3D 地标：森林、湖、洞穴、海滩、营地、山。
- 保持地图图标体系统一，标记清楚但不拥挤。

提示词：

```text
Create a 16:9 landscape world map screen concept at 1920x1080 resolution. Show a cute stylized 3D miniature island map like a toy diorama, with forest, beach, lake, cave, mountain, camp, ruins, and meadow landmarks. Use rounded terrain, soft clouds around the edges, colorful pins, quest markers, and path lines. Add a cream parchment-like map panel with wooden tabs, zoom buttons, region labels as clean placeholder text blocks, and a small legend area. Style: cute stylized 3D cartoon, cozy survival adventure, toy-like rounded materials, polished commercial mobile game UI, premium casual game quality. Keep all important UI inside safe margins for PC and Android landscape screens. No placeholder assets, no demo look. Negative: realistic horror, gritty survival, blood, gore, flat web UI, prototype, low quality, unreadable text.
```

### 8. 任务页面

设计要点：

- 任务页使用笔记本或公告板形式，更贴近冒险游戏。
- 每个任务卡包含目标、进度、奖励和 NPC 头像。
- 奖励必须有 3D 图标，强化商业游戏完成反馈。

提示词：

```text
Create a 16:9 landscape quest screen concept at 1920x1080 resolution. Design a cute rounded notebook and wooden bulletin board interface. Show several polished quest cards with friendly NPC portrait bubbles, colorful progress bars, reward icons for coins, berries, tools, wood, and gems, and small status tags such as active, completed, and daily. Add tabs for Main, Daily, Build, and Explore quests. Use warm cream paper, light wood, sky blue highlights, and soft shadows. Style: cute stylized 3D cartoon, cozy survival adventure, toy-like rounded materials, polished commercial mobile game UI, premium casual game quality. Keep all important UI inside safe margins for PC and Android landscape screens. No placeholder assets, no demo look. Negative: realistic horror, gritty survival, blood, gore, flat web UI, prototype, low quality, unreadable text.
```

### 9. 商店页面

设计要点：

- 商店要有商业手游感：货币栏、推荐商品、商品卡、购买按钮。
- 可以加入可爱的 NPC 商人和木质摊位。
- 价格、折扣、库存要清楚，不要像普通列表。

提示词：

```text
Create a 16:9 landscape shop screen concept at 1920x1080 resolution. Show a cozy 3D wooden market stall with an adorable merchant character behind it. Build a polished store UI with currency counters for coins and gems at the top, a featured item area, and a grid of product cards showing 3D icons for seeds, tools, food, decorations, backpack upgrades, and resource bundles. Each card has a rounded price chip and a chunky Buy button. Add a soft sale ribbon on one item. Style: cute stylized 3D cartoon, cozy survival adventure, toy-like rounded materials, polished commercial mobile game UI, premium casual game quality. Keep all important UI inside safe margins for PC and Android landscape screens. No placeholder assets, no demo look. Negative: realistic horror, gritty survival, blood, gore, flat web UI, prototype, low quality, unreadable text.
```

### 10. 设置页面

设计要点：

- 设置也要保持游戏化，不能露出系统默认表单感。
- 用圆润滑杆、开关、图标按钮和标签页。
- PC 与安卓横屏都要保证触控面积足够大。

提示词：

```text
Create a 16:9 landscape settings screen concept at 1920x1080 resolution. Design a polished cute game settings UI with a warm cream rounded panel, soft wooden tabs, and tactile controls. Include sliders for music, sound effects, and ambience; toggle switches for vibration, auto save, and high quality graphics; segmented buttons for language and control mode; and rounded icon buttons for account, privacy, and support. Add a small cute 3D gear icon and subtle cozy survival background. Style: cute stylized 3D cartoon, cozy survival adventure, toy-like rounded materials, polished commercial mobile game UI, premium casual game quality. Keep all important UI inside safe margins for PC and Android landscape screens. No placeholder assets, no demo look. Negative: realistic horror, gritty survival, blood, gore, flat web UI, prototype, low quality, unreadable text.
```

### 11. 结算 / 失败 / 生存总结页面

设计要点：

- 失败也要温暖，不做恐怖死亡画面。
- 重点展示生存天数、收集资源、解锁内容和重试按钮。
- 用营火夜景和疲惫但可爱的角色表达情绪。

提示词：

```text
Create a 16:9 landscape survival result screen concept at 1920x1080 resolution. Show a soft night campfire scene with an adorable tired survivor character sitting near the fire, cozy blue moonlight, warm orange glow, and small collected resources nearby. Add a polished result panel with survival days, collected items, unlocked rewards, score stars, and two large rounded buttons for Retry and Home. The mood should be encouraging and friendly, not scary. Style: cute stylized 3D cartoon, cozy survival adventure, toy-like rounded materials, polished commercial mobile game UI, premium casual game quality. Keep all important UI inside safe margins for PC and Android landscape screens. No placeholder assets, no demo look. Negative: realistic horror, gritty survival, blood, gore, flat web UI, prototype, low quality, unreadable text.
```

### 12. 弹窗 / Toast / 奖励提示

设计要点：

- 所有弹窗统一为圆润奶油卡片或木牌底板。
- 顶部配 3D 图标，中间短文案，底部明确按钮。
- 奖励弹窗要有粒子、高光、物品飞入感。

提示词：

```text
Create a 16:9 landscape UI popup concept at 1920x1080 resolution. Show a cute polished reward popup over a softly blurred cozy survival game background. The popup is a rounded cream card with light wood trim, soft shadow, a small 3D treasure chest icon at the top, three reward items with 3D icons and quantity badges, sparkles, and two chunky rounded buttons for Claim and Later. Include a small toast notification variant near the lower area with a 3D berry icon and soft slide-in style. Style: cute stylized 3D cartoon, cozy survival adventure, toy-like rounded materials, polished commercial mobile game UI, premium casual game quality. Keep all important UI inside safe margins for PC and Android landscape screens. No placeholder assets, no demo look. Negative: realistic horror, gritty survival, blood, gore, flat web UI, prototype, low quality, unreadable text.
```

## 落地检查清单

- 首页、游戏 HUD、背包、建造、制作、角色、地图、任务、商店、设置、结算、弹窗保持同一材质语言。
- 所有图标统一为 3D 卡通小物件。
- 所有按钮统一圆润厚实，带轻微高光和投影。
- 所有页面都使用 16:9 横屏固定主画布。
- PC 与安卓横屏共用布局，只做边缘背景扩展和安全区调整。
- 页面不能出现 Demo 感的临时按钮、默认表单、空白背景、纯文本列表。
- 文案区域在生图阶段用干净占位块即可，最终实现时再替换真实文本。
