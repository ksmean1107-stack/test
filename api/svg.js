export default async function handler(req, res) {
  // 1. 쿼리 파라미터 추출
  const { id, title, date, like, comment, repo, share } = req.query;

  if (!id || !title) {
    return res.redirect(302, "https://igx.kr/v/1H/ERROR/1");
  }

  try {
    const targetUrl = `https://igx.kr/v/1H/SNS/${id}`;
    
    // 2. 관리자가 허용한 Vercel 요청임을 증명하는 헤더 구성
    // 브라우저인 것처럼 신분증(User-Agent)을 확실히 달아줍니다.
    const imageResp = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Cache-Control': 'no-cache'
      }
    });

    if (!imageResp.ok) {
      // 만약 여기서 403이 뜬다면 서버 로그에 상세 내용을 남깁니다.
      console.error(`Fetch failed with status: ${imageResp.status}`);
      return res.redirect(302, "https://igx.kr/v/1H/ERROR/1");
    }

    // 3. 이미지 데이터를 base64로 변환
    const arrayBuffer = await imageResp.arrayBuffer();
    const dataUrl = `data:image/png;base64,${Buffer.from(arrayBuffer).toString('base64')}`;

    // 4. 텍스트 처리 및 이스케이프 (기존 로직 유지)
    const esc = (s) => (s || "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    const rawTitle = title.replace(/_/g, " ");
    const rawDate = (date || "").replace(/_/g, " ");
    
    // 기기별 보정
    const userAgent = req.headers['user-agent'] || "";
    const isIos = /iPhone|iPad|iPod/.test(userAgent);
    const yAdjust = isIos ? -1 : 0;

    const LIMIT = 22;
    const isOver = rawTitle.length > LIMIT;
    const dTitle = esc(isOver ? rawTitle.substring(0, LIMIT) + "..." : rawTitle);
    
    // 더 보기 위치 계산
    const charCount = dTitle.length;
    const moreLinkX = 38 + (charCount * 26.5); 

    // 5. SVG 생성
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

    // 6. 최종 응답
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    return res.status(200).send(svg);

  } catch (err) {
    console.error("Vercel Runtime Error:", err.message);
    return res.redirect(302, "https://igx.kr/v/1H/ERROR/1");
  }
}
