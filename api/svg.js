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

    const efSize = rand(55, 65);
    const isEfLeft = Math.random() > 0.5;
    let efX = isEfLeft ? rand(imgX, imgX + 100) : rand(imgX + imgW - 100, imgX + imgW);
    const efY = rand(imgY + 200, imgY + imgH - 200);
    const efRot = rand(-20, 20);

    const conf = {
      img: { x: imgX, y: imgY, w: imgW, h: imgH },
      de: { x: 512, y: imgY - 240, size: 45 },
      text1: { x: rand(imgX - 30, imgX + imgW + 30), y: imgY + rand(-40, 60), size: 52 },
      text2: { x: 0, y: imgY + imgH + rand(60, 140), size: 52 },
      ef: { x: efX, y: efY, size: efSize, rot: efRot }
    };
    
    conf.text2.x = rand(imgX - 30, imgX + imgW + 30);
    if (Math.abs(conf.text2.x - conf.text1.x) < 250) {
      conf.text2.x = (conf.text1.x > 512) ? conf.text2.x - 300 : conf.text2.x + 300;
    }

    // [전송량 다이어트] 600px, WebP, Q60 유지
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

    // [최적화] CSS 클래스를 부여하기 위해 className 파라미터 추가
    const renderBubble = (lines, textConf, className) => {
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
        <g class="${className}" style="transform-origin: ${fx}px ${y}px;">
          <ellipse cx="${fx}" cy="${y}" rx="${rx}" ry="${ry}" fill="white" stroke="black" stroke-width="5" />
          ${lines.map((l, i) => `<text x="${fx}" y="${y - ry + 40 + (i+0.8)*size*1.3}" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="${size}" fill="#000">${esc(l)}</text>`).join('')}
        </g>
      `;
    };

    // SVG 구성
    const svgContent = `
      <svg viewBox="0 0 1024 2000" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: auto;">
        <rect width="1024" height="2000" fill="white" />
        ${finalImg ? `
          <image href="${finalImg}" x="${conf.img.x}" y="${conf.img.y}" width="${conf.img.w}" height="${conf.img.h}" preserveAspectRatio="xMidYMid slice" />
          <rect x="${conf.img.x}" y="${conf.img.y}" width="${conf.img.w}" height="${conf.img.h}" fill="none" stroke="black" stroke-width="6" />
        ` : ''}
        
        ${deLines.length ? deLines.map((l, i) => `<text x="${conf.de.x}" y="${conf.de.y + (i*conf.de.size*1.3)}" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="${conf.de.size}" fill="#111">${esc(l)}</text>`).join('') : ''}

        ${renderBubble(text1Lines, conf.text1, "bubble-1")}
        ${renderBubble(text2Lines, conf.text2, "bubble-2")}

        ${efLines.length ? efLines.map((l, i) => `
          <g class="effect-text" style="transform-origin: ${conf.ef.x}px ${conf.ef.y}px;">
            <text x="${conf.ef.x}" y="${conf.ef.y + (i*conf.ef.size)}" text-anchor="middle" font-family='"Impact", "sans-serif"' font-weight="900" font-size="${conf.ef.size}" fill="#000" stroke="#FFF" stroke-width="1" transform="rotate(${conf.ef.rot}, ${conf.ef.x}, ${conf.ef.y})">${esc(l)}</text>
          </g>
        `).join('') : ''}
      </svg>`;

    // [핵심] HTML 문서로 반환하여 CSS 애니메이션 강제 적용
    const html = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Live Webtoon</title>
      <style>
        body { margin: 0; display: flex; justify-content: center; background-color: #121212; overflow-x: hidden; }
        .viewer-container { max-width: 600px; width: 100%; background-color: white; box-shadow: 0 0 20px rgba(0,0,0,0.5); }
        
        /* 둥둥 떠다니는 말풍선 애니메이션 */
        .bubble-1 { animation: float1 2.5s ease-in-out infinite; }
        .bubble-2 { animation: float2 3s ease-in-out infinite; }
        
        /* 효과음 덜덜 떨리는 애니메이션 */
        .effect-text { animation: shake 0.5s infinite; }

        @keyframes float1 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-18px); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0) scale(1); }
          25% { transform: translateX(-2px) scale(1.02); }
          75% { transform: translateX(2px) scale(0.98); }
        }
      </style>
    </head>
    <body>
      <div class="viewer-container">
        ${svgContent}
      </div>
    </body>
    </html>
    `;

    return new Response(html.trim(), { 
      headers: { 
        'Content-Type': 'text/html; charset=utf-8', // 이미지가 아닌 HTML로 응답!
        'Cache-Control': 'public, max-age=3600'
      } 
    });
  } catch (e) {
    return new Response(`Error: ${e.message}`, { status: 500 });
  }
}
