(() => {
  const ROOT = 'uii-root';
  const OV_ID = 'uii-overlay';
  let picking = false, hovered = null, inspected = null, dims = [];
  let tab = 'overview', data = null, assetView = 'list', colorView = 'palette';
  let shadow = null; // Shadow DOM root
  let cssText = null; // Cached CSS text
  let panelPos = { x: null, y: null }; // Saved drag position
  const colorSwaps = new Map(); // oldHex → { newHex, originals: [{el, prop, orig}] }
  const colorDisabled = new Map(); // hex → [{el, cssProp, orig}] — hidden colors
  let auditData = null; // Cached audit results
  let seoData = null; // Cached SEO scan results
  let layoutData = null; // Cached layout-overflow scan results
  let colorHighlightMode = false; // Toggle for hover-to-highlight colors on page

  /* ── Markup state ────────────────────────────────────── */
  const MK_SVG_ID = 'uii-mk-svg';
  const MK_TB_ID = 'uii-mk-toolbar';
  const MK_COLORS = ['#FF3B30','#FF9500','#FFCC00','#34C759','#007AFF','#5856D6','#AF52DE','#1A1A2E','#FFFFFF'];
  let markupActive = false;
  let markupTool = 'pencil';
  let markupColor = '#FF3B30';
  let markupStrokeWidth = 3;
  let markupFontSize = 16;
  const MK_FONT_PRESETS = [12, 16, 20, 28];
  let markupSvg = null;
  let markupCurrent = null; // The shape element currently being drawn
  let markupStart = null;   // {x,y} starting point
  let markupPath = '';      // For pencil tool
  let markupTbHost = null;
  let markupTbShadow = null;
  let markupTextEditor = null;
  let markupInspectorVisible = true; // While in markup, is the inspector panel shown?
  let markupCaptures = []; // [{ id, timestamp, dataUrl }] — persisted to chrome.storage.local
  let markupCapturesLoaded = false;
  const MK_CAP_KEY = 'uii_markup_captures';
  const MK_CAP_LIMIT = 20;

  /* ── Icons ──────────────────────────────────────────── */
  const IC = {
    grid:'<svg viewBox="0 0 24 24"><path d="M3 3h8v8H3zm0 10h8v8H3zm10-10h8v8h-8zm0 10h8v8h-8z"/></svg>',
    drop:'<svg viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0L12 2.69z"/></svg>',
    type:'<svg viewBox="0 0 24 24"><path d="M9.93 13.5h4.14L12 7.98zM20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-4.05 16.5l-1.14-3H9.17l-1.12 3H5.96l5.11-13h1.86l5.11 13h-2.09z"/></svg>',
    image:'<svg viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>',
    target:'<svg viewBox="0 0 24 24"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>',
    close:'<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
    copy:'<svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>',
    back:'<svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>',
    dl:'<svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>',
    listv:'<svg viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>',
    gridv:'<svg viewBox="0 0 24 24"><path d="M3 3h8v8H3zm0 10h8v8H3zm10-10h8v8h-8zm0 10h8v8h-8z"/></svg>',
    menu:'<svg viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>',
    audit:'<svg viewBox="0 0 24 24"><path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51L12.96 17.55C12.96 17.55 11 21 11 21z"/></svg>',
    warn:'<svg viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>',
    check:'<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>',
    seo:'<svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>',
    layout:'<svg viewBox="0 0 24 24"><path d="M3 3v18h2V5h14v16h2V3H3zm4 4v2h10V7H7zm0 4v2h10v-2H7zm0 4v4h6v-4H7z"/></svg>',
    markup:'<svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>',
    pencil:'<svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>',
    rect:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="5" width="16" height="14" rx="1"/></svg>',
    ellipse:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="12" rx="9" ry="7"/></svg>',
    arrow:'<svg viewBox="0 0 24 24"><path d="M4.5 19.5L18 6m0 0H8.5M18 6v9.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    textIcon:'<svg viewBox="0 0 24 24"><path d="M5 4v3h5.5v12h3V7H19V4z"/></svg>',
    trash:'<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>',
    camera:'<svg viewBox="0 0 24 24"><path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zm9-9h-3.17l-1.83-2H8L6.17 6.2H3a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2v-11a2 2 0 0 0-2-2zM12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/></svg>',
    eye:'<svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></svg>',
    eyeOff:'<svg viewBox="0 0 24 24"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92A11.83 11.83 0 0 0 23 12c-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-4 .7l2.17 2.15A4.94 4.94 0 0 1 12 7zM2 4.27l2.28 2.28A11.83 11.83 0 0 0 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l3.05 3.05 1.41-1.41L3.41 2.86 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>',
  };

  /* ── Util ────────────────────────────────────────────── */
  const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const hex = rgb => { const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/); if(!m) return rgb; const base='#'+[m[1],m[2],m[3]].map(x=>parseInt(x).toString(16).padStart(2,'0')).join(''); if(m[4]!==undefined&&parseFloat(m[4])<1){ return base+Math.round(parseFloat(m[4])*255).toString(16).padStart(2,'0'); } return base; };
  const hex6 = h => h.startsWith('#') ? h.slice(0,7) : h;
  const up = h => h.startsWith('#') ? h.toUpperCase() : h;
  const lum = h => { const c=hex6(h); if (!c.startsWith('#') || c.length < 7) return 0; const r=parseInt(c.slice(1,3),16), g=parseInt(c.slice(3,5),16), b=parseInt(c.slice(5,7),16); return (0.299*r+0.587*g+0.114*b)/255; };
  const contrast = h => lum(h) > 0.5 ? '#111' : '#fff';
  const vis = el => { const s=getComputedStyle(el); return s.display!=='none'&&s.visibility!=='hidden'&&s.opacity!=='0'; };
  const own = el => el.closest('#'+ROOT)||el.id===ROOT||el.id===OV_ID||el.id===TT_ID||el.closest('#'+TT_ID)||el.id===MK_SVG_ID||el.closest('#'+MK_SVG_ID)||el.id===MK_TB_ID||el.closest('#'+MK_TB_ID)||el.classList?.contains('uii-dim-label')||el.classList?.contains('uii-mk-text-input');
  const sides = v => { if(!v||v==='0px') return [0,0,0,0]; const p=v.split(' ').map(x=>parseInt(x)||0); return p.length===1?[p[0],p[0],p[0],p[0]]:p.length===2?[p[0],p[1],p[0],p[1]]:p.length===3?[p[0],p[1],p[2],p[1]]:[p[0],p[1],p[2],p[3]]; };
  const wn = w => ({'100':'Thin','200':'Extra Light','300':'Light','400':'Regular','500':'Medium','600':'Semi Bold','700':'Bold','800':'Extra Bold','900':'Black'}[w]||'');
  const wname = w => { const n = wn(w); return n ? n+' ('+w+')' : w; };
  const etype = t => ({'a':'Link','button':'Button','input':'Input','textarea':'Textarea','select':'Select','img':'Image','video':'Video','svg':'SVG','h1':'Heading 1','h2':'Heading 2','h3':'Heading 3','h4':'Heading 4','p':'Paragraph','span':'Text','label':'Label','li':'List Item','ul':'List','ol':'List','nav':'Navigation','header':'Header','footer':'Footer','main':'Main','section':'Section','article':'Article','div':'Div'})[t]||'Element';
  const sorted = (m,l=50) => [...m.entries()].sort((a,b)=>b[1]-a[1]).slice(0,l);
  const toast = msg => { document.querySelectorAll('.uii-toast').forEach(t=>t.remove()); const e=document.createElement('div'); e.className='uii-toast'; e.textContent=msg; document.body.appendChild(e); setTimeout(()=>e.remove(),1200); };
  const cp = t => { navigator.clipboard.writeText(t); toast('Copied'); };
  const clearDims = () => { dims.forEach(e=>e.remove()); dims=[]; };
  const fmtSize = b => b>=1024?(b/1024).toFixed(1)+' KB':b+' B';

  /* ── Scan ────────────────────────────────────────────── */
  function scan() {
    const d = { colors:new Map(), colorsByCategory:{text:new Map(),background:new Map(),border:new Map()}, fontSizes:new Map(), fontFamilies:new Map(), fontStyles:[], assets:[], classes:new Map(), borders:new Map(), borderRadii:new Map(), shadows:new Map(), zIndices:new Map(), spacing:new Map() };
    const fm = new Map();
    const catMap = {color:'text',backgroundColor:'background',borderColor:'border'};
    document.querySelectorAll('*').forEach(el => {
      if (own(el)||!vis(el)) return;
      const cs = getComputedStyle(el);
      ['color','backgroundColor','borderColor'].forEach(p => { const v=cs[p]; if(v&&v!=='rgba(0, 0, 0, 0)'&&v!=='transparent'){ const h=hex(v); d.colors.set(h,(d.colors.get(h)||0)+1); const cat=d.colorsByCategory[catMap[p]]; cat.set(h,(cat.get(h)||0)+1); }});
      const ff=cs.fontFamily.split(',')[0].trim().replace(/['"]/g,''), fs=cs.fontSize, fw=cs.fontWeight;
      if(ff) d.fontFamilies.set(ff,(d.fontFamilies.get(ff)||0)+1);
      if(fs) d.fontSizes.set(fs,(d.fontSizes.get(fs)||0)+1);
      const fk=`${ff}|${fs}|${fw}`; if(!fm.has(fk)) fm.set(fk,{family:ff,size:fs,weight:fw,count:0}); fm.get(fk).count++;
      ['margin','padding'].forEach(p=>{const v=cs[p];if(v&&v!=='0px'){const k=`${p}: ${v}`;d.spacing.set(k,(d.spacing.get(k)||0)+1);}});
      el.classList.forEach(c=>{if(c&&!c.startsWith('uii-'))d.classes.set(c,(d.classes.get(c)||0)+1);});
      if(cs.borderStyle&&cs.borderStyle!=='none'){const k=`${cs.borderWidth} ${cs.borderStyle} ${hex(cs.borderColor)}`;d.borders.set(k,(d.borders.get(k)||0)+1);}
      if(cs.borderRadius&&cs.borderRadius!=='0px') d.borderRadii.set(cs.borderRadius,(d.borderRadii.get(cs.borderRadius)||0)+1);
      if(cs.boxShadow&&cs.boxShadow!=='none') d.shadows.set(cs.boxShadow,(d.shadows.get(cs.boxShadow)||0)+1);
      if(cs.zIndex&&cs.zIndex!=='auto') d.zIndices.set(cs.zIndex,(d.zIndices.get(cs.zIndex)||0)+1);
    });
    d.fontStyles = [...fm.values()].sort((a,b)=>b.count-a.count);
    document.querySelectorAll('img').forEach(img=>{ if(own(img)) return; const src=img.src||img.currentSrc; if(!src) return; d.assets.push({type:'img',src,name:src.split('/').pop().split('?')[0]||'image',el:img}); });
    document.querySelectorAll('svg').forEach((svg,i)=>{ if(own(svg)) return; try { const s=new XMLSerializer().serializeToString(svg); d.assets.push({type:'svg',src:URL.createObjectURL(new Blob([s],{type:'image/svg+xml'})),name:`svg-${i}.svg`,size:s.length,raw:s}); } catch(e){} });
    return d;
  }

  /* ── Contrast ratio helper ──────────────────────────── */
  function relLum(h) {
    const c=hex6(h);
    const [r,g,b] = [c.slice(1,3),c.slice(3,5),c.slice(5,7)].map(x => { let v=parseInt(x,16)/255; return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4); });
    return 0.2126*r+0.7152*g+0.0722*b;
  }
  function contrastRatio(fg,bg) {
    const l1=relLum(fg), l2=relLum(bg);
    return ((Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05)).toFixed(2);
  }
  // Suggest a color that passes AA (4.5:1) against bg, staying close in hue to fg
  function suggestColor(fg, bg) {
    const bgL = relLum(bg);
    // Parse fg into HSL, then adjust lightness
    const r=parseInt(fg.slice(1,3),16)/255, g=parseInt(fg.slice(3,5),16)/255, b=parseInt(fg.slice(5,7),16)/255;
    const max=Math.max(r,g,b), min=Math.min(r,g,b);
    let h,s,l=(max+min)/2;
    if(max===min){h=s=0;}else{const d=max-min;s=l>.5?d/(2-max-min):d/(max+min);switch(max){case r:h=((g-b)/d+(g<b?6:0))/6;break;case g:h=((b-r)/d+2)/6;break;case b:h=((r-g)/d+4)/6;break;}}
    // Binary search for lightness that gives 4.5:1
    const needDark = bgL > 0.18; // dark text on light bg
    let lo = needDark ? 0 : l, hi = needDark ? l : 1;
    for(let i=0;i<30;i++){
      const mid=(lo+hi)/2;
      const testHex=hslToHex(h,s,mid);
      const ratio=parseFloat(contrastRatio(testHex,bg));
      if(needDark){ ratio>=4.5?lo=mid:hi=mid; } else { ratio>=4.5?hi=mid:lo=mid; }
    }
    return hslToHex(h,s,(lo+hi)/2);
  }
  function hslToHex(h,s,l){
    const hue2rgb=(p,q,t)=>{if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;};
    let r,g,b;
    if(s===0){r=g=b=l;}else{const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q;r=hue2rgb(p,q,h+1/3);g=hue2rgb(p,q,h);b=hue2rgb(p,q,h-1/3);}
    return '#'+[r,g,b].map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join('');
  }

  /* ── Audit: Layout Shifts ────────────────────────────── */
  function scanLayoutShifts() {
    return new Promise(resolve => {
      const shifts = [];
      try {
        const obs = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              const sources = (entry.sources || []).map(s => s.node).filter(Boolean);
              shifts.push({ score: entry.value, elements: sources });
            }
          }
        });
        obs.observe({ type: 'layout-shift', buffered: true });
        setTimeout(() => { obs.disconnect(); resolve(shifts); }, 500);
      } catch(e) { resolve(shifts); }
    });
  }

  function scanCLSCulprits() {
    const culprits = [];
    document.querySelectorAll('img').forEach(img => {
      if (own(img)) return;
      if ((!img.hasAttribute('width') || !img.hasAttribute('height')) && img.naturalWidth > 0) {
        culprits.push({ el: img, type: 'img', issue: 'missing-dimensions',
          fix: `Add width="${img.naturalWidth}" height="${img.naturalHeight}" to <img src="${(img.src||'').split('/').pop().split('?')[0]}">` });
      }
    });
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule instanceof CSSFontFaceRule) {
            if (!rule.style.fontDisplay || rule.style.fontDisplay === 'auto') {
              culprits.push({ el: null, type: 'font', issue: 'font-display',
                fix: `Add font-display: swap to @font-face for "${rule.style.fontFamily.replace(/['"]/g,'')}"` });
            }
          }
        }
      } catch(e) { /* cross-origin */ }
    }
    return culprits;
  }

  /* ── Audit: Image Audit ─────────────────────────────── */
  function scanImages() {
    const results = [];
    const viewH = window.innerHeight;
    document.querySelectorAll('img').forEach(img => {
      if (own(img) || !img.src) return;
      const rect = img.getBoundingClientRect();
      const nw = img.naturalWidth, nh = img.naturalHeight;
      const rw = Math.round(rect.width), rh = Math.round(rect.height);
      const oversized = nw > rw * 1.5 && rw > 0;
      const savingsPercent = oversized ? Math.round((1 - (rw * rh) / (nw * nh)) * 100) : 0;
      const ext = (img.src.split('.').pop().split('?')[0] || '').toLowerCase();
      const suggestWebP = ['png','jpg','jpeg','bmp','gif'].includes(ext);
      const belowFold = rect.top > viewH;
      const missingLazy = belowFold && img.loading !== 'lazy';
      const issues = [];
      if (oversized) issues.push('oversized');
      if (missingLazy) issues.push('no-lazy');
      if (!img.hasAttribute('alt')) issues.push('no-alt');
      if (suggestWebP) issues.push('use-webp');
      results.push({ el: img, src: img.src, name: (img.src.split('/').pop().split('?')[0] || 'image').slice(0,40),
        naturalW: nw, naturalH: nh, renderedW: rw, renderedH: rh,
        oversized, savingsPercent, missingLazy, missingAlt: !img.hasAttribute('alt'),
        format: ext, suggestWebP, issues });
    });
    return results;
  }

  /* ── Audit: Unused CSS ──────────────────────────────── */
  function scanUnusedCSS() {
    const unused = [];
    let totalRules = 0, skippedSheets = 0;
    for (const sheet of document.styleSheets) {
      let rules;
      try { rules = sheet.cssRules; } catch(e) { skippedSheets++; continue; }
      const sheetName = sheet.href ? sheet.href.split('/').pop().split('?')[0] : 'inline';
      for (const rule of rules) {
        if (!(rule instanceof CSSStyleRule)) continue;
        totalRules++;
        try {
          const matched = document.querySelector(rule.selectorText);
          if (!matched) {
            unused.push({ sheet: sheetName, selector: rule.selectorText, ruleText: rule.cssText });
          }
        } catch(e) { /* invalid selector */ }
      }
    }
    return { unused, totalRules, skippedSheets };
  }

  /* ── Audit: Accessibility ─────────────────────────────── */
  function scanAccessibility() {
    const issues = [];

    // 1. Heading hierarchy — check for skipped levels
    const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(el => !own(el) && vis(el));
    let prevLevel = 0;
    headings.forEach(h => {
      const level = parseInt(h.tagName[1]);
      if (prevLevel && level > prevLevel + 1) {
        issues.push({ type: 'heading-skip', severity: 'warn', el: h,
          desc: `Heading jumps from <h${prevLevel}> to <h${level}>`,
          fix: `Change this <h${level}> to <h${prevLevel + 1}> or add the missing intermediate heading levels.` });
      }
      prevLevel = level;
    });
    const h1Count = headings.filter(h => h.tagName === 'H1').length;
    if (h1Count === 0) {
      issues.push({ type: 'missing-h1', severity: 'warn', el: null,
        desc: 'Page has no <h1> element', fix: 'Add a single <h1> element for the main page title.' });
    } else if (h1Count > 1) {
      issues.push({ type: 'multiple-h1', severity: 'info', el: null,
        desc: `Page has ${h1Count} <h1> elements`, fix: 'Use only one <h1> per page. Convert extras to <h2> or lower.' });
    }

    // 2. Images without alt
    document.querySelectorAll('img').forEach(img => {
      if (own(img)) return;
      if (!img.hasAttribute('alt')) {
        issues.push({ type: 'img-no-alt', severity: 'error', el: img,
          desc: `Image missing alt attribute: ${(img.src||'').split('/').pop().split('?')[0].slice(0,40)||'(no src)'}`,
          fix: 'Add a descriptive alt attribute. Use alt="" for decorative images.' });
      }
    });

    // 3. Form inputs without labels
    document.querySelectorAll('input,select,textarea').forEach(inp => {
      if (own(inp) || inp.type === 'hidden' || inp.type === 'submit' || inp.type === 'button') return;
      const hasLabel = inp.id && document.querySelector(`label[for="${inp.id}"]`);
      const wrappedInLabel = inp.closest('label');
      const hasAria = inp.getAttribute('aria-label') || inp.getAttribute('aria-labelledby');
      if (!hasLabel && !wrappedInLabel && !hasAria) {
        const name = inp.name || inp.id || inp.type || 'unknown';
        issues.push({ type: 'input-no-label', severity: 'error', el: inp,
          desc: `Form input "${name}" has no associated label`,
          fix: `Add a <label for="${inp.id||'...'}"> or wrap the input in a <label>, or add aria-label.` });
      }
    });

    // 4. Buttons/links without accessible text
    document.querySelectorAll('button,a,[role="button"]').forEach(el => {
      if (own(el) || !vis(el)) return;
      const text = (el.textContent || '').trim();
      const ariaLabel = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.getAttribute('title');
      const imgAlt = el.querySelector('img[alt]')?.getAttribute('alt');
      if (!text && !ariaLabel && !imgAlt) {
        const tag = el.tagName.toLowerCase();
        issues.push({ type: 'empty-interactive', severity: 'error', el,
          desc: `<${tag}> has no accessible text`,
          fix: `Add visible text, aria-label, or title attribute to this <${tag}>.` });
      }
    });

    // 5. Missing lang attribute
    if (!document.documentElement.hasAttribute('lang')) {
      issues.push({ type: 'no-lang', severity: 'warn', el: null,
        desc: 'Missing lang attribute on <html>', fix: 'Add lang="en" (or appropriate language) to the <html> element.' });
    }

    // 6. Links opening in new tab without warning
    document.querySelectorAll('a[target="_blank"]').forEach(a => {
      if (own(a)) return;
      const text = (a.textContent||'').toLowerCase();
      const ariaLabel = (a.getAttribute('aria-label')||'').toLowerCase();
      if (!text.includes('new tab') && !text.includes('new window') && !ariaLabel.includes('new tab') && !ariaLabel.includes('new window')) {
        const rel = a.getAttribute('rel') || '';
        if (!rel.includes('noopener')) {
          issues.push({ type: 'link-new-tab', severity: 'info', el: a,
            desc: `Link opens in new tab without rel="noopener": ${(a.textContent||'').trim().slice(0,30)||a.href?.slice(0,30)||'(empty)'}`,
            fix: 'Add rel="noopener noreferrer" and consider adding a visual indicator or aria-label mentioning "opens in new tab".' });
        }
      }
    });

    // 7. Tabindex > 0 (disrupts natural tab order)
    document.querySelectorAll('[tabindex]').forEach(el => {
      if (own(el)) return;
      const ti = parseInt(el.getAttribute('tabindex'));
      if (ti > 0) {
        issues.push({ type: 'tabindex-positive', severity: 'warn', el,
          desc: `Element has tabindex="${ti}" which disrupts natural tab order`,
          fix: 'Use tabindex="0" to add to tab order, or tabindex="-1" for programmatic focus. Avoid positive values.' });
      }
    });

    // Score: rough percentage (0-100)
    const weights = { error: 10, warn: 5, info: 2 };
    const deductions = issues.reduce((s, i) => s + (weights[i.severity] || 0), 0);
    const score = Math.max(0, 100 - deductions);

    return { issues, score };
  }

  /* ── Audit: Spacing Consistency ───────────────────────── */
  function scanSpacing() {
    const grid = 4; // base grid unit in px
    const issues = []; // {prop, value, px, nearest, el, selector, count}
    const seen = new Map(); // "prop:value" → {issue, count}
    document.querySelectorAll('*').forEach(el => {
      if (own(el) || !vis(el)) return;
      const cs = getComputedStyle(el);
      ['marginTop','marginRight','marginBottom','marginLeft','paddingTop','paddingRight','paddingBottom','paddingLeft'].forEach(prop => {
        const raw = cs[prop];
        if (!raw || raw === '0px') return;
        const px = parseFloat(raw);
        if (isNaN(px) || px === 0) return;
        const absPx = Math.abs(px);
        if (absPx % grid !== 0) {
          const nearest = Math.round(absPx / grid) * grid * (px < 0 ? -1 : 1);
          const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
          const key = `${cssProp}:${raw}`;
          if (seen.has(key)) {
            seen.get(key).count++;
          } else {
            const tag = el.tagName.toLowerCase();
            const cls = Array.from(el.classList).filter(c => !c.startsWith('uii-')).slice(0, 2);
            const selector = tag + cls.map(c => '.' + c).join('');
            const entry = { prop: cssProp, value: raw, px, nearest: nearest + 'px', el, selector, count: 1 };
            seen.set(key, entry);
            issues.push(entry);
          }
        }
      });
    });
    issues.sort((a, b) => b.count - a.count);
    const totalChecked = document.querySelectorAll('*').length;
    return { issues, totalChecked, grid };
  }

  /* ── Layout Overflow Scanner ─────────────────────────── */
  function scanLayoutOverflow() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const docEl = document.documentElement;
    const body = document.body;
    const pageScrollH = Math.max(docEl.scrollHeight, body.scrollHeight);
    const pageScrollW = Math.max(docEl.scrollWidth, body.scrollWidth);
    const pageOverflowY = pageScrollH - vh;
    const pageOverflowX = pageScrollW - vw;

    const selectorOf = (el) => {
      const tag = el.tagName.toLowerCase();
      const cls = Array.from(el.classList).filter(c => !c.startsWith('uii-')).slice(0, 2);
      return tag + cls.map(c => '.' + c).join('');
    };

    // Culprits: elements whose bottom edge extends past the viewport.
    const culprits = [];
    document.querySelectorAll('body *').forEach(el => {
      if (own(el) || !vis(el)) return;
      const r = el.getBoundingClientRect();
      if (r.height < 80) return;
      if (r.bottom > vh + 2) {
        const cs = getComputedStyle(el);
        culprits.push({
          el,
          selector: selectorOf(el),
          tag: el.tagName.toLowerCase(),
          height: Math.round(r.height),
          offsetTop: Math.round(r.top + window.scrollY),
          bottomDelta: Math.round(r.bottom - vh),
          cssHeight: cs.height,
          cssMinHeight: cs.minHeight,
          overflowY: cs.overflowY,
        });
      }
    });
    culprits.sort((a, b) => b.bottomDelta - a.bottomDelta);

    // Internal scroll containers actually scrolling.
    const containers = [];
    document.querySelectorAll('*').forEach(el => {
      if (own(el) || !vis(el)) return;
      const cs = getComputedStyle(el);
      if (['auto', 'scroll'].includes(cs.overflowY) && el.scrollHeight - el.clientHeight > 1) {
        containers.push({ el, selector: selectorOf(el), axis: 'y', delta: Math.round(el.scrollHeight - el.clientHeight) });
      }
      if (['auto', 'scroll'].includes(cs.overflowX) && el.scrollWidth - el.clientWidth > 1) {
        containers.push({ el, selector: selectorOf(el), axis: 'x', delta: Math.round(el.scrollWidth - el.clientWidth) });
      }
    });
    containers.sort((a, b) => b.delta - a.delta);

    return {
      page: {
        overflowY: Math.round(pageOverflowY),
        overflowX: Math.round(pageOverflowX),
        vw: Math.round(vw),
        vh: Math.round(vh),
        scrollHeight: Math.round(pageScrollH),
        scrollWidth: Math.round(pageScrollW),
      },
      culprits: culprits.slice(0, 10),
      containers: containers.slice(0, 15),
    };
  }

  function buildLayoutPrompt(L) {
    let p = `Fix layout overflow issues on this page:\n\n`;
    p += `Viewport: ${L.page.vw} x ${L.page.vh}px (scrollable area: ${L.page.scrollWidth} x ${L.page.scrollHeight}px)\n`;
    if (L.page.overflowY > 0) p += `- Page vertical overflow: ${L.page.overflowY}px (unwanted scrollbar)\n`;
    if (L.page.overflowX > 0) p += `- Page horizontal overflow: ${L.page.overflowX}px (unwanted scrollbar)\n`;
    if (L.page.overflowY <= 0 && L.page.overflowX <= 0) p += `- Page fits viewport (no body-level overflow detected)\n`;
    if (L.culprits.length) {
      p += `\nElements extending past the viewport (sorted by overflow):\n`;
      L.culprits.forEach((c, i) => {
        p += `${i + 1}. ${c.selector} — top:${c.offsetTop}px, height:${c.height}px (computed: ${c.cssHeight}), ${c.bottomDelta}px over viewport\n`;
      });
    }
    if (L.containers.length) {
      p += `\nScroll containers that are currently scrolling:\n`;
      L.containers.forEach((c, i) => {
        p += `${i + 1}. ${c.selector} — ${c.axis.toUpperCase()}-axis, ${c.delta}px overflow\n`;
      });
    }
    p += `\nCommon fixes:\n`;
    p += `- If a container uses calc(100dvh - N) or calc(100vh - N), increase N to cover ALL chrome above it (app header + page header margins + flex/grid gaps + container padding).\n`;
    p += `- Check for double-applied padding when wrappers are nested (e.g., parent pb:3 + inner pb:3 = 48px).\n`;
    p += `- For horizontal overflow, add min-width:0 on flex/grid items or overflow-x:hidden on wide tables/images.\n`;
    p += `- For unexpected internal scroll, verify the container has the intended height — it may be shorter than its content by the same delta reported above.\n\n`;
    p += `Please adjust the height/padding/margin rules to eliminate the overflow.`;
    return p;
  }

  /* ── SEO Scanner ─────────────────────────────────────── */
  function scanSEO() {
    const issues = [];
    const info = {};
    const getMeta = (attr, val) => document.querySelector(`meta[${attr}="${val}"]`) || document.querySelector(`meta[${attr}="${val[0].toUpperCase()+val.slice(1)}"]`) || [...document.querySelectorAll(`meta[${attr}]`)].find(m => (m.getAttribute(attr)||'').toLowerCase() === val.toLowerCase()) || null;
    const metaContent = (attr, val) => { const el = getMeta(attr, val); return el ? (el.getAttribute('content') || '') : ''; };

    // Title
    const title = document.title || '';
    info.title = title;
    if (!title) {
      issues.push({ type: 'missing-title', severity: 'error', desc: 'Page has no <title> tag', fix: 'Add a <title> element in <head> with a descriptive title (50-60 characters).' });
    } else if (title.length < 30) {
      issues.push({ type: 'short-title', severity: 'warn', desc: `Title is too short (${title.length} chars): "${title}"`, fix: 'Title should be 50-60 characters for optimal SEO.' });
    } else if (title.length > 60) {
      issues.push({ type: 'long-title', severity: 'warn', desc: `Title is too long (${title.length} chars): "${title.slice(0,60)}..."`, fix: 'Title should be 50-60 characters. It may be truncated in search results.' });
    }

    // Meta description
    const descContent = metaContent('name', 'description');
    info.description = descContent;
    if (!descContent) {
      issues.push({ type: 'missing-description', severity: 'error', desc: 'Missing meta description', fix: 'Add <meta name="description" content="..."> with 150-160 characters describing the page.' });
    } else if (descContent.length < 70) {
      issues.push({ type: 'short-description', severity: 'warn', desc: `Meta description is too short (${descContent.length} chars)`, fix: 'Meta description should be 150-160 characters for optimal search result display.' });
    } else if (descContent.length > 160) {
      issues.push({ type: 'long-description', severity: 'warn', desc: `Meta description is too long (${descContent.length} chars)`, fix: 'Meta description should be under 160 characters to avoid truncation in search results.' });
    }

    // Canonical URL
    const canonical = document.querySelector('link[rel="canonical"]');
    info.canonical = canonical ? canonical.href : '';
    if (!canonical) {
      issues.push({ type: 'missing-canonical', severity: 'warn', desc: 'Missing canonical URL', fix: 'Add <link rel="canonical" href="..."> to prevent duplicate content issues.' });
    }

    // Open Graph tags
    const ogTitleVal = metaContent('property', 'og:title');
    const ogDescVal = metaContent('property', 'og:description');
    const ogImageVal = metaContent('property', 'og:image');
    const ogUrlVal = metaContent('property', 'og:url');
    info.og = { title: ogTitleVal, description: ogDescVal, image: ogImageVal, url: ogUrlVal };
    if (!ogTitleVal) issues.push({ type: 'missing-og:title', severity: 'warn', desc: 'Missing og:title meta tag', fix: 'Add <meta property="og:title" content="..."> for social media sharing.' });
    if (!ogDescVal) issues.push({ type: 'missing-og:description', severity: 'info', desc: 'Missing og:description meta tag', fix: 'Add <meta property="og:description" content="..."> for social media sharing.' });
    if (!ogImageVal) issues.push({ type: 'missing-og:image', severity: 'warn', desc: 'Missing og:image meta tag', fix: 'Add <meta property="og:image" content="..."> with a 1200x630px image for social media sharing.' });

    // Twitter Card
    const twCardVal = metaContent('name', 'twitter:card');
    info.twitterCard = twCardVal;
    if (!twCardVal) issues.push({ type: 'missing-twitter:card', severity: 'info', desc: 'Missing twitter:card meta tag', fix: 'Add <meta name="twitter:card" content="summary_large_image"> for Twitter sharing.' });

    // Heading structure
    const headings = [];
    document.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(h => {
      if (own(h)) return;
      headings.push({ level: parseInt(h.tagName[1]), text: (h.textContent || '').trim().slice(0, 80), tag: h.tagName });
    });
    info.headings = headings;
    const h1s = headings.filter(h => h.level === 1);
    if (h1s.length === 0) {
      issues.push({ type: 'missing-h1', severity: 'error', desc: 'Page has no <h1> element', fix: 'Add a single <h1> element with the main page title.' });
    } else if (h1s.length > 1) {
      issues.push({ type: 'multiple-h1', severity: 'warn', desc: `Page has ${h1s.length} <h1> elements`, fix: 'Use only one <h1> per page for clear content hierarchy.' });
    }

    // Images without alt
    let imgNoAlt = 0;
    document.querySelectorAll('img').forEach(img => {
      if (own(img)) return;
      if (!img.hasAttribute('alt')) imgNoAlt++;
    });
    if (imgNoAlt > 0) {
      issues.push({ type: 'images-no-alt', severity: 'error', desc: `${imgNoAlt} image${imgNoAlt > 1 ? 's' : ''} missing alt attribute`, fix: 'Add descriptive alt text to all images for accessibility and image search.' });
    }

    // Robots meta
    const robotsVal = metaContent('name', 'robots');
    info.robots = robotsVal;
    if (robotsVal && (robotsVal.includes('noindex') || robotsVal.includes('nofollow'))) {
      issues.push({ type: 'robots-restricted', severity: 'info', desc: `Robots meta: "${robotsVal}"`, fix: 'This page has crawling restrictions. Ensure this is intentional.' });
    }

    // Viewport meta
    const viewportVal = metaContent('name', 'viewport');
    info.viewport = viewportVal;
    if (!viewportVal) {
      issues.push({ type: 'missing-viewport', severity: 'error', desc: 'Missing viewport meta tag', fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> for mobile responsiveness.' });
    }

    // Lang attribute
    const lang = document.documentElement.getAttribute('lang');
    info.lang = lang || '';
    if (!lang) {
      issues.push({ type: 'missing-lang', severity: 'warn', desc: 'Missing lang attribute on <html>', fix: 'Add lang="en" (or appropriate language) to the <html> element.' });
    }

    // Structured data / JSON-LD
    const jsonLd = document.querySelectorAll('script[type="application/ld+json"]');
    info.structuredData = jsonLd.length;
    if (jsonLd.length === 0) {
      issues.push({ type: 'no-structured-data', severity: 'info', desc: 'No structured data (JSON-LD) found', fix: 'Add JSON-LD structured data for rich search result snippets (e.g., Organization, Article, Product).' });
    }

    // Links analysis
    const links = { internal: 0, external: 0, nofollow: 0, broken: [] };
    document.querySelectorAll('a[href]').forEach(a => {
      if (own(a)) return;
      const href = a.getAttribute('href') || '';
      if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if (href.startsWith('http') && !href.includes(location.hostname)) {
        links.external++;
      } else {
        links.internal++;
      }
      if ((a.getAttribute('rel') || '').includes('nofollow')) links.nofollow++;
      if (!a.textContent.trim() && !a.querySelector('img[alt]') && !a.getAttribute('aria-label')) {
        links.broken.push({ href: href.slice(0, 60), issue: 'empty-anchor' });
      }
    });
    info.links = links;
    if (links.broken.length > 0) {
      issues.push({ type: 'empty-links', severity: 'warn', desc: `${links.broken.length} link${links.broken.length > 1 ? 's' : ''} with no anchor text`, fix: 'Add descriptive text to all links for accessibility and SEO.' });
    }

    // Score
    const weights = { error: 12, warn: 5, info: 1 };
    const deductions = issues.reduce((s, i) => s + (weights[i.severity] || 0), 0);
    const score = Math.max(0, 100 - deductions);

    return { issues, info, score };
  }

  /* ── Run full audit ─────────────────────────────────── */
  async function runAudit() {
    const shifts = await scanLayoutShifts();
    const culprits = scanCLSCulprits();
    const images = scanImages();
    const { unused, totalRules, skippedSheets } = scanUnusedCSS();
    const a11y = scanAccessibility();
    const spacing = scanSpacing();
    const totalCLS = shifts.reduce((s, e) => s + e.score, 0);
    auditData = { layoutShifts: shifts, clsCulprits: culprits, totalCLS,
      images, imageIssueCount: images.filter(i => i.issues.length > 0).length,
      unusedCSS: unused, unusedCSSCount: unused.length, totalRulesScanned: totalRules, skippedSheets,
      a11y, spacing };
  }

  /* ── Render (Shadow DOM) ─────────────────────────────── */
  function loadCSS() {
    if (cssText) return Promise.resolve(cssText);
    const url = chrome.runtime.getURL('content.css');
    return fetch(url).then(r => r.text()).then(t => { cssText = t; return t; });
  }

  function render() {
    if (!data) data = scan();

    let host = document.getElementById(ROOT);
    const isNew = !host;
    if (isNew) {
      host = document.createElement('div');
      host.id = ROOT;
      // Default position: top-right with some margin
      const x = panelPos.x ?? (window.innerWidth - 380 - 16);
      const y = panelPos.y ?? 16;
      host.style.cssText = `position:fixed;top:${y}px;left:${x}px;width:380px;height:620px;z-index:2147483647;`;
      document.body.appendChild(host);
      shadow = host.attachShadow({ mode: 'open' });
    }
    if (!shadow) shadow = host.shadowRoot;

    let h = '';
    h += topbar();
    h += '<div class="uii-content">';
    if (markupActive) {
      h += tabMarkup();
    } else if (tab==='overview') h += tabOverview();
    else if (tab==='colors') h += tabColors();
    else if (tab==='typography') h += tabTypo();
    else if (tab==='assets') h += tabAssets();
    else if (tab==='audit') h += tabAudit();
    else if (tab==='layout') h += tabLayout();
    else if (tab==='seo') h += tabSEO();
    else if (tab==='inspector') h += tabInspEmpty();
    else if (tab==='inspector-detail') h += tabInspDetail();
    h += '</div>';
    if (!markupActive) h += tabbar();

    loadCSS().then(css => {
      const scrollEl = shadow.querySelector('.uii-content');
      const scrollTop = scrollEl ? scrollEl.scrollTop : 0;
      shadow.innerHTML = `<style>${css}</style>${h}`;
      bind(shadow);
      setupDrag(shadow, host);
      const newScrollEl = shadow.querySelector('.uii-content');
      if (newScrollEl) newScrollEl.scrollTop = scrollTop;
    });
  }

  /* ── Drag ────────────────────────────────────────────── */
  function setupDrag(shadow, host) {
    const bar = shadow.querySelector('.uii-topbar');
    if (!bar) return;
    let dragging = false, startX, startY, origX, origY;

    bar.addEventListener('mousedown', e => {
      // Don't drag if clicking a button or toggle
      if (e.target.closest('button') || e.target.closest('.uii-toggle')) return;
      dragging = true;
      startX = e.clientX; startY = e.clientY;
      const rect = host.getBoundingClientRect();
      origX = rect.left; origY = rect.top;
      e.preventDefault();
    });

    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      const nx = Math.max(0, Math.min(window.innerWidth - 100, origX + dx));
      const ny = Math.max(0, Math.min(window.innerHeight - 50, origY + dy));
      host.style.left = nx + 'px';
      host.style.top = ny + 'px';
      host.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => {
      if (dragging) {
        dragging = false;
        const rect = host.getBoundingClientRect();
        panelPos.x = rect.left; panelPos.y = rect.top;
      }
    });
  }

  function topbar() {
    const label = markupActive ? 'Markup Mode' : 'Inspect Mode';
    const btnRight = markupActive
      ? `<button class="uii-icon-btn uii-markup-btn uii-markup-btn--on" data-act="exit-markup" title="Exit markup">${IC.markup}</button>`
      : `<button class="uii-icon-btn uii-markup-btn" data-act="markup" title="Markup mode">${IC.markup}</button>`;
    return `<div class="uii-topbar"><div class="uii-topbar-left"><div class="uii-drag-dots">${'<span></span>'.repeat(6)}</div><div class="uii-toggle"></div><span class="uii-topbar-label">${label}</span></div><div class="uii-topbar-right">${btnRight}<button class="uii-icon-btn">${IC.menu}</button><button class="uii-icon-btn" data-act="close">${IC.close}</button></div></div>`;
  }

  function tabbar() {
    const t = (id,icon,label) => `<button class="uii-tab ${(tab===id||(tab==='inspector-detail'&&id==='inspector'))?'uii-tab--on':''}" data-tab="${id}">${icon}<span class="uii-tab-lbl">${label}</span></button>`;
    return `<div class="uii-tabbar">${t('overview',IC.grid,'Overview')}${t('colors',IC.drop,'Colors')}${t('typography',IC.type,'Type')}${t('assets',IC.image,'Assets')}${t('audit',IC.audit,'Audit')}${t('layout',IC.layout,'Layout')}${t('seo',IC.seo,'SEO')}${t('inspector',IC.target,'Inspect')}</div>`;
  }

  /* ── Markup Mode View ────────────────────────────────── */
  const MK_TOOL_LABELS = { pencil:'Pencil', rect:'Rectangle', ellipse:'Ellipse', arrow:'Arrow', text:'Text' };
  const MK_TOOL_ICONS = () => ({ pencil:IC.pencil, rect:IC.rect, ellipse:IC.ellipse, arrow:IC.arrow, text:IC.textIcon });
  function fmtTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
    return sameDay ? time : d.toLocaleDateString() + ' ' + time;
  }
  function tabMarkup() {
    const icons = MK_TOOL_ICONS();
    let h = '';
    // Hero / status
    h += `<div class="uii-mk-hero">`;
    h += `<div class="uii-mk-hero-title">Annotate this page</div>`;
    h += `<div class="uii-mk-hero-sub">Draw, label, and capture findings without leaving the tab.</div>`;
    h += `<div class="uii-mk-status">`;
    h += `<div class="uii-mk-status-item"><div class="uii-mk-status-lbl">Tool</div><div class="uii-mk-status-val"><span class="uii-mk-status-icon">${icons[markupTool] || ''}</span>${MK_TOOL_LABELS[markupTool] || markupTool}</div></div>`;
    h += `<div class="uii-mk-status-item"><div class="uii-mk-status-lbl">Color</div><div class="uii-mk-status-val"><span class="uii-mk-status-sw" style="background:${markupColor}${markupColor==='#FFFFFF'?';border:1px solid rgba(0,0,0,.15)':''}"></span>${markupColor}</div></div>`;
    if (markupTool === 'text') {
      h += `<div class="uii-mk-status-item"><div class="uii-mk-status-lbl">Font size</div><div class="uii-mk-status-val">${markupFontSize}px</div></div>`;
    } else {
      h += `<div class="uii-mk-status-item"><div class="uii-mk-status-lbl">Stroke</div><div class="uii-mk-status-val">${markupStrokeWidth}px</div></div>`;
    }
    h += `</div>`;
    h += `<div class="uii-mk-hero-actions"><button class="uii-btn-outline uii-btn-accent" data-act="mk-capture">Capture Screenshot</button><button class="uii-btn-outline" data-act="mk-clear-canvas">Clear Drawing</button></div>`;
    h += `</div>`;

    // Captures gallery
    h += `<div class="uii-section"><div class="uii-sec-hdr"><span class="uii-sec-title">Captures <span class="uii-count">${markupCaptures.length}</span></span>`;
    if (markupCaptures.length) h += `<button class="uii-btn-outline uii-btn-sm" data-act="mk-clear-captures">Clear All</button>`;
    h += `</div><div class="uii-sec-body">`;
    if (!markupCaptures.length) {
      h += `<div class="uii-mk-empty">No captures yet. Annotate the page and click the camera icon in the toolbar to save a screenshot.</div>`;
    } else {
      markupCaptures.forEach(c => {
        h += `<div class="uii-mk-cap" data-cap-id="${c.id}">`;
        h += `<div class="uii-mk-cap-thumb" data-act="mk-preview" data-cap-id="${c.id}"><img src="${c.dataUrl}" loading="lazy"></div>`;
        h += `<div class="uii-mk-cap-info">`;
        h += `<div class="uii-mk-cap-time">${fmtTime(c.timestamp)}</div>`;
        h += `<div class="uii-mk-cap-actions">`;
        h += `<button class="uii-mk-cap-btn" data-act="mk-cap-copy" data-cap-id="${c.id}" title="Copy to clipboard">${IC.copy}</button>`;
        h += `<button class="uii-mk-cap-btn" data-act="mk-cap-download" data-cap-id="${c.id}" title="Download">${IC.dl}</button>`;
        h += `<button class="uii-mk-cap-btn" data-act="mk-cap-delete" data-cap-id="${c.id}" title="Delete">${IC.trash}</button>`;
        h += `</div></div></div>`;
      });
    }
    h += `</div></div>`;

    h += `<div class="uii-mk-foot"><button class="uii-empty-btn" data-act="exit-markup">Exit Markup Mode</button></div>`;
    return h;
  }

  async function copyCapture(id) {
    const c = markupCaptures.find(x => x.id === id);
    if (!c) return;
    try {
      const blob = await (await fetch(c.dataUrl)).blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      toast('Copied to clipboard');
    } catch (e) { toast('Copy failed'); }
  }

  function downloadCapture(id) {
    const c = markupCaptures.find(x => x.id === id);
    if (!c) return;
    const a = document.createElement('a');
    a.href = c.dataUrl;
    a.download = `markup-${new Date(c.timestamp).toISOString().replace(/[:.]/g,'-')}.png`;
    document.body.appendChild(a); a.click(); a.remove();
  }

  function previewCapture(id) {
    const c = markupCaptures.find(x => x.id === id);
    if (!c) return;
    const w = window.open('', '_blank');
    if (w) w.document.write(`<title>Capture</title><body style="margin:0;background:#1a1a2e;display:flex;align-items:center;justify-content:center;min-height:100vh"><img src="${c.dataUrl}" style="max-width:100%;max-height:100vh"></body>`);
  }

  /* ── Overview ────────────────────────────────────────── */
  function tabOverview() {
    let h = `<div class="uii-page-info"><div class="uii-page-name">${esc(document.title||'Untitled')}</div><div class="uii-page-url">${esc(location.href)}</div></div>`;
    // Typography
    const fams = sorted(data.fontFamilies,5);
    if (fams.length) {
      h += '<div class="uii-section"><div class="uii-sec-hdr"><span class="uii-sec-title">Typography</span></div><div class="uii-sec-body">';
      const heading = fams[0], body = fams.length>1?fams[1]:fams[0];
      h += `<div class="uii-font-card"><div class="uii-fc-label">Headings</div><div class="uii-fc-name" style="font-family:'${esc(heading[0])}',sans-serif">${esc(heading[0])}</div></div>`;
      h += `<div class="uii-font-card"><div class="uii-fc-label">Body</div><div class="uii-fc-name" style="font-family:'${esc(body[0])}',sans-serif">${esc(body[0])}</div></div>`;
      h += '</div></div>';
    }
    // Palette
    const cols = sorted(data.colors,12);
    if (cols.length) {
      h += `<div class="uii-section"><div class="uii-sec-hdr"><span class="uii-sec-title">Color Palette</span><div class="uii-hl-toggle" data-act="toggle-color-highlight" title="Highlight elements on hover"><div class="uii-mini-sw ${colorHighlightMode?'uii-mini-sw--on':''}"></div><span class="uii-hl-toggle-label">Highlight</span></div></div><div class="uii-sec-body"><div class="uii-palette-row">`;
      cols.slice(0,10).forEach(([c])=>{ h += `<div class="uii-palette-dot" style="background:${c}" title="${up(c)}" data-color="${c}"></div>`; });
      if (data.colors.size>10) h += '<button class="uii-show-all" data-tab="colors">Show all</button>';
      h += '</div></div></div>';
    }
    // Contrast scanner
    const textColors = [], bgColors = [];
    document.querySelectorAll('*').forEach(el => {
      if(own(el)||!vis(el)) return;
      const cs = getComputedStyle(el);
      const tc = hex(cs.color), bc = hex(cs.backgroundColor);
      if (tc.startsWith('#') && bc.startsWith('#') && bc !== hex('rgba(0,0,0,0)')) {
        const r = contrastRatio(tc, bc);
        if (parseFloat(r) < 10 && parseFloat(r) > 1) textColors.push({fg:tc, bg:bc, ratio:r});
      }
    });
    const unique = [...new Map(textColors.map(c=>[c.fg+c.bg,c])).values()].sort((a,b)=>a.ratio-b.ratio).slice(0,4);
    if (unique.length) {
      const poorItems = unique.filter(c => parseFloat(c.ratio) < 4.5);
      const contrastPrompt = poorItems.length ? poorItems.map(c => {
        const sg = suggestColor(c.fg, c.bg);
        return `- Text ${up(c.fg)} on background ${up(c.bg)} has contrast ratio ${c.ratio}:1 (WCAG AA requires 4.5:1). Suggested fix: change text color to ${up(sg)}.`;
      }).join('\n') : '';
      const promptText = `Fix the following WCAG contrast issues on this page:\n\n${contrastPrompt}\n\nPlease update the CSS so all text meets WCAG AA (4.5:1 minimum contrast ratio). Keep the color palette as close to the original as possible while achieving compliance.`;
      const promptBtnHtml = poorItems.length ? `<button class="uii-btn-outline uii-copy-prompt-btn" data-prompt="${esc(promptText).replace(/"/g,'&quot;')}">Copy Prompt</button>` : '';
      h += `<div class="uii-section"><div class="uii-sec-hdr"><span class="uii-sec-title">Contrast Scanner <span class="uii-count">${unique.length}</span></span>${promptBtnHtml}</div><div class="uii-sec-body">`;
      unique.forEach(c => {
        const ok = parseFloat(c.ratio) >= 4.5;
        h += `<div class="uii-contrast-card"><div class="uii-contrast-icon">Aa</div><span class="uii-contrast-ratio">${c.ratio} : 1</span><span class="uii-contrast-badge ${ok?'uii-contrast-badge--good':'uii-contrast-badge--poor'}">${ok?'AA Pass':'Poor'}</span></div>`;
      });
      h += '</div></div>';
    }
    // Stats
    h += '<div class="uii-section"><div class="uii-sec-hdr"><span class="uii-sec-title">Page Stats</span></div><div class="uii-sec-body"><div class="uii-stats-grid">';
    [['Colors',data.colors.size],['Font Styles',data.fontStyles.length],['Assets',data.assets.length],['Classes',data.classes.size]].forEach(([l,v])=>{
      h += `<div class="uii-stat-card"><div class="uii-stat-label">${l}</div><div class="uii-stat-val">${v}</div></div>`;
    });
    h += '</div></div></div>';
    return h;
  }

  /* ── Colors ──────────────────────────────────────────── */
  function tabColors() {
    let h = `<div class="uii-color-hdr"><span class="uii-sec-title">Colors <span class="uii-count">${data.colors.size}</span></span><div style="display:flex;gap:8px;align-items:center"><button class="uii-btn-outline" data-act="reset-colors">Reset All</button><button class="uii-btn-outline" data-act="export-colors">Export</button></div></div><div class="uii-color-hl-row"><div class="uii-hl-toggle" data-act="toggle-color-highlight" title="Highlight elements on hover"><div class="uii-mini-sw ${colorHighlightMode?'uii-mini-sw--on':''}"></div><span class="uii-hl-toggle-label">Highlight elements on hover</span></div></div>`;
    h += `<div class="uii-pills"><button class="uii-pill ${colorView==='palette'?'uii-pill--on':''}" data-cview="palette">Palette</button><button class="uii-pill ${colorView==='categories'?'uii-pill--on':''}" data-cview="categories">Categories</button></div>`;

    if (colorView === 'palette') {
      h += renderColorBands(sorted(data.colors, 100));
    } else {
      const cats = [
        { key: 'text', label: 'Text colors', map: data.colorsByCategory.text },
        { key: 'background', label: 'Background colors', map: data.colorsByCategory.background },
        { key: 'border', label: 'Border colors', map: data.colorsByCategory.border },
      ];
      cats.forEach(({ label, map }) => {
        if (!map.size) return;
        h += `<div class="uii-cat-hdr"><span class="uii-cat-label">${label}:</span><span class="uii-count">${map.size}</span></div>`;
        h += renderColorBands(sorted(map, 50));
      });
    }
    return h;
  }

  function renderColorBands(colors) {
    let h = '';
    colors.forEach(([c, n]) => {
      const swapped = colorSwaps.has(c);
      const currentColor = swapped ? colorSwaps.get(c).newHex : c;
      const currentTc = contrast(currentColor);
      const hasAlpha = currentColor.length === 9;
      const alphaVal = hasAlpha ? parseFloat((parseInt(currentColor.slice(7,9),16)/255).toFixed(2)) : 1;
      const alphaTag = hasAlpha ? ` <span class="uii-cb-alpha">${alphaVal}</span>` : '';
      const alphaHex = hasAlpha ? currentColor.slice(7,9) : 'ff';
      const alphaInt = parseInt(alphaHex,16);
      const isOff = colorDisabled.has(c);
      const bandBgStyle = isOff
        ? 'background:transparent;border:1px dashed rgba(150,150,150,.3)'
        : hasAlpha
          ? `background:linear-gradient(${hexToCSS(currentColor)},${hexToCSS(currentColor)}),repeating-conic-gradient(rgba(255,255,255,.12) 0% 25%,rgba(0,0,0,.12) 0% 50%) 0 0/12px 12px`
          : `background:${currentColor}`;
      h += `<div class="uii-color-band-wrap${isOff ? ' uii-cb-disabled' : ''}">
        <div class="uii-color-band" style="${bandBgStyle};color:${isOff ? '#888' : currentTc}" data-color="${c}">
          <div class="uii-cb-top">
            <span class="uii-cb-hex"${isOff ? ' style="text-decoration:line-through;opacity:.5"' : ''}>${up(currentColor)}${alphaTag}${swapped ? ` <span class="uii-cb-orig">(was ${up(c)})</span>` : ''}</span>
            <div class="uii-cb-controls">
              <div class="uii-cb-toggle" data-toggle-color="${c}" title="${isOff ? 'Show' : 'Hide'} this color on page">
                <div class="uii-mini-sw ${isOff ? '' : 'uii-mini-sw--on'}"></div>
              </div>
              <label class="uii-color-trigger" title="Change color">
                <input type="color" class="uii-color-input" value="${hex6(currentColor)}" data-orig="${c}">
              </label>
              <input type="range" class="uii-alpha-slider" min="0" max="255" value="${alphaInt}" data-orig="${c}" title="Alpha: ${alphaVal}">
            </div>
          </div>
          <span class="uii-cb-count">${n} instance${n !== 1 ? 's' : ''}</span>
        </div>
        ${swapped ? `<button class="uii-cb-reset" data-reset="${c}">Reset to ${up(c)}</button>` : ''}
      </div>`;
    });
    return h;
  }

  /* ── Live Color Swap ─────────────────────────────────── */
  const hexToCSS = h => { if(!h.startsWith('#')) return h; const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16); if(h.length===9){ const a=parseInt(h.slice(7,9),16)/255; return `rgba(${r},${g},${b},${a.toFixed(3)})`; } return h; };
  function swapColor(oldHex, newHex) {
    // Revert previous swap for this color first
    revertColor(oldHex);
    if (oldHex === newHex) return;

    const cssVal = hexToCSS(newHex);
    const originals = [];
    const props = ['color','backgroundColor','borderColor','outlineColor'];
    document.querySelectorAll('*').forEach(el => {
      if (own(el)) return;
      const cs = getComputedStyle(el);
      props.forEach(prop => {
        const val = cs[prop];
        if (!val || val === 'rgba(0, 0, 0, 0)' || val === 'transparent') return;
        if (hex6(hex(val)).toLowerCase() === hex6(oldHex).toLowerCase()) {
          const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
          const orig = el.style.getPropertyValue(cssProp);
          originals.push({ el, cssProp, orig });
          el.style.setProperty(cssProp, cssVal, 'important');
        }
      });
    });
    colorSwaps.set(oldHex, { newHex, originals });
  }

  function revertColor(oldHex) {
    const swap = colorSwaps.get(oldHex);
    if (!swap) return;
    swap.originals.forEach(({ el, cssProp, orig }) => {
      if (orig) el.style.setProperty(cssProp, orig);
      else el.style.removeProperty(cssProp);
    });
    colorSwaps.delete(oldHex);
  }

  function revertAllColors() {
    for (const key of [...colorSwaps.keys()]) revertColor(key);
    for (const key of [...colorDisabled.keys()]) showColor(key);
  }

  /* ── Color On/Off Toggle ───────────────────────────────── */
  function hideColor(targetHex) {
    if (colorDisabled.has(targetHex)) return;
    const target6 = hex6(targetHex).toLowerCase();
    const originals = [];
    const props = ['color','backgroundColor','borderColor','outlineColor','boxShadow'];
    document.querySelectorAll('*').forEach(el => {
      if (own(el)) return;
      const cs = getComputedStyle(el);
      props.forEach(prop => {
        const val = cs[prop];
        if (!val || val === 'rgba(0, 0, 0, 0)' || val === 'transparent' || val === 'none') return;
        const matched = prop === 'boxShadow' ? hex6(hex(val)).toLowerCase() === target6 : hex6(hex(val)).toLowerCase() === target6;
        if (matched) {
          const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
          const orig = el.style.getPropertyValue(cssProp);
          originals.push({ el, cssProp, orig });
          el.style.setProperty(cssProp, 'transparent', 'important');
        }
      });
    });
    colorDisabled.set(targetHex, originals);
  }

  function showColor(targetHex) {
    const entries = colorDisabled.get(targetHex);
    if (!entries) return;
    entries.forEach(({ el, cssProp, orig }) => {
      if (orig) el.style.setProperty(cssProp, orig);
      else el.style.removeProperty(cssProp);
    });
    colorDisabled.delete(targetHex);
  }

  function toggleColor(targetHex) {
    if (colorDisabled.has(targetHex)) showColor(targetHex);
    else hideColor(targetHex);
  }

  /* ── Color Highlight on Hover ───────────────────────────── */
  function highlightColorOnPage(targetHex) {
    clearColorHighlights();
    const target6 = hex6(targetHex).toLowerCase();
    const props = ['color', 'backgroundColor', 'borderColor'];
    document.querySelectorAll('*').forEach(el => {
      if (own(el) || !vis(el)) return;
      const cs = getComputedStyle(el);
      const matchedProps = [];
      props.forEach(p => {
        const v = cs[p];
        if (!v || v === 'rgba(0, 0, 0, 0)' || v === 'transparent') return;
        if (hex6(hex(v)).toLowerCase() === target6) matchedProps.push(p);
      });
      if (!matchedProps.length) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const d = document.createElement('div');
      d.className = 'uii-color-highlight';
      d.style.cssText = `position:absolute;top:${r.top+window.scrollY}px;left:${r.left+window.scrollX}px;width:${r.width}px;height:${r.height}px;border:2px solid ${targetHex};background:${targetHex}20;z-index:2147483645;pointer-events:none;border-radius:3px;`;
      document.body.appendChild(d);
    });
  }

  function clearColorHighlights() {
    document.querySelectorAll('.uii-color-highlight').forEach(e => e.remove());
  }

  /* ── Typography ──────────────────────────────────────── */
  function tabTypo() {
    let h = `<div class="uii-sec-hdr"><span class="uii-sec-title">Typography <span class="uii-count">${data.fontStyles.length}</span></span></div>`;
    const byFam = new Map();
    data.fontStyles.forEach(s=>{ if(!byFam.has(s.family)) byFam.set(s.family,[]); byFam.get(s.family).push(s); });
    byFam.forEach((styles,fam) => {
      styles.slice(0,4).forEach(s => {
        const sz = Math.min(Math.max(parseInt(s.size),16),36);
        h += `<div class="uii-typo-card"><div class="uii-tc-title">${esc(fam)} &mdash; ${s.size} / ${wname(s.weight)}</div><div class="uii-tc-sub">${s.count} instances</div><div class="uii-tc-preview" style="font-family:'${esc(fam)}',sans-serif;font-size:${sz}px;font-weight:${s.weight}">AaBbCcDdEeFfGgHhIiJjK</div><button class="uii-tc-link">Show ${s.count} occurrences &rsaquo;</button></div>`;
      });
    });
    return h;
  }

  /* ── Assets ──────────────────────────────────────────── */
  function tabAssets() {
    let h = `<div class="uii-assets-hdr"><span class="uii-sec-title">Assets <span class="uii-count">${data.assets.length}</span></span><div style="display:flex;gap:6px;align-items:center"><button class="uii-btn-outline" data-act="export-assets">Export All</button><div class="uii-view-toggle"><button class="uii-view-btn ${assetView==='grid'?'uii-view-btn--on':''}" data-view="grid">${IC.gridv}</button><button class="uii-view-btn ${assetView==='list'?'uii-view-btn--on':''}" data-view="list">${IC.listv}</button></div></div></div>`;
    if (!data.assets.length) return h + '<div class="uii-empty"><p>No images or SVGs found.</p></div>';
    if (assetView==='grid') {
      h += '<div class="uii-assets-grid">';
      data.assets.forEach((a,i)=>{ h += `<div class="uii-ag-card" data-ai="${i}"><img src="${esc(a.src)}" loading="lazy"></div>`; });
      h += '</div>';
    } else {
      h += '<div class="uii-assets-list">';
      data.assets.forEach((a,i)=>{
        h += `<div class="uii-al-row"><div class="uii-al-thumb"><img src="${esc(a.src)}" loading="lazy"></div><div class="uii-al-info"><div class="uii-al-name">${esc(a.name)}</div>${a.size?`<div class="uii-al-size">${fmtSize(a.size)}</div>`:''}</div><button class="uii-al-dl" data-dl="${i}">${IC.dl}</button></div>`;
      });
      h += '</div>';
    }
    return h;
  }

  /* ── Audit Tab ───────────────────────────────────────── */
  /* ── Audit prompt builders ────────────────────────────── */
  function buildCLSPrompt(a) {
    if (!a.clsCulprits.length) return '';
    let p = `Fix the following Layout Shift (CLS) issues on this page (current CLS score: ${a.totalCLS.toFixed(3)}):\n\n`;
    a.clsCulprits.forEach((c, i) => { p += `${i+1}. [${c.issue}] ${c.fix}\n`; });
    p += `\nPlease update the HTML/CSS to eliminate layout shifts. Add explicit dimensions to images and use font-display: swap for web fonts.`;
    return p;
  }
  function buildImagePrompt(a) {
    const issues = a.images.filter(i => i.issues.length > 0);
    if (!issues.length) return '';
    let p = `Fix the following image performance issues on this page:\n\n`;
    issues.forEach((img, i) => {
      p += `${i+1}. ${img.name} (${img.format.toUpperCase()})\n`;
      if (img.oversized) p += `   - Oversized: natural ${img.naturalW}x${img.naturalH}, rendered at ${img.renderedW}x${img.renderedH} (~${img.savingsPercent}% pixels wasted). Resize the source image or use responsive srcset.\n`;
      if (img.missingLazy) p += `   - Missing lazy loading: this image is below the fold. Add loading="lazy".\n`;
      if (img.missingAlt) p += `   - Missing alt attribute: add descriptive alt text for accessibility.\n`;
      if (img.suggestWebP) p += `   - Format: convert from ${img.format.toUpperCase()} to WebP/AVIF for smaller file size.\n`;
    });
    p += `\nPlease update the codebase to fix these image issues for better performance and accessibility.`;
    return p;
  }
  function buildCSSPrompt(a) {
    if (!a.unusedCSSCount) return '';
    let p = `Remove the following ${a.unusedCSSCount} unused CSS rules to reduce stylesheet size (out of ${a.totalRulesScanned} total rules scanned):\n\n`;
    a.unusedCSS.slice(0, 80).forEach(r => { p += `- [${r.sheet}] ${r.selector}\n`; });
    if (a.unusedCSSCount > 80) p += `... and ${a.unusedCSSCount - 80} more unused rules.\n`;
    p += `\nPlease remove or clean up these selectors from the stylesheets. Verify each before removing in case they are used dynamically.`;
    return p;
  }
  function buildA11yPrompt(a) {
    if (!a.a11y || !a.a11y.issues.length) return '';
    const byType = { error: [], warn: [], info: [] };
    a.a11y.issues.forEach(i => (byType[i.severity] || byType.info).push(i));
    let p = `Fix the following accessibility issues on this page (score: ${a.a11y.score}/100):\n\n`;
    if (byType.error.length) { p += `ERRORS (critical):\n`; byType.error.forEach((i, n) => { p += `${n+1}. ${i.desc}\n   Fix: ${i.fix}\n`; }); p += '\n'; }
    if (byType.warn.length) { p += `WARNINGS:\n`; byType.warn.forEach((i, n) => { p += `${n+1}. ${i.desc}\n   Fix: ${i.fix}\n`; }); p += '\n'; }
    if (byType.info.length) { p += `INFO:\n`; byType.info.forEach((i, n) => { p += `${n+1}. ${i.desc}\n   Fix: ${i.fix}\n`; }); p += '\n'; }
    p += `Please update the HTML to fix all accessibility issues. Prioritize errors first, then warnings.`;
    return p;
  }
  function buildSpacingPrompt(a) {
    if (!a.spacing || !a.spacing.issues.length) return '';
    const items = a.spacing.issues.slice(0, 60);
    let p = `Fix the following spacing inconsistencies (values not on a ${a.spacing.grid}px grid):\n\n`;
    items.forEach((s, i) => {
      p += `${i+1}. ${s.prop}: ${s.value} on <${s.selector}> (${s.count} instance${s.count>1?'s':''})\n   Suggested: ${s.nearest}\n`;
    });
    if (a.spacing.issues.length > 60) p += `... and ${a.spacing.issues.length - 60} more.\n`;
    p += `\nPlease update the CSS to align all spacing values to a ${a.spacing.grid}px grid for visual consistency.`;
    return p;
  }
  function buildFullAuditPrompt(a) {
    const parts = [];
    const cls = buildCLSPrompt(a); if (cls) parts.push(cls);
    const img = buildImagePrompt(a); if (img) parts.push(img);
    const css = buildCSSPrompt(a); if (css) parts.push(css);
    const a11y = buildA11yPrompt(a); if (a11y) parts.push(a11y);
    const sp = buildSpacingPrompt(a); if (sp) parts.push(sp);
    if (!parts.length) return 'No issues found in the audit.';
    return `Page audit results for: ${location.href}\n\n` + parts.join('\n\n---\n\n') + `\n\nFix all the above issues to improve page performance, accessibility, and code quality.`;
  }

  /* ── Design Token Export ────────────────────────────── */
  function getTokenData() {
    if (!data) data = scan();
    const colors = sorted(data.colors, 200).map(([c]) => c);
    const fonts = sorted(data.fontFamilies, 20).map(([f]) => f);
    const sizes = sorted(data.fontSizes, 30).map(([s]) => s);
    const radii = sorted(data.borderRadii, 20).map(([r]) => r);
    const shadows = sorted(data.shadows, 10).map(([s]) => s);
    const spacing = [...new Set(sorted(data.spacing, 50).map(([s]) => {
      const m = s.match(/:\s*(.+)/); return m ? m[1].trim() : s;
    }))].slice(0, 20);
    return { colors, fonts, sizes, radii, shadows, spacing };
  }

  function exportTokensCSS() {
    const t = getTokenData();
    let css = '/* Design Tokens — extracted by UI Inspector */\n:root {\n';
    t.colors.forEach((c, i) => { css += `  --color-${i + 1}: ${c};\n`; });
    css += '\n';
    t.fonts.forEach((f, i) => { css += `  --font-${i + 1}: '${f}';\n`; });
    css += '\n';
    t.sizes.forEach((s, i) => { css += `  --font-size-${i + 1}: ${s};\n`; });
    css += '\n';
    t.radii.forEach((r, i) => { css += `  --radius-${i + 1}: ${r};\n`; });
    if (t.shadows.length) { css += '\n'; t.shadows.forEach((s, i) => { css += `  --shadow-${i + 1}: ${s};\n`; }); }
    if (t.spacing.length) { css += '\n'; t.spacing.forEach((s, i) => { css += `  --spacing-${i + 1}: ${s};\n`; }); }
    css += '}\n';
    return css;
  }

  function exportTokensTailwind() {
    const t = getTokenData();
    const obj = { theme: { extend: { colors: {}, fontFamily: {}, fontSize: {}, borderRadius: {}, boxShadow: {} } } };
    const ext = obj.theme.extend;
    t.colors.forEach((c, i) => { ext.colors[`brand-${i + 1}`] = c; });
    t.fonts.forEach((f, i) => { ext.fontFamily[f.toLowerCase().replace(/\s+/g, '-')] = [`'${f}'`, 'sans-serif']; });
    t.sizes.forEach((s, i) => { ext.fontSize[`custom-${i + 1}`] = s; });
    t.radii.forEach((r, i) => { ext.borderRadius[`custom-${i + 1}`] = r; });
    t.shadows.forEach((s, i) => { ext.boxShadow[`custom-${i + 1}`] = s; });
    return `// tailwind.config.js — extracted by UI Inspector\nmodule.exports = ${JSON.stringify(obj, null, 2)}\n`;
  }

  function exportTokensJSON() {
    const t = getTokenData();
    return JSON.stringify({ source: location.href, extractedAt: new Date().toISOString(), tokens: t }, null, 2);
  }

  /* ── Tech Stack Detection ──────────────────────────── */
  function detectTechStack() {
    const stack = [];
    // MUI / Material UI
    if (document.querySelector('[class*="Mui"], [class*="css-"][class*="Mui"], .MuiBox-root, .MuiButton-root') || document.querySelector('style[data-emotion]'))
      stack.push('mui');
    // Tailwind
    if (document.querySelector('[class*="tw-"], [class*="bg-"], [class*="text-"]') && document.querySelector('style')?.textContent?.includes('--tw-'))
      stack.push('tailwind');
    // Bootstrap
    if (document.querySelector('.container, .row, .col, .btn') && (document.querySelector('link[href*="bootstrap"]') || document.querySelector('style')?.textContent?.includes('--bs-')))
      stack.push('bootstrap');
    // Chakra UI
    if (document.querySelector('[class*="chakra-"]') || document.querySelector('style[data-emotion="css"]')?.textContent?.includes('chakra'))
      stack.push('chakra');
    // Ant Design
    if (document.querySelector('.ant-btn, .ant-table, [class*="ant-"]'))
      stack.push('antd');
    return stack;
  }

  function hexToRgb(h) {
    const c = hex6(h).replace('#','');
    return { r: parseInt(c.slice(0,2),16), g: parseInt(c.slice(2,4),16), b: parseInt(c.slice(4,6),16) };
  }

  function hexAlphaToFloat(h) {
    if (h.length !== 9) return 1;
    return parseFloat((parseInt(h.slice(7,9),16)/255).toFixed(2));
  }

  function buildMuiPalette(colors) {
    // Group colors by base hex (strip alpha) and sort by usage
    const baseMap = new Map();
    colors.forEach(([c, n]) => {
      const base = hex6(c);
      const alpha = c.length === 9 ? hexAlphaToFloat(c) : 1;
      if (!baseMap.has(base)) baseMap.set(base, { count: 0, alphas: [] });
      const entry = baseMap.get(base);
      entry.count += n;
      if (alpha < 1) entry.alphas.push({ alpha, hex: c, count: n });
    });

    // Build palette structure
    const palette = { primary: {}, secondary: {}, background: {}, text: {}, grey: {}, divider: '', action: {} };
    const catColors = data ? data.colorsByCategory : null;
    const textColors = catColors ? sorted(catColors.text, 10) : [];
    const bgColors = catColors ? sorted(catColors.background, 10) : [];

    // Detect primary (most used non-grey, non-white, non-black color)
    const isNeutral = h => { const {r,g,b} = hexToRgb(h); return Math.abs(r-g)<20 && Math.abs(g-b)<20; };
    const chromatic = [...baseMap.entries()].filter(([h]) => !isNeutral(h) && h.length <= 7).sort((a,b) => b[1].count - a[1].count);
    if (chromatic[0]) palette.primary.main = chromatic[0][0];
    if (chromatic[1]) palette.secondary.main = chromatic[1][0];

    // Background colors
    if (bgColors.length) {
      palette.background.default = hex6(bgColors[0][0]);
      if (bgColors[1]) palette.background.paper = hex6(bgColors[1][0]);
    }

    // Text colors
    if (textColors.length) {
      palette.text.primary = hex6(textColors[0][0]);
      if (textColors[1]) palette.text.secondary = hex6(textColors[1][0]);
      const disabled = textColors.find(([c]) => c.length === 9 && hexAlphaToFloat(c) < 0.6);
      if (disabled) palette.text.disabled = hex6(disabled[0]);
    }

    // Grey scale — find neutrals
    const greys = [...baseMap.entries()].filter(([h]) => isNeutral(h)).sort((a,b) => {
      const la = lum(a[0]), lb = lum(b[0]); return lb - la;
    }).map(([h]) => h);
    const greySteps = ['50','100','200','300','400','500','600','700','800','900'];
    greys.slice(0, 10).forEach((g, i) => { if (i < greySteps.length) palette.grey[greySteps[i]] = g; });

    // Divider — look for low-alpha grey
    const dividerCand = colors.find(([c]) => c.length === 9 && isNeutral(hex6(c)) && hexAlphaToFloat(c) < 0.3 && hexAlphaToFloat(c) > 0.05);
    if (dividerCand) {
      const a = hexAlphaToFloat(dividerCand[0]);
      palette.divider = `alpha('${hex6(dividerCand[0])}', ${a})`;
    }

    // Action — hover/selected from alpha colors
    const actionAlphas = colors.filter(([c]) => c.length === 9).sort((a,b) => hexAlphaToFloat(a[0]) - hexAlphaToFloat(b[0]));
    const hoverCand = actionAlphas.find(([c]) => { const a = hexAlphaToFloat(c); return a >= 0.04 && a <= 0.12; });
    const selectedCand = actionAlphas.find(([c]) => { const a = hexAlphaToFloat(c); return a >= 0.12 && a <= 0.24; });
    if (hoverCand) palette.action.hover = `alpha('${hex6(hoverCand[0])}', ${hexAlphaToFloat(hoverCand[0])})`;
    if (selectedCand) palette.action.selected = `alpha('${hex6(selectedCand[0])}', ${hexAlphaToFloat(selectedCand[0])})`;

    return palette;
  }

  function exportTokensMUI() {
    const t = getTokenData();
    const allColors = sorted(data.colors, 200);
    const palette = buildMuiPalette(allColors);

    // Clean out empty keys
    const clean = obj => { const o = {}; for (const [k,v] of Object.entries(obj)) { if (v && typeof v === 'object' && !Array.isArray(v)) { const c = clean(v); if (Object.keys(c).length) o[k] = c; } else if (v !== '' && v !== undefined) { o[k] = v; } } return o; };
    const pal = clean(palette);

    let code = `// MUI createTheme — extracted by UI Inspector\n`;
    code += `// Source: ${location.href}\n`;
    code += `import { createTheme, alpha } from '@mui/material/styles';\n\n`;
    code += `const theme = createTheme({\n  palette: ${JSON.stringify(pal, null, 4).replace(/"alpha\('([^']+)',\s*([0-9.]+)\)"/g, "alpha('$1', $2)")}\n});\n\nexport default theme;\n`;
    return code;
  }

  function auditSkeleton() {
    const bar = (w) => `<div class="uii-skeleton" style="width:${w};height:14px"></div>`;
    const barL = (w) => `<div class="uii-skeleton" style="width:${w};height:20px"></div>`;
    let h = `<div class="uii-audit-bar"><span class="uii-sec-title">Audit Results</span><button class="uii-btn-outline" disabled>Scanning...</button></div>`;
    // Layout Shifts skeleton
    h += `<div class="uii-section"><div class="uii-sec-hdr">${bar('120px')}${bar('70px')}</div><div class="uii-sec-body"><div class="uii-audit-score">${barL('90px')}${bar('60px')}<div style="width:100%;margin-top:4px">${bar('160px')}</div></div>`;
    for (let i = 0; i < 2; i++) h += `<div style="display:flex;gap:10px;padding:10px 0"><div class="uii-skeleton" style="width:20px;height:20px;border-radius:50%"></div><div style="flex:1">${bar('80px')}<div style="margin-top:6px">${bar(`${180 + i * 20}px`)}</div></div></div>`;
    h += `</div></div>`;
    // Image Audit skeleton
    h += `<div class="uii-section"><div class="uii-sec-hdr">${bar('100px')}${bar('50px')}</div><div class="uii-sec-body">`;
    for (let i = 0; i < 3; i++) h += `<div style="display:flex;gap:10px;padding:10px 0"><div class="uii-skeleton" style="width:48px;height:48px;border-radius:6px"></div><div style="flex:1">${bar('140px')}<div style="margin-top:4px">${bar('200px')}</div><div style="display:flex;gap:4px;margin-top:6px">${bar('55px')}${bar('55px')}</div></div></div>`;
    h += `</div></div>`;
    // Unused CSS skeleton
    h += `<div class="uii-section"><div class="uii-sec-hdr">${bar('110px')}${bar('60px')}</div><div class="uii-sec-body">`;
    for (let i = 0; i < 4; i++) h += `<div style="display:flex;gap:8px;padding:7px 0">${bar(`${100 + i * 15}px`)}${bar('50px')}</div>`;
    h += `</div></div>`;
    // Accessibility skeleton
    h += `<div class="uii-section"><div class="uii-sec-hdr">${bar('110px')}${bar('30px')}</div><div class="uii-sec-body"><div class="uii-audit-score">${barL('50px')}${bar('60px')}<div style="width:100%;margin-top:4px">${bar('130px')}</div></div>`;
    for (let i = 0; i < 2; i++) h += `<div style="display:flex;gap:10px;padding:10px 0"><div class="uii-skeleton" style="width:20px;height:20px;border-radius:50%"></div><div style="flex:1">${bar('70px')}<div style="margin-top:6px">${bar(`${160 + i * 20}px`)}</div></div></div>`;
    h += `</div></div>`;
    return h;
  }

  function layoutSkeleton() {
    const bar = (w) => `<div class="uii-skeleton" style="width:${w};height:14px"></div>`;
    const barL = (w) => `<div class="uii-skeleton" style="width:${w};height:20px"></div>`;
    let h = `<div class="uii-audit-bar"><span class="uii-sec-title">Layout Overflow</span><button class="uii-btn-outline" disabled>Scanning...</button></div>`;
    h += `<div class="uii-section"><div class="uii-sec-hdr">${bar('140px')}</div><div class="uii-sec-body"><div class="uii-audit-score">${barL('60px')}${bar('90px')}<div style="width:100%;margin-top:4px">${bar('160px')}</div></div></div></div>`;
    h += `<div class="uii-section"><div class="uii-sec-hdr">${bar('150px')}${bar('40px')}</div><div class="uii-sec-body">`;
    for (let i = 0; i < 3; i++) h += `<div style="padding:8px 0">${bar(`${180 + i * 20}px`)}<div style="margin-top:4px">${bar('140px')}</div></div>`;
    h += `</div></div>`;
    return h;
  }

  function tabLayout() {
    if (layoutData === 'loading') return layoutSkeleton();
    if (!layoutData) {
      return `<div class="uii-empty">${IC.layout}<p>Detect layout overflow — elements whose height calculations push the body past the viewport, causing unwanted scrollbars.</p><button class="uii-empty-btn" data-act="run-layout">Run Scan</button></div>`;
    }
    const L = layoutData;
    const hasIssue = L.page.overflowY > 0 || L.page.overflowX > 0 || L.culprits.length > 0;
    let h = `<div class="uii-audit-bar"><span class="uii-sec-title">Layout Overflow</span><div style="display:flex;gap:6px">`;
    if (hasIssue) h += `<button class="uii-btn-outline uii-btn-accent" data-act="copy-layout-prompt">Copy Prompt</button>`;
    h += `<button class="uii-btn-outline" data-act="run-layout">Re-scan</button></div></div>`;

    // Page overflow summary
    const py = L.page.overflowY, px = L.page.overflowX;
    const overflowMax = Math.max(py, px, 0);
    const scoreBadge = (py <= 0 && px <= 0) ? 'uii-abadge--good' : (overflowMax > 30) ? 'uii-abadge--poor' : 'uii-abadge--warn';
    const scoreLabel = (py <= 0 && px <= 0) ? 'Good' : (overflowMax > 30) ? 'Scrollable' : 'Slight';
    h += `<div class="uii-section"><div class="uii-sec-hdr"><span class="uii-sec-title">Page Overflow</span></div><div class="uii-sec-body">`;
    h += `<div class="uii-audit-score"><span class="uii-audit-score-val">${overflowMax}<span style="font-size:14px;opacity:.6;margin-left:2px">px</span></span><span class="uii-abadge ${scoreBadge}">${scoreLabel}</span><span class="uii-audit-score-label">Viewport ${L.page.vw}×${L.page.vh}</span></div>`;
    if (py > 0) h += `<div class="uii-audit-issue"><div class="uii-audit-issue-icon">${IC.warn}</div><div class="uii-audit-issue-body"><div class="uii-audit-issue-tag uii-atag--cls">Vertical overflow</div><div class="uii-audit-issue-fix">Page scrollHeight (${L.page.scrollHeight}px) exceeds viewport height by <strong>${py}px</strong> — browser shows a vertical scrollbar.</div></div></div>`;
    if (px > 0) h += `<div class="uii-audit-issue"><div class="uii-audit-issue-icon">${IC.warn}</div><div class="uii-audit-issue-body"><div class="uii-audit-issue-tag uii-atag--cls">Horizontal overflow</div><div class="uii-audit-issue-fix">Page scrollWidth (${L.page.scrollWidth}px) exceeds viewport width by <strong>${px}px</strong> — browser shows a horizontal scrollbar.</div></div></div>`;
    if (py <= 0 && px <= 0) h += `<div class="uii-audit-pass">${IC.check} Page fits within viewport</div>`;
    h += `</div></div>`;

    // Culprit elements
    h += `<div class="uii-section"><div class="uii-sec-hdr"><span class="uii-sec-title">Culprit Elements <span class="uii-count">${L.culprits.length}</span></span><div style="display:flex;gap:6px">`;
    if (L.culprits.length) h += `<button class="uii-btn-outline uii-btn-sm" data-act="highlight-layout">Highlight</button>`;
    h += `</div></div><div class="uii-sec-body">`;
    if (L.culprits.length) {
      h += `<div class="uii-audit-note">Elements whose bottom edge extends past the viewport — likely sources of body-level overflow.</div>`;
      L.culprits.forEach((c, idx) => {
        h += `<div class="uii-layout-row" data-layout-idx="${idx}">`;
        h += `<div class="uii-layout-sel">${esc(c.selector)}</div>`;
        h += `<div class="uii-layout-meta"><span>top <strong>${c.offsetTop}px</strong></span><span>height <strong>${c.height}px</strong></span><span class="uii-layout-over">+${c.bottomDelta}px over</span></div>`;
        h += `<div class="uii-layout-hint">CSS height: <code>${esc(c.cssHeight)}</code>${c.cssMinHeight && c.cssMinHeight !== '0px' ? ` · min-height: <code>${esc(c.cssMinHeight)}</code>` : ''}</div>`;
        h += `</div>`;
      });
    } else {
      h += `<div class="uii-audit-pass">${IC.check} No elements extending past the viewport</div>`;
    }
    h += `</div></div>`;

    // Scroll containers
    h += `<div class="uii-section"><div class="uii-sec-hdr"><span class="uii-sec-title">Scroll Containers <span class="uii-count">${L.containers.length}</span></span></div><div class="uii-sec-body">`;
    if (L.containers.length) {
      h += `<div class="uii-audit-note">Nested containers with overflow:auto|scroll currently scrolling. Unexpected scroll here often means a child is larger than its parent.</div>`;
      L.containers.forEach(c => {
        h += `<div class="uii-layout-row">`;
        h += `<div class="uii-layout-sel">${esc(c.selector)}</div>`;
        h += `<div class="uii-layout-meta"><span>axis <strong>${c.axis.toUpperCase()}</strong></span><span class="uii-layout-over">${c.delta}px overflow</span></div>`;
        h += `</div>`;
      });
    } else {
      h += `<div class="uii-audit-pass">${IC.check} No internal scroll containers overflowing</div>`;
    }
    h += `</div></div>`;

    return h;
  }

  function tabAudit() {
    if (auditData === 'loading') return auditSkeleton();
    if (!auditData) {
      return `<div class="uii-empty">${IC.audit}<p>Scan this page for performance issues, oversized images, and unused CSS.</p><button class="uii-empty-btn" data-act="run-audit">Run Audit</button></div>`;
    }
    const a = auditData;
    const hasAnyIssue = a.clsCulprits.length || a.images.some(i => i.issues.length > 0) || a.unusedCSSCount || (a.a11y && a.a11y.issues.length) || (a.spacing && a.spacing.issues.length);
    let h = `<div class="uii-audit-bar"><span class="uii-sec-title">Audit Results</span><div style="display:flex;gap:6px">`;
    if (hasAnyIssue) h += `<button class="uii-btn-outline uii-btn-accent" data-act="copy-full-audit">Copy All to AI</button>`;
    h += `<button class="uii-btn-outline" data-act="run-audit">Re-scan</button></div></div>`;

    // — Layout Shifts —
    const clsVal = a.totalCLS;
    const clsBadge = clsVal < 0.1 ? 'uii-abadge--good' : clsVal < 0.25 ? 'uii-abadge--warn' : 'uii-abadge--poor';
    const clsLabel = clsVal < 0.1 ? 'Good' : clsVal < 0.25 ? 'Needs Work' : 'Poor';
    h += `<div class="uii-section"><div class="uii-sec-hdr"><span class="uii-sec-title">Layout Shifts <span class="uii-count">${a.clsCulprits.length}</span></span><div style="display:flex;gap:6px">`;
    if (a.clsCulprits.length) h += `<button class="uii-btn-outline uii-btn-sm" data-act="copy-cls-prompt">Copy Prompt</button>`;
    if (a.clsCulprits.length) h += `<button class="uii-btn-outline uii-btn-sm" data-act="highlight-cls">Highlight</button>`;
    h += `</div></div><div class="uii-sec-body">`;
    h += `<div class="uii-audit-score"><span class="uii-audit-score-val">${clsVal.toFixed(3)}</span><span class="uii-abadge ${clsBadge}">${clsLabel}</span><span class="uii-audit-score-label">Cumulative Layout Shift</span></div>`;
    if (a.clsCulprits.length) {
      a.clsCulprits.forEach(c => {
        const icon = c.type === 'img' ? IC.image : IC.type;
        h += `<div class="uii-audit-issue"><div class="uii-audit-issue-icon">${icon}</div><div class="uii-audit-issue-body"><div class="uii-audit-issue-tag uii-atag--cls">${c.issue === 'missing-dimensions' ? 'Missing Dimensions' : 'No font-display'}</div><div class="uii-audit-issue-fix">${esc(c.fix)}</div></div></div>`;
      });
    } else {
      h += `<div class="uii-audit-pass">${IC.check} No layout shift culprits found</div>`;
    }
    h += `</div></div>`;

    // — Image Audit —
    const imgIssues = a.images.filter(i => i.issues.length > 0);
    h += `<div class="uii-section"><div class="uii-sec-hdr"><span class="uii-sec-title">Image Audit <span class="uii-count">${imgIssues.length} issue${imgIssues.length!==1?'s':''}</span></span>`;
    if (imgIssues.length) h += `<button class="uii-btn-outline uii-btn-sm" data-act="copy-img-prompt">Copy Prompt</button>`;
    h += `</div><div class="uii-sec-body">`;
    if (imgIssues.length) {
      imgIssues.forEach(img => {
        const idx = a.images.indexOf(img);
        h += `<div class="uii-audit-img-row" data-act="goto-img" data-idx="${idx}">`;
        h += `<div class="uii-audit-img-thumb"><img src="${esc(img.src)}" loading="lazy"></div>`;
        h += `<div class="uii-audit-img-info">`;
        h += `<div class="uii-audit-img-name">${esc(img.name)}</div>`;
        if (img.oversized) {
          h += `<div class="uii-audit-img-size">${img.naturalW}x${img.naturalH} rendered at ${img.renderedW}x${img.renderedH} <strong>(~${img.savingsPercent}% wasted)</strong></div>`;
        }
        h += `<div class="uii-audit-tags">`;
        if (img.oversized) h += `<span class="uii-atag uii-atag--warn">Oversized</span>`;
        if (img.missingLazy) h += `<span class="uii-atag uii-atag--warn">No lazy</span>`;
        if (img.missingAlt) h += `<span class="uii-atag uii-atag--info">No alt</span>`;
        if (img.suggestWebP) h += `<span class="uii-atag uii-atag--info">Use WebP</span>`;
        h += `</div></div></div>`;
      });
    } else {
      h += `<div class="uii-audit-pass">${IC.check} All images look good</div>`;
    }
    h += `</div></div>`;

    // — Unused CSS —
    h += `<div class="uii-section"><div class="uii-sec-hdr"><span class="uii-sec-title">Unused CSS <span class="uii-count">${a.unusedCSSCount} / ${a.totalRulesScanned}</span></span><div style="display:flex;gap:6px">`;
    if (a.unusedCSSCount) h += `<button class="uii-btn-outline uii-btn-sm" data-act="copy-css-prompt">Copy Prompt</button>`;
    if (a.unusedCSSCount) h += `<button class="uii-btn-outline uii-btn-sm" data-act="copy-unused-css">Copy All</button>`;
    h += `</div></div><div class="uii-sec-body">`;
    if (a.skippedSheets) h += `<div class="uii-audit-note">${a.skippedSheets} cross-origin sheet${a.skippedSheets>1?'s':''} skipped</div>`;
    if (a.unusedCSSCount) {
      const shown = a.unusedCSS.slice(0, 50);
      shown.forEach(r => {
        h += `<div class="uii-rule-row"><div class="uii-rule-sel">${esc(r.selector)}</div><div class="uii-rule-sheet">${esc(r.sheet)}</div><button class="uii-rule-copy" data-act="copy-rule" data-rule="${esc(r.ruleText).replace(/"/g,'&quot;')}">${IC.copy}</button></div>`;
      });
      if (a.unusedCSSCount > 50) h += `<div class="uii-audit-note">...and ${a.unusedCSSCount - 50} more. Use "Copy All" to get the full list.</div>`;
    } else {
      h += `<div class="uii-audit-pass">${IC.check} No unused CSS rules found</div>`;
    }
    h += `</div></div>`;

    // — Accessibility —
    if (a.a11y) {
      const a11y = a.a11y;
      const scoreBadge = a11y.score >= 90 ? 'uii-abadge--good' : a11y.score >= 60 ? 'uii-abadge--warn' : 'uii-abadge--poor';
      const scoreLabel = a11y.score >= 90 ? 'Good' : a11y.score >= 60 ? 'Needs Work' : 'Poor';
      const errors = a11y.issues.filter(i => i.severity === 'error');
      const warns = a11y.issues.filter(i => i.severity === 'warn');
      const infos = a11y.issues.filter(i => i.severity === 'info');
      h += `<div class="uii-section"><div class="uii-sec-hdr"><span class="uii-sec-title">Accessibility <span class="uii-count">${a11y.issues.length}</span></span>`;
      if (a11y.issues.length) h += `<button class="uii-btn-outline uii-btn-sm" data-act="copy-a11y-prompt">Copy Prompt</button>`;
      h += `</div><div class="uii-sec-body">`;
      h += `<div class="uii-audit-score"><span class="uii-audit-score-val">${a11y.score}</span><span class="uii-abadge ${scoreBadge}">${scoreLabel}</span><span class="uii-audit-score-label">Accessibility Score</span></div>`;
      if (a11y.issues.length) {
        const renderGroup = (label, items, tagCls) => {
          if (!items.length) return '';
          const groupPrompt = `Fix the following ${items.length} accessibility ${label.toLowerCase()} on this page:\n\n` + items.map((i, n) => `${n+1}. [${i.type}] ${i.desc}\n   Fix: ${i.fix}`).join('\n\n') + `\n\nPlease update the HTML/CSS to resolve all of these.`;
          let g = `<div class="uii-a11y-group-hdr"><span class="uii-a11y-group-label">${label} (${items.length})</span><button class="uii-btn-outline uii-btn-sm" data-act="copy-a11y-group" data-prompt="${esc(groupPrompt).replace(/"/g,'&quot;')}">Copy Prompt</button></div>`;
          items.forEach(i => {
            const singlePrompt = `Fix this accessibility issue:\n\n- Issue: ${i.desc}\n- Fix: ${i.fix}\n\nPlease update the HTML/CSS to resolve this.`;
            g += `<div class="uii-audit-issue"><div class="uii-audit-issue-icon">${IC.warn}</div><div class="uii-audit-issue-body"><div class="uii-audit-issue-tag ${tagCls}">${esc(i.type)}</div><div class="uii-audit-issue-fix">${esc(i.desc)}</div><div class="uii-a11y-fix">${esc(i.fix)}</div></div><button class="uii-issue-copy" data-act="copy-a11y-issue" data-prompt="${esc(singlePrompt).replace(/"/g,'&quot;')}" title="Copy prompt">${IC.copy}</button></div>`;
          });
          return g;
        };
        h += renderGroup('Errors', errors, 'uii-atag--error');
        h += renderGroup('Warnings', warns, 'uii-atag--cls');
        h += renderGroup('Info', infos, 'uii-atag--a11y-info');
      } else {
        h += `<div class="uii-audit-pass">${IC.check} No accessibility issues found</div>`;
      }
      h += `</div></div>`;
    }

    // — Spacing Consistency —
    if (a.spacing) {
      const sp = a.spacing;
      h += `<div class="uii-section"><div class="uii-sec-hdr"><span class="uii-sec-title">Spacing <span class="uii-count">${sp.issues.length} off-grid</span></span>`;
      if (sp.issues.length) h += `<button class="uii-btn-outline uii-btn-sm" data-act="copy-spacing-prompt">Copy Prompt</button>`;
      h += `</div><div class="uii-sec-body">`;
      if (sp.issues.length) {
        h += `<div class="uii-audit-note" style="font-style:normal">Values not on the <strong>${sp.grid}px</strong> grid</div>`;
        const shown = sp.issues.slice(0, 30);
        shown.forEach(s => {
          h += `<div class="uii-spacing-row">`;
          h += `<div class="uii-spacing-prop">${esc(s.prop)}</div>`;
          h += `<div class="uii-spacing-val">${esc(s.value)}</div>`;
          h += `<div class="uii-spacing-arrow">→</div>`;
          h += `<div class="uii-spacing-suggest">${esc(s.nearest)}</div>`;
          h += `<div class="uii-spacing-sel">${esc(s.selector)}</div>`;
          h += `<div class="uii-spacing-count">${s.count}x</div>`;
          h += `</div>`;
        });
        if (sp.issues.length > 30) h += `<div class="uii-audit-note">...and ${sp.issues.length - 30} more. Use "Copy Prompt" for the full list.</div>`;
      } else {
        h += `<div class="uii-audit-pass">${IC.check} All spacing values are on the ${sp.grid}px grid</div>`;
      }
      h += `</div></div>`;
    }

    // — Detected Tech Stack —
    const techStack = detectTechStack();
    if (techStack.length) {
      h += `<div class="uii-section"><div class="uii-sec-hdr"><span class="uii-sec-title">Detected Stack</span></div><div class="uii-sec-body"><div class="uii-tech-badges">`;
      const labels = { mui: 'MUI / Material UI', tailwind: 'Tailwind CSS', bootstrap: 'Bootstrap', chakra: 'Chakra UI', antd: 'Ant Design' };
      techStack.forEach(t => { h += `<span class="uii-tech-badge">${labels[t] || t}</span>`; });
      h += `</div></div></div>`;
    }

    // — Export Design Tokens —
    h += `<div class="uii-section"><div class="uii-sec-hdr"><span class="uii-sec-title">Export Design Tokens</span></div><div class="uii-sec-body">`;
    h += `<div class="uii-token-btns">`;
    if (techStack.includes('mui')) h += `<button class="uii-btn-outline uii-btn-primary" data-act="export-tokens-mui">MUI Theme</button>`;
    h += `<button class="uii-btn-outline" data-act="export-tokens-css">CSS Variables</button>`;
    h += `<button class="uii-btn-outline" data-act="export-tokens-tailwind">Tailwind Config</button>`;
    h += `<button class="uii-btn-outline" data-act="export-tokens-json">JSON</button>`;
    h += `</div></div></div>`;

    return h;
  }

  /* ── SEO Tab ─────────────────────────────────────────── */
  function buildSEOPrompt(s) {
    if (!s.issues.length) return 'No SEO issues found.';
    let p = `Fix the following SEO issues on this page (score: ${s.score}/100):\nURL: ${location.href}\n\n`;
    const groups = { error: [], warn: [], info: [] };
    s.issues.forEach(i => (groups[i.severity] || groups.info).push(i));
    ['error', 'warn', 'info'].forEach(sev => {
      if (!groups[sev].length) return;
      const label = sev === 'error' ? 'CRITICAL' : sev === 'warn' ? 'WARNINGS' : 'SUGGESTIONS';
      p += `${label}:\n`;
      groups[sev].forEach((i, n) => { p += `${n + 1}. [${i.type}] ${i.desc}\n   Fix: ${i.fix}\n`; });
      p += '\n';
    });
    p += 'Please update the HTML <head> and page content to fix all SEO issues. Prioritize critical errors first.';
    return p;
  }

  function seoSkeleton() {
    const bar = (w) => `<div class="uii-skeleton" style="width:${w};height:14px"></div>`;
    const barL = (w) => `<div class="uii-skeleton" style="width:${w};height:20px"></div>`;
    let h = `<div class="uii-audit-bar"><span class="uii-sec-title">SEO Analysis</span><button class="uii-btn-outline" disabled>Scanning...</button></div>`;
    h += `<div class="uii-section"><div class="uii-sec-body" style="padding-top:16px"><div class="uii-audit-score">${barL('80px')}${bar('60px')}<div style="width:100%;margin-top:4px">${bar('140px')}</div></div></div></div>`;
    h += `<div class="uii-section"><div class="uii-sec-hdr">${bar('90px')}</div><div class="uii-sec-body">`;
    for (let i = 0; i < 6; i++) h += `<div class="uii-seo-meta-row">${bar('70px')}${bar(`${100 + i * 15}px`)}${bar('40px')}</div>`;
    h += `</div></div>`;
    h += `<div class="uii-section"><div class="uii-sec-hdr">${bar('120px')}</div><div class="uii-sec-body">`;
    for (let i = 0; i < 4; i++) h += `<div class="uii-seo-meta-row">${bar('70px')}${bar(`${80 + i * 20}px`)}${bar('40px')}</div>`;
    h += `</div></div>`;
    h += `<div class="uii-section"><div class="uii-sec-hdr">${bar('130px')}</div><div class="uii-sec-body">`;
    for (let i = 0; i < 5; i++) h += `<div style="display:flex;gap:8px;padding:4px 0">${bar('28px')}${bar(`${120 + i * 10}px`)}</div>`;
    h += `</div></div>`;
    return h;
  }

  function tabSEO() {
    if (seoData === 'loading') return seoSkeleton();
    if (!seoData) seoData = scanSEO();
    const s = seoData;
    const scoreBadge = s.score >= 80 ? 'uii-abadge--good' : s.score >= 50 ? 'uii-abadge--warn' : 'uii-abadge--poor';
    const scoreLabel = s.score >= 80 ? 'Good' : s.score >= 50 ? 'Needs Work' : 'Poor';
    const errors = s.issues.filter(i => i.severity === 'error');
    const warns = s.issues.filter(i => i.severity === 'warn');
    const infos = s.issues.filter(i => i.severity === 'info');

    let h = `<div class="uii-audit-bar"><span class="uii-sec-title">SEO Analysis</span><div style="display:flex;gap:6px">`;
    if (s.issues.length) h += `<button class="uii-btn-outline uii-btn-accent" data-act="copy-seo-prompt">Copy All to AI</button>`;
    h += `<button class="uii-btn-outline" data-act="rescan-seo">Re-scan</button></div></div>`;

    // Score
    h += `<div class="uii-section"><div class="uii-sec-body" style="padding-top:16px">`;
    h += `<div class="uii-audit-score"><span class="uii-audit-score-val">${s.score}</span><span class="uii-abadge ${scoreBadge}">${scoreLabel}</span><span class="uii-audit-score-label">SEO Score</span></div>`;
    h += `</div></div>`;

    // Meta Info
    h += `<div class="uii-section"><div class="uii-sec-hdr"><span class="uii-sec-title">Meta Tags</span></div><div class="uii-sec-body">`;
    const metaRow = (label, value, status) => {
      const badge = status === 'good' ? 'uii-abadge--good' : status === 'warn' ? 'uii-abadge--warn' : status === 'error' ? 'uii-abadge--poor' : '';
      const statusLabel = status === 'good' ? 'OK' : status === 'warn' ? 'Warning' : status === 'error' ? 'Missing' : '';
      return `<div class="uii-seo-meta-row"><div class="uii-seo-meta-label">${label}</div><div class="uii-seo-meta-val">${value ? esc(value).slice(0, 80) + (value.length > 80 ? '...' : '') : '<em>Not set</em>'}</div>${badge ? `<span class="uii-abadge uii-abadge--sm ${badge}">${statusLabel}</span>` : ''}</div>`;
    };
    const titleStatus = !s.info.title ? 'error' : (s.info.title.length < 30 || s.info.title.length > 60) ? 'warn' : 'good';
    const descStatus = !s.info.description ? 'error' : (s.info.description.length < 70 || s.info.description.length > 160) ? 'warn' : 'good';
    h += metaRow('Title' + (s.info.title ? ` (${s.info.title.length})` : ''), s.info.title, titleStatus);
    h += metaRow('Description' + (s.info.description ? ` (${s.info.description.length})` : ''), s.info.description, descStatus);
    h += metaRow('Canonical', s.info.canonical, s.info.canonical ? 'good' : 'warn');
    h += metaRow('Viewport', s.info.viewport, s.info.viewport ? 'good' : 'error');
    h += metaRow('Language', s.info.lang, s.info.lang ? 'good' : 'warn');
    h += metaRow('Robots', s.info.robots || 'Not set (default: index, follow)', '');
    h += `</div></div>`;

    // Open Graph
    h += `<div class="uii-section"><div class="uii-sec-hdr"><span class="uii-sec-title">Social / Open Graph</span></div><div class="uii-sec-body">`;
    h += metaRow('og:title', s.info.og.title, s.info.og.title ? 'good' : 'warn');
    h += metaRow('og:description', s.info.og.description, s.info.og.description ? 'good' : '');
    h += metaRow('og:image', s.info.og.image, s.info.og.image ? 'good' : 'warn');
    h += metaRow('twitter:card', s.info.twitterCard, s.info.twitterCard ? 'good' : '');
    h += metaRow('Structured Data', s.info.structuredData ? `${s.info.structuredData} JSON-LD block${s.info.structuredData > 1 ? 's' : ''}` : '', s.info.structuredData ? 'good' : '');
    h += `</div></div>`;

    // Heading Structure
    h += `<div class="uii-section"><div class="uii-sec-hdr"><span class="uii-sec-title">Heading Structure <span class="uii-count">${s.info.headings.length}</span></span></div><div class="uii-sec-body">`;
    if (s.info.headings.length) {
      s.info.headings.forEach(heading => {
        const indent = (heading.level - 1) * 16;
        h += `<div class="uii-seo-heading" style="padding-left:${indent}px"><span class="uii-seo-htag">H${heading.level}</span><span class="uii-seo-htext">${esc(heading.text) || '<em>empty</em>'}</span></div>`;
      });
    } else {
      h += `<div class="uii-audit-note">No headings found on this page.</div>`;
    }
    h += `</div></div>`;

    // Links summary
    h += `<div class="uii-section"><div class="uii-sec-hdr"><span class="uii-sec-title">Links</span></div><div class="uii-sec-body"><div class="uii-stats-grid">`;
    h += `<div class="uii-stat-card"><div class="uii-stat-label">Internal</div><div class="uii-stat-val">${s.info.links.internal}</div></div>`;
    h += `<div class="uii-stat-card"><div class="uii-stat-label">External</div><div class="uii-stat-val">${s.info.links.external}</div></div>`;
    h += `<div class="uii-stat-card"><div class="uii-stat-label">Nofollow</div><div class="uii-stat-val">${s.info.links.nofollow}</div></div>`;
    h += `<div class="uii-stat-card"><div class="uii-stat-label">Empty Text</div><div class="uii-stat-val">${s.info.links.broken.length}</div></div>`;
    h += `</div></div></div>`;

    // Issues
    if (s.issues.length) {
      h += `<div class="uii-section"><div class="uii-sec-hdr"><span class="uii-sec-title">Issues <span class="uii-count">${s.issues.length}</span></span></div><div class="uii-sec-body">`;
      const renderSEOGroup = (label, items, tagCls) => {
        if (!items.length) return '';
        const groupPrompt = `Fix these SEO ${label.toLowerCase()} on ${location.href}:\n\n` + items.map((i, n) => `${n+1}. [${i.type}] ${i.desc}\n   Fix: ${i.fix}`).join('\n\n') + `\n\nPlease update the HTML to resolve all of these.`;
        let g = `<div class="uii-a11y-group-hdr"><span class="uii-a11y-group-label">${label} (${items.length})</span><button class="uii-btn-outline uii-btn-sm uii-seo-group-copy" data-prompt="${esc(groupPrompt).replace(/"/g,'&quot;')}">Copy Prompt</button></div>`;
        items.forEach(i => {
          const sp = `Fix this SEO issue on ${location.href}:\n\n- Issue: ${i.desc}\n- Fix: ${i.fix}\n\nPlease update the HTML to resolve this.`;
          g += `<div class="uii-audit-issue"><div class="uii-audit-issue-icon">${IC.warn}</div><div class="uii-audit-issue-body"><div class="uii-audit-issue-tag ${tagCls}">${esc(i.type)}</div><div class="uii-audit-issue-fix">${esc(i.desc)}</div><div class="uii-a11y-fix">${esc(i.fix)}</div></div><button class="uii-issue-copy uii-seo-issue-copy" data-prompt="${esc(sp).replace(/"/g,'&quot;')}" title="Copy prompt">${IC.copy}</button></div>`;
        });
        return g;
      };
      h += renderSEOGroup('Errors', errors, 'uii-atag--error');
      h += renderSEOGroup('Warnings', warns, 'uii-atag--cls');
      h += renderSEOGroup('Suggestions', infos, 'uii-atag--a11y-info');
      h += `</div></div>`;
    }

    return h;
  }

  /* ── Inspector Empty ─────────────────────────────────── */
  function tabInspEmpty() {
    return `<div class="uii-empty">${IC.target}<p>Click an element on the page to inspect its properties.</p><button class="uii-empty-btn" data-act="pick">Start Picking</button></div>`;
  }

  /* ── Inspector Detail ────────────────────────────────── */
  function tabInspDetail() {
    if (!inspected) return tabInspEmpty();
    const el = inspected, cs = getComputedStyle(el), tag = el.tagName.toLowerCase();
    const cls = Array.from(el.classList).filter(c=>!c.startsWith('uii-'));
    const m = sides(cs.margin), p = sides(cs.padding);
    const w = Math.round(parseFloat(cs.width)), ht = Math.round(parseFloat(cs.height));
    const bv = v => v===0 ? '<span class="uii-bm-v uii-bm-v--0">-</span>' : `<span class="uii-bm-v">${v}</span>`;

    let h = `<div class="uii-insp-bar"><div class="uii-insp-bar-left"><button class="uii-icon-btn" data-act="back-insp">${IC.back}</button><span class="uii-insp-bar-title">Inspector</span></div><button class="uii-btn-outline" data-act="copy-json">Copy JSON</button></div>`;

    // Identity
    let sel = `<span class="uii-s-tag">${esc(tag)}</span>`;
    cls.forEach(c => { sel += `<span class="uii-s-cls">.${esc(c)}</span>`; });
    h += `<div class="uii-insp-id"><div class="uii-insp-type">${etype(tag)}</div><div class="uii-insp-sel">${sel}</div></div>`;

    // Toggle
    h += `<div class="uii-insp-toggle-row" data-act="toggle-ctx"><div class="uii-mini-sw"></div><span class="uii-insp-toggle-lbl">Context menu while hovering</span></div>`;

    // Box model
    h += `<div class="uii-boxmodel"><div class="uii-bm-wrap"><div class="uii-bm-margin">${bv(m[0]).replace('uii-bm-v"','uii-bm-v uii-bm-v-t"')}${bv(m[1]).replace('uii-bm-v"','uii-bm-v uii-bm-v-r"')}${bv(m[2]).replace('uii-bm-v"','uii-bm-v uii-bm-v-b"')}${bv(m[3]).replace('uii-bm-v"','uii-bm-v uii-bm-v-l"')}<div class="uii-bm-padding">${bv(p[0]).replace('uii-bm-v"','uii-bm-v uii-bm-v-t"')}${bv(p[1]).replace('uii-bm-v"','uii-bm-v uii-bm-v-r"')}${bv(p[2]).replace('uii-bm-v"','uii-bm-v uii-bm-v-b"')}${bv(p[3]).replace('uii-bm-v"','uii-bm-v uii-bm-v-l"')}<div class="uii-bm-content"><span class="uii-bm-size">${w} X ${ht}</span></div></div></div></div></div>`;

    // Text
    const ff = cs.fontFamily.split(',')[0].trim().replace(/['"]/g,'');
    const ffShort = cs.fontFamily.length>35?cs.fontFamily.slice(0,32)+'...':cs.fontFamily;
    const tcHex = hex(cs.color);
    h += `<div class="uii-psec"><div class="uii-ptitle">Text properties</div>`;
    h += prow('Font Family', `${esc(ff)}<span style="color:#a0a0b4">, ${esc(ffShort.replace(ff,'').slice(0,25))}</span>`, cs.fontFamily);
    h += prow('Font Size', `<strong>${cs.fontSize}</strong>`, cs.fontSize);
    h += prow('Line Height', `<strong>${cs.lineHeight}</strong>`, cs.lineHeight);
    h += prow('Font Weight', `<strong>${wname(cs.fontWeight)}</strong>`, cs.fontWeight);
    h += prow('Letter Spacing', `<strong>${cs.letterSpacing}</strong>`, cs.letterSpacing);
    h += prowColor('Text color', tcHex);
    h += '</div>';

    // Colors
    const bgH = hex(cs.backgroundColor), hasBg = cs.backgroundColor!=='rgba(0, 0, 0, 0)'&&cs.backgroundColor!=='transparent';
    const hasBorder = cs.borderStyle!=='none', brdH = hex(cs.borderColor);
    if (hasBg||hasBorder) {
      h += '<div class="uii-psec"><div class="uii-ptitle">Colors</div>';
      if (hasBg) h += colorBlock('Background',bgH);
      if (hasBorder) h += colorBlock('Border',brdH);
      h += '</div>';
    }

    // Contrast
    let effBg = hasBg ? bgH : null;
    if (!effBg) { let p=el.parentElement; while(p){const pBg=getComputedStyle(p).backgroundColor; if(pBg&&pBg!=='rgba(0, 0, 0, 0)'&&pBg!=='transparent'){effBg=hex(pBg);break;} p=p.parentElement;} }
    if (effBg && tcHex.startsWith('#') && tcHex.length===7 && effBg.startsWith('#') && effBg.length===7) {
      const ratio = parseFloat(contrastRatio(tcHex, effBg));
      let label, badgeCls;
      if (ratio >= 7) { label = 'Excellent'; badgeCls = 'uii-badge--excellent'; }
      else if (ratio >= 4.5) { label = 'AA Pass'; badgeCls = 'uii-badge--pass'; }
      else if (ratio >= 3) { label = 'AA Large'; badgeCls = 'uii-badge--large'; }
      else { label = 'Poor'; badgeCls = 'uii-badge--poor'; }
      h += '<div class="uii-psec"><div class="uii-ptitle">Contrast</div>';
      h += `<div class="uii-contrast-row"><div class="uii-cr-preview" style="background:${effBg};color:${tcHex}">Aa</div><div class="uii-cr-detail"><span class="uii-cr-ratio">${ratio.toFixed(2)} : 1</span><span class="uii-badge ${badgeCls}">${label}</span></div></div>`;
      if (ratio < 4.5) {
        const suggested = suggestColor(tcHex, effBg);
        const sugRatio = parseFloat(contrastRatio(suggested, effBg));
        h += `<div class="uii-suggest"><div class="uii-suggest-label">Suggested text color for AA</div><div class="uii-suggest-row"><span class="uii-swatch" style="background:${suggested}"></span><strong>${up(suggested)}</strong><span class="uii-suggest-ratio">${sugRatio.toFixed(1)}:1</span><button class="uii-pcopy" style="display:flex" onclick="event.stopPropagation();navigator.clipboard.writeText('${up(suggested)}')">${IC.copy}</button></div></div>`;
        const elSelector = esc(tag) + cls.map(c=>'.'+esc(c)).join('');
        const inspPrompt = `Fix the contrast issue on the element <${elSelector}>:\n\n- Current text color: ${up(tcHex)}\n- Background color: ${up(effBg)}\n- Current contrast ratio: ${ratio.toFixed(2)}:1 (WCAG AA requires 4.5:1)\n- Suggested text color: ${up(suggested)} (${sugRatio.toFixed(1)}:1)\n\nUpdate the CSS for this element so it meets WCAG AA contrast ratio (4.5:1 minimum). Keep the color as close to the original ${up(tcHex)} as possible while achieving compliance.`;
        h += `<button class="uii-btn-outline uii-copy-prompt-btn" style="width:100%;margin-top:8px" data-prompt="${esc(inspPrompt).replace(/"/g,'&quot;')}">Copy Prompt to Fix Contrast</button>`;
      }
      h += '</div>';
    }

    // Layout
    h += '<div class="uii-psec"><div class="uii-ptitle">Layout</div>';
    h += prow('Display',`<strong>${cs.display}</strong>`,cs.display);
    if(cs.position!=='static') h += prow('Position',`<strong>${cs.position}</strong>`,cs.position);
    h += prow('Width',`<strong>${cs.width}</strong>`,cs.width);
    h += prow('Height',`<strong>${cs.height}</strong>`,cs.height);
    if(cs.display.includes('flex')){
      h += prow('Flex Direction',`<strong>${cs.flexDirection}</strong>`,cs.flexDirection);
      h += prow('Flex Wrap',`<strong>${cs.flexWrap}</strong>`,cs.flexWrap);
      h += prow('Align Items',`<strong>${cs.alignItems}</strong>`,cs.alignItems);
      h += prow('Justify',`<strong>${cs.justifyContent}</strong>`,cs.justifyContent);
    }
    if(cs.display.includes('grid')) h += prow('Grid Columns',`<strong>${cs.gridTemplateColumns}</strong>`,cs.gridTemplateColumns);
    h += '</div>';

    // Decoration
    if(hasBorder||cs.borderRadius!=='0px'||cs.boxShadow!=='none') {
      h += '<div class="uii-psec"><div class="uii-ptitle">Decoration</div>';
      if(hasBorder) h += prow('Border',`<strong>${cs.borderWidth} ${cs.borderStyle}</strong>`,`${cs.borderWidth} ${cs.borderStyle} ${up(brdH)}`);
      if(cs.borderRadius!=='0px') h += prow('Border Radius',`<strong>${cs.borderRadius}</strong>`,cs.borderRadius);
      if(cs.boxShadow!=='none'){ const sh=cs.boxShadow.length>35?cs.boxShadow.slice(0,32)+'...':cs.boxShadow; h += prow('Box Shadow',`<strong title="${esc(cs.boxShadow)}">${esc(sh)}</strong>`,cs.boxShadow); }
      h += '</div>';
    }
    return h;
  }

  function prow(key,val,copyVal) {
    const cv = esc(String(copyVal||'').replace(/'/g,"\\'"));
    return `<div class="uii-prow"><span class="uii-pkey">${key}</span><span class="uii-pval">${val}</span><button class="uii-pcopy" onclick="event.stopPropagation();navigator.clipboard.writeText('${cv}')">${IC.copy}</button></div>`;
  }
  function prowColor(key,h) {
    const u = up(h), borderStyle = lum(h)>0.9?'border-color:rgba(0,0,0,.15)':'';
    return `<div class="uii-prow"><span class="uii-pkey">${key}</span><span class="uii-pval"><span class="uii-swatch" style="background:${h};${borderStyle}"></span><strong>${u}</strong></span><button class="uii-pcopy" onclick="event.stopPropagation();navigator.clipboard.writeText('${u}')">${IC.copy}</button></div>`;
  }
  function colorBlock(label,h) {
    const u = up(h), borderStyle = lum(h)>0.9?'border-color:rgba(0,0,0,.15)':'';
    return `<div class="uii-insp-crow" onclick="navigator.clipboard.writeText('${u}')"><div class="uii-swatch uii-swatch--lg" style="background:${h};${borderStyle}"></div><div class="uii-ic-info"><div class="uii-ic-label">${label}</div><div class="uii-ic-hex">${u}</div></div><button class="uii-pcopy" style="display:flex">${IC.copy}</button></div>`;
  }

  function removePanel() {
    const host = document.getElementById(ROOT);
    if (host) {
      const rect = host.getBoundingClientRect();
      panelPos.x = rect.left; panelPos.y = rect.top;
      host.remove();
    }
    shadow = null;
    revertAllColors();
    clearDims(); stopPick(); clearColorHighlights();
    document.querySelectorAll('.uii-cls-highlight').forEach(e=>e.remove());
    stopMarkup();
    auditData = null;
    seoData = null;
  }

  /* ══════════════════════════════════════════════════════
     MARKUP MODE — annotate the page with shapes & text
     ══════════════════════════════════════════════════════ */
  const MK_SVG_NS = 'http://www.w3.org/2000/svg';

  /* ── Capture storage ─────────────────────────────────── */
  function loadCaptures() {
    return new Promise(resolve => {
      try {
        chrome.storage.local.get([MK_CAP_KEY], result => {
          markupCaptures = Array.isArray(result?.[MK_CAP_KEY]) ? result[MK_CAP_KEY] : [];
          markupCapturesLoaded = true;
          resolve(markupCaptures);
        });
      } catch (e) { markupCapturesLoaded = true; resolve([]); }
    });
  }

  function persistCaptures() {
    try { chrome.storage.local.set({ [MK_CAP_KEY]: markupCaptures }); } catch (e) {}
  }

  function addCapture(dataUrl) {
    const entry = { id: 'cap_' + Date.now() + '_' + Math.random().toString(36).slice(2,8), timestamp: Date.now(), dataUrl };
    markupCaptures.unshift(entry);
    if (markupCaptures.length > MK_CAP_LIMIT) markupCaptures.length = MK_CAP_LIMIT;
    persistCaptures();
    return entry;
  }

  function deleteCapture(id) {
    markupCaptures = markupCaptures.filter(c => c.id !== id);
    persistCaptures();
  }

  function clearAllCaptures() {
    markupCaptures = [];
    persistCaptures();
  }

  function startMarkup() {
    if (markupActive) return;
    markupActive = true;

    // Show inspector panel with the markup view by default
    markupInspectorVisible = true;
    if (!markupCapturesLoaded) loadCaptures().then(() => { if (markupActive) render(); });

    // Re-render the panel so it shows the markup view
    render();
    applyInspectorVisibility();

    buildMarkupSvg();
    buildMarkupToolbar();
    document.addEventListener('keydown', onMarkupKey, true);
    window.addEventListener('resize', resizeMarkupSvg);
  }

  function applyInspectorVisibility() {
    const host = document.getElementById(ROOT);
    if (!host) return;
    // The :host rule in content.css uses `display: flex !important`, so we must
    // match that importance to actually hide the panel.
    if (markupInspectorVisible) {
      host.style.removeProperty('display');
    } else {
      host.style.setProperty('display', 'none', 'important');
    }
  }

  function toggleMarkupInspector() {
    markupInspectorVisible = !markupInspectorVisible;
    applyInspectorVisibility();
    renderMarkupToolbar();
  }

  function stopMarkup() {
    if (!markupActive) return;
    markupActive = false;
    if (markupSvg) {
      markupSvg.remove();
      markupSvg = null;
    }
    if (markupTbHost) {
      markupTbHost.remove();
      markupTbHost = null;
      markupTbShadow = null;
    }
    if (markupTextEditor) {
      markupTextEditor.remove();
      markupTextEditor = null;
    }
    markupCurrent = null;
    markupStart = null;
    document.removeEventListener('keydown', onMarkupKey, true);
    window.removeEventListener('resize', resizeMarkupSvg);

    // Restore inspector panel and re-render normal view
    const host = document.getElementById(ROOT);
    if (host) host.style.removeProperty('display');
    markupInspectorVisible = false;
    if (host) render();
  }

  function onMarkupKey(e) {
    if (e.key === 'Escape') {
      if (markupTextEditor) finalizeTextEditor(false);
      else stopMarkup();
    }
  }

  function resizeMarkupSvg() {
    if (!markupSvg) return;
    const w = Math.max(document.documentElement.scrollWidth, window.innerWidth);
    const h = Math.max(document.documentElement.scrollHeight, window.innerHeight);
    markupSvg.setAttribute('width', w);
    markupSvg.setAttribute('height', h);
    markupSvg.style.width = w + 'px';
    markupSvg.style.height = h + 'px';
  }

  function buildMarkupSvg() {
    const w = Math.max(document.documentElement.scrollWidth, window.innerWidth);
    const h = Math.max(document.documentElement.scrollHeight, window.innerHeight);
    const svg = document.createElementNS(MK_SVG_NS, 'svg');
    svg.id = MK_SVG_ID;
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    svg.style.cssText = `position:absolute;top:0;left:0;width:${w}px;height:${h}px;z-index:2147483640;pointer-events:auto;cursor:crosshair;`;

    // Reusable arrowhead marker
    const defs = document.createElementNS(MK_SVG_NS, 'defs');
    defs.innerHTML = `<marker id="uii-mk-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="context-stroke"/></marker>`;
    svg.appendChild(defs);

    svg.addEventListener('mousedown', onMarkupDown);
    svg.addEventListener('mousemove', onMarkupMove);
    svg.addEventListener('mouseup', onMarkupUp);
    svg.addEventListener('mouseleave', onMarkupUp);

    document.body.appendChild(svg);
    markupSvg = svg;
  }

  function svgCoords(e) {
    // Convert clientX/Y into document coordinates (matches the SVG, which is positioned
    // at document top-left).
    return { x: e.clientX + window.scrollX, y: e.clientY + window.scrollY };
  }

  function onMarkupDown(e) {
    if (!markupSvg) return;
    if (e.target.classList && e.target.classList.contains('uii-mk-text-input')) return;
    if (markupTextEditor) finalizeTextEditor(true);

    const { x, y } = svgCoords(e);
    markupStart = { x, y };

    if (markupTool === 'text') {
      showTextEditor(x, y);
      return;
    }

    const stroke = markupColor;
    const sw = markupStrokeWidth;
    let el;
    if (markupTool === 'pencil') {
      el = document.createElementNS(MK_SVG_NS, 'path');
      markupPath = `M ${x} ${y}`;
      el.setAttribute('d', markupPath);
      el.setAttribute('fill', 'none');
      el.setAttribute('stroke-linecap', 'round');
      el.setAttribute('stroke-linejoin', 'round');
    } else if (markupTool === 'rect') {
      el = document.createElementNS(MK_SVG_NS, 'rect');
      el.setAttribute('x', x); el.setAttribute('y', y);
      el.setAttribute('width', 0); el.setAttribute('height', 0);
      el.setAttribute('fill', 'none');
    } else if (markupTool === 'ellipse') {
      el = document.createElementNS(MK_SVG_NS, 'ellipse');
      el.setAttribute('cx', x); el.setAttribute('cy', y);
      el.setAttribute('rx', 0); el.setAttribute('ry', 0);
      el.setAttribute('fill', 'none');
    } else if (markupTool === 'arrow') {
      el = document.createElementNS(MK_SVG_NS, 'line');
      el.setAttribute('x1', x); el.setAttribute('y1', y);
      el.setAttribute('x2', x); el.setAttribute('y2', y);
      el.setAttribute('marker-end', 'url(#uii-mk-arrow)');
      el.setAttribute('stroke-linecap', 'round');
    } else return;

    el.setAttribute('stroke', stroke);
    el.setAttribute('stroke-width', sw);
    el.classList.add('uii-mk-shape');
    markupSvg.appendChild(el);
    markupCurrent = el;
    e.preventDefault();
  }

  function onMarkupMove(e) {
    if (!markupCurrent || !markupStart) return;
    const { x, y } = svgCoords(e);
    const sx = markupStart.x, sy = markupStart.y;

    if (markupTool === 'pencil') {
      markupPath += ` L ${x} ${y}`;
      markupCurrent.setAttribute('d', markupPath);
    } else if (markupTool === 'rect') {
      const rx = Math.min(sx, x), ry = Math.min(sy, y);
      markupCurrent.setAttribute('x', rx);
      markupCurrent.setAttribute('y', ry);
      markupCurrent.setAttribute('width', Math.abs(x - sx));
      markupCurrent.setAttribute('height', Math.abs(y - sy));
    } else if (markupTool === 'ellipse') {
      const cx = (sx + x) / 2, cy = (sy + y) / 2;
      markupCurrent.setAttribute('cx', cx);
      markupCurrent.setAttribute('cy', cy);
      markupCurrent.setAttribute('rx', Math.abs(x - sx) / 2);
      markupCurrent.setAttribute('ry', Math.abs(y - sy) / 2);
    } else if (markupTool === 'arrow') {
      markupCurrent.setAttribute('x2', x);
      markupCurrent.setAttribute('y2', y);
    }
  }

  function onMarkupUp() {
    if (markupCurrent) {
      // Discard zero-size shapes
      if (markupTool === 'rect') {
        const w = parseFloat(markupCurrent.getAttribute('width'));
        const h = parseFloat(markupCurrent.getAttribute('height'));
        if (w < 3 && h < 3) markupCurrent.remove();
      } else if (markupTool === 'ellipse') {
        const rx = parseFloat(markupCurrent.getAttribute('rx'));
        const ry = parseFloat(markupCurrent.getAttribute('ry'));
        if (rx < 3 && ry < 3) markupCurrent.remove();
      } else if (markupTool === 'arrow') {
        const dx = parseFloat(markupCurrent.getAttribute('x2')) - parseFloat(markupCurrent.getAttribute('x1'));
        const dy = parseFloat(markupCurrent.getAttribute('y2')) - parseFloat(markupCurrent.getAttribute('y1'));
        if (Math.hypot(dx, dy) < 5) markupCurrent.remove();
      }
    }
    markupCurrent = null;
    markupStart = null;
  }

  function showTextEditor(x, y) {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'uii-mk-text-input';
    input.placeholder = 'Type and press Enter';
    input.style.cssText = `position:absolute;top:${y}px;left:${x}px;z-index:2147483641;border:2px dashed ${markupColor};background:rgba(255,255,255,.95);color:#1a1a2e;font:${markupFontSize}px/1.2 'Inter',sans-serif;padding:2px 6px;border-radius:4px;outline:none;min-width:140px;`;
    document.body.appendChild(input);
    setTimeout(() => input.focus(), 0);
    markupTextEditor = input;

    const commit = () => finalizeTextEditor(true);
    const cancel = () => finalizeTextEditor(false);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); commit(); }
      else if (e.key === 'Escape') { e.preventDefault(); cancel(); }
      e.stopPropagation();
    });
    input.addEventListener('blur', commit);
  }

  function finalizeTextEditor(commit) {
    if (!markupTextEditor) return;
    const value = markupTextEditor.value.trim();
    const rect = markupTextEditor.getBoundingClientRect();
    const x = rect.left + window.scrollX + 6;
    const y = rect.top + window.scrollY + parseInt(getComputedStyle(markupTextEditor).fontSize, 10);
    const fontSize = parseInt(getComputedStyle(markupTextEditor).fontSize, 10);
    const color = markupColor;
    markupTextEditor.remove();
    markupTextEditor = null;
    if (!commit || !value || !markupSvg) return;
    const t = document.createElementNS(MK_SVG_NS, 'text');
    t.setAttribute('x', x); t.setAttribute('y', y);
    t.setAttribute('fill', color);
    t.setAttribute('font-family', "'Inter',-apple-system,sans-serif");
    t.setAttribute('font-size', fontSize);
    t.setAttribute('font-weight', '600');
    t.classList.add('uii-mk-shape');
    t.classList.add('uii-mk-text');
    t.style.cursor = 'move';
    t.style.userSelect = 'none';
    t.textContent = value;
    t.addEventListener('mousedown', startTextDrag);
    t.addEventListener('dblclick', startTextEdit);
    markupSvg.appendChild(t);
  }

  function startTextDrag(e) {
    e.stopPropagation();
    e.preventDefault();
    const text = e.currentTarget;
    const startCX = e.clientX, startCY = e.clientY;
    const origX = parseFloat(text.getAttribute('x'));
    const origY = parseFloat(text.getAttribute('y'));
    let moved = false;
    const onMove = (ev) => {
      moved = true;
      text.setAttribute('x', origX + (ev.clientX - startCX));
      text.setAttribute('y', origY + (ev.clientY - startCY));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove, true);
      document.removeEventListener('mouseup', onUp, true);
    };
    document.addEventListener('mousemove', onMove, true);
    document.addEventListener('mouseup', onUp, true);
  }

  function startTextEdit(e) {
    e.stopPropagation();
    e.preventDefault();
    const text = e.currentTarget;
    const x = parseFloat(text.getAttribute('x'));
    const fontSize = parseInt(text.getAttribute('font-size'), 10) || 16;
    const y = parseFloat(text.getAttribute('y')) - fontSize;
    const oldValue = text.textContent;
    const color = text.getAttribute('fill') || markupColor;
    text.remove();
    // Reuse the existing editor at that location, seeded with the old value
    const tool = markupTool;
    markupTool = 'text';
    const prevColor = markupColor;
    markupColor = color;
    showTextEditor(x, y);
    if (markupTextEditor) markupTextEditor.value = oldValue;
    markupColor = prevColor;
    markupTool = tool;
  }

  function clearMarkup() {
    if (!markupSvg) return;
    markupSvg.querySelectorAll('.uii-mk-shape').forEach(e => e.remove());
  }

  function undoLastShape() {
    if (!markupSvg) return;
    const shapes = markupSvg.querySelectorAll('.uii-mk-shape');
    if (shapes.length) shapes[shapes.length - 1].remove();
  }

  async function captureMarkup() {
    // Detach both the toolbar and the inspector panel from the DOM so they
    // cannot possibly appear in the screenshot. Re-attach them after.
    const tbHost = markupTbHost;
    const tbParent = tbHost?.parentNode;
    const tbNext = tbHost?.nextSibling;
    if (tbHost) tbHost.remove();

    const panelHost = document.getElementById(ROOT);
    const panelParent = panelHost?.parentNode;
    const panelNext = panelHost?.nextSibling;
    const panelWasVisible = panelHost && getComputedStyle(panelHost).display !== 'none';
    if (panelHost) panelHost.remove();

    // Wait for the browser to paint without the extension UI before sampling.
    await new Promise(r => setTimeout(r, 80));
    try {
      const resp = await new Promise(resolve => {
        chrome.runtime.sendMessage({ action: 'capture-tab' }, resolve);
      });
      if (!resp || resp.error || !resp.dataUrl) {
        toast(resp?.error ? 'Capture failed: ' + resp.error : 'Capture failed');
        return;
      }
      const blob = await (await fetch(resp.dataUrl)).blob();
      let clipboardOk = true;
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      } catch (e) { clipboardOk = false; }
      addCapture(resp.dataUrl);
      toast(clipboardOk ? 'Screenshot copied & saved' : 'Saved (clipboard unavailable)');
    } catch (err) {
      toast('Capture failed');
    } finally {
      // Re-attach the panel exactly where it was, preserving prior visibility.
      if (panelHost && panelParent) {
        if (panelNext && panelNext.parentNode === panelParent) panelParent.insertBefore(panelHost, panelNext);
        else panelParent.appendChild(panelHost);
        if (panelWasVisible) panelHost.style.removeProperty('display');
        else panelHost.style.setProperty('display', 'none', 'important');
      }
      // Re-attach the markup toolbar.
      if (tbHost && tbParent) {
        if (tbNext && tbNext.parentNode === tbParent) tbParent.insertBefore(tbHost, tbNext);
        else tbParent.appendChild(tbHost);
      }
      // Refresh panel so the new capture appears in the gallery.
      if (markupActive) render();
    }
  }

  /* ── Markup toolbar (shadow DOM) ────────────────────── */
  function buildMarkupToolbar() {
    const host = document.createElement('div');
    host.id = MK_TB_ID;
    host.style.cssText = 'position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:2147483647;';
    document.body.appendChild(host);
    markupTbHost = host;
    markupTbShadow = host.attachShadow({ mode: 'open' });
    renderMarkupToolbar();
  }

  function renderMarkupToolbar() {
    if (!markupTbShadow) return;
    const tools = [
      { id: 'pencil',  icon: IC.pencil,    label: 'Pencil' },
      { id: 'rect',    icon: IC.rect,      label: 'Rectangle' },
      { id: 'ellipse', icon: IC.ellipse,   label: 'Ellipse' },
      { id: 'arrow',   icon: IC.arrow,     label: 'Arrow' },
      { id: 'text',    icon: IC.textIcon,  label: 'Text' },
    ];
    const widths = [2, 4, 7];

    const css = `
      :host { all: initial; }
      * { box-sizing: border-box; font-family: 'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; }
      .tb {
        display: flex; align-items: center; gap: 6px;
        background: #1a1a2e; padding: 6px 8px; border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,.25), 0 0 0 1px rgba(255,255,255,.05);
        user-select: none;
      }
      .group { display: flex; align-items: center; gap: 2px; }
      .divider { width: 1px; height: 22px; background: rgba(255,255,255,.12); margin: 0 4px; }
      button {
        width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
        border: none; background: transparent; color: #cfcfe0; cursor: pointer; border-radius: 7px;
        transition: background .12s, color .12s; padding: 0;
      }
      button:hover { background: rgba(255,255,255,.08); color: #fff; }
      button.on { background: rgba(255,255,255,.14); color: #fff; }
      button svg { width: 18px; height: 18px; fill: currentColor; pointer-events: none; }
      .swatch {
        width: 22px; height: 22px; border-radius: 50%;
        border: 2px solid transparent; cursor: pointer; padding: 0;
        background-clip: content-box; transition: transform .1s, border-color .12s;
      }
      .swatch:hover { transform: scale(1.1); }
      .swatch.on { border-color: #fff; }
      .swatch.light { box-shadow: inset 0 0 0 1px rgba(0,0,0,.2); }
      .wpill {
        width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;
        border: none; background: transparent; border-radius: 6px; cursor: pointer;
      }
      .wpill:hover { background: rgba(255,255,255,.08); }
      .wpill.on { background: rgba(255,255,255,.14); }
      .wpill .dot { display: block; background: #cfcfe0; border-radius: 50%; }
      .wpill.on .dot { background: #fff; }
      .wpill .num { font-size: 11px; font-weight: 600; color: #cfcfe0; line-height: 1; }
      .wpill.on .num { color: #fff; }
      .fpill { width: 30px; }
      .fsize-input {
        width: 48px; height: 26px; margin-left: 4px;
        background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.10);
        border-radius: 6px; color: #fff; font-size: 11px; font-weight: 600;
        text-align: center; padding: 0 4px; font-family: inherit; outline: none;
      }
      .fsize-input:focus { border-color: rgba(255,255,255,.4); background: rgba(255,255,255,.10); }
      .fsize-input::-webkit-inner-spin-button { -webkit-appearance: none; appearance: none; margin: 0; }
      .label {
        font-size: 10px; color: rgba(255,255,255,.45); padding: 0 6px; letter-spacing: .3px;
        text-transform: uppercase; font-weight: 600;
      }
    `;

    let h = `<style>${css}</style><div class="tb">`;
    // Tools
    h += `<div class="group">`;
    tools.forEach(t => {
      h += `<button data-tool="${t.id}" class="${markupTool === t.id ? 'on' : ''}" title="${t.label}">${t.icon}</button>`;
    });
    h += `</div><div class="divider"></div>`;
    // Colors
    h += `<div class="group">`;
    MK_COLORS.forEach(c => {
      const light = (c === '#FFFFFF') ? ' light' : '';
      h += `<button class="swatch${markupColor === c ? ' on' : ''}${light}" data-color="${c}" style="background:${c}" title="${c}"></button>`;
    });
    h += `</div><div class="divider"></div>`;
    // Stroke width or font size, depending on tool
    h += `<div class="group">`;
    if (markupTool === 'text') {
      MK_FONT_PRESETS.forEach(s => {
        h += `<button class="wpill fpill ${markupFontSize === s ? 'on' : ''}" data-fontsize="${s}" title="${s}px"><span class="num">${s}</span></button>`;
      });
      h += `<input type="number" class="fsize-input" data-fontsize-custom value="${markupFontSize}" min="4" max="200" step="1" title="Custom font size">`;
    } else {
      widths.forEach(w => {
        const dot = Math.min(14, w + 3);
        h += `<button class="wpill ${markupStrokeWidth === w ? 'on' : ''}" data-width="${w}" title="${w}px"><span class="dot" style="width:${dot}px;height:${dot}px"></span></button>`;
      });
    }
    h += `</div><div class="divider"></div>`;
    // Actions
    h += `<div class="group">`;
    const eyeIcon = markupInspectorVisible ? IC.eyeOff : IC.eye;
    const eyeTitle = markupInspectorVisible ? 'Hide Inspector panel' : 'Show Inspector panel';
    h += `<button data-act="toggle-inspector" class="${markupInspectorVisible ? 'on' : ''}" title="${eyeTitle}">${eyeIcon}</button>`;
    h += `<button data-act="undo" title="Undo last (Ctrl+Z)"><svg viewBox="0 0 24 24"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62a7.97 7.97 0 0 1 5.12-1.88c3.54 0 6.55 2.31 7.6 5.5l2.37-.78A9.991 9.991 0 0 0 12.5 8z" fill="currentColor"/></svg></button>`;
    h += `<button data-act="clear" title="Clear all">${IC.trash}</button>`;
    h += `<button data-act="capture" title="Copy screenshot to clipboard">${IC.camera}</button>`;
    h += `<button data-act="close" title="Exit markup (Esc)">${IC.close}</button>`;
    h += `</div></div>`;

    markupTbShadow.innerHTML = h;
    bindMarkupToolbar();
  }

  function bindMarkupToolbar() {
    if (!markupTbShadow) return;
    markupTbShadow.querySelectorAll('[data-tool]').forEach(b => b.addEventListener('click', () => {
      markupTool = b.dataset.tool;
      if (markupSvg) markupSvg.style.cursor = markupTool === 'text' ? 'text' : 'crosshair';
      renderMarkupToolbar();
      if (markupActive && markupInspectorVisible) render();
    }));
    markupTbShadow.querySelectorAll('[data-color]').forEach(b => b.addEventListener('click', () => {
      markupColor = b.dataset.color;
      renderMarkupToolbar();
      if (markupActive && markupInspectorVisible) render();
    }));
    markupTbShadow.querySelectorAll('[data-width]').forEach(b => b.addEventListener('click', () => {
      markupStrokeWidth = parseInt(b.dataset.width, 10);
      renderMarkupToolbar();
      if (markupActive && markupInspectorVisible) render();
    }));
    markupTbShadow.querySelectorAll('[data-fontsize]').forEach(b => b.addEventListener('click', () => {
      markupFontSize = parseInt(b.dataset.fontsize, 10);
      renderMarkupToolbar();
      if (markupActive && markupInspectorVisible) render();
    }));
    const fsCustom = markupTbShadow.querySelector('[data-fontsize-custom]');
    if (fsCustom) {
      // applyValue(silent=true) updates markupFontSize without re-rendering — used on
      // every keystroke so the value is always current when the user clicks the canvas.
      // applyValue(false) re-renders the toolbar/panel and surfaces validation errors.
      const applyValue = (silent) => {
        const v = parseInt(fsCustom.value, 10);
        if (!isNaN(v) && v >= 4 && v <= 200) {
          markupFontSize = v;
          if (!silent) {
            renderMarkupToolbar();
            if (markupActive && markupInspectorVisible) render();
          }
          return true;
        }
        if (!silent) {
          fsCustom.value = String(markupFontSize);
          toast('Font size must be 4–200 px');
        }
        return false;
      };
      fsCustom.addEventListener('input', () => applyValue(true));
      fsCustom.addEventListener('change', () => applyValue(false));
      fsCustom.addEventListener('blur', () => applyValue(false));
      fsCustom.addEventListener('keydown', e => {
        e.stopPropagation();
        if (e.key === 'Enter') { e.preventDefault(); applyValue(false); fsCustom.blur(); }
      });
      fsCustom.addEventListener('click', e => e.stopPropagation());
    }
    markupTbShadow.querySelectorAll('[data-act="toggle-inspector"]').forEach(b => b.addEventListener('click', toggleMarkupInspector));
    markupTbShadow.querySelectorAll('[data-act="undo"]').forEach(b => b.addEventListener('click', undoLastShape));
    markupTbShadow.querySelectorAll('[data-act="clear"]').forEach(b => b.addEventListener('click', clearMarkup));
    markupTbShadow.querySelectorAll('[data-act="capture"]').forEach(b => b.addEventListener('click', captureMarkup));
    markupTbShadow.querySelectorAll('[data-act="close"]').forEach(b => b.addEventListener('click', stopMarkup));
  }

  /* ── Events ──────────────────────────────────────────── */
  function bind(root) {
    root.querySelectorAll('[data-act="close"]').forEach(b=>b.addEventListener('click',()=>removePanel()));
    root.querySelectorAll('[data-act="markup"]').forEach(b=>b.addEventListener('click',()=>{ stopPick(); startMarkup(); }));
    root.querySelectorAll('[data-act="exit-markup"]').forEach(b=>b.addEventListener('click',()=>stopMarkup()));
    root.querySelectorAll('[data-act="mk-capture"]').forEach(b=>b.addEventListener('click',()=>captureMarkup()));
    root.querySelectorAll('[data-act="mk-clear-canvas"]').forEach(b=>b.addEventListener('click',()=>clearMarkup()));
    root.querySelectorAll('[data-act="mk-clear-captures"]').forEach(b=>b.addEventListener('click',()=>{ clearAllCaptures(); render(); }));
    root.querySelectorAll('[data-act="mk-preview"]').forEach(b=>b.addEventListener('click',()=>previewCapture(b.dataset.capId)));
    root.querySelectorAll('[data-act="mk-cap-copy"]').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); copyCapture(b.dataset.capId); }));
    root.querySelectorAll('[data-act="mk-cap-download"]').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); downloadCapture(b.dataset.capId); }));
    root.querySelectorAll('[data-act="mk-cap-delete"]').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); deleteCapture(b.dataset.capId); render(); }));
    root.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{ tab=b.dataset.tab; if(tab==='inspector'){render();startPick();} else{stopPick();render();} }));
    root.querySelectorAll('[data-act="pick"]').forEach(b=>b.addEventListener('click',()=>startPick()));
    root.querySelectorAll('[data-act="back-insp"]').forEach(b=>b.addEventListener('click',()=>{tab='inspector';render();startPick();}));
    root.querySelectorAll('[data-act="copy-json"]').forEach(b=>b.addEventListener('click',()=>{
      if(!inspected) return;
      const cs=getComputedStyle(inspected);
      cp(JSON.stringify({element:inspected.tagName.toLowerCase()+(inspected.id?'#'+inspected.id:'')+Array.from(inspected.classList).filter(c=>!c.startsWith('uii-')).map(c=>'.'+c).join(''),type:etype(inspected.tagName.toLowerCase()),text:{fontFamily:cs.fontFamily,fontSize:cs.fontSize,lineHeight:cs.lineHeight,fontWeight:wname(cs.fontWeight),letterSpacing:cs.letterSpacing,color:up(hex(cs.color))},layout:{display:cs.display,position:cs.position,width:cs.width,height:cs.height},spacing:{margin:cs.margin,padding:cs.padding},decoration:{border:cs.borderStyle!=='none'?`${cs.borderWidth} ${cs.borderStyle} ${up(hex(cs.borderColor))}`:'none',borderRadius:cs.borderRadius,boxShadow:cs.boxShadow,background:up(hex(cs.backgroundColor))}},null,2));
    }));
    root.querySelectorAll('[data-act="export-colors"]').forEach(b=>b.addEventListener('click',()=>{
      const out = {}; sorted(data.colors,200).forEach(([c,n])=>{ const sw=colorSwaps.get(c); out[sw?sw.newHex:c]=n; });
      cp(JSON.stringify(out,null,2));
    }));
    // Color pickers — native input inside shadow DOM, label click opens it
    root.querySelectorAll('.uii-color-input').forEach(inp => {
      const getAlpha = () => { const sl = inp.closest('.uii-cb-controls')?.querySelector('.uii-alpha-slider'); return sl ? parseInt(sl.value) : 255; };
      const withAlpha = (h,a) => a<255 ? h + a.toString(16).padStart(2,'0') : h;
      inp.addEventListener('input', e => { e.stopPropagation(); swapColor(inp.dataset.orig, withAlpha(e.target.value, getAlpha())); });
      inp.addEventListener('change', e => { e.stopPropagation(); swapColor(inp.dataset.orig, withAlpha(e.target.value, getAlpha())); render(); });
      inp.addEventListener('click', e => e.stopPropagation());
    });
    // Alpha sliders
    root.querySelectorAll('.uii-alpha-slider').forEach(sl => {
      const getHex = () => { const inp = sl.closest('.uii-cb-controls')?.querySelector('.uii-color-input'); return inp ? inp.value : '#000000'; };
      const withAlpha = (h,a) => a<255 ? h + a.toString(16).padStart(2,'0') : h;
      sl.addEventListener('input', e => { e.stopPropagation(); const a=parseInt(e.target.value); sl.title=`Alpha: ${Math.round(a/255*100)}%`; swapColor(sl.dataset.orig, withAlpha(getHex(), a)); });
      sl.addEventListener('change', e => { e.stopPropagation(); swapColor(sl.dataset.orig, withAlpha(getHex(), parseInt(e.target.value))); render(); });
    });
    root.querySelectorAll('[data-reset]').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); revertColor(b.dataset.reset); render(); }));
    root.querySelectorAll('[data-act="reset-colors"]').forEach(b=>b.addEventListener('click',()=>{ revertAllColors(); render(); }));
    // Color highlight toggle
    root.querySelectorAll('[data-act="toggle-color-highlight"]').forEach(b => b.addEventListener('click', () => {
      colorHighlightMode = !colorHighlightMode;
      if (!colorHighlightMode) clearColorHighlights();
      render();
    }));
    // Color highlight on hover — palette dots (overview) and color bands (colors tab)
    root.querySelectorAll('.uii-palette-dot[data-color]').forEach(dot => {
      dot.addEventListener('mouseenter', () => { if (colorHighlightMode) highlightColorOnPage(dot.dataset.color); });
      dot.addEventListener('mouseleave', () => { if (colorHighlightMode) clearColorHighlights(); });
      dot.addEventListener('click', () => { navigator.clipboard.writeText(up(dot.dataset.color)); toast('Copied'); });
    });
    root.querySelectorAll('.uii-color-band[data-color]').forEach(band => {
      band.addEventListener('mouseenter', () => { if (colorHighlightMode) highlightColorOnPage(band.dataset.color); });
      band.addEventListener('mouseleave', () => { if (colorHighlightMode) clearColorHighlights(); });
    });
    root.querySelectorAll('.uii-cb-toggle[data-toggle-color]').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); toggleColor(btn.dataset.toggleColor); render(); });
    });
    root.querySelectorAll('.uii-copy-prompt-btn').forEach(b=>b.addEventListener('click',()=>{ cp(b.dataset.prompt); }));
    // Audit tab events
    root.querySelectorAll('[data-act="run-audit"]').forEach(b=>b.addEventListener('click',async()=>{ auditData='loading'; render(); await runAudit(); render(); }));
    root.querySelectorAll('[data-act="highlight-cls"]').forEach(b=>b.addEventListener('click',()=>{
      document.querySelectorAll('.uii-cls-highlight').forEach(e=>e.remove());
      if(!auditData) return;
      auditData.clsCulprits.forEach(c=>{ if(!c.el) return; const r=c.el.getBoundingClientRect(); const d=document.createElement('div'); d.className='uii-cls-highlight'; d.style.cssText=`position:absolute;top:${r.top+window.scrollY}px;left:${r.left+window.scrollX}px;width:${r.width}px;height:${r.height}px;border:2px dashed #dc2626;background:rgba(239,68,68,.08);z-index:2147483645;pointer-events:none;border-radius:3px;`; document.body.appendChild(d); });
    }));
    root.querySelectorAll('[data-act="copy-unused-css"]').forEach(b=>b.addEventListener('click',()=>{
      if(!auditData) return; cp(auditData.unusedCSS.map(r=>`/* ${r.sheet} */\n${r.ruleText}`).join('\n\n'));
    }));
    root.querySelectorAll('[data-act="copy-rule"]').forEach(b=>b.addEventListener('click',()=>{ cp(b.dataset.rule); }));
    root.querySelectorAll('[data-act="copy-full-audit"]').forEach(b=>b.addEventListener('click',()=>{ if(auditData) cp(buildFullAuditPrompt(auditData)); }));
    root.querySelectorAll('[data-act="copy-cls-prompt"]').forEach(b=>b.addEventListener('click',()=>{ if(auditData) cp(buildCLSPrompt(auditData)); }));
    root.querySelectorAll('[data-act="copy-img-prompt"]').forEach(b=>b.addEventListener('click',()=>{ if(auditData) cp(buildImagePrompt(auditData)); }));
    root.querySelectorAll('[data-act="copy-css-prompt"]').forEach(b=>b.addEventListener('click',()=>{ if(auditData) cp(buildCSSPrompt(auditData)); }));
    root.querySelectorAll('[data-act="copy-a11y-prompt"]').forEach(b=>b.addEventListener('click',()=>{ if(auditData) cp(buildA11yPrompt(auditData)); }));
    root.querySelectorAll('[data-act="copy-a11y-issue"]').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); cp(b.dataset.prompt); }));
    root.querySelectorAll('[data-act="copy-a11y-group"]').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); cp(b.dataset.prompt); }));
    root.querySelectorAll('[data-act="copy-spacing-prompt"]').forEach(b=>b.addEventListener('click',()=>{ if(auditData) cp(buildSpacingPrompt(auditData)); }));
    // Layout tab events
    root.querySelectorAll('[data-act="run-layout"]').forEach(b=>b.addEventListener('click',async()=>{
      document.querySelectorAll('.uii-layout-highlight').forEach(e=>e.remove());
      layoutData='loading'; render();
      await new Promise(r=>setTimeout(r,120));
      layoutData = scanLayoutOverflow();
      render();
    }));
    root.querySelectorAll('[data-act="copy-layout-prompt"]').forEach(b=>b.addEventListener('click',()=>{ if(layoutData && layoutData!=='loading') cp(buildLayoutPrompt(layoutData)); }));
    root.querySelectorAll('[data-act="highlight-layout"]').forEach(b=>b.addEventListener('click',()=>{
      document.querySelectorAll('.uii-layout-highlight').forEach(e=>e.remove());
      if(!layoutData || layoutData==='loading') return;
      layoutData.culprits.forEach(c=>{ if(!c.el) return; const r=c.el.getBoundingClientRect(); const d=document.createElement('div'); d.className='uii-layout-highlight'; d.style.cssText=`position:absolute;top:${r.top+window.scrollY}px;left:${r.left+window.scrollX}px;width:${r.width}px;height:${r.height}px;border:2px dashed #dc2626;background:rgba(239,68,68,.06);z-index:2147483645;pointer-events:none;border-radius:3px;`; document.body.appendChild(d); });
      setTimeout(()=>document.querySelectorAll('.uii-layout-highlight').forEach(e=>e.remove()), 4000);
    }));
    root.querySelectorAll('.uii-layout-row[data-layout-idx]').forEach(row=>row.addEventListener('click',()=>{
      if(!layoutData || layoutData==='loading') return;
      const idx = parseInt(row.dataset.layoutIdx);
      const c = layoutData.culprits[idx];
      if(c && c.el) c.el.scrollIntoView({behavior:'smooth',block:'center'});
    }));
    // SEO tab events
    root.querySelectorAll('[data-act="copy-seo-prompt"]').forEach(b=>b.addEventListener('click',()=>{ if(seoData) cp(buildSEOPrompt(seoData)); }));
    root.querySelectorAll('[data-act="rescan-seo"]').forEach(b=>b.addEventListener('click',()=>{ seoData = 'loading'; render(); setTimeout(()=>{ seoData = null; render(); }, 600); }));
    root.querySelectorAll('.uii-seo-group-copy').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); cp(b.dataset.prompt); }));
    root.querySelectorAll('.uii-seo-issue-copy').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); cp(b.dataset.prompt); }));
    root.querySelectorAll('[data-act="export-tokens-mui"]').forEach(b=>b.addEventListener('click',()=>{ cp(exportTokensMUI()); }));
    root.querySelectorAll('[data-act="export-tokens-css"]').forEach(b=>b.addEventListener('click',()=>{ cp(exportTokensCSS()); }));
    root.querySelectorAll('[data-act="export-tokens-tailwind"]').forEach(b=>b.addEventListener('click',()=>{ cp(exportTokensTailwind()); }));
    root.querySelectorAll('[data-act="export-tokens-json"]').forEach(b=>b.addEventListener('click',()=>{ cp(exportTokensJSON()); }));
    root.querySelectorAll('[data-act="goto-img"]').forEach(b=>b.addEventListener('click',()=>{
      const idx=parseInt(b.dataset.idx); const img=auditData?.images[idx]?.el; if(img) img.scrollIntoView({behavior:'smooth',block:'center'});
    }));
    root.querySelectorAll('[data-cview]').forEach(b=>b.addEventListener('click',()=>{ colorView=b.dataset.cview; render(); }));
    root.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{assetView=b.dataset.view;render();}));
    root.querySelectorAll('[data-dl]').forEach(b=>b.addEventListener('click',e=>{
      e.stopPropagation(); const a=data.assets[parseInt(b.dataset.dl)]; if(!a) return;
      const l=document.createElement('a'); l.href=a.src; l.download=a.name||'asset'; document.body.appendChild(l); l.click(); l.remove();
    }));
    const escH = e => { if(e.key==='Escape'){removePanel();document.removeEventListener('keydown',escH);} };
    document.addEventListener('keydown',escH);
  }

  /* ── Hover Tooltip (Shadow DOM isolated) ─────────────── */
  const TT_ID = 'uii-tooltip';
  let ttShadow = null;

  const TT_CSS = `
    :host { position:fixed; z-index:2147483646; pointer-events:none; display:none; width:280px; }
    .tt { background:#fff; color:#333346; border-radius:12px; box-shadow:0 8px 32px rgba(0,0,0,.16),0 0 0 1px rgba(0,0,0,.06); font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; font-size:12.5px; line-height:1.5; padding:14px 16px; }
    .tt * { box-sizing:border-box; margin:0; padding:0; }
    .sel { font-size:14px; font-weight:700; color:#1a1a2e; margin-bottom:2px; word-break:break-all; line-height:1.35; }
    .dim { font-size:11.5px; color:#8888a0; margin-bottom:10px; font-family:'SF Mono','Fira Code','Cascadia Code',monospace; }
    .row { display:flex; align-items:center; padding:3.5px 0; }
    .key { width:94px; flex-shrink:0; font-size:12px; color:#8888a0; font-weight:500; }
    .val { flex:1; font-size:12.5px; color:#1a1a2e; font-weight:600; display:flex; align-items:center; gap:7px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
    .sw { width:18px; height:18px; border-radius:5px; border:1.5px solid rgba(0,0,0,.08); flex-shrink:0; display:inline-block; }
    .sw--light { border-color:rgba(0,0,0,.15); }
    .divider { height:1px; background:#ebebf0; margin:10px 0; }
    .cr { display:flex; align-items:center; padding:3.5px 0; gap:8px; }
    .cr-icon { width:26px; height:26px; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; flex-shrink:0; font-family:'Inter',sans-serif; }
    .cr-ratio { font-size:12.5px; color:#1a1a2e; font-weight:700; font-family:'SF Mono','Fira Code',monospace; }
    .badge { font-size:10.5px; font-weight:600; padding:3px 9px; border-radius:10px; display:inline-flex; align-items:center; gap:4px; line-height:1; }
    .badge svg { width:11px; height:11px; fill:currentColor; }
    .badge--excellent { background:rgba(34,197,94,.12); color:#16a34a; }
    .badge--pass { background:rgba(34,197,94,.12); color:#16a34a; }
    .badge--large { background:rgba(234,179,8,.12); color:#a16207; }
    .badge--poor { background:rgba(239,68,68,.10); color:#dc2626; }
  `;
  const checkSvg = '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>';
  const warnSvg = '<svg viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>';

  function showTooltip(el, mx, my) {
    // Create host + shadow if needed
    let host = document.getElementById(TT_ID);
    if (!host) {
      host = document.createElement('div');
      host.id = TT_ID;
      host.style.cssText = 'all:initial;position:fixed;z-index:2147483646;pointer-events:none;';
      document.body.appendChild(host);
      ttShadow = host.attachShadow({ mode: 'open' });
    }
    if (!ttShadow) ttShadow = host.shadowRoot;

    const cs = getComputedStyle(el);
    const tag = el.tagName.toLowerCase();
    const allCls = Array.from(el.classList).filter(c => !c.startsWith('uii-'));
    const sel = tag + (allCls.length ? '.' + allCls.slice(0, 3).join('.') : '');
    const r = el.getBoundingClientRect();
    const w = Math.round(r.width), h = Math.round(r.height);
    const tc = hex(cs.color), bgc = hex(cs.backgroundColor);
    const hasBg = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent';
    const ff = cs.fontFamily.split(',')[0].trim().replace(/['"]/g, '');
    const isLight = c => lum(c) > 0.85;

    // Contrast row
    let crHtml = '';
    if (tc.startsWith('#') && tc.length === 7) {
      // Find effective bg: walk up parents until we find a non-transparent bg
      let eBg = hasBg ? bgc : null;
      if (!eBg) {
        let p = el.parentElement;
        while (p) {
          const pBg = getComputedStyle(p).backgroundColor;
          if (pBg && pBg !== 'rgba(0, 0, 0, 0)' && pBg !== 'transparent') { eBg = hex(pBg); break; }
          p = p.parentElement;
        }
      }
      if (eBg && eBg.startsWith('#') && eBg.length === 7) {
        const ratio = parseFloat(contrastRatio(tc, eBg));
        let label, cls2, icon;
        if (ratio >= 7) { label = 'Excellent'; cls2 = 'excellent'; icon = checkSvg; }
        else if (ratio >= 4.5) { label = 'AA Pass'; cls2 = 'pass'; icon = checkSvg; }
        else if (ratio >= 3) { label = 'AA Large'; cls2 = 'large'; icon = warnSvg; }
        else { label = 'Poor'; cls2 = 'poor'; icon = warnSvg; }
        crHtml = `<div class="divider"></div>
          <div class="cr">
            <span class="key">Contrast</span>
            <div class="cr-icon" style="background:${eBg};color:${tc}">Aa</div>
            <span class="cr-ratio">${ratio.toFixed(2)}</span>
            <span class="badge badge--${cls2}">${icon} ${label}</span>
          </div>`;
      }
    }

    const rowHtml = (k, v) => `<div class="row"><span class="key">${k}</span><span class="val">${v}</span></div>`;
    const swatchRow = (k, color) => {
      const light = isLight(color) ? ' sw--light' : '';
      return `<div class="row"><span class="key">${k}</span><span class="val"><span class="sw${light}" style="background:${color}"></span>${up(color)}</span></div>`;
    };

    const inner = `
      <div class="sel">${esc(sel)}</div>
      <div class="dim">${w} &times; ${h}</div>
      ${swatchRow('Text color', tc)}
      ${hasBg ? swatchRow('Background', bgc) : ''}
      ${rowHtml('Font family', esc(ff))}
      ${rowHtml('Font size', cs.fontSize)}
      ${rowHtml('Line height', cs.lineHeight)}
      ${rowHtml('Font weight', cs.fontWeight)}
      ${rowHtml('Padding', cs.padding)}
      ${crHtml}
    `;

    ttShadow.innerHTML = `<style>${TT_CSS}</style><div class="tt">${inner}</div>`;

    // Position tooltip near cursor, flip if near edges
    const ttW = 280, ttH = 320;
    let tx = mx + 18, ty = my + 18;
    if (tx + ttW > window.innerWidth - 12) tx = mx - ttW - 12;
    if (ty + ttH > window.innerHeight - 12) ty = my - ttH - 12;
    if (tx < 6) tx = 6;
    if (ty < 6) ty = 6;
    host.style.cssText = `all:initial;position:fixed;z-index:2147483646;pointer-events:none;display:block;left:${tx}px;top:${ty}px;width:280px;`;
  }

  function hideTooltip() {
    const host = document.getElementById(TT_ID);
    if (host) { host.remove(); ttShadow = null; }
  }

  /* ── Picker ──────────────────────────────────────────── */
  function startPick() {
    picking = true; document.body.style.cursor = 'crosshair';
    let ov = document.getElementById(OV_ID);
    if (!ov) { ov=document.createElement('div'); ov.id=OV_ID; document.body.appendChild(ov); }
    document.addEventListener('mousemove',onMv,true);
    document.addEventListener('click',onCl,true);
    document.addEventListener('keydown',onEs,true);
  }
  function stopPick() {
    picking=false; document.body.style.cursor='';
    document.getElementById(OV_ID)?.remove(); clearDims(); hideTooltip();
    document.removeEventListener('mousemove',onMv,true);
    document.removeEventListener('click',onCl,true);
    document.removeEventListener('keydown',onEs,true);
  }
  function deepestElementAt(x, y) {
    const els = document.elementsFromPoint(x, y);
    for (const el of els) {
      if (!own(el) && el.tagName !== 'HTML' && el.tagName !== 'BODY') return el;
    }
    return els[0] || null;
  }

  function onMv(e) {
    if(!picking) return;
    const el=deepestElementAt(e.clientX,e.clientY);
    if(!el||own(el)) { hideTooltip(); return; }
    hovered=el;
    const r=el.getBoundingClientRect(), ov=document.getElementById(OV_ID);
    if(ov){ov.style.cssText=`position:absolute;pointer-events:none;border:2px solid #6950E8;background:rgba(105,80,232,.05);border-radius:3px;z-index:2147483646;display:block;top:${r.top+window.scrollY}px;left:${r.left+window.scrollX}px;width:${r.width}px;height:${r.height}px`;
    }
    clearDims();
    const wd=document.createElement('div');wd.className='uii-dim-label';wd.textContent=Math.round(r.width)+'px';wd.style.cssText=`top:${r.top+window.scrollY-18}px;left:${r.left+window.scrollX+r.width/2}px;transform:translateX(-50%)`;document.body.appendChild(wd);dims.push(wd);
    const hd=document.createElement('div');hd.className='uii-dim-label';hd.textContent=Math.round(r.height)+'px';hd.style.cssText=`top:${r.top+window.scrollY+r.height/2}px;left:${r.left+window.scrollX-8}px;transform:translate(-100%,-50%)`;document.body.appendChild(hd);dims.push(hd);
    // Show tooltip near cursor
    showTooltip(el, e.clientX, e.clientY);
  }
  function onCl(e) {
    if(!picking) return; e.preventDefault(); e.stopPropagation(); stopPick();
    if(hovered){inspected=hovered;tab='inspector-detail';render();}
  }
  function onEs(e) { if(e.key==='Escape') stopPick(); }

  /* ── Chrome Message ─────────────────────────────────── */
  chrome.runtime.onMessage.addListener((msg,_,res) => {
    if(msg.action==='inspect-page'){data=scan();tab='overview';if(!markupCapturesLoaded) loadCaptures();render();res({status:'Panel opened.'});}
    else if(msg.action==='pick-element'){data=data||scan();tab='inspector';if(!markupCapturesLoaded) loadCaptures();render();startPick();res({status:'Click an element.'});}
    return true;
  });
})();
