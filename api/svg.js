export default {
  async fetch(request) {
    const url = new URL(request.url);
    const params = url.searchParams;
    const userAgent = request.headers.get("User-Agent") || "";

    const isIos = /iPhone|iPad|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    const yAdjust = isIos ? -1 : (isAndroid ? 1 : 0);

    const pathParts = url.pathname.split('/').filter(p => p);
    const imgId = pathParts[0];

    if (!imgId || !params.get('title')) {
      return Response.redirect("https://igx.kr/v/1H/ERROR/1", 302);
    }

    const targetImg = `https://igx.kr/v/1H/SNS/${imgId}`;

    try {
      const imageResp = await fetch(targetImg);
      if (!imageResp.ok) throw new Error("InvalidImagePath");

      const arrayBuffer = await imageResp.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < uint8Array.length; i++) binary += String.fromCharCode(uint8Array[i]);
      const dataUrl = `data:image/png;base64,${btoa(binary)}`;

      const esc = (s) => (s || "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

      // [수정] title과 date 모두 언더바(_)를 공백으로 치환
      const rawTitle = (params.get('title') || "").replace(/_/g, " ");
      const rawDate = (params.get('date') || "").replace(/_/g, " ");
      
      const date = esc(rawDate);
      const like = esc(params.get('like') || "0");
      const comment = esc(params.get('comment') || "0");
      const repo = esc(params.get('repo') || "0");
      const share = esc(params.get('share') || "0");

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

      return new Response(svg, { 
        headers: { 
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        } 
      });

    } catch (e) {
      return Response.redirect("https://igx.kr/v/1H/ERROR/1", 302);
    }
  }
};
