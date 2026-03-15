export default async function(ctx) {
  const BG_COLORS = [{ light: '#0D0D1A', dark: '#0D0D1A' }, { light: '#2D1B69', dark: '#2D1B69' }];
  const C_TITLE = { light: '#FFD700', dark: '#FFD700' }, C_SUB = { light: '#A2A2B5', dark: '#A2A2B5' }, C_GREEN = { light: '#32D74B', dark: '#32D74B' };

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
    if (body?.data) {
      lIp = body.data.ip;
      lLoc = `🇨🇳 ${body.data.location[0]} ${body.data.location[1]} ${body.data.location[2]}`.trim();
      lIsp = fmtISP(body.data.location[4] || body.data.location[3]);
    }
  } catch (e) {}

  let nIp = "获取失败", nLoc = "未知位置", nIsp = "未知运营商";
  try {
    const nRes = await ctx.http.get('http://ip-api.com/json/?lang=zh-CN', { timeout: 4000 });
    const nData = JSON.parse(await nRes.text());
    nIp = nData.query || "获取失败";
    nIsp = fmtISP(nData.isp); 
    let code = nData.countryCode || "";
    if (code.toUpperCase() === 'TW') code = 'CN';
    const flag = code ? String.fromCodePoint(...code.toUpperCase().split('').map(c => 127397 + c.charCodeAt())) : "🌐";
    nLoc = `${flag} ${nData.country || ""} ${nData.city || ""}`.trim();
  } catch (e) {}

  const timeStr = new Date().toTimeString().split(' ')[0];
  const Row = (ic, icCol, label, val) => ({
    type: 'stack', direction: 'row', alignItems: 'center', gap: 6,
    children: [
      { type: 'image', src: `sf-symbol:${ic}`, color: icCol, width: 13, height: 13 },
      { type: 'text', text: label, font: { size: 11 }, textColor: C_SUB },
      { type: 'spacer' },
      { type: 'text', text: val, font: { size: 11, weight: 'bold', family: 'Menlo' }, textColor: C_GREEN, maxLines: 1, minScale: 0.6 }
    ]
  });

  return {
    type: 'widget', padding: 14, backgroundGradient: { type: 'linear', colors: BG_COLORS, startPoint: { x: 0, y: 0 }, endPoint: { x: 1, y: 1 } },
    children: [
      { type: 'stack', direction: 'row', alignItems: 'center', gap: 6, children: [
          { type: 'image', src: 'sf-symbol:paperplane.fill', color: C_TITLE, width: 16, height: 16 },
          { type: 'text', text: '代理检测', font: { size: 14, weight: 'heavy' }, textColor: C_TITLE },
          { type: 'spacer' }, { type: 'image', src: 'sf-symbol:arrow.clockwise', color: C_SUB, width: 12, height: 12 }
      ]},
      { type: 'spacer', length: 10 },
      { type: 'stack', direction: 'column', gap: 4, children: [
          Row("house.fill", { light: '#00AAE4', dark: '#00AAE4' }, "本地 IP", lIp),
          Row("map.fill", { light: '#00AAE4', dark: '#00AAE4' }, "本地位置", lLoc),
          Row("antenna.radiowaves.left.and.right", { light: '#00AAE4', dark: '#00AAE4' }, "运营商", lIsp),
          { type: 'spacer', length: 2 },
          Row("network", { light: '#9945FF', dark: '#9945FF' }, "落地 IP", nIp),
          Row("mappin.and.ellipse", { light: '#9945FF', dark: '#9945FF' }, "落地位置", nLoc),
          Row("server.rack", { light: '#9945FF', dark: '#9945FF' }, "运营商", nIsp),
          Row("clock.fill", { light: '#32D74B', dark: '#32D74B' }, "执行时间", timeStr)
      ]},
      { type: 'spacer' }
    ]
  };
}