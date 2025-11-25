// ----------------------
// Scroll animations
// ----------------------
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.2 });

document.querySelectorAll('.slide-in, .fade-in').forEach(el => observer.observe(el));


// ----------------------
// Color utilities
// ----------------------
function getAccentColor(img, callback) {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  let r=0, g=0, b=0, count=0;
  for(let i=0;i<data.length;i+=4){
    const red=data[i], green=data[i+1], blue=data[i+2];
    const brightness = (red*299 + green*587 + blue*114)/1000;
    if(brightness > 40 && brightness < 220){
      r+=red; g+=green; b+=blue; count++;
    }
  }

  if(count===0) count=1;
  r=Math.floor(r/count);
  g=Math.floor(g/count);
  b=Math.floor(b/count);

  callback(`rgb(${r},${g},${b})`);
}

function rgbToHsl(r,g,b){
  r/=255; g/=255; b/=255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b);
  let h=0,s=0,l=(max+min)/2;
  if(max!==min){
    const d=max-min;
    s=l>0.5?d/(2-max-min):d/(max+min);
    switch(max){
      case r: h=(g-b)/d + (g<b?6:0); break;
      case g: h=(b-r)/d + 2; break;
      case b: h=(r-g)/d + 4; break;
    }
    h/=6;
  }
  return [h,s,l];
}

function hslToRgb(h,s,l){
  let r,g,b;
  if(s===0) r=g=b=l;
  else {
    const hue2rgb=(p,q,t)=>{
      if(t<0) t+=1; if(t>1) t-=1;
      if(t<1/6) return p+(q-p)*6*t;
      if(t<1/2) return q;
      if(t<2/3) return p+(q-p)*(2/3-t)*6;
      return p;
    }
    const q=l<0.5?l*(1+s):l+s-l*s;
    const p=2*l-q;
    r=hue2rgb(p,q,h+1/3);
    g=hue2rgb(p,q,h);
    b=hue2rgb(p,q,h-1/3);
  }
  return `rgb(${Math.round(r*255)},${Math.round(g*255)},${Math.round(b*255)})`;
}

function getComplementaryColor(rgb){
  const [r,g,b] = rgb.match(/\d+/g).map(Number);
  let [h,s,l] = rgbToHsl(r,g,b);
  h = (h + 0.5) % 1;
  return hslToRgb(h,s,l);
}

function lightenColor(rgb, amount=0.875){
  const [r,g,b] = rgb.match(/\d+/g).map(Number);
  const [h,s,l] = rgbToHsl(r,g,b);
  const newL = Math.min(l + amount*(1-l),1);
  return hslToRgb(h,s,newL);
}

// ----------------------
// Wavy blob generator
// ----------------------
function generateWavyBlob(svg, baseColor) {
  const points = 12;
  const radius = 100;
  const pathPoints = [];

  for(let i=0;i<points;i++){
    const angle = (i/points)*2*Math.PI;
    const r = radius * (0.7 + Math.random()*0.3);
    const x = 100 + r * Math.cos(angle);
    const y = 100 + r * Math.sin(angle);
    pathPoints.push([x,y]);
  }

  let d = "";
  for(let i=0;i<points;i++){
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

  svg.innerHTML = `
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${baseColor}" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="${baseColor}" stop-opacity="0.3"/>
      </linearGradient>
    </defs>
    <path d="${d}" fill="url(#grad)"/>
  `;
}

// ----------------------
// Apply colors & generate blobs
// ----------------------
document.querySelectorAll('.main-image').forEach(img => {
  img.onload = () => {
    getAccentColor(img, accent=>{
      const complementary = getComplementaryColor(accent);
      const lighterBg = lightenColor(complementary, 0.875);

      const wrapper = img.closest('.image-wrapper');
      const svg = wrapper.querySelector('.shape');
      generateWavyBlob(svg, complementary);

      const button = img.closest('.item').querySelector('.buy-button');
      button.style.background = `linear-gradient(to bottom, ${complementary}, rgba(0,0,0,0.6))`;

      img.closest('.item').style.backgroundColor = lighterBg;
    });
  };
});