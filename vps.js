export default async function (ctx) {
  const veid = "YOUR_VEID_HERE";
  const api_key = "YOUR_API_KEY_HERE";

  const BG_MAIN = { light: '#FFFFFF', dark: '#0D0D1A' };
  const TEXT_MAIN = { light: '#1C1C1E', dark: '#FFFFFF' };
  const TEXT_SUB = { light: '#8E8E93', dark: '#EBEBF5' };

  const C_TITLE = { light: '#000000', dark: '#FFFFFF' };
  const C_GREEN = { light: '#34C759', dark: '#32D74B' };
  const C_YELLOW = { light: '#FFCC00', dark: '#FFD60A' };
  const C_RED = { light: '#FF3B30', dark: '#FF3B30' };

  // ❗ 未填写提示
  if (veid === "YOUR_VEID_HERE" || api_key === "YOUR_API_KEY_HERE") {
    return {
      type: 'widget',
      padding: 14,
      backgroundColor: BG_MAIN,
      children: [
        { type: 'text', text: '⚠️ 请填写 VEID / API Key', textColor: C_RED }
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
      type: 'widget',
      padding: 14,
      backgroundColor: BG_MAIN,
      children: [
        { type: 'text', text: '❌ API 请求失败', textColor: C_RED }
      ]
    };
  }

  const used = data.data_counter || 0;
  const total = data.plan_monthly_data || 1;
  const percent = Math.min((used / total) * 100, 100);

  function toGB(b) {
    return (b / 1024 ** 3).toFixed(2) + ' GB';
  }

  const resetDate = new Date((data.data_next_reset || 0) * 1000);
  const resetStr = `${resetDate.getFullYear()}-${resetDate.getMonth()+1}-${resetDate.getDate()}`;

  const location = data.node_location || '未知';
  const ip = (data.ip_addresses && data.ip_addresses[0]) || 'N/A';

  const color =
    percent >= 90 ? C_RED :
    percent >= 70 ? C_YELLOW :
    C_GREEN;

  return {
    type: 'widget',
    padding: 14,
    backgroundColor: BG_MAIN,
    children: [

      { type: 'text', text: '☁️ BWH 流量', font: { size: 16, weight: 'bold' }, textColor: C_TITLE },

      { type: 'text', text: `📍 ${location}`, textColor: TEXT_SUB },
      { type: 'text', text: `🌐 ${ip}`, textColor: TEXT_SUB },

      { type: 'text', text: `${toGB(used)} / ${toGB(total)}`, textColor: TEXT_MAIN },

      // 👉 用“进度条模拟”
      {
        type: 'text',
        text: `████████████████`.slice(0, Math.round(percent / 6.25)),
        textColor: color
      },

      {
        type: 'text',
        text: `${percent.toFixed(1)}%`,
        textColor: color,
        font: { weight: 'bold' }
      },

      { type: 'text', text: `🔄 ${resetStr}`, textColor: TEXT_SUB }

    ]
  };
}