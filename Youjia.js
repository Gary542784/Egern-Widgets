/**
 * ⛽ 全国油价（极致黑白自适应 - 调价日期修复版）
 * 🛠 修复：确保右上角只显示日期（如 3月23日），修复显示失效问题
 */

export default async function (ctx) {
  // ===================== 极致自适应色板 (Crypto Pro 风格) =====================
  const THEME = {
    bg: { light: '#FFFFFF', dark: '#000000' },     // 纯白/纯黑
    text: { light: '#000000', dark: '#FFFFFF' },   // 主文字
    textSec: { light: '#8E8E93', dark: '#8E8E93' },// 副文字
    line: { light: '#E5E5EA', dark: '#1C1C1E' },   // 分隔线
    accent: { light: '#FF9500', dark: '#FFD700' }, // 强调橙
    block: { light: '#F2F2F7', dark: '#1C1C1E' },  // 数值底色
    green: { light: '#34C759', dark: '#32D74B' },
    red: { light: '#FF3B30', dark: '#FF453A' }
  };

  const regionParam = ctx.env.region || "sichuan/chengdu"; 
  const SHOW_TREND = (ctx.env.SHOW_TREND || "true").trim() !== "false";

  // ===================== 2026 调价历法 =====================
  const CALENDAR_2026 = [
    {m: 1, d: 12}, {m: 1, d: 23}, {m: 2, d: 9},  {m: 2, d: 23}, {m: 3, d: 9},  {m: 3, d: 23}, {m: 4, d: 7},  {m: 4, d: 21}, 
    {m: 5, d: 8},  {m: 5, d: 22}, {m: 6, d: 5},  {m: 6, d: 19}, {m: 7, d: 3},  {m: 7, d: 17}, {m: 7, d: 31}, {m: 8, d: 14}, 
    {m: 8, d: 28}, {m: 9, d: 11}, {m: 9, d: 25}, {m: 10, d: 14}, {m: 10, d: 28}, {m: 11, d: 11}, {m: 11, d: 25}, {m: 12, d: 9}, {m: 12, d: 23}
  ];

  const now = new Date();
  const currYear = now.getFullYear();
  const updateTimeStr = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  // 计算下轮日期逻辑
  const getNextAdjust = () => {
    for (const item of CALENDAR_2026) {
      const target = new Date(currYear, item.m - 1, item.d, 23, 59, 59);
      if (target > now) {
        const diffHours = (target - now) / (1000 * 60 * 60);
        return { 
          dateStr: `${item.m}月${item.d}日`, 
          isUrgent: diffHours < 72 // 不足3天变红
        };
      }
    }
    return { dateStr: "待更新", isUrgent: false };
  };

  const next = getNextAdjust();
  const dateColor = next.isUrgent ? THEME.red : THEME.textSec;
  
  let prices = { p92: null, p95: null, p98: null, diesel: null };
  let regionName = "";
  let trendInfo = "数据获取中...";
  let trendColor = THEME.textSec; 

  try {
    const resp = await ctx.http.get(`http://m.qiyoujiage.com/${regionParam}.shtml`, { timeout: 5000 });
    const html = await resp.text();
    
    // 地区解析
    const titleMatch = html.match(/<title>([^_]+)_/);
    if (titleMatch) regionName = titleMatch[1].trim().replace(/(油价|实时|今日|最新|价格)/g, '').trim();
    
    // 油价解析
    const regPrice = /<dl>[\s\S]+?<dt>(.*油)<\/dt>[\s\S]+?<dd>(.*)\(元\)<\/dd>/gm;
    let m;
    while ((m = regPrice.exec(html)) !== null) {
      const val = parseFloat(m[2]);
      if (m[1].includes("92")) prices.p92 = val;
      if (m[1].includes("95")) prices.p95 = val;
      if (m[1].includes("98")) prices.p98 = val;
      if (m[1].includes("柴") || m[1].includes("0号")) prices.diesel = val;
    }
    
    // 调价趋势解析
    if (SHOW_TREND) {
      const trendMatch = html.match(/<div class="tishi">[\s\S]*?<span>([^<]+)<\/span>[\s\S]*?<br\/>([\s\S]+?)<br\/>/);
      if (trendMatch) {
        const timeText = trendMatch[1];
        const priceText = trendMatch[2];
        const adjustDate = timeText.match(/(\d{1,2}月\d{1,2}日)/)?.[1] || "";
        const isUp = priceText.includes("上调");
        const isDown = priceText.includes("下调");
        trendColor = isUp ? THEME.red : (isDown ? THEME.green : THEME.textSec);
        
        const allPrices = priceText.match(/[\d\.]+\s*元\/升/g);
        const amount = allPrices && allPrices.length > 0 ? (allPrices.length >= 2 ? `${allPrices[0].match(/[\d\.]+/)[0]}-${allPrices[1].match(/[\d\.]+/)[0]}元/L` : `${allPrices[0].match(/[\d\.]+/)[0]}元/L`) : "";
        trendInfo = `${adjustDate}${isUp?'上涨':isDown?'下调':'调价'} ${amount}`;
      }
    }
  } catch (e) { trendInfo = "网络请求超时"; }

  const priceItems = [
    { label: "92#", val: prices.p92, color: THEME.accent }, 
    { label: "95#", val: prices.p95, color: "#FF6B35" },
    { label: "98#", val: prices.p98, color: THEME.red },
    { label: "柴油", val: prices.diesel, color: THEME.green }
  ].filter(i => i.val);

  return {
    type: "widget", padding: 16,
    backgroundColor: THEME.bg,
    children: [
      { type: 'spacer', length: 5 },
      // --- 顶部标题栏 ---
      {
        type: "stack", direction: "row", alignItems: "center",
        children: [
          { type: "image", src: "sf-symbol:fuelpump.fill", width: 16, height: 16, color: THEME.accent },
          { type: 'spacer', length: 6 },
          { type: "text", text: `${regionName || "地区"}油价`, font: { size: 15, weight: "heavy" }, textColor: THEME.text },
          { type: "spacer" }, 
          // 🚀 确保这里只显示日期
          { type: "text", text: `下轮调价: ${next.dateStr}`, font: { size: 11, weight: "bold", family: "Menlo" }, textColor: dateColor }
        ]
      },
      { type: 'spacer', length: 12 },
      { type: 'stack', height: 0.5, backgroundColor: THEME.line },
      { type: 'spacer', length: 12 },

      // --- 数值区块 ---
      {
        type: "stack", direction: "row", gap: 8,
        children: priceItems.map(row => ({
          type: "stack", direction: "column", alignItems: "center", flex: 1, padding: [10, 0], backgroundColor: THEME.block, borderRadius: 10,
          children: [
            { type: "text", text: row.label, font: { size: 10, weight: "bold" }, textColor: row.color },
            { type: 'spacer', length: 4 },
            { type: "text", text: `${row.val?.toFixed(2) || "--"}`, font: { size: 16, weight: "bold", family: "Menlo" }, textColor: THEME.text }
          ]
        }))
      },

      { type: 'spacer', length: 14 },
      
      // --- 底部趋势栏 ---
      {
        type: "stack", direction: "row", alignItems: "center",
        children: [
          { type: "stack", direction: "row", alignItems: "center", gap: 4, children: [
              { type: "image", src: "sf-symbol:clock", width: 10, height: 10, color: THEME.textSec },
              { type: "text", text: updateTimeStr, font: { size: 10, family: "Menlo" }, textColor: THEME.textSec }
          ]},
          { type: "spacer" },
          // 底部日期趋势显示
          { type: "text", text: `${trendInfo}`, font: { size: 10, weight: "bold" }, textColor: trendColor, lineLimit: 1, minScale: 0.5 }
        ]
      },
      { type: 'spacer' }
    ]
  };
}