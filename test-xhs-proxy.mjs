// Try XHS API via corsproxy.io
const noteId = '6912987200000000070157ef';
const apiUrl = 'https://edith.xiaohongshu.com/api/sns/web/v1/feed?source_note_id=' + noteId;
const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(apiUrl);

console.log('Fetching via proxy:', proxyUrl);

fetch(proxyUrl, {
  signal: AbortSignal.timeout(10000),
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
})
  .then(r => { console.log('Status:', r.status); return r.text(); })
  .then(t => {
    console.log('Response length:', t.length);
    console.log(t.substring(0, 500));
    try {
      const d = JSON.parse(t);
      console.log('Top keys:', Object.keys(d));
      if (d.data) {
        console.log('data keys:', Object.keys(d.data));
        if (d.data.items && d.data.items[0]) {
          const item = d.data.items[0];
          console.log('item keys:', Object.keys(item));
          if (item.note_card) {
            console.log('Title:', item.note_card.display_title);
            if (item.note_card.image_list) {
              item.note_card.image_list.forEach((img, i) => {
                console.log('Image', i, ':', img.url_default || img.url);
              });
            }
          }
        }
      }
    } catch(e) { console.log('JSON error:', e.message); }
  })
  .catch(e => console.log('Error:', e.message));