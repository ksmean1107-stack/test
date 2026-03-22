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

    // 1. 이미지 크기 및 위치 먼저 확정
    const imgW = rand(820, 920);
    const imgH = rand(1000, 1300);
    const imgX = (1024 - imgW) / 2;
    const imgY = rand(400, 480);

    // 2. 효과음(ef) 위치 계산 (이미지 좌표 기준)
    const efSize = rand(55, 65);
    const isEfLeft = Math.random() > 0.5;
    let efX = isEfLeft ? rand(imgX, imgX + 100) : rand(imgX + imgW - 100, imgX + imgW);
    const efY = rand(imgY + 200, imgY + imgH - 200);
    const efRot = rand(-20, 20);

    if (efLines.length > 0) {
      const longestEf = efLines.reduce((a, b) => a.length > b.length ? a : b);
      const approxEfWidth = longestEf.length * (efSize * 0.8); 
      const halfW = approxEfWidth / 2;
      if (efX - halfW < 20) efX = 20 + halfW;
      if (efX + halfW > 1004) efX = 1004 - halfW;
    }

    // 3. 모든 좌표를 conf 객체에 통합
    const t1X = rand(imgX - 30, imgX + imgW + 30);
    const t1Y = imgY + rand(-40, 60);
    let t2X = rand(imgX - 30, imgX + imgW + 30);
    if (Math.abs(t2X - t1X) < 250) {
      t2X = (t1X > 512) ? t2X - 300 : t2X + 300;
    }

    const conf = {
      img: { x: imgX, y: imgY, w: imgW, h: imgH },
      de: { x: 512, y: imgY - 240, size: 45 },
      text1: { x: t1X, y: t1Y, size: 52 },
      text2: { x: t2X, y: imgY + imgH + rand(60, 140), size: 52 },
      ef: { x: efX, y: efY, size: efSize, rot: efRot }
    };

    // 4. 이미지 최적화 로딩
    const getBase64 = async (url) => {
      if (!url) return "";
      try {
        const fullUrl = url.startsWith('http') ? url : `https://igx.kr/v/1H/WEBTOON_IMG/${url}`;
        const proxy = `https://wsrv.nl/?url=${encodeURIComponent(fullUrl)}&w=600&fit=contain&output=webp&q=60`;
        const res = await fetch(proxy);
        if (!res.ok) return "";
        const buf = await res.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let binary = "";
        for (let i = 0; i < bytes.length; i += 8192) {
          binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
        }
        return `data:image/webp;base64,${btoa(binary)}`;
      } catch (e) { return ""; }
    };

    const finalImg = await getBase64(imgParam);

    const renderBubble = (lines, textConf) => {
      if (!lines.length || !textConf) return "";
      const { x, y, size } = textConf;
      let maxW = 0;
      lines.forEach(l => {
        let w = 0;
        for (let i=0; i<l.length; i++) {
          const c = l.charCodeAt(i);
          w += (c > 0x2500) ? size : (c >= 48 && c <= 57 || c === 32 || c === 63 || c === 33) ? size * 0.6 : size * 0.8;
        }
        if (w > maxW) maxW = w;
      });
      const rx = (maxW + 110) / 2;
      const ry = ((lines.length * size * 1.3) + 80) / 2;
      let fx = x;
      if (fx - rx < 15) fx = 15 + rx;
      if (fx + rx > 1009) fx = 1009 - rx;

      return `
        <g>
          <animateTransform attributeName="transform" type="translate" values="0,0; 0,-8; 0,0" dur="3s" repeatCount="indefinite" />
          <ellipse cx="${fx}" cy="${y}" rx="${rx}" ry="${ry}" fill="white" stroke="black" stroke-width="5" />
          ${lines.map((l, i) => `<text x="${fx}" y="${y - ry + 40 + (i+0.8)*size*1.3}" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="${size}" fill="#000">${esc(l)}</text>`).join('')}
        </g>`;
    };

    const svg = `
    <svg width="1024" height="2000" viewBox="0 0 1024 2000" xmlns="http://www.w3.org/2000/svg">
      <rect width="1024" height="2000" fill="white" />
      ${finalImg ? `<image href="${finalImg}" x="${conf.img.x}" y="${conf.img.y}" width="${conf.img.w}" height="${conf.img.h}" preserveAspectRatio="xMidYMid slice" />` : ''}
      <rect x="${conf.img.x}" y="${conf.img.y}" width="${conf.img.w}" height="${conf.img.h}" fill="none" stroke="black" stroke-width="6" />
      ${deLines.length ? deLines.map((l, i) => `<text x="${conf.de.x}" y="${conf.de.y + (i*conf.de.size*1.3)}" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="${conf.de.size}" fill="#111">${esc(l)}</text>`).join('') : ''}
      ${renderBubble(text1Lines, conf.text1)}
      ${renderBubble(text2Lines, conf.text2)}
      ${efLines.length ? efLines.map((l, i) => `<text x="${conf.ef.x}" y="${conf.ef.y + (i*conf.ef.size)}" text-anchor="middle" font-family='"Impact", "sans-serif"' font-weight="900" font-size="${conf.ef.size}" fill="#000" stroke="#FFF" stroke-width="1" transform="rotate(${conf.ef.rot}, ${conf.ef.x}, ${conf.ef.y})">${esc(l)}</text>`).join('') : ''}
    </svg>`;

    return new Response(svg.trim(), { 
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' } 
    });
  } catch (e) {
    return new Response(`<svg><text y="20">Error: ${e.message}</text></svg>`, { headers: { 'Content-Type': 'image/svg+xml' } });
  }
}
