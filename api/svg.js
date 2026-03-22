export const config = { runtime: 'edge' };

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const imgParam = searchParams.get('img');
    const de = (searchParams.get('de') || "STORY").replace(/_/g, ' ');
    const t1 = (searchParams.get('text1') || "").replace(/_/g, ' ');
    const t2 = (searchParams.get('text2') || "").replace(/_/g, ' ');

    const getBase64 = async (url) => {
      if (!url) return "";
      try {
        const fullUrl = url.startsWith('http') ? url : `https://igx.kr/v/1H/WEBTOON_IMG/${url}`;
        const proxy = `https://wsrv.nl/?url=${encodeURIComponent(fullUrl)}&w=800&output=webp&q=70`;
        const res = await fetch(proxy);
        const buf = await res.arrayBuffer();
        return `data:image/webp;base64,${btoa(String.fromCharCode(...new Uint8Array(buf)))}`;
      } catch (e) { return ""; }
    };

    const finalImg = await getBase64(imgParam);

    // [고수의 로직 반영] 텍스트 길이에 따른 자동 크기 조절
    const fitSize = (t, s) => t.length > 12 ? Math.max(s * 0.6, s * (12 / t.length)) : s;

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1500" viewBox="0 0 1024 1500" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="5" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  
  <rect width="1024" height="1500" fill="#ffffff" />
  
  ${finalImg ? `<image href="${finalImg}" x="50" y="200" width="924" height="1100" preserveAspectRatio="xMidYMid slice" />` : ''}
  <rect x="50" y="200" width="924" height="1100" fill="none" stroke="#000" stroke-width="8" />

  <text x="512" y="120" text-anchor="middle" font-family="sans-serif" font-size="60" font-weight="900" fill="#000">${de}</text>

  <g transform="translate(280, 450)">
    <ellipse cx="0" cy="0" rx="200" ry="90" fill="white" stroke="black" stroke-width="6" filter="url(#glow)" />
    <text x="0" y="15" text-anchor="middle" font-family="sans-serif" font-size="${fitSize(t1, 50)}" font-weight="bold" fill="#000">${t1}</text>
    <animateTransform attributeName="transform" type="translate" values="280,450; 280,430; 280,450" dur="2.8s" repeatCount="indefinite" />
  </g>

  <g transform="translate(744, 1150)">
    <ellipse cx="0" cy="0" rx="200" ry="90" fill="white" stroke="black" stroke-width="6" filter="url(#glow)" />
    <text x="0" y="15" text-anchor="middle" font-family="sans-serif" font-size="${fitSize(t2, 50)}" font-weight="bold" fill="#000">${t2}</text>
    <animateTransform attributeName="transform" type="translate" values="744,1150; 744,1130; 744,1150" dur="3.2s" repeatCount="indefinite" />
  </g>
</svg>`;

    return new Response(svg.trim(), { 
      headers: { 
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=5' // [고수 팁: 캐시 설정]
      } 
    });
  } catch (e) {
    return new Response(`<svg><text y="20">${e.message}</text></svg>`, { headers: { 'Content-Type': 'image/svg+xml' } });
  }
}
