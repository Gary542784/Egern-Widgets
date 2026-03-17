/**
 * 🚀 全功能网络看板 Pro (彻底修复 iOS 深浅自适应 纯色版)
 * 集成：双 IP 检测、网络类型、真实延迟、流媒体解锁 (NF/GPT/TK/GMNI/D+)、IP 纯净度
 */
export default async function(ctx) {
  // ===================== iOS 深浅自适应原生颜色 =====================
  // 完全弃用 backgroundGradient，改用系统秒识别的 backgroundColor
  const BG_MAIN   = { light: '#FFFFFF', dark: '#0D0D1A' }; // 浅色纯白，深色深紫
  const C_MAIN    = { light: '#1C1C1E', dark: '#FFFFFF' }; // 浅色纯黑，深色纯白
  const C_SUB     = { light: '#8E8E93', dark: '#A2A2B5' }; // 浅色灰，深色透白
  
  const C_TITLE   = { light: '#1C1C1E', dark: '#FFFFFF' }; // 标题文字：黑/白
  const C_GREEN   = { light: '#34C759', dark: '#32D74B' }; // 强调绿：iOS绿/亮绿
  const C_YELLOW  = { light: '#FF9500', dark: '#FFD700' }; // 强调黄：iOS橙/金黄
  const C_RED     = { light: '#FF3B30', dark: '#FF3B30' }; // 强调红
  
  const IC_BLUE   = { light: '#007AFF', dark: '#00AAE4' }; // 图标蓝：iOS蓝/亮蓝
  const IC_PURPLE = { light: '#AF52DE', dark: '#9945FF' }; // 图标紫：iOS紫/亮紫

  // ===================== 辅助函数 =====================
  const fmtISP = (isp) => {
    if (!isp) return "未知";
    const s = String(isp).toLowerCase();
    if (/移动|mobile|cmcc/i.test(s)) return "中国移动";
    if (/电信|telecom|chinanet/i.test(s)) return "中国电信";
    if (/联通|unicom/i.test(s)) return "中国联通";
    if (/广电|broadcast|cbn/i.test(s)) return "中国广电";
    return isp; 
  };

  const getFlag = (code) => {
    if (!code || code.toUpperCase() === 'TW') return '🇨🇳';
    return String.fromCodePoint(...code.toUpperCase().split('').map(c => 127397 + c.charCodeAt()));
  };

  const d = ctx.device || {};
  const isWifi = !!d.wifi?.ssid;
  let netName = "未连接", netIcon = "antenna.radiowaves.left.and.right";
  
  if (isWifi) {
    netName = d.wifi.ssid;
    netIcon = "wifi";
  } else if (d.cellular?.radio) {
    const radioMap = { "GPRS": "2.5G", "EDGE": "2.75G", "WCDMA": "3G", "LTE": "4G", "NR": "5G", "NRNSA": "5G" };
    const rawRadio = d.cellular.radio.toUpperCase().replace(/\s+/g, "");
    netName = `蜂窝: ${radioMap[rawRadio] || rawRadio}`;
  }

  // ===================== 流媒体/AI 检测核心逻辑 =====================
  const checkNetflix = async () => {
    try {
      const res = await ctx.http.get("https://www.netflix.com/title/80018499", { timeout: 3500, followRedirect: false });
      if (res.status >= 200 && res.status < 400) {
        const reg = res.headers["x-netflix-originating-env"];
        return { name: "NF", region: reg ? reg.toUpperCase() : "OK" };
      }
      const basicRes = await ctx.http.get("https://www.netflix.com/title/81215567", { timeout: 3500, followRedirect: false });
      return { name: "NF", region: (basicRes.status >= 200 && basicRes.status < 400) ? "🍿" : "❌" };
    } catch (e) { return { name: "NF", region: "❌" }; }
  };

  const checkUnlock = async (name, url, checkFn) => {
    try {
      const res = await ctx.http.get(url, { 
        timeout: 3500, 
        headers: { 
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" 
        }, 
        followRedirect: false 
      });
      if (await checkFn(res)) {
        return { name, region: "OK" }; 
      }
      return { name, region: "❌" };
    } catch (e) { return { name, region: "❌" }; }
  };

  const unlockTasks = [
    checkUnlock("GPT", "https://chatgpt.com/", async (res) => res.status >= 200 && res.status < 400),
    checkNetflix(),
    checkUnlock("TK", "https://www.tiktok.com/", async (res) => res.status >= 200 && res.status < 400),
    checkUnlock("GMNI", "https://gemini.google.com/", async (res) => res.status >= 200 && res.status < 400),
    checkUnlock("D+", "https://www.disneyplus.com/", async (res) => res.status >= 200 && res.status < 400)
  ];

  // ===================== 并发请求 (测速 & IP & 解锁) =====================
  const globalStart = Date.now();
  let realTcpDelay = 0;

  const [pingTask, lResRaw, nResRaw, pureResRaw, ...unlockResults] = await Promise.all([
    ctx.http.get("http://connectivitycheck.gstatic.com/generate_204", { timeout: 2000 })
      .then(() => { realTcpDelay = Date.now() - globalStart; }).catch(() => {}),
    ctx.http.get('https://myip.ipip.net/json', { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 4000 }).catch(() => null),
    ctx.http.get('http://ip-api.com/json/?lang=zh-CN', { timeout: 4000 }).catch(() => null),
    ctx.http.get('https://my.ippure.com/v1/info', { timeout: 4000 }).catch(() => null),
    ...unlockTasks
  ]);

  // ===================== 数据解析 =====================
  let lIp = "获取失败", lLoc = "—", lIsp = "—";
  try {
    if (lResRaw) {
      const body = JSON.parse(await lResRaw.text());
      lIp = body.data.ip || lIp;
      const locArr = body.data.location || [];
      lLoc = `🇨🇳 ${locArr[1] || ""} ${locArr[2] || ""}`.trim();
      lIsp = fmtISP(locArr[4] || locArr[3]);
    }
  } catch (e) {}

  let nIp = "获取失败", nLoc = "—", nIsp = "—", nCountryCode = "XX";
  try {
    if (nResRaw) {
      const nData = JSON.parse(await nResRaw.text());
      nIp = nData.query || nIp;
      nIsp = fmtISP(nData.isp);
      nCountryCode = nData.countryCode || "";
      nLoc = `${getFlag(nCountryCode)} ${nData.country || ""} ${nData.city || ""}`.trim();
    }
  } catch (e) {}

  let pureData = {};
  try { if (pureResRaw) pureData = JSON.parse(await pureResRaw.text()); } catch (e) {}
  
  const risk = pureData.fraudScore;
  let riskTxt = "获取超时", riskCol = C_SUB, riskIc = "questionmark.shield.fill";
  if (risk !== undefined) {
    if (risk >= 80) { riskTxt = `极高风险 (${risk})`; riskCol = C_RED; riskIc = "xmark.shield.fill"; }
    else if (risk >= 70) { riskTxt = `高风险 (${risk})`; riskCol = C_YELLOW; riskIc = "exclamationmark.shield.fill"; }
    else if (risk >= 40) { riskTxt = `中度风险 (${risk})`; riskCol = C_YELLOW; riskIc = "exclamationmark.shield.fill"; }
    else { riskTxt = `纯净低危 (${risk})`; riskCol = C_GREEN; riskIc = "checkmark.shield.fill"; }
  }

  const nativeText = pureData.isResidential === true ? "🏠 住宅" : (pureData.isResidential === false ? "🏢 机房" : "🌐 代理");

  const unlockText = unlockResults.map(r => {
    if (r.region === "❌" || r.region === "🍿") return `${r.name}:${r.region}`;
    const finalReg = (r.region && r.region !== "OK") ? r.region : (nCountryCode || "OK");
    return `${r.name}:${finalReg}`;
  }).join("  ");

  let delayColor = C_SUB;
  if (realTcpDelay > 0) {
    if (realTcpDelay < 150) delayColor = C_GREEN;
    else if (realTcpDelay <= 350) delayColor = C_YELLOW;
    else delayColor = C_RED;
  }

  // ===================== Wstd 100% 统一 Row 组件 =====================
  const Row = (ic, icCol, label, val, valCol) => ({
    type: 'stack', direction: 'row', alignItems: 'center', gap: 6,
    children: [
      { type: 'image', src: `sf-symbol:${ic}`, color: icCol, width: 13, height: 13 },
      { type: 'text', text: label, font: { size: 11 }, textColor: C_SUB },
      { type: 'spacer' },
      { type: 'text', text: val, font: { size: 11, weight: 'bold', family: 'Menlo' }, textColor: valCol, maxLines: 1, minScale: 0.6 }
    ]
  });

  return {
    type: 'widget', 
    padding: 14,
    // ✨ 这里是变色生效的核心，采用纯色背景
    backgroundColor: BG_MAIN,
    refreshPolicy: { onNetworkChange: true, onEnter: true, timeout: 10 },
    children: [
      { type: 'stack', direction: 'row', alignItems: 'center', gap: 6, children: [
          { type: 'image', src: `sf-symbol:${netIcon}`, color: C_TITLE, width: 16, height: 16 },
          { type: 'text', text: netName, font: { size: 14, weight: 'heavy' }, textColor: C_TITLE },
          { type: 'spacer' },
          { type: 'text', text: realTcpDelay > 0 ? `${realTcpDelay}ms` : '测速超时', font: { size: 11, weight: 'bold', family: 'Menlo' }, textColor: delayColor }
      ]},
      { type: 'spacer', length: 12 },
      { type: 'stack', direction: 'column', gap: 4, children: [
          Row("house.fill", IC_BLUE, "本地 IP", lIp, C_MAIN),
          Row("map.fill", IC_BLUE, "本地位置", `${lLoc} ${lIsp}`, C_MAIN),
          { type: 'spacer', length: 2 },
          Row("network", IC_PURPLE, "落地 IP", `${nIp} (${nativeText.split(' ')[1]})`, C_MAIN),
          Row("mappin.and.ellipse", IC_PURPLE, "落地位置", `${nLoc} ${nIsp}`, C_MAIN),
          { type: 'spacer', length: 2 },
          Row(riskIc, riskCol, "风险评级", riskTxt, riskCol),
          Row("play.tv.fill", C_TITLE, "解锁", unlockText, C_GREEN)
      ]},
      { type: 'spacer' }
    ]
  };
}
