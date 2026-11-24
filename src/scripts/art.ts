// @ts-nocheck
/* Cover art: drawn, not downloaded. Ported unchanged from the approved prototype. */
const CV = {bg:"#191C22", bg2:"#232830", fig:"#3A4049", fig2:"#565E6A", line:"#2E343D", y:"#FFD84D", txt:"#E7E6E0"};
function seedRng(str){ let h=1779033703^str.length; for(const c of str){ h=Math.imul(h^c.charCodeAt(0),3432918353); h=h<<13|h>>>19; }
  return () => { h=Math.imul(h^h>>>16,2246822507); h=Math.imul(h^h>>>13,3266489909); return ((h^=h>>>16)>>>0)/4294967296; }; }
function person(ctx,x,y,s,col,tilt=0){
  ctx.fillStyle=col; ctx.beginPath();
  ctx.arc(x+tilt*s, y-s*1.15, s*0.42, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x-s*0.85, y+s*1.3);
  ctx.quadraticCurveTo(x-s*0.8, y-s*0.55, x, y-s*0.6);
  ctx.quadraticCurveTo(x+s*0.8, y-s*0.55, x+s*0.85, y+s*1.3); ctx.closePath(); ctx.fill();
}
function grain(ctx,w,h,r){ const n=Math.floor(w*h/22); for(let i=0;i<n;i++){ ctx.fillStyle=`rgba(255,255,255,${0.015+r()*0.03})`; ctx.fillRect(r()*w, r()*h, 1, 1); } }
function vignette(ctx,w,h){ const g=ctx.createRadialGradient(w/2,h/2,Math.min(w,h)*0.2,w/2,h/2,Math.max(w,h)*0.75);
  g.addColorStop(0,"rgba(0,0,0,0)"); g.addColorStop(1,"rgba(0,0,0,0.55)"); ctx.fillStyle=g; ctx.fillRect(0,0,w,h); }


export const ART = {
  crown(ctx,w,h,r){
    ctx.fillStyle="#14171C"; ctx.fillRect(0,0,w,h);
    const s = Math.max(3.2, Math.min(w,h*2.4)/95);
    const wide = w > 620;
    const cx = wide ? w*0.7 : w*0.5, cy = h*0.6;
    const cw = Math.min(wide ? w*0.4 : w*0.78, h*1.35), ch = cw*0.5;
    const pts = [[cx-cw/2,cy+ch/2],[cx-cw/2,cy-ch/2],[cx-cw/4,cy],[cx,cy-ch/2-ch*0.12],[cx+cw/4,cy],[cx+cw/2,cy-ch/2],[cx+cw/2,cy+ch/2],[cx-cw/2,cy+ch/2]];
    const dist = (x,y) => { let m=1e9; for(let i=0;i<pts.length-1;i++){ const [x1,y1]=pts[i],[x2,y2]=pts[i+1], dx=x2-x1, dy=y2-y1;
      const t=Math.max(0,Math.min(1,((x-x1)*dx+(y-y1)*dy)/(dx*dx+dy*dy))); m=Math.min(m,Math.hypot(x-x1-t*dx,y-y1-t*dy)); } return m; };
    let row=0;
    for(let y=h*0.12; y<h+s*2; y+=s*2.5, row++){
      const t = y/h, base = Math.round(46 + t*34);
      for(let x=(row%2)*s*1.1 - s; x<w+s*2; x+=s*2.2){
        const jx = x+(r()-0.5)*s*0.5, jy = y+(r()-0.5)*s*0.4;
        const near = dist(jx,jy) < s*1.25;
        const col = near && r()<0.82 ? `rgba(233,197,63,${0.62+r()*0.25})` : `rgb(${base},${base+4},${base+12})`;
        person(ctx, jx, jy, s*(0.75+t*0.3), col);
      }
    }
    const g = wide ? ctx.createLinearGradient(0,0,w*0.75,0) : ctx.createLinearGradient(0,0,0,h*0.8);
    g.addColorStop(0,"rgba(20,23,28,0.94)"); g.addColorStop(0.55,"rgba(20,23,28,0.7)"); g.addColorStop(1,"rgba(20,23,28,0)");
    ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
    vignette(ctx,w,h); grain(ctx,w,h,r);
  },
  "most-people-die"(ctx,w,h,r){
    ctx.fillStyle=CV.bg; ctx.fillRect(0,0,w,h);
    const winH=h*0.22, winY=h*0.12, n=Math.max(3,Math.round(w/120));
    for(let i=0;i<n;i++){ const ww=w/n; const g=ctx.createLinearGradient(0,winY,0,winY+winH);
      g.addColorStop(0,"#2C3340"); g.addColorStop(1,"#1E232B"); ctx.fillStyle=g; ctx.fillRect(i*ww+ww*0.08, winY, ww*0.84, winH);
      ctx.fillStyle="rgba(255,216,77,0.10)"; ctx.fillRect(i*ww+ww*0.08, winY+winH*(0.3+r()*0.4), ww*0.84*r(), 2); }
    ctx.strokeStyle=CV.fig2; ctx.lineWidth=Math.max(2,h*0.012); ctx.beginPath(); ctx.moveTo(0,h*0.05); ctx.lineTo(w,h*0.05); ctx.stroke();
    for(let i=0;i<w/40;i++){ ctx.beginPath(); ctx.moveTo(i*40+20,h*0.05); ctx.lineTo(i*40+20,h*0.09); ctx.stroke(); }
    const rows=[{y:h*0.58,s:h*0.075,c:CV.fig},{y:h*0.86,s:h*0.11,c:CV.fig2}];
    const pick = Math.floor(w/(h*0.22)*0.55);
    rows.forEach((row,ri)=>{ const gap=row.s*2.15; let k=0;
      for(let x=gap*0.6; x<w+gap; x+=gap*(0.9+r()*0.35), k++){
        const one = ri===1 && k===pick;
        person(ctx, x, row.y, row.s, one?CV.y:row.c, one?0.45:(r()-0.5)*0.1);
      }});
    ctx.fillStyle=CV.line; ctx.fillRect(0,h*0.97,w,h*0.03);
    vignette(ctx,w,h); grain(ctx,w,h,r);
  },
  "listen-to-your-enemy"(ctx,w,h,r){
    ctx.fillStyle=CV.bg; ctx.fillRect(0,0,w,h);
    const mid=h*0.55, steps=Math.floor(w/3);
    for(let pass=0; pass<2; pass++){
      ctx.beginPath();
      for(let i=0;i<=steps;i++){ const t=i/steps, x=t*w;
        const amp = (pass?0.5:1) * h*0.42*Math.pow(t,2.4) + h*0.01;
        const y = mid + Math.sin(i*0.9 + r()*0.8)*amp*(0.4+r()*0.6)*(i%2?1:-1);
        i?ctx.lineTo(x,y):ctx.moveTo(x,y); }
      const g=ctx.createLinearGradient(0,0,w,0); g.addColorStop(0,CV.fig); g.addColorStop(0.55,CV.fig2); g.addColorStop(1,CV.y);
      ctx.strokeStyle=g; ctx.lineWidth=pass?1:Math.max(1.5,h*0.008); ctx.globalAlpha=pass?0.5:1; ctx.stroke(); ctx.globalAlpha=1;
    }
    person(ctx, w*0.08, h*0.8, h*0.07, CV.fig);
    ctx.save(); ctx.scale(-1,1); person(ctx, -w*0.93, h*0.82, h*0.12, "#0F1115"); ctx.restore();
    vignette(ctx,w,h); grain(ctx,w,h,r);
  },
  "say-go-they-say-no"(ctx,w,h,r){
    ctx.fillStyle=CV.bg; ctx.fillRect(0,0,w,h);
    const fs=Math.min(h*0.72, w*0.34);
    ctx.font=`800 ${fs}px "Bricolage Grotesque", Arial, sans-serif`; ctx.textBaseline="middle"; ctx.textAlign="left";
    const word="GO", tw=ctx.measureText(word).width, x0=(w-tw)/2+fs*0.18, y0=h*0.54;
    ctx.lineWidth=Math.max(1.5,fs*0.02); ctx.strokeStyle=CV.fig2; ctx.strokeText(word,x0,y0);
    ctx.strokeStyle=CV.y; ctx.lineWidth=Math.max(3,fs*0.07); ctx.lineCap="round"; ctx.lineJoin="round";
    const nx=x0-fs*0.62, ny=y0, nh=fs*0.62, nw=fs*0.42;
    ctx.beginPath(); ctx.moveTo(nx+(r()-0.5)*4, ny+nh/2); ctx.lineTo(nx+(r()-0.5)*4, ny-nh/2);
    ctx.lineTo(nx+nw+(r()-0.5)*4, ny+nh/2); ctx.lineTo(nx+nw+(r()-0.5)*4, ny-nh/2); ctx.stroke();
    ctx.font=`500 ${Math.max(9,h*0.06)}px "IBM Plex Mono", monospace`; ctx.fillStyle=CV.fig2; ctx.textAlign="right";
    ctx.fillText("00:00:09", w*0.95, h*0.12);
    ctx.textAlign="left"; ctx.fillText("ONLY 3 LEFT", w*0.05, h*0.9);
    ctx.strokeStyle=CV.fig2; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(w*0.045,h*0.9); ctx.lineTo(w*0.05+ctx.measureText("ONLY 3 LEFT").width,h*0.9); ctx.stroke();
    vignette(ctx,w,h); grain(ctx,w,h,r);
  },
  "nolan-is-late"(ctx,w,h,r){
    ctx.fillStyle=CV.bg; ctx.fillRect(0,0,w,h);
    const cx=w/2, cy=h/2, R=Math.min(w*0.3,h*0.62);
    ctx.strokeStyle=CV.line; ctx.lineWidth=1;
    for(let i=0;i<60;i++){ const a=i/60*Math.PI*2, l=i%5?R*0.04:R*0.1;
      ctx.beginPath(); ctx.moveTo(cx+Math.cos(a)*(R*1.25), cy+Math.sin(a)*(R*0.75)); ctx.lineTo(cx+Math.cos(a)*(R*1.25+l), cy+Math.sin(a)*(R*0.75+l*0.6)); ctx.stroke(); }
    const P=(u,v)=>{ const k=1+v/2*Math.cos(u/2); const x=k*Math.cos(u), y=k*Math.sin(u), z=v/2*Math.sin(u/2);
      return [cx + x*R*0.62, cy + y*R*0.26 - z*R*0.55]; };
    const N=140;
    for(let i=0;i<N;i++){ const u=i/N*Math.PI*2; const a=P(u,-0.55), b=P(u,0.55);
      const hot = i>N*0.62 && i<N*0.72;
      ctx.strokeStyle = hot?CV.y:(i%2?CV.fig:CV.fig2); ctx.lineWidth = hot?2:1;
      ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke(); }
    ctx.strokeStyle=CV.txt; ctx.globalAlpha=0.6; ctx.lineWidth=1.2;
    [-0.55,0.55].forEach(v=>{ ctx.beginPath(); for(let i=0;i<=N*2;i++){ const u=i/(N*2)*Math.PI*4; const p=P(u,v); i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]); } ctx.stroke(); });
    ctx.globalAlpha=1;
    ctx.strokeStyle=CV.y; ctx.lineWidth=Math.max(2,R*0.03); ctx.lineCap="round";
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx-R*0.18, cy-R*0.28); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+R*0.34, cy+R*0.06); ctx.stroke();
    vignette(ctx,w,h); grain(ctx,w,h,r);
  },
  "who-owns-this-city"(ctx,w,h,r){
    const g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,"#12151A"); g.addColorStop(1,CV.bg2); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
    let x=0; const base=h*0.78, towerAt=w*0.52;
    while(x<w){ const bw=w*(0.05+r()*0.07); const tall=Math.abs(x+bw/2-towerAt)<bw*0.6;
      const bh = tall? h*0.68 : h*(0.18+r()*0.32);
      ctx.fillStyle = tall? "#2A303A" : CV.bg; ctx.fillRect(x, base-bh, bw-2, bh);
      for(let wy=base-bh+6; wy<base-6; wy+=Math.max(6,h*0.04)) for(let wx=x+4; wx<x+bw-6; wx+=Math.max(6,w*0.012))
        if(r()<0.22){ ctx.fillStyle="rgba(231,230,224,0.18)"; ctx.fillRect(wx,wy,2,3); }
      if(tall){ ctx.fillStyle="rgba(231,230,224,0.75)"; ctx.fillRect(x+bw*0.15, base-bh+h*0.04, bw*0.7-2, h*0.03); }
      x+=bw; }
    const s=Math.max(2.2,h*0.022);
    for(let row=0; row<4; row++) for(let px=s; px<w; px+=s*2.1){
      person(ctx, px+(row%2)*s + (r()-0.5)*s*0.6, base + s*1.6 + row*s*2.2, s, row===0?CV.y:(row===1?"#C9A93A":"#8A7530")); }
    vignette(ctx,w,h); grain(ctx,w,h,r);
  }
};
export { seedRng, person };
export function drawCovers(){
  document.querySelectorAll("canvas[data-cover]").forEach(c => {
    const w=c.clientWidth, h=c.clientHeight; if(!w||!h) return;
    const dpr=Math.min(2, window.devicePixelRatio||1);
    c.width=Math.round(w*dpr); c.height=Math.round(h*dpr);
    const ctx=c.getContext("2d"); ctx.setTransform(dpr,0,0,dpr,0,0);
    const f=ART[c.dataset.cover]; if(f) f(ctx,w,h,seedRng(c.dataset.cover));
  });
}
// Used by scripts/render-og.mjs to render Open Graph images.
window.__t4dArt = { ART, seedRng };
drawCovers();
let rz; addEventListener("resize", () => { clearTimeout(rz); rz=setTimeout(drawCovers,150); });
if(document.fonts && document.fonts.ready) document.fonts.ready.then(drawCovers);
