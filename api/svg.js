export const config = { runtime: 'edge' };

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const imgParam = searchParams.get('img');
    const t1 = (searchParams.get('text1') || "").replace(/_/g, ' ');
    const t2 = (searchParams.get('text2') || "").replace(/_/g, ' ');

    // 고수의 terminal.ts 로직 이식
    const fitFontSize = (text, base) => {
      const len = [...text].length;
      return len <= 10 ? base : Math.max(26, Math.round(base * (10 / len)));
    };

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1500" viewBox="0 0 1024 1500" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1500" fill="#ffffff" />
  <rect x="50" y="220" width="924" height="1100" fill="#eee" stroke="#000" stroke-width="5" />
  
  <g transform="translate(280, 450)">
    <ellipse cx="0" cy="0" rx="200" ry="90" fill="white" stroke="black" stroke-width="5" />
    <text x="0" y="15" text-anchor="middle" font-family="sans-serif" font-size="${fitFontSize(t1, 48)}" font-weight="bold">${t1}</text>
    <animateTransform attributeName="transform" type="translate" values="280,450; 280,430; 280,450" dur="3s" repeatCount="indefinite" />
  </g>
</svg>`;

    return new Response(svg.trim(), { headers: { 'Content-Type': 'image/svg+xml' } });
  } catch (e) { return new Response(e.message); }
}
