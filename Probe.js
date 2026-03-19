// Server Monitor Widget Pro for Egern
// 完美布局版 | IP并列展示 | 底部信息对称排版

export default async function (ctx) {
  // ─── 1. 基础配置区域 ────────────
  const SERVER_CONFIG = {
    widgetName: 'My Node',        // 小组件上显示的名称
    
    // 👇 SSH 服务器登录信息
    host: '1.2.3.4',              // 服务器 IP 或域名
    port: 22,                     // SSH 端口
    username: 'root',             // SSH 登录用户名
    password: 'your_password',    // SSH 密码
    privateKey: '',               // SSH 私钥 (优先于密码)
    
    // 👇 BWH 搬瓦工 API 配置 (优先读取此项，若非瓦工机器请留空)
    bwhVeid: '',                  // 填入 VEID
    bwhApiKey: '',                // 填入 API KEY

    // 👇 非搬瓦工机器的降级配置 (本地网卡双向统计)
    trafficLimitGB: 2000,         // 每月流量上限 (GB)
    resetDay: 1                   // 每月流量重置日 (1-31)
  };

  // ─── 2. 多彩专属配色主题 ────────────
  const C = {
    bg: { light: '#FFFFFF', dark: '#121212' },       // 高级深灰黑背景
    barBg: { light: '#0000001A', dark: '#FFFFFF22' },// 进度条底槽色 (带透明度)
    text: { light: '#111111', dark: '#FFFFFF' },     // 主文字颜色 (黑色/白色)
    dim: { light: '#8E8E93', dark: '#8E8E93' },      // 暗淡文字
    
    // 独立硬件颜色设定
    cpu: { light: '#007AFF', dark: '#0A84FF' },      // 科技蓝
    mem: { light: '#AF52DE', dark: '#BF5AF2' },      // 梦幻紫
    disk: { light: '#FF9500', dark: '#FF9F0A' },     // 警告橙
    netRx: { light: '#34C759', dark: '#30D158' },    // 下载绿
    netTx: { light: '#5856D6', dark: '#5E5CE6' },    // 上传紫
  };

  // 流量专属动态预警色
  const getTrafficColor = (pct) => {
    if (pct >= 85) return { light: '#FF3B30', dark: '#FF453A' }; // 危险红
    if (pct >= 60) return { light: '#FF9500', dark: '#FF9F0A' }; // 预警橙
    return { light: '#34C759', dark: '#30D158' };                // 安全绿
  };

  // ─── Helpers ────────────────────────────────
  const fmtBytes = (b) => {
    if (b >= 1024 ** 4) return (b / 1024 ** 4).toFixed(2) + 'T';
    if (b >= 1024 ** 3) return (b / 1024 ** 3).toFixed(2) + 'G';
    if (b >= 1024 ** 2) return (b / 1024 ** 2).toFixed(1) + 'M';
    if (b >= 1024)      return (b / 1024).toFixed(0) + 'K';
    return Math.round(b) + 'B';
  };

  // 本地降级用的重置日期计算 (默认到 00:00)
  const getNextResetDate = (resetDay) => {
    const now = new Date();
    let y = now.getFullYear(), m = now.getMonth();
    if (now.getDate() >= resetDay) m += 1; 
    if (m > 11) { m = 0; y += 1; }
    return `${m + 1}月${resetDay}日 00:00`;
  };

  // ─── Fetch Data ─────────────────────────────
  let d;
  try {
    const { host, port, username, password, privateKey, widgetName, bwhVeid, bwhApiKey, trafficLimitGB, resetDay } = SERVER_CONFIG;
    
    // 1. 获取 BWH API 数据
    let bwhData = null;
    if (bwhVeid && bwhApiKey) {
      try {
        const resp = await ctx.http.get(`https://api.64clouds.com/v1/getServiceInfo?veid=${bwhVeid}&api_key=${bwhApiKey}`);
        bwhData = await resp.json();
      } catch (e) { console.log('BWH API Error:', e); }
    }

    // 2. 获取 SSH 底层数据
    const session = await ctx.ssh.connect({
      host, port: Number(port || 22), username,
      ...(privateKey ? { privateKey } : { password }),
      timeout: 8000,
    });

    const SEP = '<<SEP>>';
    const cmds = [
      'hostname -s 2>/dev/null || hostname',                                                               // 0: 主机名
      'cat /proc/loadavg',                                                                                 // 1: 负载 (虽然删除了显示，但保留数据获取以防以后需要)
      'cat /proc/uptime',                                                                                  // 2: 运行时间
      'head -1 /proc/stat',                                                                                // 3: CPU
      "awk '/MemTotal/{t=$2}/MemFree/{f=$2}/Buffers/{b=$2}/^Cached/{c=$2}END{print t,f,b,c}' /proc/meminfo", // 4: 精准内存
      'df -B1 / | tail -1',                                                                                // 5: 磁盘
      'nproc',                                                                                             // 6: 核心数
      "curl -s -m 2 http://ip-api.com/line?fields=country,city,query || echo ''",                          // 7: 公网IP和位置探测
      "awk '/^ *(eth|en|wlan|ens|eno|bond|veth)/{rx+=$2;tx+=$10}END{print rx,tx}' /proc/net/dev",          // 8: 网卡流量
    ];
    const { stdout } = await session.exec(cmds.join(` && echo '${SEP}' && `));
    await session.close();

    const p = stdout.split(SEP).map(s => s.trim());
    const hostname = widgetName || p[0] || 'Server';
    
    // 运行时间
    const upSec = parseFloat((p[2] || '0').split(' ')[0]);
    const upDays = Math.floor(upSec / 86400);
    const upHours = Math.floor((upSec % 86400) / 3600);
    const upMins = Math.floor((upSec % 3600) / 60);
    const uptime = upDays > 0 ? `${upDays}天 ${upHours}小时` : `${upHours}小时 ${upMins}分`;

    // CPU
    const cpuNums = (p[3] || '').replace(/^cpu\s+/, '').split(/\s+/).map(Number);
    const cpuTotal = cpuNums.reduce((a, b) => a + b, 0);
    const cpuIdle = cpuNums[3] || 0;
    const prevCpu = ctx.storage.getJSON('_cpu');
    let cpuPct = 0;
    if (prevCpu && cpuTotal > prevCpu.t) {
      cpuPct = Math.round(((cpuTotal - prevCpu.t - (cpuIdle - prevCpu.i)) / (cpuTotal - prevCpu.t)) * 100);
    }
    ctx.storage.setJSON('_cpu', { t: cpuTotal, i: cpuIdle });
    cpuPct = Math.max(0, Math.min(100, cpuPct));
    
    // 精准内存
    const memKB = (p[4] || '0 0 0 0').split(' ').map(Number);
    const memTotal = memKB[0] * 1024 || 1;
    const memFree = memKB[1] * 1024 || 0;
    const memBuff = memKB[2] * 1024 || 0;
    const memCache = memKB[3] * 1024 || 0;
    const memUsed = memTotal - memFree - memBuff - memCache;
    const memPct = Math.min(100, Math.round((memUsed / memTotal) * 100));

    // 磁盘
    const df = (p[5] || '').split(/\s+/);
    const diskTotal = Number(df[1]) || 1, diskUsed = Number(df[2]) || 0;
    const diskPct = parseInt(df[4]) || 0;
    const cores = parseInt(p[6]) || 1;

    // IP 与 位置信息解析
    let ipInfo = host;
    let locInfo = '未知';
    const ipApiLines = (p[7] || '').split('\n').map(s => s.trim()).filter(Boolean);
    if (ipApiLines.length >= 3) {
      locInfo = `${ipApiLines[0]} ${ipApiLines[1]}`.replace(/United States/g, 'US').replace(/United Kingdom/g, 'UK');
      ipInfo = ipApiLines[2];
    } else if (ipApiLines.length > 0) {
      ipInfo = ipApiLines[ipApiLines.length - 1]; // 容错
    }

    // 实时网速
    const nn = (p[8] || '0 0').split(' ');
    const netRx = Number(nn[0]) || 0, netTx = Number(nn[1]) || 0;
    const prevNet = ctx.storage.getJSON('_net');
    const now = Date.now();
    let rxRate = 0, txRate = 0;
    if (prevNet && prevNet.ts) {
      const el = (now - prevNet.ts) / 1000;
      if (el > 0 && el < 3600) {
        rxRate = Math.max(0, (netRx - prevNet.rx) / el);
        txRate = Math.max(0, (netTx - prevNet.tx) / el);
      }
    }
    ctx.storage.setJSON('_net', { rx: netRx, tx: netTx, ts: now });

    // 综合流量与重置时间计算
    let tfUsed = 0, tfTotal = 1, tfPct = 0, tfReset = '';
    if (bwhData && bwhData.data_counter !== undefined) {
      tfUsed = bwhData.data_counter;
      tfTotal = bwhData.plan_monthly_data;
      tfPct = Math.min((tfUsed / tfTotal) * 100, 100) || 0;
      const rd = new Date((bwhData.data_next_reset || 0) * 1000);
      tfReset = `${rd.getMonth() + 1}月${rd.getDate()}日 ${String(rd.getHours()).padStart(2, '0')}:${String(rd.getMinutes()).padStart(2, '0')}`;
      
      if (bwhData.ip_addresses && bwhData.ip_addresses[0]) ipInfo = bwhData.ip_addresses[0];
      if (bwhData.node_location) locInfo = bwhData.node_location;
    } else {
      tfUsed = netRx + netTx;
      tfTotal = trafficLimitGB * (1024 ** 3);
      tfPct = Math.min((tfUsed / tfTotal) * 100, 100) || 0;
      tfReset = getNextResetDate(resetDay);
    }

    // 最后刷新时间
    const dNow = new Date();
    const timeStr = `${String(dNow.getHours()).padStart(2, '0')}:${String(dNow.getMinutes()).padStart(2, '0')}:${String(dNow.getSeconds()).padStart(2, '0')}`;

    d = {
      hostname, uptime, cpuPct, cores,
      memTotal, memUsed, memPct, diskTotal, diskUsed, diskPct,
      rxRate, txRate, netRx, netTx,
      tfUsed, tfTotal, tfPct, tfReset, timeStr, ipInfo, locInfo
    };
  } catch (e) {
    d = { error: String(e.message || e) };
  }

  // ─── UI 渲染组件库 ────────────────────
  const bar = (pct, color, h = 5) => ({
    type: 'stack', direction: 'row', height: h, borderRadius: h / 2,
    backgroundColor: C.barBg,
    children: pct > 0
      ? [
          { type: 'stack', flex: Math.max(1, pct), height: h, borderRadius: h / 2, backgroundColor: color, children: [] },
          ...(pct < 100 ? [{ type: 'spacer', flex: 100 - pct }] : []),
        ]
      : [{ type: 'spacer' }],
  });

  const divider = { type: 'stack', height: 1, backgroundColor: C.barBg, children: [{ type: 'spacer' }] };

  // 恢复清爽的单行 Header
  const header = () => ({
    type: 'stack', direction: 'row', alignItems: 'center', gap: 6, children: [
      { type: 'image', src: 'sf-symbol:server.rack', color: C.text, width: 14, height: 14 },
      { type: 'text', text: d.hostname, font: { size: 'headline', weight: 'bold' }, textColor: C.text, maxLines: 1 },
      { type: 'spacer' },
      { type: 'text', text: d.uptime, font: { size: 'caption2', weight: 'medium' }, textColor: C.dim, maxLines: 1 },
    ],
  });

  // Footer：左侧刷新时间，右侧流量重置（完美对称）
  const footer = {
    type: 'stack', direction: 'row', alignItems: 'center', children: [
      { type: 'image', src: 'sf-symbol:arrow.triangle.2.circlepath', color: C.dim, width: 9, height: 9 },
      { type: 'text', text: ` 刷新于 ${d.timeStr}`, font: { size: 9, weight: 'medium' }, textColor: C.dim },
      { type: 'spacer' },
      { type: 'image', src: 'sf-symbol:calendar', color: C.dim, width: 9, height: 9 },
      { type: 'text', text: ` 流量重置: ${d.tfReset}`, font: { size: 9, family: 'Menlo' }, textColor: C.dim },
    ],
  };

  if (d.error) {
    return {
      type: 'widget', padding: 16, gap: 8, backgroundColor: C.bg,
      children: [
        { type: 'text', text: '⚠️ Connection Failed', font: { size: 'headline', weight: 'bold' }, textColor: getTrafficColor(100) },
        { type: 'text', text: d.error, font: { size: 'caption1' }, textColor: C.dim, maxLines: 3 },
      ],
    };
  }

  // ─── Small Widget (保持紧凑) ────────────
  if (ctx.widgetFamily === 'systemSmall') {
    return {
      type: 'widget', backgroundColor: C.bg, padding: 12, gap: 5,
      children: [
        { type: 'stack', direction: 'column', gap: 1, children: [
          { type: 'stack', direction: 'row', alignItems: 'center', gap: 4, children: [
            { type: 'image', src: 'sf-symbol:server.rack', color: C.text, width: 12, height: 12 },
            { type: 'text', text: d.hostname, font: { size: 'subheadline', weight: 'bold' }, textColor: C.text, maxLines: 1 },
          ]},
          { type: 'text', text: d.ipInfo, font: { size: 9, family: 'Menlo', weight: 'bold' }, textColor: C.text },
        ]},
        { type: 'spacer', length: 2 },
        ...[
          { ic: 'cpu', lb: 'CPU', pt: d.cpuPct, v: `${d.cpuPct}%`, c: C.cpu },
          { ic: 'memorychip', lb: 'MEM', pt: d.memPct, v: `${d.memPct}%`, c: C.mem },
          { ic: 'antenna.radiowaves.left.and.right', lb: 'TRAF', pt: d.tfPct, v: `${d.tfPct.toFixed(0)}%`, c: getTrafficColor(d.tfPct) }
        ].map(i => ({
          type: 'stack', direction: 'column', gap: 3, children: [
            { type: 'stack', direction: 'row', alignItems: 'center', gap: 4, children: [
              { type: 'image', src: `sf-symbol:${i.ic}`, color: i.c, width: 10, height: 10 },
              { type: 'text', text: i.lb, font: { size: 10, weight: 'bold' }, textColor: C.text },
              { type: 'spacer' },
              { type: 'text', text: i.v, font: { size: 10, weight: 'heavy', family: 'Menlo' }, textColor: i.c },
            ]},
            bar(i.pt, i.c, 4),
          ]
        }))
      ],
    };
  }

  // ─── Medium Widget (优化排版版) ────────────
  if (ctx.widgetFamily === 'systemMedium') {
    return {
      type: 'widget', backgroundColor: C.bg, padding: [12, 16],
      children: [
        header(),
        { type: 'spacer' },
        { type: 'stack', direction: 'column', gap: 6, children: [
          // CPU 行 (右侧完美并列加黑的 IP 与 位置)
          { type: 'stack', direction: 'column', gap: 3, children: [
            { type: 'stack', direction: 'row', alignItems: 'center', gap: 4, children: [
              { type: 'image', src: 'sf-symbol:cpu', color: C.cpu, width: 11, height: 11 },
              { type: 'text', text: `CPU ${d.cores}C`, font: { size: 11, weight: 'bold' }, textColor: C.text },
              { type: 'text', text: `${d.cpuPct}%`, font: { size: 11, weight: 'heavy', family: 'Menlo' }, textColor: C.cpu },
              { type: 'spacer' },
              { type: 'image', src: 'sf-symbol:network', color: C.text, width: 10, height: 10 },
              { type: 'text', text: d.ipInfo, font: { size: 10, family: 'Menlo', weight: 'bold' }, textColor: C.text },
              { type: 'text', text: '•', font: { size: 10 }, textColor: C.dim },
              { type: 'text', text: d.locInfo, font: { size: 10, weight: 'bold' }, textColor: C.text, maxLines: 1, minScale: 0.8 },
            ]},
            bar(d.cpuPct, C.cpu),
          ]},
          // MEM
          { type: 'stack', direction: 'column', gap: 3, children: [
            { type: 'stack', direction: 'row', alignItems: 'center', gap: 4, children: [
              { type: 'image', src: 'sf-symbol:memorychip', color: C.mem, width: 11, height: 11 },
              { type: 'text', text: 'MEM', font: { size: 11, weight: 'bold' }, textColor: C.text },
              { type: 'text', text: `${d.memPct}%`, font: { size: 11, weight: 'heavy', family: 'Menlo' }, textColor: C.mem },
              { type: 'spacer' },
              { type: 'text', text: `${fmtBytes(d.memUsed)} / ${fmtBytes(d.memTotal)}`, font: { size: 10, family: 'Menlo', weight: 'medium' }, textColor: C.dim },
            ]},
            bar(d.memPct, C.mem),
          ]},
          // TRAFFIC (重置时间已移至底部，这里更干净)
          { type: 'stack', direction: 'column', gap: 3, children: [
            { type: 'stack', direction: 'row', alignItems: 'center', gap: 4, children: [
              { type: 'image', src: 'sf-symbol:antenna.radiowaves.left.and.right', color: getTrafficColor(d.tfPct), width: 11, height: 11 },
              { type: 'text', text: 'TRAF', font: { size: 11, weight: 'bold' }, textColor: C.text },
              { type: 'text', text: `${d.tfPct.toFixed(1)}%`, font: { size: 11, weight: 'heavy', family: 'Menlo' }, textColor: getTrafficColor(d.tfPct) },
              { type: 'spacer' },
              { type: 'text', text: `${fmtBytes(d.tfUsed)} / ${fmtBytes(d.tfTotal)}`, font: { size: 10, family: 'Menlo', weight: 'medium' }, textColor: C.dim },
            ]},
            bar(d.tfPct, getTrafficColor(d.tfPct)),
          ]},
          // DSK
          { type: 'stack', direction: 'column', gap: 3, children: [
            { type: 'stack', direction: 'row', alignItems: 'center', gap: 4, children: [
              { type: 'image', src: 'sf-symbol:internaldrive', color: C.disk, width: 11, height: 11 },
              { type: 'text', text: 'DSK', font: { size: 11, weight: 'bold' }, textColor: C.text },
              { type: 'text', text: `${d.diskPct}%`, font: { size: 11, weight: 'heavy', family: 'Menlo' }, textColor: C.disk },
              { type: 'spacer' },
              { type: 'text', text: `${fmtBytes(d.diskUsed)} / ${fmtBytes(d.diskTotal)}`, font: { size: 10, family: 'Menlo', weight: 'medium' }, textColor: C.dim },
            ]},
            bar(d.diskPct, C.disk),
          ]},
        ]},
        { type: 'spacer' },
        footer,
      ],
    };
  }

  // ─── Large Widget (同样优化) ────────────
  return {
    type: 'widget', backgroundColor: C.bg, padding: [14, 16], gap: 8,
    children: [
      header(),
      divider,
      // CPU + IP位置
      { type: 'stack', direction: 'row', alignItems: 'center', gap: 6, children: [
        { type: 'image', src: 'sf-symbol:cpu', color: C.cpu, width: 14, height: 14 },
        { type: 'text', text: `CPU ${d.cores}C`, font: { size: 12, weight: 'bold' }, textColor: C.text },
        { type: 'text', text: `${d.cpuPct}%`, font: { size: 12, weight: 'heavy', family: 'Menlo' }, textColor: C.cpu },
        { type: 'spacer' },
        { type: 'image', src: 'sf-symbol:network', color: C.text, width: 11, height: 11 },
        { type: 'text', text: d.ipInfo, font: { size: 11, family: 'Menlo', weight: 'bold' }, textColor: C.text },
        { type: 'text', text: '•', font: { size: 11 }, textColor: C.dim },
        { type: 'text', text: d.locInfo, font: { size: 11, weight: 'bold' }, textColor: C.text, maxLines: 1 },
      ]},
      bar(d.cpuPct, C.cpu, 6),
      divider,
      // MEM
      { type: 'stack', direction: 'row', alignItems: 'center', gap: 6, children: [
        { type: 'image', src: 'sf-symbol:memorychip', color: C.mem, width: 14, height: 14 },
        { type: 'text', text: 'MEMORY', font: { size: 12, weight: 'bold' }, textColor: C.text },
        { type: 'text', text: `${d.memPct}%`, font: { size: 12, weight: 'heavy', family: 'Menlo' }, textColor: C.mem },
        { type: 'spacer' },
        { type: 'text', text: `${fmtBytes(d.memUsed)} / ${fmtBytes(d.memTotal)}`, font: { size: 11, family: 'Menlo', weight: 'medium' }, textColor: C.dim },
      ]},
      bar(d.memPct, C.mem, 6),
      divider,
      // TRAFFIC
      { type: 'stack', direction: 'row', alignItems: 'center', gap: 6, children: [
        { type: 'image', src: 'sf-symbol:antenna.radiowaves.left.and.right', color: getTrafficColor(d.tfPct), width: 14, height: 14 },
        { type: 'text', text: 'TRAFFIC', font: { size: 12, weight: 'bold' }, textColor: C.text },
        { type: 'text', text: `${d.tfPct.toFixed(1)}%`, font: { size: 12, weight: 'heavy', family: 'Menlo' }, textColor: getTrafficColor(d.tfPct) },
        { type: 'spacer' },
        { type: 'text', text: `${fmtBytes(d.tfUsed)} / ${fmtBytes(d.tfTotal)}`, font: { size: 11, family: 'Menlo', weight: 'medium' }, textColor: C.dim },
      ]},
      bar(d.tfPct, getTrafficColor(d.tfPct), 6),
      divider,
      // DSK
      { type: 'stack', direction: 'row', alignItems: 'center', gap: 6, children: [
        { type: 'image', src: 'sf-symbol:internaldrive', color: C.disk, width: 14, height: 14 },
        { type: 'text', text: 'STORAGE', font: { size: 12, weight: 'bold' }, textColor: C.text },
        { type: 'text', text: `${d.diskPct}%`, font: { size: 12, weight: 'heavy', family: 'Menlo' }, textColor: C.disk },
        { type: 'spacer' },
        { type: 'text', text: `${fmtBytes(d.diskUsed)} / ${fmtBytes(d.diskTotal)}`, font: { size: 11, family: 'Menlo', weight: 'medium' }, textColor: C.dim },
      ]},
      bar(d.diskPct, C.disk, 6),
      divider,
      // NETWORK SPEED
      { type: 'stack', direction: 'row', alignItems: 'center', gap: 6, children: [
        { type: 'image', src: 'sf-symbol:network', color: C.text, width: 14, height: 14 },
        { type: 'text', text: 'SPEED', font: { size: 12, weight: 'bold' }, textColor: C.text },
        { type: 'spacer' },
        { type: 'text', text: `↓ ${fmtBytes(d.rxRate)}/s`, font: { size: 12, family: 'Menlo', weight: 'bold' }, textColor: C.netRx },
        { type: 'text', text: `↑ ${fmtBytes(d.txRate)}/s`, font: { size: 12, family: 'Menlo', weight: 'bold' }, textColor: C.netTx },
      ]},
      { type: 'spacer' },
      footer,
    ],
  };
}
