const fs = require('fs');
let code = fs.readFileSync('src/components/JournalView.jsx', 'utf-8');

const perfMarkerStart = '              {/* ── Session Performance Metrics ── */}';
const perfMarkerEnd = '              {/* ── Session Overview (Grade, Discipline, Mood, Market) ── */}';
const tradesMarkerStart = '              {/* ── Session Executed Trades ── */}';
const tradesMarkerEnd = '            </div>\n          </div>\n        </div>\n      </div>\n    </div>\n  );\n}';

let perfBlock = code.substring(code.indexOf(perfMarkerStart), code.indexOf(perfMarkerEnd));
let tradesBlock = code.substring(code.indexOf(tradesMarkerStart), code.indexOf(tradesMarkerEnd));

code = code.replace(perfBlock, '');
code = code.replace(tradesBlock, '');

const midSection = `
          {/* ════ SESSION DATA ROW ════ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" style={{ marginBottom: 20 }}>
            <div className="lg:col-span-1" style={{ display: 'flex', flexDirection: 'column' }}>
${perfBlock}
            </div>
            <div className="lg:col-span-2" style={{ display: 'flex', flexDirection: 'column' }}>
${tradesBlock}
            </div>
          </div>
`;

code = code.replace('          {/* ════ TWO-COLUMN GRID (post-session) ════ */}', midSection + '\n          {/* ════ TWO-COLUMN GRID (post-session) ════ */}');

fs.writeFileSync('src/components/JournalView.jsx', code);
console.log('Refactor complete');
