// Offline artwork build: three@0.160.1 and playwright-core. The dashboard only loads the baked images.
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright-core');

function paint(project) {
  const juli = project === 'juli';
  let seed = juli ? 312 : 981;
  const random = () => ((seed = (Math.imul(1664525, seed) + 1013904223) >>> 0) / 4294967296);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x162940);
  scene.fog = new THREE.FogExp2(0x182d46, .00098);
  const width = 1600, height = 1200;
  const renderer = new THREE.WebGLRenderer({antialias:true, preserveDrawingBuffer:true});
  renderer.setSize(width,height);
  const camera = new THREE.PerspectiveCamera(40,width/height,.5,2400);
  camera.position.set(-191,141,221);
  camera.lookAt(0,17,0);
  camera.updateMatrixWorld();
  scene.add(new THREE.HemisphereLight(0xb5dcff,0x304559,1.65));
  const sun = new THREE.DirectionalLight(0xc6e9ff,2.1);
  sun.position.set(-170,270,100); scene.add(sun);
  const batches = new Map();
  const cube = new THREE.BoxGeometry();
  const cylinder = new THREE.CylinderGeometry(1,1,1,12);
  const object = new THREE.Object3D();
  const material = (color, luminous=false) => luminous
    ? new THREE.MeshBasicMaterial({color}) : new THREE.MeshStandardMaterial({color,roughness:.72});
  const materials = new Map();
  function place(geometry, surface, x,y,z, sx,sy,sz, rotation) {
    if (typeof surface === 'number') {
      if (!materials.has(surface)) materials.set(surface,material(surface));
      surface = materials.get(surface);
    }
    const key = geometry.uuid + surface.uuid;
    if (!batches.has(key)) batches.set(key,{geometry,surface,matrices:[]});
    object.position.set(x,y,z); object.scale.set(sx,sy,sz);
    object.quaternion.identity();
    if (rotation) object.quaternion.copy(rotation);
    object.updateMatrix(); batches.get(key).matrices.push(object.matrix.clone());
  }
  const box = (x,y,z,w,h,d,surface) => place(cube,surface,x,y,z,w,h,d);
  const up = new THREE.Vector3(0,1,0);
  function rod(a,b,r,surface) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
    const direction = end.sub(start), length=direction.length();
    const mid = start.clone().addScaledVector(direction,.5);
    place(cylinder,surface,mid.x,mid.y,mid.z,r,length,r,new THREE.Quaternion().setFromUnitVectors(up,direction.normalize()));
  }
  const cyan = material(0x8defff,true), amber = material(0xf3be7b,true), red = material(0xff7957,true);
  const white = material(0xc4dfdb,true), cable = material(0x81cdda,true);
  // Window atlases include unlit rooms, floor bands and scattered warm interior lights.
  const facades = Array.from({length:8}, (_,variant) => {
    const canvas=document.createElement('canvas'); canvas.width=128; canvas.height=256;
    const ctx=canvas.getContext('2d'); ctx.fillStyle=['#182f44','#20364a','#293b50','#263545'][variant%4]; ctx.fillRect(0,0,128,256);
    for(let row=0; row<32; row++) for(let col=0; col<12; col++) {
      const lit=random(); ctx.fillStyle=lit>.945?'#c9a174':lit>.86?'#859a9c':lit>.64?'#42637a':'#182c3e';
      ctx.fillRect(col*10.7+2,row*8+2,7,3.8);
    }
    const tex=new THREE.CanvasTexture(canvas); tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=8;
    return new THREE.MeshBasicMaterial({map:tex,color:variant%2?0xc2d3df:0xaabfce});
  });
  const channel = juli?75:62;
  box(0,-2.5,0,2600,4,2400,juli?0x103246:0x232c37);
  for(const side of [-1,1]) {
    box(side*(channel+560),.1,0,1120,2,1900,0x263b42);
    box(side*channel,1.1,0,2.3,3,1900,0x536577);
    box(side*(channel+7),1.3,0,11,.2,1800,0x29323e);
    for(let z=-700;z<600;z+=13) {
      box(side*(channel+2),2.4,z,.55,.55,.55,amber);
      if(juli) box(side*(channel-1-random()*4),-.44,z,.5+random()*5,.05,.14,material(0x547171,true));
    }
    for(let ix=0;ix<23;ix++) for(let iz=-21;iz<=18;iz++) {
      const x=side*(channel+35+ix*36), z=iz*36;
      box(x,1.2,z,33,.38,31,0x37434c);
      box(x,1.46,z+16.4,33,.05,.35,0x8d826c);
      if(Math.abs(z)<20) continue;
      for(const offset of [-8,8]) {
        const bx=x+offset, bz=z+(random()-.5)*7;
        const w=9+random()*5, d=14+random()*10;
        const h=4+random()*9+(Math.abs(z)>90?random()**3*46:0);
        box(bx,1.5+h/2,bz,w,h,d,facades[Math.floor(random()*facades.length)]);
        box(bx,h+1.6,bz,w+.35,.55,d+.35,0x3c4a59);
        box(bx+.8,h+2.3,bz+1,w*.55,1.6,d*.46,0x36404a);
      }
    }
  }
  if(juli) {
    for(let i=0;i<8500;i++){
      const x=(random()*2-1)*channel, z=random()*1150-650;
      const color=random()>.85?0x325564:0x204453;
      box(x,-.45,z,.4+random()*3,.03,.10+random()*.14,color);
    }
    for(const [x,z] of [[-37,75],[35,-105],[-42,-130]]) {
      box(x,.45,z,3.6,1.4,18,0x28343c); box(x,1.45,z+2,3,1,8,0x707477);
      box(x,2.1,z+5,2.6,.5,2.5,0xb2ad96);
    }
  } else {
    for(let x=-54;x<=54;x+=5.2) {
      for(const offset of [-.8,.8]) box(x+offset,.12,0,.18,.22,1500,0x778594);
      for(let z=-260;z<250;z+=2.4) box(x,-.05,z,2.7,.22,.4,0x4c4440);
    }
    for(let i=0;i<9;i++) {
      box(-33,1.5,-95+i*12,3.1,3.1,11.4,0x586d7a);
      box(-31.4,2,-95+i*12,.08,.6,10,0x222b38);
    }
  }
  const road=0x304557, concrete=0x657d8b, tower=0x87bbc8;
  const deckY = x => Math.max(1.6,16-Math.max(0,Math.abs(x)-125)*.15);
  // Continuous deck descends to grade at both street junctions.
  for(let x=-500;x<500;x+=4) {
    const y=deckY(x);
    box(x,y-.9,0,4.06,1.8,16,road);
    for(const z of [-8,8]) {
      box(x,y+.28,z,4.08,.65,.34,concrete);
      box(x,y+.64,z,4.08,.11,.2,cyan);
    }
    for(const z of [-4,4]) box(x,y+.03,z,1.8,.08,.12,white);
    box(x,y+.12,0,4.06,.24,.35,0x9a9b88);
    if(x%24===0 && Math.abs(x)>channel && Math.abs(x)<210) {
      for(const z of [-5.5,5.5]) box(x,y/2-1,z,2.5,y,2.6,concrete);
      box(x,y-2.1,0,3,2,15,concrete);
    }
    if(random()<.24) {
      const z=[-6,-2,2,6][Math.floor(random()*4)], sign=Math.sign(z);
      box(x,y+.5,z,2.8,.9,1.3,random()>.45?0x657586:0x273546);
      box(x,y+1.05,z,1.55,.45,1.1,0x385268);
      for(const delta of [-.43,.43]) {
        box(x+sign*1.43,y+.57,z+delta,.13,.24,.23,white);
        box(x-sign*1.43,y+.57,z+delta,.13,.21,.23,red);
      }
    }
  }
  // Build tapered pylons from consecutive rectangular sections. The cable heads
  // and tower instruments share the same parametric centreline.
  const stations=juli?[0]:[-57,62], towerHeight=juli?71:55;
  function shaft(station,side,t) {
    return [station+(juli?7*t*t:0),16+t*towerHeight,side*(juli?10+15*t*t:1.8)];
  }
  function shaftSection(a,b,wa,wb,da,db) {
    const verts=[];
    for(const [center,w,d] of [[a,wa,da],[b,wb,db]]) {
      for(const [xx,zz] of [[-1,-1],[1,-1],[1,1],[-1,1]]) verts.push(center[0]+xx*w/2,center[1],center[2]+zz*d/2);
    }
    const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
    geo.setIndex([0,4,5,0,5,1,1,5,6,1,6,2,2,6,7,2,7,3,3,7,4,3,4,0,4,7,6,4,6,5]);
    geo.computeVertexNormals(); scene.add(new THREE.Mesh(geo,material(tower)));
  }
  for(const station of stations) {
    box(station,1.1,0,13,3,juli?32:18,0x596c76);
    for(const side of [-1,1]) {
      const foot=shaft(station,side,0); box(foot[0],8,foot[2],5.5,16,4.5,concrete);
      for(let i=0;i<16;i++) {
        const t=i/16, next=(i+1)/16, a=shaft(station,side,t), b=shaft(station,side,next);
        shaftSection(a,b,5.6-3*t,5.6-3*next,3.4-t,3.4-next);
        rod([a[0]-2.7+1.5*t,a[1],a[2]+1.6-t*.5],[b[0]-2.7+1.5*next,b[1],b[2]+1.6-next*.5],.13,cyan);
      }
      for(let i=0;i<16;i++) for(const dir of [-1,1]) {
        const head=shaft(station,side,.43+.55*i/15);
        const end=[station+dir*(12+i*(juli?6.2:2.65)),16.6,side*7.7];
        rod(head,end,.115,cable);
      }
    }
  }
  for(const {geometry,surface,matrices} of batches.values()) {
    const mesh=new THREE.InstancedMesh(geometry,surface,matrices.length);
    matrices.forEach((m,i)=>mesh.setMatrixAt(i,m)); scene.add(mesh);
  }
  renderer.render(scene,camera);
  const positions=juli?{
    'S-01':[63,16.7,7.8],'S-02':[-74,16.7,7.8],'F-01':[43,16.7,-7.8],
    'C-08':[-38,39,9],'A-01':shaft(0,-1,.85),'A-03':[0,3.2,12],
    'W-01':[-104,17,-7.8],'G-01':shaft(0,1,1)
  }:{'LK-01':[-57,3,6],'LK-02':shaft(62,1,.95),'LK-03':[15,16.7,7.8]};
  const anchors={};
  for(const [id,pos] of Object.entries(positions)) {
    const pixel=new THREE.Vector3(...pos).project(camera);
    anchors[id]=[Math.round((pixel.x+1)*500),Math.round((1-pixel.y)*375)];
  }
  const film=document.createElement('canvas'); film.width=width; film.height=height;
  const ctx=film.getContext('2d');
  ctx.filter='contrast(1.22) saturate(1.28)'; ctx.drawImage(renderer.domElement,0,0);
  ctx.globalCompositeOperation='screen'; ctx.globalAlpha=.38;
  ctx.filter='contrast(2.9) brightness(1.18) blur(3px)'; ctx.drawImage(renderer.domElement,0,0);
  const image=film.toDataURL('image/webp',.94).split(',')[1];
  renderer.dispose(); renderer.forceContextLoss(); return {image,anchors};
}

async function build() {
  const out=path.resolve(__dirname,'../assets/img');
  const browser=await chromium.launch({executablePath:process.env.CHROME_BIN || undefined,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try {
    const page=await browser.newPage();
    await page.addScriptTag({path:path.join(path.dirname(require.resolve('three')),'three.min.js')});
    for(const id of ['juli','lekai']) {
      const result=await page.evaluate(paint,id);
      fs.writeFileSync(path.join(out,id+'-city.webp'),Buffer.from(result.image,'base64'));
      console.log(id,JSON.stringify(result.anchors));
    }
  } finally { await browser.close(); }
}
build().catch(err=>{console.error(err);process.exitCode=1;});
