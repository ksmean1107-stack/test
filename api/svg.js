export const config = { runtime: 'edge' };

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const imgParam = searchParams.get('img');
    const de = (searchParams.get('de') || "").replace(/_/g, ' ');
    const t1 = (searchParams.get('text1') || "").replace(/_/g, ' ');
    const t2 = (searchParams.get('text2') || "").replace(/_/g, ' ');

    // [고수 원본 로직 이식] terminal.ts 의 fitFontSizeByChars
    const fitFontSizeByChars = (text, base, min, idealChars) => {
      const len = Math.max(1, [...text].length);
      if (len <= idealChars) return base;
      const scaled = Math.round(base * (idealChars / len));
      return Math.max(min, scaled);
    };

    const getBase64 = async (url) => {
      if (!url) return "";
      try {
        const fullUrl = url.startsWith('http') ? url : `https://igx.kr/v/1H/WEBTOON_IMG/${url}`;
        const proxy = `https://wsrv.nl/?url=${encodeURIComponent(fullUrl)}&w=800&output=webp&q=75`;
        const res = await fetch(proxy);
        const buf = await res.arrayBuffer();
        return `data:image/webp;base64,${btoa(String.fromCharCode(...new Uint8Array(buf)))}`;
      } catch (e) { return ""; }
    };

    const finalImg = await getBase64(imgParam);

    // 고수의 'terminal' 테마 컬러 반영
    const theme = {
      accent: "#ffb561",
      text: "#ffebcb",
      border: "rgba(255,180,97,0.60)"
    };

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1500" viewBox="0 0 1024 1500" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1500" fill="#171108" />
  
  ${finalImg ? `<image href="${finalImg}" x="50" y="220" width="924" height="1100" preserveAspectRatio="xMidYMid slice" />` : ''}
  <rect x="50" y="220" width="924" height="1100" fill="none" stroke="${theme.border}" stroke-width="6" />

  <text x="512" y="130" text-anchor="middle" font-family="sans-serif" font-size="55" font-weight="900" fill="${theme.accent}">${de}</text>

  <g transform="translate(280, 450)">
    <ellipse cx="5" cy="7" rx="200" ry="90" fill="rgba(0,0,0,0.4)" />
    <ellipse cx="0" cy="0" rx="200" ry="90" fill="#23180c" stroke="${theme.accent}" stroke-width="5" />
    <text x="0" y="15" text-anchor="middle" font-family="sans-serif" font-size="${fitFontSizeByChars(t1, 48, 26, 10)}" font-weight="bold" fill="${theme.text}">${t1}</text>
    
    <animateTransform attributeName="transform" type="translate" values="280,450; 280,432; 280,450" dur="3s" repeatCount="indefinite" />
  </g>

  <g transform="translate(740, 1150)">
    <ellipse cx="5" cy="7" rx="200" ry="90" fill="rgba(0,0,0,0.4)" />
    <ellipse cx="0" cy="0" rx="200" ry="90" fill="#23180c" stroke="${theme.accent}" stroke-width="5" />
    <text x="0" y="15" text-anchor="middle" font-family="sans-serif" font-size="${fitFontSizeByChars(t2, 48, 26, 10)}" font-weight="bold" fill="${theme.text}">${t2}</text>
    <animateTransform attributeName="transform" type="translate" values="740,1150; 740,1132; 740,1150" dur="3.5s" repeatCount="indefinite" />
  </g>
</svg>`;

    return new Response(svg.trim(), { 
      headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' } 
    });
  } catch (e) {
    return new Response(e.message);
  }
}
