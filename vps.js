/**
 * ==========================================
 * 📌 桌面小组件模板: ☁️ 搬瓦工 (BWH) 流量监控
 * ✨ 特色功能: 深色赛博渐变背景，进度条防塌陷，分级字号
 * ⚠️ 使用说明: 运行前请务必填写下方 VEID 和 API Key
 * ==========================================
 */

export default async function (ctx) {
  // 🔑 请在此处填写你的搬瓦工 VEID 和 API Key (保留双引号)
  const veid = "YOUR_VEID_HERE";
  const api_key = "YOUR_API_KEY_HERE";

  // 🎨 统一深色主题配色 (代理检测同款)
  const BG_COLORS = [{ light: '#0D0D1A', dark: '#0D0D1A' }, { light: '#2D1B69', dark: '#2D1B69' }];
  const C_TITLE = { light: '#FFD700', dark: '#FFD700' }; 
  const C_SUB = { light: '#A2A2B5', dark: '#A2A2B5' };   
  const C_GREEN = { light: '#32D74B', dark: '#32D74B' }; 
  const C_MAIN = { light: '#FFFFFF', dark: '#FFFFFF' };

  // 检查是否填写了 Key
  if (veid === "YOUR_VEID_HERE" || api_key === "YOUR_API_KEY_HERE") {
    return {
      type: 'widget', padding: 14,
      backgroundGradient: { type: 'linear', colors: BG_COLORS, startPoint: { x: 0, y: 0 }, endPoint: { x: 1, y: 1 } },
      children: [
        { type: 'text', text: '⚠️ 请先在脚本内填写 VEID 和 API Key', font: { size: 14, weight: 'bold' }, textColor: '#FF3B30' }
      ]
    };
  }

  const apiUrl = `https://api.64clouds.com/v1/getServiceInfo?veid=${veid}&api_key=${api_key}`;

  let data;
  try {
    const resp = await ctx.http.get(apiUrl);
    data = await resp.json();
  } catch (e) {
    return {
      type: 'widget', padding: 14,
      backgroundGradient: { type: 'linear', colors: BG_COLORS, startPoint: { x: 0, y: 0 }, endPoint: { x: 1, y: 1 } },
      children: [
        { type: 'text', text: '⚠️ API 请求失败，请检查网络或密钥', font: { size: 14, weight: 'bold' }, textColor: '#FF3B30' }
      ]
    };
  }

  // 流量计算逻辑
  const used = data.data_counter || 0;
  const total = data.plan_monthly_data || 1;
  const usedPercent = Math.min((used / total) * 100, 100) || 0;

  function toGB(bytes) {
    return (bytes / 1024 ** 3).toFixed(2) + ' GB';
  }

  // 日期与节点信息
  const resetDate = new Date((data.data_next_reset || 0) * 1000);
  const resetStr = resetDate.getFullYear() + '-'
    + String(resetDate.getMonth() + 1).padStart(2, '0') + '-'
    + String(resetDate.getDate()).padStart(2, '0');

  const location = data.node_location || '未知';
  const ip = (data.ip_addresses && data.ip_addresses[0]) ? data.ip_addresses[0] : 'N/A';

  // 进度条颜色逻辑：>90% 变红，>70% 变橙，正常为绿
  const barColor = usedPercent >= 90 ? '#FF375F' : usedPercent >= 70 ? '#FF9500' : '#32D74B';
  
  // 确保 Flex 值有效且至少为 1
  const usedFlex = Math.max(Math.round(usedPercent), 1);
  const remainFlex = Math.max(100 - usedFlex, 1);

  const realNow = new Date();
  const timeStr = `${String(realNow.getHours()).padStart(2, '0')}:${String(realNow.getMinutes()).padStart(2, '0')}:${String(realNow.getSeconds()).padStart(2, '0')}`;

  // ✨ Row 样式：新增 size 参数（默认 11），图标也会根据字号微调大小
  const Row = (ic, icCol, label, val, valCol, size = 11) => ({
    type: 'stack', direction: 'row', alignItems: 'center', gap: 6,
    children: [
      { type: 'image', src: `sf-symbol:${ic}`, color: icCol, width: size + 2, height: size + 2 },
      { type: 'text', text: label, font: { size: size }, textColor: C_SUB },
      { type: 'spacer' },
      { type: 'text', text: val, font: { size: size, weight: 'bold', family: 'Menlo' }, textColor: valCol, maxLines: 1, minScale: 0.6 }
    ]
  });

  return {
    type: 'widget', padding: 14,
    backgroundGradient: { type: 'linear', colors: BG_COLORS, startPoint: { x: 0, y: 0 }, endPoint: { x: 1, y: 1 } },
    children: [
      // 顶部标题栏
      { type: 'stack', direction: 'row', alignItems: 'center', gap: 6, children: [
          { type: 'image', src: 'sf-symbol:server.rack', color: C_TITLE, width: 16, height: 16 },
          { type: 'text', text: 'BWH 流量', font: { size: 14, weight: 'heavy' }, textColor: C_TITLE },
          { type: 'spacer' },
          { type: 'text', text: `${usedPercent.toFixed(1)}%`, font: { size: 12, weight: 'bold', family: 'Menlo' }, textColor: barColor }
      ]},
      { type: 'spacer', length: 10 },
      
      // 数据详情区
      { type: 'stack', direction: 'column', gap: 6, children: [
          Row("network", { light: '#00AAE4', dark: '#00AAE4' }, "节点 IP", ip, C_MAIN, 13),
          Row("mappin.and.ellipse", { light: '#00AAE4', dark: '#00AAE4' }, "节点位置", location, C_MAIN, 13),
          
          { type: 'spacer', length: 2 }, 

          // 进度条 (终极防塌陷)
          { type: 'stack', direction: 'row', height: 4, borderRadius: 2, backgroundColor: '#FFFFFF22', children: [
              { 
                type: 'stack', 
                flex: usedFlex, 
                height: 4,           
                backgroundColor: barColor, 
                borderRadius: 2, 
                children: [{ type: 'spacer' }] 
              },
              { 
                type: 'stack', 
                flex: remainFlex, 
                height: 4,           
                children: [{ type: 'spacer' }] 
              }
          ]},

          { type: 'spacer', length: 2 }, 

          // 下面这三行不传 size，默认使用 11 保持精致紧凑
          Row("chart.pie.fill", { light: '#9945FF', dark: '#9945FF' }, "流量使用", `${toGB(used)} / ${toGB(total)}`, C_MAIN),
          Row("arrow.triangle.2.circlepath", { light: '#9945FF', dark: '#9945FF' }, "重置日期", resetStr, C_GREEN),
          Row("clock.fill", { light: '#32D74B', dark: '#32D74B' }, "执行时间", timeStr, C_GREEN)
      ]},
      { type: 'spacer' }
    ]
  };
}