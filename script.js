// --- 0. Extension Protection & Meta Tags ---
const metaLock = document.createElement('meta');
metaLock.name = "darkreader-lock";
document.head.appendChild(metaLock);

const metaScheme = document.createElement('meta');
metaScheme.name = "color-scheme";
metaScheme.content = "light dark";
document.head.appendChild(metaScheme);

document.documentElement.style.colorScheme = 'light dark';


// --- 1. Color Utilities ---

function standardizeColor(str) {
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.fillStyle = str;
  return ctx.fillStyle;
}

function hexToRgb(hex) {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgb(${r},${g},${b})`;
}

function rgbToHsl(r,g,b){r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b);let h=0,s=0,l=(max+min)/2;if(max!==min){const d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);switch(max){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;case b:h=(r-g)/d+4;break;}h/=6;}return [h,s,l];}

function hslToRgb(h,s,l){let r,g,b;if(s===0)r=g=b=l;else{const hue2rgb=(p,q,t)=>{if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;};const q=l<0.5?l*(1+s):l+s-l*s;const p=2*l-q;r=hue2rgb(p,q,h+1/3);g=hue2rgb(p,q,h);b=hue2rgb(p,q,h-1/3);}return `rgb(${Math.round(r*255)},${Math.round(g*255)},${Math.round(b*255)})`;}

function getCustomColor(colorInput, targetSaturation, targetLightness) {
  let r, g, b;
  
  if(colorInput.startsWith('rgb')){
    [r,g,b] = colorInput.match(/\d+/g).map(Number);
  } else {
    const hex = standardizeColor(colorInput); 
    const rgbStr = hexToRgb(hex);
    [r,g,b] = rgbStr.match(/\d+/g).map(Number);
  }
  
  const [h, s, l] = rgbToHsl(r, g, b);
  
  let finalS, finalL;

  // 1. Saturation Logic (UPDATED: 80% Input / 20% Target)
  if (s === 0) {
    finalS = 0; 
  } else {
    // Input color (s) has 80% influence, Target color has 20% influence.
    finalS = (s * 0.8) + (targetSaturation * 0.2);
  }

  // 2. Lightness/Value Logic (80% Input / 20% Target)
  // This remains the same as your previous request.
  finalL = (l * 0.7) + (targetLightness * 0.3);

  return hslToRgb(h, finalS, finalL);
}

function getContrastTextColor(rgbString) {
  const [r, g, b] = rgbString.match(/\d+/g).map(Number);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? 'black' : 'white';
}

function generateWavyBlob(svg, baseColor, isDark){
  // CHANGED: Lightness adjusted for higher contrast (0.40 in dark, 0.60 in light)
  const lightness = isDark ? 0.40 : 0.60; 
  const blobColor = getCustomColor(baseColor, 1.0, lightness);

  if (svg.blobAnimationId) cancelAnimationFrame(svg.blobAnimationId);

  const uniqueId = Math.random().toString(36).substr(2, 9);
  const gradientId = `grad-${uniqueId}`;
  
  svg.innerHTML=`<defs>
      <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${blobColor}" stop-opacity="0.8"/> 
        <stop offset="100%" stop-color="${blobColor}" stop-opacity="0.8"/> 
      </linearGradient>
    </defs>
    <path fill="url(#${gradientId})"/>`;

  const path = svg.querySelector('path');

  const points = 12;
  const center = 100;
  const offsets = Array.from({length: points}, () => Math.random() * 10);

  function animate() {
    const time = Date.now() * 0.00075; 
    const pathPoints = [];

    for(let i=0; i<points; i++){
      const angle = (i/points) * 2 * Math.PI;
      const r = 100 * (0.8 + 0.15 * Math.sin(time + offsets[i]));
      
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      pathPoints.push([x,y]);
    }

    let d="";
    for(let i=0; i<points; i++){
      const p0 = pathPoints[(i-1+points)%points];
      const p1 = pathPoints[i];
      const p2 = pathPoints[(i+1)%points];
      const p3 = pathPoints[(i+2)%points];

      const cp1x = p1[0] + (p2[0]-p0[0])/6;
      const cp1y = p1[1] + (p2[1]-p0[1])/6;

      const cp2x = p2[0] - (p3[0]-p1[0])/6;
      const cp2y = p2[1] - (p3[1]-p1[1])/6;

      if(i===0) d += `M ${p1[0]} ${p1[1]} `;
      d += `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]} `;
    }
    d += "Z";

    path.setAttribute('d', d);
    svg.blobAnimationId = requestAnimationFrame(animate);
  }

  animate();
}


// --- 2. Theme Handling Logic ---

const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
let isFirstLoad = true; 

function applyTheme() {
  const isDark = darkModeQuery.matches;

  // A. Page Body
  const bodyBg = isDark ? '#121212' : '#ffffff';
  const bodyColor = isDark ? '#ffffff' : '#000000';
  
  // Update the CSS variable so the Inverted Corners match the header color
  document.documentElement.style.setProperty('--nav-bg', bodyBg);
  
  document.body.style.backgroundColor = bodyBg;
  document.body.style.color = bodyColor;
  
  // Prevent flash on load
  document.body.style.transition = isFirstLoad ? 'none' : 'background-color 1s ease, color 1s ease';

  // B. Sticky Nav
  const stickyNav = document.querySelector('.sticky-nav');
  if(stickyNav) {
      stickyNav.style.backgroundColor = bodyBg;
      stickyNav.style.transition = isFirstLoad ? 'none' : 'background-color 1s ease';
  }

  // C. Title Background
  const title = document.querySelector('.sticky-nav h1');
  if(title) {
      if(isDark) {
          title.style.backgroundColor = '#590a0a'; 
          title.style.color = '#ffffff'; 
      } else {
          title.style.backgroundColor = '#ffcccc'; 
          title.style.color = '#000000'; 
      }
      title.style.transition = isFirstLoad ? 'none' : 'background-color 1s ease, color 1s ease';
  }

  // D. Items
  document.querySelectorAll('.item').forEach((item, index)=>{
    const color = item.dataset.color || '#555555';
    // Calculate the full-opacity RGB color first
    let finalBg = isDark ? getCustomColor(color, 1.0, 0.15) : getCustomColor(color, 1.0, 0.90);
    
    // NEW: Convert the RGB color to RGBA with 60% (0.6) opacity
    let finalBgTransparent = finalBg.replace('rgb', 'rgba').replace(')', ', 0.6)');

    // Store the transparent color so the scroll observer applies it when visible
    item.dataset.finalColor = finalBgTransparent;
    
    if (item.classList.contains('visible')) {
        item.style.backgroundColor = finalBgTransparent; // Apply 60% opacity background
    } else {
        item.style.backgroundColor = 'rgba(255,255,255,0)';
    }

    // IMPORTANT: Use the original full-opacity color (finalBg) for the contrast check
    item.style.color = getContrastTextColor(finalBg); 
    
    // Logic for wavy blob and button (no change here)
    const scrollTrans = "opacity 0.5s ease, transform 0.5s ease";
    item.style.transition = isFirstLoad ? scrollTrans : `background-color 1s ease, ${scrollTrans}`;

    const wrapper = item.querySelector('.image-wrapper');
    const svg = wrapper.querySelector('.shape');
    generateWavyBlob(svg, color, isDark); 
    
    const button = item.querySelector('.buy-button');
    const btnTop = getCustomColor(color, 0.9, 0.65);    
    const btnBottom = getCustomColor(color, 1.0, 0.45); 
    button.style.background = `linear-gradient(to bottom, ${btnTop}, ${btnBottom})`;
    
    const iconColor = getContrastTextColor(btnBottom);
    button.style.color = iconColor;
    
    const buyIcon = button.firstElementChild;
    if (buyIcon) {
        buyIcon.style.filter = iconColor === 'black' ? 'invert(1)' : 'none';
    }
  });

  if (isFirstLoad) {
      setTimeout(() => {
          document.body.style.transition = 'background-color 1s ease, color 1s ease';
          if(stickyNav) stickyNav.style.transition = 'background-color 1s ease';
          if(title) title.style.transition = 'background-color 1s ease, color 1s ease';
          document.querySelectorAll('.item').forEach(el => {
              el.style.transition = "background-color 1s ease, opacity 0.5s ease, transform 0.5s ease";
          });
      }, 100);
      isFirstLoad = false;
  }
}

darkModeQuery.addEventListener('change', applyTheme);
applyTheme();


// --- 3. Scroll Observer ---
const observer = new IntersectionObserver(entries => {
  entries.forEach((entry, i) => {
    if(entry.isIntersecting) {
      const item = entry.target;
      observer.unobserve(item);
      setTimeout(() => {
        item.classList.add('visible');
        item.querySelectorAll('.slide-in-left, .slide-in-right, .fade-in').forEach(child => {
            child.classList.add('visible');
        });
        if(item.dataset.finalColor) item.style.backgroundColor = item.dataset.finalColor;
      }, i * 150); 
    }
  });
}, { threshold: 0.2 });

document.querySelectorAll('.item').forEach(el => observer.observe(el));


// --- 4. Fluid Scroll Animation & Dynamic Spacing ---

const nav = document.querySelector('.sticky-nav');
const titleEl = nav.querySelector('h1');
const frame = document.querySelector('.frame');

// FIXED START HEIGHTS (The "Expanded" State)
const START_HEIGHT_DESKTOP = 220;
const START_HEIGHT_MOBILE = 160;

const SCROLL_RANGE_DESKTOP = 100;
const SCROLL_RANGE_MOBILE = 50;

function updateLayout() {
  const scrollY = window.scrollY;
  const isDesktop = window.innerWidth > 1024;
  
  // 1. Determine Start Height
  const startHeight = isDesktop ? START_HEIGHT_DESKTOP : START_HEIGHT_MOBILE;
  
  // 2. Determine End Height (Dynamic based on text wrap)
  const titleHeight = titleEl.offsetHeight;
  const paddingBuffer = 40; // 20px top + 20px bottom inside header
  const endHeight = titleHeight + paddingBuffer;
  
  // 3. Calculate Header Height
  const scrollRange = isDesktop ? SCROLL_RANGE_DESKTOP : SCROLL_RANGE_MOBILE;
  let progress = Math.min(scrollY / scrollRange, 1);
  progress = Math.max(progress, 0);
  
  const currentHeight = startHeight - (progress * (startHeight - endHeight));
  nav.style.height = `${currentHeight}px`;

  // 4. DYNAMIC CONTENT PADDING
  // Ensures the content is always pushed down enough so it's not hidden.
  // We use the MAX of startHeight or endHeight to be safe against large text wrapping.
  // Added +20px for the gap you requested.
  const safePadding = Math.max(startHeight, endHeight) + 20; 
  frame.style.paddingTop = `${safePadding}px`;
}

// Recalculate on load/resize/scroll
window.addEventListener('load', updateLayout);
window.addEventListener('resize', updateLayout);
window.addEventListener('scroll', updateLayout);

// Initial call
updateLayout();