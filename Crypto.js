/**
 * 🚀 Crypto Price Widget - Egern Adaptive Pro
 * ✨ 特色：完美恢复原版双列/卡片布局，纯黑白高级自适应配色，支持全尺寸
 */
export default async function(ctx) {
  // --- 1. 统一定义 Egern 自适应颜色对象 ---
  const THEME = {
    bg:      { light: '#FFFFFF', dark: '#000000' }, // 纯粹的黑白背景
    text:    { light: '#000000', dark: '#FFFFFF' }, // 主文字黑白反转
    textSec: { light: '#8E8E93', dark: '#A2A2B5' }, // 副标题灰度（夜间稍亮保证可读性）
    line:    { light: '#E5E5EA', dark: '#1C1C1E' }, // 分割线颜色
    accent:  { light: '#000000', dark: '#FFFFFF' }, // 强调色去蓝，改为纯黑白
    green:   { light: '#34C759', dark: '#32D74B' }, // 涨：系统原生绿
    red:     { light: '#FF3B30', dark: '#FF375F' }  // 跌：系统原生红
  };

  const COINS = "bitcoin,ethereum,solana,binancecoin,ripple,dogecoin,cardano,avalanche-2";
  const API_URL = `https://api.coingecko.com/api/v3/simple/price?ids=${COINS}&vs_currencies=usd&include_24hr_change=true`;

  // 币种品牌色保持纯色，不受深浅模式影响，用于生成半透明背景
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

  const ALL_IDS = Object.keys(COIN_MAP);

  // --- 2. 格式化工具 ---
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

  // --- 3. UI 基础构建块 (适配 THEME 颜色) ---
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
    colors: [color + "33", color + "11"], // 币种半透明渐变，使用原始品牌色
    startPoint: { x: 0, y: 0 },
    endPoint: { x: 1, y: 1 },
  });

  // --- 4. 共享组件 ---
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

  // --- 5. 核心布局区块 ---
  const CARD_PRESETS = {
    small:  { layout: "column", iconSize: 14, priceSize: 15, symbolSize: 12, changeSize: 11, changeIconSize: 8,  borderRadius: 10, padding: [8, 10, 8, 10],   borderWidth: 0.5, nameSize: 0,  innerGap: 3 },
    medium: { layout: "row",    iconSize: 20, priceSize: 18, symbolSize: 16, changeSize: 13, changeIconSize: 10, borderRadius: 14, padding: [10, 12, 10, 12], borderWidth: 1,   nameSize: 10, innerGap: 6 },
    large:  { layout: "row",    iconSize: 26, priceSize: 24, symbolSize: 18, changeSize: 15, changeIconSize: 12, borderRadius: 14, padding: [14, 16, 14, 16], borderWidth: 1,   nameSize: 11, innerGap: 8 },
  };

  const coinCard = (id, data, variant) => {
    const info = COIN_MAP[id];
    const change = data.usd_24h_change;
    const p = CARD_PRESETS[variant];

    const changeRow = hstack([
      icon(changeIcon(change), p.changeIconSize, changeColor(change)),
      txt(formatChange(change), p.changeSize, "semibold", changeColor(change)),
    ], { gap: 2 });

    const cardOpts = {
      gap: p.innerGap,
      padding: p.padding,
      backgroundGradient: cardGradient(info.color),
      borderRadius: p.borderRadius,
      borderWidth: p.borderWidth,
      borderColor: info.color + "44",
    };

    if (p.layout === "column") {
      return vstack([
        hstack([coinIcon(info, p.iconSize), txt(info.symbol, p.symbolSize, "bold", THEME.text)], { gap: 4 }),
        txt(formatPrice(data.usd), p.priceSize, "semibold", THEME.text, { minScale: 0.6, maxLines: 1 }),
        changeRow,
      ], cardOpts);
    }

    const nameItems = [txt(info.symbol, p.symbolSize, "heavy", THEME.text)];
    if (p.nameSize) nameItems.push(txt(info.name, p.nameSize, "medium", THEME.textSec));

    return vstack([
      hstack([
        coinIcon(info, p.iconSize),
        vstack(nameItems, { gap: 0 }),
        spacer(),
        vstack([
          txt(formatPrice(data.usd), p.priceSize, "bold", THEME.text),
          changeRow,
        ], { alignItems: "end", gap: 1 }),
      ], { gap: p.innerGap }),
    ], cardOpts);
  };

  const coinRow = (id, data, compact) => {
    const info = COIN_MAP[id];
    const change = data.usd_24h_change;
    const sz = compact ? 11 : 13;
    const iconSz = compact ? 11 : 14;

    return hstack([
      coinIcon(info, iconSz),
      txt(info.symbol, sz, "medium", THEME.text, { maxLines: 1 }),
      spacer(),
      txt(formatPrice(data.usd), sz, "semibold", THEME.text, { maxLines: 1, minScale: 0.7 }),
      txt(formatChange(change), sz, "medium", changeColor(change)),
    ], { gap: compact ? 4 : 6 });
  };

  const rowGroup = (items, gap) => vstack(items, { gap: gap || 6 });
  const filterAvailable = (ids, prices) => ids.filter(id => prices[id]);

  // --- 6. Widget 容器组装 ---
  const systemWidget = (padding, children, extraOpts = {}) => ({
    type: "widget",
    gap: 0,
    padding: padding,
    backgroundColor: THEME.bg, // 纯色黑白自适应底色
    children: children,
    ...extraOpts
  });

  const systemBody = (title, titleSize, iconSize, bodyChildren) => [
    headerBar(title, titleSize, iconSize, true),
    spacer(6),
    separator(),
    spacer(),
    ...bodyChildren,
    spacer(),
    footerBar(),
  ];

  // --- 7. 多尺寸渲染逻辑 ---
  const buildSystemSmall = (prices) => {
    const rows = filterAvailable(["bitcoin", "ethereum", "solana", "binancecoin"], prices)
      .map(id => coinRow(id, prices[id], true));
    return systemWidget([12, 14, 10, 14], systemBody("Crypto", 13, 14, [rowGroup(rows, 6)]));
  };

  const buildSystemMedium = (prices) => {
    const ids = filterAvailable(ALL_IDS, prices);
    const left = ids.slice(0, 4).map(id => coinRow(id, prices[id], true));
    const right = ids.slice(4).map(id => coinRow(id, prices[id], true));

    return systemWidget([12, 14, 10, 14], systemBody("Crypto Tracker", 14, 18, [
      hstack([
        rowGroup(left, 5),
        vstack([], { width: 0.5, height: 100, backgroundColor: THEME.line }),
        rowGroup(right, 5),
      ], { alignItems: "start", gap: 10 }),
    ]));
  };

  const buildSystemLarge = (prices) => {
    const featured = filterAvailable(["bitcoin", "ethereum"], prices)
      .map(id => coinCard(id, prices[id], "medium"));
    const restIds = ALL_IDS.filter(id => id !== "bitcoin" && id !== "ethereum");
    const rows = filterAvailable(restIds, prices)
      .map(id => coinRow(id, prices[id], true));

    return systemWidget([12, 14, 10, 14], systemBody("Crypto Tracker", 16, 20, [
      rowGroup(featured, 8),
      spacer(),
      sectionLabel("MARKET"),
      spacer(4),
      rowGroup(rows, 6),
    ]));
  };

  const buildSystemExtraLarge = (prices) => {
    const featured = filterAvailable(["bitcoin", "ethereum", "solana"], prices)
      .map(id => coinCard(id, prices[id], "large"));
    const restIds = ALL_IDS.filter(id => !["bitcoin", "ethereum", "solana"].includes(id));
    const restCards = filterAvailable(restIds, prices)
      .map(id => coinCard(id, prices[id], "small"));

    return systemWidget([14, 16, 12, 16], systemBody("Crypto Tracker", 20, 24, [
      hstack(featured, { gap: 10 }),
      spacer(),
      sectionLabel("MARKET"),
      spacer(4),
      hstack(restCards, { gap: 8 }),
    ]));
  };

  const BUILDERS = {
    systemSmall: buildSystemSmall,
    systemMedium: buildSystemMedium,
    systemLarge: buildSystemLarge,
    systemExtraLarge: buildSystemExtraLarge,
  };

  // --- 8. 主入口请求逻辑 ---
  const family = ctx.widgetFamily;
  try {
    const resp = await ctx.http.get(API_URL);
    const prices = await resp.json();
    const build = BUILDERS[family] || buildSystemMedium;
    const widget = build(prices);
    
    // 设置刷新策略
    widget.refreshAfter = new Date(Date.now() + 60 * 1000).toISOString();
    return widget;
  } catch (e) {
    return {
      type: "widget", padding: 16, backgroundColor: THEME.bg,
      children: [{ type: "text", text: "Failed to load prices", font: { size: 14, weight: "medium" }, textColor: THEME.red }]
    };
  }
}
