/**
 * 🚀 Crypto Price Widget (终极修复版 - 仅使用标准 Hex)
 * 逻辑与底色完全同步 BWH 流量监控面板，彻底解决深色模式下变白的问题
 */

const COINS = "bitcoin,ethereum,solana,binancecoin,ripple,dogecoin,cardano,avalanche-2";
const API_URL = "https://api.coingecko.com/api/v3/simple/price?ids=" + COINS + "&vs_currencies=usd&include_24hr_change=true";

const COIN_MAP = {
  bitcoin:      { symbol: "BTC",  icon: "bitcoinsign.circle.fill",  color: "#F7931A" },
  ethereum:     { symbol: "ETH",  icon: "diamond.fill",             color: "#627EEA" },
  solana:       { symbol: "SOL",  icon: "sun.max.fill",             color: "#9945FF" },
  binancecoin:  { symbol: "BNB",  icon: "hexagon.fill",             color: "#F3BA2F" },
  ripple:       { symbol: "XRP",  icon: "drop.fill",                color: "#00AAE4" },
  dogecoin:     { symbol: "DOGE", icon: "hare.fill",                color: "#C3A634" },
  cardano:      { symbol: "ADA",  icon: "circle.grid.cross.fill",   color: "#0033AD" },
  "avalanche-2":{ symbol: "AVAX", icon: "triangle.fill",            color: "#E84142" },
};

const CACHE_KEY = "crypto_prices_cache";

export default async function(ctx) {
  // 🎨 移除所有 rgba，全部采用最稳妥的标准 Hex 颜色对象
  const BG_MAIN    = { light: '#FFFFFF', dark: '#0D0D1A' }; 
  const TEXT_MAIN  = { light: '#1C1C1E', dark: '#FFFFFF' }; 
  const TEXT_SUB   = { light: '#8E8E93', dark: '#EBEBF5' }; 
  const DIVIDER    = { light: '#E5E5EA', dark: '#2C2C2E' }; // 替换了容易出错的 rgba
  
  const C_GOLD     = { light: '#FF9500', dark: '#FFD700' }; 
  const C_GREEN    = { light: '#34C759', dark: '#32D74B' }; 
  const C_RED      = { light: '#FF3B30', dark: '#FF453A' }; 

  // --- 基础工具 ---
  const formatPrice = (p) => p >= 1000 ? "$" + p.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : (p >= 1 ? "$" + p.toFixed(2) : "$" + p.toFixed(4));
  const formatChange = (c) => (c >= 0 ? "+" : "") + (c || 0).toFixed(1) + "%";

  const txt = (text, fontSize, weight, color) => ({
    type: "text",
    text: text,
    font: { weight: weight || "regular", size: fontSize, family: "Menlo" },
    textColor: color || TEXT_MAIN
  });

  const icon = (name, size, color) => ({
    type: "image",
    src: "sf-symbol:" + name,
    width: size,
    height: size,
    color: color
  });

  // --- 列表行渲染 ---
  const coinRow = (id, data) => {
    const info = COIN_MAP[id];
    const change = data.usd_24h_change;
    return {
      type: "stack",
      direction: "row",
      alignItems: "center",
      gap: 8,
      children: [
        // 使用一个极其稳妥的透明度写法（Hex 8位，末尾22代表低透明度）
        {
          type: "stack",
          padding: 4,
          backgroundColor: info.color + "22", 
          borderRadius: 8,
          children: [icon(info.icon, 14, info.color)]
        },
        txt(info.symbol, 13, "medium"),
        { type: "spacer" },
        txt(formatPrice(data.usd), 13, "bold"),
        txt(formatChange(change), 12, "semibold", change >= 0 ? C_GREEN : C_RED)
      ]
    };
  };

  // --- 数据获取 ---
  let prices;
  try {
    const resp = await ctx.http.get(API_URL);
    prices = await resp.json();
    ctx.storage.setJSON(CACHE_KEY, { ts: Date.now(), prices: prices });
  } catch (e) {
    const cached = ctx.storage.getJSON(CACHE_KEY);
    prices = cached ? cached.prices : null;
    if (!prices) return { type: "widget", backgroundColor: BG_MAIN, children: [txt("Error", 14, "bold", C_RED)] };
  }

  const ids = Object.keys(prices).filter(id => COIN_MAP[id]);
  const family = ctx.widgetFamily || "systemMedium";
  const rows = ids.slice(0, family === "systemSmall" ? 4 : 8).map(id => coinRow(id, prices[id]));

  // --- 最终输出 ---
  return {
    type: "widget",
    padding: 14,
    backgroundColor: BG_MAIN,
    refreshPolicy: { onEnter: true, timeout: 60 },
    children: [
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        children: [
          icon("chart.line.uptrend.xyaxis.circle.fill", 16, C_GOLD),
          { type: "spacer", length: 4 },
          txt("Crypto Tracker", 14, "heavy", C_GOLD),
          { type: "spacer" },
          { type: "date", date: new Date().toISOString(), format: "time", font: { size: 10 }, textColor: TEXT_SUB }
        ]
      },
      { type: "spacer", length: 10 },
      // 分割线
      { type: "stack", height: 1, backgroundColor: DIVIDER, children: [{ type: "spacer" }] },
      { type: "spacer", length: 10 },
      // 列表主体
      family === "systemMedium" ? {
        type: "stack",
        direction: "row",
        gap: 12,
        children: [
          { type: "stack", direction: "column", gap: 6, flex: 1, children: rows.slice(0, 4) },
          { type: "stack", width: 1, backgroundColor: DIVIDER, height: 80, children: [{ type: "spacer" }] },
          { type: "stack", direction: "column", gap: 6, flex: 1, children: rows.slice(4, 8) }
        ]
      } : { type: "stack", direction: "column", gap: 6, children: rows },
      { type: "spacer" }
    ]
  };
}
