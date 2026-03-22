export const config = { runtime: 'edge' };

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const imgParam = searchParams.get('img');
    const t1 = (searchParams.get('text1') || "").replace(/_/g, ' ');
    const t2 = (searchParams.get('text2') || "").replace(/_/g, ' ');

    // [고수 원본 로직 이식]
    const fitFontSizeByChars = (text, base, min, ideal) => {
      const len = Math.max(1, [...text].length);
      if (len <= ideal) return base;
      return Math.max(min, Math.round(base * (ideal / len)));
    };

    const getBase64 = async (url) => {
      if (!url) return "";
      try {
        const proxy = `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=800&output=webp`;
        const res = await fetch(proxy);
        const buf = await res.arrayBuffer();
        return `data:image/webp;base64,${btoa(String.fromCharCode(...new Uint8Array(buf)))}`;
      } catch (e) { return ""; }
    };

    const finalImg = await getBase64(imgParam);
    const colors = { bg: "#171108", accent: "#ffb561", text: "#ffebcb" };

    // 타원을 Path 좌표로 변환 (앱 엔진 최적화)
    const drawBubblePath = (cx, cy, rx, ry) => {
      return `M ${cx-rx},${cy} a ${rx},${ry} 0 1,0 ${rx*2},0 a ${rx},${ry} 0 1,0 -${rx*2},0`;
    };

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1500" viewBox="0 0 1024 1500" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1500" fill="${colors.bg}" />
  
  ${finalImg ? `<image href="${finalImg}" x="50" y="220" width="924" height="1100" preserveAspectRatio="xMidYMid slice" />` : ''}
  
  <path d="M 50,220 L 974,220 L 974,1320 L 50,1320 Z" fill="none" stroke="${colors.accent}" stroke-width="6" stroke-opacity="0.6" />

  <g>
    <path d="${drawBubblePath(285, 457, 200, 90)}" fill="rgba(0,0,0,0.5)" />
    <path d="${drawBubblePath(280, 450, 200, 90)}" fill="${colors.bg}" stroke="${colors.accent}" stroke-width="5" />
    <text x="280" y="465" text-anchor="middle" font-family="sans-serif" font-size="${fitFontSizeByChars(t1, 48, 26, 10)}" font-weight="900" fill="${colors.text}">${t1}</text>
    
    <animateTransform attributeName="transform" type="translate" values="0,0; 0,-15; 0,0" dur="3s" repeatCount="indefinite" />
  </g>

  <g>
    <path d="${drawBubblePath(745, 1157, 200, 90)}" fill="rgba(0,0,0,0.5)" />
    <path d="${drawBubblePath(740, 1150, 200, 90)}" fill="${colors.bg}" stroke="${colors.accent}" stroke-width="5" />
    <text x="740" y="1165" text-anchor="middle" font-family="sans-serif" font-size="${fitFontSizeByChars(t2, 48, 26, 10)}" font-weight="900" fill="${colors.text}">${t2}</text>
    <animateTransform attributeName="transform" type="translate" values="0,0; 0,-15; 0,0" dur="3.2s" begin="0.5s" repeatCount="indefinite" />
  </g>
</svg>`;

    return new Response(svg.trim(), { headers: { 'Content-Type': 'image/svg+xml' } });
  } catch (e) { return new Response(e.message); }
}
