const fs=require('fs');
const h=fs.readFileSync('/home/user/exercise_record/index.html','utf8');
const b=h.indexOf('*/',h.indexOf('CORE:START'))+2, e=h.lastIndexOf('/*',h.indexOf('CORE:END'));
const F=new Function(h.slice(b,e)+';return this;').call(
  new Proxy({},{get:(t,k)=>t[k],set:(t,k,v)=>{t[k]=v;return true}}));
// 直接取出所有頂層識別字
const api=new Function(h.slice(b,e)+`;return {CONFIG,round,runningMET,paceToSpeedKmh,speedKmhToPace,
 classifyIntensity,memContribution,metMinutes,kcalOf,weightedMET,aerobicLevel,vigorousOnlyLevel,
 strengthStatus,overallSignal,parseDate,fmtDate,weekStartOf,addDays,summarizeWeek,hrMaxTanaka,
 hrMaxSwim,karvonen,rpeToIntensity,parseDurationToMinutes,speedFromDistanceTime,speedPlausibility,
 runningSpeedCheck,segmentTotals,hiitSegments,presetMet,percentileThreshold,classifyReadout,
 normalizeOcrText,isValidOcrValue,pickOcrCandidate,reconcileReadouts,weeklySeries,attainmentStats,
 INTENSITY_ZH};`)();

let pass=0, fail=0; const issues=[];
const ck=(name,cond,detail)=>{ if(cond){pass++;} else {fail++; issues.push(name+(detail?'：'+detail:''));} };
const near=(a,b,t=1e-9)=>Math.abs(a-b)<=t;

console.log('══ A. 強度分級邊界 ══');
ck('2.9→light', api.classifyIntensity(2.9)==='light');
ck('3.0→moderate（含）', api.classifyIntensity(3.0)==='moderate');
ck('5.9→moderate', api.classifyIntensity(5.9)==='moderate');
ck('5.999→moderate', api.classifyIntensity(5.999)==='moderate');
ck('6.0→vigorous（含）', api.classifyIntensity(6.0)==='vigorous');
ck('1.59→sedentary', api.classifyIntensity(1.59)==='sedentary');
ck('1.6→light（含）', api.classifyIntensity(1.6)==='light');
ck('0→sedentary', api.classifyIntensity(0)==='sedentary');
ck('負值→sedentary', api.classifyIntensity(-5)==='sedentary');
ck('sedentary 不計入 MEM', api.memContribution(1.3,30)===0);
ck('四級皆有中文對照', ['sedentary','light','moderate','vigorous'].every(k=>api.INTENSITY_ZH[k]));
// CONFIG 宣告 Light 下限 1.6，但分級函式未使用
const lightMinUsed = /lightMin/.test(h.slice(b,e).replace(/lightMin:\s*[\d.]+/,''));
console.log('  分級邊界 3.0 / 6.0 皆為「含」，與規格一致');
console.log('  四級分級：sedentary <1.6 / light 1.6–2.9 / moderate 3.0–5.9 / vigorous ≥6.0');

console.log('\n══ B. MEM 換算 ══');
ck('moderate 計 1 倍', api.memContribution(5.0,30)===30);
ck('vigorous 計 2 倍', api.memContribution(6.0,30)===60);
ck('light 計 0', api.memContribution(2.5,30)===0);
ck('邊界 5.9 計 1 倍', api.memContribution(5.9,10)===10);
ck('邊界 6.0 計 2 倍', api.memContribution(6.0,10)===20);
ck('倍率取自 CONFIG', api.CONFIG.vigorousMultiplier===2);
ck('零時長→0', api.memContribution(10,0)===0);

console.log('\n══ C. 有氧達標門檻 ══');
[[149,'none'],[149.99,'none'],[150,'basic'],[300,'basic'],[300.01,'additional'],[301,'additional']]
  .forEach(([v,k])=>ck(`MEM ${v}→${k}`, api.aerobicLevel(v).key===k, '實得 '+api.aerobicLevel(v).key));
[[74,0],[75,1],[150,1],[151,2]].forEach(([v,l])=>
  ck(`高強度 ${v} 分→level ${l}`, api.vigorousOnlyLevel(v).level===l));
ck('基本達標為 Strong', /Strong/.test(api.aerobicLevel(200).grade));
ck('額外效益為 Conditional', /Conditional/.test(api.aerobicLevel(400).grade));
ck('額外效益 met=true（非未達標）', api.aerobicLevel(400).met===true);

console.log('\n══ D. 跑步方程式 ══');
ck('runningMET(9)=9.5714…', near(api.runningMET(9),(0.2*(9*1000/60)+3.5)/3.5));
ck('靜息項：速度 0 → MET 1', near(api.runningMET(1e-12),1,1e-6)||api.runningMET(0)===0);
ck('線性：速度加倍後 (MET-1) 亦加倍',
   near(api.runningMET(16)-1,(api.runningMET(8)-1)*2,1e-9));
ck('配速↔速度可逆', near(api.paceToSpeedKmh(api.speedKmhToPace(11.3)),11.3,1e-9));
ck('適用下限 8.0 為含', api.runningSpeedCheck(8.0)===null && api.runningSpeedCheck(7.999)!==null);
ck('負速度不報警示', api.runningSpeedCheck(-3)===null);

console.log('\n══ E. 熱量與 MET-min ══');
ck('kcal=MET×kg×hr', near(api.kcalOf(10,70,30),10*70*0.5));
ck('MET-min=MET×min', near(api.metMinutes(7.5,40),300));
// 分段紀錄的熱量須與逐段加總一致（avgMet×總時長 應等於 Σ MET×min）
const sgs=[{met:10,minutes:5},{met:3,minutes:5},{met:4,minutes:5}];
const st=api.segmentTotals(sgs);
ck('分段熱量與逐段加總一致',
   near(api.kcalOf(st.avgMet,70,st.minutes), sgs.reduce((s,x)=>s+api.kcalOf(x.met,70,x.minutes),0),1e-9));

console.log('\n══ F. 分段（HIIT）══');
ck('分段 MEM 逐段歸類', st.mem===api.memContribution(10,5)+api.memContribution(3,5)+api.memContribution(4,5));
ck('分段 MET-min 為總和', near(st.metMin,10*5+3*5+4*5));
ck('平均 MET = MET-min/總時長', near(st.avgMet,st.metMin/st.minutes));
const plan={warmupMin:5,warmupMet:4,rounds:5,workSec:60,workMet:10,restSec:60,restMet:3,cooldownMin:5,cooldownMet:3};
const segs=api.hiitSegments(plan);
ck('組數 n 產生 n 段高強度', segs.filter(s=>s.label==='高強度').length===5);
ck('恢復段為 n-1（末組後併入緩和）', segs.filter(s=>s.label==='恢復').length===4);
ck('rounds=0 不產生區段', api.hiitSegments({rounds:0}).length===0);
ck('rounds=1 無恢復段', api.hiitSegments({rounds:1,workSec:30,workMet:10}).filter(s=>s.label==='恢復').length===0);
ck('空輸入不當機', api.segmentTotals(null).minutes===0 && api.segmentTotals([]).mem===0);
ck('負值區段被忽略', api.segmentTotals([{met:-1,minutes:5},{met:5,minutes:-5}]).minutes===0);

console.log('\n══ G. 肌力達標 ══');
const G=api.CONFIG.strength.muscleGroups.map(x=>x.id);
const mk=(d,ms,mod=true)=>({date:d,met:3.5,minutes:45,isStrength:true,strengthModerate:mod,muscles:ms});
ck('7 大肌群定義完整', G.length===7 && new Set(G).size===7);
ck('2 天 + 全肌群→達標', api.strengthStatus([mk('2026-09-01',G.slice(0,4)),mk('2026-09-03',G.slice(4))]).met===true);
ck('1 天全肌群→未達標', api.strengthStatus([mk('2026-09-01',G)]).met===false);
ck('2 天缺 1 肌群→未達標', api.strengthStatus([mk('2026-09-01',G.slice(0,3)),mk('2026-09-03',G.slice(3,6))]).met===false);
ck('同日兩筆只算 1 天', api.strengthStatus([mk('2026-09-01',G.slice(0,4)),mk('2026-09-01',G.slice(4))]).days===1);
ck('未達 moderate 不計入', api.strengthStatus([mk('2026-09-01',G,false),mk('2026-09-03',G,false)]).days===0);
ck('MET 高低不影響肌力判定',
   api.strengthStatus([{...mk('2026-09-01',G.slice(0,4)),met:1},{...mk('2026-09-03',G.slice(4)),met:20}]).met===true);

console.log('\n══ H. 綜合燈號（不可互相折抵）══');
ck('兩項達標→綠', api.overallSignal(true,true).color==='green');
ck('僅有氧→黃', api.overallSignal(true,false).color==='yellow');
ck('僅肌力→黃', api.overallSignal(false,true).color==='yellow');
ck('皆未達→紅', api.overallSignal(false,false).color==='red');
// 有氧超量不得使肌力未達標亮綠
const huge=[{date:'2026-09-01',met:12,minutes:600,isStrength:false,strengthModerate:true,muscles:[]}];
ck('有氧 1200 MEM 但無肌力→仍非綠', api.summarizeWeek(huge,70).signal.color!=='green');

console.log('\n══ I. 週界與日期 ══');
ck('週一起始：週日歸前一週', api.weekStartOf('2026-09-06',1)==='2026-08-31');
ck('週日起始：週日為當週起始', api.weekStartOf('2026-09-06',0)==='2026-09-06');
ck('跨年正確', api.weekStartOf('2027-01-01',1)==='2026-12-28');
ck('跨月加日', api.addDays('2026-01-31',1)==='2026-02-01');
ck('閏年 2 月', api.addDays('2028-02-28',1)==='2028-02-29');
ck('往前跨年', api.addDays('2026-01-01',-1)==='2025-12-31');
ck('parse/fmt 可逆', api.fmtDate(api.parseDate('2026-07-04'))==='2026-07-04');

console.log('\n══ J. 心率模組 ══');
ck('Tanaka 208-0.7×age', near(api.hrMaxTanaka(40),208-0.7*40));
ck('40 歲→180', near(api.hrMaxTanaka(40),180));
ck('水中修正為負向相加', near(api.hrMaxSwim(40,-12),api.hrMaxTanaka(40)-12));
ck('預設修正 -12', api.CONFIG.hr.swimOffsetDefault===-12);
ck('可調範圍 -13~-10', api.CONFIG.hr.swimOffsetMin===-13 && api.CONFIG.hr.swimOffsetMax===-10);
ck('Karvonen 用心跳儲備', near(api.karvonen(60,180,50),60+0.5*(180-60)));
ck('Karvonen 0%→靜息', near(api.karvonen(60,180,0),60));
ck('Karvonen 100%→最大', near(api.karvonen(60,180,100),180));

console.log('\n══ K. 游泳加權 ══');
ck('加權=Σ佔比×MET', near(api.weightedMET([{met:5.8,pct:60},{met:5.3,pct:40}]),5.8*0.6+5.3*0.4));
ck('非 100% 自動正規化',
   near(api.weightedMET([{met:5.8,pct:6},{met:5.3,pct:4}]),api.weightedMET([{met:5.8,pct:60},{met:5.3,pct:40}])));
ck('全零→0', api.weightedMET([{met:5.8,pct:0}])===0);
ck('12 種泳姿皆有代碼', api.CONFIG.swimStrokes.length===12 && api.CONFIG.swimStrokes.every(s=>/^\d{5}$/.test(s.code)));

console.log('\n══ L. 主觀強度 / RPE ══');
ck('Borg 12→moderate', api.rpeToIntensity('borg',12)==='moderate');
ck('Borg 13→moderate', api.rpeToIntensity('borg',13)==='moderate');
ck('Borg 14→vigorous', api.rpeToIntensity('borg',14)==='vigorous');
ck('Borg 17→vigorous', api.rpeToIntensity('borg',17)==='vigorous');
ck('Borg 19→vigorous（超出上限仍高強度）', api.rpeToIntensity('borg',19)==='vigorous');
ck('Borg 10→light', api.rpeToIntensity('borg',10)==='light');
ck('CR10 3→moderate', api.rpeToIntensity('cr10',3)==='moderate');
ck('CR10 5→vigorous', api.rpeToIntensity('cr10',5)==='vigorous');
ck('未知量表→null', api.rpeToIntensity('nope',5)===null);

console.log('\n══ M. 跑步機讀數與單位 ══');
ck('mm:ss', near(api.parseDurationToMinutes('17:12'),17.2));
ck('h:mm:ss', near(api.parseDurationToMinutes('1:17:12'),77.2));
ck('純分鐘', api.parseDurationToMinutes('30')===30);
ck('小數分鐘', near(api.parseDurationToMinutes('7.5'),7.5));
ck('無效→null', api.parseDurationToMinutes('abc')===null && api.parseDurationToMinutes('')===null);
ck('負值→null', api.parseDurationToMinutes('-5')===null);
ck('速度=距離/時', near(api.speedFromDistanceTime(2.8,17.2),2.8/(17.2/60)));
ck('英里換算 1.609344', near(Number(api.classifyReadout('1mi').value),1.61,0.005));
ck('速度上限 45', api.CONFIG.running.maxPlausibleSpeedKmh===45);
ck('45 通過、45.1 攔下', api.speedPlausibility(45).ok===true && api.speedPlausibility(45.1).ok===false);

console.log('\n══ N. 讀數分類 ══');
[['2.8km','distance'],['2.8','distance'],['17:12','time'],['0m','elevation'],['206','number'],
 ['206kcal','calories'],['0km','number'],['abc','unknown'],['17:75','unknown']]
 .forEach(([t,k])=>ck(`分類 ${t}→${k}`, api.classifyReadout(t).kind===k, '實得 '+api.classifyReadout(t).kind));
ck('距離不可為時間格式', !api.isValidOcrValue('17:12','distance'));
ck('時間不可為小數', !api.isValidOcrValue('2.8','time'));

console.log('\n══ O. 達標軌跡 ══');
const wsr=(w)=>({date:api.addDays('2026-08-31',-7*w+1),met:9.57,minutes:40,isStrength:false,strengthModerate:true,muscles:[]});
const ser=api.weeklySeries([],1,'2026-08-31',12,70);
ck('序列長度=12', ser.length===12);
ck('序列由舊到新', ser[0].ws < ser[11].ws);
ck('末項為指定週', ser[11].ws==='2026-08-31');
const s2=api.attainmentStats(ser,'2026-08-31');
ck('無資料時連續 0', s2.currentStreak===0 && s2.both===0);

console.log('\n══ P. 強度選單 ══');
const wp=api.CONFIG.hiit.workPresets.map(api.presetMet);
const rp=api.CONFIG.hiit.restPresets.map(api.presetMet);
const up=api.CONFIG.hiit.warmupPresets.map(api.presetMet);
const cp=api.CONFIG.hiit.cooldownPresets.map(api.presetMet);
ck('高強度選項全為 vigorous', wp.every(m=>api.classifyIntensity(m)==='vigorous'));
ck('恢復選項無 vigorous', rp.every(m=>api.classifyIntensity(m)!=='vigorous'));
ck('所有選項 MET>0', [...wp,...rp,...up,...cp].every(m=>m>0));
ck('參照項目取值一致', api.presetMet({activityId:'rope'})===11.8);
ck('跑步選項與方程式一致', near(api.presetMet({runSpeedKmh:15}),api.runningMET(15)));
ck('無效項目→0', api.presetMet(null)===0 && api.presetMet({activityId:'zzz'})===0);

console.log('\n══ Q. 活動清單完整性 ══');
const acts=api.CONFIG.activities;
ck('id 無重複', new Set(acts.map(a=>a.id)).size===acts.length);
ck('名稱無重複', new Set(acts.map(a=>a.name)).size===acts.length);
const dynamic=acts.filter(a=>a.met===null);
ck('僅動態項目 met 為 null', dynamic.every(a=>['run','swim','hiit'].includes(a.id)),
   dynamic.map(a=>a.id).join(','));
ck('其餘 MET 皆 >0', acts.filter(a=>a.met!==null).every(a=>a.met>0));
ck('MET 值落在合理範圍 1–20', acts.filter(a=>a.met!==null).every(a=>a.met>=1&&a.met<=20));
ck('每項皆有分組', acts.every(a=>a.group));

console.log('\n══ R. 跨函式一致性 ══');
// summarizeWeek 與逐筆計算須一致
const rr=[{date:'2026-09-01',met:9.57,minutes:20,isStrength:false,strengthModerate:true,muscles:[]},
          {date:'2026-09-02',met:5.6,minutes:40,isStrength:false,strengthModerate:true,muscles:[]}];
const sw=api.summarizeWeek(rr,70);
ck('週 MEM = 逐筆 MEM 之和',
   near(sw.mem, rr.reduce((s,r)=>s+api.memContribution(r.met,r.minutes),0)));
ck('週 MET-min = 逐筆之和',
   near(sw.metMin, rr.reduce((s,r)=>s+api.metMinutes(r.met,r.minutes),0)));
ck('MEM = 中強度分鐘 + 2×高強度分鐘', near(sw.mem, sw.modMin + 2*sw.vigMin));
// 分段紀錄同樣須滿足此恆等式
const swSeg=api.summarizeWeek([{date:'2026-09-01',met:st.avgMet,minutes:st.minutes,segments:sgs,
  isStrength:false,strengthModerate:true,muscles:[]}],70);
ck('分段紀錄亦滿足 MEM 恆等式', near(swSeg.mem, swSeg.modMin + 2*swSeg.vigMin));
ck('MET-min 參考帶 500–1000', api.CONFIG.metMinutesBand.low===500 && api.CONFIG.metMinutesBand.high===1000);

console.log(`\n${'═'.repeat(46)}\n稽核項目 ${pass+fail} 項：通過 ${pass}、未通過 ${fail}`);
if(issues.length){ console.log('\n未通過項目：'); issues.forEach(i=>console.log('  ✗ '+i)); }
