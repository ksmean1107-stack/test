import https from 'https';

export default async function handler(req, res) {
  const { id, title, date, like, comment, repo, share } = req.query;

  if (!id || !title) {
    return res.redirect(302, "https://igx.kr/v/1H/ERROR/1");
  }

  try {
    // [핵심] fetch 대신 https 모듈을 사용하여 이미지 버퍼를 직접 수집
    const targetUrl = `https://igx.kr/v/1H/SNS/${id}`;
    
    const imageBuffer = await new Promise((resolve, reject) => {
      https.get(targetUrl, (response) => {
        if (response.statusCode !== 200) reject(new Error('Status: ' + response.statusCode));
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
        response.on('error', (err) => reject(err));
      }).on('error', (err) => reject(err));
    });

    const dataUrl = `data:image/png;base64,${imageBuffer.toString('base64')}`;

    // 텍스트 및 환경 설정
    const userAgent = req.headers['user-agent'] || "";
    const isIos = /iPhone|iPad|iPod/.test(userAgent);
    const yAdjust = isIos ? -1 : 0;
    const esc = (s) => (s || "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

    const rawTitle = title.replace(/_/g, " ");
    const rawDate = (date || "").replace(/_/g, " ");
    const dTitle = esc(rawTitle);
    const dDate = esc(rawDate);
    const dLike = esc(like || "0");
    const dComment = esc(comment || "0");
    const dRepo = esc(repo || "0");
    const dShare = esc(share || "0");

    const LIMIT = 22;
    const isOver = rawTitle.length > LIMIT;
    const displayTitle = isOver ? dTitle.substring(0, LIMIT) + "..." : dTitle;
    const charCount = displayTitle.length;
    const moreLinkX = 38 + (charCount * 26.5); 
    const FONT = "sans-serif";
    
    const titleTag = `<text x="38" y="${2183 + yAdjust}" font-family="${FONT}" font-weight="900" font-size="38" fill="#262626">${displayTitle}</text>`;
    const moreTag = isOver ? `<text x="${moreLinkX + 8}" y="${2183 + yAdjust}" font-family="${FONT}" font-weight="900" font-size="38" fill="#8E8E8E">더 보기</text>` : '';

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1170 2439" width="1170" height="2439">
      <image href="${dataUrl}" x="0" y="0" width="1170" height="2439" preserveAspectRatio="none" />
      <g font-family="${FONT}" font-weight="900" font-size="40" fill="#262626">
        <text x="134" y="${2090 + yAdjust}">${dLike}</text>
        <text x="342" y="${2090 + yAdjust}">${dComment}</text>
        <text x="542" y="${2090 + yAdjust}">${dRepo}</text>
        <text x="755" y="${2090 + yAdjust}">${dShare}</text>
      </g>
      ${titleTag}
      ${moreTag}
      <text x="38" y="${2260 + yAdjust}" font-family="${FONT}" font-weight="400" font-size="28" fill="#262626">${dDate}</text>
    </svg>`.trim();

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    return res.status(200).send(svg);

  } catch (err) {
    console.error("Critical Error:", err.message);
    return res.redirect(302, "https://igx.kr/v/1H/ERROR/1");
  }
}
