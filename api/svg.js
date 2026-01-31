export default async function handler(req, res) {
  // 1. URL 파라미터 및 환경 변수 추출
  const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
  const userAgent = req.headers['user-agent'] || "";

  // 디바이스 보정 (Vercel 환경에 맞게 조정)
  const isIos = /iPhone|iPad|iPod/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);
  const yAdjust = isIos ? -1 : (isAndroid ? 1 : 0);

  // 2. 파라미터 추출 (id, title, date 등)
  const imgId = searchParams.get('id'); // https://도메인/api/svg?id=1 방식으로 호출
  const titleParam = searchParams.get('title');

  // 필수 파라미터 체크 (없으면 에러 이미지 리다이렉트)
  if (!imgId || !titleParam) {
    return res.redirect(302, "https://igx.kr/v/1H/ERROR/1");
  }

  const targetImg = `https://igx.kr/v/1H/SNS/${imgId}`;

  try {
    const imageResp = await fetch(targetImg);
    if (!imageResp.ok) throw new Error("InvalidImagePath");

    const arrayBuffer = await imageResp.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const dataUrl = `data:image/png;base64,${buffer.toString('base64')}`;

    const esc = (s) => (s || "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

    // 언더바(_) 공백 치환 로직
    const rawTitle = titleParam.replace(/_/g, " ");
    const rawDate = (searchParams.get('date') || "").replace(/_/g, " ");
    
    const date = esc(rawDate);
    const like = esc(searchParams.get('like') || "0");
    const comment = esc(searchParams.get('comment') || "0");
    const repo = esc(searchParams.get('repo') || "0");
    const share = esc(searchParams.get('share') || "0");

    // 제목 및 더 보기 로직 (독립 태그 분리 유지)
    const LIMIT = 22;
    const isOver = rawTitle.length > LIMIT;
    const displayTitle = esc(isOver ? rawTitle.substring(0, LIMIT) + "..." : rawTitle);

    const charCount = displayTitle.length;
    const moreLinkX = 38 + (charCount * 26.5); 

    const FONT = "sans-serif";
    
    const titleTag = `<text x="38" y="${2183 + yAdjust}" font-family="${FONT}" font-weight="900" font-size="38" fill="#262626">${displayTitle}</text>`;
    const moreTag = isOver ? `<text x="${moreLinkX + 8}" y="${2183 + yAdjust}" font-family="${FONT}" font-weight="900" font-size="38" fill="#8E8E8E">더 보기</text>` : '';

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

    // Vercel 응답 설정
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.status(200).send(svg);

  } catch (e) {
    return res.redirect(302, "https://igx.kr/v/1H/ERROR/1");
  }
}
