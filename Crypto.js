/**
 * 🚀 交易所行情看板 Pro (BTC/ETH/BNB/SOL)
 * 特性：实时金价、24h 涨跌幅颜色自适应、iOS 原生深浅模式
 */
export default async function(ctx) {
  // ===================== iOS 深浅自适应颜色定义 =====================
  const BG_MAIN   = { light: '#FFFFFF', dark: '#0D0D1A' }; 
  const C_MAIN    = { light: '#1C1C1E', dark: '#FFFFFF' }; 
  const C_SUB     = { light: '#8E8E93', dark: '#A2A2B5' }; 
  const C_TITLE   = { light: '#1C1C1E', dark: '#FFFFFF' }; 
  
  const C_GREEN   = { light: '#34C759', dark: '#32D74B' }; // 涨
  const C_RED     = { light: '#FF3B30', dark: '#FF453A' }; // 跌
  const IC_GOLD   = { light: '#FF9500', dark: '#FFD700' }; // 金色图标

  // ===================== 核心配置 =====================
  const symbols = [
    { id: 'BTCUSDT', name: 'Bitcoin', short: 'BTC', icon: 'bitcoinsign.circle.fill' },
    { id: 'ETHUSDT', name: 'Ethereum', short: 'ETH', icon: 'suit.diamond.fill' },
    { id: 'BNBUSDT', name: 'Binance', short: 'BNB', icon: 'hexagon.fill' },
    { id: 'SOLUSDT', name: 'Solana', short: 'SOL', icon: 's.circle.fill' }
  ];

  // ===================== 数据抓取逻辑 =====================
  const fetchTicker = async (symbol) => {
    try {
      // 使用币安 24hr 价格变动统计接口
      const res = await ctx.http.get(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`, { timeout: 3000 });
      const data = JSON.parse(await res.text());
      return {
        price: parseFloat(data.lastPrice).toLocaleString('en-US', { minimumFractionDigits: 2 }),
        change: parseFloat(data.priceChangePercent).toFixed(2),
        isUp: parseFloat(data.priceChangePercent) >= 0
      };
    } catch (e) {
      return { price: "Error", change: "0.00", isUp: true };
    }
  };

  // 并发请求所有币种行情
  const results = await Promise.all(symbols.map(s => fetchTicker(s.id)));

  // ===================== 统一 Row 组件 =====================
  const CryptoRow = (icon, label, price, change, isUp) => {
    const changeColor = isUp ? C_GREEN : C_RED;
    const changeSign = isUp ? "+" : "";
    
    return {
      type: 'stack', direction: 'row', alignItems: 'center', gap: 8,
      children: [
        { type: 'image', src: `sf-symbol:${icon}`, color: IC_GOLD, width: 15, height: 15 },
        { 
          type: 'stack', direction: 'column', spacing: 1, 
          children: [
            { type: 'text', text: label, font: { size: 12, weight: 'bold' }, textColor: C_MAIN },
          ]
        },
        { type: 'spacer' },
        { 
          type: 'stack', direction: 'column', alignItems: 'trailing',
          children: [
            { type: 'text', text: `$${price}`, font: { size: 12, weight: 'bold', family: 'Menlo' }, textColor: C_MAIN },
            { type: 'text', text: `${changeSign}${change}%`, font: { size: 10, weight: 'heavy' }, textColor: changeColor }
          ]
        }
      ]
    };
  };

  // ===================== 组件渲染 =====================
  return {
    type: 'widget',
    padding: 16,
    backgroundColor: BG_MAIN,
    refreshPolicy: { onEnter: true, timeout: 60 }, // 市场行情建议 1 分钟刷新一次
    children: [
      // 头部
      { type: 'stack', direction: 'row', alignItems: 'center', gap: 6, children: [
          { type: 'image', src: 'sf-symbol:chart.line.uptrend.xyaxis', color: C_TITLE, width: 16, height: 16 },
          { type: 'text', text: "Market Quotes", font: { size: 14, weight: 'heavy' }, textColor: C_TITLE },
          { type: 'spacer' },
          { type: 'text', text: "Live", font: { size: 10, weight: 'bold' }, textColor: C_GREEN }
      ]},
      
      { type: 'spacer', length: 14 },

      // 币种列表
      { 
        type: 'stack', 
        direction: 'column', 
        gap: 10, 
        children: symbols.map((coin, index) => {
          const data = results[index];
          return CryptoRow(coin.icon, coin.short, data.price, data.change, data.isUp);
        })
      },
      
      { type: 'spacer' },
      
      // 底部更新时间
      {
        type: 'text',
        text: `Updated: ${new Date().toLocaleTimeString('en-GB', { hour12: false })}`,
        font: { size: 9 },
        textColor: C_SUB,
        alignment: 'center'
      }
    ]
  };
}
