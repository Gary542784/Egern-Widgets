/**
 * ⛽ 全国油价（Pro 自适应最终完成版）
 * 🛠 修复：使用 ctx.appearance 确保白天必白、晚上必黑
 * 📏 布局：底部信息彻底下沉，右上角仅显示日期
 */

export default async function (ctx) {
  // 1. 【系统自适应核心】强制读取系统外观设置
  const isDark = ctx.appearance === 'dark';

  // 定义一套随系统自动切换的色板
  const THEME = {
    bg: isDark ? '#000000' : '#FFFFFF',       // 背景：黑/白
    txt: isDark ? '#FFFFFF' : '#000000',      // 主文字：白/黑
    sub: '#8E8E93',                           // 副文字：灰色
    line: isDark ? '#1C1C1E' : '#E5E5EA',     // 分隔线
    block: isDark ? '#1C1C1E' : '#F2F2F7',    // 方块底色
    accent: isDark ? '#FFD700' : '#FF9500'    // 强调金/橙
  };

  const regionParam = ctx.env.region || "sichuan/chengdu"; 
  const SHOW_TREND = (ctx.env.SHOW_TREND || "true").trim() !== "false";

  // 2. 调价历法
  const CAL_2026 = [
    {m: 1, d: 12}, {m: 1, d: 23}, {m: 2, d: 9},  {m: 2, d: 23}, {m: 3, d: 9},  {m: 3, d: 23}, {m: 4, d: 7},  {m: 4, d: 21}, 
    {m: 5, d: 8},  {m: 5, d: 22}, {m: 6, d: 5},  {m: 6, d: 19}, {m: 7, d: 3},  {m: 7, d: 17}, {m: 7, d: 31}, {m: 8, d: 14}, 
    {m: 8, d: 28}, {m: 9, d: 11}, {m: 9, d: 25}, {m: 10, d: 14}, {m: 10, d: 28}, {m: 11, d: 11}, {m: 11, d: 25}, {m: 12, d: 9}, {m: 12, d: 23}
  ];

  const now = new Date();
  const upTime = `${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  // 计算下轮调价日期
  let nextDate = "待更新";
  for (const item of CAL_2026) {
    if (new Date(2026, item.m - 1, item.d, 23, 59) > now) {
      nextDate = `${item.m}月${item.d}日`;
      break;
    }
  }

  // 3. 数据解析
  let region = "成都", trend = "调价获取中...", trendCol = THEME.sub;
  let p = { p92: "--", p95: "--", p98: "--", diesel: "--" };

  try {
    const res = await ctx.http.get(`http://m.qiyoujiage.com/${regionParam}.shtml`, { timeout: 4000 });
    const html = await res.text();
    const rName = html.match(/<title>([^_]+)_/);
    if (rName) region = rName[1].replace(/(油价|实时|今日|最新|价格)/g, '');
    const regP = /<dl>[\s\S]+?<dt>(.*油)<\/dt>[\s\S]+?<dd>(.*)\(元\)<\/dd>/gm;
    let m;
    while ((m = regP.exec(html)) !== null) {
      const val = parseFloat(m[2]).toFixed(2);
      if (m[1].includes("92")) p.p92 = val;
      if (m[1].includes("95")) p.p95 = val;
      if (m[1].includes("98")) p.p98 = val;
      if (m[1].includes("柴")) p.diesel = val;
    }
    if (SHOW_TREND) {
      const tMatch = html.match(/<div class="tishi">[\s\S]*?<span>([^<]+)<\/span>[\s\S]*?<br\/>([\s\S]+?)<br\/>/);
      if (tMatch) {
        const d = tMatch[1].match(/(\d{1,2}月\d{1,2}日)/)?.[1] || "";
        const isUp = tMatch[2].includes("上调"), isDown = tMatch[2].includes("下调");
        const amt = tMatch[2].match(/[\d\.]+\s*元\/升/g)?.[0] || "";
        trend = `${d}${isUp?'上涨':isDown?'下调':'调价'} ${amt}`;
        trendCol = isUp ? '#FF453A' : (isDown ? '#32D74B' : THEME.sub);
      }
    }
  } catch (e) { region = "请求超时"; }

  // 4. UI 渲染
  return {
    type: "widget", 
    padding: [16, 16, 10, 16], // 底部间距压缩，增强下沉感
    backgroundColor: THEME.bg,
    children: [
      { type: 'spacer', length: 5 },
      // 头部栏
      { type: "stack", direction: "row", alignItems: "center", children: [
          { type: "image", src: "sf-symbol:fuelpump.fill", width: 16, height: 16, color: THEME.accent },
          { type: 'spacer', length: 6 },
          { type: "text", text: `${region}油价`, font: { size: 15, weight: "heavy" }, textColor: THEME.txt },
          { type: "spacer" }, 
          { type: "text", text: `下轮调价: ${nextDate}`, font: { size: 11, weight: "bold", family: "Menlo" }, textColor: THEME.sub }
      ]},
      { type: 'spacer', length: 12 },
      { type: 'stack', height: 0.5, backgroundColor: THEME.line }, 
      { type: 'spacer', length: 12 },

      // 油价方块
      { type: "stack", direction: "row", gap: 8, children: [
          { label: "92#", val: p.p92, col: THEME.accent },
          { label: "95#", val: p.p95, col: "#FF6B35" },
          { label: "98#", val: p.p98, col: "#FF453A" },
          { label: "柴油", val: p.diesel, col: "#32D74B" }
      ].map(i => ({
          type: "stack", direction: "column", alignItems: "center", flex: 1, padding: [10, 0], backgroundColor: THEME.block, borderRadius: 10,
          children: [
            { type: "text", text: i.label, font: { size: 10, weight: "bold" }, textColor: i.col },
            { type: 'spacer', length: 4 },
            { type: "text", text: i.val, font: { size: 16, weight: "bold", family: "Menlo" }, textColor: THEME.txt }
          ]
      }))},

      // 🚀 布局下沉：使用大固定间距 + 弹性间距
      { type: 'spacer', length: 25 }, 
      { type: 'spacer' }, 
      
      // 底部栏
      { type: "stack", direction: "row", alignItems: "center", children: [
          { type: "stack", direction: "row", alignItems: "center", gap: 4, children: [
              { type: "image", src: "sf-symbol:clock", width: 10, height: 10, color: THEME.sub },
              { type: "text", text: upTime, font: { size: 10, family: "Menlo" }, textColor: THEME.sub }
          ]},
          { type: "spacer" },
          { type: "text", text: trend, font: { size: 10, weight: "bold" }, textColor: trendCol, lineLimit: 1, minScale: 0.5 }
      ]},
      { type: 'spacer', length: 2 } 
    ]
  };
}