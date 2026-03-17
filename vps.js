/**
 * 📌 桌面小组件: ☁️ 搬瓦工 (BWH) 流量监控 (终极系统自适应秒切版)
 * ✨ 特色功能: iOS 深浅模式 0 延迟切换
 */

export default async function (ctx) {
  // 🔑 填写你的信息
  const veid = "YOUR_VEID_HERE";
  const api_key = "YOUR_API_KEY_HERE";

  // 🎨 颜色配置（完全自适应 iOS 深浅模式）
  const BG_MAIN    = { light: '#FFFFFF', dark: '#0D0D1A' };
  const TEXT_MAIN  = { light: '#1C1C1E', dark: '#FFFFFF' };
  const TEXT_SUB   = { light: '#8E8E93', dark: '#EBEBF5' };
  const BAR_BG     = { light: '#E5E5EA', dark: '#2C2C2E' };

  // ✅ 标题改为黑色（自动适配）
  const C_TITLE    = { light: '#000000', dark: '#FFFFFF' };

  const C_GREEN    = { light: '#34C759', dark: '#32D74B' };
  const C_YELLOW   = { light: '#FFCC00', dark: '#FFD60A' };
  const C_RED      = { light: '#FF3B30', dark: '#FF3B30' };

  const IC_BLUE    = { light: '#007AFF', dark: '#00AAE4' };
  const IC_PURPLE  = { light: '#AF52DE', dark: '#9945FF' };

  // ❗ 未填写提示
  if (veid === "YOUR_VEID_HERE" || api_key === "YOUR_API_KEY_HERE") {
    return {
      type: 'widget',
      padding: 14,
      backgroundGradient: {
        type: 'linear',
        colors: [BG_MAIN, BG_MAIN],
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 1, y: 1 }
      },
      children: [
        {
          type: 'text',
          text: '⚠️ 请先填写 VEID 和 API Key',
          font: { size: 14, weight: 'bold' },
          textColor: C_RED
        }
      ]
    };
  }

  // 🌐 API 请求
  const apiUrl = `https://api.64clouds.com/v1/getServiceInfo?veid=${veid}&api_key=${api_key}`;

  let data;
  try {
    const resp = await ctx.http.get(apiUrl);
    data = await resp.json();
  } catch (e) {
    return {
      type: 'widget',
      padding: 14,
      backgroundGradient: {
        type: 'linear',
        colors: [BG_MAIN, BG_MAIN],
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 1, y: 1 }
      },
      children: [
        {
          type: 'text',
          text: '⚠️ API 请求失败',
          font: { size: 14, weight: 'bold' },
          textColor: C_RED
        }
      ]
    };
  }

  // 📊 流量计算
  const used = data.data_counter || 0;
  const total = data.plan_monthly_data || 1;
  const usedPercent = Math.min((used / total) * 100, 100);

  function toGB(bytes) {
    return (bytes / 1024 ** 3).toFixed(2) + ' GB';
  }

  // 📅 重置时间
  const resetDate = new Date((data.data_next_reset || 0) * 1000);
  const resetStr = `${resetDate.getFullYear()}-${String(resetDate.getMonth() + 1).padStart(2, '0')}-${String(resetDate.getDate()).padStart(2, '0')}`;

  // 🌍 节点信息
  const location = data.node_location || '未知';
  const ip = (data.ip_addresses && data.ip_addresses[0]) || 'N/A';

  // 🎯 进度条颜色
  const barColor =
    usedPercent >= 90 ? C_RED :
    usedPercent >= 70 ? C_YELLOW :
    C_GREEN;

  // 🧱 UI 渲染
  return {
    type: 'widget',
    padding: 14,
    backgroundGradient: {
      type: 'linear',
      colors: [BG_MAIN, BG_MAIN],
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 1, y: 1 }
    },
    children: [

      // 🏷 标题
      {
        type: 'text',
        text: '☁️ BWH 流量监控',
        font: { size: 16, weight: 'bold' },
        textColor: C_TITLE
      },

      // 🌍 节点
      {
        type: 'text',
        text: `📍 ${location}`,
        font: { size: 12 },
        textColor: TEXT_SUB
      },

      // 🌐 IP
      {
        type: 'text',
        text: `🌐 ${ip}`,
        font: { size: 12 },
        textColor: TEXT_SUB
      },

      // 📊 使用情况
      {
        type: 'text',
        text: `${toGB(used)} / ${toGB(total)}`,
        font: { size: 13, weight: 'medium' },
        textColor: TEXT_MAIN
      },

      // 📈 进度条
      {
        type: 'progress',
        value: usedPercent / 100,
        color: barColor,
        backgroundColor: BAR_BG,
        height: 6,
        cornerRadius: 3
      },

      // 📅 重置时间
      {
        type: 'text',
        text: `🔄 重置: ${resetStr}`,
        font: { size: 11 },
        textColor: TEXT_SUB
      }
    ]
  };
}