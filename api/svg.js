export default async function handler(req, res) {
  // 1. 쿼리 파라미터 추출
  const { id, title, date, like, comment, repo, share } = req.query;

  // 필수값 체크
  if (!id || !title) {
    return res.redirect(302, "https://igx.kr/v/1H/ERROR/1");
  }

  try {
    // 2. 외부 이미지 호출 (캐시 방지 및 브라우저인 척 속이기)
    const targetImg = `https://igx.kr/v/1H/SNS/${id}?t=${Date.now()}`;
    const imageResp = await fetch(targetImg, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      }
    });
    
    if (!imageResp.ok) {
      throw new Error(`ImageFetchFailed: ${imageResp.status}`);
    }

    // 3. 이미지 데이터 변환 (가장 안정적인 Buffer 방식)
    const arrayBuffer = await imageResp.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error("EmptyImageBuffer");
    }
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:image/png;base64,${base64Image}`;

    // 4. 텍스트 및 환경 설정
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
    
    // SVG 조립 (독립 태그 구조 유지)
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

    // 5. 응답 전송
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    return res.status(200).send(svg);

  } catch (err) {
    console.error("Critical Error:", err.message);
    // 실제 에러 내용을 확인하기 위해 잠시 주석 처리하거나 에러 이미지로 리다이렉트
    return res.redirect(302, "https://igx.kr/v/1H/ERROR/1");
  }
}
