/**
 * ==========================================
 * 📌 代码名称: 🪙 Crypto Price Widget (10币 高密度防溢出版)
 * ==========================================
 */
export default async function(ctx) {
  // 🎨 统一 UI 规范颜色
  const THEME = {
    bg:      { light: '#FFFFFF', dark: '#121212' }, 
    text:    { light: '#1C1C1E', dark: '#FFFFFF' }, 
    textSec: { light: '#8E8E93', dark: '#8E8E93' }, 
    line:    { light: '#E5E5EA', dark: '#38383A' }, 
    accent:  { light: '#1C1C1E', dark: '#FFFFFF' }, 
    green:   { light: '#34C759', dark: '#30D158' }, 
    red:     { light: '#FF3B30', dark: '#FF453A' }  
  };

  const COINS = "bitcoin,ethereum,solana,binancecoin,ripple,dogecoin,cardano,avalanche-2,chainlink,polkadot";
  const API_URL = `https://api.coingecko.com/api/v3/simple/price?ids=${COINS}&vs_currencies=usd&include_24hr_change=true`;

  const COIN_MAP = {
    bitcoin:      { symbol: "BTC",  name: "Bitcoin",   icon: "bitcoinsign.circle.fill",  color: "#F7931A" },
    ethereum:     { symbol: "ETH",  name: "Ethereum",  icon: "diamond.fill",             color: "#627EEA" },
    solana:       { symbol: "SOL",  name: "Solana",    icon: "sun.max.fill",             color: "#9945FF" },
    binancecoin:  { symbol: "BNB",  name: "BNB Chain", icon: "hexagon.fill",             color: "#F3BA2F" },
    ripple:       { symbol: "XRP",  name: "Ripple",    icon: "drop.fill",                color: "#00AAE4" },
    dogecoin:     { symbol: "DOGE", name: "Dogecoin",  icon: "hare.fill",                color: "#C3A634" },
    cardano:      { symbol: "ADA",  name: "Cardano",   icon: "circle.grid.cross.fill",   color: "#0033AD" },
    "avalanche-2":{ symbol: "AVAX", name: "Avalanche", icon: "triangle.fill",            color: "#E84142" },
    chainlink:    { symbol: "LINK", name: "Chainlink", icon: "link.circle.fill",         color: "#2A5ADA" }, 
    polkadot:     { symbol: "DOT",  name: "Polkadot",  icon: "p.circle.fill",            color: "#E6007A" }, 
  };

  const ALL_IDS = Object.keys(COIN_MAP);

  const formatPrice = (price) => {
    if (price >= 1000) return "$" + price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    if (price >= 1) return "$" + price.toFixed(2);
    return "$" + price.toFixed(4);
  };

  const formatChange = (change) => {
    if (change == null) return "+0.0%";
    const sign = change >= 0 ? "+" : "";
    return sign + change.toFixed(1) + "%";
  };

  const changeColor = (change) => change >= 0 ? THEME.green : THEME.red;
  const changeIcon = (change) => change >= 0 ? "arrow.up.right" : "arrow.down.right";

  const txt = (text, fontSize, weight, color, opts) => ({
    type: "text",
    text: text,
    font: { weight: weight || "regular", size: fontSize, family: "Menlo" },
    textColor: color || THEME.text,
    ...opts
  });

  const icon = (systemName, size, tintColor, opts) => ({
    type: "image",
    src: "sf-symbol:" + systemName,
    width: size,
    height: size,
    color: tintColor || THEME.text,
    ...opts
  });

  const hstack = (children, opts) => ({ type: "stack", direction: "row", alignItems: "center", children, ...opts });
  const vstack = (children, opts) => ({ type: "stack", direction: "column", alignItems: "start", children, ...opts });
  const spacer = (length) => length != null ? { type: "spacer", length } : { type: "spacer" };

  const dateTxt = (dateStr, style, fontSize, weight, color) => ({
    type: "date",
    date: dateStr,
    format: style,
    font: { size: fontSize, weight: weight || "medium" },
    textColor: color || THEME.textSec,
  });

  const coinIcon = (info, size) => {
    const pad = Math.round(size * 0.3);
    const total = size + pad * 2;
    return vstack([icon(info.icon, size, info.color)], {
      alignItems: "center",
      padding: [pad, pad, pad, pad],
      backgroundColor: info.color + "33",
      borderRadius: total / 2,
    });
  };

  const cardGradient = (color) => ({
    type: "linear",
    colors: [color + "33", color + "11"], 
    startPoint: { x: 0, y: 0 },
    endPoint: { x: 1, y: 1 },
  });

  const separator = () => hstack([spacer()], { height: 0.5, backgroundColor: THEME.line });

  const headerBar = (title, titleSize, iconSize, showTime) => {
    const children = [
      icon("chart.line.uptrend.xyaxis.circle.fill", iconSize, THEME.accent),
      txt(title, titleSize, "heavy", THEME.accent),
      spacer(),
    ];
    if (showTime) {
      children.push(dateTxt(new Date().toISOString(), "time", Math.max(9, titleSize - 4), "medium", THEME.textSec));
    }
    return hstack(children, { gap: 4 });
  };

  const footerBar = () => hstack([
    icon("clock.arrow.circlepath", 8, THEME.textSec),
    dateTxt(new Date().toISOString(), "relative", 9, "medium", THEME.textSec),
    spacer(),
    txt("CoinGecko", 8, "medium", THEME.textSec),
  ], { gap: 3 });

  const sectionLabel = (label) => txt(label, 10, "semibold", THEME.textSec);

  // 🌟 高密度单行渲染器
  const coinRow = (id, data, compact) => {
    const info = COIN_MAP[id];
    const change = data.usd_24h_change;
    // 💡 紧凑模式下字号缩小到 10，图标缩小到 10，防止纵向溢出
    const sz = compact ? 10 : 13;
    const iconSz = compact ? 10 : 14;

    return hstack([
      coinIcon(info, iconSz),
      txt(info.symbol, sz, "medium", THEME.text, { maxLines: 1 }),
      spacer(),
      txt(formatPrice(data.usd), sz, "semibold", THEME.text, { maxLines: 1, minScale: 0.7 }),
      txt(formatChange(change), sz, "medium", changeColor(change)),
    ], { gap: compact ? 3 : 6 }); // 💡 行内间距减小
  };

  const filterAvailable = (ids, prices) => ids.filter(id => prices[id]);

  const family = ctx.widgetFamily;
  try {
    const resp = await ctx.http.get(API_URL);
    const prices = await resp.json();
    
    let widget;
    
    // ==========================================
    // 中尺寸组件 (双列 10币 特供高度压缩布局)
    // ==========================================
    if (family === "systemMedium" || !family) {
      const ids = filterAvailable(ALL_IDS, prices);
      const halfIndex = Math.ceil(ids.length / 2);
      const left = ids.slice(0, halfIndex).map(id => coinRow(id, prices[id], true));
      const right = ids.slice(halfIndex).map(id => coinRow(id, prices[id], true));

      widget = {
        type: "widget",
        gap: 0,
        padding: [14, 16], // 保持系统卡片边缘对齐规范
        backgroundColor: THEME.bg,
        children: [
          headerBar("Crypto Tracker", 13, 14, true),
          spacer(4), // 💡 取消弹簧占位，写死极小间距
          separator(),
          spacer(4),
          hstack([
            vstack(left, { gap: 3, flex: 1 }), // 💡 5行的行距压缩至极小的 3px
            vstack([], { width: 0.5, height: 85, backgroundColor: THEME.line }), // 分割线高度限定
            vstack(right, { gap: 3, flex: 1 }),
          ], { alignItems: "center", gap: 8 }),
          spacer(4),
          footerBar(),
        ]
      };
    } 
    // 其他尺寸降级处理 (防崩溃)
    else {
      widget = {
        type: "widget", padding: [14, 16], backgroundColor: THEME.bg,
        children: [{ type: "text", text: "Please use Medium widget for 10 coins.", font: { size: 12 }, textColor: THEME.text }]
      };
    }

    widget.refreshAfter = new Date(Date.now() + 60 * 1000).toISOString();
    return widget;
  } catch (e) {
    return {
      type: "widget", padding: [14, 16], backgroundColor: THEME.bg,
      children: [{ type: "text", text: "网络加载失败或 API 限制", font: { size: 12, weight: "medium" }, textColor: THEME.red }]
    };
  }
}
