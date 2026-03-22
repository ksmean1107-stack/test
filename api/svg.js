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

    // --- 레이아웃 설정 (기존과 동일) ---
    const imgW = rand(820, 920);
    const imgH = rand(1000, 1300);
    const imgX = (1024 - imgW) / 2;
    const imgY = rand(400, 480);

    const conf = {
      img: { x: imgX, y: imgY, w: imgW, h: imgH },
      de: { x: 512, y: imgY - 240, size: 45 },
      text1: { x: rand(imgX - 30, imgX + imgW + 30), y: imgY + rand(-40, 60), size: 52 },
      text2: { x: 0, y: imgY + imgH + rand(60, 140), size: 52 },
      ef: { x: efX, y: efY, size: efSize, rot: efRot }
    };
    
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
    conf.ef = { x: efX, y: efY, size: efSize, rot: efRot };

    conf.text2.x = rand(imgX - 30, imgX + imgW + 30);
    if (Math.abs(conf.text2.x - conf.text1.x) < 250) {
      conf.text2.x = (conf.text1.x > 512) ? conf.text2.x - 300 : conf.text2.x + 300;
    }

    // [전송량 다이어트] 최적화된 이미지 가져오기
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

    // [최적화] 순수 SVG 렌더링 (애니메이션 태그는 넣어두지만 차단될 확률 높음)
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
        </g>
      `;
    };

    // 최종 SVG 코드 조립
    const svg = `
    <svg width="1024" height="2000" viewBox="0 0 1024 2000" xmlns="http://www.w3.org/2000/svg">
      <rect width="1024" height="2000" fill="white" />
      ${finalImg ? `<image href="${finalImg}" x="${conf.img.x}" y="${conf.img.y}" width="${conf.img.w}" height="${conf.img.h}" preserveAspectRatio="xMidYMid slice" />` : ''}
      ${deLines.length ? deLines.map((l, i) => `<text x="${conf.de.x}" y="${conf.de.y + (i*conf.de.size*1.3)}" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="${conf.de.size}" fill="#111">${esc(l)}</text>`).join('') : ''}
      ${renderBubble(text1Lines, conf.text1)}
      ${renderBubble(text2Lines, conf.text2)}
      ${efLines.length ? efLines.map((l, i) => `<text x="${conf.ef.x}" y="${conf.ef.y + (i*conf.ef.size)}" text-anchor="middle" font-family='"Impact", "Haettenschweiler", "Arial Narrow Bold", sans-serif' font-weight="900" font-size="${conf.ef.size}" fill="#000" stroke="#FFF" stroke-width="1" transform="rotate(${conf.ef.rot}, ${conf.ef.x}, ${conf.ef.y})">${esc(l)}</text>`).join('') : ''}
    </svg>`;

    return new Response(svg.trim(), { 
      headers: { 
        'Content-Type': 'image/svg+xml', // 브라우저가 '이미지'로 인식하게 함
        'Cache-Control': 'public, max-age=3600'
      } 
    });
  } catch (e) {
    return new Response(`<svg><text y="20">Error: ${e.message}</text></svg>`, { headers: { 'Content-Type': 'image/svg+xml' } });
  }
}
