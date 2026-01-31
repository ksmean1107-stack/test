export default async function handler(req, res) {
  try {
    // 1. URL 및 파라미터 파싱
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const url = new URL(req.url, `${protocol}://${host}`);
    const searchParams = url.searchParams;
    
    const imgId = searchParams.get('id');
    const titleParam = searchParams.get('title');

    // 필수 파라미터 체크
    if (!imgId || !titleParam) {
      return res.redirect(302, "https://igx.kr/v/1H/ERROR/1");
    }

    // 2. 외부 이미지 호출
    const targetImg = `https://igx.kr/v/1H/SNS/${imgId}`;
    const imageResp = await fetch(targetImg);
    
    if (!imageResp.ok) {
      return res.redirect(302, "https://igx.kr/v/1H/ERROR/1");
    }

    // 3. 이미지 Buffer 변환 (Vercel/Node.js 최적화)
    const arrayBuffer = await imageResp.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:image/png;base64,${base64Image}`;

    // 4. 환경 변수 및 텍스트 처리
    const userAgent = req.headers['user-agent'] || "";
    const isIos = /iPhone|iPad|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    const yAdjust = isIos ? -1 : (isAndroid ? 1 : 0);

    const esc = (s) => (s || "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

    const rawTitle = titleParam.replace(/_/g, " ");
    const rawDate = (searchParams.get('date') || "").replace(/_/g, " ");
    
    const date = esc(rawDate);
    const like = esc(searchParams.get('like') || "0");
    const comment = esc(searchParams.get('comment') || "0");
    const repo = esc(searchParams.get('repo') || "0");
    const share = esc(searchParams.get('share') || "0");

    const LIMIT = 22;
    const isOver = rawTitle.length > LIMIT;
    const displayTitle = esc(isOver ? rawTitle.substring(0, LIMIT) + "..." : rawTitle);

    const charCount = displayTitle.length;
    const moreLinkX = 38 + (charCount * 26.5); 
    const FONT = "sans-serif";
    
    // 텍스트 태그 조립
    const titleTag = `<text x="38" y="${2183 + yAdjust}" font-family="${FONT}" font-weight="900" font-size="38" fill="#262626">${displayTitle}</text>`;
    const moreTag = isOver ? `<text x="${moreLinkX + 8}" y="${2183 + yAdjust}" font-family="${FONT}" font-weight="900" font-size="38" fill="#8E8E8E">더 보기</text>` : '';

    // 5. SVG 생성
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1170 2439" width="1170" height="2439">
      <image href="${dataUrl}" x="0" y="0" width="1170" height="2439" preserveAspectRatio="none" />
      <g font-family="${FONT}" font-weight="900" font-size="40" fill="#262626">
        <text x="134" y="${2090 + yAdjust}">${like}</text>
        <text x="342" y="${2090 + yAdjust}">${comment}</text>
        <text x="542" y="${2090 + yAdjust}">${repo}</text>
        <text x="755" y="${2090 + yAdjust}">${share}</text>
      </g>
      ${titleTag}
      ${moreTag}
      <text x="38" y="${2260 + yAdjust}" font-family="${FONT}" font-weight="400" font-size="28" fill="#262626">${date}</text>
    </svg>`.trim();

    // 6. 응답 헤더 설정
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.status(200).send(svg);

  } catch (error) {
    console.error(error);
    return res.redirect(302, "https://igx.kr/v/1H/ERROR/1");
  }
}
