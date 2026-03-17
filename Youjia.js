/**
 * ⛽ 全国油价 Pro (看板配色 1:1 还原版)
 * 🎨 配色标准：完全同步“全功能网络看板 Pro”
 * 📏 布局逻辑：顶部日期 + 底部下沉趋势
 */

export default async function(ctx) {
  // ===================== 1. 完全同步：网络看板 Pro 标准色板 =====================
  const BG_MAIN   = { light: '#FFFFFF', dark: '#0D0D1A' }; // 浅色纯白，深色深紫
  const C_MAIN    = { light: '#1C1C1E', dark: '#FFFFFF' }; // 浅色纯黑，深色纯白
  const C_SUB     = { light: '#8E8E93', dark: '#A2A2B5' }; // 浅色灰，深色透白
  
  const C_TITLE   = { light: '#1C1C1E', dark: '#FFFFFF' }; // 标题文字
  const C_GREEN   = { light: '#34C759', dark: '#32D74B' }; // 强调绿
  const C_YELLOW  = { light: '#FF9500', dark: '#FFD700' }; // 强调黄
  const C_RED     = { light: '#FF3B30', dark: '#FF3B30' }; // 强调红
  const IC_BLUE   = { light: '#007AFF', dark: '#00AAE4' }; // 图标蓝
  const IC_PURPLE = { light: '#AF52DE', dark: '#9945FF' }; // 图标紫

  const BLOCK_BG  = { light: '#F2F2F7', dark: '#FFFFFF10' }; // 方块半透明背景

  // ===================== 2. 调价数据逻辑 =====================
  const CALENDAR_2026 = [
    {m: 1, d: 12}, {m: 1, d: 23}, {m: 2, d: 9},  {m: 2, d: 23}, {m: 3, d: 9},  {m: 3, d: 23}, {m: 4, d: 7},  {m: 4, d: 21}, 
    {m: 5, d: 8},  {m: 5, d: 22}, {m: 6, d: 5},  {m: 6, d: 19}, {m: 7, d: 3},  {m: 7, d: 17}, {m: 7, d: 31}, {m: 8, d: 14}, 
    {m: 8, d: 28}, {m: 9, d: 11}, {m: 9, d: 25}, {m: 10, d: 14}, {m: 10, d: 28}, {m: 11, d: 11}, {m: 11, d: 25}, {m: 12, d: 9}, {m: 12, d: 23}
  ];

  const now = new Date();
  const upTime = `${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  let nextDate = "待更新";
  for (const item of CALENDAR_2026) {
    if (new Date(2026, item.m - 1, item.d, 23, 59) > now) {
      nextDate = `${item.m}月${item.d}日`;
      break;
    }
  }

  let region = "成都", trend = "获取中...", trendCol = C_SUB;
  let p = { p92: "--", p95: "--", p98: "--", diesel: "--" };

  try {
    const reg = ctx.env.region || "sichuan/chengdu";
    const res = await ctx.http.get(`http://m.qiyoujiage.com/${reg}.shtml`, { timeout: 4000 });
    const html = await res.text();
    const rMatch = html.match(/<title>([^_]+)_/);
    if (rMatch) region = rMatch[1].replace(/(油价|实时|今日|最新|价格)/g, '');
    
    const regP = /<dl>[\s\S]+?<dt>(.*油)<\/dt>[\s\S]+?<dd>(.*)\(元\)<\/dd>/gm;
    let m;
    while ((m = regP.exec(html)) !== null) {
      const val = parseFloat(m[2]).toFixed(2);
      if (m[1].includes("92")) p.p92 = val;
      if (m[1].includes("95")) p.p95 = val;
      if (m[1].includes("98")) p.p98 = val;
      if (m[1].includes("柴")) p.diesel = val;
    }

    const tMatch = html.match(/<div class="tishi">[\s\S]*?<span>([^<]+)<\/span>[\s\S]*?<br\/>([\s\S]+?)<br\/>/);
    if (tMatch) {
      const isUp = tMatch[2].includes("上调"), isDown = tMatch[2].includes("下调");
      const d = tMatch[1].match(/(\d{1,2}月\d{1,2}日)/)?.[1] || "";
      const amt = tMatch[2].match(/[\d\.]+\s*元\/升/g)?.[0] || "";
      trend = `${d}${isUp?'上涨':isDown?'下调':'调价'} ${amt}`;
      trendCol = isUp ? C_RED : (isDown ? C_GREEN : C_SUB);
    }
  } catch (e) { trend = "网络超时"; }

  // ===================== 3. 渲染 UI =====================
  return {
    type: "widget", padding: 14, 
    backgroundColor: BG_MAIN, // 🚀 关键：同步看板背景
    children: [
      { type: 'spacer', length: 5 },
      
      // 头部：标题 + 下轮日期
      { type: "stack", direction: "row", alignItems: "center", children: [
          { type: "image", src: "sf-symbol:fuelpump.fill", width: 16, height: 16, color: C_YELLOW },
          { type: 'spacer', length: 6 },
          { type: "text", text: `${region}油价`, font: { size: 14, weight: "heavy" }, textColor: C_TITLE },
          { type: "spacer" }, 
          { type: "text", text: `下轮调价: ${nextDate}`, font: { size: 11, weight: "bold", family: "Menlo" }, textColor: C_SUB }
      ]},
      
      { type: 'spacer', length: 12 },
      { type: 'stack', height: 0.5, backgroundColor: { light: '#E5E5EA', dark: '#FFFFFF15' } },
      { type: 'spacer', length: 12 },

      // 数值区块
      { type: "stack", direction: "row", gap: 8, children: [
          { label: "92#", val: p.p92, col: C_YELLOW },
          { label: "95#", val: p.p95, col: IC_BLUE },
          { label: "98#", val: p.p98, col: IC_PURPLE },
          { label: "柴油", val: p.diesel, col: C_GREEN }
      ].map(i => ({
          type: "stack", direction: "column", alignItems: "center", flex: 1, padding: [10, 0], backgroundColor: BLOCK_BG, borderRadius: 10,
          children: [
            { type: "text", text: i.label, font: { size: 10, weight: "bold" }, textColor: i.col },
            { type: 'spacer', length: 4 },
            { type: "text", text: i.val, font: { size: 16, weight: "bold", family: "Menlo" }, textColor: C_MAIN }
          ]
      }))},

      // --- 布局下沉逻辑 ---
      { type: 'spacer', length: 25 }, 
      { type: 'spacer' }, 
      
      // 底部：更新时间 + 趋势
      { type: "stack", direction: "row", alignItems: "center", children: [
          { type: "stack", direction: "row", alignItems: "center", gap: 4, children: [
              { type: "image", src: "sf-symbol:clock", width: 10, height: 10, color: C_SUB },
              { type: "text", text: upTime, font: { size: 10, family: "Menlo" }, textColor: C_SUB }
          ]},
          { type: "spacer" },
          { type: "text", text: trend, font: { size: 10, weight: "bold" }, textColor: trendCol, lineLimit: 1, minScale: 0.5 }
      ]},
      { type: 'spacer', length: 2 } 
    ]
  };
}