export const config = { runtime: 'edge' };

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const imgParam = searchParams.get('img');
    const de = (searchParams.get('de') || "").replace(/_/g, ' ');
    const t1 = (searchParams.get('text1') || "").replace(/_/g, ' ');
    const t2 = (searchParams.get('text2') || "").replace(/_/g, ' ');

    // [고수 원본 로직] terminal.ts의 fitFontSizeByChars 이식
    const fitFontSizeByChars = (text, base, min, ideal) => {
      const len = Math.max(1, [...text].length);
      if (len <= ideal) return base;
      return Math.max(min, Math.round(base * (ideal / len)));
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

    // 공통 말풍선 렌더러 (그림자 필터 대신 '가짜 그림자' 레이어 사용)
    const renderBubble = (x, y, text, dur, delay) => {
      const fontSize = fitFontSizeByChars(text, 48, 26, 10);
      return `
      <g transform="translate(${x}, ${y})">
        <g>
          <animateTransform attributeName="transform" type="translate" values="0,0; 0,-15; 0,0" dur="${dur}s" begin="${delay}s" repeatCount="indefinite" />
          <ellipse cx="4" cy="6" rx="200" ry="90" fill="rgba(0,0,0,0.15)" />
          <ellipse cx="0" cy="0" rx="200" ry="90" fill="white" stroke="black" stroke-width="5" />
          <text x="0" y="15" text-anchor="middle" font-family="sans-serif" font-size="${fontSize}" font-weight="800" fill="#000">${text}</text>
        </g>
      </g>`;
    };

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1500" viewBox="0 0 1024 1500" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1500" fill="#ffffff" />

  ${finalImg ? `<image href="${finalImg}" x="50" y="220" width="924" height="1100" preserveAspectRatio="xMidYMid slice" />` : ''}
  <rect x="50" y="220" width="924" height="1100" fill="none" stroke="#000" stroke-width="6" />

  <text x="512" y="130" text-anchor="middle" font-family="sans-serif" font-size="55" font-weight="900" fill="#000">${de}</text>

  ${t1 ? renderBubble(280, 450, t1, 3, 0) : ''}
  ${t2 ? renderBubble(740, 1150, t2, 3.2, 0.5) : ''}
</svg>`;

    return new Response(svg.trim(), { 
      headers: { 
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      } 
    });
  } catch (e) {
    return new Response(`<svg><text y="20">Error: ${e.message}</text></svg>`, { headers: { 'Content-Type': 'image/svg+xml' } });
  }
}
