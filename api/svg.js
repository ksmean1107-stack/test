import https from 'https';

export default async function handler(req, res) {
  const { id, title, date, like, comment, repo, share } = req.query;

  if (!id || !title) {
    return res.redirect(302, "https://igx.kr/v/1H/ERROR/1");
  }

  try {
    const targetUrl = `https://igx.kr/v/1H/SNS/${id}`;
    
    // [403 해결 핵심] 브라우저 헤더를 아주 상세하게 설정하여 차단 우회
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': 'https://www.google.com/', // 레퍼러 추가로 의심 회피
      }
    };

    const imageBuffer = await new Promise((resolve, reject) => {
      https.get(targetUrl, options, (response) => {
        // 만약 여기서 또 403이 뜨면 로그에 찍히도록 설정
        if (response.statusCode === 403) {
          reject(new Error('403 Forbidden: Target server blocked Vercel IP'));
          return;
        }
        if (response.statusCode !== 200) {
          reject(new Error('Status: ' + response.statusCode));
          return;
        }
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
      }).on('error', (err) => reject(err));
    });

    const dataUrl = `data:image/png;base64,${imageBuffer.toString('base64')}`;

    // --- 이후 텍스트 및 SVG 생성 로직은 동일 ---
    const esc = (s) => (s || "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    const rawTitle = title.replace(/_/g, " ");
    const rawDate = (date || "").replace(/_/g, " ");
    const userAgent = req.headers['user-agent'] || "";
    const isIos = /iPhone|iPad|iPod/.test(userAgent);
    const yAdjust = isIos ? -1 : 0;

    const LIMIT = 22;
    const isOver = rawTitle.length > LIMIT;
    const dTitle = esc(isOver ? rawTitle.substring(0, LIMIT) + "..." : rawTitle);
    const moreLinkX = 38 + (dTitle.length * 26.5); 
    const FONT = "sans-serif";
    
    const titleTag = `<text x="38" y="${2183 + yAdjust}" font-family="${FONT}" font-weight="900" font-size="38" fill="#262626">${dTitle}</text>`;
    const moreTag = isOver ? `<text x="${moreLinkX + 8}" y="${2183 + yAdjust}" font-family="${FONT}" font-weight="900" font-size="38" fill="#8E8E8E">더 보기</text>` : '';

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1170 2439" width="1170" height="2439">
      <image href="${dataUrl}" x="0" y="0" width="1170" height="2439" preserveAspectRatio="none" />
      <g font-family="${FONT}" font-weight="900" font-size="40" fill="#262626">
        <text x="134" y="${2090 + yAdjust}">${esc(like || "0")}</text>
        <text x="342" y="${2090 + yAdjust}">${esc(comment || "0")}</text>
        <text x="542" y="${2090 + yAdjust}">${esc(repo || "0")}</text>
        <text x="755" y="${2090 + yAdjust}">${esc(share || "0")}</text>
      </g>
      ${titleTag}
      ${moreTag}
      <text x="38" y="${2260 + yAdjust}" font-family="${FONT}" font-weight="400" font-size="28" fill="#262626">${esc(rawDate)}</text>
    </svg>`.trim();

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    return res.status(200).send(svg);

  } catch (err) {
    console.error("DEBUG_LOG:", err.message);
    return res.redirect(302, "https://igx.kr/v/1H/ERROR/1");
  }
}
