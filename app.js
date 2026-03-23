const RUN_INDEX_KEY = "slotBuilderRunIndex_v1";
const RUN_PREFIX = "slotBuilderRun_";
const LEGACY_SINGLE_SAVE_V2 = "slotBuilderSave_v2";
const LEGACY_SINGLE_SAVE_V1 = "slotBuilderSave_v1";
const QUEST_REROLL_COST = { wood: 0, stone: 0, metal: 20, energy: 20 };
const RUN_SCHEMA_VERSION = 2;

const defaultState = {
  schemaVersion: RUN_SCHEMA_VERSION,
  runCreatedAt: 0,
  runId: "",
  runName: "",
  wood: 60,
  stone: 40,
  metal: 20,
  energy: 50,
  spins: 0,
  playSeconds: 0,
  passiveHistory: [],
  totalResourceHistory: [],
  unlockedMilestones: [],
  hasWon: false,
  trendSharedScale: false,
  eventCount: 0,
  offlineGainTotal: 0,
  eventLog: [],
  activityLog: [],
  biome: "meadow",
  soundEnabled: true,
  quests: [],
  questRefreshAt: 0,
  upgrades: {
    reelEfficiency: 0,
    symbolBoost: 0,
    automationBoost: 0,
    bonusBoost: 0,
  },
  structures: {
    sawmill: 0,
    quarry: 0,
    forge: 0,
    reactor: 0,
  },
};

const state = structuredClone(defaultState);

const symbols = [
  { icon: "🌲", key: "wood", base: 14 },
  { icon: "🪨", key: "stone", base: 12 },
  { icon: "⚙", key: "metal", base: 10 },
  { icon: "⚡", key: "energy", base: 16 },
];

const baseStructureCosts = {
  sawmill: { wood: 40, stone: 10, metal: 0, energy: 0 },
  quarry: { wood: 25, stone: 30, metal: 0, energy: 0 },
  forge: { wood: 0, stone: 30, metal: 30, energy: 0 },
  reactor: { wood: 0, stone: 50, metal: 25, energy: 0 },
};

const baseUpgradeCosts = {
  reelEfficiency: { wood: 0, stone: 0, metal: 80, energy: 80 },
  symbolBoost: { wood: 120, stone: 120, metal: 0, energy: 0 },
  automationBoost: { wood: 0, stone: 180, metal: 120, energy: 0 },
  bonusBoost: { wood: 0, stone: 0, metal: 100, energy: 140 },
};

const upgradeNames = {
  reelEfficiency: "Efficient Reels",
  symbolBoost: "Symbol Compression",
  automationBoost: "Automation Grid",
  bonusBoost: "Lucky Core",
};

const biomes = {
  meadow: {
    label: "Meadow",
    themeClass: "",
    symbolMult: 1,
    passiveMult: 1,
    bonusMult: 1,
    eventChance: 0.34,
  },
  volcanic: {
    label: "Volcanic",
    themeClass: "theme-volcanic",
    symbolMult: 0.95,
    passiveMult: 1.25,
    bonusMult: 1.2,
    eventChance: 0.45,
  },
  arctic: {
    label: "Arctic",
    themeClass: "theme-arctic",
    symbolMult: 1.2,
    passiveMult: 0.9,
    bonusMult: 1,
    eventChance: 0.22,
  },
  neon: {
    label: "Neon",
    themeClass: "theme-neon",
    symbolMult: 1.3,
    passiveMult: 1.08,
    bonusMult: 1.15,
    eventChance: 0.38,
  },
};

const milestones = [
  {
    id: "first-spin",
    label: "Make your first spin",
    achieved: (s) => s.spins >= 1,
    reward: { energy: 25 },
    rewardText: "+25 Energy",
  },
  {
    id: "starter-base",
    label: "Own 1 of each structure",
    achieved: (s) =>
      s.structures.sawmill >= 1 &&
      s.structures.quarry >= 1 &&
      s.structures.forge >= 1 &&
      s.structures.reactor >= 1,
    reward: { wood: 60, stone: 60, metal: 30, energy: 30 },
    rewardText: "+60 Wood, +60 Stone, +30 Metal, +30 Energy",
  },
  {
    id: "economy-up",
    label: "Reach 500 total resources",
    achieved: (s) => getTotalResources(s) >= 500,
    reward: { energy: 50 },
    rewardText: "+50 Energy",
  },
  {
    id: "builder-core",
    label: "Build 10 structures total",
    achieved: (s) => getTotalStructures(s) >= 10,
    reward: { metal: 80 },
    rewardText: "+80 Metal",
  },
  {
    id: "lab-master",
    label: "Buy 8 upgrades total",
    achieved: (s) => getTotalUpgrades(s) >= 8,
    reward: { wood: 180, stone: 180, metal: 120, energy: 120 },
    rewardText: "+180 Wood, +180 Stone, +120 Metal, +120 Energy",
  },
];

const outputPerSecond = {
  sawmill: { wood: 3, stone: 0, metal: 0, energy: 0 },
  quarry: { wood: 0, stone: 3, metal: 0, energy: 0 },
  forge: { wood: 0, stone: 0, metal: 2, energy: 0 },
  reactor: { wood: 0, stone: 0, metal: 0, energy: 4 },
};

const ids = {
  wood: document.getElementById("wood"),
  stone: document.getElementById("stone"),
  metal: document.getElementById("metal"),
  energy: document.getElementById("energy"),
  playTime: document.getElementById("play-time"),
  spinsPerMin: document.getElementById("spins-per-min"),
  passivePerSec: document.getElementById("passive-per-sec"),
  passiveMix: document.getElementById("passive-mix"),
  passiveTrendLine: document.getElementById("passive-trend-line"),
  totalTrendLine: document.getElementById("total-trend-line"),
  trendMin: document.getElementById("trend-min"),
  trendMax: document.getElementById("trend-max"),
  totalTrendMin: document.getElementById("total-trend-min"),
  totalTrendMax: document.getElementById("total-trend-max"),
  trendScaleToggle: document.getElementById("trend-scale-toggle"),
  audioToggleBtn: document.getElementById("audio-toggle-btn"),
  biomeCycleBtn: document.getElementById("biome-cycle-btn"),
  result: document.getElementById("spin-result"),
  owned: document.getElementById("owned-list"),
  milestones: document.getElementById("milestones-list"),
  winStatus: document.getElementById("win-status"),
  spinBtn: document.getElementById("spin-btn"),
  milestoneCount: document.getElementById("milestone-count"),
  eventCount: document.getElementById("event-count"),
  offlineGain: document.getElementById("offline-gain"),
  victoryProgress: document.getElementById("victory-progress"),
  upgradesList: document.getElementById("upgrades-list"),
  eventStatus: document.getElementById("event-status"),
  eventLog: document.getElementById("event-log"),
  activityLog: document.getElementById("activity-log"),
  questList: document.getElementById("quest-list"),
  questRefresh: document.getElementById("quest-refresh"),
  runNameInput: document.getElementById("run-name-input"),
  runSelect: document.getElementById("run-select"),
  runStatus: document.getElementById("run-status"),
  runSummary: document.getElementById("run-summary"),
  newRunBtn: document.getElementById("new-run-btn"),
  loadRunBtn: document.getElementById("load-run-btn"),
  saveRunBtn: document.getElementById("save-run-btn"),
  deleteRunBtn: document.getElementById("delete-run-btn"),
  exportRunBtn: document.getElementById("export-run-btn"),
  importRunBtn: document.getElementById("import-run-btn"),
  importRunFile: document.getElementById("import-run-file"),
  questRerollBtn: document.getElementById("quest-reroll-btn"),
  costTags: {
    sawmill: document.getElementById("cost-sawmill"),
    quarry: document.getElementById("cost-quarry"),
    forge: document.getElementById("cost-forge"),
    reactor: document.getElementById("cost-reactor"),
  },
  upgradeCostTags: {
    reelEfficiency: document.getElementById("cost-reelEfficiency"),
    symbolBoost: document.getElementById("cost-symbolBoost"),
    automationBoost: document.getElementById("cost-automationBoost"),
    bonusBoost: document.getElementById("cost-bonusBoost"),
  },
  reels: [
    document.getElementById("reel-1"),
    document.getElementById("reel-2"),
    document.getElementById("reel-3"),
  ],
};

let audioCtx;

function ensureAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

function playBeep(freq, duration = 0.07, volume = 0.045, type = "sine") {
  if (!state.soundEnabled) return;
  ensureAudioContext();
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + duration);
}

function getRunIndex() {
  const raw = localStorage.getItem(RUN_INDEX_KEY);
  if (!raw) return { activeRunId: "", runs: [] };
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.runs)) throw new Error("invalid");
    return {
      activeRunId: String(parsed.activeRunId || ""),
      runs: parsed.runs
        .map((r) => ({ id: String(r.id || ""), name: String(r.name || "Untitled"), updatedAt: Number(r.updatedAt) || 0 }))
        .filter((r) => r.id),
    };
  } catch {
    return { activeRunId: "", runs: [] };
  }
}

function saveRunIndex(index) {
  localStorage.setItem(RUN_INDEX_KEY, JSON.stringify(index));
}

function buildRunKey(runId) {
  return `${RUN_PREFIX}${runId}`;
}

function getPayloadSchemaVersion(raw) {
  const value = Number(raw?.schemaVersion);
  if (Number.isFinite(value) && value >= 1) return value;
  return 1;
}

function migrateV1ToV2(raw) {
  return {
    ...raw,
    schemaVersion: 2,
    runCreatedAt: Number(raw?.runCreatedAt) || Number(raw?.lastSavedAt) || Date.now(),
  };
}

function migrateRunSaveData(raw) {
  if (!raw || typeof raw !== "object") return null;

  const incomingVersion = getPayloadSchemaVersion(raw);
  if (incomingVersion > RUN_SCHEMA_VERSION) {
    return null;
  }

  let working = { ...raw };
  let version = incomingVersion;

  while (version < RUN_SCHEMA_VERSION) {
    if (version === 1) {
      working = migrateV1ToV2(working);
      version = 2;
      continue;
    }
    return null;
  }

  return working;
}

function getTotalResources(s) {
  return s.wood + s.stone + s.metal + s.energy;
}

function getTotalStructures(s) {
  return s.structures.sawmill + s.structures.quarry + s.structures.forge + s.structures.reactor;
}

function getTotalUpgrades(s) {
  return s.upgrades.reelEfficiency + s.upgrades.symbolBoost + s.upgrades.automationBoost + s.upgrades.bonusBoost;
}

function getBiomeUnlocks() {
  return {
    meadow: true,
    volcanic: getTotalStructures(state) >= 12,
    arctic: state.unlockedMilestones.length >= 4,
    neon: state.hasWon,
  };
}

function getActiveBiome() {
  return biomes[state.biome] || biomes.meadow;
}

function applyTheme() {
  document.body.classList.remove("theme-volcanic", "theme-arctic", "theme-neon");
  const active = getActiveBiome();
  if (active.themeClass) document.body.classList.add(active.themeClass);
}

function getPassiveSnapshot(s) {
  const boost = 1 + s.upgrades.automationBoost * 0.16;
  const biome = getActiveBiome();
  const biomeBoost = biome.passiveMult;
  const snapshot = { wood: 0, stone: 0, metal: 0, energy: 0 };
  Object.keys(s.structures).forEach((name) => {
    const count = s.structures[name];
    const output = outputPerSecond[name];
    snapshot.wood += Math.floor(output.wood * count * boost * biomeBoost);
    snapshot.stone += Math.floor(output.stone * count * boost * biomeBoost);
    snapshot.metal += Math.floor(output.metal * count * boost * biomeBoost);
    snapshot.energy += Math.floor(output.energy * count * boost * biomeBoost);
  });
  return snapshot;
}

function formatClock(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function getCurrentPassiveTotal(s) {
  const passive = getPassiveSnapshot(s);
  return passive.wood + passive.stone + passive.metal + passive.energy;
}

function getVictoryProgressPercent() {
  const structureGoal = Math.min(1, getTotalStructures(state) / 20);
  const resourceGoal = Math.min(1, getTotalResources(state) / 1000);
  return Math.round(((structureGoal + resourceGoal) / 2) * 100);
}

function pushPassivePoint(value) {
  state.passiveHistory.push(value);
  if (state.passiveHistory.length > 60) state.passiveHistory.shift();
}

function pushTotalResourcePoint(value) {
  state.totalResourceHistory.push(value);
  if (state.totalResourceHistory.length > 60) state.totalResourceHistory.shift();
}

function buildSparklinePoints(history, width, height, forcedMin = null, forcedMax = null) {
  const min = forcedMin ?? Math.min(...history);
  const max = forcedMax ?? Math.max(...history);
  const range = Math.max(1, max - min);
  const denominator = Math.max(1, history.length - 1);
  const points = history
    .map((value, i) => {
      const x = 2 + (i / denominator) * (width - 4);
      const normalized = (value - min) / range;
      const y = (height - 2) - normalized * (height - 8);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  return { points, min, max };
}

function renderTrendSparkline() {
  const width = 240;
  const height = 56;
  if (state.passiveHistory.length === 0 || state.totalResourceHistory.length === 0) {
    ids.passiveTrendLine.setAttribute("points", "0,54 240,54");
    ids.totalTrendLine.setAttribute("points", "0,54 240,54");
    ids.trendMin.textContent = "0";
    ids.trendMax.textContent = "0";
    ids.totalTrendMin.textContent = "0";
    ids.totalTrendMax.textContent = "0";
    return;
  }

  let passive;
  let total;
  if (state.trendSharedScale) {
    const globalMin = Math.min(...state.passiveHistory, ...state.totalResourceHistory);
    const globalMax = Math.max(...state.passiveHistory, ...state.totalResourceHistory);
    passive = buildSparklinePoints(state.passiveHistory, width, height, globalMin, globalMax);
    total = buildSparklinePoints(state.totalResourceHistory, width, height, globalMin, globalMax);
  } else {
    passive = buildSparklinePoints(state.passiveHistory, width, height);
    total = buildSparklinePoints(state.totalResourceHistory, width, height);
  }

  ids.passiveTrendLine.setAttribute("points", passive.points);
  ids.totalTrendLine.setAttribute("points", total.points);
  ids.trendMin.textContent = String(Math.floor(passive.min));
  ids.trendMax.textContent = String(Math.floor(passive.max));
  ids.totalTrendMin.textContent = String(Math.floor(total.min));
  ids.totalTrendMax.textContent = String(Math.floor(total.max));
}

function flashPanel(element) {
  if (!element) return;
  const panel = element.closest(".panel");
  if (!panel) return;
  panel.classList.remove("flash");
  void panel.offsetWidth;
  panel.classList.add("flash");
}

function addEventLog(message) {
  state.eventLog.unshift(message);
  state.eventLog = state.eventLog.slice(0, 6);
}

function addActivity(message) {
  state.activityLog.unshift(`[${formatClock(state.playSeconds)}] ${message}`);
  state.activityLog = state.activityLog.slice(0, 10);
}

function getSpinCost() {
  const reactorDiscount = Math.min(4, state.structures.reactor);
  const upgradeDiscount = Math.min(3, state.upgrades.reelEfficiency);
  return Math.max(4, 10 - reactorDiscount - upgradeDiscount);
}

function getScaledStructureCost(structure) {
  const base = baseStructureCosts[structure];
  const owned = state.structures[structure];
  const multiplier = 1 + owned * 0.15;
  return {
    wood: Math.ceil(base.wood * multiplier),
    stone: Math.ceil(base.stone * multiplier),
    metal: Math.ceil(base.metal * multiplier),
    energy: Math.ceil(base.energy * multiplier),
  };
}

function getScaledUpgradeCost(upgrade) {
  const base = baseUpgradeCosts[upgrade];
  const level = state.upgrades[upgrade];
  const multiplier = 1 + level * 0.45;
  return {
    wood: Math.ceil(base.wood * multiplier),
    stone: Math.ceil(base.stone * multiplier),
    metal: Math.ceil(base.metal * multiplier),
    energy: Math.ceil(base.energy * multiplier),
  };
}

function formatCost(cost) {
  const parts = [];
  if (cost.wood) parts.push(`${cost.wood} Wood`);
  if (cost.stone) parts.push(`${cost.stone} Stone`);
  if (cost.metal) parts.push(`${cost.metal} Metal`);
  if (cost.energy) parts.push(`${cost.energy} Energy`);
  return `Cost: ${parts.join(", ") || "Free"}`;
}

function canAfford(cost) {
  return (
    state.wood >= cost.wood &&
    state.stone >= cost.stone &&
    state.metal >= cost.metal &&
    state.energy >= cost.energy
  );
}

function spend(cost) {
  state.wood -= cost.wood;
  state.stone -= cost.stone;
  state.metal -= cost.metal;
  state.energy -= cost.energy;
}

function applyReward(reward) {
  state.wood += reward.wood || 0;
  state.stone += reward.stone || 0;
  state.metal += reward.metal || 0;
  state.energy += reward.energy || 0;
}

function createQuest(type) {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  if (type === "spin") {
    const target = 12 + Math.floor(Math.random() * 18);
    return {
      id,
      type,
      label: `Spin ${target} times`,
      target,
      reward: { energy: 40, metal: 25 },
      done: false,
      claimed: false,
    };
  }
  if (type === "build") {
    const target = 3 + Math.floor(Math.random() * 4);
    return {
      id,
      type,
      label: `Own ${target} reactors`,
      target,
      structure: "reactor",
      reward: { metal: 60, stone: 60 },
      done: false,
      claimed: false,
    };
  }
  if (type === "resource") {
    const target = 700 + Math.floor(Math.random() * 600);
    return {
      id,
      type,
      label: `Reach ${target} total resources`,
      target,
      reward: { wood: 90, stone: 90, energy: 50 },
      done: false,
      claimed: false,
    };
  }
  const target = 4 + Math.floor(Math.random() * 4);
  return {
    id,
    type: "upgrade",
    label: `Buy ${target} upgrades total`,
    target,
    reward: { metal: 70, energy: 70 },
    done: false,
    claimed: false,
  };
}

function getQuestProgress(quest) {
  if (quest.type === "spin") return state.spins;
  if (quest.type === "build") return state.structures[quest.structure] || 0;
  if (quest.type === "resource") return Math.floor(getTotalResources(state));
  return getTotalUpgrades(state);
}

function refreshQuests(force = false) {
  if (!force && state.playSeconds < state.questRefreshAt) return;
  state.quests = [createQuest("spin"), createQuest("build"), createQuest(Math.random() > 0.5 ? "resource" : "upgrade")];
  state.questRefreshAt = state.playSeconds + 180;
  addActivity("Quest board refreshed.");
}

function updateQuestProgressAndRewards() {
  state.quests.forEach((quest) => {
    const progress = getQuestProgress(quest);
    if (!quest.done && progress >= quest.target) {
      quest.done = true;
      if (!quest.claimed) {
        quest.claimed = true;
        applyReward(quest.reward);
        const rewardText = formatCost(quest.reward).replace("Cost: ", "+");
        const message = `Quest complete: ${quest.label} (${rewardText})`;
        ids.result.textContent = message;
        addActivity(message);
        playBeep(820, 0.08, 0.05, "triangle");
      }
    }
  });

  if (state.quests.length > 0 && state.quests.every((q) => q.done)) {
    state.questRefreshAt = Math.min(state.questRefreshAt, state.playSeconds + 25);
  }
}

function checkMilestones() {
  const newlyUnlocked = [];
  milestones.forEach((milestone) => {
    const alreadyUnlocked = state.unlockedMilestones.includes(milestone.id);
    if (alreadyUnlocked || !milestone.achieved(state)) return;
    state.unlockedMilestones.push(milestone.id);
    applyReward(milestone.reward);
    newlyUnlocked.push(`${milestone.label} (${milestone.rewardText})`);
  });

  if (newlyUnlocked.length > 0) {
    const message = `Milestone unlocked: ${newlyUnlocked.join(" | ")}`;
    ids.result.textContent = message;
    addActivity(message);
    playBeep(980, 0.09, 0.05, "triangle");
  }
}

function checkWinCondition() {
  const hasFiveEach =
    state.structures.sawmill >= 5 &&
    state.structures.quarry >= 5 &&
    state.structures.forge >= 5 &&
    state.structures.reactor >= 5;
  const hasResourceGoal = getTotalResources(state) >= 1000;
  if (!state.hasWon && hasFiveEach && hasResourceGoal) {
    state.hasWon = true;
    const message = "Victory achieved! You built a thriving resource engine.";
    ids.result.textContent = message;
    addActivity(message);
    playBeep(1200, 0.15, 0.07, "sawtooth");
  }
}

function runWorldEvent(eventId) {
  if (eventId === "supply-drop") {
    state.wood += 50;
    state.stone += 50;
    return "+50 Wood, +50 Stone";
  }
  if (eventId === "solar-storm") {
    state.energy += 90;
    return "+90 Energy";
  }
  if (eventId === "deep-vein") {
    state.metal += 75;
    return "+75 Metal";
  }
  if (eventId === "maintenance-drift") {
    const loss = Math.floor(state.energy * 0.1);
    state.energy = Math.max(0, state.energy - loss);
    return `-${loss} Energy`;
  }
  if (eventId === "lava-burst") {
    const gain = 120 + state.structures.reactor * 15;
    state.energy += gain;
    return `+${gain} Energy`;
  }
  if (eventId === "cold-snap") {
    const loss = Math.floor(state.wood * 0.08);
    state.wood = Math.max(0, state.wood - loss);
    return `-${loss} Wood`;
  }
  if (eventId === "neon-market") {
    const gain = 90 + state.upgrades.symbolBoost * 20;
    state.metal += gain;
    return `+${gain} Metal`;
  }
  return "No effect";
}

function getBiomeEventPool() {
  if (state.biome === "volcanic") {
    return ["supply-drop", "lava-burst", "deep-vein", "maintenance-drift"];
  }
  if (state.biome === "arctic") {
    return ["supply-drop", "solar-storm", "cold-snap", "maintenance-drift"];
  }
  if (state.biome === "neon") {
    return ["neon-market", "solar-storm", "deep-vein", "maintenance-drift"];
  }
  return ["supply-drop", "solar-storm", "deep-vein", "maintenance-drift"];
}

function humanizeEvent(id) {
  const map = {
    "supply-drop": "Supply Drop",
    "solar-storm": "Solar Storm",
    "deep-vein": "Deep Vein",
    "maintenance-drift": "Maintenance Drift",
    "lava-burst": "Lava Burst",
    "cold-snap": "Cold Snap",
    "neon-market": "Neon Market",
  };
  return map[id] || id;
}

function maybeTriggerWorldEvent() {
  if (state.playSeconds === 0 || state.playSeconds % 20 !== 0) return;
  const chance = getActiveBiome().eventChance;
  if (Math.random() > chance) return;

  const pool = getBiomeEventPool();
  const eventId = pool[Math.floor(Math.random() * pool.length)];
  const payload = runWorldEvent(eventId);
  const message = `${humanizeEvent(eventId)}: ${payload}`;
  state.eventCount += 1;
  ids.eventStatus.textContent = message;
  addEventLog(message);
  addActivity(`Event -> ${message}`);

  if (payload.includes("-")) {
    playBeep(180, 0.09, 0.045, "square");
  } else {
    playBeep(540, 0.07, 0.04, "triangle");
  }
}

function spin() {
  const spinCost = getSpinCost();
  if (state.energy < spinCost) {
    ids.result.textContent = "Not enough Energy to spin.";
    playBeep(180, 0.05, 0.03, "square");
    return;
  }

  state.energy -= spinCost;
  state.spins += 1;

  const biome = getActiveBiome();
  const symbolMultiplier = (1 + state.upgrades.symbolBoost * 0.14) * biome.symbolMult;
  const bonusMultiplier = (1 + state.upgrades.bonusBoost * 0.22) * biome.bonusMult;

  const rolled = Array.from({ length: 3 }, () => symbols[Math.floor(Math.random() * symbols.length)]);
  rolled.forEach((entry, i) => {
    ids.reels[i].textContent = entry.icon;
    ids.reels[i].classList.remove("spin");
    void ids.reels[i].offsetWidth;
    ids.reels[i].classList.add("spin");
  });

  let totalGain = 0;
  const gainText = [];

  rolled.forEach((entry) => {
    const gain = Math.floor(entry.base * symbolMultiplier);
    state[entry.key] += gain;
    totalGain += gain;
  });

  const keys = rolled.map((r) => r.key);
  const allMatch = keys[0] === keys[1] && keys[1] === keys[2];
  const pairMatch = keys[0] === keys[1] || keys[1] === keys[2] || keys[0] === keys[2];

  if (allMatch) {
    const bonus = Math.floor(35 * bonusMultiplier);
    state[keys[0]] += bonus;
    totalGain += bonus;
    gainText.push(`JACKPOT +${bonus} ${keys[0]}`);
    playBeep(1100, 0.1, 0.06, "triangle");
  } else if (pairMatch) {
    const bonus = Math.floor(15 * bonusMultiplier);
    const counts = keys.reduce((acc, key) => {
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const matched = Object.keys(counts).find((key) => counts[key] >= 2);
    state[matched] += bonus;
    totalGain += bonus;
    gainText.push(`Pair bonus +${bonus} ${matched}`);
    playBeep(700, 0.06, 0.04, "sine");
  } else {
    playBeep(420, 0.05, 0.03, "sine");
  }

  const message = `Spin gain: +${totalGain} resources. ${gainText.join(" ")}`.trim();
  ids.result.textContent = message;
  addActivity(message);
  flashPanel(ids.spinBtn);

  updateQuestProgressAndRewards();
  checkMilestones();
  checkWinCondition();
  saveCurrentRun(false);
  updateUi();
}

function buildStructure(structure) {
  const cost = getScaledStructureCost(structure);
  if (!canAfford(cost)) {
    ids.result.textContent = "Not enough resources to build that structure.";
    return;
  }

  spend(cost);
  state.structures[structure] += 1;
  const message = `Built 1 ${structure}. Passive output increased.`;
  ids.result.textContent = message;
  addActivity(message);
  playBeep(500, 0.06, 0.04, "triangle");
  flashPanel(ids.owned);

  updateQuestProgressAndRewards();
  checkMilestones();
  checkWinCondition();
  saveCurrentRun(false);
  updateUi();
}

function buyUpgrade(name) {
  const cost = getScaledUpgradeCost(name);
  if (!canAfford(cost)) {
    ids.result.textContent = `Not enough resources for ${upgradeNames[name]}.`;
    return;
  }

  spend(cost);
  state.upgrades[name] += 1;
  const message = `Upgrade purchased: ${upgradeNames[name]} Lv.${state.upgrades[name]}`;
  ids.result.textContent = message;
  addActivity(message);
  playBeep(760, 0.08, 0.05, "triangle");
  flashPanel(ids.upgradesList);

  updateQuestProgressAndRewards();
  checkMilestones();
  checkWinCondition();
  saveCurrentRun(false);
  updateUi();
}

function tickPassiveIncome() {
  state.playSeconds += 1;

  refreshQuests(false);

  const output = getPassiveSnapshot(state);
  state.wood += output.wood;
  state.stone += output.stone;
  state.metal += output.metal;
  state.energy += output.energy;

  maybeTriggerWorldEvent();

  pushPassivePoint(getCurrentPassiveTotal(state));
  pushTotalResourcePoint(getTotalResources(state));

  updateQuestProgressAndRewards();
  checkMilestones();
  checkWinCondition();
  updateUi();
}

function applyOfflineProgress(lastSavedAt) {
  if (!lastSavedAt) return;
  const elapsedSec = Math.floor((Date.now() - lastSavedAt) / 1000);
  if (elapsedSec <= 4) return;

  const capped = Math.min(elapsedSec, 4 * 60 * 60);
  const perSec = getPassiveSnapshot(state);
  const addWood = perSec.wood * capped;
  const addStone = perSec.stone * capped;
  const addMetal = perSec.metal * capped;
  const addEnergy = perSec.energy * capped;
  const gain = addWood + addStone + addMetal + addEnergy;

  state.wood += addWood;
  state.stone += addStone;
  state.metal += addMetal;
  state.energy += addEnergy;
  state.offlineGainTotal += gain;

  if (gain > 0) {
    const msg = `Offline production (${formatClock(capped)}): +${gain} total resources.`;
    ids.result.textContent = msg;
    addActivity(msg);
  }
}

function copyStateFrom(source) {
  const merged = { ...structuredClone(defaultState), ...source };
  state.schemaVersion = Number(merged.schemaVersion) || RUN_SCHEMA_VERSION;
  state.runCreatedAt = Number(merged.runCreatedAt) || Date.now();
  state.runId = merged.runId;
  state.runName = merged.runName;
  state.wood = merged.wood;
  state.stone = merged.stone;
  state.metal = merged.metal;
  state.energy = merged.energy;
  state.spins = merged.spins;
  state.playSeconds = merged.playSeconds;
  state.passiveHistory = Array.isArray(merged.passiveHistory) ? [...merged.passiveHistory] : [];
  state.totalResourceHistory = Array.isArray(merged.totalResourceHistory) ? [...merged.totalResourceHistory] : [];
  state.unlockedMilestones = Array.isArray(merged.unlockedMilestones) ? [...merged.unlockedMilestones] : [];
  state.hasWon = Boolean(merged.hasWon);
  state.trendSharedScale = Boolean(merged.trendSharedScale);
  state.eventCount = Number(merged.eventCount) || 0;
  state.offlineGainTotal = Number(merged.offlineGainTotal) || 0;
  state.eventLog = Array.isArray(merged.eventLog) ? [...merged.eventLog] : [];
  state.activityLog = Array.isArray(merged.activityLog) ? [...merged.activityLog] : [];
  state.biome = merged.biome && biomes[merged.biome] ? merged.biome : "meadow";
  state.soundEnabled = merged.soundEnabled !== false;
  state.quests = Array.isArray(merged.quests) ? [...merged.quests] : [];
  state.questRefreshAt = Number(merged.questRefreshAt) || 0;
  state.upgrades = {
    reelEfficiency: Number(merged.upgrades?.reelEfficiency) || 0,
    symbolBoost: Number(merged.upgrades?.symbolBoost) || 0,
    automationBoost: Number(merged.upgrades?.automationBoost) || 0,
    bonusBoost: Number(merged.upgrades?.bonusBoost) || 0,
  };
  state.structures = {
    sawmill: Number(merged.structures?.sawmill) || 0,
    quarry: Number(merged.structures?.quarry) || 0,
    forge: Number(merged.structures?.forge) || 0,
    reactor: Number(merged.structures?.reactor) || 0,
  };
}

function sanitizeRunSaveData(raw) {
  if (!raw || typeof raw !== "object") return null;
  if (!raw.structures || typeof raw.structures !== "object") return null;

  return {
    schemaVersion: Number(raw.schemaVersion) || RUN_SCHEMA_VERSION,
    runCreatedAt: Number(raw.runCreatedAt) || Number(raw.lastSavedAt) || Date.now(),
    runId: String(raw.runId || ""),
    runName: String(raw.runName || ""),
    wood: Number(raw.wood) || 0,
    stone: Number(raw.stone) || 0,
    metal: Number(raw.metal) || 0,
    energy: Number(raw.energy) || 0,
    spins: Number(raw.spins) || 0,
    playSeconds: Number(raw.playSeconds) || 0,
    passiveHistory: Array.isArray(raw.passiveHistory)
      ? raw.passiveHistory.map((v) => Number(v) || 0).slice(-60)
      : [],
    totalResourceHistory: Array.isArray(raw.totalResourceHistory)
      ? raw.totalResourceHistory.map((v) => Number(v) || 0).slice(-60)
      : [],
    unlockedMilestones: Array.isArray(raw.unlockedMilestones)
      ? raw.unlockedMilestones.filter((id) => milestones.some((m) => m.id === id))
      : [],
    hasWon: Boolean(raw.hasWon),
    trendSharedScale: Boolean(raw.trendSharedScale),
    eventCount: Number(raw.eventCount) || 0,
    offlineGainTotal: Number(raw.offlineGainTotal) || 0,
    eventLog: Array.isArray(raw.eventLog) ? raw.eventLog.map((v) => String(v)).slice(0, 6) : [],
    activityLog: Array.isArray(raw.activityLog) ? raw.activityLog.map((v) => String(v)).slice(0, 10) : [],
    biome: String(raw.biome || "meadow"),
    soundEnabled: raw.soundEnabled !== false,
    quests: Array.isArray(raw.quests) ? raw.quests.slice(0, 5) : [],
    questRefreshAt: Number(raw.questRefreshAt) || 0,
    upgrades: {
      reelEfficiency: Math.max(0, Number(raw.upgrades?.reelEfficiency) || 0),
      symbolBoost: Math.max(0, Number(raw.upgrades?.symbolBoost) || 0),
      automationBoost: Math.max(0, Number(raw.upgrades?.automationBoost) || 0),
      bonusBoost: Math.max(0, Number(raw.upgrades?.bonusBoost) || 0),
    },
    structures: {
      sawmill: Math.max(0, Number(raw.structures?.sawmill) || 0),
      quarry: Math.max(0, Number(raw.structures?.quarry) || 0),
      forge: Math.max(0, Number(raw.structures?.forge) || 0),
      reactor: Math.max(0, Number(raw.structures?.reactor) || 0),
    },
    lastSavedAt: Number(raw.lastSavedAt) || 0,
  };
}

function createSnapshot() {
  return {
    schemaVersion: RUN_SCHEMA_VERSION,
    runCreatedAt: state.runCreatedAt || Date.now(),
    runId: state.runId,
    runName: state.runName,
    wood: state.wood,
    stone: state.stone,
    metal: state.metal,
    energy: state.energy,
    spins: state.spins,
    playSeconds: state.playSeconds,
    passiveHistory: state.passiveHistory,
    totalResourceHistory: state.totalResourceHistory,
    unlockedMilestones: state.unlockedMilestones,
    hasWon: state.hasWon,
    trendSharedScale: state.trendSharedScale,
    eventCount: state.eventCount,
    offlineGainTotal: state.offlineGainTotal,
    eventLog: state.eventLog,
    activityLog: state.activityLog,
    biome: state.biome,
    soundEnabled: state.soundEnabled,
    quests: state.quests,
    questRefreshAt: state.questRefreshAt,
    upgrades: state.upgrades,
    structures: state.structures,
    lastSavedAt: Date.now(),
  };
}

function renderRunSelect(index) {
  ids.runSelect.innerHTML = "";
  index.runs.forEach((run) => {
    const option = document.createElement("option");
    option.value = run.id;
    option.textContent = `${run.name} (${new Date(run.updatedAt || Date.now()).toLocaleString()})`;
    if (run.id === index.activeRunId) option.selected = true;
    ids.runSelect.appendChild(option);
  });
}

function setRunStatus(message) {
  ids.runStatus.textContent = message;
}

function makeRunSummary(snapshot, fallbackUpdatedAt = 0) {
  if (!snapshot) return null;
  const schemaVersion = getPayloadSchemaVersion(snapshot);
  return {
    runName: snapshot.runName || "Untitled",
    schemaVersion,
    biome: snapshot.biome || "meadow",
    playSeconds: Number(snapshot.playSeconds) || 0,
    totalResources:
      (Number(snapshot.wood) || 0) +
      (Number(snapshot.stone) || 0) +
      (Number(snapshot.metal) || 0) +
      (Number(snapshot.energy) || 0),
    totalStructures:
      (Number(snapshot.structures?.sawmill) || 0) +
      (Number(snapshot.structures?.quarry) || 0) +
      (Number(snapshot.structures?.forge) || 0) +
      (Number(snapshot.structures?.reactor) || 0),
    updatedAt: Number(snapshot.lastSavedAt) || fallbackUpdatedAt || Date.now(),
  };
}

function renderRunSummary(runId) {
  ids.runSummary.innerHTML = "";
  if (!runId) {
    const empty = document.createElement("span");
    empty.textContent = "No run selected.";
    ids.runSummary.appendChild(empty);
    return;
  }

  const raw = localStorage.getItem(buildRunKey(runId));
  if (!raw) {
    const missing = document.createElement("span");
    missing.textContent = "Selected run has no saved payload.";
    ids.runSummary.appendChild(missing);
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const invalid = document.createElement("span");
    invalid.textContent = "Selected run payload is invalid JSON.";
    ids.runSummary.appendChild(invalid);
    return;
  }

  const summary = makeRunSummary(parsed);
  if (!summary) return;

  ids.runSummary.innerHTML = `
    <strong>Selected Run Summary</strong>
    <span>Name: ${summary.runName}</span>
    <span>Schema: v${summary.schemaVersion}</span>
    <span>Biome: ${summary.biome}</span>
    <span>Play Time: ${formatClock(summary.playSeconds)}</span>
    <span>Total Resources: ${Math.floor(summary.totalResources)}</span>
    <span>Total Structures: ${summary.totalStructures}</span>
    <span>Last Save: ${new Date(summary.updatedAt).toLocaleString()}</span>
  `;
}

function saveCurrentRun(showMessage = true) {
  if (!state.runId) return;

  const snapshot = createSnapshot();
  localStorage.setItem(buildRunKey(state.runId), JSON.stringify(snapshot));

  const index = getRunIndex();
  const existing = index.runs.find((r) => r.id === state.runId);
  if (existing) {
    existing.name = state.runName;
    existing.updatedAt = Date.now();
  } else {
    index.runs.push({ id: state.runId, name: state.runName, updatedAt: Date.now() });
  }
  index.activeRunId = state.runId;
  saveRunIndex(index);
  renderRunSelect(index);
  renderRunSummary(state.runId);

  if (showMessage) {
    ids.result.textContent = "Run saved.";
    setRunStatus(`Saved run: ${state.runName}`);
  }
}

function loadRunById(runId, showMessage = true) {
  const raw = localStorage.getItem(buildRunKey(runId));
  if (!raw) {
    if (showMessage) ids.result.textContent = "Selected run data missing.";
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    if (showMessage) ids.result.textContent = "Run data is corrupted.";
    return;
  }

  const migrated = migrateRunSaveData(parsed);
  if (!migrated) {
    if (showMessage) ids.result.textContent = "Run data schema is unsupported.";
    return;
  }

  const safe = sanitizeRunSaveData(migrated);
  if (!safe) {
    if (showMessage) ids.result.textContent = "Run data is invalid.";
    return;
  }

  copyStateFrom(safe);
  applyOfflineProgress(safe.lastSavedAt);
  if (!state.quests || state.quests.length === 0) refreshQuests(true);

  const index = getRunIndex();
  index.activeRunId = runId;
  saveRunIndex(index);
  renderRunSelect(index);
  renderRunSummary(runId);

  checkBiomeUnlockAfterLoad();
  checkMilestones();
  updateQuestProgressAndRewards();
  checkWinCondition();
  updateUi();

  if (showMessage) {
    ids.result.textContent = "Run loaded.";
    setRunStatus(`Loaded run: ${state.runName}`);
  }
}

function checkBiomeUnlockAfterLoad() {
  const unlocks = getBiomeUnlocks();
  if (!unlocks[state.biome]) {
    state.biome = "meadow";
  }
}

function createNewRun(name) {
  const runName = (name || "").trim() || `Run ${new Date().toLocaleTimeString()}`;
  const runId = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const createdAt = Date.now();

  copyStateFrom({
    ...structuredClone(defaultState),
    schemaVersion: RUN_SCHEMA_VERSION,
    runCreatedAt: createdAt,
    runId,
    runName,
    soundEnabled: state.soundEnabled,
  });

  refreshQuests(true);
  pushPassivePoint(getCurrentPassiveTotal(state));
  pushTotalResourcePoint(getTotalResources(state));

  const index = getRunIndex();
  index.runs.push({ id: runId, name: runName, updatedAt: Date.now() });
  index.activeRunId = runId;
  saveRunIndex(index);

  saveCurrentRun(false);
  renderRunSelect(index);
  renderRunSummary(runId);
  updateUi();
  ids.result.textContent = `Created new run: ${runName}`;
  setRunStatus(`Active run: ${runName}`);
}

function deleteSelectedRun() {
  const runId = ids.runSelect.value;
  if (!runId) {
    ids.result.textContent = "No run selected.";
    return;
  }

  localStorage.removeItem(buildRunKey(runId));
  const index = getRunIndex();
  index.runs = index.runs.filter((r) => r.id !== runId);

  if (index.runs.length === 0) {
    index.activeRunId = "";
    saveRunIndex(index);
    createNewRun("Fresh Run");
    ids.result.textContent = "Run deleted. Created a fresh run.";
    return;
  }

  if (index.activeRunId === runId) {
    index.activeRunId = index.runs[0].id;
  }
  saveRunIndex(index);
  renderRunSelect(index);
  loadRunById(index.activeRunId, false);
  renderRunSummary(index.activeRunId);
  ids.result.textContent = "Run deleted.";
  setRunStatus(`Active run: ${state.runName}`);
}

function rerollQuests() {
  if (!canAfford(QUEST_REROLL_COST)) {
    ids.result.textContent = "Need 20 Energy and 20 Metal to reroll quests.";
    playBeep(170, 0.05, 0.03, "square");
    return;
  }

  spend(QUEST_REROLL_COST);
  refreshQuests(true);
  updateQuestProgressAndRewards();
  const message = "Quest board rerolled.";
  ids.result.textContent = message;
  addActivity(message);
  playBeep(560, 0.06, 0.04, "triangle");
  saveCurrentRun(false);
  updateUi();
}

function exportCurrentRun() {
  if (!state.runId) {
    ids.result.textContent = "No active run to export.";
    return;
  }

  const payload = JSON.stringify(createSnapshot(), null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const safeName = (state.runName || "run").replace(/[^a-z0-9_-]+/gi, "_");
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${safeName || "run"}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);

  ids.result.textContent = "Run exported to JSON.";
}

function importRunFromFile(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    let parsed;
    try {
      parsed = JSON.parse(String(reader.result || ""));
    } catch {
      ids.result.textContent = "Import failed: invalid JSON.";
      return;
    }

    const migrated = migrateRunSaveData(parsed);
    if (!migrated) {
      ids.result.textContent = "Import failed: unsupported schema version.";
      return;
    }

    const safe = sanitizeRunSaveData(migrated);
    if (!safe) {
      ids.result.textContent = "Import failed: invalid run structure.";
      return;
    }

    const runId = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const proposedName = (safe.runName || "Imported Run").trim();
    const runName = `${proposedName} (Imported)`;

    const snapshot = {
      ...safe,
      runId,
      runName,
      lastSavedAt: Date.now(),
    };

    localStorage.setItem(buildRunKey(runId), JSON.stringify(snapshot));
    const index = getRunIndex();
    index.runs.push({ id: runId, name: runName, updatedAt: Date.now() });
    index.activeRunId = runId;
    saveRunIndex(index);

    loadRunById(runId, false);
    renderRunSummary(runId);
    ids.result.textContent = `Imported run: ${runName}`;
    setRunStatus(`Active run: ${runName}`);
    playBeep(780, 0.08, 0.05, "triangle");
  };
  reader.readAsText(file);
}

function importLegacySingleSaveIfNeeded() {
  const index = getRunIndex();
  if (index.runs.length > 0) return;

  const legacyRaw = localStorage.getItem(LEGACY_SINGLE_SAVE_V2) || localStorage.getItem(LEGACY_SINGLE_SAVE_V1);
  if (!legacyRaw) return;

  let parsed;
  try {
    parsed = JSON.parse(legacyRaw);
  } catch {
    return;
  }

  const migrated = migrateRunSaveData(parsed);
  if (!migrated) return;

  const safe = sanitizeRunSaveData({ ...migrated, runId: "legacy", runName: "Legacy Run" });
  if (!safe) return;

  const runId = `${Date.now()}_legacy`;
  const runName = "Legacy Run";
  safe.runId = runId;
  safe.runName = runName;

  localStorage.setItem(buildRunKey(runId), JSON.stringify(safe));
  saveRunIndex({
    activeRunId: runId,
    runs: [{ id: runId, name: runName, updatedAt: Date.now() }],
  });
}

function toggleTrendScale() {
  state.trendSharedScale = !state.trendSharedScale;
  updateUi();
}

function cycleBiome() {
  const keys = Object.keys(biomes);
  const unlocks = getBiomeUnlocks();
  let index = keys.indexOf(state.biome);
  for (let i = 0; i < keys.length; i += 1) {
    index = (index + 1) % keys.length;
    const candidate = keys[index];
    if (unlocks[candidate]) {
      state.biome = candidate;
      const message = `Biome switched to ${biomes[candidate].label}.`;
      ids.result.textContent = message;
      addActivity(message);
      playBeep(620, 0.05, 0.03, "triangle");
      saveCurrentRun(false);
      updateUi();
      return;
    }
  }
}

function toggleAudio() {
  state.soundEnabled = !state.soundEnabled;
  if (state.soundEnabled) {
    playBeep(660, 0.06, 0.04, "triangle");
  }
  saveCurrentRun(false);
  updateUi();
}

function bindKeyboardShortcuts() {
  document.addEventListener("keydown", (event) => {
    const tag = (event.target && event.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

    if (event.code === "Space") {
      event.preventDefault();
      spin();
      return;
    }

    const map = {
      Digit1: "sawmill",
      Digit2: "quarry",
      Digit3: "forge",
      Digit4: "reactor",
    };

    if (map[event.code]) {
      event.preventDefault();
      buildStructure(map[event.code]);
      return;
    }

    if (event.code === "KeyB") {
      event.preventDefault();
      cycleBiome();
    }
  });
}

function updateUi() {
  applyTheme();

  ids.wood.textContent = Math.floor(state.wood);
  ids.stone.textContent = Math.floor(state.stone);
  ids.metal.textContent = Math.floor(state.metal);
  ids.energy.textContent = Math.floor(state.energy);

  const spinCost = getSpinCost();
  ids.spinBtn.textContent = `Spin (${spinCost} Energy)`;
  ids.spinBtn.disabled = state.energy < spinCost;
  ids.questRerollBtn.disabled = !canAfford(QUEST_REROLL_COST);

  const minutesPlayed = Math.max(state.playSeconds / 60, 1 / 60);
  const spinsPerMinute = state.spins / minutesPlayed;
  const passive = getPassiveSnapshot(state);
  const passiveTotal = passive.wood + passive.stone + passive.metal + passive.energy;

  ids.playTime.textContent = formatClock(state.playSeconds);
  ids.spinsPerMin.textContent = spinsPerMinute.toFixed(2);
  ids.passivePerSec.textContent = passiveTotal;
  ids.passiveMix.textContent = `W${passive.wood} S${passive.stone} M${passive.metal} E${passive.energy}`;

  ids.trendScaleToggle.textContent = state.trendSharedScale ? "Scale: Shared" : "Scale: Independent";
  ids.audioToggleBtn.textContent = state.soundEnabled ? "Audio: On" : "Audio: Off";

  const unlocks = getBiomeUnlocks();
  const biomeLabel = biomes[state.biome]?.label || "Meadow";
  ids.biomeCycleBtn.textContent = `Biome: ${biomeLabel}`;
  ids.biomeCycleBtn.disabled = Object.values(unlocks).filter(Boolean).length <= 1;

  renderTrendSparkline();

  Object.keys(ids.costTags).forEach((name) => {
    ids.costTags[name].textContent = formatCost(getScaledStructureCost(name));
  });

  Object.keys(ids.upgradeCostTags).forEach((name) => {
    ids.upgradeCostTags[name].textContent = formatCost(getScaledUpgradeCost(name));
  });

  ids.owned.innerHTML = `
    <strong>Owned Structures</strong>
    <span>Sawmill: ${state.structures.sawmill}</span>
    <span>Quarry: ${state.structures.quarry}</span>
    <span>Forge: ${state.structures.forge}</span>
    <span>Reactor: ${state.structures.reactor}</span>
    <span>Total Structures: ${getTotalStructures(state)}</span>
    <span>Total Resources: ${Math.floor(getTotalResources(state))}</span>
    <span>Biome: ${biomeLabel}</span>
  `;

  ids.upgradesList.innerHTML = `
    <strong>Upgrade Levels</strong>
    <span>Efficient Reels: ${state.upgrades.reelEfficiency}</span>
    <span>Symbol Compression: ${state.upgrades.symbolBoost}</span>
    <span>Automation Grid: ${state.upgrades.automationBoost}</span>
    <span>Lucky Core: ${state.upgrades.bonusBoost}</span>
    <span>Total Upgrades: ${getTotalUpgrades(state)}</span>
  `;

  ids.milestones.innerHTML = `<strong>Milestones</strong>`;
  milestones.forEach((milestone) => {
    const done = state.unlockedMilestones.includes(milestone.id);
    const item = document.createElement("span");
    item.className = done ? "milestone-done" : "milestone-pending";
    item.textContent = done
      ? `Done: ${milestone.label} (${milestone.rewardText})`
      : `Pending: ${milestone.label} (${milestone.rewardText})`;
    ids.milestones.appendChild(item);
  });

  ids.questList.innerHTML = "";
  if (state.quests.length === 0) {
    const empty = document.createElement("span");
    empty.textContent = "No quests active.";
    ids.questList.appendChild(empty);
  } else {
    state.quests.forEach((quest) => {
      const line = document.createElement("span");
      const progress = Math.min(getQuestProgress(quest), quest.target);
      line.className = quest.done ? "quest-done" : "quest-pending";
      line.textContent = `${quest.label} (${progress}/${quest.target})`;
      ids.questList.appendChild(line);
    });
  }

  const secsToRefresh = Math.max(0, state.questRefreshAt - state.playSeconds);
  ids.questRefresh.textContent = `Quest refresh in ${formatClock(secsToRefresh)}`;

  ids.eventLog.innerHTML = "";
  if (state.eventLog.length === 0) {
    const empty = document.createElement("span");
    empty.textContent = "No events yet.";
    ids.eventLog.appendChild(empty);
  } else {
    state.eventLog.forEach((entry) => {
      const line = document.createElement("span");
      line.textContent = entry;
      ids.eventLog.appendChild(line);
    });
  }

  ids.activityLog.innerHTML = "";
  if (state.activityLog.length === 0) {
    const empty = document.createElement("span");
    empty.textContent = "No activity yet.";
    ids.activityLog.appendChild(empty);
  } else {
    state.activityLog.forEach((entry) => {
      const line = document.createElement("span");
      line.textContent = entry;
      ids.activityLog.appendChild(line);
    });
  }

  const progress = getVictoryProgressPercent();
  ids.victoryProgress.style.width = `${progress}%`;
  ids.milestoneCount.textContent = `Milestones ${state.unlockedMilestones.length}/${milestones.length}`;
  ids.eventCount.textContent = `Events ${state.eventCount}`;
  ids.offlineGain.textContent = `Offline Gain ${Math.floor(state.offlineGainTotal)}`;

  ids.winStatus.textContent = state.hasWon
    ? "Victory reached! Your camp is fully developed. Keep playing to optimize."
    : "Victory target: 5 of each structure and 1000 total resources.";

  setRunStatus(state.runName ? `Active run: ${state.runName}` : "No run loaded.");

  const selectedRunId = ids.runSelect.value || state.runId;
  if (selectedRunId) {
    renderRunSummary(selectedRunId);
  }
}

function bootRuns() {
  importLegacySingleSaveIfNeeded();
  const index = getRunIndex();

  if (index.runs.length === 0) {
    createNewRun("First Run");
    return;
  }

  renderRunSelect(index);
  const runId = index.activeRunId || index.runs[0].id;
  loadRunById(runId, false);
  renderRunSummary(runId);
}

ids.spinBtn.addEventListener("click", spin);
ids.trendScaleToggle.addEventListener("click", toggleTrendScale);
ids.audioToggleBtn.addEventListener("click", toggleAudio);
ids.biomeCycleBtn.addEventListener("click", cycleBiome);

ids.newRunBtn.addEventListener("click", () => {
  createNewRun(ids.runNameInput.value);
  ids.runNameInput.value = "";
});

ids.runSelect.addEventListener("change", () => {
  renderRunSummary(ids.runSelect.value);
});

ids.loadRunBtn.addEventListener("click", () => {
  if (!ids.runSelect.value) {
    ids.result.textContent = "Choose a run to load.";
    return;
  }
  loadRunById(ids.runSelect.value, true);
});

ids.saveRunBtn.addEventListener("click", () => saveCurrentRun(true));
ids.deleteRunBtn.addEventListener("click", deleteSelectedRun);
ids.exportRunBtn.addEventListener("click", exportCurrentRun);
ids.importRunBtn.addEventListener("click", () => ids.importRunFile.click());
ids.importRunFile.addEventListener("change", () => {
  importRunFromFile(ids.importRunFile.files?.[0]);
  ids.importRunFile.value = "";
});
ids.questRerollBtn.addEventListener("click", rerollQuests);

document.querySelectorAll(".build-btn").forEach((btn) => {
  btn.addEventListener("click", () => buildStructure(btn.dataset.structure));
});

document.querySelectorAll(".upgrade-btn").forEach((btn) => {
  btn.addEventListener("click", () => buyUpgrade(btn.dataset.upgrade));
});

bindKeyboardShortcuts();
bootRuns();
setInterval(tickPassiveIncome, 1000);
setInterval(() => saveCurrentRun(false), 5000);
updateUi();
