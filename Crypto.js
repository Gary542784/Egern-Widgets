/**
 * 🚀 加密货币看板 Pro (纯黑白自适应版)
 * 彻底去蓝，完全同步网络看板 Pro 风格
 */
export default async function(ctx) {
  // ===================== 极致深浅自适应色板 =====================
  // 背景：纯白 / 纯黑
  const BG_MAIN   = { light: '#FFFFFF', dark: '#000000' }; 
  // 主文字：纯黑 / 纯白
  const C_MAIN    = { light: '#000000', dark: '#FFFFFF' }; 
  // 副文字：灰色
  const C_SUB     = { light: '#8E8E93', dark: '#8E8E93' }; 
  
  const C_GREEN   = { light: '#34C759', dark: '#32D74B' }; 
  const C_RED     = { light: '#FF3B30', dark: '#FF453A' }; 
  const IC_GOLD   = { light: '#FF9500', dark: '#FFD700' };

  // ===================== 配置 =====================
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

  // ===================== 格式化 =====================
  const formatPrice = (p) => {
    if (p >= 1000) return "$" + p.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return "$" + (p >= 1 ? p.toFixed(2) : p.toFixed(4));
  };
  const formatChange = (c) => (c >= 0 ? "+" : "") + c.toFixed(1) + "%";

  // ===================== 统一 Row 组件 =====================
  const CoinRow = (id, data) => {
    const info = COIN_MAP[id];
    const change = data.usd_24h_change || 0;
    const changeCol = change >= 0 ? C_GREEN : C_RED;

    return {
      type: 'stack', direction: 'row', alignItems: 'center', gap: 8,
      children: [
        { type: 'image', src: `sf-symbol:${info.icon}`, color: info.color, width: 13, height: 13 },
        { type: 'text', text: info.symbol, font: { size: 12, weight: 'semibold' }, textColor: C_MAIN },
        { type: 'spacer' },
        { type: 'text', text: formatPrice(data.usd), font: { size: 12, weight: 'bold', family: 'Menlo' }, textColor: C_MAIN },
        { type: 'stack', direction: 'row', alignItems: 'center', justifyContent: 'end', width: 50, children: [
          { type: 'text', text: formatChange(change), font: { size: 11, weight: 'bold', family: 'Menlo' }, textColor: changeCol }
        ]}
      ]
    };
  };

  // ===================== 数据抓取 =====================
  let prices = {}, delay = 0;
  const start = Date.now();
  try {
    const res = await ctx.http.get(API_URL, { timeout: 4000 });
    prices = await res.json();
    delay = Date.now() - start;
  } catch (e) {}

  const coinIds = Object.keys(COIN_MAP).filter(id => prices[id]);

  // ===================== 最终渲染 =====================
  return {
    type: 'widget',
    padding: 15,
    backgroundColor: BG_MAIN, // 关键：此处已改为纯黑/纯白
    refreshPolicy: { onEnter: true, timeout: 60 },
    children: [
      // 头部
      { type: 'stack', direction: 'row', alignItems: 'center', children: [
          { type: 'image', src: "sf-symbol:chart.bar.fill", color: IC_GOLD, width: 15, height: 15 },
          { type: 'spacer', length: 6 },
          { type: 'text', text: "Crypto Price", font: { size: 14, weight: 'heavy' }, textColor: C_MAIN },
          { type: 'spacer' },
          { type: 'text', text: delay > 0 ? `${delay}ms` : "Offline", font: { size: 10, family: 'Menlo' }, textColor: C_SUB }
      ]},
      
      { type: 'spacer', length: 14 },
      
      // 币种列表
      { type: 'stack', direction: 'column', gap: 8, children: 
          coinIds.length > 0 ? 
          coinIds.map(id => CoinRow(id, prices[id])) : 
          [{ type: 'text', text: "No Data Available", font: { size: 12 }, textColor: C_SUB }]
      },
      
      { type: 'spacer' },
      
      // 底部
      { type: 'stack', direction: 'row', alignItems: 'center', children: [
          { type: 'image', src: "sf-symbol:arrow.clockwise.circle", color: C_SUB, width: 10, height: 10 },
          { type: 'spacer', length: 4 },
          { type: 'date', date: new Date().toISOString(), format: "time", font: { size: 10 }, textColor: C_SUB },
          { type: 'spacer' },
          { type: 'text', text: "PRO BOARD", font: { size: 9, weight: 'bold' }, textColor: C_SUB }
      ]}
    ]
  };
}