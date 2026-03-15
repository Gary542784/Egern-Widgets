/**
 * 📌 桌面小组件 1: ✈️ 代理检测 (像素级统一字号版)
 */
export default async function(ctx) {
  const BG_COLORS = [{ light: '#0D0D1A', dark: '#0D0D1A' }, { light: '#2D1B69', dark: '#2D1B69' }];
  const C_TITLE = { light: '#FFD700', dark: '#FFD700' }; 
  const C_SUB = { light: '#A2A2B5', dark: '#A2A2B5' };   
  const C_GREEN = { light: '#32D74B', dark: '#32D74B' }; 
  const C_MAIN = { light: '#FFFFFF', dark: '#FFFFFF' };

  const fmtISP = (isp) => {
    if (!isp) return "未知";
    const s = String(isp).toLowerCase();
    if (/移动|mobile|cmcc/i.test(s)) return "中国移动";
    if (/电信|telecom|chinanet/i.test(s)) return "中国电信";
    if (/联通|unicom/i.test(s)) return "中国联通";
    if (/广电|broadcast|cbn/i.test(s)) return "中国广电";
    return isp; 
  };

  let lIp = "获取失败", lLoc = "未知位置", lIsp = "未知运营商";
  try {
    const lRes = await ctx.http.get('https://myip.ipip.net/json', { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 4000 });
    const body = JSON.parse(await lRes.text());
    if (body && body.data) {
      lIp = body.data.ip || "获取失败";
      const locArr = body.data.location || [];
      lLoc = `🇨🇳 ${locArr[1] || ""} ${locArr[2] || ""}`.trim() || "未知位置";
      lIsp = fmtISP(locArr[4] || locArr[3]);
    }
  } catch (e) {}
  
  if (lIp === "获取失败" || !lIp) {
    try {
      const res126 = await ctx.http.get('https://ipservice.ws.126.net/locate/api/getLocByIp', { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 4000 });
      const body126 = JSON.parse(await res126.text());
      if (body126 && body126.result) {
        lIp = body126.result.ip;
        lLoc = `🇨🇳 ${body126.result.province || ""} ${body126.result.city || ""}`.trim();
        lIsp = fmtISP(body126.result.operator || body126.result.company);
      }
    } catch (e) {}
  }

  let nIp = "获取失败", nLoc = "未知位置", nIsp = "未知运营商";
  try {
    const nRes = await ctx.http.get('http://ip-api.com/json/?lang=zh-CN', { timeout: 4000 });
    const nData = JSON.parse(await nRes.text());
    nIp = nData.query || "获取失败";
    nIsp = fmtISP(nData.isp || "未知运营商"); 
    let code = nData.countryCode || "";
    if (code.toUpperCase() === 'TW') code = 'CN';
    const flag = code ? String.fromCodePoint(...code.toUpperCase().split('').map(c => 127397 + c.charCodeAt())) : "🌐";
    nLoc = `${flag} ${nData.country || ""} ${nData.city || ""}`.trim();
  } catch (e) {}

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  // ✨ 100% 统一 Row 样式：字号全部锁死在 11
  const Row = (ic, icCol, label, val, valCol) => ({
    type: 'stack', direction: 'row', alignItems: 'center', gap: 6,
    children: [
      { type: 'image', src: `sf-symbol:${ic}`, color: icCol, width: 13, height: 13 },
      { type: 'text', text: label, font: { size: 11 }, textColor: C_SUB },
      { type: 'spacer' },
      { type: 'text', text: val, font: { size: 11, weight: 'bold', family: 'Menlo' }, textColor: valCol, maxLines: 1, minScale: 0.6 }
    ]
  });

  return {
    type: 'widget', padding: 14,
    backgroundGradient: { type: 'linear', colors: BG_COLORS, startPoint: { x: 0, y: 0 }, endPoint: { x: 1, y: 1 } },
    children: [
      { type: 'stack', direction: 'row', alignItems: 'center', gap: 6, children: [
          { type: 'image', src: 'sf-symbol:paperplane.fill', color: C_TITLE, width: 16, height: 16 },
          { type: 'text', text: '代理检测', font: { size: 14, weight: 'heavy' }, textColor: C_TITLE },
          { type: 'spacer' },
          { type: 'image', src: 'sf-symbol:arrow.clockwise', color: C_SUB, width: 12, height: 12 }
      ]},
      { type: 'spacer', length: 10 },
      { type: 'stack', direction: 'column', gap: 4, children: [
          Row("house.fill", { light: '#00AAE4', dark: '#00AAE4' }, "本地 IP", lIp, C_GREEN),
          Row("map.fill", { light: '#00AAE4', dark: '#00AAE4' }, "本地位置", lLoc, C_MAIN),
          Row("antenna.radiowaves.left.and.right", { light: '#00AAE4', dark: '#00AAE4' }, "运营商", lIsp, C_MAIN),
          { type: 'spacer', length: 2 },
          Row("network", { light: '#9945FF', dark: '#9945FF' }, "落地 IP", nIp, C_GREEN),
          Row("mappin.and.ellipse", { light: '#9945FF', dark: '#9945FF' }, "落地位置", nLoc, C_MAIN),
          Row("server.rack", { light: '#9945FF', dark: '#9945FF' }, "运营商", nIsp, C_MAIN),
          Row("clock.fill", { light: '#32D74B', dark: '#32D74B' }, "执行时间", timeStr, C_GREEN)
      ]},
      { type: 'spacer' }
    ]
  };
}