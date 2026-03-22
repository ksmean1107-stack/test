export const config = { runtime: 'edge' };

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const imgParam = searchParams.get('img');
    const de = (searchParams.get('de') || "STORY").replace(/_/g, ' ');
    const t1 = (searchParams.get('text1') || "").replace(/_/g, ' ');
    const t2 = (searchParams.get('text2') || "").replace(/_/g, ' ');

    // [고수 로직 1] 폰트 크기 자동 계산 (fitFontSizeByChars)
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

    // SVG 구성 요소 생성
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1500" viewBox="0 0 1024 1500" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      /* 앱 엔진 호환을 위한 표준 CSS 애니메이션 */
      @keyframes float {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-15px); }
        100% { transform: translateY(0px); }
      }
      .bubble { animation: float 3s ease-in-out infinite; }
      .bubble-delay { animation: float 3.5s ease-in-out infinite; }
    </style>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="5" />
      <feOffset dx="0" dy="4" result="offsetblur" />
      <feComponentTransfer><feFuncA type="linear" slope="0.3"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <rect width="1024" height="1500" fill="#ffffff" />

  ${finalImg ? `<image href="${finalImg}" x="50" y="220" width="924" height="1100" preserveAspectRatio="xMidYMid slice" />` : ''}
  <rect x="50" y="220" width="924" height="1100" fill="none" stroke="#000" stroke-width="6" />

  <text x="512" y="130" text-anchor="middle" font-family="sans-serif" font-size="55" font-weight="900" fill="#000">${de}</text>

  <g class="bubble" style="transform-box: fill-box; transform-origin: center;">
    <ellipse cx="280" cy="450" rx="200" ry="90" fill="white" stroke="black" stroke-width="5" filter="url(#shadow)" />
    <text x="280" y="465" text-anchor="middle" font-family="sans-serif" font-size="${fitFontSizeByChars(t1, 48, 28, 10)}" font-weight="800" fill="#000">${t1}</text>
  </g>

  <g class="bubble-delay" style="transform-box: fill-box; transform-origin: center;">
    <ellipse cx="740" cy="1150" rx="200" ry="90" fill="white" stroke="black" stroke-width="5" filter="url(#shadow)" />
    <text x="740" y="1165" text-anchor="middle" font-family="sans-serif" font-size="${fitFontSizeByChars(t2, 48, 28, 10)}" font-weight="800" fill="#000">${t2}</text>
  </g>
</svg>`;

    return new Response(svg.trim(), { 
      headers: { 
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate' // 실시간 반영을 위해 캐시 방지
      } 
    });
  } catch (e) {
    return new Response(`<svg><text y="20">Error: ${e.message}</text></svg>`, { headers: { 'Content-Type': 'image/svg+xml' } });
  }
}
