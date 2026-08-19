(()=>{'use strict';

const c=document.getElementById('game'),g=c.getContext('2d');
const W=1280,H=720;
const COURT={x:190,y:72,w:900,h:576},CY=360;
const BLUE='#4d86ff',RED='#ff6c72',SKIN='#f4dfc3',EYE='#182239';

const walls=[
  // left upper / lower cover — lower lane still has 100+ px clearance
  {x:340,y:185,w:18,h:105},
  {x:340,y:420,w:18,h:95},
  {x:430,y:145,w:18,h:95},
  {x:430,y:455,w:18,h:90},
  {x:500,y:220,w:76,h:16},
  {x:500,y:450,w:76,h:16},

  // right mirrored
  {x:922,y:185,w:18,h:105},
  {x:922,y:420,w:18,h:95},
  {x:832,y:145,w:18,h:95},
  {x:832,y:455,w:18,h:90},
  {x:704,y:220,w:76,h:16},
  {x:704,y:450,w:76,h:16},

  // hollow center
  {x:545,y:280,w:190,h:18},
  {x:545,y:390,w:190,h:18},
  {x:545,y:298,w:18,h:92},
  {x:717,y:298,w:18,h:92}
];

const flagBlue={x:230,y:360},flagRed={x:1050,y:360};
const TEAMS={
  rush:{name:'ブルームランナーズ',desc:'旗取り型：前へ出る選手が多く、旗を積極的に狙います。',roles:['attacker','attacker','support']},
  guard:{name:'ストーンウォールズ',desc:'守備型：自陣旗と壁裏を重視して戦います。',roles:['guard','guard','shooter']},
  shoot:{name:'スターショッツ',desc:'射撃型：距離を取り、アウトを優先して狙います。',roles:['shooter','shooter','balance']}
};


const CUP_TEAMS={
  player:{name:'プレイヤーチーム'},
  rush:{name:TEAMS.rush.name},
  guard:{name:TEAMS.guard.name},
  shoot:{name:TEAMS.shoot.name}
};
const CUP_ORDER=['rush','guard','shoot'];
let mode='menu'; // menu / cup — v2.14 pointer-first controls
function bindPress(id,fn){
  const el=$(id);
  if(!el)return;
  let down=false;
  el.addEventListener('pointerdown',e=>{
    down=true;
    e.preventDefault();
    try{el.setPointerCapture(e.pointerId)}catch(_){}
  });
  el.addEventListener('pointerup',e=>{
    e.preventDefault();
    if(!down)return;
    down=false;
    fn(e);
  });
  el.addEventListener('pointercancel',()=>{down=false});
  // keyboard / desktop fallback
  el.addEventListener('click',e=>{
    if(e.detail===0){ e.preventDefault(); fn(e); }
  });
}

bindPress('cupStartBtn',()=>{
  mode='cup';
  cupIndex=0;
  cupTable=newCupTable();
  currentOpponent=CUP_ORDER[0];
  $('menu').classList.add('hidden');
  refreshCupPanel();
  $('cupPanel').classList.remove('hidden');
});

bindPress('practiceBtn',()=>{
  mode='practice';
  currentOpponent='rush';
  bScore=0;rScore=0;round=1;
  score.textContent='0 - 0';
  $('menu').classList.add('hidden');
  reset();
});

bindPress('cupMatchBtn',()=>{
  currentOpponent=CUP_ORDER[cupIndex];
  bScore=0;rScore=0;round=1;
  score.textContent='0 - 0';
  $('cupPanel').classList.add('hidden');
  reset();
});

bindPress('cupBackBtn',()=>{
  mode='menu';
  $('cupPanel').classList.add('hidden');
  $('menu').classList.remove('hidden');
});

bindPress('cupFinishBtn',()=>{
  mode='menu';
  $('cupEndPanel').classList.add('hidden');
  $('menu').classList.remove('hidden');
});

bindPress('nextBtn',()=>{
  $('result').classList.add('hidden');
  const matchEnded=bScore>=2||rScore>=2;

  if(!matchEnded){
    round++;
    reset();
    return;
  }

  if(mode==='cup'){
    const opponent=CUP_ORDER[cupIndex];
    recordMatch('player',opponent,bScore,rScore);
    cupIndex++;
    if(cupIndex>=CUP_ORDER.length){
      finishCup();
    }else{
      refreshCupPanel();
      $('cupPanel').classList.remove('hidden');
    }
  }else{
    mode='menu';
    $('menu').classList.remove('hidden');
  }
});

// Prevent Android/iOS long-press menus and browser context menu on the game UI.
for(const type of ['contextmenu','dragstart','selectstart']){
  document.addEventListener(type,e=>{
    if(e.target.closest('#gameWrap') || e.target.closest('.overlay') || e.target.closest('button')){
      e.preventDefault();
    }
  },{passive:false});
}

})();