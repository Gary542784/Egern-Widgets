/**
 * ==========================================
 * 📌 代码名称: 📅 岁时黄历（彻底修复 iOS 深浅自适应 纯色版）
 * ✨ 特色功能: 移除引发 Bug 的渐变背景，改用纯色背景，实现秒级深浅色跟随。
 * ==========================================
 */

export default async function(ctx) {
  // 🎨 纯正的 iOS 系统级动态颜色对象 (交由系统原生切换，绝不卡死)
  const BG_MAIN = { light: '#FFFFFF', dark: '#0D0D1A' };     // 浅色白，深色黑紫
  const TEXT_MAIN = { light: '#1C1C1E', dark: '#FFFFFF' };   // 浅色黑，深色白
  const TEXT_SUB = { light: '#8E8E93', dark: '#EBEBF5' };    // 浅色灰，深色透白
  const C_GOLD = { light: '#FF9500', dark: '#FFD700' };      // 浅色橙，深色金
  const C_GREEN = { light: '#34C759', dark: '#32D74B' };     // 绿
  const C_BLUE = { light: '#007AFF', dark: '#00AAE4' };      // 蓝

  const now = new Date(Date.now() + (new Date().getTimezoneOffset() + 480) * 60000);
  const [Y, M, D] = [now.getFullYear(), now.getMonth() + 1, now.getDate()];
  const P = n => n < 10 ? `0${n}` : n;
  const DATE_PATTERNS = [`${Y}-${P(M)}-${P(D)}`, `${Y}-${M}-${D}`, `${Y}/${P(M)}/${P(D)}`, `${Y}/${M}/${D}`, `${Y}${P(M)}${P(D)}` ];
  const WEEK = "日一二三四五六";

  // --- 本地农历推算核心算法 ---
  const Lunar = {
    info: [0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x05ac0,0x0ab60,0x096d5,0x092e0,0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,0x14b63,0x09370,0x049f8,0x04970,0x064b0,0x168a6,0x0ea50,0x06b20,0x1a6c4,0x0aae0,0x092e0,0x0d2e3,0x0c960,0x0d557,0x0d4a0,0x0da50,0x05d55,0x056a0,0x0a6d0,0x055d4,0x052d0,0x0a9b8,0x0a950,0x0b4a0,0x0b6a6,0x0ad50,0x055a0,0x0aba4,0x0a5b0,0x052b0,0x0b273,0x06930,0x07337,0x06aa0,0x0ad50,0x14b55,0x04b60,0x0a570,0x054e4,0x0d160,0x0e968,0x0d520,0x0daa0,0x16aa6,0x056d0,0x04ae0,0x0a9d4,0x0a2d0,0x0d150,0x0f252,0x0d520],
    gan: "甲乙丙丁戊己庚辛壬癸", zhi: "子丑寅卯辰巳午未申酉戌亥", ani: "鼠牛虎兔龙蛇马羊猴鸡狗猪",
    nStr: ["日","一","二","三","四","五","六","七","八","九","十"], monStr: ["正","二","三","四","五","六","七","八","九","十","冬","腊"],
    termNames: ["小寒","大寒","立春","雨水","惊蛰","春分","清明","谷雨","立夏","小满","芒种","夏至","小暑","大暑","立秋","处暑","白露","秋分","寒露","霜降","立冬","小雪","大雪","冬至"],
    
    termDate(y, n) { return new Date((31556925974.7*(y-1900)+[0,21208,42467,63836,85337,107014,128867,150921,173149,195551,218072,240693,263343,285989,308563,331033,353350,375494,397447,419210,440795,462224,483532,504758][n-1]*60000)+Date.UTC(1900,0,6,2,5)); },
    term(y, n) { return this.termDate(y, n).getUTCDate(); },
    
    lDays(y) { let s=348; for(let i=0x8000; i>0x8; i>>=1) s+=((this.info[y-1900] & i) ? 1 : 0); return s + ((this.info[y-1900] & 0xf) ? ((this.info[y-1900]&0x10000)?30:29) : 0); },
    mDays(y, m) { return (this.info[y-1900] & (0x10000 >> m)) ? 30 : 29; },
    l2s(y,m,d) { try { let off=0, lp=this.info[y-1900]&0xf; for(let i=1900; i<y; i++) off+=this.lDays(i); for(let i=1; i<m; i++) { off+=this.mDays(y,i); if(lp>0 && i===lp) off+=((this.info[y-1900]&0x10000)?30:29); } return new Date(Date.UTC(1900,0,31)+(off+d-1)*86400000); } catch(e){return null;} },

    toObj(y, m, d) {
      let offset = (Date.UTC(y,m-1,d) - Date.UTC(1900,0,31))/86400000, i, temp=0;
      for(i=1900; i<2101 && offset>0; i++) { temp=this.lDays(i); offset-=temp; }
      if(offset<0) { offset+=temp; i--; }
      const lYear=i, leap=this.info[lYear-1900] & 0xf; let isLeap=false;
      for(i=1; i<13 && offset>0; i++) {
        if(leap>0 && i==(leap+1) && !isLeap) { --i; isLeap=true; temp=((this.info[lYear-1900]&0x10000)?30:29); } else { temp=this.mDays(lYear,i); }
        if(isLeap && i==(leap+1)) isLeap=false; offset-=temp;
      }
      if(offset==0 && leap>0 && i==leap+1) if(isLeap) isLeap=false; else { isLeap=true; --i; }
      if(offset<0) { offset+=temp; i--; }
      const lD = offset+1, tId = m*2-(d<this.term(y,m*2-1)?2:1);
      return { gz: this.gan[(lYear-4)%10]+this.zhi[(lYear-4)%12], ani: this.ani[(lYear-4)%12], cn: `${isLeap?"闰":""}${this.monStr[i-1]}月${lD==10?"初十":lD==20?"二十":lD==30?"三十":["初","十","廿","卅"][Math.floor(lD/10)]+this.nStr[lD%10]}`, term: (this.term(y,tId+1)==d) ? this.termNames[tId] : "" };
    }
  };

  const getTermInfo = (y, n) => ({ name: Lunar.termNames[n - 1], date: new Date(y, Math.floor((n - 1) / 2), Lunar.term(y, n)) });
  const allTerms = [];
  for(let i=1; i<=24; i++) allTerms.push(getTermInfo(Y-1, i));
  for(let i=1; i<=24; i++) allTerms.push(getTermInfo(Y, i));
  for(let i=1; i<=24; i++) allTerms.push(getTermInfo(Y+1, i));

  let currentTerm = "", upcomingTerms = [];
  const todayMs = new Date(Y, M - 1, D).getTime();
  const todayMsUTC = Date.UTC(Y, M - 1, D);
  
  for (let i = 0; i < allTerms.length; i++) {
    const diff = Math.round((allTerms[i].date.getTime() - todayMs) / 86400000);
    if (diff === 0) {
      currentTerm = allTerms[i].name; 
      upcomingTerms = allTerms.slice(i + 1, i + 5).map(t => `${t.name} ${Math.round((t.date.getTime() - todayMs) / 86400000)}天`); break;
    } else if (diff > 0) {
      currentTerm = allTerms[i - 1].name;
      upcomingTerms = allTerms.slice(i, i + 4).map(t => `${t.name} ${Math.round((t.date.getTime() - todayMs) / 86400000)}天`); break;
    }
  }

  // ✨ 法定假日推算逻辑
  const getLegalFests = (y) => {
    const l2s = (m,d) => { const r=Lunar.l2s(y,m,d); return r ? `${r.getUTCFullYear()}/${P(r.getUTCMonth()+1)}/${P(r.getUTCDate())}` : ""; };
    const term = (n) => { const d=Lunar.termDate(y,n); return `${d.getUTCFullYear()}/${P(d.getUTCMonth()+1)}/${P(d.getUTCDate())}`; };
    return [ 
      ["元旦", `${y}/01/01`, 1], ["春节", l2s(1,1), 3], ["清明", term(7), 1], 
      ["劳动", `${y}/05/01`, 1], ["端午", l2s(5,5), 1], ["中秋", l2s(8,15), 1], ["国庆", `${y}/10/01`, 3] 
    ];
  };

  let ongoingFest = "";
  const f1 = getLegalFests(Y), f2 = getLegalFests(Y + 1), legalResults = [];

  f1.concat(f2).forEach(([name, dateStr, duration]) => {
    if (!dateStr) return;
    const [yy, mm, dd] = dateStr.split('/').map(Number);
    const diff = Math.round((Date.UTC(yy, mm - 1, dd) - todayMsUTC) / 86400000);
    if (diff <= 0 && diff > -duration) ongoingFest = name;
    if (diff < 0) return;
    if (!legalResults.find(i => i.name === name)) legalResults.push({ name, diff });
  });

  const legalFormat = legalResults.sort((a,b)=>a.diff-b.diff).slice(0, 3).map(i => i.diff === 0 ? `🎉${i.name}` : `${i.name} ${i.diff}天`).join(" · ");
  const festDisplay = ongoingFest ? `🎉 正在休假: ${ongoingFest}` : legalFormat;

  // ✨ 本地冲煞与百忌推算
  const offsetDays = Math.floor(Date.UTC(Y, M - 1, D) / 86400000);
  const dayGanIdx = (offsetDays + 3 + 600000) % 10; 
  const dayZhiIdx = (offsetDays + 5 + 600000) % 12; 
  
  const chongZhiIdx = (dayZhiIdx + 6) % 12;
  const chongGanIdx = (dayGanIdx + 6) % 10;
  const SHA_DIR = ["南", "东", "北", "西"];
  const localChongSha = `冲${Lunar.ani[chongZhiIdx]}(${Lunar.gan[chongGanIdx]}${Lunar.zhi[chongZhiIdx]})煞${SHA_DIR[dayZhiIdx % 4]}`;

  const GAN_BAIJI = ["甲不开仓财物耗散","乙不栽植千株不长","丙不修灶必见灾殃","丁不剃头头必生疮","戊不受田田主不祥","己不破券二比并亡","庚不经络织机虚张","辛不合酱主人不尝","壬不汲水更难提防","癸不词讼理弱敌强"];
  const ZHI_BAIJI = ["子不问卜自惹祸殃","丑不冠带主不还乡","寅不祭祀神鬼不尝","卯不穿井水泉不香","辰不哭泣必主重丧","巳不远行财物伏藏","午不苫盖屋主更张","未不服药毒气入肠","申不安床鬼祟入房","酉不会客醉坐颠狂","戌不吃犬作怪上床","亥不嫁娶不利新郎"];
  const localBaiJi = `${GAN_BAIJI[dayGanIdx]} ${ZHI_BAIJI[dayZhiIdx]}`;

  const getAlmanac = async () => {
    try {
      const resp = await ctx.http.get(`https://raw.githubusercontent.com/zqzess/openApiData/main/calendar_new/${Y}/${Y}${P(M)}.json`, { timeout: 8000 });
      let found = {};
      const scan = (obj) => {
        if (!obj || typeof obj !== 'object' || Object.keys(found).length > 0) return;
        for (let key in obj) {
          const val = obj[key]; if (!val) continue;
          if (DATE_PATTERNS.some(p => String(key).includes(p))) { found = val; return; }
          if (typeof val === 'object') {
             const dStr = String(val.date || val.day || val.gregorian || val.oDate || "");
             if (DATE_PATTERNS.some(p => dStr.includes(p))) { found = val; return; }
             if (val.day == D && (val.month == M || (!val.month && !val.year)) && !dStr.includes(`-${P(M + 1)}-`) && !dStr.includes(`-${M + 1}-`)) {
                 if (Object.keys(found).length === 0) found = val; 
             }
             scan(val);
          }
        }
      };
      scan(JSON.parse(await resp.text())); return found;
    } catch (e) { return {}; }
  };

  const obj = Lunar.toObj(Y, M, D);
  const api = await getAlmanac();
  const getVal = (...k) => { for(let i of k) if(api[i]) return api[i]; return ""; };
  
  const rawYi = getVal("yi","Yi","suit").replace(/\./g, " ");
  const rawJi = getVal("ji","Ji","avoid").replace(/\./g, " ");
  
  const chongshaStr = getVal("chongsha","ChongSha") || localChongSha; 
  const baijiStr = getVal("baiji","BaiJi", "pengzubaiji") || localBaiJi;

  return {
    type: 'widget', 
    padding: 16, 
    // ✨ 移除 backgroundGradient，采用原生支持最好的纯色 backgroundColor
    backgroundColor: BG_MAIN,
    refreshPolicy: { onNetworkChange: true, onEnter: true, timeout: 10 },
    children: [
      { type: 'spacer', length: 8 }, 
      { type: 'stack', direction: 'row', alignItems: 'center', gap: 8, children: [
          { type: 'image', src: 'sf-symbol:calendar.badge.clock', color: TEXT_MAIN, width: 18, height: 18 },
          { type: 'text', text: `${Y}年${M}月${D}日 星期${WEEK[now.getDay()]} ${chongshaStr}`, font: { size: 'headline', weight: 'bold' }, textColor: TEXT_MAIN, maxLines: 1, minScale: 0.8 }
      ]},
      { type: 'spacer', length: 6 }, 
      { type: 'text', text: `${obj.gz}(${obj.ani})年 ${obj.cn}${obj.term ? ` ✨今日${obj.term}` : ` · 当前${currentTerm}`}`, font: { size: 14, weight: 'medium' }, textColor: C_GOLD, maxLines: 1, minScale: 0.8 },
      { type: 'spacer', length: 8 }, 
      { type: 'stack', direction: 'column', alignItems: 'start', gap: 4, children: [
          ...(baijiStr ? [{ type: 'stack', direction: 'row', alignItems: 'start', gap: 2, children: [ { type: 'text', text: '📜 百忌：', font: { size: 12 }, textColor: TEXT_SUB }, { type: 'text', text: baijiStr, font: { size: 12 }, textColor: TEXT_SUB, maxLines: 1, minScale: 0.7 } ]}] : []),
          ...(rawYi ? [{ type: 'stack', direction: 'row', alignItems: 'start', gap: 2, children: [ { type: 'text', text: '✅ 宜：', font: { size: 13 }, textColor: TEXT_SUB }, { type: 'text', text: rawYi, font: { size: 13 }, textColor: TEXT_SUB, lineSpacing: 4, maxLines: 4, minScale: 0.7 } ]}] : []),
          ...(rawJi ? [{ type: 'stack', direction: 'row', alignItems: 'start', gap: 2, children: [ { type: 'text', text: '❎ 忌：', font: { size: 13 }, textColor: TEXT_SUB }, { type: 'text', text: rawJi, font: { size: 13 }, textColor: TEXT_SUB, lineSpacing: 4, maxLines: 4, minScale: 0.7 } ]}] : [])
      ]},
      { type: 'spacer', length: 6 },
      { type: 'stack', direction: 'row', alignItems: 'center', gap: 4, children: [
          { type: 'image', src: 'sf-symbol:leaf.fill', color: C_GREEN, width: 13, height: 13 },
          { type: 'text', text: `节气：${upcomingTerms.join(" , ")}`, font: { size: 12, weight: 'bold' }, textColor: C_GREEN, maxLines: 1, minScale: 0.5 }
      ]},
      { type: 'spacer', length: 8 }, 
      { type: 'stack', direction: 'row', alignItems: 'center', gap: 6, children: [
          { type: 'image', src: 'sf-symbol:building.columns.fill', color: C_BLUE, width: 13, height: 13 },
          { type: 'text', text: `法定：${festDisplay}`, font: { size: 12, weight: 'bold' }, textColor: TEXT_SUB, maxLines: 1 }
      ]},
      { type: 'spacer' }
    ]
  };
}
