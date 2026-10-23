/* Flow of Water: interactions for a static, GitHub Pages-compatible report. */
(() => {
'use strict';
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const topNav = $('.top-nav');
const progress = $('#scrollProgress');
const sideLinks = $$('[data-side]');
const updateScroll = () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.width = `${max>0?(scrollY/max*100).toFixed(2):0}%`;
  document.body.classList.toggle('reading',scrollY>Math.min(760,innerHeight*.86));
};
let ticking=false;
window.addEventListener('scroll',() => {if(!ticking){requestAnimationFrame(()=>{updateScroll();ticking=false;});ticking=true;}},{passive:true});
updateScroll();
const sections = [...$$('#introduction, #part-a, #s3-1, #s3-3, #s3-4, #part-b, #references')];
if('IntersectionObserver' in window){
  const observer = new IntersectionObserver(entries=>{
    for(const e of entries){
      if(e.isIntersecting){sideLinks.forEach(a=>a.classList.toggle('active',a.dataset.side===e.target.id));}
    }
  },{rootMargin:'-14% 0px -73% 0px',threshold:0});
  sections.forEach(el=>observer.observe(el));
}
function setMenu(open){const panel=$('#mobilePanel');panel.hidden=!open;$('#mobileMenu').setAttribute('aria-expanded',open?'true':'false');}
$('#mobileMenu')?.addEventListener('click',()=>setMenu($('#mobilePanel').hidden));
$$('#mobilePanel a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
$('#tideMode')?.addEventListener('click',()=>{document.body.classList.toggle('evening');$('#tideMode span').textContent=document.body.classList.contains('evening')?'Daylight paper':'Evening paper';});
const print=()=>window.print();$('#openPrint')?.addEventListener('click',print);$('#footerPrint')?.addEventListener('click',print);

// Wave contours are deliberately subtle and rendered only while the hero is onscreen.
const tide=$('#tideCanvas');
if(tide){
  const ctx=tide.getContext('2d');let w=0,h=0,visible=true,frame=0,phase=0;
  function resize(){const b=tide.getBoundingClientRect();const dpr=Math.min(1.5,devicePixelRatio||1);w=b.width;h=b.height;tide.width=Math.round(w*dpr);tide.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}
  function renderWave(){ctx.clearRect(0,0,w,h);
    for(let layer=0;layer<10;layer++){
      const y0=h*(.40+layer*.067), speed=(layer%3+1)*.13, amp=(13+layer*1.6), step=7;
      ctx.beginPath();ctx.lineWidth=layer%4===0?1.15:.64;ctx.strokeStyle=layer%3===0?'rgba(185,241,228,.34)':'rgba(138,207,204,.19)';
      for(let x=0;x<=w+step;x+=step){const nx=x/Math.max(w,1);const y=y0+Math.sin(nx*Math.PI*3.7+phase*speed+layer*.28)*amp+Math.sin(nx*Math.PI*7.9-phase*.14+layer)*4;
        if(x===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
      }ctx.stroke();
    }
    const g=ctx.createLinearGradient(0,h*.57,0,h);g.addColorStop(0,'rgba(68,153,158,0)');g.addColorStop(1,'rgba(66,148,150,.2)');ctx.fillStyle=g;ctx.fillRect(0,h*.57,w,h*.43);
  }
  const animate=()=>{if(!visible)return;phase+=.023;renderWave();frame=requestAnimationFrame(animate)};
  resize();renderWave();
  if(!reduced.matches){
    const io=new IntersectionObserver(e=>{const show=e[0]?.isIntersecting;if(show && !visible){visible=true;animate()}else if(!show){visible=false;cancelAnimationFrame(frame)}},{threshold:0});
    io.observe($('.hero'));animate();
    addEventListener('resize',()=>{resize();renderWave()},{passive:true});
  }
}

// Explore x_t = (1-t)*noise + t*image; a conceptual demonstration only.
const noiseCanvas=$('#noiseCanvas'),range=$('#flowT');
if(noiseCanvas&&range){
  const ctx=noiseCanvas.getContext('2d',{willReadFrequently:true});const cw=noiseCanvas.width,ch=noiseCanvas.height;
  const source=new Image();source.src='assets/figures/00-nighttime-house-under-moonlit-clouds-source-image-fo.webp';
  let original=null, random=null;
  function gaussian(){let a=0,b=0;while(!a)a=Math.random();while(!b)b=Math.random();return Math.sqrt(-2*Math.log(a))*Math.cos(2*Math.PI*b)}
  function draw(){if(!original)return;const t=Number(range.value)/100;$('#timeReadout').textContent=`t = ${t.toFixed(2)}`;
    const pixels=new Uint8ClampedArray(original.length);
    for(let i=0;i<original.length;i+=4){for(let j=0;j<3;j++){const im=original[i+j];pixels[i+j]=Math.max(0,Math.min(255,(1-t)*random[i+j]+t*im));}pixels[i+3]=255;}
    ctx.putImageData(new ImageData(pixels,cw,ch),0,0);
  }
  source.addEventListener('load',()=>{const ratio=Math.max(cw/source.naturalWidth,ch/source.naturalHeight),ww=source.naturalWidth*ratio,hh=source.naturalHeight*ratio;ctx.drawImage(source,(cw-ww)/2,(ch-hh)/2,ww,hh);original=ctx.getImageData(0,0,cw,ch).data;random=new Float32Array(original.length);for(let i=0;i<random.length;i+=4){random[i]=128+gaussian()*90;random[i+1]=128+gaussian()*90;random[i+2]=128+gaussian()*90;}draw();});
  source.addEventListener('error',()=>{ctx.fillStyle='#294c50';ctx.fillRect(0,0,cw,ch);ctx.fillStyle='#b5d3cc';ctx.font='16px Georgia';ctx.fillText('Add nighttime-house image to view the flow',25,160)});
  range.addEventListener('input',draw);
}

// Resolve actual experiment assets. The site is usable without them, but never invents model results.
function tryImage(path){return new Promise(resolve=>{if(!path)return resolve(null);const i=new Image();i.onload=()=>resolve(path);i.onerror=()=>resolve(null);i.src=path;});}
async function firstExisting(paths){for(const p of paths){const found=await tryImage(p.trim());if(found)return found;}return null;}
async function applyFigureFiles(){
  // Existing screenshot previews remain the fallback. The original saved figures take precedence when available.
  for(const img of $$('figure img[data-paths]')){
    const paths=img.dataset.paths.split('|').filter(Boolean);
    const p=await firstExisting(paths);
    if(p){img.src=p;img.classList.remove('needs-real-file');img.closest('figure')?.querySelector('.asset-pending')?.remove();}
    else if(!img.getAttribute('src')){img.style.display='none';}
  }
}
applyFigureFiles();
function rotate(src){return src;}
function makeSmall(src){return new Promise(resolve=>{const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=64;c.height=64;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=true;let ratio=Math.max(64/img.width,64/img.height),rw=img.width*ratio,rh=img.height*ratio;ctx.drawImage(img,(64-rw)/2,(64-rh)/2,rw,rh);resolve(c.toDataURL('image/png'));};img.onerror=()=>resolve(src);img.src=src;});}
const artLabels={0:['Old man','Campfire'],1:['Mountain village','Horse'],2:['Black cat','Ocean waves'],3:['Volcano','Red wine glass']};
async function setupGalleries(){
  const arts=$$('.artbox[data-paths]');
  for(const [n,box] of arts.entries()){
    const given=box.dataset.paths.split('|').filter(Boolean);
    const extraPaths=[`assets/experiments/${n<4?'anagram':'hybrid'}_${n<4?n:n-4}.png`];
    const src=await firstExisting([...extraPaths,...given]);
    if(!src){
      box.classList.add('unavailable');const msg=box.querySelector('.missing');
      if(msg){msg.textContent='Your saved experiment image goes here';}
      continue;
    }
    box.classList.add('loaded');box.innerHTML='';
    const card=box.closest('.result-card'); const controls=document.createElement('div');controls.className='art-controls';
    if(n<4){
      const figure=document.createElement('div');figure.className='anagram-interactive';
      const im=new Image();im.src=src;im.alt=`Visual anagram: ${artLabels[n][0]} / ${artLabels[n][1]}`;figure.appendChild(im);
      const printed=im.cloneNode();printed.className='anagram-print-second';printed.style.display='none';printed.style.transform='rotate(180deg)';figure.appendChild(printed);
      box.appendChild(figure);
      let rotated=false;
      const button=document.createElement('button');button.textContent='↻ Rotate 180°';button.type='button';
      const label=document.createElement('span');label.textContent=`Seeing: ${artLabels[n][0]}`;
      button.addEventListener('click',()=>{rotated=!rotated;im.classList.toggle('flipped',rotated);label.textContent=`Seeing: ${rotated?artLabels[n][1]:artLabels[n][0]}`;button.textContent=rotated?'↶ Turn back':'↻ Rotate 180°';});
      controls.append(button,label);card.querySelector('.card-meta').textContent='ONE PAINTING, TWO ORIENTATIONS';
    }else{
      const figure=document.createElement('div');figure.className='hybrid-interactive';
      const full=new Image();full.src=src;full.alt='Full-resolution hybrid image';
      const pane=document.createElement('div');pane.className='far-pane';const sm=new Image();sm.alt='64-pixel view of same hybrid image';sm.className='far-img';sm.src=await makeSmall(src);const txt=document.createElement('small');txt.textContent='64 PX / FAR';pane.append(sm,txt);figure.append(full,pane);box.appendChild(figure);
      const btn=document.createElement('button');btn.textContent='⇄ View from far away';btn.type='button';
      let far=false;btn.addEventListener('click',()=>{far=!far;full.src=far?sm.src:src;full.style.imageRendering=far?'pixelated':'auto';btn.textContent=far?'⇄ View up close':'⇄ View from far away'});
      controls.append(btn);card.querySelector('.card-meta').textContent='FAR: BROAD FORMS / NEAR: FINE DETAIL';
    }
    const inspect=document.createElement('button');inspect.type='button';inspect.textContent='↗ Full size';inspect.addEventListener('click',()=>openLightbox(src,card.querySelector('h4')?.textContent||'Experiment artwork'));controls.appendChild(inspect);
    card.querySelector('.card-meta').after(controls);
  }
}
setupGalleries();

// Reusable lightbox with keyboard navigation; no third-party dependency.
const lightbox=$('#lightbox'), lbImg=$('.lb-content img'), lbCaption=$('.lb-caption');let lastFocus=null,activeIndex=-1;
const figureEntries=()=>$$('figure.figure img').filter(img=>img.getAttribute('src')&&img.complete&&img.naturalWidth>0).map(img=>({src:img.currentSrc||img.src,title:img.closest('figure')?.querySelector('.figcaption')?.textContent?.trim()||img.alt}));
function openLightbox(src,title,index=-1){lastFocus=document.activeElement;activeIndex=index;lbImg.src=src;lbCaption.textContent=title;lightbox.hidden=false;document.body.style.overflow='hidden';$('.lb-close').focus();}
function closeLightbox(){lightbox.hidden=true;document.body.style.overflow='';lbImg.removeAttribute('src');lastFocus?.focus?.()}
$$('figure.figure').forEach(figure=>{
 const fn=()=>{const img=figure.querySelector('img');if(!img?.getAttribute('src')||!img.naturalWidth)return;const entries=figureEntries();const idx=entries.findIndex(x=>x.src===img.currentSrc||x.src===img.src);openLightbox(img.currentSrc||img.src,figure.querySelector('.figcaption')?.textContent.trim()||img.alt,idx)};
 figure.addEventListener('click',fn);figure.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fn()}});
});
$('.lb-close').addEventListener('click',closeLightbox);
lightbox.addEventListener('click',e=>{if(e.target===lightbox)closeLightbox()});
function navigate(dir){const entries=figureEntries();if(activeIndex<0||!entries.length)return;activeIndex=(activeIndex+dir+entries.length)%entries.length;openLightbox(entries[activeIndex].src,entries[activeIndex].title,activeIndex);}
$('.lb-prev').addEventListener('click',()=>navigate(-1));$('.lb-next').addEventListener('click',()=>navigate(1));
window.addEventListener('keydown',e=>{if(lightbox.hidden)return;if(e.key==='Escape')closeLightbox();if(e.key==='ArrowRight')navigate(1);if(e.key==='ArrowLeft')navigate(-1)});

// Ensure lazy images and interactive artworks are present before the print dialog.
window.addEventListener('beforeprint',()=>{$$('img[loading="lazy"]').forEach(i=>i.loading='eager');});
})();
