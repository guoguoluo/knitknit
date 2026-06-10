const url = 'https://www.xiaohongshu.com/explore/6912987200000000070157ef';
fetch(url, {
  signal: AbortSignal.timeout(10000),
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
})
  .then(r => r.text())
  .then(h => {
    const idx = h.indexOf('window.__INITIAL_STATE__');
    const eqIdx = h.indexOf('=', idx);
    let start = eqIdx + 1;
    while (start < h.length && ' \t\n\r'.includes(h[start])) start++;
    
    let depth = 0, end = start;
    for (; end < h.length; end++) {
      if (h[end] === '{') depth++;
      else if (h[end] === '}') { depth--; if (depth === 0) break; }
    }
    
    let json = h.substring(start, end + 1);
    json = json.replace(/:undefined/g, ':null').replace(/:NaN/g, ':null');
    const state = JSON.parse(json);
    console.log('note keys:', Object.keys(state.note));
    if (state.note?.noteDetailMap) {
      console.log('noteDetailMap keys:', Object.keys(state.note.noteDetailMap));
      const firstKey = Object.keys(state.note.noteDetailMap)[0];
      console.log('First key:', firstKey);
      console.log('Value:', JSON.stringify(state.note.noteDetailMap[firstKey]).substring(0, 1000));
    }
    // Try noteDetailMap
    const keys = Object.keys(state.note);
    keys.forEach(k => {
      if (state.note[k] && typeof state.note[k] === 'object' && state.note[k].note) {
        console.log('Found note at state.note.' + k + '.note');
        console.log('Title:', state.note[k].note.title);
      }
    });
  })
  .catch(e => console.log('Error:', e.message));