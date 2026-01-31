export const config = {
  runtime: 'edge', // 가장 빠른 속도와 높은 요청 제한을 위해 Edge 모드 사용
};

export default function handler(req) {
  // URL에서 파라미터 읽기 (예: ?text=안녕&bg=ff5500)
  const { searchParams } = new URL(req.url);
  const text = searchParams.get('text') || '내용을 입력하세요';
  const color = searchParams.get('color') || 'ffffff';
  const bg = searchParams.get('bg') || '000000';
  const size = searchParams.get('size') || '20';

  // SVG 템플릿 정의
  const svg = `
    <svg width="400" height="80" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#${bg};stop-opacity:1" />
          <stop offset="100%" style="stop-color:#444;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" rx="15" fill="url(#grad)" />
      <text 
        x="50%" 
        y="50%" 
        dominant-baseline="middle" 
        text-anchor="middle" 
        font-family="Pretendard, -apple-system, sans-serif" 
        font-size="${size}" 
        font-weight="bold"
        fill="#${color}"
      >
        ${text}
      </text>
    </svg>
  `.trim();

  // 브라우저에 "이것은 이미지(SVG)입니다"라고 알려주며 응답
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1시간 동안 캐시(속도 향상)
    },
  });
}
