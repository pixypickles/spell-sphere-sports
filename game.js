(()=>{'use strict';
const c=document.getElementById('game'),g=c.getContext('2d'),W=1280,H=720;
// Side margins are UI zones. Court is horizontal and teams attack left/right.
const COURT={x:190,y:72,w:900,h:576}, CY=360;
const BLUE='#4d86ff',RED='#ff6c72',SKIN='#f4dfc3',EYE='#182239';
const walls=[
 // LEFT FIELD — symmetric upper/lower cover
 {x:330,y:195,w:18,h:95},
 {x:330,y:370,w:18,h:95},
 {x:420,y:155,w:18,h:85},
 {x:420,y:387,w:18,h:85},
 {x:505,y:175,w:70,h:16},
 {x:505,y:456,w:70,h:16},

 // RIGHT FIELD — mirror of left
 {x:932,y:195,w:18,h:95},
 {x:932,y:370,w:18,h:95},
 {x:842,y:155,w:18,h:85},
 {x:842,y:387,w:18,h:85},
 {x:705,y:175,w:70,h:16},
 {x:705,y:456,w:70,h:16},

 // CENTRAL HOLLOW BUNKER — centered vertically
 {x:545,y:270,w:190,h:18},
 {x:545,y:372,w:190,h:18},
 {x:545,y:288,w:18,h:84},
 {x:717,y:288,w:18,h:84},

 // mid-lane short covers, matched top/bottom clearance
 {x:455,y:325,w:62,h:16},
 {x:763,y:325,w:62,h:16}
];
const flagBlue={x:230,y:360}, flagRed={x:1050,y:360};
let player=null,allies=[],enemies=[],bullets=[],fx=[];let running=false,over=false,last=0,left=60,secAcc=0,bScore=0,rScore=0,round=1,msgUntil=0;
let input={x:0,y:0,active:false};let keys={};let heldAt=0;
const $=id=>document.getElementById(id),score=$('score'),clock=$('clock'),roundLabel=$('roundLabel'),manaFill=$('manaFill'),message=$('message');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));const norm=(x,y)=>{const d=Math.hypot(x,y)||1;return{x:x/d,y:y/d}};const d2=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
class Unit{constructor(x,y,team,controlled=false,role='balance'){Object.assign(this,{x,y,team,controlled,role,r:17,alive:true,mana:100,lastShot:-9,shotCd:.85,lastDodge:-9,dodgeT:0,inv:0,dx:0,dy:0,emote:0,think:0,target:null,charging:false,chargeT:0,curveSide:1,rollAngle:0});this.speed=controlled?190:158}update(dt){if(!this.alive)return;this.mana=Math.min(100,this.mana+8*dt);this.dodgeT=Math.max(0,this.dodgeT-dt);this.inv=Math.max(0,this.inv-dt);this.emote=Math.max(0,this.emote-dt);
if(this.charging)this.chargeT=Math.min(.8,this.chargeT+dt);
if(this.dodgeT>0)this.rollAngle+=dt*18;
else this.rollAngle=0}}
class Bullet{constructor(x,y,dx,dy,team,curve,target,curveSide=1){Object.assign(this,{x,y,dx,dy,team,curve,target,r:7,life:3.6,speed:curve?315:355,curveSide,age:0})}update(dt){this.life-=dt;this.age+=dt;if(this.curve&&this.target&&this.target.alive){let n=norm(this.target.x-this.x,this.target.y-this.y);let k=Math.min(1,(2.9+this.age*1.3)*dt);this.dx=this.dx*(1-k)+n.x*k;this.dy=this.dy*(1-k)+n.y*k;let q=norm(this.dx,this.dy);this.dx=q.x;this.dy=q.y}this.x+=this.dx*this.speed*dt;this.y+=this.dy*this.speed*dt;if(this.x<COURT.x||this.x>COURT.x+COURT.w||this.y<COURT.y||this.y>COURT.y+COURT.h){this.life=0;return}for(const w of walls){if(circleRect(this.x,this.y,this.r,w)){this.life=0;spark(this.x,this.y);return}}const arr=this.team==='blue'?enemies:[player,...allies];for(const u of arr){if(u&&u.alive&&u.inv<=0&&Math.hypot(this.x-u.x,this.y-u.y)<this.r+u.r){u.alive=false;this.life=0;spark(u.x,u.y);flash(u.controlled?'OUT!':(u.team==='red'?'ENEMY OUT':'ALLY OUT'),700);checkEnd();return}}}}
function circleRect(x,y,r,w){const cx=clamp(x,w.x,w.x+w.w),cy=clamp(y,w.y,w.y+w.h);return Math.hypot(x-cx,y-cy)<r}
function canStand(x,y,r){if(x<COURT.x+r||x>COURT.x+COURT.w-r||y<COURT.y+r||y>COURT.y+COURT.h-r)return false;return !walls.some(w=>circleRect(x,y,r,w))}
function move(u,x,y,dt){if(!u.alive)return;let s=u.speed*(u.dodgeT>0?2.25:1),nx=u.x+x*s*dt,ny=u.y+y*s*dt;if(canStand(nx,u.y,u.r))u.x=nx;if(canStand(u.x,ny,u.r))u.y=ny}
function shoot(u,target,curve=false){if(!u||!u.alive||!target||!target.alive)return;const cost=curve?16:11,now=performance.now()/1000;if(u.mana<cost||now-u.lastShot<u.shotCd)return;u.lastShot=now;u.mana-=cost;let direct=norm(target.x-u.x,target.y-u.y),dx=direct.x,dy=direct.y,side=1;if(curve){if(Math.abs(target.y-u.y)>24)side=target.y>=u.y?-1:1;else{u.curveSide*=-1;side=u.curveSide}const bend=.78;dx=direct.x+(-direct.y)*bend*side;dy=direct.y+(direct.x)*bend*side;let q=norm(dx,dy);dx=q.x;dy=q.y}bullets.push(new Bullet(u.x+dx*23,u.y+dy*23,dx,dy,u.team,curve,target,side))}
function nearest(u,arr){return arr.filter(v=>v&&v.alive).sort((a,b)=>d2(u,a)-d2(u,b))[0]||null}
function reset(){bullets=[];fx=[];left=60;secAcc=0;over=false;running=true;player=new Unit(300,360,'blue',true);allies=[new Unit(275,220,'blue',false,$('roleA').value),new Unit(275,500,'blue',false,$('roleB').value)];enemies=[new Unit(980,210,'red',false,'attacker'),new Unit(995,360,'red',false,'shooter'),new Unit(980,510,'red',false,'guard')];clock.textContent='1:00';roundLabel.textContent='ROUND '+round;flash('ROUND '+round,1000)}
function ai(u,dt,enemy){if(!u.alive)return;u.think-=dt;if(u.think<=0){u.think=.18+Math.random()*.18;u.target=nearest(u,enemy?[player,...allies]:enemies)}const target=u.target,enemyFlag=enemy?flagBlue:flagRed,ownFlag=enemy?flagRed:flagBlue;let tx=u.x,ty=u.y;if(u.role==='attacker'){tx=enemyFlag.x;ty=enemyFlag.y}else if(u.role==='guard'){if(target&&d2(u,target)<270){tx=target.x;ty=target.y}else{tx=ownFlag.x;ty=ownFlag.y}}else if(u.role==='support'&&!enemy&&player&&player.alive){tx=player.x+70;ty=player.y}else if(u.role==='shooter'&&target){const ds=d2(u,target);if(ds<235){tx=u.x-(target.x-u.x);ty=u.y-(target.y-u.y)}else if(ds>410){tx=target.x;ty=target.y}}else if(target){tx=target.x;ty=target.y}let n=norm(tx-u.x,ty-u.y);if(walls.some(w=>circleRect(u.x+n.x*28,u.y+n.y*28,u.r,w))){n={x:-n.y,y:n.x}}const danger=bullets.find(b=>b.team!==u.team&&Math.hypot(b.x-u.x,b.y-u.y)<95),now=performance.now()/1000;if(danger&&now-u.lastDodge>1.9&&Math.random()<.09){u.lastDodge=now;u.dodgeT=.32;u.inv=.23;n={x:-danger.dy,y:danger.dx}}move(u,n.x,n.y,dt);if(target&&d2(u,target)<530)shoot(u,target,Math.random()<.22)}
function checkFlags(){for(const u of [player,...allies])if(u&&u.alive&&d2(u,flagRed)<u.r+22)return finish('blue','敵旗を取りました！');for(const u of enemies)if(u.alive&&d2(u,flagBlue)<u.r+22)return finish('red','敵に旗を取られました');if(player&&player.alive&&d2(player,flagBlue)<45)player.mana=Math.min(100,player.mana+36/60)}
function checkEnd(){if(enemies.every(e=>!e.alive))finish('blue','敵3人を全員アウト！');else if([player,...allies].every(e=>!e.alive))finish('red','味方が全員アウト')}
function finish(team,text){if(over)return;over=true;running=false;if(team==='blue')bScore++;else rScore++;score.textContent=`${bScore} - ${rScore}`;setTimeout(()=>{const match=bScore>=2||rScore>=2;$('resultTitle').textContent=match?(bScore>rScore?'MATCH WIN!':'MATCH LOSE'):(team==='blue'?'ROUND WIN!':'ROUND LOSE');$('resultText').textContent=text;$('nextBtn').textContent=match?'最初に戻る':'次のラウンド';$('result').classList.remove('hidden')},350)}
function flash(t,ms=700){message.textContent=t;msgUntil=performance.now()+ms}function spark(x,y){for(let i=0;i<8;i++)fx.push({x,y,vx:(Math.random()-.5)*150,vy:(Math.random()-.5)*150,t:.4})}
function update(dt){if(!running)return;secAcc+=dt;if(secAcc>=1){secAcc-=1;left--;clock.textContent='0:'+String(Math.max(0,left)).padStart(2,'0')}if(left<=0){const ba=[player,...allies].filter(u=>u.alive).length,ra=enemies.filter(u=>u.alive).length;finish(ba>=ra?'blue':'red',`時間切れ 生存 ${ba} - ${ra}`);return}player.update(dt);let ix=input.x+(keys.ArrowRight||keys.d?1:0)-(keys.ArrowLeft||keys.a?1:0),iy=input.y+(keys.ArrowDown||keys.s?1:0)-(keys.ArrowUp||keys.w?1:0);if(Math.hypot(ix,iy)>1){let n=norm(ix,iy);ix=n.x;iy=n.y}if(player.dodgeT>0){ix=player.dx;iy=player.dy}move(player,ix,iy,dt);for(const a of allies){a.update(dt);ai(a,dt,false)}for(const e of enemies){e.update(dt);ai(e,dt,true)}for(const b of bullets)b.update(dt);

// opposing magic bullets cancel each other out
for(let i=0;i<bullets.length;i++){
 const a=bullets[i];
 if(a.life<=0)continue;
 for(let j=i+1;j<bullets.length;j++){
  const b=bullets[j];
  if(b.life<=0||a.team===b.team)continue;
  if(Math.hypot(a.x-b.x,a.y-b.y)<a.r+b.r+2){
   const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
   a.life=0;b.life=0;
   spark(mx,my);
   break;
  }
 }
}
bullets=bullets.filter(b=>b.life>0);for(const p of fx){p.x+=p.vx*dt;p.y+=p.vy*dt;p.t-=dt}fx=fx.filter(p=>p.t>0);checkFlags();manaFill.style.width=player.mana+'%';if(msgUntil&&performance.now()>msgUntil){message.textContent='';msgUntil=0}}
function drawFlag(f,team){g.save();g.translate(f.x,f.y);g.strokeStyle='#5d5663';g.lineWidth=5;g.beginPath();g.moveTo(-3,25);g.lineTo(-3,-25);g.stroke();g.fillStyle=team==='blue'?BLUE:RED;g.beginPath();g.moveTo(0,-23);g.lineTo(team==='blue'?25:-25,-13);g.lineTo(0,-3);g.closePath();g.fill();g.restore()}
function rr(x,y,w,h,r){r=Math.min(r,w/2,h/2);g.beginPath();g.moveTo(x+r,y);g.lineTo(x+w-r,y);g.quadraticCurveTo(x+w,y,x+w,y+r);g.lineTo(x+w,y+h-r);g.quadraticCurveTo(x+w,y+h,x+w-r,y+h);g.lineTo(x+r,y+h);g.quadraticCurveTo(x,y+h,x,y+h-r);g.lineTo(x,y+r);g.quadraticCurveTo(x,y,x+r,y);g.closePath();g.fill()}
function drawUnit(u){if(!u||!u.alive)return;g.save();g.translate(u.x,u.y);
 if(u.dodgeT>0)g.rotate(u.rollAngle);
 if(u.inv>0)g.globalAlpha=.55;
 if(u.dodgeT>0){
   g.save();
   g.strokeStyle=u.team==='blue'?'#d7e7ff99':'#ffd9dd99';
   g.lineWidth=4;
   g.beginPath();
   g.arc(0,0,25,-2.5,1.8);
   g.stroke();
   g.restore();
 }
 if(u.controlled){g.strokeStyle='#ffe66d';g.lineWidth=3;g.beginPath();g.arc(0,4,25,0,Math.PI*2);g.stroke();g.fillStyle='#ffe66d';g.beginPath();g.moveTo(0,-50);g.lineTo(-7,-40);g.lineTo(7,-40);g.closePath();g.fill()}
 g.fillStyle='#0002';g.beginPath();g.ellipse(0,14,18,7,0,0,Math.PI*2);g.fill();

 // sporty magic uniform
 g.fillStyle=u.team==='blue'?BLUE:RED;rr(-14,-8,28,29,8);
 // team pattern
 if(u.team==='blue'){g.save();g.beginPath();g.rect(-14,-8,28,29);g.clip();g.strokeStyle='#dceaff';g.lineWidth=4;for(let k=-28;k<32;k+=12){g.beginPath();g.moveTo(k,-10);g.lineTo(k+24,24);g.stroke()}g.restore();g.fillStyle='#ffe66d';g.beginPath();g.arc(0,4,3.5,0,Math.PI*2);g.fill()}
 else {g.strokeStyle='#ffd4d7';g.lineWidth=3;g.beginPath();g.moveTo(-10,1);g.lineTo(10,1);g.stroke()}

 g.fillStyle=SKIN;g.beginPath();g.arc(0,-17,12,0,Math.PI*2);g.fill();
 g.fillStyle=u.team==='blue'?'#3158ac':'#b74250';g.beginPath();g.moveTo(-13,-24);g.quadraticCurveTo(-5,-43,7,-35);g.quadraticCurveTo(19,-31,12,-21);g.closePath();g.fill();
 g.strokeStyle='#f4ead9';g.lineWidth=4;g.beginPath();g.moveTo(-13,-25);g.lineTo(13,-25);g.stroke();
 g.fillStyle=EYE;g.beginPath();g.arc(-4,-18,1.8,0,Math.PI*2);g.arc(4,-18,1.8,0,Math.PI*2);g.fill();

 // charged curve throw motion
 if(u.charging){const t=performance.now()/1000,spin=t*10;g.strokeStyle='#b9a1ff';g.lineWidth=3;g.beginPath();g.arc(0,-2,24+Math.sin(t*12)*2,spin,spin+Math.PI*1.55);g.stroke();g.fillStyle='#e8ddff';const ox=Math.cos(spin)*21,oy=-2+Math.sin(spin)*12;g.beginPath();g.arc(ox,oy,5+u.chargeT*3,0,Math.PI*2);g.fill();g.strokeStyle='#fff';g.lineWidth=2;g.beginPath();g.moveTo(8,-3);g.lineTo(15+Math.cos(spin)*4,-14+Math.sin(spin)*3);g.stroke()}
 if(u.emote>0){g.font='19px sans-serif';g.fillText('✌',14,-31)}g.restore()}
function draw(){g.fillStyle='#5f7d8a';g.fillRect(0,0,W,H); // UI outside court
 g.fillStyle='#9ad9b8';g.fillRect(COURT.x,COURT.y,COURT.w,COURT.h);g.strokeStyle='#fff9d7';g.lineWidth=4;g.strokeRect(COURT.x,COURT.y,COURT.w,COURT.h);g.setLineDash([12,12]);g.beginPath();g.moveTo(W/2,COURT.y);g.lineTo(W/2,COURT.y+COURT.h);g.stroke();g.setLineDash([]);
 // subtle fantasy markings
 g.strokeStyle='#ffffff28';g.lineWidth=2;g.beginPath();g.arc(W/2,CY,74,0,Math.PI*2);g.stroke();
 for(const w of walls){g.fillStyle='#c7bda5';rr(w.x+5,w.y+6,w.w,w.h,8);g.fillStyle='#f1e6cc';rr(w.x,w.y,w.w,w.h,8)}drawFlag(flagBlue,'blue');drawFlag(flagRed,'red');for(const b of bullets){g.save();g.shadowBlur=13;g.shadowColor=b.team==='blue'?'#8fc6ff':'#ff9daa';g.fillStyle=b.team==='blue'?'#d9ecff':'#ffe1e4';g.beginPath();g.arc(b.x,b.y,b.r,0,Math.PI*2);g.fill();if(b.curve){g.strokeStyle=b.team==='blue'?'#826cff':'#e96a93';g.lineWidth=2;g.beginPath();g.arc(b.x,b.y,b.r+4,.3,5.2);g.stroke();g.globalAlpha=.35;g.beginPath();g.moveTo(b.x-b.dx*22,b.y-b.dy*22);g.lineTo(b.x-b.dx*7,b.y-b.dy*7);g.stroke();g.globalAlpha=1}g.restore()}for(const a of allies)drawUnit(a);for(const e of enemies)drawUnit(e);drawUnit(player);for(const p of fx){g.globalAlpha=Math.max(0,p.t/.4);g.fillStyle='#fff';g.beginPath();g.arc(p.x,p.y,4,0,Math.PI*2);g.fill();g.globalAlpha=1}}
function frame(t){let dt=Math.min(.033,(t-last)/1000||0);last=t;update(dt);draw();requestAnimationFrame(frame)}requestAnimationFrame(frame);
// Large joystick touch zone, based on the reference game's robust pointer handling.
const zone=$('stickZone'),base=$('stickBase'),knob=$('stickKnob');let ptr=null;
function stick(clientX,clientY){const r=base.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=clientX-cx,dy=clientY-cy,max=r.width*.36,mag=Math.hypot(dx,dy);if(mag>max){dx=dx/mag*max;dy=dy/mag*max}knob.style.transform=`translate(${dx}px,${dy}px)`;let sx=dx/max,sy=dy/max;if(Math.hypot(sx,sy)<.12){sx=sy=0}input.x=sx;input.y=sy;input.active=!!(sx||sy)}
zone.addEventListener('pointerdown',e=>{e.preventDefault();if(ptr!==null&&ptr!==e.pointerId)return;ptr=e.pointerId;try{zone.setPointerCapture(e.pointerId)}catch(_){}stick(e.clientX,e.clientY)});zone.addEventListener('pointermove',e=>{if(e.pointerId===ptr){e.preventDefault();stick(e.clientX,e.clientY)}});function release(e){if(ptr===null||!e||e.pointerId===ptr){ptr=null;input.x=input.y=0;input.active=false;knob.style.transform='translate(0,0)'}}zone.addEventListener('pointerup',release);zone.addEventListener('pointercancel',release);
addEventListener('keydown',e=>{keys[e.key]=true});addEventListener('keyup',e=>{keys[e.key]=false});
$('throwBtn').addEventListener('pointerdown',e=>{e.preventDefault();heldAt=performance.now();if(player&&player.alive){player.charging=true;player.chargeT=0}try{$('throwBtn').setPointerCapture(e.pointerId)}catch(_){}});function releaseThrow(e){if(e)e.preventDefault();if(!player)return;const charged=performance.now()-heldAt>=180;player.charging=false;player.chargeT=0;if(!running||!player.alive)return;const tar=nearest(player,enemies);shoot(player,tar,charged);if(charged)flash('回転弾！',380)}$('throwBtn').addEventListener('pointerup',releaseThrow);$('throwBtn').addEventListener('pointercancel',e=>{if(player){player.charging=false;player.chargeT=0}});
$('dodgeBtn').addEventListener('pointerdown',e=>{e.preventDefault();if(!running||!player.alive)return;let now=performance.now()/1000;if(now-player.lastDodge<1.8){flash('回避クールタイム',450);return}let x=input.x,y=input.y;if(Math.hypot(x,y)<.15){x=1;y=0}let n=norm(x,y);player.dx=n.x;player.dy=n.y;player.lastDodge=now;player.dodgeT=.34;player.inv=.24});
for(const id of ['special1','special2'])$(id).addEventListener('pointerdown',e=>{e.preventDefault();if(player&&player.alive){player.emote=.8;flash('✌',420)}});
const startGame=()=>{bScore=rScore=0;round=1;score.textContent='0 - 0';$('menu').classList.add('hidden');reset()};
const nextRound=()=>{$('result').classList.add('hidden');if(bScore>=2||rScore>=2){bScore=rScore=0;round=1;score.textContent='0 - 0';$('menu').classList.remove('hidden')}else{round++;reset()}};
function bindTap(el,fn){let fired=false;el.addEventListener('pointerup',e=>{e.preventDefault();fired=true;fn();setTimeout(()=>fired=false,300)});el.addEventListener('click',e=>{e.preventDefault();if(!fired)fn()});}
bindTap($('startBtn'),startGame);bindTap($('nextBtn'),nextRound);
})();