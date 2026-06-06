export async function GET() {
  const size = 512;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#9333EA"/>
        <stop offset="100%" stop-color="#EC4899"/>
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" rx="${size * 0.125}" fill="url(#g)"/>
    <text x="50%" y="55%" font-size="${size * 0.5}" text-anchor="middle" dominant-baseline="central" fill="white" font-family="Arial, sans-serif">🧶</text>
  </svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}

export const dynamic = "force-static";