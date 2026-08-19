(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const gameRect = {x:150,y:45,w:980,h:630};
  const centerX = W/2;

  const COLORS = {
    court:"#8fd6b5", court2:"#a7e5c6", line:"#f9f6d2", blue:"#4f8cff", red:"#ff6b6b",
    wall:"#efe7d0", wallEdge:"#c7bca2", eye:"#1b2235", mana:"#8d70ff", flagBlue:"#5f91ff", flagRed:"#ff7272"
  };

  const walls = [
    {x:330,y:155,w:120,h:42},{x:550,y:150,w:110,h:42},{x:780,y:155,w:120,h:42},
    {x:410,y:295,w:120,h:42},{x:730,y:295,w:120,h:42},
    {x:330,y:525,w:120,h:42},{x:550,y:530,w:110,h:42},{x:780,y:525,w:120,h:42},
    {x:160,y:250,w:45,h:130},{x:1075,y:340,w:45,h:130}
  ];

  let player, allies=[], enemies=[], bullets=[], particles=[];
  let running=false, roundOver=false, timeLeft=60, lastTime=0, timerAcc=0;
  let blueScore=0, redScore=0, roundNo=1;
  let throwPressAt=0;
  let messageUntil=0;

  const manaFill = document.getElementById("manaFill");
  const timerEl = document.getElementById("timer");
  const scoreBlue = document.getElementById("scoreBlue");
  const scoreRed = document.getElementById("scoreRed");
  const messageEl = document.getElementById("message");
  const rolePanel = document.getElementById("rolePanel");
  const resultPanel = document.getElementById("resultPanel");
  const resultTitle = document.getElementById("resultTitle");
  const resultText = document.getElementById("resultText");

  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const pointInRect=(x,y,r)=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h;

  class Unit {
    constructor(x,y,team,isPlayer=false,role="balance"){
      this.x=x; this.y=y; this.team=team; this.isPlayer=isPlayer; this.role=role;
      this.r=20; this.speed=isPlayer?165:145; this.alive=true; this.mana=100;
      this.lastShot=-99; this.shotCd=0.95 + Math.random()*.25;
      this.lastDodge=-99; this.dodgeCd=1.75; this.invuln=0; this.dodgeT=0;
      this.vx=0; this.vy=0; this.faceY=-1; this.think=0; this.target=null;
      this.emote=0;
    }
    tryShoot(target, curved=false){
      if(!this.alive || this.mana < (curved?16:11)) return;
      const now=performance.now()/1000;
      if(now-this.lastShot < this.shotCd) return;
      this.lastShot=now;
      this.mana -= curved?16:11;
      let dx=target.x-this.x, dy=target.y-this.y, d=Math.hypot(dx,dy)||1;
      dx/=d; dy/=d;
      bullets.push(new Bullet(this.x,this.y-6,dx,dy,this.team,curved,target));
    }
    update(dt){
      if(!this.alive) return;
      this.mana=Math.min(100,this.mana+7.5*dt);
      this.invuln=Math.max(0,this.invuln-dt);
      this.dodgeT=Math.max(0,this.dodgeT-dt);
      this.emote=Math.max(0,this.emote-dt);
    }
  }

  class Bullet {
    constructor(x,y,dx,dy,team,curved,target){
      this.x=x;this.y=y;this.dx=dx;this.dy=dy;this.team=team;this.r=8;
      this.speed=curved?285:330; this.curved=curved; this.target=target; this.life=3.2;
    }
    update(dt){
      this.life-=dt;
      if(this.curved && this.target && this.target.alive){
        const tx=this.target.x-this.x, ty=this.target.y-this.y, td=Math.hypot(tx,ty)||1;
        const desiredX=tx/td, desiredY=ty/td;
        const turn=1.35*dt;
        this.dx=this.dx*(1-turn)+desiredX*turn;
        this.dy=this.dy*(1-turn)+desiredY*turn;
        const n=Math.hypot(this.dx,this.dy)||1; this.dx/=n; this.dy/=n;
      }
      this.x+=this.dx*this.speed*dt; this.y+=this.dy*this.speed*dt;
      if(!pointInRect(this.x,this.y,gameRect)) this.life=0;
      for(const w of walls){
        if(this.x+this.r>w.x && this.x-this.r<w.x+w.w && this.y+this.r>w.y && this.y-this.r<w.y+w.h){
          this.life=0; spark(this.x,this.y,"#fff3c4");
        }
      }
      const targets=this.team==="blue"?enemies:[player,...allies];
      for(const u of targets){
        if(u && u.alive && u.invuln<=0 && Math.hypot(this.x-u.x,this.y-u.y)<this.r+u.r){
          u.alive=false; this.life=0; spark(u.x,u.y,"#fff");
          showMessage(u.isPlayer?"OUT!":(u.team==="red"?"ENEMY OUT":"ALLY OUT"),1100);
          checkRoundEnd();
          break;
        }
      }
    }
  }

  function spark(x,y,color){
    for(let i=0;i<8;i++) particles.push({x,y,vx:(Math.random()-.5)*150,vy:(Math.random()-.5)*150,t:.45,color});
  }

  function circleRectCollide(nx,ny,r,rect){
    const cx=clamp(nx,rect.x,rect.x+rect.w), cy=clamp(ny,rect.y,rect.y+rect.h);
    return Math.hypot(nx-cx,ny-cy)<r;
  }

  function moveUnit(u,dx,dy,dt){
    if(!u.alive) return;
    const speed=u.speed*(u.dodgeT>0?2.15:1);
    let nx=u.x+dx*speed*dt, ny=u.y+dy*speed*dt;
    nx=clamp(nx,gameRect.x+u.r,gameRect.x+gameRect.w-u.r);
    ny=clamp(ny,gameRect.y+u.r,gameRect.y+gameRect.h-u.r);
    if(!walls.some(w=>circleRectCollide(nx,u.y,u.r,w))) u.x=nx;
    if(!walls.some(w=>circleRectCollide(u.x,ny,u.r,w))) u.y=ny;
  }

  function resetRound(){
    bullets=[]; particles=[]; timeLeft=60; timerAcc=0; roundOver=false; running=true;
    player=new Unit(centerX,585,"blue",true);
    allies=[
      new Unit(420,575,"blue",false,document.getElementById("ally1Role").value),
      new Unit(860,575,"blue",false,document.getElementById("ally2Role").value)
    ];
    enemies=[
      new Unit(400,105,"red",false,"attacker"),
      new Unit(640,105,"red",false,"shooter"),
      new Unit(880,105,"red",false,"guard")
    ];
    showMessage(`ROUND ${roundNo}`,1300);
  }

  function nearestEnemy(u){
    return enemies.filter(e=>e.alive).sort((a,b)=>dist(u,a)-dist(u,b))[0];
  }
  function nearestBlue(u){
    return [player,...allies].filter(e=>e && e.alive).sort((a,b)=>dist(u,a)-dist(u,b))[0];
  }

  function aiMove(u,dt,isEnemy=false){
    if(!u.alive) return;
    u.think-=dt;
    if(u.think<=0){
      u.think=.18+Math.random()*.2;
      u.target=isEnemy?nearestBlue(u):nearestEnemy(u);
    }
    let dx=0,dy=0;
    const enemyFlag = isEnemy ? {x:640,y:642} : {x:640,y:78};
    const ownFlag = isEnemy ? {x:640,y:78} : {x:640,y:642};
    const t=u.target;

    if(u.role==="attacker"){
      dx=enemyFlag.x-u.x; dy=enemyFlag.y-u.y;
    } else if(u.role==="guard"){
      if(t && dist(u,t)<280){ dx=t.x-u.x; dy=t.y-u.y; }
      else { dx=ownFlag.x-u.x; dy=ownFlag.y-u.y; }
    } else if(u.role==="support"){
      if(player && player.alive && !isEnemy){ dx=player.x-u.x; dy=(player.y-65)-u.y; }
      else if(t){ dx=t.x-u.x; dy=t.y-u.y; }
    } else if(u.role==="shooter"){
      if(t){
        let d=dist(u,t);
        if(d<230){ dx=u.x-t.x; dy=u.y-t.y; }
        else if(d>430){ dx=t.x-u.x; dy=t.y-u.y; }
      }
    } else {
      if(t){ dx=t.x-u.x; dy=t.y-u.y; }
    }
    let n=Math.hypot(dx,dy)||1; dx/=n;dy/=n;

    // crude wall avoidance
    if(walls.some(w=>circleRectCollide(u.x+dx*28,u.y+dy*28,u.r,w))){
      const tmp=dx; dx=-dy; dy=tmp;
    }

    // dodge incoming bullets occasionally
    const incoming=bullets.find(b=>b.team!==u.team && Math.hypot(b.x-u.x,b.y-u.y)<110);
    const now=performance.now()/1000;
    if(incoming && now-u.lastDodge>u.dodgeCd && Math.random()<.11){
      u.lastDodge=now; u.dodgeT=.34; u.invuln=.24;
      dx=Math.random()<.5?-incoming.dy:incoming.dy;
      dy=Math.random()<.5?incoming.dx:-incoming.dx;
    }
    moveUnit(u,dx,dy,dt);

    if(t && dist(u,t)<520){
      const curved=Math.random()<.25;
      u.tryShoot(t,curved);
    }
  }

  function checkFlags(){
    const enemyFlag={x:640,y:78,r:24}, ownFlag={x:640,y:642,r:24};
    for(const u of [player,...allies]){
      if(u && u.alive && Math.hypot(u.x-enemyFlag.x,u.y-enemyFlag.y)<u.r+enemyFlag.r){
        endRound("blue","旗を取りました！");
        return;
      }
    }
    for(const u of enemies){
      if(u.alive && Math.hypot(u.x-ownFlag.x,u.y-ownFlag.y)<u.r+ownFlag.r){
        endRound("red","敵に旗を取られました");
        return;
      }
    }
    // Own flag rapidly restores player's mana
    if(player && player.alive && Math.hypot(player.x-ownFlag.x,player.y-ownFlag.y)<player.r+34){
      player.mana=Math.min(100,player.mana+42/60);
    }
  }

  function checkRoundEnd(){
    if(roundOver) return;
    const blueAlive=[player,...allies].filter(u=>u&&u.alive).length;
    const redAlive=enemies.filter(u=>u.alive).length;
    if(redAlive===0) endRound("blue","敵チームを全員アウト！");
    else if(blueAlive===0) endRound("red","味方チームが全員アウト");
  }

  function endRound(winner,reason){
    if(roundOver) return;
    roundOver=true; running=false;
    if(winner==="blue") blueScore++; else redScore++;
    scoreBlue.textContent=blueScore; scoreRed.textContent=redScore;

    setTimeout(()=>{
      resultPanel.classList.remove("hidden");
      if(blueScore>=2 || redScore>=2){
        resultTitle.textContent=blueScore>redScore?"MATCH WIN!":"MATCH LOSE";
        resultText.textContent=`${reason}　最終スコア ${blueScore} - ${redScore}`;
        document.getElementById("nextBtn").textContent="もう一度";
      } else {
        resultTitle.textContent=winner==="blue"?"ROUND WIN!":"ROUND LOSE";
        resultText.textContent=reason;
        document.getElementById("nextBtn").textContent="次のラウンド";
      }
    },450);
  }

  function showMessage(text,ms=900){
    messageEl.textContent=text; messageUntil=performance.now()+ms;
  }

  // joystick
  let stickPointer=null, stickVec={x:0,y:0};
  const stick=document.getElementById("stick"), knob=document.getElementById("knob");
  function setStickFromEvent(e){
    const r=stick.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2;
    let dx=e.clientX-cx,dy=e.clientY-cy;
    const max=r.width*.31, d=Math.hypot(dx,dy)||1, m=Math.min(max,d);
    dx=dx/d*m;dy=dy/d*m;
    knob.style.transform=`translate(${dx}px,${dy}px)`;
    stickVec={x:dx/max,y:dy/max};
  }
  stick.addEventListener("pointerdown",e=>{stickPointer=e.pointerId;stick.setPointerCapture(e.pointerId);setStickFromEvent(e);});
  stick.addEventListener("pointermove",e=>{if(e.pointerId===stickPointer)setStickFromEvent(e);});
  function releaseStick(e){if(e.pointerId===stickPointer){stickPointer=null;stickVec={x:0,y:0};knob.style.transform="translate(0,0)";}}
  stick.addEventListener("pointerup",releaseStick); stick.addEventListener("pointercancel",releaseStick);

  const throwBtn=document.getElementById("throwBtn");
  throwBtn.addEventListener("pointerdown",()=>{throwPressAt=performance.now();});
  throwBtn.addEventListener("pointerup",()=>{
    if(!running||!player.alive)return;
    const held=performance.now()-throwPressAt;
    const target=nearestEnemy(player);
    if(!target)return;
    player.lastShot=-99; // player's throw button controls cadence through mana only in prototype
    player.shotCd=.24;
    player.tryShoot(target,held>=180);
    player.shotCd=.95;
  });

  document.getElementById("dodgeBtn").addEventListener("pointerdown",()=>{
    if(!running||!player.alive)return;
    const now=performance.now()/1000;
    if(now-player.lastDodge<player.dodgeCd){showMessage("回避はまだ使えません",500);return;}
    let dx=stickVec.x,dy=stickVec.y;
    if(Math.hypot(dx,dy)<.2){dx=0;dy=-1;}
    player.lastDodge=now; player.dodgeT=.36; player.invuln=.26;
    player.vx=dx;player.vy=dy;
  });

  for(const id of ["special1","special2"]){
    document.getElementById(id).addEventListener("pointerdown",()=>{
      if(!running||!player.alive)return;
      player.emote=.8; showMessage("✌️",500);
    });
  }

  document.getElementById("startBtn").addEventListener("click",()=>{
    blueScore=0;redScore=0;roundNo=1;
    scoreBlue.textContent="0";scoreRed.textContent="0";
    rolePanel.classList.add("hidden");
    resetRound();
  });

  document.getElementById("nextBtn").addEventListener("click",()=>{
    resultPanel.classList.add("hidden");
    if(blueScore>=2 || redScore>=2){
      blueScore=0;redScore=0;roundNo=1;
      scoreBlue.textContent="0";scoreRed.textContent="0";
      rolePanel.classList.remove("hidden");
    } else {
      roundNo++; resetRound();
    }
  });

  function drawCourt(){
    ctx.fillStyle=COLORS.court;ctx.fillRect(0,0,W,H);
    ctx.fillStyle=COLORS.court2;ctx.fillRect(gameRect.x,gameRect.y,gameRect.w,gameRect.h);
    ctx.strokeStyle=COLORS.line;ctx.lineWidth=4;ctx.strokeRect(gameRect.x,gameRect.y,gameRect.w,gameRect.h);
    ctx.setLineDash([14,14]);ctx.beginPath();ctx.moveTo(gameRect.x,centerY());ctx.lineTo(gameRect.x+gameRect.w,centerY());ctx.stroke();ctx.setLineDash([]);
    for(const w of walls){
      ctx.fillStyle=COLORS.wallEdge; roundRect(w.x+5,w.y+7,w.w,w.h,10,true);
      ctx.fillStyle=COLORS.wall; roundRect(w.x,w.y,w.w,w.h,10,true);
      ctx.strokeStyle="#ffffff70";ctx.lineWidth=2;roundRect(w.x,w.y,w.w,w.h,10,false,true);
    }
    drawFlag(640,78,"red");drawFlag(640,642,"blue");
  }
  function centerY(){return gameRect.y+gameRect.h/2;}
  function roundRect(x,y,w,h,r,fill,stroke=false){
    ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill)ctx.fill();if(stroke)ctx.stroke();
  }
  function drawFlag(x,y,team){
    ctx.strokeStyle="#5a5360";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x,y+20);ctx.lineTo(x,y-22);ctx.stroke();
    ctx.fillStyle=team==="blue"?COLORS.flagBlue:COLORS.flagRed;
    ctx.beginPath();ctx.moveTo(x+2,y-20);ctx.lineTo(x+30,y-12);ctx.lineTo(x+2,y);ctx.closePath();ctx.fill();
    ctx.fillStyle="#f5f0d8";ctx.beginPath();ctx.arc(x,y+22,9,0,Math.PI*2);ctx.fill();
  }

  function drawUnit(u){
    if(!u.alive) return;
    ctx.save();ctx.translate(u.x,u.y);
    if(u.invuln>0){ctx.globalAlpha=.55+Math.sin(performance.now()/50)*.2;}
    // shadow
    ctx.fillStyle="#00000020";ctx.beginPath();ctx.ellipse(0,16,22,9,0,0,Math.PI*2);ctx.fill();

    // body / short sporty robe
    ctx.fillStyle=u.team==="blue"?"#4f8cff":"#ff6b6b";
    ctx.beginPath();ctx.roundRect(-17,-10,34,37,10);ctx.fill();
    ctx.fillStyle="#f4e8cf";ctx.beginPath();ctx.arc(0,-20,15,0,Math.PI*2);ctx.fill();

    // soft magic hat
    ctx.fillStyle=u.team==="blue"?"#345fbe":"#c94e58";
    ctx.beginPath();ctx.moveTo(-15,-29);ctx.quadraticCurveTo(-5,-54,8,-44);ctx.quadraticCurveTo(23,-38,14,-25);ctx.closePath();ctx.fill();
    ctx.fillStyle="#f3e9d8";ctx.fillRect(-16,-31,31,6);

    // eyes: requested dots
    ctx.fillStyle=COLORS.eye;
    ctx.beginPath();ctx.arc(-5,-21,2.1,0,Math.PI*2);ctx.arc(5,-21,2.1,0,Math.PI*2);ctx.fill();

    if(u.emote>0){ctx.font="22px sans-serif";ctx.fillText("✌️",16,-38);}
    ctx.restore();
  }

  function drawBullet(b){
    ctx.save();ctx.translate(b.x,b.y);
    ctx.shadowBlur=14;ctx.shadowColor=b.team==="blue"?"#8cb8ff":"#ffaaaa";
    ctx.fillStyle=b.team==="blue"?"#d6e5ff":"#ffd7db";
    ctx.beginPath();ctx.arc(0,0,b.r,0,Math.PI*2);ctx.fill();
    if(b.curved){
      ctx.strokeStyle=b.team==="blue"?"#765cff":"#ff8fa3";ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(0,0,b.r+4,.2,5.3);ctx.stroke();
    }
    ctx.restore();
  }

  function update(dt){
    if(!running)return;
    timerAcc+=dt;
    if(timerAcc>=1){timerAcc-=1;timeLeft--;timerEl.textContent=timeLeft;}
    if(timeLeft<=0){
      const ba=[player,...allies].filter(u=>u&&u.alive).length, ra=enemies.filter(u=>u.alive).length;
      if(ba>=ra) endRound("blue","時間切れ：生存人数で勝利");
      else endRound("red","時間切れ：生存人数で敗北");
      return;
    }

    player.update(dt);
    let pdx=stickVec.x,pdy=stickVec.y;
    if(player.dodgeT>0){pdx=player.vx;pdy=player.vy;}
    if(Math.hypot(pdx,pdy)>1){const n=Math.hypot(pdx,pdy);pdx/=n;pdy/=n;}
    moveUnit(player,pdx,pdy,dt);

    for(const a of allies){a.update(dt);aiMove(a,dt,false);}
    for(const e of enemies){e.update(dt);aiMove(e,dt,true);}
    for(const b of bullets)b.update(dt);
    bullets=bullets.filter(b=>b.life>0);
    for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.t-=dt;}
    particles=particles.filter(p=>p.t>0);

    checkFlags();
    manaFill.style.width=`${player.mana}%`;
    if(messageUntil && performance.now()>messageUntil){messageEl.textContent="";messageUntil=0;}
  }

  function draw(){
    drawCourt();
    for(const b of bullets)drawBullet(b);
    for(const a of allies)drawUnit(a);
    for(const e of enemies)drawUnit(e);
    if(player)drawUnit(player);
    for(const p of particles){
      ctx.globalAlpha=Math.max(0,p.t/.45);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    }
  }

  function loop(t){
    const dt=Math.min(.033,(t-lastTime)/1000||0);lastTime=t;
    update(dt);draw();requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();