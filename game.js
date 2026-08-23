
function refreshControlLayout(){
  updateViewportFit();
  // force reflow after Chrome's address bar/orientation changes
  document.body.offsetHeight;
}
window.addEventListener('resize',refreshControlLayout,{passive:true});
if(window.visualViewport)window.visualViewport.addEventListener('resize',refreshControlLayout,{passive:true});

window.addEventListener('DOMContentLoaded',()=>setScreenMode('world'));

function updateViewportFit(){
  const vv=window.visualViewport;
  const vw=vv?vv.width:window.innerWidth;
  const vh=vv?vv.height:window.innerHeight;
  document.documentElement.style.setProperty('--vwpx',`${vw}px`);
  document.documentElement.style.setProperty('--vhpx',`${vh}px`);
}
window.addEventListener('resize',updateViewportFit,{passive:true});
window.addEventListener('orientationchange',()=>setTimeout(updateViewportFit,80),{passive:true});
if(window.visualViewport)window.visualViewport.addEventListener('resize',updateViewportFit,{passive:true});
window.addEventListener('DOMContentLoaded',updateViewportFit);
setTimeout(updateViewportFit,30);

const APP_VERSION='v3.05';
window.APP_VERSION=APP_VERSION;
document.title=`魔導球技 ${APP_VERSION}`;
window.addEventListener('DOMContentLoaded',()=>{
  const v=document.getElementById('versionBadge');
  if(v)v.textContent=APP_VERSION;
});

(()=>{'use strict';

function updateOrientation(){
  const w=Math.max(window.innerWidth,document.documentElement.clientWidth||0);
  const h=Math.max(window.innerHeight,document.documentElement.clientHeight||0);
  const landscape = w >= h * 1.10;
  document.body.classList.toggle('isLandscape', landscape);
  document.body.classList.toggle('isPortrait', !landscape);
}
window.addEventListener('resize', updateOrientation, {passive:true});
window.addEventListener('orientationchange', ()=>setTimeout(updateOrientation,120), {passive:true});
updateOrientation();
window.__ENDING_BOOT_CHECK__=true;
setTimeout(()=>{
  if(typeof saveData!=='undefined'&&isPostGame&&isPostGame()&&!saveData.endingSeen){
    showEnding();
  }
},350);



const c=document.getElementById('game');let g=c.getContext('2d');
const W=1280,H=720;
const COURT={x:190,y:72,w:900,h:576},CY=360;
const BLUE='#4d86ff',RED='#ff6c72',SKIN='#f4dfc3',EYE='#182239';

const NORMAL_WALLS=[
  {x:355,y:165,w:20,h:125,kind:'wall'},
  {x:455,y:420,w:20,h:125,kind:'wall'},
  {x:630,y:275,w:24,h:185,kind:'wall'},
  {x:825,y:165,w:20,h:125,kind:'wall'},
  {x:925,y:420,w:20,h:125,kind:'wall'}
];
let walls=NORMAL_WALLS.map(w=>({...w}));
let bossStageKind=null;

function setBossStage(kind){
  bossStageKind=kind||null;
  if(!kind){
    walls=NORMAL_WALLS.map(w=>({...w}));
    return;
  }

  const layouts={
    forest:[
      {x:355,y:150,w:52,h:165,kind:'tree'},
      {x:470,y:430,w:78,h:54,kind:'boulder'},
      {x:670,y:195,w:48,h:190,kind:'tree'},
      {x:810,y:455,w:95,h:44,kind:'log'}
    ],
    silverwolf:[],
    managolem:[
      {x:430,y:170,w:48,h:160,kind:'crystal'},
      {x:640,y:400,w:62,h:115,kind:'rockpillar'},
      {x:845,y:170,w:48,h:160,kind:'crystal'}
    ],
    manadeer:[
      {x:430,y:190,w:88,h:54,kind:'lilypad'},
      {x:650,y:430,w:82,h:54,kind:'reedrock'},
      {x:845,y:190,w:88,h:54,kind:'lilypad'}
    ],
    cave:[
      {x:365,y:145,w:54,h:180,kind:'crystal'},
      {x:500,y:435,w:66,h:105,kind:'rockpillar'},
      {x:675,y:255,w:62,h:185,kind:'rockpillar'},
      {x:835,y:150,w:54,h:165,kind:'crystal'},
      {x:920,y:445,w:70,h:80,kind:'boulder'}
    ],
    pond:[
      {x:360,y:165,w:92,h:58,kind:'lilypad'},
      {x:470,y:435,w:80,h:52,kind:'reedrock'},
      {x:660,y:265,w:92,h:58,kind:'lilypad'},
      {x:820,y:430,w:82,h:58,kind:'reedrock'},
      {x:905,y:175,w:88,h:56,kind:'lilypad'}
    ],
    fairy:[
      {x:325,y:145,w:58,h:190,kind:'sacredtree'},
      {x:475,y:445,w:62,h:80,kind:'runestone'},
      {x:650,y:190,w:42,h:150,kind:'lightpillar'},
      {x:760,y:405,w:64,h:105,kind:'runestone'},
      {x:905,y:145,w:58,h:190,kind:'sacredtree'}
    ],
    frogking:[
      {x:335,y:170,w:112,h:64,kind:'giantlily'},
      {x:465,y:430,w:108,h:52,kind:'fallenlog'},
      {x:650,y:245,w:118,h:68,kind:'giantlily'},
      {x:795,y:435,w:92,h:62,kind:'mudrock'},
      {x:900,y:175,w:105,h:60,kind:'giantlily'}
    ]
  };
  walls=(layouts[kind]||NORMAL_WALLS).map(w=>({...w}));
}

const flagBlue={x:230,y:360},flagRed={x:1050,y:360};
const TEAMS={
  rush:{name:'ブルームランナーズ',desc:'旗取り型：前へ出る選手が多く、旗を積極的に狙います。',roles:['attacker','attacker','support']},
  guard:{name:'ストーンウォールズ',desc:'守備型：自陣旗と壁裏を重視して戦います。',roles:['guard','guard','shooter']},
  shoot:{name:'スターショッツ',desc:'射撃型：距離を取り、アウトを優先して狙います。',roles:['shooter','shooter','balance']},
  frogmages:{name:'リビット・ローブズ',desc:'池に棲む本物のカエル魔導師。舌・泡弾・超跳躍を使い、ミニ蛙まで呼び出します。',roles:['attacker','shooter','support'],frogMageUsers:[0,1,2]}
};
const ROOKIE_TEAMS={
  shield:{name:'アズールガーディアンズ',desc:'シールド使い：魔力盾で1発だけ防ぎます。',roles:['guard','shooter','balance'],shieldUsers:[0]},
  rush:{name:'スカイランナーズ',desc:'機動型：前線を押し上げながらシールドも使います。',roles:['attacker','support','attacker'],shieldUsers:[1]},
  mix:{name:'ルーンスターズ',desc:'混成型：守備と射撃を切り替え、シールドで隙を補います。',roles:['guard','shooter','support'],shieldUsers:[2]},
  triple:{name:'トライボルト',desc:'連射・剣術型：3連射と魔力剣を使います。',roles:['shooter','balance','support'],shieldUsers:[],tripleUsers:[0],bladeUsers:[1]}
};
const ADVANCED_TEAMS={
  phase:{
    name:'ファントムレイ',
    desc:'壁抜け型：壁の裏にいても直線の壁すり抜け弾で狙ってきます。',
    roles:['shooter','balance','support'],
    phaseUsers:[0]
  },
  bounce:{
    name:'リコシェッターズ',
    desc:'反射型：壁へバウンド弾を当て、横や後ろから弾を通してきます。',
    roles:['shooter','shooter','guard'],
    bounceUsers:[0,1]
  },
  hybrid:{
    name:'ミラージュギア',
    desc:'複合型：壁すり抜け弾とバウンド弾を使い分ける上位チーム。',
    roles:['balance','shooter','support'],
    phaseUsers:[0],
    bounceUsers:[1]
  },
  blast:{
    name:'ボムバースト',
    desc:'爆裂型：壁や地面に当たると爆風が起きる爆裂弾で壁裏を狙います。',
    roles:['shooter','balance','guard'],
    blastUsers:[0,1]
  }
};

const EXPERT_TEAMS={
  beast:{
    name:'フェンリルクラブ',
    desc:'オオカミ化型：四足歩行のオオカミ型に変身して高速移動します。オオカミ化中は投球・旗取得・回避不可。',
    roles:['attacker','balance','support'],
    beastUsers:[0]
  },
  blastbeast:{
    name:'ワイルドボマー',
    desc:'爆裂弾とオオカミ化を組み合わせ、壁裏を崩して一気に距離を詰めます。',
    roles:['shooter','attacker','guard'],
    blastUsers:[0],
    beastUsers:[1]
  },
  apex:{
    name:'アークビースト',
    desc:'上位混成型：オオカミ化と特殊弾を使い分けるエキスパートチーム。',
    roles:['balance','shooter','attacker'],
    beastUsers:[0],
    bounceUsers:[1]
  }
};
const MASTER_TEAMS={
  invis:{name:'ヴェイルシーカーズ',desc:'透明化型：一時的に姿を消して位置をずらします。',roles:['attacker','balance','support'],invisUsers:[0]},
  trick:{name:'トリックスターズ',desc:'変則弾型：拡散弾と直角弾で回避先を狙います。',roles:['shooter','shooter','balance'],spreadUsers:[0],rightAngleUsers:[1]},
  lob:{name:'スカイアーク',desc:'投射型：壁を越える放物線爆弾を投げ、着地点で爆発させます。',roles:['shooter','balance','guard'],lobUsers:[0,1]},
  mine:{name:'グリフマイナーズ',desc:'地雷型：魔法地雷を最大2個設置します。クリスタル付近には置けません。',roles:['guard','support','balance'],mineUsers:[0,1]},
  grand:{name:'グランドアルカナ',desc:'複合型：3人がそれぞれ透明化・拡散弾・ジャンプを担当します。',roles:['balance','shooter','attacker'],invisUsers:[0],spreadUsers:[1],jumpUsers:[2]}
};

const GRANDMASTER_TEAMS={
  clone:{
    name:'ミラージュツインズ',
    desc:'分身型：本体をその場に残し、分身体で攻めます。本体を狙うのが攻略の鍵です。',
    roles:['attacker','balance','support'],
    cloneUsers:[0,1]
  },
  reflect:{
    name:'リフレクトセイバーズ',
    desc:'反射剣型：半円状の魔力剣で飛んできた弾を斬り返します。',
    roles:['guard','shooter','balance'],
    reflectBladeUsers:[0,1]
  },
  wind:{
    name:'テンペストサークル',
    desc:'風術型：相手陣に風の渦を発生させ、壁の陰から押し出して射線を作ります。',
    roles:['support','balance','shooter'],
    windUsers:[0,1]
  },
  mole:{name:'アンダーディガーズ',desc:'潜行型：モグラ化して地面へ潜り、壁と弾を無視して間合いを詰めます。',roles:['attacker','balance','support'],moleUsers:[0,1]},
  arcana:{
    name:'アークミラージュ',
    desc:'最上位混成型：分身・反射剣・風起こしを3人が別々に使います。',
    roles:['attacker','guard','support'],
    cloneUsers:[0],
    reflectBladeUsers:[1],
    windUsers:[2]
  }
};
// v2.48: opponent-specific 2-3 color uniforms. Each team gets its own motif.
const OUTFITS={
  'beginner:rush': {base:'#e85d5d',sub:'#ffd166',accent:'#fff1c7',pattern:'chevron'},
  'beginner:guard':{base:'#58677c',sub:'#aeb8c6',accent:'#f0d49a',pattern:'bars'},
  'beginner:shoot':{base:'#6c4bb6',sub:'#f7d154',accent:'#e9ddff',pattern:'star'},
  'rookie:shield': {base:'#2878b8',sub:'#8ee3ef',accent:'#f4fbff',pattern:'shield'},
  'rookie:rush':   {base:'#38a6c7',sub:'#f0cf5b',accent:'#ffffff',pattern:'slash'},
  'rookie:mix':    {base:'#7656b5',sub:'#ef8cc6',accent:'#f8e9ff',pattern:'diamond'},
  'rookie:triple': {base:'#d45d34',sub:'#ffd166',accent:'#fff2d5',pattern:'triple'},
  'advanced:phase': {base:'#423d83',sub:'#65d6c3',accent:'#d8fff8',pattern:'wave'},
  'advanced:bounce':{base:'#2d8f72',sub:'#f2b84b',accent:'#eaffd7',pattern:'zigzag'},
  'advanced:hybrid':{base:'#704c9f',sub:'#49b8a8',accent:'#f2dcff',pattern:'split'},
  'advanced:blast': {base:'#9b4438',sub:'#f29a3f',accent:'#ffe5a8',pattern:'burst'},
  'expert:beast':   {base:'#66513f',sub:'#c99355',accent:'#f0ddbd',pattern:'fang'},
  'expert:blastbeast':{base:'#713a34',sub:'#d8843d',accent:'#f4c85a',pattern:'claw'},
  'expert:apex':    {base:'#3f5b52',sub:'#9fbe6f',accent:'#e9f4c7',pattern:'crest'},
  'master:invis':   {base:'#514b79',sub:'#a88fd8',accent:'#e7ddff',pattern:'fade'},
  'master:trick':   {base:'#7d3f82',sub:'#45c4ad',accent:'#ffe26e',pattern:'spiral'},
  'master:lob':     {base:'#315d8a',sub:'#a9d7e8',accent:'#f5e6a8',pattern:'arc'},
  'master:mine':    {base:'#4c5848',sub:'#b6a14d',accent:'#e7e1ad',pattern:'rune'},
  'master:grand':   {base:'#392f56',sub:'#c39a48',accent:'#e6d8ff',pattern:'crown'},
  'grandmaster:clone': {base:'#405bc7',sub:'#9bd4ff',accent:'#f8fbff',pattern:'split'},
  'grandmaster:reflect': {base:'#d4a62a',sub:'#fff0a6',accent:'#6d4e00',pattern:'chevron'},
  'grandmaster:wind': {base:'#3ca889',sub:'#d0fff2',accent:'#386f9a',pattern:'wave'},
  'grandmaster:arcana': {base:'#7b4ca8',sub:'#43c7b4',accent:'#ffd96b',pattern:'star'},
  'grandmaster:mole': {base:'#6b4b35',sub:'#c59b6c',accent:'#f0d6ad',pattern:'stripe'},

};
function outfitFor(u){
  if(u.team==='blue')return {base:BLUE,sub:'#dceaff',accent:'#ffe66d',pattern:'player'};
  return OUTFITS[u.outfitKey]||{base:RED,sub:'#ffd4d7',accent:'#fff0f0',pattern:'bars'};
}



let player=null,allies=[],enemies=[],bullets=[],fx=[];
let mines=[],lobShots=[];
let windZones=[],miniFrogs=[];
let selectedTeam='rush',running=false,over=false,last=0,left=60,secAcc=0,bScore=0,rScore=0,round=1,msgUntil=0,pendingLearnMessage='';
let mode='menu',cupKind='beginner',cupIndex=0,cupTable=null,currentOpponent='rush',fieldFrogMatch=false;
let noSkillCup=false;
const CUP_ORDER=['rush','guard','shoot'];
const ROOKIE_ORDER=['shield','rush','mix','triple'];
const ADVANCED_ORDER=['phase','bounce','hybrid','blast'];
const EXPERT_ORDER=['beast','blastbeast','apex'];
const MASTER_ORDER=['invis','trick','lob','mine','grand'];
const GRANDMASTER_ORDER=['clone','reflect','wind','mole','arcana'];
const CUP_NAMES={player:'プレイヤーチーム',rush:TEAMS.rush.name,guard:TEAMS.guard.name,shoot:TEAMS.shoot.name};
function currentCupOrder(){return cupKind==='grandmaster'?GRANDMASTER_ORDER:(cupKind==='master'?MASTER_ORDER:(cupKind==='expert'?EXPERT_ORDER:(cupKind==='advanced'?ADVANCED_ORDER:(cupKind==='rookie'?ROOKIE_ORDER:CUP_ORDER))))}
function opponentData(id){return cupKind==='grandmaster'?GRANDMASTER_TEAMS[id]:(cupKind==='master'?MASTER_TEAMS[id]:(cupKind==='expert'?EXPERT_TEAMS[id]:(cupKind==='advanced'?ADVANCED_TEAMS[id]:(cupKind==='rookie'?ROOKIE_TEAMS[id]:TEAMS[id]))))}
const SAVE_KEY='magic_ball_save_v216';
let saveData=loadSave();

function defaultSave(){
  return{
    totalWins:0,totalLosses:0,beginnerWins:0,bestPlace:4,
    rookieUnlocked:false,cupResume:null,
    shieldProgress:0,shieldUnlocked:false,shieldEquipped:false,
    specialSlot1:'double',specialSlot2:'rabbit',allyRole1:'support',allyRole2:'guard',
    encounteredTeams:[],tripleProgress:0,tripleUnlocked:false,advancedUnlocked:false,phaseProgress:0,phaseUnlocked:false,bounceProgress:0,bounceUnlocked:false,expertUnlocked:false,blastProgress:0,blastUnlocked:false,beastProgress:0,beastUnlocked:false,masterUnlocked:false,playerSkills:['none','none','none'],allySkillA:'none',allySkillB:'none',ally1SkillA:'none',ally1SkillB:'none',ally2SkillA:'none',ally2SkillB:'none',invisProgress:0,invisUnlocked:false,spreadProgress:0,spreadUnlocked:false,rightAngleProgress:0,rightAngleUnlocked:false,lobProgress:0,lobUnlocked:false,mineProgress:0,mineUnlocked:false,jumpProgress:0,jumpUnlocked:false,grandmasterUnlocked:false,cloneProgress:0,cloneUnlocked:false,reflectBladeProgress:0,reflectBladeUnlocked:false,windProgress:0,windUnlocked:false,moleProgress:0,moleUnlocked:false,bladeProgress:0,bladeUnlocked:false,fairyUnlocked:false,fairyBossWins:0,wetlandsUnlocked:false,frogUnlocked:false,frogTeamUnlocked:false,playerTeamStyle:'human',gameCleared:false,endingSeen:false,frogBossWins:0,fieldBossClears:[],fieldQuestStage:0,speedBootsUnlocked:false,silverWolfWins:0,
    maxManaRelicUnlocked:false,manaRegenRelicUnlocked:false,
    manaGolemWins:0,manaDeerWins:0
  };
}
function loadSave(){
  try{
    const raw=localStorage.getItem(SAVE_KEY);
    if(!raw)return defaultSave();
    const parsed=JSON.parse(raw);
    const data=Object.assign(defaultSave(),parsed);
    if(data.spreadProgress!=null && !data.spreadProgress)data.spreadProgress=data.spreadProgress;
    if(data.spreadUnlocked && !data.spreadUnlocked)data.spreadUnlocked=true;
    // v2.56: old one-slot ally settings become each ally's A slot.
    if((data.ally1SkillA||'none')==='none' && data.allySkillA)data.ally1SkillA=data.allySkillA;
    if((data.ally2SkillA||'none')==='none' && data.allySkillB)data.ally2SkillA=data.allySkillB;
    if(!Array.isArray(data.encounteredTeams))data.encounteredTeams=[];
    if(typeof data.gameCleared!=='boolean')data.gameCleared=false;
    if(data.grandmasterChampion)data.gameCleared=true;
    if(typeof data.endingSeen!=='boolean')data.endingSeen=false;
    if(typeof data.frogTeamUnlocked!=='boolean')data.frogTeamUnlocked=false;
    if(!data.playerTeamStyle)data.playerTeamStyle='human';
    // v3.05 old-save compatibility:
    // If the save had already reached/cleared the highest tier in an older build,
    // preserve postgame access instead of requiring the ending again.
    if(data.grandmasterChampion)data.gameCleared=true;
    if(data.playerTeamStyle==='frog')data.frogTeamUnlocked=true;
    if(!Number.isFinite(data.fairyBossWins))data.fairyBossWins=0;
    if(typeof data.wetlandsUnlocked!=='boolean')data.wetlandsUnlocked=false;
    // v2.76 migration: 妖精女王を旧バージョンですでに倒しているセーブも大湿原を解放
    if(data.fairyUnlocked||(Array.isArray(data.fieldBossClears)&&data.fieldBossClears.includes('fairy'))||(data.fairyBossWins||0)>0)data.wetlandsUnlocked=true;
    if(typeof data.frogUnlocked!=='boolean')data.frogUnlocked=false;
    if(!Number.isFinite(data.frogBossWins))data.frogBossWins=0;
    if(!data.allyRole1)data.allyRole1='support';
    if(!data.allyRole2)data.allyRole2='guard';if(!Array.isArray(data.fieldBossClears))data.fieldBossClears=[];if(!Number.isFinite(data.fieldQuestStage))data.fieldQuestStage=0;
    // v2.66: derive field-boss availability from tournaments already cleared.
    // Forest: Beginner champion
    // Cave: Rookie champion (advanced unlocked)
    // Pond: Advanced champion (expert unlocked)
    let derivedFieldQuestStage=0;
    if((data.beginnerWins||0)>0 || data.rookieUnlocked)derivedFieldQuestStage=1;
    if(data.advancedUnlocked)derivedFieldQuestStage=2;
    if(data.expertUnlocked || data.masterUnlocked || data.grandmasterUnlocked)derivedFieldQuestStage=3;
    data.fieldQuestStage=Math.max(data.fieldQuestStage||0,derivedFieldQuestStage);

    if(!data.bladeUnlocked){if(data.specialSlot1==='blade')data.specialSlot1='double';if(data.specialSlot2==='blade')data.specialSlot2='rabbit';}
    if(data.encounteredTeams.length===0){
      if((data.beginnerWins||0)>0||data.rookieUnlocked){
        for(const id of CUP_ORDER)data.encounteredTeams.push(`beginner:${id}`);
      }
      if(data.rookieUnlocked)data.encounteredTeams.push('rookie:shield');
      data.encounteredTeams=[...new Set(data.encounteredTeams)];
    }

    // v2.27以前の「自動装備」セーブを新しい2枠方式へ移行
    if(data.shieldUnlocked && data.shieldEquipped &&
       data.specialSlot1==='none' && data.specialSlot2==='none'){
      data.specialSlot1='shield';
    }else if(data.specialSlot1==='none' && data.specialSlot2==='none'){
      data.specialSlot1='double';
    }
    return data;
  }catch(_){return defaultSave()}
}
function writeSave(){
  try{localStorage.setItem(SAVE_KEY,JSON.stringify(saveData))}catch(_){}
  refreshRecordUI();
}
function refreshRecordUI(){
  const teamSel=$('playerTeamStyle'),frogOpt=$('frogTeamOption'),teamInfo=$('teamStyleInfo');
  if(teamSel){
    if(frogOpt){
      frogOpt.disabled=!saveData.frogTeamUnlocked;
      frogOpt.textContent=saveData.frogTeamUnlocked?'リビット・ローブズ':'リビット・ローブズ（未解放）';
    }
    if(saveData.playerTeamStyle==='frog'&&!saveData.frogTeamUnlocked)saveData.playerTeamStyle='human';
    teamSel.value=saveData.playerTeamStyle||'human';
    if(teamInfo)teamInfo.textContent=teamSel.value==='frog'
      ?'3人とも本物のカエル魔導師。舌・バブル・大大大ジャンプ・ミニ蛙を使います。'
      :'通常のアルカナ選手チーム。装備した特殊技を使います。';
  }
  const roleA=$('roleA'),roleB=$('roleB');
  if(roleA&&saveData.allyRole1)roleA.value=saveData.allyRole1;
  if(roleB&&saveData.allyRole2)roleB.value=saveData.allyRole2;
  const rt=$('recordText'),ru=$('rankUnlock'),cb=$('cupContinueBtn');
  if(rt)rt.textContent=`通算 ${saveData.totalWins}勝 ${saveData.totalLosses}敗 / 優勝 ${saveData.beginnerWins}回`;
  if(ru){
    ru.textContent=saveData.rookieUnlocked?'次ランク：ルーキーカップ解禁済み':'次ランク：未解禁';
    ru.classList.toggle('open',saveData.rookieUnlocked);
    ru.classList.toggle('locked',!saveData.rookieUnlocked);
  }
  if(cb)cb.classList.toggle('hidden',!saveData.cupResume);
  const rb=$('rookieBtn');if(rb)rb.classList.toggle('hidden',!saveData.rookieUnlocked);
  const ab=$('advancedBtn');if(ab)ab.classList.toggle('hidden',!saveData.advancedUnlocked);
  const eb=$('expertBtn');if(eb)eb.classList.toggle('hidden',!saveData.expertUnlocked);
  const mb=$('masterBtn');if(mb)mb.classList.toggle('hidden',!saveData.masterUnlocked);
  const gb=$('grandmasterBtn');if(gb)gb.classList.toggle('hidden',!saveData.grandmasterUnlocked);

  const sp=$('shieldProgressText');
  if(sp){
    sp.innerHTML=
      (saveData.shieldUnlocked?'シールド　習得済み':`シールド　${saveData.shieldProgress||0}/3`)
      + '<br>' + (saveData.tripleUnlocked?'3連射　習得済み':`3連射　${saveData.tripleProgress||0}/3`)
      + '<br>' + (saveData.bladeUnlocked?'魔力剣　習得済み':`魔力剣　${saveData.bladeProgress||0}/3`)
      + '<br>' + (saveData.phaseUnlocked?'壁すり抜け弾　習得済み':`壁すり抜け弾　${saveData.phaseProgress||0}/3`)
      + '<br>' + (saveData.bounceUnlocked?'バウンド弾　習得済み':`バウンド弾　${saveData.bounceProgress||0}/3`)
      + '<br>' + (saveData.blastUnlocked?'爆裂弾　習得済み':`爆裂弾　${saveData.blastProgress||0}/3`)
      + '<br>' + (saveData.beastUnlocked?'オオカミ化　習得済み':`オオカミ化　${saveData.beastProgress||0}/3`)
      + '<br>' + (saveData.invisUnlocked?'透明化　習得済み':`透明化　${saveData.invisProgress||0}/3`)
      + '<br>' + (saveData.spreadUnlocked?'拡散弾　習得済み':`拡散弾　${saveData.spreadProgress||0}/3`)
      + '<br>' + (saveData.rightAngleUnlocked?'直角弾　習得済み':`直角弾　${saveData.rightAngleProgress||0}/3`)
      + '<br>' + (saveData.lobUnlocked?'放物線爆弾　習得済み':`放物線爆弾　${saveData.lobProgress||0}/3`)
      + '<br>' + (saveData.mineUnlocked?'地雷　習得済み':`地雷　${saveData.mineProgress||0}/3`)
      + '<br>' + (saveData.jumpUnlocked?'ジャンプ　習得済み':`ジャンプ　${saveData.jumpProgress||0}/3`)
      + '<br>' + (saveData.cloneUnlocked?'分身　習得済み':`分身　${saveData.cloneProgress||0}/3`)
      + '<br>' + (saveData.reflectBladeUnlocked?'反射の魔力剣　習得済み':`反射の魔力剣　${saveData.reflectBladeProgress||0}/3`)
      + '<br>' + (saveData.windUnlocked?'風起こし　習得済み':`風起こし　${saveData.windProgress||0}/3`)
      + '<br>' + (saveData.moleUnlocked?'モグラ化　習得済み':`モグラ化　${saveData.moleProgress||0}/3`)
      + '<br>' + (saveData.fairyUnlocked?'妖精化　習得済み':'妖精化　ボス撃破で習得');
    sp.classList.toggle('skillLearned',!!saveData.shieldUnlocked);
  }

  updateSpecialButtons();
  refreshPlayerSkillSelectors();
}


function unlockedSkillChoices(){
  const a=[['none','なし']];
  const defs=[
    ['shield','シールド','shieldUnlocked'],
    ['double','2連射',null],
    ['rabbit','ウサギ化',null],
    ['triple','3連射','tripleUnlocked'],
    ['blade','魔力剣','bladeUnlocked'],
    ['phase','壁すり抜け弾','phaseUnlocked'],
    ['bounce','バウンド弾','bounceUnlocked'],
    ['blast','爆裂弾','blastUnlocked'],
    ['beast','オオカミ化','beastUnlocked'],
    ['invis','透明化','invisUnlocked'],
    ['spread','拡散弾','spreadUnlocked'],
    ['rightangle','直角弾','rightAngleUnlocked'],
    ['lob','放物線爆弾','lobUnlocked'],
    ['mine','地雷','mineUnlocked'],
    ['jump','ジャンプ','jumpUnlocked'],
    ['clone','分身','cloneUnlocked'],
    ['reflectblade','反射の魔力剣','reflectBladeUnlocked'],
    ['wind','風起こし','windUnlocked'],
    ['mole','モグラ化','moleUnlocked'],
    ['fairy','妖精化','fairyUnlocked'],
    ['frog','カエル化','frogUnlocked']
  ];
  for(const [v,n,k] of defs)if(!k||saveData[k])a.push([v,n]);
  return a;
}
function refreshPlayerSkillSelectors(){
  const defs=[
    ['ally1SkillA','ally1SkillA'],
    ['ally1SkillB','ally1SkillB'],
    ['ally2SkillA','ally2SkillA'],
    ['ally2SkillB','ally2SkillB']
  ];
  const choices=unlockedSkillChoices();

  for(const [id,key] of defs){
    const el=$(id);
    if(!el)continue;
    const current=saveData[key]||'none';
    el.innerHTML='';
    for(const [value,name] of choices){
      const o=document.createElement('option');
      o.value=value;
      o.textContent=name;
      el.appendChild(o);
    }
    el.value=choices.some(c=>c[0]===current)?current:'none';
  }
}
function specialName(kind){
  if(kind==='double')return '2連射';
  if(kind==='rabbit')return 'ウサギ化';
  if(kind==='blade')return '魔力剣';
  if(kind==='phase')return '壁すり抜け弾';
  if(kind==='bounce')return 'バウンド弾';
  if(kind==='blast')return '爆裂弾';
  if(kind==='beast')return 'オオカミ化';
  if(kind==='invis')return '透明化';
  if(kind==='spread')return '拡散弾';
  if(kind==='rightangle')return '直角弾';
  if(kind==='lob')return '放物線爆弾';
  if(kind==='mine')return '地雷';
  if(kind==='jump')return 'ジャンプ';
  if(kind==='clone')return '分身';
  if(kind==='reflectblade')return '反射の魔力剣';
  if(kind==='wind')return '風起こし';
  if(kind==='mole')return 'モグラ化';
  if(kind==='fairy')return '妖精化';
  if(kind==='frog')return 'カエル化';
  if(kind==='triple')return '3連射';
  if(kind==='shield')return 'シールド';
  return 'なし（✌）';
}
function updateSpecialButtons(){
  if(noSkillCup&&mode==='cup'){
    const a=$('special1'),b=$('special2');
    if(a)a.innerHTML='×<small>使用不可</small>';
    if(b)b.innerHTML='×<small>使用不可</small>';
    return;
  }
  const slots=[saveData.specialSlot1||'none',saveData.specialSlot2||'none'];
  ['special1','special2'].forEach((id,i)=>{
    const el=$(id);
    if(!el)return;
    const kind=slots[i];
    if(player&&player.alive&&player.frogMage){
      el.innerHTML=i===0?'舌<small>長舌丸呑み</small>':'蛙<small>ミニ蛙</small>';
      return;
    }
    if(player&&player.alive&&player.frogActive){if(kind==='frog'){el.innerHTML='人<small>元に戻る</small>';return;}el.innerHTML='舌<small>長舌丸呑み</small>';return;}
    if(kind==='double'){
      el.innerHTML='×2<small>2連射</small>';
    }else if(kind==='rabbit'){el.innerHTML='兎<small>ウサギ化</small>';
    }else if(kind==='blade'&&saveData.bladeUnlocked){
      el.innerHTML='剣<small>魔力剣</small>';
    }else if(kind==='phase'){
      el.innerHTML='透<small>壁抜け</small>';
    }else if(kind==='bounce'){
      el.innerHTML='跳<small>バウンド</small>';
    }else if(kind==='blast'&&saveData.blastUnlocked){
      el.innerHTML='爆<small>爆裂弾</small>';
    }else if(kind==='beast'&&saveData.beastUnlocked){
      el.innerHTML='獣<small>オオカミ化</small>';
    }else if(kind==='invis'&&saveData.invisUnlocked){el.innerHTML='透<small>透明化</small>';
    }else if(kind==='spread'&&saveData.spreadUnlocked){el.innerHTML='散<small>拡散弾</small>';
    }else if(kind==='rightangle'&&saveData.rightAngleUnlocked){el.innerHTML='┐<small>直角弾</small>';
    }else if(kind==='lob'&&saveData.lobUnlocked){el.innerHTML='弧<small>放物線</small>';
    }else if(kind==='mine'&&saveData.mineUnlocked){el.innerHTML='雷<small>地雷</small>';
    }else if(kind==='jump'&&saveData.jumpUnlocked){el.innerHTML='跳<small>ジャンプ</small>';
    }else if(kind==='clone'&&saveData.cloneUnlocked){el.innerHTML='分<small>分身</small>';
    }else if(kind==='reflectblade'&&saveData.reflectBladeUnlocked){el.innerHTML='返<small>反射剣</small>';
    }else if(kind==='wind'&&saveData.windUnlocked){el.innerHTML='風<small>風起こし</small>';
    }else if(kind==='mole'&&saveData.moleUnlocked){el.innerHTML='潜<small>モグラ化</small>';
    }else if(kind==='fairy'&&saveData.fairyUnlocked){el.innerHTML='妖<small>妖精化</small>';
    }else if(kind==='frog'&&saveData.frogUnlocked){el.innerHTML='蛙<small>カエル化</small>';
    }else if(kind==='triple'&&saveData.tripleUnlocked){
      el.innerHTML='×3<small>3連射</small>';
    }else if(kind==='shield'&&saveData.shieldUnlocked){
      el.innerHTML='盾<small>シールド</small>';
    }else{
      el.innerHTML=`${i+1===1?'Ⅰ':'Ⅱ'}<small>✌</small>`;
    }
  });
}
function updateSkillSetUI(){
  const a=$('specialSlot1'),b=$('specialSlot2'),info=$('skillSetInfo');
  if(!a||!b)return;

  const bladeOptionA=[...a.options].find(o=>o.value==='blade'),bladeOptionB=[...b.options].find(o=>o.value==='blade');
  const shieldOptionA=[...a.options].find(o=>o.value==='shield');
  const shieldOptionB=[...b.options].find(o=>o.value==='shield');
  const tripleOptionA=[...a.options].find(o=>o.value==='triple');
  const tripleOptionB=[...b.options].find(o=>o.value==='triple');
  const phaseOptionA=[...a.options].find(o=>o.value==='phase');
  const phaseOptionB=[...b.options].find(o=>o.value==='phase');
  const bounceOptionA=[...a.options].find(o=>o.value==='bounce');
  const bounceOptionB=[...b.options].find(o=>o.value==='bounce');
  const blastOptionA=[...a.options].find(o=>o.value==='blast');
  const blastOptionB=[...b.options].find(o=>o.value==='blast');
  const beastOptionA=[...a.options].find(o=>o.value==='beast');
  const beastOptionB=[...b.options].find(o=>o.value==='beast');
  const invisOptionA=[...a.options].find(o=>o.value==='invis'),invisOptionB=[...b.options].find(o=>o.value==='invis');
  const boomerangOptionA=[...a.options].find(o=>o.value==='spread'),boomerangOptionB=[...b.options].find(o=>o.value==='spread');
  const rightAngleOptionA=[...a.options].find(o=>o.value==='rightangle'),rightAngleOptionB=[...b.options].find(o=>o.value==='rightangle');
  const lobOptionA=[...a.options].find(o=>o.value==='lob'),lobOptionB=[...b.options].find(o=>o.value==='lob');
  const mineOptionA=[...a.options].find(o=>o.value==='mine'),mineOptionB=[...b.options].find(o=>o.value==='mine');
  const jumpOptionA=[...a.options].find(o=>o.value==='jump'),jumpOptionB=[...b.options].find(o=>o.value==='jump');
  const cloneOptionA=[...a.options].find(o=>o.value==='clone'),cloneOptionB=[...b.options].find(o=>o.value==='clone');
  const reflectBladeOptionA=[...a.options].find(o=>o.value==='reflectblade'),reflectBladeOptionB=[...b.options].find(o=>o.value==='reflectblade');
  const windOptionA=[...a.options].find(o=>o.value==='wind'),windOptionB=[...b.options].find(o=>o.value==='wind');
  const moleOptionA=[...a.options].find(o=>o.value==='mole'),moleOptionB=[...b.options].find(o=>o.value==='mole');
  const fairyOptionA=[...a.options].find(o=>o.value==='fairy'),fairyOptionB=[...b.options].find(o=>o.value==='fairy');
  const frogOptionA=[...a.options].find(o=>o.value==='frog'),frogOptionB=[...b.options].find(o=>o.value==='frog');
  if(bladeOptionA)bladeOptionA.disabled=!saveData.bladeUnlocked;if(bladeOptionB)bladeOptionB.disabled=!saveData.bladeUnlocked;
  if(shieldOptionA)shieldOptionA.disabled=!saveData.shieldUnlocked;
  if(shieldOptionB)shieldOptionB.disabled=!saveData.shieldUnlocked;
  if(tripleOptionA)tripleOptionA.disabled=!saveData.tripleUnlocked;
  if(tripleOptionB)tripleOptionB.disabled=!saveData.tripleUnlocked;
  if(phaseOptionA)phaseOptionA.disabled=!saveData.phaseUnlocked;
  if(phaseOptionB)phaseOptionB.disabled=!saveData.phaseUnlocked;
  if(bounceOptionA)bounceOptionA.disabled=!saveData.bounceUnlocked;
  if(bounceOptionB)bounceOptionB.disabled=!saveData.bounceUnlocked;
  if(blastOptionA)blastOptionA.disabled=!saveData.blastUnlocked;
  if(blastOptionB)blastOptionB.disabled=!saveData.blastUnlocked;
  if(beastOptionA)beastOptionA.disabled=!saveData.beastUnlocked;
  if(beastOptionB)beastOptionB.disabled=!saveData.beastUnlocked;
  if(invisOptionA)invisOptionA.disabled=!saveData.invisUnlocked;if(invisOptionB)invisOptionB.disabled=!saveData.invisUnlocked;
  if(boomerangOptionA)boomerangOptionA.disabled=!saveData.spreadUnlocked;if(boomerangOptionB)boomerangOptionB.disabled=!saveData.spreadUnlocked;
  if(rightAngleOptionA)rightAngleOptionA.disabled=!saveData.rightAngleUnlocked;if(rightAngleOptionB)rightAngleOptionB.disabled=!saveData.rightAngleUnlocked;
  if(lobOptionA)lobOptionA.disabled=!saveData.lobUnlocked;if(lobOptionB)lobOptionB.disabled=!saveData.lobUnlocked;
  if(mineOptionA)mineOptionA.disabled=!saveData.mineUnlocked;if(mineOptionB)mineOptionB.disabled=!saveData.mineUnlocked;
  if(jumpOptionA)jumpOptionA.disabled=!saveData.jumpUnlocked;if(jumpOptionB)jumpOptionB.disabled=!saveData.jumpUnlocked;
  if(cloneOptionA)cloneOptionA.disabled=!saveData.cloneUnlocked;if(cloneOptionB)cloneOptionB.disabled=!saveData.cloneUnlocked;
  if(reflectBladeOptionA)reflectBladeOptionA.disabled=!saveData.reflectBladeUnlocked;if(reflectBladeOptionB)reflectBladeOptionB.disabled=!saveData.reflectBladeUnlocked;
  if(windOptionA)windOptionA.disabled=!saveData.windUnlocked;if(windOptionB)windOptionB.disabled=!saveData.windUnlocked;
  if(moleOptionA)moleOptionA.disabled=!saveData.moleUnlocked;if(moleOptionB)moleOptionB.disabled=!saveData.moleUnlocked;
  if(fairyOptionA)fairyOptionA.disabled=!saveData.fairyUnlocked;if(fairyOptionB)fairyOptionB.disabled=!saveData.fairyUnlocked;
  if(frogOptionA)frogOptionA.disabled=!saveData.frogUnlocked;if(frogOptionB)frogOptionB.disabled=!saveData.frogUnlocked;

  a.value=saveData.specialSlot1||'none';
  b.value=saveData.specialSlot2||'none';

  if(!saveData.shieldUnlocked){
    info.innerHTML='2連射：初期習得 / 魔力26消費 / 短い間隔で通常弾を2発 / 再使用 約0.65秒<br><br>ウサギ化：初期習得 / 少し高速化 / 回避ボタンで低いジャンプ / 変身中は射撃・回避不可<br><br>魔力剣：ルーキーで習得 / 魔力18消費 / 前方半円の敵弾を消去 / 再使用 約0.75秒<br><br>壁すり抜け弾：アドバンスで習得 / 魔力24消費 / 壁を無視して直進 / 再使用 約0.55秒<br><br>バウンド弾：アドバンスで習得 / 魔力22消費 / 壁で最大4回反射 / 再使用 約0.55秒<br><br>シールド：未習得<br>ルーキーカップのシールド持ちチームに3勝すると使用できます。';
  }else{
    info.innerHTML='2連射：初期習得 / 魔力26消費 / 短い間隔で通常弾を2発 / 再使用 約0.65秒<br><br>ウサギ化：初期習得 / 少し高速化 / 回避ボタンで低いジャンプ / 変身中は射撃・回避不可<br><br>魔力剣：ルーキーで習得 / 魔力18消費 / 前方半円の敵弾を消去 / 再使用 約0.75秒<br><br>壁すり抜け弾：アドバンスで習得 / 魔力24消費 / 壁を無視して直進 / 再使用 約0.55秒<br><br>バウンド弾：アドバンスで習得 / 魔力22消費 / 壁で最大4回反射 / 再使用 約0.55秒<br><br>シールド：魔力30消費 / 約3秒 / 魔力弾を1発防ぐと消失 / 再使用 約5.2秒';
  }
}
function saveSkillSet(){
  const a=$('specialSlot1'),b=$('specialSlot2');
  if(!a||!b)return;

  let s1=a.value,s2=b.value;
  if(s1==='shield'&&!saveData.shieldUnlocked)s1='none';
  if(s2==='shield'&&!saveData.shieldUnlocked)s2='none';
  if(s1==='triple'&&!saveData.tripleUnlocked)s1='none';
  if(s2==='triple'&&!saveData.tripleUnlocked)s2='none';
  if(s1==='phase'&&!saveData.phaseUnlocked)s1='none';
  if(s2==='phase'&&!saveData.phaseUnlocked)s2='none';
  if(s1==='bounce'&&!saveData.bounceUnlocked)s1='none';
  if(s2==='bounce'&&!saveData.bounceUnlocked)s2='none';
  if(s1==='blast'&&!saveData.blastUnlocked)s1='none';
  if(s2==='blast'&&!saveData.blastUnlocked)s2='none';
  if(s1==='blade'&&!saveData.bladeUnlocked)s1='none';if(s2==='blade'&&!saveData.bladeUnlocked)s2='none';
  if(s1==='beast'&&!saveData.beastUnlocked)s1='none';
  if(s2==='beast'&&!saveData.beastUnlocked)s2='none';
  if(s1==='invis'&&!saveData.invisUnlocked)s1='none';if(s2==='invis'&&!saveData.invisUnlocked)s2='none';
  if(s1==='spread'&&!saveData.spreadUnlocked)s1='none';if(s2==='spread'&&!saveData.spreadUnlocked)s2='none';
  if(s1==='rightangle'&&!saveData.rightAngleUnlocked)s1='none';if(s2==='rightangle'&&!saveData.rightAngleUnlocked)s2='none';
  if(s1==='lob'&&!saveData.lobUnlocked)s1='none';if(s2==='lob'&&!saveData.lobUnlocked)s2='none';
  if(s1==='mine'&&!saveData.mineUnlocked)s1='none';if(s2==='mine'&&!saveData.mineUnlocked)s2='none';
  if(s1==='jump'&&!saveData.jumpUnlocked)s1='none';if(s2==='jump'&&!saveData.jumpUnlocked)s2='none';
  if(s1==='clone'&&!saveData.cloneUnlocked)s1='none';if(s2==='clone'&&!saveData.cloneUnlocked)s2='none';
  if(s1==='reflectblade'&&!saveData.reflectBladeUnlocked)s1='none';if(s2==='reflectblade'&&!saveData.reflectBladeUnlocked)s2='none';
  if(s1==='wind'&&!saveData.windUnlocked)s1='none';if(s2==='wind'&&!saveData.windUnlocked)s2='none';
  if(s1==='mole'&&!saveData.moleUnlocked)s1='none';if(s2==='mole'&&!saveData.moleUnlocked)s2='none';
  if(s1==='fairy'&&!saveData.fairyUnlocked)s1='none';if(s2==='fairy'&&!saveData.fairyUnlocked)s2='none';
  if(s1==='frog'&&!saveData.frogUnlocked)s1='none';if(s2==='frog'&&!saveData.frogUnlocked)s2='none';

  // 同じ特殊技を2枠に重複装備する意味はないので、後から選んだ②を優先
  if(s1!=='none'&&s1===s2)s1='none';

  saveData.specialSlot1=s1;
  saveData.specialSlot2=s2;
  saveData.shieldEquipped=(s1==='shield'||s2==='shield'); // 旧セーブ互換用
  writeSave();
}


function teamKey(kind,id){return `${kind}:${id}`}
function markEncountered(kind,id){
  const key=teamKey(kind,id);
  if(!Array.isArray(saveData.encounteredTeams))saveData.encounteredTeams=[];
  if(!saveData.encounteredTeams.includes(key)){
    saveData.encounteredTeams.push(key);
    writeSave();
  }
}
function practiceEntries(){
  const keys=Array.isArray(saveData.encounteredTeams)?saveData.encounteredTeams:[];
  const list=[];
  for(const key of keys){
    const [kind,id]=key.split(':');
    const data=kind==='grandmaster'?GRANDMASTER_TEAMS[id]:(kind==='master'?MASTER_TEAMS[id]:(kind==='expert'?EXPERT_TEAMS[id]:(kind==='advanced'?ADVANCED_TEAMS[id]:(kind==='rookie'?ROOKIE_TEAMS[id]:TEAMS[id]))));
    if(data)list.push({kind,id,name:data.name,desc:data.desc});
  }
  return list;
}
function teamSkillList(kind,id){let d=kind==='grandmaster'?GRANDMASTER_TEAMS[id]:(kind==='master'?MASTER_TEAMS[id]:(kind==='expert'?EXPERT_TEAMS[id]:(kind==='advanced'?ADVANCED_TEAMS[id]:(kind==='rookie'?ROOKIE_TEAMS[id]:TEAMS[id]))));if(!d)return ['特殊技なし'];const x=[];for(const [p,n] of [['shieldUsers','シールド'],['tripleUsers','3連射'],['bladeUsers','魔力剣'],['phaseUsers','壁すり抜け弾'],['bounceUsers','バウンド弾'],['blastUsers','爆裂弾'],['beastUsers','オオカミ化'],['invisUsers','透明化'],['spreadUsers','拡散弾'],['rightAngleUsers','直角弾'],['lobUsers','放物線爆弾'],['mineUsers','地雷'],['jumpUsers','ジャンプ'],['cloneUsers','分身'],['reflectBladeUsers','反射の魔力剣'],['windUsers','風起こし'],['moleUsers','モグラ化']])if(d[p]&&d[p].length)x.push(n);return x.length?x:['特殊技なし'];}
function teamMemberSkillList(kind,id){
  const d=kind==='grandmaster'?GRANDMASTER_TEAMS[id]:(kind==='master'?MASTER_TEAMS[id]:(kind==='expert'?EXPERT_TEAMS[id]:(kind==='advanced'?ADVANCED_TEAMS[id]:(kind==='rookie'?ROOKIE_TEAMS[id]:TEAMS[id]))));
  if(!d)return ['特殊技なし','特殊技なし','特殊技なし'];
  const out=['特殊技なし','特殊技なし','特殊技なし'];
  const defs=[['shieldUsers','シールド'],['tripleUsers','3連射'],['bladeUsers','魔力剣'],['phaseUsers','壁すり抜け弾'],['bounceUsers','バウンド弾'],['blastUsers','爆裂弾'],['beastUsers','オオカミ化'],['invisUsers','透明化'],['spreadUsers','拡散弾'],['rightAngleUsers','直角弾'],['lobUsers','放物線爆弾'],['mineUsers','地雷'],['jumpUsers','ジャンプ'],['cloneUsers','分身'],['reflectBladeUsers','反射の魔力剣'],['windUsers','風起こし'],['moleUsers','モグラ化']];
  for(const [prop,name] of defs)for(const i of (d[prop]||[]))if(i>=0&&i<3)out[i]=out[i]==='特殊技なし'?name:out[i]+'＋'+name;
  return out;
}
function updatePracticeMenu(){
  const sel=$('practiceTeamSelect'),info=$('practiceTeamInfo');
  if(!sel||!info)return;
  const list=practiceEntries();
  sel.innerHTML='';
  if(!list.length){
    const op=document.createElement('option');
    op.value='';
    op.textContent='まだ対戦相手がいません';
    sel.appendChild(op);
    info.textContent='大会で一度対戦すると、ここに練習相手として追加されます。';
    $('practiceStartBtn').disabled=true;
    return;
  }
  $('practiceStartBtn').disabled=false;
  for(const e of list){
    const op=document.createElement('option');
    op.value=`${e.kind}:${e.id}`;
    op.textContent=`${e.name}　[${teamSkillList(e.kind,e.id).join(' / ')}]`;
    sel.appendChild(op);
  }
  const refresh=()=>{
    const [kind,id]=sel.value.split(':');
    const d=kind==='master'?MASTER_TEAMS[id]:(kind==='expert'?EXPERT_TEAMS[id]:(kind==='advanced'?ADVANCED_TEAMS[id]:(kind==='rookie'?ROOKIE_TEAMS[id]:TEAMS[id])));
    const ms=teamMemberSkillList(kind,id); info.innerHTML=d?`<b>${d.name}</b><br>選手1：${ms[0]}　/　選手2：${ms[1]}　/　選手3：${ms[2]}<br><span>${d.desc}</span>`:'';
  };
  sel.onchange=refresh;
  refresh();
}

function saveAllySkills(){
  const pairs=[
    ['ally1SkillA','ally1SkillA'],
    ['ally1SkillB','ally1SkillB'],
    ['ally2SkillA','ally2SkillA'],
    ['ally2SkillB','ally2SkillB']
  ];
  for(const [id,key] of pairs){
    const el=$(id);
    if(el)saveData[key]=el.value||'none';
  }
  // Legacy fields kept for backward compatibility.
  saveData.allySkillA=saveData.ally1SkillA||'none';
  saveData.allySkillB=saveData.ally2SkillA||'none';
  writeSave();
}

function saveCupResume(){
  if(mode!=='cup'||!cupTable)return;
  saveData.cupResume={
    cupKind,
    cupIndex,
    cupTable:JSON.parse(JSON.stringify(cupTable)),
    roleA:$('roleA')?.value||'support',
    roleB:$('roleB')?.value||'guard'
  };
  writeSave();
}
function clearCupResume(){saveData.cupResume=null;writeSave()}

function newCupTable(){const t={};t.player={id:'player',name:'プレイヤーチーム',w:0,l:0,rf:0,ra:0};for(const id of currentCupOrder()){const d=opponentData(id);t[id]={id,name:d.name,w:0,l:0,rf:0,ra:0}}return t}
function recordMatch(a,b,as,bs){const A=cupTable[a],B=cupTable[b];A.rf+=as;A.ra+=bs;B.rf+=bs;B.ra+=as;if(as>bs){A.w++;B.l++}else{B.w++;A.l++}}
function simulateCpu(a,b){const aw=Math.random()<.5,ls=Math.random()<.55?1:0;recordMatch(a,b,aw?2:ls,aw?ls:2)}
function sortedTable(){return Object.values(cupTable).sort((a,b)=>b.w-a.w||((b.rf-b.ra)-(a.rf-a.ra))||b.rf-a.rf)}
function tableHTML(){return '<div class="standingRow standingHead"><span></span><span>チーム</span><span>勝敗</span><span>得失</span></div>'+sortedTable().map((r,i)=>`<div class="standingRow ${r.id==='player'?'me':''}"><span class="rank">${i+1}</span><span class="teamName">${r.name}</span><span class="stat">${r.w}-${r.l}</span><span class="stat">${r.rf-r.ra>=0?'+':''}${r.rf-r.ra}</span></div>`).join('')}
function refreshCup(){currentOpponent=currentCupOrder()[cupIndex];const d=opponentData(currentOpponent);$('cupTitle').textContent=`${cupKind==='grandmaster'?'グランドマスター':(cupKind==='master'?'マスター':(cupKind==='expert'?'エキスパート':(cupKind==='advanced'?'アドバンス':(cupKind==='rookie'?'ルーキー':'ビギナー'))))} 第${cupIndex+1}試合`;$('cupOpponent').innerHTML=`次の相手：<b>${d.name}</b><br><small>${d.desc}</small>`;$('standings').innerHTML=tableHTML()}

function gainShieldResearch(){
  if(saveData.shieldUnlocked)return '';
  saveData.shieldProgress=Math.min(3,(saveData.shieldProgress||0)+1);

  if(saveData.shieldProgress>=3){
    saveData.shieldUnlocked=true;

    // 空き枠があれば初回だけ自動セット。後からセット画面で変更可能。
    if((saveData.specialSlot1||'none')==='none'){
      saveData.specialSlot1='shield';
    }else if((saveData.specialSlot2||'none')==='none'){
      saveData.specialSlot2='shield';
    }
    saveData.shieldEquipped=true;
    writeSave();
    return 'シールド習得！　特殊技セットで変更できます';
  }

  writeSave();
  return `シールド習得 ${saveData.shieldProgress}/3`;
}



function gainSimpleResearch(key,label){const p=key+'Progress',u=key+'Unlocked';if(saveData[u])return '';saveData[p]=Math.min(3,(saveData[p]||0)+1);if(saveData[p]>=3){saveData[u]=true;writeSave();return `${label} 習得！`;}writeSave();return `${label} ${saveData[p]}/3`;}
function opponentHasKey(prop){const d=opponentData(currentOpponent);return !!(d&&d[prop]&&d[prop].length);}
function gainBlastResearch(){
  if(saveData.blastUnlocked)return '';
  saveData.blastProgress=Math.min(3,(saveData.blastProgress||0)+1);
  if(saveData.blastProgress>=3){saveData.blastUnlocked=true;writeSave();return '爆裂弾 習得！';}
  writeSave();return `爆裂弾 ${saveData.blastProgress}/3`;
}
function gainBeastResearch(){
  if(saveData.beastUnlocked)return '';
  saveData.beastProgress=Math.min(3,(saveData.beastProgress||0)+1);
  if(saveData.beastProgress>=3){saveData.beastUnlocked=true;writeSave();return 'オオカミ化 習得！';}
  writeSave();return `オオカミ化 ${saveData.beastProgress}/3`;
}
function opponentHasBlast(){
  const d=opponentData(currentOpponent);
  return !!(d&&d.blastUsers&&d.blastUsers.length);
}
function opponentHasBeast(){
  if(cupKind!=='expert')return false;
  const d=opponentData(currentOpponent);
  return !!(d&&d.beastUsers&&d.beastUsers.length);
}

function gainPhaseResearch(){
  if(saveData.phaseUnlocked)return '';
  saveData.phaseProgress=Math.min(3,(saveData.phaseProgress||0)+1);
  if(saveData.phaseProgress>=3){saveData.phaseUnlocked=true;writeSave();return '壁すり抜け弾 習得！';}
  writeSave();return `壁すり抜け弾 ${saveData.phaseProgress}/3`;
}
function gainBounceResearch(){
  if(saveData.bounceUnlocked)return '';
  saveData.bounceProgress=Math.min(3,(saveData.bounceProgress||0)+1);
  if(saveData.bounceProgress>=3){saveData.bounceUnlocked=true;writeSave();return 'バウンド弾 習得！';}
  writeSave();return `バウンド弾 ${saveData.bounceProgress}/3`;
}
function opponentHasPhase(){
  if(cupKind!=='advanced')return false;
  const d=opponentData(currentOpponent);
  return !!(d&&d.phaseUsers&&d.phaseUsers.length);
}
function opponentHasBounce(){
  if(cupKind!=='advanced')return false;
  const d=opponentData(currentOpponent);
  return !!(d&&d.bounceUsers&&d.bounceUsers.length);
}

function gainBladeResearch(){
  if(saveData.bladeUnlocked)return '';
  saveData.bladeProgress=Math.min(3,(saveData.bladeProgress||0)+1);
  if(saveData.bladeProgress>=3){
    saveData.bladeUnlocked=true;
    saveData.bladeProgress=3;
    writeSave();
    return '魔力剣 習得！';
  }
  writeSave();
  return `魔力剣 ${saveData.bladeProgress}/3`;
}

function gainTripleResearch(){
  if(saveData.tripleUnlocked)return '';
  saveData.tripleProgress=Math.min(3,(saveData.tripleProgress||0)+1);
  if(saveData.tripleProgress>=3){saveData.tripleUnlocked=true;writeSave();return '3連射習得！';}
  writeSave();return `3連射習得 ${saveData.tripleProgress}/3`;
}
function opponentHasTriple(){
  if(cupKind!=='rookie')return false;
  const d=opponentData(currentOpponent);
  return !!(d&&d.tripleUsers&&d.tripleUsers.length);
}
function opponentHasBlade(){
  if(cupKind!=='rookie')return false;
  const d=opponentData(currentOpponent);
  return !!(d&&d.bladeUsers&&d.bladeUsers.length);
}


function opponentHasShield(){
  if(cupKind!=='rookie')return false;
  const d=opponentData(currentOpponent);
  return !!(d&&d.shieldUsers&&d.shieldUsers.length);
}

function finishCup(){const clearedBefore={beginner:(saveData.beginnerWins||0)>0,rookie:!!saveData.advancedUnlocked,advanced:!!saveData.expertUnlocked,expert:!!saveData.masterUnlocked,master:!!saveData.grandmasterUnlocked,grandmaster:!!saveData.grandmasterChampion};
  const o=currentCupOrder();
  for(let i=0;i<o.length;i++){for(let j=i+1;j<o.length;j++)simulateCpu(o[i],o[j]);}
  $('finalStandings').innerHTML=tableHTML();
  const place=sortedTable().findIndex(r=>r.id==='player')+1;
  if(cupKind==='beginner'){
    saveData.bestPlace=Math.min(saveData.bestPlace||4,place);
    if(place===1){saveData.beginnerWins++;saveData.rookieUnlocked=true}
    $('cupEndTitle').textContent=place===1?'ビギナーカップ優勝！':`ビギナーカップ ${place}位`;
    $('cupEndText').textContent=place===1?'ルーキーカップへの挑戦権を獲得しました！':'もう一度挑戦できます。';
  }else if(cupKind==='rookie'){
    if(place===1)saveData.advancedUnlocked=true;
    $('cupEndTitle').textContent=place===1?'ルーキーカップ優勝！':`ルーキーカップ ${place}位`;
    $('cupEndText').textContent=place===1?'アドバンスカップへの挑戦権を獲得しました！':'特殊技への対処を覚えて再挑戦しましょう。';
  }else if(cupKind==='advanced'){
    if(place===1)saveData.expertUnlocked=true;
    $('cupEndTitle').textContent=place===1?'アドバンスカップ優勝！':`アドバンスカップ ${place}位`;
    $('cupEndText').textContent=place===1?'エキスパートカップへの挑戦権を獲得しました！':'特殊弾の軌道を読んで再挑戦しましょう。';
  }else if(cupKind==='expert'){if(place===1)saveData.masterUnlocked=true;$('cupEndTitle').textContent=place===1?'エキスパートカップ優勝！':`エキスパートカップ ${place}位`;$('cupEndText').textContent=place===1?'マスターカップへの挑戦権を獲得しました！':'オオカミ化の高速移動を読んで再挑戦しましょう。';}else if(cupKind==='master'){
    if(place===1)saveData.grandmasterUnlocked=true;
    $('cupEndTitle').textContent=place===1?'マスターカップ優勝！':`マスターカップ ${place}位`;
    $('cupEndText').textContent=place===1?'グランドマスターカップへの挑戦権を獲得しました！':'技の軌道と設置位置を読んで再挑戦しましょう。';
  }else{
    if(place===1){
      saveData.grandmasterChampion=true;
      saveData.gameCleared=true;
    }
    $('cupEndTitle').textContent=place===1?'グランドマスターカップ優勝！':`グランドマスターカップ ${place}位`;
    $('cupEndText').textContent=place===1?'最上位の魔法戦術にも勝利！':'分身・反射・風の使い方を読んで再挑戦しましょう。';
  }
  if(place===1&&!clearedBefore[cupKind])saveData.fieldQuestStage=Math.min(3,(saveData.fieldQuestStage||0)+1);
  saveData.cupResume=null;writeSave();
  $('cupEndPanel').classList.remove('hidden');
  if(cupKind==='grandmaster'&&place===1){
    setTimeout(()=>showEnding(),450);
  }
}

let input={x:0,y:0},keys={},heldAt=0;

const $=id=>document.getElementById(id);

let introClosed=false;
function closeIntro(){
  const intro=$('introScreen');
  if(!intro)return;
  introClosed=true;
  intro.style.display='none';
}
function bindIntroStart(){
  const intro=$('introScreen');
  if(!intro)return;
  intro.addEventListener('click',closeIntro);
  intro.addEventListener('pointerup',closeIntro);
  window.addEventListener('keydown',closeIntro);
}
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',bindIntroStart,{once:true});
}else{
  bindIntroStart();
}


const score=$('score'),clock=$('clock'),roundLabel=$('roundLabel'),manaFill=$('manaFill'),message=$('message');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const norm=(x,y)=>{const d=Math.hypot(x,y)||1;return{x:x/d,y:y/d}};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

class Unit{
  constructor(x,y,team,controlled=false,role='balance'){
    Object.assign(this,{x,y,team,controlled,role,r:17,alive:true,mana:100,maxMana:100,manaRegen:8,lastShot:-9,shotCd:.85,lastDodge:-9,dodgeT:0,inv:0,dodgeRecover:0,dx:0,dy:0,emote:0,think:0,target:null,charging:false,chargeT:0,curveSide:1,rollAngle:0,strafeDir:(Math.random()<.5?-1:1),strafeTimer:0,shield:0,lastShield:-99,specialKind:null,specialA:'none',specialB:'none',shieldReact:-1,lastDouble:-99,lastBlade:-99,bladeT:0,bladeAngle:0,tripleReady:-1,lastTriple:-99,lastPhase:-99,lastBounce:-99,lastBlast:-99,lastBeast:-99,beastT:0,beastActive:false,rabbitActive:false,lastRabbit:-99,rabbitT:0,lastInvis:-99,invisT:0,lastSpread:-99,lastRightAngle:-99,lastLob:-99,lastMine:-99,lastJump:-99,jumpT:0,lastClone:-99,cloneT:0,cloneBody:null,lastReflectBlade:-99,reflectBladeT:0,lastWind:-99,lastMole:-99,moleActive:false,moleT:0,fairyActive:false,lastFairy:-99,frogActive:false,lastFrog:-99,lastFrogJump:-99,lastFrogTongue:-99,lastFrogBubble:-99,frogTongueT:0,frogMage:false,lastMiniFrog:-99,outfitKey:null,runPhase:Math.random()*6.28,isMoving:false});
    this.speed=controlled?190:158;
  }
  update(dt){
    const _oldX=this.x,_oldY=this.y;
    if(!this.alive)return;
    this.mana=Math.min(this.maxMana,this.mana+this.manaRegen*dt);
    const wasDodging=this.dodgeT>0;
    this.dodgeT=Math.max(0,this.dodgeT-dt);
    this.inv=Math.max(0,this.inv-dt);
    this.dodgeRecover=Math.max(0,this.dodgeRecover-dt);
    if(wasDodging&&this.dodgeT<=0)this.dodgeRecover=.20;
    this.emote=Math.max(0,this.emote-dt);
    if(this.charging)this.chargeT=Math.min(.8,this.chargeT+dt);
    this.shield=Math.max(0,this.shield-dt);
    this.bladeT=Math.max(0,this.bladeT-dt);
    if(this.beastActive&&this.beastT>0){this.beastT=Math.max(0,this.beastT-dt);if(this.beastT<=0)this.beastActive=false;}
    if(this.rabbitActive&&this.rabbitT>0){this.rabbitT=Math.max(0,this.rabbitT-dt);if(this.rabbitT<=0)this.rabbitActive=false;}
    if(this.invisT>0)this.invisT=Math.max(0,this.invisT-dt);
    if(this.jumpT>0)this.jumpT=Math.max(0,this.jumpT-dt);
    if(this.frogTongueT>0)this.frogTongueT=Math.max(0,this.frogTongueT-dt);
    if(this.fairyActive)maintainFairyCooldowns(this);
    if(this.beastActive){this.mana=Math.max(0,this.mana-8*dt);if(this.mana<=0){this.beastActive=false;if(this.controlled)flash('MP切れ：オオカミ化解除',360)}}
    if(this.moleActive){this.moleT=Math.max(0,this.moleT-dt);this.mana=Math.max(0,this.mana-18*dt);if(this.mana<=0||this.moleT<=0){this.moleActive=false;this.moleT=0;if(this.controlled&&this.mana<=0)flash('MP切れ：地上へ',360)}}
    this.reflectBladeT=Math.max(0,this.reflectBladeT-dt);
    if(this.cloneT>0){
      this.cloneT=Math.max(0,this.cloneT-dt);
      if(this.cloneT<=0&&this.cloneBody){
        this.x=this.cloneBody.x;this.y=this.cloneBody.y;this.cloneBody=null;
      }
    }
    const _moved=Math.hypot(this.x-_oldX,this.y-_oldY);this.isMoving=_moved>.12;if(this.isMoving)this.runPhase=(this.runPhase||0)+dt*15;
    this.strafeTimer=Math.max(0,this.strafeTimer-dt);
    if(this.strafeTimer<=0){
      this.strafeTimer=.8+Math.random()*1.4;
      if(Math.random()<.45)this.strafeDir*=-1;
    }
    if(this.dodgeT>0)this.rollAngle+=dt*18;
    else this.rollAngle=0;
  }
}


function explodeAt(x,y,team,radius=58){
  spark(x,y);
  // visible particles
  for(let i=0;i<18;i++)fx.push({x,y,vx:(Math.random()-.5)*220,vy:(Math.random()-.5)*220,t:.55});
  const targets=team==='blue'?enemies:[player,...allies];
  for(const u of targets){
    if(!u||!u.alive||u.inv>0||u.jumpT>0||u.moleActive)continue;

    if(u.cloneT>0&&u.cloneBody&&Math.hypot(u.cloneBody.x-x,u.cloneBody.y-y)<=radius+u.r){
      const wasControlled=u.controlled;
      u.cloneT=0;u.cloneBody=null;u.alive=false;
      if(wasControlled){flash('本体が爆風でOUT!',520);transferControl();}
      else flash(u.team==='red'?'ENEMY本体 OUT':'ALLY本体 OUT',550);
      continue;
    }

    if(Math.hypot(u.x-x,u.y-y)<=radius+u.r){
      if(mode==='boss'&&u.team==='red'){
        bossTakeHit('explosion');
        continue;
      }
      if(u.cloneT>0&&u.cloneBody){endClone(u,true);continue;}
      const wasControlled=u.controlled;
      u.alive=false;
      if(wasControlled){flash('爆風 OUT!',500);transferControl();}
      else flash(u.team==='red'?'爆風でENEMY OUT!':'爆風でALLY OUT!',550);
    }
  }
  checkEnd();
}

class Bullet{
  constructor(x,y,dx,dy,team,curve,target,kind='normal'){
    Object.assign(this,{
      x,y,dx,dy,team,curve,target,kind,r:kind==='bubble'?13:(kind==='claw'?12:(kind==='crystal'?9:(kind==='spirit'?10:7))),life:kind==='bubble'?2.8:(kind==='claw'?1.45:3.6),
      bouncesLeft:kind==='bounce'?4:0,
      blastRadius:kind==='blast'?58:0,
      spreadLife:kind==='spread'?.46:0,
      originX:x,originY:y,phase2:0,
      speed:kind==='bubble'?245:(kind==='claw'?470:(kind==='crystal'?330:(kind==='spirit'?300:(kind==='rightangle'?325:(kind==='spread'?360:(curve?315:355)))))),age:0,
      curveTime:curve?1.20:0,
      maxCurveRate:curve?2.35:0
    });
  }
  update(dt){
    this.life-=dt;
    this.age+=dt;
    if(this.kind==='spread'&&this.age>this.spreadLife){this.life=0;return;}

    // 回転弾は発射直後だけ緩く曲がる。
    // 一度外れた弾が大回りして戻ってくるような追尾はさせない。
    if(this.curve && this.target && this.target.alive && this.age < this.curveTime){
      const desired=norm(this.target.x-this.x,this.target.y-this.y);

      // current angle / desired angle
      const curA=Math.atan2(this.dy,this.dx);
      const desA=Math.atan2(desired.y,desired.x);
      let diff=desA-curA;
      while(diff>Math.PI)diff-=Math.PI*2;
      while(diff<-Math.PI)diff+=Math.PI*2;

      const ageRatio=1-(this.age/this.curveTime);
      const maxTurn=this.maxCurveRate*(0.55+0.45*ageRatio)*dt;
      const turn=clamp(diff,-maxTurn,maxTurn);
      const nextA=curA+turn;
      this.dx=Math.cos(nextA);
      this.dy=Math.sin(nextA);
    }

    if(this.kind==='spread'&&this.age>.62){const back=norm(this.originX-this.x,this.originY-this.y),k=Math.min(1,dt*3.2);this.dx=this.dx*(1-k)+back.x*k;this.dy=this.dy*(1-k)+back.y*k;const q=norm(this.dx,this.dy);this.dx=q.x;this.dy=q.y;}else if(this.kind==='rightangle'&&this.phase2===0&&this.age>.72){const ox=this.dx,oy=this.dy,side=(this.target&&this.target.y>this.y)?1:-1;this.dx=-oy*side;this.dy=ox*side;this.phase2=1;}
    this.x+=this.dx*this.speed*dt;
    this.y+=this.dy*this.speed*dt;

    if(this.x<COURT.x||this.x>COURT.x+COURT.w||this.y<COURT.y||this.y>COURT.y+COURT.h){
      this.life=0;
      return;
    }

    for(const w of walls){
      if(!circleRect(this.x,this.y,this.r,w))continue;

      if(this.kind==='phase'){
        // 壁すり抜け弾：壁では消えない
        continue;
      }

      if(this.kind==='bounce' && this.bouncesLeft>0){
        // Determine the closest wall face and reflect from it.
        const left=Math.abs(this.x-w.x);
        const right=Math.abs(this.x-(w.x+w.w));
        const top=Math.abs(this.y-w.y);
        const bottom=Math.abs(this.y-(w.y+w.h));
        const m=Math.min(left,right,top,bottom);

        if(m===left || m===right)this.dx*=-1;
        else this.dy*=-1;

        this.bouncesLeft--;
        spark(this.x,this.y);

        // move slightly away so it doesn't collide with the same wall every frame
        this.x+=this.dx*(this.r+4);
        this.y+=this.dy*(this.r+4);
        break;
      }

      if(this.kind==='blast'){
        this.life=0;
        explodeAt(this.x,this.y,this.team,this.blastRadius);
        return;
      }
      this.life=0;
      spark(this.x,this.y);
      return;
    }

    for(const mf of miniFrogs){if(mf.dead||mf.team===this.team)continue;if(Math.hypot(this.x-mf.x,this.y-mf.y)<this.r+mf.r){this.life=0;mf.dead=true;spark(mf.x,mf.y);return;}}
    const targets=this.team==='blue'?enemies:[player,...allies];
    if(this.kind==='blast'){
      for(const u of targets){
        if(u&&u.alive&&Math.hypot(this.x-u.x,this.y-u.y)<this.r+u.r){
          this.life=0;explodeAt(this.x,this.y,this.team,this.blastRadius);return;
        }
      }
    }
    for(const u of targets){
      if(u&&u.alive&&!u.moleActive&&u.cloneT>0&&u.cloneBody&&u.inv<=0&&Math.hypot(this.x-u.cloneBody.x,this.y-u.cloneBody.y)<this.r+u.r){
        const wasControlled=u.controlled;
        u.cloneT=0;u.cloneBody=null;u.alive=false;
        this.life=0;spark(this.x,this.y);
        if(wasControlled){flash('本体 OUT!',450);transferControl();}
        else flash(u.team==='red'?'ENEMY本体 OUT':'ALLY本体 OUT',620);
        checkEnd();return;
      }
      if(u&&u.alive&&!u.moleActive&&u.inv<=0&&u.jumpT<=0&&Math.hypot(this.x-u.x,this.y-u.y)<this.r+u.r){
        if(mode==='boss'&&u.team==='red'){this.life=0;spark(u.x,u.y);bossTakeHit('bullet');return}
        if(u.cloneT>0&&u.cloneBody){this.life=0;spark(u.x,u.y);endClone(u,true);return}
        if(u.shield>0){u.shield=0;this.life=0;spark(u.x,u.y);flash('SHIELD!',350);return}
        const wasControlled=u.controlled;
        if(mode==='boss'&&u.team==='blue'&&bossBattle&&bossBattle.revives>0){
          bossBattle.revives--;this.life=0;spark(u.x,u.y);u.inv=1.2;u.x=COURT.x+70;u.y=CY+(([player,...allies].indexOf(u))-1)*75;flash(`クリスタル復活！　残り ${bossBattle.revives}`,650);return;
        }
        u.alive=false;
        this.life=0;
        spark(u.x,u.y);
        if(wasControlled){
          flash('OUT!',420);
          transferControl();
        }else{
          flash(u.team==='red'?'ENEMY OUT':'ALLY OUT',650);
        }
        checkEnd();
        return;
      }
    }
  }
}

function circleRect(x,y,r,w){const cx=clamp(x,w.x,w.x+w.w),cy=clamp(y,w.y,w.y+w.h);return Math.hypot(x-cx,y-cy)<r}
function canStand(x,y,r){if(x<COURT.x+r||x>COURT.x+COURT.w-r||y<COURT.y+r||y>COURT.y+COURT.h-r)return false;return !walls.some(w=>circleRect(x,y,r,w))}
function move(u,x,y,dt){if(!u.alive)return;const s=u.speed*(u.moleActive?1.18:(u.beastActive?2.05:(u.rabbitActive?1.22:(u.dodgeT>0?2.25:1)))),nx=u.x+x*s*dt,ny=u.y+y*s*dt;if(u.jumpT>0||u.moleActive){u.x=clamp(nx,COURT.x+u.r,COURT.x+COURT.w-u.r);u.y=clamp(ny,COURT.y+u.r,COURT.y+COURT.h-u.r);return}if(canStand(nx,u.y,u.r))u.x=nx;if(canStand(u.x,ny,u.r))u.y=ny}
function nearest(u,arr){let best=null,bd=1e9;for(const v of arr){if(!v||!v.alive||v.invisT>0)continue;const d=dist(u,v);if(d<bd){bd=d;best=v}}return best}

function useShield(u,playerUse=false){
  if(!u||!u.alive)return false;
  const now=performance.now()/1000;
  if(now-u.lastShield<5.2)return false;

  if(playerUse){
    const cost=30;
    if(!u.fairyActive&&u.mana<cost){flash('魔力不足',400);return false}
    if(!u.fairyActive)u.mana-=cost;
  }

  u.lastShield=now;
  u.shield=3;
  return true;
}

function shoot(u,target,curve=false){if(u.moleActive)return false;
  if(!u||!u.alive||!target||!target.alive||u.dodgeT>0||u.dodgeRecover>0||u.beastActive||u.rabbitActive)return;
  if(u.fairyActive)curve=true;
  const cost=curve?16:11,now=performance.now()/1000;
  if(u.mana<cost||now-u.lastShot<u.shotCd)return;
  u.lastShot=now;if(!u.fairyActive)u.mana-=cost;
  const direct=norm(target.x-u.x,target.y-u.y);
  let dx=direct.x,dy=direct.y;
  if(curve){
    u.curveSide*=-1;
    const side=(Math.abs(target.y-u.y)>20?(target.y>u.y?-1:1):u.curveSide);

    // 初速は少しだけ横へ振る。大きく外へ投げすぎない。
    const bend=.70;
    const q=norm(
      direct.x+(-direct.y)*bend*side,
      direct.y+( direct.x)*bend*side
    );
    dx=q.x;dy=q.y;
  }
  bullets.push(new Bullet(u.x+dx*23,u.y+dy*23,dx,dy,u.team,curve,target));
}


function startNoSkillCup(){
  noSkillCup=true;
  document.body.classList.add('noSkillCupMode');
  mode='cup';
  cupKind='noskill';
  cupIndex=0;
  cupTable=null;
  currentOpponent='rush';
  bScore=0;rScore=0;round=1;
  $('menu')?.classList.add('hidden');
  $('cupPanel')?.classList.add('hidden');
  reset();
  flash('特殊スキル無し大会！　通常弾と回避だけで勝負',1000);
}


function applyPermanentTeamItems(){
  const units=[player,...allies].filter(Boolean);
  for(const u of units){
    // Absolute base-derived values: re-entering a match can never stack these bonuses.
    const controlledBase=u.controlled?190:158;
    u.speed=controlledBase*(saveData.speedBootsUnlocked?1.12:1);
    u.maxMana=saveData.maxManaRelicUnlocked?125:100;
    u.manaRegen=saveData.manaRegenRelicUnlocked?10:8;
    u.mana=Math.min(u.maxMana,Math.max(u.mana,u.maxMana));
  }
}

function reset(){
  if(noSkillCup&&mode==='cup'){
    const ns=['rush','guard','shoot'];
    currentOpponent=ns[cupIndex%ns.length];
  }
  if(mode!=='menu')setScreenMode('game');
  if(mode!=='boss')setBossStage(null);
  if(mode==='cup'&&currentOpponent)markEncountered(cupKind,currentOpponent);
  bullets=[];fx=[];mines=[];lobShots=[];windZones=[];miniFrogs=[];left=60;secAcc=0;over=false;running=true;
  player=new Unit(300,360,'blue',true);
  const allyRole1=saveData.allyRole1||$('roleA').value||'support';
  const allyRole2=saveData.allyRole2||$('roleB').value||'guard';
  if($('roleA'))$('roleA').value=allyRole1;
  if($('roleB'))$('roleB').value=allyRole2;
  allies=[
    new Unit(280,235,'blue',false,allyRole1),
    new Unit(280,485,'blue',false,allyRole2)
  ];
  if(saveData.playerTeamStyle==='frog'&&saveData.frogTeamUnlocked){
    for(const f of [player,...allies]){
      f.frogMage=true;f.frogActive=true;f.mana=100;f.shotCd=.55;f.specialKind='frogmage';
    }
  }
  if(allies[0]){
    allies[0].specialA=saveData.ally1SkillA||'none';
    allies[0].specialB=saveData.ally1SkillB||'none';
  }
  if(allies[1]){
    allies[1].specialA=saveData.ally2SkillA||'none';
    allies[1].specialB=saveData.ally2SkillB||'none';
  }
  applyPermanentTeamItems();
  const od=opponentData(currentOpponent),roles=od.roles;
  enemies=[
    new Unit(995,220,'red',false,roles[0]),
    new Unit(1015,360,'red',false,roles[1]),
    new Unit(995,500,'red',false,roles[2])
  ];
  for(const e of enemies)e.outfitKey=`${cupKind}:${currentOpponent}`;
  if(noSkillCup&&mode==='cup'){
    for(const e of enemies){
      e.specialKind=null;
      e.rabbitActive=false;e.beastActive=false;e.moleActive=false;e.fairyActive=false;e.frogActive=false;
      e.frogMage=false;
    }
  }
  if(od.frogMageUsers)for(const i of od.frogMageUsers)if(enemies[i]){enemies[i].frogMage=true;enemies[i].frogActive=true;enemies[i].specialKind='frogmage';enemies[i].shotCd=.55;enemies[i].mana=100;}
  if(cupKind==='rookie'&&od.shieldUsers)for(const i of od.shieldUsers)if(enemies[i])enemies[i].specialKind='shield';
  if(cupKind==='rookie'&&od.tripleUsers)for(const i of od.tripleUsers)if(enemies[i])enemies[i].specialKind='triple';
  if(cupKind==='rookie'&&od.bladeUsers)for(const i of od.bladeUsers)if(enemies[i])enemies[i].specialKind='blade';
  if(cupKind==='advanced'&&od.phaseUsers)for(const i of od.phaseUsers)if(enemies[i])enemies[i].specialKind='phase';
  if((cupKind==='advanced'||cupKind==='expert')&&od.bounceUsers)for(const i of od.bounceUsers)if(enemies[i])enemies[i].specialKind='bounce';
  if((cupKind==='advanced'||cupKind==='expert')&&od.blastUsers)for(const i of od.blastUsers)if(enemies[i])enemies[i].specialKind='blast';
  if(cupKind==='expert'&&od.beastUsers)for(const i of od.beastUsers)if(enemies[i])enemies[i].specialKind='beast';
  if(cupKind==='master'&&od.invisUsers)for(const i of od.invisUsers)if(enemies[i])enemies[i].specialKind='invis';
  if(cupKind==='master'&&od.spreadUsers)for(const i of od.spreadUsers)if(enemies[i])enemies[i].specialKind='spread';
  if(cupKind==='master'&&od.rightAngleUsers)for(const i of od.rightAngleUsers)if(enemies[i])enemies[i].specialKind='rightangle';
  if(cupKind==='master'&&od.lobUsers)for(const i of od.lobUsers)if(enemies[i])enemies[i].specialKind='lob';
  if(cupKind==='master'&&od.mineUsers)for(const i of od.mineUsers)if(enemies[i])enemies[i].specialKind='mine';
  if(cupKind==='master'&&od.jumpUsers)for(const i of od.jumpUsers)if(enemies[i])enemies[i].specialKind='jump';
  if(cupKind==='grandmaster'&&od.cloneUsers)for(const i of od.cloneUsers)if(enemies[i])enemies[i].specialKind='clone';
  if(cupKind==='grandmaster'&&od.reflectBladeUsers)for(const i of od.reflectBladeUsers)if(enemies[i])enemies[i].specialKind='reflectblade';
  if(cupKind==='grandmaster'&&od.windUsers)for(const i of od.windUsers)if(enemies[i])enemies[i].specialKind='wind';
  if(cupKind==='grandmaster'&&od.moleUsers)for(const i of od.moleUsers)if(enemies[i])enemies[i].specialKind='mole';

  // v2.82: 試合生成の最後に使用チームを再適用。
  if(saveData.playerTeamStyle==='frog'&&saveData.frogTeamUnlocked){
    for(const f of [player,...allies]){
      if(!f)continue;
      f.frogMage=true;f.frogActive=true;f.fairyActive=false;f.rabbitActive=false;f.beastActive=false;f.moleActive=false;
      f.specialKind='frogmage';f.outfitKey=null;f.mana=100;f.shotCd=.55;
    }
  }

  clock.textContent='1:00';
  roundLabel.textContent='ROUND '+round;
  flash(opponentData(currentOpponent).name,900);
}

function cpuTripleShot(u){
  if(!u||!u.alive)return;
  const targets=u.team==='red'?[player,...allies]:enemies;
  const fire=()=>{if(!u.alive)return;const t=nearest(u,targets);if(!t)return;const d=norm(t.x-u.x,t.y-u.y);bullets.push(new Bullet(u.x+d.x*23,u.y+d.y*23,d.x,d.y,u.team,false,t));};
  fire();setTimeout(fire,145);setTimeout(fire,290);
}


function cpuPhaseShot(u){
  if(!u||!u.alive)return;
  const targets=u.team==='red'?[player,...allies]:enemies;
  const t=nearest(u,targets);if(!t)return;
  const d=norm(t.x-u.x,t.y-u.y);
  bullets.push(new Bullet(u.x+d.x*23,u.y+d.y*23,d.x,d.y,u.team,false,t,'phase'));
}
function cpuBounceShot(u){
  if(!u||!u.alive)return;
  const targets=u.team==='red'?[player,...allies]:enemies;
  const t=nearest(u,targets);if(!t)return;
  const d0=norm(t.x-u.x,t.y-u.y);
  const side=Math.random()<.5?-1:1;
  const d=norm(d0.x-d0.y*.28*side,d0.y+d0.x*.28*side);
  bullets.push(new Bullet(u.x+d.x*23,u.y+d.y*23,d.x,d.y,u.team,false,t,'bounce'));
}

function cpuBlastShot(u){
  if(!u||!u.alive)return;
  const targets=u.team==='red'?[player,...allies]:enemies;
  const t=nearest(u,targets);if(!t)return;
  const d=norm(t.x-u.x,t.y-u.y);
  bullets.push(new Bullet(u.x+d.x*23,u.y+d.y*23,d.x,d.y,u.team,false,t,'blast'));
}

function cpuSpread(u){
  const t=nearest(u,u.team==='red'?[player,...allies]:enemies);
  if(!t)return;
  const d0=norm(t.x-u.x,t.y-u.y),base=Math.atan2(d0.y,d0.x);
  for(const off of [-.30,-.15,0,.15,.30]){
    const a=base+off,dx=Math.cos(a),dy=Math.sin(a);
    bullets.push(new Bullet(u.x+dx*23,u.y+dy*23,dx,dy,u.team,false,t,'spread'));
  }
}
function cpuRightAngle(u){const t=nearest(u,u.team==='red'?[player,...allies]:enemies);if(!t)return;const d=norm(t.x-u.x,t.y-u.y);bullets.push(new Bullet(u.x+d.x*23,u.y+d.y*23,d.x,d.y,u.team,false,t,'rightangle'));}

function allySpecialReady(u,kind){
  const now=performance.now()/1000;
  if(kind==='double')return u.mana>=26&&now-u.lastDouble>=.65;
  if(kind==='rabbit')return u.mana>=8&&!u.rabbitActive&&now-u.lastRabbit>=.6;
  if(kind==='blade')return u.mana>=18&&now-u.lastBlade>=.75;
  if(kind==='triple')return u.mana>=38&&now-u.lastTriple>=.90;
  if(kind==='phase')return u.mana>=24&&now-u.lastPhase>=.55;
  if(kind==='bounce')return u.mana>=22&&now-u.lastBounce>=.55;
  if(kind==='blast')return u.mana>=30&&now-u.lastBlast>=.70;
  if(kind==='beast')return u.mana>=10;
  if(kind==='invis')return u.mana>=28&&u.invisT<=0&&now-u.lastInvis>=1;
  if(kind==='spread')return u.mana>=26&&now-u.lastSpread>=.65;
  if(kind==='rightangle')return u.mana>=23&&now-u.lastRightAngle>=.65;
  if(kind==='lob')return u.mana>=32&&now-u.lastLob>=.8;
  if(kind==='mine')return u.mana>=20&&now-u.lastMine>=.55;
  if(kind==='jump')return u.mana>=20&&u.jumpT<=0&&now-u.lastJump>=.85;
  if(kind==='clone')return u.mana>=50&&u.cloneT<=0&&now-u.lastClone>=.9;
  if(kind==='reflectblade')return u.mana>=24&&now-u.lastReflectBlade>=.8;
  if(kind==='wind')return u.mana>=32&&now-u.lastWind>=1.0;
  if(kind==='mole')return u.mana>=40&&!u.moleActive&&now-u.lastMole>=1.0;
  if(kind==='shield')return u.mana>=30&&u.shield<=0&&now-u.lastShield>=5.2;
  return false;
}
function allyUseSpecial(u,kind){
  if(!allySpecialReady(u,kind))return false;
  if(kind==='double')return useDoubleShot(u);
  if(kind==='rabbit')return toggleRabbit(u);
  if(kind==='blade')return useManaBlade(u);
  if(kind==='triple')return useTripleShot(u);
  if(kind==='phase')return usePhaseShot(u);
  if(kind==='bounce')return useBounceShot(u);
  if(kind==='blast')return useBlastShot(u);
  if(kind==='beast')return toggleBeast(u);
  if(kind==='invis')return useInvis(u);
  if(kind==='spread')return useSpread(u);
  if(kind==='rightangle')return useRightAngle(u);
  if(kind==='lob')return useLob(u);
  if(kind==='mine')return useMine(u);
  if(kind==='jump')return useJump(u);
  if(kind==='clone')return useClone(u);
  if(kind==='reflectblade')return useReflectBlade(u);
  if(kind==='wind')return useWind(u);
  if(kind==='mole')return toggleMole(u);
  if(kind==='shield')return useShield(u,true);
  return false;
}

function ai(u,dt,isEnemy){
  if(!u.alive)return;
  if(u.bossKind==='manadeer'){
    const targets=[player,...allies].filter(v=>v&&v.alive);
    if(!targets.length)return;
    const t=nearest(u,targets),to=norm(t.x-u.x,t.y-u.y);
    const side=u.strafeDir||1;
    const desired=dist(u,t)<250
      ?norm(-to.x+(-to.y)*side*.7,-to.y+(to.x)*side*.7)
      :norm(to.x*.25+(-to.y)*side,to.y*.25+(to.x)*side);
    move(u,desired.x,desired.y,dt);
    if(Math.random()<.012)u.strafeDir*=-1;
    return;
  }
  if(u.bossKind==='silverwolf'){
    const targets=[player,...allies].filter(v=>v&&v.alive);
    if(!targets.length)return;
    const t=nearest(u,targets);
    const now=performance.now()/1000;

    // Save a short trail every ~0.055s to make the speed readable as afterimages.
    if(now-(u.lastAfterimageAt||0)>.055){
      u.lastAfterimageAt=now;
      u.afterimages=u.afterimages||[];
      u.afterimages.unshift({x:u.x,y:u.y,a:.38});
      if(u.afterimages.length>6)u.afterimages.length=6;
    }
    for(const q of (u.afterimages||[]))q.a=Math.max(0,q.a-dt*.8);

    // Orbit and slash past the nearest target rather than running straight into the crystal.
    const to=norm(t.x-u.x,t.y-u.y);
    const side=u.strafeDir||1;
    let nx=to.x*.52+(-to.y)*side*.92;
    let ny=to.y*.52+( to.x)*side*.92;
    const n=norm(nx,ny);
    move(u,n.x,n.y,dt);
    if(Math.random()<.018)u.strafeDir*=-1;
    return;
  }
  u.think-=dt;
  if(u.think<=0){u.think=.16+Math.random()*.18;u.target=nearest(u,isEnemy?[player,...allies]:enemies)}
  const t=u.target,enemyFlag=isEnemy?flagBlue:flagRed,ownFlag=isEnemy?flagRed:flagBlue;
  let tx=u.x,ty=u.y;

  if(u.role==='attacker'){
    if(t&&dist(u,t)<135){
      // very close: dodge sideways/back away a little
      const away=norm(u.x-t.x,u.y-t.y);
      tx=u.x+away.x*70+(-away.y)*u.strafeDir*55;
      ty=u.y+away.y*70+( away.x)*u.strafeDir*55;
    }else{
      const passedMid=isEnemy?u.x<690:u.x>590;
      if(!passedMid){
        // aggressive advance via a lane rather than a full-speed beeline
        tx=isEnemy?735:545;
        ty=u.y<CY?230:470;
      }else{
        // once over midfield, make a real flag attempt
        tx=enemyFlag.x+(isEnemy?65:-65);
        ty=enemyFlag.y + u.strafeDir*35;
      }
    }
  }
  else if(u.role==='guard'){
    if(t&&dist(u,t)<260){tx=t.x;ty=t.y}else{tx=ownFlag.x+(isEnemy?-85:85);ty=ownFlag.y}
  }else if(u.role==='support'&&!isEnemy&&player&&player.alive){tx=player.x+70;ty=player.y}
  else if(u.role==='shooter'&&t){
    const d=dist(u,t);
    if(d<220){
      // back away but also move sideways
      const away=norm(u.x-t.x,u.y-t.y);
      tx=u.x+away.x*90 + (-away.y)*u.strafeDir*70;
      ty=u.y+away.y*90 + ( away.x)*u.strafeDir*70;
    }else if(d>430){
      // close distance diagonally rather than straight in
      const to=norm(t.x-u.x,t.y-u.y);
      tx=u.x+to.x*100 + (-to.y)*u.strafeDir*55;
      ty=u.y+to.y*100 + ( to.x)*u.strafeDir*55;
    }else{
      // preferred firing range: keep moving laterally
      const to=norm(t.x-u.x,t.y-u.y);
      tx=u.x+(-to.y)*u.strafeDir*95;
      ty=u.y+( to.x)*u.strafeDir*95;
    }
  }else if(u.role==='guard'){
    if(t&&dist(u,t)<260){
      const to=norm(t.x-u.x,t.y-u.y);
      tx=u.x+(-to.y)*u.strafeDir*70;
      ty=u.y+( to.x)*u.strafeDir*70;
    }else{
      tx=ownFlag.x+(isEnemy?-85:85);
      ty=ownFlag.y + u.strafeDir*75;
    }
  }else if(t){
    const to=norm(t.x-u.x,t.y-u.y);
    tx=t.x + (-to.y)*u.strafeDir*35;
    ty=t.y + ( to.x)*u.strafeDir*35;
  }

  let n=norm(tx-u.x,ty-u.y);
  if(u.jumpT<=0&&walls.some(w=>circleRect(u.x+n.x*30,u.y+n.y*30,u.r,w)))n={x:-n.y,y:n.x};

  if(u.specialKind==='triple'){
    const nowTriple=performance.now()/1000;
    if(u.tripleReady>=0){u.tripleReady-=dt;if(u.tripleReady<=0){cpuTripleShot(u);u.lastTriple=nowTriple;u.tripleReady=-1;flash('3連射！',320);}}
    else if(nowTriple-u.lastTriple>6.2){
      const targets=u.team==='red'?[player,...allies]:enemies,tgt=nearest(u,targets);
      if(tgt&&Math.hypot(tgt.x-u.x,tgt.y-u.y)<520&&Math.random()<.018)u.tripleReady=.62;
    }
  }
    const nowSpecial=performance.now()/1000;
  if(u.specialKind==='blade'&&nowSpecial-u.lastBlade>.85&&u.mana>=18){
    const incoming=bullets.some(b=>b.team!==u.team&&Math.hypot(b.x-u.x,b.y-u.y)<96);
    if(incoming&&Math.random()<.22)useManaBlade(u);
  }


  if(u.specialKind==='clone'&&u.cloneT<=0&&nowSpecial-u.lastClone>5.8&&u.mana>=50&&Math.random()<.005){
    useClone(u);
  }
  if(u.specialKind==='reflectblade'&&nowSpecial-u.lastReflectBlade>.9&&u.mana>=24){
    const incoming=bullets.some(b=>b.team!==u.team&&Math.hypot(b.x-u.x,b.y-u.y)<105);
    if(incoming&&Math.random()<.20)useReflectBlade(u);
  }
  if(u.specialKind==='wind'&&nowSpecial-u.lastWind>5.0&&u.mana>=32&&Math.random()<.0045){useWind(u);}
  if(u.specialKind==='mole'&&!u.moleActive&&nowSpecial-u.lastMole>5.5&&u.mana>=45&&Math.random()<.0045){toggleMole(u);}


  if(!isEnemy){
    const allyChoices=[u.specialA,u.specialB].filter(k=>k&&k!=='none');
    if(allyChoices.length&&Math.random()<.006){
      const first=allyChoices[Math.floor(Math.random()*allyChoices.length)];
      if(!allyUseSpecial(u,first)&&allyChoices.length>1){
        const second=allyChoices.find(k=>k!==first);
        if(second)allyUseSpecial(u,second);
      }
    }
  }



  if(u.specialKind==='invis'&&u.invisT<=0&&nowSpecial-u.lastInvis>5.5&&Math.random()<.006){u.lastInvis=nowSpecial;u.invisT=2.6;}
  if(u.specialKind==='spread'&&nowSpecial-u.lastSpread>2.8&&Math.random()<.006){const t=nearest(u,u.team==='red'?[player,...allies]:enemies);if(t&&dist(u,t)<240){u.lastSpread=nowSpecial;cpuSpread(u);}}
  if(u.specialKind==='rightangle'&&nowSpecial-u.lastRightAngle>3.3&&Math.random()<.0055){u.lastRightAngle=nowSpecial;cpuRightAngle(u);}
  if(u.specialKind==='lob'&&nowSpecial-u.lastLob>3.8&&Math.random()<.0065){const q=nearest(u,u.team==='red'?[player,...allies]:enemies);if(q){u.lastLob=nowSpecial;createLob(u,q,u.team);}}
  if(u.specialKind==='mine'&&nowSpecial-u.lastMine>3&&Math.random()<.007){if(placeMine(u))u.lastMine=nowSpecial;}
  if(u.specialKind==='blast'&&nowSpecial-u.lastBlast>5.5&&Math.random()<.010){
    const targets=u.team==='red'?[player,...allies]:enemies,t=nearest(u,targets);
    if(t&&dist(u,t)<520){u.lastBlast=nowSpecial;cpuBlastShot(u);flash('爆裂弾！',260);}
  }
  if(u.specialKind==='beast'){
    if(!u.beastActive&&nowSpecial-u.lastBeast>7.2&&Math.random()<.006){
      u.lastBeast=nowSpecial;u.beastActive=true;u.beastT=3.8;flash('オオカミ化！',260);
    }
  }
  if(u.specialKind==='phase' && nowSpecial-u.lastPhase>5.0 && Math.random()<.010){
    const targets=u.team==='red'?[player,...allies]:enemies;
    const t=nearest(u,targets);
    if(t&&dist(u,t)<560){u.lastPhase=nowSpecial;cpuPhaseShot(u);flash('壁すり抜け弾！',260);}
  }
  if(u.specialKind==='bounce' && nowSpecial-u.lastBounce>4.6 && Math.random()<.011){
    const targets=u.team==='red'?[player,...allies]:enemies;
    const t=nearest(u,targets);
    if(t&&dist(u,t)<560){u.lastBounce=nowSpecial;cpuBounceShot(u);flash('バウンド弾！',260);}
  }
const danger=bullets.find(b=>b.team!==u.team&&Math.hypot(b.x-u.x,b.y-u.y)<125);
  if(u.frogMage){const tgt=nearest(u,u.team==='red'?[player,...allies]:enemies);if(tgt&&dist(u,tgt)<155&&nowSpecial-u.lastFrogTongue>1.7&&Math.random()<.05)useFrogTongue(u);if(nowSpecial-u.lastMiniFrog>4.2&&Math.random()<.012)launchMiniFrog(u);if(danger&&u.jumpT<=0&&nowSpecial-u.lastFrogJump>2.2&&Math.random()<.18){u.lastFrogJump=nowSpecial;u.jumpT=1.55;u.inv=Math.max(u.inv,1.35);}}
  if(u.specialKind==='jump'&&u.jumpT<=0&&nowSpecial-u.lastJump>3.0&&danger&&Math.random()<.16){u.lastJump=nowSpecial;u.jumpT=.78;u.inv=Math.max(u.inv,.78);}

  // シールドAIは弾を見て即発動しない。
  // 認識してから0.25〜0.45秒ほど反応が遅れるため、近距離では間に合わないことがある。
  if(u.specialKind==='shield'&&u.shield<=0){
    const nowShield=performance.now()/1000;
    const ready=nowShield-u.lastShield>=5.2;

    if(danger&&ready){
      if(u.shieldReact<0){
        u.shieldReact=.25+Math.random()*.20;
      }else{
        u.shieldReact-=dt;
        if(u.shieldReact<=0){
          useShield(u);
          u.shieldReact=-1;
        }
      }
    }else{
      u.shieldReact=-1;
    }
  }else{
    u.shieldReact=-1;
  }
  const now=performance.now()/1000;
  if(danger&&now-u.lastDodge>1.9&&Math.random()<.08){
    u.lastDodge=now;u.dodgeT=.32;u.inv=.23;
    n={x:-danger.dy,y:danger.dx};
    // AIも前方への回避は禁止。敵は左が前、味方は右が前。
    if((isEnemy&&n.x<0)||(!isEnemy&&n.x>0)){
      if(Math.abs(n.y)>=.15)n={x:0,y:n.y>0?1:-1};
      else n={x:isEnemy?1:-1,y:0};
    }
  }

  if(u.dodgeT>0){
    // red attacks left, blue attacks right: strip any forward component.
    if(isEnemy)n.x=Math.max(0,n.x);
    else n.x=Math.min(0,n.x);
  }
  if(u.specialKind==='triple'&&u.tripleReady>=0)n={x:0,y:0};
  move(u,n.x,n.y,dt);
  if(t&&dist(u,t)<540){
    const chance=u.role==='shooter'?.42:(u.role==='attacker'?.16:.22);
    if(u.frogMage)shootBubble(u,t);else shoot(u,t,Math.random()<chance);
  }
}

function checkFlags(){
  if(mode==='boss')return;
  for(const u of [player,...allies])if(u&&u.alive&&!u.beastActive&&u.jumpT<=0&&dist(u,flagRed)<u.r+22)return finish('blue','敵クリスタルを取りました！');
  for(const u of enemies)if(u.alive&&!u.beastActive&&u.jumpT<=0&&dist(u,flagBlue)<u.r+22)return finish('red','敵にクリスタルを取られました');
  if(player&&player.alive&&dist(player,flagBlue)<45)player.mana=Math.min(player.maxMana,player.mana+36/60);
}

function transferControl(){
  if(!player || player.alive)return false;
  const idx=allies.findIndex(a=>a&&a.alive);
  if(idx<0)return false;

  const oldPlayer=player;
  const next=allies.splice(idx,1)[0];

  oldPlayer.controlled=false;
  allies.push(oldPlayer);

  next.controlled=true;
  next.speed=190*(saveData.speedBootsUnlocked?1.12:1);
  next.maxMana=saveData.maxManaRelicUnlocked?125:100;
  next.manaRegen=saveData.manaRegenRelicUnlocked?10:8;
  next.mana=Math.min(next.maxMana,next.mana);
  player=next;

  // avoid inheriting an AI dodge/shoot decision at the exact moment of takeover
  player.dodgeT=0;
  player.inv=Math.max(player.inv,.20);
  player.dodgeRecover=.15;
  input.x=0; input.y=0;

  flash('操作交代！',900);
  return true;
}

function checkEnd(){
  if(mode==='boss'){if([player,...allies].every(e=>!e.alive)){running=false;over=true;setTimeout(()=>{showWorldMap();flash('ボス戦敗北。再挑戦できます',1100)},300)}return;}
  if(enemies.length===3&&enemies.every(e=>!e.alive))finish('blue','敵3人を全員アウト！');
  else if([player,...allies].every(e=>!e.alive))finish('red','味方が全員アウト');
}
function finish(team,text){
  if(over)return;over=true;running=false;
  if(team==='blue')bScore++;else rScore++;
  score.textContent=`${bScore} - ${rScore}`;
  setTimeout(()=>{
    const match=bScore>=2||rScore>=2;
    $('resultTitle').textContent=match?(bScore>rScore?'MATCH WIN!':'MATCH LOSE'):(team==='blue'?'ROUND WIN!':'ROUND LOSE');
    $('resultText').textContent=text;
    $('nextBtn').textContent=match?(mode==='cup'?(noSkillCup?'次の試合へ':'大会表へ'):'メニューへ戻る'):'次のラウンド';
    $('result').classList.remove('hidden');
  },300);
}
function flash(t,ms=700){message.textContent=t;msgUntil=performance.now()+ms}
function spark(x,y){for(let i=0;i<8;i++)fx.push({x,y,vx:(Math.random()-.5)*150,vy:(Math.random()-.5)*150,t:.4})}

function update(dt){
  if(!running)return;
  secAcc+=dt;
  if(secAcc>=1){secAcc-=1;left--;clock.textContent='0:'+String(Math.max(0,left)).padStart(2,'0')}
  if(left<=0){
    if(mode==='boss'){
      running=false;over=true;
      setTimeout(()=>{showWorldMap();flash('時間切れ。ボスへ再挑戦できます',1100)},300);
      return;
    }
    const ba=[player,...allies].filter(u=>u&&u.alive).length,ra=enemies.filter(u=>u.alive).length;
    finish(ba>=ra?'blue':'red',`時間切れ 生存 ${ba} - ${ra}`);return;
  }

  player.update(dt);
  let ix=input.x+(keys.ArrowRight||keys.d?1:0)-(keys.ArrowLeft||keys.a?1:0);
  let iy=input.y+(keys.ArrowDown||keys.s?1:0)-(keys.ArrowUp||keys.w?1:0);
  if(Math.hypot(ix,iy)>1){const n=norm(ix,iy);ix=n.x;iy=n.y}
  if(player.dodgeT>0){
    ix=Math.min(0,player.dx); // hard lock: dodge can never advance toward enemy court
    iy=player.dy;
  }
  move(player,ix,iy,dt);

  for(const a of allies){a.update(dt);if(!a.controlled)ai(a,dt,false)}
  for(const e of enemies){e.update(dt);ai(e,dt,true)}
  for(const b of bullets)b.update(dt);
  updateMiniFrogs(dt);
  updateLobs(dt);updateMines(dt);
  updateWindZones(dt);

  for(let i=0;i<bullets.length;i++){
    const a=bullets[i];if(a.life<=0)continue;
    for(let j=i+1;j<bullets.length;j++){
      const b=bullets[j];if(b.life<=0||a.team===b.team)continue;
      if(Math.hypot(a.x-b.x,a.y-b.y)<a.r+b.r+2){
        if(a.kind==='bubble'&&b.kind!=='bubble'){a.life=0;b.team=a.team;b.dx*=-1;b.dy*=-1;b.curve=false;b.target=nearest({x:b.x,y:b.y},b.team==='blue'?enemies:[player,...allies]);b.life=Math.max(b.life,1.35);spark((a.x+b.x)/2,(a.y+b.y)/2);break;}
        if(b.kind==='bubble'&&a.kind!=='bubble'){b.life=0;a.team=b.team;a.dx*=-1;a.dy*=-1;a.curve=false;a.target=nearest({x:a.x,y:a.y},a.team==='blue'?enemies:[player,...allies]);a.life=Math.max(a.life,1.35);spark((a.x+b.x)/2,(a.y+b.y)/2);continue;}
        a.life=0;b.life=0;spark((a.x+b.x)/2,(a.y+b.y)/2);break;
      }
    }
  }
  bullets=bullets.filter(b=>b.life>0);

  for(const p of fx){p.x+=p.vx*dt;p.y+=p.vy*dt;p.t-=dt}
  fx=fx.filter(p=>p.t>0);
  checkFlags();
  manaFill.style.width=(player.mana/player.maxMana*100)+'%';
  if(msgUntil&&performance.now()>msgUntil){message.textContent='';msgUntil=0}
}

function rr(x,y,w,h,r){r=Math.min(r,w/2,h/2);g.beginPath();g.moveTo(x+r,y);g.lineTo(x+w-r,y);g.quadraticCurveTo(x+w,y,x+w,y+r);g.lineTo(x+w,y+h-r);g.quadraticCurveTo(x+w,y+h,x+w-r,y+h);g.lineTo(x+r,y+h);g.quadraticCurveTo(x,y+h,x,y+h-r);g.lineTo(x,y+r);g.quadraticCurveTo(x,y,x+r,y);g.closePath();g.fill()}
function drawFlag(f,team){g.save();g.translate(f.x,f.y);const col=team==='blue'?'#86c7ff':'#ff9aa8',glow=team==='blue'?'#cfeaff':'#ffd6dc',t=performance.now()/1000;g.save();g.rotate(t*.35*(team==='blue'?1:-1));g.strokeStyle=col;g.lineWidth=2;g.globalAlpha=.55;g.beginPath();g.arc(0,10,27,0,Math.PI*2);g.stroke();g.beginPath();g.arc(0,10,18,0,Math.PI*2);g.stroke();g.restore();const bob=Math.sin(t*3+f.x*.01)*3;g.translate(0,-8+bob);g.shadowBlur=18;g.shadowColor=col;g.fillStyle=glow;g.beginPath();g.moveTo(0,-25);g.lineTo(13,-4);g.lineTo(0,22);g.lineTo(-13,-4);g.closePath();g.fill();g.strokeStyle=col;g.lineWidth=3;g.stroke();g.restore();}

function drawUnit(u){
  // v3.05: genuine frog mages never use human headwear/outfit head pieces.
  if(u&&u.frogMage)u.outfitKey=null;
  // v2.63: null/alive check MUST happen before any transformation state access.
  // player is null on the title/map screen, so the old order killed requestAnimationFrame.
  if(!u||!u.alive)return;

  if(u.moleActive){
    g.save();g.globalAlpha=.9;g.fillStyle='#5b4634';g.beginPath();g.ellipse(u.x,u.y+12,24,9,0,0,Math.PI*2);g.fill();
    g.strokeStyle='#c9a36e';g.lineWidth=3;g.beginPath();g.arc(u.x,u.y+10,16,0,Math.PI*2);g.stroke();
    g.fillStyle='#e6c49a';g.beginPath();g.arc(u.x,u.y+7,5,0,Math.PI*2);g.fill();g.restore();return;
  }
  g.save();g.translate(u.x,u.y);
  if(u.jumpT>0){
    if(u.frogActive){const total=1.85,p=Math.max(0,Math.min(1,1-u.jumpT/total));g.translate(0,-Math.sin(Math.PI*p)*165);}
    else if(u.fairyActive){const total=1.55,p=Math.max(0,Math.min(1,1-u.jumpT/total));const lift=Math.sin(Math.PI*Math.min(1,p*1.35))*78;g.translate(0,-Math.max(22,lift));}
    else{const jp=Math.sin(Math.PI*(1-u.jumpT/1.05));g.translate(0,-Math.max(0,jp)*105);}
  }
  if(u.invisT>0)g.globalAlpha=u.controlled?.38:.14;


  if(u.bossKind){
    const k=u.bossKind,t=performance.now()/220;g.save();g.scale(k==='fairy'?1.18:(k==='cave'?1.18:1.15),k==='fairy'?1.18:(k==='cave'?1.18:1.15));
    if(k==='frogking'){
      g.save();g.scale(1.55,1.55);g.fillStyle='#527f35';g.beginPath();g.ellipse(0,7,38,27,0,0,Math.PI*2);g.fill();
      g.fillStyle='#6ea94b';g.beginPath();g.arc(-20,-15,14,0,Math.PI*2);g.arc(20,-15,14,0,Math.PI*2);g.fill();
      g.fillStyle='#f5f3c7';g.beginPath();g.arc(-20,-16,7,0,Math.PI*2);g.arc(20,-16,7,0,Math.PI*2);g.fill();
      g.fillStyle='#172416';g.beginPath();g.arc(-20,-16,3,0,Math.PI*2);g.arc(20,-16,3,0,Math.PI*2);g.fill();
      g.fillStyle='#d4b957';g.beginPath();g.moveTo(-27,-29);g.lineTo(-14,-48);g.lineTo(0,-31);g.lineTo(15,-49);g.lineTo(28,-29);g.closePath();g.fill();
      g.strokeStyle='#355c2c';g.lineWidth=10;g.beginPath();g.moveTo(-28,20);g.lineTo(-49,38);g.moveTo(28,20);g.lineTo(49,38);g.stroke();g.restore();
    }else if(k==='silverwolf'){
      // afterimages are drawn relative to the current wolf position
      if(u.afterimages){
        for(let i=u.afterimages.length-1;i>=0;i--){
          const q=u.afterimages[i];if(q.a<=0)continue;
          g.save();g.translate(q.x-u.x,q.y-u.y);g.globalAlpha=q.a*(1-i/u.afterimages.length*.45);
          g.fillStyle='#9fd7e8';g.beginPath();g.ellipse(0,3,30,16,0,0,Math.PI*2);g.fill();
          g.beginPath();g.moveTo(15,-7);g.lineTo(23,-28);g.lineTo(29,-8);g.closePath();g.fill();
          g.beginPath();g.moveTo(-8,-8);g.lineTo(-18,-28);g.lineTo(1,-12);g.closePath();g.fill();
          g.restore();
        }
      }
      const grad=g.createLinearGradient(-30,-20,30,20);
      grad.addColorStop(0,'#84d8ef');grad.addColorStop(.55,'#c9e8ef');grad.addColorStop(1,'#8fa8b7');
      g.fillStyle=grad;g.beginPath();g.ellipse(0,3,31,17,0,0,Math.PI*2);g.fill();
      g.beginPath();g.moveTo(15,-7);g.lineTo(23,-29);g.lineTo(30,-8);g.closePath();g.fill();
      g.beginPath();g.moveTo(-8,-8);g.lineTo(-19,-29);g.lineTo(1,-12);g.closePath();g.fill();
      g.fillStyle='#eafcff';g.beginPath();g.arc(18,-7,3,0,Math.PI*2);g.fill();
      g.strokeStyle='#b9e9f4';g.lineWidth=4;for(let i=-1;i<=1;i++){g.beginPath();g.moveTo(-18+i*8,13);g.lineTo(-25+i*8+Math.sin(t+i)*6,27);g.stroke()}
    }else if(k==='managolem'){
      g.fillStyle='#536d88';g.beginPath();g.roundRect(-34,-26,68,58,10);g.fill();
      g.fillStyle='#7395ad';g.fillRect(-48,-12,14,38);g.fillRect(34,-12,14,38);
      g.fillStyle='#a9edff';g.beginPath();g.moveTo(-16,-25);g.lineTo(-5,-51);g.lineTo(2,-23);g.closePath();g.fill();
      g.beginPath();g.moveTo(8,-24);g.lineTo(20,-46);g.lineTo(27,-21);g.closePath();g.fill();
      g.fillStyle='#e4fbff';g.beginPath();g.arc(0,1,10+Math.sin(t)*2,0,Math.PI*2);g.fill();
      g.strokeStyle='#8bcce7';g.lineWidth=4;g.strokeRect(-26,-19,52,43);
    }else if(k==='manadeer'){
      g.fillStyle='#eef7ed';g.beginPath();g.ellipse(0,4,28,15,0,0,Math.PI*2);g.fill();
      g.beginPath();g.ellipse(20,-9,14,11,-.2,0,Math.PI*2);g.fill();
      g.strokeStyle='#d7efe2';g.lineWidth=5;g.beginPath();
      g.moveTo(-16,14);g.lineTo(-18,30);g.moveTo(2,15);g.lineTo(1,31);g.moveTo(15,10);g.lineTo(18,27);g.stroke();
      g.strokeStyle='#9ee8c5';g.lineWidth=3;g.beginPath();
      g.moveTo(24,-18);g.lineTo(30,-34);g.lineTo(35,-28);g.moveTo(19,-18);g.lineTo(15,-34);g.lineTo(10,-27);g.stroke();
      g.fillStyle='#58a58a';g.beginPath();g.arc(24,-10,2.5,0,Math.PI*2);g.fill();
      g.strokeStyle='#b8ffe1';g.lineWidth=2;g.beginPath();g.arc(0,2,39+Math.sin(t)*2,0,Math.PI*2);g.stroke();
    }else if(k==='forest'){
      g.fillStyle='#294f3c';g.beginPath();g.ellipse(0,3,30,17,0,0,Math.PI*2);g.fill();
      g.beginPath();g.moveTo(15,-7);g.lineTo(23,-28);g.lineTo(29,-8);g.closePath();g.fill();
      g.beginPath();g.moveTo(-8,-8);g.lineTo(-18,-28);g.lineTo(1,-12);g.closePath();g.fill();
      g.fillStyle='#b7ef82';g.beginPath();g.arc(18,-7,3,0,Math.PI*2);g.fill();
      g.strokeStyle='#72b55d';g.lineWidth=4;for(let i=-1;i<=1;i++){g.beginPath();g.moveTo(-18+i*8,13);g.lineTo(-21+i*8+Math.sin(t+i)*4,27);g.stroke()}
    }else if(k==='cave'){
      if(u.moleActive){
        g.fillStyle='#5a4534';g.beginPath();g.ellipse(0,13,42,14,0,0,Math.PI*2);g.fill();
        g.strokeStyle='#c59b6c';g.lineWidth=4;g.beginPath();g.arc(0,10,27,0,Math.PI*2);g.stroke();
        g.fillStyle='#a7eaff';g.beginPath();g.moveTo(-8,4);g.lineTo(0,-15);g.lineTo(8,4);g.closePath();g.fill();
      }else{
        g.fillStyle='#665c79';g.fillRect(-29,-20,58,44);g.fillStyle='#85779a';g.fillRect(-41,-9,13,35);g.fillRect(28,-9,13,35);
        g.fillStyle='#a7eaff';g.beginPath();g.moveTo(-15,-20);g.lineTo(-5,-43);g.lineTo(3,-19);g.closePath();g.fill();
        g.beginPath();g.moveTo(7,-20);g.lineTo(18,-38);g.lineTo(24,-17);g.closePath();g.fill();
        g.fillStyle='#d9fbff';g.beginPath();g.arc(0,1,9+Math.sin(t)*2,0,Math.PI*2);g.fill();
      }
    }else if(k==='fairy'){
      g.save();g.scale(1.25,1.25);
      g.globalAlpha=.60;g.fillStyle='#bffcff';
      g.beginPath();g.ellipse(-25,-4,16,32,-.55,0,Math.PI*2);g.ellipse(25,-4,16,32,.55,0,Math.PI*2);g.fill();
      g.fillStyle='#ffcbff';g.beginPath();g.ellipse(-20,20,12,22,.4,0,Math.PI*2);g.ellipse(20,20,12,22,-.4,0,Math.PI*2);g.fill();
      g.globalAlpha=1;g.fillStyle='#7451a4';g.beginPath();g.ellipse(0,7,23,30,0,0,Math.PI*2);g.fill();
      g.fillStyle='#f6d9c8';g.beginPath();g.arc(0,-23,14,0,Math.PI*2);g.fill();
      g.fillStyle='#fff4a8';g.beginPath();g.moveTo(-17,-34);g.lineTo(-8,-53);g.lineTo(0,-36);g.lineTo(10,-54);g.lineTo(18,-34);g.closePath();g.fill();
      g.fillStyle='#fff';g.beginPath();g.arc(-5,-25,2,0,Math.PI*2);g.arc(5,-25,2,0,Math.PI*2);g.fill();
      g.strokeStyle='#fff4a8';g.lineWidth=2;g.beginPath();g.arc(0,3,42+Math.sin(t)*3,0,Math.PI*2);g.stroke();
      g.restore();
    }else{
      g.fillStyle='#327e9b';g.beginPath();g.ellipse(0,2,28,16,0,0,Math.PI*2);g.fill();
      g.beginPath();g.moveTo(16,-6);g.quadraticCurveTo(33,-28,29,-2);g.quadraticCurveTo(42,2,26,9);g.closePath();g.fill();
      g.strokeStyle='#77e8e0';g.lineWidth=6;g.beginPath();g.moveTo(-22,4);g.quadraticCurveTo(-45,-15,-48,12);g.stroke();
      g.fillStyle='#d9ffff';g.beginPath();g.arc(29,-7,3,0,Math.PI*2);g.fill();
    }
    if(bossBattle){const n=bossBattle.maxHp,have=bossBattle.hp;for(let i=0;i<n;i++){g.fillStyle=i<have?'#ffdd72':'#3b3340';g.fillRect(-n*3+i*6,-48,4,5)}}
    g.restore();g.restore();return;
  }

  if(u.fairyActive){
    const t=performance.now()/170;g.save();
    g.globalAlpha=.55;g.fillStyle='#b8ffff';
    g.beginPath();g.ellipse(-18,-3,12,24,-.55,0,Math.PI*2);g.ellipse(18,-3,12,24,.55,0,Math.PI*2);g.fill();
    g.fillStyle='#ffc9ff';g.beginPath();g.ellipse(-15,13,9,17,.45,0,Math.PI*2);g.ellipse(15,13,9,17,-.45,0,Math.PI*2);g.fill();
    g.globalAlpha=1;
    const o=outfitFor(u);g.fillStyle=o.base;g.beginPath();g.roundRect(-15,-6,30,34,9);g.fill();
    g.fillStyle='#f2d4bc';g.beginPath();g.arc(0,-15,10,0,Math.PI*2);g.fill();
    g.strokeStyle=o.sub;g.lineWidth=5;g.beginPath();g.moveTo(-6,22);g.lineTo(-8,32);g.moveTo(6,22);g.lineTo(8,32);g.stroke();
    g.strokeStyle='#fff3a2';g.lineWidth=2;g.beginPath();g.arc(0,1,28+Math.sin(t)*2,0,Math.PI*2);g.stroke();
    g.fillStyle='#fff7b5';for(let i=0;i<4;i++){const a=t+i*Math.PI/2;g.beginPath();g.arc(Math.cos(a)*32,Math.sin(a)*22,2.5,0,Math.PI*2);g.fill()}
    

    // v3.05 fairy appearance: human/fairy face, blue hair, twin buns, point eyes, ▼ mouth
    g.fillStyle='#f2cf72';
    g.beginPath();g.ellipse(0,-16,11,13,0,0,Math.PI*2);g.fill();

    // blue hair framing the face
    g.fillStyle='#4aa9ef';
    g.beginPath();g.arc(0,-23,12,Math.PI,Math.PI*2);g.fill();
    g.beginPath();g.roundRect(-13,-24,5,19,3);g.roundRect(8,-24,5,19,3);g.fill();

    // twin hair buns
    g.beginPath();g.arc(-10,-31,5,0,Math.PI*2);g.arc(10,-31,5,0,Math.PI*2);g.fill();
    g.fillStyle='#ef74d8';
    g.beginPath();g.arc(-10,-31,2.5,0,Math.PI*2);g.arc(10,-31,2.5,0,Math.PI*2);g.fill();

    // pointed ears
    g.fillStyle='#f2cf72';
    g.beginPath();g.moveTo(-10,-18);g.lineTo(-17,-15);g.lineTo(-10,-12);g.closePath();g.fill();
    g.beginPath();g.moveTo(10,-18);g.lineTo(17,-15);g.lineTo(10,-12);g.closePath();g.fill();

    // point eyes + ▼ mouth
    g.fillStyle='#272534';
    g.beginPath();g.arc(-4,-17,1.45,0,Math.PI*2);g.arc(4,-17,1.45,0,Math.PI*2);g.fill();
    g.beginPath();g.moveTo(-3,-12);g.lineTo(3,-12);g.lineTo(0,-8);g.closePath();g.fill();
g.restore();g.restore();return;
  }

  if(u.frogActive){
    g.save();const walk=u.isMoving?Math.sin((u.runPhase||0)*2.1):0;
    g.fillStyle='#69b84f';g.beginPath();g.ellipse(0,2,15,20,0,0,Math.PI*2);g.fill();
    g.strokeStyle='#4f963d';g.lineWidth=7;g.lineCap='round';g.beginPath();g.moveTo(-7,16);g.lineTo(-9-walk*4,31);g.lineTo(-14-walk*5,36);g.moveTo(7,16);g.lineTo(9+walk*4,31);g.lineTo(14+walk*5,36);g.stroke();
    g.lineWidth=5;g.beginPath();g.moveTo(-11,0);g.lineTo(-20,10+walk*2);g.moveTo(11,0);g.lineTo(20,10-walk*2);g.stroke();
    g.fillStyle='#7ac95a';g.beginPath();g.ellipse(0,-18,17,15,0,0,Math.PI*2);g.fill();g.fillStyle='#f7f4d4';g.beginPath();g.arc(-8,-30,6,0,Math.PI*2);g.arc(8,-30,6,0,Math.PI*2);g.fill();g.fillStyle='#172318';g.beginPath();g.arc(-8,-30,2.4,0,Math.PI*2);g.arc(8,-30,2.4,0,Math.PI*2);g.fill();g.strokeStyle='#315d2c';g.lineWidth=2;g.beginPath();g.arc(0,-18,7,.15,Math.PI-.15);g.stroke();
    if(u.frogMage){g.fillStyle=u.team==='red'?'#6e4b98':'#416e9e';g.beginPath();g.moveTo(-13,-1);g.lineTo(13,-1);g.lineTo(17,22);g.lineTo(-17,22);g.closePath();g.fill();g.strokeStyle='#e6cf72';g.lineWidth=2;g.beginPath();g.moveTo(-12,5);g.lineTo(12,5);g.stroke();}
    if(u.frogTongueT>0){const target=nearest(u,u.team==='blue'?enemies:[player,...allies]),d=target?norm(target.x-u.x,target.y-u.y):{x:u.team==='blue'?1:-1,y:0};g.strokeStyle='#ee7f99';g.lineWidth=4;g.beginPath();g.moveTo(d.x*8,-17+d.y*8);g.lineTo(d.x*96,-17+d.y*96);g.stroke();}
    g.restore();g.restore();return;
  }
  if(u.rabbitActive){
    // Full quadruped rabbit form.
    const hop=u.isMoving?Math.sin((u.runPhase||0)*1.6):0;
    const facing=u.team==='blue'?1:-1;
    g.save();g.scale(facing,1);

    g.fillStyle='#0002';g.beginPath();g.ellipse(0,17,25,6,0,0,Math.PI*2);g.fill();

    // rear legs
    g.fillStyle='#ddd7cf';
    g.beginPath();g.ellipse(-13,10,10,7,-.25,0,Math.PI*2);g.fill();
    g.beginPath();g.ellipse(-18+hop*3,18,9,4,-.1,0,Math.PI*2);g.fill();

    // body
    g.fillStyle='#f5f0e6';g.beginPath();g.ellipse(-1,4,22,13,-.05,0,Math.PI*2);g.fill();

    // front legs
    g.strokeStyle='#d7d0c8';g.lineWidth=5;g.lineCap='round';
    g.beginPath();g.moveTo(11,10);g.lineTo(14-hop*3,20);g.moveTo(17,8);g.lineTo(21+hop*3,18);g.stroke();

    // head
    g.fillStyle='#f5f0e6';g.beginPath();g.ellipse(19,-3,11,10,.05,0,Math.PI*2);g.fill();

    // long ears
    g.beginPath();g.ellipse(15,-19,4.5,15,-.22,0,Math.PI*2);g.ellipse(23,-19,4.5,15,.15,0,Math.PI*2);g.fill();
    g.fillStyle='#f2b6c5';g.beginPath();g.ellipse(15,-19,1.8,10,-.22,0,Math.PI*2);g.ellipse(23,-19,1.8,10,.15,0,Math.PI*2);g.fill();

    // face
    g.fillStyle='#222';g.beginPath();g.arc(23,-5,1.7,0,Math.PI*2);g.fill();
    g.fillStyle='#ef9baa';g.beginPath();g.arc(30,0,1.7,0,Math.PI*2);g.fill();

    // cotton tail
    g.fillStyle='#fff';g.beginPath();g.arc(-23,2,7,0,Math.PI*2);g.fill();

    g.restore();
    if(u.controlled){
      g.strokeStyle='#ffe66d';g.lineWidth=3;g.beginPath();g.arc(0,3,31,0,Math.PI*2);g.stroke();
    }
    g.restore();return;
  }
  if(u.beastActive){
    // Full transformation: only the quadruped beast is drawn.
    const facing=(u.team==='blue'?1:-1);
    const gallop=u.isMoving?Math.sin((u.runPhase||0)*1.35):0;

    if(u.controlled){
      g.strokeStyle='#ffe66d';g.lineWidth=3;
      g.beginPath();g.arc(0,3,32,0,Math.PI*2);g.stroke();
      g.fillStyle='#ffe66d';g.beginPath();
      g.moveTo(0,-44);g.lineTo(-7,-35);g.lineTo(7,-35);g.closePath();g.fill();
    }

    g.save();
    g.scale(facing,1);
    const _out=outfitFor(u);
    const fur=u.team==='blue'?'#496fa8':_out.base;
    const dark=u.team==='blue'?'#263f69':_out.sub;

    g.fillStyle='#0002';
    g.beginPath();g.ellipse(0,18,29,7,0,0,Math.PI*2);g.fill();

    g.strokeStyle=fur;g.lineWidth=7;g.lineCap='round';
    g.beginPath();g.moveTo(-20,2);g.quadraticCurveTo(-33,-9-gallop*2,-38,-2);g.stroke();

    g.strokeStyle=dark;g.lineWidth=5;
    const a=gallop*7,b=-gallop*7;
    g.beginPath();
    g.moveTo(-15,8);g.lineTo(-19+a,23);
    g.moveTo(-5,9);g.lineTo(-2+b,24);
    g.moveTo(9,9);g.lineTo(6+b,24);
    g.moveTo(17,7);g.lineTo(21+a,22);
    g.stroke();

    g.fillStyle=fur;
    g.beginPath();g.ellipse(0,1,26,14,0,0,Math.PI*2);g.fill();

    g.beginPath();
    g.moveTo(16,-8);g.lineTo(23,-20);g.lineTo(27,-8);
    g.lineTo(38,-3);g.lineTo(29,7);g.lineTo(18,7);g.closePath();g.fill();

    g.beginPath();
    g.moveTo(20,-9);g.lineTo(17,-20);g.lineTo(30,-10);g.closePath();g.fill();

    g.fillStyle='#fff';g.beginPath();g.arc(26,-5,2.4,0,Math.PI*2);g.fill();
    g.fillStyle='#202735';g.beginPath();g.arc(38,-2,2.4,0,Math.PI*2);g.fill();

    if(u.isMoving){
      g.globalAlpha=.45;g.strokeStyle='#fff';g.lineWidth=2;
      for(let i=0;i<3;i++){
        g.beginPath();
        g.moveTo(-30-i*5,-8+i*7);
        g.lineTo(-45-i*6,-8+i*7);
        g.stroke();
      }
    }
    g.restore();

    if(u.shield>0){
      g.strokeStyle='#8fe5ff';g.lineWidth=4;g.globalAlpha=.8;
      g.beginPath();g.arc(0,0,35,0,Math.PI*2);g.stroke();
    }

    g.restore();
    return;
  }
  // v2.37: legs and quick alternating running motion
  const legSwing=u.isMoving?Math.sin(u.runPhase||0)*5:0;
  const legOut=outfitFor(u);g.strokeStyle=u.team==='blue'?'#243f88':legOut.base;
  g.lineWidth=5;g.lineCap='round';g.beginPath();
  g.moveTo(-6,12);g.lineTo(-7-legSwing,24);g.moveTo(6,12);g.lineTo(7+legSwing,24);g.stroke();
  g.lineWidth=4;g.beginPath();g.moveTo(-7-legSwing,24);g.lineTo(-11-legSwing,25);g.moveTo(7+legSwing,24);g.lineTo(11+legSwing,25);g.stroke();
  g.scale(1.08,1.08);
  if(u.dodgeT>0)g.rotate(u.rollAngle);
  if(u.inv>0)g.globalAlpha=.55;

  if(u.shield>0){g.save();g.strokeStyle='#8fe5ff';g.lineWidth=4;g.globalAlpha=.8;g.beginPath();g.arc(0,0,29,0,Math.PI*2);g.stroke();g.restore();}
  if(u.specialKind==='triple'&&u.tripleReady>=0){
    g.save();g.globalAlpha=.45+.35*Math.sin(performance.now()/55);g.strokeStyle='#ffe8a8';g.lineWidth=3;g.beginPath();g.arc(0,0,34,0,Math.PI*2);g.stroke();g.fillStyle='#fff3c8';g.font='bold 11px sans-serif';g.textAlign='center';g.fillText('×3',0,-38);g.restore();
  }
  if(u.bladeT>0){
    const p=1-u.bladeT/.34;
    g.save();
    g.rotate(u.bladeAngle);
    g.globalAlpha=Math.max(.15,1-p);
    g.lineWidth=8;
    g.lineCap='round';
    g.strokeStyle=u.reflectBladeT>0?'#ffe784':'#dff8ff';
    g.beginPath();
    g.arc(0,0,72,-Math.PI*.55,Math.PI*.55);
    g.stroke();
    g.lineWidth=3;
    g.strokeStyle=u.reflectBladeT>0?'#fff2a8':'#ffffff';
    g.beginPath();
    g.arc(0,0,82,-Math.PI*.55,Math.PI*.55);
    g.stroke();
    g.restore();
  }
  if(u.dodgeT>0){
    g.strokeStyle=u.team==='blue'?'#d7e7ff99':'#ffd9dd99';g.lineWidth=4;g.beginPath();g.arc(0,0,25,-2.5,1.8);g.stroke();
  }
  if(u.controlled){
    g.strokeStyle='#ffe66d';g.lineWidth=3;g.beginPath();g.arc(0,4,25,0,Math.PI*2);g.stroke();
    g.fillStyle='#ffe66d';g.beginPath();g.moveTo(0,-50);g.lineTo(-7,-40);g.lineTo(7,-40);g.closePath();g.fill();
  }

  g.fillStyle='#0002';g.beginPath();g.ellipse(0,14,18,7,0,0,Math.PI*2);g.fill();
  const outfit=outfitFor(u);
  g.fillStyle=outfit.base;rr(-14,-8,28,29,8);

  g.save();g.beginPath();g.rect(-14,-8,28,29);g.clip();
  g.strokeStyle=outfit.sub;g.fillStyle=outfit.sub;g.lineWidth=3;
  const pat=outfit.pattern;
  if(pat==='player'||pat==='slash'){
    for(let k=-28;k<32;k+=12){g.beginPath();g.moveTo(k,-10);g.lineTo(k+24,24);g.stroke();}
  }else if(pat==='chevron'){
    g.beginPath();g.moveTo(-14,-1);g.lineTo(0,9);g.lineTo(14,-1);g.stroke();
  }else if(pat==='bars'){
    g.fillRect(-14,-1,28,5);g.fillRect(-14,11,28,4);
  }else if(pat==='star'||pat==='burst'){
    for(let i=0;i<6;i++){const a=i*Math.PI/3;g.beginPath();g.moveTo(0,6);g.lineTo(Math.cos(a)*18,6+Math.sin(a)*18);g.stroke();}
  }else if(pat==='shield'){
    g.beginPath();g.moveTo(0,-3);g.lineTo(9,1);g.lineTo(7,12);g.lineTo(0,18);g.lineTo(-7,12);g.lineTo(-9,1);g.closePath();g.stroke();
  }else if(pat==='diamond'||pat==='rune'){
    g.beginPath();g.moveTo(0,-4);g.lineTo(9,6);g.lineTo(0,17);g.lineTo(-9,6);g.closePath();g.stroke();
    if(pat==='rune'){g.beginPath();g.moveTo(-5,6);g.lineTo(5,6);g.moveTo(0,0);g.lineTo(0,13);g.stroke();}
  }else if(pat==='triple'){
    [-7,0,7].forEach(x=>{g.beginPath();g.moveTo(x,-5);g.lineTo(x,18);g.stroke();});
  }else if(pat==='wave'){
    g.beginPath();for(let x=-16;x<=16;x+=4)g.lineTo(x,6+Math.sin(x*.45)*5);g.stroke();
  }else if(pat==='zigzag'){
    g.beginPath();g.moveTo(-14,0);g.lineTo(-7,9);g.lineTo(0,0);g.lineTo(7,9);g.lineTo(14,0);g.stroke();
  }else if(pat==='split'){
    g.fillRect(0,-8,14,29);g.strokeStyle=outfit.accent;g.beginPath();g.moveTo(0,-8);g.lineTo(0,21);g.stroke();
  }else if(pat==='fang'){
    g.beginPath();g.moveTo(-10,-2);g.lineTo(-4,13);g.lineTo(0,5);g.lineTo(4,13);g.lineTo(10,-2);g.stroke();
  }else if(pat==='claw'){
    [-7,0,7].forEach(x=>{g.beginPath();g.moveTo(x-5,-5);g.lineTo(x+4,18);g.stroke();});
  }else if(pat==='crest'||pat==='crown'){
    g.beginPath();g.moveTo(-11,10);g.lineTo(-8,0);g.lineTo(-2,6);g.lineTo(3,-2);g.lineTo(8,6);g.lineTo(12,0);g.lineTo(10,12);g.closePath();g.stroke();
  }else if(pat==='fade'){
    g.globalAlpha=.6;for(let y=-5;y<20;y+=6)g.fillRect(-14,y,28,2);
  }else if(pat==='spiral'){
    g.beginPath();for(let a=0;a<Math.PI*4;a+=.3){const r=a*1.1;g.lineTo(Math.cos(a)*r,6+Math.sin(a)*r);}g.stroke();
  }else if(pat==='arc'){
    g.beginPath();g.arc(0,17,18,Math.PI*1.08,Math.PI*1.92);g.stroke();g.beginPath();g.arc(0,17,11,Math.PI*1.08,Math.PI*1.92);g.stroke();
  }
  g.restore();
  g.fillStyle=outfit.accent;g.beginPath();g.arc(0,5,3.2,0,Math.PI*2);g.fill();

  g.fillStyle=SKIN;g.beginPath();g.arc(0,-17,12,0,Math.PI*2);g.fill();
  g.fillStyle=u.team==='blue'?'#3158ac':outfit.sub;
  g.beginPath();g.moveTo(-13,-24);g.quadraticCurveTo(-5,-43,7,-35);g.quadraticCurveTo(19,-31,12,-21);g.closePath();g.fill();
  g.strokeStyle='#f4ead9';g.lineWidth=4;g.beginPath();g.moveTo(-13,-25);g.lineTo(13,-25);g.stroke();
  g.fillStyle=EYE;g.beginPath();g.arc(-4,-18,1.8,0,Math.PI*2);g.arc(4,-18,1.8,0,Math.PI*2);g.fill();

  if(u.charging){
    const t=performance.now()/1000,spin=t*10;
    g.strokeStyle='#b9a1ff';g.lineWidth=3;g.beginPath();g.arc(0,-2,24+Math.sin(t*12)*2,spin,spin+Math.PI*1.55);g.stroke();
    g.fillStyle='#e8ddff';const ox=Math.cos(spin)*21,oy=-2+Math.sin(spin)*12;g.beginPath();g.arc(ox,oy,5+u.chargeT*3,0,Math.PI*2);g.fill();
  }
  if(u.emote>0){g.font='19px sans-serif';g.fillText('✌',14,-31)}
  g.restore();
}


function createLob(u,target,team){lobShots.push({sx:u.x,sy:u.y,tx:target.x,ty:target.y,x:u.x,y:u.y,t:0,dur:1.30,team});}
function updateLobs(dt){for(const l of lobShots){l.t+=dt;const p=Math.min(1,l.t/l.dur);l.x=l.sx+(l.tx-l.sx)*p;l.y=l.sy+(l.ty-l.sy)*p-Math.sin(Math.PI*p)*115;if(p>=1&&!l.done){l.done=true;explodeAt(l.tx,l.ty,l.team,64);}}lobShots=lobShots.filter(l=>!l.done);}
function placeMine(u){
  if(!u||!u.alive)return false;
  if(dist(u,flagBlue)<95||dist(u,flagRed)<95){
    if(u.controlled)flash('クリスタル付近には設置できない',520);
    return false;
  }

  const owned=mines.filter(m=>m.owner===u);
  if(owned.length>=2){
    let oldest=owned[0];
    for(const m of owned)if(m.age>oldest.age)oldest=m;
    mines=mines.filter(m=>m!==oldest);
  }

  mines.push({x:u.x,y:u.y,team:u.team,age:0,owner:u});
  return true;
}
function updateMines(dt){
  for(const m of mines)m.age+=dt;

  const triggered=[];
  for(const m of mines){
    if(m.age<.35)continue;
    const targets=m.team==='blue'?enemies:[player,...allies];
    if(targets.some(u=>u&&u.alive&&Math.hypot(u.x-m.x,u.y-m.y)<38)){
      triggered.push(m);
    }
  }

  if(!triggered.length)return;

  const hitSet=new Set(triggered);
  mines=mines.filter(m=>!hitSet.has(m));

  for(const m of triggered){
    if(!running)break;
    explodeAt(m.x,m.y,m.team,58);
  }
}

function arenaTheme(){
  if(mode==='boss'&&bossStageKind){
    const bossThemes={
      forest:{court:'#557b58',wall:'#6b543d',bg:'#213d2b'},
      silverwolf:{court:'#668b87',wall:'#a9c5c8',bg:'#203b42'},
      managolem:{court:'#586d83',wall:'#a7dbf2',bg:'#202b3d'},
      manadeer:{court:'#69958a',wall:'#c6e7d4',bg:'#294f52'},
      cave:{court:'#5a566d',wall:'#8d85a4',bg:'#252638'},
      pond:{court:'#5d8f86',wall:'#6d8e73',bg:'#315c62'},
      fairy:{court:'#7787a8',wall:'#d6c8f2',bg:'#3b4568'},
      frogking:{court:'#64836a',wall:'#6a744d',bg:'#294c4c'}
    };
    return bossThemes[bossStageKind]||{court:'#8fb7bc',wall:'#e7fbf7',bg:'#405c67'};
  }
  if(mode==='practice')return {court:'#b9d6f2',wall:'#e7edf5',bg:'#5f7c92'};
  if(cupKind==='beginner')return {court:'#9ad9b8',wall:'#f1e6cc',bg:'#5f7d8a'};
  if(cupKind==='rookie')return {court:'#b7a8e8',wall:'#eee7ff',bg:'#655f86'};
  if(cupKind==='advanced')return {court:'#d9b77b',wall:'#f5e2b8',bg:'#7c6848'};
  if(cupKind==='expert')return {court:'#9fbc8f',wall:'#d8e4cf',bg:'#4f6652'};
  if(cupKind==='master')return {court:'#b7a0c9',wall:'#efe3f5',bg:'#594a68'};
  if(cupKind==='grandmaster')return {court:'#8fb7bc',wall:'#e7fbf7',bg:'#405c67'};
  return {court:'#9ad9b8',wall:'#f1e6cc',bg:'#5f7d8a'};
}


function drawBossObstacle(w,theme){
  const k=w.kind||'wall';
  g.save();

  if(k==='tree'||k==='sacredtree'){
    g.fillStyle=k==='sacredtree'?'#6d5a87':'#5d4632';
    rr(w.x+w.w*.34,w.y+w.h*.35,w.w*.32,w.h*.65,8);
    g.fillStyle=k==='sacredtree'?'#8fc7a0':'#3e7650';
    g.beginPath();g.arc(w.x+w.w*.5,w.y+w.h*.26,w.w*.62,0,Math.PI*2);g.fill();
    g.beginPath();g.arc(w.x+w.w*.25,w.y+w.h*.38,w.w*.42,0,Math.PI*2);g.fill();
    g.beginPath();g.arc(w.x+w.w*.75,w.y+w.h*.38,w.w*.42,0,Math.PI*2);g.fill();
    if(k==='sacredtree'){
      g.strokeStyle='#e9d4ff';g.lineWidth=3;g.beginPath();g.arc(w.x+w.w*.5,w.y+w.h*.28,w.w*.25,0,Math.PI*2);g.stroke();
    }
  }else if(k==='boulder'||k==='mudrock'){
    g.fillStyle=k==='mudrock'?'#5f6348':'#77737c';
    g.beginPath();g.ellipse(w.x+w.w/2,w.y+w.h/2,w.w/2,w.h/2,0,0,Math.PI*2);g.fill();
    g.strokeStyle='#ffffff22';g.lineWidth=3;g.beginPath();g.moveTo(w.x+w.w*.2,w.y+w.h*.4);g.lineTo(w.x+w.w*.6,w.y+w.h*.25);g.stroke();
  }else if(k==='log'||k==='fallenlog'){
    g.fillStyle='#72523a';rr(w.x,w.y,w.w,w.h,18);
    g.strokeStyle='#a67b50';g.lineWidth=3;for(let x=w.x+18;x<w.x+w.w;x+=24){g.beginPath();g.moveTo(x,w.y+4);g.lineTo(x-8,w.y+w.h-4);g.stroke()}
  }else if(k==='crystal'){
    g.fillStyle='#9fe5ff';g.beginPath();
    g.moveTo(w.x+w.w*.5,w.y);g.lineTo(w.x+w.w,w.y+w.h*.35);g.lineTo(w.x+w.w*.72,w.y+w.h);
    g.lineTo(w.x+w.w*.28,w.y+w.h);g.lineTo(w.x,w.y+w.h*.35);g.closePath();g.fill();
    g.strokeStyle='#eaffff';g.lineWidth=3;g.stroke();
  }else if(k==='rockpillar'){
    g.fillStyle='#686375';rr(w.x,w.y,w.w,w.h,10);
    g.strokeStyle='#9b94ad';g.lineWidth=4;g.beginPath();g.moveTo(w.x+8,w.y+18);g.lineTo(w.x+w.w-8,w.y+35);g.moveTo(w.x+12,w.y+w.h*.65);g.lineTo(w.x+w.w-12,w.y+w.h*.55);g.stroke();
  }else if(k==='lilypad'||k==='giantlily'){
    g.fillStyle=k==='giantlily'?'#5d8f4b':'#6fa56c';
    g.beginPath();g.ellipse(w.x+w.w/2,w.y+w.h/2,w.w/2,w.h/2,0,0,Math.PI*2);g.fill();
    g.fillStyle='#a8d889';g.beginPath();g.moveTo(w.x+w.w/2,w.y+w.h/2);g.lineTo(w.x+w.w,w.y+w.h*.35);g.lineTo(w.x+w.w,w.y+w.h*.65);g.closePath();g.fill();
  }else if(k==='reedrock'){
    g.fillStyle='#6c735e';g.beginPath();g.ellipse(w.x+w.w/2,w.y+w.h*.65,w.w*.48,w.h*.35,0,0,Math.PI*2);g.fill();
    g.strokeStyle='#73975f';g.lineWidth=4;for(let i=0;i<4;i++){const x=w.x+12+i*16;g.beginPath();g.moveTo(x,w.y+w.h*.7);g.lineTo(x-5,w.y);g.stroke()}
  }else if(k==='runestone'){
    g.fillStyle='#7b7191';rr(w.x,w.y,w.w,w.h,10);
    g.strokeStyle='#e8d8ff';g.lineWidth=3;g.beginPath();g.moveTo(w.x+w.w*.25,w.y+w.h*.25);g.lineTo(w.x+w.w*.72,w.y+w.h*.5);g.lineTo(w.x+w.w*.35,w.y+w.h*.75);g.stroke();
  }else if(k==='lightpillar'){
    const gr=g.createLinearGradient(w.x,0,w.x+w.w,0);
    gr.addColorStop(0,'#ffffff22');gr.addColorStop(.5,'#fff7c9cc');gr.addColorStop(1,'#ffffff22');
    g.fillStyle=gr;rr(w.x,w.y,w.w,w.h,18);
    g.strokeStyle='#fff2b4';g.lineWidth=2;g.strokeRect(w.x+4,w.y+4,w.w-8,w.h-8);
  }else{
    g.fillStyle='#c7bda5';rr(w.x+5,w.y+6,w.w,w.h,8);g.fillStyle=theme.wall;rr(w.x,w.y,w.w,w.h,8);
  }

  g.restore();
}

function draw(){
  const theme=arenaTheme();g.fillStyle=theme.bg;g.fillRect(0,0,W,H);
  g.fillStyle=theme.court;g.fillRect(COURT.x,COURT.y,COURT.w,COURT.h);
  g.strokeStyle='#fff9d7';g.lineWidth=4;g.strokeRect(COURT.x,COURT.y,COURT.w,COURT.h);
  g.setLineDash([12,12]);g.beginPath();g.moveTo(W/2,COURT.y);g.lineTo(W/2,COURT.y+COURT.h);g.stroke();g.setLineDash([]);
  g.strokeStyle='#ffffff28';g.lineWidth=2;g.beginPath();g.arc(W/2,CY,74,0,Math.PI*2);g.stroke();
  if(mode==='boss'&&bossStageKind){
    const stageNames={forest:'月影の森',silverwolf:'月影の森・銀風原',managolem:'晶石洞窟・蒼晶深部',manadeer:'星雫の池・精霊泉',cave:'晶石洞窟',pond:'星雫の池',fairy:'妖精樹の聖域',frogking:'大湿原・王の沼'};
    g.fillStyle='#ffffffbb';g.font='700 20px sans-serif';g.textAlign='center';
    g.fillText(stageNames[bossStageKind]||'BOSS STAGE',W/2,42);
    g.textAlign='left';
  }

  for(const w of walls)drawBossObstacle(w,theme)
  drawFlag(flagBlue,'blue');drawFlag(flagRed,'red');

  for(const b of bullets){
    g.save();g.shadowBlur=13;g.shadowColor=b.team==='blue'?'#8fc6ff':'#ff9daa';g.fillStyle=b.team==='blue'?'#d9ecff':'#ffe1e4';
    g.beginPath();g.arc(b.x,b.y,b.r,0,Math.PI*2);g.fill();
    if(b.kind==='crystal'){
      g.fillStyle='#b9efff';g.beginPath();
      g.moveTo(b.x,b.y-11);g.lineTo(b.x+8,b.y);g.lineTo(b.x,b.y+11);g.lineTo(b.x-8,b.y);g.closePath();g.fill();
      g.strokeStyle='#efffff';g.lineWidth=2;g.stroke();
    }else if(b.kind==='spirit'){
      g.strokeStyle='#bfffdc';g.lineWidth=3;g.beginPath();g.arc(b.x,b.y,b.r+5,0,Math.PI*2);g.stroke();
      g.beginPath();g.arc(b.x,b.y,b.r+10,.4,4.8);g.stroke();
    }else if(b.kind==='claw'){
      g.shadowBlur=8;g.shadowColor='#d8fbff';
      g.strokeStyle='#d9fbff';g.lineWidth=5;g.lineCap='round';
      const a=Math.atan2(b.dy,b.dx);
      const nx=-Math.sin(a),ny=Math.cos(a);
      g.beginPath();
      g.moveTo(b.x-b.dx*18+nx*7,b.y-b.dy*18+ny*7);
      g.lineTo(b.x+b.dx*18-nx*7,b.y+b.dy*18-ny*7);
      g.stroke();
      g.beginPath();
      g.moveTo(b.x-b.dx*14-nx*7,b.y-b.dy*14-ny*7);
      g.lineTo(b.x+b.dx*14+nx*7,b.y+b.dy*14+ny*7);
      g.stroke();
    }else if(b.kind==='bubble'){g.globalAlpha=.55;g.fillStyle=b.team==='blue'?'#b9efff':'#ffd3e7';g.beginPath();g.arc(b.x,b.y,b.r+2,0,Math.PI*2);g.fill();g.globalAlpha=1;g.strokeStyle='#ffffffcc';g.lineWidth=2;g.beginPath();g.arc(b.x-3,b.y-4,b.r-4,.2,2.0);g.stroke();}
    else if(b.kind==='phase'){
      g.strokeStyle='#8fffe1';g.lineWidth=3;g.beginPath();g.arc(b.x,b.y,b.r+5,0,Math.PI*2);g.stroke();
    }else if(b.kind==='spread'){g.strokeStyle='#ffb0f1';g.lineWidth=2;g.beginPath();g.arc(b.x,b.y,b.r+3,0,Math.PI*2);g.stroke();
    }else if(b.kind==='rightangle'){g.strokeStyle='#b9ff75';g.lineWidth=3;g.strokeRect(b.x-10,b.y-10,20,20);
      if(b.phase2===0&&b.age>.48){g.globalAlpha=.45+.45*Math.sin(performance.now()/55);g.lineWidth=2;g.beginPath();g.arc(b.x,b.y,16,0,Math.PI*2);g.stroke();}
     }else if(b.kind==='blast'){
      g.strokeStyle='#ff9b5a';g.lineWidth=3;g.beginPath();g.arc(b.x,b.y,b.r+6,0,Math.PI*2);g.stroke();
    }else if(b.kind==='bounce'){
      g.strokeStyle='#ffd36f';g.lineWidth=3;g.setLineDash([4,3]);g.beginPath();g.arc(b.x,b.y,b.r+5,0,Math.PI*2);g.stroke();g.setLineDash([]);
    }
    if(b.curve){g.strokeStyle=b.team==='blue'?'#826cff':'#e96a93';g.lineWidth=2;g.beginPath();g.arc(b.x,b.y,b.r+4,.3,5.2);g.stroke()}
    g.restore();
  }

  for(const m of miniFrogs){const hop=Math.abs(Math.sin(m.phase))*13;g.save();g.translate(m.x,m.y-hop);g.fillStyle=m.team==='blue'?'#76c765':'#6db451';g.beginPath();g.ellipse(0,2,10,7,0,0,Math.PI*2);g.fill();g.beginPath();g.arc(-5,-5,4,0,Math.PI*2);g.arc(5,-5,4,0,Math.PI*2);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(-5,-6,2,0,Math.PI*2);g.arc(5,-6,2,0,Math.PI*2);g.fill();g.fillStyle='#222';g.beginPath();g.arc(-5,-6,1,0,Math.PI*2);g.arc(5,-6,1,0,Math.PI*2);g.fill();g.restore();}
  for(const l of lobShots){
    const p=Math.min(1,l.t/l.dur);
    g.save();g.globalAlpha=.28+.48*p;g.strokeStyle=l.team==='blue'?'#8fc6ff':'#ff9b78';g.lineWidth=3;
    g.setLineDash([6,5]);g.beginPath();g.arc(l.tx,l.ty,30-8*p,0,Math.PI*2);g.stroke();g.setLineDash([]);
    g.beginPath();g.moveTo(l.tx-10,l.ty);g.lineTo(l.tx+10,l.ty);g.moveTo(l.tx,l.ty-10);g.lineTo(l.tx,l.ty+10);g.stroke();g.restore();
    g.save();g.shadowBlur=12;g.shadowColor='#ffb45f';g.fillStyle='#ffd9a0';g.beginPath();g.arc(l.x,l.y,8,0,Math.PI*2);g.fill();g.restore();
  }
  for(const m of mines){g.save();g.translate(m.x,m.y);g.strokeStyle=m.team==='blue'?'#6ebcff':'#ff8c98';g.lineWidth=2;g.beginPath();g.arc(0,0,13,0,Math.PI*2);g.stroke();g.beginPath();g.moveTo(-8,0);g.lineTo(8,0);g.moveTo(0,-8);g.lineTo(0,8);g.stroke();g.restore();}
  

  for(const z of windZones){
    const p=Math.max(0,z.t/2.35);
    g.save();g.translate(z.x,z.y);
    g.globalAlpha=.22+.25*p;
    g.strokeStyle=z.team==='blue'?'#b8f4ff':'#ffd1db';
    g.lineWidth=4;
    for(let i=0;i<4;i++){
      g.beginPath();
      g.arc(0,0,42+i*27,performance.now()/500+i,performance.now()/500+i+Math.PI*1.35);
      g.stroke();
    }
    g.restore();
  }

  for(const u of [player,...allies,...enemies]){
    if(!u||!u.alive||u.cloneT<=0||!u.cloneBody)continue;
    g.save();g.translate(u.cloneBody.x,u.cloneBody.y);
    const o=outfitFor(u);
    g.globalAlpha=.82;
    g.fillStyle='#0003';g.beginPath();g.ellipse(0,15,18,7,0,0,Math.PI*2);g.fill();
    g.strokeStyle=o.sub;g.lineWidth=5;
    g.beginPath();g.moveTo(-6,10);g.lineTo(-8,24);g.moveTo(6,10);g.lineTo(8,24);g.stroke();
    g.fillStyle=o.base;g.beginPath();g.arc(0,3,15,0,Math.PI*2);g.fill();
    g.fillStyle='#f2d4bc';g.beginPath();g.arc(0,-15,10,0,Math.PI*2);g.fill();
    g.fillStyle='#111';g.beginPath();g.arc(-3,-16,1.3,0,Math.PI*2);g.arc(3,-16,1.3,0,Math.PI*2);g.fill();
    g.fillStyle='#fff';g.font='bold 9px sans-serif';g.textAlign='center';g.fillText('本体',0,-31);
    g.restore();
  }

for(const a of allies)drawUnit(a);
  for(const e of enemies)drawUnit(e);
  drawUnit(player);

  for(const p of fx){g.globalAlpha=Math.max(0,p.t/.4);g.fillStyle='#fff';g.beginPath();g.arc(p.x,p.y,4,0,Math.PI*2);g.fill();g.globalAlpha=1}
}


function updateContextButtons(){
  const d=$('dodgeBtn');
  if(d){
    if(player&&player.alive&&player.fairyActive)d.innerHTML='浮<small>浮遊</small>';
    else if(player&&player.alive&&player.frogActive)d.innerHTML='蛙<small>大ジャンプ</small>';
    else if(player&&player.alive&&player.rabbitActive)d.innerHTML='跳<small>ジャンプ</small>';
    else d.innerHTML='↻<small>回避</small>';
  }
}



function updateBossCrystalMana(dt){
  if(mode!=='boss'||!running)return;
  const units=[player,...allies];
  for(const u of units){
    if(!u||!u.alive)continue;
    const d=Math.hypot(u.x-flagBlue.x,u.y-flagBlue.y);
    if(d<92){
      u.mana=Math.min(u.maxMana,u.mana+24*dt);
      if(u.controlled&&Math.random()<.015)flash('復活クリスタル：MP回復',260);
    }
  }
}


function fireSilverClaw(u,target){
  if(!u||!u.alive||!target||!target.alive)return;
  const d=norm(target.x-u.x,target.y-u.y);
  bullets.push(new Bullet(u.x+d.x*30,u.y+d.y*30,d.x,d.y,u.team,false,target,'claw'));
}

function updateFieldBossAI(){
  if(mode!=='boss'||!bossBattle||bossBattle.defeated||!enemies[0]||!enemies[0].alive)return;
  const b=enemies[0],now=performance.now()/1000;
  const ts=[player,...allies].filter(x=>x&&x.alive);if(!ts.length)return;
  if(b.bossKind==='silverwolf'){
    if(now>=(b.bossShotAt||0)){
      const t=ts[Math.floor(Math.random()*ts.length)];
      fireSilverClaw(b,t);
      b.bossShotAt=now+3.4+Math.random()*2.0;
      flash('銀狼の爪撃！',260);
    }
    return;
  }
  if(b.bossKind==='managolem'){
    if(now>=(b.bossShotAt||0)){
      const t=ts[Math.floor(Math.random()*ts.length)];
      const d=norm(t.x-b.x,t.y-b.y),base=Math.atan2(d.y,d.x);
      for(const off of [-.28,0,.28]){
        const a=base+off;
        bullets.push(new Bullet(b.x+Math.cos(a)*35,b.y+Math.sin(a)*35,Math.cos(a),Math.sin(a),b.team,false,t,'crystal'));
      }
      b.bossShotAt=now+2.25;
      flash('蒼晶散弾！',240);
    }
    return;
  }
  if(b.bossKind==='manadeer'){
    if(now>=(b.bossShotAt||0)){
      const t=ts[Math.floor(Math.random()*ts.length)];
      const d=norm(t.x-b.x,t.y-b.y);
      bullets.push(new Bullet(b.x+d.x*28,b.y+d.y*28,d.x,d.y,b.team,true,t,'spirit'));
      b.bossShotAt=now+2.0+Math.random()*.8;
      flash('精霊の波紋！',240);
    }
    return;
  }

  if(b.bossKind==='cave'){
    if(!b.moleActive&&now>(b.bossBurrowAt||0)){
      b.moleActive=true;b.moleT=1.65;b.mana=100;
      b.bossBurrowAt=now+4.6;
      flash('モルグが地中へ潜った！',420);
    }
    if(b.moleActive){
      b.mana=100;
      const t=ts.reduce((a,x)=>dist(b,x)<dist(b,a)?x:a,ts[0]);
      const d=norm(t.x-b.x,t.y-b.y);
      move(b,d.x,d.y,.032);
      return;
    }
  }

  if(b.bossKind==='frogking'){
    if(now<(b.bossShotAt||0))return;
    const t=ts[Math.floor(Math.random()*ts.length)];
    b.mana=100;b.lastShot=-99;shoot(b,t,false);
    if(Math.random()<.25)setTimeout(()=>{if(running&&b.alive&&t.alive)createLob(b,t,b.team)},350);
    b.bossShotAt=now+1.35;return;
  }

  if(b.bossKind==='fairy'){
    if(now<(b.bossShotAt||0))return;
    const t=ts[Math.floor(Math.random()*ts.length)];
    const fire=()=>{if(running&&b.alive&&t.alive){b.mana=100;b.lastShot=-99;shoot(b,t,true)}};
    fire();setTimeout(fire,110);setTimeout(fire,220);setTimeout(fire,330);
    if(Math.random()<.22)setTimeout(()=>{if(running&&b.alive&&t.alive)createLob(b,t,b.team)},420);
    b.bossShotAt=now+1.05;return;
  }

  if(now<(b.bossShotAt||0))return;
  const t=ts[Math.floor(Math.random()*ts.length)];
  const fire=()=>{if(running&&b.alive&&t.alive)shoot(b,t)};

  if(b.bossKind==='forest'){
    fire();setTimeout(fire,180);b.bossShotAt=now+1.45;
  }else if(b.bossKind==='cave'){
    fire();b.bossShotAt=now+1.30;
  }else{
    fire();setTimeout(fire,150);setTimeout(fire,300);b.bossShotAt=now+1.8;
  }
}

function frame(t){
  requestAnimationFrame(frame);
  const dt=Math.min(.033,(t-last)/1000||0);
  last=t;
  try{update(dt);updateBossCrystalMana(dt);updateFieldBossAI();draw();updateContextButtons();if($('worldMap')&&!$('worldMap').classList.contains('hidden'))drawMapFieldAvatar();}
  catch(err){
    console.error('frame error',err);
  }
}
requestAnimationFrame(frame);

// joystick
const zone=$('stickZone'),base=$('stickBase'),knob=$('stickKnob');let ptr=null;
function stick(clientX,clientY){
  const r=base.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
  let dx=clientX-cx,dy=clientY-cy,max=r.width*.36,mag=Math.hypot(dx,dy);
  if(mag>max){dx=dx/mag*max;dy=dy/mag*max}
  knob.style.transform=`translate(${dx}px,${dy}px)`;
  let sx=dx/max,sy=dy/max;if(Math.hypot(sx,sy)<.12){sx=0;sy=0}
  input.x=sx;input.y=sy;
}
zone.addEventListener('pointerdown',e=>{e.preventDefault();ptr=e.pointerId;zone.setPointerCapture?.(e.pointerId);stick(e.clientX,e.clientY)});
zone.addEventListener('pointermove',e=>{if(e.pointerId===ptr){e.preventDefault();stick(e.clientX,e.clientY)}});
function releaseStick(e){if(ptr===null||!e||e.pointerId===ptr){ptr=null;input.x=0;input.y=0;knob.style.transform='translate(0,0)'}}
zone.addEventListener('pointerup',releaseStick);zone.addEventListener('pointercancel',releaseStick);

addEventListener('keydown',e=>keys[e.key]=true);addEventListener('keyup',e=>keys[e.key]=false);

// throw
let fairyAutoFire=null;
$('throwBtn').addEventListener('pointerdown',e=>{
  e.preventDefault();
  heldAt=performance.now();
  if(!player||!player.alive)return;

  // カエル化中の通常投球はバブルショット。
  if(player.frogActive){
    const t=nearest(player,enemies);
    if(t)shootBubble(player,t);
    return;
  }

  // 妖精化中はチャージ不要の回転弾を高速連射。
  if(player.fairyActive){
    const fire=()=>{
      if(running&&player&&player.alive&&player.fairyActive){
        const t=nearest(player,enemies);
        if(t)shoot(player,t,true);
      }
    };
    fire();
    clearInterval(fairyAutoFire);
    fairyAutoFire=setInterval(fire,115);
    return;
  }

  player.charging=true;
  player.chargeT=0;
});

function releaseThrow(e){
  if(e)e.preventDefault();
  clearInterval(fairyAutoFire);
  fairyAutoFire=null;
  if(!player)return;

  // カエル/妖精は押した時点で発射済み。
  if(player.frogActive||player.fairyActive){
    player.charging=false;
    player.chargeT=0;
    return;
  }

  const charged=performance.now()-heldAt>=180;
  player.charging=false;
  player.chargeT=0;
  if(!running||!player.alive)return;
  if(player.dodgeT>0||player.dodgeRecover>0){
    flash('回避中は投げられない',380);
    return;
  }
  shoot(player,nearest(player,enemies),charged);
  if(charged)flash('回転弾！',380);
}
$('throwBtn').addEventListener('pointerup',releaseThrow);
$('throwBtn').addEventListener('pointercancel',()=>{
  clearInterval(fairyAutoFire);
  fairyAutoFire=null;
  if(player){player.charging=false;player.chargeT=0}
});

// dodge / movement ability
$('dodgeBtn').addEventListener('pointerdown',e=>{
  e.preventDefault();
  if(!running||!player||!player.alive)return;

  if(player.fairyActive){
    const n=performance.now()/1000;
    if(player.jumpT>0||n-player.lastDodge<.45)return;
    player.lastDodge=n;
    player.jumpT=1.55;
    player.inv=Math.max(player.inv,1.55);
    flash('妖精浮遊！',260);
    return;
  }

  if(player.frogActive){
    const n=performance.now()/1000;
    if(player.jumpT>0||n-player.lastFrogJump<1.35)return;
    player.lastFrogJump=n;
    player.jumpT=1.85;
    player.inv=Math.max(player.inv,1.70);
    flash('カエル大大大ジャンプ！',300);
    return;
  }

  if(player.rabbitActive){
    const n=performance.now()/1000;
    if(player.jumpT>0||n-player.lastJump<1.05)return;
    if(player.mana<10){flash('魔力不足',300);return}
    player.mana-=10;
    player.lastJump=n;
    player.jumpT=.72;
    player.inv=Math.max(player.inv,.72);
    flash('ウサギジャンプ！',260);
    return;
  }

  if(player.beastActive){
    flash('オオカミ化中は回避できない',360);
    return;
  }

  const now=performance.now()/1000;
  if(now-player.lastDodge<1.8){
    flash('回避クールタイム',430);
    return;
  }

  let x=input.x,y=input.y;
  if(Math.abs(y)>=.15){x=0;y=y>0?1:-1;}
  else{x=-1;y=0;}

  const n=norm(x,y);
  player.dx=Math.min(0,n.x);
  player.dy=n.y;
  player.lastDodge=now;
  player.dodgeT=.34;
  player.inv=.24;
});


function useDoubleShot(u){
  if(!u||!u.alive)return false;
  const now=performance.now()/1000;
  const cooldown=.65;
  const cost=26;

  if(now-u.lastDouble<cooldown){
    flash('2連射クールタイム',300);
    return false;
  }
  if(u.dodgeT>0||u.dodgeRecover>0){
    flash('回避中は使えない',380);
    return false;
  }
  if(!u.fairyActive&&u.mana<cost){
    flash('魔力不足',400);
    return false;
  }

  const target=nearest(u,enemies);
  if(!target)return false;

  u.lastDouble=now;
  if(!u.fairyActive)u.mana-=cost;

  // shoot() itself would charge mana and obey normal shot cooldown, so fire the two
  // projectiles directly as a special technique.
  const fireOne=()=>{
    if(!u.alive)return;
    const t=nearest(u,enemies);
    if(!t)return;
    const d=norm(t.x-u.x,t.y-u.y);
    bullets.push(new Bullet(u.x+d.x*23,u.y+d.y*23,d.x,d.y,u.team,false,t));
  };

  fireOne();
  setTimeout(fireOne,170);
  return true;
}


function useManaBlade(u){
  if(!u||!u.alive)return false;
  const now=performance.now()/1000;
  if(now-u.lastBlade<.75){flash('魔力剣クールタイム',300);return false}
  if(u.dodgeT>0||u.dodgeRecover>0){flash('回避中は使えない',360);return false}
  if(!u.fairyActive&&u.mana<18){flash('魔力不足',360);return false}

  const target=nearest(u,enemies);
  let ax=1,ay=0;
  if(target){const d=norm(target.x-u.x,target.y-u.y);ax=d.x;ay=d.y}
  else if(u.team==='red'){ax=-1;ay=0}

  if(!u.fairyActive)u.mana-=18;
  u.lastBlade=now;
  u.bladeT=.34;
  u.bladeAngle=Math.atan2(ay,ax);

  const range=92;
  const halfArc=Math.PI*.55; // about 198° total: generous half-circle feel
  let cut=0;

  for(const b of bullets){
    if(b.life<=0||b.team===u.team)continue;
    const dx=b.x-u.x,dy=b.y-u.y,dist=Math.hypot(dx,dy);
    if(dist>range)continue;
    let da=Math.atan2(dy,dx)-u.bladeAngle;
    while(da>Math.PI)da-=Math.PI*2;
    while(da<-Math.PI)da+=Math.PI*2;
    if(Math.abs(da)<=halfArc){
      b.life=0;
      spark(b.x,b.y);
      cut++;
    }
  }
  if(cut>0)flash(cut>=2?`${cut}発斬り！`:'弾を斬った！',420);
  return true;
}

function useTripleShot(u){
  if(!u||!u.alive)return false;
  const now=performance.now()/1000;
  if(now-u.lastTriple<.90){flash('3連射クールタイム',300);return false}
  if(u.dodgeT>0||u.dodgeRecover>0){flash('回避中は使えない',360);return false}
  if(!u.fairyActive&&u.mana<38){flash('魔力不足',360);return false}
  if(!nearest(u,enemies))return false;
  if(!u.fairyActive)u.mana-=38;u.lastTriple=now;
  const fire=()=>{if(!u.alive)return;const t=nearest(u,enemies);if(!t)return;const d=norm(t.x-u.x,t.y-u.y);bullets.push(new Bullet(u.x+d.x*23,u.y+d.y*23,d.x,d.y,u.team,false,t));};
  fire();setTimeout(fire,145);setTimeout(fire,290);return true;
}


function usePhaseShot(u){
  if(!u||!u.alive)return false;
  const now=performance.now()/1000;
  if(now-u.lastPhase<.55){flash('壁すり抜け弾クールタイム',300);return false}
  if(u.dodgeT>0||u.dodgeRecover>0){flash('回避中は使えない',360);return false}
  if(!u.fairyActive&&u.mana<24){flash('魔力不足',360);return false}
  const t=nearest(u,enemies);if(!t)return false;
  if(!u.fairyActive)u.mana-=24;u.lastPhase=now;
  const d=norm(t.x-u.x,t.y-u.y);
  bullets.push(new Bullet(u.x+d.x*23,u.y+d.y*23,d.x,d.y,u.team,false,t,'phase'));
  return true;
}

function useBounceShot(u){
  if(!u||!u.alive)return false;
  const now=performance.now()/1000;
  if(now-u.lastBounce<.55){flash('バウンド弾クールタイム',300);return false}
  if(u.dodgeT>0||u.dodgeRecover>0){flash('回避中は使えない',360);return false}
  if(!u.fairyActive&&u.mana<22){flash('魔力不足',360);return false}
  const t=nearest(u,enemies);if(!t)return false;
  if(!u.fairyActive)u.mana-=22;u.lastBounce=now;

  // Aim a little off-center so wall rebounds are easier to create.
  const d0=norm(t.x-u.x,t.y-u.y);
  const side=(Math.random()<.5?-1:1);
  const d=norm(d0.x-d0.y*.22*side,d0.y+d0.x*.22*side);
  bullets.push(new Bullet(u.x+d.x*23,u.y+d.y*23,d.x,d.y,u.team,false,t,'bounce'));
  return true;
}


function useBlastShot(u){
  if(!u||!u.alive)return false;
  const now=performance.now()/1000;
  if(now-u.lastBlast<.70){flash('爆裂弾クールタイム',300);return false}
  if(u.dodgeT>0||u.dodgeRecover>0||u.beastActive){flash('今は使えない',360);return false}
  if(!u.fairyActive&&u.mana<30){flash('魔力不足',360);return false}
  const t=nearest(u,enemies);if(!t)return false;
  if(!u.fairyActive)u.mana-=30;u.lastBlast=now;
  const d=norm(t.x-u.x,t.y-u.y);
  bullets.push(new Bullet(u.x+d.x*23,u.y+d.y*23,d.x,d.y,u.team,false,t,'blast'));
  return true;
}

function toggleRabbit(u){if(!u||!u.alive)return false;const n=performance.now()/1000;if(u.rabbitActive){u.rabbitActive=false;u.rabbitT=0;return true}if(n-u.lastRabbit<.6||u.mana<8)return false;if(!u.fairyActive)u.mana-=8;u.lastRabbit=n;u.rabbitActive=true;u.rabbitT=4;return true;}
function toggleBeast(u){
  if(!u||!u.alive)return false;
  if(u.beastActive){u.beastActive=false;return true}
  if(!u.fairyActive&&u.mana<10){if(u.controlled)flash('魔力不足',360);return false}
  if(!u.fairyActive)u.mana-=10;u.beastActive=true;return true;
}

function useInvis(u){if(!u||!u.alive)return false;const now=performance.now()/1000;if(now-u.lastInvis<1)return false;if(!u.fairyActive&&u.mana<28){flash('魔力不足',360);return false}if(!u.fairyActive)u.mana-=28;u.lastInvis=now;u.invisT=3;return true;}
function useSpread(u){
  if(!u||!u.alive)return false;
  const now=performance.now()/1000;
  if(now-u.lastSpread<.65)return false;
  if(!u.fairyActive&&u.mana<26){flash('魔力不足',360);return false}
  const t=nearest(u,enemies);if(!t)return false;
  if(!u.fairyActive)u.mana-=26;u.lastSpread=now;
  const d0=norm(t.x-u.x,t.y-u.y),base=Math.atan2(d0.y,d0.x);
  for(const off of [-.34,-.17,0,.17,.34]){
    const a=base+off,dx=Math.cos(a),dy=Math.sin(a);
    bullets.push(new Bullet(u.x+dx*23,u.y+dy*23,dx,dy,u.team,false,t,'spread'));
  }
  return true;
}
function useRightAngle(u){if(!u||!u.alive)return false;const now=performance.now()/1000;if(now-u.lastRightAngle<.65)return false;if(!u.fairyActive&&u.mana<23){flash('魔力不足',360);return false}const t=nearest(u,enemies);if(!t)return false;if(!u.fairyActive)u.mana-=23;u.lastRightAngle=now;const d=norm(t.x-u.x,t.y-u.y);bullets.push(new Bullet(u.x+d.x*23,u.y+d.y*23,d.x,d.y,u.team,false,t,'rightangle'));return true;}
function useLob(u){if(!u||!u.alive)return false;const now=performance.now()/1000;if(now-u.lastLob<.8)return false;if(!u.fairyActive&&u.mana<32){flash('魔力不足',360);return false}const t=nearest(u,enemies);if(!t)return false;if(!u.fairyActive)u.mana-=32;u.lastLob=now;createLob(u,t,u.team);return true;}
function useMine(u){if(!u||!u.alive)return false;const now=performance.now()/1000;if(now-u.lastMine<.55)return false;if(!u.fairyActive&&u.mana<20){flash('魔力不足',360);return false}if(!placeMine(u))return false;if(!u.fairyActive)u.mana-=20;u.lastMine=now;return true;}
function useJump(u){if(!u||!u.alive)return false;const now=performance.now()/1000;if(now-u.lastJump<.85){flash('ジャンプクールタイム',260);return false}if(!u.fairyActive&&u.mana<20){flash('魔力不足',360);return false}if(u.dodgeT>0||u.beastActive)return false;if(!u.fairyActive)u.mana-=20;u.lastJump=now;u.jumpT=1.05;u.inv=Math.max(u.inv,1.05);return true;}


function endClone(u,hitClone=false){
  if(!u||!u.cloneBody)return;
  const body=u.cloneBody;
  u.cloneBody=null;u.cloneT=0;
  u.x=body.x;u.y=body.y;
  if(hitClone)flash(u.controlled?'分身が消えた！':'分身消失',380);
}
function useClone(u){
  if(!u||!u.alive||u.cloneT>0)return false;
  const now=performance.now()/1000;
  if(now-u.lastClone<.9)return false;
  if(!u.fairyActive&&u.mana<50){if(u.controlled)flash('魔力不足',360);return false}
  if(!u.fairyActive)u.mana-=50;u.lastClone=now;
  u.cloneBody={x:u.x,y:u.y};
  u.cloneT=4.2;
  u.inv=Math.max(u.inv,.14);
  return true;
}

function useReflectBlade(u){
  if(!u||!u.alive)return false;
  const now=performance.now()/1000;
  if(now-u.lastReflectBlade<.8)return false;
  if(!u.fairyActive&&u.mana<24){if(u.controlled)flash('魔力不足',360);return false}

  const targets=u.team==='blue'?enemies:[player,...allies];
  const target=nearest(u,targets);
  let ax=u.team==='blue'?1:-1,ay=0;
  if(target){const d=norm(target.x-u.x,target.y-u.y);ax=d.x;ay=d.y}

  if(!u.fairyActive)u.mana-=24;u.lastReflectBlade=now;
  u.bladeT=.36;u.reflectBladeT=.36;u.bladeAngle=Math.atan2(ay,ax);

  const range=100,halfArc=Math.PI*.55;
  let reflected=0;
  for(const b of bullets){
    if(b.life<=0||b.team===u.team)continue;
    const dx=b.x-u.x,dy=b.y-u.y;
    if(Math.hypot(dx,dy)>range)continue;
    let da=Math.atan2(dy,dx)-u.bladeAngle;
    while(da>Math.PI)da-=Math.PI*2;
    while(da<-Math.PI)da+=Math.PI*2;
    if(Math.abs(da)>halfArc)continue;

    b.team=u.team;
    b.curve=false;b.curveTime=0;
    const t=nearest(u,targets);
    if(t){
      const d=norm(t.x-b.x,t.y-b.y);
      b.dx=d.x;b.dy=d.y;b.target=t;
    }else{
      b.dx*=-1;b.dy*=-1;
    }
    b.life=Math.max(b.life,1.4);
    spark(b.x,b.y);reflected++;
  }

  // Lobbed projectiles can also be cut back before landing.
  // Re-aim the landing point toward the opposing side.
  for(const l of lobShots){
    if(l.team===u.team)continue;
    const dx=l.x-u.x,dy=l.y-u.y;
    if(Math.hypot(dx,dy)>range+18)continue;
    let da=Math.atan2(dy,dx)-u.bladeAngle;
    while(da>Math.PI)da-=Math.PI*2;
    while(da<-Math.PI)da+=Math.PI*2;
    if(Math.abs(da)>halfArc)continue;

    l.team=u.team;
    const targets2=u.team==='blue'?enemies:[player,...allies];
    const t2=nearest(u,targets2);
    if(t2){l.tx=t2.x;l.ty=t2.y;}
    l.sx=l.x;l.sy=l.y;l.t=0;l.dur=.72;
    reflected++;
    spark(l.x,l.y);
  }

  if(reflected&&u.controlled)flash(`${reflected}発反射！`,420);
  return true;
}

function useWind(u){
  if(!u||!u.alive)return false;
  const now=performance.now()/1000;
  if(now-u.lastWind<1.0)return false;
  if(!u.fairyActive&&u.mana<32){if(u.controlled)flash('魔力不足',360);return false}
  if(!u.fairyActive)u.mana-=32;u.lastWind=now;
  const x=u.team==='blue'?COURT.x+COURT.w*.72:COURT.x+COURT.w*.28;
  windZones.push({x,y:CY,team:u.team,t:2.35,r:230});
  return true;
}

function updateWindZones(dt){
  for(const z of windZones){
    z.t-=dt;
    const targets=z.team==='blue'?enemies:[player,...allies];
    for(const u of targets){
      if(!u||!u.alive||u.jumpT>0||u.moleActive)continue;
      const dx=u.x-z.x,dy=u.y-z.y,d=Math.hypot(dx,dy);
      if(d<8||d>z.r)continue;
      const nx=dx/d,ny=dy/d;
      const power=(1-d/z.r)*92;
      const tx=u.x+nx*power*dt,ty=u.y+ny*power*dt;
      if(canStand(tx,u.y,u.r))u.x=tx;
      if(canStand(u.x,ty,u.r))u.y=ty;
    }
  }
  windZones=windZones.filter(z=>z.t>0);
}


function toggleFairy(u){
  if(!u||!u.alive)return false;
  const now=performance.now()/1000;
  if(u.fairyActive){u.fairyActive=false;u.shotCd=.85;return true}
  if(now-u.lastFairy<1.0)return false;
  if(!u.fairyActive&&u.mana<50){if(u.controlled)flash('魔力不足',360);return false}
  if(!u.fairyActive)u.mana-=50;u.lastFairy=now;u.fairyActive=true;u.shotCd=.10;
  u.rabbitActive=false;u.beastActive=false;u.moleActive=false;u.frogActive=false;u.frogTongueT=0;
  return true;
}
function fairyResetOtherCooldown(u,kind){
  if(!u||!u.fairyActive||kind==='fairy')return;
  const map={
    double:'lastDouble',blade:'lastBlade',triple:'lastTriple',phase:'lastPhase',
    bounce:'lastBounce',blast:'lastBlast',beast:'lastBeast',invis:'lastInvis',
    spread:'lastSpread',rightangle:'lastRightAngle',lob:'lastLob',mine:'lastMine',
    jump:'lastJump',clone:'lastClone',reflectblade:'lastReflectBlade',
    wind:'lastWind',mole:'lastMole',rabbit:'lastRabbit'
  };
  const p=map[kind];
  if(p)u[p]=-99;
}
function maintainFairyCooldowns(u){
  if(!u||!u.fairyActive)return;
  // 妖精化のもう1枠は「ほぼクールタイム無し」。
  // 技ごとの実装差に影響されないよう、各フレームで使用時刻を戻す。
  for(const p of [
    'lastDouble','lastBlade','lastTriple','lastPhase','lastBounce','lastBlast',
    'lastBeast','lastInvis','lastSpread','lastRightAngle','lastLob','lastMine',
    'lastJump','lastClone','lastReflectBlade','lastWind','lastMole','lastRabbit'
  ])u[p]=-99;
}


function shootBubble(u,target){if(!u||!u.alive||!target||!target.alive)return false;const now=performance.now()/1000;if(now-u.lastFrogBubble<.42)return false;if(!u.fairyActive&&u.mana<8){if(u.controlled)flash('魔力不足',260);return false}if(!u.fairyActive)u.mana-=8;u.lastFrogBubble=now;const d=norm(target.x-u.x,target.y-u.y);bullets.push(new Bullet(u.x+d.x*28,u.y+d.y*28,d.x,d.y,u.team,false,target,'bubble'));return true;}
function linePointDistance(px,py,ax,ay,bx,by){const vx=bx-ax,vy=by-ay,wx=px-ax,wy=py-ay,vv=vx*vx+vy*vy||1,t=clamp((wx*vx+wy*vy)/vv,0,1),x=ax+vx*t,y=ay+vy*t;return {d:Math.hypot(px-x,py-y),t};}
function useFrogTongue(u){if(!u||!u.alive||!u.frogActive)return false;const now=performance.now()/1000;if(now-u.lastFrogTongue<.9)return false;if(!u.fairyActive&&u.mana<10){if(u.controlled)flash('魔力不足',260);return false}if(!u.fairyActive)u.mana-=10;u.lastFrogTongue=now;u.frogTongueT=.28;const targets=u.team==='blue'?enemies:[player,...allies],t=nearest(u,targets),dir=t?norm(t.x-u.x,t.y-u.y):{x:u.team==='blue'?1:-1,y:0},ax=u.x,ay=u.y-3,bx=ax+dir.x*225,by=ay+dir.y*225;let eaten=0;for(const b of bullets){if(b.life<=0||b.team===u.team)continue;const q=linePointDistance(b.x,b.y,ax,ay,bx,by);if(q.d<=16+b.r){b.life=0;eaten++;}}let victim=null,best=2;for(const v of targets){if(!v||!v.alive||v.moleActive||v.jumpT>0)continue;const q=linePointDistance(v.x,v.y,ax,ay,bx,by);if(q.d<=16+v.r&&q.t<best){best=q.t;victim=v;}}if(victim){if(mode==='boss'&&victim.team==='red')bossTakeHit('bullet');else{const was=victim.controlled;victim.alive=false;spark(victim.x,victim.y);if(was){flash('丸呑み OUT!',420);transferControl();}else flash(victim.team==='red'?'ENEMY 丸呑み!':'ALLY 丸呑み!',520);checkEnd();}}if(u.controlled&&!victim)flash(eaten?`舌で弾を${eaten}発丸呑み！`:'舌！',280);return true;}
function launchMiniFrog(u){if(!u||!u.alive)return false;const now=performance.now()/1000;if(now-u.lastMiniFrog<4.2)return false;u.lastMiniFrog=now;const target=nearest(u,u.team==='red'?[player,...allies]:enemies);if(!target)return false;miniFrogs.push({x:u.x,y:u.y+14,team:u.team,target,r:10,life:7,dead:false,phase:Math.random()*6.28});return true;}
function updateMiniFrogs(dt){
  for(const m of miniFrogs){
    if(m.dead)continue;
    m.life-=dt;if(m.life<=0){m.dead=true;continue}
    if(!m.target||!m.target.alive)m.target=nearest({x:m.x,y:m.y},m.team==='red'?[player,...allies]:enemies);
    if(!m.target){m.dead=true;continue}
    m.phase+=dt*10;
    const d=norm(m.target.x-m.x,m.target.y-m.y);
    m.x+=d.x*112*dt;m.y+=d.y*112*dt;

    if(Math.hypot(m.x-m.target.x,m.y-m.target.y)<m.r+m.target.r+2&&m.target.inv<=0&&m.target.jumpT<=0){
      const v=m.target;
      m.dead=true;

      // HP制ボスはalive=falseにしない。ミニ蛙は低火力の削り攻撃だけ。
      if(mode==='boss'&&v.team==='red'&&v.bossKind){
        const now=performance.now()/1000;
        if(now>=(bossBattle?.nextMiniFrogDamageAt||0)){
          if(bossBattle)bossBattle.nextMiniFrogDamageAt=now+1.35;
          bossTakeHit('minifrog');
        }else{
          spark(v.x,v.y);
        }
        continue;
      }

      const was=v.controlled;
      v.alive=false;spark(v.x,v.y);
      if(was){flash('ミニ蛙に捕まった！',420);transferControl();}
      else flash(v.team==='red'?'ミニ蛙 HIT!':'ALLY OUT',500);
      checkEnd();
    }
  }
  miniFrogs=miniFrogs.filter(m=>!m.dead);
}

function toggleFrog(u){
  if(!u||!u.alive)return false;const now=performance.now()/1000;
  if(u.frogActive){u.frogActive=false;return true}
  if(now-u.lastFrog<.8)return false;
  if(!u.fairyActive&&u.mana<12){if(u.controlled)flash('魔力不足',300);return false}
  if(!u.fairyActive)u.mana-=12;u.lastFrog=now;u.frogActive=true;
  u.rabbitActive=false;u.beastActive=false;u.moleActive=false;u.fairyActive=false;
  u.frogTongueT=0;return true;
}
function toggleMole(u){
  if(!u||!u.alive)return false;const now=performance.now()/1000;
  if(u.moleActive){u.moleActive=false;u.moleT=0;return true}
  if(now-u.lastMole<1.0)return false;
  if(!u.fairyActive&&u.mana<22){if(u.controlled)flash('魔力不足',360);return false}
  if(!u.fairyActive)u.mana-=22;u.lastMole=now;u.moleActive=true;u.moleT=3.2;return true;
}
function usePlayerSpecial(kind){
  if(noSkillCup&&mode==='cup'){flash('この大会では特殊スキル使用禁止',300);return;}
  if(player&&player.frogMage){
    if(kind==='frog'){flash('本物のカエルなので元には戻れない！',380);return;}
  }
  if(!player||!player.alive)return;
  if(player.fairyActive&&kind!=='fairy')fairyResetOtherCooldown(player,kind);
  // カエル専用の「もう1枠=舌」は、実際に変身中だけ有効。
  if(player.frogActive&&kind!=='frog'){useFrogTongue(player);return;}
  if(player.rabbitActive&&kind!=='rabbit'){flash('ウサギ化中は攻撃できない',360);return;}
  if(kind==='rabbit'){if(toggleRabbit(player))flash(player.rabbitActive?'ウサギ化！':'変身解除',300);return;}

  if(kind==='double'){
    if(useDoubleShot(player))flash('2連射！',420);
    return;
  }

  if(kind==='blade'){
    if(useManaBlade(player))flash('魔力剣！',300);
    return;
  }
  if(kind==='phase'){
    if(usePhaseShot(player))flash('壁すり抜け弾！',320);
    return;
  }
  if(kind==='bounce'){
    if(useBounceShot(player))flash('バウンド弾！',320);
    return;
  }
  if(kind==='blast'&&saveData.blastUnlocked){
    if(useBlastShot(player))flash('爆裂弾！',320);
    return;
  }
  if(kind==='beast'&&saveData.beastUnlocked){if(toggleBeast(player))flash(player.beastActive?'オオカミ化！':'オオカミ化解除',320);return;}
  if(kind==='invis'&&saveData.invisUnlocked){if(useInvis(player))flash('透明化！',320);return;}
  if(kind==='spread'&&saveData.spreadUnlocked){if(useSpread(player))flash('拡散弾！',320);return;}
  if(kind==='rightangle'&&saveData.rightAngleUnlocked){if(useRightAngle(player))flash('直角弾！',320);return;}
  if(kind==='lob'&&saveData.lobUnlocked){if(useLob(player))flash('放物線爆弾！',320);return;}
  if(kind==='mine'&&saveData.mineUnlocked){if(useMine(player))flash('地雷設置！',320);return;}
  if(kind==='jump'&&saveData.jumpUnlocked){if(useJump(player))flash('ジャンプ！',260);return;}
  if(kind==='clone'&&saveData.cloneUnlocked){if(useClone(player))flash('分身！',320);return;}
  if(kind==='reflectblade'&&saveData.reflectBladeUnlocked){if(useReflectBlade(player))flash('反射剣！',320);return;}
  if(kind==='wind'&&saveData.windUnlocked){if(useWind(player))flash('風起こし！',320);return;}
  if(kind==='mole'&&saveData.moleUnlocked){if(toggleMole(player))flash(player.moleActive?'モグラ化！':'地上へ！',320);return;}
  if(kind==='fairy'&&saveData.fairyUnlocked){if(toggleFairy(player))flash(player.fairyActive?'妖精化！':'妖精化解除',360);return;}
  if(kind==='frog'&&saveData.frogUnlocked){if(toggleFrog(player))flash(player.frogActive?'カエル化！':'カエル化解除',320);return;}
  if(kind==='triple'&&saveData.tripleUnlocked){if(useTripleShot(player))flash('3連射！',320);return;}

  if(kind==='shield'&&saveData.shieldUnlocked){
    if(useShield(player,true))flash('シールド！',420);
    return;
  }

  player.emote=.8;
  flash('✌',420);
}

bindTap('special1',()=>{
  if(player&&player.frogMage){useFrogTongue(player);return}
  usePlayerSpecial(saveData.specialSlot1||'none');
});
bindTap('special2',()=>{
  if(player&&player.frogMage){launchMiniFrog(player);return}
  usePlayerSpecial(saveData.specialSlot2||'none');
});


function returnFromPractice(){
  running=false;
  over=false;
  mode='menu';
  bullets=[];fx=[];mines=[];lobShots=[];
  pendingLearnMessage='';

  for(const id of ['result','cupPanel','cupEndPanel','skillSetPanel','allySkillPanel']){
    const el=$(id);if(el)el.classList.add('hidden');
  }

  bScore=0;rScore=0;round=1;
  score.textContent='0 - 0';
  roundLabel.textContent='ROUND 1';
  clock.textContent='1:00';

  refreshRecordUI();

  // Always reopen practice opponent selection after a practice match.
  $('menu').classList.add('hidden');
  updatePracticeMenu();
  $('practicePanel').classList.remove('hidden');

  const info=$('practiceTeamInfo');
  if(info){
    info.innerHTML='<b>練習試合終了</b><br>同じ相手へ再戦するか、別のチームを選べます。<br><br>'+info.innerHTML;
  }
}

function returnToMainMenu(){
  running=false;
  over=false;
  mode='menu';
  cupKind='beginner';
  cupIndex=0;
  currentOpponent='rush';
  bullets=[];
  fx=[];
  pendingLearnMessage='';

  for(const id of ['result','cupPanel','cupEndPanel','skillSetPanel','practicePanel','allySkillPanel']){
    const el=$(id);
    if(el)el.classList.add('hidden');
  }

  restoreAllCupButtons();
  showWorldMap();

  bScore=0;
  rScore=0;
  round=1;
  score.textContent='0 - 0';
  roundLabel.textContent='ROUND 1';
  clock.textContent='1:00';

  refreshRecordUI();
}

// world map v2.61
let mapX=20,mapY=27,mapMoveTimer=null;
const MAP_PLACES={home:{x:18,y:20},practice:{x:18,y:72},low:{x:52,y:70},mid:{x:78,y:48},high:{x:56,y:18},forest:{x:34,y:43},cave:{x:87,y:24},pond:{x:73,y:78},fairy:{x:58,y:21},wetlands:{x:79,y:61}};
const FIELD_BOSSES={forest:{name:'森番の巨狼',desc:'月影の森を荒らす巨大な魔獣。木立と岩を盾にして戦う。',hp:8,reward:'森駆けの加護'},silverwolf:{name:'銀影の迅狼',desc:'クリア後の月影の森に現れる超高速の銀狼。残像を残して駆け回り、時折爪の斬撃を飛ばす。',hp:22,reward:'風走りのブーツ'},managolem:{name:'蒼晶の魔導巨像',desc:'クリア後の晶石洞窟で目覚める巨大な魔導像。遅いが高耐久で、結晶弾を扇状に放つ。',hp:28,reward:'星脈の器'},
manadeer:{name:'泉脈の白鹿',desc:'クリア後の星雫の池に現れる精霊獣。素早く距離を取り、魔力の波紋を放つ。',hp:24,reward:'精霊の雫'},cave:{name:'地潜り晶獣モルグ',desc:'晶石洞窟に棲む地中魔獣。モグラ化で地面へ潜り、壁を無視して接近してくる。',hp:12,reward:'モグラ化'},pond:{name:'星沼の水竜',desc:'星雫の池に棲む水竜。',hp:14,reward:'水鏡の加護'},fairy:{name:'妖精女王ティタニア',desc:'三つの異変を越えた者だけが挑める強敵。高速の回転弾と連続魔法を操る。',hp:30,reward:'妖精化'},frogking:{name:'湿原王ガマグラン',desc:'大湿原の主。攻撃は単純だが、とにかく巨大でしぶとい。妖精化の火力を思い切り試せる。',hp:80,reward:'カエル化'}};
const FIELD_QUEST_ORDER=['forest','cave','pond','fairy'];let pendingBossKind=null,bossBattle=null;
function isPostGame(){
  return !!(saveData.gameCleared||saveData.grandmasterChampion);
}
function activeFieldQuest(){
  const c=saveData.fieldBossClears||[],a=Math.min(3,saveData.fieldQuestStage||0);
  for(let i=0;i<a;i++)if(!c.includes(FIELD_QUEST_ORDER[i]))return FIELD_QUEST_ORDER[i];
  if(['forest','cave','pond'].every(k=>c.includes(k))&&!c.includes('fairy'))return 'fairy';
  return null;
}
function updateFieldQuestMarks(){
  const a=activeFieldQuest();
  for(const k of FIELD_QUEST_ORDER){
    const e=$('quest'+k[0].toUpperCase()+k.slice(1));
    if(e)e.classList.toggle('on',k===a);
    const place=document.querySelector(`[data-place="${k}"]`);
    if(place)place.classList.toggle('clearedBossRematch',isPostGame()&&(saveData.fieldBossClears||[]).includes(k));
  }
  const fairyPlace=document.querySelector('[data-place="fairy"]');
  if(fairyPlace)fairyPlace.classList.toggle('rematchReady',(saveData.fieldBossClears||[]).includes('fairy'));
}

function updatePostgameBossChoices(kind,postgame){
  const silver=$('silverWolfStartBtn'),golem=$('manaGolemStartBtn'),deer=$('manaDeerStartBtn');
  if(silver)silver.classList.toggle('hidden',!(postgame&&kind==='forest'));
  if(golem)golem.classList.toggle('hidden',!(postgame&&kind==='cave'));
  if(deer)deer.classList.toggle('hidden',!(postgame&&kind==='pond'));
  const start=$('bossStartBtn');
  if(start)start.textContent=(postgame&&['forest','cave','pond'].includes(kind))?'通常ボスと再戦':'戦闘開始';
}

function openBossEvent(k){
  const b=FIELD_BOSSES[k];if(!b)return;
  const cleared=(saveData.fieldBossClears||[]).includes(k);
  const postgame=isPostGame();

  if((k==='fairy'&&cleared)||(postgame&&cleared)){
    pendingBossKind=k;
    $('worldMap').classList.add('hidden');
    const bonusChoice=(postgame&&['forest','cave','pond'].includes(k));
    updatePostgameBossChoices(k,postgame);
    $('bossTitle').textContent=bonusChoice
      ?(k==='forest'?'月影の森・クリア後':(k==='cave'?'晶石洞窟・クリア後':'星雫の池・クリア後'))
      :((k==='fairy'?'妖精女王ティタニア':b.name)+'・再戦');
    $('bossDesc').textContent=bonusChoice
      ?(k==='forest'
        ?'通常ボス再戦か、超高速の「銀影の迅狼」を選べます。'
        :(k==='cave'
          ?'通常ボス再戦か、最大MPを高める宝を守る「蒼晶の魔導巨像」を選べます。'
          :'通常ボス再戦か、魔力回復の宝を守る「泉脈の白鹿」を選べます。'))
      :`クリア後の再戦。${b.desc}`;
    $('bossPanel').classList.remove('hidden');
    return;
  }

  if(activeFieldQuest()!==k){
    $('mapPrompt').textContent=cleared?'この異変は解決済みです':'今は特に異変はないようです';
    return;
  }

  pendingBossKind=k;
  updatePostgameBossChoices(k,false);
  $('worldMap').classList.add('hidden');
  $('bossTitle').textContent=b.name;
  $('bossDesc').textContent=b.desc;
  $('bossPanel').classList.remove('hidden');
}
function bossTakeHit(source='bullet'){
  if(mode!=='boss'||!bossBattle||bossBattle.defeated)return false;

  const now=performance.now()/1000;
  const gap=source==='explosion'?.72:(source==='minifrog'?1.35:.30);
  if(now<(bossBattle.nextDamageAt||0))return false;
  bossBattle.nextDamageAt=now+gap;

  bossBattle.hp=Math.max(0,bossBattle.hp-1);
  flash(`BOSS HP ${bossBattle.hp}/${bossBattle.maxHp}　復活 ${bossBattle.revives}`,420);

  if(bossBattle.hp<=0){
    bossBattle.defeated=true;
    const k=bossBattle.kind,b=FIELD_BOSSES[k];
    if(!saveData.fieldBossClears.includes(k))saveData.fieldBossClears.push(k);

    let learned='';
    if(k==='cave'&&!saveData.moleUnlocked){
      saveData.moleUnlocked=true;saveData.moleProgress=3;learned='　モグラ化を習得！';
    }
    if(k==='frogking'){
      saveData.frogBossWins=(saveData.frogBossWins||0)+1;
      if(!saveData.frogUnlocked){saveData.frogUnlocked=true;learned='　カエル化を習得！　大ジャンプと舌が使える。……火力は高くない。';}
      else learned=`　ガマグラン撃破 ${saveData.frogBossWins}回目！`;
    }
    if(k==='fairy'){
      saveData.fairyBossWins=(saveData.fairyBossWins||0)+1;
      if(saveData.fairyBossWins>=1)saveData.wetlandsUnlocked=true;
      if(!saveData.fairyUnlocked){
        saveData.fairyUnlocked=true;
        learned='　妖精化を習得！';
      }else{
        learned=`　妖精女王撃破 ${saveData.fairyBossWins}回目！`;
      }
    }
    if(k==='silverwolf'){
      saveData.silverWolfWins=(saveData.silverWolfWins||0)+1;
      if(!saveData.speedBootsUnlocked){
        saveData.speedBootsUnlocked=true;
        learned='　「風走りのブーツ」を獲得！　通常移動速度がアップした。';
      }else{
        learned=`　銀影の迅狼 撃破 ${saveData.silverWolfWins}回目！`;
      }
    }
    if(k==='managolem'){
      saveData.manaGolemWins=(saveData.manaGolemWins||0)+1;
      if(!saveData.maxManaRelicUnlocked){
        saveData.maxManaRelicUnlocked=true;
        learned='　「星脈の器」を獲得！　最大MPが100 → 125になった。';
      }else{
        learned=`　蒼晶の魔導巨像 撃破 ${saveData.manaGolemWins}回目！`;
      }
    }
    if(k==='manadeer'){
      saveData.manaDeerWins=(saveData.manaDeerWins||0)+1;
      if(!saveData.manaRegenRelicUnlocked){
        saveData.manaRegenRelicUnlocked=true;
        learned='　「精霊の雫」を獲得！　MP自然回復速度がアップした。';
      }else{
        learned=`　泉脈の白鹿 撃破 ${saveData.manaDeerWins}回目！`;
      }
    }

    writeSave();
    running=false;over=true;
    bullets=[];lobShots=[];mines=[];windZones=[];

    setTimeout(()=>{
      running=false;over=false;mode='menu';
      bullets=[];lobShots=[];mines=[];windZones=[];miniFrogs=[];fx=[];
      bossBattle=null;
      for(const id of ['result','cupPanel','cupEndPanel','practicePanel','bossPanel']){
        const el=$(id);if(el)el.classList.add('hidden');
      }
      if(k==='frogking')showWetlands();else showWorldMap();
      flash(`${b.name}撃破！${learned||('　'+b.reward+'を獲得')}`,1600);
    },260);
  }
  return true;
}
function startFieldBoss(k){const b=FIELD_BOSSES[k];if(!b)return;
  setScreenMode('game');
  document.body.classList.add('bossMode');
  const rematchBonus=(k==='fairy'&&saveData.fairyBossWins>0)?Math.min(15,(saveData.fairyBossWins||0)*3):0;
  const bossMaxHp=b.hp+rematchBonus;
  $('bossPanel').classList.add('hidden');
  bossBattle={kind:k,hp:bossMaxHp,maxHp:bossMaxHp,revives:2,nextDamageAt:0,nextMiniFrogDamageAt:0,defeated:false};mode='boss';cupKind='beginner';currentOpponent='rush';bScore=0;rScore=0;round=1;reset();setBossStage(k);if(enemies.length>1)enemies.splice(1);if(enemies[0]){
    enemies[0].r=k==='frogking'?68:(k==='fairy'?52:(k==='cave'?46:(k==='silverwolf'?44:(k==='managolem'?58:(k==='manadeer'?43:42)))));
    enemies[0].speed*=k==='frogking'?.62:(k==='fairy'?1.08:(k==='cave'?.90:(k==='silverwolf'?2.45:(k==='managolem'?.58:(k==='manadeer'?1.35:.82)))));
    enemies[0].inv=.2;
    enemies[0].bossKind=k;
    enemies[0].bossShotAt=performance.now()/1000+1.2;
    enemies[0].bossBurrowAt=performance.now()/1000+2.4;
    if(k==='silverwolf'){
      enemies[0].bossShotAt=performance.now()/1000+3.2;
      enemies[0].afterimages=[];
      enemies[0].lastAfterimageAt=0;
      enemies[0].role='balance';
    }
    if(k==='managolem'){enemies[0].bossShotAt=performance.now()/1000+1.8;enemies[0].shotCd=.25;enemies[0].mana=100;}
    if(k==='manadeer'){enemies[0].bossShotAt=performance.now()/1000+1.9;enemies[0].shotCd=.35;enemies[0].mana=100;}
    if(k==='fairy'){enemies[0].shotCd=.10;enemies[0].mana=100;}if(k==='frogking'){enemies[0].shotCd=.5;enemies[0].mana=100;}
  }left=k==='frogking'?180:(k==='fairy'?120:((k==='silverwolf'||k==='managolem'||k==='manadeer')?120:90));clock.textContent='BOSS';flash(`${b.name}　HP ${bossMaxHp} / 復活 2`,1000)}

function showWetlands(){
  setScreenMode('wetlands');
  document.body.classList.remove('bossMode');setBossStage(null);running=false;$('worldMap').classList.add('hidden');$('wetlandsMap').classList.remove('hidden')}
function leaveWetlands(){$('wetlandsMap').classList.add('hidden');showWorldMap();mapX=80;mapY=73;updateMapAvatar()}
function inspectFrogKing(){
  pendingBossKind='frogking';$('wetlandsMap').classList.add('hidden');
  $('bossTitle').textContent=saveData.frogBossWins>0?'湿原王ガマグラン・再戦':'湿原王ガマグラン';
  $('bossDesc').textContent=`HP80の超耐久ボス。攻撃は妖精女王ほど苛烈ではない。撃破回数 ${saveData.frogBossWins||0}回。`;
  $('bossPanel').classList.remove('hidden');
}


function setScreenMode(kind){
  document.body.classList.remove('screenGame','screenWorld','screenWetlands','screenEnding');
  if(kind==='game')document.body.classList.add('screenGame');
  else if(kind==='world')document.body.classList.add('screenWorld');
  else if(kind==='wetlands')document.body.classList.add('screenWetlands');
  else if(kind==='ending')document.body.classList.add('screenEnding');
}

function showEnding(){
  setScreenMode('ending');
  document.body.classList.remove('bossMode');
  running=false;
  // 表示した時点で視聴済みにする。再戦後に何度も強制表示しない。
  saveData.endingSeen=true;
  writeSave();

  for(const id of ['worldMap','menu','practicePanel','cupPanel','cupEndPanel','result','skillSetPanel','allySkillPanel','bossPanel']){
    const e=$(id);if(e)e.classList.add('hidden');
  }
  const p=$('endingPanel');if(p)p.classList.remove('hidden');
}
function continueAfterEnding(){
  const p=$('endingPanel');
  if(p&&p.classList.contains('hidden'))return;
  saveData.endingSeen=true;
  writeSave();
  if(p)p.classList.add('hidden');
  showWorldMap();
  flash('各地のボスと何度でも再戦できます',1400);
}

function showWorldMap(){
  if(mode!=='cup'){noSkillCup=false;document.body.classList.remove('noSkillCupMode');}
  setScreenMode('world');
  clearMapStick();
  document.body.classList.remove('bossMode');
  setBossStage(null);

  running=false;mode='menu';
  for(const id of ['menu','practicePanel','cupPanel','cupEndPanel','result','skillSetPanel','allySkillPanel','bossPanel']){const e=$(id);if(e)e.classList.add('hidden')}
  $('worldMap').classList.remove('hidden');
  if(isPostGame())saveData.wetlandsUnlocked=true;
  const wg=document.querySelector('[data-place="wetlands"]');if(wg)wg.classList.toggle('hidden',!saveData.wetlandsUnlocked);
  updateFieldQuestMarks();updateMapSkillButtons();updateMapAvatar();
}

let mapNearPlace=null,mapJoyX=0,mapJoyY=0,mapJoyPointer=null;
let mapFieldForm='none',mapFieldFormUntil=0,mapFieldJumpUntil=0;

function mapPlaceName(kind){
  const e=document.querySelector(`[data-place="${kind}"] b`);
  return e?e.textContent:kind;
}
function updateMapSkillButtons(){
  const kinds=[saveData.specialSlot1||'double',saveData.specialSlot2||'rabbit'];
  const labels=k=>specialName(k)||'なし';
  const b1=$('mapSpecial1'),b2=$('mapSpecial2');
  const frogTeam=saveData.playerTeamStyle==='frog'&&saveData.frogTeamUnlocked;
  if(b1)b1.innerHTML=frogTeam?'舌<small>長舌</small>':`Ⅰ<small>${labels(kinds[0])}</small>`;
  if(b2)b2.innerHTML=frogTeam?'蛙<small>ミニ蛙</small>':`Ⅱ<small>${labels(kinds[1])}</small>`;
  const d=$('mapDodgeBtn');
  if(d)d.innerHTML=mapFieldForm==='fairy'?'浮<small>浮遊</small>':(mapFieldForm==='frog'?'蛙<small>大ジャンプ</small>':(mapFieldForm==='rabbit'?'跳<small>ジャンプ</small>':'↻<small>移動技</small>'));
}


let mapAvatarUnit=null;
function ensureMapAvatarUnit(){
  if(mapAvatarUnit)return mapAvatarUnit;
  mapAvatarUnit=new Unit(76,82,'blue',true,'balance');
  mapAvatarUnit.controlled=true;mapAvatarUnit.alive=true;mapAvatarUnit.inv=0;mapAvatarUnit.team='blue';mapAvatarUnit.outfitKey=null;
  return mapAvatarUnit;
}
function drawMapFieldAvatar(){
  const cv=$('mapFieldAvatarCanvas');if(!cv)return;
  const u=ensureMapAvatarUnit(),ctx=cv.getContext('2d'),now=performance.now();
  cv.style.left=mapX+'%';cv.style.top=mapY+'%';
  cv.style.transform=now<mapFieldJumpUntil?'translate(-50%,-82%)':'translate(-50%,-58%)';
  ctx.clearRect(0,0,cv.width,cv.height);
  u.x=76;u.y=82;u.alive=true;u.controlled=true;u.inv=0;u.team='blue';u.outfitKey=null;
  const fieldFrogTeam=saveData.playerTeamStyle==='frog'&&saveData.frogTeamUnlocked;
  u.rabbitActive=!fieldFrogTeam&&mapFieldForm==='rabbit';
  u.beastActive=!fieldFrogTeam&&mapFieldForm==='wolf';
  u.moleActive=!fieldFrogTeam&&mapFieldForm==='mole';
  u.fairyActive=!fieldFrogTeam&&mapFieldForm==='fairy';
  u.frogMage=fieldFrogTeam;
  u.frogActive=fieldFrogTeam||mapFieldForm==='frog';
  u.jumpT=now<mapFieldJumpUntil?.5:0;u.isMoving=Math.abs(mapJoyX)>.08||Math.abs(mapJoyY)>.08;
  if(u.isMoving)u.runPhase=(u.runPhase||0)+.18;
  const old=g;try{g=ctx;drawUnit(u)}finally{g=old}
}

function updateMapAvatar(){
  const a=$('mapAvatar');if(!a)return;
  const now=performance.now();
  if(mapFieldForm!=='none'&&mapFieldFormUntil&&now>mapFieldFormUntil){mapFieldForm='none';mapFieldFormUntil=0}
  const jumping=now<mapFieldJumpUntil;
  a.style.left=mapX+'%';a.style.top=mapY+'%';
  a.className='';
  a.id='mapAvatar';
  if(mapFieldForm!=='none')a.classList.add('mapForm-'+mapFieldForm);
  if(jumping)a.classList.add('mapJumping');

  let near=null,best=999;
  for(const [k,p] of Object.entries(MAP_PLACES)){
    const d=Math.hypot(mapX-p.x,mapY-p.y);
    if(d<best){best=d;near=k}
  }
  mapNearPlace=best<11?near:null;

  const prompt=$('mapPrompt'),enter=$('mapEnterBtn'),label=$('mapNearbyLabel');
  if(mapNearPlace){
    const q=FIELD_QUEST_ORDER.includes(mapNearPlace)&&activeFieldQuest()===mapNearPlace;
    const p=MAP_PLACES[mapNearPlace];
    const name=mapPlaceName(mapNearPlace);
    prompt.textContent=(q?'！ 異変発生　':'')+`「${name}」　右の「入る」`;
    prompt.classList.add('ready');
    if(enter)enter.classList.add('ready');
    if(label){
      label.textContent=(q?'！ ':'')+name;
      label.style.left=p.x+'%';label.style.top=(p.y-7)+'%';label.classList.add('on');
    }
  }else{
    prompt.textContent='建物や森・洞窟・池へ近づいてください';
    prompt.classList.remove('ready');
    if(enter)enter.classList.remove('ready');
    if(label)label.classList.remove('on');
  }
  drawMapFieldAvatar();
  updateMapSkillButtons();
}

function mapSpeed(){
  if(mapFieldForm==='wolf')return 1.9;
  if(mapFieldForm==='rabbit')return 1.22;
  if(mapFieldForm==='mole')return 1.3;
  if(mapFieldForm==='fairy')return 1.35;
  if(mapFieldForm==='frog')return .92;
  return 1;
}
function moveMap(dx,dy){
  const s=mapSpeed();
  mapX=Math.max(5,Math.min(94,mapX+dx*s));
  mapY=Math.max(9,Math.min(88,mapY+dy*s));
  updateMapAvatar();
}

function startFrogMageChallenge(){
  setScreenMode('game');running=false;over=false;fieldFrogMatch=true;mode='practice';cupKind='beginner';currentOpponent='frogmages';bScore=0;rScore=0;round=1;score.textContent='0 - 0';$('worldMap').classList.add('hidden');reset();flash('池のカエル魔導師チームが勝負を挑んできた！',1000);}
function enterMapPlace(kind,force=false){
  const p=MAP_PLACES[kind];if(!p)return;
  if(!force&&Math.hypot(mapX-p.x,mapY-p.y)>=11){$('mapPrompt').textContent='もう少し近づいてください';return}
  if(kind==='wetlands'){if(!saveData.wetlandsUnlocked){flash('まだ霧が濃くて進めない',450);return}showWetlands();return}
  if(kind==='pond'&&mapFieldForm==='frog'&&saveData.frogUnlocked){startFrogMageChallenge();return}
  if(FIELD_QUEST_ORDER.includes(kind)){openBossEvent(kind);return}
  $('worldMap').classList.add('hidden');
  if(kind==='home'){$('menu').classList.remove('hidden');refreshRecordUI();return}
  if(kind==='practice'){updatePracticeMenu();$('practicePanel').classList.remove('hidden');return}
  $('menu').classList.remove('hidden');refreshRecordUI();
  const ids=kind==='low'?['cupStartBtn','rookieBtn']:kind==='mid'?['advancedBtn','expertBtn']:['masterBtn','grandmasterBtn'];
  for(const id of ['cupStartBtn','rookieBtn','advancedBtn','expertBtn','masterBtn','grandmasterBtn']){const e=$(id);if(e)e.style.display=ids.includes(id)?'':'none'}
  const info=document.querySelector('#menu .cupInfo small');
  if(info)info.textContent=kind==='low'?'星見の競技場：ビギナー / ルーキー':kind==='mid'?'蒼塔アリーナ：アドバンス / エキスパート':'天空大闘技場：マスター / グランドマスター';
}
function restoreAllCupButtons(){for(const id of ['cupStartBtn','rookieBtn','advancedBtn','expertBtn','masterBtn','grandmasterBtn']){const e=$(id);if(e)e.style.display=''}}

function useFieldSkill(kind){
  const now=performance.now();
  if(kind==='rabbit'){
    if(mapFieldForm==='rabbit'){mapFieldForm='none';mapFieldFormUntil=0}
    else{mapFieldForm='rabbit';mapFieldFormUntil=now+4000}
    updateMapAvatar();return;
  }
  if(kind==='beast'){
    if(mapFieldForm==='wolf'){mapFieldForm='none';mapFieldFormUntil=0}
    else{mapFieldForm='wolf';mapFieldFormUntil=0}
    updateMapAvatar();return;
  }
  if(kind==='mole'){
    if(mapFieldForm==='mole'){mapFieldForm='none';mapFieldFormUntil=0}
    else{mapFieldForm='mole';mapFieldFormUntil=now+3200}
    updateMapAvatar();return;
  }
  if(kind==='fairy'){
    if(!saveData.fairyUnlocked){flash('まだ習得していません',350);return}
    mapFieldForm=mapFieldForm==='fairy'?'none':'fairy';mapFieldFormUntil=0;updateMapAvatar();return;
  }
  if(kind==='frog'){
    if(!saveData.frogUnlocked){flash('まだ習得していません',350);return}
    mapFieldForm=mapFieldForm==='frog'?'none':'frog';mapFieldFormUntil=0;updateMapAvatar();return;
  }
  if(kind==='jump'){
    mapFieldJumpUntil=now+900;updateMapAvatar();return;
  }
  flash('この技はフィールドでは使えません',420);
}
function useFieldSlot(slot){
  const kind=slot===1?(saveData.specialSlot1||'double'):(saveData.specialSlot2||'rabbit');
  useFieldSkill(kind);
}

// circular analogue joystick
const mapStickZone=$('mapStickZone'),mapStickKnob=$('mapStickKnob');

function setMapStickPoint(clientX,clientY){
  if(!mapStickZone||!mapStickKnob)return;
  const r=mapStickZone.getBoundingClientRect();
  const cx=r.left+r.width/2,cy=r.top+r.height/2;
  let dx=clientX-cx,dy=clientY-cy;
  const max=Math.max(30,Math.min(r.width,r.height)*.31);
  const len=Math.hypot(dx,dy);
  if(len>max){dx=dx/len*max;dy=dy/len*max}
  mapJoyX=dx/max;
  mapJoyY=dy/max;
  mapStickKnob.style.transform=`translate(${dx}px,${dy}px)`;
}

function clearMapStick(e){
  if(e&&mapJoyPointer!==null&&e.pointerId!==undefined&&e.pointerId!==mapJoyPointer)return;
  mapJoyPointer=null;
  mapJoyX=0;mapJoyY=0;
  if(mapStickKnob)mapStickKnob.style.transform='translate(0px,0px)';
}

if(mapStickZone){
  // Pointer Events: Chrome/Android primary path.
  mapStickZone.addEventListener('pointerdown',e=>{
    e.preventDefault();e.stopPropagation();
    mapJoyPointer=e.pointerId;
    try{mapStickZone.setPointerCapture(e.pointerId)}catch(_){}
    setMapStickPoint(e.clientX,e.clientY);
  },{passive:false});

  mapStickZone.addEventListener('pointermove',e=>{
    if(mapJoyPointer===null||e.pointerId!==mapJoyPointer)return;
    e.preventDefault();e.stopPropagation();
    setMapStickPoint(e.clientX,e.clientY);
  },{passive:false});

  mapStickZone.addEventListener('pointerup',e=>{e.preventDefault();clearMapStick(e)},{passive:false});
  mapStickZone.addEventListener('pointercancel',e=>{e.preventDefault();clearMapStick(e)},{passive:false});
  mapStickZone.addEventListener('lostpointercapture',()=>clearMapStick());

  // Touch fallback for browsers/webviews where pointer capture is unreliable.
  mapStickZone.addEventListener('touchstart',e=>{
    if(!e.touches.length)return;
    e.preventDefault();e.stopPropagation();
    const t=e.touches[0];
    mapJoyPointer='touch';
    setMapStickPoint(t.clientX,t.clientY);
  },{passive:false});

  mapStickZone.addEventListener('touchmove',e=>{
    if(mapJoyPointer!=='touch'||!e.touches.length)return;
    e.preventDefault();e.stopPropagation();
    const t=e.touches[0];
    setMapStickPoint(t.clientX,t.clientY);
  },{passive:false});

  mapStickZone.addEventListener('touchend',e=>{e.preventDefault();clearMapStick()},{passive:false});
  mapStickZone.addEventListener('touchcancel',()=>clearMapStick(),{passive:false});
}

// Move from the actual joystick state every animation frame.
// This avoids timer throttling and keeps movement working after screen-mode changes.
let lastMapFrame=performance.now();
function mapMovementFrame(now){
  const dt=Math.min(.05,Math.max(0,(now-lastMapFrame)/1000));
  lastMapFrame=now;
  const wm=$('worldMap');
  if(wm&&!wm.classList.contains('hidden')&&(Math.abs(mapJoyX)>.05||Math.abs(mapJoyY)>.05)){
    // approximately the same speed as the old 32ms timer, now frame-rate independent
    moveMap(mapJoyX*17.2*dt,mapJoyY*17.2*dt);
  }
  requestAnimationFrame(mapMovementFrame);
}
requestAnimationFrame(mapMovementFrame);

bindTap('noSkillCupBtn',()=>startNoSkillCup());
bindTap('mapEnterBtn',()=>{if(mapNearPlace)enterMapPlace(mapNearPlace)});
bindTap('mapSpecial1',()=>useFieldSlot(1));
bindTap('mapSpecial2',()=>useFieldSlot(2));
bindTap('mapDodgeBtn',()=>{
  const now=performance.now();
  if(mapFieldForm==='fairy'){mapFieldJumpUntil=now+1350;updateMapAvatar();return}
  if(mapFieldForm==='frog'){mapFieldJumpUntil=now+1650;updateMapAvatar();flash('大大大ジャンプ！',220);return}
  if(mapFieldForm==='rabbit'){mapFieldJumpUntil=now+650;updateMapAvatar();return}
  if((saveData.specialSlot1==='jump'||saveData.specialSlot2==='jump')){mapFieldJumpUntil=now+900;updateMapAvatar();return}
  flash('変身・ジャンプ装備に応じた移動技を使えます',420);
});

window.addEventListener('keydown',e=>{
  if($('worldMap')&&!$('worldMap').classList.contains('hidden')){
    const d={ArrowUp:[0,-2.3],w:[0,-2.3],ArrowDown:[0,2.3],s:[0,2.3],ArrowLeft:[-2.3,0],a:[-2.3,0],ArrowRight:[2.3,0],d:[2.3,0]}[e.key];
    if(d){e.preventDefault();moveMap(...d)}
    if(e.key==='Enter'&&mapNearPlace){e.preventDefault();enterMapPlace(mapNearPlace)}
  }
});

// menu / cup v2.15
function bindTap(id,fn){const el=$(id);if(!el)return;let fired=false;el.addEventListener('pointerup',e=>{e.preventDefault();fired=true;fn()},{passive:false});el.addEventListener('click',e=>{if(fired){fired=false;return}e.preventDefault();fn()})}

bindTap('wetlandsReturn',()=>leaveWetlands());bindTap('frogKingPlace',()=>inspectFrogKing());
bindTap('endingContinueBtn',()=>continueAfterEnding());
bindTap('endingCloseBtn',()=>continueAfterEnding());
bindTap('silverWolfStartBtn',()=>{
  pendingBossKind='silverwolf';
  startFieldBoss('silverwolf');
});
bindTap('manaGolemStartBtn',()=>{pendingBossKind='managolem';startFieldBoss('managolem');});
bindTap('manaDeerStartBtn',()=>{pendingBossKind='manadeer';startFieldBoss('manadeer');});
bindTap('bossBackBtn',()=>{$('bossPanel').classList.add('hidden');if(pendingBossKind==='frogking')showWetlands();else showWorldMap()});bindTap('bossStartBtn',()=>{if(pendingBossKind)startFieldBoss(pendingBossKind)});
bindTap('homeMapBtn',()=>{restoreAllCupButtons();showWorldMap()});
bindTap('practiceMapBtn',()=>{showWorldMap()});
bindTap('allySkillBtn',()=>{
  refreshPlayerSkillSelectors();
  $('menu').classList.add('hidden');
  $('allySkillPanel').classList.remove('hidden');
});
bindTap('allySkillSaveBtn',()=>{
  saveAllySkills();
  $('allySkillPanel').classList.add('hidden');
  $('menu').classList.remove('hidden');
  refreshRecordUI();
  flash('味方スキルを保存',450);
});
bindTap('allySkillCloseBtn',()=>{
  $('allySkillPanel').classList.add('hidden');
  $('menu').classList.remove('hidden');
});


const roleASelect=$('roleA'),roleBSelect=$('roleB');
const teamStyleSelect=$('playerTeamStyle');
if(teamStyleSelect)teamStyleSelect.addEventListener('change',()=>{
  if(teamStyleSelect.value==='frog'&&!saveData.frogTeamUnlocked){
    teamStyleSelect.value='human';
    flash('池のカエル魔導師チームに勝つと解放されます',520);
    return;
  }
  saveData.playerTeamStyle=teamStyleSelect.value;
  writeSave();refreshRecordUI();
});
if(roleASelect)roleASelect.addEventListener('change',()=>{saveData.allyRole1=roleASelect.value;writeSave();});
if(roleBSelect)roleBSelect.addEventListener('change',()=>{saveData.allyRole2=roleBSelect.value;writeSave();});

bindTap('skillSetBtn',()=>{
  updateSkillSetUI();
  $('menu').classList.add('hidden');
  $('skillSetPanel').classList.remove('hidden');
});
bindTap('skillSetSaveBtn',()=>{
  saveSkillSet();
  $('skillSetPanel').classList.add('hidden');
  $('menu').classList.remove('hidden');
  flash('特殊技セットを保存',450);
});
bindTap('skillSetCloseBtn',()=>{
  $('skillSetPanel').classList.add('hidden');
  $('menu').classList.remove('hidden');
});


bindTap('practiceCloseBtn',()=>{
  $('practicePanel').classList.add('hidden');
  $('menu').classList.remove('hidden');
});
bindTap('practiceStartBtn',()=>{
  running=false;
  over=false;
  const val=$('practiceTeamSelect').value;
  if(!val)return;
  const [kind,id]=val.split(':');
  mode='practice';
  // cupKind is used only to identify the opponent's league/skills during the practice match.
  // It must not turn the match into a tournament.
  cupKind=kind==='grandmaster'?'grandmaster':(kind==='master'?'master':(kind==='expert'?'expert':(kind==='advanced'?'advanced':(kind==='rookie'?'rookie':'beginner'))));
  currentOpponent=id;
  bScore=0;rScore=0;round=1;
  score.textContent='0 - 0';
  $('practicePanel').classList.add('hidden');
  reset();
});

bindTap('cupStartBtn',()=>{running=false;over=false;mode='cup';cupKind='beginner';cupIndex=0;cupTable=newCupTable();currentOpponent=CUP_ORDER[0];saveData.cupResume=null;writeSave();$('menu').classList.add('hidden');refreshCup();$('cupPanel').classList.remove('hidden');saveCupResume()});
bindTap('cupContinueBtn',()=>{
  const r=saveData.cupResume;
  if(!r)return;
  mode='cup';cupKind=r.cupKind||'beginner';cupIndex=r.cupIndex||0;cupTable=r.cupTable||newCupTable();
  if($('roleA')&&r.roleA)$('roleA').value=r.roleA;
  if($('roleB')&&r.roleB)$('roleB').value=r.roleB;
  currentOpponent=currentCupOrder()[cupIndex]||currentCupOrder()[0];
  $('menu').classList.add('hidden');
  refreshCup();
  $('cupPanel').classList.remove('hidden');
});
bindTap('rookieBtn',()=>{if(!saveData.rookieUnlocked)return;mode='cup';cupKind='rookie';cupIndex=0;cupTable=newCupTable();currentOpponent=ROOKIE_ORDER[0];saveData.cupResume=null;writeSave();$('menu').classList.add('hidden');refreshCup();$('cupPanel').classList.remove('hidden');saveCupResume()});

bindTap('advancedBtn',()=>{
  if(!saveData.advancedUnlocked)return;
  mode='cup';cupKind='advanced';cupIndex=0;cupTable=newCupTable();
  currentOpponent=ADVANCED_ORDER[0];
  saveData.cupResume=null;writeSave();
  $('menu').classList.add('hidden');
  refreshCup();$('cupPanel').classList.remove('hidden');saveCupResume();
});

bindTap('expertBtn',()=>{
  if(!saveData.expertUnlocked)return;
  mode='cup';cupKind='expert';cupIndex=0;cupTable=newCupTable();
  currentOpponent=EXPERT_ORDER[0];
  saveData.cupResume=null;writeSave();
  $('menu').classList.add('hidden');
  refreshCup();$('cupPanel').classList.remove('hidden');saveCupResume();
});
bindTap('masterBtn',()=>{if(!saveData.masterUnlocked)return;mode='cup';cupKind='master';cupIndex=0;cupTable=newCupTable();currentOpponent=MASTER_ORDER[0];saveData.cupResume=null;writeSave();$('menu').classList.add('hidden');refreshCup();$('cupPanel').classList.remove('hidden');saveCupResume();});

bindTap('grandmasterBtn',()=>{
  if(!saveData.grandmasterUnlocked)return;
  mode='cup';cupKind='grandmaster';cupIndex=0;cupTable=newCupTable();
  currentOpponent=GRANDMASTER_ORDER[0];
  saveData.cupResume=null;writeSave();
  $('menu').classList.add('hidden');refreshCup();$('cupPanel').classList.remove('hidden');saveCupResume();
});




bindTap('practiceBtn',()=>{
  mode='menu';
  updatePracticeMenu();
  $('cupPanel').classList.add('hidden');
  $('cupEndPanel').classList.add('hidden');
  $('result').classList.add('hidden');
  $('menu').classList.add('hidden');
  $('practicePanel').classList.remove('hidden');
});
bindTap('cupMatchBtn',()=>{currentOpponent=currentCupOrder()[cupIndex];markEncountered(cupKind,currentOpponent);bScore=0;rScore=0;round=1;score.textContent='0 - 0';$('cupPanel').classList.add('hidden');reset()});
bindTap('cupBackBtn',()=>{saveCupResume();restoreAllCupButtons();showWorldMap();refreshRecordUI();});
bindTap('cupFinishBtn',()=>{returnToMainMenu()});
bindTap('nextBtn',()=>{
  $('result').classList.add('hidden');
  const ended=bScore>=2||rScore>=2;
  if(!ended){round++;reset();return}
  if(mode==='cup'){
    // v3.05: 特殊スキル無し大会は通常大会表を使わない。
    // v3.01では cupTable=null のまま recordMatch() に入り、1試合終了後に例外停止していた。
    if(noSkillCup){
      if(bScore>rScore)saveData.totalWins++;
      else saveData.totalLosses++;
      writeSave();

      cupIndex++;
      if(cupIndex>=3){
        noSkillCup=false;
        document.body.classList.remove('noSkillCupMode');
        bScore=0;rScore=0;round=1;
        score.textContent='0 - 0';
        roundLabel.textContent='ROUND 1';
        clock.textContent='1:00';
        showWorldMap();
        flash('特殊スキル無し大会 終了！',1000);
        return;
      }

      // 次のチームへ直接進む。通常大会の standings / cupTable / cupResume は使用しない。
      bScore=0;rScore=0;round=1;
      score.textContent='0 - 0';
      roundLabel.textContent='ROUND 1';
      clock.textContent='1:00';
      reset();
      const names=['ラッシュ・ランナーズ','ガード・ライン','スターショッツ'];
      flash(`特殊スキル無し大会　第${cupIndex+1}試合：${names[cupIndex]}`,900);
      return;
    }

    recordMatch('player',currentCupOrder()[cupIndex],bScore,rScore);

    pendingLearnMessage='';
    if(bScore>rScore){
      saveData.totalWins++;
      {
        const msgs=[];
        if(opponentHasShield()){const m=gainShieldResearch();if(m)msgs.push(m);}
        if(opponentHasTriple()){const m=gainTripleResearch();if(m)msgs.push(m);}
        if(opponentHasBlade()){const m=gainBladeResearch();if(m)msgs.push(m);}
        if(opponentHasPhase()){const m=gainPhaseResearch();if(m)msgs.push(m);}
        if(opponentHasBounce()){const m=gainBounceResearch();if(m)msgs.push(m);}
        if(opponentHasBlast()){const m=gainBlastResearch();if(m)msgs.push(m);}
        if(opponentHasBeast()){const m=gainBeastResearch();if(m)msgs.push(m);}
        if(opponentHasKey('invisUsers')){const m=gainSimpleResearch('invis','透明化');if(m)msgs.push(m);}
        if(opponentHasKey('spreadUsers')){const m=gainSimpleResearch('spread','拡散弾');if(m)msgs.push(m);}
        if(opponentHasKey('rightAngleUsers')){const m=gainSimpleResearch('rightAngle','直角弾');if(m)msgs.push(m);}
        if(opponentHasKey('lobUsers')){const m=gainSimpleResearch('lob','放物線爆弾');if(m)msgs.push(m);}
        if(opponentHasKey('mineUsers')){const m=gainSimpleResearch('mine','地雷');if(m)msgs.push(m);}
        if(opponentHasKey('jumpUsers')){const m=gainSimpleResearch('jump','ジャンプ');if(m)msgs.push(m);}
        if(opponentHasKey('cloneUsers')){const m=gainSimpleResearch('clone','分身');if(m)msgs.push(m);}
        if(opponentHasKey('reflectBladeUsers')){const m=gainSimpleResearch('reflectBlade','反射の魔力剣');if(m)msgs.push(m);}
        if(opponentHasKey('windUsers')){const m=gainSimpleResearch('wind','風起こし');if(m)msgs.push(m);}
        if(opponentHasKey('moleUsers')){const m=gainSimpleResearch('mole','モグラ化');if(m)msgs.push(m);}
        pendingLearnMessage=[pendingLearnMessage,msgs.join(' / ')].filter(Boolean).join(' / ');
      }
    }else{
      saveData.totalLosses++;
    }

    cupIndex++;
    if(cupIndex>=currentCupOrder().length){
      finishCup();
      if(pendingLearnMessage){
        $('cupEndText').innerHTML += `<br><b>${pendingLearnMessage}</b>`;
        pendingLearnMessage='';
      }
    }else{
      saveCupResume();
      refreshCup();
      if(pendingLearnMessage){
        $('cupOpponent').innerHTML = `<b>${pendingLearnMessage}</b><br><br>` + $('cupOpponent').innerHTML;
        pendingLearnMessage='';
      }
      $('cupPanel').classList.remove('hidden');
    }
  }else if(mode==='practice'){
    pendingLearnMessage='';
    if(bScore>rScore){
      saveData.totalWins++;
      if(fieldFrogMatch&&!saveData.frogTeamUnlocked){
        saveData.frogTeamUnlocked=true;
        pendingLearnMessage='カエル魔導師チーム「リビット・ローブズ」が使用可能になった！';
      }
      {
        const msgs=[];
        if(opponentHasShield()){const m=gainShieldResearch();if(m)msgs.push(m);}
        if(opponentHasTriple()){const m=gainTripleResearch();if(m)msgs.push(m);}
        if(opponentHasBlade()){const m=gainBladeResearch();if(m)msgs.push(m);}
        if(opponentHasPhase()){const m=gainPhaseResearch();if(m)msgs.push(m);}
        if(opponentHasBounce()){const m=gainBounceResearch();if(m)msgs.push(m);}
        if(opponentHasBlast()){const m=gainBlastResearch();if(m)msgs.push(m);}
        if(opponentHasBeast()){const m=gainBeastResearch();if(m)msgs.push(m);}
        if(opponentHasKey('invisUsers')){const m=gainSimpleResearch('invis','透明化');if(m)msgs.push(m);}
        if(opponentHasKey('spreadUsers')){const m=gainSimpleResearch('spread','拡散弾');if(m)msgs.push(m);}
        if(opponentHasKey('rightAngleUsers')){const m=gainSimpleResearch('rightAngle','直角弾');if(m)msgs.push(m);}
        if(opponentHasKey('lobUsers')){const m=gainSimpleResearch('lob','放物線爆弾');if(m)msgs.push(m);}
        if(opponentHasKey('mineUsers')){const m=gainSimpleResearch('mine','地雷');if(m)msgs.push(m);}
        if(opponentHasKey('jumpUsers')){const m=gainSimpleResearch('jump','ジャンプ');if(m)msgs.push(m);}
        if(opponentHasKey('cloneUsers')){const m=gainSimpleResearch('clone','分身');if(m)msgs.push(m);}
        if(opponentHasKey('reflectBladeUsers')){const m=gainSimpleResearch('reflectBlade','反射の魔力剣');if(m)msgs.push(m);}
        if(opponentHasKey('windUsers')){const m=gainSimpleResearch('wind','風起こし');if(m)msgs.push(m);}
        if(opponentHasKey('moleUsers')){const m=gainSimpleResearch('mole','モグラ化');if(m)msgs.push(m);}
        pendingLearnMessage=[pendingLearnMessage,msgs.join(' / ')].filter(Boolean).join(' / ');
      }
    }else{
      saveData.totalLosses++;
    }
    writeSave();

    const learnMsg=pendingLearnMessage;
    if(fieldFrogMatch){fieldFrogMatch=false;$('result').classList.add('hidden');showWorldMap();mapX=73;mapY=72;updateMapAvatar();}else{returnFromPractice();}

    if(learnMsg){
      setTimeout(()=>flash(learnMsg,1300),120);
      pendingLearnMessage='';
    }
  }else{
    returnToMainMenu();
  }
});
for(const ev of ['contextmenu','selectstart','dragstart'])document.addEventListener(ev,e=>{if(e.target.closest('#gameWrap')||e.target.closest('button'))e.preventDefault()},{passive:false});
refreshRecordUI();
window.__gameDebug=()=>({mode,cupIndex,currentOpponent,enemies:enemies.length,aliveEnemies:enemies.filter(e=>e.alive).length,menuHidden:$('menu').classList.contains('hidden'),cupHidden:$('cupPanel').classList.contains('hidden'),running,saveData:JSON.parse(JSON.stringify(saveData))});
})();


setTimeout(()=>{if($('worldMap'))updateMapAvatar()},80);


window.addEventListener('DOMContentLoaded',()=>{
  const go=()=>continueAfterEnding();
  for(const id of ['endingContinueBtn','endingCloseBtn']){
    const el=$(id);
    if(!el)continue;
    el.addEventListener('click',go);
    el.addEventListener('pointerup',e=>{e.preventDefault();go();});
    el.addEventListener('touchend',e=>{e.preventDefault();go();},{passive:false});
  }
});
