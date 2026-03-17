/**
 * 🚀 加密货币看板 Pro (自适应纯色版)
 * 集成：主流币种实时价、24h 涨跌、交易所延迟、系统深浅色适配
 */
export default async function(ctx) {
  // ===================== iOS 深浅自适应原生颜色 (同步看板 Pro 风格) =====================
  const BG_MAIN   = { light: '#FFFFFF', dark: '#0D0D1A' }; 
  const C_MAIN    = { light: '#1C1C1E', dark: '#FFFFFF' }; 
  const C_SUB     = { light: '#8E8E93', dark: '#A2A2B5' }; 
  const C_TITLE   = { light: '#1C1C1E', dark: '#FFFFFF' }; 
  const C_GREEN   = { light: '#34C759', dark: '#32D74B' }; 
  const C_RED     = { light: '#FF3B30', dark: '#FF3B30' }; 
  const C_YELLOW  = { light: '#FF9500', dark: '#FFD700' }; 
  const IC_GOLD   = { light: '#FF9500', dark: '#FFD700' };

  // ===================== 配置与配置映射 =====================
  const COINS = "bitcoin,ethereum,solana,binancecoin,ripple,dogecoin";
  const API_URL = `https://api.coingecko.com/api/v3/simple/price?ids=${COINS}&vs_currencies=usd&include_24hr_change=true`;

  const COIN_MAP = {
    bitcoin:      { symbol: "BTC",  icon: "bitcoinsign.circle.fill",  color: "#F7931A" },
    ethereum:     { symbol: "ETH",  icon: "diamond.fill",             color: "#627EEA" },
    solana:       { symbol: "SOL",  icon: "sun.max.fill",             color: "#9945FF" },
    binancecoin:  { symbol: "BNB",  icon: "hexagon.fill",             color: "#F3BA2F" },
    ripple:       { symbol: "XRP",  icon: "drop.fill",                color: "#00AAE4" },
    dogecoin:     { symbol: "DOGE", icon: "hare.fill",                color: "#C3A634" }
  };

  // ===================== 辅助函数 =====================
  const formatPrice = (p) => {
    if (p >= 1000) return "$" + p.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return "$" + (p >= 1 ? p.toFixed(2) : p.toFixed(4));
  };

  const formatChange = (c) => (c >= 0 ? "+" : "") + c.toFixed(1) + "%";

  // ===================== Wstd 100% 统一 Row 组件 =====================
  const CoinRow = (id, data) => {
    const info = COIN_MAP[id];
    const change = data.usd_24h_change || 0;
    const changeCol = change >= 0 ? C_GREEN : C_RED;
    const changeIcon = change >= 0 ? "arrow.up.right" : "arrow.down.right";

    return {
      type: 'stack', direction: 'row', alignItems: 'center', gap: 6,
      children: [
        { type: 'image', src: `sf-symbol:${info.icon}`, color: info.color, width: 13, height: 13 },
        { type: 'text', text: info.symbol, font: { size: 11, weight: 'bold' }, textColor: C_MAIN },
        { type: 'spacer' },
        { type: 'text', text: formatPrice(data.usd), font: { size: 11, weight: 'bold', family: 'Menlo' }, textColor: C_MAIN },
        { type: 'stack', direction: 'row', alignItems: 'center', gap: 2, children: [
            { type: 'image', src: `sf-symbol:${changeIcon}`, color: changeCol, width: 8, height: 8 },
            { type: 'text', text: formatChange(change), font: { size: 10, weight: 'bold', family: 'Menlo' }, textColor: changeCol }
        ], width: 45, justifyContent: 'end' }
      ]
    };
  };

  // ===================== 数据获取 =====================
  let prices = {}, delay = 0, statusTxt = "Normal";
  const start = Date.now();

  try {
    const res = await ctx.http.get(API_URL, { timeout: 4000 });
    prices = await res.json();
    delay = Date.now() - start;
  } catch (e) {
    statusTxt = "Timeout";
  }

  const delayColor = delay > 0 && delay < 500 ? C_GREEN : (delay >= 500 ? C_YELLOW : C_RED);
  const coinIds = Object.keys(COIN_MAP).filter(id => prices[id]);

  // ===================== 渲染布局 =====================
  return {
    type: 'widget',
    padding: 14,
    backgroundColor: BG_MAIN, // 关键：深浅自适应背景
    refreshPolicy: { onEnter: true, timeout: 60 },
    children: [
      // Header 头部
      { type: 'stack', direction: 'row', alignItems: 'center', gap: 6, children: [
          { type: 'image', src: "sf-symbol:chart.line.uptrend.xyaxis.circle.fill", color: IC_GOLD, width: 16, height: 16 },
          { type: 'text', text: "Crypto Market", font: { size: 14, weight: 'heavy' }, textColor: C_TITLE },
          { type: 'spacer' },
          { type: 'text', text: delay > 0 ? `${delay}ms` : statusTxt, font: { size: 11, weight: 'bold', family: 'Menlo' }, textColor: delayColor }
      ]},
      { type: 'spacer', length: 12 },
      
      // 币种列表
      { type: 'stack', direction: 'column', gap: 5, children: 
          coinIds.length > 0 ? 
          coinIds.map(id => CoinRow(id, prices[id])) : 
          [{ type: 'text', text: "数据获取失败，请检查网络", font: { size: 11 }, textColor: C_SUB }]
      },
      
      { type: 'spacer' },
      
      // Footer 底部
      { type: 'stack', direction: 'row', alignItems: 'center', children: [
          { type: 'image', src: "sf-symbol:clock.arrow.circlepath", color: C_SUB, width: 9, height: 9 },
          { type: 'spacer', length: 4 },
          { type: 'date', date: new Date().toISOString(), format: "relative", font: { size: 9 }, textColor: C_SUB },
          { type: 'spacer' },
          { type: 'text', text: "CoinGecko Data", font: { size: 9 }, textColor: C_SUB }
      ]}
    ]
  };
}