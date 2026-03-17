/**
 * 🚀 Crypto Price Widget (真·系统自适应 像素级对齐版)
 * 100% 采用 BWH 流量监控面板的底色与逻辑，彻底解决变色与对齐问题
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

export default async function(ctx) {
  // 🎨 搬瓦工同款原生动态颜色 (实现秒切，绝不写死)
  const BG_MAIN    = { light: '#FFFFFF', dark: '#0D0D1A' }; 
  const TEXT_MAIN  = { light: '#1C1C1E', dark: '#FFFFFF' }; 
  const TEXT_SUB   = { light: '#8E8E93', dark: '#EBEBF5' }; 
  const LINE_COLOR = { light: '#E5E5EA', dark: '#2C2C2E' }; 
  
  const C_GOLD     = { light: '#FF9500', dark: '#FFD700' }; 
  const C_GREEN    = { light: '#34C759', dark: '#32D74B' }; 
  const C_RED      = { light: '#FF3B30', dark: '#FF453A' }; 

  const formatPrice = (p) => p >= 1000 ? "$" + p.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : (p >= 1 ? "$" + p.toFixed(2) : "$" + p.toFixed(4));
  const formatChange = (c) => (c >= 0 ? "+" : "") + (c || 0).toFixed(1) + "%";

  // --- 列表行渲染 (模仿 BWH 紧凑排版) ---
  const coinRow = (id, data) => {
    const info = COIN_MAP[id];
    const change = data.usd_24h_change;
    return {
      type: "stack",
      direction: "row",
      alignItems: "center",
      gap: 6,
      children: [
        {
          type: "stack",
          padding: 4,
          backgroundColor: info.color + "22", 
          borderRadius: 6,
          children: [{ type: "image", src: "sf-symbol:" + info.icon, width: 12, height: 12, color: info.color }]
        },
        { type: "text", text: info.symbol, font: { size: 12, weight: "bold", family: "Menlo" }, textColor: TEXT_MAIN },
        { type: "spacer" },
        {
          type: "stack",
          direction: "column",
          alignItems: "end",
          children: [
            { type: "text", text: formatPrice(data.usd), font: { size: 11, weight: "bold", family: "Menlo" }, textColor: TEXT_MAIN },
            { type: "text", text: formatChange(change), font: { size: 10, weight: "bold", family: "Menlo" }, textColor: change >= 0 ? C_GREEN : C_RED }
          ]
        }
      ]
    };
  };

  // --- 数据处理 ---
  let prices;
  try {
    const resp = await ctx.http.get(API_URL);
    prices = await resp.json();
    ctx.storage.setJSON("crypto_cache", { ts: Date.now(), prices: prices });
  } catch (e) {
    const cached = ctx.storage.getJSON("crypto_cache");
    if (!cached) return { type: "widget", backgroundColor: BG_MAIN, children: [{ type: "text", text: "Error" }] };
    prices = cached.prices;
  }

  const ids = Object.keys(prices).filter(id => COIN_MAP[id]);
  const rows = ids.slice(0, 8).map(id => coinRow(id, prices[id]));
  const family = ctx.widgetFamily || "systemMedium";

  return {
    type: "widget",
    padding: [12, 14],
    backgroundColor: BG_MAIN,
    refreshPolicy: { onEnter: true, timeout: 60 },
    children: [
      // 头部栏 (完全照搬 BWH 标题逻辑)
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        children: [
          { type: "image", src: "sf-symbol:chart.line.uptrend.xyaxis.circle.fill", width: 16, height: 16, color: C_GOLD },
          { type: "spacer", length: 6 },
          { type: "text", text: "Crypto Tracker", font: { size: 14, weight: "heavy" }, textColor: C_GOLD },
          { type: "spacer" },
          { type: "date", date: new Date().toISOString(), format: "time", font: { size: 10 }, textColor: TEXT_SUB }
        ]
      },
      { type: "spacer", length: 10 },
      // 搬瓦工同款分割线
      { type: "stack", height: 1, backgroundColor: LINE_COLOR },
      { type: "spacer", length: 12 },
      
      // 列表主体 (两列式等宽排版)
      family === "systemMedium" ? {
        type: "stack",
        direction: "row",
        gap: 16,
        children: [
          { type: "stack", direction: "column", gap: 8, flex: 1, children: rows.slice(0, 4) },
          // 中间竖线加了 padding 避免撞横线
          { type: "stack", width: 1, backgroundColor: LINE_COLOR, marginTop: 4, marginBottom: 4 },
          { type: "stack", direction: "column", gap: 8, flex: 1, children: rows.slice(4, 8) }
        ]
      } : { 
        type: "stack", direction: "column", gap: 8, children: rows.slice(0, 4) 
      },
      { type: "spacer" }
    ]
  };
}
