/**
 * 🚀 Crypto Price Widget (真·系统自适应 秒切版)
 * 配色逻辑完全对齐 BWH 流量监控面板
 */

const COINS = "bitcoin,ethereum,solana,binancecoin,ripple,dogecoin,cardano,avalanche-2";
const API_URL = "https://api.coingecko.com/api/v3/simple/price?ids=" + COINS + "&vs_currencies=usd&include_24hr_change=true";

const COIN_MAP = {
  bitcoin:      { symbol: "BTC",  name: "Bitcoin",   icon: "bitcoinsign.circle.fill",  color: "#F7931A" },
  ethereum:     { symbol: "ETH",  name: "Ethereum",  icon: "diamond.fill",             color: "#627EEA" },
  solana:       { symbol: "SOL",  name: "Solana",    icon: "sun.max.fill",             color: "#9945FF" },
  binancecoin:  { symbol: "BNB",  name: "BNB Chain", icon: "hexagon.fill",             color: "#F3BA2F" },
  ripple:       { symbol: "XRP",  name: "Ripple",    icon: "drop.fill",                color: "#00AAE4" },
  dogecoin:     { symbol: "DOGE", name: "Dogecoin",  icon: "hare.fill",                color: "#C3A634" },
  cardano:      { symbol: "ADA",  name: "Cardano",   icon: "circle.grid.cross.fill",   color: "#0033AD" },
  "avalanche-2":{ symbol: "AVAX", name: "Avalanche", icon: "triangle.fill",            color: "#E84142" },
};

const CACHE_KEY = "crypto_prices_cache";
const CACHE_TTL = 60 * 1000;

export default async function(ctx) {
  // 🎨 iOS 原生动态颜色对象 (流量监控同款，直接秒切)
  const BG_MAIN    = { light: '#FFFFFF', dark: '#0D0D1A' }; 
  const TEXT_MAIN  = { light: '#1C1C1E', dark: '#FFFFFF' }; 
  const TEXT_SUB   = { light: '#8E8E93', dark: '#EBEBF5' }; 
  const DIVIDER    = { light: 'rgba(0,0,0,0.05)', dark: 'rgba(255,255,255,0.1)' }; 
  
  const C_GOLD     = { light: '#FF9500', dark: '#FFD700' }; // 标题：橙/金
  const C_GREEN    = { light: '#34C759', dark: '#32D74B' }; // 涨
  const C_RED      = { light: '#FF3B30', dark: '#FF453A' }; // 跌

  // --- 工具函数 ---
  const formatPrice = (p) => p >= 1000 ? "$" + p.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : (p >= 1 ? "$" + p.toFixed(2) : "$" + p.toFixed(4));
  const formatChange = (c) => (c >= 0 ? "+" : "") + (c || 0).toFixed(1) + "%";

  const txt = (text, fontSize, weight, color, opts) => {
    let el = { type: "text", text: text, font: { weight: weight || "regular", size: fontSize, family: "Menlo" }, textColor: color || TEXT_MAIN };
    if (opts) Object.assign(el, opts);
    return el;
  };

  const icon = (name, size, color) => ({ type: "image", src: "sf-symbol:" + name, width: size, height: size, color: color });

  const hstack = (children, gap = 4) => ({ type: "stack", direction: "row", alignItems: "center", gap: gap, children: children });
  const vstack = (children, gap = 4) => ({ type: "stack", direction: "column", alignItems: "start", gap: gap, children: children });
  const spacer = (len) => ({ type: "spacer", length: len });

  // --- 渲染组件 ---
  const coinRow = (id, data) => {
    const info = COIN_MAP[id];
    const change = data.usd_24h_change;
    return hstack([
      vstack([icon(info.icon, 14, info.color)], { padding: 4, backgroundColor: info.color + "22", borderRadius: 11 }),
      txt(info.symbol, 13, "medium"),
      spacer(),
      txt(formatPrice(data.usd), 13, "bold"),
      txt(formatChange(change), 12, "semibold", change >= 0 ? C_GREEN : C_RED)
    ], 8);
  };

  // --- 主逻辑 ---
  const family = ctx.widgetFamily || "systemMedium";
  let prices;
  try {
    const cached = ctx.storage.getJSON(CACHE_KEY);
    if (cached && (Date.now() - cached.ts < CACHE_TTL)) {
      prices = cached.prices;
    } else {
      const resp = await ctx.http.get(API_URL);
      prices = await resp.json();
      ctx.storage.setJSON(CACHE_KEY, { ts: Date.now(), prices: prices });
    }
  } catch (e) {
    return { type: "widget", backgroundColor: BG_MAIN, children: [txt("Network Error", 14, "bold", C_RED)] };
  }

  const ids = Object.keys(prices).filter(id => COIN_MAP[id]);
  const rows = ids.slice(0, family === "systemSmall" ? 4 : 8).map(id => coinRow(id, prices[id]));

  return {
    type: "widget",
    padding: 14,
    backgroundColor: BG_MAIN, // 关键：原生动态背景
    refreshPolicy: { onEnter: true, timeout: 60 },
    children: [
      hstack([
        icon("chart.line.uptrend.xyaxis.circle.fill", 16, C_GOLD),
        txt("Crypto Tracker", 14, "heavy", C_GOLD),
        spacer(),
        { type: "date", date: new Date().toISOString(), format: "time", font: { size: 10 }, textColor: TEXT_SUB }
      ]),
      spacer(8),
      hstack([spacer()], { height: 1, backgroundColor: DIVIDER }),
      spacer(8),
      family === "systemMedium" ? hstack([
        vstack(rows.slice(0, 4), 6),
        vstack([], { width: 1, backgroundColor: DIVIDER, height: 80 }),
        vstack(rows.slice(4, 8), 6)
      ], 12) : vstack(rows, 6),
      spacer()
    ]
  };
}
