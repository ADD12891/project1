const chartMain = {
  labels: buildChartLabelsFromStartDate(defaultTodayChartStart(), defaultTodayChartDays()),
  values: defaultTodayChartValues(),
  ticks: [0,20,40,60,80,100],
  legend: [
    ["0-20", "#14a86a"],
    ["21-40", "#66ef98"],
    ["41-60", "#ecef1c"],
    ["61-80", "#f0943a"],
    ["81-100", "#d91521"]
  ]
};

function defaultTodayChartDays() {
  return 20;
}

function defaultTodayChartStart() {
  return "2026-09-01";
}

function defaultTodayChartValues() {
  return [20, 28, 55, 73, 61, 92, 52, 100, 76, 52, 38, 74, 29, 75, 95, 60, 72, 39, 53, 47];
}

function todayOverviewStorageKeyValue() {
  return "shieldlog:today-overview";
}

const todayMetricDefinitions = [
  { id: "customs", titleZh: "通关与监管", titleEn: "Customs & Supervision", iconName: "", assetPath: "./assets/nav-icons/大学,学府,法院.svg", assetAlt: "通关与监管图标", assetClass: "today-icon-asset" },
  { id: "upstream", titleZh: "上游货源与装港", titleEn: "Upstream Supply & Loading", iconName: "", assetPath: "./assets/nav-icons/仓库管理.svg", assetAlt: "上游货源与装港图标", assetClass: "today-icon-asset" },
  { id: "demand", titleZh: "市场需求", titleEn: "Market Demand", iconName: "", assetPath: "./assets/nav-icons/柱状图.svg", assetAlt: "市场需求图标", assetClass: "today-icon-asset" },
  { id: "routeTransit", titleZh: "航路通行", titleEn: "Route Transit", iconName: "", assetPath: "./assets/nav-icons/船只.svg", assetAlt: "航路通行图标", assetClass: "today-icon-asset" },
  { id: "weather", titleZh: "气象海况", titleEn: "Weather & Sea State", iconName: "", assetPath: "./assets/nav-icons/多云.svg", assetAlt: "气象海况图标", assetClass: "today-icon-asset today-icon-asset-weather" },
  { id: "sentiment", titleZh: "市场情绪", titleEn: "Market Sentiment", iconName: "face", assetPath: "", assetAlt: "", iconClass: "today-icon-svg today-icon-svg-strong", assetClass: "today-icon-asset" },
  { id: "freight", titleZh: "运价指数", titleEn: "Freight Index", iconName: "", assetPath: "./assets/nav-icons/运价指数.svg", assetAlt: "运价指数图标", assetClass: "today-icon-asset today-icon-asset-strong" }
];

const initialTodayOverviewState = {
  score: {
    value: 53,
    direction: "up",
    delta: 15
  },
  chart: {
    startDate: defaultTodayChartStart(),
    labels: chartMain.labels.slice(),
    values: chartMain.values.slice()
  },
  metrics: {
    customs: { value: 61, risk: "medium", direction: "up", delta: 5 },
    upstream: { value: 11, risk: "none", direction: "down", delta: 45 },
    demand: { value: 25, risk: "low", direction: "down", delta: 26 },
    routeTransit: { value: 98, risk: "high", direction: "up", delta: 35 },
    weather: { value: 69, risk: "medium", direction: "up", delta: 5 },
    sentiment: { value: 28, risk: "low", direction: "down", delta: 45 },
    freight: { value: 8, risk: "none", direction: "down", delta: 45 }
  }
};

function createTodayOverviewState() {
  return JSON.parse(JSON.stringify(initialTodayOverviewState));
}

const initialLogisticsOverviewState = {
  score: {
    value: 53,
    direction: "up",
    delta: 15
  },
  chart: {
    startDate: defaultTodayChartStart(),
    labels: chartMain.labels.slice(),
    values: chartMain.values.slice()
  }
};

function createLogisticsOverviewState() {
  return JSON.parse(JSON.stringify(initialLogisticsOverviewState));
}

function normalizeStoredChartStartDate(raw, fallback = initialTodayOverviewState.chart.startDate) {
  const parsed = parseShortDate(raw) || parseShortDate(fallback) || new Date();
  return formatShortDate(parsed);
}

function normalizeStoredChartValues(values, fallbackValues = initialTodayOverviewState.chart.values) {
  const source = Array.isArray(values) ? values : [];
  const fallback = Array.isArray(fallbackValues) ? fallbackValues : [];
  const normalized = [];
  for (let index = 0; index < defaultTodayChartDays(); index += 1) {
    const numeric = Number(source[index]);
    if (Number.isFinite(numeric)) {
      normalized.push(Math.max(0, numeric));
      continue;
    }
    const fallbackNumeric = Number(fallback[index]);
    if (Number.isFinite(fallbackNumeric)) {
      normalized.push(Math.max(0, fallbackNumeric));
      continue;
    }
    normalized.push(normalized.length ? normalized[normalized.length - 1] : 0);
  }
  return normalized;
}

function normalizeTodayOverview(raw) {
  const base = createTodayOverviewState();
  if (!raw || typeof raw !== "object") return base;

  if (raw.score && typeof raw.score === "object") {
    const scoreValue = Number(raw.score.value);
    const scoreDelta = Number(raw.score.delta);
    base.score = {
      value: Number.isFinite(scoreValue) ? Math.max(0, scoreValue) : base.score.value,
      direction: raw.score.direction === "down" ? "down" : "up",
      delta: Number.isFinite(scoreDelta) ? Math.max(0, scoreDelta) : base.score.delta
    };
  }

  const startDate = normalizeStoredChartStartDate(raw.chart?.startDate, base.chart.startDate);
  base.chart = {
    startDate,
    labels: buildChartLabelsFromStartDate(startDate, defaultTodayChartDays()),
    values: normalizeStoredChartValues(raw.chart?.values, base.chart.values)
  };

  if (raw.metrics && typeof raw.metrics === "object") {
    todayMetricDefinitions.forEach((definition) => {
      const incoming = raw.metrics[definition.id];
      if (!incoming || typeof incoming !== "object") return;
      const metricValue = Number(incoming.value);
      const metricDelta = Number(incoming.delta);
      base.metrics[definition.id] = {
        value: Number.isFinite(metricValue) ? Math.max(0, metricValue) : base.metrics[definition.id].value,
        risk: ["high", "medium", "low", "none"].includes(incoming.risk) ? incoming.risk : base.metrics[definition.id].risk,
        direction: incoming.direction === "down" ? "down" : "up",
        delta: Number.isFinite(metricDelta) ? Math.max(0, metricDelta) : base.metrics[definition.id].delta
      };
    });
  }

  return base;
}

function loadPersistedTodayOverview() {
  if (typeof window === "undefined" || !window.localStorage) {
    return createTodayOverviewState();
  }
  try {
    const saved = window.localStorage.getItem(todayOverviewStorageKeyValue());
    if (!saved) return createTodayOverviewState();
    return normalizeTodayOverview(JSON.parse(saved));
  } catch (error) {
    return createTodayOverviewState();
  }
}

function savePersistedTodayOverview() {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(todayOverviewStorageKeyValue(), JSON.stringify(normalizeTodayOverview(state.todayOverview)));
  } catch (error) {
    // Ignore storage failures so viewing the page never breaks.
  }
}

const logisticsMain = {
  labels: chartMain.labels.slice(),
  values: chartMain.values.slice(),
  ticks: [0,20,40,60,80,100],
  legend: [
    ["0-20", "#17aa6a"],
    ["21-40", "#69ea95"],
    ["41-60", "#eadf21"],
    ["61-80", "#ef8e35"],
    ["81-100", "#d81520"]
  ]
};

const logisticsMiniCharts = [
  {
    titleZh: "中国航运景气指数与信心指数",
    titleEn: "China Shipping Prosperity & Confidence Index",
    color: "#6ba8e0",
    soft: "#d8e6f7",
    values: [106, 98, 91, 88, 95, 102, 108, 112, 115, 110, 108],
    compare: [101, 95, 89, 84, 91, 98, 104, 109, 111, 106, 104],
    ticks: [80, 90, 100, 110, 120]
  },
  {
    titleZh: "全球航运景气指数与信心指数",
    titleEn: "Global Shipping Prosperity & Confidence Index",
    color: "#3fd2b8",
    soft: "#c7efe8",
    values: [108, 99, 94, 90, 97, 104, 109, 115, 118, 112, 110],
    compare: [103, 95, 89, 86, 93, 99, 105, 111, 113, 108, 106],
    ticks: [80, 90, 100, 110, 120]
  },
  {
    titleZh: "中国船舶运输企业景气指数与信心指数",
    titleEn: "China Ship Transport Enterprise Prosperity & Confidence Index",
    color: "#e0b728",
    soft: "#f4ebbd",
    values: [102, 94, 86, 81, 90, 98, 104, 108, 111, 104, 102],
    compare: [98, 90, 83, 79, 87, 95, 101, 106, 108, 101, 99],
    ticks: [75, 85, 95, 105, 115]
  },
  {
    titleZh: "中国港口运输企业景气指数与信心指数",
    titleEn: "China Port Transport Enterprise Prosperity & Confidence Index",
    color: "#9b89e6",
    soft: "#e1d9fb",
    values: [107, 100, 94, 89, 98, 105, 111, 116, 119, 114, 112],
    compare: [103, 97, 91, 86, 95, 102, 108, 113, 115, 110, 108],
    ticks: [85, 95, 105, 115, 125]
  }
];

const worldRiskMap = {
  minZoom: 1,
  maxZoom: 2.8
};

const shipIconMarkup = `
  <svg viewBox="0 0 1024 1024" aria-hidden="true" focusable="false">
    <path d="M682.666667 512a1921.991111 1921.991111 0 0 1-71.111111 512H412.444444S341.333333 714.24 341.333333 512C341.333333 229.262222 512 0 512 0s170.666667 229.262222 170.666667 512z" fill="currentColor"></path>
    <path d="M587.804444 512a854.471111 854.471111 0 0 1-31.573333 227.555556H467.768889s-31.573333-137.671111-31.573333-227.555556c0-125.724444 75.804444-227.555556 75.804444-227.555556s75.804444 101.831111 75.804444 227.555556z" fill="#FFFFFF"></path>
  </svg>
`;
const boatPhotoPool = [
  "./boat/0187d44c77e3a792dbc5a0288a92e2b4.png",
  "./boat/08cd57da72492dda2f89aab2b3f16c09.png",
  "./boat/0ed1ab4912fcf6ac6ab1ebc4aeccffd9.png",
  "./boat/18286442bdf421646e39a634dbc07f55.png",
  "./boat/1dadb5810d86f8cf719ebff4a9783517.png",
  "./boat/28d2dc5797f4ed9ae5ff5b1da295a115.png",
  "./boat/2b4cb86555772bc0b7f2c4917d2c59e9.png",
  "./boat/2f9380512be6bb89f95e7f685c1b1866.png",
  "./boat/3724103cb84b994a58b48b117c4d5bda.png",
  "./boat/37f0a6e31cfb223068ecc029748a5306.png",
  "./boat/4b93c6942b1aab0a1aa4d32c857200e6.png",
  "./boat/5796b5166069f3ad44ec1a32c5eae039.png",
  "./boat/58f3f84813994be06131d6ee016214ec.png",
  "./boat/5e8adefa792a3068c1d05bb77254980b.png",
  "./boat/66d2541958a2e623d30c8292b102075b.png",
  "./boat/6ca7a6a62a2b6cdff140d83260b814d9.png",
  "./boat/6fc2a0569c3ff1b4cc7786343cfda4e9.png",
  "./boat/7bc3fffc42f8428b81c125a82ebf75e9.png",
  "./boat/7d671792937b13dc79770a671bdfb3fb.png",
  "./boat/863c7fd2b5aa3a451d60e59ee8188643.png",
  "./boat/8ba425f30f4063fa67144c1871748349.png",
  "./boat/8c66441822195d99ff8c4475743fcb90.png",
  "./boat/90d594410de5b0ceea5ea5dd087cbd01.png",
  "./boat/a05b044379ccaa440659d09c0a8acfeb.png",
  "./boat/a66576ff1b0e1702eda0001244f32238.png",
  "./boat/a70d3bc296e5483dce87681d43be3953.png",
  "./boat/a96244c8b149602bdbafe1d24c551bf9.png",
  "./boat/adc7758e93cff78a380b7d2dea520f2b.png",
  "./boat/b052b7d3d3881cffb3a68b5456593399.png",
  "./boat/b8dc648679cebbd905b22b6a9410421c.png",
  "./boat/c83745bd7f0f8a191412767478df2756.png",
  "./boat/cfe4d75035f470887503d62f38836884.png",
  "./boat/d2f0138e0e405524faa69a6c5d23c76d.png",
  "./boat/d377a524ac61d34d111c611ada35b07f.png",
  "./boat/d4b413b320f82bce9865a70301134c2d.png",
  "./boat/d5fec90524b1440355218df900023ad6.png",
  "./boat/da4cc16e2212ed9fdbf7a921a7028691.png",
  "./boat/dec40428f9ec9c301d0ecfece6767a80.png",
  "./boat/e30edcb05d3f7612d9e07d9dc732217e.png",
  "./boat/f5cfdf9d190df641398653d30aaf4d0b.png"
];

function worldCoordsFromPercent(x, y) {
  return {
    longitude: (x / 100) * 360 - 180,
    latitude: 90 - (y / 100) * 180
  };
}

function percentFromWorldCoords(longitude, latitude) {
  return {
    x: ((longitude + 180) / 360) * 100,
    y: ((90 - latitude) / 180) * 100
  };
}

function stableHash(input) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const curatedFleet = [
  {
    id: "oocl-france-hk",
    nameZh: "东方海外法国香港",
    nameEn: "OOCL FRANCE HK",
    typeZh: "集装箱船",
    typeEn: "Container Ship",
    risk: "medium",
    longitude: 151.647725,
    latitude: 43.961191,
    heading: 71,
    size: "md",
    flag: "HKG",
    origin: "KR BNP",
    destination: "PA PNM",
    departureTime: "2026-04-09 23:46",
    eta: "2026-04-28 01:00",
    speed: "19.2 kn",
    course: "071°",
    draught: "14.7 m",
    length: "366 m",
    beam: "51 m",
    progress: 55,
    statusZh: "使用发动机航行中",
    statusEn: "Underway Using Engine",
    lastUpdateZh: "2 分钟前",
    lastUpdateEn: "2 minutes ago",
    sourceZh: "AIS 来源: 漫游",
    sourceEn: "AIS source: Roaming",
    photoCredit: "andrew mcalpine"
  },
  {
    id: "northern-juvenile",
    nameZh: "NORTHERN JUVENILE",
    nameEn: "NORTHERN JUVENILE",
    typeZh: "集装箱船",
    typeEn: "Container Ship",
    risk: "low",
    longitude: 148.132806,
    latitude: 43.484812,
    heading: 67,
    size: "md",
    flag: "PRT",
    origin: "KR BNP",
    destination: "PA PCN",
    departureTime: "2026-04-09 14:42",
    eta: "2026-04-28 22:00",
    speed: "18.0 kn",
    course: "067°",
    draught: "13.0 m",
    length: "335 m",
    beam: "48 m",
    progress: 48,
    statusZh: "使用发动机航行中",
    statusEn: "Underway Using Engine",
    lastUpdateZh: "15 小时 31 分钟前",
    lastUpdateEn: "15 hours, 31 minutes ago",
    sourceZh: "AIS 来源: 漫游",
    sourceEn: "AIS source: Roaming",
    photoCredit: "Osvaldo Traversaro"
  },
  {
    id: "dukeship",
    nameZh: "DUKESHIP",
    nameEn: "DUKESHIP",
    typeZh: "散货船",
    typeEn: "Bulk Carrier",
    risk: "high",
    longitude: 138.906144,
    latitude: 29.113775,
    heading: 278,
    size: "lg",
    flag: "MHL",
    origin: "PE SNX",
    destination: "CN CFD",
    departureTime: "2026-03-06 07:26",
    eta: "2026-04-17 14:00",
    speed: "10.1 kn",
    course: "278°",
    draught: "18.8 m",
    length: "229 m",
    beam: "38 m",
    progress: 79,
    statusZh: "使用发动机航行中",
    statusEn: "Underway Using Engine",
    lastUpdateZh: "14 小时 35 分钟前",
    lastUpdateEn: "14 hours, 35 minutes ago",
    sourceZh: "AIS 来源: 漫游",
    sourceEn: "AIS source: Roaming",
    photoCredit: "smp"
  },
  {
    id: "lautoka-chief",
    nameZh: "LAUTOKA CHIEF",
    nameEn: "LAUTOKA CHIEF",
    typeZh: "集装箱船",
    typeEn: "Container Ship",
    risk: "low",
    longitude: 159.077299,
    latitude: 44.276671,
    heading: 63,
    size: "md",
    flag: "SGP",
    origin: "JP TYO",
    destination: "US PAE",
    departureTime: "2026-04-09 12:45",
    eta: "2026-04-20 00:00",
    speed: "15.0 kn",
    course: "063°",
    draught: "9.2 m",
    length: "299 m",
    beam: "43 m",
    progress: 34,
    statusZh: "使用发动机航行中",
    statusEn: "Underway Using Engine",
    lastUpdateZh: "4 小时 29 分钟前",
    lastUpdateEn: "4 hours, 29 minutes ago",
    sourceZh: "AIS 来源: 漫游",
    sourceEn: "AIS source: Roaming",
    photoCredit: "Jackie Pritchard"
  },
  {
    id: "lilian-trader",
    nameZh: "LILIAN TRADER",
    nameEn: "LILIAN TRADER",
    typeZh: "散货船",
    typeEn: "Bulk Carrier",
    risk: "medium",
    longitude: -166.385968,
    latitude: 20.014645,
    heading: 54,
    size: "md",
    flag: "PH",
    origin: "AU GLT",
    destination: "CA KTM",
    departureTime: "2026-03-31 04:09",
    eta: "2026-04-21 02:00",
    speed: "12.3 kn",
    course: "054°",
    draught: "10.8 m",
    length: "189 m",
    beam: "32 m",
    progress: 61,
    statusZh: "使用发动机航行中",
    statusEn: "Underway Using Engine",
    lastUpdateZh: "8 小时 41 分钟前",
    lastUpdateEn: "8 hours, 41 minutes ago",
    sourceZh: "AIS 来源: 漫游",
    sourceEn: "AIS source: Roaming",
    photoCredit: "Damien Hedger"
  },
  {
    id: "weco-esther",
    nameZh: "WECO ESTHER",
    nameEn: "WECO ESTHER",
    typeZh: "散货船",
    typeEn: "Bulk Carrier",
    risk: "medium",
    longitude: -156.632059,
    latitude: 31.802893,
    heading: 103,
    size: "md",
    flag: "LR",
    origin: "CN NTG",
    destination: "GT PRQ",
    departureTime: "2026-03-27 13:38",
    eta: "2026-04-25 22:00",
    speed: "11.1 kn",
    course: "103°",
    draught: "11.1 m",
    length: "199 m",
    beam: "33 m",
    progress: 47,
    statusZh: "使用发动机航行中",
    statusEn: "Underway Using Engine",
    lastUpdateZh: "9 小时 19 分钟前",
    lastUpdateEn: "9 hours, 19 minutes ago",
    sourceZh: "AIS 来源: 漫游",
    sourceEn: "AIS source: Roaming",
    photoCredit: "Thorsten Aurin"
  },
  {
    id: "wan-hai-a11",
    nameZh: "WAN HAI A11",
    nameEn: "WAN HAI A11",
    typeZh: "集装箱船",
    typeEn: "Container Ship",
    risk: "low",
    longitude: -129.997686,
    latitude: 33.614619,
    heading: 92,
    size: "md",
    flag: "SGP",
    origin: "TW TPE",
    destination: "US LAX",
    departureTime: "2026-03-29 03:48",
    eta: "2026-04-12 20:00",
    speed: "15.6 kn",
    course: "092°",
    draught: "14.8 m",
    length: "316 m",
    beam: "45 m",
    progress: 88,
    statusZh: "使用发动机航行中",
    statusEn: "Underway Using Engine",
    lastUpdateZh: "23 小时 15 分钟前",
    lastUpdateEn: "23 hours, 15 minutes ago",
    sourceZh: "AIS 来源: 漫游",
    sourceEn: "AIS source: Roaming",
    photoCredit: "chun-hsi"
  },
  {
    id: "grand-eagle",
    nameZh: "GRAND EAGLE",
    nameEn: "GRAND EAGLE",
    typeZh: "汽车运输船",
    typeEn: "Vehicles Carrier",
    risk: "high",
    longitude: -133.864962,
    latitude: 47.989922,
    heading: 297,
    size: "lg",
    flag: "PA",
    origin: "US PDX",
    destination: "KR PTK",
    departureTime: "2026-04-10 17:55",
    eta: "2026-04-26 08:00",
    speed: "15.8 kn",
    course: "297°",
    draught: "8.2 m",
    length: "199 m",
    beam: "32 m",
    progress: 21,
    statusZh: "使用发动机航行中",
    statusEn: "Underway Using Engine",
    lastUpdateZh: "2 分钟前",
    lastUpdateEn: "2 minutes ago",
    sourceZh: "AIS 来源: 漫游",
    sourceEn: "AIS source: Roaming",
    photoCredit: "Steven Watkins"
  },
  {
    id: "pacific-sarah",
    nameZh: "PACIFIC SARAH",
    nameEn: "PACIFIC SARAH",
    typeZh: "散货船",
    typeEn: "Bulk Carrier",
    risk: "high",
    longitude: 169.294189,
    latitude: 50.625073,
    heading: 84,
    size: "lg",
    flag: "PA",
    origin: "CN TXG",
    destination: "CA RTB",
    departureTime: "2026-04-02 04:34",
    eta: "2026-04-17 13:00",
    speed: "14.3 kn",
    course: "084°",
    draught: "10.9 m",
    length: "209 m",
    beam: "35 m",
    progress: 68,
    statusZh: "使用发动机航行中",
    statusEn: "Underway Using Engine",
    lastUpdateZh: "2 分钟前",
    lastUpdateEn: "2 minutes ago",
    sourceZh: "AIS 来源: 漫游",
    sourceEn: "AIS source: Roaming",
    photoCredit: "Patrick Deenik"
  },
  {
    id: "foxfire",
    nameZh: "FOXFIRE",
    nameEn: "FOXFIRE",
    typeZh: "帆船",
    typeEn: "Sailing Vessel",
    risk: "low",
    longitude: -146.432703,
    latitude: 8.276727,
    heading: 317,
    size: "sm",
    flag: "US",
    origin: "PF PPT",
    destination: "N/A",
    departureTime: "2025-10-31 09:36",
    eta: "N/A",
    speed: "6.6 kn",
    course: "317°",
    draught: "N/A",
    length: "24 m",
    beam: "6 m",
    progress: 50,
    statusZh: "Class B",
    statusEn: "Class B",
    lastUpdateZh: "46 分钟前",
    lastUpdateEn: "46 minutes ago",
    sourceZh: "AIS 来源: 漫游",
    sourceEn: "AIS source: Roaming",
    photoCredit: "boat archive"
  },
  {
    id: "pan-harvest",
    nameZh: "PAN HARVEST",
    nameEn: "PAN HARVEST",
    typeZh: "散货船",
    typeEn: "Bulk Carrier",
    risk: "medium",
    longitude: 126.440665,
    latitude: 30.467614,
    heading: 266,
    size: "md",
    flag: "PA",
    origin: "PANAMA PACIFIC [PA]",
    destination: "CN CWN",
    departureTime: "2026-03-18 12:26",
    eta: "2026-04-23 08:00",
    speed: "12.3 kn",
    course: "266°",
    draught: "11.9 m",
    length: "199 m",
    beam: "32 m",
    progress: 52,
    statusZh: "使用发动机航行中",
    statusEn: "Underway Using Engine",
    lastUpdateZh: "39 分钟前",
    lastUpdateEn: "39 minutes ago",
    sourceZh: "AIS 来源: 漫游",
    sourceEn: "AIS source: Roaming",
    photoCredit: "boat archive"
  },
  {
    id: "captain-vange",
    nameZh: "CAPTAIN VANGE",
    nameEn: "CAPTAIN VANGE",
    typeZh: "散货船",
    typeEn: "Bulk Carrier",
    risk: "medium",
    longitude: 140.357037,
    latitude: 4.214943,
    heading: 141,
    size: "md",
    flag: "US",
    origin: "CN NBG",
    destination: "AU NTL",
    departureTime: "2026-04-04 23:07",
    eta: "2026-04-20 18:00",
    speed: "12.6 kn",
    course: "141°",
    draught: "9.1 m",
    length: "189 m",
    beam: "31 m",
    progress: 41,
    statusZh: "使用发动机航行中",
    statusEn: "Underway Using Engine",
    lastUpdateZh: "15 小时 38 分钟前",
    lastUpdateEn: "15 hours, 38 minutes ago",
    sourceZh: "AIS 来源: 漫游",
    sourceEn: "AIS source: Roaming",
    photoCredit: "boat archive"
  },
  {
    id: "msc-basel-v",
    nameZh: "MSC BASEL V",
    nameEn: "MSC BASEL V",
    typeZh: "集装箱船",
    typeEn: "Container Ship",
    risk: "low",
    longitude: -47.028477,
    latitude: 3.162456,
    heading: 304,
    size: "md",
    flag: "PT",
    origin: "BR SSA",
    destination: "PA ONX",
    departureTime: "2026-04-08 13:46",
    eta: "2026-04-17 06:00",
    speed: "16.2 kn",
    course: "304°",
    draught: "12.8 m",
    length: "299 m",
    beam: "43 m",
    progress: 57,
    statusZh: "使用发动机航行中",
    statusEn: "Underway Using Engine",
    lastUpdateZh: "3 分钟前",
    lastUpdateEn: "3 minutes ago",
    sourceZh: "AIS 来源: 漫游",
    sourceEn: "AIS source: Roaming",
    photoCredit: "boat archive"
  },
  {
    id: "bandura",
    nameZh: "BANDURA",
    nameEn: "BANDURA",
    typeZh: "杂货船",
    typeEn: "General Cargo",
    risk: "high",
    longitude: -41.313167,
    latitude: 34.597042,
    heading: 271,
    size: "sm",
    flag: "NL",
    origin: "FI KVH",
    destination: "US SUT",
    departureTime: "2026-03-26 23:52",
    eta: "2026-04-17 07:00",
    speed: "11.1 kn",
    course: "271°",
    draught: "5.8 m",
    length: "143 m",
    beam: "24 m",
    progress: 74,
    statusZh: "使用发动机航行中",
    statusEn: "Underway Using Engine",
    lastUpdateZh: "16 小时 58 分钟前",
    lastUpdateEn: "16 hours, 58 minutes ago",
    sourceZh: "AIS 来源: 漫游",
    sourceEn: "AIS source: Roaming",
    photoCredit: "boat archive"
  },
  {
    id: "rcc-classic",
    nameZh: "RCC CLASSIC",
    nameEn: "RCC CLASSIC",
    typeZh: "汽车运输船",
    typeEn: "Vehicles Carrier",
    risk: "high",
    longitude: -38.984534,
    latitude: 19.766704,
    heading: 116,
    size: "lg",
    flag: "BS",
    origin: "US JAX",
    destination: "BJ COO",
    departureTime: "2026-04-04 21:52",
    eta: "2026-04-19 23:00",
    speed: "13.8 kn",
    course: "116°",
    draught: "9.7 m",
    length: "199 m",
    beam: "32 m",
    progress: 63,
    statusZh: "使用发动机航行中",
    statusEn: "Underway Using Engine",
    lastUpdateZh: "9 小时 51 分钟前",
    lastUpdateEn: "9 hours, 51 minutes ago",
    sourceZh: "AIS 来源: 漫游",
    sourceEn: "AIS source: Roaming",
    photoCredit: "boat archive"
  },
  {
    id: "pacific-longevi",
    nameZh: "PACIFIC LONGEVI",
    nameEn: "PACIFIC LONGEVI",
    typeZh: "矿砂船",
    typeEn: "Ore Carrier",
    risk: "medium",
    longitude: -30.297018,
    latitude: 38.948289,
    heading: 245,
    size: "lg",
    flag: "HK",
    origin: "MY TRB",
    destination: "BR PMA",
    departureTime: "2026-03-24 02:31",
    eta: "2026-05-01 20:00",
    speed: "11.6 kn",
    course: "245°",
    draught: "12.5 m",
    length: "229 m",
    beam: "38 m",
    progress: 47,
    statusZh: "使用发动机航行中",
    statusEn: "Underway Using Engine",
    lastUpdateZh: "12 分钟前",
    lastUpdateEn: "12 minutes ago",
    sourceZh: "AIS 来源: 漫游",
    sourceEn: "AIS source: Roaming",
    photoCredit: "boat archive"
  },
  {
    id: "msc-chiara-x",
    nameZh: "MSC CHIARA X",
    nameEn: "MSC CHIARA X",
    typeZh: "集装箱船",
    typeEn: "Container Ship",
    risk: "low",
    longitude: -3.977738,
    latitude: -15.961329,
    heading: 311,
    size: "lg",
    flag: "US",
    origin: "SG SIN",
    destination: "US NYC",
    departureTime: "2026-03-25 00:20",
    eta: "2026-04-25 10:00",
    speed: "16.6 kn",
    course: "311°",
    draught: "14.1 m",
    length: "335 m",
    beam: "48 m",
    progress: 71,
    statusZh: "借风航行",
    statusEn: "Underway By Sail",
    lastUpdateZh: "27 分钟前",
    lastUpdateEn: "27 minutes ago",
    sourceZh: "AIS 来源: 漫游",
    sourceEn: "AIS source: Roaming",
    photoCredit: "boat archive"
  },
  {
    id: "ore-chongqing",
    nameZh: "ORE CHONGQING",
    nameEn: "ORE CHONGQING",
    typeZh: "矿砂船",
    typeEn: "Ore Carrier",
    risk: "medium",
    longitude: 85.236707,
    latitude: -1.230374,
    heading: 231,
    size: "lg",
    flag: "CN",
    origin: "CN LSN",
    destination: "BR PMA",
    departureTime: "2026-03-29 06:33",
    eta: "2026-05-08 10:00",
    speed: "12.1 kn",
    course: "231°",
    draught: "13.3 m",
    length: "229 m",
    beam: "38 m",
    progress: 31,
    statusZh: "使用发动机航行中",
    statusEn: "Underway Using Engine",
    lastUpdateZh: "48 分钟前",
    lastUpdateEn: "48 minutes ago",
    sourceZh: "AIS 来源: 漫游",
    sourceEn: "AIS source: Roaming",
    photoCredit: "boat archive"
  },
  {
    id: "erawan-2",
    nameZh: "ERAWAN 2",
    nameEn: "ERAWAN 2",
    typeZh: "浮式储油生产装置",
    typeEn: "Floating Storage/Production",
    risk: "high",
    longitude: 101.849466,
    latitude: 9.102097,
    heading: 0,
    size: "lg",
    flag: "AE",
    origin: "TH GULF",
    destination: "OFFSHORE",
    departureTime: "N/A",
    eta: "N/A",
    speed: "0.0 kn",
    course: "000°",
    draught: "18.0 m",
    length: "240 m",
    beam: "42 m",
    progress: 100,
    statusZh: "系泊作业中",
    statusEn: "Moored",
    lastUpdateZh: "10 小时 3 分钟前",
    lastUpdateEn: "10 hours, 3 minutes ago",
    sourceZh: "AIS 来源: 漫游",
    sourceEn: "AIS source: Roaming",
    photoCredit: "boat archive"
  },
  {
    id: "new-success",
    nameZh: "NEW SUCCESS",
    nameEn: "NEW SUCCESS",
    typeZh: "原油油轮",
    typeEn: "Crude Oil Tanker",
    risk: "high",
    longitude: 85.505094,
    latitude: 17.056785,
    heading: 11,
    size: "lg",
    flag: "AE",
    origin: "AE FJR",
    destination: "IN PRT",
    departureTime: "2026-04-03 12:15",
    eta: "2026-04-13 08:00",
    speed: "13.3 kn",
    course: "011°",
    draught: "20.1 m",
    length: "294 m",
    beam: "46 m",
    progress: 92,
    statusZh: "使用发动机航行中",
    statusEn: "Underway Using Engine",
    lastUpdateZh: "3 小时 39 分钟前",
    lastUpdateEn: "3 hours, 39 minutes ago",
    sourceZh: "AIS 来源: 漫游",
    sourceEn: "AIS source: Roaming",
    photoCredit: "boat archive"
  },
  {
    id: "true-friend",
    nameZh: "TRUE FRIEND",
    nameEn: "TRUE FRIEND",
    typeZh: "散货船",
    typeEn: "Bulk Carrier",
    risk: "medium",
    longitude: -21.986571,
    latitude: 12.21118,
    heading: 18,
    size: "md",
    flag: "BB",
    origin: "BR SSZ",
    destination: "ES LPA",
    departureTime: "2026-04-01 03:45",
    eta: "2026-04-16 05:00",
    speed: "9.6 kn",
    course: "018°",
    draught: "11.4 m",
    length: "199 m",
    beam: "32 m",
    progress: 66,
    statusZh: "使用发动机航行中",
    statusEn: "Underway Using Engine",
    lastUpdateZh: "2 分钟前",
    lastUpdateEn: "2 minutes ago",
    sourceZh: "AIS 来源: 地面站",
    sourceEn: "AIS source: Terrestrial",
    photoCredit: "boat archive"
  },
  {
    id: "new-promise",
    nameZh: "NEW PROMISE",
    nameEn: "NEW PROMISE",
    typeZh: "散货船",
    typeEn: "Bulk Carrier",
    risk: "medium",
    longitude: 155.020981,
    latitude: -6.83917,
    heading: 328,
    size: "md",
    flag: "PA",
    origin: "AU GLT",
    destination: "JP OIT",
    departureTime: "2026-04-08 00:47",
    eta: "2026-04-24 00:00",
    speed: "8.3 kn",
    course: "328°",
    draught: "17.1 m",
    length: "209 m",
    beam: "35 m",
    progress: 29,
    statusZh: "使用发动机航行中",
    statusEn: "Underway Using Engine",
    lastUpdateZh: "7 小时 54 分钟前",
    lastUpdateEn: "7 hours, 54 minutes ago",
    sourceZh: "AIS 来源: 漫游",
    sourceEn: "AIS source: Roaming",
    photoCredit: "boat archive"
  },
  {
    id: "parnassos",
    nameZh: "PARNASSOS",
    nameEn: "PARNASSOS",
    typeZh: "原油油轮",
    typeEn: "Crude Oil Tanker",
    risk: "high",
    longitude: 75.83,
    latitude: 10.93,
    heading: 235,
    size: "lg",
    flag: "AE",
    origin: "CN YPG",
    destination: "ZA CPT",
    departureTime: "2026-03-31 09:51",
    eta: "2026-04-23 09:00",
    speed: "13.0 kn",
    course: "235°",
    draught: "11.0 m",
    length: "294 m",
    beam: "46 m",
    progress: 58,
    statusZh: "使用发动机航行中",
    statusEn: "Underway Using Engine",
    lastUpdateZh: "2 分钟前",
    lastUpdateEn: "2 minutes ago",
    sourceZh: "AIS 来源: 漫游",
    sourceEn: "AIS source: Roaming",
    photoCredit: "boat archive"
  },
  {
    id: "cape-europe",
    nameZh: "CAPE EUROPE",
    nameEn: "CAPE EUROPE",
    typeZh: "散货船",
    typeEn: "Bulk Carrier",
    risk: "medium",
    longitude: 68.013606,
    latitude: 12.897489,
    heading: 234,
    size: "md",
    flag: "SG",
    origin: "CN BAY",
    destination: "GN KMR",
    departureTime: "2026-03-24 10:43",
    eta: "2026-05-03 07:00",
    speed: "12.1 kn",
    course: "234°",
    draught: "9.6 m",
    length: "199 m",
    beam: "32 m",
    progress: 46,
    statusZh: "使用发动机航行中",
    statusEn: "Underway Using Engine",
    lastUpdateZh: "2 小时 48 分钟前",
    lastUpdateEn: "2 hours, 48 minutes ago",
    sourceZh: "AIS 来源: 漫游",
    sourceEn: "AIS source: Roaming",
    photoCredit: "boat archive"
  },
  {
    id: "yangtze-alpha",
    nameZh: "YANGTZE ALPHA",
    nameEn: "YANGTZE ALPHA",
    typeZh: "散货船",
    typeEn: "Bulk Carrier",
    risk: "medium",
    longitude: 23.533869,
    latitude: 35.317366,
    heading: 308,
    size: "md",
    flag: "MH",
    origin: "MY KEM",
    destination: "IT RAN",
    departureTime: "2026-03-10 22:41",
    eta: "2026-04-15 17:00",
    speed: "12.1 kn",
    course: "308°",
    draught: "10.3 m",
    length: "199 m",
    beam: "32 m",
    progress: 91,
    statusZh: "使用发动机航行中",
    statusEn: "Underway Using Engine",
    lastUpdateZh: "40 分钟前",
    lastUpdateEn: "40 minutes ago",
    sourceZh: "AIS 来源: 地面站",
    sourceEn: "AIS source: Terrestrial",
    photoCredit: "boat archive"
  },
  {
    id: "troodos-sun",
    nameZh: "TROODOS SUN",
    nameEn: "TROODOS SUN",
    typeZh: "散货船",
    typeEn: "Bulk Carrier",
    risk: "medium",
    longitude: 8.068227,
    latitude: 40.84706,
    heading: 0,
    size: "md",
    flag: "CY",
    origin: "ZA RCB",
    destination: "IT PTO",
    departureTime: "2026-03-14 02:54",
    eta: "2026-04-09 17:18",
    speed: "0.0 kn",
    course: "000°",
    draught: "14.4 m",
    length: "229 m",
    beam: "36 m",
    progress: 100,
    statusZh: "靠泊中",
    statusEn: "Moored",
    lastUpdateZh: "4 分钟前",
    lastUpdateEn: "4 minutes ago",
    sourceZh: "AIS 来源: 地面站",
    sourceEn: "AIS source: Terrestrial",
    photoCredit: "boat archive"
  },
  {
    id: "shirayuki",
    nameZh: "SHIRAYUKI",
    nameEn: "SHIRAYUKI",
    typeZh: "原油油轮",
    typeEn: "Crude Oil Tanker",
    risk: "high",
    longitude: 65.294312,
    latitude: 18.39623,
    heading: 320,
    size: "lg",
    flag: "LR",
    origin: "JP ANE",
    destination: "OM MFH",
    departureTime: "2026-03-24 16:49",
    eta: "2026-04-14 08:00",
    speed: "11.3 kn",
    course: "320°",
    draught: "11.0 m",
    length: "249 m",
    beam: "44 m",
    progress: 88,
    statusZh: "使用发动机航行中",
    statusEn: "Underway Using Engine",
    lastUpdateZh: "29 分钟前",
    lastUpdateEn: "29 minutes ago",
    sourceZh: "AIS 来源: 漫游",
    sourceEn: "AIS source: Roaming",
    photoCredit: "boat archive"
  },
  {
    id: "southern-pearl",
    nameZh: "SOUTHERN PEARL",
    nameEn: "SOUTHERN PEARL",
    typeZh: "集装箱船",
    typeEn: "Container Ship",
    risk: "low",
    longitude: -158.477109,
    latitude: 2.108899,
    heading: 100,
    size: "md",
    flag: "SG",
    origin: "MH MAJ",
    destination: "KI CXI",
    departureTime: "2026-04-03 07:24",
    eta: "2026-04-13 08:00",
    speed: "7.0 kn",
    course: "100°",
    draught: "7.1 m",
    length: "172 m",
    beam: "27 m",
    progress: 92,
    statusZh: "使用发动机航行中",
    statusEn: "Underway Using Engine",
    lastUpdateZh: "2 小时 8 分钟前",
    lastUpdateEn: "2 hours, 8 minutes ago",
    sourceZh: "AIS 来源: 地面站",
    sourceEn: "AIS source: Terrestrial",
    photoCredit: "boat archive"
  },
  {
    id: "psu-ninth",
    nameZh: "PSU NINTH",
    nameEn: "PSU NINTH",
    typeZh: "散货船",
    typeEn: "Bulk Carrier",
    risk: "medium",
    longitude: 116.347517,
    latitude: -16.045813,
    heading: 175,
    size: "md",
    flag: "SG",
    origin: "CN TGS",
    destination: "AU DAM",
    departureTime: "2026-03-30 19:12",
    eta: "2026-04-14 03:00",
    speed: "10.6 kn",
    course: "175°",
    draught: "9.5 m",
    length: "199 m",
    beam: "32 m",
    progress: 86,
    statusZh: "使用发动机航行中",
    statusEn: "Underway Using Engine",
    lastUpdateZh: "7 分钟前",
    lastUpdateEn: "7 minutes ago",
    sourceZh: "AIS 来源: 漫游",
    sourceEn: "AIS source: Roaming",
    photoCredit: "boat archive"
  },
  {
    id: "sao-quixote",
    nameZh: "SAO QUIXOTE",
    nameEn: "SAO QUIXOTE",
    typeZh: "矿砂船",
    typeEn: "Ore Carrier",
    risk: "high",
    longitude: 98.421625,
    latitude: -10.833306,
    heading: 63,
    size: "lg",
    flag: "PA",
    origin: "BR GUI",
    destination: "CN ZHA",
    departureTime: "2026-03-15 18:48",
    eta: "2026-04-20 08:00",
    speed: "12.3 kn",
    course: "063°",
    draught: "16.0 m",
    length: "299 m",
    beam: "50 m",
    progress: 78,
    statusZh: "使用发动机航行中",
    statusEn: "Underway Using Engine",
    lastUpdateZh: "3 小时 51 分钟前",
    lastUpdateEn: "3 hours, 51 minutes ago",
    sourceZh: "AIS 来源: 漫游",
    sourceEn: "AIS source: Roaming",
    photoCredit: "boat archive"
  },
  {
    id: "melody-hope",
    nameZh: "MELODY HOPE",
    nameEn: "MELODY HOPE",
    typeZh: "原油油轮",
    typeEn: "Crude Oil Tanker",
    risk: "high",
    longitude: 85.767918,
    latitude: -18.062312,
    heading: 58,
    size: "lg",
    flag: "MH",
    origin: "US GOLA",
    destination: "KR USN",
    departureTime: "2026-03-03 18:55",
    eta: "2026-04-27 10:00",
    speed: "11.6 kn",
    course: "058°",
    draught: "20.3 m",
    length: "299 m",
    beam: "46 m",
    progress: 74,
    statusZh: "使用发动机航行中",
    statusEn: "Underway Using Engine",
    lastUpdateZh: "20 小时 38 分钟前",
    lastUpdateEn: "20 hours, 38 minutes ago",
    sourceZh: "AIS 来源: 漫游",
    sourceEn: "AIS source: Roaming",
    photoCredit: "boat archive"
  },
  {
    id: "cosco-shipping-chile",
    nameZh: "COSCO SHIPPING CHILE",
    nameEn: "COSCO SHIPPING CHILE",
    typeZh: "集装箱船",
    typeEn: "Container Ship",
    risk: "low",
    longitude: -25.857749,
    latitude: -29.22889,
    heading: 98,
    size: "lg",
    flag: "HK",
    origin: "BR RIO",
    destination: "LK CMB",
    departureTime: "2026-04-09 12:02",
    eta: "2026-04-27 17:00",
    speed: "17.8 kn",
    course: "098°",
    draught: "14.2 m",
    length: "300 m",
    beam: "48 m",
    progress: 22,
    statusZh: "使用发动机航行中",
    statusEn: "Underway Using Engine",
    lastUpdateZh: "11 小时 6 分钟前",
    lastUpdateEn: "11 hours, 6 minutes ago",
    sourceZh: "AIS 来源: 漫游",
    sourceEn: "AIS source: Roaming",
    photoCredit: "boat archive"
  },
  {
    id: "pendulum",
    nameZh: "PENDULUM",
    nameEn: "PENDULUM",
    typeZh: "散货船",
    typeEn: "Bulk Carrier",
    risk: "medium",
    longitude: -43.344469,
    latitude: -34.307144,
    heading: 99,
    size: "md",
    flag: "MH",
    origin: "BR RIG",
    destination: "AE FJR",
    departureTime: "2026-04-10 04:22",
    eta: "2026-05-11 20:00",
    speed: "10.5 kn",
    course: "099°",
    draught: "12.8 m",
    length: "199 m",
    beam: "32 m",
    progress: 14,
    statusZh: "使用发动机航行中",
    statusEn: "Underway Using Engine",
    lastUpdateZh: "1 小时 32 分钟前",
    lastUpdateEn: "1 hour, 32 minutes ago",
    sourceZh: "AIS 来源: 漫游",
    sourceEn: "AIS source: Roaming",
    photoCredit: "boat archive"
  },
  {
    id: "chang-shou-star",
    nameZh: "CHANG SHOU STAR",
    nameEn: "CHANG SHOU STAR",
    typeZh: "散货船",
    typeEn: "Bulk Carrier",
    risk: "medium",
    longitude: -25.330511,
    latitude: -19.808054,
    heading: 332,
    size: "md",
    flag: "PA",
    origin: "CN YTG",
    destination: "BR PMA",
    departureTime: "2026-03-05 12:07",
    eta: "2026-04-17 05:00",
    speed: "13.0 kn",
    course: "332°",
    draught: "10.6 m",
    length: "199 m",
    beam: "32 m",
    progress: 90,
    statusZh: "使用发动机航行中",
    statusEn: "Underway Using Engine",
    lastUpdateZh: "21 小时 16 分钟前",
    lastUpdateEn: "21 hours, 16 minutes ago",
    sourceZh: "AIS 来源: 漫游",
    sourceEn: "AIS source: Roaming",
    photoCredit: "boat archive"
  },
  {
    id: "green-k-max-1",
    nameZh: "GREEN K MAX 1",
    nameEn: "GREEN K MAX 1",
    typeZh: "散货船",
    typeEn: "Bulk Carrier",
    risk: "medium",
    longitude: 44.162435,
    latitude: -11.480025,
    heading: 213,
    size: "md",
    flag: "LR",
    origin: "IN NML",
    destination: "BR SSZ",
    departureTime: "2026-04-04 20:18",
    eta: "2026-05-05 09:00",
    speed: "12.6 kn",
    course: "213°",
    draught: "7.9 m",
    length: "189 m",
    beam: "32 m",
    progress: 31,
    statusZh: "使用发动机航行中",
    statusEn: "Underway Using Engine",
    lastUpdateZh: "22 分钟前",
    lastUpdateEn: "22 minutes ago",
    sourceZh: "AIS 来源: 地面站",
    sourceEn: "AIS source: Terrestrial",
    photoCredit: "boat archive"
  },
  {
    id: "saskia-a",
    nameZh: "SASKIA A",
    nameEn: "SASKIA A",
    typeZh: "集装箱船",
    typeEn: "Container Ship",
    risk: "low",
    longitude: 58.876848,
    latitude: 16.383391,
    heading: 78,
    size: "md",
    flag: "TR",
    origin: "SA JED",
    destination: "IN NSA",
    departureTime: "2026-04-08 02:24",
    eta: "2026-04-15 06:00",
    speed: "14.8 kn",
    course: "078°",
    draught: "10.2 m",
    length: "294 m",
    beam: "40 m",
    progress: 63,
    statusZh: "使用发动机航行中",
    statusEn: "Underway Using Engine",
    lastUpdateZh: "1 小时 21 分钟前",
    lastUpdateEn: "1 hour, 21 minutes ago",
    sourceZh: "AIS 来源: 地面站",
    sourceEn: "AIS source: Terrestrial",
    photoCredit: "boat archive"
  },
  {
    id: "hai-men-breeze",
    nameZh: "海门微风",
    nameEn: "HAI MEN BREEZE",
    typeZh: "集装箱船",
    typeEn: "Container Ship",
    risk: "low",
    fixedRisk: "low",
    longitude: 121.76,
    latitude: 32.91,
    heading: 58,
    size: "md",
    flag: "CN",
    origin: "CN NGB",
    destination: "KR PUS",
    departureTime: "2026-04-12 05:40",
    eta: "2026-04-15 18:00",
    speed: "13.9 kn",
    course: "058°",
    draught: "11.6 m",
    length: "274 m",
    beam: "42 m",
    progress: 37,
    statusZh: "沿海航线正常通行",
    statusEn: "Coastal voyage under normal passage",
    lastUpdateZh: "6 分钟前",
    lastUpdateEn: "6 minutes ago",
    sourceZh: "AIS 来源: 地面站",
    sourceEn: "AIS source: Terrestrial",
    photoCredit: "boat archive"
  },
  {
    id: "bay-of-bengal-link",
    nameZh: "孟加拉湾联运",
    nameEn: "BAY OF BENGAL LINK",
    typeZh: "杂货船",
    typeEn: "General Cargo Ship",
    risk: "low",
    fixedRisk: "low",
    longitude: 92.88,
    latitude: 17.66,
    heading: 74,
    size: "sm",
    flag: "SGP",
    origin: "MM RGN",
    destination: "TH LCH",
    departureTime: "2026-04-11 21:15",
    eta: "2026-04-16 09:00",
    speed: "12.4 kn",
    course: "074°",
    draught: "7.4 m",
    length: "169 m",
    beam: "28 m",
    progress: 44,
    statusZh: "海况平稳，航线畅通",
    statusEn: "Sea state stable, route operating normally",
    lastUpdateZh: "11 分钟前",
    lastUpdateEn: "11 minutes ago",
    sourceZh: "AIS 来源: 地面站",
    sourceEn: "AIS source: Terrestrial",
    photoCredit: "boat archive"
  }
];

const vesselRiskLookup = (() => {
  const ranked = curatedFleet
    .map((vessel) => ({
      id: vessel.id,
      score: stableHash(`${vessel.id}:${vessel.origin}:${vessel.destination}`)
    }))
    .sort((left, right) => left.score - right.score);

  return Object.fromEntries(ranked.map((entry, index) => {
    const ratio = (index + 0.5) / ranked.length;
    const risk = ratio < 0.2 ? "high" : ratio < 0.5 ? "medium" : "low";
    return [entry.id, risk];
  }));
})();

const riskFleet = curatedFleet.map((vessel, index) => {
  const precisePoint = percentFromWorldCoords(vessel.longitude, vessel.latitude);
  const coarseX = Math.round(precisePoint.x * 10) / 10;
  const coarseY = Math.round(precisePoint.y * 10) / 10;
  const risk = vessel.fixedRisk || vesselRiskLookup[vessel.id] || vessel.risk;

  return {
    ...vessel,
    risk,
    imageUrl: boatPhotoPool[index] ?? boatPhotoPool[index % boatPhotoPool.length],
    photoCredit: "boat archive",
    x: coarseX,
    y: coarseY,
    fineX: +(precisePoint.x - coarseX).toFixed(4),
    fineY: +(precisePoint.y - coarseY).toFixed(4)
  };
});

function preloadRiskFleetImages() {
  if (window.__riskFleetImagesPreloaded) return;
  window.__riskFleetImagesPreloaded = true;

  riskFleet.forEach((vessel) => {
    if (!vessel.imageUrl) return;
    const image = new Image();
    image.decoding = "async";
    image.src = vessel.imageUrl;
  });
}

const routeHotspots = [
  { id: "north-sea", x: 50.2, y: 27.8, size: 10.8, tone: "medium", labelZh: "北海窗口", labelEn: "North Sea Window" },
  { id: "suez", x: 54.8, y: 45.6, size: 13.2, tone: "high", labelZh: "苏伊士航段", labelEn: "Suez Segment" },
  { id: "aden", x: 58.1, y: 50.8, size: 14.8, tone: "high", labelZh: "亚丁湾", labelEn: "Gulf of Aden" },
  { id: "cape", x: 60.6, y: 73.6, size: 12.6, tone: "medium", labelZh: "好望角绕航", labelEn: "Cape Diversion" },
  { id: "malacca", x: 77.8, y: 57.4, size: 13.8, tone: "medium", labelZh: "马六甲", labelEn: "Malacca" },
  { id: "pacific", x: 85.6, y: 41.2, size: 13.4, tone: "medium", labelZh: "太平洋西岸", labelEn: "Pacific Rim" },
  { id: "atlantic", x: 24.8, y: 57.4, size: 12.2, tone: "high", labelZh: "墨西哥湾", labelEn: "Gulf of Mexico" },
  { id: "south-atlantic", x: 31.4, y: 74.8, size: 15.6, tone: "high", labelZh: "南大西洋", labelEn: "South Atlantic" }
];

const routeTrafficClusters = [
  { id: "atlantic", x: 23, y: 56, count: 16, spreadX: 8.4, spreadY: 5.8, heading: 104, risks: ["high", "medium", "low"] },
  { id: "europe", x: 50.4, y: 30, count: 14, spreadX: 6.5, spreadY: 4.2, heading: 18, risks: ["medium", "high", "low", "low"] },
  { id: "aden", x: 57.4, y: 49.8, count: 24, spreadX: 11.6, spreadY: 3.4, heading: 310, risks: ["high", "medium", "high", "low"] },
  { id: "cape", x: 61.4, y: 72.6, count: 12, spreadX: 7.2, spreadY: 5.8, heading: 222, risks: ["medium", "high", "low"] },
  { id: "malacca", x: 77.6, y: 57.6, count: 22, spreadX: 8.8, spreadY: 5.1, heading: 36, risks: ["low", "medium", "high", "low"] },
  { id: "pacific", x: 85.6, y: 42.8, count: 14, spreadX: 5.8, spreadY: 9.4, heading: 118, risks: ["medium", "low", "high"] }
];
const riskMapBackdropUrl = "./assets/world-map-from-map1.svg";
const vesselVoyageBackdropUrl = "./assets/map1-preview.png";
const worldMapAspectRatio = 2;
const vesselDetailRoutePrefix = "船舶详情:";
const vesselSatelliteZoomSpans = [22, 20, 18, 16, 14, 12, 10];
const vesselSatelliteZoomScales = [1, 1.14, 1.28, 1.62, 2.04, 2.52, 3.08];
const vesselVoyageMapSpans = [62, 46, 34, 24, 16];
const vesselSatelliteLeafletZoomLevels = [10, 11, 12, 13, 14, 15, 16];
const vesselSatelliteDefaultZoomLevel = 2;
const vesselSatelliteLeafletMinZoom = Math.min(...vesselSatelliteLeafletZoomLevels);
const vesselSatelliteLeafletMaxZoom = Math.max(...vesselSatelliteLeafletZoomLevels);
const esriWorldImageryExportUrl = "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export";

const mapRegionLabels = [
  { name: "北美洲", x: 22.5, y: 29.0, size: 30 },
  { name: "南美洲", x: 31.2, y: 57.5, size: 28 },
  { name: "欧洲", x: 51.6, y: 25.5, size: 26 },
  { name: "非洲", x: 54.8, y: 44.8, size: 30 },
  { name: "亚洲", x: 72.5, y: 28.5, size: 34 },
  { name: "大洋洲", x: 86.2, y: 58.8, size: 24 }
];

const mapMajorCountryLabels = [
  { name: "加拿大", x: 20.8, y: 20.8, size: 15 },
  { name: "美国", x: 22.9, y: 29.4, size: 15 },
  { name: "墨西哥", x: 22.2, y: 36.8, size: 11 },
  { name: "古巴", x: 29.8, y: 35.2, size: 10 },
  { name: "巴拿马", x: 28.9, y: 40.6, size: 10 },
  { name: "格陵兰", x: 31.4, y: 12.6, size: 10 },
  { name: "巴西", x: 35.2, y: 53.5, size: 15 },
  { name: "阿根廷", x: 32.0, y: 65.6, size: 11 },
  { name: "智利", x: 30.4, y: 63.2, size: 10 },
  { name: "秘鲁", x: 29.7, y: 53.4, size: 10 },
  { name: "哥伦比亚", x: 30.5, y: 47.0, size: 10 },
  { name: "委内瑞拉", x: 33.2, y: 45.2, size: 10 },
  { name: "英国", x: 49.0, y: 22.0, size: 10 },
  { name: "法国", x: 50.1, y: 25.8, size: 10 },
  { name: "德国", x: 52.7, y: 23.7, size: 10 },
  { name: "西班牙", x: 48.5, y: 28.6, size: 10 },
  { name: "意大利", x: 53.7, y: 27.6, size: 10 },
  { name: "乌克兰", x: 57.8, y: 24.5, size: 10 },
  { name: "埃及", x: 57.8, y: 35.8, size: 10 },
  { name: "尼日利亚", x: 50.8, y: 45.8, size: 10 },
  { name: "南非", x: 56.2, y: 62.3, size: 11 },
  { name: "埃塞俄比亚", x: 58.8, y: 44.6, size: 10 },
  { name: "阿尔及利亚", x: 50.4, y: 34.5, size: 10 },
  { name: "刚果（金）", x: 54.5, y: 52.6, size: 10 },
  { name: "中国", x: 77.8, y: 30.3, size: 15 },
  { name: "印度", x: 71.1, y: 37.5, size: 13 },
  { name: "俄罗斯", x: 79.6, y: 17.5, size: 15 },
  { name: "日本", x: 87.8, y: 31.0, size: 10 },
  { name: "沙特阿拉伯", x: 62.0, y: 36.9, size: 10 },
  { name: "印度尼西亚", x: 81.6, y: 49.0, size: 10 },
  { name: "澳大利亚", x: 86.2, y: 60.7, size: 14 },
  { name: "新西兰", x: 92.5, y: 66.0, size: 10 },
  { name: "巴布亚新几内亚", x: 87.8, y: 51.2, size: 9 },
  { name: "斐济", x: 93.6, y: 57.8, size: 9 },
  { name: "所罗门群岛", x: 90.8, y: 53.8, size: 9 },
  { name: "新喀里多尼亚", x: 92.2, y: 61.0, size: 9 }
];

const state = {
  lang: "zh",
  theme: "light",
  activeView: "今日风险指数",
  openGroup: "risk-overview",
  mapZoom: 1,
  mapPanX: 0,
  mapPanY: 0,
  selectedVesselId: null,
  detailReturnView: "全球航运风险态势图",
  radarVesselId: null,
  radarReturnView: "全球航运风险态势图",
  radarVesselPage: 0,
  radarVesselPageDirection: "next",
  todayOverview: loadPersistedTodayOverview(),
  logisticsOverview: createLogisticsOverviewState(),
  editorDialog: null,
  vesselSatelliteZoom: {},
  vesselSatellitePan: {}
};

const leafletAssetState = {
  promise: null
};

const vesselSatelliteMaps = new Map();
const leafletAssetCandidates = {
  css: [
    "./assets/vendor/leaflet/leaflet.css",
    "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
    "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css"
  ],
  js: [
    "./assets/vendor/leaflet/leaflet.js",
    "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
    "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js"
  ]
};
const geoVisImagerySource = {
  labelZh: "星图影像",
  labelEn: "Imagery",
  url: "https://tiles0.geovisearth.com/base/v1/img/{z}/{x}/{y}?format=jpeg&token=26ee8d8d392b1cc49d91cd81ef1c802b6a63651541ac9c3d3d1359d8bf844228"
};

function tx(zh, en) {
  return state.lang === "zh" ? zh : en;
}

function ensureLeafletAssets() {
  if (window.L) return Promise.resolve(window.L);
  if (leafletAssetState.promise) return leafletAssetState.promise;

  leafletAssetState.promise = new Promise((resolve, reject) => {
    const loadCss = (index = 0) => {
      if (document.getElementById("leaflet-css")) return Promise.resolve();
      if (index >= leafletAssetCandidates.css.length) return Promise.reject(new Error("Leaflet CSS failed to load"));

      return new Promise((cssResolve, cssReject) => {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = leafletAssetCandidates.css[index];
        link.onload = () => cssResolve();
        link.onerror = () => {
          link.remove();
          cssReject(new Error("Leaflet CSS failed to load"));
        };
        document.head.appendChild(link);
      }).catch(() => loadCss(index + 1));
    };

    const loadJs = (index = 0) => {
      if (window.L) return Promise.resolve(window.L);
      if (index >= leafletAssetCandidates.js.length) return Promise.reject(new Error("Leaflet JS failed to load"));

      const existing = document.getElementById("leaflet-js");
      if (existing) {
        existing.remove();
      }

      return new Promise((jsResolve, jsReject) => {
        const script = document.createElement("script");
        script.id = "leaflet-js";
        script.src = leafletAssetCandidates.js[index];
        script.async = true;
        script.onload = () => jsResolve(window.L);
        script.onerror = () => {
          script.remove();
          jsReject(new Error("Leaflet JS failed to load"));
        };
        document.head.appendChild(script);
      }).catch(() => loadJs(index + 1));
    };

    loadCss()
      .then(() => loadJs())
      .then((L) => resolve(L))
      .catch(reject);
  });

  return leafletAssetState.promise;
}

const css = String.raw`
body.dash-body {
  --sidebar-width: 203px;
  --stage-offset: 250px;
  margin: 0;
  font-family: "PingFang SC", "Microsoft YaHei UI", "Microsoft YaHei", sans-serif;
  background: linear-gradient(180deg, #f7f7fc 0%, #f4f5fb 100%);
  color: #263443;
}

* {
  box-sizing: border-box;
}

img {
  display: block;
  max-width: 100%;
}

.today-shell {
  display: grid;
  grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
  width: min(1600px, calc(100vw - 18px));
  min-height: 100vh;
  margin: 0 auto 0 0;
}

.today-sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  padding: 26px 0 22px 0;
  background: rgba(255, 255, 255, 0.95);
  border-right: 1px solid #edf0f7;
}

.today-logo-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 18px 14px 30px;
}

.today-logo {
  width: 100%;
  max-width: 100%;
  height: auto;
  object-fit: contain;
}

body.theme-dark .today-logo-wrap {
  padding-top: 16px;
}

body.theme-dark .today-logo {
  padding: 0;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(245, 248, 252, 0.98) 0%, rgba(230, 237, 245, 0.96) 100%);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.24);
}

.today-nav {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.today-group {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.today-group-trigger,
.today-nav-item,
.today-sub-item {
  border: 0;
  background: transparent;
  font: inherit;
  text-align: left;
  color: #2d3742;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

.today-group-trigger > *,
.today-nav-item > *,
.today-sub-item > * {
  position: relative;
  z-index: 1;
}

.today-group-trigger::after,
.today-nav-item::after,
.today-sub-item::after {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(31, 44, 56, 0.1);
  opacity: 0;
  pointer-events: none;
  z-index: 0;
  display: none;
}

.today-group-trigger,
.today-nav-item {
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 40px;
  padding: 8px 10px 8px 28px;
  font-size: 14px;
  line-height: 1.18;
  letter-spacing: 0.01em;
  font-weight: 600;
  color: #2e3741;
}

.today-sub-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  padding-left: 0;
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  transition: max-height 280ms ease, opacity 220ms ease, margin 280ms ease;
}

.today-group.is-open .today-sub-list {
  margin: 4px 0 13px;
  opacity: 1;
}

.today-sub-item {
  position: relative;
  display: block;
  width: 100%;
  min-height: 34px;
  padding: 8px 10px 8px 54px;
  font-size: 13px;
  line-height: 1.18;
  letter-spacing: 0.01em;
  font-weight: 500;
  color: #4d5560;
  border-radius: 0;
}

.today-sub-item.is-active {
  background: #eef3fb;
  color: #1d252d;
  font-weight: 600;
}

.today-sub-item.is-active::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  border-radius: 999px;
  background: #247cdd;
  z-index: 2;
}

.today-nav-item.is-active,
.today-group-trigger.is-active {
  background: #eef3fb;
  color: #1d252d;
}

.today-group-trigger.is-pressing,
.today-nav-item.is-pressing {
  animation: navPrimaryPress 380ms ease-in-out;
  will-change: filter;
}

.today-sub-item.is-pressing {
  animation: navSubPress 360ms ease-in-out;
  will-change: filter;
}

@keyframes navPrimaryPress {
  0% {
    filter: brightness(1);
  }
  45% {
    filter: brightness(0.92);
  }
  100% {
    filter: brightness(1);
  }
}

@keyframes navSubPress {
  0% {
    filter: brightness(1);
  }
  55% {
    filter: brightness(0.94);
  }
  100% {
    filter: brightness(1);
  }
}

@keyframes navPrimaryPressDark {
  0% {
    opacity: 0;
  }
  45% {
    opacity: 0.28;
  }
  100% {
    opacity: 0;
  }
}

@keyframes navSubPressDark {
  0% {
    opacity: 0;
  }
  55% {
    opacity: 0.22;
  }
  100% {
    opacity: 0;
  }
}

.today-main {
  padding: 16px 14px 28px 10px;
}

.today-stage {
  width: calc(100vw - var(--stage-offset) - 16px);
  margin-left: 0;
}

body.lang-en {
  --sidebar-width: 244px;
  --stage-offset: 291px;
}

body.lang-en .today-group-trigger,
body.lang-en .today-nav-item {
  font-size: 13px;
  line-height: 1.22;
}

body.lang-en .today-sub-item {
  min-height: 50px;
  padding: 7px 12px 7px 54px;
  font-size: 12px;
  line-height: 1.2;
}

.today-topbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 14px;
  min-height: 44px;
  padding: 0 12px 10px 0;
  color: #1f2c38;
  font-size: 13px;
}

.today-top-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
  padding: 0;
}

.today-top-value {
  color: #6b7a89;
}

.today-top-dot {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: #2f86df;
  box-shadow: 0 0 0 4px rgba(47, 134, 223, 0.08);
}

.today-page {
  display: grid;
  gap: 22px;
}

.today-view {
  display: none;
}

.today-view.is-visible {
  display: grid;
  gap: 22px;
}

.today-placeholder-card {
  min-height: 320px;
}

.today-placeholder-title {
  margin: 0;
  font-size: 28px;
  line-height: 1.2;
  color: #243443;
}

.today-placeholder-text {
  margin: 14px 0 0;
  font-size: 14px;
  line-height: 1.9;
  color: #526070;
}

[data-edit-target] {
  user-select: none;
}

.today-editor-backdrop {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(12, 20, 32, 0.42);
  backdrop-filter: blur(8px);
}

.today-editor-modal {
  width: min(560px, calc(100vw - 24px));
  border-radius: 24px;
  background: #ffffff;
  border: 1px solid #dbe6f1;
  box-shadow: 0 24px 60px rgba(18, 37, 58, 0.22);
  padding: 22px;
  display: grid;
  gap: 18px;
}

.today-editor-modal-wide {
  width: min(920px, calc(100vw - 24px));
}

.today-editor-head,
.today-editor-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.today-editor-head h3 {
  margin: 0;
  font-size: 24px;
  color: #18344b;
}

.today-editor-close {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  border: 1px solid #d8e6f2;
  background: #f6fbff;
  color: #17344c;
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
}

.today-editor-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.today-editor-field {
  display: grid;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #6f8397;
}

.today-editor-field input,
.today-editor-field select,
.today-editor-table-row input {
  width: 100%;
  min-height: 46px;
  border-radius: 14px;
  border: 1px solid #d6e3ef;
  background: #fbfdff;
  padding: 0 14px;
  font: inherit;
  color: #17344c;
}

.today-editor-table {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.today-editor-table-row {
  display: grid;
  gap: 8px;
}

.today-editor-table-row span {
  font-size: 12px;
  font-weight: 700;
  color: #7c90a4;
}

.today-row-hero,
.today-row-four,
.today-row-three {
  display: grid;
  gap: 24px;
}

.today-row-hero {
  grid-template-columns: 332px minmax(0, 1fr);
}

.today-row-four {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.today-row-three {
  grid-template-columns: 1fr 1fr 1fr;
}

.today-card {
  background: #ffffff;
  border: 1px solid #edf1f7;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(34, 51, 84, 0.06);
}

.today-card.is-reveal-in {
  animation: pageCardReveal 560ms cubic-bezier(0.22, 1, 0.36, 1) both;
  will-change: opacity, transform;
}

@keyframes pageCardReveal {
  0% {
    opacity: 0;
    transform: translateY(18px) scale(0.988);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.today-card-inner {
  padding: 24px 26px;
}

.today-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.today-section-icon {
  display: block;
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.today-section-icon.blue {
  stroke: #5e89ae;
  stroke-width: 1.8;
}

.today-section-icon.red {
  stroke: #df4a45;
  stroke-width: 1.95;
}

.today-title h2,
.today-title h3 {
  margin: 0;
  color: #304252;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.today-score-card {
  min-height: 342px;
}

.today-score-card .today-card-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.today-score-wrap {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 16px;
}

.today-score-value {
  margin: 0;
  font-size: 82px;
  line-height: 0.9;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: #edf115;
  text-shadow: 0 4px 10px rgba(237, 241, 21, 0.26);
}

.today-score-desc {
  margin: 14px 0 0;
  font-size: 15px;
}

.today-score-desc.up {
  color: #b22b2e;
}

.today-score-desc.down {
  color: #2b9a77;
}

.today-chart-card {
  min-height: 342px;
}

.today-chart-frame {
  margin-top: 10px;
}

.today-chart-svg {
  width: 100%;
  height: auto;
  overflow: visible;
}

.today-grid-line {
  stroke: #eef1f6;
  stroke-width: 1;
}

.today-grid-label {
  fill: #a1aab7;
  font-size: 11px;
}

.today-axis-label {
  fill: #9aa5b3;
  font-size: 10px;
}

.today-chart-line {
  fill: none;
  stroke: #6f7884;
  stroke-width: 2.2;
}

.today-chart-point {
  stroke: rgba(255,255,255,0.95);
  stroke-width: 2.2;
}

.today-legend {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 14px;
  margin-top: 14px;
  font-size: 12px;
  color: #344250;
}

.today-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.today-legend-dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
}

.today-metric {
  min-height: 236px;
  border-left: 4px solid transparent;
}

.today-metric.warn {
  border-left-color: #da8a40;
}

.today-metric.safe {
  border-left-color: #0db469;
}

.today-metric.low {
  border-left-color: #66ee9d;
}

.today-metric.high {
  border-left-color: #be0d26;
}

.today-metric-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 28px;
}

.today-metric-number {
  margin: 0;
  font-size: 66px;
  line-height: 1;
  font-weight: 700;
  color: #0e1318;
}

.today-metric-level {
  margin: 12px 0 0;
  font-size: 14px;
  color: #2d3742;
}

.today-metric-trend {
  margin: 10px 0 0;
  font-size: 14px;
}

.today-metric-trend.up {
  color: #b22b2e;
}

.today-metric-trend.down {
  color: #2b9a77;
}

.today-recommend-card {
  min-height: 314px;
}

.today-recommend-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.today-action-btn {
  border: 0;
  border-radius: 10px;
  background: linear-gradient(180deg, #2f86df 0%, #2b72cf 100%);
  color: #ffffff;
  padding: 12px 22px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 10px 20px rgba(47, 134, 223, 0.18);
}

.today-alert-line,
.today-ops p {
  margin: 12px 0 0;
  font-size: 14px;
  line-height: 1.95;
  color: #2f3c49;
}

.today-alert-label {
  color: #b03940;
  font-weight: 600;
}

.today-alert-block {
  position: relative;
  margin-top: 14px;
  padding: 0 0 0 32px;
}

.today-alert-icon {
  position: absolute;
  left: 0;
  top: 2px;
  display: block;
  width: 20px;
  height: 36px;
}

.today-alert-content .today-alert-line {
  margin-top: 0;
}

.today-alert-content .today-alert-line + .today-alert-line {
  margin-top: 8px;
}

.today-alert-text {
  color: #243342;
  font-weight: 400;
}

.today-ops {
  margin-top: 18px;
  padding: 0 0 0 32px;
}

.today-ops p {
  margin-top: 8px;
}

.today-ops p.today-ops-label {
  margin-top: 0;
  color: #d7a63d;
  font-weight: 700;
}

.today-nav-svg,
.today-icon-svg,
.today-top-svg {
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  stroke: currentColor;
  stroke-width: 1.5;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.today-nav-svg {
  color: #26313c;
}

.today-nav-asset {
  display: block;
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  object-fit: contain;
}

.today-icon-asset {
  display: block;
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  object-fit: contain;
  filter: brightness(0) saturate(100%) invert(54%) sepia(23%) saturate(642%) hue-rotate(165deg) brightness(93%) contrast(87%);
}

.today-icon-asset-red {
  filter: brightness(0) saturate(100%) invert(24%) sepia(76%) saturate(2333%) hue-rotate(342deg) brightness(91%) contrast(93%);
}

.today-icon-asset-strong {
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
}

.today-icon-lift {
  transform: translateY(-1px);
}

.today-icon-asset-weather {
  width: 19px;
  height: 19px;
  flex: 0 0 19px;
  transform: none;
}

.today-icon-svg-strong {
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
  stroke-width: 2;
}

.today-icon-svg-alert-title {
  width: 21px;
  height: 21px;
  flex: 0 0 21px;
  stroke-width: 2.15;
}

.today-icon-svg {
  color: #5a7f99;
}

.today-top-svg {
  width: 15px;
  height: 15px;
  color: #5e6b79;
}

body.theme-dark {
  background: linear-gradient(180deg, #141a22 0%, #11161d 100%);
  color: #d9e1eb;
}

body.theme-dark .today-sidebar {
  background: rgba(20, 26, 34, 0.96);
  border-right-color: #233142;
}

body.theme-dark .today-group-trigger,
body.theme-dark .today-nav-item,
body.theme-dark .today-sub-item,
body.theme-dark .today-topbar,
body.theme-dark .today-title h2,
body.theme-dark .today-title h3,
body.theme-dark .today-placeholder-title,
body.theme-dark .today-metric-number,
body.theme-dark .today-metric-level,
body.theme-dark .today-legend,
body.theme-dark .route-legend,
body.theme-dark .route-mini-title,
body.theme-dark .route-tip-title {
  color: #d9e1eb;
}

body.theme-dark .today-sub-item,
body.theme-dark .today-group-trigger,
body.theme-dark .today-nav-item,
body.theme-dark .today-grid-label,
body.theme-dark .today-axis-label,
body.theme-dark .route-grid-label,
body.theme-dark .route-axis-label,
body.theme-dark .route-mini-grid-label,
body.theme-dark .route-mini-axis-label,
body.theme-dark .today-placeholder-text,
body.theme-dark .route-copy,
body.theme-dark .route-judge-lead,
body.theme-dark .route-tip-copy,
body.theme-dark .today-alert-text,
body.theme-dark .today-ops p,
body.theme-dark .today-metric-trend {
  color: #9eafc1;
}

body.theme-dark .today-card {
  background: #19222d;
  border-color: #253240;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.22);
}

body.theme-dark .today-sub-item.is-active,
body.theme-dark .today-nav-item.is-active,
body.theme-dark .today-group-trigger.is-active {
  background: #223245;
  color: #eef4fb;
}

body.theme-dark .today-group-trigger::after,
body.theme-dark .today-nav-item::after,
body.theme-dark .today-sub-item::after {
  display: block;
  background: rgba(255, 255, 255, 0.24);
}

body.theme-dark .today-group-trigger.is-pressing,
body.theme-dark .today-nav-item.is-pressing,
body.theme-dark .today-sub-item.is-pressing {
  animation: none;
  filter: none;
}

body.theme-dark .today-group-trigger.is-pressing::after,
body.theme-dark .today-nav-item.is-pressing::after {
  animation: navPrimaryPressDark 380ms ease-in-out;
}

body.theme-dark .today-sub-item.is-pressing::after {
  animation: navSubPressDark 360ms ease-in-out;
}

body.theme-dark .today-grid-line,
body.theme-dark .route-grid-line,
body.theme-dark .route-mini-grid-line {
  stroke: #2b3848;
}

body.theme-dark .today-chart-line,
body.theme-dark .route-main-line {
  stroke: #9ea9b5;
}

body.theme-dark .today-top-value {
  color: #8ea2b5;
}

body.theme-dark .today-top-dot {
  background: #67a7ff;
  box-shadow: 0 0 0 4px rgba(103, 167, 255, 0.14);
}

body.theme-dark .route-tip-box {
  background: #1a2c3d;
  border-color: #2d4660;
}

body.theme-dark .route-map-panel,
body.theme-dark .route-media-item {
  border-color: #2a3644;
  background: #121920;
}

.route-view {
  gap: 18px;
}

.route-summary-card .today-card-inner,
.route-judge-card .today-card-inner,
.route-guide-card .today-card-inner,
.route-mini-card .today-card-inner {
  padding: 18px 20px 20px;
}

.route-chart-card {
  min-height: 342px;
}

.route-main-svg,
.route-mini-svg {
  width: 100%;
  height: auto;
  overflow: visible;
}

.route-main-frame {
  margin-top: 8px;
}

.route-grid-line,
.route-mini-grid-line {
  stroke: #edf1f5;
  stroke-width: 1;
}

.route-grid-label,
.route-mini-grid-label {
  fill: #a5aebb;
  font-size: 10px;
}

.route-axis-label,
.route-mini-axis-label {
  fill: #9eabb7;
  font-size: 9px;
}

.route-main-line {
  fill: none;
  stroke: #73808d;
  stroke-width: 2.1;
}

.route-main-point {
  stroke: rgba(255, 255, 255, 0.96);
  stroke-width: 2;
}

.route-legend {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 6px;
  font-size: 12px;
  color: #374554;
}

.route-legend-label {
  font-weight: 500;
}

.route-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.route-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.route-info-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.04fr) minmax(0, 1fr);
  gap: 18px;
}

.route-summary-card,
.route-judge-card {
  min-height: 218px;
}

.route-summary-block + .route-summary-block {
  margin-top: 18px;
}

.route-copy {
  margin: 10px 0 0;
  font-size: 13px;
  line-height: 1.95;
  color: #2f3c49;
}

.route-copy p {
  margin: 0;
}

.route-copy p + p {
  margin-top: 6px;
}

.route-impact-icon {
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
  stroke-width: 2.1;
}

.route-judge-lead {
  margin: 14px 0 0;
  font-size: 13px;
  line-height: 1.85;
  color: #2f3c49;
}

.route-judge-list {
  position: relative;
  margin: 12px 0 0 16px;
  padding: 0 0 0 15px;
  list-style: none;
}

.route-judge-list::before {
  content: "";
  position: absolute;
  left: 0;
  top: 2px;
  bottom: 2px;
  width: 1px;
  background: #d6ddea;
}

.route-judge-list li {
  display: grid;
  grid-template-columns: 16px minmax(0, 1fr);
  align-items: flex-start;
  gap: 8px;
  position: relative;
  margin: 0;
  padding: 0 0 14px 0;
  font-size: 13px;
  line-height: 1.8;
  color: #2f3c49;
}

.route-judge-list li:last-child {
  padding-bottom: 0;
}

.route-step-dot {
  width: 16px;
  height: 16px;
  object-fit: contain;
  margin-top: 3px;
}

.route-guide-card {
  min-height: 258px;
}

.route-guide-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.route-guide-box {
  min-height: 92px;
  padding: 14px 14px 12px;
  border-radius: 4px;
  border: 1px solid #edf1f5;
}

.route-guide-box.safe {
  background: #ecfbf5;
}

.route-guide-box.warn {
  background: #fffbe9;
}

.route-guide-box.risk {
  background: #fff1f3;
}

.route-guide-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 12px;
  font-weight: 700;
}

.route-guide-box.safe .route-guide-head {
  color: #188d5f;
}

.route-guide-box.warn .route-guide-head {
  color: #9d7a16;
}

.route-guide-box.risk .route-guide-head {
  color: #c04e5b;
}

.route-guide-head .route-legend-dot {
  width: 8px;
  height: 8px;
}

.route-guide-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.route-guide-list li {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 12px;
  line-height: 1.8;
  color: #314151;
}

.route-guide-list li + li {
  margin-top: 2px;
}

.route-guide-list .route-mini-bullet {
  width: 12px;
  height: 12px;
  flex: 0 0 12px;
  margin-top: 4px;
  color: #5f7e97;
}

.route-guide-list .route-mini-bullet-asset {
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  margin-top: 1px;
  object-fit: contain;
}

.route-guide-list .route-mini-bullet-safe {
  filter: none;
}

.route-guide-list .route-mini-bullet-warn {
  filter: none;
}

.route-guide-list .route-mini-bullet-risk {
  filter: none;
}

.route-tip-box {
  display: flex;
  gap: 10px;
  margin-top: 12px;
  padding: 13px 14px;
  border-radius: 4px;
  border: 1px solid #d8e8f8;
  background: #eef6ff;
}

.route-tip-icon {
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  color: #5f88a5;
}

.route-tip-icon-asset,
.route-title-icon-asset {
  object-fit: contain;
  filter: brightness(0) saturate(100%) invert(54%) sepia(23%) saturate(642%) hue-rotate(165deg) brightness(93%) contrast(87%);
}

.route-title-icon-asset {
  width: 19px;
  height: 19px;
  flex: 0 0 19px;
}

.route-title-icon-asset.flip {
  transform: scaleX(-1);
}

.route-tip-icon-asset {
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
}

.route-tip-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #304252;
}

.route-tip-copy {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.8;
  color: #3b4a58;
}

.route-world-card {
  overflow: hidden;
}

.route-world-card .today-card-inner {
  padding: 0;
}

.route-world-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(120px, 1fr));
  gap: 10px;
  margin: 0 14px 20px;
}

.route-world-stat {
  padding: 14px 16px 12px;
  border-radius: 14px;
  border: 1px solid #e7edf6;
  background: linear-gradient(180deg, #f9fbff 0%, #f4f7fb 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.route-world-stat-label {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  color: #5e6c7b;
}

.route-world-stat-label::before {
  content: "";
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 0 5px rgba(96, 153, 219, 0.08);
}

.route-world-stat.low .route-world-stat-label {
  color: #18a866;
}

.route-world-stat.medium .route-world-stat-label {
  color: #d5a915;
}

.route-world-stat.high .route-world-stat-label {
  color: #de5a4a;
}

.route-world-stat-value {
  margin: 10px 0 0;
  font-size: 29px;
  font-weight: 700;
  color: #182838;
}

.route-world-stat-copy {
  margin: 4px 0 0;
  font-size: 11px;
  color: #7b8796;
}

.route-world-toolbar {
  position: absolute;
  top: 14px;
  left: 14px;
  right: 14px;
  z-index: 4;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  pointer-events: none;
}

.route-world-legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  max-width: min(72%, 720px);
  pointer-events: auto;
}

.route-world-legend-title {
  font-size: 12px;
  font-weight: 600;
  color: #526172;
}

.route-world-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  background: #f5f8fc;
  border: 1px solid #e6ecf4;
  font-size: 12px;
  color: #334252;
}

.route-world-legend-item::before {
  content: "";
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--legend-color);
  box-shadow: 0 0 0 5px rgba(96, 153, 219, 0.08);
}

.route-world-tools {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
  pointer-events: auto;
}

.route-map-hint {
  font-size: 12px;
  color: #6f7f90;
}

.route-map-reset {
  min-height: 34px;
  padding: 0 14px;
  border: 1px solid #d4deea;
  border-radius: 999px;
  background: #fff;
  color: #203447;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 180ms ease, border-color 180ms ease, transform 180ms ease;
}

.route-map-reset:hover {
  background: #f4f7fb;
  border-color: #c6d4e5;
  transform: translateY(-1px);
}

.route-map-shell {
  margin: 0 14px 18px;
  border-radius: 22px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #dfe8f2;
  box-shadow: 0 18px 34px rgba(30, 52, 78, 0.08);
}

.route-map-viewport {
  position: relative;
  height: clamp(780px, calc(100vh - 200px), 1080px);
  min-height: 780px;
  overflow: hidden;
  cursor: grab;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.route-map-viewport.is-dragging {
  cursor: grabbing;
}

.route-map-stage {
  position: absolute;
  inset: 0;
  transform-origin: 0 0;
  will-change: transform;
}

.route-map-surface {
  position: absolute;
}

.route-map-backdrop,
.route-map-overlay,
.route-map-label-layer {
  position: absolute;
  inset: 0;
}

.route-map-backdrop {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: #ffffff;
}

.route-map-backdrop svg,
.route-map-overlay svg,
.route-map-backdrop img {
  display: block;
  width: 100%;
  height: 100%;
}

.route-map-backdrop img {
  width: 100%;
  height: 100%;
  min-height: 0;
  object-fit: fill;
  object-position: center center;
  opacity: 1;
  filter: none;
  transform: none;
  user-select: none;
  -webkit-user-drag: none;
  pointer-events: none;
}

.route-map-overlay {
  pointer-events: none;
}

.route-map-label-layer {
  pointer-events: none;
  opacity: 0;
  transform: translateY(4px);
  will-change: opacity, transform;
  transition:
    opacity 180ms ease,
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
}

.route-map-viewport[data-label-tier="regions"] .route-map-label-layer.regions {
  opacity: 1;
  transform: translateY(0);
}

.route-map-viewport[data-label-tier="major"] .route-map-label-layer.major {
  opacity: 1;
  transform: translateY(0);
}

.route-map-label {
  position: absolute;
  left: calc(var(--x) * 1%);
  top: calc(var(--y) * 1%);
  transform: translate(-50%, -50%);
  color: #000000;
  font-size: calc(var(--size) * 1px);
  font-weight: 400;
  line-height: 1;
  white-space: nowrap;
  text-shadow: none;
  letter-spacing: 0.02em;
  user-select: none;
  -webkit-user-select: none;
  transition:
    opacity 240ms ease,
    transform 300ms cubic-bezier(0.22, 1, 0.36, 1);
}

.route-map-label.region {
  color: #000000;
  font-weight: 500;
  letter-spacing: 0.08em;
}

.route-map-label.major {
  color: #000000;
  font-weight: 400;
}

.route-map-hotspot {
  position: absolute;
  left: calc(var(--x) * 1%);
  top: calc(var(--y) * 1%);
  width: calc(var(--size) * 1%);
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  pointer-events: none;
}

.route-map-hotspot::before,
.route-map-hotspot::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 50%;
}

.route-map-hotspot::before {
  background: radial-gradient(circle, rgba(255, 255, 255, 0.18) 0%, transparent 52%);
}

.route-map-hotspot::after {
  border: 1.5px solid rgba(255, 255, 255, 0.18);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.05) inset,
    0 0 0 18px var(--tone-glow),
    0 0 34px var(--tone-shadow);
}

.route-map-hotspot.medium {
  --tone-glow: rgba(245, 197, 31, 0.14);
  --tone-shadow: rgba(245, 197, 31, 0.24);
}

.route-map-hotspot.high {
  --tone-glow: rgba(242, 106, 45, 0.14);
  --tone-shadow: rgba(242, 106, 45, 0.24);
}

.route-map-lane {
  fill: none;
  stroke: rgba(51, 164, 255, 0.88);
  stroke-width: 6;
  stroke-linecap: round;
  stroke-dasharray: 16 30;
  filter: drop-shadow(0 0 7px rgba(51, 164, 255, 0.34));
}

.route-map-ghost-layer,
.route-map-vessel-layer {
  position: absolute;
  inset: 0;
}

.route-map-ghost,
.route-map-vessel {
  position: absolute;
  left: calc((var(--x) + (var(--fine-x, 0) * var(--map-detail, 0))) * 1%);
  top: calc((var(--y) + (var(--fine-y, 0) * var(--map-detail, 0))) * 1%);
  transform: translate(-50%, -50%) rotate(calc(var(--heading) * 1deg));
  transform-origin: center;
}

.route-map-vessel-layer {
  pointer-events: none;
}

.route-map-ghost {
  width: calc(var(--size) * 1px);
  height: calc(var(--size) * 0.72px);
  opacity: 0.92;
}

.route-map-ghost::before {
  content: "";
  display: block;
  width: 100%;
  height: 100%;
  clip-path: polygon(100% 50%, 18% 6%, 0 50%, 18% 94%);
  background: var(--ghost-color);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.08);
}

.route-map-vessel {
  width: calc(var(--ship-size) * var(--ship-scale-comp, 1) * 1px);
  height: calc(var(--ship-size) * var(--ship-scale-comp, 1) * 1px);
  display: grid;
  place-items: center;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
  pointer-events: auto;
  transition: transform 180ms ease, filter 180ms ease;
}

.route-map-vessel::before,
.route-map-vessel::after {
  content: "";
  position: absolute;
  border-radius: 50%;
}

.route-map-vessel::before {
  inset: 3px;
  background: radial-gradient(circle, var(--ship-halo) 0%, rgba(255, 255, 255, 0) 72%);
  filter: blur(2px);
}

.route-map-vessel::after {
  inset: -5px;
  border: 1px solid var(--ship-ring);
  opacity: 0;
  transform: scale(0.88);
  transition: opacity 180ms ease, transform 180ms ease;
}

.route-map-vessel:hover::after,
.route-map-vessel.is-active::after {
  opacity: 1;
  transform: scale(1);
}

.route-map-vessel.is-active {
  z-index: 4;
}

.route-map-vessel:hover {
  filter: brightness(1.04);
}

.route-map-vessel-icon {
  display: block;
  flex: 0 0 auto;
  position: relative;
  z-index: 2;
  width: 74%;
  height: 74%;
  color: var(--ship-color);
  filter: drop-shadow(0 0 8px rgba(0, 0, 0, 0.16));
  user-select: none;

}

.route-map-vessel-icon svg {
  display: block;
  width: 100%;
  height: 100%;
}

.route-map-vessel.low {
  --ship-color: #49c97d;
  --ship-halo: rgba(63, 207, 127, 0.24);
  --ship-ring: rgba(63, 207, 127, 0.32);
}

.route-map-vessel.medium {
  --ship-color: #f1bc2c;
  --ship-halo: rgba(244, 191, 47, 0.24);
  --ship-ring: rgba(244, 191, 47, 0.3);
}

.route-map-vessel.high {
  --ship-color: #ff6546;
  --ship-halo: rgba(255, 101, 70, 0.24);
  --ship-ring: rgba(255, 101, 70, 0.34);
}

.route-map-vessel.size-sm {
  --ship-size: 16;
}

.route-map-vessel.size-md {
  --ship-size: 19;
}

.route-map-vessel.size-lg {
  --ship-size: 22;
}

.route-map-popup {
  position: absolute;
  z-index: 8;
  width: min(360px, calc(100% - 24px));
  border-radius: 14px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #d8e0e9;
  box-shadow: 0 24px 46px rgba(18, 34, 54, 0.18);
  color: #243446;
}

.route-map-popup[hidden] {
  display: none;
}

.route-map-popup-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px 0;
}

.route-map-popup-identity {
  display: block;
  min-width: 0;
  flex: 1;
}

.route-map-popup-title-wrap {
  min-width: 0;
}

.route-map-popup-head-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 0 0 auto;
}

.route-map-popup-grip,
.route-map-popup-close {
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #9aa7b5;
  font: inherit;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}

.route-map-popup-close {
  font-size: 28px;
}

.route-map-popup-photo {
  position: relative;
  margin-top: 8px;
  min-height: 0;
  border-radius: 0;
  overflow: hidden;
}

.route-map-popup-photo img {
  display: block;
  width: 100%;
  height: 172px;
  object-fit: cover;
  filter: none;
}

.route-map-popup-photo-credit {
  position: absolute;
  left: 10px;
  bottom: 10px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(18, 33, 51, 0.52);
  color: #ffffff;
  font-size: 10px;
  font-weight: 600;
  backdrop-filter: blur(8px);
}

.route-map-popup-title {
  margin: 0;
  max-width: 190px;
  font-size: 15px;
  line-height: 1.15;
  font-weight: 700;
  color: #263445;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.route-map-popup-subtitle {
  margin: 1px 0 0;
  font-size: 11px;
  color: #7f8c97;
}

.route-map-popup-insight {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 14px 16px;
  background: linear-gradient(180deg, #e7f1ff 0%, #dbeaff 100%);
  border-bottom: 1px solid #d6e5fb;
}

.route-map-popup-insight-copy {
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
  color: #29518a;
}

.route-map-popup-risk {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.route-map-popup-risk.low {
  background: rgba(73, 201, 125, 0.16);
  color: #168553;
}

.route-map-popup-risk.medium {
  background: rgba(241, 188, 44, 0.18);
  color: #926d07;
}

.route-map-popup-risk.high {
  background: rgba(255, 101, 70, 0.14);
  color: #c84a33;
}

.route-map-popup-insight-btn {
  min-height: 40px;
  padding: 0 18px;
  border: 0;
  border-radius: 8px;
  background: linear-gradient(180deg, #1a77e8 0%, #0e63ca 100%);
  color: #ffffff;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 8px 16px rgba(20, 89, 173, 0.18);
}

.route-map-popup-progress {
  margin: 0;
  padding: 14px 14px 0;
  background: #ffffff;
}

.route-map-popup-route {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.route-map-popup-route-code {
  display: block;
  font-size: 17px;
  font-weight: 400;
  letter-spacing: 0.01em;
  color: #394655;
}

.route-map-popup-route-meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 11px;
  font-weight: 600;
  color: #1f2f40;
  line-height: 1.2;
  white-space: nowrap;
}

.route-map-popup-route-meta-label {
  color: #1a1f26;
  font-weight: 700;
}

.route-map-popup-bar {
  position: relative;
  height: 4px;
  margin-top: 18px;
  border-radius: 999px;
  background: #c3c7ce;
  overflow: hidden;
}

.route-map-popup-bar::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: calc(var(--progress) * 1%);
  border-radius: inherit;
  background: linear-gradient(90deg, #2d95f5 0%, #21b9ff 100%);
}

.route-map-popup-progress-ship {
  position: absolute;
  left: calc(var(--progress) * 1%);
  top: 50%;
  width: 54px;
  height: 18px;
  transform: translate(-50%, -50%);
  filter: drop-shadow(0 5px 10px rgba(18, 66, 126, 0.16));
}

.route-map-popup-tools {
  display: flex;
  gap: 8px;
  padding: 12px 14px 14px;
}

.route-map-popup-tool {
  min-height: 40px;
  padding: 0 14px;
  border: 1px solid #d3dae3;
  border-radius: 8px;
  background: #f6f9fc;
  color: #415163;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.route-map-popup-tool.dark {
  background: linear-gradient(180deg, #424e60 0%, #303949 100%);
  border-color: #303949;
  color: #ffffff;
}

.route-map-popup-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr 0.9fr;
  margin: 0;
  border-top: 1px solid #e5ecf3;
  border-bottom: 1px solid #e5ecf3;
}

.route-map-popup-grid > div {
  min-width: 0;
  padding: 12px 12px 10px;
  border-right: 1px solid #e5ecf3;
}

.route-map-popup-grid > div:last-child {
  border-right: 0;
}

.route-map-popup-grid-label {
  display: block;
  font-size: 11px;
  color: #7c8a98;
  line-height: 1.3;
}

.route-map-popup-grid-value {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
  color: #2d3b48;
}

.route-map-popup-foot {
  display: grid;
  gap: 6px;
  padding: 12px 12px 10px;
  font-size: 11px;
  line-height: 1.5;
  color: #707d89;
}

.route-map-popup-foot strong {
  color: #394653;
}

.route-map-popup-position {
  color: #577089;
  font-weight: 600;
}

.route-map-focus-bubble {
  position: absolute;
  z-index: 7;
  max-width: 220px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid #d8e0e9;
  box-shadow: 0 16px 36px rgba(17, 31, 48, 0.14);
  color: #253546;
  pointer-events: none;
}

.route-map-focus-bubble[hidden] {
  display: none;
}

.route-map-focus-title {
  display: block;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.3;
}

.route-map-focus-subtitle {
  display: block;
  margin-top: 4px;
  font-size: 10px;
  color: #657585;
}

.route-map-coords {
  position: absolute;
  z-index: 6;
  right: 18px;
  bottom: 18px;
  min-width: 188px;
  padding: 12px 14px;
  border-radius: 18px;
  background: rgba(15, 23, 34, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.28);
  color: #ecf2f8;
  backdrop-filter: blur(12px);
  pointer-events: none;
}

.route-map-coords-label {
  display: block;
  margin-bottom: 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(155, 178, 200, 0.88);
}

.route-map-coords-values {
  display: grid;
  gap: 4px;
}

.route-map-coords-value {
  display: block;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.45;
  color: #f3f7fb;
}

.route-map-coords-value.muted {
  color: rgba(216, 227, 239, 0.68);
}

.marine-live-view {
  gap: 20px;
}

.marine-live-tips {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.marine-live-tip {
  min-height: 120px;
}

.marine-live-tip p {
  margin: 10px 0 0;
  font-size: 12px;
  line-height: 1.8;
  color: #586779;
}

body.theme-dark .route-world-title {
  color: #edf3fa;
}

body.theme-dark .route-world-subtitle,
body.theme-dark .route-map-hint,
body.theme-dark .route-world-legend-title {
  color: #95a6b9;
}

body.theme-dark .route-world-stat {
  background: linear-gradient(180deg, rgba(20, 29, 40, 0.96) 0%, rgba(13, 20, 29, 0.94) 100%);
  border-color: #223246;
}

body.theme-dark .route-world-stat-value {
  color: #f2f6fb;
}

body.theme-dark .route-world-stat-copy {
  color: #8295a9;
}

body.theme-dark .route-world-legend-item {
  background: rgba(17, 26, 37, 0.86);
  border-color: #223446;
  color: #d8e1eb;
}

body.theme-dark .route-map-reset {
  background: rgba(15, 23, 34, 0.92);
  border-color: #26405a;
  color: #ecf3fa;
}

body.theme-dark .route-map-reset:hover {
  background: rgba(22, 33, 46, 0.98);
}

body.theme-dark .marine-live-tip p {
  color: #93a6b9;
}

.route-related-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.72fr) 322px;
  gap: 12px;
  margin-top: 14px;
}

.route-map-panel {
  min-height: 420px;
  overflow: hidden;
  border-radius: 4px;
  background: #f7fafc;
  border: 1px solid #e9eef4;
}

.route-map-panel img {
  width: 100%;
  height: 100%;
  min-height: 420px;
  object-fit: cover;
}

.route-media-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.route-media-item {
  overflow: hidden;
  border-radius: 2px;
  border: 1px solid #edf1f6;
  background: #0f1114;
}

.route-media-item img {
  width: 100%;
  aspect-ratio: 1.25 / 1;
  object-fit: cover;
}

.route-mini-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 14px;
}

.route-mini-card {
  min-height: 216px;
}

.route-mini-title {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: #253747;
}

.route-mini-main,
.route-mini-compare {
  fill: none;
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.route-mini-compare {
  stroke-dasharray: 3.5 4.5;
  opacity: 0.72;
}

.route-mini-point {
  stroke: rgba(255, 255, 255, 0.94);
  stroke-width: 1.8;
}

.vessel-detail-view {
  padding-bottom: 28px;
}

.vessel-detail-stack {
  display: grid;
  gap: 18px;
}

.vessel-detail-hero .today-card-inner,
.vessel-detail-voyage-card .today-card-inner {
  padding: 22px 24px 24px;
}

.vessel-detail-topbar,
.vessel-detail-section-head,
.vessel-detail-location-head,
.vessel-detail-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: space-between;
}

.vessel-detail-back,
.vessel-detail-live-btn,
.vessel-detail-outline-btn,
.vessel-satellite-control,
.vessel-detail-inline-btn {
  border: 1px solid #cfe0f2;
  border-radius: 12px;
  background: #ffffff;
  color: #1f3b55;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.vessel-detail-back,
.vessel-detail-live-btn,
.vessel-detail-inline-btn {
  min-height: 42px;
  padding: 0 16px;
}

.vessel-detail-back:hover,
.vessel-detail-live-btn:hover,
.vessel-detail-outline-btn:hover,
.vessel-satellite-control:hover,
.vessel-detail-inline-btn:hover {
  background: #f5f9ff;
  border-color: #bdd4ec;
}

.vessel-detail-risk-pill {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.vessel-detail-risk-pill.low {
  background: rgba(84, 217, 141, 0.12);
  color: #17975b;
}

.vessel-detail-risk-pill.medium {
  background: rgba(255, 205, 84, 0.14);
  color: #ae7a00;
}

.vessel-detail-risk-pill.high {
  background: rgba(255, 107, 71, 0.12);
  color: #d74f2e;
}

.vessel-detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;
}

.vessel-detail-kicker,
.vessel-detail-section-kicker,
.vessel-detail-location-kicker,
.vessel-detail-photo-kicker {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #7a8ea5;
}

.vessel-detail-title {
  margin: 0;
  font-size: clamp(28px, 3.2vw, 40px);
  line-height: 1.04;
  color: #16324a;
}

.vessel-detail-subtitle,
.vessel-detail-hero-copy {
  margin: 8px 0 0;
  color: #607486;
  line-height: 1.6;
}

.vessel-detail-photo-frame {
  margin-top: 18px;
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  background: linear-gradient(180deg, #f6fbff 0%, #edf4fb 100%);
  min-height: 340px;
  box-shadow: inset 0 0 0 1px rgba(222, 232, 243, 0.9);
}

.vessel-detail-photo-frame img {
  width: 100%;
  height: min(45vw, 460px);
  min-height: 340px;
  object-fit: cover;
}

.vessel-detail-photo-meta {
  position: absolute;
  left: 18px;
  bottom: 18px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 16px;
  background: rgba(9, 23, 38, 0.76);
  color: #f3f7fb;
  backdrop-filter: blur(10px);
}

.vessel-detail-voyage-values strong,
.vessel-detail-location-coords,
.vessel-detail-route-code {
  font-size: 18px;
  color: #14314b;
}

.vessel-detail-photo-meta strong {
  color: inherit;
}

.vessel-detail-section-head {
  margin-bottom: 14px;
}

.vessel-detail-section-head h2,
.vessel-detail-location-head h3 {
  margin: 0;
  font-size: 26px;
  color: #17334b;
}

.vessel-detail-voyage-map {
  position: relative;
  overflow: hidden;
  border-radius: 24px;
  min-height: 330px;
  background: linear-gradient(180deg, #eef4fb 0%, #dbe7f2 100%);
  box-shadow: inset 0 0 0 1px rgba(216, 228, 240, 0.92);
}

.vessel-detail-voyage-map img,
.vessel-satellite-frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.vessel-detail-map-badge {
  position: absolute;
  top: 18px;
  right: 18px;
  z-index: 2;
}

.vessel-detail-map-pin,
.vessel-satellite-pin {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 30px;
  height: 30px;
  border-radius: 50% 50% 50% 0;
  background: #2f84ff;
  transform: translate(-50%, -100%) rotate(-45deg);
  box-shadow: 0 12px 18px rgba(47, 132, 255, 0.24);
  pointer-events: none;
}

.vessel-detail-map-pin::after,
.vessel-satellite-pin::after {
  content: "";
  position: absolute;
  inset: 7px;
  border-radius: 50%;
  background: #ffffff;
}

.vessel-detail-map-pin {
  left: calc(var(--x) * 1%);
  top: calc(var(--y) * 1%);
}

.vessel-satellite-div-icon {
  background: transparent;
  border: 0;
}

.vessel-satellite-marker {
  position: relative;
  width: 30px;
  height: 30px;
  pointer-events: none;
}

.vessel-satellite-marker::before {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: rgba(47, 132, 255, 0.16);
  transform: translate(-50%, -50%);
}

.vessel-satellite-marker .vessel-satellite-pin {
  left: 50%;
  top: 50%;
}

.vessel-detail-route-strip {
  display: grid;
  gap: 18px;
  margin-top: 18px;
}

.vessel-detail-route-head {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;
}

.vessel-detail-route-label,
.vessel-detail-meta-label,
.vessel-detail-location-copy,
.vessel-satellite-credit,
.vessel-detail-photo-meta span {
  font-size: 13px;
  color: #6d8196;
}

.vessel-detail-progress-track {
  position: relative;
  height: 26px;
}

.vessel-detail-progress-track::before {
  content: "";
  position: absolute;
  left: 10px;
  right: 10px;
  top: 50%;
  height: 8px;
  border-radius: 999px;
  transform: translateY(-50%);
  background:
    radial-gradient(circle, #2f75d9 0 2.5px, transparent 2.7px) center/14px 14px repeat-x,
    linear-gradient(90deg, rgba(47, 117, 217, 0.24) 0%, rgba(47, 117, 217, 0.08) 100%);
}

.vessel-detail-progress-ship {
  position: absolute;
  top: 50%;
  left: calc(var(--progress) * 1%);
  transform: translate(-50%, -50%);
  width: 44px;
  height: 22px;
  color: #1b75e5;
}

.vessel-detail-progress-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.vessel-detail-voyage-values p,
.vessel-detail-route-head p,
.vessel-detail-location-head p,
.vessel-detail-location-head h3,
.vessel-detail-actions {
  margin: 0;
}

.vessel-detail-actions {
  margin-top: 18px;
}

.vessel-detail-outline-btn {
  min-height: 46px;
  padding: 0 18px;
}

.vessel-detail-location-card {
  margin-top: 24px;
  padding: 20px;
  border-radius: 24px;
  background: linear-gradient(180deg, #f9fbff 0%, #eef5fb 100%);
  border: 1px solid #dde8f2;
}

.vessel-detail-location-head {
  margin-bottom: 14px;
}

.vessel-detail-location-coords {
  margin: 6px 0 0;
  font-weight: 700;
}

.vessel-satellite-frame {
  position: relative;
  overflow: hidden;
  border-radius: 22px;
  min-height: 560px;
  background: linear-gradient(180deg, #dfe8ef 0%, #f4f7fb 100%);
  cursor: grab;
  touch-action: none;
}

.vessel-satellite-frame.is-dragging {
  cursor: grabbing;
}

.vessel-satellite-map {
  position: absolute;
  inset: 0;
}

.vessel-satellite-map .leaflet-container {
  width: 100%;
  height: 100%;
  background: #dbe6ef;
  font: inherit;
}

.vessel-satellite-map .leaflet-control-attribution {
  background: rgba(255, 255, 255, 0.92);
  color: #3f556a;
  font-size: 11px;
}

.vessel-satellite-map .leaflet-control-attribution a {
  color: inherit;
}

.vessel-satellite-controls {
  position: absolute;
  left: 14px;
  top: 14px;
  display: grid;
  gap: 8px;
  z-index: 1002;
  pointer-events: none;
}

.vessel-satellite-control {
  width: 42px;
  height: 42px;
  font-size: 28px;
  line-height: 1;
  pointer-events: auto;
}

.vessel-satellite-control:disabled {
  opacity: 0.42;
  cursor: default;
}

.vessel-satellite-coords {
  position: absolute;
  right: 14px;
  bottom: 44px;
  z-index: 1002;
  min-width: 196px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(15, 23, 34, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.22);
  color: #ecf2f8;
  backdrop-filter: blur(12px);
  pointer-events: none;
}

.vessel-satellite-coords-label {
  display: block;
  margin-bottom: 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(155, 178, 200, 0.88);
}

.vessel-satellite-coords-values {
  display: grid;
  gap: 4px;
}

.vessel-satellite-coords-value {
  display: block;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.45;
  color: #f3f7fb;
}

.vessel-satellite-credit {
  position: absolute;
  right: 14px;
  bottom: 12px;
  z-index: 1001;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(9, 23, 38, 0.72);
  color: rgba(247, 251, 255, 0.92);
}

.vessel-detail-inline-btn {
  min-height: 40px;
}

.vessel-detail-location-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-top: 14px;
}

.route-map-popup-photo[data-open-industry-radar] {
  cursor: pointer;
}

.route-map-popup-photo[data-open-industry-radar]:hover img {
  transform: scale(1.03);
}

.route-map-popup-photo img {
  transition: transform 220ms ease;
}

.industry-radar-shell {
  display: grid;
  gap: 18px;
  width: min(100%, 1320px);
  justify-self: start;
}

.industry-radar-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.7fr);
  gap: 18px;
}

.industry-radar-profile {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 18px;
  align-items: stretch;
}

.industry-radar-photo {
  min-height: 280px;
  border-radius: 22px;
  overflow: hidden;
  background: linear-gradient(180deg, #f5f9ff 0%, #eaf2fb 100%);
  box-shadow: inset 0 0 0 1px rgba(218, 230, 242, 0.9);
}

.industry-radar-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.industry-radar-copy {
  display: grid;
  gap: 14px;
}

.industry-radar-kicker {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #7a8ea5;
}

.industry-radar-title {
  margin: 0;
  font-size: clamp(30px, 3.1vw, 42px);
  line-height: 1.04;
  color: #17344c;
}

.industry-radar-subtitle,
.industry-radar-summary,
.industry-radar-brief {
  margin: 0;
  color: #627789;
  line-height: 1.7;
}

.industry-radar-chip-row,
.industry-radar-vessel-strip {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.industry-radar-chip {
  display: inline-flex;
  align-items: center;
  min-height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  background: #f5f9ff;
  border: 1px solid #d8e6f2;
  color: #274763;
  font-size: 13px;
  font-weight: 700;
}

.industry-radar-side {
  display: grid;
  gap: 14px;
}

.industry-radar-side-card,
.industry-radar-metric,
.industry-radar-feed-item,
.industry-radar-alert-item {
  border-radius: 22px;
  border: 1px solid #dbe7f2;
  background: linear-gradient(180deg, #fbfdff 0%, #eff5fb 100%);
  box-shadow: 0 14px 30px rgba(27, 55, 84, 0.05);
}

.industry-radar-side-card {
  padding: 18px;
  display: grid;
  gap: 10px;
}

.industry-radar-side-card h3,
.industry-radar-feed-head h3,
.industry-radar-strip-head h3 {
  margin: 0;
  font-size: 20px;
  color: #18374f;
}

.industry-radar-side-grid,
.industry-radar-metrics,
.industry-radar-feed-grid {
  display: grid;
  gap: 14px;
}

.industry-radar-side-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.industry-radar-side-label,
.industry-radar-feed-meta,
.industry-radar-alert-title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #7f92a7;
  text-transform: uppercase;
}

.industry-radar-side-value {
  margin-top: 4px;
  font-size: 18px;
  font-weight: 800;
  color: #17344c;
}

.industry-radar-metrics {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.industry-radar-metric {
  padding: 18px;
}

.industry-radar-metric-value {
  margin: 12px 0 8px;
  font-size: 42px;
  font-weight: 800;
  line-height: 1;
  color: #1a5ec8;
}

.industry-radar-metric-note {
  margin: 0;
  color: #678094;
  line-height: 1.55;
}

.industry-radar-strip-head,
.industry-radar-feed-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.industry-radar-vessel-pager {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) 52px;
  gap: 14px;
  align-items: center;
}

.industry-radar-vessel-window {
  overflow: hidden;
  min-height: 88px;
}

.industry-radar-vessel-page {
  display: grid;
  grid-template-columns: repeat(var(--radar-page-columns, 4), minmax(0, 1fr));
  gap: 10px;
}

.industry-radar-vessel-page.is-next {
  animation: radarVesselPageInNext 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.industry-radar-vessel-page.is-prev {
  animation: radarVesselPageInPrev 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes radarVesselPageInNext {
  0% {
    opacity: 0;
    transform: translateX(28px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes radarVesselPageInPrev {
  0% {
    opacity: 0;
    transform: translateX(-28px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

.industry-radar-vessel-arrow {
  width: 52px;
  height: 52px;
  border-radius: 18px;
  border: 1px solid #d9e6f2;
  background: linear-gradient(180deg, #ffffff 0%, #f3f8fd 100%);
  color: #17344c;
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
}

.industry-radar-vessel-arrow:disabled {
  opacity: 0.42;
  cursor: default;
}

.industry-radar-vessel-btn {
  min-width: 0;
  width: 100%;
  min-height: 78px;
  padding: 12px 14px;
  border-radius: 18px;
  border: 1px solid #d9e6f2;
  background: #ffffff;
  color: #16334b;
  text-align: left;
  cursor: pointer;
}

.industry-radar-vessel-btn.is-active {
  border-color: #3f8cff;
  background: linear-gradient(180deg, rgba(63, 140, 255, 0.14) 0%, rgba(63, 140, 255, 0.05) 100%);
  box-shadow: 0 12px 24px rgba(39, 115, 221, 0.12);
}

.industry-radar-vessel-name,
.industry-radar-vessel-meta {
  display: block;
}

.industry-radar-vessel-name {
  font-weight: 800;
}

.industry-radar-vessel-meta {
  margin-top: 4px;
  color: #6f8397;
  font-size: 13px;
}

.industry-radar-feed-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.industry-radar-feed-item,
.industry-radar-alert-item {
  padding: 18px;
  display: grid;
  gap: 10px;
}

.industry-radar-feed-link {
  display: grid;
  gap: 10px;
  color: inherit;
  text-decoration: none;
}

.industry-radar-feed-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 34px rgba(27, 55, 84, 0.09);
}

.industry-radar-feed-item h4 {
  margin: 0;
  font-size: 18px;
  line-height: 1.45;
  color: #17344c;
}

.industry-radar-feed-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.industry-radar-feed-impact,
.industry-radar-alert-item p {
  margin: 0;
  color: #607688;
  line-height: 1.65;
}

body.theme-dark .vessel-detail-back,
body.theme-dark .vessel-detail-live-btn,
body.theme-dark .vessel-detail-outline-btn,
body.theme-dark .vessel-satellite-control,
body.theme-dark .vessel-detail-inline-btn {
  background: #14202c;
  border-color: #22374b;
  color: #dce8f3;
}

body.theme-dark .vessel-satellite-coords {
  background: rgba(10, 18, 29, 0.95);
  border-color: rgba(255, 255, 255, 0.08);
}

body.theme-dark .industry-radar-chip,
body.theme-dark .industry-radar-vessel-btn,
body.theme-dark .industry-radar-vessel-arrow,
body.theme-dark .industry-radar-side-card,
body.theme-dark .industry-radar-metric,
body.theme-dark .industry-radar-feed-item,
body.theme-dark .industry-radar-alert-item {
  background: linear-gradient(180deg, #13202b 0%, #182634 100%);
  border-color: #22384b;
  color: #dce8f3;
}

body.theme-dark .industry-radar-title,
body.theme-dark .industry-radar-side-card h3,
body.theme-dark .industry-radar-feed-head h3,
body.theme-dark .industry-radar-strip-head h3,
body.theme-dark .industry-radar-feed-item h4,
body.theme-dark .industry-radar-side-value,
body.theme-dark .industry-radar-metric-value {
  color: #edf5fb;
}

body.theme-dark .industry-radar-subtitle,
body.theme-dark .industry-radar-summary,
body.theme-dark .industry-radar-brief,
body.theme-dark .industry-radar-metric-note,
body.theme-dark .industry-radar-feed-impact,
body.theme-dark .industry-radar-alert-item p,
body.theme-dark .industry-radar-vessel-meta {
  color: #97aabc;
}

body.theme-dark .today-editor-modal {
  background: #14202c;
  border-color: #22384b;
}

body.theme-dark .today-editor-head h3,
body.theme-dark .today-editor-close,
body.theme-dark .today-editor-field input,
body.theme-dark .today-editor-field select,
body.theme-dark .today-editor-table-row input {
  color: #e8f0f7;
}

body.theme-dark .today-editor-close,
body.theme-dark .today-editor-field input,
body.theme-dark .today-editor-field select,
body.theme-dark .today-editor-table-row input {
  background: #172533;
  border-color: #264053;
}

body.theme-dark .today-editor-field,
body.theme-dark .today-editor-table-row span {
  color: #9bb0c3;
}

body.theme-dark .vessel-detail-risk-pill.low {
  color: #7ce8a5;
}

body.theme-dark .vessel-detail-risk-pill.medium {
  color: #ffd86e;
}

body.theme-dark .vessel-detail-risk-pill.high {
  color: #ff9d84;
}

@media (max-width: 1360px) {
  .today-shell {
    width: calc(100vw - 12px);
  }

  .today-stage {
    width: auto;
  }
}

@media (max-width: 1180px) {
  .today-row-hero,
  .today-row-four,
  .today-row-three,
  .route-info-grid,
  .route-guide-grid,
  .route-related-grid,
  .route-mini-grid,
  .marine-live-tips {
    grid-template-columns: 1fr;
  }

  .route-world-header,
  .route-world-toolbar,
  .marine-live-header,
  .vessel-detail-topbar,
  .vessel-detail-header,
  .vessel-detail-section-head,
  .vessel-detail-location-head,
  .vessel-detail-location-foot,
  .vessel-detail-actions,
  .industry-radar-feed-head,
  .industry-radar-strip-head {
    flex-direction: column;
    align-items: stretch;
  }

  .route-world-stats {
    min-width: 0;
  }

  .industry-radar-hero,
  .industry-radar-profile,
  .industry-radar-metrics,
  .industry-radar-feed-grid,
  .industry-radar-side-grid {
    grid-template-columns: 1fr;
  }

  .industry-radar-photo {
    min-height: 240px;
  }

  .today-editor-grid,
  .today-editor-table {
    grid-template-columns: 1fr;
  }

  .vessel-detail-route-head,
  .vessel-detail-progress-meta {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .today-shell {
    grid-template-columns: 1fr;
  }

  .today-sidebar {
    position: static;
    height: auto;
  }

  .today-main {
    padding-top: 8px;
  }

  .route-world-toolbar {
    left: 18px;
    right: 18px;
    top: 18px;
  }

  .route-map-shell {
    margin-left: 18px;
    margin-right: 18px;
  }

  .route-map-viewport {
    height: 520px;
    min-height: 520px;
  }

  .route-world-stats {
    grid-template-columns: 1fr;
    margin-left: 18px;
    margin-right: 18px;
  }

  .route-map-coords {
    right: 12px;
    bottom: 12px;
    min-width: 160px;
    padding: 10px 12px;
  }

  .route-map-popup {
    width: min(320px, calc(100% - 20px));
  }

  .route-map-popup-grid,
  .route-map-popup-route {
    grid-template-columns: 1fr;
  }

  .marine-live-header,
  .marine-live-actions {
    padding-left: 18px;
    padding-right: 18px;
  }

  .marine-live-frame-wrap {
    margin-left: 18px;
    margin-right: 18px;
  }

  .marine-live-frame {
    min-height: 620px;
  }

  .vessel-detail-hero .today-card-inner,
  .vessel-detail-voyage-card .today-card-inner {
    padding-left: 18px;
    padding-right: 18px;
  }

  .vessel-detail-photo-frame img {
    height: 280px;
    min-height: 280px;
  }

  .vessel-detail-voyage-map,
  .vessel-satellite-frame {
    min-height: 455px;
  }
}
`;

function icon(name, cls = "today-nav-svg") {
  const map = {
    grid: `<svg class="${cls}" viewBox="0 0 24 24"><rect x="4" y="4" width="6" height="6" rx="1.2"></rect><rect x="14" y="4" width="6" height="6" rx="1.2"></rect><rect x="4" y="14" width="6" height="6" rx="1.2"></rect><rect x="14" y="14" width="6" height="6" rx="1.2"></rect></svg>`,
    chart: `<svg class="${cls}" viewBox="0 0 24 24"><path d="M4 5v14h16"></path><path d="M7 14l3-4 4 2 4-6"></path></svg>`,
    analysis: `<svg class="${cls}" viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="12" rx="1.5"></rect><path d="M6.5 14l3-3.6 2.6 2.1 3.5-4.1 2.1 1.9"></path><path d="M6.5 18.5h11"></path></svg>`,
    radar: `<svg class="${cls}" viewBox="0 0 24 24"><path d="M4 19.5h16"></path><path d="M8.2 19.5a3.8 3.8 0 0 1 7.6 0"></path><path d="M6.2 19.5a5.8 5.8 0 0 1 11.6 0"></path><path d="M12 7.2v8.1"></path><path d="M9.2 12a4 4 0 0 1 5.6 0"></path></svg>`,
    plan: `<svg class="${cls}" viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="16" rx="1.7"></rect><path d="M8.5 8h7"></path><path d="M8.5 11.5h7"></path><path d="M8.5 15h5"></path></svg>`,
    data: `<svg class="${cls}" viewBox="0 0 24 24"><path d="M12 5.2l6.3 11H5.7z"></path><circle cx="12" cy="5.2" r="1"></circle><circle cx="5.7" cy="16.2" r="1"></circle><circle cx="18.3" cy="16.2" r="1"></circle><path d="M12 10.2v3.2"></path><path d="M9.3 13.4h5.4"></path></svg>`,
    monitor: `<svg class="${cls}" viewBox="0 0 24 24"><rect x="3.5" y="5.5" width="17" height="11" rx="1.8"></rect><path d="M7 13l2.6-2.6 2.2 1.8 3.7-3.7"></path><path d="M10 19.5h4"></path><path d="M12 16.5v3"></path></svg>`,
    gear: `<svg class="${cls}" viewBox="0 0 24 24"><path d="M9.5 4.8h5l1.5 1.1 1.9-.2 1.2 1.5-.2 1.9 1.1 1.5-1.1 1.5.2 1.9-1.2 1.5-1.9-.2-1.5 1.1h-5L8 18.2l-1.9.2-1.2-1.5.2-1.9-1.1-1.5 1.1-1.5-.2-1.9 1.2-1.5 1.9.2z"></path><circle cx="12" cy="12" r="2.6"></circle></svg>`,
    alert: `<svg class="${cls}" viewBox="0 0 24 24"><path d="M12 4.5l8 14H4z"></path><path d="M12 9v5"></path><circle cx="12" cy="17" r="0.8" fill="currentColor" stroke="none"></circle></svg>`,
    building: `<svg class="${cls}" viewBox="0 0 24 24"><path d="M5 19.5h14"></path><path d="M7 9.5h10"></path><path d="M8 9.5V6l4-2 4 2v3.5"></path><path d="M9 9.5v10"></path><path d="M12 9.5v10"></path><path d="M15 9.5v10"></path></svg>`,
    stack: `<svg class="${cls}" viewBox="0 0 24 24"><path d="M5 7.5h14"></path><path d="M5 12h14"></path><path d="M5 16.5h14"></path><path d="M7 5.5h10"></path></svg>`,
    bars: `<svg class="${cls}" viewBox="0 0 24 24"><path d="M5 19.5V11"></path><path d="M10 19.5V7"></path><path d="M15 19.5V4.5"></path><path d="M20 19.5v-9"></path><path d="M4 19.5h17"></path></svg>`,
    route: `<svg class="${cls}" viewBox="0 0 24 24"><circle cx="7" cy="6.5" r="1.4"></circle><circle cx="17" cy="17.5" r="1.4"></circle><path d="M8.5 6.5h4.2c2.8 0 4.8 2 4.8 4.8v4.8"></path><path d="M15.8 17.5H11c-2.8 0-4.8-2-4.8-4.8v-2"></path></svg>`,
    cloud: `<svg class="${cls}" viewBox="0 0 24 24"><path d="M7.5 18.5h8.2a3.8 3.8 0 0 0 .2-7.6 5.2 5.2 0 0 0-9.8-1.7A3.6 3.6 0 0 0 7.5 18.5z"></path><path d="M10 19.5l-1.2 2"></path><path d="M14 19.5l1.2 2"></path></svg>`,
    face: `<svg class="${cls}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"></circle><path d="M9 10h.01"></path><path d="M15 10h.01"></path><path d="M9 14.5c.8 1 1.8 1.5 3 1.5s2.2-.5 3-1.5"></path></svg>`,
    wheel: `<svg class="${cls}" viewBox="0 0 24 24"><path d="M7 4.5h4"></path><path d="M13 4.5h4"></path><path d="M4.5 8v8"></path><path d="M19.5 8v8"></path><path d="M8 19.5h8"></path><path d="M8 8h8"></path><path d="M8 8v11.5"></path><path d="M16 8v11.5"></path></svg>`,
    guide: `<svg class="${cls}" viewBox="0 0 24 24"><path d="M4 19.5h16"></path><path d="M6 16.5l4-4 3 2 5-7"></path><path d="M18 7.5h-3"></path><path d="M18 7.5v3"></path></svg>`,
    eye: `<svg class="${cls}" viewBox="0 0 24 24"><path d="M2.8 12s3.2-5.5 9.2-5.5 9.2 5.5 9.2 5.5-3.2 5.5-9.2 5.5S2.8 12 2.8 12z"></path><circle cx="12" cy="12" r="2.6"></circle></svg>`,
    bell: `<svg class="${cls}" viewBox="0 0 24 24"><path d="M7.2 17.5h9.6"></path><path d="M9 17.5v-5a3 3 0 1 1 6 0v5"></path><path d="M7.5 17.5a2.5 2.5 0 0 0 2.5 2h4a2.5 2.5 0 0 0 2.5-2"></path></svg>`,
    calendar: `<svg class="${cls}" viewBox="0 0 24 24"><rect x="4" y="5.5" width="16" height="14" rx="2"></rect><path d="M8 3.5v4"></path><path d="M16 3.5v4"></path><path d="M4 9.5h16"></path></svg>`,
    globe: `<svg class="${cls}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"></circle><path d="M4 12h16"></path><path d="M12 4a12 12 0 0 1 0 16"></path><path d="M12 4a12 12 0 0 0 0 16"></path></svg>`
  };
  return map[name] || map.grid;
}

function navGroup(title, iconName, children, open = false, key = "") {
  return `
    <div class="today-group ${open ? "is-open" : ""}" ${key ? `data-group="${key}"` : ""}>
      <button class="today-group-trigger" type="button" ${key ? `data-group-trigger="${key}"` : ""}>${icon(iconName)}<span>${title}</span></button>
      ${children ? `<div class="today-sub-list">${children}</div>` : ""}
    </div>
  `;
}

function navSub(title, route, active = false) {
  return `<button class="today-sub-item ${active ? "is-active" : ""}" type="button" data-nav-target="${route}">${title}</button>`;
}

function navItem(title, route, iconName) {
  return `<button class="today-nav-item" type="button" data-nav-target="${route}">${icon(iconName)}<span>${title}</span></button>`;
}

function navItemAsset(title, route, assetPath, altText) {
  return `<button class="today-nav-item" type="button" data-nav-target="${route}"><img class="today-nav-asset" src="${assetPath}" alt="${altText}"><span>${title}</span></button>`;
}

function titleIcon(iconName, assetPath = "", altText = "", iconClass = "today-icon-svg", assetClass = "today-icon-asset") {
  if (assetPath) {
    return `<img class="${assetClass}" src="${assetPath}" alt="${altText}">`;
  }
  return icon(iconName, iconClass);
}

function recommendationTitleIcon() {
  return `<svg class="today-section-icon blue" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19.5h16"></path><path d="M6.5 15.5l3.3-5 3.1 2.6 4.6-7.1"></path><path d="M17.5 8.4h-3.1"></path><path d="M17.5 8.4v3.1"></path></svg>`;
}

function recommendationWarningIcon() {
  return `<svg class="today-section-icon red today-alert-icon" viewBox="0 0 24 36" aria-hidden="true"><path d="M12 4L22 21.32H2Z"></path><path d="M12 9.9V15.9"></path><path d="M12 17.9V18.7"></path></svg>`;
}

function todayTrendText(direction, delta) {
  const value = Number(delta) || 0;
  return direction === "down"
    ? tx(`↓ 较昨日下降 ${value}`, `↓ Down ${value} vs yesterday`)
    : tx(`↑ 较昨日上升 ${value}`, `↑ Up ${value} vs yesterday`);
}

function todayRiskMeta(risk) {
  if (risk === "high") {
    return { tone: "high", label: tx("高风险", "High Risk") };
  }
  if (risk === "medium") {
    return { tone: "warn", label: tx("中风险", "Medium Risk") };
  }
  if (risk === "low") {
    return { tone: "low", label: tx("低风险", "Low Risk") };
  }
  return { tone: "safe", label: tx("无风险", "No Risk") };
}

function todayMetricValue(definition) {
  return state.todayOverview.metrics[definition.id] || initialTodayOverviewState.metrics[definition.id];
}

function overviewStateForScope(scope = "today") {
  return scope === "logistics" ? state.logisticsOverview : state.todayOverview;
}

function overviewInitialStateForScope(scope = "today") {
  return scope === "logistics" ? initialLogisticsOverviewState : initialTodayOverviewState;
}

function formatShortDate(date) {
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseShortDate(raw) {
  const match = String(raw || "").trim().match(/^(\d{2,4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return null;
  const year = match[1].length === 2 ? 2000 + Number(match[1]) : Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

function buildChartLabelsFromStartDate(raw, days = defaultTodayChartDays()) {
  const base = parseShortDate(raw) || parseShortDate(defaultTodayChartStart()) || new Date();
  return Array.from({ length: days }, (_, index) => {
    const next = new Date(base);
    next.setDate(base.getDate() + index);
    return formatShortDate(next);
  });
}

function currentTodayChart() {
  const startDate = normalizeStoredChartStartDate(state.todayOverview.chart.startDate, initialTodayOverviewState.chart.startDate);
  const labels = buildChartLabelsFromStartDate(startDate, defaultTodayChartDays());
  const values = normalizeStoredChartValues(state.todayOverview.chart.values, initialTodayOverviewState.chart.values);
  return {
    labels,
    values: values.map((value) => Number(value) || 0)
  };
}

function currentOverviewChart(scope = "today") {
  if (scope === "today") {
    return currentTodayChart();
  }
  const overview = overviewStateForScope(scope);
  const initial = overviewInitialStateForScope(scope);
  const fallbackDays = defaultTodayChartDays();
  const startDate = normalizeStoredChartStartDate(overview.chart.startDate, initial.chart.startDate);
  const labels = buildChartLabelsFromStartDate(startDate, fallbackDays);
  const values = normalizeStoredChartValues(overview.chart.values, initial.chart.values).slice(0, fallbackDays);
  return {
    labels,
    values: values.map((value) => Number(value) || 0)
  };
}

function metricCard({ title, iconName, assetPath = "", assetAlt = "", iconClass = "today-icon-svg", assetClass = "today-icon-asset", number, level, trend, tone, trendTone, editTarget = "" }) {
  return `
    <article class="today-card today-metric ${tone}" ${editTarget ? `data-edit-target="${editTarget}"` : ""}>
      <div class="today-card-inner">
        <div class="today-title">${titleIcon(iconName, assetPath, assetAlt, iconClass, assetClass)}<h2>${title}</h2></div>
        <div class="today-metric-body">
          <p class="today-metric-number">${number}</p>
          <p class="today-metric-level">${level}</p>
          <p class="today-metric-trend ${trendTone}">${trend}</p>
        </div>
      </div>
    </article>
  `;
}

function topControl(action, label, iconName, value = "") {
  return `<button class="today-top-btn" type="button" data-ui-action="${action}">${icon(iconName, "today-top-svg")}<span>${label}</span>${value ? `<span class="today-top-value">${value}</span>` : ""}</button>`;
}

function buildMainChart() {
  const currentChart = currentTodayChart();
  const width = 930;
  const height = 258;
  const margin = { top: 10, right: 8, bottom: 56, left: 36 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const minY = 0;
  const maxY = 100;
  const stepX = innerWidth / (currentChart.values.length - 1);
  const x = (i) => margin.left + stepX * i;
  const y = (v) => margin.top + innerHeight - ((v - minY) / (maxY - minY)) * innerHeight;

  const path = currentChart.values.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`).join(" ");

  const pointColor = (value) => {
    if (value <= 20) return "#14a86a";
    if (value <= 40) return "#66ef98";
    if (value <= 60) return "#ecef1c";
    if (value <= 80) return "#f0943a";
    return "#d91521";
  };

  return `
    <div class="today-chart-frame">
      <svg class="today-chart-svg" viewBox="0 0 ${width} ${height}" aria-label="风险指数变化图表">
        ${chartMain.ticks.map((tick) => `
          <line class="today-grid-line" x1="${margin.left}" x2="${width - margin.right}" y1="${y(tick)}" y2="${y(tick)}"></line>
          <text class="today-grid-label" x="${margin.left - 10}" y="${y(tick) + 4}" text-anchor="end">${tick}</text>
        `).join("")}
        <path class="today-chart-line" d="${path}"></path>
        ${currentChart.values.map((v, i) => `
          <circle class="today-chart-point" cx="${x(i)}" cy="${y(v)}" r="6" fill="${pointColor(v)}"></circle>
        `).join("")}
        ${currentChart.labels.map((label, i) => `
          <text class="today-axis-label" x="${x(i)}" y="${height - 18}" text-anchor="end" transform="rotate(-45 ${x(i)} ${height - 18})">${label}</text>
        `).join("")}
      </svg>
      <div class="today-legend">
        <span>${tx("今日风险指数", "Today's Risk")}</span>
        ${chartMain.legend.map(([label, color]) => `
          <span class="today-legend-item"><span class="today-legend-dot" style="background:${color}"></span><span>${label}</span></span>
        `).join("")}
      </div>
    </div>
  `;
}

function openTodayEditor(dialog) {
  state.editorDialog = dialog;
  renderApp(true);
}

function closeTodayEditor() {
  state.editorDialog = null;
  renderApp(true);
}

function buildTodayEditorModal() {
  if (!state.editorDialog) return "";
  const scope = state.editorDialog.scope || "today";
  const overview = overviewStateForScope(scope);
  const initial = overviewInitialStateForScope(scope);
  const chartDays = defaultTodayChartDays();
  const scoreTitle = scope === "logistics"
    ? tx("编辑物流与航道通行今日风险指数", "Edit logistics risk index")
    : tx("编辑今日风险指数", "Edit Today's Risk Index");
  const chartTitle = scope === "logistics"
    ? tx("编辑物流与航道通行风险指数变化", "Edit logistics risk trend")
    : tx("编辑风险指数变化", "Edit Risk Index Trend");

  if (state.editorDialog.type === "score") {
    const score = overview.score;
    return `
      <div class="today-editor-backdrop" data-editor-close>
        <div class="today-editor-modal" role="dialog" aria-modal="true" aria-label="${scoreTitle}" onclick="event.stopPropagation()">
          <div class="today-editor-head">
            <h3>${scoreTitle}</h3>
            <button class="today-editor-close" type="button" data-editor-close>×</button>
          </div>
          <div class="today-editor-grid">
            <label class="today-editor-field">
              <span>${tx("指数数值", "Index value")}</span>
              <input type="number" min="0" max="1000" step="1" data-editor-score-value value="${score.value}">
            </label>
            <label class="today-editor-field">
              <span>${tx("趋势方向", "Trend direction")}</span>
              <select data-editor-score-direction>
                <option value="up" ${score.direction === "up" ? "selected" : ""}>${tx("上升", "Up")}</option>
                <option value="down" ${score.direction === "down" ? "selected" : ""}>${tx("下降", "Down")}</option>
              </select>
            </label>
            <label class="today-editor-field">
              <span>${tx("变化数值", "Change value")}</span>
              <input type="number" min="0" max="1000" step="1" data-editor-score-delta value="${score.delta}">
            </label>
          </div>
          <div class="today-editor-actions">
            <button class="today-action-btn" type="button" data-editor-close>${tx("取消", "Cancel")}</button>
            <button class="today-action-btn" type="button" data-editor-save="score" data-editor-scope="${scope}">${tx("保存", "Save")}</button>
          </div>
        </div>
      </div>
    `;
  }

  if (state.editorDialog.type === "chart") {
    const labels = buildChartLabelsFromStartDate(overview.chart.startDate || initial.chart.startDate, chartDays);
    const values = currentOverviewChart(scope).values.slice(0, chartDays);
    return `
      <div class="today-editor-backdrop" data-editor-close>
        <div class="today-editor-modal today-editor-modal-wide" role="dialog" aria-modal="true" aria-label="${chartTitle}" onclick="event.stopPropagation()">
          <div class="today-editor-head">
            <h3>${chartTitle}</h3>
            <button class="today-editor-close" type="button" data-editor-close>×</button>
          </div>
          <div class="today-editor-grid">
            <label class="today-editor-field">
              <span>${tx("开始日期（XXXX-XX-XX）", "Start date (YYYY-MM-DD)")}</span>
              <input type="text" data-editor-chart-start data-editor-chart-days="${chartDays}" value="${overview.chart.startDate || initial.chart.startDate}" placeholder="2026-04-13">
            </label>
          </div>
          <div class="today-editor-table">
            ${Array.from({ length: chartDays }, (_, index) => `
              <label class="today-editor-table-row">
                <span data-editor-chart-date="${index}">${labels[index]}</span>
                <input type="number" min="0" max="1000" step="1" data-editor-chart-value="${index}" value="${values[index] ?? ""}">
              </label>
            `).join("")}
          </div>
          <div class="today-editor-actions">
            <button class="today-action-btn" type="button" data-editor-close>${tx("取消", "Cancel")}</button>
            <button class="today-action-btn" type="button" data-editor-save="chart" data-editor-scope="${scope}">${tx("保存", "Save")}</button>
          </div>
        </div>
      </div>
    `;
  }

  if (state.editorDialog.type === "metric") {
    const metricId = state.editorDialog.metricId;
    const definition = todayMetricDefinitions.find((item) => item.id === metricId);
    const metric = state.todayOverview.metrics[metricId];
    if (!definition || !metric) return "";
    return `
      <div class="today-editor-backdrop" data-editor-close>
        <div class="today-editor-modal" role="dialog" aria-modal="true" aria-label="${tx("编辑风险卡片", "Edit risk card")}" onclick="event.stopPropagation()">
          <div class="today-editor-head">
            <h3>${tx(`编辑 ${tx(definition.titleZh, definition.titleEn)}`, `Edit ${tx(definition.titleEn, definition.titleZh)}`)}</h3>
            <button class="today-editor-close" type="button" data-editor-close>×</button>
          </div>
          <div class="today-editor-grid">
            <label class="today-editor-field">
              <span>${tx("数值", "Value")}</span>
              <input type="number" min="0" max="1000" step="1" data-editor-metric-value value="${metric.value}">
            </label>
            <label class="today-editor-field">
              <span>${tx("风险等级", "Risk level")}</span>
              <select data-editor-metric-risk>
                <option value="high" ${metric.risk === "high" ? "selected" : ""}>${tx("高风险", "High Risk")}</option>
                <option value="medium" ${metric.risk === "medium" ? "selected" : ""}>${tx("中风险", "Medium Risk")}</option>
                <option value="low" ${metric.risk === "low" ? "selected" : ""}>${tx("低风险", "Low Risk")}</option>
                <option value="none" ${metric.risk === "none" ? "selected" : ""}>${tx("无风险", "No Risk")}</option>
              </select>
            </label>
            <label class="today-editor-field">
              <span>${tx("趋势方向", "Trend direction")}</span>
              <select data-editor-metric-direction>
                <option value="up" ${metric.direction === "up" ? "selected" : ""}>${tx("上升", "Up")}</option>
                <option value="down" ${metric.direction === "down" ? "selected" : ""}>${tx("下降", "Down")}</option>
              </select>
            </label>
            <label class="today-editor-field">
              <span>${tx("变化数值", "Change value")}</span>
              <input type="number" min="0" max="1000" step="1" data-editor-metric-delta value="${metric.delta}">
            </label>
          </div>
          <div class="today-editor-actions">
            <button class="today-action-btn" type="button" data-editor-close>${tx("取消", "Cancel")}</button>
            <button class="today-action-btn" type="button" data-editor-save="metric" data-editor-metric-id="${metricId}" data-editor-scope="${scope}">${tx("保存", "Save")}</button>
          </div>
        </div>
      </div>
    `;
  }

  return "";
}

function buildLogisticsMainChart() {
  const currentChart = currentTodayChart();
  const width = 1088;
  const height = 210;
  const margin = { top: 10, right: 10, bottom: 56, left: 32 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const minY = 0;
  const maxY = 100;
  const stepX = innerWidth / (currentChart.values.length - 1);
  const x = (i) => margin.left + stepX * i;
  const y = (v) => margin.top + innerHeight - ((v - minY) / (maxY - minY)) * innerHeight;
  const path = currentChart.values.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`).join(" ");

  const pointColor = (value) => {
    if (value <= 20) return "#17aa6a";
    if (value <= 40) return "#69ea95";
    if (value <= 60) return "#eadf21";
    if (value <= 80) return "#ef8e35";
    return "#d81520";
  };

  return `
    <div class="route-main-frame">
      <svg class="route-main-svg" viewBox="0 0 ${width} ${height}" aria-label="物流与航道通行风险指数变化图表">
        ${logisticsMain.ticks.map((tick) => `
          <line class="route-grid-line" x1="${margin.left}" x2="${width - margin.right}" y1="${y(tick)}" y2="${y(tick)}"></line>
          <text class="route-grid-label" x="${margin.left - 8}" y="${y(tick) + 4}" text-anchor="end">${tick}</text>
        `).join("")}
        <path class="route-main-line" d="${path}"></path>
        ${currentChart.values.map((v, i) => `
          <circle class="route-main-point" cx="${x(i)}" cy="${y(v)}" r="5.3" fill="${pointColor(v)}"></circle>
        `).join("")}
        ${currentChart.labels.map((label, i) => `
          <text class="route-axis-label" x="${x(i)}" y="${height - 18}" text-anchor="end" transform="rotate(-45 ${x(i)} ${height - 18})">${label}</text>
        `).join("")}
      </svg>
      <div class="route-legend">
        <span class="route-legend-label">${tx("今日风险指数", "Today's Risk")}</span>
        ${logisticsMain.legend.map(([label, color]) => `
          <span class="route-legend-item"><span class="route-legend-dot" style="background:${color}"></span><span>${label}</span></span>
        `).join("")}
      </div>
    </div>
  `;
}

function buildLogisticsMiniChart({ titleZh, titleEn, color, soft, values, compare, ticks }) {
  const title = tx(titleZh, titleEn);
  const width = 560;
  const height = 176;
  const margin = { top: 8, right: 8, bottom: 28, left: 30 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const minY = Math.min(...ticks);
  const maxY = Math.max(...ticks);
  const stepX = innerWidth / (values.length - 1);
  const x = (i) => margin.left + stepX * i;
  const y = (v) => margin.top + innerHeight - ((v - minY) / (maxY - minY)) * innerHeight;
  const mainPath = values.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`).join(" ");
  const comparePath = compare.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`).join(" ");
  const labels = ["22-3Q", "22-4Q", "23-1Q", "23-2Q", "23-3Q", "23-4Q", "24-1Q", "24-2Q", "24-3Q", "24-4Q", "25-1Q"];

  return `
    <article class="today-card route-mini-card">
      <div class="today-card-inner">
        <h3 class="route-mini-title">${title}</h3>
        <svg class="route-mini-svg" viewBox="0 0 ${width} ${height}" aria-label="${title}">
          ${ticks.map((tick) => `
            <line class="route-mini-grid-line" x1="${margin.left}" x2="${width - margin.right}" y1="${y(tick)}" y2="${y(tick)}"></line>
            <text class="route-mini-grid-label" x="${margin.left - 8}" y="${y(tick) + 4}" text-anchor="end">${tick}</text>
          `).join("")}
          <path class="route-mini-compare" d="${comparePath}" stroke="${soft}"></path>
          <path class="route-mini-main" d="${mainPath}" stroke="${color}"></path>
          ${values.map((v, i) => `<circle class="route-mini-point" cx="${x(i)}" cy="${y(v)}" r="4.2" fill="${color}"></circle>`).join("")}
          ${compare.map((v, i) => `<circle class="route-mini-point" cx="${x(i)}" cy="${y(v)}" r="3" fill="${soft}"></circle>`).join("")}
          ${labels.map((label, i) => `<text class="route-mini-axis-label" x="${x(i)}" y="${height - 10}" text-anchor="middle">${label}</text>`).join("")}
        </svg>
      </div>
    </article>
  `;
}

function riskLevelText(level) {
  if (level === "low") return tx("低风险度", "Low Risk");
  if (level === "medium") return tx("中风险度", "Medium Risk");
  return tx("高风险度", "High Risk");
}

const radarRelativeTimes = [
  { zh: "刚刚", en: "Just now" },
  { zh: "12 分钟前", en: "12 minutes ago" },
  { zh: "28 分钟前", en: "28 minutes ago" },
  { zh: "46 分钟前", en: "46 minutes ago" },
  { zh: "1 小时前", en: "1 hour ago" },
  { zh: "2 小时前", en: "2 hours ago" },
  { zh: "4 小时前", en: "4 hours ago" }
];

const radarShippingSources = [
  { zh: "港航调度台", en: "Port Operations Desk" },
  { zh: "班轮排班监测", en: "Liner Schedule Monitor" },
  { zh: "AIS 拥堵观察", en: "AIS Congestion Watch" },
  { zh: "航运市场快讯", en: "Shipping Market Brief" }
];

const radarWeatherSources = [
  { zh: "海事气象台", en: "Marine Weather Desk" },
  { zh: "沿岸风浪监测", en: "Coastal Wind & Sea Watch" },
  { zh: "海况预报中心", en: "Sea State Forecast Center" },
  { zh: "热带扰动追踪", en: "Tropical Disturbance Tracker" }
];

function radarSeed(vessel, key = "") {
  return stableHash(`${vessel.id}:${key}:${vessel.longitude.toFixed(3)}:${vessel.latitude.toFixed(3)}`);
}

function radarPick(list, vessel, key) {
  return list[radarSeed(vessel, key) % list.length];
}

function radarValue(vessel, key, min, max) {
  return min + (radarSeed(vessel, key) % (max - min + 1));
}

function radarSearchUrl(query, { news = true } = {}) {
  const base = news ? "https://www.bing.com/news/search" : "https://www.bing.com/search";
  return `${base}?q=${encodeURIComponent(query)}`;
}

function radarLiveWeatherHref(vessel) {
  const lat = vessel.latitude.toFixed(3);
  const lng = vessel.longitude.toFixed(3);
  return `https://www.windy.com/?waves,${lat},${lng},6`;
}

function radarLiveWeatherItem(vessel, titleZh, titleEn, impactZh, impactEn, href = radarLiveWeatherHref(vessel)) {
  return {
    titleZh,
    titleEn,
    source: { zh: "Windy", en: "Windy" },
    time: { zh: "实时", en: "Live" },
    impactZh,
    impactEn,
    href
  };
}

function radarRegionRealFeeds(vessel, region) {
  const bundle = {
    "Eastern Mediterranean": {
      shipping: [
        {
          titleZh: "DP World 启动塔尔图斯港 8 亿美元改造计划",
          titleEn: "DP World launches $800 million redevelopment of Tartus Port",
          source: { zh: "Port Technology International", en: "Port Technology International" },
          time: { zh: "2025-11-13", en: "2025-11-13" },
          impactZh: "东地中海港口基础设施升级将影响区域中转与挂靠节奏。",
          impactEn: "Eastern Mediterranean port upgrades may reshape regional transshipment and call patterns.",
          href: "https://www.porttechnology.org/news/dp-world-launches-800-million-redevelopment-of-tartus-port/"
        },
        {
          titleZh: "DP World 土耳其码头迎来万海远东至东地中海新航线",
          titleEn: "DP World welcomes new Wan Hai Lines service in Türkiye",
          source: { zh: "Port Technology International", en: "Port Technology International" },
          time: { zh: "2025-10-30", en: "2025-10-30" },
          impactZh: "该服务强化了远东至东地中海的周班连接能力。",
          impactEn: "The new service strengthens weekly Far East–Eastern Mediterranean connectivity.",
          href: "https://www.porttechnology.org/news/dp-world-welcomes-new-wan-hai-lines-service-in-turkiye/"
        }
      ],
      weather: [
        radarLiveWeatherItem(
          vessel,
          "查看当前船位附近海域实时风浪图",
          "Open live wind and wave view near the vessel",
          "打开后可直接查看当前船位附近的风场、浪高与降水图层。",
          "Open for live wind, wave, and precipitation layers around the vessel."
        )
      ]
    },
    "Arabian Sea lane": {
      shipping: [
        {
          titleZh: "MSC 停止所有发往阿拉伯湾的在途货载",
          titleEn: "MSC terminates all Arabian Gulf shipments",
          source: { zh: "Seatrade Maritime", en: "Seatrade Maritime" },
          time: { zh: "2026-03-04", en: "2026-03-04" },
          impactZh: "中东局势正在直接影响阿拉伯海与海湾港口的箱流组织。",
          impactEn: "Middle East tensions are directly affecting cargo flows across the Arabian Sea and Gulf ports.",
          href: "https://www.seatrade-maritime.com/containers/msc-terminates-all-arabian-gulf-shipments"
        },
        {
          titleZh: "IMO 警告霍尔木兹风险升级并审议对船员的影响",
          titleEn: "IMO warns “time is short” as Hormuz risks escalate",
          source: { zh: "Port Technology International", en: "Port Technology International" },
          time: { zh: "2026-03-18", en: "2026-03-18" },
          impactZh: "阿拉伯海、阿曼湾与海湾方向的安全风险仍在抬升。",
          impactEn: "Security risks remain elevated across the Arabian Sea, Sea of Oman, and Gulf region.",
          href: "https://www.porttechnology.org/imo-warns-time-is-short-as-hormuz-risks-escalate/"
        }
      ],
      weather: [
        {
          titleZh: "印度气象局阿拉伯海海区通报",
          titleEn: "IMD Arabian Sea bulletin archive",
          source: { zh: "India Meteorological Department", en: "India Meteorological Department" },
          time: { zh: "官方海区通报", en: "Official sea-area bulletin" },
          impactZh: "适合查看阿拉伯海海区的风、浪、能见度与海况通报。",
          impactEn: "Useful for Arabian Sea wind, wave, visibility, and sea-state bulletins.",
          href: "https://rsmcnewdelhi.imd.gov.in/archive-information.php?internal_menu=NTk%3D&menu_id=OA%3D%3D"
        }
      ]
    },
    "Mozambique Channel": {
      shipping: [
        {
          titleZh: "MSC 推出亚洲至莫桑比克 Cheetah 航线",
          titleEn: "MSC unveils dedicated Asia-Mozambique Cheetah shipping line",
          source: { zh: "Port Technology International", en: "Port Technology International" },
          time: { zh: "2025-10-21", en: "2025-10-21" },
          impactZh: "这条直连航线提升了莫桑比克方向的挂靠与中转效率。",
          impactEn: "The direct service improves calling and transshipment efficiency into Mozambique.",
          href: "https://www.porttechnology.org/news/msc-unveils-dedicated-asia-mozambique-cheetah-shipping-line/"
        },
        {
          titleZh: "蒙巴萨港 2025 年吞吐量升至 211 万 TEU",
          titleEn: "Port of Mombasa hits 2.1 million TEUs in 2025",
          source: { zh: "Port Technology International", en: "Port Technology International" },
          time: { zh: "2026-02-04", en: "2026-02-04" },
          impactZh: "东非港口吞吐上升会影响莫桑比克海峡周边支线和补给走廊。",
          impactEn: "Rising East Africa throughput can influence feeder schedules and bunker corridors around the channel.",
          href: "https://www.porttechnology.org/news/port-of-mombasa-hits-2-1-million-teus-in-2025/"
        }
      ],
      weather: [
        radarLiveWeatherItem(
          vessel,
          "查看莫桑比克海峡当前风浪与降水图层",
          "Open live wind, wave, and rain view for the Mozambique Channel",
          "打开后可直接查看当前船位附近的海况图层变化。",
          "Open for live sea-state layers around the current vessel position."
        )
      ]
    },
    "Southeast Asia to West Pacific": {
      shipping: [
        {
          titleZh: "ONE 调整 TID1 航线并新增新加坡与胡志明港挂靠",
          titleEn: "ONE revamps TID1 service to add Singapore, Ho Chi Minh",
          source: { zh: "Port Technology International", en: "Port Technology International" },
          time: { zh: "2026-03-26", en: "2026-03-26" },
          impactZh: "东南亚区域内支线与转运联动正在增强。",
          impactEn: "Intra-Southeast Asia feeder and transshipment connectivity is strengthening.",
          href: "https://www.porttechnology.org/one-revamps-tid1-service-adds-singapore-and-ho-chi-minh/"
        },
        {
          titleZh: "OCEAN Alliance 将更多高频运力投向东南亚航线",
          titleEn: "OCEAN Alliance targets high-frequency corridors to SE Asia",
          source: { zh: "Port Technology International", en: "Port Technology International" },
          time: { zh: "2026-02-23", en: "2026-02-23" },
          impactZh: "该调整会影响东南亚周边的舱位密度与港口连接结构。",
          impactEn: "The shift affects capacity density and port connectivity across Southeast Asia.",
          href: "https://www.porttechnology.org/ocean-alliance-targets-high-frequency-corridors-to-se-asia/"
        }
      ],
      weather: [
        radarLiveWeatherItem(
          vessel,
          "查看当前船位附近西太平洋实时风浪图",
          "Open live wind and wave view near the West Pacific vessel position",
          "打开后可查看当前船位附近的浪高、风场和降水变化。",
          "Open for live waves, wind, and precipitation near the vessel."
        )
      ]
    },
    "Northwest Pacific": {
      shipping: [
        {
          titleZh: "Swire Shipping 升级 North Asia Express 周班航线",
          titleEn: "Swire Shipping launches weekly North Asia express route",
          source: { zh: "Port Technology International", en: "Port Technology International" },
          time: { zh: "2025-08-18", en: "2025-08-18" },
          impactZh: "东北亚与太平洋区域连接性提升会带来新的转运节奏。",
          impactEn: "Improved Northeast Asia-Pacific connectivity may reshape regional transshipment cadence.",
          href: "https://www.porttechnology.org/news/swire-shipping-launches-weekly-north-asia-express-route/"
        },
        {
          titleZh: "西北海港联盟 2026 年 1 月箱量下降 13.9%",
          titleEn: "NWSA container volumes down 13.9 per cent in January 2026",
          source: { zh: "Port Technology International", en: "Port Technology International" },
          time: { zh: "2026-02-20", en: "2026-02-20" },
          impactZh: "跨太平洋运力与港口重置正在影响西北太平洋方向节奏。",
          impactEn: "Carrier resets across the Transpacific are affecting the Northwest Pacific rhythm.",
          href: "https://www.porttechnology.org/nwsa-volumes-fall-as-carriers-reset-transpacific/"
        }
      ],
      weather: [
        {
          titleZh: "NOAA 太平洋海洋天气图与风浪预报",
          titleEn: "Ocean Prediction Center - Pacific Marine",
          source: { zh: "NOAA Ocean Prediction Center", en: "NOAA Ocean Prediction Center" },
          time: { zh: "官方图形预报", en: "Official graphical forecast" },
          impactZh: "适合查看西北太平洋的大尺度海面分析和风浪预报。",
          impactEn: "Useful for large-scale Pacific surface analysis and wind-wave forecasts.",
          href: "https://ocean.weather.gov/Pac_tab.php"
        }
      ]
    },
    "Central North Atlantic": {
      shipping: [
        {
          titleZh: "PhilaPort 2025 年创下集装箱吞吐量新高",
          titleEn: "PhilaPort posts record container volumes in 2025",
          source: { zh: "Port Technology International", en: "Port Technology International" },
          time: { zh: "2026-01-15", en: "2026-01-15" },
          impactZh: "北大西洋港口增长会反馈到欧美干线和中转节点节奏。",
          impactEn: "North Atlantic port growth feeds back into Europe-Americas trunk lane timing.",
          href: "https://www.porttechnology.org/news/philaport-posts-record-container-volumes-in-2025/"
        },
        {
          titleZh: "达飞调整欧洲至美国跨大西洋服务网络",
          titleEn: "CMA CGM revamps Transatlantic services from Europe to US",
          source: { zh: "Port Technology International", en: "Port Technology International" },
          time: { zh: "2026-02-13", en: "2026-02-13" },
          impactZh: "跨大西洋航线频率与港序调整会直接影响北大西洋中段船流。",
          impactEn: "Transatlantic frequency and rotation changes directly affect central North Atlantic flows.",
          href: "https://www.porttechnology.org/news/cma-cgm-revamps-transatlantic-services-from-europe-to-us/"
        }
      ],
      weather: [
        {
          titleZh: "NOAA 大西洋海洋天气图与风浪预报",
          titleEn: "Ocean Prediction Center - Atlantic Marine",
          source: { zh: "NOAA Ocean Prediction Center", en: "NOAA Ocean Prediction Center" },
          time: { zh: "官方图形预报", en: "Official graphical forecast" },
          impactZh: "适合查看北大西洋海面分析、风浪场与高海况预报。",
          impactEn: "Useful for North Atlantic surface analysis, wind-wave fields, and high-seas forecasts.",
          href: "https://ocean.weather.gov/Atl_tab.php"
        }
      ]
    },
    "South Atlantic passage": {
      shipping: [
        {
          titleZh: "DP World 与赫伯罗特续签桑托斯港长期操作合同",
          titleEn: "DP World, Hapag-Lloyd renew operations contract at Santos",
          source: { zh: "Port Technology International", en: "Port Technology International" },
          time: { zh: "2025-10-02", en: "2025-10-02" },
          impactZh: "巴西港口长期操作安排会影响南大西洋东岸挂靠稳定性。",
          impactEn: "Long-term terminal arrangements in Brazil can affect call stability on the South Atlantic side.",
          href: "https://www.porttechnology.org/news/dp-world-hapag-lloyd-renew-operations-contract-at-santos/"
        },
        {
          titleZh: "瓦伦西亚港与桑托斯港签署绿色航运走廊合作备忘录",
          titleEn: "Valenciaport, Port of Santos ink MoU for green corridor",
          source: { zh: "Port Technology International", en: "Port Technology International" },
          time: { zh: "2026-01-28", en: "2026-01-28" },
          impactZh: "这项合作将强化欧洲与南美之间的绿色航运连接。",
          impactEn: "The agreement strengthens green-shipping links between Europe and South America.",
          href: "https://www.porttechnology.org/valenciaport-port-of-santos-ink-mou-for-green-corridor/"
        }
      ],
      weather: [
        {
          titleZh: "NOAA 大西洋海洋天气图与风浪预报",
          titleEn: "Ocean Prediction Center - Atlantic Marine",
          source: { zh: "NOAA Ocean Prediction Center", en: "NOAA Ocean Prediction Center" },
          time: { zh: "官方图形预报", en: "Official graphical forecast" },
          impactZh: "适合查看南北大西洋主航路上的海面分析与风浪预报。",
          impactEn: "Useful for Atlantic surface analysis and wave forecasts along the main route.",
          href: "https://ocean.weather.gov/Atl_tab.php"
        }
      ]
    },
    "Central Indian Ocean": {
      shipping: [
        {
          titleZh: "汉班托塔国际港扩建堆场以应对全球航运量激增",
          titleEn: "HIP expands yards to handle surging volumes",
          source: { zh: "Port Technology International", en: "Port Technology International" },
          time: { zh: "2026-04-07", en: "2026-04-07" },
          impactZh: "印度洋替代航路流量上升，港口侧正在快速扩容。",
          impactEn: "Indian Ocean diversion traffic is rising, and ports are expanding rapidly to absorb it.",
          href: "https://www.porttechnology.org/hip-expands-yards-to-handle-surge-in-global-shipping-volumes/"
        },
        {
          titleZh: "ONE 开通科伦坡至马累支线服务",
          titleEn: "ONE launches Colombo–Malé feeder service",
          source: { zh: "Port Technology International", en: "Port Technology International" },
          time: { zh: "2025-10-27", en: "2025-10-27" },
          impactZh: "中印度洋补给与转运节点的支线连接正在增强。",
          impactEn: "Feeder connectivity is strengthening around central Indian Ocean relay and supply nodes.",
          href: "https://www.porttechnology.org/news/one-launches-colombo-male-feeder-service/"
        }
      ],
      weather: [
        radarLiveWeatherItem(
          vessel,
          "查看当前船位附近印度洋实时风浪图",
          "Open live wind and wave view near the Indian Ocean vessel position",
          "打开后可直接查看当前船位附近的海况图层。",
          "Open for live sea-state layers around the vessel."
        )
      ]
    },
    "open-ocean trunk route": {
      shipping: [
        {
          titleZh: "HMM 更新 2026 年东西向航线网络",
          titleEn: "HMM updates East-West service network for 2026",
          source: { zh: "Port Technology International", en: "Port Technology International" },
          time: { zh: "2025-12-17", en: "2025-12-17" },
          impactZh: "东西向主干航线调整会直接影响远洋船队的绕航与挂靠配置。",
          impactEn: "East-West network revisions directly influence long-haul diversions and rotations.",
          href: "https://www.porttechnology.org/news/hmm-updates-east-west-service-network-for-2026/"
        },
        {
          titleZh: "ONE 更新 2026 年东西向网络方案",
          titleEn: "ONE updates East–West network for 2026 launch",
          source: { zh: "Port Technology International", en: "Port Technology International" },
          time: { zh: "2025-12-15", en: "2025-12-15" },
          impactZh: "全球主干网络更新会反馈到开放海域上的运力分配与港序设计。",
          impactEn: "Global trunk-network updates feed back into capacity allocation and rotation design at sea.",
          href: "https://www.porttechnology.org/one-updates-east-west-network-for-2026-launch/"
        }
      ],
      weather: [
        radarLiveWeatherItem(
          vessel,
          "查看当前船位附近实时风浪图",
          "Open live wind and wave view near the vessel",
          "打开后可查看当前船位附近的风场、浪高和降水变化。",
          "Open for live wind, wave, and precipitation layers near the vessel."
        )
      ]
    }
  };

  return bundle[region.zoneEn] || bundle["open-ocean trunk route"];
}

function radarFeedLink(vessel, kind, region, itemIndex) {
  const vesselName = vessel.nameEn || vessel.nameZh || vessel.name;
  if (kind === "shipping") {
    const shippingQueries = [
      `${region.portEn} shipping news port congestion ${vesselName}`,
      `${region.zoneEn} marine traffic port operations ${vessel.destination}`,
      `${region.laneEn} shipping market vessel traffic ${vesselName}`
    ];
    return radarSearchUrl(shippingQueries[itemIndex] || shippingQueries[0], { news: true });
  }

  const weatherQueries = [
    `${region.zoneEn} marine weather sea state forecast ${vesselName}`,
    `${region.portEn} coastal weather visibility wind wave forecast`,
    `${region.zoneEn} ocean current weather shipping advisory`
  ];
  return radarSearchUrl(weatherQueries[itemIndex] || weatherQueries[0], { news: true });
}

function vesselRadarRegion(vessel) {
  const { longitude, latitude } = vessel;
  if (longitude >= -6 && longitude <= 36 && latitude >= 30 && latitude <= 46) {
    return {
      zoneZh: "地中海东段",
      zoneEn: "Eastern Mediterranean",
      portZh: "近岸港群",
      portEn: "regional port cluster",
      laneZh: "欧亚短程航线",
      laneEn: "Europe-Asia short-haul lane"
    };
  }
  if (longitude >= 40 && longitude <= 80 && latitude >= 8 && latitude <= 24) {
    return {
      zoneZh: "阿拉伯海航段",
      zoneEn: "Arabian Sea lane",
      portZh: "阿曼湾口门",
      portEn: "Gulf of Oman gateway",
      laneZh: "中东-印度主干线",
      laneEn: "Middle East-India trunk lane"
    };
  }
  if (longitude >= 20 && longitude <= 52 && latitude >= -24 && latitude <= 5) {
    return {
      zoneZh: "莫桑比克海峡",
      zoneEn: "Mozambique Channel",
      portZh: "东非补给走廊",
      portEn: "East Africa bunker corridor",
      laneZh: "南半球绕航通道",
      laneEn: "Southern diversion corridor"
    };
  }
  if (longitude >= 95 && longitude <= 145 && latitude >= -18 && latitude <= 18) {
    return {
      zoneZh: "东南亚至西太平洋",
      zoneEn: "Southeast Asia to West Pacific",
      portZh: "近岸转运港群",
      portEn: "regional transshipment ports",
      laneZh: "亚太干线",
      laneEn: "Asia-Pacific trunk lane"
    };
  }
  if (longitude >= 115 && latitude >= 20) {
    return {
      zoneZh: "西北太平洋",
      zoneEn: "Northwest Pacific",
      portZh: "东北亚港群",
      portEn: "Northeast Asia port cluster",
      laneZh: "跨太平洋东向航线",
      laneEn: "eastbound trans-Pacific lane"
    };
  }
  if (longitude <= -15 && latitude >= 18) {
    return {
      zoneZh: "北大西洋中段",
      zoneEn: "Central North Atlantic",
      portZh: "北大西洋中转节点",
      portEn: "North Atlantic relay ports",
      laneZh: "欧美主干航线",
      laneEn: "Europe-Americas main lane"
    };
  }
  if (longitude <= -10 && latitude < 18) {
    return {
      zoneZh: "南大西洋航段",
      zoneEn: "South Atlantic passage",
      portZh: "南美东岸港群",
      portEn: "East South America ports",
      laneZh: "南大西洋跨区航线",
      laneEn: "South Atlantic cross-basin lane"
    };
  }
  if (longitude >= 60 && longitude <= 100 && latitude >= -25 && latitude < 10) {
    return {
      zoneZh: "中印度洋",
      zoneEn: "Central Indian Ocean",
      portZh: "远洋补给节点",
      portEn: "deep-sea supply nodes",
      laneZh: "印度洋长航段",
      laneEn: "long-haul Indian Ocean route"
    };
  }
  return {
    zoneZh: "远洋主干航线",
    zoneEn: "open-ocean trunk route",
    portZh: "沿线港口带",
    portEn: "coastal port belt",
    laneZh: "跨区域航运通道",
    laneEn: "cross-regional shipping corridor"
  };
}

function vesselRadarWeather(vessel) {
  const wind = radarValue(vessel, "wind", 4, 8);
  const wave = (radarValue(vessel, "wave", 12, 36) / 10).toFixed(1);
  const vis = radarValue(vessel, "vis", 4, 16);
  const current = radarValue(vessel, "current", 8, 21) / 10;
  return {
    windZh: `${wind} 级`,
    windEn: `Force ${wind}`,
    waveZh: `${wave} m`,
    waveEn: `${wave} m`,
    visZh: `${vis} km`,
    visEn: `${vis} km`,
    currentZh: `${current.toFixed(1)} kn`,
    currentEn: `${current.toFixed(1)} kn`
  };
}

function buildRadarFeedItems(vessel, kind, region, weather) {
  const timePool = Array.from({ length: 3 }, (_, index) => radarPick(radarRelativeTimes, vessel, `${kind}:time:${index}`));
  if (kind === "shipping") {
    return [
      {
        titleZh: `${region.portZh}靠泊窗口进入滚动重排，${tx(vessel.typeZh, vessel.typeEn)}周边船队改用动态排队`,
        titleEn: `${region.portEn} berth windows shift into rolling resequencing, with nearby ${tx(vessel.typeEn, vessel.typeZh)} traffic moving to dynamic queuing`,
        source: radarPick(radarShippingSources, vessel, "shipping:source:0"),
        time: timePool[0],
        impactZh: `关注 ${region.laneZh} 在未来 6-12 小时的靠泊节奏变化。`,
        impactEn: `Track berth-cycle changes on the ${region.laneEn} over the next 6-12 hours.`,
        href: radarFeedLink(vessel, "shipping", region, 0)
      },
      {
        titleZh: `${region.zoneZh}燃油补给与拖轮资源维持紧平衡，支线衔接时刻正在微调`,
        titleEn: `Bunker and tug resources remain tight across the ${region.zoneEn}, with feeder connection slots being fine-tuned`,
        source: radarPick(radarShippingSources, vessel, "shipping:source:1"),
        time: timePool[1],
        impactZh: `若目的港窗口继续压缩，当前 ETA 可能再产生 1-3 小时摆动。`,
        impactEn: `If destination windows tighten further, the current ETA may swing by another 1-3 hours.`,
        href: radarFeedLink(vessel, "shipping", region, 1)
      },
      {
        titleZh: `${region.zoneZh}AIS 密度处于 ${riskLevelText(vessel.risk)} 区间，调度建议维持当前航速并预留转向空间`,
        titleEn: `AIS density remains in the ${riskLevelText(vessel.risk)} band across the ${region.zoneEn}, and dispatch suggests holding present speed with extra maneuver margin`,
        source: radarPick(radarShippingSources, vessel, "shipping:source:2"),
        time: timePool[2],
        impactZh: `当前船位附近的会船频率有所抬升，建议继续盯防临近交汇点。`,
        impactEn: `Meeting frequency is rising around the vessel's current position; nearby merge points should remain under watch.`,
        href: radarFeedLink(vessel, "shipping", region, 2)
      }
    ];
  }

  return [
    {
      titleZh: `${region.zoneZh}海面风力维持 ${weather.windZh}，浪高约 ${weather.waveZh}，作业效率受轻度扰动`,
      titleEn: `Surface winds hold near ${weather.windEn} with waves around ${weather.waveEn} across the ${region.zoneEn}, causing mild operational disturbance`,
      source: radarPick(radarWeatherSources, vessel, "weather:source:0"),
      time: timePool[0],
      impactZh: `建议结合甲板作业窗口调整值班节奏，并复核甲板系固。`,
      impactEn: `Adjust deck-work windows and recheck lashings against the expected sea state.`,
      href: radarFeedLink(vessel, "weather", region, 0)
    },
    {
      titleZh: `${region.portZh}沿岸能见度约 ${weather.visZh}，局地对流回波增强，靠港编队需关注引航窗口`,
      titleEn: `Visibility near ${region.portEn} is around ${weather.visEn}; local convective echoes are strengthening and pilot windows need monitoring`,
      source: radarPick(radarWeatherSources, vessel, "weather:source:1"),
      time: timePool[1],
      impactZh: `若对流单体继续发展，近岸等待时间可能拉长。`,
      impactEn: `If convective cells intensify further, nearshore waiting time may extend.`,
      href: radarFeedLink(vessel, "weather", region, 1)
    },
    {
      titleZh: `${region.zoneZh}流速约 ${weather.currentZh}，横流影响加大，建议进出航向修正保持提前量`,
      titleEn: `Currents near ${weather.currentEn} in the ${region.zoneEn} are increasing cross-set impact; heading corrections should keep earlier margins`,
      source: radarPick(radarWeatherSources, vessel, "weather:source:2"),
      time: timePool[2],
      impactZh: `后续 8 小时仍需结合实时海况修正航迹。`,
      impactEn: `Track corrections should continue to reflect live sea-state changes over the next 8 hours.`,
      href: radarFeedLink(vessel, "weather", region, 2)
    }
  ];
}

function industryRadarData(vessel) {
  const region = vesselRadarRegion(vessel);
  const weather = vesselRadarWeather(vessel);
  const realFeeds = radarRegionRealFeeds(vessel, region);
  return {
    region,
    weather,
    summaryZh: `围绕 ${region.zoneZh} 与 ${region.portZh} 的港航动态、海况与调度变化已经汇总到当前船位视角，便于快速判断这艘船未来一段航程的局部风险。`,
    summaryEn: `Port operations, weather, and dispatch changes around the ${region.zoneEn} and ${region.portEn} have been assembled around the vessel's current position for quick local-risk assessment.`,
    metrics: [
      {
        labelZh: "航运资讯热度",
        labelEn: "Shipping Heat",
        value: radarValue(vessel, "metric:shipping", 58, 91),
        noteZh: `${region.laneZh}保持动态调度`,
        noteEn: `${region.laneEn} remains in dynamic dispatch`
      },
      {
        labelZh: "气象扰动指数",
        labelEn: "Weather Disturbance",
        value: radarValue(vessel, "metric:weather", 46, 88),
        noteZh: `风力 ${weather.windZh} / 浪高 ${weather.waveZh}`,
        noteEn: `${weather.windEn} / waves ${weather.waveEn}`
      },
      {
        labelZh: "港口作业压力",
        labelEn: "Port Pressure",
        value: radarValue(vessel, "metric:port", 39, 84),
        noteZh: `${region.portZh}等待链路波动`,
        noteEn: `${region.portEn} queue chain is fluctuating`
      }
    ],
    shipping: realFeeds?.shipping?.length ? realFeeds.shipping : buildRadarFeedItems(vessel, "shipping", region, weather),
    weatherFeed: realFeeds?.weather?.length ? realFeeds.weather : buildRadarFeedItems(vessel, "weather", region, weather),
    alerts: [
      {
        titleZh: "值班建议",
        titleEn: "Watchkeeping note",
        bodyZh: `将 ${region.zoneZh} 作为未来 6 小时重点关注海域，持续跟进 AIS 密度、引航窗口与拖轮资源变化。`,
        bodyEn: `Treat the ${region.zoneEn} as the primary watch sector over the next 6 hours and keep tracking AIS density, pilot windows, and tug availability.`
      },
      {
        titleZh: "靠港建议",
        titleEn: "Port-call note",
        bodyZh: `当前建议保留 ETA 弹性，并提前与 ${region.portZh} 相关代理沟通排队和补给窗口。`,
        bodyEn: `Keep ETA flexible and coordinate queueing and supply windows early with agents around the ${region.portEn}.`
      }
    ]
  };
}

function ensureRadarVessel() {
  if (state.radarVesselId && vesselById(state.radarVesselId)) {
    return vesselById(state.radarVesselId);
  }
  state.radarVesselId = state.selectedVesselId && vesselById(state.selectedVesselId)
    ? state.selectedVesselId
    : (riskFleet[0]?.id || null);
  return state.radarVesselId ? vesselById(state.radarVesselId) : null;
}

function industryRadarPageSize() {
  const width = window.innerWidth || 1440;
  if (width <= 900) return 1;
  if (width <= 1180) return 2;
  if (width <= 1460) return 3;
  return 4;
}

function industryRadarPagination(activeVesselId = state.radarVesselId) {
  const pageSize = industryRadarPageSize();
  const totalPages = Math.max(1, Math.ceil(riskFleet.length / pageSize));
  const activeIndex = Math.max(0, riskFleet.findIndex((vessel) => vessel.id === activeVesselId));
  const pageFromVessel = Math.floor(activeIndex / pageSize);
  const currentPage = Math.max(0, Math.min(totalPages - 1, state.radarVesselPage ?? pageFromVessel));
  return {
    pageSize,
    totalPages,
    activeIndex,
    currentPage,
    pageFromVessel,
    start: currentPage * pageSize,
    end: Math.min(riskFleet.length, (currentPage + 1) * pageSize)
  };
}

function syncRadarPageForVessel(vesselId) {
  const pageSize = industryRadarPageSize();
  const index = Math.max(0, riskFleet.findIndex((vessel) => vessel.id === vesselId));
  state.radarVesselPage = Math.floor(index / pageSize);
}

function openIndustryRadar(vesselId, returnView = state.activeView) {
  const vessel = vesselById(vesselId);
  if (!vessel) return;
  state.selectedVesselId = vessel.id;
  state.radarVesselId = vessel.id;
  syncRadarPageForVessel(vessel.id);
  state.radarReturnView = isVesselDetailRoute(returnView) ? "全球航运风险态势图" : returnView;
  setNavActive("行业事件雷达");
}

function returnFromIndustryRadar() {
  setNavActive(state.radarReturnView || "全球航运风险态势图");
}

function vesselDisplayName(vessel) {
  return tx(vessel.nameZh || vessel.nameEn || vessel.name, vessel.nameEn || vessel.nameZh || vessel.name);
}

function vesselSizeClass(size) {
  if (size === "lg") return "size-lg";
  if (size === "sm") return "size-sm";
  return "size-md";
}

function vesselById(vesselId) {
  return riskFleet.find((vessel) => vessel.id === vesselId) || null;
}

function vesselDetailRoute(vesselId) {
  return `${vesselDetailRoutePrefix}${vesselId}`;
}

function isVesselDetailRoute(view) {
  return typeof view === "string" && view.startsWith(vesselDetailRoutePrefix);
}

function vesselFromDetailRoute(view) {
  if (!isVesselDetailRoute(view)) return null;
  return vesselById(view.slice(vesselDetailRoutePrefix.length));
}

function clampVesselSatelliteZoom(level) {
  return Math.max(0, Math.min(vesselSatelliteZoomSpans.length - 1, level));
}

function vesselSatelliteZoomLevel(vesselId) {
  return clampVesselSatelliteZoom(state.vesselSatelliteZoom[vesselId] ?? vesselSatelliteDefaultZoomLevel);
}

function vesselSatelliteScale(vesselId) {
  return vesselSatelliteZoomScales[vesselSatelliteZoomLevel(vesselId)] ?? 1;
}

function vesselSatellitePanState(vesselId) {
  if (!state.vesselSatellitePan[vesselId]) {
    state.vesselSatellitePan[vesselId] = { x: 0, y: 0 };
  }
  return state.vesselSatellitePan[vesselId];
}

function clampVesselSatellitePan(frame, scale, panX, panY) {
  const width = frame?.clientWidth || 0;
  const height = frame?.clientHeight || 0;
  const maxX = Math.max(0, ((width * scale) - width) / 2);
  const maxY = Math.max(0, ((height * scale) - height) / 2);
  return {
    x: Math.max(-maxX, Math.min(maxX, panX)),
    y: Math.max(-maxY, Math.min(maxY, panY))
  };
}

function setVesselSatelliteZoom(vesselId, nextLevel) {
  const level = clampVesselSatelliteZoom(nextLevel);
  const prevScale = vesselSatelliteScale(vesselId);
  state.vesselSatelliteZoom[vesselId] = level;
  const nextScale = vesselSatelliteScale(vesselId);
  const panState = vesselSatellitePanState(vesselId);
  const ratio = prevScale ? (nextScale / prevScale) : 1;
  panState.x *= ratio;
  panState.y *= ratio;
}

function vesselMapPoint(vessel) {
  return percentFromWorldCoords(vessel.longitude, vessel.latitude);
}

function vesselCoordinateSummary(vessel) {
  return `${vessel.latitude.toFixed(6)}°, ${vessel.longitude.toFixed(6)}°`;
}

function vesselSatelliteLeafletZoom(vesselId) {
  return vesselSatelliteLeafletZoomLevels[vesselSatelliteZoomLevel(vesselId)] ?? 18;
}

function vesselSatelliteZoomLabel(vesselId) {
  const level = vesselSatelliteZoomLevel(vesselId) + 1;
  return tx(`卫星级别 ${level}`, `Satellite Level ${level}`);
}

function vesselSatelliteStatusText(vesselId) {
  const isMaxLevel = vesselSatelliteZoomLevel(vesselId) >= vesselSatelliteZoomSpans.length - 1;
  if (isMaxLevel) {
    return tx("此级别下不显示更高细节", "No higher detail is available at this level");
  }
  return tx("当前预览：星图影像", "Previewing: GeoVis Imagery");
}

function openVesselDetail(vesselId, returnView = state.activeView) {
  const vessel = vesselById(vesselId);
  if (!vessel) return;
  state.selectedVesselId = vessel.id;
  state.detailReturnView = isVesselDetailRoute(returnView) ? "全球航运风险态势图" : returnView;
  setNavActive(vesselDetailRoute(vessel.id));
}

function returnFromVesselDetail() {
  setNavActive(state.detailReturnView || "全球航运风险态势图");
}

function destroyVesselSatelliteMaps() {
  vesselSatelliteMaps.forEach((entry) => {
    entry.map.remove();
  });
  vesselSatelliteMaps.clear();
}

function attachGeoVisTileLayer(L, entry, vesselId) {
  if (entry.tileLayer) {
    entry.map.removeLayer(entry.tileLayer);
  }

  const tileLayer = L.tileLayer(geoVisImagerySource.url, {
    minZoom: vesselSatelliteLeafletMinZoom,
    maxNativeZoom: vesselSatelliteLeafletMaxZoom,
    maxZoom: vesselSatelliteLeafletMaxZoom,
    attribution: "Tiles &copy; GeoVisEarth"
  });

  let recovered = false;
  tileLayer.on("tileerror", () => {
    if (recovered) return;
    recovered = true;
    document.querySelectorAll(`[data-vessel-satellite-zoom-label][data-vessel-id="${vesselId}"]`).forEach((node) => {
      node.textContent = tx("星图瓦片加载失败，当前网络无法访问图源", "GeoVis tile source failed to load on the current network.");
    });
  });

  tileLayer.on("load", () => {
    document.querySelectorAll(`[data-vessel-satellite-zoom-label][data-vessel-id="${vesselId}"]`).forEach((node) => {
      node.textContent = `${vesselSatelliteZoomLabel(vesselId)} · ${vesselSatelliteStatusText(vesselId)}`;
    });
  });

  tileLayer.addTo(entry.map);
  entry.tileLayer = tileLayer;
}

function ensureVesselSatelliteMarker(L, entry, vessel) {
  const markerLatLng = [vessel.latitude, vessel.longitude];
  if (!entry.marker) {
    const icon = L.divIcon({
      className: "vessel-satellite-div-icon",
      html: `<span class="vessel-satellite-marker"><span class="vessel-satellite-pin"></span></span>`,
      iconSize: [30, 30],
      iconAnchor: [15, 30]
    });
    entry.marker = L.marker(markerLatLng, {
      icon,
      keyboard: false,
      zIndexOffset: 1000
    }).addTo(entry.map);
    return;
  }

  entry.marker.setLatLng(markerLatLng);
}

function buildTrafficGhosts() {
  return routeTrafficClusters.flatMap((cluster, clusterIndex) => {
    return Array.from({ length: cluster.count }, (_, index) => {
      const angle = (((index * 137) + clusterIndex * 41) % 360) * (Math.PI / 180);
      const radius = 0.24 + (((index * 17) + clusterIndex * 9) % 58) / 100;
      const x = cluster.x + Math.cos(angle) * cluster.spreadX * radius;
      const y = cluster.y + Math.sin(angle) * cluster.spreadY * radius;
      if (x < 2 || x > 98 || y < 4 || y > 96) return "";
      const risk = cluster.risks[(index + clusterIndex) % cluster.risks.length];
      const size = (3.6 + ((index * 7) % 9) / 2).toFixed(2);
      const heading = (cluster.heading + index * 18) % 360;
      const ghostColor = risk === "high" ? "#ff7048" : risk === "medium" ? "#ffd84e" : "#66e79b";
      return `<span class="route-map-ghost" style="--x:${x.toFixed(2)};--y:${y.toFixed(2)};--size:${size};--heading:${heading};--ghost-color:${ghostColor};"></span>`;
    }).filter(Boolean);
  }).join("");
}

function buildRiskMapBackdrop() {
  return `
    <svg viewBox="0 0 1000 560" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <radialGradient id="routeOceanGlow" cx="50%" cy="45%" r="80%">
          <stop offset="0%" stop-color="#131f2d"></stop>
          <stop offset="100%" stop-color="#0a1119"></stop>
        </radialGradient>
        <linearGradient id="routeLandFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#242d38"></stop>
          <stop offset="100%" stop-color="#171f28"></stop>
        </linearGradient>
        <filter id="routeSoftShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#000000" flood-opacity="0.2"></feDropShadow>
        </filter>
      </defs>
      <rect width="1000" height="560" fill="url(#routeOceanGlow)"></rect>
      <g opacity="0.32" stroke="#223040" stroke-width="1">
        ${Array.from({ length: 5 }, (_, index) => `<line x1="0" y1="${90 + index * 95}" x2="1000" y2="${90 + index * 95}"></line>`).join("")}
        ${Array.from({ length: 7 }, (_, index) => `<line x1="${128 + index * 124}" y1="0" x2="${128 + index * 124}" y2="560"></line>`).join("")}
      </g>
      <g fill="url(#routeLandFill)" stroke="#303c48" stroke-width="1.2" filter="url(#routeSoftShadow)">
        <path d="M42 126L95 84L161 76L219 94L257 126L251 171L227 195L208 239L182 262L137 270L106 246L72 227L42 187L31 154Z"></path>
        <path d="M253 61L286 43L333 48L344 75L320 101L281 96L257 81Z"></path>
        <path d="M214 280L248 296L281 339L286 379L271 421L252 466L232 511L199 497L187 456L167 420L160 373L176 330Z"></path>
        <path d="M420 110L453 80L499 74L545 88L580 117L611 120L641 108L682 111L719 98L757 112L802 120L843 151L886 156L920 182L944 214L945 244L914 255L893 233L864 233L835 208L809 215L778 225L747 244L726 261L693 274L664 273L628 255L596 253L568 229L538 231L510 214L486 229L452 214L435 187L418 156Z"></path>
        <path d="M515 233L548 239L582 261L601 299L601 332L585 376L566 408L531 424L500 410L477 372L468 339L475 299L492 264Z"></path>
        <path d="M616 252L647 242L676 248L699 268L693 293L667 301L637 293L618 276Z"></path>
        <path d="M699 263L722 251L751 258L768 280L761 300L733 309L706 299L692 280Z"></path>
        <path d="M792 392L822 374L864 381L903 406L896 443L853 456L813 445L787 420Z"></path>
        <path d="M853 179L870 171L876 187L862 201Z"></path>
        <path d="M457 144L469 131L477 145L467 158Z"></path>
        <path d="M575 405L585 418L580 448L564 438Z"></path>
      </g>
      <g opacity="0.42" fill="#8fa0b2">
        <circle cx="270" cy="90" r="4"></circle>
        <circle cx="471" cy="139" r="3.2"></circle>
        <circle cx="854" cy="174" r="3"></circle>
      </g>
    </svg>
  `;
}

function buildMapLabelLayer(labels, cls) {
  return `
    <div class="route-map-label-layer ${cls}">
      ${labels.map((label) => `
        <span
          class="route-map-label ${cls === "regions" ? "region" : "major"}"
          style="--x:${label.x};--y:${label.y};--size:${label.size};"
        >${label.name}</span>
      `).join("")}
    </div>
  `;
}

function buildWorldMapSection() {
  const counts = {
    low: riskFleet.filter((vessel) => vessel.risk === "low").length,
    medium: riskFleet.filter((vessel) => vessel.risk === "medium").length,
    high: riskFleet.filter((vessel) => vessel.risk === "high").length
  };
  const statsMarkup = `
    <div class="route-world-stats">
      <div class="route-world-stat low">
        <span class="route-world-stat-label">${tx("低风险船舶", "Low Risk Vessels")}</span>
        <p class="route-world-stat-value">${counts.low}</p>
        <p class="route-world-stat-copy">${tx("航线通行稳定", "Stable transit corridors")}</p>
      </div>
      <div class="route-world-stat medium">
        <span class="route-world-stat-label">${tx("中风险船舶", "Medium Risk Vessels")}</span>
        <p class="route-world-stat-value">${counts.medium}</p>
        <p class="route-world-stat-copy">${tx("重点跟踪窗口", "Monitor berth and queue windows")}</p>
      </div>
      <div class="route-world-stat high">
        <span class="route-world-stat-label">${tx("高风险船舶", "High Risk Vessels")}</span>
        <p class="route-world-stat-value">${counts.high}</p>
        <p class="route-world-stat-copy">${tx("建议保持预案", "Keep contingency plans ready")}</p>
      </div>
    </div>
  `;

  return `
    <article class="today-card route-world-card">
      <div class="today-card-inner">
        <div class="route-map-shell">
          <div class="route-map-viewport" data-risk-map-viewport>
            <div class="route-world-toolbar">
              <div class="route-world-legend">
                <span class="route-world-legend-item" style="--legend-color:#59e291">${tx("低风险", "Low Risk")}</span>
                <span class="route-world-legend-item" style="--legend-color:#ffd54f">${tx("中风险", "Medium Risk")}</span>
                <span class="route-world-legend-item" style="--legend-color:#ff6b47">${tx("高风险", "High Risk")}</span>
              </div>
              <div class="route-world-tools">
                <button class="route-map-reset" type="button" data-risk-map-reset>${tx("重置视图", "Reset View")}</button>
              </div>
            </div>
            <div class="route-map-stage" data-risk-map-stage>
              <div class="route-map-surface" data-risk-map-surface>
                <div class="route-map-backdrop">
                  <img src="${riskMapBackdropUrl}" alt="World country boundary map from the local map1 vector dataset" draggable="false" loading="eager" fetchpriority="high" decoding="async">
                </div>
                ${buildMapLabelLayer(mapRegionLabels, "regions")}
                ${buildMapLabelLayer(mapMajorCountryLabels, "major")}
                <div class="route-map-vessel-layer">
                  ${riskFleet.map((vessel) => `
                    <button
                      class="route-map-vessel ${vessel.risk} ${vesselSizeClass(vessel.size)}"
                      type="button"
                      data-vessel-id="${vessel.id}"
                      aria-label="${vesselDisplayName(vessel)}"
                      style="--x:${vessel.x};--y:${vessel.y};--fine-x:${vessel.fineX};--fine-y:${vessel.fineY};--heading:${vessel.heading};"
                    >
                      <span class="route-map-vessel-icon" aria-hidden="true">${shipIconMarkup}</span>
                    </button>
                  `).join("")}
                </div>
              </div>
            </div>
            <div class="route-map-popup" data-risk-map-popup hidden></div>
            <div class="route-map-focus-bubble" data-risk-map-focus hidden></div>
            <div class="route-map-coords" data-risk-map-coords>
              <span class="route-map-coords-label">${tx("经纬度", "Coordinates")}</span>
              <div class="route-map-coords-values">
                <span class="route-map-coords-value muted" data-risk-map-lat>${tx("纬度 --", "Lat --")}</span>
                <span class="route-map-coords-value muted" data-risk-map-lng>${tx("经度 --", "Lng --")}</span>
              </div>
            </div>
          </div>
        </div>
        ${statsMarkup}
      </div>
    </article>
  `;
}

function buildGlobalRiskView() {
  return `
    <section class="today-view marine-live-view" data-view="全球航运风险态势图">
      ${buildWorldMapSection()}

      <div class="marine-live-tips">
        <article class="today-card marine-live-tip">
          <div class="today-card-inner">
            <div class="today-title">${icon("route", "today-icon-svg")}<h2>${tx("页面说明", "Page Notes")}</h2></div>
            <p>${tx("这一版保持一级页面结构，不再嵌入官网，而是使用可控的本地交互层来实现高仿船舶风险地图。", "This version keeps the map as a top-level page and no longer embeds the official site. Instead, it uses a controllable local interaction layer for a high-fidelity vessel risk map.")}</p>
          </div>
        </article>
        <article class="today-card marine-live-tip">
          <div class="today-card-inner">
            <div class="today-title">${icon("eye", "today-icon-svg")}<h2>${tx("底图来源", "Base Map Source")}</h2></div>
            <p>${tx("底图当前使用 map1 本地世界矢量图，并继续叠加文字标签层。船位已改成按截图右下角经纬度逐艘定点布置，点击信息卡也同步按这套坐标换算。", "The backdrop now uses the local map1 world vector map with the text label layers retained. Vessel placement is now pinned vessel-by-vessel from the screenshot coordinates, and the click popups use the same coordinate basis.")}</p>
          </div>
        </article>
        <article class="today-card marine-live-tip">
          <div class="today-card-inner">
            <div class="today-title">${icon("data", "today-icon-svg")}<h2>${tx("后续可选", "Next Option")}</h2></div>
            <p>${tx("如果你还想再更像截图，我下一步可以继续补港口名称、航线标注和分区域风险圈层。", "If you want it even closer to the screenshot, I can next add port labels, route annotations, and more regional risk rings.")}</p>
          </div>
        </article>
      </div>
    </section>
  `;
}

function buildVesselDetailView(vessel) {
  const point = vesselMapPoint(vessel);

  return `
    <section class="today-view vessel-detail-view" data-view="${vesselDetailRoute(vessel.id)}">
      <div class="vessel-detail-stack">
        <article class="today-card vessel-detail-hero">
          <div class="today-card-inner">
            <div class="vessel-detail-topbar">
              <button class="vessel-detail-back" type="button" data-vessel-detail-back>${tx("返回风险地图", "Back to Risk Map")}</button>
              <span class="vessel-detail-risk-pill ${vessel.risk}">${riskLevelText(vessel.risk)}</span>
            </div>
            <div class="vessel-detail-header">
              <div>
                <p class="vessel-detail-kicker">${tx("船舶详情", "Vessel Detail")}</p>
                <h1 class="vessel-detail-title">${vesselDisplayName(vessel)}</h1>
                <p class="vessel-detail-subtitle">${tx(vessel.typeZh, vessel.typeEn)} · ${tx("船旗", "Flag")} ${vessel.flag} · ${tx("当前位置", "Current Position")} ${vesselPositionText(vessel)}</p>
              </div>
              <p class="vessel-detail-hero-copy">${tx(vessel.statusZh, vessel.statusEn)} · ${tx("最近回传", "Received")} ${tx(vessel.lastUpdateZh, vessel.lastUpdateEn)}</p>
            </div>
            <div class="vessel-detail-photo-frame">
              <img src="${vessel.imageUrl}" alt="${vesselDisplayName(vessel)}" draggable="false" loading="lazy" decoding="async">
              <div class="vessel-detail-photo-meta">
                <span>${tx("照片来源", "Photo Credit")}</span>
                <strong>${vessel.photoCredit || "boat archive"}</strong>
              </div>
            </div>
          </div>
        </article>

        <article class="today-card vessel-detail-voyage-card">
          <div class="today-card-inner">
            <div class="vessel-detail-section-head">
              <div>
                <p class="vessel-detail-section-kicker">Current voyage</p>
                <h2>${tx("当前航次", "Current voyage")}</h2>
              </div>
              <button class="vessel-detail-live-btn" type="button" data-open-map-vessel="${vessel.id}">${tx("在实时地图中查看", "View on live map")}</button>
            </div>

            <div class="vessel-detail-voyage-map">
              <img src="${vesselVoyageBackdropUrl}" alt="${tx("当前航次地图预览", "Voyage map preview")}" draggable="false" loading="eager" decoding="async">
              <button class="vessel-detail-live-btn vessel-detail-map-badge" type="button" data-open-map-vessel="${vessel.id}">${tx("查看实时位置", "View on live map")}</button>
              <span class="vessel-detail-map-pin" style="--x:${point.x.toFixed(4)};--y:${point.y.toFixed(4)};"></span>
            </div>

            <div class="vessel-detail-route-strip">
              <div class="vessel-detail-route-head">
                <div>
                  <p class="vessel-detail-route-label">${tx("起航港", "Departure from")}</p>
                  <p class="vessel-detail-route-code">${vessel.origin}</p>
                </div>
                <div style="text-align:right;">
                  <p class="vessel-detail-route-label">${tx("到达港", "Arrival at")}</p>
                  <p class="vessel-detail-route-code">${vessel.destination}</p>
                </div>
              </div>

              <div class="vessel-detail-progress-track" style="--progress:${vessel.progress};">
                <svg class="vessel-detail-progress-ship" viewBox="0 0 54 18" aria-hidden="true">
                  <path d="M2 9H40" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"></path>
                  <path d="M33 3L51 9L33 15Z" fill="currentColor"></path>
                </svg>
              </div>

              <div class="vessel-detail-progress-meta">
                <div class="vessel-detail-voyage-values">
                  <p class="vessel-detail-meta-label">${tx("实际离港时间", "Actual time of departure")}</p>
                  <strong>${vessel.departureTime}</strong>
                </div>
                <div class="vessel-detail-voyage-values" style="text-align:right;">
                  <p class="vessel-detail-meta-label">${tx("预计到港时间", "Reported ETA")}</p>
                  <strong>${vessel.eta}</strong>
                </div>
              </div>
            </div>

            <div class="vessel-detail-actions">
              <button class="vessel-detail-outline-btn" type="button">${tx("过往轨迹", "Past track")}</button>
              <button class="vessel-detail-outline-btn" type="button">${tx("路线预测", "Route forecast")}</button>
            </div>

            <div class="vessel-detail-location-card">
              <div class="vessel-detail-location-head">
                <div>
                  <p class="vessel-detail-location-kicker">Location</p>
                  <h3>${tx("卫星位置查看", "Satellite location view")}</h3>
                  <p class="vessel-detail-location-coords">${vesselCoordinateSummary(vessel)}</p>
                </div>
                <p class="vessel-detail-location-copy">${tx("这里直接使用星图影像底图预览船舶所在区域，样式与预览页左图保持一致。", "This panel uses the GeoVis imagery basemap and matches the left preview style.")}</p>
              </div>

              <div class="vessel-satellite-frame" data-vessel-satellite-frame data-vessel-id="${vessel.id}">
                <div class="vessel-satellite-map" data-vessel-satellite-map data-vessel-id="${vessel.id}" aria-label="${tx("船舶卫星位置图", "Vessel satellite position")}"></div>
                <div class="vessel-satellite-controls">
                  <button class="vessel-satellite-control" type="button" data-vessel-satellite-zoom="in" data-vessel-id="${vessel.id}" aria-label="${tx("放大卫星图", "Zoom in satellite map")}">+</button>
                  <button class="vessel-satellite-control" type="button" data-vessel-satellite-zoom="out" data-vessel-id="${vessel.id}" aria-label="${tx("缩小卫星图", "Zoom out satellite map")}">−</button>
                </div>
                <div class="vessel-satellite-coords" data-vessel-satellite-coords data-vessel-id="${vessel.id}">
                  <span class="vessel-satellite-coords-label" data-vessel-satellite-coords-label data-vessel-id="${vessel.id}">${tx("船位经纬度", "Vessel coordinates")}</span>
                  <div class="vessel-satellite-coords-values">
                    <span class="vessel-satellite-coords-value" data-vessel-satellite-lat data-vessel-id="${vessel.id}">${tx("纬度", "Lat")} ${formatMapCoordinate(vessel.latitude, "N", "S")}</span>
                    <span class="vessel-satellite-coords-value" data-vessel-satellite-lng data-vessel-id="${vessel.id}">${tx("经度", "Lng")} ${formatMapCoordinate(vessel.longitude, "E", "W")}</span>
                  </div>
                </div>
              </div>

              <div class="vessel-detail-location-foot">
                <span class="vessel-detail-location-copy" data-vessel-satellite-zoom-label data-vessel-id="${vessel.id}">${vesselSatelliteZoomLabel(vessel.id)}</span>
                <button class="vessel-detail-inline-btn" type="button" data-open-map-vessel="${vessel.id}">${tx("回到大图定位", "Open in live map")}</button>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  `;
}

function formatMapCoordinate(value, positiveSuffix, negativeSuffix) {
  const suffix = value >= 0 ? positiveSuffix : negativeSuffix;
  return `${Math.abs(value).toFixed(2)}°${suffix}`;
}

function vesselPositionText(vessel) {
  const coords = vessel.longitude !== undefined && vessel.latitude !== undefined
    ? { longitude: vessel.longitude, latitude: vessel.latitude }
    : worldCoordsFromPercent(vessel.x, vessel.y);
  return `${formatMapCoordinate(coords.latitude, "N", "S")}, ${formatMapCoordinate(coords.longitude, "E", "W")}`;
}

function updateVesselSatelliteCoordinates(vesselId, coordinates = null) {
  const vessel = vesselById(vesselId);
  if (!vessel) return;

  const activeCoordinates = coordinates && Number.isFinite(coordinates.latitude) && Number.isFinite(coordinates.longitude)
    ? coordinates
    : { latitude: vessel.latitude, longitude: vessel.longitude };
  const label = coordinates
    ? tx("光标经纬度", "Cursor coordinates")
    : tx("船位经纬度", "Vessel coordinates");

  document.querySelectorAll(`[data-vessel-satellite-coords-label][data-vessel-id="${vesselId}"]`).forEach((node) => {
    node.textContent = label;
  });
  document.querySelectorAll(`[data-vessel-satellite-lat][data-vessel-id="${vesselId}"]`).forEach((node) => {
    node.textContent = `${tx("纬度", "Lat")} ${formatMapCoordinate(activeCoordinates.latitude, "N", "S")}`;
  });
  document.querySelectorAll(`[data-vessel-satellite-lng][data-vessel-id="${vesselId}"]`).forEach((node) => {
    node.textContent = `${tx("经度", "Lng")} ${formatMapCoordinate(activeCoordinates.longitude, "E", "W")}`;
  });
}

function fitRiskMapSurface() {
  const viewport = document.querySelector("[data-risk-map-viewport]");
  const surface = document.querySelector("[data-risk-map-surface]");
  if (!viewport || !surface) return;

  const viewportWidth = viewport.clientWidth;
  const viewportHeight = viewport.clientHeight;
  if (!viewportWidth || !viewportHeight) return;

  let width = viewportWidth;
  let height = width / worldMapAspectRatio;

  if (height > viewportHeight) {
    height = viewportHeight;
    width = height * worldMapAspectRatio;
  }

  surface.style.width = `${width}px`;
  surface.style.height = `${height}px`;
  surface.style.left = `${(viewportWidth - width) / 2}px`;
  surface.style.top = `${(viewportHeight - height) / 2}px`;
}

function riskMapSurfaceRects() {
  const viewport = document.querySelector("[data-risk-map-viewport]");
  const surface = document.querySelector("[data-risk-map-surface]");
  if (!viewport || !surface) return null;

  return {
    viewport,
    surface,
    viewportRect: viewport.getBoundingClientRect(),
    surfaceRect: surface.getBoundingClientRect()
  };
}

function clampRiskMapPan(zoom, panX, panY) {
  const viewport = document.querySelector("[data-risk-map-viewport]");
  const surface = document.querySelector("[data-risk-map-surface]");
  if (!viewport || !surface) return { panX, panY };

  const viewportWidth = viewport.clientWidth;
  const viewportHeight = viewport.clientHeight;
  const surfaceLeft = surface.offsetLeft;
  const surfaceTop = surface.offsetTop;
  const surfaceWidth = surface.offsetWidth;
  const surfaceHeight = surface.offsetHeight;

  let minX = viewportWidth - (surfaceLeft + surfaceWidth) * zoom;
  let maxX = -surfaceLeft * zoom;
  let minY = viewportHeight - (surfaceTop + surfaceHeight) * zoom;
  let maxY = -surfaceTop * zoom;

  if (surfaceWidth * zoom <= viewportWidth) {
    const centeredX = (viewportWidth - surfaceWidth * zoom) / 2 - surfaceLeft * zoom;
    minX = centeredX;
    maxX = centeredX;
  }

  if (surfaceHeight * zoom <= viewportHeight) {
    const centeredY = (viewportHeight - surfaceHeight * zoom) / 2 - surfaceTop * zoom;
    minY = centeredY;
    maxY = centeredY;
  }

  return {
    panX: Math.max(minX, Math.min(maxX, panX)),
    panY: Math.max(minY, Math.min(maxY, panY))
  };
}

function riskMapLabelTier(zoom) {
  if (zoom < 1.38) return "regions";
  return "major";
}

function selectedVessel() {
  return riskFleet.find((vessel) => vessel.id === state.selectedVesselId) || null;
}

function popupForVessel(vessel) {
  return `
    <div class="route-map-popup-head">
      <div class="route-map-popup-identity">
        <div class="route-map-popup-title-wrap">
          <h3 class="route-map-popup-title">${vesselDisplayName(vessel)}</h3>
          <p class="route-map-popup-subtitle">${tx(vessel.typeZh, vessel.typeEn)}</p>
        </div>
      </div>
      <div class="route-map-popup-head-actions">
        <button class="route-map-popup-grip" type="button" aria-hidden="true">⋮</button>
        <button class="route-map-popup-close" type="button" data-risk-map-close aria-label="${tx("关闭", "Close")}">×</button>
      </div>
    </div>
    <div class="route-map-popup-photo" data-open-industry-radar="${vessel.id}" role="button" tabindex="0" aria-label="${tx("打开行业事件雷达", "Open industry event radar")}">
      <img src="${vessel.imageUrl}" alt="${vesselDisplayName(vessel)}" draggable="false" loading="eager" fetchpriority="high" decoding="async">
      <span class="route-map-popup-photo-credit">${vessel.photoCredit || "boat archive"}</span>
    </div>
    <div class="route-map-popup-insight">
      <span class="route-map-popup-risk ${vessel.risk}">${riskLevelText(vessel.risk)}</span>
      <button class="route-map-popup-insight-btn" type="button" data-open-vessel-detail="${vessel.id}">${tx("了解更多", "Learn more")}</button>
    </div>
    <div class="route-map-popup-progress">
      <div class="route-map-popup-route">
        <div>
          <span class="route-map-popup-route-code">${vessel.origin}</span>
          <span class="route-map-popup-route-meta"><span class="route-map-popup-route-meta-label">ATD:</span><span>${vessel.departureTime}</span></span>
        </div>
        <div>
          <span class="route-map-popup-route-code">${vessel.destination}</span>
          <span class="route-map-popup-route-meta"><span class="route-map-popup-route-meta-label">ETA:</span><span>${vessel.eta}</span></span>
        </div>
      </div>
      <div class="route-map-popup-bar" style="--progress:${vessel.progress};">
        <svg class="route-map-popup-progress-ship" viewBox="0 0 54 18" aria-hidden="true">
          <path d="M2 9H40" stroke="#1691F3" stroke-width="3.2" stroke-linecap="round"></path>
          <path d="M33 3L51 9L33 15Z" fill="#1691F3"></path>
        </svg>
      </div>
      <div class="route-map-popup-tools">
        <button class="route-map-popup-tool dark" type="button">${tx("过往轨迹", "Past track")}</button>
        <button class="route-map-popup-tool" type="button">${tx("路线预测", "Route forecast")}</button>
      </div>
    </div>
    <div class="route-map-popup-grid">
      <div>
        <span class="route-map-popup-grid-label">${tx("航行状态", "Navigational status")}</span>
        <span class="route-map-popup-grid-value">${tx(vessel.statusZh, vessel.statusEn)}</span>
      </div>
      <div>
        <span class="route-map-popup-grid-label">${tx("速度 / 航线", "Speed/Course")}</span>
        <span class="route-map-popup-grid-value">${vessel.speed} / ${vessel.course}</span>
      </div>
      <div>
        <span class="route-map-popup-grid-label">${tx("吃水", "Draught")}</span>
        <span class="route-map-popup-grid-value">${vessel.draught}</span>
      </div>
    </div>
    <div class="route-map-popup-foot">
      <span><strong>${tx("最近回传", "Received")}:</strong> ${tx(vessel.lastUpdateZh, vessel.lastUpdateEn)} (${tx(vessel.sourceZh, vessel.sourceEn)})</span>
      <span class="route-map-popup-position">${tx("当前位置", "Current Position")}: ${vesselPositionText(vessel)}</span>
    </div>
  `;
}

function updateRiskMapPopup() {
  const popup = document.querySelector("[data-risk-map-popup]");
  const focus = document.querySelector("[data-risk-map-focus]");
  const vessel = selectedVessel();
  const rects = riskMapSurfaceRects();
  if (!popup || !focus || !rects) return;

  const { viewport, viewportRect, surfaceRect } = rects;

  if (!vessel) {
    popup.hidden = true;
    popup.innerHTML = "";
    popup.dataset.vesselId = "";
    focus.hidden = true;
    focus.innerHTML = "";
    focus.dataset.vesselId = "";
    return;
  }

  popup.hidden = false;
  if (popup.dataset.vesselId !== vessel.id) {
    popup.innerHTML = popupForVessel(vessel);
    popup.dataset.vesselId = vessel.id;
    popup.querySelector("[data-risk-map-close]")?.addEventListener("click", () => {
      state.selectedVesselId = null;
      syncRiskMapSelection();
    }, { once: true });
    popup.querySelector("[data-open-vessel-detail]")?.addEventListener("click", () => {
      openVesselDetail(vessel.id, "全球航运风险态势图");
    });
    const radarTrigger = popup.querySelector("[data-open-industry-radar]");
    radarTrigger?.addEventListener("click", () => {
      openIndustryRadar(vessel.id, "全球航运风险态势图");
    });
    radarTrigger?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openIndustryRadar(vessel.id, "全球航运风险态势图");
    });
  }

  const detailFactor = Math.max(0, Math.min(1, (state.mapZoom - 1) / 0.6));
  const preciseX = vessel.x + ((vessel.fineX || 0) * detailFactor);
  const preciseY = vessel.y + ((vessel.fineY || 0) * detailFactor);
  const pointX = (surfaceRect.left - viewportRect.left) + surfaceRect.width * (preciseX / 100);
  const pointY = (surfaceRect.top - viewportRect.top) + surfaceRect.height * (preciseY / 100);
  const popupWidth = popup.offsetWidth || 360;
  const popupHeight = popup.offsetHeight || 440;

  let left = pointX + 24;
  let top = pointY - 40;

  if (left + popupWidth > viewport.clientWidth - 12) {
    left = pointX - popupWidth - 24;
  }

  if (left < 12) {
    left = Math.max(12, viewport.clientWidth - popupWidth - 12);
  }

  if (top + popupHeight > viewport.clientHeight - 12) {
    top = viewport.clientHeight - popupHeight - 12;
  }

  if (top < 70) {
    top = 70;
  }

  popup.style.left = `${left}px`;
  popup.style.top = `${top}px`;

  focus.hidden = false;
  if (focus.dataset.vesselId !== vessel.id) {
    focus.innerHTML = `
      <span class="route-map-focus-title">${vesselDisplayName(vessel)} [${vessel.flag}]</span>
      <span class="route-map-focus-subtitle">${tx("目的地", "Destination")}: ${vessel.destination}</span>
    `;
    focus.dataset.vesselId = vessel.id;
  }
  const focusWidth = focus.offsetWidth || 180;
  const focusHeight = focus.offsetHeight || 56;
  let focusLeft = pointX - focusWidth - 26;
  let focusTop = pointY - focusHeight - 12;
  if (focusLeft < 12) {
    focusLeft = pointX + 18;
  }
  if (focusLeft + focusWidth > viewport.clientWidth - 12) {
    focusLeft = viewport.clientWidth - focusWidth - 12;
  }
  if (focusTop < 70) {
    focusTop = Math.min(viewport.clientHeight - focusHeight - 12, pointY + 18);
  }
  focus.style.left = `${focusLeft}px`;
  focus.style.top = `${focusTop}px`;
}

function syncVesselSatelliteCard(vesselId) {
  const vessel = vesselById(vesselId);
  if (!vessel) return;

  ensureLeafletAssets().then((L) => {
    const container = document.querySelector(`[data-vessel-satellite-map][data-vessel-id="${vesselId}"]`);
    if (!container) return;

    let entry = vesselSatelliteMaps.get(vesselId);
    let isNewMap = false;
    if (!entry || entry.container !== container) {
      if (entry) {
        entry.map.remove();
      }

      const map = L.map(container, {
        zoomControl: true,
        attributionControl: true,
        minZoom: vesselSatelliteLeafletMinZoom,
        maxZoom: vesselSatelliteLeafletMaxZoom
      });

      map.on("zoomend", () => {
        const nearestLevel = vesselSatelliteLeafletZoomLevels.reduce((bestIndex, zoom, index, all) => {
          const bestZoom = all[bestIndex];
          return Math.abs(zoom - map.getZoom()) < Math.abs(bestZoom - map.getZoom()) ? index : bestIndex;
        }, 0);
        const level = clampVesselSatelliteZoom(nearestLevel);
        state.vesselSatelliteZoom[vesselId] = level;
        document.querySelectorAll(`[data-vessel-satellite-zoom-label][data-vessel-id="${vesselId}"]`).forEach((node) => {
          node.textContent = `${vesselSatelliteZoomLabel(vesselId)} · ${vesselSatelliteStatusText(vesselId)}`;
        });
        document.querySelectorAll(`[data-vessel-satellite-zoom][data-vessel-id="${vesselId}"]`).forEach((button) => {
          if (button.dataset.vesselSatelliteZoom === "in") {
            button.disabled = state.vesselSatelliteZoom[vesselId] >= vesselSatelliteZoomSpans.length - 1;
          } else {
            button.disabled = state.vesselSatelliteZoom[vesselId] <= 0;
          }
        });
      });

      map.on("mousemove", (event) => {
        updateVesselSatelliteCoordinates(vesselId, {
          latitude: event.latlng.lat,
          longitude: event.latlng.lng
        });
      });

      map.on("mouseout", () => {
        updateVesselSatelliteCoordinates(vesselId);
      });

      entry = { map, container, tileLayer: null, marker: null };
      vesselSatelliteMaps.set(vesselId, entry);
      isNewMap = true;
    }

    const leafletZoom = vesselSatelliteLeafletZoom(vesselId);
    entry.map.options.minZoom = vesselSatelliteLeafletMinZoom;
    entry.map.options.maxZoom = vesselSatelliteLeafletMaxZoom;
    if (typeof entry.map.setMinZoom === "function") {
      entry.map.setMinZoom(vesselSatelliteLeafletMinZoom);
    }
    if (typeof entry.map.setMaxZoom === "function") {
      entry.map.setMaxZoom(vesselSatelliteLeafletMaxZoom);
    }
    if (isNewMap) {
      entry.map.setView([vessel.latitude, vessel.longitude], leafletZoom, { animate: false });
    } else {
      const center = entry.map.getCenter();
      const hasMeaningfulCenter = Number.isFinite(center.lat) && Number.isFinite(center.lng) && (Math.abs(center.lat) > 0.000001 || Math.abs(center.lng) > 0.000001);
      if (!hasMeaningfulCenter) {
        entry.map.setView([vessel.latitude, vessel.longitude], leafletZoom, { animate: false });
      } else if (entry.map.getZoom() !== leafletZoom) {
        entry.map.setZoom(leafletZoom, { animate: false });
      }
    }

    attachGeoVisTileLayer(L, entry, vesselId);
    ensureVesselSatelliteMarker(L, entry, vessel);
    entry.map.invalidateSize(false);
    updateVesselSatelliteCoordinates(vesselId);

    document.querySelectorAll(`[data-vessel-satellite-zoom][data-vessel-id="${vesselId}"]`).forEach((button) => {
      if (button.dataset.vesselSatelliteZoom === "in") {
        button.disabled = vesselSatelliteZoomLevel(vesselId) >= vesselSatelliteZoomSpans.length - 1;
      } else {
        button.disabled = vesselSatelliteZoomLevel(vesselId) <= 0;
      }
    });
    document.querySelectorAll(`[data-vessel-satellite-zoom-label][data-vessel-id="${vesselId}"]`).forEach((node) => {
      node.textContent = `${vesselSatelliteZoomLabel(vesselId)} · ${vesselSatelliteStatusText(vesselId)}`;
    });
  }).catch((error) => {
    updateVesselSatelliteCoordinates(vesselId);
    document.querySelectorAll(`[data-vessel-satellite-zoom-label][data-vessel-id="${vesselId}"]`).forEach((node) => {
      const detail = error?.message ? ` (${error.message})` : "";
      node.textContent = `${tx("地图初始化失败，请检查图层加载顺序或图源访问", "Map initialization failed. Check layer order or tile access.")}${detail}`;
    });
  });
}

function syncActiveVesselDetail() {
  const vessel = vesselFromDetailRoute(state.activeView);
  if (!vessel) return;
  syncVesselSatelliteCard(vessel.id);
}

function bindVesselSatelliteCards() {
  document.querySelectorAll("[data-vessel-satellite-map]").forEach((mapNode) => {
    if (mapNode.dataset.bound === "true") return;
    mapNode.dataset.bound = "true";
  });
}

function syncRiskMapSelection() {
  document.querySelectorAll("[data-vessel-id]").forEach((node) => {
    node.classList.toggle("is-active", node.dataset.vesselId === state.selectedVesselId);
  });
  updateRiskMapPopup();
}

function setRiskMapCoordinates(coordinates) {
  const latNode = document.querySelector("[data-risk-map-lat]");
  const lngNode = document.querySelector("[data-risk-map-lng]");
  if (!latNode || !lngNode) return;

  if (!coordinates) {
    latNode.textContent = tx("纬度 --", "Lat --");
    lngNode.textContent = tx("经度 --", "Lng --");
    latNode.classList.add("muted");
    lngNode.classList.add("muted");
    return;
  }

  latNode.textContent = `${tx("纬度", "Lat")} ${formatMapCoordinate(coordinates.latitude, "N", "S")}`;
  lngNode.textContent = `${tx("经度", "Lng")} ${formatMapCoordinate(coordinates.longitude, "E", "W")}`;
  latNode.classList.remove("muted");
  lngNode.classList.remove("muted");
}

function riskMapCoordinatesFromPointer(viewport, clientX, clientY) {
  const rects = riskMapSurfaceRects();
  if (!rects || rects.viewport !== viewport) {
    return null;
  }

  const { surfaceRect } = rects;
  const localX = clientX - surfaceRect.left;
  const localY = clientY - surfaceRect.top;

  if (localX < 0 || localX > surfaceRect.width || localY < 0 || localY > surfaceRect.height) {
    return null;
  }

  const normalizedX = localX / surfaceRect.width;
  const normalizedY = localY / surfaceRect.height;

  return {
    longitude: normalizedX * 360 - 180,
    latitude: 90 - normalizedY * 180
  };
}

function updateRiskMapTransform() {
  const viewport = document.querySelector("[data-risk-map-viewport]");
  const stage = document.querySelector("[data-risk-map-stage]");
  if (!viewport || !stage) return;

  fitRiskMapSurface();

  const bounded = clampRiskMapPan(state.mapZoom, state.mapPanX, state.mapPanY);
  state.mapPanX = bounded.panX;
  state.mapPanY = bounded.panY;

  const detailFactor = Math.max(0, Math.min(1, (state.mapZoom - 1) / 0.6));
  const zoomProgress = Math.max(0, Math.min(1, (state.mapZoom - worldRiskMap.minZoom) / (worldRiskMap.maxZoom - worldRiskMap.minZoom)));
  const maxZoomShipScaleComp = 0.429 * 1.25;
  const shipScaleComp = 1.35 - (zoomProgress * (1.35 - maxZoomShipScaleComp));
  viewport.style.setProperty("--map-detail", detailFactor.toFixed(3));
  viewport.style.setProperty("--ship-scale-comp", shipScaleComp.toFixed(3));
  stage.style.transform = `translate(${state.mapPanX}px, ${state.mapPanY}px) scale(${state.mapZoom})`;
  viewport.dataset.labelTier = riskMapLabelTier(state.mapZoom);
  viewport.classList.toggle("is-dragging", Boolean(viewport._dragState));
  if (state.selectedVesselId) {
    updateRiskMapPopup();
  }
}

function resetRiskMapView() {
  state.mapZoom = 1;
  state.mapPanX = 0;
  state.mapPanY = 0;
  updateRiskMapTransform();
}

function bindRiskMap() {
  const viewport = document.querySelector("[data-risk-map-viewport]");
  if (!viewport || viewport.dataset.bound === "true") return;

  viewport.dataset.bound = "true";

  viewport.addEventListener("dragstart", (event) => {
    event.preventDefault();
  });

  viewport.addEventListener("selectstart", (event) => {
    event.preventDefault();
  });

  viewport.addEventListener("wheel", (event) => {
    event.preventDefault();

    const rect = viewport.getBoundingClientRect();
    const cursorX = event.clientX - rect.left;
    const cursorY = event.clientY - rect.top;
    const zoomFactor = event.deltaY < 0 ? 1.12 : 0.9;
    const nextZoom = Math.max(worldRiskMap.minZoom, Math.min(worldRiskMap.maxZoom, state.mapZoom * zoomFactor));
    const ratio = nextZoom / state.mapZoom;

    state.mapPanX = cursorX - (cursorX - state.mapPanX) * ratio;
    state.mapPanY = cursorY - (cursorY - state.mapPanY) * ratio;
    state.mapZoom = nextZoom;
    updateRiskMapTransform();
  }, { passive: false });

  viewport.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    if (event.target.closest("[data-vessel-id], [data-risk-map-popup], [data-risk-map-reset], .route-world-toolbar")) return;

    viewport.setPointerCapture(event.pointerId);
    viewport._dragState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originPanX: state.mapPanX,
      originPanY: state.mapPanY
    };
    updateRiskMapTransform();
  });

  viewport.addEventListener("pointermove", (event) => {
    const drag = viewport._dragState;
    if (drag && drag.pointerId === event.pointerId) {
      state.mapPanX = drag.originPanX + (event.clientX - drag.startX);
      state.mapPanY = drag.originPanY + (event.clientY - drag.startY);
      updateRiskMapTransform();
    }

    const coordinates = event.target.closest(".route-world-toolbar")
      ? null
      : riskMapCoordinatesFromPointer(viewport, event.clientX, event.clientY);
    setRiskMapCoordinates(coordinates);
  });

  const stopDrag = (event) => {
    if (!viewport._dragState) return;
    if (event.pointerId !== undefined && viewport._dragState.pointerId !== event.pointerId) return;
    viewport._dragState = null;
    updateRiskMapTransform();
  };

  viewport.addEventListener("pointerup", stopDrag);
  viewport.addEventListener("pointercancel", stopDrag);
  viewport.addEventListener("pointerleave", (event) => {
    stopDrag(event);
    setRiskMapCoordinates(null);
  });

  document.querySelectorAll("[data-vessel-id]").forEach((node) => {
    node.addEventListener("click", (event) => {
      event.stopPropagation();
      state.selectedVesselId = node.dataset.vesselId;
      syncRiskMapSelection();
    });
  });

  viewport.addEventListener("click", (event) => {
    if (event.target.closest("[data-vessel-id], [data-risk-map-popup], [data-risk-map-reset], .route-world-toolbar")) return;
    state.selectedVesselId = null;
    syncRiskMapSelection();
  });

  document.querySelector("[data-risk-map-reset]")?.addEventListener("click", () => {
    resetRiskMapView();
    updateRiskMapPopup();
  });

  if (!window.__routeRiskMapResizeBound) {
    window.addEventListener("resize", () => {
      updateRiskMapTransform();
    });
    window.__routeRiskMapResizeBound = true;
  }

  resetRiskMapView();
  setRiskMapCoordinates(null);
  syncRiskMapSelection();
}

function buildLogisticsView() {
  return `
    <section class="today-view route-view" data-view="物流与航道通行">
      <div class="today-row-hero">
        <article class="today-card today-score-card" data-edit-target="score">
          <div class="today-card-inner">
            <div class="today-title">${icon("alert", "today-icon-svg today-icon-svg-alert-title")}<h2>${tx("今日风险指数", "Today's Risk Index")}</h2></div>
            <div class="today-score-wrap">
              <p class="today-score-value">${state.todayOverview.score.value}</p>
              <p class="today-score-desc ${state.todayOverview.score.direction === "down" ? "down" : "up"}">${todayTrendText(state.todayOverview.score.direction, state.todayOverview.score.delta)}</p>
            </div>
          </div>
        </article>

        <article class="today-card today-chart-card route-chart-card" data-edit-target="chart">
          <div class="today-card-inner">
            <div class="today-title">${titleIcon("", "./assets/nav-icons/风险指数.svg", "风险指数变化图标")}<h2>${tx("风险指数变化", "Risk Index Trend")}</h2></div>
            ${buildLogisticsMainChart()}
          </div>
        </article>
      </div>

      <div class="route-info-grid">
        <article class="today-card route-summary-card">
          <div class="today-card-inner">
            <div class="route-summary-block">
              <div class="today-title">${titleIcon("", "./assets/nav-icons/眼睛_显示.svg", "监测情况图标", "today-icon-svg", "route-title-icon-asset")}<h2>${tx("监测情况", "Monitoring Status")}</h2></div>
              <div class="route-copy">
                <p>${tx("当前近海一苏伊士上航段航路通行性下降。", "Passability on the Suez upper-route segment is currently declining.")}</p>
                <p>${tx("AIS 航速密度较上周上升 +18%，荷地邮队结构呈现阶段性堆积。", "AIS speed-density is up 18% week over week, with staged vessel queue build-up.")}</p>
                <p>${tx("同期海况出现短时扰动，风力 6-7 级、浪高 2.8-4.3m，部分船舶航速下降 0.9-1.7 kn。", "Short-term sea-state disturbance is ongoing, with force 6-7 winds, 2.8-4.3m waves, and vessel speed down 0.9-1.7 kn.")}</p>
              </div>
            </div>
            <div class="route-summary-block">
              <div class="today-title">${icon("alert", "today-icon-svg route-impact-icon")}<h2>${tx("风险影响", "Risk Impact")}</h2></div>
              <div class="route-copy">
                <p>${tx("航路通行效率受限，预计本航段产生 4-10 小时航次偏移，对后续班期衔接形成延迟压力。", "Route efficiency is constrained, with an estimated 4-10 hour deviation for this segment and follow-on schedule pressure.")}</p>
                <p>${tx("若气象扰动持续，标速恢复和靠港序调整将成为关键影响因素。", "If weather disturbance persists, speed recovery and berthing sequence adjustment will become key factors.")}</p>
              </div>
            </div>
          </div>
        </article>

        <article class="today-card route-judge-card">
          <div class="today-card-inner">
            <div class="today-title">${titleIcon("", "./assets/nav-icons/降序.svg", "拥堵类型判断图标", "today-icon-svg", "route-title-icon-asset")}<h2>${tx("拥堵类型判断", "Congestion Type Assessment")}</h2></div>
            <p class="route-judge-lead">${tx("当前拥堵属于短时周转积压，非结构性阻塞。拥堵缓解将取决于：", "Current congestion is a short-term turnover backlog rather than structural blockage. Relief depends on:")}</p>
            <ol class="route-judge-list">
              <li><img class="route-step-dot" src="./assets/nav-icons/圈1.svg" alt="圈1图标"><span>${tx("风力回落至 ≤ 5 级、浪高 ≤ 2.5m；（预计 8-18 小时）", "Wind easing to force <= 5 and wave height <= 2.5m; (estimated 8-18 hours)")}</span></li>
              <li><img class="route-step-dot" src="./assets/nav-icons/圈2.svg" alt="圈2图标"><span>${tx("目的港窗口释放与跨区通行流量分散；（预计 18-36 小时）", "Destination berth-window release and cross-zone traffic dispersion; (estimated 18-36 hours)")}</span></li>
            </ol>
          </div>
        </article>
      </div>

      <article class="today-card route-guide-card">
        <div class="today-card-inner">
          <div class="today-title">${titleIcon("", "./assets/nav-icons/提示框.svg", "处置指引图标", "today-icon-svg", "route-title-icon-asset flip")}<h2>${tx("处置指引（依据 AIS 拥堵指数执行）", "Action Guidance (Based on AIS Congestion Index)")}</h2></div>
          <div class="route-guide-grid">
            <div class="route-guide-box safe">
              <div class="route-guide-head"><span>I级（≤1.20）</span><span class="route-legend-dot" style="background:#22b26a"></span></div>
              <ul class="route-guide-list">
                <li><img class="route-mini-bullet-asset route-mini-bullet-safe" src="./assets/nav-icons/按钮_选中.svg" alt="完成图标"><span>${tx("维持原航线运行", "Maintain current route operation")}</span></li>
                <li><img class="route-mini-bullet-asset route-mini-bullet-safe" src="./assets/nav-icons/按钮_选中.svg" alt="完成图标"><span>${tx("提前确认靠泊窗口，班轮序位后移", "Confirm berth window early and shift liner priority back")}</span></li>
              </ul>
            </div>
            <div class="route-guide-box warn">
              <div class="route-guide-head"><span>II级（1.20-1.35）</span><span class="route-legend-dot" style="background:#e2c318"></span></div>
              <ul class="route-guide-list">
                <li><img class="route-mini-bullet-asset route-mini-bullet-warn" src="./assets/nav-icons/提示.svg" alt="提示图标"><span>${tx("维持原航线航行", "Keep current route in service")}</span></li>
                <li><img class="route-mini-bullet-asset route-mini-bullet-warn" src="./assets/nav-icons/提示.svg" alt="提示图标"><span>${tx("提前确认泊窗口，班轮序位后移", "Confirm berth window early and shift liner priority back")}</span></li>
              </ul>
            </div>
            <div class="route-guide-box risk">
              <div class="route-guide-head"><span>III级（≥1.35 或航道持续 ≥12h）</span><span class="route-legend-dot" style="background:#de596c"></span></div>
              <ul class="route-guide-list">
                <li><img class="route-mini-bullet-asset route-mini-bullet-risk" src="./assets/nav-icons/停止.svg" alt="停止图标"><span>${tx("维持原航线航行", "Keep current route in service")}</span></li>
                <li><img class="route-mini-bullet-asset route-mini-bullet-risk" src="./assets/nav-icons/停止.svg" alt="停止图标"><span>${tx("提前确认靠泊窗口，班轮序位后移", "Confirm berth window early and shift liner priority back")}</span></li>
              </ul>
            </div>
          </div>
          <div class="route-tip-box">
            <img class="route-tip-icon route-tip-icon-asset" src="./assets/nav-icons/铃铛.svg" alt="提示图标">
            <div>
              <p class="route-tip-title">${tx("提示", "Notice")}</p>
              <p class="route-tip-copy">${tx("当前为中等偏上通行风险区间，建议在未来 6 小时重点跟踪 AIS 密度、风力等级及目的港窗口变化情况。", "The route is currently in a medium-high risk band. Track AIS density, wind level, and berth-window changes closely over the next 6 hours.")}</p>
              <p class="route-tip-copy">${tx("如接近阈值条件，系统将自动推送航线调整指引。", "If threshold conditions are approached, the system will automatically push route-adjustment guidance.")}</p>
            </div>
          </div>
        </div>
      </article>

      <article class="today-card route-mini-card">
        <div class="today-card-inner">
          <div class="today-title"><h2>${tx("航运指数补充观察", "Shipping Index Snapshot")}</h2></div>
          <div class="route-mini-grid">
            ${logisticsMiniCharts.map((chart) => buildLogisticsMiniChart(chart)).join("")}
          </div>
        </div>
      </article>
    </section>
  `;
}

function placeholderView(route, title, text) {
  return `
    <section class="today-view" data-view="${route}">
      <article class="today-card today-placeholder-card">
        <div class="today-card-inner">
          <h2 class="today-placeholder-title">${title}</h2>
          <p class="today-placeholder-text">${text}</p>
        </div>
      </article>
    </section>
  `;
}

function buildIndustryRadarView() {
  return `
    <section class="today-view" data-view="行业事件雷达">
      <div data-industry-radar-root></div>
    </section>
  `;
}

function buildIndustryRadarContent(vessel) {
  const radar = industryRadarData(vessel);
  const pager = industryRadarPagination(vessel.id);
  const visibleVessels = riskFleet.slice(pager.start, pager.end);
  return `
    <div class="industry-radar-shell">
      <article class="today-card">
        <div class="today-card-inner">
          <div class="industry-radar-hero">
            <div class="industry-radar-profile">
              <div class="industry-radar-photo">
                <img src="${vessel.imageUrl}" alt="${vesselDisplayName(vessel)}" draggable="false" loading="eager" decoding="async">
              </div>
              <div class="industry-radar-copy">
                <div>
                  <p class="industry-radar-kicker">${tx("Industry Event Radar", "Industry Event Radar")}</p>
                  <h2 class="industry-radar-title">${vesselDisplayName(vessel)}</h2>
                  <p class="industry-radar-subtitle">${tx("围绕当前船位自动聚合当地航运资讯、气象海况与港口动态。", "Local shipping news, marine weather, and port dynamics aggregated around the vessel's current position.")}</p>
                </div>
                <div class="industry-radar-chip-row">
                  <span class="industry-radar-chip">${tx(radar.region.zoneZh, radar.region.zoneEn)}</span>
                  <span class="industry-radar-chip">${tx(radar.region.laneZh, radar.region.laneEn)}</span>
                  <span class="industry-radar-chip">${vesselCoordinateSummary(vessel)}</span>
                  <span class="industry-radar-chip">${tx("目的港", "Destination")}: ${vessel.destination}</span>
                </div>
                <p class="industry-radar-summary">${tx(radar.summaryZh, radar.summaryEn)}</p>
                <div class="industry-radar-chip-row">
                  <button class="today-action-btn" type="button" data-industry-radar-back>${tx("回到大图", "Back to Map")}</button>
                  <button class="today-action-btn" type="button" data-open-vessel-detail="${vessel.id}">${tx("查看船舶详情", "Open vessel detail")}</button>
                </div>
              </div>
            </div>

            <div class="industry-radar-side">
              <div class="industry-radar-side-card">
                <h3>${tx("当地海况快照", "Local marine snapshot")}</h3>
                <div class="industry-radar-side-grid">
                  <div>
                    <span class="industry-radar-side-label">${tx("风力", "Wind")}</span>
                    <div class="industry-radar-side-value">${tx(radar.weather.windZh, radar.weather.windEn)}</div>
                  </div>
                  <div>
                    <span class="industry-radar-side-label">${tx("浪高", "Wave Height")}</span>
                    <div class="industry-radar-side-value">${tx(radar.weather.waveZh, radar.weather.waveEn)}</div>
                  </div>
                  <div>
                    <span class="industry-radar-side-label">${tx("能见度", "Visibility")}</span>
                    <div class="industry-radar-side-value">${tx(radar.weather.visZh, radar.weather.visEn)}</div>
                  </div>
                  <div>
                    <span class="industry-radar-side-label">${tx("流速", "Current")}</span>
                    <div class="industry-radar-side-value">${tx(radar.weather.currentZh, radar.weather.currentEn)}</div>
                  </div>
                </div>
                <p class="industry-radar-brief">${tx("这些指标会直接影响近岸等待、靠泊节奏和甲板作业窗口。", "These indicators directly affect nearshore waiting time, berth timing, and deck-work windows.")}</p>
              </div>

              <div class="industry-radar-side-card">
                <h3>${tx("即时提示", "Immediate notes")}</h3>
                ${radar.alerts.map((item) => `
                  <div class="industry-radar-alert-item">
                    <span class="industry-radar-alert-title">${tx(item.titleZh, item.titleEn)}</span>
                    <p>${tx(item.bodyZh, item.bodyEn)}</p>
                  </div>
                `).join("")}
              </div>
            </div>
          </div>
        </div>
      </article>

      <article class="today-card">
        <div class="today-card-inner">
          <div class="industry-radar-metrics">
            ${radar.metrics.map((metric) => `
              <div class="industry-radar-metric">
                <span class="industry-radar-side-label">${tx(metric.labelZh, metric.labelEn)}</span>
                <div class="industry-radar-metric-value">${metric.value}</div>
                <p class="industry-radar-metric-note">${tx(metric.noteZh, metric.noteEn)}</p>
              </div>
            `).join("")}
          </div>
        </div>
      </article>

      <article class="today-card">
        <div class="today-card-inner">
          <div class="industry-radar-strip-head">
            <h3>${tx("船只切换", "Vessel switcher")}</h3>
            <span class="industry-radar-side-label">${tx(`第 ${pager.currentPage + 1} / ${pager.totalPages} 页`, `Page ${pager.currentPage + 1} / ${pager.totalPages}`)}</span>
          </div>
          <div class="industry-radar-vessel-pager">
            <button class="industry-radar-vessel-arrow" type="button" data-radar-vessel-page="prev" ${pager.currentPage <= 0 ? "disabled" : ""} aria-label="${tx("上一页", "Previous page")}">‹</button>
            <div class="industry-radar-vessel-window">
              <div class="industry-radar-vessel-page is-${state.radarVesselPageDirection === "prev" ? "prev" : "next"}" style="--radar-page-columns:${pager.pageSize};">
                ${visibleVessels.map((item) => `
                  <button class="industry-radar-vessel-btn ${item.id === vessel.id ? "is-active" : ""}" type="button" data-radar-vessel-switch="${item.id}">
                    <span class="industry-radar-vessel-name">${vesselDisplayName(item)}</span>
                    <span class="industry-radar-vessel-meta">${tx(vesselRadarRegion(item).zoneZh, vesselRadarRegion(item).zoneEn)} · ${item.destination}</span>
                  </button>
                `).join("")}
              </div>
            </div>
            <button class="industry-radar-vessel-arrow" type="button" data-radar-vessel-page="next" ${pager.currentPage >= pager.totalPages - 1 ? "disabled" : ""} aria-label="${tx("下一页", "Next page")}">›</button>
          </div>
        </div>
      </article>

      <article class="today-card">
        <div class="today-card-inner">
          <div class="industry-radar-feed-grid">
            <div>
              <div class="industry-radar-feed-head">
                <h3>${tx("当地航运新闻", "Local shipping news")}</h3>
                <span class="industry-radar-side-label">${tx(radar.region.portZh, radar.region.portEn)}</span>
              </div>
              <div class="industry-radar-side-grid" style="grid-template-columns:1fr;">
                ${radar.shipping.map((item) => `
                  <article class="industry-radar-feed-item">
                    <a class="industry-radar-feed-link" href="${item.href}" target="_blank" rel="noreferrer noopener">
                      <div class="industry-radar-feed-meta">
                        <span>${tx(item.source.zh, item.source.en)}</span>
                        <span>${tx(item.time.zh, item.time.en)}</span>
                      </div>
                      <h4>${tx(item.titleZh, item.titleEn)}</h4>
                      <p class="industry-radar-feed-impact">${tx(item.impactZh, item.impactEn)}</p>
                    </a>
                  </article>
                `).join("")}
              </div>
            </div>

            <div>
              <div class="industry-radar-feed-head">
                <h3>${tx("当地气象与海况", "Local weather & sea state")}</h3>
                <span class="industry-radar-side-label">${tx(radar.region.zoneZh, radar.region.zoneEn)}</span>
              </div>
              <div class="industry-radar-side-grid" style="grid-template-columns:1fr;">
                ${radar.weatherFeed.map((item) => `
                  <article class="industry-radar-feed-item">
                    <a class="industry-radar-feed-link" href="${item.href}" target="_blank" rel="noreferrer noopener">
                      <div class="industry-radar-feed-meta">
                        <span>${tx(item.source.zh, item.source.en)}</span>
                        <span>${tx(item.time.zh, item.time.en)}</span>
                      </div>
                      <h4>${tx(item.titleZh, item.titleEn)}</h4>
                      <p class="industry-radar-feed-impact">${tx(item.impactZh, item.impactEn)}</p>
                    </a>
                  </article>
                `).join("")}
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  `;
}

function bindIndustryRadarEvents() {
  document.querySelectorAll("[data-radar-vessel-switch]").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      const vesselId = button.dataset.radarVesselSwitch;
      if (!vesselId || !vesselById(vesselId)) return;
      state.radarVesselId = vesselId;
      state.selectedVesselId = vesselId;
      syncRadarPageForVessel(vesselId);
      syncIndustryRadarView();
    });
  });

  document.querySelectorAll("[data-radar-vessel-page]").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      const pager = industryRadarPagination();
      if (button.dataset.radarVesselPage === "prev") {
        state.radarVesselPage = Math.max(0, pager.currentPage - 1);
        state.radarVesselPageDirection = "prev";
      } else {
        state.radarVesselPage = Math.min(pager.totalPages - 1, pager.currentPage + 1);
        state.radarVesselPageDirection = "next";
      }
      syncIndustryRadarView();
    });
  });

  document.querySelectorAll("[data-industry-radar-back]").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      returnFromIndustryRadar();
    });
  });

  document.querySelectorAll("[data-open-vessel-detail]").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      const vesselId = button.dataset.openVesselDetail;
      if (!vesselId) return;
      openVesselDetail(vesselId, "行业事件雷达");
    });
  });
}

function syncIndustryRadarView() {
  const root = document.querySelector("[data-industry-radar-root]");
  const vessel = ensureRadarVessel();
  if (!root || !vessel) return;
  const pager = industryRadarPagination(vessel.id);
  if (pager.currentPage < 0 || pager.currentPage >= pager.totalPages) {
    state.radarVesselPage = pager.pageFromVessel;
  }
  root.innerHTML = buildIndustryRadarContent(vessel);
  bindIndustryRadarEvents();
}

function refreshChartDatePreview() {
  const startInput = document.querySelector("[data-editor-chart-start]");
  if (!startInput) return;
  const chartDays = Math.max(1, Number(startInput.dataset.editorChartDays) || defaultTodayChartDays());
  const labels = buildChartLabelsFromStartDate(startInput.value, chartDays);
  document.querySelectorAll("[data-editor-chart-date]").forEach((node, index) => {
    node.textContent = labels[index] || "";
  });
}

function saveTodayEditor(kind, metricId = "") {
  if (kind === "score") {
    state.todayOverview.score = {
      value: Math.max(0, Number(document.querySelector("[data-editor-score-value]")?.value) || 0),
      direction: document.querySelector("[data-editor-score-direction]")?.value === "down" ? "down" : "up",
      delta: Math.max(0, Number(document.querySelector("[data-editor-score-delta]")?.value) || 0)
    };
    savePersistedTodayOverview();
    closeTodayEditor();
    return;
  }

  if (kind === "chart") {
    const startDate = document.querySelector("[data-editor-chart-start]")?.value?.trim() || initialTodayOverviewState.chart.startDate;
    const chartDays = defaultTodayChartDays();
    const labels = buildChartLabelsFromStartDate(startDate, chartDays);
    const values = Array.from(document.querySelectorAll("[data-editor-chart-value]")).slice(0, chartDays).map((input) => {
      const numeric = Number(input.value);
      return Number.isFinite(numeric) ? Math.max(0, numeric) : 0;
    });
    state.todayOverview.chart = {
      startDate: normalizeStoredChartStartDate(startDate, initialTodayOverviewState.chart.startDate),
      labels,
      values
    };
    savePersistedTodayOverview();
    closeTodayEditor();
    return;
  }

  if (kind === "metric" && metricId && state.todayOverview.metrics[metricId]) {
    state.todayOverview.metrics[metricId] = {
      value: Math.max(0, Number(document.querySelector("[data-editor-metric-value]")?.value) || 0),
      risk: document.querySelector("[data-editor-metric-risk]")?.value || "none",
      direction: document.querySelector("[data-editor-metric-direction]")?.value === "down" ? "down" : "up",
      delta: Math.max(0, Number(document.querySelector("[data-editor-metric-delta]")?.value) || 0)
    };
    savePersistedTodayOverview();
    closeTodayEditor();
  }
}

function bindTodayOverviewEditors() {
  document.querySelectorAll("[data-edit-target]").forEach((node) => {
    if (node.dataset.boundDblclick === "true") return;
    node.dataset.boundDblclick = "true";
    node.addEventListener("dblclick", () => {
      const target = node.dataset.editTarget || "";
      if (target === "score") {
        openTodayEditor({ type: "score" });
        return;
      }
      if (target === "chart") {
        openTodayEditor({ type: "chart" });
        return;
      }
      if (target.startsWith("metric:")) {
        openTodayEditor({ type: "metric", metricId: target.slice("metric:".length) });
      }
    });
  });

  document.querySelectorAll("[data-editor-close]").forEach((button) => {
    if (button.dataset.boundClick === "true") return;
    button.dataset.boundClick = "true";
    button.addEventListener("click", () => {
      closeTodayEditor();
    });
  });

  document.querySelector("[data-editor-chart-start]")?.addEventListener("input", refreshChartDatePreview);

  document.querySelectorAll("[data-editor-save]").forEach((button) => {
    if (button.dataset.boundClick === "true") return;
    button.dataset.boundClick = "true";
    button.addEventListener("click", () => {
      saveTodayEditor(button.dataset.editorSave, button.dataset.editorMetricId || "");
    });
  });
}

function app() {
  return `
    <div class="today-shell">
      <aside class="today-sidebar">
        <div class="today-logo-wrap">
          <img class="today-logo" src="./logo.png" alt="ShieldLog logo">
        </div>
        <nav class="today-nav">
          ${navGroup(tx("风险总览", "Risk Overview"), "grid", `${navSub(tx("今日风险指数", "Today's Risk Index"), "今日风险指数", state.activeView === "今日风险指数")}${navSub(tx("风险趋势变化", "Risk Trend"), "风险趋势变化", state.activeView === "风险趋势变化")}`, state.openGroup === "risk-overview", "risk-overview")}
          ${navGroup(tx("风险构成分析", "Risk Composition"), "analysis", `${navSub(tx("政策风险监控", "Policy Risk Monitoring"), "政策风险监控", state.activeView === "政策风险监控")}${navSub(tx("供应链履约情况", "Supply Chain Fulfillment"), "供应链履约情况", state.activeView === "供应链履约情况")}${navSub(tx("物流与航道通行", "Logistics & Route Transit"), "物流与航道通行", state.activeView === "物流与航道通行")}${navSub(tx("市场需求波动", "Market Demand Fluctuation"), "市场需求波动", state.activeView === "市场需求波动")}${navSub(tx("舆情与情绪热度", "Sentiment & Heat"), "舆情与情绪热度", state.activeView === "舆情与情绪热度")}`, state.openGroup === "risk-analysis", "risk-analysis")}
          ${navItem(tx("全球航运风险态势图", "Global Vessel Risk Map"), "全球航运风险态势图", "route")}
          ${navItemAsset(tx("行业事件雷达", "Industry Event Radar"), "行业事件雷达", "./assets/nav-icons/雷达.svg", "行业事件雷达图标")}
          ${navItem(tx("决策建议与处置方案", "Decision Guidance"), "决策建议与处置方案", "plan")}
          ${navItemAsset(tx("数据来源与调用", "Data Sources & Calls"), "数据来源与调用", "./assets/nav-icons/目标关系图.svg", "数据来源与调用图标")}
          ${navItem(tx("行业资讯与事件监测", "Industry News & Events"), "行业资讯与事件监测", "monitor")}
          ${navItemAsset(tx("系统管理", "System Settings"), "系统管理", "./assets/nav-icons/系统.svg", "系统管理图标")}
        </nav>
      </aside>

      <main class="today-main">
        <div class="today-stage">
          <header class="today-topbar">
            ${topControl("toggle-language", tx("语言选择", "Language"), "calendar", state.lang === "zh" ? "中文" : "EN")}
            ${topControl("toggle-theme", tx("深色模式", "Dark Mode"), "globe", state.theme === "dark" ? tx("开", "On") : tx("关", "Off"))}
            <span class="today-top-dot"></span>
          </header>

          <section class="today-view is-visible" data-view="今日风险指数">
            <div class="today-row-hero">
              <article class="today-card today-score-card" data-edit-target="score">
                <div class="today-card-inner">
                  <div class="today-title">${icon("alert", "today-icon-svg today-icon-svg-alert-title")}<h2>${tx("今日风险指数", "Today's Risk Index")}</h2></div>
                  <div class="today-score-wrap">
                    <p class="today-score-value">${state.todayOverview.score.value}</p>
                    <p class="today-score-desc ${state.todayOverview.score.direction === "down" ? "down" : "up"}">${todayTrendText(state.todayOverview.score.direction, state.todayOverview.score.delta)}</p>
                  </div>
                </div>
              </article>

              <article class="today-card today-chart-card" data-edit-target="chart">
                <div class="today-card-inner">
                  <div class="today-title">${titleIcon("", "./assets/nav-icons/风险指数.svg", "风险指数变化图标")}<h2>${tx("风险指数变化", "Risk Index Trend")}</h2></div>
                  ${buildMainChart()}
                </div>
              </article>
            </div>

            <div class="today-row-four">
              ${todayMetricDefinitions.slice(0, 4).map((definition) => {
                const metric = todayMetricValue(definition);
                const riskMeta = todayRiskMeta(metric.risk);
                return metricCard({
                  title: tx(definition.titleZh, definition.titleEn),
                  iconName: definition.iconName || "",
                  assetPath: definition.assetPath || "",
                  assetAlt: definition.assetAlt || "",
                  iconClass: definition.iconClass || "today-icon-svg",
                  assetClass: definition.assetClass || "today-icon-asset",
                  number: metric.value,
                  level: riskMeta.label,
                  trend: todayTrendText(metric.direction, metric.delta),
                  tone: riskMeta.tone,
                  trendTone: metric.direction === "down" ? "down" : "up",
                  editTarget: `metric:${definition.id}`
                });
              }).join("")}
            </div>

            <div class="today-row-three">
              ${todayMetricDefinitions.slice(4).map((definition) => {
                const metric = todayMetricValue(definition);
                const riskMeta = todayRiskMeta(metric.risk);
                return metricCard({
                  title: tx(definition.titleZh, definition.titleEn),
                  iconName: definition.iconName || "",
                  assetPath: definition.assetPath || "",
                  assetAlt: definition.assetAlt || "",
                  iconClass: definition.iconClass || "today-icon-svg",
                  assetClass: definition.assetClass || "today-icon-asset",
                  number: metric.value,
                  level: riskMeta.label,
                  trend: todayTrendText(metric.direction, metric.delta),
                  tone: riskMeta.tone,
                  trendTone: metric.direction === "down" ? "down" : "up",
                  editTarget: `metric:${definition.id}`
                });
              }).join("")}
            </div>

            <article class="today-card today-recommend-card">
              <div class="today-card-inner">
                <div class="today-recommend-head">
                  <div class="today-title">${titleIcon("", "./assets/nav-icons/折线图.svg", "风控处置指引图标")}<h2>${tx("风控处置指引", "Risk Control Guidance")}</h2></div>
                  <button class="today-action-btn" type="button">${tx("查看详情", "View Details")}</button>
                </div>
                <div class="today-alert-block">
                  ${recommendationWarningIcon()}
                  <div class="today-alert-content">
                    <p class="today-alert-line"><span class="today-alert-label">${tx("检测结果：", "Result:")}</span><span class="today-alert-text">${tx("苏伊士运河航段 AIS 拥堵指数较昨日上升 +32%，目的港（鹿特丹）平均靠泊等待时长增加至 9.6 小时。", "AIS congestion on the Suez segment is up 32% vs yesterday, with average berth waiting time at Rotterdam increasing to 9.6 hours.")}</span></p>
                    <p class="today-alert-line"><span class="today-alert-label">${tx("影响评估：", "Impact:")}</span><span class="today-alert-text">${tx("若维持原航线“CNSHA → SGSIN → SUZ → NLRTM”，预计到港时间将延迟 6-12 小时，可能影响后续班期衔接。", "If the original route CNSHA → SGSIN → SUZ → NLRTM is maintained, arrival may be delayed by 6-12 hours and disrupt downstream scheduling.")}</span></p>
                  </div>
                </div>
                <div class="today-ops">
                  <p class="today-ops-label">${tx("建议操作：", "Suggested Actions:")}</p>
                  <p>${tx("1) 优先使用备选航线“CNSHA → SGSIN → Good Hope → NLRTM”，避开拥堵海域；", "1) Prioritize the alternative route CNSHA → SGSIN → Good Hope → NLRTM to avoid congested waters;")}</p>
                  <p>${tx("2) 即时向鹿特丹港代理确认最新靠泊窗口，动态调整靠泊序；（当前平均靠泊间隔：2.4 小时）；", "2) Confirm the latest berth window with the Rotterdam port agent and dynamically adjust berthing order; (current average berth interval: 2.4 hours);")}</p>
                  <p>${tx("3) 若预计延迟超过 6 小时，启动班期级联调整；", "3) If delay is expected to exceed 6 hours, initiate cascading schedule adjustment;")}</p>
                  <p>${tx("4) 后续航次控制即期货盘投入比例 ≤ 35%，保持运力灵活。", "4) Keep spot-cargo input ratio for follow-up voyages at or below 35% to retain capacity flexibility.")}</p>
                </div>
              </div>
            </article>
          </section>

          ${placeholderView("风险趋势变化", tx("风险趋势变化", "Risk Trend"), tx("这个页面的导航切换已经接通，后续我们可以继续按参考图精修这张页面。", "Navigation switching is already connected for this page, and we can continue refining it against the reference image later."))}
          ${placeholderView("政策风险监控", tx("政策风险监控", "Policy Risk Monitoring"), tx("这个页面的导航切换已经接通，后续我们可以继续按参考图精修这张页面。", "Navigation switching is already connected for this page, and we can continue refining it against the reference image later."))}
          ${placeholderView("供应链履约情况", tx("供应链履约情况", "Supply Chain Fulfillment"), tx("这个页面的导航切换已经接通，后续我们可以继续按参考图精修这张页面。", "Navigation switching is already connected for this page, and we can continue refining it against the reference image later."))}
          ${buildLogisticsView()}
          ${buildGlobalRiskView()}
          ${riskFleet.map((vessel) => buildVesselDetailView(vessel)).join("")}
          ${placeholderView("市场需求波动", tx("市场需求波动", "Market Demand Fluctuation"), tx("这个页面的导航切换已经接通，后续我们可以继续按参考图精修这张页面。", "Navigation switching is already connected for this page, and we can continue refining it against the reference image later."))}
          ${placeholderView("舆情与情绪热度", tx("舆情与情绪热度", "Sentiment & Heat"), tx("这个页面的导航切换已经接通，后续我们可以继续按参考图精修这张页面。", "Navigation switching is already connected for this page, and we can continue refining it against the reference image later."))}
          ${buildIndustryRadarView()}
          ${placeholderView("决策建议与处置方案", tx("决策建议与处置方案", "Decision Guidance"), tx("这个一级页面已经可以从左侧导航切换进入，后续如果你提供参考图，我可以继续照图制作。", "This top-level page can already be opened from the left navigation, and we can continue building it once you provide a reference image."))}
          ${placeholderView("数据来源与调用", tx("数据来源与调用", "Data Sources & Calls"), tx("这个一级页面已经可以从左侧导航切换进入，后续如果你提供参考图，我可以继续照图制作。", "This top-level page can already be opened from the left navigation, and we can continue building it once you provide a reference image."))}
          ${placeholderView("行业资讯与事件监测", tx("行业资讯与事件监测", "Industry News & Events"), tx("这个一级页面已经可以从左侧导航切换进入，后续如果你提供参考图，我可以继续照图制作。", "This top-level page can already be opened from the left navigation, and we can continue building it once you provide a reference image."))}
          ${placeholderView("系统管理", tx("系统管理", "System Settings"), tx("这个一级页面已经可以从左侧导航切换进入，后续如果你提供参考图，我可以继续照图制作。", "This top-level page can already be opened from the left navigation, and we can continue building it once you provide a reference image."))}
        </div>
      </main>
      ${buildTodayEditorModal()}
    </div>
  `;
}

function boot() {
  preloadRiskFleetImages();
  document.head.insertAdjacentHTML("beforeend", `<style>${css}</style>`);
  renderApp(true);
}

function renderApp(immediate = false) {
  destroyVesselSatelliteMaps();
  document.body.className = `dash-body lang-${state.lang}${state.theme === "dark" ? " theme-dark" : ""}`;
  document.body.innerHTML = app();
  syncNavGroups(true);
  setNavActive(state.activeView, true);
  bindEvents();
}

function syncNavGroups(immediate = false) {
  document.querySelectorAll(".today-group").forEach((group) => {
    const subList = group.querySelector(".today-sub-list");
    if (!subList) return;

    if (immediate) {
      const previousTransition = subList.style.transition;
      subList.style.transition = "none";
      subList.style.maxHeight = group.classList.contains("is-open") ? `${subList.scrollHeight}px` : "0px";
      subList.offsetHeight;
      subList.style.transition = previousTransition;
      return;
    }

    subList.style.maxHeight = group.classList.contains("is-open") ? `${subList.scrollHeight}px` : "0px";
  });
}

function revealPageBlocks(view) {
  if (!view) return;

  const targets = Array.from(view.querySelectorAll(".today-card")).filter((card) => {
    return !card.parentElement?.closest(".today-card");
  });

  targets.forEach((card) => {
    card.classList.remove("is-reveal-in");
    card.style.animationDelay = "";
  });

  view.offsetHeight;

  targets.forEach((card, index) => {
    card.style.animationDelay = `${index * 55}ms`;
    card.classList.add("is-reveal-in");
  });
}

function setNavActive(target, immediate = false) {
  if (target === "行业事件雷达") {
    ensureRadarVessel();
  }
  state.activeView = target;
  document.querySelectorAll(".today-sub-item, .today-nav-item, .today-group-trigger").forEach((node) => {
    node.classList.remove("is-active");
  });

  let activeViewNode = null;
  document.querySelectorAll(".today-card.is-reveal-in").forEach((card) => {
    card.classList.remove("is-reveal-in");
    card.style.animationDelay = "";
  });

  document.querySelectorAll(".today-view").forEach((view) => {
    view.classList.toggle("is-visible", view.dataset.view === target);
    if (view.dataset.view === target) {
      activeViewNode = view;
    }
  });

  const sub = document.querySelector(`.today-sub-item[data-nav-target="${target}"]`);
  const item = document.querySelector(`.today-nav-item[data-nav-target="${target}"]`);

  if (sub) {
    sub.classList.add("is-active");
    const group = sub.closest(".today-group");
    if (group?.dataset.group) {
      state.openGroup = group.dataset.group;
    }
    document.querySelectorAll(".today-group[data-group]").forEach((node) => {
      node.classList.toggle("is-open", node === group);
    });
    syncNavGroups(immediate);
  } else if (item) {
    item.classList.add("is-active");
  } else if (isVesselDetailRoute(target)) {
    document.querySelector('.today-nav-item[data-nav-target="全球航运风险态势图"]')?.classList.add("is-active");
  }

  if (target === "行业事件雷达") {
    syncIndustryRadarView();
  }

  if (!immediate) {
    revealPageBlocks(activeViewNode);
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }

  if (target === "物流与航道通行" || target === "全球航运风险态势图") {
    window.requestAnimationFrame(() => {
      updateRiskMapTransform();
      setRiskMapCoordinates(null);
      syncRiskMapSelection();
    });
  } else if (isVesselDetailRoute(target)) {
    window.requestAnimationFrame(() => {
      syncActiveVesselDetail();
    });
  }
}

function playNavPress(node, className) {
  if (!node) return;
  node.classList.remove(className);
  node.offsetHeight;
  node.classList.add(className);
  window.clearTimeout(node._pressTimer);
  node._pressTimer = window.setTimeout(() => {
    node.classList.remove(className);
  }, 380);
}

function bindEvents() {
  document.querySelectorAll("[data-group-trigger]").forEach((button) => {
    button.addEventListener("click", () => {
      playNavPress(button, "is-pressing");
      const group = document.querySelector(`.today-group[data-group="${button.dataset.groupTrigger}"]`);
      if (group) {
        state.openGroup = button.dataset.groupTrigger;
        document.querySelectorAll(".today-group[data-group]").forEach((node) => {
          node.classList.toggle("is-open", node === group);
        });
        syncNavGroups();
      }
    });
  });

  document.querySelectorAll("[data-nav-target]").forEach((button) => {
    button.addEventListener("click", () => {
      playNavPress(button, "is-pressing");
      setNavActive(button.dataset.navTarget);
    });
  });

  document.querySelectorAll("[data-ui-action]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.uiAction === "toggle-language") {
        state.lang = state.lang === "zh" ? "en" : "zh";
        renderApp(true);
      }

      if (button.dataset.uiAction === "toggle-theme") {
        state.theme = state.theme === "dark" ? "light" : "dark";
        renderApp(true);
      }
    });
  });

  document.querySelectorAll("[data-vessel-detail-back]").forEach((button) => {
    button.addEventListener("click", () => {
      returnFromVesselDetail();
    });
  });

  document.querySelectorAll("[data-open-map-vessel]").forEach((button) => {
    button.addEventListener("click", () => {
      const vessel = vesselById(button.dataset.openMapVessel);
      if (!vessel) return;
      state.selectedVesselId = vessel.id;
      state.detailReturnView = "全球航运风险态势图";
      setNavActive("全球航运风险态势图");
    });
  });

  document.querySelectorAll("[data-vessel-satellite-zoom]").forEach((button) => {
    button.addEventListener("click", () => {
      const vesselId = button.dataset.vesselId;
      if (!vesselId) return;
      const delta = button.dataset.vesselSatelliteZoom === "in" ? 1 : -1;
      setVesselSatelliteZoom(vesselId, vesselSatelliteZoomLevel(vesselId) + delta);
      syncVesselSatelliteCard(vesselId);
    });
  });

  bindRiskMap();
  bindVesselSatelliteCards();
  bindIndustryRadarEvents();
  bindTodayOverviewEditors();

  if (isVesselDetailRoute(state.activeView)) {
    syncActiveVesselDetail();
  }
}

boot();
