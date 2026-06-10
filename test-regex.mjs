// Simulate the exact regex from extractGenericData to verify it matches Ravelry meta tags
const html = `<meta content="Sol Top pattern by Alice Hoyle" property="og:title">
<meta property="og:image" content="https://images4-g.ravelrycache.com/uploads/passiveknit/940164839/741aa3_85ca8be9978b409ebf8c9c469b8c05c8_mv2_small2.jpg">
<meta content="https://images4-g.ravelrycache.com/uploads/passiveknit/940164839/741aa3_85ca8be9978b409ebf8c9c469b8c05c8_mv2_small2.jpg" property="og:image">`;

// Test og:image regex
const metaImgRe = /<meta\s+[^>]*(?:(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*content=["']([^"']+)["']|content=["']([^"']+)["'][^>]*(?:property|name)=["'](?:og:image|twitter:image)["'])/gi;
let m;
while ((m = metaImgRe.exec(html)) !== null) {
  console.log('Image matched:', m[1] || m[2]);
}

// Test og:title regex
const ogTitle = html.match(/<meta\s+[^>]*(?:property=["']og:title["'][^>]*content=["']([^"']+)["']|content=["']([^"']+)["'][^>]*property=["']og:title["'])/i);
console.log('Title matched:', ogTitle ? (ogTitle[1] || ogTitle[2]) : 'NONE');