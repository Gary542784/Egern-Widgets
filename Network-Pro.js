/**
 * 🚀 全功能网络看板 Pro (完美布局版 · 原生字体)
 * 优化：引入完美的卡片底色、横向分割线与对称式 Footer 排版，保留原有系统字体
 */
export default async function(ctx) {
  // ===================== 1. 专属配色主题 =====================
  const C = {
    bg: { light: '#FFFFFF', dark: '#121212' },       // 高级深灰黑背景，恢复原生模块感
    barBg: { light: '#0000001A', dark: '#FFFFFF22' },// 分割线颜色
    text: { light: '#111111', dark: '#FFFFFF' },     // 主文字颜色
    dim: { light: '#8E8E93', dark: '#8E8E93' },      // 暗淡辅助文字
    
    green: { light: '#34C759', dark: '#30D158' }, 
    blue: { light: '#007AFF', dark: '#0A84FF' }, 
    purple: { light: '#5856D6', dark: '#5E5CE6' }, 
    orange: { light: '#FF9500', dark: '#FF9F0A' }, 
    red: { light: '#FF3B30', dark: '#FF453A' }
  };

  // ===================== 2. 辅助函数 =====================
  const fmtLocalISP = (isp) => {
    if (!isp) return "未知";
    const s = String(isp).toLowerCase();
    if (/移动|mobile|cmcc/i.test(s)) return "中国移动";
    if (/电信|telecom|chinanet/i.test(s)) return "中国电信";
    if (/联通|unicom/i.test(s)) return "中国联通";
    if (/广电|broadcast|cbn/i.test(s)) return "中国广电";
    return isp; 
  };

  const fmtProxyISP = (isp) => {
    if (!isp) return "未知商家";
    let s = String(isp);
    if (/it7/i.test(s)) return "IT7 Network";
    if (/dmit/i.test(s)) return "DMIT Network";
    if (/cloudflare/i.test(s)) return "Cloudflare";
    if (/akamai/i.test(s)) return "Akamai";
    if (/amazon|aws/i.test(s)) return "AWS";
    if (/google/i.test(s)) return "Google Cloud";
    if (/microsoft|azure/i.test(s)) return "Microsoft Azure";
    if (/alibaba|aliyun/i.test(s)) return "阿里云";
    if (/tencent/i.test(s)) return "腾讯云";
    if (/oracle/i.test(s)) return "Oracle Cloud";
    return s.length > 15 ? s.substring(0, 15) + "..." : s; 
  };

  const getFlag = (code) => {
    if (!code || code.toUpperCase() === 'TW') return '🇨🇳'; 
    if (code.toUpperCase() === 'XX' || code === 'OK') return '✅';
    return String.fromCodePoint(...code.toUpperCase().split('').map(c => 127397 + c.charCodeAt()));
  };

  // ===================== 3. 网络与网关状态获取 =====================
  const d = ctx.device || {};
  const isWifi = !!d.wifi?.ssid;
  let netName = "未连接", netIcon = "wifi";
  
  const netInfo = (typeof $network !== 'undefined') ? $network : (ctx.network || {});
  let localIp = netInfo.v4?.primaryAddress || "—";
  let gateway = netInfo.v4?.primaryRouter || "—";

  if (isWifi) {
    netName = d.wifi.ssid;
  } else if (d.cellular?.radio) {
    const radioMap = { "GPRS": "2.5G", "EDGE": "2.75G", "WCDMA": "3G", "LTE": "4G", "NR": "5G", "NRNSA": "5G" };
    const rawRadio = d.cellular.radio.toUpperCase().replace(/\s+/g, "");
    netName = radioMap[rawRadio] || rawRadio;
    netIcon = "antenna.radiowaves.left.and.right";
    gateway = "蜂窝内网";
  }

  // ===================== 4. 解锁检测核心逻辑 =====================
  const BASE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
  const commonHeaders = { "User-Agent": BASE_UA };
  const readBody = async (r) => {
    if (!r) return "";
    if (typeof r.body === "string" && r.body.length) return r.body;
    if (typeof r.text === "function") {
      try { const t = await r.text(); return typeof t === "string" ? t : ""; } catch { return ""; }
    }
    return "";
  };

  async function checkNetflix(ctx) {
    try {
      const fetchTitle = async (url) => {
        const r = await ctx.http.get(url, { timeout: 6000, headers: commonHeaders, followRedirect: true }).catch(() => null);
        return { body: await readBody(r) || "" };
      };
      const [t1, t2] = await Promise.all([ fetchTitle("https://www.netflix.com/title/81280792"), fetchTitle("https://www.netflix.com/title/70143836") ]);
      if (!t1.body && !t2.body) return "❌";
      let region = "XX";
      for (const b of [t1.body, t2.body].filter(Boolean)) {
        const m1 = b.match(/"countryCode"\s*:\s*"?([A-Z]{2})"?/);
        if (m1?.[1]) { region = m1[1]; break; }
      }
      const oh1 = t1.body && /oh no!/i.test(t1.body);
      const oh2 = t2.body && /oh no!/i.test(t2.body);
      if (oh1 && oh2) return "🍿";
      if (!oh1 || !oh2) return region.toUpperCase() || "XX";
      return "❌";
    } catch { return "❌"; }
  }

  async function checkTikTok(ctx) {
    try {
      const fetchOnce = async (url) => {
        const r = await ctx.http.get(url, { timeout: 5000, headers: commonHeaders, followRedirect: true }).catch(() => null);
        return await readBody(r) || "";
      };
      let body = await fetchOnce("https://www.tiktok.com/");
      if (body.includes("Please wait...")) body = await fetchOnce("https://www.tiktok.com/explore") || body;
      const m = body.match(/"region"\s*:\s*"([A-Z]{2})"/);
      return m?.[1] ? m[1] : (body ? "OK" : "❌");
    } catch { return "❌"; }
  }

  async function checkGemini(ctx) {
    try {
      const res = await ctx.http.post('https://gemini.google.com/_/BardChatUi/data/batchexecute', {
        timeout: 6000, headers: { ...commonHeaders, "Content-Type": "application/x-www-form-urlencoded" },
        body: 'f.req=[["K4WWud","[[0],[\"en-US\"]]",null,"generic"]]', followRedirect: true
      }).catch(() => null);
      const txt = await readBody(res);
      if (!txt) return "❌";
      let m = txt.match(/"countryCode"\s*:\s*"([A-Z]{2})"/i);
      return m?.[1] ? m[1].toUpperCase() : "OK";
    } catch { return "❌"; }
  }

  async function checkChatGPT(ctx) {
    try {
      const headRes = await ctx.http.get("https://chatgpt.com", { timeout: 6000, headers: commonHeaders, followRedirect: false }).catch(() => null);
      const webAccessible = !!headRes && !!(headRes?.headers?.location || headRes?.headers?.Location);
      const iosRes = await ctx.http.get("https://ios.chat.openai.com", { timeout: 6000, headers: commonHeaders, followRedirect: true }).catch(() => null);
      const iosBody = await readBody(iosRes);
      const appAccessible = !!iosBody && !(!iosBody || iosBody.includes("blocked") || iosBody.includes("unsupported"));

      if (!webAccessible && !appAccessible) return "❌";
      if (appAccessible && !webAccessible) return "APP";
      if (webAccessible && appAccessible) {
        const traceRes = await ctx.http.get("https://chatgpt.com/cdn-cgi/trace", { timeout: 5000, headers: commonHeaders, followRedirect: true }).catch(() => null);
        const m = (await readBody(traceRes)).match(/loc=([A-Z]{2})/);
        return m?.[1] || "XX";
      }
      return "❌";
    } catch { return "❌"; }
  }

  // ===================== 5. 并发请求与数据解析 =====================
  const globalStart = Date.now();
  let realTcpDelay = 0;

  const unlockTasks = [
    checkChatGPT(ctx).then(region => ({ name: "GPT", region })),
    checkNetflix(ctx).then(region => ({ name: "NF", region })),
    checkTikTok(ctx).then(region => ({ name: "TK", region })),
    checkGemini(ctx).then(region => ({ name: "GMNI", region }))
  ];

  const [pingTask, lResRaw, nResRaw, pureResRaw, ...unlockResults] = await Promise.all([
    ctx.http.get("http://connectivitycheck.gstatic.com/generate_204", { timeout: 2000 })
      .then(() => { realTcpDelay = Date.now() - globalStart; }).catch(() => {}),
    ctx.http.get('https://myip.ipip.net/json', { headers: commonHeaders, timeout: 4000 }).catch(() => null),
    ctx.http.get('http://ip-api.com/json/?lang=zh-CN', { timeout: 4000 }).catch(() => null),
    ctx.http.get('https://my.ippure.com/v1/info', { timeout: 4000 }).catch(() => null),
    ...unlockTasks
  ]);

  let lIp = "—", lLoc = "—", lIsp = "—";
  try {
    if (lResRaw) {
      const body = JSON.parse(await lResRaw.text());
      lIp = body.data.ip || lIp;
      const locArr = body.data.location || [];
      lLoc = `中国${locArr[1] || ""}${locArr[2] || ""}`.trim();
      lIsp = fmtLocalISP(locArr[4] || locArr[3]);
    }
  } catch (e) {}

  let nIp = "—", nLoc = "—", asn = "—", nCountryCode = "XX", proxyProvider = "—";
  try {
    if (nResRaw) {
      const nData = JSON.parse(await nResRaw.text());
      nIp = nData.query || nIp;
      nCountryCode = nData.countryCode || "XX";
      nLoc = `${nData.country || ""} ${nData.city || ""}`.trim();
      const asnMatch = nData.as ? nData.as.match(/(AS\d+)/) : null;
      asn = asnMatch ? asnMatch[1] : "未知ASN";
      proxyProvider = fmtProxyISP(nData.isp || nData.org);
    }
  } catch (e) {}

  let pureData = {};
  try { if (pureResRaw) pureData = JSON.parse(await pureResRaw.text()); } catch (e) {}
  
  let ipTypeStr = "代理网络";
  if (pureData.isResidential === true) ipTypeStr = "家庭宽带";
  else if (pureData.isResidential === false) ipTypeStr = "商业机房";

  const risk = pureData.fraudScore;
  let riskTxt = "获取超时", riskCol = C.dim;
  if (risk !== undefined) {
    if (risk >= 80) { riskTxt = `极高危 (${risk})`; riskCol = C.red; }
    else if (risk >= 70) { riskTxt = `高危 (${risk})`; riskCol = C.orange; }
    else if (risk >= 35) { riskTxt = `中危 (${risk})`; riskCol = C.orange; } 
    else { riskTxt = `低危 (${risk})`; riskCol = C.green; }
  }

  const unlockText = unlockResults.map(r => {
    if (r.region === "❌") return `${r.name}:🚫`;
    if (r.region === "🍿") return `${r.name}:🍿`;
    if (r.region === "APP") return `${r.name}:📱`; 
    const finalReg = (r.region && r.region !== "OK" && r.region !== "XX") ? r.region : nCountryCode;
    return `${r.name}:${getFlag(finalReg)}`;
  }).join("  ");

  let delayColor = C.dim;
  if (realTcpDelay > 0) {
    if (realTcpDelay < 150) delayColor = C.green;
    else if (realTcpDelay <= 350) delayColor = C.orange;
    else delayColor = C.red;
  }

  const headerTitle = lIsp !== "未知" ? `${lIsp} · ${netName}` : netName;
  const dNow = new Date();
  const timeStr = `${String(dNow.getHours()).padStart(2, '0')}:${String(dNow.getMinutes()).padStart(2, '0')}:${String(dNow.getSeconds()).padStart(2, '0')}`;

  // ===================== 6. 完美 UI 布局重构 (恢复原始系统字体) =====================

  // 分割线组件
  const divider = { type: 'stack', height: 1, backgroundColor: C.barBg, children: [{ type: 'spacer' }] };

  // 顶部 Header (还原 14 和 12 号字体)
  const header = {
    type: 'stack', direction: 'row', alignItems: 'center', gap: 4, children: [
      { type: 'image', src: `sf-symbol:${netIcon}`, color: C.text, width: 16, height: 16 },
      { type: 'text', text: headerTitle, font: { size: 14, weight: 'heavy' }, textColor: C.text, maxLines: 1 },
      { type: 'spacer' },
      { type: 'image', src: 'sf-symbol:clock', color: delayColor, width: 11, height: 11 },
      { type: 'text', text: realTcpDelay > 0 ? `${realTcpDelay} ms` : '超时', font: { size: 12, weight: 'bold' }, textColor: delayColor }
    ]
  };

  // 左对齐行级渲染 (还原纯正 12 号字)
  const Row = (ic, labelCol, label, val, isLast = false) => ({
    type: 'stack', direction: 'row', alignItems: 'center', gap: 6,
    children: [
      { type: 'image', src: `sf-symbol:${ic}`, color: labelCol, width: 13, height: 13 },
      { type: 'text', text: label, font: { size: 12, weight: 'bold' }, textColor: labelCol },
      { type: 'text', text: val, font: { size: 12 }, textColor: C.text, maxLines: isLast ? 2 : 1 },
      { type: 'spacer' } 
    ]
  });

  // 底部对称式 Footer (10 号系统默认字体)
  const footer = {
    type: 'stack', direction: 'row', alignItems: 'center', children: [
      { type: 'image', src: 'sf-symbol:arrow.triangle.2.circlepath', color: C.dim, width: 10, height: 10 },
      { type: 'text', text: ` 刷新于 ${timeStr}`, font: { size: 10, weight: 'medium' }, textColor: C.dim },
      { type: 'spacer' },
      { type: 'image', src: 'sf-symbol:network', color: C.dim, width: 10, height: 10 },
      { type: 'text', text: ` ${ipTypeStr}`, font: { size: 10 }, textColor: C.dim },
    ]
  };

  return {
    type: 'widget', 
    backgroundColor: C.bg,      // 采用参考代码的高级自适应背景
    padding: [14, 16],          // 引入规范的内边距，挤出模块边界
    gap: 8,                     // 确立整体栈间距
    refreshPolicy: { onNetworkChange: true, onEnter: true, timeout: 10 },
    children: [
      header,
      divider, // 优雅的横向分割线
      { 
        type: 'stack', direction: 'column', gap: 6, children: [
          Row("house.fill", C.green, "内网", ` ${localIp} / ${gateway}`),
          Row("paperplane.circle.fill", C.blue, "本地", ` ${lIp} / ${lLoc}`),
          Row("globe", C.purple, "落地", ` ${nIp} / ${getFlag(nCountryCode)} ${nLoc} / ${asn}`),
          Row("shield.lefthalf.filled", riskCol, "属性", ` ${proxyProvider} / ${ipTypeStr} / ${riskTxt}`),
          Row("play.tv.fill", C.orange, "解锁", ` ${unlockText}`, true)
        ]
      },
      { type: 'spacer' },
      footer // 对称排版的刷新时间与 IP 属性简写
    ]
  };
}
