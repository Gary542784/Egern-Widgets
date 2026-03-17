/**
 * ⛽ 全国油价 Pro (网络看板配色同步版)
 * ✨ 视觉：同步看板 Pro 的深紫/纯白自适应
 * ⏱️ 时间：2026-03-17
 */

export default async function (ctx) {
  // ===================== 完全复刻：网络看板 Pro 标准配色 =====================
  const BG_MAIN   = { light: '#FFFFFF', dark: '#0D0D1A' }; // 浅色纯白，深色深紫
  const C_MAIN    = { light: '#1C1C1E', dark: '#FFFFFF' }; // 浅色纯黑，深色纯白
  const C_SUB     = { light: '#8E8E93', dark: '#A2A2B5' }; // 浅色灰，深色透白
  
  const C_TITLE   = { light: '#1C1C1E', dark: '#FFFFFF' }; // 标题文字
  const C_GREEN   = { light: '#34C759', dark: '#32D74B' }; // 强调绿
  const C_YELLOW  = { light: '#FF9500', dark: '#FFD700' }; // 强调黄
  const C_RED     = { light: '#FF3B30', dark: '#FF3B30' }; // 强调红
  
  const IC_BLUE   = { light: '#007AFF', dark: '#00AAE4' }; // 图标蓝
  const BLOCK_BG  = { light: '#F2F2F7', dark: '#FFFFFF10' }; // 区块背景

  // ===================== 数据解析与调价逻辑 =====================
  const CALENDAR_2026 = [
    {m: 1, d: 12}, {m: 1, d: 23}, {m: 2, d: 9},  {m: 2, d: 23}, {m: 3, d: 9},  {m: 3, d: 23}, {m: 4, d: 7},  {m: 4, d: 21}, 
    {m: 5, d: 8},  {m: 5, d: 22}, {m: 6, d: 5},  {m: 6, d: 19}, {m: 7, d: 3},  {m: 7, d: 17}, {m: 7, d: 31}, {m: 8, d: 14}, 
    {m: 8, d: 28}, {m: 9, d: 11}, {m: 9, d: 25}, {m: 10, d: 14}, {m: 10, d: 28}, {m: 11, d: 11}, {m: 11, d: 25}, {m: 12, d: 9}, {m: 12, d: 23}
  ];

  const now = new Date();
  const upTimeStr = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const getNextAdjust = () => {
    for (const item of CALENDAR_2026) {
      if (new Date(2026, item.m - 1, item.d, 23, 59) > now) {
        const diffMs = new Date(2026, item.m - 1, item.d) - now;
        return { date: `${item.m}月${item.d}日`, isUrgent: diffMs < 259200000 };
      }
    }
    return { date: "待更新", isUrgent: false };
  };

  const next = getNextAdjust();
  const regionParam = ctx.env.region || "sichuan/chengdu";
  let prices = { p92: "--", p95: "--", p98: "--", diesel: "--" }, regionName = "获取中", trendInfo = "暂无数据", trendCol = C_SUB;

  try {
    const resp = await ctx.http.get(`http://m.qiyoujiage.com/${regionParam}.shtml`, { timeout: 4000 });
    const html = await resp.text();
    const rName = html.match(/<title>([^_]+)_/);
    if (rName) regionName = rName[1].replace(/(油价|实时|今日|最新|价格)/g, '');
    
    const regP = /<dl>[\s\S]+?<dt>(.*油)<\/dt>[\s\S]+?<dd>(.*)\(元\)<\/dd>/gm;
    let m;
    while ((m = regP.exec(html)) !== null) {
      const v = parseFloat(m[2]).toFixed(2);
      if (m[1].includes("92")) prices.p92 = v;
      if (m[1].includes("95")) prices.p95 = v;
      if (m[1].includes("98")) prices.p98 = v;
      if (m[1].includes("柴")) prices.diesel = v;
    }

    const tMatch = html.match(/<div class="tishi">[\s\S]*?<span>([^<]+)<\/span>[\s\S]*?<br\/>([\s\S]+?)<br\/>/);
    if (tMatch) {
      const isUp = tMatch[2].includes("上调"), isDown = tMatch[2].includes("下调");
      const d = tMatch[1].match(/(\d{1,2}月\d{1,2}日)/)?.[1] || "";
      const amt = tMatch[2].match(/[\d\.]+\s*元\/升/g)?.[0] || "";
      trendInfo = `${d}${isUp?'上涨':isDown?'下调':'调价'} ${amt}`;
      trendCol = isUp ? C_RED : (isDown ? C_GREEN : C_SUB);
    }
  } catch (e) { regionName = "成都"; }

  // ===================== 渲染布局 (完全同步看板 Pro 结构) =====================
  return {
    type: 'widget',
    padding: 14,
    backgroundColor: BG_MAIN, // 核心变色
    children: [
      // Header: 标题 + 下轮调价日期
      { type: 'stack', direction: 'row', alignItems: 'center', gap: 6, children: [
          { type: 'image', src: 'sf-symbol:fuelpump.fill', color: C_YELLOW, width: 16, height: 16 },
          { type: 'text', text: `${regionName}油价`, font: { size: 14, weight: 'heavy' }, textColor: C_TITLE },
          { type: 'spacer' },
          { type: 'text', text: `下轮调价: ${next.date}`, font: { size: 11, weight: 'bold', family: 'Menlo' }, textColor: next.isUrgent ? C_RED : C_SUB }
      ]},
      { type: 'spacer', length: 12 },
      
      // 分隔线
      { type: 'stack', height: 0.5, backgroundColor: { light: '#E5E5EA', dark: '#FFFFFF15' } },
      { type: 'spacer', length: 12 },

      // Price Grid: 4列布局
      { type: 'stack', direction: 'row', gap: 8, children: [
          { lab: "92#", val: prices.p92, col: C_YELLOW },
          { lab: "95#", val: prices.p95, col: IC_BLUE },
          { lab: "98#", val: prices.p98, col: IC_PURPLE },
          { lab: "柴油", val: prices.diesel, col: C_GREEN }
      ].map(item => ({
          type: 'stack', direction: 'column', alignItems: 'center', flex: 1, padding: [10, 0], backgroundColor: BLOCK_BG, borderRadius: 10,
          children: [
            { type: 'text', text: item.lab, font: { size: 10, weight: 'bold' }, textColor: item.col },
            { type: 'spacer', length: 4 },
            { type: 'text', text: item.val, font: { size: 16, weight: 'bold', family: 'Menlo' }, textColor: C_MAIN }
          ]
      }))},

      // 🚀 核心间距：推到底部
      { type: 'spacer' },

      // Footer: 更新时间 + 本轮趋势
      { type: 'stack', direction: 'row', alignItems: 'center', children: [
          { type: 'stack', direction: 'row', alignItems: 'center', gap: 4, children: [
              { type: 'image', src: 'sf-symbol:clock', width: 10, height: 10, color: C_SUB },
              { type: 'text', text: upTimeStr, font: { size: 10, family: 'Menlo' }, textColor: C_SUB }
          ]},
          { type: 'spacer' },
          { type: 'text', text: trendInfo, font: { size: 10, weight: 'bold' }, textColor: trendCol, lineLimit: 1, minScale: 0.5 }
      ]},
      { type: 'spacer', length: 2 } // 底部留白，微调下沉感
    ]
  };
}
