export default async function (ctx) {
  const T = {
    // ✅ 改成系统自适应
    bg: { light: '#F2F2F7', dark: '#000000' },
    txt: { light: '#000000', dark: '#FFFFFF' },
    sub: { light: '#8E8E93', dark: '#8E8E93' },
    line: { light: '#E5E5EA', dark: '#1C1C1E' },
    accent: { light: '#FFB800', dark: '#FFD700' },
    block: { light: '#FFFFFF', dark: '#1C1C1E' }
  };

  const CAL_2026 = [
    {m: 1, d: 12}, {m: 1, d: 23}, {m: 2, d: 9}, {m: 2, d: 23}, {m: 3, d: 9}, {m: 3, d: 23},
    {m: 4, d: 7}, {m: 4, d: 21}, {m: 5, d: 8}, {m: 5, d: 22}, {m: 6, d: 5}, {m: 6, d: 19},
    {m: 7, d: 3}, {m: 7, d: 17}, {m: 7, d: 31}, {m: 8, d: 14}, {m: 8, d: 28}, {m: 9, d: 11},
    {m: 9, d: 25}, {m: 10, d: 14}, {m: 10, d: 28}, {m: 11, d: 11}, {m: 11, d: 25}, {m: 12, d: 9}, {m: 12, d: 23}
  ];

  const now = new Date();
  const upTime = `${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  let nextDate = "待更新";
  for (const item of CAL_2026) {
    if (new Date(2026, item.m - 1, item.d, 23, 59) > now) {
      nextDate = `${item.m}月${item.d}日`;
      break;
    }
  }

  let region = "加载中", trend = "获取调价趋势...", trendCol = T.sub;
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

      trendCol = isUp
        ? { light: '#FF3B30', dark: '#FF453A' }
        : isDown
        ? { light: '#34C759', dark: '#32D74B' }
        : T.sub;
    }

  } catch (e) {
    region = "成都";
  }

  return {
    type: "widget",
    padding: [16, 16, 10, 16],
    backgroundColor: T.bg,

    children: [
      { type: 'spacer', length: 5 },

      // 头部
      {
        type: "stack", direction: "row", alignItems: "center",
        children: [
          { type: "image", src: "sf-symbol:fuelpump.fill", width: 16, height: 16, color: T.accent },
          { type: 'spacer', length: 6 },
          { type: "text", text: `${region}油价`, font: { size: 15, weight: "heavy" }, textColor: T.txt },
          { type: "spacer" },
          { type: "text", text: `下轮调价: ${nextDate}`, font: { size: 11, weight: "bold", family: "Menlo" }, textColor: T.sub }
        ]
      },

      { type: 'spacer', length: 12 },
      { type: 'stack', height: 0.5, backgroundColor: T.line },
      { type: 'spacer', length: 12 },

      // 价格区
      {
        type: "stack", direction: "row", gap: 8,
        children: [
          { label: "92#", val: p.p92, col: T.accent },
          { label: "95#", val: p.p95, col: { light: '#FF6B35', dark: '#FF6B35' } },
          { label: "98#", val: p.p98, col: { light: '#FF3B30', dark: '#FF453A' } },
          { label: "柴油", val: p.diesel, col: { light: '#34C759', dark: '#32D74B' }