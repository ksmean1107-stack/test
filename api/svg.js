export const config = { runtime: 'edge' };

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const imgParam = searchParams.get('img');
    const de = (searchParams.get('de') || "STORY CHAT").replace(/_/g, ' ');
    const text1 = (searchParams.get('text1') || "").replace(/_/g, ' ');
    const text2 = (searchParams.get('text2') || "").replace(/_/g, ' ');

    // [고수 기법 1] 이미지 Base64 변환 최적화
    const getBase64 = async (url) => {
      if (!url) return "";
      const fullUrl = url.startsWith('http') ? url : `https://igx.kr/v/1H/WEBTOON_IMG/${url}`;
      const proxy = `https://wsrv.nl/?url=${encodeURIComponent(fullUrl)}&w=800&output=webp&q=70`;
      const res = await fetch(proxy);
      const buf = await res.arrayBuffer();
      return `data:image/webp;base64,${btoa(String.fromCharCode(...new Uint8Array(buf)))}`;
    };

    const finalImg = await getBase64(imgParam);

    // [고수 기법 2] 텍스트 길이에 따른 자동 폰트 크기 조절 (fitFontSizeByChars 로직)
    const getFontSize = (text, base) => text.length > 10 ? Math.max(base * 0.7, base * (10 / text.length)) : base;

    // SVG 코드 조립
    const svgContent = `
    <svg width="1024" height="1500" viewBox="0 0 1024 1500" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@700&amp;display=swap');
          .font-ui { font-family: 'IBM Plex Sans KR', sans-serif; }
          
          /* 고수 기법 3: 표준 CSS 애니메이션 */
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
          }
          .bubble-1 { animation: float 3s ease-in-out infinite; }
          .bubble-2 { animation: float 3.5s ease-in-out infinite; }
          
          /* 고수 기법 4: 필터 효과 (그림자 및 글로우) */
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </style>
      </defs>

      <rect width="1024" height="1500" fill="#f8f9fa" />
      
      ${finalImg ? `<image href="${finalImg}" x="50" y="250" width="924" height="1000" preserveAspectRatio="xMidYMid slice" />` : ''}
      <rect x="50" y="250" width="924" height="1000" fill="none" stroke="#000" stroke-width="4" />

      <text x="512" y="150" text-anchor="middle" class="font-ui" font-size="50" font-weight="900" fill="#222">${de}</text>

      <g class="bubble-1">
        <ellipse cx="250" cy="400" rx="180" ry="80" fill="white" stroke="black" stroke-width="4" filter="url(#glow)" />
        <text x="250" y="415" text-anchor="middle" class="font-ui" font-size="${getFontSize(text1, 40)}" fill="#000">${text1}</text>
      </g>

      <g class="bubble-2">
        <ellipse cx="750" cy="1150" rx="180" ry="80" fill="white" stroke="black" stroke-width="4" filter="url(#glow)" />
        <text x="750" y="1165" text-anchor="middle" class="font-ui" font-size="${getFontSize(text2, 40)}" fill="#000">${text2}</text>
      </g>
    </svg>`;

    // [고수 기법 5] 표준 XML 선언 포함 및 헤더 설정
    const finalSvg = `<?xml version="1.0" encoding="UTF-8"?>\n${svgContent.trim()}`;

    return new Response(finalSvg, { 
      headers: { 
        'Content-Type': 'image/svg+xml; charset=utf-8', 
        'Cache-Control': 'public, max-age=3600' 
      } 
    });
  } catch (e) {
    return new Response(`<svg><text y="20">${e.message}</text></svg>`, { headers: { 'Content-Type': 'image/svg+xml' } });
  }
}
