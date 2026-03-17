/**
 * ⛽ 全国油价（极致黑白自适应 Pro - 最终版）
 * 🛠 功能：国内油价查询、下轮调价日期、涨跌趋势显示
 * 🎨 风格：对齐 Crypto Pro 极致黑白、布局重心下沉
 */

export default async function (ctx) {
  // ===================== 1. 极致自适应色板 =====================
  const T = {
    bg: { light: '#FFFFFF', dark: '#000000' },     // 背景自适应
    txt: { light: '#000000', dark: '#FFFFFF' },    // 主文字自适应
    sub: { light: '#8E8E93', dark: '#8E8E93' },    // 副标题灰色
    line: { light: '#E5E5EA', dark: '#1C1C1E' },   // 分隔线
    accent: { light: '#FF9500', dark: '#FFD700' },  // 强调橙/金
    block: { light: '#F2F2F7', dark: '#1C1C1E' }   // 数值方块背景
  };

  // ===================== 2. 2026 调价历法 =====================
  const CAL_2026 = [
    {m: 1, d: 12}, {m: 1, d: 23}, {m: 2, d: 9},  {m: 2, d: 23}, {m: 3, d: 9},  {m: 3, d: 23}, {m: 4, d: 7},  {m: 4, d: 21}, 
    {m: 5, d: 8},  {m: 5, d: 22}, {m: 6, d: 5},  {m: 6, d: 19}, {m: 7, d: 3},  {m: 7, d: 17}, {m: 7, d: 31}, {m: 8, d: 14}, 
    {m: 8, d: 28}, {m: 9, d: 11}, {m: 9, d: 25}, {m: 10, d: 14}, {m: 10, d: 28}, {m: 11, d: 11}, {m: 11, d: 25}, {m: 12, d: 9}, {m: 12, d: 23}
  ];

  const now = new Date();
  const upTime = `${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  // 计算下轮日期 (仅显示日期)
  let nextDate = "待更新";
  for (const item of CAL_2026) {
    if (new Date(2026, item.m - 1, item.d, 23, 59) > now) {
      nextDate = `${item.m}月${item.d}日`;
      break;
    }
  }

  // ===================== 3. 数据解析逻辑 =====================
  let region = "成都", trend = "正在获取最新趋势...", trendCol = T.sub;
  let p = { p92: "--", p95: "--", p98: "--", diesel: "--" };

  try {
    const reg = ctx.env.region || "sichuan/chengdu";
    const res = await ctx.http.get(`http://m.qiyoujiage.com/${reg}.shtml`, { timeout: 4000 });
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

    const tMatch = html.match(/<div class="tishi">[\s\S]*?<span>([^<]+)<\/span>[\s\S]*?<br\/>([\s\S]+?)<br\/>/);
    if (tMatch) {
      const isUp = tMatch[2].includes("上调"), isDown = tMatch[2].includes("下调");
      const d = tMatch[1].match(/(\d{1,2}月\d{1,2}日)/)?.[1] || "";
      const amt = tMatch[2].match(/[\d\.]+\s*元\/升/g)?.[0] || "";
      trend = `${d}${isUp?'上涨':isDown?'下调':'调价'} ${amt}`;
      trendCol = isUp ? '#FF453A' : (isDown ? '#34C759' : T.sub);
    }
  } catch (e) { trendInfo = "网络请求超时"; }

  // ===================== 4. 渲染 UI =====================
  return {
    type: "widget", 
    padding: [16, 16, 10, 16], // 压缩底部内边距，配合 spacer 实现下沉
    backgroundColor: T.bg,
    children: [
      { type: 'spacer', length: 5 },
      
      // --- 顶部标题栏 ---
      { type: "stack", direction: "row", alignItems: "center", children: [
          { type: "image", src: "sf-symbol:fuelpump.fill", width: 16, height: 16, color: T.accent },
          { type: 'spacer', length: 6 },
          { type: "text", text: `${region}油价`, font: { size: 15, weight: "heavy" }, textColor: T.txt },
          { type: "spacer" }, 
          { type: "text", text: `下轮调价: ${nextDate}`, font: { size: 11, weight: "bold", family: "Menlo" }, textColor: T.sub }
      ]},
      
      { type: 'spacer', length: 12 },
      { type: 'stack', height: 0.5, backgroundColor: T.line }, 
      { type: 'spacer', length: 12 },

      // --- 数值区块 ---
      { type: "stack", direction: "row", gap: 8, children: [
          { label: "92#", val: p.p92, col: T.accent },
          { label: "95#", val: p.p95, col: "#FF6B35" },
          { label: "98#", val: p.p98, col: "#FF453A" },
          { label: "柴油", val: p.diesel, col: "#32D74B" }
      ].map(i => ({
          type: "stack", direction: "column", alignItems: "center", flex: 1, padding: [10, 0], backgroundColor: T.block, borderRadius: 10,
          children: [
            { type: "text", text: i.label, font: { size: 10, weight: "bold" }, textColor: i.col },
            { type: 'spacer', length: 4 },
            { type: "text", text: i.val, font: { size: 16, weight: "bold", family: "Menlo" }, textColor: T.txt }
          ]
      }))},

      // --- 布局下沉核心：通过两个 Spacer 强行撑开中间距离 ---
      { type: 'spacer', length: 25 }, 
      { type: 'spacer' }, 
      
      // --- 底部趋势栏 ---
      { type: "stack", direction: "row", alignItems: "center", children: [
          { type: "stack", direction: "row", alignItems: "center", gap: 4, children: [
              { type: "image", src: "sf-symbol:clock", width: 10, height: 10, color: T.sub },
              { type: "text", text: upTime, font: { size: 10, family: "Menlo" }, textColor: T.sub }
          ]},
          { type: "spacer" },
          { type: "text", text: trend, font: { size: 10, weight: "bold" }, textColor: trendCol, lineLimit: 1, minScale: 0.5 }
      ]},
      { type: 'spacer', length: 2 } 
    ]
  };
}
