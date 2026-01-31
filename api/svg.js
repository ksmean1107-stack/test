export default async function handler(req, res) {
  try {
    // 1. 최신 URL API 사용 (DeprecationWarning 해결)
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const fullUrl = new URL(req.url, `${protocol}://${host}`);
    const { id, title, date, like, comment, repo, share } = Object.fromEntries(fullUrl.searchParams);

    if (!id || !title) {
      return res.redirect(302, "https://igx.kr/v/1H/ERROR/1");
    }

    const targetUrl = `https://igx.kr/v/1H/SNS/${id}`;
    
    // 2. 403 에러 해결을 위한 '완벽한 위장' 헤더
    const imageResp = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
        'Referer': 'https://igx.kr/', // 출처를 본인 서버로 속여 보안 통과
        'Origin': 'https://igx.kr',
        'Sec-Fetch-Dest': 'image',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'same-origin',
        'Cache-Control': 'no-cache'
      }
    });

    if (!imageResp.ok) {
      console.error(`[FATAL] Still 403? Status: ${imageResp.status}`);
      return res.redirect(302, "https://igx.kr/v/1H/ERROR/1");
    }

    // 3. 이미지 바이너리 처리
    const arrayBuffer = await imageResp.arrayBuffer();
    const dataUrl = `data:image/png;base64,${Buffer.from(arrayBuffer).toString('base64')}`;

    // 4. 텍스트 처리 및 이스케이프
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

    // 5. SVG 조립
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1170 2439" width="1170" height="2439">
      <image href="${dataUrl}" x="0" y="0" width="1170" height="2439" preserveAspectRatio="none" />
      <g font-family="sans-serif" font-weight="900" font-size="40" fill="#262626">
        <text x="134" y="${2090 + yAdjust}">${esc(like || "0")}</text>
        <text x="342" y="${2090 + yAdjust}">${esc(comment || "0")}</text>
        <text x="542" y="${2090 + yAdjust}">${esc(repo || "0")}</text>
        <text x="755" y="${2090 + yAdjust}">${esc(share || "0")}</text>
      </g>
      <text x="38" y="${2183 + yAdjust}" font-family="sans-serif" font-weight="900" font-size="38" fill="#262626">${dTitle}</text>
      ${isOver ? `<text x="${moreLinkX + 8}" y="${2183 + yAdjust}" font-family="sans-serif" font-weight="900" font-size="38" fill="#8E8E8E">더 보기</text>` : ''}
      <text x="38" y="${2260 + yAdjust}" font-family="sans-serif" font-weight="400" font-size="28" fill="#262626">${esc(rawDate)}</text>
    </svg>`.trim();

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    return res.status(200).send(svg);

  } catch (err) {
    console.error("Vercel Runtime Error:", err.message);
    return res.redirect(302, "https://igx.kr/v/1H/ERROR/1");
  }
}
