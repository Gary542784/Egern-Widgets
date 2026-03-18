/**
 * 🚀 BWH 流量监控 Pro (20:09 像素级复刻·色彩精准修正版)
 * 优化：图标固定科技蓝、百分比与进度条动态变色、数值全员回归黑白色
 */
export default async function (ctx) {
  // 🔑 请填写搬瓦工 VEID 和 API Key
  const veid = "YOUR_VEID_HERE";
  const api_key = "YOUR_API_KEY_HERE";

  const BG_MAIN   = { light: '#FFFFFF', dark: '#1C1C1E' }; 
  const C_TITLE   = { light: '#111111', dark: '#FFFFFF' }; 
  const C_SUB     = { light: '#8E8E93', dark: '#8E8E93' }; // 标签灰色
  const C_MAIN    = { light: '#1C1C1E', dark: '#E5E5EA' }; // 数值黑白色
  const ICON_BLUE = { light: '#007AFF', dark: '#0A84FF' }; // 固定图标科技蓝
  const BAR_BG    = { light: '#0000001A', dark: '#FFFFFF22'}; 

  // 预警色（仅用于百分比和进度条）
  const C_GREEN  = { light: '#34C759', dark: '#30D158' }; 
  const C_ORANGE = { light: '#FF9500', dark: '#FF9F0A' }; 
  const C_RED    = { light: '#FF3B30', dark: '#FF453A' }; 

  if (veid === "YOUR_VEID_HERE" || api_key === "YOUR_API_KEY_HERE") {
      return { type: 'widget', padding: 14, backgroundColor: BG_MAIN, children: [{ type: 'text', text: '⚠️ 请先填写密钥', font: { size: 14, weight: 'bold' }, textColor: '#FF3B30' }] };
  }

  const apiUrl = `https://api.64clouds.com/v1/getServiceInfo?veid=${veid}&api_key=${api_key}`;
  let data;
  try {
      const resp = await ctx.http.get(apiUrl);
      data = await resp.json();
  } catch (e) {
      return { type: 'widget', padding: 14, backgroundColor: BG_MAIN, children: [{ type: 'text', text: '⚠️ 请求失败', font: { size: 14, weight: 'bold' }, textColor: '#FF3B30' }] };
  }

  const used = data.data_counter || 0;
  const total = data.plan_monthly_data || 1;
  const usedPercent = Math.min((used / total) * 100, 100) || 0;
  function toGB(bytes) { return (bytes / 1024 ** 3).toFixed(2) + ' GB'; }

  // 🟢 流量预警色逻辑
  let themeDynamicColor = C_GREEN; 
  if (usedPercent >= 80) themeDynamicColor = C_RED;
  else if (usedPercent >= 50) themeDynamicColor = C_ORANGE;

  const resetDate = new Date((data.data_next_reset || 0) * 1000);
  const resetStr = `${resetDate.getFullYear()}-${String(resetDate.getMonth() + 1).padStart(2, '0')}-${String(resetDate.getDate()).padStart(2, '0')}`;
  const location = data.node_location || '未知';
  const ip = (data.ip_addresses && data.ip_addresses[0]) ? data.ip_addresses[0] : 'N/A';

  const usedFlex = Math.max(Math.round(usedPercent), 1);
  const remainFlex = Math.max(100 - usedFlex, 1);
  
  const realNow = new Date();
  const timeStr = `${String(realNow.getHours()).padStart(2, '0')}:${String(realNow.getMinutes()).padStart(2, '0')}:${String(realNow.getSeconds()).padStart(2, '0')}`;

  // 🛠 Row 布局：图标颜色固定 ICON_BLUE，数值颜色固定 C_MAIN
  const Row = (ic, label, val) => ({
      type: 'stack', direction: 'row', alignItems: 'center', gap: 6, padding: [1.5, 0],
      children: [
          { type: 'image', src: `sf-symbol:${ic}`, color: ICON_BLUE, width: 12, height: 12 },
          { type: 'text', text: label, font: { size: 11.5 }, textColor: C_SUB },
          { type: 'text', text: ` ${val}`, font: { size: 11.5, weight: 'medium' }, textColor: C_MAIN },
          { type: 'spacer' }
      ]
  });

  return {
      type: 'widget', padding: 14,
      backgroundColor: BG_MAIN,
      children: [
          // 顶部：标题黑色，百分比跟随流量变色
          { type: 'stack', direction: 'row', alignItems: 'center', gap: 6, children: [
              { type: 'image', src: 'sf-symbol:list.bullet.indent', color: C_TITLE, width: 15, height: 15 },
              { type: 'text', text: 'BWH 流量', font: { size: 14, weight: 'heavy' }, textColor: C_TITLE },
              { type: 'spacer' },
              { type: 'text', text: `${usedPercent.toFixed(1)}%`, font: { size: 12, weight: 'bold' }, textColor: themeDynamicColor }
          ]},
          { type: 'spacer', length: 12 },

          // 上部节点信息
          { type: 'stack', direction: 'column', gap: 2, children: [
              Row("globe", "节点 IP", ip),
              Row("mappin.and.ellipse", "节点位置", location),
          ]},

          { type: 'spacer', length: 8 },

          // 进度条 (根据流量变色)
          { type: 'stack', direction: 'row', height: 3.5, borderRadius: 1.75, backgroundColor: BAR_BG, children: [
              { type: 'stack', flex: usedFlex, height: 3.5, backgroundColor: themeDynamicColor, borderRadius: 1.75, children: [{ type: 'spacer' }] },
              { type: 'stack', flex: remainFlex, height: 3.5, children: [{ type: 'spacer' }] }
          ]},

          { type: 'spacer', length: 10 },

          // 下部流量信息 (数值全黑)
          { type: 'stack', direction: 'column', gap: 2, children: [
              Row("doc.plaintext", "流量使用", `${toGB(used)} / ${toGB(total)}`),
              Row("calendar", "重置日期", resetStr),
              Row("clock", "执行时间", timeStr)
          ]},
          { type: 'spacer' }
      ]
  };
}