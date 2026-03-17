/**
 * 📌 桌面小组件: ☁️ 搬瓦工 (BWH) 流量监控 (真·系统自适应 秒切版)
 * ✨ 特色功能: 完全移除 JS 静态判断，交由 iOS 底层引擎实现深浅模式的 0 延迟秒切
 * ⚠️ 使用说明: 运行前请务必填写下方 VEID 和 API Key
 * ==========================================
 */

export default async function (ctx) {
  // 🔑 请在此处填写你的搬瓦工 VEID 和 API Key (保留双引号)
  const veid = "YOUR_VEID_HERE";
  const api_key = "YOUR_API_KEY_HERE";

  // 🎨 iOS 原生动态颜色对象 (直接交给系统，实现秒切，绝不写死！)
  const BG_MAIN    = { light: '#FFFFFF', dark: '#0D0D1A' }; // 浅色纯白，深色黑紫
  const TEXT_MAIN  = { light: '#1C1C1E', dark: '#FFFFFF' }; // 浅色黑，深色白
  const TEXT_SUB   = { light: '#8E8E93', dark: '#EBEBF5' }; // 副标题灰度
  const BAR_BG     = { light: '#E5E5EA', dark: '#2C2C2E' }; // 进度条底槽颜色

  const C_TITLE    = { light: '#FF9500', dark: '#FFD700' }; // 标题：橙/金
  const C_GREEN    = { light: '#34C759', dark: '#32D74B' }; // 安全：iOS绿/亮绿
  const C_YELLOW   = { light: '#FFCC00', dark: '#FFD60A' }; // 警告：iOS黄/亮黄
  const C_RED      = { light: '#FF3B30', dark: '#FF3B30' }; // 危险：红
  
  const IC_BLUE    = { light: '#007AFF', dark: '#00AAE4' }; // 节点图标：原生蓝/亮蓝
  const IC_PURPLE  = { light: '#AF52DE', dark: '#9945FF' }; // 流量图标：原生紫/亮紫

  // 检查是否填写了 Key
  if (veid === "YOUR_VEID_HERE" || api_key === "YOUR_API_KEY_HERE") {
    return {
      type: 'widget', padding: 14, backgroundColor: BG_MAIN,
      children: [
        { type: 'text', text: '⚠️ 请先在脚本内填写 VEID 和 API Key', font: { size: 14, weight: 'bold' }, textColor: C_RED }
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
      type: 'widget', padding: 14, backgroundColor: BG_MAIN,
      children: [
        { type: 'text', text: '⚠️ API 请求失败，请检查网络或密钥', font: { size: 14, weight: 'bold' }, textColor: C_RED }
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

  // 进度条颜色逻辑：>90% 变红，>70% 变黄，正常为绿
  const barColor = usedPercent >= 90 ? C_RED : usedPercent >= 70 ? C_YELLOW : C_GREEN;
  
  // 确保 Flex 值有效且至少为 1，防止布局塌陷
  const usedFlex = Math.max(Math.round(usedPercent), 1);
  const remainFlex = Math.max(100 - usedFlex, 1);

  const realNow = new Date();
  const timeStr = `${String(realNow.getHours()).padStart(2, '0')}:${String(realNow.getMinutes()).padStart(2, '0')}:${String(realNow.getSeconds()).padStart(2, '0')}`;

  // ✨ Row 样式：全部挂载动态颜色对象
  const Row = (ic, icCol, label, val, valCol, size = 11) => ({
    type: 'stack', direction: 'row', alignItems: 'center', gap: 6,
    children: [
      { type: 'image', src: `sf-symbol:${ic}`, color: icCol, width: size + 2, height: size + 2 },
      { type: 'text', text: label, font: { size: size }, textColor: TEXT_SUB },
      { type: 'spacer' },
      { type: 'text', text: val, font: { size: size, weight: 'bold', family: 'Menlo' }, textColor: valCol, maxLines: 1, minScale: 0.6 }
    ]
  });

  return {
    type: 'widget', 
    padding: 14,
    backgroundColor: BG_MAIN, // 纯血统的原生动态背景
    refreshPolicy: { onNetworkChange: true, onEnter: true, timeout: 10 },
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
          Row("network", IC_BLUE, "节点 IP", ip, TEXT_MAIN, 13),
          Row("mappin.and.ellipse", IC_BLUE, "节点位置", location, TEXT_MAIN, 13),
          
          { type: 'spacer', length: 2 }, 

          // 进度条
          { type: 'stack', direction: 'row', height: 4, borderRadius: 2, backgroundColor: BAR_BG, children: [
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

          Row("chart.pie.fill", IC_PURPLE, "流量使用", `${toGB(used)} / ${toGB(total)}`, TEXT_MAIN),
          Row("arrow.triangle.2.circlepath", IC_PURPLE, "重置日期", resetStr, C_GREEN),
          Row("clock.fill", C_GREEN, "执行时间", timeStr, C_GREEN)
      ]},
      { type: 'spacer' }
    ]
  };
}
