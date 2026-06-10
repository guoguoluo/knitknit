// Try XHS API endpoint
const noteId = '6912987200000000070157ef';
const apiUrl = 'https://edith.xiaohongshu.com/api/sns/web/v1/feed';
const searchUrl = 'https://edith.xiaohongshu.com/api/sns/web/v1/feed/detail?' + 
  new URLSearchParams({ source_note_id: noteId, source: 'web_explore_feed' });

console.log('Trying:', searchUrl);

fetch(searchUrl, {
  signal: AbortSignal.timeout(8000),
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Referer': 'https://www.xiaohongshu.com/'
  }
})
  .then(r => { console.log('Status:', r.status); return r.json(); })
  .then(d => {
    console.log('Data keys:', Object.keys(d));
    if (d.data) {
      console.log('data keys:', Object.keys(d.data));
      if (d.data.items && d.data.items[0]) {
        const item = d.data.items[0];
        console.log('item keys:', Object.keys(item));
        if (item.note_card) {
          const nc = item.note_card;
          console.log('note_card keys:', Object.keys(nc));
          console.log('title:', nc.display_title || nc.title);
          if (nc.image_list) {
            nc.image_list.forEach((img, i) => {
              console.log(`Image ${i}:`, img.url_default || img.url ? img.url_default?.substring(0, 80) || img.url?.substring(0, 80) : 'N/A');
            });
          }
        }
      } else {
        console.log('data.items:', d.data.items ? d.data.items.length : 'N/A');
        console.log(JSON.stringify(d.data).substring(0, 500));
      }
    }
  })
  .catch(e => console.log('Error:', e.message));