const url = 'https://www.ravelry.com/patterns/library/sol-top-2';
fetch(url, {
  signal: AbortSignal.timeout(8000),
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
})
  .then(r => r.text())
  .then(h => {
    // Check for JSON-LD type patterns
    const m = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi.exec(h);
    if (m) {
      console.log('JSON-LD found! Length:', m[1].length);
      try {
        const ld = JSON.parse(m[1]);
        console.log(JSON.stringify(ld).substring(0, 1000));
      } catch(e) { console.log('Parse error:', e.message); }
    }
    
    // Check for og:image - case insensitive and different quote combinations
    const allMeta = h.match(/<meta[^>]+>/g);
    const ogMeta = allMeta?.filter(m => /property=["']og:/i.test(m)).slice(0, 5);
    console.log('OG meta tags found:', ogMeta?.length || 0);
    if (ogMeta) ogMeta.forEach(m => console.log(m));
    
    // Check if Ravelry has image in a standard format  
    const imgRe = /<img[^>]+src=["']([^"']*pattern[^"']*)["'][^>]*>/i.exec(h);
    if (imgRe) console.log('Pattern image found:', imgRe[1]);
    
    // Check for standard <img> tags with data attributes
    const mainImg = /<img[^>]+(?:data-src|src)=["']([^"']{20,})["'][^>]*>/gi.exec(h);
    if (mainImg) console.log('Main image found:', mainImg[1].substring(0, 100));
    
    console.log('Title:', /<title>([\s\S]*?)<\/title>/i.exec(h)?.[1]?.trim());
  })
  .catch(e => console.log('Error:', e.message));