/**
 * 📌 桌面小组件: 🛡️ IP 纯净度雷达 (像素级对齐 + 容错增强版)
 * ✨ 修复了隐形非法字符，确保所有变量定义完整，加入备用解析逻辑。
 */
export default async function(ctx) {
  // 1. 定义核心颜色与配置
  const BG_COLORS = [{ light: '#0D0D1A', dark: '#0D0D1A' }, { light: '#2D1B69', dark: '#2D1B69' }];
  const C_TITLE = { light: '#FFD700', dark: '#FFD700' }; // 黄色标题
  const C_SUB = { light: '#A2A2B5', dark: '#A2A2B5' };   // 灰色标签
  const C_GREEN = { light: '#32D74B', dark: '#32D74B' }; // 极客绿数值
  const C_WHITE = { light: '#FFFFFF', dark: '#FFFFFF' }; // 纯白数值

  // 2. 数据获取 (增加 UA 和超时控制)
  let d = {};
  try {
    const res = await ctx.http.get('https://my.ippure.com/v1/info', { 
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 5000 
    });
    const text = await res.text();
    if (text) d = JSON.parse(text);
  } catch (e) {
    console.log("IPPure 获取失败: " + e.message);
  }

  // 3. 数据解析与容错处理
  const ip = d.ip || "获取失败";
  const ipLabel = ip.includes(':') ? "IPv6" : "IPv4";
  const asn = d.asn ? `AS${d.asn} ${d.asOrganization || ""}`.trim() : "未知网络";
  
  // 旗帜处理
  let code = d.countryCode || "";
  if (code.toUpperCase() === 'TW') code = 'CN';
  let flag = "🌐";
  if (code) {
    try {
      flag = String.fromCodePoint(...code.toUpperCase().split('').map(c => 127397 + c.charCodeAt()));
    } catch (e) { flag = "📍"; }
  }
  const loc = `${flag} ${d.country || ""} ${d.city || ""}`.trim() || "未知位置";
  
  // 原生识别
  const native = d.isResidential === true ? "🏠 是 (原生住宅)" : (d.isResidential === false ? "🏢 否 (商业机房)" : "未知属性");

  // 风险评估
  const risk = d.fraudScore;
  let riskTxt = "获取失败", riskCol = C_SUB, riskIc = "questionmark.shield.fill";
  if (risk !== undefined && risk !== null) {
    if (risk >= 80) { 
      riskTxt = `极高风险 (${risk})`; 
      riskCol = { light: '#FF3B30', dark: '#FF3B30' }; 
      riskIc = "xmark.shield.fill"; 
    } else if (risk >= 40) { 
      riskTxt = `中高风险 (${risk})`; 
      riskCol = { light: '#FF9500', dark: '#FF9500' }; 
      riskIc = "exclamationmark.shield.fill"; 
    } else { 
      riskTxt = `纯净低危 (${risk})`; 
      riskCol = C_GREEN; 
      riskIc = "checkmark.shield.fill"; 
    }
  }

  // 4. 统一布局行组件
  const Row = (ic, icCol, label, val, valCol) => ({
    type: 'stack', direction: 'row', alignItems: 'center', gap: 6,
    children: [
      { type: 'image', src: `sf-symbol:${ic}`, color: icCol, width: 13, height: 13 },
      { type: 'text', text: label, font: { size: 11 }, textColor: C_SUB },
      { type: 'spacer' },
      { type: 'text', text: val, font: { size: 11, weight: 'bold', family: 'Menlo' }, textColor: valCol, maxLines: 1, minScale: 0.6 }
    ]
  });

  // 5. 返回最终渲染对象
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
          Row("mappin.and.ellipse", { light: '#9945FF', dark: '#9945FF' }, "位置", loc, C_WHITE),
          Row("building.2.fill", { light: '#9945FF', dark: '#9945FF' }, "原生属性", native, C_WHITE),
          Row(riskIc, riskCol, "风险评级", riskTxt, riskCol)
      ]},
      { type: 'spacer' }
    ]
  };
}
