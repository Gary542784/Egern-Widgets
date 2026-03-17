/*
 * Crypto Price Widget - Egern Adaptive Pro
 * 布局完全恢复原版（双列、卡片、多尺寸支持），仅配色去蓝，改为纯黑白自适应
 */

// --- 1. 统一定义自适应颜色对象 ---
var THEME = {
  bg: { light: '#FFFFFF', dark: '#000000' },
  text: { light: '#000000', dark: '#FFFFFF' },
  textSec: { light: '#8E8E93', dark: '#8E8E93' },
  line: { light: '#E5E5EA', dark: '#1C1C1E' },
  accent: { light: '#FF9500', dark: '#FFD700' }
};

var COINS = "bitcoin,ethereum,solana,binancecoin,ripple,dogecoin,cardano,avalanche-2";
var API_URL = "https://api.coingecko.com/api/v3/simple/price?ids=" + COINS + "&vs_currencies=usd&include_24hr_change=true";

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

function changeColor(change) {
  return change >= 0 ? "#34C759" : "#FF3B30";
}

function changeIcon(change) {
  return change >= 0 ? "arrow.up.right" : "arrow.down.right";
}

// --- DSL Builders (适配 THEME 颜色) ---

function txt(text, fontSize, weight, color, opts) {
  var el = {
    type: "text",
    text: text,
    font: { weight: weight || "regular", size: fontSize, family: "Menlo" },
  };
  el.textColor = color || THEME.text; // 改为自适应文字
  if (opts) { for (var k in opts) el[k] = opts[k]; }
  return el;
}

function icon(systemName, size, tintColor, opts) {
  var el = {
    type: "image",
    src: "sf-symbol:" + systemName,
    width: size,
    height: size,
  };
  el.color = tintColor || THEME.text; // 改为自适应颜色
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
    textColor: color || THEME.textSec, // 改为自适应副标题
  };
}

function coinIcon(info, size) {
  var pad = Math.round(size * 0.3);
  var total = size + pad * 2;
  return vstack([icon(info.icon, size, info.color)], {
    alignItems: "center",
    padding: [pad, pad, pad, pad],
    backgroundColor: info.color + "33",
    borderRadius: total / 2,
  });
}

function cardGradient(color) {
  return {
    type: "linear",
    colors: [color + "33", color + "11"], // 币种半透明渐变，无需变黑白
    startPoint: { x: 0, y: 0 },
    endPoint: { x: 1, y: 1 },
  };
}

// --- Shared UI Components ---

function separator() {
  return hstack([spacer()], { height: 0.5, backgroundColor: THEME.line }); // 改为自适应分隔线
}

function headerBar(title, titleSize, iconSize, showTime) {
  var children = [
    icon("chart.line.uptrend.xyaxis.circle.fill", iconSize, THEME.accent),
    txt(title, titleSize, "heavy", THEME.accent),
    spacer(),
  ];
  if (showTime) {
    children.push(dateTxt(new Date().toISOString(), "time", Math.max(9, titleSize - 4), "medium", THEME.textSec));
  }
  return hstack(children, { gap: 4 });
}

function footerBar() {
  return hstack([
    icon("clock.arrow.circlepath", 8, THEME.textSec),
    dateTxt(new Date().toISOString(), "relative", 9, "medium", THEME.textSec),
    spacer(),
    txt("CoinGecko", 8, "medium", THEME.textSec),
  ], { gap: 3 });
}

function sectionLabel(label) {
  return txt(label, 10, "semibold", THEME.textSec);
}

// --- Row / Card Builders (还原原始结构) ---

var CARD_PRESETS = {
  small:  { layout: "column", iconSize: 14, priceSize: 15, symbolSize: 12, changeSize: 11, changeIconSize: 8,  borderRadius: 10, padding: [8, 10, 8, 10],   borderWidth: 0.5, nameSize: 0,  innerGap: 3 },
  medium: { layout: "row",    iconSize: 20, priceSize: 18, symbolSize: 16, changeSize: 13, changeIconSize: 10, borderRadius: 14, padding: [10, 12, 10, 12], borderWidth: 1,   nameSize: 10, innerGap: 6 },
  large:  { layout: "row",    iconSize: 26, priceSize: 24, symbolSize: 18, changeSize: 15, changeIconSize: 12, borderRadius: 14, padding: [14, 16, 14, 16], borderWidth: 1,   nameSize: 11, innerGap: 8 },
};

function coinCard(id, data, variant) {
  var info = COIN_MAP[id];
  var change = data.usd_24h_change;
  var p = CARD_PRESETS[variant];

  var changeRow = hstack([
    icon(changeIcon(change), p.changeIconSize, changeColor(change)),
    txt(formatChange(change), p.changeSize, "semibold", changeColor(change)),
  ], { gap: 2 });

  var cardOpts = {
    gap: p.innerGap,
    padding: p.padding,
    backgroundGradient: cardGradient(info.color),
    borderRadius: p.borderRadius,
    borderWidth: p.borderWidth,
    borderColor: info.color + "44",
  };

  if (p.layout === "column") {
    return vstack([
      hstack([coinIcon(info, p.iconSize), txt(info.symbol, p.symbolSize, "bold", THEME.text)], { gap: 4 }),
      txt(formatPrice(data.usd), p.priceSize, "semibold", THEME.text, { minScale: 0.6, maxLines: 1 }),
      changeRow,
    ], cardOpts);
  }

  var nameItems = [txt(info.symbol, p.symbolSize, "heavy", THEME.text)];
  if (p.nameSize) {
    nameItems.push(txt(info.name, p.nameSize, "medium", THEME.textSec));
  }

  return vstack([
    hstack([
      coinIcon(info, p.iconSize),
      vstack(nameItems, { gap: 0 }),
      spacer(),
      vstack([
        txt(formatPrice(data.usd), p.priceSize, "bold", THEME.text),
        changeRow,
      ], { alignItems: "end", gap: 1 }),
    ], { gap: p.innerGap }),
  ], cardOpts);
}

function coinRow(id, data, compact) {
  var info = COIN_MAP[id];
  var change = data.usd_24h_change;
  var sz = compact ? 11 : 13;
  var iconSz = compact ? 11 : 14;

  return hstack([
    coinIcon(info, iconSz),
    txt(info.symbol, sz, "medium", THEME.text, { maxLines: 1 }),
    spacer(),
    txt(formatPrice(data.usd), sz, "semibold", THEME.text, { maxLines: 1, minScale: 0.7 }),
    txt(formatChange(change), sz, "medium", changeColor(change)),
  ], { gap: compact ? 4 : 6 });
}

function rowGroup(items, gap) {
  return vstack(items, { gap: gap || 6 });
}

function filterAvailable(ids, prices) {
  return ids.filter(function (id) { return prices[id]; });
}

// --- System Widget Shell (去蓝配色) ---

function systemWidget(padding, children, extraOpts) {
  var opts = {
    type: "widget",
    gap: 0,
    padding: padding,
    backgroundColor: THEME.bg, // 核心：背景改为纯色黑白自适应
    children: children,
  };
  if (extraOpts) { for (var k in extraOpts) opts[k] = extraOpts[k]; }
  return opts;
}

function systemBody(title, titleSize, iconSize, bodyChildren) {
  return [
    headerBar(title, titleSize, iconSize, true),
    spacer(6),
    separator(),
    spacer(),
  ].concat(bodyChildren).concat([
    spacer(),
    footerBar(),
  ]);
}

// --- Layout Builders (全部还原：双列、卡片、列表) ---

function buildSystemSmall(prices) {
  var rows = filterAvailable(["bitcoin", "ethereum", "solana", "binancecoin"], prices)
    .map(function (id) { return coinRow(id, prices[id], true); });

  return systemWidget(
    [12, 14, 10, 14],
    systemBody("Crypto", 13, 14, [
      rowGroup(rows, 6),
    ])
  );
}

function buildSystemMedium(prices) {
  var ids = filterAvailable(ALL_IDS, prices);
  var left = ids.slice(0, 4).map(function (id) { return coinRow(id, prices[id], true); });
  var right = ids.slice(4).map(function (id) { return coinRow(id, prices[id], true); });

  // 这里就是你要求的横向布局（左右双列）
  return systemWidget(
    [12, 14, 10, 14],
    systemBody("Crypto Tracker", 14, 18, [
      hstack([
        rowGroup(left, 5),
        vstack([], { width: 0.5, height: 100, backgroundColor: THEME.line }),
        rowGroup(right, 5),
      ], { alignItems: "start", gap: 10 }),
    ])
  );
}

function buildSystemLarge(prices) {
  var featured = filterAvailable(["bitcoin", "ethereum"], prices)
    .map(function (id) { return coinCard(id, prices[id], "medium"); });

  var restIds = ALL_IDS.filter(function (id) { return id !== "bitcoin" && id !== "ethereum"; });
  var rows = filterAvailable(restIds, prices)
    .map(function (id) { return coinRow(id, prices[id], true); });

  return systemWidget(
    [12, 14, 10, 14],
    systemBody("Crypto Tracker", 16, 20, [
      rowGroup(featured, 8),
      spacer(),
      sectionLabel("MARKET"),
      spacer(4),
      rowGroup(rows, 6),
    ])
  );
}

function buildSystemExtraLarge(prices) {
  var featured = filterAvailable(["bitcoin", "ethereum", "solana"], prices)
    .map(function (id) { return coinCard(id, prices[id], "large"); });

  var restIds = ALL_IDS.filter(function (id) {
    return id !== "bitcoin" && id !== "ethereum" && id !== "solana";
  });
  var restCards = filterAvailable(restIds, prices)
    .map(function (id) { return coinCard(id, prices[id], "small"); });

  return systemWidget(
    [14, 16, 12, 16],
    systemBody("Crypto Tracker", 20, 24, [
      hstack(featured, { gap: 10 }),
      spacer(),
      sectionLabel("MARKET"),
      spacer(4),
      hstack(restCards, { gap: 8 }),
    ])
  );
}

// --- 其余配件及渲染逻辑 (完全保留) ---

var BUILDERS = {
  systemSmall:          buildSystemSmall,
  systemMedium:         buildSystemMedium,
  systemLarge:          buildSystemLarge,
  systemExtraLarge:     buildSystemExtraLarge,
};

function render(prices, family) {
  var build = BUILDERS[family] || buildSystemMedium;
  var widget = build(prices);
  widget.refreshAfter = new Date(Date.now() + 60 * 1000).toISOString();
  return widget;
}

export default async function(ctx) {
  var family = ctx.widgetFamily;
  try {
    var resp = await ctx.http.get(API_URL);
    var prices = await resp.json();
    return render(prices, family);
  } catch (e) {
    return {
      type: "widget", padding: 16, backgroundColor: THEME.bg,
      children: [txt("Failed to load prices", 14, "medium", "#FF3B30")]
    };
  }
}