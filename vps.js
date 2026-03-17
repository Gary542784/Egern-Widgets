/**
 * 📌 桌面小组件: ☁️ 搬瓦工 (BWH) 流量监控 (彻底修复 iOS 深浅自适应 纯色版)
 * ✨ 特色功能: 移除渐变背景，改用原生纯色，完美秒级跟随系统深浅模式切换
 * ⚠️ 使用说明: 运行前请务必填写下方 VEID 和 API Key
 * ==========================================
 */

export default async function (ctx) {
  // 🔑 请在此处填写你的搬瓦工 VEID 和 API Key (保留双引号)
  const veid = "YOUR_VEID_HERE";
  const api_key = "YOUR_API_KEY_HERE";

  // ✨ 环境探针：精准抓取 iOS 深浅模式
  const isDark = ctx?.device?.colorScheme === 'dark';

  // 🎨 iOS 深浅自适应原生颜色配置 (与全功能网络看板保持 100% 一致)
  const BG_MAIN    = isDark ? '#0D0D1A' : '#FFFFFF'; // 深色黑紫，浅色纯白
  const TEXT_MAIN  = isDark ? '#FFFFFF' : '#1C1C1E'; // 深色白，浅色黑
  const TEXT_SUB   = isDark ? '#EBEBF5' : '#8E8E93'; // 副标题灰度
  const BAR_BG     = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'; // 进度条底槽颜色

  const C_TITLE    = isDark ? '#FFD700' : '#FF9500'; // 标题：金/橙
  const C_GREEN    = isDark ? '#32D74B' : '#34C759'; // 安全：亮绿/iOS绿
  const C_YELLOW   = isDark ? '#FFD60A' : '#FFCC00'; // 警告：亮黄/iOS黄
  const C_RED      = isDark ? '#FF3B30' : '#FF3B30'; // 危险：红
  
  const IC_BLUE    = isDark ? '#00AAE4' : '#007AFF'; // 节点图标：亮蓝/原生蓝
  const IC_PURPLE  = isDark ? '#9945FF' : '#AF52DE'; // 流量图标：亮紫/原生紫

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

  // 进度条颜色逻辑：>90% 变红，>70% 变橙(黄)，正常为绿
  const barColor = usedPercent >= 90 ? C_RED : usedPercent >= 70 ? C_YELLOW : C_GREEN;
  
  // 确保 Flex 值有效且至少为 1，防止布局塌陷
  const usedFlex = Math.max(Math.round(usedPercent), 1);
  const remainFlex = Math.max(100 - usedFlex, 1);

  const realNow = new Date();
  const timeStr = `${String(realNow.getHours()).padStart(2, '0')}:${String(realNow.getMinutes()).padStart(2, '0')}:${String(realNow.getSeconds()).padStart(2, '0')}`;

  // ✨ Row 样式：自适应系统文本色
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
    // ✨ 移除渐变，采用系统原生支持最完美的纯色背景
    backgroundColor: BG_MAIN, 
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

          // 进度条 (动态适应深浅底槽颜色)
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

          // 下面这三行不传 size，默认使用 11 保持精致紧凑
          Row("chart.pie.fill", IC_PURPLE, "流量使用", `${toGB(used)} / ${toGB(total)}`, TEXT_MAIN),
          Row("arrow.triangle.2.circlepath", IC_PURPLE, "重置日期", resetStr, C_GREEN),
          Row("clock.fill", C_GREEN, "执行时间", timeStr, C_GREEN)
      ]},
      { type: 'spacer' }
    ]
  };
}
