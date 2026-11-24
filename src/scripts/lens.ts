// @ts-nocheck
/* Lens masthead: surface street, hidden layer underneath. Ported from the approved prototype. */
import { gsap } from "gsap";
import { seedRng, person } from "./art";
const $ = s => document.querySelector(s);
let lensState = {x:0.68, y:0.5, r:0.2}, lensLayers = null, lensTween = null, lensFollow = false;
function buildLens(){
  const c = $("#lens"); if(!c) { lensLayers=null; return; }
  const w=c.clientWidth, h=c.clientHeight; if(!w||!h) return;
  const dpr=Math.min(2, window.devicePixelRatio||1);
  c.width=Math.round(w*dpr); c.height=Math.round(h*dpr);
  const mk = () => { const o=document.createElement("canvas"); o.width=c.width; o.height=c.height; const x=o.getContext("2d"); x.setTransform(dpr,0,0,dpr,0,0); return [o,x]; };
  const [sf, sx] = mk(), [hd, hx] = mk();
  const people = []; const r = seedRng("fourth"); const s = Math.max(3.4, Math.min(w, h*2.2)/88);
  const wide = w>620, cx = wide ? w*0.68 : w*0.5, cy = h*0.5, cw = Math.min(wide? w*0.38 : w*0.8, h*1.2), ch = cw*0.5;
  const pts=[[cx-cw/2,cy+ch/2],[cx-cw/2,cy-ch/2],[cx-cw/4,cy],[cx,cy-ch/2-ch*.12],[cx+cw/4,cy],[cx+cw/2,cy-ch/2],[cx+cw/2,cy+ch/2],[cx-cw/2,cy+ch/2]];
  const dist=(x,y)=>{let m=1e9;for(let i=0;i<pts.length-1;i++){const[x1,y1]=pts[i],[x2,y2]=pts[i+1],dx=x2-x1,dy=y2-y1;const t=Math.max(0,Math.min(1,((x-x1)*dx+(y-y1)*dy)/(dx*dx+dy*dy)));m=Math.min(m,Math.hypot(x-x1-t*dx,y-y1-t*dy));}return m;};
  let row=0;
  for(let y=h*0.18; y<h+s*2; y+=s*2.6, row++){
    for(let x=(row%2)*s*1.1 - s; x<w+s*2; x+=s*2.25){
      const jx=x+(r()-0.5)*s*0.5, jy=y+(r()-0.5)*s*0.4, t=jy/h;
      people.push({x:jx, y:jy, s:s*(0.75+t*0.3), t, crown: dist(jx,jy)<s*1.3 && r()<0.85, cord: r()<0.55});
    }
  }
  // SURFACE: an ordinary evening street, calm and grey
  let g=sx.createLinearGradient(0,0,0,h); g.addColorStop(0,"#1B1F26"); g.addColorStop(1,"#2A2F37"); sx.fillStyle=g; sx.fillRect(0,0,w,h);
  let bx=0; while(bx<w){ const bw=w*(0.05+r()*0.08), bh=h*(0.25+r()*0.35); sx.fillStyle="#22262E"; sx.fillRect(bx,h*0.62-bh,bw-3,bh);
    for(let wy=h*0.62-bh+6; wy<h*0.62-6; wy+=10) for(let wx=bx+4; wx<bx+bw-8; wx+=9) if(r()<0.18){ sx.fillStyle="rgba(240,226,180,0.22)"; sx.fillRect(wx,wy,3,4); }
    bx+=bw; }
  people.forEach(p => { const b=Math.round(70+p.t*40); person(sx, p.x, p.y, p.s, `rgb(${b},${b+3},${b+9})`); });
  // HIDDEN: same crowd, X-ray blue-black, strings from every head, the crowd's own crown in yellow
  g=hx.createLinearGradient(0,0,0,h); g.addColorStop(0,"#05070B"); g.addColorStop(1,"#0B1018"); hx.fillStyle=g; hx.fillRect(0,0,w,h);
  hx.strokeStyle="rgba(120,140,170,0.10)"; hx.lineWidth=1;
  for(let gx=0; gx<w; gx+=22){ hx.beginPath(); hx.moveTo(gx,0); hx.lineTo(gx,h); hx.stroke(); }
  for(let gy=0; gy<h; gy+=22){ hx.beginPath(); hx.moveTo(0,gy); hx.lineTo(w,gy); hx.stroke(); }
  people.forEach(p => { if(!p.cord || p.crown) return; hx.strokeStyle="rgba(170,180,195,0.28)"; hx.lineWidth=0.8;
    hx.beginPath(); hx.moveTo(p.x, p.y-p.s*1.5); hx.quadraticCurveTo(p.x+(r()-0.5)*40, p.y*0.4, w*0.5+(p.x-w*0.5)*0.15, -10); hx.stroke(); });
  people.forEach(p => {
    if(p.crown){ person(hx, p.x, p.y, p.s, "rgba(233,197,63,0.95)"); }
    else { hx.strokeStyle="rgba(160,175,195,0.55)"; hx.lineWidth=1; hx.beginPath(); hx.arc(p.x, p.y-p.s*1.15, p.s*0.42, 0, Math.PI*2); hx.stroke();
      hx.beginPath(); hx.moveTo(p.x-p.s*0.85,p.y+p.s*1.3); hx.quadraticCurveTo(p.x-p.s*0.8,p.y-p.s*0.55,p.x,p.y-p.s*0.6); hx.quadraticCurveTo(p.x+p.s*0.8,p.y-p.s*0.55,p.x+p.s*0.85,p.y+p.s*1.3); hx.stroke(); }
  });
  hx.font = `500 ${Math.max(9, h*0.028)}px "IBM Plex Mono", monospace`; hx.fillStyle="rgba(233,197,63,0.7)";
  hx.fillText("WHO HOLDS THE STRINGS?", w*0.06, h*0.12);
  lensLayers = {c, sf, hd, w, h, dpr};
  drawLens();
}
function drawLens(){
  if(!lensLayers) return; const {c, sf, hd, w, h} = lensLayers; const ctx=c.getContext("2d");
  ctx.setTransform(1,0,0,1,0,0); ctx.drawImage(sf,0,0);
  const x=lensState.x*c.width, y=lensState.y*c.height, R=lensState.r*Math.min(c.width,c.height)*1.6;
  ctx.save(); ctx.beginPath(); ctx.arc(x,y,R,0,Math.PI*2); ctx.clip(); ctx.drawImage(hd,0,0); ctx.restore();
  ctx.strokeStyle="rgba(233,197,63,0.75)"; ctx.lineWidth=2*lensLayers.dpr; ctx.beginPath(); ctx.arc(x,y,R,0,Math.PI*2); ctx.stroke();
  ctx.strokeStyle="rgba(233,197,63,0.25)"; ctx.lineWidth=1*lensLayers.dpr; ctx.beginPath(); ctx.arc(x,y,R+6*lensLayers.dpr,0,Math.PI*2); ctx.stroke();
  // readability shade under the title
  const sh=ctx.createLinearGradient(0,c.height*0.35,0,c.height); sh.addColorStop(0,"rgba(10,12,15,0)"); sh.addColorStop(1,"rgba(10,12,15,0.82)");
  ctx.fillStyle=sh; ctx.fillRect(0,0,c.width,c.height);
}
function startLens(){
  const m=$("#mast"); if(!m) return;
  buildLens();
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(lensTween){ lensTween.kill(); lensTween=null; }
  if(!reduce){
    const path = {t:0};
    lensTween = gsap.to(path, {t:1, duration:18, repeat:-1, ease:"none", onUpdate:() => {
      if(lensFollow) return; const a = path.t*Math.PI*2;
      lensState.x = 0.55 + Math.sin(a)*0.3; lensState.y = 0.45 + Math.sin(a*2)*0.18; drawLens(); }});
  }
  const move = e => { const b=m.getBoundingClientRect(); const pt = e.touches ? e.touches[0] : e;
    const tx=(pt.clientX-b.left)/b.width, ty=(pt.clientY-b.top)/b.height; lensFollow = true;
    if(!reduce) gsap.to(lensState, {x:tx, y:ty, duration:0.35, ease:"power2.out", onUpdate:drawLens, overwrite:true});
    else { lensState.x=tx; lensState.y=ty; drawLens(); } };
  m.addEventListener("pointermove", move); m.addEventListener("touchmove", move, {passive:true});
  m.addEventListener("pointerleave", () => { lensFollow = false; });
}
startLens();
let rz; addEventListener("resize", () => { clearTimeout(rz); rz=setTimeout(buildLens,150); });
if(document.fonts && document.fonts.ready) document.fonts.ready.then(buildLens);
