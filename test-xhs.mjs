const url = 'https://www.xiaohongshu.com/explore/6912987200000000070157ef';
fetch(url, {
  signal: AbortSignal.timeout(8000),
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
})
  .then(r => { console.log('XHS Status:', r.status); return r.text(); })
  .then(h => {
    const m = /<meta\s+[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i.exec(h);
    console.log('og:title:', m ? m[1] : 'NOT FOUND');
    const m2 = /<meta\s+[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i.exec(h);
    console.log('og:image:', m2 ? m2[1] : 'NOT FOUND');
    const m3 = /window\.__INITIAL_STATE__/.exec(h);
    console.log('__INITIAL_STATE__:', m3 ? 'FOUND' : 'NOT FOUND');
    const m4 = /application\/ld\+json/.exec(h);
    console.log('JSON-LD:', m4 ? 'FOUND' : 'NOT FOUND');
    console.log('HTML length:', h.length, 'First 400:', h.substring(0, 400));
  })
  .catch(e => console.log('Error:', e.message));