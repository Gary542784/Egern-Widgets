/**
 * 📌 桌面小组件: ☁️ 搬瓦工 (BWH) 流量监控 (终极系统自适应秒切版)
 * ✨ 特色功能: 规避 Egern 渲染 Bug，实现 iOS 深浅模式 0 延迟秒切
 * ⚠️ 使用说明: 运行前请务必填写下方 VEID 和 API Key
 * ==========================================
 */

export default async function (ctx) {
  // 🔑 请在此处填写你的搬瓦工 VEID 和 API Key (保留双引号)
  const veid = "YOUR_VEID_HERE";
  const api_key = "YOUR_API_KEY_HERE";

  // 🎨 iOS 原生动态颜色对象 (直接交给系统，实现无缝秒切)
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
      type: 'widget', padding: 14, 
      backgroundGradient: { type: 'linear', colors: [BG_MAIN, BG_MAIN], startPoint: { x: 0, y: 0 }, endPoint: { x: 1, y: 1 } },
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
      type: 'widget', padding: 14, 
      backgroundGradient: { type: 'linear', colors: [BG_MAIN, BG_MAIN], startPoint: { x: 0, y: 0 }, endPoint: { x: 1, y: 1 } },
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

  // 进度条颜色逻辑
  const barColor = usedPercent >= 90 ? C_RED : usedPercent >= 70 ? C_YELLOW : C_GREEN;