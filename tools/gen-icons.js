const si = require('simple-icons');
const slugs = ['openai','googlegemini','anthropic','perplexity','microsoftcopilot','canva','adobe','capcut','elevenlabs','googleclassroom','kahoot','scratch','notion','microsoft','github'];
const out = {};
const missing = [];
for (const s of slugs) {
  const key = 'si' + s.charAt(0).toUpperCase() + s.slice(1);
  const ico = si[key];
  if (ico && ico.path) out[s] = { path: ico.path, color: '#' + ico.hex };
  else { out[s] = null; missing.push(s); }
}
console.log(JSON.stringify(out));
console.error('MISSING: ' + (missing.join(',') || 'none'));
