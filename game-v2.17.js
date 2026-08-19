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

let player=null,allies=[],enemies=[],bullets=[],fx=[];
let selectedTeam='rush',running=false,over=false,last=0,left=60,secAcc=0,bScore=0,rScore=0,round=1,msgUntil=0;
let mode='menu',cupIndex=0,cupTable=null,currentOpponent='rush';
const CUP_ORDER=['rush','guard','shoot'];
const CUP_NAMES={player:'プレイヤーチーム',rush:TEAMS.rush.name,guard:TEAMS.guard.name,shoot:TEAMS.shoot.name};
const SAVE_KEY='magic_ball_save_v216';
let saveData=loadSave();

function defaultSave(){
  return{
    totalWins:0,totalLosses:0,beginnerWins:0,bestPlace:4,
    rookieUnlocked:false,cupResume:null
  };
}
function loadSave(){
  try{
    const raw=localStorage.getItem(SAVE_KEY);
    if(!raw)return defaultSave();
    return Object.assign(defaultSave(),JSON.parse(raw));
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
}
function saveCupResume(){
  if(mode!=='cup'||!cupTable)return;
  saveData.cupResume={
    cupIndex,
    cupTable:JSON.parse(JSON.stringify(cupTable)),
    roleA:$('roleA')?.value||'support',
    roleB:$('roleB')?.value||'guard'
  };
  writeSave();
}
function clearCupResume(){saveData.cupResume=null;writeSave()}

function newCupTable(){const t={};for(const id of ['player',...CUP_ORDER])t[id]={id,name:CUP_NAMES[id],w:0,l:0,rf:0,ra:0};return t}
function recordMatch(a,b,as,bs){const A=cupTable[a],B=cupTable[b];A.rf+=as;A.ra+=bs;B.rf+=bs;B.ra+=as;if(as>bs){A.w++;B.l++}else{B.w++;A.l++}}
function simulateCpu(a,b){const aw=Math.random()<.5,ls=Math.random()<.55?1:0;recordMatch(a,b,aw?2:ls,aw?ls:2)}
function sortedTable(){return Object.values(cupTable).sort((a,b)=>b.w-a.w||((b.rf-b.ra)-(a.rf-a.ra))||b.rf-a.rf)}
function tableHTML(){return '<div class="standingRow standingHead"><span></span><span>チーム</span><span>勝敗</span><span>得失</span></div>'+sortedTable().map((r,i)=>`<div class="standingRow ${r.id==='player'?'me':''}"><span class="rank">${i+1}</span><span class="teamName">${r.name}</span><span class="stat">${r.w}-${r.l}</span><span class="stat">${r.rf-r.ra>=0?'+':''}${r.rf-r.ra}</span></div>`).join('')}
function refreshCup(){currentOpponent=CUP_ORDER[cupIndex];$('cupTitle').textContent=`第${cupIndex+1}試合`;$('cupOpponent').innerHTML=`次の相手：<b>${TEAMS[currentOpponent].name}</b><br><small>${TEAMS[currentOpponent].desc}</small>`;$('standings').innerHTML=tableHTML()}
function finishCup(){
  simulateCpu('rush','guard');simulateCpu('guard','shoot');simulateCpu('shoot','rush');
  $('finalStandings').innerHTML=tableHTML();
  const place=sortedTable().findIndex(r=>r.id==='player')+1;
  saveData.bestPlace=Math.min(saveData.bestPlace||4,place);
  if(place===1){
    saveData.beginnerWins++;
    saveData.rookieUnlocked=true;
  }
  saveData.cupResume=null;
  writeSave();
  $('cupEndTitle').textContent=place===1?'ビギナーカップ優勝！':`ビギナーカップ ${place}位`;
  $('cupEndText').textContent=place===1?'ルーキーカップへの挑戦権を獲得しました！':'もう一度挑戦できます。';
  $('cupEndPanel').classList.remove('hidden');
}

let input={x:0,y:0},keys={},heldAt=0;

const $=id=>document.getElementById(id);
const score=$('score'),clock=$('clock'),roundLabel=$('roundLabel'),manaFill=$('manaFill'),message=$('message');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const norm=(x,y)=>{const d=Math.hypot(x,y)||1;return{x:x/d,y:y/d}};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

class Unit{
  constructor(x,y,team,controlled=false,role='balance'){
    Object.assign(this,{x,y,team,controlled,role,r:17,alive:true,mana:100,lastShot:-9,shotCd:.85,lastDodge:-9,dodgeT:0,inv:0,dx:0,dy:0,emote:0,think:0,target:null,charging:false,chargeT:0,curveSide:1,rollAngle:0});
    this.speed=controlled?190:158;
  }
  update(dt){
    if(!this.alive)return;
    this.mana=Math.min(100,this.mana+8*dt);
    this.dodgeT=Math.max(0,this.dodgeT-dt);
    this.inv=Math.max(0,this.inv-dt);
    this.emote=Math.max(0,this.emote-dt);
    if(this.charging)this.chargeT=Math.min(.8,this.chargeT+dt);
    if(this.dodgeT>0)this.rollAngle+=dt*18;
    else this.rollAngle=0;
  }
}

class Bullet{
  constructor(x,y,dx,dy,team,curve,target){
    Object.assign(this,{x,y,dx,dy,team,curve,target,r:7,life:3.6,speed:curve?315:355,age:0});
  }
  update(dt){
    this.life-=dt;this.age+=dt;
    if(this.curve&&this.target&&this.target.alive){
      const n=norm(this.target.x-this.x,this.target.y-this.y);
      const k=Math.min(1,(2.8+this.age*1.3)*dt);
      this.dx=this.dx*(1-k)+n.x*k;this.dy=this.dy*(1-k)+n.y*k;
      const q=norm(this.dx,this.dy);this.dx=q.x;this.dy=q.y;
    }
    this.x+=this.dx*this.speed*dt;this.y+=this.dy*this.speed*dt;
    if(this.x<COURT.x||this.x>COURT.x+COURT.w||this.y<COURT.y||this.y>COURT.y+COURT.h){this.life=0;return}
    for(const w of walls)if(circleRect(this.x,this.y,this.r,w)){this.life=0;spark(this.x,this.y);return}
    const targets=this.team==='blue'?enemies:[player,...allies];
    for(const u of targets){
      if(u&&u.alive&&u.inv<=0&&Math.hypot(this.x-u.x,this.y-u.y)<this.r+u.r){
        u.alive=false;this.life=0;spark(u.x,u.y);flash(u.controlled?'OUT!':(u.team==='red'?'ENEMY OUT':'ALLY OUT'),650);checkEnd();return;
      }
    }
  }
}

function circleRect(x,y,r,w){const cx=clamp(x,w.x,w.x+w.w),cy=clamp(y,w.y,w.y+w.h);return Math.hypot(x-cx,y-cy)<r}
function canStand(x,y,r){if(x<COURT.x+r||x>COURT.x+COURT.w-r||y<COURT.y+r||y>COURT.y+COURT.h-r)return false;return !walls.some(w=>circleRect(x,y,r,w))}
function move(u,x,y,dt){if(!u.alive)return;const s=u.speed*(u.dodgeT>0?2.25:1),nx=u.x+x*s*dt,ny=u.y+y*s*dt;if(canStand(nx,u.y,u.r))u.x=nx;if(canStand(u.x,ny,u.r))u.y=ny}
function nearest(u,arr){let best=null,bd=1e9;for(const v of arr){if(!v||!v.alive)continue;const d=dist(u,v);if(d<bd){bd=d;best=v}}return best}

function shoot(u,target,curve=false){
  if(!u||!u.alive||!target||!target.alive)return;
  const cost=curve?16:11,now=performance.now()/1000;
  if(u.mana<cost||now-u.lastShot<u.shotCd)return;
  u.lastShot=now;u.mana-=cost;
  const direct=norm(target.x-u.x,target.y-u.y);
  let dx=direct.x,dy=direct.y;
  if(curve){
    u.curveSide*=-1;
    const side=(Math.abs(target.y-u.y)>20?(target.y>u.y?-1:1):u.curveSide),bend=.78;
    const q=norm(direct.x+(-direct.y)*bend*side,direct.y+direct.x*bend*side);
    dx=q.x;dy=q.y;
  }
  bullets.push(new Bullet(u.x+dx*23,u.y+dy*23,dx,dy,u.team,curve,target));
}

function reset(){
  bullets=[];fx=[];left=60;secAcc=0;over=false;running=true;
  player=new Unit(300,360,'blue',true);
  allies=[
    new Unit(280,235,'blue',false,$('roleA').value),
    new Unit(280,485,'blue',false,$('roleB').value)
  ];
  const roles=TEAMS[currentOpponent].roles;
  enemies=[
    new Unit(995,220,'red',false,roles[0]),
    new Unit(1015,360,'red',false,roles[1]),
    new Unit(995,500,'red',false,roles[2])
  ];
  clock.textContent='1:00';
  roundLabel.textContent='ROUND '+round;
  flash(TEAMS[currentOpponent].name,900);
}

function ai(u,dt,isEnemy){
  if(!u.alive)return;
  u.think-=dt;
  if(u.think<=0){u.think=.16+Math.random()*.18;u.target=nearest(u,isEnemy?[player,...allies]:enemies)}
  const t=u.target,enemyFlag=isEnemy?flagBlue:flagRed,ownFlag=isEnemy?flagRed:flagBlue;
  let tx=u.x,ty=u.y;

  if(u.role==='attacker'){tx=enemyFlag.x;ty=enemyFlag.y}
  else if(u.role==='guard'){
    if(t&&dist(u,t)<260){tx=t.x;ty=t.y}else{tx=ownFlag.x+(isEnemy?-85:85);ty=ownFlag.y}
  }else if(u.role==='support'&&!isEnemy&&player&&player.alive){tx=player.x+70;ty=player.y}
  else if(u.role==='shooter'&&t){
    const d=dist(u,t);
    if(d<230){tx=u.x-(t.x-u.x);ty=u.y-(t.y-u.y)}
    else if(d>420){tx=t.x;ty=t.y}
  }else if(t){tx=t.x;ty=t.y}

  let n=norm(tx-u.x,ty-u.y);
  if(walls.some(w=>circleRect(u.x+n.x*30,u.y+n.y*30,u.r,w)))n={x:-n.y,y:n.x};

  const danger=bullets.find(b=>b.team!==u.team&&Math.hypot(b.x-u.x,b.y-u.y)<95);
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

  move(u,n.x,n.y,dt);
  if(t&&dist(u,t)<540){
    const chance=u.role==='shooter'?.42:.22;
    shoot(u,t,Math.random()<chance);
  }
}

function checkFlags(){
  for(const u of [player,...allies])if(u&&u.alive&&dist(u,flagRed)<u.r+22)return finish('blue','敵旗を取りました！');
  for(const u of enemies)if(u.alive&&dist(u,flagBlue)<u.r+22)return finish('red','敵に旗を取られました');
  if(player&&player.alive&&dist(player,flagBlue)<45)player.mana=Math.min(100,player.mana+36/60);
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
  if(player.dodgeT>0){ix=player.dx;iy=player.dy}
  move(player,ix,iy,dt);

  for(const a of allies){a.update(dt);ai(a,dt,false)}
  for(const e of enemies){e.update(dt);ai(e,dt,true)}
  for(const b of bullets)b.update(dt);

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
function drawFlag(f,team){g.save();g.translate(f.x,f.y);g.strokeStyle='#5d5663';g.lineWidth=5;g.beginPath();g.moveTo(-3,25);g.lineTo(-3,-25);g.stroke();g.fillStyle=team==='blue'?BLUE:RED;g.beginPath();g.moveTo(0,-23);g.lineTo(team==='blue'?25:-25,-13);g.lineTo(0,-3);g.closePath();g.fill();g.restore()}

function drawUnit(u){
  if(!u||!u.alive)return;
  g.save();g.translate(u.x,u.y);
  if(u.dodgeT>0)g.rotate(u.rollAngle);
  if(u.inv>0)g.globalAlpha=.55;

  if(u.dodgeT>0){
    g.strokeStyle=u.team==='blue'?'#d7e7ff99':'#ffd9dd99';g.lineWidth=4;g.beginPath();g.arc(0,0,25,-2.5,1.8);g.stroke();
  }
  if(u.controlled){
    g.strokeStyle='#ffe66d';g.lineWidth=3;g.beginPath();g.arc(0,4,25,0,Math.PI*2);g.stroke();
    g.fillStyle='#ffe66d';g.beginPath();g.moveTo(0,-50);g.lineTo(-7,-40);g.lineTo(7,-40);g.closePath();g.fill();
  }

  g.fillStyle='#0002';g.beginPath();g.ellipse(0,14,18,7,0,0,Math.PI*2);g.fill();
  g.fillStyle=u.team==='blue'?BLUE:RED;rr(-14,-8,28,29,8);

  if(u.team==='blue'){
    g.save();g.beginPath();g.rect(-14,-8,28,29);g.clip();g.strokeStyle='#dceaff';g.lineWidth=4;
    for(let k=-28;k<32;k+=12){g.beginPath();g.moveTo(k,-10);g.lineTo(k+24,24);g.stroke()}g.restore();
    g.fillStyle='#ffe66d';g.beginPath();g.arc(0,4,3.5,0,Math.PI*2);g.fill();
  }else{
    g.strokeStyle='#ffd4d7';g.lineWidth=3;g.beginPath();g.moveTo(-10,1);g.lineTo(10,1);g.stroke();
  }

  g.fillStyle=SKIN;g.beginPath();g.arc(0,-17,12,0,Math.PI*2);g.fill();
  g.fillStyle=u.team==='blue'?'#3158ac':'#b74250';
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

function draw(){
  g.fillStyle='#5f7d8a';g.fillRect(0,0,W,H);
  g.fillStyle='#9ad9b8';g.fillRect(COURT.x,COURT.y,COURT.w,COURT.h);
  g.strokeStyle='#fff9d7';g.lineWidth=4;g.strokeRect(COURT.x,COURT.y,COURT.w,COURT.h);
  g.setLineDash([12,12]);g.beginPath();g.moveTo(W/2,COURT.y);g.lineTo(W/2,COURT.y+COURT.h);g.stroke();g.setLineDash([]);
  g.strokeStyle='#ffffff28';g.lineWidth=2;g.beginPath();g.arc(W/2,CY,74,0,Math.PI*2);g.stroke();

  for(const w of walls){g.fillStyle='#c7bda5';rr(w.x+5,w.y+6,w.w,w.h,8);g.fillStyle='#f1e6cc';rr(w.x,w.y,w.w,w.h,8)}
  drawFlag(flagBlue,'blue');drawFlag(flagRed,'red');

  for(const b of bullets){
    g.save();g.shadowBlur=13;g.shadowColor=b.team==='blue'?'#8fc6ff':'#ff9daa';g.fillStyle=b.team==='blue'?'#d9ecff':'#ffe1e4';
    g.beginPath();g.arc(b.x,b.y,b.r,0,Math.PI*2);g.fill();
    if(b.curve){g.strokeStyle=b.team==='blue'?'#826cff':'#e96a93';g.lineWidth=2;g.beginPath();g.arc(b.x,b.y,b.r+4,.3,5.2);g.stroke()}
    g.restore();
  }

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
  if(!running||!player.alive)return;shoot(player,nearest(player,enemies),charged);if(charged)flash('回転弾！',380);
}
$('throwBtn').addEventListener('pointerup',releaseThrow);$('throwBtn').addEventListener('pointercancel',()=>{if(player){player.charging=false;player.chargeT=0}});

// dodge
$('dodgeBtn').addEventListener('pointerdown',e=>{
  e.preventDefault();if(!running||!player.alive)return;
  const now=performance.now()/1000;if(now-player.lastDodge<1.8){flash('回避クールタイム',430);return}
  let x=input.x,y=input.y;
  // 回避は横か後方のみ。敵陣方向（右＝前）への回避は禁止。
  // 前方向を含む入力は、上下成分があれば横回避へ変換。
  // 真っ直ぐ前入力 / 無入力では後方へ回避する。
  if(x>0){
    if(Math.abs(y)>=.15){x=0;y=y>0?1:-1;}
    else{x=-1;y=0;}
  }else if(Math.hypot(x,y)<.15){
    x=-1;y=0;
  }
  const n=norm(x,y);player.dx=n.x;player.dy=n.y;player.lastDodge=now;player.dodgeT=.34;player.inv=.24;
});

for(const id of ['special1','special2'])$(id).addEventListener('pointerdown',e=>{e.preventDefault();if(player&&player.alive){player.emote=.8;flash('✌',420)}});

// menu / cup v2.15
function bindTap(id,fn){const el=$(id);if(!el)return;let fired=false;el.addEventListener('pointerup',e=>{e.preventDefault();fired=true;fn()},{passive:false});el.addEventListener('click',e=>{if(fired){fired=false;return}e.preventDefault();fn()})}
bindTap('cupStartBtn',()=>{mode='cup';cupIndex=0;cupTable=newCupTable();currentOpponent=CUP_ORDER[0];saveData.cupResume=null;writeSave();$('menu').classList.add('hidden');refreshCup();$('cupPanel').classList.remove('hidden');saveCupResume()});
bindTap('cupContinueBtn',()=>{
  const r=saveData.cupResume;
  if(!r)return;
  mode='cup';cupIndex=r.cupIndex||0;cupTable=r.cupTable||newCupTable();
  if($('roleA')&&r.roleA)$('roleA').value=r.roleA;
  if($('roleB')&&r.roleB)$('roleB').value=r.roleB;
  currentOpponent=CUP_ORDER[cupIndex]||CUP_ORDER[0];
  $('menu').classList.add('hidden');
  refreshCup();
  $('cupPanel').classList.remove('hidden');
});
bindTap('practiceBtn',()=>{mode='practice';currentOpponent='rush';bScore=0;rScore=0;round=1;score.textContent='0 - 0';$('menu').classList.add('hidden');reset()});
bindTap('cupMatchBtn',()=>{currentOpponent=CUP_ORDER[cupIndex];bScore=0;rScore=0;round=1;score.textContent='0 - 0';$('cupPanel').classList.add('hidden');reset()});
bindTap('cupBackBtn',()=>{saveCupResume();mode='menu';$('cupPanel').classList.add('hidden');$('menu').classList.remove('hidden')});
bindTap('cupFinishBtn',()=>{mode='menu';$('cupEndPanel').classList.add('hidden');$('menu').classList.remove('hidden')});
bindTap('nextBtn',()=>{
  $('result').classList.add('hidden');
  const ended=bScore>=2||rScore>=2;
  if(!ended){round++;reset();return}
  if(mode==='cup'){
    recordMatch('player',CUP_ORDER[cupIndex],bScore,rScore);
    if(bScore>rScore)saveData.totalWins++;else saveData.totalLosses++;
    cupIndex++;
    if(cupIndex>=3){
      finishCup();
    }else{
      saveCupResume();
      refreshCup();
      $('cupPanel').classList.remove('hidden');
    }
  }else{
    if(bScore>rScore)saveData.totalWins++;else saveData.totalLosses++;
    writeSave();
    mode='menu';$('menu').classList.remove('hidden');
  }
});
for(const ev of ['contextmenu','selectstart','dragstart'])document.addEventListener(ev,e=>{if(e.target.closest('#gameWrap')||e.target.closest('button'))e.preventDefault()},{passive:false});
refreshRecordUI();
window.__gameDebug=()=>({mode,cupIndex,currentOpponent,enemies:enemies.length,aliveEnemies:enemies.filter(e=>e.alive).length,menuHidden:$('menu').classList.contains('hidden'),cupHidden:$('cupPanel').classList.contains('hidden'),running,saveData:JSON.parse(JSON.stringify(saveData))});
})();