/**
 * ==========================================
 * 📌 桌面小组件模板: ☁️ 搬瓦工 (BWH) 流量监控
 * ✨ 特色功能: 原生深浅色自适应，进度条防塌陷，分级字号
 * ⚠️ 使用说明: 运行前请务必填写下方 VEID 和 API Key
 * ==========================================
 */

export default async function (ctx) {
  // 🔑 请在此处填写你的搬瓦工 VEID 和 API Key (保留双引号)
  const veid = "YOUR_VEID_HERE";
  const api_key = "YOUR_API_KEY_HERE";

  // 🎨 系统级自适应配色 (Light / Dark 动态切换)
  const BG_COLOR = { light: '#FFFFFF', dark: '#1C1C1E' };         // 卡片背景色
  const PROG_BG = { light: '#E5E5EA', dark: '#38383A' };          // 进度条底色
  const C_TITLE = { light: '#000000', dark: '#FFFFFF' };          // 标题颜色
  const C_MAIN = { light: '#000000', dark: '#FFFFFF' };           // 主要数据颜色
  const C_SUB = { light: '#8E8E93', dark: '#8E8E93' };            // 次要文本/标签颜色 (系统灰)
  const C_GREEN = { light: '#34C759', dark: '#32D74B' };          // 成功/时间颜色 (系统绿)
  const C_ICON_BLUE = { light: '#007AFF', dark: '#0A84FF' };      // 网络图标颜色 (系统蓝)
  const C_ICON_PURPLE = { light: '#AF52DE', dark: '#BF5AF2' };    // 流量图标颜色 (系统紫)

  // 检查是否填写了 Key
  if (veid === "YOUR_VEID_HERE" || api_key === "YOUR_API_KEY_HERE") {
    return {
      type: 'widget', padding: 14,
      backgroundColor: BG_COLOR,
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
      backgroundColor: BG_COLOR,
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
  const barColor = usedPercent >= 90 ? '#FF3B30' : usedPercent >= 70 ? '#FF9500' : '#34C759';
  
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
    backgroundColor: BG_COLOR, // 👈 切换为纯色自适应背景
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
          Row("network", C_ICON_BLUE, "节点 IP", ip, C_MAIN, 13),
          Row("mappin.and.ellipse", C_ICON_BLUE, "节点位置", location, C_MAIN, 13),
          
          { type: 'spacer', length: 2 }, 

          // 进度条 (终极防塌陷，底色自适应)
          { type: 'stack', direction: 'row', height: 4, borderRadius: 2, backgroundColor: PROG_BG, children: [
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
          Row("chart.pie.fill", C_ICON_PURPLE, "流量使用", `${toGB(used)} / ${toGB(total)}`, C_MAIN),
          Row("arrow.triangle.2.circlepath", C_ICON_PURPLE, "重置日期", resetStr, C_GREEN),
          Row("clock.fill", C_GREEN, "执行时间", timeStr, C_GREEN)
      ]},
      { type: 'spacer' }
    ]
  };
}