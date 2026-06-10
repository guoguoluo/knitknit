// Test XHS full scrape pipeline

function extractXHSData(html, url) {
  const images = [];
  const seen = new Set();
  let title = '';

  const initIdx = html.indexOf('window.__INITIAL_STATE__');
  if (initIdx === -1) return null;

  const eqIdx = html.indexOf('=', initIdx);
  if (eqIdx === -1) return null;

  let start = eqIdx + 1;
  while (start < html.length && ' \t\n\r'.includes(html[start])) start++;

  let depth = 0, end = start;
  for (; end < html.length; end++) {
    if (html[end] === '{') depth++;
    else if (html[end] === '}') { depth--; if (depth === 0) break; }
  }

  let jsonStr = html.substring(start, end + 1);
  jsonStr = jsonStr.replace(/:undefined/g, ':null').replace(/:NaN/g, ':null');

  try {
    const state = JSON.parse(jsonStr);
    let noteData = null;

    if (state?.note?.noteDetailMap) {
      for (const noteId of Object.keys(state.note.noteDetailMap)) {
        const nd = state.note.noteDetailMap[noteId];
        if (nd?.note && Object.keys(nd.note).length > 0) {
          noteData = nd.note;
          break;
        }
      }
    }

    if (!noteData) {
      noteData = state?.note?.noteDetail?.note;
    }

    if (noteData) {
      console.log('Found note data!');
      console.log('Title:', noteData.title);
      console.log('Has imageList:', !!noteData.imageList, noteData.imageList?.length);
      if (noteData.imageList) {
        noteData.imageList.slice(0, 3).forEach((img, i) => {
          console.log(`Image ${i}:`, img.urlDefault || img.url);
        });
      }
    } else {
      console.log('No note data found. State.note keys:', Object.keys(state?.note || {}));
    }
  } catch(e) { console.log('Parse error:', e.message); return null; }
}

const url = 'https://www.xiaohongshu.com/explore/6912987200000000070157ef';
fetch(url, {
  signal: AbortSignal.timeout(10000),
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
})
  .then(r => r.text())
  .then(h => { extractXHSData(h, url); })
  .catch(e => console.log('Fetch error:', e.message));