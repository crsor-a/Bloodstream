/**
 * Background effects: one fragment shader per effect, drawn on a full-screen triangle.
 * Everything is procedural (no images), so it works offline and stays sharp at any size.
 * GLSL ES 1.00 for the widest WebGL support.
 */
export const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

const COMMON = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uSeed;
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32+uSeed);return fract(p.x*p.y);}
vec2 hash2(vec2 p){float n=hash(p);return vec2(n,hash(p+n));}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<5;i++){v+=a*noise(p);p=m*p;a*=.5;}return v;}
float grain(vec2 fc){return (hash(fc+fract(uTime*.37))-.5)/255.*2.;}
`;

/** Twinkling star field. Brightness falls off with density so it stays subtle on phones. */
const STARS = `
float stars(vec2 uv,float scale,float t){
  vec2 g=uv*scale;vec2 id=floor(g);vec2 f=fract(g)-.5;
  vec2 o=hash2(id)-.5;float h=hash(id+7.1);
  float d=length(f-o*.8);
  float size=mix(.015,.05,pow(h,6.));
  float tw=.65+.35*sin(t*(1.+h*3.)+h*40.);
  float s=smoothstep(size,0.,d)*step(.82,h)*tw;
  return s*(.5+h);
}
`;

export const SKY = COMMON + STARS + `
uniform vec3 uZenith,uHorizon,uGlow;
uniform vec2 uSun;
uniform float uSunUp,uStarVis,uCloud;
void main(){
  vec2 fc=gl_FragCoord.xy;vec2 uv=fc/uRes;float asp=uRes.x/uRes.y;
  vec2 q=vec2(uv.x*asp,uv.y);
  float y=uv.y;
  vec3 col=mix(uHorizon,uZenith,pow(smoothstep(0.,1.,y),.65));
  vec2 sp=vec2(uSun.x*asp,uSun.y);
  float d=distance(q,sp);
  col+=uGlow*(exp(-d*3.2)*.55+exp(-d*12.)*.5)*(.35+.65*uSunUp);
  col+=uGlow*.25*exp(-abs(y-uSun.y)*6.)*smoothstep(.0,.6,1.-abs(uv.x-uSun.x))*uSunUp;
  float disc=smoothstep(.034,.028,d)*uSunUp;
  col=mix(col,vec3(1.,.97,.9),disc);
  float t=uTime;
  vec2 cp=vec2(q.x*1.4+t*.006,q.y*3.2);
  float c=fbm(cp+fbm(cp*.7+t*.004)*1.4);
  float cl=smoothstep(.55,.85,c)*smoothstep(.15,.6,y)*uCloud;
  vec3 cloudCol=mix(uHorizon*1.15,vec3(1.),.45)+uGlow*.35;
  col=mix(col,cloudCol,cl*.55);
  float mw=fbm(vec2(q.x*2.-q.y*1.2,q.y*2.+q.x*.8)*1.8);
  float band=exp(-pow((q.x*.6+q.y-.85)*2.2,2.));
  vec3 milky=vec3(.55,.6,.8)*smoothstep(.45,.8,mw)*band*.16;
  float st=stars(q,90.,t)+stars(q+11.,150.,t*1.3)*.7+stars(q+3.,40.,t*.8)*1.3;
  col+=(vec3(st)*vec3(.95,.97,1.)+milky)*uStarVis*(1.-cl);
  col*=1.-.25*pow(1.-y,3.)*uStarVis;
  gl_FragColor=vec4(col+grain(fc),1.);
}`;

export const AURORA = COMMON + STARS + `
float ridge(float x){return .14+.07*fbm(vec2(x*2.2,1.))+.04*fbm(vec2(x*7.,3.));}
void main(){
  vec2 fc=gl_FragCoord.xy;vec2 uv=fc/uRes;float asp=uRes.x/uRes.y;vec2 q=vec2(uv.x*asp,uv.y);
  float t=uTime*.6;
  vec3 col=mix(vec3(.01,.025,.05),vec3(.0,.004,.015),uv.y);
  col+=vec3(.0,.05,.06)*exp(-uv.y*3.);
  col+=vec3(stars(q,110.,uTime)+stars(q+5.,60.,uTime*.7))*.9;
  vec3 acc=vec3(0.);
  for(int i=0;i<3;i++){
    float fi=float(i);
    float base=.42+fi*.12+.08*sin(q.x*1.3+t*.2+fi*2.);
    float wave=fbm(vec2(q.x*1.1+fi*3.7+t*.08,t*.05+fi))*0.32;
    float edge=base+wave-.16;
    float dy=uv.y-edge;
    float curtain=smoothstep(-.015,.01,dy)*exp(-max(dy,0.)*(4.5-fi*.8));
    float rays=.55+.45*noise(vec2(q.x*38.+fi*13.+t*.6,dy*1.5));
    rays*=.6+.4*noise(vec2(q.x*9.-t*.3,fi));
    vec3 green=vec3(.15,1.,.55),teal=vec3(.1,.75,.85),violet=vec3(.65,.25,.9);
    vec3 c=mix(green,teal,clamp(fi*.5,0.,1.));
    c=mix(c,violet,smoothstep(.08,.45,dy));
    acc+=c*curtain*rays*(.85-fi*.18);
  }
  col+=acc*.85;
  col+=vec3(.05,.35,.22)*.25*smoothstep(.6,.1,uv.y)*(.6+.4*sin(t*.3));
  float r=ridge(q.x+.3);
  float m=smoothstep(r+.002,r-.002,uv.y);
  vec3 land=vec3(.004,.008,.012)+acc*.04;
  col=mix(col,land,m);
  float r2=ridge(q.x*1.7+4.)*.62;
  col=mix(col,vec3(0.),smoothstep(r2+.002,r2-.002,uv.y));
  gl_FragColor=vec4(col+grain(fc),1.);
}`;

export const RAIN = COMMON + `
vec3 bokeh(vec2 uv,float t){
  vec3 col=mix(vec3(.02,.03,.06),vec3(.05,.07,.12),uv.y);
  col+=vec3(.25,.12,.05)*exp(-pow((uv.y-.25)*3.,2.))*.6;
  for(int i=0;i<3;i++){
    float fi=float(i);
    float sc=4.+fi*3.;
    vec2 g=uv*vec2(sc,sc*.6)+vec2(t*.01*(fi+1.),0.);
    vec2 id=floor(g),f=fract(g)-.5;
    float h=hash(id+fi*17.);
    vec2 o=(hash2(id+fi)-.5)*.6;
    float r=.18+.22*h;
    float d=length(f-o);
    float a=smoothstep(r,r*.82,d)*step(.35,h);
    vec3 c=h>.8?vec3(1.,.55,.2):h>.6?vec3(1.,.25,.2):h>.45?vec3(.3,.55,1.):vec3(.95,.85,.7);
    float flick=.8+.2*sin(t*(1.+h*2.)+h*30.);
    col+=c*a*(.22-fi*.05)*flick*smoothstep(.95,.2,uv.y);
  }
  return col;
}
vec2 dropLayer(vec2 uv,float t,float sc,out float mask){
  vec2 a=vec2(6.,1.);
  vec2 g=uv*sc*a;
  vec2 id=floor(g);
  float colShift=hash(vec2(id.x,0.));
  g.y+=t*(.8+colShift*.6)+colShift*10.;
  id=floor(g);
  vec2 st=fract(g)-vec2(.5,0.);
  float n=hash(id);
  float x=(n-.5)*.7;
  float ti=fract(t*.6+n*7.);
  float yy=-sin(ti*6.2831+sin(ti*6.2831)*.5)*.35+.5;
  vec2 p=(st-vec2(x+sin(id.y*3.+g.y*.5)*.05,yy))/a;
  float d=length(p*vec2(1.,1.25));
  float drop=smoothstep(.045,.0,d);
  float trail=smoothstep(.022,.0,abs(p.x))*smoothstep(-.02,.02,st.y-yy)*smoothstep(1.,yy,st.y)*.0;
  vec2 tp=(fract(st*vec2(1.,8.))-.5)/vec2(a.x,8.);
  float tdrops=smoothstep(.018,.0,length(vec2(p.x,tp.y)))*step(yy,st.y)*smoothstep(1.,yy,st.y)*.9;
  mask=max(drop,tdrops+trail);
  return p*drop*18.+vec2(p.x,0.)*tdrops*8.;
}
float staticDrops(vec2 uv,float t){
  vec2 g=uv*42.;vec2 id=floor(g);vec2 f=fract(g)-.5;
  vec2 o=(hash2(id)-.5)*.7;float h=hash(id+3.);
  float fade=smoothstep(0.,.1,fract(t*.05+h))*smoothstep(1.,.6,fract(t*.05+h));
  return smoothstep(.24*h,.0,length(f-o))*step(.55,h)*fade;
}
void main(){
  vec2 fc=gl_FragCoord.xy;vec2 uv=fc/uRes;float asp=uRes.x/uRes.y;vec2 q=vec2(uv.x*asp,uv.y);
  float t=uTime*.5;
  float m1,m2;
  vec2 o1=dropLayer(q,t,1.,m1);
  vec2 o2=dropLayer(q*1.6+3.1,t*1.1,1.,m2);
  float sd=staticDrops(q,t);
  vec2 off=o1+o2*.6;
  float mask=max(max(m1,m2),sd);
  vec3 blurred=bokeh(uv,uTime);
  vec3 sharp=bokeh(uv+off*.06+vec2(0.,sd*.004),uTime)*1.25;
  vec3 col=mix(blurred*.85,sharp,clamp(mask,0.,1.));
  col+=vec3(.9,.95,1.)*pow(clamp(mask,0.,1.),6.)*.08;
  col+=vec3(.02,.025,.04)*(1.-mask)*fbm(q*3.+t*.05);
  gl_FragColor=vec4(col+grain(fc),1.);
}`;

export const SNOW = COMMON + `
float flakes(vec2 uv,float t,float sc,float speed,float size,float blur){
  vec2 g=uv*sc;
  g.y+=t*speed;
  g.x+=sin(g.y*.35+t*.6)*.45;
  vec2 id=floor(g);vec2 f=fract(g)-.5;
  float h=hash(id);
  vec2 o=(hash2(id+1.3)-.5)*.75;
  o.x+=sin(t*(1.+h)+h*20.)*.12;
  float d=length(f-o);
  float r=size*(.45+h*.55);
  return smoothstep(r,r*blur,d)*step(.25,h);
}
void main(){
  vec2 fc=gl_FragCoord.xy;vec2 uv=fc/uRes;float asp=uRes.x/uRes.y;vec2 q=vec2(uv.x*asp,uv.y);
  float t=uTime;
  vec3 col=mix(vec3(.06,.08,.12),vec3(.01,.015,.03),pow(uv.y,.8));
  vec2 mp=vec2(asp*.78,.86);
  float md=distance(q,mp);
  col+=vec3(.55,.6,.7)*(exp(-md*9.)*.35+exp(-md*2.5)*.12);
  col=mix(col,vec3(.85,.88,.95),smoothstep(.042,.036,md));
  col+=vec3(.12,.14,.18)*smoothstep(.35,.0,uv.y)*(.7+.3*fbm(vec2(q.x*2.+t*.02,1.)));
  float s=0.;
  s+=flakes(q,t,34.,1.2,.10,.2)*.35;
  s+=flakes(q+.37,t,22.,1.6,.13,.25)*.5;
  s+=flakes(q+.71,t,14.,2.2,.16,.35)*.7;
  s+=flakes(q+1.3,t,8.,3.,.20,.5)*.8;
  s+=flakes(q+2.1,t,4.5,4.,.26,.85)*.45;
  col+=vec3(.92,.95,1.)*s;
  gl_FragColor=vec4(col+grain(fc),1.);
}`;

export const NEBULA = COMMON + STARS + `
void main(){
  vec2 fc=gl_FragCoord.xy;vec2 uv=fc/uRes;float asp=uRes.x/uRes.y;vec2 q=vec2(uv.x*asp,uv.y)*1.6;
  float t=uTime*.015;
  float a=t*.6;mat2 rot=mat2(cos(a),-sin(a),sin(a),cos(a));
  vec2 p=rot*(q-.8)+.8;
  vec2 w=vec2(fbm(p+t),fbm(p+vec2(5.2,1.3)-t));
  vec2 w2=vec2(fbm(p+3.*w+vec2(1.7,9.2)+t*.5),fbm(p+3.*w+vec2(8.3,2.8)));
  float n=fbm(p+2.5*w2);
  vec3 c1=vec3(.55,.1,.45),c2=vec3(.1,.25,.75),c3=vec3(.05,.6,.65),c4=vec3(1.,.55,.25);
  vec3 col=mix(c2,c1,clamp(n*n*2.,0.,1.));
  col=mix(col,c3,clamp(length(w2)*.7-.3,0.,1.));
  col=mix(col,c4,smoothstep(.75,.95,n)*.6);
  col*=pow(n,2.2)*1.8;
  float dust=smoothstep(.45,.75,fbm(p*2.2-w*1.5+11.));
  col*=1.-dust*.7;
  col+=vec3(stars(q,60.,uTime*.5)*1.1+stars(q+2.,120.,uTime*.4)*.8);
  vec2 g=q*5.;vec2 id=floor(g);vec2 f=fract(g)-.5;float h=hash(id+9.);
  if(h>.97){vec2 o=(hash2(id)-.5)*.6;vec2 d=f-o;float core=smoothstep(.06,0.,length(d));
    float spikes=(smoothstep(.006,0.,abs(d.x))+smoothstep(.006,0.,abs(d.y)))*smoothstep(.35,0.,length(d));
    col+=vec3(.9,.95,1.)*(core+spikes*.6)*(.7+.3*sin(uTime*2.+h*50.));}
  col=col/(1.+col*.35);
  gl_FragColor=vec4(col+grain(fc),1.);
}`;

export const GRADIENT = COMMON + `
uniform vec3 uC0,uC1,uC2;
void main(){
  vec2 fc=gl_FragCoord.xy;vec2 uv=fc/uRes;float asp=uRes.x/uRes.y;vec2 q=vec2(uv.x*asp,uv.y);
  float t=uTime*.07;
  vec2 warp=vec2(fbm(q*1.2+t),fbm(q*1.2-t+4.))-.5;
  vec2 p=q+warp*.35;
  vec2 a=vec2(asp*(.25+.2*sin(t*1.3)),.3+.25*cos(t*.9));
  vec2 b=vec2(asp*(.75+.2*cos(t*1.1)),.7+.2*sin(t*1.7));
  vec2 c=vec2(asp*(.5+.3*sin(t*.7+2.)),.5+.35*cos(t*1.2+1.));
  float wa=1./(.02+pow(distance(p,a),2.)),wb=1./(.02+pow(distance(p,b),2.)),wc=1./(.02+pow(distance(p,c),2.));
  vec3 col=(uC0*wa+uC1*wb+uC2*wc)/(wa+wb+wc);
  col*=.85+.15*fbm(p*3.+t);
  gl_FragColor=vec4(col+grain(fc)*2.,1.);
}`;

export const PROGRAMS = { sky: SKY, aurora: AURORA, rain: RAIN, snow: SNOW, nebula: NEBULA, gradient: GRADIENT } as const;
export type ShaderEffect = keyof typeof PROGRAMS;
