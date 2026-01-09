# City Striker 3D - 完整项目技术文档

## 项目概述

**City Striker 3D** 是一款基于 React + Three.js 的第一人称 3D 射击游戏，采用现代 Web 技术栈构建，提供沉浸式的赛博朋克风格战斗体验。游戏具有程序化生成的霓虹城市环境、智能敌人 AI、动态射击机制、波次系统和完整的音效反馈。

## 技术栈详情

### 核心框架
- **React 19.2.3**: 用于 UI 组件和状态管理，使用函数组件和 Hooks
- **TypeScript 5.8.2**: 提供完整的类型安全，所有组件和函数都有类型定义
- **Vite 6.2.0**: 开发服务器（端口 3000，监听 0.0.0.0），支持 HMR
- **Three.js 0.182.0**: 3D 图形渲染引擎，用于所有 3D 场景渲染
- **@react-three/fiber 9.5.0**: React 的 Three.js 声明式渲染器，将 Three.js 对象映射为 React 组件
- **@react-three/drei 10.7.7**: Three.js 的 React 辅助组件库，提供 Sky、Stars、PointerLockControls、Html 等组件

### 样式和工具
- **Tailwind CSS**: 通过 CDN 引入（https://cdn.tailwindcss.com），用于所有 UI 样式
- **ESM 模块系统**: 使用 importmap 进行模块管理（在 index.html 中定义）

## 项目文件结构

```
city-striker/
├── components/
│   ├── GameScene.tsx      # 核心游戏逻辑和循环（425行）
│   ├── Enemy.tsx          # 敌人实体组件（73行）
│   ├── UIOverlay.tsx      # HUD 界面覆盖层（104行）
│   ├── WeaponModel.tsx    # 第一人称武器模型（75行）
│   └── World.tsx          # 城市环境和建筑生成（138行）
├── utils/
│   └── audio.ts           # 音效管理系统（89行）
├── App.tsx                # 应用主入口和状态管理（172行）
├── index.tsx              # React 根渲染入口（16行）
├── types.ts               # TypeScript 类型定义（29行）
├── index.html             # HTML 入口和 importmap 配置（43行）
├── vite.config.ts         # Vite 配置（24行）
├── tsconfig.json          # TypeScript 配置
└── package.json           # 项目依赖配置
```

## 完整运行流程

### 1. 应用初始化阶段

**入口点**: `index.tsx`
- ReactDOM.createRoot 创建根节点
- 渲染 `<App />` 组件（React.StrictMode 模式）

**App.tsx 初始化**:
1. 初始化游戏状态（GameState）:
   ```typescript
   {
     score: 0,
     health: 100,
     enemiesRemaining: 5,
     ammo: 26,
     maxAmmo: 30,
     reserveAmmo: 120,
     jetpackCharges: 3,
     wave: 1,
     enemiesKilled: 0
   }
   ```
2. 初始化 UI 状态:
   - `isGameOver: false`
   - `gameStarted: false`
   - `isReloading: false`
3. 创建 `updateGameState` 回调函数（使用 useCallback 优化）
4. 渲染开始界面（Start Screen Overlay）

### 2. 开始界面（Start Screen）

**UI 结构**:
- 标题: "City Striker 3D"（绿色霓虹效果，drop-shadow）
- 操作说明卡片:
  - Movement: WASD + Space
  - Combat: Mouse Left Click
  - Reload: Press R
- "INITIATE MISSION" 按钮

**用户交互**:
- 点击按钮触发 `handleStartGame()`
- 初始化音效系统: `audioManager.init()`
- 设置 `gameStarted = true`

### 3. 游戏场景初始化

**Canvas 渲染**:
- 启用阴影: `shadows={true}`
- 相机配置: FOV 75°，初始位置 [0, 2, 5]
- 启用抗锯齿: `antialias: true`

**环境渲染**:
- Sky 组件: 太阳位置 [100, 20, 100]
- Stars 组件: 5000 颗星星，半径 100，深度 50，无饱和度，淡入效果
- 光照系统:
  - 环境光: intensity 2.5
  - 定向光: position [0, 100, 0], intensity 5.0, 阴影贴图 2048x2048
  - 点光源 1: position [10, 20, 10], intensity 3
  - 点光源 2: position [-10, 20, -10], intensity 2

**GameScene 组件挂载**:
- 初始化敌人数组（5 个敌人）
- 初始化子弹数组（空）
- 初始化玩家状态:
  - `velocity`: THREE.Vector3(0, 0, 0)
  - `keys`: 键盘状态对象
  - `isJetpackActive`: false
  - `jetpackStartTime`: 0

**World 组件渲染**:
- 使用 `useMemo` 预计算 60 栋建筑
- 每栋建筑: 高度 5-30，宽度/深度 4-10，位置随机（避开中心 12x12 区域）
- 每栋建筑 15-35 个窗户，预计算位置和旋转
- 地面: 1000x1000 黑色平面，网格辅助线，白色道路标记

**PointerLockControls 激活**:
- 仅在 `gameStarted && !isGameOver` 时渲染
- 锁定鼠标指针，启用第一人称视角控制

### 4. 游戏主循环（useFrame）

**执行频率**: 每帧执行（通常 60 FPS）

**循环顺序**:

#### 4.1 玩家移动系统
```typescript
// 移动速度计算
const moveSpeed = 27.8 / 3; // 约 9.27 单位/秒

// 方向向量计算
frontVector = (S键 - W键) * moveSpeed
sideVector = (A键 - D键) * moveSpeed
direction = normalize(frontVector - sideVector) * moveSpeed
direction.applyEuler(camera.rotation) // 应用相机旋转

// 水平移动
velocity.x = direction.x
velocity.z = direction.z

// 跳跃系统
if (Space键 && camera.position.y <= 2.1) {
  velocity.y = 10 // 跳跃初速度
}

// 喷气背包系统
if (isJetpackActive && elapsed < 2000ms) {
  velocity.y += 15 * delta // 向上推力
}

// 重力系统
velocity.y -= 25 * delta // 重力加速度

// 位置更新
camera.position += velocity * delta

// 地面碰撞检测
if (camera.position.y < 2) {
  camera.position.y = 2
  velocity.y = 0
}
```

#### 4.2 子弹系统
```typescript
// 遍历所有子弹
forEach bullet in bullets {
  // 生命周期检查（3秒）
  if (now - bullet.createdAt < 3000) {
    // 位置更新
    newPos = bullet.position + bullet.velocity
    
    // 碰撞检测（球形，半径 1）
    forEach enemy in enemies {
      dist = distance(newPos, enemy.position + [0, 1, 0])
      if (dist < 1 && enemy.health > 0) {
        // 击中敌人
        enemy.health -= 25
        playHitSound()
        score += 25
        if (enemy.health <= 0) {
          enemiesKilled += 1
        }
        remove bullet
      }
    }
    
    // 未击中则继续移动
    if (!hit) {
      update bullet position
    }
  } else {
    // 超时自动销毁
    remove bullet
  }
}
```

#### 4.3 敌人 AI 系统
```typescript
forEach enemy in enemies {
  if (enemy.health <= 0) continue
  
  // 计算到玩家的距离
  dx = camera.x - enemy.x
  dz = camera.z - enemy.z
  dist = sqrt(dx² + dz²)
  
  // 移动逻辑
  if (dist > 5) {
    // 距离远：向玩家移动
    moveSpeed = 3 * delta
    direction = normalize([dx, 0, dz]) * moveSpeed
    enemy.position += direction
  } else if (dist < 3) {
    // 距离近：远离玩家
    moveSpeed = 3 * delta * 0.5
    direction = normalize([-dx, 0, -dz]) * moveSpeed
    enemy.position += direction
  }
  
  // 攻击逻辑
  if (dist < 8 && now - enemy.lastAttackTime > enemy.attackCooldown) {
    player.health -= 10
    playEnemyAttackSound()
    playDamageSound()
    enemy.lastAttackTime = now
  }
}
```

#### 4.4 波次系统
```typescript
aliveEnemies = enemies.filter(e => e.health > 0)

if (aliveEnemies.length === 0 && totalEnemies > 0) {
  // 所有敌人死亡，进入下一波
  nextWave = currentWave + 1
  enemiesPerWave = 5 + (nextWave - 1) * 2
  
  // 难度递增
  enemyHealth = 100 + (nextWave - 1) * 20
  attackCooldown = max(1000, 2000 - (nextWave - 1) * 100)
  
  // 生成新敌人
  spawn enemiesPerWave enemies with new stats
  
  // 波次奖励
  player.health = min(100, player.health + 20)
  player.ammo = maxAmmo
  player.reserveAmmo += 30
  player.jetpackCharges = min(5, player.jetpackCharges + 1)
}

// 维持最小敌人数量
if (aliveEnemies.length < 5 && enemiesRemaining > aliveEnemies.length) {
  spawn new enemies to maintain minimum
}
```

### 5. 用户输入处理

**键盘事件监听**:
```typescript
// KeyDown 事件
- W/A/S/D: 更新 keys.current["KeyW/KeyA/KeyS/KeyD"] = true
- Space: 更新 keys.current["Space"] = true
- R: 触发 reload()（需指针锁定）
- Shift: 激活喷气背包（需充能 > 0 且指针锁定）

// KeyUp 事件
- 更新对应键为 false
- Shift: 停用喷气背包

// MouseDown 事件
- 左键: 触发 shoot()（需指针锁定）
```

**指针锁定**:
- PointerLockControls 组件自动处理鼠标锁定
- 所有输入操作都检查 `document.pointerLockElement` 状态

### 6. 射击系统

**shoot() 函数流程**:
1. 检查游戏状态: `isGameOver || isReloading || ammo <= 0`
2. 如果弹药为 0 且有待用弹药，自动触发 reload()
3. 减少当前弹药: `ammo -= 1`
4. 播放射击音效: `playShootSound()`
5. 计算子弹方向: `camera.getWorldDirection()`
6. 创建子弹对象:
   ```typescript
   {
     id: random(),
     position: [camera.x, camera.y - 0.2, camera.z],
     velocity: [direction.x * 2, direction.y * 2, direction.z * 2],
     createdAt: Date.now()
   }
   ```
7. 添加到子弹数组

### 7. 换弹系统

**reload() 函数流程**:
1. 检查条件: `!isReloading && reserveAmmo > 0 && ammo < maxAmmo`
2. 设置 `isReloading = true`
3. 播放换弹音效: `playReloadSound()`
4. 1.5 秒后:
   - 计算需要补充的弹药: `ammoNeeded = maxAmmo - ammo`
   - 计算实际补充: `ammoToTake = min(ammoNeeded, reserveAmmo)`
   - 更新状态: `ammo += ammoToTake`, `reserveAmmo -= ammoToTake`
   - 设置 `isReloading = false`

**换弹动画**:
- WeaponModel 组件接收 `isReloading` prop
- 使用 `reloadAnimationTime` 追踪动画进度
- 动画: `rotation.x = sin(progress * PI) * 0.3`
- 持续时间: 1.5 秒

### 8. 喷气背包系统

**激活条件**:
- Shift 键按下
- `jetpackCharges > 0`
- `!isJetpackActive`
- 指针已锁定

**运行逻辑**:
```typescript
// 激活时
isJetpackActive = true
jetpackStartTime = Date.now()
jetpackCharges -= 1

// 每帧检查
elapsed = Date.now() - jetpackStartTime
if (elapsed < 2000) {
  velocity.y += 15 * delta // 向上推力
} else {
  isJetpackActive = false // 2秒后自动停用
}

// 释放 Shift 键
isJetpackActive = false
```

### 9. 音效系统

**AudioManager 类**:
- 使用 Web Audio API 程序化生成音效
- 单例模式: `export const audioManager = new AudioManager()`
- 主音量: 0.3

**音效类型**:
1. **射击音效** (`playShootSound`):
   - 800Hz 方波，0.05秒
   - 600Hz 方波，0.03秒（延迟 20ms）
   
2. **击中音效** (`playHitSound`):
   - 1200Hz 正弦波，0.1秒
   - 1000Hz 正弦波，0.08秒（延迟 30ms）
   
3. **换弹音效** (`playReloadSound`):
   - 400Hz 正弦波，0.1秒
   - 350Hz 正弦波，0.1秒（延迟 150ms）
   - 450Hz 正弦波，0.15秒（延迟 300ms）
   
4. **敌人攻击音效** (`playEnemyAttackSound`):
   - 200Hz 锯齿波，0.2秒
   
5. **受伤音效** (`playDamageSound`):
   - 300Hz 锯齿波，0.3秒
   - 250Hz 锯齿波，0.2秒（延迟 100ms）

### 10. UI 渲染系统

**UIOverlay 组件结构**:
- 使用 `pointer-events-none` 避免阻挡游戏交互
- 绝对定位覆盖整个屏幕

**布局**:
1. **顶部信息**（flex justify-between）:
   - 左上: 生命值、喷气背包充能
   - 右上: 分数、波次、剩余敌人
   
2. **中央提示**（flex-grow flex-center）:
   - 换弹提示: "RELOADING..."（黄色，pulse 动画）
   - 击中提示: "HIT +25"（绿色，pulse 动画）
   
3. **底部信息**:
   - 中央生命条: 宽度 33%，绿色进度条
   - 右下武器信息:
     - 武器名称: "ASSAULT RIFLE"
     - 弹药显示: "当前/备用"（格式化：2位/3位）
     - 换弹提示文本

**准星渲染**:
- 位置: 屏幕中央
- 样式: 绿色圆圈（4x4px，边框 2px）+ 中心点（0.5x0.5px）
- 透明度: 50%

### 11. 游戏结束流程

**触发条件**:
- `gameState.health <= 0`

**处理逻辑**:
```typescript
// App.tsx updateGameState
if (next.health <= 0 && !isGameOver) {
  setIsGameOver(true)
}
```

**结束界面**:
- 半透明黑色背景（bg-black/80）
- 标题: "MISSION FAILED"（红色，6xl，bounce 动画）
- 最终分数显示
- "RETRY MISSION" 按钮（点击刷新页面）

## 核心系统详解

### 1. 状态管理系统

**GameState 接口**:
```typescript
interface GameState {
  score: number;           // 当前分数
  health: number;          // 生命值（0-100）
  enemiesRemaining: number; // 剩余敌人数
  ammo: number;            // 当前弹药
  maxAmmo: number;         // 弹夹容量（30）
  reserveAmmo: number;     // 备用弹药
  jetpackCharges: number;  // 喷气背包充能（0-5）
  wave: number;            // 当前波次
  enemiesKilled: number;   // 击杀数
}
```

**状态更新机制**:
- 使用 `updateGameState` 回调函数
- 函数式更新: `(prev) => newState`
- 自动检测游戏结束条件
- 使用 `useCallback` 优化，避免不必要的重渲染

### 2. 物理系统

**重力系统**:
- 重力加速度: 25 单位/秒²
- 每帧应用: `velocity.y -= 25 * delta`

**跳跃系统**:
- 跳跃初速度: 10 单位/秒
- 触发条件: Space 键 + 高度 <= 2.1
- 地面高度: 2 单位

**移动系统**:
- 基础速度: 9.27 单位/秒（27.8 / 3）
- 方向计算: 基于相机旋转的局部坐标系
- 平滑移动: 使用 delta 时间确保帧率无关

**碰撞检测**:
- 子弹-敌人: 球形碰撞，半径 1 单位
- 检测点: 敌人位置 + [0, 1, 0]（躯干中心）
- 地面碰撞: 简单高度检查

### 3. 敌人 AI 系统

**状态数据**:
```typescript
interface EnemyData {
  id: string;
  position: [number, number, number];
  health: number;
  maxHealth: number;
  velocity?: [number, number, number];
  lastAttackTime?: number;
  attackCooldown?: number; // 随波次变化
}
```

**行为逻辑**:
1. **面向玩家**: 使用 `lookAt` 始终面向相机 XZ 位置
2. **移动决策**:
   - 距离 > 5: 向玩家移动（速度 3 * delta）
   - 距离 < 3: 远离玩家（速度 1.5 * delta）
   - 3 <= 距离 <= 5: 保持位置
3. **攻击决策**:
   - 距离 < 8 且冷却时间已过
   - 伤害: 10 点
   - 冷却时间: 2000ms - (wave - 1) * 100ms（最低 1000ms）

**难度递增**:
- 生命值: 100 + (wave - 1) * 20
- 攻击速度: 随波次加快
- 数量: 5 + (wave - 1) * 2

### 4. 世界生成系统

**建筑生成算法**:
```typescript
for (i = 0; i < 60; i++) {
  height = 5 + random() * 25      // 5-30
  width = 4 + random() * 6        // 4-10
  depth = 4 + random() * 6        // 4-10
  x = (random() - 0.5) * 150      // -75 到 75
  z = (random() - 0.5) * 150      // -75 到 75
  
  // 避开中心区域
  if (abs(x) < 12 && abs(z) < 12) continue
  
  // 窗户生成
  windowCount = 15 + floor(random() * 20)  // 15-35
  for (j = 0; j < windowCount; j++) {
    side = floor(random() * 4)  // 0-3 (前后左右)
    // 计算窗户位置和旋转
  }
}
```

**优化手段**:
- 使用 `useMemo` 预计算所有建筑数据
- 窗户位置和旋转在生成时计算，避免运行时计算
- 建筑数据在组件生命周期内保持不变

### 5. 渲染优化

**Three.js 优化**:
- 使用 `meshStandardMaterial` 的 PBR 材质（粗糙度、金属度）
- 阴影贴图大小: 2048x2048（平衡质量和性能）
- 子弹使用 `meshBasicMaterial`（无光照计算）
- 窗户使用 `meshBasicMaterial`（透明，无阴影）

**React 优化**:
- `useMemo` 缓存建筑数据
- `useCallback` 缓存回调函数
- `useRef` 存储非响应式数据（velocity, keys）
- 条件渲染: 死亡敌人立即从渲染树移除

**性能监控**:
- 子弹 3 秒后自动销毁
- 敌人死亡后立即移除
- 使用 `delta` 时间确保帧率无关的物理计算

## 代码架构模式

### 1. 组件化架构
- 功能分离: 每个组件负责单一职责
- Props 传递: 通过 props 传递状态和回调
- 类型安全: 所有组件都有 TypeScript 接口

### 2. 状态提升
- 游戏状态集中在 App.tsx
- 通过 props 向下传递
- 通过回调函数向上更新

### 3. 自定义 Hooks 模式
- 使用 React Hooks 管理状态和副作用
- `useFrame` 处理游戏循环
- `useEffect` 处理生命周期和事件监听

### 4. 单例模式
- AudioManager 使用单例模式
- 全局唯一实例，避免重复初始化

### 5. 函数式编程
- 纯函数更新状态: `(prev) => newState`
- 不可变数据: 使用展开运算符创建新对象
- 高阶函数: map, filter, forEach

## 优化手段总结

### 1. 性能优化
- **useMemo**: 缓存建筑数据，避免每次渲染重新计算
- **useCallback**: 缓存回调函数，减少子组件重渲染
- **useRef**: 存储非响应式数据，避免触发重渲染
- **条件渲染**: 死亡敌人立即移除，减少渲染对象
- **对象池**: 子弹自动销毁，避免内存泄漏

### 2. 渲染优化
- **材质选择**: 根据需求选择 Basic/Standard 材质
- **阴影优化**: 合理的阴影贴图大小
- **几何体复用**: Three.js 自动处理几何体实例化
- **LOD 系统**: 可扩展（当前未实现）

### 3. 内存优化
- **及时清理**: 子弹 3 秒后销毁
- **状态管理**: 使用 React 状态管理，自动垃圾回收
- **事件清理**: useEffect 返回清理函数

### 4. 代码优化
- **类型安全**: TypeScript 提供编译时类型检查
- **模块化**: 功能分离到不同文件
- **可维护性**: 清晰的命名和注释

## 运行细节

### 开发环境
```bash
npm install        # 安装依赖
npm run dev        # 启动开发服务器（localhost:3000）
```

### 构建流程
```bash
npm run build      # 生产构建
npm run preview    # 预览构建结果
```

### 浏览器要求
- 支持 WebGL 的现代浏览器
- 支持 Pointer Lock API
- 支持 Web Audio API

### 性能指标
- 目标帧率: 60 FPS
- 物理计算: 基于 delta 时间，帧率无关
- 渲染对象: 约 60 栋建筑 + 5-15 个敌人 + 0-50 个子弹

## 扩展性设计

### 可扩展功能
1. **音效系统**: 可替换为音频文件播放
2. **敌人 AI**: 可添加路径寻找、群体行为
3. **武器系统**: 可扩展多种武器类型
4. **关卡系统**: 可添加不同地图和任务
5. **多人模式**: 架构支持扩展为多人游戏
6. **存档系统**: 可添加本地存储支持

### 配置化设计
- 游戏参数集中在 GameState 和常量中
- 易于调整难度、速度、伤害等数值
- 类型定义确保配置的正确性

---

**文档版本**: 1.0  
**最后更新**: 2024  
**项目状态**: 功能完整，可运行

