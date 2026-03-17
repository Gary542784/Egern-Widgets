/*
 * Crypto Price Widget - 彻底修复 iOS 深浅自适应 纯色版
 * 获取主流加密货币实时价格，自动适配日间/夜间模式
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

const ALL_IDS = Object.keys(COIN_MAP);
const CACHE_KEY = "crypto_prices_cache";
const CACHE_TTL = 60 * 1000;

function loadCache(ctx) {
  const cache = ctx.storage.getJSON(CACHE_KEY);
  if (!cache) return null;
  if (Date.now() - cache.ts < CACHE_TTL) return cache.prices;
  return null;
}

function saveCache(ctx, prices) {
  ctx.storage.setJSON(CACHE_KEY, { ts: Date.now(), prices: prices });
}

export default async function(ctx) {
  // ✨ 核心：环境探针，精准抓取 iOS 深浅模式
  const isDark = ctx?.device?.colorScheme === 'dark';

  // 🎨 iOS 深浅自适应原生颜色配置
  const BG_MAIN    = isDark ? '#0D0D1A' : '#FFFFFF'; // 深色黑紫，浅色纯白
  const TEXT_MAIN  = isDark ? '#FFFFFF' : '#1C1C1E'; // 深色纯白，浅色纯黑
  const TEXT_SUB   = isDark ? '#EBEBF5' : '#8E8E93'; // 副标题
  const TEXT_MUTED = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'; // 弱化文本
  const DIVIDER    = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'; // 分割线
  
  const C_GREEN    = isDark ? '#32D74B' : '#34C759'; // 涨 (iOS 绿)
  const C_RED      = isDark ? '#FF453A' : '#FF3B30'; // 跌 (iOS 红)
  const C_GOLD     = isDark ? '#FFD700' : '#FF9500'; // 标题强调色

  // --- 基础数据格式化 ---
  function formatPrice(price) {
    if (price >= 1000) return "$" + price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    if (price >= 1) return "$" + price.toFixed(2);
    return "$" + price.toFixed(4);
  }

  function formatChange(change) {
    if (change == null) return "+0.0%";
    const sign = change >= 0 ? "+" : "";
    return sign + change.toFixed(1) + "%";
  }

  function changeColor(change) {
    return change >= 0 ? C_GREEN : C_RED;
  }

  function changeIcon(change) {
    return change >= 0 ? "arrow.up.right" : "arrow.down.right";
  }

  // --- DSL UI 构造器 ---
  function txt(text, fontSize, weight, color, opts) {
    const el = {
      type: "text",
      text: text,
      font: { weight: weight || "regular", size: fontSize, family: "Menlo" },
    };
    if (color !== null) el.textColor = color || TEXT_MAIN;
    if (opts) { for (let k in opts) el[k] = opts[k]; }
    return el;
  }

  function icon(systemName, size, tintColor, opts) {
    const el = {
      type: "image",
      src: "sf-symbol:" + systemName,
      width: size,
      height: size,
    };
    if (tintColor) el.color = tintColor;
    if (opts) { for (let k in opts) el[k] = opts[k]; }
    return el;
  }

  function hstack(children, opts) {
    const el = { type: "stack", direction: "row", alignItems: "center", children: children };
    if (opts) { for (let k in opts) el[k] = opts[k]; }
    return el;
  }

  function vstack(children, opts) {
    const el = { type: "stack", direction: "column", alignItems: "start", children: children };
    if (opts) { for (let k in opts) el[k] = opts[k]; }
    return el;
  }

  function spacer(length) {
    const el = { type: "spacer" };
    if (length != null) el.length = length;
    return el;
  }

  function dateTxt(dateStr, style, fontSize, weight, color) {
    return {
      type: "date",
      date: dateStr,
      format: style,
      font: { size: fontSize, weight: weight || "medium" },
      textColor: color || TEXT_SUB,
    };
  }

  function coinIcon(info, size) {
    const pad = Math.round(size * 0.3);
    const total = size + pad * 2;
    return vstack([icon(info.icon, size, info.color)], {
      alignItems: "center",
      padding: [pad, pad, pad, pad],
      backgroundColor: info.color + (isDark ? "33" : "22"),
      borderRadius: total / 2,
    });
  }

  // --- 共享 UI 组件 ---
  function separator() {
    return hstack([spacer()], { height: 1, backgroundColor: DIVIDER });
  }

  function headerBar(title, titleSize, iconSize, showTime) {
    const children = [
      icon("chart.line.uptrend.xyaxis.circle.fill", iconSize, C_GOLD),
      txt(title, titleSize, "heavy", C_GOLD, {
        shadowColor: isDark ? "rgba(255,215,0,0.3)" : "rgba(255,149,0,0.2)",
        shadowRadius: 4,
        shadowOffset: { x: 0, y: 0 },
      }),
      spacer(),
    ];
    if (showTime) {
      children.push(dateTxt(new Date().toISOString(), "time", Math.max(9, titleSize - 4), "medium", TEXT_SUB));
    }
    return hstack(children, { gap: 4 });
  }

  function footerBar() {
    return hstack([
      icon("clock.arrow.circlepath", 8, TEXT_MUTED),
      dateTxt(new Date().toISOString(), "relative", 9, "medium", TEXT_MUTED),
      spacer(),
      txt("CoinGecko", 8, "medium", TEXT_MUTED),
    ], { gap: 3 });
  }

  function sectionLabel(label) {
    return txt(label, 10, "semibold", TEXT_SUB);
  }

  // --- 行 / 卡片 构造器 ---
  const CARD_PRESETS = {
    small:  { layout: "column", iconSize: 14, priceSize: 15, symbolSize: 12, changeSize: 11, changeIconSize: 8,  borderRadius: 10, padding: [8, 10, 8, 10],   borderWidth: 0.5, nameSize: 0,  innerGap: 3 },
    medium: { layout: "row",    iconSize: 20, priceSize: 18, symbolSize: 16, changeSize: 13, changeIconSize: 10, borderRadius: 14, padding: [10, 12, 10, 12], borderWidth: 1,   nameSize: 10, innerGap: 6 },
    large:  { layout: "row",    iconSize: 26, priceSize: 24, symbolSize: 18, changeSize: 15, changeIconSize: 12, borderRadius: 14, padding: [14, 16, 14, 16], borderWidth: 1,   nameSize: 11, innerGap: 8 },
  };

  function coinCard(id, data, variant) {
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
      backgroundColor: info.color + (isDark ? "22" : "15"), // 动态适应深浅背景透明度
      borderRadius: p.borderRadius,
      borderWidth: p.borderWidth,
      borderColor: info.color + (p.borderWidth >= 1 ? (isDark ? "55" : "33") : (isDark ? "44" : "22")),
    };

    if (p.layout === "column") {
      return vstack([
        hstack([coinIcon(info, p.iconSize), txt(info.symbol, p.symbolSize, "bold", TEXT_MAIN)], { gap: 4 }),
        txt(formatPrice(data.usd), p.priceSize, "semibold", TEXT_MAIN, { minScale: 0.6, maxLines: 1 }),
        changeRow,
      ], cardOpts);
    }

    const nameItems = [txt(info.symbol, p.symbolSize, "heavy", TEXT_MAIN)];
    if (p.nameSize) {
      nameItems.push(txt(info.name, p.nameSize, "medium", TEXT_SUB));
    }

    return vstack([
      hstack([
        coinIcon(info, p.iconSize),
        vstack(nameItems, { gap: 0 }),
        spacer(),
        vstack([
          txt(formatPrice(data.usd), p.priceSize, "bold", TEXT_MAIN),
          changeRow,
        ], { alignItems: "end", gap: 1 }),
      ], { gap: p.innerGap }),
    ], cardOpts);
  }

  function coinRow(id, data, compact) {
    const info = COIN_MAP[id];
    const change = data.usd_24h_change;
    const sz = compact ? 11 : 13;
    const iconSz = compact ? 11 : 14;

    return hstack([
      coinIcon(info, iconSz),
      txt(info.symbol, sz, "medium", TEXT_MAIN, { maxLines: 1 }),
      spacer(),
      txt(formatPrice(data.usd), sz, "semibold", TEXT_MAIN, { maxLines: 1, minScale: 0.7 }),
      txt(formatChange(change), sz, "medium", changeColor(change)),
    ], { gap: compact ? 4 : 6 });
  }

  function rowGroup(items, gap) {
    return vstack(items, { gap: gap || 6 });
  }

  function filterAvailable(ids, prices) {
    return ids.filter(id => prices[id]);
  }

  // --- 系统面板外壳 ---
  function systemWidget(padding, children, extraOpts) {
    const opts = {
      type: "widget",
      gap: 0,
      padding: padding,
      backgroundColor: BG_MAIN, // 彻底拥抱原生纯色
      children: children,
    };
    if (extraOpts) { for (let k in extraOpts) opts[k] = opts[k] || extraOpts[k]; }
    return opts;
  }

  function systemBody(title, titleSize, iconSize, bodyChildren) {
    return [
      headerBar(title, titleSize, iconSize, true),
      spacer(6),
      separator(),
      spacer(),
    ].concat(bodyChildren).concat([
      spacer(),
      footerBar(),
    ]);
  }

  // --- 布局构造器 ---
  function buildAccessoryCircular(prices) {
    const btc = prices.bitcoin;
    const change = btc ? btc.usd_24h_change : 0;
    return {
      type: "widget",
      gap: 2,
      children: [
        spacer(),
        icon("bitcoinsign.circle.fill", 18),
        txt(btc ? formatPrice(btc.usd) : "--", 12, "bold", null, { minScale: 0.5 }),
        txt(btc ? formatChange(change) : "", 9, "medium", null, { minScale: 0.5 }),
        spacer(),
      ],
    };
  }

  function buildAccessoryRectangular(prices) {
    const ids = filterAvailable(["bitcoin", "ethereum", "solana", "binancecoin"], prices);
    const rows = ids.map(id => {
      const data = prices[id];
      const info = COIN_MAP[id];
      const change = data.usd_24h_change;
      return hstack([
        icon(info.icon, 9),
        vstack([txt(info.symbol, 10, "bold", null)], { width: 30, height: 12 }),
        spacer(),
        txt(formatPrice(data.usd), 10, "semibold", null, { minScale: 0.5, maxLines: 1 }),
        vstack([txt(formatChange(change), 9, "medium", null)], { alignItems: "end", width: 42, height: 12 }),
      ], { gap: 3 });
    });
    return { type: "widget", gap: 2, children: rows };
  }

  function buildAccessoryInline(prices) {
    const btc = prices.bitcoin;
    const eth = prices.ethereum;
    let text = "";
    if (btc) text += "BTC " + formatPrice(btc.usd) + " " + formatChange(btc.usd_24h_change);
    else text += "BTC --";
    if (eth) text += " | ETH " + formatPrice(eth.usd);
    return {
      type: "widget",
      children: [
        icon("bitcoinsign.circle.fill", 12),
        txt(text, 12, "medium", null, { minScale: 0.7, maxLines: 1 }),
      ],
    };
  }

  function buildSystemSmall(prices) {
    const rows = filterAvailable(["bitcoin", "ethereum", "solana", "binancecoin"], prices)
      .map(id => coinRow(id, prices[id], true));

    return systemWidget([12, 14, 10, 14], systemBody("Crypto", 13, 14, [ rowGroup(rows, 6) ]));
  }

  function buildSystemMedium(prices) {
    const ids = filterAvailable(ALL_IDS, prices);
    const left = ids.slice(0, 4).map(id => coinRow(id, prices[id], true));
    const right = ids.slice(4).map(id => coinRow(id, prices[id], true));

    return systemWidget([12, 14, 10, 14], systemBody("Crypto Tracker", 14, 18, [
        hstack([
          rowGroup(left, 5),
          vstack([], { width: 1, backgroundColor: DIVIDER }),
          rowGroup(right, 5),
        ], { alignItems: "start", gap: 10 }),
      ])
    );
  }

  function buildSystemLarge(prices) {
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
      ])
    );
  }

  function buildSystemExtraLarge(prices) {
    const featured = filterAvailable(["bitcoin", "ethereum", "solana"], prices)
      .map(id => coinCard(id, prices[id], "large"));

    const restIds = ALL_IDS.filter(id => id !== "bitcoin" && id !== "ethereum" && id !== "solana");
    const restCards = filterAvailable(restIds, prices)
      .map(id => coinCard(id, prices[id], "small"));

    return systemWidget([14, 16, 12, 16], systemBody("Crypto Tracker", 20, 24, [
        hstack(featured, { gap: 10 }),
        spacer(),
        sectionLabel("MARKET"),
        spacer(4),
        hstack(restCards, { gap: 8 }),
      ])
    );
  }

  function errorWidget() {
    return {
      type: "widget",
      padding: 16,
      backgroundColor: BG_MAIN,
      children: [
        icon("wifi.exclamationmark", 32, C_RED),
        txt("Failed to load prices", 14, "medium", C_RED),
      ],
    };
  }

  const BUILDERS = {
    accessoryCircular:    buildAccessoryCircular,
    accessoryRectangular: buildAccessoryRectangular,
    accessoryInline:      buildAccessoryInline,
    systemSmall:          buildSystemSmall,
    systemMedium:         buildSystemMedium,
    systemLarge:          buildSystemLarge,
    systemExtraLarge:     buildSystemExtraLarge,
  };

  function render(prices, family) {
    const build = BUILDERS[family] || buildSystemMedium;
    const widget = build(prices);
    widget.refreshAfter = new Date(Date.now() + 60 * 1000).toISOString();
    return widget;
  }

  // --- 主逻辑入口 ---
  const family = ctx.widgetFamily;
  const cached = loadCache(ctx);
  if (cached) {
    return render(cached, family);
  }

  try {
    const resp = await ctx.http.get(API_URL);
    const prices = await resp.json();
    saveCache(ctx, prices);
    return render(prices, family);
  } catch (e) {
    const staleCache = ctx.storage.getJSON(CACHE_KEY);
    if (staleCache) {
      return render(staleCache.prices, family);
    }
    return errorWidget();
  }
}
