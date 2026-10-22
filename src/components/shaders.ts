/**
 * Background effects: one fragment shader per effect, drawn on a full-screen triangle.
 * Everything is procedural (no images), so it works offline and stays sharp at any size.
 * GLSL ES 1.00 for the widest WebGL support. Coordinates: q.y runs 0..1 bottom to top,
 * q.x is centered and aspect-corrected.
 */
export const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

const COMMON = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uSeed;
float hash(vec2 p){p=fract(p*vec2(233.34,851.73));p+=dot(p,p+23.45+uSeed);return fract(p.x*p.y);}
vec2 hash2(vec2 p){float n=hash(p);return vec2(n,hash(p+n+17.1));}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}
const mat2 ROT=mat2(1.6,1.2,-1.2,1.6);
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=ROT*p;a*=.5;}return v;}
float fbm3(vec2 p){float v=0.,a=.5;for(int i=0;i<3;i++){v+=a*noise(p);p=ROT*p;a*=.5;}return v;}
vec3 dither(vec2 fc){return vec3((hash(fc+fract(uTime*.37))-.5)/180.);}
vec2 coords(out vec2 uv){vec2 fc=gl_FragCoord.xy;uv=fc/uRes;return vec2((uv.x-.5)*uRes.x/uRes.y,uv.y);}
vec3 tonemap(vec3 c){return 1.-exp(-c*1.25);}
`;

/** Stars sized in screen pixels, with color temperature, twinkle and a soft halo on bright ones. */
const STARS = `
vec3 starLayer(vec2 q,float scale,float t,float density){
  vec2 g=q*scale;vec2 id=floor(g);vec2 f=fract(g)-.5;
  if(hash(id)>density)return vec3(0.);
  vec2 o=(hash2(id+3.7)-.5)*.6;
  float d=length(f-o);
  float b=pow(hash(id+9.1),3.);
  float tw=.65+.35*sin(t*(1.2+3.*hash(id+1.3))+6.28*hash(id+5.5));
  float px=scale/uRes.y;
  float core=smoothstep(px*1.5,0.,d);
  float halo=exp(-d*d/(px*px*(3.+12.*b)))*b*b;
  vec3 tint=mix(vec3(.72,.82,1.),vec3(1.,.86,.72),hash(id+2.2));
  return tint*(core*(.22+.9*b)+halo*.6)*tw;
}
vec3 stars(vec2 q,float t){
  return starLayer(q,16.,t,.4)+starLayer(q+7.3,32.,t,.32)*.8+starLayer(q+3.1,64.,t,.28)*.6+starLayer(q+1.7,120.,t,.22)*.4;
}
`;

export const SKY = COMMON + STARS + `
uniform vec3 uZenith,uHorizon,uGlow;
uniform vec2 uSun;
uniform float uSunUp,uStarVis,uCloud,uCloudLight;
uniform vec4 uMoon;
void main(){
  vec2 uv;vec2 q=coords(uv);float asp=uRes.x/uRes.y;float t=uTime;
  float y=uv.y;
  vec3 col=mix(uHorizon,uZenith,pow(clamp(y,0.,1.),.55));
  vec2 sp=vec2((uSun.x-.5)*asp,uSun.y);
  float d=length(q-sp);
  col+=uGlow*(.5*exp(-d*2.6)+.6*exp(-d*9.))*(.2+.8*uSunUp);
  col+=uGlow*.4*exp(-max(y,0.)*6.)*exp(-abs(q.x-sp.x)*1.2);
  col=mix(col,vec3(1.,.98,.92)*1.25,smoothstep(.03,.024,d)*uSunUp*uSunUp);
  if(uStarVis>.01){
    vec2 mq=mat2(.82,-.57,.57,.82)*q;
    float band=exp(-pow((mq.y-.62+.08*sin(mq.x*1.7))*3.,2.));
    float mw=fbm(mq*vec2(1.6,3.2)+4.);
    float dust=fbm3(mq*vec2(4.,8.)+11.);
    vec3 milky=(vec3(.42,.47,.68)*smoothstep(.38,.82,mw)+vec3(.3,.24,.32)*mw*.5)*band*(1.-smoothstep(.42,.72,dust)*.75);
    col+=(stars(q,t)*1.25+milky*.42+starLayer(mq+.5,90.,t,.7)*band*.7)*uStarVis;
  }
  if(uMoon.w>.01){
    vec2 mp=vec2((uMoon.x-.5)*asp,uMoon.y);
    vec2 m=(q-mp)/.026;float r=length(m);
    float k=uMoon.z;
    float term=(1.-2.*abs(k))*sqrt(max(0.,1.-m.y*m.y));
    float u=k>0.?m.x:-m.x;
    float lit=smoothstep(term-.08,term+.08,u)*smoothstep(1.,.96,r);
    float maria=.82+.18*fbm3(m*2.2+3.);
    vec3 moon=vec3(.95,.94,.9)*maria*lit+vec3(.035,.04,.05)*smoothstep(1.,.96,r);
    col=mix(col,moon,smoothstep(1.02,.98,r)*uMoon.w);
    col+=vec3(.55,.6,.7)*exp(-r*.55)*.08*abs(k)*uMoon.w;
  }
  vec2 cp=vec2(q.x*.95+t*.0045,q.y*2.2);
  float c=fbm(cp+1.1*fbm3(cp*.8-t*.003));
  float cov=smoothstep(.46,.74,c)*smoothstep(.12,.5,y)*uCloud;
  float top=fbm(cp+vec2(.02,-.06)+1.1*fbm3((cp+vec2(.02,-.06))*.8-t*.003));
  float shade=clamp((c-top)*6.+.5,0.,1.);
  vec3 lit=mix(uHorizon,vec3(1.),.6)+uGlow*.6;
  vec3 dayCloud=mix(lit*.58,lit*1.12,shade);
  vec3 nightCloud=mix(vec3(.01,.013,.024),vec3(.06,.07,.09)*(1.+uMoon.w),shade);
  col=mix(col,mix(nightCloud,dayCloud,uCloudLight),cov*.85);
  gl_FragColor=vec4(col+dither(gl_FragCoord.xy),1.);
}`;

export const AURORA = COMMON + STARS + `
float edgeAt(float x,float i,float t){
  return .36+i*.075+.07*sin(x*1.3+t*.13+i*2.1)+.09*(fbm3(vec2(x*.55+i*3.7+t*.035,i*1.3+t*.02))-.5)+.025*sin(x*4.+t*.3+i);
}
vec3 auroraSky(vec2 q,float t,float refl){
  vec3 col=mix(vec3(.012,.035,.055),vec3(.002,.004,.012),pow(clamp(q.y,0.,1.),.7));
  col+=stars(q,uTime)*(.65-refl*.5);
  vec3 acc=vec3(0.);
  for(int ii=0;ii<3;ii++){
    float i=float(ii);
    float e=edgeAt(q.x,i,t);
    float sl=abs(edgeAt(q.x+.01,i,t)-edgeAt(q.x-.01,i,t))*50.;
    float dy=q.y-e;
    float patch=smoothstep(.28,.62,fbm3(vec2(q.x*.65+i*5.,t*.04+i)));
    float k=2.2+3.2*noise(vec2(q.x*1.4+i*9.,t*.1));
    float base=smoothstep(-.02,.006,dy);
    float body=base*exp(-max(dy,0.)*k);
    float n1=noise(vec2(q.x*48.+fbm3(vec2(q.x*2.2,t*.18+i))*10.+i*20.,t*.55));
    float n2=noise(vec2(q.x*11.-t*.22+i*7.,i));
    float rays=(pow(n1,1.5)*.7+.3)*(.5+.5*n2);
    vec3 green=vec3(.2,1.,.52),teal=vec3(.1,.78,.72),magenta=vec3(.78,.2,.62);
    vec3 c=mix(green,teal,clamp(dy*2.5,0.,1.));
    c=mix(c,magenta,smoothstep(.1,.38,dy));
    float fringe=exp(-pow(dy+.006,2.)/.00006)*.45;
    acc+=(c*body*rays*(1.+sl*.7)+vec3(.95,.32,.58)*fringe*rays)*patch*(1.-i*.2);
  }
  col+=acc*1.15;
  col+=vec3(.03,.15,.1)*smoothstep(.7,.15,q.y)*(.7+.3*sin(t*.4));
  return col;
}
void main(){
  vec2 uv;vec2 q=coords(uv);float t=uTime*.45;
  float hz=.2;
  bool water=q.y<hz;
  vec2 sq=q;
  float depth=hz-q.y;
  if(water){
    float rip=(noise(vec2(q.x*26.,depth*80.-uTime*.9))-.5)*.016*(1.+depth*4.);
    sq=vec2(q.x+rip,hz+depth*1.1);
  }
  vec3 col=auroraSky(sq,t,water?1.:0.);
  float r1=hz+.035+.09*fbm3(vec2(sq.x*1.3+2.,1.))+.022*fbm3(vec2(sq.x*7.,3.));
  float r2=hz+.008+.04*fbm3(vec2(sq.x*2.4+9.,5.));
  col=mix(col,vec3(.006,.012,.02),smoothstep(r1+.0025,r1-.0025,sq.y));
  col=mix(col,vec3(.002,.004,.008),smoothstep(r2+.0025,r2-.0025,sq.y));
  if(water){
    col*=.55+.25*exp(-depth*18.);
    col+=vec3(.05,.14,.1)*exp(-depth*140.)*.5;
    col=mix(col,vec3(.004,.006,.01),smoothstep(.0,.2,depth)*.35);
  }
  gl_FragColor=vec4(tonemap(col)+dither(gl_FragCoord.xy),1.);
}`;

export const RAIN = COMMON + `
vec3 lamp(float h){
  return h<.3?vec3(1.,.58,.22):h<.48?vec3(1.,.93,.82):h<.62?vec3(1.,.16,.12):h<.78?vec3(.32,.6,1.):h<.88?vec3(.3,1.,.55):vec3(1.,.4,.75);
}
vec3 lights(vec2 q,float cell,float blur,float seed,float amt){
  vec3 acc=vec3(0.);
  vec2 g=q/cell;vec2 id0=floor(g);
  for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){
    vec2 id=id0+vec2(float(i),float(j));
    float h=hash(id+seed);
    if(h<.42)continue;
    vec2 c=(id+.5+(hash2(id+seed*1.7)-.5)*.9)*cell;
    float r=cell*(.32+.45*hash(id+seed+4.))*blur;
    float d=length(q-c);
    float disc=smoothstep(r,r*mix(.97,.8,blur),d);
    float rim=smoothstep(r*.55,r,d)*disc*.45*blur;
    float fl=.85+.15*sin(uTime*(.4+h)+h*40.);
    float hgt=smoothstep(1.,.15,c.y);
    acc+=lamp(hash(id+seed+8.))*(disc*(.5+.5/blur*.2)+rim)*amt*fl*hgt;
  }
  return acc;
}
vec3 scene(vec2 q,float blur){
  vec3 col=mix(vec3(.07,.045,.045),vec3(.012,.018,.035),smoothstep(0.,.9,q.y));
  col+=vec3(.3,.13,.05)*exp(-q.y*5.)*.35;
  col+=lights(q,.2,blur,1.,.5);
  col+=lights(q+.37,.11,blur,7.,.38);
  col+=lights(q+.11,.065,blur,13.,.25)*smoothstep(.75,.3,q.y);
  return col;
}
void main(){
  vec2 uv;vec2 q=coords(uv);float t=uTime;
  float mask=0.,trail=0.;vec2 n=vec2(0.);vec2 ctr=q;float rad=1.;
  // small static droplets that bead and fade
  for(int L=0;L<2;L++){
    float cs=L==0?.045:.085;
    vec2 g=q/cs;vec2 id=floor(g);vec2 f=fract(g)-.5;
    float h=hash(id+float(L)*31.);
    float life=fract(t*.035+h*7.);
    if(h>(L==0?.35:.62)&&life<.9){
      vec2 o=(hash2(id+5.+float(L))-.5)*.36;
      float r=(L==0?.12:.2)*(.45+.55*hash(id+9.))*smoothstep(0.,.15,life);
      vec2 dv=(f-o)/r;float dd=length(dv);
      float m=smoothstep(1.,.88,dd);
      if(m>mask){mask=m;n=dv;ctr=(id+.5+o)*cs;rad=r*cs;}
    }
  }
  // sliding drops with stick-slip motion and a cleared trail
  float cw=.13;
  float colId=floor(q.x/cw+.5);
  for(int k=-1;k<=1;k++){
    float ci=colId+float(k);
    float h=hash(vec2(ci,4.));
    if(h<.35)continue;
    float sp=.05+.07*hash(vec2(ci,9.));
    float tt=t*sp*3.+h*13.;
    float prog=(floor(tt)+smoothstep(.15,1.,fract(tt)))*.09;
    float y=1.25-mod(prog+h*1.5,1.6);
    float x=ci*cw+(hash(vec2(ci,2.))-.5)*cw*.6+sin(y*14.+h*6.)*.006;
    float r=.011+.011*hash(vec2(ci,7.));
    vec2 dv=(q-vec2(x,y))/r;dv.y*=dv.y<0.?.82:1.15;
    float dd=length(dv);
    float m=smoothstep(1.,.86,dd);
    if(m>mask){mask=m;n=dv;ctr=vec2(x,y);rad=r;}
    float above=q.y-y;
    float tw=r*.42*smoothstep(.45,0.,above);
    float tx=x+sin(q.y*14.+h*6.)*.006;
    float tr=smoothstep(tw,tw*.3,abs(q.x-tx))*step(0.,above)*smoothstep(.45,.05,above);
    trail=max(trail,tr);
    if(above>0.&&above<.4){
      float cy=floor(q.y/.022);vec2 cid=vec2(ci,cy);
      float hh=hash(cid+3.);
      if(hh>.55){
        vec2 cc=vec2(tx+(hash(cid)-.5)*r*.6,(cy+.5)*.022);
        float rr=r*.3*(.5+.5*hh)*smoothstep(.4,.05,above);
        vec2 dv2=(q-cc)/max(rr,.0005);float d2=length(dv2);
        float m2=smoothstep(1.,.85,d2);
        if(m2>mask){mask=m2;n=dv2;ctr=cc;rad=rr;}
      }
    }
  }
  vec3 blurred=scene(q,1.);
  float lum=dot(blurred,vec3(.3,.59,.11));
  vec3 fog=mix(blurred,vec3(lum)+vec3(.035,.04,.05),.28)*.92+vec3(.012,.014,.02);
  fog+=vec3(.015)*fbm3(q*6.+t*.02);
  vec3 col=mix(fog,blurred*1.05,trail*.85);
  vec2 sq=ctr-(q-ctr)*3.;
  float edge=length(n);
  vec3 inside=mix(blurred*1.25,scene(sq,.5)*1.9,.5);
  inside*=mix(1.,.55,smoothstep(.6,1.,edge));
  inside+=vec3(1.,.95,.9)*smoothstep(.28,.0,length(n-vec2(-.32,.4)))*.3;
  inside+=blurred*1.4*smoothstep(.75,.95,edge)*smoothstep(.0,-.6,n.y);
  col=mix(col,inside,mask);
  gl_FragColor=vec4(col+dither(gl_FragCoord.xy),1.);
}`;

export const SNOW = COMMON + `
float flakes(vec2 q,float scale,float speed,float sizePx,float t,float seed){
  vec2 g=q*scale;
  g.y+=t*speed;
  g.x+=sin(g.y*.35+t*.4+seed)*.35+t*speed*.12;
  vec2 id=floor(g);vec2 f=fract(g)-.5;
  float h=hash(id+seed);
  if(h<.32)return 0.;
  vec2 o=(hash2(id+seed+1.)-.5)*.46;
  o.x+=sin(t*(.7+h)+h*30.)*.07;
  float d=length(f-o);
  float r=sizePx*scale/uRes.y*(.6+.6*hash(id+seed+2.));
  return exp(-d*d/(r*r))*(.55+.45*h);
}
float trees(float x){
  float v=0.;
  for(int i=0;i<3;i++){
    float fi=float(i);float k=7.+fi*9.;
    float id=floor(x*k+fi*3.);float h=hash(vec2(id,fi));
    float tri=1.-abs(fract(x*k+fi*3.)-.5)*2.;
    v=max(v,(.025+.045*h)*pow(tri,1.6)*(1.-fi*.25));
  }
  return v;
}
void main(){
  vec2 uv;vec2 q=coords(uv);float asp=uRes.x/uRes.y;float t=uTime;
  vec3 col=mix(vec3(.11,.13,.18),vec3(.015,.02,.04),pow(clamp(q.y,0.,1.),.75));
  vec2 mp=vec2(asp*.28,.84);float md=length(q-mp);
  col+=vec3(.55,.6,.72)*(exp(-md*8.)*.35+exp(-md*2.2)*.1);
  col=mix(col,vec3(.9,.92,.96)*(.9+.1*fbm3((q-mp)*60.)),smoothstep(.034,.03,md));
  float hz=.17;
  col+=vec3(.16,.18,.23)*exp(-abs(q.y-hz)*14.)*.6;
  float tr=hz+trees(q.x*.8+.3);
  col=mix(col,vec3(.03,.04,.055),smoothstep(tr+.002,tr-.002,q.y)*step(.0,q.y));
  float ground=smoothstep(hz-.04,hz-.08,q.y);
  col=mix(col,mix(vec3(.16,.18,.23),vec3(.22,.24,.3),fbm3(q*vec2(3.,12.))),ground);
  float s=0.;
  s+=flakes(q,42.,.22,1.1,t,1.)*.5;
  s+=flakes(q+.37,26.,.36,1.6,t,2.)*.65;
  s+=flakes(q+.71,15.,.55,2.4,t,3.)*.8;
  s+=flakes(q+1.3,8.5,.9,3.6,t,4.)*.85;
  s+=flakes(q+2.1,4.5,1.5,8.,t,5.)*.32;
  s+=flakes(q+3.7,2.6,2.1,13.,t,6.)*.18;
  col+=vec3(.93,.95,1.)*s;
  col=mix(col,vec3(.12,.14,.18),.08*(1.-q.y));
  gl_FragColor=vec4(col+dither(gl_FragCoord.xy),1.);
}`;

export const NEBULA = COMMON + STARS + `
void main(){
  vec2 uv;vec2 q=coords(uv);float t=uTime*.012;
  float a=t*.5;mat2 rot=mat2(cos(a),-sin(a),sin(a),cos(a));
  vec2 p=rot*(q-vec2(0.,.5))*1.7+vec2(0.,.5);
  vec2 w=vec2(fbm(p+t),fbm(p+vec2(5.2,1.3)-t));
  vec2 w2=vec2(fbm(p+3.*w+vec2(1.7,9.2)+t*.5),fbm(p+3.*w+vec2(8.3,2.8)));
  float n=fbm(p+2.4*w2);
  vec3 hyd=vec3(.95,.18,.42),oxy=vec3(.12,.72,.82),ref=vec3(.22,.32,.95),warm=vec3(1.,.62,.3);
  vec3 neb=mix(ref,hyd,smoothstep(.2,.8,w2.x));
  neb=mix(neb,oxy,smoothstep(.45,.9,w2.y)*.8);
  float dens=pow(max(n-.18,0.),2.)*5.;
  vec3 col=vec3(.004,.005,.016)+neb*dens;
  col+=warm*pow(max(n-.55,0.),2.)*6.;
  float core=exp(-length(q-vec2(.05,.55))*2.6);
  col+=mix(hyd,warm,.4)*core*dens*.9;
  float dust=smoothstep(.48,.78,fbm(p*2.3-w*1.4+11.));
  col*=1.-dust*.8;
  col+=stars(q,uTime*.5)*(1.-dust*.6)*1.1;
  vec2 g=q*6.;vec2 id=floor(g);vec2 f=fract(g)-.5;float h=hash(id+9.);
  if(h>.965){vec2 o=(hash2(id)-.5)*.5;vec2 d=f-o;float px=6./uRes.y;
    float c=exp(-dot(d,d)/(px*px*4.));
    float sp=(exp(-abs(d.x)/(px*.7))*exp(-abs(d.y)/(px*14.))+exp(-abs(d.y)/(px*.7))*exp(-abs(d.x)/(px*14.)));
    col+=mix(vec3(.75,.85,1.),vec3(1.,.85,.7),hash(id+1.))*(c*1.4+sp*.5)*(.8+.2*sin(uTime*1.5+h*50.));}
  gl_FragColor=vec4(tonemap(col*1.15)+dither(gl_FragCoord.xy),1.);
}`;

export const GRADIENT = COMMON + `
uniform vec3 uC0,uC1,uC2;
void main(){
  vec2 uv;vec2 q=coords(uv);float asp=uRes.x/uRes.y;
  float t=uTime*.06;
  vec2 warp=vec2(fbm3(q*1.1+t),fbm3(q*1.1-t+4.))-.5;
  vec2 p=q+warp*.4;
  vec2 a=vec2(asp*(-.25+.2*sin(t*1.3)),.3+.25*cos(t*.9));
  vec2 b=vec2(asp*(.25+.2*cos(t*1.1)),.72+.2*sin(t*1.7));
  vec2 c=vec2(asp*(.3*sin(t*.7+2.)),.5+.35*cos(t*1.2+1.));
  float wa=1./(.03+pow(distance(p,a),2.)),wb=1./(.03+pow(distance(p,b),2.)),wc=1./(.03+pow(distance(p,c),2.));
  vec3 col=(uC0*wa+uC1*wb+uC2*wc)/(wa+wb+wc);
  col*=.88+.12*fbm3(p*2.5+t);
  col+=vec3(1.)*.05*exp(-length(q-vec2(0.,1.1))*2.);
  gl_FragColor=vec4(col+dither(gl_FragCoord.xy)*2.,1.);
}`;

export const PROGRAMS = { sky: SKY, aurora: AURORA, rain: RAIN, snow: SNOW, nebula: NEBULA, gradient: GRADIENT } as const;
export type ShaderEffect = keyof typeof PROGRAMS;
