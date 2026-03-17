/**
 * 🚀 Crypto Price Widget (招商银行配色版)
 * 适配：Egern / Widgy / Wstd
 * 特色：招行色彩体系、等宽字体对齐、Binance 稳定数据源
 */

export default async function(ctx) {
  // 🎨 颜色配置：完全引用你提供的招商银行主题
  const theme = {
    bg:    { light: "#FFFFFF", dark: "#1C1C1E" },
    card:  { light: "#F5F5F7", dark: "#2C2C2E" },
    title: { light: "#000000", dark: "#FFFFFF" },
    label: { light: "#666666", dark: "#AAAAAA" },
    price: { light: "#000000", dark: "#FFFFFF" },
    up:    { light: "#00AA00", dark: "#30D158" },
    down:  { light: "#FF0000", dark: "#FF453A" },
    time:  { light: "#999999", dark: "#888888" }
  };

  // 币种配置
  const COIN_CONFIG = [
    { id: 'BTCUSDT',  short: 'BTC',  icon: 'bitcoinsign.circle.fill', color: "#F7931A" },
    { id: 'ETHUSDT',  short: 'ETH',  icon: 'diamond.fill',            color: "#627EEA" },
    { id: 'SOLUSDT',  short: 'SOL',  icon: 'sun.max.fill',            color: "#9945FF" },
    { id: 'BNBUSDT',  short: 'BNB',  icon: 'hexagon.fill',            color: "#F3BA2F" },
    { id: 'XRPUSDT',  short: 'XRP',  icon: 'drop.fill',               color: "#23292F" },
    { id: 'DOGEUSDT', short: 'DOGE', icon: 'paws.fill',               color: "#C3A634" },
    { id: 'ADAUSDT',  short: 'ADA',  icon: 'circle.grid.cross.fill',  color: "#0033AD" },
    { id: 'AVAXUSDT', short: 'AVAX', icon: 'triangle.fill',           color: "#E84142" }
  ];

  // --- 数据抓取 (改用 Binance，比 Coingecko 稳定 10 倍) ---
  const fetchData = async () => {
    try {
      const resp = await ctx.http.get("https://api.binance.com/api/v3/ticker/24hr", {
        headers: { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)" },
        timeout: 6000
      });
      const allData = JSON.parse(await resp.text());
      // 过滤出我们需要的那几个币
      const filtered = {};
      allData.forEach(item => {
        if (COIN_CONFIG.find(c => c.id === item.symbol)) {
          filtered[item.symbol] = {
            price: parseFloat(item.lastPrice),
            change: parseFloat(item.priceChangePercent)
          };
        }
      });
      ctx.storage.setJSON("crypto_cache", filtered);
      return filtered;
    } catch (e) {
      return ctx.storage.getJSON("crypto_cache") || {};
    }
  };

  const prices = await fetchData();

  // --- 格式化工具 ---
  const formatPrice = (p) => {
    if (!p) return "---";
    if (p >= 1000) return p.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return p >= 1 ? p.toFixed(2) : p.toFixed(4);
  };

  // --- 列表行渲染 ---
  const renderRow = (coin) => {
    const data = prices[coin.id] || { price: 0, change: 0 };
    const isUp = data.change >= 0;

    return {
      type: "stack",
      direction: "row",
      alignItems: "center",
      gap: 8,
      children: [
        {
          type: "stack",
          padding: 4,
          backgroundColor: coin.color + "1A", // 10% 透明度
          cornerRadius: 6,
          children: [{ type: "image", src: `sf-symbol:${coin.icon}`, width: 12, height: 12, color: coin.color }]
        },
        { type: "text", text: coin.short, font: { size: 12, weight: "heavy", family: "Menlo" }, textColor: theme.title },
        { type: "spacer" },
        {
          type: "stack",
          direction: "column",
          alignItems: "trailing",
          children: [
            { type: "text", text: "$" + formatPrice(data.price), font: { size: 11, weight: "bold", family: "Menlo" }, textColor: theme.price },
            { type: "text", text: (isUp ? "+" : "") + data.change.toFixed(1) + "%", font: { size: 9, weight: "heavy", family: "Menlo" }, textColor: isUp ? theme.up : theme.down }
          ]
        }
      ]
    };
  };

  const isMedium = ctx.widgetFamily === "systemMedium" || !ctx.widgetFamily;
  const leftSide = COIN_CONFIG.slice(0, 4).map(c => renderRow(c));
  const rightSide = COIN_CONFIG.slice(4, 8).map(c => renderRow(c));

  return {
    type: "widget",
    padding: 14,
    backgroundColor: theme.bg,
    refreshPolicy: { onEnter: true, timeout: 60 },
    children: [
      // 头部 (仿照招行/BWH 简洁头部)
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        children: [
          { type: "image", src: "sf-symbol:chart.bar.fill", width: 14, height: 14, color: theme.label },
          { type: "spacer", length: 6 },
          { type: "text", text: "MARKET CENTER", font: { size: 13, weight: "heavy" }, textColor: theme.title },
          { type: "spacer" },
          { type: "text", text: "Binance Feed", font: { size: 9, weight: "bold" }, textColor: theme.time }
        ]
      },
      { type: "spacer", length: 10 },
      // 招行分割线颜色
      { type: "stack", height: 0.5, backgroundColor: theme.card },
      { type: "spacer", length: 12 },
      
      // 主体内容
      isMedium ? {
        type: "stack",
        direction: "row",
        gap: 20,
        children: [
          { type: "stack", direction: "column", gap: 10, flex: 1, children: leftSide },
          { type: "stack", width: 0.5, backgroundColor: theme.card, marginTop: 4, marginBottom: 4 },
          { type: "stack", direction: "column", gap: 10, flex: 1, children: rightSide }
        ]
      } : { 
        type: "stack", direction: "column", gap: 10, children: leftSide 
      },
      
      { type: "spacer" },
      
      // 底部时间
      {
        type: "stack",
        direction: "row",
        justifyContent: "center",
        children: [
          { 
            type: "text", 
            text: `更新时间: ${new Date().toLocaleTimeString('zh-CN', {hour12:false})}`, 
            font: { size: 8 }, 
            textColor: theme.time 
          }
        ]
      }
    ]
  };
}
