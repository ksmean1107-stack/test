export const config = { runtime: 'edge' };

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const imgParam = searchParams.get('img');
    const t1 = (searchParams.get('text1') || "").replace(/_/g, ' ');
    const t2 = (searchParams.get('text2') || "").replace(/_/g, ' ');
    const name = (searchParams.get('name') || "PLAYER").toUpperCase();

    // [고수 오리지널 로직] 글자 수에 따른 폰트 크기 자동 조절
    const fitFontSize = (text, base, min, ideal) => {
      const len = Math.max(1, [...text].length);
      if (len <= ideal) return base;
      return Math.max(min, Math.round(base * (ideal / len)));
    };

    // 이미지 처리 (Base64 변환)
    const getBase64 = async (url) => {
      if (!url) return "";
      try {
        const proxy = `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=1000&output=webp&q=80`;
        const res = await fetch(proxy);
        const buf = await res.arrayBuffer();
        return `data:image/webp;base64,${btoa(String.fromCharCode(...new Uint8Array(buf)))}`;
      } catch (e) { return ""; }
    };

    const finalImg = await getBase64(imgParam);

    // 고수의 Terminal 테마 컬러 정의
    const theme = {
      bg: "#171108",
      accent: "#ffb561",
      accentSoft: "rgba(255,180,97,0.60)",
      text: "#ffebcb",
      surface: "#23180c"
    };

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1500" viewBox="0 0 1024 1500" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1500" fill="${theme.bg}" />
  
  <g transform="translate(50, 220)">
    ${finalImg ? `<image href="${finalImg}" width="924" height="1100" preserveAspectRatio="xMidYMid slice" />` : `<rect width="924" height="1100" fill="#222" />`}
    <rect width="924" height="1100" fill="none" stroke="${theme.accentSoft}" stroke-width="6" />
  </g>

  <g transform="translate(50, 80)">
    <text x="0" y="40" font-family="sans-serif" font-size="50" font-weight="900" fill="${theme.accent}">${name}</text>
    <line x1="0" y1="60" x2="300" y2="60" stroke="${theme.accent}" stroke-width="4" />
  </g>

  <g transform="translate(280, 450)">
    <path d="M -205,0 a 200,90 0 1,0 410,0 a 200,90 0 1,0 -410,0" fill="${theme.surface}" stroke="${theme.accent}" stroke-width="5" />
    <text x="0" y="15" text-anchor="middle" font-family="sans-serif" font-size="${fitFontSize(t1, 46, 24, 10)}" font-weight="bold" fill="${theme.text}">${t1}</text>
  </g>

  <g transform="translate(740, 1150)">
    <path d="M -205,0 a 200,90 0 1,0 410,0 a 200,90 0 1,0 -410,0" fill="${theme.surface}" stroke="${theme.accent}" stroke-width="5" />
    <text x="0" y="15" text-anchor="middle" font-family="sans-serif" font-size="${fitFontSize(t2, 46, 24, 10)}" font-weight="bold" fill="${theme.text}">${t2}</text>
  </g>
  
  <rect x="50" y="1350" width="924" height="100" fill="${theme.surface}" stroke="${theme.accentSoft}" stroke-width="2" />
  <text x="512" y="1410" text-anchor="middle" font-family="monospace" font-size="30" fill="${theme.accent}">SYSTEM :: WEBTOON_RENDERER_v1.0.4_VERCEL</text>
</svg>`;

    return new Response(svg.trim(), {
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (e) {
    return new Response(e.message);
  }
}
