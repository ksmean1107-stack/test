export const config = { runtime: 'edge' };

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const imgParam = searchParams.get('img');
    const deRaw = searchParams.get('de');
    const text1Raw = searchParams.get('text1');
    const text2Raw = searchParams.get('text2');
    const efRaw = searchParams.get('ef');

    const process = (str) => str ? str.replace(/_/g, ' ').split('/') : [];
    const esc = (s) => s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

    const deLines = process(deRaw);
    const text1Lines = process(text1Raw);
    const text2Lines = process(text2Raw);
    const efLines = process(efRaw);
    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    // 레이아웃
    const imgX = (1024 - rand(820, 920)) / 2;
    const imgY = rand(400, 480);
    const conf = {
      img: { x: imgX, y: imgY, w: 1024 - (imgX * 2), h: rand(1000, 1300) },
      de: { x: 512, y: imgY - 240, size: 45 },
      text1: { x: rand(imgX, imgX + 300), y: imgY + 50, size: 52 },
      text2: { x: rand(imgX + 300, imgX + 600), y: imgY + 1100, size: 52 }
    };

    const getBase64 = async (url) => {
      if (!url) return "";
      try {
        const fullUrl = url.startsWith('http') ? url : `https://igx.kr/v/1H/WEBTOON_IMG/${url}`;
        const proxy = `https://wsrv.nl/?url=${encodeURIComponent(fullUrl)}&w=600&fit=contain&output=webp&q=60`;
        const res = await fetch(proxy);
        const buf = await res.arrayBuffer();
        return `data:image/webp;base64,${btoa(String.fromCharCode(...new Uint8Array(buf)))}`;
      } catch (e) { return ""; }
    };

    const finalImg = await getBase64(imgParam);

    const renderBubble = (lines, textConf, dur) => {
      if (!lines.length) return "";
      const { x, y, size } = textConf;
      const rx = (lines.reduce((m, l) => Math.max(m, l.length), 0) * size * 0.8 + 110) / 2;
      const ry = (lines.length * size * 1.3 + 80) / 2;

      return `
        <g>
          <animateTransform attributeName="transform" type="translate" values="0,0; 0,-15; 0,0" dur="${dur}s" repeatCount="indefinite" />
          <ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="white" stroke="black" stroke-width="5" />
          ${lines.map((l, i) => `<text x="${x}" y="${y - ry + 40 + (i+0.8)*size*1.3}" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="${size}" fill="#000">${esc(l)}</text>`).join('')}
        </g>`;
    };

    const svg = `
    <svg width="1024" height="2000" viewBox="0 0 1024 2000" xmlns="http://www.w3.org/2000/svg">
      <rect width="1024" height="2000" fill="white" />
      ${finalImg ? `<image href="${finalImg}" x="${conf.img.x}" y="${conf.img.y}" width="${conf.img.w}" height="${conf.img.h}" preserveAspectRatio="xMidYMid slice" />` : ''}
      <rect x="${conf.img.x}" y="${conf.img.y}" width="${conf.img.w}" height="${conf.img.h}" fill="none" stroke="black" stroke-width="6" />
      
      ${renderBubble(text1Lines, conf.text1, 2.5)}
      ${renderBubble(text2Lines, conf.text2, 3)}
      
      ${efLines.length ? `<text x="512" y="${conf.img.y + 600}" text-anchor="middle" font-size="70" font-weight="900" fill="red" stroke="white" stroke-width="2">${esc(efLines[0])}</text>` : ''}
    </svg>`;

    return new Response(svg.trim(), { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' } });
  } catch (e) {
    return new Response(`<svg><text y="20">${e.message}</text></svg>`, { headers: { 'Content-Type': 'image/svg+xml' } });
  }
}
