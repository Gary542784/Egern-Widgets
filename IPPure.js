export default async function(ctx) {
  const BG_COLORS = [{ light: '#0D0D1A', dark: '#0D0D1A' }, { light: '#2D1B69', dark: '#2D1B69' }];
  const C_TITLE = { light: '#FFD700', dark: '#FFD700' }, C_SUB = { light: '#A2A2B5', dark: '#A2A2B5' }, C_GREEN = { light: '#32D74B', dark: '#32D74B' };

  let d = {};
  try {
    const res = await ctx.http.get('https://my.ippure.com/v1/info', { timeout: 4000 });
    d = JSON.parse(await res.text());
  } catch (e) {}

  const ip = d.ip || "获取失败", asn = d.asn ? `AS${d.asn} ${d.asOrganization || ""}`.trim() : "未知";
  let code = d.countryCode || "";
  if (code.toUpperCase() === 'TW') code = 'CN';
  const flag = code ? String.fromCodePoint(...code.toUpperCase().split('').map(c => 127397 + c.charCodeAt())) : "🌐";
  const loc = `${flag} ${d.country || ""} ${d.city || ""}`.trim();
  const native = d.isResidential === true ? "🏠 是 (原生)" : (d.isResidential === false ? "🏢 否 (机房)" : "未知");

  const risk = d.fraudScore;
  let riskTxt = "获取失败", riskCol = C_SUB, riskIc = "questionmark.square.fill";
  if (risk !== undefined) {
    if (risk >= 80) { riskTxt = `极高风险 (${risk})`; riskCol = '#FF3B30'; riskIc = "xmark.shield.fill"; }
    else if (risk >= 40) { riskTxt = `中高风险 (${risk})`; riskCol = '#FF9500'; riskIc = "exclamationmark.shield.fill"; }
    else { riskTxt = `纯净低危 (${risk})`; riskCol = C_GREEN; riskIc = "checkmark.shield.fill"; }
  }

  const Row = (ic, icCol, label, val, valCol) => ({
    type: 'stack', direction: 'row', alignItems: 'center', gap: 6,
    children: [
      { type: 'image', src: `sf-symbol:${ic}`, color: icCol, width: 14, height: 14 },
      { type: 'text', text: label, font: { size: 11 }, textColor: C_SUB },
      { type: 'spacer' },
      { type: 'text', text: val, font: { size: 11, weight: 'bold', family: 'Menlo' }, textColor: valCol, maxLines: 1, minScale: 0.6 }
    ]
  });

  return {
    type: 'widget', padding: 14, backgroundGradient: { type: 'linear', colors: BG_COLORS, startPoint: { x: 0, y: 0 }, endPoint: { x: 1, y: 1 } },
    children: [
      { type: 'stack', direction: 'row', alignItems: 'center', gap: 6, children: [
          { type: 'image', src: 'sf-symbol:shield.lefthalf.filled', color: C_TITLE, width: 16, height: 16 },
          { type: 'text', text: 'IP 纯净度', font: { size: 14, weight: 'heavy' }, textColor: C_TITLE },
          { type: 'spacer' }, { type: 'text', text: 'IPPure', font: { size: 9 }, textColor: 'rgba(255,255,255,0.2)' }
      ]},
      { type: 'spacer', length: 14 },
      { type: 'stack', direction: 'column', gap: 6, children: [
          Row("globe", { light: '#00AAE4', dark: '#00AAE4' }, "IPv4", ip, C_GREEN),
          Row("number.square.fill", { light: '#00AAE4', dark: '#00AAE4' }, "归属网络", asn, C_GREEN),
          Row("mappin.and.ellipse", { light: '#9945FF', dark: '#9945FF' }, "位置", loc, C_GREEN),
          Row("building.2.fill", { light: '#9945FF', dark: '#9945FF' }, "原生属性", native, C_GREEN),
          Row(riskIc, riskCol, "风险评级", riskTxt, riskCol)
      ]},
      { type: 'spacer' }
    ]
  };
}