export default async function (ctx) {
  const isDark = ctx.isDarkMode;

  // ✅ 用函数动态返回颜色（最稳）
  const C = {
    bg: isDark ? '#000000' : '#F2F2F7',
    txt: isDark ? '#FFFFFF' : '#000000',
    sub: '#8E8E93',
    line: isDark ? '#1C1C1E' : '#E5E5EA',
    block: isDark ? '#1C1C1E' : '#FFFFFF',
    accent: isDark ? '#FFD700' : '#FFB800'
  };

  const now = new Date();
  const upTime = `${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  let region = "成都";
  let trend = "加载中...";
  let trendCol = C.sub;

  let p = { p92: "--", p95: "--", p98: "--", diesel: "--" };

  try {
    const res = await ctx.http.get("http://m.qiyoujiage.com/sichuan/chengdu.shtml", { timeout: 4000 });
    const html = await res.text();

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
      const isUp = tMatch[2].includes("上调");
      const isDown = tMatch[2].includes("下调");

      trend = tMatch[1];

      // ✅ 必须统一字符串
      trendCol = isUp ? '#FF453A' : isDown ? '#32D74B' : C.sub;
    }

  } catch (e) {
    trend = "数据获取失败";
  }

  return {
    type: "widget",
    padding: [16, 16, 10, 16],
    backgroundColor: C.bg,

    children: [
      { type: "text", text: `${region}油价`, textColor: C.txt },

      { type: "spacer", length: 10 },

      {
        type: "text",
        text: `92# ${p.p92}  95# ${p.p95}`,
        textColor: C.txt
      },

      { type: "spacer" },

      {
        type: "text",
        text: trend,
        textColor: trendCol
      },

      {
        type: "text",
        text: upTime,
        textColor: C.sub
      }
    ]
  };
}