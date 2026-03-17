/**
 * 🚀 交易所行情看板 Pro (iOS 深浅自适应)
 * 集成：主流币实时价、24h涨跌幅、成交量趋势、多端点容错机制
 */
export default async function(ctx) {
  // ===================== iOS 深浅自适应原生颜色 =====================
  const BG_MAIN   = { light: '#FFFFFF', dark: '#0D0D1A' }; // 纯白 / 深紫黑
  const C_MAIN    = { light: '#1C1C1E', dark: '#FFFFFF' }; // 标题：黑 / 白
  const C_SUB     = { light: '#8E8E93', dark: '#A2A2B5' }; // 副标题：灰 / 蓝灰
  
  const C_GREEN   = { light: '#34C759', dark: '#32D74B' }; // 涨：iOS绿
  const C_RED     = { light: '#FF3B30', dark: '#FF453A' }; // 跌：iOS红
  const IC_GOLD   = { light: '#FF9500', dark: '#FFD700' }; // 图标：橙 / 金

  // ===================== 币种配置 =====================
  // 可根据需要增减，建议不超过 5 个以保持小组件美观
  const symbols = [
    { id: 'BTCUSDT', name: 'Bitcoin', short: 'BTC', icon: 'bitcoinsign.circle.fill' },
    { id: 'ETHUSDT', name: 'Ethereum', short: 'ETH', icon: 'suit.diamond.fill' },
    { id: 'BNBUSDT', name: 'Binance', short: 'BNB', icon: 'hexagon.fill' },
    { id: 'SOLUSDT', name: 'Solana', short: 'SOL', icon: 's.circle.fill' },
    { id: 'DOGEUSDT', name: 'Dogecoin', short: 'DOGE', icon: 'pawprint.fill' }
  ];

  // ===================== 数据抓取核心逻辑 =====================
  const fetchTicker = async (symbol) => {
    // 采用币安多端点备份逻辑，增强稳定性
    const apiUrls = [
      `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`,
      `https://api1.binance.com/api/v3/ticker/24hr?symbol=${symbol}`,
      `https://api3.binance.com/api/v3/ticker/24hr?symbol=${symbol}`
    ];

    for (const url of apiUrls) {
      try {
        const res = await ctx.http.get(url, { 
          timeout: 3000,
          headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }
        });
        if (res && res.status === 200) {
          const data = JSON.parse(await res.text());
          return {
            price: parseFloat(data.lastPrice).toLocaleString('en-US', { 
              minimumFractionDigits: data.lastPrice < 1 ? 4 : 2 
            }),
            change: parseFloat(data.priceChangePercent).toFixed(2),
            volume: (parseFloat(data.quoteVolume) / 1000000).toFixed(1) + "M",
            isUp: parseFloat(data.priceChangePercent) >= 0,
            error: false
          };
        }
      } catch (e) { continue; }
    }
    return { price: "---", change: "0.00", volume: "0", isUp: true, error: true };
  };

  // ===================== 并发请求 =====================
  const results = await Promise.all(symbols.map(s => fetchTicker(s.id)));
  const updateTime = new Date().toLocaleTimeString('zh-CN', { hour12: false });

  // ===================== 统一 UI 行组件 =====================
  const CryptoRow = (icon, label, price, change, volume, isUp, isError) => {
    const statusColor = isError ? C_SUB : (isUp ? C_GREEN : C_RED);
    const trendIcon = isUp ? "arrow.up.right" : "arrow.down.right";

    return {
      type: 'stack', direction: 'row', alignItems: 'center', gap: 10,
      children: [
        // 左侧图标
        { type: 'image', src: `sf-symbol:${icon}`, color: IC_GOLD, width: 14, height: 14 },
        // 币种名称
        { type: 'text', text: label, font: { size: 12, weight: 'heavy' }, textColor: C_MAIN },
        { type: 'spacer' },
        // 中间价格
        { 
          type: 'stack', direction: 'column', alignItems: 'trailing', gap: 0,
          children: [
            { type: 'text', text: `$${price}`, font: { size: 12, weight: 'bold', family: 'Menlo' }, textColor: C_MAIN },
            { type: 'text', text: `Vol ${volume}`, font: { size: 8 }, textColor: C_SUB }
          ]
        },
        // 右侧涨跌幅 (胶囊样式感)
        { 
          type: 'stack', 
          direction: 'row', 
          alignItems: 'center', 
          padding: { left: 6, right: 6, top: 2, bottom: 2 },
          backgroundColor: { light: isUp ? '#E7F9ED' : '#FEEBEA', dark: isUp ? '#1C3A27' : '#3D1B1A' }, // 浅色背景增强对比
          cornerRadius: 4,
          children: [
            { type: 'image', src: `sf-symbol:${trendIcon}`, color: statusColor, width: 8, height: 8 },
            { type: 'spacer', length: 2 },
            { type: 'text', text: `${Math.abs(change)}%`, font: { size: 10, weight: 'heavy', family: 'Menlo' }, textColor: statusColor }
          ]
        }
      ]
    };
  };

  // ===================== 渲染输出 =====================
  return {
    type: 'widget',
    padding: 14,
    backgroundColor: BG_MAIN,
    refreshPolicy: { onEnter: true, onNetworkChange: true, timeout: 60 },
    children: [
      // 顶部标题栏
      { type: 'stack', direction: 'row', alignItems: 'center', gap: 6, children: [
          { type: 'image', src: 'sf-symbol:chart.bar.fill', color: C_TITLE, width: 15, height: 15 },
          { type: 'text', text: "MARKET PRO", font: { size: 14, weight: 'heavy' }, textColor: C_TITLE },
          { type: 'spacer' },
          { 
            type: 'stack', direction: 'row', alignItems: 'center', gap: 4, children: [
              { type: 'circle', color: C_GREEN, width: 6, height: 6 },
              { type: 'text', text: "NORMAL", font: { size: 10, weight: 'bold' }, textColor: C_SUB }
            ]
          }
      ]},
      
      { type: 'spacer', length: 12 },

      // 币种行情列表
      { 
        type: 'stack', 
        direction: 'column', 
        gap: 10, 
        children: symbols.map((coin, index) => {
          const d = results[index];
          return CryptoRow(coin.icon, coin.short, d.price, d.change, d.volume, d.isUp, d.error);
        })
      },
      
      { type: 'spacer' },
      
      // 底部更新时间
      {
        type: 'stack', direction: 'row', justifyContent: 'center', children: [
          { type: 'text', text: `Updated at ${updateTime}`, font: { size: 9 }, textColor: C_SUB }
        ]
      }
    ]
  };
}
