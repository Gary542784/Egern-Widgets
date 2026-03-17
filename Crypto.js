/*
 * Crypto Price Widget - Egern Adaptive Pro Version
 * 布局完全遵循原版逻辑，仅优化间距（去挤）并适配纯黑白配色
 */

// ===================== 1. 极致黑白自适应配色 =====================
const THEME = {
  bg: { light: '#FFFFFF', dark: '#000000' },     // 背景：纯白/纯黑
  text: { light: '#1C1C1E', dark: '#FFFFFF' },   // 文字：纯黑/纯白
  subText: { light: '#8E8E93', dark: '#8E8E93' },// 副文字：灰色
  line: { light: '#E5E5EA', dark: '#1C1C1E' },   // 分隔线
  accent: { light: '#FF9500', dark: '#FFD700' }, // 强调色
  up: '#34C759',                                  // 涨
  down: '#FF3B30',                                // 跌
};

// ===================== 2. 原版配置 (保持不变) =====================
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

// ===================== 3. 辅助函数 (保持逻辑) =====================
function formatPrice(price) {
  if (price >= 1000) return "$" + price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return "$" + (price >= 1 ? price.toFixed(2) : price.toFixed(4));
}
function formatChange(change) {
  return (change >= 0 ? "+" : "") + (change || 0).toFixed(1) + "%";
}

// ===================== 4. UI 组件 (优化间距 & 颜色) =====================
function txt(text, fontSize, weight, color, opts) {
  return {
    type: "text", text: text,
    font: { weight: weight || "regular", size: fontSize, family: "Menlo" },
    textColor: color || THEME.text,
    ...(opts || {})
  };
}

function icon(systemName, size, tintColor, opts) {
  return {
    type: "image", src: "sf-symbol:" + systemName,
    width: size, height: size, color: tintColor || THEME.text,
    ...(opts || {})
  };
}

function hstack(children, opts) { return { type: "stack", direction: "row", alignItems: "center", children: children, ...(opts || {}) }; }
function vstack(children, opts) { return { type: "stack", direction: "column", alignItems: "start", children: children, ...(opts || {}) }; }
function spacer(length) { return { type: "spacer", length: length }; }

function separator() {
  return hstack([spacer()], { height: 0.5, backgroundColor: THEME.line });
}

function headerBar(title, titleSize, iconSize, showTime) {
  return hstack([
    icon("chart.line.uptrend.xyaxis.circle.fill", iconSize, THEME.accent),
    txt(title, titleSize, "heavy", THEME.accent),
    spacer(),
    showTime ? { type: "date", date: new Date().toISOString(), format: "time", font: { size: 10 }, textColor: THEME.subText } : spacer(0)
  ], { gap: 6 });
}

function footerBar() {
  return hstack([
    icon("clock.arrow.circlepath", 8, THEME.subText),
    { type: "date", date: new Date().toISOString(), format: "relative", font: { size: 9 }, textColor: THEME.subText },
    spacer(),
    txt("PRO BOARD", 8, "heavy", THEME.subText),
  ], { gap: 4 });
}

// ===================== 5. 核心行组件 (优化视觉密度) =====================
function coinRow(id, data, compact) {
  var info = COIN_MAP[id];
  var change = data.usd_24h_change;
  var color = change >= 0 ? THEME.up : THEME.down;
  var sz = compact ? 12 : 14;

  return hstack([
    vstack([icon(info.icon, sz, info.color)], { 
      padding: [4, 4, 4, 4], backgroundColor: info.color + "22", borderRadius: 6 
    }),
    spacer(8), // 增加图标与文字间距
    txt(info.symbol, sz, "bold", THEME.text),
    spacer(),
    txt(formatPrice(data.usd), sz, "bold", THEME.text),
    spacer(8),
    txt(formatChange(change), sz - 1, "heavy", color)
  ], { height: compact ? 26 : 30 }); // 增加行高，防止拥挤
}

// ===================== 6. 容器构建 (完全去蓝) =====================
function systemWidget(padding, children) {
  return {
    type: "widget",
    backgroundColor: THEME.bg, // 纯黑白背景
    padding: padding || 15,
    children: children
  };
}

function buildSystemMedium(prices) {
  var ids = ALL_IDS.filter(id => prices[id]);
  var left = ids.slice(0, 4).map(id => coinRow(id, prices[id], true));
  var right = ids.slice(4, 8).map(id => coinRow(id, prices[id], true));

  return systemWidget(15, [
    headerBar("Crypto Market", 14, 16, true),
    spacer(10), // 增加头部间距
    separator(),
    spacer(12), // 增加分隔线后的空隙
    hstack([
      vstack(left, { gap: 8, flex: 1 }), // 关键：行间距从 5 改为 8
      spacer(15),
      vstack(right, { gap: 8, flex: 1 }),
    ], { alignItems: "start" }),
    spacer(),
    footerBar()
  ]);
}

function buildSystemSmall(prices) {
  var rows = ALL_IDS.slice(0, 4)
    .filter(id => prices[id])
    .map(id => coinRow(id, prices[id], true));

  return systemWidget(15, [
    headerBar("Crypto", 14, 16, false),
    spacer(10),
    separator(),
    spacer(10),
    vstack(rows, { gap: 8 }),
    spacer(),
    footerBar()
  ]);
}

// ===================== 7. 渲染入口 (保持逻辑) =====================
export default async function(ctx) {
  var family = ctx.widgetFamily || "systemMedium";
  
  try {
    var resp = await ctx.http.get(API_URL);
    var prices = await resp.json();
    
    if (family === "systemSmall") return buildSystemSmall(prices);
    return buildSystemMedium(prices);
    
  } catch (e) {
    return {
      type: "widget", backgroundColor: THEME.bg,
      children: [txt("Network Error", 12, "medium", THEME.down)]
    };
  }
}