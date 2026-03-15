/**
 * 📌 桌面小组件 2: 🛡️ IP 纯净度 (像素级统一字号版)
 */
export default async function(ctx) {
  const BG_COLORS = [{ light: '#0D0D1A', dark: '#0D0D1A' }, { light: '#2D1B69', dark: '#2D1B69' }];
  const C_TITLE = { light: '#FFD700', dark: '#FFD700' }; 
  const C_SUB = { light: '#A2A2B5', dark: '#A2A2B5' };
  const C_GREEN = { light: '#32D74B', dark: '#32D74B' };
  const C_MAIN = { light: '#FFFFFF', dark: '#FFFFFF' };

  let d = {};
  try {
    const res = await ctx.http.get('https://my.ippure.com/v1/info', { timeout: 4000 });
    d = JSON.parse(await res.text());
  } catch (e) {}

  const ip = d.ip || "获取失败";
  const ipLabel = ip.includes(':') ? "IPv6" : "IPv4";
  const asn = d.asn ? AS${d.asn} ${d.asOrganization || ""}.trim() : "未知";
  
  let code = d.countryCode || "";
  if (code.toUpperCase() === 'TW') code = 'CN';
  const flag = code ? String.fromCodePoint(...code.toUpperCase().split('').map(c => 127397 + c.charCodeAt())) : "🌐";
  const loc = ${flag} ${d.country || ""} ${d.city || ""}.trim() || "未知位置";
  
  const nativeText = d.isResidential === true ? "🏠 原生住宅" : (d.isResidential === false ? "🏢 商业机房" : "未知");

  const risk = d.fraudScore;
  let riskTxt = "获取失败", riskCol = C_SUB, riskIc = "questionmark.shield.fill";
  if (risk !== undefined) {
    if (risk >= 80) { riskTxt = 极高风险 (${risk}); riskCol = { light: '#FF3B30', dark: '#FF3B30' }; riskIc = "xmark.shield.fill"; }
    else if (risk >= 70) { riskTxt = 高风险 (${risk}); riskCol = { light: '#FF9500', dark: '#FF9500' }; riskIc = "exclamationmark.shield.fill"; }
    else if (risk >= 40) { riskTxt = 中等风险 (${risk}); riskCol = { light: '#FFD60A', dark: '#FFD60A' }; riskIc = "exclamationmark.shield.fill"; }
    else { riskTxt = 纯净低危 (${risk}); riskCol = C_GREEN; riskIc = "checkmark.shield.fill"; }
  }

  const Row = (ic, icCol, label, val, valCol) => ({
    type: 'stack', direction: 'row', alignItems: 'center', gap: 6,
    children: [
      { type: 'image', src: sf-symbol:${ic}, color: icCol, width: 13, height: 13 },
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
          { type: 'image', src: 'sf-symbol:shield.lefthalf.filled', color: C_TITLE, width: 16, height: 16 },
          { type: 'text', text: 'IP 纯净度', font: { size: 14, weight: 'heavy' }, textColor: C_TITLE },
          { type: 'spacer' },
          { type: 'text', text: 'IPPure', font: { size: 9 }, textColor: 'rgba(255,255,255,0.2)' }
      ]},
      { type: 'spacer', length: 14 },
      { type: 'stack', direction: 'column', gap: 6, children: [
          Row("globe", { light: '#00AAE4', dark: '#00AAE4' }, ipLabel, ip, C_GREEN),
          Row("number.square.fill", { light: '#00AAE4', dark: '#00AAE4' }, "归属网络", asn, C_GREEN),
          Row("mappin.and.ellipse", { light: '#9945FF', dark: '#9945FF' }, "位置", loc, C_MAIN),
          Row("building.2.fill", { light: '#9945FF', dark: '#9945FF' }, "原生属性", nativeText, C_SUB),
          Row(riskIc, riskCol, "风险评级", riskTxt, riskCol)
      ]},
      { type: 'spacer' }
    ]
  };
}
