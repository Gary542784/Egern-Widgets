/*
 * Crypto Price Widget - Generic Script (Egern Adaptive Color Version)
 * 完全保留原版布局和功能，仅将颜色改为 Egern 系统自适应配色（去蓝）
 */

// ===================== 自适应色板定义 (去蓝) =====================
const PALETTE = {
  // 背景：Light 纯白, Dark 纯黑
  bg: { light: '#FFFFFF', dark: '#000000' },
  // 主文字：Light 纯黑, Dark 纯白
  text: { light: '#000000', dark: '#FFFFFF' },
  // 副文字/时间/Footer: 灰色
  textSec: { light: '#8E8E93', dark: '#8E8E93' },
  // 分隔线
  separator: { light: '#E5E5EA', dark: '#1C1C1E' },
  // 头部强调色 (金黄色)
  accent: { light: '#FF9500', dark: '#FFD700' },
  // 涨跌
  up: '#34C759',
  down: '#FF3B30',
};

// 获取当前模式颜色的辅助函数
const APP = "dark"; // 默认为 dark，Egern 环境中通常能自动识别对象中的 light/dark 属性，无需手动判断
const getColor = (c) => c; // 在 Egern UI 引擎中直接传入 {light, dark} 对象即可

// ===================== 原版配置与逻辑 (保持不变) =====================
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
  return change >= 0 ? PALETTE.up : PALETTE.down;
}

function changeIcon(change) {
  return change >= 0 ? "arrow.up.right" : "arrow.down.right";
}

// ===================== DSL Builders (仅修改默认颜色) =====================

function txt(text, fontSize, weight, color, opts) {
  var el = {
    type: "text",
    text: text,
    font: { weight: weight || "regular", size: fontSize, family: "Menlo" },
  };
  // ✨ 修改：默认颜色改为自适应主文字颜色
  el.textColor = color || PALETTE.text;
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
  // ✨ 修改：默认颜色改为自适应主文字颜色
  el.color = tintColor || PALETTE.text;
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
    // ✨ 修改：默认颜色改为自适应副文字颜色
    textColor: color || PALETTE.textSec,
  };
}

function coinIcon(info, size) {
  var pad = Math.round(size * 0.3);
  var total = size + pad * 2;
  // 此处 backgroundColor 保持原样，因为它是基于币种品牌色的半透明，不需要随系统主题变黑白
  return vstack([icon(info.icon, size, info.color)], {
    alignItems: "center",
    padding: [pad, pad, pad, pad],
    backgroundColor: info.color + "33",
    borderRadius: total / 2,
  });
}

// 卡片背景渐变保持原样，因为它是基于币种品牌色的半透明
function cardGradient(color) {
  return {
    type: "linear",
    colors: [color + "33", color + "11"],
    startPoint: { x: 0, y: 0 },
    endPoint: { x: 1, y: 1 },
  };
}

// ===================== Shared UI Components (仅修改颜色) =====================

function separator() {
  // ✨ 修改：分隔线颜色改为自适应
  return hstack([spacer()], { height: 1, backgroundColor: PALETTE.separator });
}

function headerBar(title, titleSize, iconSize, showTime) {
  var children = [
    // ✨ 修改：图标和标题使用自适应强调色
    icon("chart.line.uptrend.xyaxis.circle.fill", iconSize, PALETTE.accent),
    txt(title, titleSize, "heavy", PALETTE.accent, {
      // 阴影颜色也微调一下，使其在纯白底上不过于突兀
      shadowColor: { light: "rgba(255,149,0,0.2)", dark: "rgba(255,215,0,0.4)" },
      shadowRadius: 4,
      shadowOffset: { x: 0, y: 0 },
    }),
    spacer(),
  ];
  if (showTime) {
    // ✨ 修改：时间颜色使用自适应副文字
    children.push(dateTxt(new Date().toISOString(), "time", Math.max(9, titleSize - 4), "medium", PALETTE.textSec));
  }
  return hstack(children, { gap: 4 });
}

function footerBar() {
  // ✨ 修改：Footer 所有元素使用自适应副文字颜色
  return hstack([
    icon("clock.arrow.circlepath", 8, PALETTE.textSec),
    dateTxt(new Date().toISOString(), "relative", 9, "medium", PALETTE.textSec),
    spacer(),
    txt("CoinGecko", 8, "medium", PALETTE.textSec),
  ], { gap: 3 });
}

function sectionLabel(label) {
  // ✨ 修改：Section Label 使用自适应副文字颜色
  return txt(label, 10, "semibold", PALETTE.textSec);
}

// ===================== Row / Card Builders (布局完全不动，仅改文字颜色) =====================

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
    // ✨ 修改：卡片边框颜色微调，适配黑白底
    borderColor: { light: info.color + "22", dark: info.color + "55" },
  };

  if (p.layout === "column") {
    return vstack([
      // ✨ 修改：symbol 文字颜色改为自适应
      hstack([coinIcon(info, p.iconSize), txt(info.symbol, p.symbolSize, "bold", PALETTE.text)], { gap: 4 }),
      // ✨ 修改：价格文字颜色改为自适应
      txt(formatPrice(data.usd), p.priceSize, "semibold", PALETTE.text, { minScale: 0.6, maxLines: 1 }),
      changeRow,
    ], cardOpts);
  }

  // ✨ 修改：symbol 和 name 文字颜色改为自适应
  var nameItems = [txt(info.symbol, p.symbolSize, "heavy", PALETTE.text)];
  if (p.nameSize) {
    nameItems.push(txt(info.name, p.nameSize, "medium", PALETTE.textSec));
  }

  return vstack([
    hstack([
      coinIcon(info, p.iconSize),
      vstack(nameItems, { gap: 0 }),
      spacer(),
      vstack([
        // ✨ 修改：价格文字颜色改为自适应
        txt(formatPrice(data.usd), p.priceSize, "bold", PALETTE.text),
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
    // ✨ 修改：Row 中所有文字颜色改为自适应
    txt(info.symbol, sz, "medium", PALETTE.text, { maxLines: 1 }),
    spacer(),
    txt(formatPrice(data.usd), sz, "semibold", PALETTE.text, { maxLines: 1, minScale: 0.7 }),
    txt(formatChange(change), sz, "medium", changeColor(change)),
  ], { gap: compact ? 4 : 6 });
}

function rowGroup(items, gap) {
  return vstack(items, { gap: gap || 6 });
}

function filterAvailable(ids, prices) {
  return ids.filter(function (id) { return prices[id]; });
}

// ===================== System Widget Shell (彻底去蓝的关键) =====================

function systemWidget(gradientColors, padding, children, extraOpts) {
  // ✨ 修改：彻底弃用传入的硬编码渐变色 (gradientColors 参数将被忽略)
  // 改为使用统一的纯黑/纯白背景，以保证“去蓝”和系统自适应
  
  var opts = {
    type: "widget",
    gap: 0,
    padding: padding,
    // ✨ 核心修改：使用自适应纯色背景
    backgroundColor: PALETTE.bg,
    /* 彻底移除 backgroundGradient
    backgroundGradient: {
      type: "linear",
      colors: gradientColors, // 以前这里是深蓝色
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 1, y: 1 },
    },
    */
    children: children,
  };
  if (extraOpts) { for (var k in opts) el[k] = opts[k]; }
  return opts;
}

function systemBody(title, titleSize, iconSize, bodyChildren) {
  // 此处布局完全不变
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

// ===================== Layout Builders (布局、尺寸、Spacer 维持原样) =====================

function buildAccessoryCircular(prices) {
  // 此处原版即为黑白，保持原样
  var btc = prices.bitcoin;
  var change = btc ? btc.usd_24h_change : 0;
  return {
    type: "widget",
    gap: 2,
    children: [
      spacer(),
      icon("bitcoinsign.circle.fill", 18),
      txt(btc ? formatPrice(btc.usd) : "--", 12, "bold", null, { minScale: 0.5 }),
      txt(btc ? formatChange(change) : "", 9, "medium", null, { minScale: 0.5 }),
      spacer(),
    ],
  };
}

function buildAccessoryRectangular(prices) {
  // 此处原版即为黑白，保持原样
  var ids = filterAvailable(["bitcoin", "ethereum", "solana", "binancecoin"], prices);
  var rows = ids.map(function (id) {
    var data = prices[id];
    var info = COIN_MAP[id];
    var change = data.usd_24h_change;
    return hstack([
      icon(info.icon, 9),
      vstack([txt(info.symbol, 10, "bold")], { width: 30, height: 12 }),
      spacer(),
      txt(formatPrice(data.usd), 10, "semibold", null, { minScale: 0.5, maxLines: 1 }),
      vstack([txt(formatChange(change), 9, "medium")], { alignItems: "end", width: 42, height: 12 }),
    ], { gap: 3 });
  });
  return { type: "widget", gap: 2, children: rows };
}

function buildAccessoryInline(prices) {
  // 此处原版即为黑白，保持原样
  var btc = prices.bitcoin;
  var eth = prices.ethereum;
  var text = "";
  if (btc) text += "BTC " + formatPrice(btc.usd) + " " + formatChange(btc.usd_24h_change);
  else text += "BTC --";
  if (eth) text += " | ETH " + formatPrice(eth.usd);
  return {
    type: "widget",
    children: [
      icon("bitcoinsign.circle.fill", 12),
      txt(text, 12, "medium", null, { minScale: 0.7, maxLines: 1 }),
    ],
  };
}

function buildSystemSmall(prices) {
  var rows = filterAvailable(["bitcoin", "ethereum", "solana", "binancecoin"], prices)
    .map(function (id) { return coinRow(id, prices[id], true); });

  return systemWidget(
    [], // ✨ 修改：不再传入蓝色的渐变色数组
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

  return systemWidget(
    [], // ✨ 修改：不再传入蓝色的渐变色数组
    [12, 14, 10, 14],
    systemBody("Crypto Tracker", 14, 18, [
      hstack([
        rowGroup(left, 5),
        // ✨ 修改：中间的分隔线改为自适应颜色
        vstack([], { width: 1, backgroundColor: PALETTE.separator }),
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
    [], // ✨ 修改：不再传入渐变色
    [12, 14, 10, 14],
    systemBody("Crypto Tracker", 16, 20, [
      rowGroup(featured, 8),
      spacer(),
      sectionLabel("MARKET"),
      spacer(4),
      rowGroup(rows, 6),
    ]),
    // ✨ 核心修改：移除原版特定的大组件背景渐变配置，强制使用 systemWidget 内部定义的黑白自适应背景
    {} 
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
    [], // ✨ 修改：不再传入渐变色
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

function errorWidget() {
  // ✨ 修改：Error 组件背景和文字也改为自适应
  return {
    type: "widget",
    padding: 16,
    backgroundColor: PALETTE.bg,
    children: [
      icon("wifi.exclamationmark", 32, PALETTE.down),
      txt("Failed to load prices", 14, "medium", PALETTE.down),
    ],
  };
}

// ===================== Render & Cache & Main (保持不变) =====================

var BUILDERS = {
  accessoryCircular:    buildAccessoryCircular,
  accessoryRectangular: buildAccessoryRectangular,
  accessoryInline:      buildAccessoryInline,
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

var CACHE_KEY = "crypto_prices_cache";
var CACHE_TTL = 60 * 1000;

function loadCache(ctx) {
  var cache = ctx.storage.getJSON(CACHE_KEY);
  if (!cache) return null;
  if (Date.now() - cache.ts < CACHE_TTL) return cache.prices;
  return null;
}

function saveCache(ctx, prices) {
  ctx.storage.setJSON(CACHE_KEY, { ts: Date.now(), prices: prices });
}

export default async function(ctx) {
  var family = ctx.widgetFamily;
  console.log("widgetFamily: " + (family || "null"));

  var cached = loadCache(ctx);
  if (cached) {
    console.log("Using cached prices");
    return render(cached, family);
  }

  try {
    var resp = await ctx.http.get(API_URL);
    var prices = await resp.json();
    saveCache(ctx, prices);
    return render(prices, family);
  } catch (e) {
    console.log("API request failed: " + e.message);
    var staleCache = ctx.storage.getJSON(CACHE_KEY);
    if (staleCache) {
      console.log("Using stale cache as fallback");
      return render(staleCache.prices, family);
    }
    return errorWidget();
  }
}