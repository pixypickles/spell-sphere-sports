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



const c=document.getElementById('game'),g=c.getContext('2d');
const W=1280,H=720;
const COURT={x:190,y:72,w:900,h:576},CY=360;
const BLUE='#4d86ff',RED='#ff6c72',SKIN='#f4dfc3',EYE='#182239';

const walls=[
  // LEFT SIDE
  {x:355,y:165,w:20,h:125},
  {x:455,y:420,w:20,h:125},

  // CENTER — slightly larger
  {x:630,y:275,w:24,h:185},

  // RIGHT SIDE
  {x:825,y:165,w:20,h:125},
  {x:925,y:420,w:20,h:125}
];

const flagBlue={x:230,y:360},flagRed={x:1050,y:360};
const TEAMS={
  rush:{name:'ブルームランナーズ',desc:'旗取り型：前へ出る選手が多く、旗を積極的に狙います。',roles:['attacker','attacker','support']},
  guard:{name:'ストーンウォールズ',desc:'守備型：自陣旗と壁裏を重視して戦います。',roles:['guard','guard','shooter']},
  shoot:{name:'スターショッツ',desc:'射撃型：距離を取り、アウトを優先して狙います。',roles:['shooter','shooter','balance']}
};
const ROOKIE_TEAMS={
  shield:{name:'アズールガーディアンズ',desc:'シールド使い：魔力盾で1発だけ防ぎます。',roles:['guard','shooter','balance'],shieldUsers:[0]},
  rush:{name:'スカイランナーズ',desc:'機動型：前線を押し上げながらシールドも使います。',roles:['attacker','support','attacker'],shieldUsers:[1]},
  mix:{name:'ルーンスターズ',desc:'混成型：守備と射撃を切り替え、シールドで隙を補います。',roles:['guard','shooter','support'],shieldUsers:[2]},
  triple:{name:'トライボルト',desc:'連射型：予備動作のあと3発を連続で撃ちます。魔力剣ならまとめて斬れます。',roles:['shooter','balance','support'],shieldUsers:[],tripleUsers:[0]}
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
    desc:'獣化型：四足歩行のオオカミ型に変身して高速移動します。獣化中は投球・旗取得・回避不可。',
    roles:['attacker','balance','support'],
    beastUsers:[0]
  },
  blastbeast:{
    name:'ワイルドボマー',
    desc:'爆裂弾と獣化を組み合わせ、壁裏を崩して一気に距離を詰めます。',
    roles:['shooter','attacker','guard'],
    blastUsers:[0],
    beastUsers:[1]
  },
  apex:{
    name:'アークビースト',
    desc:'上位混成型：獣化と特殊弾を使い分けるエキスパートチーム。',
    roles:['balance','shooter','attacker'],
    beastUsers:[0],
    bounceUsers:[1]
  }
};
const MASTER_TEAMS={
  invis:{name:'ヴェイルシーカーズ',desc:'透明化型：一時的に姿を消して位置をずらします。',roles:['attacker','balance','support'],invisUsers:[0]},
  trick:{name:'トリックスターズ',desc:'変則弾型：ブーメラン弾と直角弾で回避先を狙います。',roles:['shooter','shooter','balance'],boomerangUsers:[0],rightAngleUsers:[1]},
  lob:{name:'スカイアーク',desc:'投射型：壁を越える放物線爆弾を投げ、着地点で爆発させます。',roles:['shooter','balance','guard'],lobUsers:[0,1]},
  mine:{name:'グリフマイナーズ',desc:'地雷型：魔法地雷を最大2個設置します。クリスタル付近には置けません。',roles:['guard','support','balance'],mineUsers:[0,1]},
  grand:{name:'グランドアルカナ',desc:'複合型：3人がそれぞれ透明化・ブーメラン弾・ジャンプを担当します。',roles:['balance','shooter','attacker'],invisUsers:[0],boomerangUsers:[1],jumpUsers:[2]}
};// v2.48: opponent-specific 2-3 color uniforms. Each team gets its own motif.
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
  'master:grand':   {base:'#392f56',sub:'#c39a48',accent:'#e6d8ff',pattern:'crown'}
};
function outfitFor(u){
  if(u.team==='blue')return {base:BLUE,sub:'#dceaff',accent:'#ffe66d',pattern:'player'};
  return OUTFITS[u.outfitKey]||{base:RED,sub:'#ffd4d7',accent:'#fff0f0',pattern:'bars'};
}



let player=null,allies=[],enemies=[],bullets=[],fx=[];
  if(!Array.isArray(saveData.playerSkills))saveData.playerSkills=['none','none','none'];
  player.specialKind=saveData.playerSkills[0]||'none';
  if(allies[0])allies[0].specialKind=saveData.playerSkills[1]||'none';
  if(allies[1])allies[1].specialKind=saveData.playerSkills[2]||'none';

let mines=[],lobShots=[];
let selectedTeam='rush',running=false,over=false,last=0,left=60,secAcc=0,bScore=0,rScore=0,round=1,msgUntil=0,pendingLearnMessage='';
let mode='menu',cupKind='beginner',cupIndex=0,cupTable=null,currentOpponent='rush';
const CUP_ORDER=['rush','guard','shoot'];
const ROOKIE_ORDER=['shield','rush','mix','triple'];
const ADVANCED_ORDER=['phase','bounce','hybrid','blast'];
const EXPERT_ORDER=['beast','blastbeast','apex'];
const MASTER_ORDER=['invis','trick','lob','mine','grand'];
const CUP_NAMES={player:'プレイヤーチーム',rush:TEAMS.rush.name,guard:TEAMS.guard.name,shoot:TEAMS.shoot.name};
function currentCupOrder(){return cupKind==='master'?MASTER_ORDER:(cupKind==='expert'?EXPERT_ORDER:(cupKind==='advanced'?ADVANCED_ORDER:(cupKind==='rookie'?ROOKIE_ORDER:CUP_ORDER)))}
function opponentData(id){return cupKind==='master'?MASTER_TEAMS[id]:(cupKind==='expert'?EXPERT_TEAMS[id]:(cupKind==='advanced'?ADVANCED_TEAMS[id]:(cupKind==='rookie'?ROOKIE_TEAMS[id]:TEAMS[id])))}
const SAVE_KEY='magic_ball_save_v216';
let saveData=loadSave();

function defaultSave(){
  return{
    totalWins:0,totalLosses:0,beginnerWins:0,bestPlace:4,
    rookieUnlocked:false,cupResume:null,
    shieldProgress:0,shieldUnlocked:false,shieldEquipped:false,
    specialSlot1:'double',specialSlot2:'none',
    encounteredTeams:[],tripleProgress:0,tripleUnlocked:false,advancedUnlocked:false,phaseProgress:0,phaseUnlocked:false,bounceProgress:0,bounceUnlocked:false,expertUnlocked:false,blastProgress:0,blastUnlocked:false,beastProgress:0,beastUnlocked:false,masterUnlocked:false,playerSkills:['none','none','none'],invisProgress:0,invisUnlocked:false,boomerangProgress:0,boomerangUnlocked:false,rightAngleProgress:0,rightAngleUnlocked:false,lobProgress:0,lobUnlocked:false,mineProgress:0,mineUnlocked:false,jumpProgress:0,jumpUnlocked:false
  };
}
function loadSave(){
  try{
    const raw=localStorage.getItem(SAVE_KEY);
    if(!raw)return defaultSave();
    const parsed=JSON.parse(raw);
    const data=Object.assign(defaultSave(),parsed);
    if(!Array.isArray(data.encounteredTeams))data.encounteredTeams=[];
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

  const sp=$('shieldProgressText');
  if(sp){
    sp.innerHTML=
      (saveData.shieldUnlocked?'シールド　習得済み':`シールド　${saveData.shieldProgress||0}/3`)
      + '<br>' + (saveData.tripleUnlocked?'3連射　習得済み':`3連射　${saveData.tripleProgress||0}/3`)
      + '<br>' + (saveData.phaseUnlocked?'壁すり抜け弾　習得済み':`壁すり抜け弾　${saveData.phaseProgress||0}/3`)
      + '<br>' + (saveData.bounceUnlocked?'バウンド弾　習得済み':`バウンド弾　${saveData.bounceProgress||0}/3`)
      + '<br>' + (saveData.blastUnlocked?'爆裂弾　習得済み':`爆裂弾　${saveData.blastProgress||0}/3`)
      + '<br>' + (saveData.beastUnlocked?'獣化　習得済み':`獣化　${saveData.beastProgress||0}/3`)
      + '<br>' + (saveData.invisUnlocked?'透明化　習得済み':`透明化　${saveData.invisProgress||0}/3`)
      + '<br>' + (saveData.boomerangUnlocked?'ブーメラン弾　習得済み':`ブーメラン弾　${saveData.boomerangProgress||0}/3`)
      + '<br>' + (saveData.rightAngleUnlocked?'直角弾　習得済み':`直角弾　${saveData.rightAngleProgress||0}/3`)
      + '<br>' + (saveData.lobUnlocked?'放物線爆弾　習得済み':`放物線爆弾　${saveData.lobProgress||0}/3`)
      + '<br>' + (saveData.mineUnlocked?'地雷　習得済み':`地雷　${saveData.mineProgress||0}/3`)
      + '<br>' + (saveData.jumpUnlocked?'ジャンプ　習得済み':`ジャンプ　${saveData.jumpProgress||0}/3`);
    sp.classList.toggle('skillLearned',!!saveData.shieldUnlocked);
  }

  updateSpecialButtons();
}


function unlockedSkillChoices(){
  const a=[['none','なし']];
  const defs=[
    ['shield','シールド','shieldUnlocked'],
    ['double','2連射',null],
    ['triple','3連射','tripleUnlocked'],
    ['blade','魔力剣','bladeUnlocked'],
    ['phase','壁すり抜け弾','phaseUnlocked'],
    ['bounce','バウンド弾','bounceUnlocked'],
    ['blast','爆裂弾','blastUnlocked'],
    ['beast','獣化','beastUnlocked'],
    ['invis','透明化','invisUnlocked'],
    ['boomerang','ブーメラン弾','boomerangUnlocked'],
    ['rightangle','直角弾','rightAngleUnlocked'],
    ['lob','放物線爆弾','lobUnlocked'],
    ['mine','地雷','mineUnlocked'],
    ['jump','ジャンプ','jumpUnlocked']
  ];
  for(const [v,n,k] of defs)if(!k||saveData[k])a.push([v,n]);
  return a;
}
function refreshPlayerSkillSelectors(){
  if(!Array.isArray(saveData.playerSkills))saveData.playerSkills=['none','none','none'];
  const ids=['playerSkill','allyASkill','allyBSkill'];
  const choices=unlockedSkillChoices();
  ids.forEach((id,i)=>{
    const el=$(id);if(!el)return;
    const cur=saveData.playerSkills[i]||'none';
    el.innerHTML='';
    for(const [v,n] of choices){
      const o=document.createElement('option');o.value=v;o.textContent=n;el.appendChild(o);
    }
    el.value=choices.some(x=>x[0]===cur)?cur:'none';
    saveData.playerSkills[i]=el.value;
    el.onchange=()=>{saveData.playerSkills[i]=el.value;writeSave();};
  });
}
function specialName(kind){
  if(kind==='double')return '2連射';
  if(kind==='blade')return '魔力剣';
  if(kind==='phase')return '壁すり抜け弾';
  if(kind==='bounce')return 'バウンド弾';
  if(kind==='blast')return '爆裂弾';
  if(kind==='beast')return '獣化';
  if(kind==='invis')return '透明化';
  if(kind==='boomerang')return 'ブーメラン弾';
  if(kind==='rightangle')return '直角弾';
  if(kind==='lob')return '放物線爆弾';
  if(kind==='mine')return '地雷';
  if(kind==='jump')return 'ジャンプ';
  if(kind==='triple')return '3連射';
  if(kind==='shield')return 'シールド';
  return 'なし（✌）';
}
function updateSpecialButtons(){
  const slots=[saveData.specialSlot1||'none',saveData.specialSlot2||'none'];
  ['special1','special2'].forEach((id,i)=>{
    const el=$(id);
    if(!el)return;
    const kind=slots[i];
    if(kind==='double'){
      el.innerHTML='×2<small>2連射</small>';
    }else if(kind==='blade'){
      el.innerHTML='剣<small>魔力剣</small>';
    }else if(kind==='phase'){
      el.innerHTML='透<small>壁抜け</small>';
    }else if(kind==='bounce'){
      el.innerHTML='跳<small>バウンド</small>';
    }else if(kind==='blast'&&saveData.blastUnlocked){
      el.innerHTML='爆<small>爆裂弾</small>';
    }else if(kind==='beast'&&saveData.beastUnlocked){
      el.innerHTML='獣<small>獣化</small>';
    }else if(kind==='invis'&&saveData.invisUnlocked){el.innerHTML='透<small>透明化</small>';
    }else if(kind==='boomerang'&&saveData.boomerangUnlocked){el.innerHTML='戻<small>ブーメラン</small>';
    }else if(kind==='rightangle'&&saveData.rightAngleUnlocked){el.innerHTML='┐<small>直角弾</small>';
    }else if(kind==='lob'&&saveData.lobUnlocked){el.innerHTML='弧<small>放物線</small>';
    }else if(kind==='mine'&&saveData.mineUnlocked){el.innerHTML='雷<small>地雷</small>';
    }else if(kind==='jump'&&saveData.jumpUnlocked){el.innerHTML='跳<small>ジャンプ</small>';
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
  const boomerangOptionA=[...a.options].find(o=>o.value==='boomerang'),boomerangOptionB=[...b.options].find(o=>o.value==='boomerang');
  const rightAngleOptionA=[...a.options].find(o=>o.value==='rightangle'),rightAngleOptionB=[...b.options].find(o=>o.value==='rightangle');
  const lobOptionA=[...a.options].find(o=>o.value==='lob'),lobOptionB=[...b.options].find(o=>o.value==='lob');
  const mineOptionA=[...a.options].find(o=>o.value==='mine'),mineOptionB=[...b.options].find(o=>o.value==='mine');
  const jumpOptionA=[...a.options].find(o=>o.value==='jump'),jumpOptionB=[...b.options].find(o=>o.value==='jump');
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
  if(boomerangOptionA)boomerangOptionA.disabled=!saveData.boomerangUnlocked;if(boomerangOptionB)boomerangOptionB.disabled=!saveData.boomerangUnlocked;
  if(rightAngleOptionA)rightAngleOptionA.disabled=!saveData.rightAngleUnlocked;if(rightAngleOptionB)rightAngleOptionB.disabled=!saveData.rightAngleUnlocked;
  if(lobOptionA)lobOptionA.disabled=!saveData.lobUnlocked;if(lobOptionB)lobOptionB.disabled=!saveData.lobUnlocked;
  if(mineOptionA)mineOptionA.disabled=!saveData.mineUnlocked;if(mineOptionB)mineOptionB.disabled=!saveData.mineUnlocked;
  if(jumpOptionA)jumpOptionA.disabled=!saveData.jumpUnlocked;if(jumpOptionB)jumpOptionB.disabled=!saveData.jumpUnlocked;

  a.value=saveData.specialSlot1||'none';
  b.value=saveData.specialSlot2||'none';

  if(!saveData.shieldUnlocked){
    info.innerHTML='2連射：初期習得 / 魔力26消費 / 短い間隔で通常弾を2発 / 再使用 約0.65秒<br><br>魔力剣：初期習得 / 魔力18消費 / 前方半円の敵弾を消去 / 再使用 約0.75秒<br><br>壁すり抜け弾：アドバンスで習得 / 魔力24消費 / 壁を無視して直進 / 再使用 約0.55秒<br><br>バウンド弾：アドバンスで習得 / 魔力22消費 / 壁で最大4回反射 / 再使用 約0.55秒<br><br>シールド：未習得<br>ルーキーカップのシールド持ちチームに3勝すると使用できます。';
  }else{
    info.innerHTML='2連射：初期習得 / 魔力26消費 / 短い間隔で通常弾を2発 / 再使用 約0.65秒<br><br>魔力剣：初期習得 / 魔力18消費 / 前方半円の敵弾を消去 / 再使用 約0.75秒<br><br>壁すり抜け弾：アドバンスで習得 / 魔力24消費 / 壁を無視して直進 / 再使用 約0.55秒<br><br>バウンド弾：アドバンスで習得 / 魔力22消費 / 壁で最大4回反射 / 再使用 約0.55秒<br><br>シールド：魔力30消費 / 約3秒 / 魔力弾を1発防ぐと消失 / 再使用 約5.2秒';
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
  if(s1==='beast'&&!saveData.beastUnlocked)s1='none';
  if(s2==='beast'&&!saveData.beastUnlocked)s2='none';
  if(s1==='invis'&&!saveData.invisUnlocked)s1='none';if(s2==='invis'&&!saveData.invisUnlocked)s2='none';
  if(s1==='boomerang'&&!saveData.boomerangUnlocked)s1='none';if(s2==='boomerang'&&!saveData.boomerangUnlocked)s2='none';
  if(s1==='rightangle'&&!saveData.rightAngleUnlocked)s1='none';if(s2==='rightangle'&&!saveData.rightAngleUnlocked)s2='none';
  if(s1==='lob'&&!saveData.lobUnlocked)s1='none';if(s2==='lob'&&!saveData.lobUnlocked)s2='none';
  if(s1==='mine'&&!saveData.mineUnlocked)s1='none';if(s2==='mine'&&!saveData.mineUnlocked)s2='none';
  if(s1==='jump'&&!saveData.jumpUnlocked)s1='none';if(s2==='jump'&&!saveData.jumpUnlocked)s2='none';

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
    const data=kind==='master'?MASTER_TEAMS[id]:(kind==='expert'?EXPERT_TEAMS[id]:(kind==='advanced'?ADVANCED_TEAMS[id]:(kind==='rookie'?ROOKIE_TEAMS[id]:TEAMS[id])));
    if(data)list.push({kind,id,name:data.name,desc:data.desc});
  }
  return list;
}
function teamSkillList(kind,id){let d=kind==='master'?MASTER_TEAMS[id]:(kind==='expert'?EXPERT_TEAMS[id]:(kind==='advanced'?ADVANCED_TEAMS[id]:(kind==='rookie'?ROOKIE_TEAMS[id]:TEAMS[id])));if(!d)return ['特殊技なし'];const x=[];for(const [p,n] of [['shieldUsers','シールド'],['tripleUsers','3連射'],['phaseUsers','壁すり抜け弾'],['bounceUsers','バウンド弾'],['blastUsers','爆裂弾'],['beastUsers','獣化'],['invisUsers','透明化'],['boomerangUsers','ブーメラン弾'],['rightAngleUsers','直角弾'],['lobUsers','放物線爆弾'],['mineUsers','地雷'],['jumpUsers','ジャンプ']])if(d[p]&&d[p].length)x.push(n);return x.length?x:['特殊技なし'];}
function teamMemberSkillList(kind,id){
  const d=kind==='master'?MASTER_TEAMS[id]:(kind==='expert'?EXPERT_TEAMS[id]:(kind==='advanced'?ADVANCED_TEAMS[id]:(kind==='rookie'?ROOKIE_TEAMS[id]:TEAMS[id])));
  if(!d)return ['特殊技なし','特殊技なし','特殊技なし'];
  const out=['特殊技なし','特殊技なし','特殊技なし'];
  const defs=[['shieldUsers','シールド'],['tripleUsers','3連射'],['phaseUsers','壁すり抜け弾'],['bounceUsers','バウンド弾'],['blastUsers','爆裂弾'],['beastUsers','獣化'],['invisUsers','透明化'],['boomerangUsers','ブーメラン弾'],['rightAngleUsers','直角弾'],['lobUsers','放物線爆弾'],['mineUsers','地雷'],['jumpUsers','ジャンプ']];
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
function refreshCup(){currentOpponent=currentCupOrder()[cupIndex];const d=opponentData(currentOpponent);$('cupTitle').textContent=`${cupKind==='master'?'マスター':(cupKind==='expert'?'エキスパート':(cupKind==='advanced'?'アドバンス':(cupKind==='rookie'?'ルーキー':'ビギナー')))} 第${cupIndex+1}試合`;$('cupOpponent').innerHTML=`次の相手：<b>${d.name}</b><br><small>${d.desc}</small>`;$('standings').innerHTML=tableHTML()}

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
  if(saveData.beastProgress>=3){saveData.beastUnlocked=true;writeSave();return '獣化 習得！';}
  writeSave();return `獣化 ${saveData.beastProgress}/3`;
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

function opponentHasShield(){
  if(cupKind!=='rookie')return false;
  const d=opponentData(currentOpponent);
  return !!(d&&d.shieldUsers&&d.shieldUsers.length);
}

function finishCup(){
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
  }else if(cupKind==='expert'){if(place===1)saveData.masterUnlocked=true;$('cupEndTitle').textContent=place===1?'エキスパートカップ優勝！':`エキスパートカップ ${place}位`;$('cupEndText').textContent=place===1?'マスターカップへの挑戦権を獲得しました！':'獣化の高速移動を読んで再挑戦しましょう。';}else{$('cupEndTitle').textContent=place===1?'マスターカップ優勝！':`マスターカップ ${place}位`;$('cupEndText').textContent=place===1?'変則技を使う強豪にも勝利！':'技の軌道と設置位置を読んで再挑戦しましょう。';}
  saveData.cupResume=null;writeSave();$('cupEndPanel').classList.remove('hidden');
}

let input={x:0,y:0},keys={},heldAt=0;

const $=id=>document.getElementById(id);

let introClosed=false;

function closeIntro(){
  if(introClosed)return;
  const intro=$('introScreen');
  if(!intro)return;
  introClosed=true;
  intro.classList.add('hidden');
  intro.style.display='none';
}

// Bind directly to the intro screen itself, plus keyboard fallback.
// This avoids browser/global pointer-event quirks on mobile.
function bindIntroStart(){
  const intro=$('introScreen');
  if(!intro)return;

  const go=(e)=>{
    if(e){
      e.preventDefault?.();
      e.stopPropagation?.();
    }
    closeIntro();
  };

  intro.addEventListener('pointerdown',go,{passive:false});
  intro.addEventListener('touchstart',go,{passive:false});
  intro.addEventListener('click',go);
  window.addEventListener('keydown',go);
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
    Object.assign(this,{x,y,team,controlled,role,r:17,alive:true,mana:100,lastShot:-9,shotCd:.85,lastDodge:-9,dodgeT:0,inv:0,dodgeRecover:0,dx:0,dy:0,emote:0,think:0,target:null,charging:false,chargeT:0,curveSide:1,rollAngle:0,strafeDir:(Math.random()<.5?-1:1),strafeTimer:0,shield:0,lastShield:-99,specialKind:null,shieldReact:-1,lastDouble:-99,lastBlade:-99,bladeT:0,bladeAngle:0,tripleReady:-1,lastTriple:-99,lastPhase:-99,lastBounce:-99,lastBlast:-99,lastBeast:-99,beastT:0,beastActive:false,lastInvis:-99,invisT:0,lastBoomerang:-99,lastRightAngle:-99,lastLob:-99,lastMine:-99,lastJump:-99,jumpT:0,outfitKey:null,runPhase:Math.random()*6.28,isMoving:false});
    this.speed=controlled?190:158;
  }
  update(dt){
    const _oldX=this.x,_oldY=this.y;
    if(!this.alive)return;
    this.mana=Math.min(100,this.mana+8*dt);
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
    if(this.invisT>0)this.invisT=Math.max(0,this.invisT-dt);
    if(this.jumpT>0)this.jumpT=Math.max(0,this.jumpT-dt);
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
    if(!u||!u.alive||u.inv>0||u.jumpT>0)continue;
    if(Math.hypot(u.x-x,u.y-y)<=radius+u.r){
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
      x,y,dx,dy,team,curve,target,kind,r:7,life:3.6,
      bouncesLeft:kind==='bounce'?4:0,
      blastRadius:kind==='blast'?58:0,
      originX:x,originY:y,phase2:0,
      speed:curve?315:355,age:0,
      curveTime:curve?1.20:0,
      maxCurveRate:curve?2.35:0
    });
  }
  update(dt){
    this.life-=dt;
    this.age+=dt;

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

    if(this.kind==='boomerang'&&this.age>.62){const back=norm(this.originX-this.x,this.originY-this.y),k=Math.min(1,dt*3.2);this.dx=this.dx*(1-k)+back.x*k;this.dy=this.dy*(1-k)+back.y*k;const q=norm(this.dx,this.dy);this.dx=q.x;this.dy=q.y;}else if(this.kind==='rightangle'&&this.phase2===0&&this.age>.48){const ox=this.dx,oy=this.dy,side=(this.target&&this.target.y>this.y)?1:-1;this.dx=-oy*side;this.dy=ox*side;this.phase2=1;}
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

    const targets=this.team==='blue'?enemies:[player,...allies];
    if(this.kind==='blast'){
      for(const u of targets){
        if(u&&u.alive&&Math.hypot(this.x-u.x,this.y-u.y)<this.r+u.r){
          this.life=0;explodeAt(this.x,this.y,this.team,this.blastRadius);return;
        }
      }
    }
    for(const u of targets){
      if(u&&u.alive&&u.inv<=0&&u.jumpT<=0&&Math.hypot(this.x-u.x,this.y-u.y)<this.r+u.r){
        if(u.shield>0){u.shield=0;this.life=0;spark(u.x,u.y);flash('SHIELD!',350);return}
        const wasControlled=u.controlled;
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
function move(u,x,y,dt){if(!u.alive)return;const s=u.speed*(u.beastActive?2.05:(u.dodgeT>0?2.25:1)),nx=u.x+x*s*dt,ny=u.y+y*s*dt;if(u.jumpT>0){u.x=clamp(nx,COURT.x+u.r,COURT.x+COURT.w-u.r);u.y=clamp(ny,COURT.y+u.r,COURT.y+COURT.h-u.r);return}if(canStand(nx,u.y,u.r))u.x=nx;if(canStand(u.x,ny,u.r))u.y=ny}
function nearest(u,arr){let best=null,bd=1e9;for(const v of arr){if(!v||!v.alive||v.invisT>0)continue;const d=dist(u,v);if(d<bd){bd=d;best=v}}return best}

function useShield(u,playerUse=false){
  if(!u||!u.alive)return false;
  const now=performance.now()/1000;
  if(now-u.lastShield<5.2)return false;

  if(playerUse){
    const cost=30;
    if(u.mana<cost){flash('魔力不足',400);return false}
    u.mana-=cost;
  }

  u.lastShield=now;
  u.shield=3;
  return true;
}

function shoot(u,target,curve=false){
  if(!u||!u.alive||!target||!target.alive||u.dodgeT>0||u.dodgeRecover>0||u.beastActive)return;
  const cost=curve?16:11,now=performance.now()/1000;
  if(u.mana<cost||now-u.lastShot<u.shotCd)return;
  u.lastShot=now;u.mana-=cost;
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

function reset(){
  if(mode==='cup'&&currentOpponent)markEncountered(cupKind,currentOpponent);
  bullets=[];fx=[];mines=[];lobShots=[];left=60;secAcc=0;over=false;running=true;
  player=new Unit(300,360,'blue',true);
  allies=[
    new Unit(280,235,'blue',false,$('roleA').value),
    new Unit(280,485,'blue',false,$('roleB').value)
  ];
  const od=opponentData(currentOpponent),roles=od.roles;
  enemies=[
    new Unit(995,220,'red',false,roles[0]),
    new Unit(1015,360,'red',false,roles[1]),
    new Unit(995,500,'red',false,roles[2])
  ];
  for(const e of enemies)e.outfitKey=`${cupKind}:${currentOpponent}`;
  if(cupKind==='rookie'&&od.shieldUsers)for(const i of od.shieldUsers)if(enemies[i])enemies[i].specialKind='shield';
  if(cupKind==='rookie'&&od.tripleUsers)for(const i of od.tripleUsers)if(enemies[i])enemies[i].specialKind='triple';
  if(cupKind==='advanced'&&od.phaseUsers)for(const i of od.phaseUsers)if(enemies[i])enemies[i].specialKind='phase';
  if((cupKind==='advanced'||cupKind==='expert')&&od.bounceUsers)for(const i of od.bounceUsers)if(enemies[i])enemies[i].specialKind='bounce';
  if((cupKind==='advanced'||cupKind==='expert')&&od.blastUsers)for(const i of od.blastUsers)if(enemies[i])enemies[i].specialKind='blast';
  if(cupKind==='expert'&&od.beastUsers)for(const i of od.beastUsers)if(enemies[i])enemies[i].specialKind='beast';
  if(cupKind==='master'&&od.invisUsers)for(const i of od.invisUsers)if(enemies[i])enemies[i].specialKind='invis';
  if(cupKind==='master'&&od.boomerangUsers)for(const i of od.boomerangUsers)if(enemies[i])enemies[i].specialKind='boomerang';
  if(cupKind==='master'&&od.rightAngleUsers)for(const i of od.rightAngleUsers)if(enemies[i])enemies[i].specialKind='rightangle';
  if(cupKind==='master'&&od.lobUsers)for(const i of od.lobUsers)if(enemies[i])enemies[i].specialKind='lob';
  if(cupKind==='master'&&od.mineUsers)for(const i of od.mineUsers)if(enemies[i])enemies[i].specialKind='mine';
  if(cupKind==='master'&&od.jumpUsers)for(const i of od.jumpUsers)if(enemies[i])enemies[i].specialKind='jump';
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

function cpuBoomerang(u){const t=nearest(u,u.team==='red'?[player,...allies]:enemies);if(!t)return;const d=norm(t.x-u.x,t.y-u.y);bullets.push(new Bullet(u.x+d.x*23,u.y+d.y*23,d.x,d.y,u.team,false,t,'boomerang'));}
function cpuRightAngle(u){const t=nearest(u,u.team==='red'?[player,...allies]:enemies);if(!t)return;const d=norm(t.x-u.x,t.y-u.y);bullets.push(new Bullet(u.x+d.x*23,u.y+d.y*23,d.x,d.y,u.team,false,t,'rightangle'));}
function ai(u,dt,isEnemy){
  if(!u.alive)return;
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

  if(!isEnemy && u.specialKind && u.specialKind!=='none'){
    if(u.specialKind==='shield'&&u.mana>=20&&u.shield<=0&&Math.random()<.004){u.mana-=20;u.shield=1;}
    if(u.specialKind==='double'&&u.mana>=18&&Math.random()<.007){const t=nearest(u,enemies);if(t){u.mana-=18;cpuDouble(u,t);}}
    if(u.specialKind==='triple'&&u.mana>=28&&Math.random()<.005){const t=nearest(u,enemies);if(t){u.mana-=28;cpuTriple(u,t);}}
    if(u.specialKind==='beast'&&!u.beastActive&&u.mana>=26&&Math.random()<.003){u.mana-=26;toggleBeast(u);}
    if(u.specialKind==='invis'&&u.invisT<=0&&u.mana>=28&&Math.random()<.003){u.mana-=28;u.invisT=3;}
    if(u.specialKind==='boomerang'&&u.mana>=24&&Math.random()<.006){u.mana-=24;cpuBoomerang(u);}
    if(u.specialKind==='rightangle'&&u.mana>=23&&Math.random()<.006){u.mana-=23;cpuRightAngle(u);}
    if(u.specialKind==='lob'&&u.mana>=32&&Math.random()<.004){const t=nearest(u,enemies);if(t){u.mana-=32;createLob(u,t,u.team);}}
    if(u.specialKind==='mine'&&u.mana>=20&&Math.random()<.004){if(placeMine(u))u.mana-=20;}
    if(u.specialKind==='jump'&&u.mana>=20&&u.jumpT<=0&&Math.random()<.004){u.mana-=20;startJump(u);}
  }

  if(u.specialKind==='invis'&&u.invisT<=0&&nowSpecial-u.lastInvis>5.5&&Math.random()<.006){u.lastInvis=nowSpecial;u.invisT=2.6;}
  if(u.specialKind==='boomerang'&&nowSpecial-u.lastBoomerang>2.4&&Math.random()<.009){u.lastBoomerang=nowSpecial;cpuBoomerang(u);}
  if(u.specialKind==='rightangle'&&nowSpecial-u.lastRightAngle>2.4&&Math.random()<.009){u.lastRightAngle=nowSpecial;cpuRightAngle(u);}
  if(u.specialKind==='lob'&&nowSpecial-u.lastLob>3.2&&Math.random()<.008){const q=nearest(u,u.team==='red'?[player,...allies]:enemies);if(q){u.lastLob=nowSpecial;createLob(u,q,u.team);}}
  if(u.specialKind==='mine'&&nowSpecial-u.lastMine>3&&Math.random()<.007){if(placeMine(u))u.lastMine=nowSpecial;}
  if(u.specialKind==='blast'&&nowSpecial-u.lastBlast>5.5&&Math.random()<.010){
    const targets=u.team==='red'?[player,...allies]:enemies,t=nearest(u,targets);
    if(t&&dist(u,t)<520){u.lastBlast=nowSpecial;cpuBlastShot(u);flash('爆裂弾！',260);}
  }
  if(u.specialKind==='beast'){
    if(!u.beastActive&&nowSpecial-u.lastBeast>7.2&&Math.random()<.006){
      u.lastBeast=nowSpecial;u.beastActive=true;u.beastT=3.8;flash('獣化！',260);
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
    shoot(u,t,Math.random()<chance);
  }
}

function checkFlags(){
  for(const u of [player,...allies])if(u&&u.alive&&!u.beastActive&&u.jumpT<=0&&dist(u,flagRed)<u.r+22)return finish('blue','敵クリスタルを取りました！');
  for(const u of enemies)if(u.alive&&!u.beastActive&&u.jumpT<=0&&dist(u,flagBlue)<u.r+22)return finish('red','敵にクリスタルを取られました');
  if(player&&player.alive&&dist(player,flagBlue)<45)player.mana=Math.min(100,player.mana+36/60);
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
  next.speed=190;
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
    $('nextBtn').textContent=match?(mode==='cup'?'大会表へ':'メニューへ戻る'):'次のラウンド';
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
  updateLobs(dt);updateMines(dt);

  for(let i=0;i<bullets.length;i++){
    const a=bullets[i];if(a.life<=0)continue;
    for(let j=i+1;j<bullets.length;j++){
      const b=bullets[j];if(b.life<=0||a.team===b.team)continue;
      if(Math.hypot(a.x-b.x,a.y-b.y)<a.r+b.r+2){a.life=0;b.life=0;spark((a.x+b.x)/2,(a.y+b.y)/2);break}
    }
  }
  bullets=bullets.filter(b=>b.life>0);

  for(const p of fx){p.x+=p.vx*dt;p.y+=p.vy*dt;p.t-=dt}
  fx=fx.filter(p=>p.t>0);
  checkFlags();
  manaFill.style.width=player.mana+'%';
  if(msgUntil&&performance.now()>msgUntil){message.textContent='';msgUntil=0}
}

function rr(x,y,w,h,r){r=Math.min(r,w/2,h/2);g.beginPath();g.moveTo(x+r,y);g.lineTo(x+w-r,y);g.quadraticCurveTo(x+w,y,x+w,y+r);g.lineTo(x+w,y+h-r);g.quadraticCurveTo(x+w,y+h,x+w-r,y+h);g.lineTo(x+r,y+h);g.quadraticCurveTo(x,y+h,x,y+h-r);g.lineTo(x,y+r);g.quadraticCurveTo(x,y,x+r,y);g.closePath();g.fill()}
function drawFlag(f,team){g.save();g.translate(f.x,f.y);const col=team==='blue'?'#86c7ff':'#ff9aa8',glow=team==='blue'?'#cfeaff':'#ffd6dc',t=performance.now()/1000;g.save();g.rotate(t*.35*(team==='blue'?1:-1));g.strokeStyle=col;g.lineWidth=2;g.globalAlpha=.55;g.beginPath();g.arc(0,10,27,0,Math.PI*2);g.stroke();g.beginPath();g.arc(0,10,18,0,Math.PI*2);g.stroke();g.restore();const bob=Math.sin(t*3+f.x*.01)*3;g.translate(0,-8+bob);g.shadowBlur=18;g.shadowColor=col;g.fillStyle=glow;g.beginPath();g.moveTo(0,-25);g.lineTo(13,-4);g.lineTo(0,22);g.lineTo(-13,-4);g.closePath();g.fill();g.strokeStyle=col;g.lineWidth=3;g.stroke();g.restore();}

function drawUnit(u){
  if(!u||!u.alive)return;
  g.save();g.translate(u.x,u.y);
  if(u.jumpT>0){const jp=Math.sin(Math.PI*(1-u.jumpT/.82));g.translate(0,-Math.max(0,jp)*54);}
  if(u.invisT>0)g.globalAlpha=u.controlled?.38:.14;

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
    g.strokeStyle='#dff8ff';
    g.beginPath();
    g.arc(0,0,72,-Math.PI*.55,Math.PI*.55);
    g.stroke();
    g.lineWidth=3;
    g.strokeStyle='#ffffff';
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


function createLob(u,target,team){lobShots.push({sx:u.x,sy:u.y,tx:target.x,ty:target.y,x:u.x,y:u.y,t:0,dur:.82,team});}
function updateLobs(dt){for(const l of lobShots){l.t+=dt;const p=Math.min(1,l.t/l.dur);l.x=l.sx+(l.tx-l.sx)*p;l.y=l.sy+(l.ty-l.sy)*p-Math.sin(Math.PI*p)*95;if(p>=1&&!l.done){l.done=true;explodeAt(l.tx,l.ty,l.team,64);}}lobShots=lobShots.filter(l=>!l.done);}
function placeMine(u){if(dist(u,flagBlue)<95||dist(u,flagRed)<95){if(u.controlled)flash('クリスタル付近には設置できない',520);return false;}const own=mines.filter(m=>m.owner===u);if(own.length>=2){const oldest=own.reduce((x,y)=>x.age>y.age?x:y);mines=mines.filter(m=>m!==oldest);}mines.push({x:u.x,y:u.y,team:u.team,age:0,owner:u});return true;}
function updateMines(dt){for(const m of mines)m.age+=dt;for(const m of [...mines]){const targets=m.team==='blue'?enemies:[player,...allies];if(targets.some(u=>u&&u.alive&&Math.hypot(u.x-m.x,u.y-m.y)<38)){explodeAt(m.x,m.y,m.team,58);mines=mines.filter(x=>x!==m);}}}

function arenaTheme(){
  if(mode==='practice')return {court:'#b9d6f2',wall:'#e7edf5',bg:'#5f7c92'};
  if(cupKind==='beginner')return {court:'#9ad9b8',wall:'#f1e6cc',bg:'#5f7d8a'};
  if(cupKind==='rookie')return {court:'#b7a8e8',wall:'#eee7ff',bg:'#655f86'};
  if(cupKind==='advanced')return {court:'#d9b77b',wall:'#f5e2b8',bg:'#7c6848'};
  if(cupKind==='expert')return {court:'#9fbc8f',wall:'#d8e4cf',bg:'#4f6652'};
  if(cupKind==='master')return {court:'#b7a0c9',wall:'#efe3f5',bg:'#594a68'};
  return {court:'#9ad9b8',wall:'#f1e6cc',bg:'#5f7d8a'};
}

function draw(){
  const theme=arenaTheme();g.fillStyle=theme.bg;g.fillRect(0,0,W,H);
  g.fillStyle=theme.court;g.fillRect(COURT.x,COURT.y,COURT.w,COURT.h);
  g.strokeStyle='#fff9d7';g.lineWidth=4;g.strokeRect(COURT.x,COURT.y,COURT.w,COURT.h);
  g.setLineDash([12,12]);g.beginPath();g.moveTo(W/2,COURT.y);g.lineTo(W/2,COURT.y+COURT.h);g.stroke();g.setLineDash([]);
  g.strokeStyle='#ffffff28';g.lineWidth=2;g.beginPath();g.arc(W/2,CY,74,0,Math.PI*2);g.stroke();

  for(const w of walls){g.fillStyle='#c7bda5';rr(w.x+5,w.y+6,w.w,w.h,8);g.fillStyle=theme.wall;rr(w.x,w.y,w.w,w.h,8)}
  drawFlag(flagBlue,'blue');drawFlag(flagRed,'red');

  for(const b of bullets){
    g.save();g.shadowBlur=13;g.shadowColor=b.team==='blue'?'#8fc6ff':'#ff9daa';g.fillStyle=b.team==='blue'?'#d9ecff':'#ffe1e4';
    g.beginPath();g.arc(b.x,b.y,b.r,0,Math.PI*2);g.fill();
    if(b.kind==='phase'){
      g.strokeStyle='#8fffe1';g.lineWidth=3;g.beginPath();g.arc(b.x,b.y,b.r+5,0,Math.PI*2);g.stroke();
    }else if(b.kind==='boomerang'){g.strokeStyle='#ffb0f1';g.lineWidth=3;g.beginPath();g.arc(b.x,b.y,b.r+6,0,Math.PI*1.45);g.stroke();
    }else if(b.kind==='rightangle'){g.strokeStyle='#b9ff75';g.lineWidth=3;g.strokeRect(b.x-10,b.y-10,20,20);
     }else if(b.kind==='blast'){
      g.strokeStyle='#ff9b5a';g.lineWidth=3;g.beginPath();g.arc(b.x,b.y,b.r+6,0,Math.PI*2);g.stroke();
    }else if(b.kind==='bounce'){
      g.strokeStyle='#ffd36f';g.lineWidth=3;g.setLineDash([4,3]);g.beginPath();g.arc(b.x,b.y,b.r+5,0,Math.PI*2);g.stroke();g.setLineDash([]);
    }
    if(b.curve){g.strokeStyle=b.team==='blue'?'#826cff':'#e96a93';g.lineWidth=2;g.beginPath();g.arc(b.x,b.y,b.r+4,.3,5.2);g.stroke()}
    g.restore();
  }

  for(const l of lobShots){g.save();g.shadowBlur=12;g.shadowColor='#ffb45f';g.fillStyle='#ffd9a0';g.beginPath();g.arc(l.x,l.y,8,0,Math.PI*2);g.fill();g.restore();}
  for(const m of mines){g.save();g.translate(m.x,m.y);g.strokeStyle=m.team==='blue'?'#6ebcff':'#ff8c98';g.lineWidth=2;g.beginPath();g.arc(0,0,13,0,Math.PI*2);g.stroke();g.beginPath();g.moveTo(-8,0);g.lineTo(8,0);g.moveTo(0,-8);g.lineTo(0,8);g.stroke();g.restore();}
  for(const a of allies)drawUnit(a);
  for(const e of enemies)drawUnit(e);
  drawUnit(player);

  for(const p of fx){g.globalAlpha=Math.max(0,p.t/.4);g.fillStyle='#fff';g.beginPath();g.arc(p.x,p.y,4,0,Math.PI*2);g.fill();g.globalAlpha=1}
}

function frame(t){const dt=Math.min(.033,(t-last)/1000||0);last=t;update(dt);draw();requestAnimationFrame(frame)}
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
$('throwBtn').addEventListener('pointerdown',e=>{e.preventDefault();heldAt=performance.now();if(player&&player.alive){player.charging=true;player.chargeT=0}});
function releaseThrow(e){
  if(e)e.preventDefault();if(!player)return;
  const charged=performance.now()-heldAt>=180;player.charging=false;player.chargeT=0;
  if(!running||!player.alive)return;
  if(player.dodgeT>0||player.dodgeRecover>0){flash('回避中は投げられない',380);return;}
  shoot(player,nearest(player,enemies),charged);if(charged)flash('回転弾！',380);
}
$('throwBtn').addEventListener('pointerup',releaseThrow);$('throwBtn').addEventListener('pointercancel',()=>{if(player){player.charging=false;player.chargeT=0}});

// dodge
$('dodgeBtn').addEventListener('pointerdown',e=>{
  e.preventDefault();if(!running||!player.alive)return;
  if(player.beastActive){flash('獣化中は回避できない',360);return;}
  const now=performance.now()/1000;if(now-player.lastDodge<1.8){flash('回避クールタイム',430);return}
  let x=input.x,y=input.y;
  // 青チームの攻撃方向は画面右。回避中のX速度は必ず0以下にする。
  // 上下入力があれば純粋な横回避。上下入力がなければ後方（左）へ回避。
  if(Math.abs(y)>=.15){x=0;y=y>0?1:-1;}
  else{x=-1;y=0;}
  const n=norm(x,y);
  player.dx=Math.min(0,n.x);
  player.dy=n.y;
  player.lastDodge=now;player.dodgeT=.34;player.inv=.24;
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
  if(u.mana<cost){
    flash('魔力不足',400);
    return false;
  }

  const target=nearest(u,enemies);
  if(!target)return false;

  u.lastDouble=now;
  u.mana-=cost;

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
  if(u.mana<18){flash('魔力不足',360);return false}

  const target=nearest(u,enemies);
  let ax=1,ay=0;
  if(target){const d=norm(target.x-u.x,target.y-u.y);ax=d.x;ay=d.y}
  else if(u.team==='red'){ax=-1;ay=0}

  u.mana-=18;
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
  if(u.mana<38){flash('魔力不足',360);return false}
  if(!nearest(u,enemies))return false;
  u.mana-=38;u.lastTriple=now;
  const fire=()=>{if(!u.alive)return;const t=nearest(u,enemies);if(!t)return;const d=norm(t.x-u.x,t.y-u.y);bullets.push(new Bullet(u.x+d.x*23,u.y+d.y*23,d.x,d.y,u.team,false,t));};
  fire();setTimeout(fire,145);setTimeout(fire,290);return true;
}


function usePhaseShot(u){
  if(!u||!u.alive)return false;
  const now=performance.now()/1000;
  if(now-u.lastPhase<.55){flash('壁すり抜け弾クールタイム',300);return false}
  if(u.dodgeT>0||u.dodgeRecover>0){flash('回避中は使えない',360);return false}
  if(u.mana<24){flash('魔力不足',360);return false}
  const t=nearest(u,enemies);if(!t)return false;
  u.mana-=24;u.lastPhase=now;
  const d=norm(t.x-u.x,t.y-u.y);
  bullets.push(new Bullet(u.x+d.x*23,u.y+d.y*23,d.x,d.y,u.team,false,t,'phase'));
  return true;
}

function useBounceShot(u){
  if(!u||!u.alive)return false;
  const now=performance.now()/1000;
  if(now-u.lastBounce<.55){flash('バウンド弾クールタイム',300);return false}
  if(u.dodgeT>0||u.dodgeRecover>0){flash('回避中は使えない',360);return false}
  if(u.mana<22){flash('魔力不足',360);return false}
  const t=nearest(u,enemies);if(!t)return false;
  u.mana-=22;u.lastBounce=now;

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
  if(u.mana<30){flash('魔力不足',360);return false}
  const t=nearest(u,enemies);if(!t)return false;
  u.mana-=30;u.lastBlast=now;
  const d=norm(t.x-u.x,t.y-u.y);
  bullets.push(new Bullet(u.x+d.x*23,u.y+d.y*23,d.x,d.y,u.team,false,t,'blast'));
  return true;
}

function toggleBeast(u){
  if(!u||!u.alive)return false;
  const now=performance.now()/1000;
  if(u.beastActive){
    u.beastActive=false;u.beastT=0;u.dodgeRecover=.22;return true;
  }
  if(now-u.lastBeast<7.0){flash('獣化クールタイム',380);return false}
  if(u.mana<34){flash('魔力不足',360);return false}
  u.mana-=34;u.lastBeast=now;u.beastActive=true;u.beastT=4.2;u.dodgeRecover=.18;return true;
}

function useInvis(u){if(!u||!u.alive)return false;const now=performance.now()/1000;if(now-u.lastInvis<1)return false;if(u.mana<28){flash('魔力不足',360);return false}u.mana-=28;u.lastInvis=now;u.invisT=3;return true;}
function useBoomerang(u){if(!u||!u.alive)return false;const now=performance.now()/1000;if(now-u.lastBoomerang<.65)return false;if(u.mana<24){flash('魔力不足',360);return false}const t=nearest(u,enemies);if(!t)return false;u.mana-=24;u.lastBoomerang=now;const d=norm(t.x-u.x,t.y-u.y);bullets.push(new Bullet(u.x+d.x*23,u.y+d.y*23,d.x,d.y,u.team,false,t,'boomerang'));return true;}
function useRightAngle(u){if(!u||!u.alive)return false;const now=performance.now()/1000;if(now-u.lastRightAngle<.65)return false;if(u.mana<23){flash('魔力不足',360);return false}const t=nearest(u,enemies);if(!t)return false;u.mana-=23;u.lastRightAngle=now;const d=norm(t.x-u.x,t.y-u.y);bullets.push(new Bullet(u.x+d.x*23,u.y+d.y*23,d.x,d.y,u.team,false,t,'rightangle'));return true;}
function useLob(u){if(!u||!u.alive)return false;const now=performance.now()/1000;if(now-u.lastLob<.8)return false;if(u.mana<32){flash('魔力不足',360);return false}const t=nearest(u,enemies);if(!t)return false;u.mana-=32;u.lastLob=now;createLob(u,t,u.team);return true;}
function useMine(u){if(!u||!u.alive)return false;const now=performance.now()/1000;if(now-u.lastMine<.55)return false;if(u.mana<20){flash('魔力不足',360);return false}if(!placeMine(u))return false;u.mana-=20;u.lastMine=now;return true;}
function useJump(u){if(!u||!u.alive)return false;const now=performance.now()/1000;if(now-u.lastJump<.85){flash('ジャンプクールタイム',260);return false}if(u.mana<20){flash('魔力不足',360);return false}if(u.dodgeT>0||u.beastActive)return false;u.mana-=20;u.lastJump=now;u.jumpT=.82;u.inv=Math.max(u.inv,.82);return true;}

function usePlayerSpecial(kind){
  if(!player||!player.alive)return;

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
  if(kind==='beast'&&saveData.beastUnlocked){if(toggleBeast(player))flash(player.beastActive?'獣化！':'獣化解除',320);return;}
  if(kind==='invis'&&saveData.invisUnlocked){if(useInvis(player))flash('透明化！',320);return;}
  if(kind==='boomerang'&&saveData.boomerangUnlocked){if(useBoomerang(player))flash('ブーメラン弾！',320);return;}
  if(kind==='rightangle'&&saveData.rightAngleUnlocked){if(useRightAngle(player))flash('直角弾！',320);return;}
  if(kind==='lob'&&saveData.lobUnlocked){if(useLob(player))flash('放物線爆弾！',320);return;}
  if(kind==='mine'&&saveData.mineUnlocked){if(useMine(player))flash('地雷設置！',320);return;}
  if(kind==='jump'&&saveData.jumpUnlocked){if(useJump(player))flash('ジャンプ！',260);return;}
  if(kind==='triple'&&saveData.tripleUnlocked){if(useTripleShot(player))flash('3連射！',320);return;}

  if(kind==='shield'&&saveData.shieldUnlocked){
    if(useShield(player,true))flash('シールド！',420);
    return;
  }

  player.emote=.8;
  flash('✌',420);
}

bindTap('special1',()=>usePlayerSpecial(saveData.specialSlot1||'none'));
bindTap('special2',()=>usePlayerSpecial(saveData.specialSlot2||'none'));


function returnFromPractice(){
  running=false;
  over=false;
  mode='menu';
  bullets=[];
  fx=[];
  pendingLearnMessage='';

  for(const id of ['result','practicePanel','cupPanel','cupEndPanel','skillSetPanel']){
    const el=$(id);
    if(el)el.classList.add('hidden');
  }

  // Do NOT alter saved cup resume. Practice is independent of tournament state.
  $('menu').classList.remove('hidden');

  bScore=0;
  rScore=0;
  round=1;
  score.textContent='0 - 0';
  roundLabel.textContent='ROUND 1';
  clock.textContent='1:00';

  refreshRecordUI();
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

  for(const id of ['result','cupPanel','cupEndPanel','skillSetPanel','practicePanel']){
    const el=$(id);
    if(el)el.classList.add('hidden');
  }

  $('menu').classList.remove('hidden');

  bScore=0;
  rScore=0;
  round=1;
  score.textContent='0 - 0';
  roundLabel.textContent='ROUND 1';
  clock.textContent='1:00';

  refreshRecordUI();
}

// menu / cup v2.15
function bindTap(id,fn){const el=$(id);if(!el)return;let fired=false;el.addEventListener('pointerup',e=>{e.preventDefault();fired=true;fn()},{passive:false});el.addEventListener('click',e=>{if(fired){fired=false;return}e.preventDefault();fn()})}

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
  const val=$('practiceTeamSelect').value;
  if(!val)return;
  const [kind,id]=val.split(':');
  mode='practice';
  // cupKind is used only to identify the opponent's league/skills during the practice match.
  // It must not turn the match into a tournament.
  cupKind=kind==='master'?'master':(kind==='expert'?'expert':(kind==='advanced'?'advanced':(kind==='rookie'?'rookie':'beginner')));
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
bindTap('cupBackBtn',()=>{
  saveCupResume();
  mode='menu';
  $('cupPanel').classList.add('hidden');
  $('menu').classList.remove('hidden');
  refreshRecordUI();
});
bindTap('cupFinishBtn',()=>{returnToMainMenu()});
bindTap('nextBtn',()=>{
  $('result').classList.add('hidden');
  const ended=bScore>=2||rScore>=2;
  if(!ended){round++;reset();return}
  if(mode==='cup'){
    recordMatch('player',currentCupOrder()[cupIndex],bScore,rScore);

    pendingLearnMessage='';
    if(bScore>rScore){
      saveData.totalWins++;
      {
        const msgs=[];
        if(opponentHasShield()){const m=gainShieldResearch();if(m)msgs.push(m);}
        if(opponentHasTriple()){const m=gainTripleResearch();if(m)msgs.push(m);}
        if(opponentHasPhase()){const m=gainPhaseResearch();if(m)msgs.push(m);}
        if(opponentHasBounce()){const m=gainBounceResearch();if(m)msgs.push(m);}
        if(opponentHasBlast()){const m=gainBlastResearch();if(m)msgs.push(m);}
        if(opponentHasBeast()){const m=gainBeastResearch();if(m)msgs.push(m);}
        if(opponentHasKey('invisUsers')){const m=gainSimpleResearch('invis','透明化');if(m)msgs.push(m);}
        if(opponentHasKey('boomerangUsers')){const m=gainSimpleResearch('boomerang','ブーメラン弾');if(m)msgs.push(m);}
        if(opponentHasKey('rightAngleUsers')){const m=gainSimpleResearch('rightAngle','直角弾');if(m)msgs.push(m);}
        if(opponentHasKey('lobUsers')){const m=gainSimpleResearch('lob','放物線爆弾');if(m)msgs.push(m);}
        if(opponentHasKey('mineUsers')){const m=gainSimpleResearch('mine','地雷');if(m)msgs.push(m);}
        if(opponentHasKey('jumpUsers')){const m=gainSimpleResearch('jump','ジャンプ');if(m)msgs.push(m);}
        pendingLearnMessage=msgs.join(' / ');
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
      {
        const msgs=[];
        if(opponentHasShield()){const m=gainShieldResearch();if(m)msgs.push(m);}
        if(opponentHasTriple()){const m=gainTripleResearch();if(m)msgs.push(m);}
        if(opponentHasPhase()){const m=gainPhaseResearch();if(m)msgs.push(m);}
        if(opponentHasBounce()){const m=gainBounceResearch();if(m)msgs.push(m);}
        if(opponentHasBlast()){const m=gainBlastResearch();if(m)msgs.push(m);}
        if(opponentHasBeast()){const m=gainBeastResearch();if(m)msgs.push(m);}
        if(opponentHasKey('invisUsers')){const m=gainSimpleResearch('invis','透明化');if(m)msgs.push(m);}
        if(opponentHasKey('boomerangUsers')){const m=gainSimpleResearch('boomerang','ブーメラン弾');if(m)msgs.push(m);}
        if(opponentHasKey('rightAngleUsers')){const m=gainSimpleResearch('rightAngle','直角弾');if(m)msgs.push(m);}
        if(opponentHasKey('lobUsers')){const m=gainSimpleResearch('lob','放物線爆弾');if(m)msgs.push(m);}
        if(opponentHasKey('mineUsers')){const m=gainSimpleResearch('mine','地雷');if(m)msgs.push(m);}
        if(opponentHasKey('jumpUsers')){const m=gainSimpleResearch('jump','ジャンプ');if(m)msgs.push(m);}
        pendingLearnMessage=msgs.join(' / ');
      }
    }else{
      saveData.totalLosses++;
    }
    writeSave();

    const learnMsg=pendingLearnMessage;
    returnFromPractice();

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
window.addEventListener('DOMContentLoaded',()=>refreshPlayerSkillSelectors());
