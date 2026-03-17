/**
 * 🚀 Crypto Price Widget Pro
 * 风格：搬瓦工 (BWH) 极简风格
 * 特性：Coingecko API、双列排版、系统秒切深色模式、自动缓存
 */

// 配置要显示的币种 (对应 Coingecko ID)
const COINS_CONFIG = [
  { id: "bitcoin",      symbol: "BTC",  icon: "bitcoinsign.circle.fill",  color: "#F7931A" },
  { id: "ethereum",     symbol: "ETH",  icon: "diamond.fill",             color: "#627EEA" },
  { id: "solana",       symbol: "SOL",  icon: "sun.max.fill",             color: "#9945FF" },
  { id: "binancecoin",  { symbol: "BNB",  icon: "hexagon.fill",             color: "#F3BA2F" },
  { id: "ripple",       symbol: "XRP",  icon: "drop.fill",                color: "#23292F" },
  { id: "dogecoin",     symbol: "DOGE", icon: "paws.fill",                color: "#C3A634" },
  { id: "cardano",      symbol: "ADA",  icon: "circle.grid.cross.fill",   color: "#0033AD" },
  { id: "avalanche-2",  symbol: "AVAX", icon: "triangle.fill",            color: "#E84142" }
];

const IDS = COINS_CONFIG.map(c => c.id).join(",");
const API_URL = `https://api.coingecko.com/api/v3/simple/price?ids=${IDS}&vs_currencies=usd&include_24hr_change=true`;

export default async function(ctx) {
  // ===================== BWH 风格原生动态颜色 =====================
  const BG_MAIN    = { light: '#FFFFFF', dark: '#0D0D1A' }; 
  const TEXT_MAIN  = { light: '#1C1C1E', dark: '#FFFFFF' }; 
  const TEXT_SUB   = { light: '#8E8E93', dark: '#A2A2B5' }; 
  const LINE_COLOR = { light: '#E5E5EA', dark: '#2C2C2E' }; 
  
  const C_GOLD     = { light: '#FF9500', dark: '#FFD700' }; 
  const C_GREEN    = { light: '#34C759', dark: '#32D74B' }; 
  const C_RED      = { light: '#FF3B30', dark: '#FF453A' }; 

  // ===================== 数据处理工具 =====================
  const formatPrice = (p) => {
    if (p >= 1000) return "$" + p.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return p >= 1 ? "$" + p.toFixed(2) : "$" + p.toFixed(4);
  };

  const formatChange = (c) => (c >= 0 ? "+" : "") + (c || 0).toFixed(1) + "%";

  // ===================== 数据抓取逻辑 =====================
  let prices = {};
  try {
    const resp = await ctx.http.get(API_URL, { timeout: 5000 });
    const text = await resp.text();
    prices = JSON.parse(text);
    // 写入缓存以防下次断网
    ctx.storage.setJSON("crypto_cache", { ts: Date.now(), data: prices });
  } catch (e) {
    const cached = ctx.storage.getJSON("crypto_cache");
    prices = cached ? cached.data : {};
  }

  // ===================== 行组件渲染 =====================
  const renderRow = (coin) => {
    const data = prices[coin.id] || { usd: 0, usd_24h_change: 0 };
    const change = data.usd_24h_change;

    return {
      type: "stack",
      direction: "row",
      alignItems: "center",
      gap: 8,
      children: [
        {
          type: "stack",
          padding: 4,
          backgroundColor: coin.color + "1A", // 10% 透明度背景
          cornerRadius: 6,
          children: [{ type: "image", src: `sf-symbol:${coin.icon}`, width: 12, height: 12, color: coin.color }]
        },
        { type: "text", text: coin.symbol, font: { size: 12, weight: "heavy", family: "Menlo" }, textColor: TEXT_MAIN },
        { type: "spacer" },
        {
          type: "stack",
          direction: "column",
          alignItems: "trailing",
          children: [
            { type: "text", text: formatPrice(data.usd), font: { size: 11, weight: "bold", family: "Menlo" }, textColor: TEXT_MAIN },
            { type: "text", text: formatChange(change), font: { size: 9, weight: "heavy", family: "Menlo" }, textColor: change >= 0 ? C_GREEN : C_RED }
          ]
        }
      ]
    };
  };

  // ===================== 布局判定 =====================
  const isMedium = ctx.widgetFamily === "systemMedium" || !ctx.widgetFamily;
  const leftSide = COINS_CONFIG.slice(0, 4).map(c => renderRow(c));
  const rightSide = COINS_CONFIG.slice(4, 8).map(c => renderRow(c));

  return {
    type: "widget",
    padding: 14,
    backgroundColor: BG_MAIN,
    refreshPolicy: { onEnter: true, onNetworkChange: true, timeout: 60 },
    children: [
      // 头部 (BWH 经典样式)
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        children: [
          { type: "image", src: "sf-symbol:chart.line.uptrend.xyaxis.circle.fill", width: 15, height: 15, color: C_GOLD },
          { type: "spacer", length: 6 },
          { type: "text", text: "MARKET WATCH", font: { size: 13, weight: "heavy" }, textColor: TEXT_MAIN },
          { type: "spacer" },
          { type: "text", text: "LIVE", font: { size: 9, weight: "bold" }, textColor: C_GREEN }
        ]
      },
      { type: "spacer", length: 10 },
      // 像素级分割线
      { type: "stack", height: 0.5, backgroundColor: LINE_COLOR },
      { type: "spacer", length: 12 },
      
      // 主体内容
      isMedium ? {
        type: "stack",
        direction: "row",
        gap: 20,
        children: [
          { type: "stack", direction: "column", gap: 10, flex: 1, children: leftSide },
          { type: "stack", width: 0.5, backgroundColor: LINE_COLOR, marginTop: 4, marginBottom: 4 }, // 中间竖线
          { type: "stack", direction: "column", gap: 10, flex: 1, children: rightSide }
        ]
      } : { 
        type: "stack", direction: "column", gap: 10, children: leftSide 
      },
      
      { type: "spacer" },
      
      // 底部对齐时间
      {
        type: "stack",
        direction: "row",
        justifyContent: "center",
        children: [
          { 
            type: "text", 
            text: `Data: Coingecko • Update: ${new Date().toLocaleTimeString('zh-CN', {hour12:false})}`, 
            font: { size: 8 }, 
            textColor: TEXT_SUB 
          }
        ]
      }
    ]
  };
}
