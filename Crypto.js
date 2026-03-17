/**
 * Crypto Price Widget - Egern Adaptive Version
 * 适配 Egern 系统配色：支持深浅色模式自动切换
 */

var COINS = "bitcoin,ethereum,solana,binancecoin,ripple,dogecoin,cardano,avalanche-2";
var API_URL = "https://api.coingecko.com/api/v3/simple/price?ids=" + COINS + "&vs_currencies=usd&include_24hr_change=true";

// --- 系统自适应配色定义 ---
var THEME = {
  bg: "systemBackground",               // 系统背景
  secondaryBg: "secondarySystemBackground", // 次级背景（卡片感）
  label: "label",                       // 一级文字
  secondaryLabel: "secondaryLabel",     // 二级文字
  tertiaryLabel: "tertiaryLabel",       // 三级文字
  separator: "separator",               // 分隔线
  accent: "systemOrange",               // 强调色 (原金黄色改为系统橙，更适配)
  up: "#34C759",                        // 上涨 (iOS Green)
  down: "#FF3B30",                      // 下跌 (iOS Red)
};

var COIN_MAP = {
  bitcoin:      { symbol: "BTC",  name: "Bitcoin",   icon: "bitcoinsign.circle.fill",  color: "#F7931A" },
  ethereum:     { symbol: "ETH",  name: "Ethereum",  icon: "diamond.fill",             color: "#627EEA" },
  solana:       { symbol: "SOL",  name: "Solana",    icon: "sun.max.fill",             color: "#9945FF" },
  binancecoin:  { symbol: "BNB",  name: "BNB Chain", icon: "hexagon.fill",             color: "#F3BA2F" },
  ripple:       { symbol: "XRP",  name: "Ripple",    icon: "drop.fill",                color: "#00AAE4" },
  dogecoin:     { symbol: "DOGE", name: "Dogecoin",  icon: "hare.fill",                color: "#C3A634" },
  cardano:      { symbol: "ADA",  name: "Cardano",   icon: "circle.grid.cross.fill",   color: "#0033AD" },
  "avalanche-2":{ symbol: "AVAX", name: "Avalanche", icon: "triangle.fill",            color: "#E84142" },
};

var ALL_IDS = Object.keys(COIN_MAP);

// --- 格式化函数 ---
function formatPrice(price) {
  if (price >= 1000) return "$" + price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (price >= 1) return "$" + price.toFixed(2);
  return "$" + price.toFixed(4);
}

function formatChange(change) {
  if (change == null) return "+0.0%";
  var sign = change >= 0 ? "+" : "";
  return sign + change.toFixed(1) + "%";
}

// --- DSL Builders (已适配 THEME) ---

function txt(text, fontSize, weight, color, opts) {
  var el = {
    type: "text",
    text: text,
    font: { weight: weight || "regular", size: fontSize },
    textColor: color || THEME.label,
  };
  if (opts) { for (var k in opts) el[k] = opts[k]; }
  return el;
}

function icon(systemName, size, tintColor, opts) {
  var el = {
    type: "image",
    src: "sf-symbol:" + systemName,
    width: size,
    height: size,
    color: tintColor || THEME.label,
  };
  if (opts) { for (var k in opts) el[k] = opts[k]; }
  return el;
}

function hstack(children, opts) {
  var el = { type: "stack", direction: "row", alignItems: "center", children: children };
  if (opts) { for (var k in opts) el[k] = opts[k]; }
  return el;
}

function vstack(children, opts) {
  var el = { type: "stack", direction: "column", alignItems: "start", children: children };
  if (opts) { for (var k in opts) el[k] = opts[k]; }
  return el;
}

function spacer(length) {
  var el = { type: "spacer" };
  if (length != null) el.length = length;
  return el;
}

function dateTxt(dateStr, style, fontSize, weight, color) {
  return {
    type: "date",
    date: dateStr,
    format: style,
    font: { size: fontSize, weight: weight || "medium" },
    textColor: color || THEME.secondaryLabel,
  };
}

function separator() {
  return hstack([spacer()], { height: 0.5, backgroundColor: THEME.separator });
}

// --- UI Components ---

function headerBar(title, titleSize, iconSize, showTime) {
  var children = [
    icon("chart.line.uptrend.xyaxis.circle.fill", iconSize, THEME.accent),
    txt(title, titleSize, "heavy", THEME.accent),
    spacer(),
  ];
  if (showTime) {
    children.push(dateTxt(new Date().toISOString(), "time", Math.max(9, titleSize - 4), "medium", THEME.tertiaryLabel));
  }
  return hstack(children, { gap: 4 });
}

function footerBar() {
  return hstack([
    icon("clock.arrow.circlepath", 8, THEME.tertiaryLabel),
    dateTxt(new Date().toISOString(), "relative", 9, "medium", THEME.tertiaryLabel),
    spacer(),
    txt("CoinGecko", 8, "medium", THEME.tertiaryLabel),
  ], { gap: 3 });
}

// --- Row & Card Builders ---

function coinCard(id, data, variant) {
  var info = COIN_MAP[id];
  var change = data.usd_24h_change;
  var color = change >= 0 ? THEME.up : THEME.down;
  
  // 使用 secondarySystemBackground 作为卡片底色，确保在深浅模式下都有浮起感
  return vstack([
    hstack([
      icon(info.icon, 14, info.color),
      txt(info.symbol, 12, "bold", THEME.label)
    ], { gap: 4 }),
    spacer(4),
    txt(formatPrice(data.usd), 15, "semibold", THEME.label, { maxLines: 1 }),
    hstack([
      icon(change >= 0 ? "arrow.up.right" : "arrow.down.right", 8, color),
      txt(formatChange(change), 10, "bold", color),
    ], { gap: 2 })
  ], {
    padding: [10, 10, 10, 10],
    backgroundColor: THEME.secondaryBg,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: THEME.separator
  });
}

function coinRow(id, data, compact) {
  var info = COIN_MAP[id];
  var change = data.usd_24h_change;
  var color = change >= 0 ? THEME.up : THEME.down;
  var sz = compact ? 12 : 14;

  return hstack([
    icon(info.icon, sz, info.color),
    spacer(6),
    txt(info.symbol, sz, "medium", THEME.label),
    spacer(),
    txt(formatPrice(data.usd), sz, "semibold", THEME.label),
    spacer(8),
    txt(formatChange(change), sz, "bold", color),
  ], { height: compact ? 22 : 28 });
}

// --- Layouts ---

function buildSystemSmall(prices) {
  var rows = ALL_IDS.slice(0, 4)
    .filter(id => prices[id])
    .map(id => coinRow(id, prices[id], true));

  return {
    type: "widget",
    backgroundColor: THEME.bg,
    padding: 12,
    children: [
      headerBar("Crypto", 14, 16, false),
      spacer(8),
      separator(),
      spacer(8),
      ...rows,
      spacer(),
      footerBar()
    ]
  };
}

function buildSystemMedium(prices) {
  var ids = ALL_IDS.filter(id => prices[id]);
  var left = ids.slice(0, 4).map(id => coinRow(id, prices[id], true));
  var right = ids.slice(4, 8).map(id => coinRow(id, prices[id], true));

  return {
    type: "widget",
    backgroundColor: THEME.bg,
    padding: 12,
    children: [
      headerBar("Market Overview", 15, 18, true),
      spacer(10),
      hstack([
        vstack(left, { flex: 1 }),
        spacer(12),
        vstack([], { width: 0.5, height: 100, backgroundColor: THEME.separator }),
        spacer(12),
        vstack(right, { flex: 1 }),
      ], { alignItems: "start" }),
      spacer(),
      footerBar()
    ]
  };
}

// --- Main Render ---

export default async function(ctx) {
  const family = ctx.widgetFamily || "systemMedium";
  
  try {
    const resp = await ctx.http.get(API_URL);
    const prices = await resp.json();

    if (family === "systemSmall") return buildSystemSmall(prices);
    return buildSystemMedium(prices); // 默认返回 Medium 布局

  } catch (e) {
    return {
      type: "widget",
      backgroundColor: THEME.bg,
      children: [
        icon("exclamationmark.triangle.fill", 24, THEME.down),
        txt("Network Error", 14, "medium", THEME.label)
      ]
    };
  }
}
