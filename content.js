(() => {
  const ROOT = 'uii-root';
  const OV_ID = 'uii-overlay';
  let picking = false, hovered = null, inspected = null, dims = [];
  let tab = 'overview', data = null, assetView = 'list', colorView = 'palette';
  let shadow = null; // Shadow DOM root
  let cssText = null; // Cached CSS text
  let panelPos = { x: null, y: null }; // Saved drag position
  const colorSwaps = new Map(); // oldHex → { newHex, originals: [{el, prop, orig}] }
  let auditData = null; // Cached audit results
  let seoData = null; // Cached SEO scan results

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
  };

  /* ── Util ────────────────────────────────────────────── */
  const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const hex = rgb => { const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/); if(!m) return rgb; const base='#'+[m[1],m[2],m[3]].map(x=>parseInt(x).toString(16).padStart(2,'0')).join(''); if(m[4]!==undefined&&parseFloat(m[4])<1){ return base+Math.round(parseFloat(m[4])*255).toString(16).padStart(2,'0'); } return base; };
  const hex6 = h => h.startsWith('#') ? h.slice(0,7) : h;
  const up = h => h.startsWith('#') ? h.toUpperCase() : h;
  const lum = h => { const c=hex6(h); if (!c.startsWith('#') || c.length < 7) return 0; const r=parseInt(c.slice(1,3),16), g=parseInt(c.slice(3,5),16), b=parseInt(c.slice(5,7),16); return (0.299*r+0.587*g+0.114*b)/255; };
  const contrast = h => lum(h) > 0.5 ? '#111' : '#fff';
  const vis = el => { const s=getComputedStyle(el); return s.display!=='none'&&s.visibility!=='hidden'&&s.opacity!=='0'; };
  const own = el => el.closest('#'+ROOT)||el.id===ROOT||el.id===OV_ID||el.id===TT_ID||el.closest('#'+TT_ID)||el.classList?.contains('uii-dim-label');
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
    if (tab==='overview') h += tabOverview();
    else if (tab==='colors') h += tabColors();
    else if (tab==='typography') h += tabTypo();
    else if (tab==='assets') h += tabAssets();
    else if (tab==='audit') h += tabAudit();
    else if (tab==='seo') h += tabSEO();
    else if (tab==='inspector') h += tabInspEmpty();
    else if (tab==='inspector-detail') h += tabInspDetail();
    h += '</div>';
    h += tabbar();

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
    return `<div class="uii-topbar"><div class="uii-topbar-left"><div class="uii-drag-dots">${'<span></span>'.repeat(6)}</div><div class="uii-toggle"></div><span class="uii-topbar-label">Inspect Mode</span></div><div class="uii-topbar-right"><button class="uii-icon-btn">${IC.menu}</button><button class="uii-icon-btn" data-act="close">${IC.close}</button></div></div>`;
  }

  function tabbar() {
    const t = (id,icon,label) => `<button class="uii-tab ${(tab===id||(tab==='inspector-detail'&&id==='inspector'))?'uii-tab--on':''}" data-tab="${id}">${icon}<span class="uii-tab-lbl">${label}</span></button>`;
    return `<div class="uii-tabbar">${t('overview',IC.grid,'Overview')}${t('colors',IC.drop,'Colors')}${t('typography',IC.type,'Type')}${t('assets',IC.image,'Assets')}${t('audit',IC.audit,'Audit')}${t('seo',IC.seo,'SEO')}${t('inspector',IC.target,'Inspect')}</div>`;
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
      h += '<div class="uii-section"><div class="uii-sec-hdr"><span class="uii-sec-title">Color Palette</span></div><div class="uii-sec-body"><div class="uii-palette-row">';
      cols.slice(0,10).forEach(([c])=>{ h += `<div class="uii-palette-dot" style="background:${c}" title="${up(c)}" onclick="navigator.clipboard.writeText('${up(c)}')"></div>`; });
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
    let h = `<div class="uii-color-hdr"><span class="uii-sec-title">Colors <span class="uii-count">${data.colors.size}</span></span><div style="display:flex;gap:6px"><button class="uii-btn-outline" data-act="reset-colors">Reset All</button><button class="uii-btn-outline" data-act="export-colors">Export</button></div></div>`;
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
      const alphaVal = hasAlpha ? Math.round(parseInt(currentColor.slice(7,9),16)/255*100) : 100;
      const alphaTag = hasAlpha ? ` <span class="uii-cb-alpha">${alphaVal}%</span>` : '';
      const alphaHex = hasAlpha ? currentColor.slice(7,9) : 'ff';
      const alphaInt = parseInt(alphaHex,16);
      h += `<div class="uii-color-band-wrap">
        <div class="uii-color-band" style="background:${currentColor};color:${currentTc}" data-color="${c}">
          <div class="uii-cb-top">
            <span class="uii-cb-hex">${up(currentColor)}${alphaTag}${swapped ? ` <span class="uii-cb-orig">(was ${up(c)})</span>` : ''}</span>
            <div class="uii-cb-controls">
              <label class="uii-color-trigger" title="Change color">
                <input type="color" class="uii-color-input" value="${hex6(currentColor)}" data-orig="${c}">
              </label>
              <input type="range" class="uii-alpha-slider" min="0" max="255" value="${alphaInt}" data-orig="${c}" title="Alpha: ${alphaVal}%">
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

    // — Export Design Tokens —
    h += `<div class="uii-section"><div class="uii-sec-hdr"><span class="uii-sec-title">Export Design Tokens</span></div><div class="uii-sec-body">`;
    h += `<div class="uii-token-btns">`;
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
    clearDims(); stopPick();
    document.querySelectorAll('.uii-cls-highlight').forEach(e=>e.remove());
    auditData = null;
    seoData = null;
  }

  /* ── Events ──────────────────────────────────────────── */
  function bind(root) {
    root.querySelectorAll('[data-act="close"]').forEach(b=>b.addEventListener('click',()=>removePanel()));
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
    // SEO tab events
    root.querySelectorAll('[data-act="copy-seo-prompt"]').forEach(b=>b.addEventListener('click',()=>{ if(seoData) cp(buildSEOPrompt(seoData)); }));
    root.querySelectorAll('[data-act="rescan-seo"]').forEach(b=>b.addEventListener('click',()=>{ seoData = 'loading'; render(); setTimeout(()=>{ seoData = null; render(); }, 600); }));
    root.querySelectorAll('.uii-seo-group-copy').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); cp(b.dataset.prompt); }));
    root.querySelectorAll('.uii-seo-issue-copy').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); cp(b.dataset.prompt); }));
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
    if(msg.action==='inspect-page'){data=scan();tab='overview';render();res({status:'Panel opened.'});}
    else if(msg.action==='pick-element'){data=data||scan();tab='inspector';render();startPick();res({status:'Click an element.'});}
    return true;
  });
})();
