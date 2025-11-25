// --- 0. Extension Protection & Meta Tags ---
// Injects tags to prevent extensions like Dark Reader from overriding your specific theme colors
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

// Helper to generate vibrant/pastel colors based on theme
function getCustomColor(colorInput, targetSaturation, targetLightness) {
  let r, g, b;
  if(colorInput.startsWith('rgb')){
    [r,g,b] = colorInput.match(/\d+/g).map(Number);
  } else {
    const hex = standardizeColor(colorInput); 
    const rgbStr = hexToRgb(hex);
    [r,g,b] = rgbStr.match(/\d+/g).map(Number);
  }
  const [h,s,l] = rgbToHsl(r,g,b);
  return hslToRgb(h, targetSaturation, targetLightness);
}

function getContrastTextColor(rgbString) {
  const [r, g, b] = rgbString.match(/\d+/g).map(Number);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? 'black' : 'white';
}

// Generates the SVG Blob shapes
function generateWavyBlob(svg, baseColor, isDark){
  const lightness = isDark ? 0.30 : 0.75; 
  const blobColor = getCustomColor(baseColor, 1.0, lightness);

  const points = 12, radius = 100;
  const pathPoints = [];
  for(let i=0;i<points;i++){
    const angle=(i/points)*2*Math.PI;
    const r = radius*(0.7+Math.random()*0.3);
    const x = 100 + r*Math.cos(angle);
    const y = 100 + r*Math.sin(angle);
    pathPoints.push([x,y]);
  }
  let d="";
  for(let i=0;i<points;i++){
    const p0=pathPoints[(i-1+points)%points], p1=pathPoints[i], p2=pathPoints[(i+1)%points], p3=pathPoints[(i+2)%points];
    const cp1x=p1[0]+(p2[0]-p0[0])/6, cp1y=p1[1]+(p2[1]-p0[1])/6;
    const cp2x=p2[0]-(p3[0]-p1[0])/6, cp2y=p2[1]-(p3[1]-p1[1])/6;
    if(i===0)d+=`M ${p1[0]} ${p1[1]} `;
    d+=`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]} `;
  }
  d+="Z";
  
  svg.innerHTML = '';
  const uniqueId = Math.random().toString(36).substr(2, 9);
  const gradientId = `grad-${uniqueId}`;
  
  svg.innerHTML=`<defs>
      <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${blobColor}" stop-opacity="0.5"/>
        <stop offset="100%" stop-color="${blobColor}" stop-opacity="0.5"/>
      </linearGradient>
    </defs>
    <path d="${d}" fill="url(#${gradientId})"/>`;
}


// --- 2. Theme Handling Logic ---

const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
let isFirstLoad = true; 

function applyTheme() {
  const isDark = darkModeQuery.matches;

  // A. Page Body Update
  const bodyBg = isDark ? '#121212' : '#ffffff';
  const bodyColor = isDark ? '#ffffff' : '#000000';
  document.body.style.backgroundColor = bodyBg;
  document.body.style.color = bodyColor;

  // B. Sticky Nav Background
  const stickyNav = document.querySelector('.sticky-nav');
  if(stickyNav) {
      stickyNav.style.backgroundColor = bodyBg;
      stickyNav.style.transition = isFirstLoad ? 'none' : 'background-color 1s ease';
  }

  // C. Christmas Red Title Logic
  // Targeting the H1 inside the sticky nav
  const title = document.querySelector('.sticky-nav h1');
  if(title) {
      if(isDark) {
          // Dark Mode: Deep Crimson Red
          title.style.backgroundColor = '#590a0a'; 
          title.style.color = '#ffffff'; 
      } else {
          // Light Mode: Pale Candy Red
          title.style.backgroundColor = '#ffcccc'; 
          title.style.color = '#000000'; 
      }
      
      title.style.transition = isFirstLoad ? 'none' : 'background-color 1s ease, color 1s ease';
  }

  // D. Process Items
  document.querySelectorAll('.item').forEach((item, index)=>{
    const color = item.dataset.color || '#555555';
    
    let finalBg;
    if (isDark) {
        finalBg = getCustomColor(color, 1.0, 0.15);
    } else {
        finalBg = getCustomColor(color, 1.0, 0.90);
    }
    
    item.dataset.finalColor = finalBg;
    
    if (item.classList.contains('visible')) {
        item.style.backgroundColor = finalBg;
    } else {
        item.style.backgroundColor = 'rgba(255,255,255,0)';
    }

    // No transition on first load, otherwise smooth transition
    item.style.transition = isFirstLoad ? 'none' : "background-color 1s ease, opacity 0.5s ease, transform 0.5s ease";

    item.style.color = getContrastTextColor(finalBg);
    const wrapper = item.querySelector('.image-wrapper');
    const svg = wrapper.querySelector('.shape');
    generateWavyBlob(svg, color, isDark); 
    
    const button = item.querySelector('.buy-button');
    const btnTop = getCustomColor(color, 0.9, 0.65);    
    const btnBottom = getCustomColor(color, 1.0, 0.45); 
    button.style.background = `linear-gradient(to bottom, ${btnTop}, ${btnBottom})`;
  });

  // E. Reset First Load Flag
  if (isFirstLoad) {
      // Re-enable transitions after a split second
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


// --- 3. Scroll Observer (Item Fade In) ---

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
        if(item.dataset.finalColor) {
           item.style.backgroundColor = item.dataset.finalColor;
        }
      }, i * 150); 
    }
  });
}, { threshold: 0.2 });

document.querySelectorAll('.item').forEach(el => observer.observe(el));


// --- 4. Smooth Header Animation Logic ---

const nav = document.querySelector('.sticky-nav');
const navTitle = nav.querySelector('h1');

function calculateHeroOffset() {
  // Only run calculation on Desktop (>1024px)
  if (window.innerWidth > 1024) {
      const navWidth = nav.offsetWidth;
      const titleWidth = navTitle.offsetWidth;
      
      // Math: Center of Container - Center of Title - Left Padding (40px)
      const offset = (navWidth / 2) - (titleWidth / 2) - 40; 
      
      navTitle.style.setProperty('--hero-offset', `${offset}px`);
  } else {
      navTitle.style.setProperty('--hero-offset', '0px');
  }
}

function handleScroll() {
  const scrollY = window.scrollY;
  
  if (scrollY > 50) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
}

// Listen for scroll and resize
window.addEventListener('scroll', handleScroll);
window.addEventListener('resize', calculateHeroOffset); 

// FIX: Run calculation only after fonts and layout are fully loaded
window.addEventListener('load', calculateHeroOffset);

// Run once on initial parse just in case
calculateHeroOffset();
handleScroll();