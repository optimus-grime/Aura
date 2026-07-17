const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// Replace standard generateContent closing
content = content.replace(/  \}\);\n\n  const result/g, '  }));\n\n  const result');
content = content.replace(/      \}\);\n\n      res\.json/g, '      }));\n\n      res.json');
content = content.replace(/      \}\);\n      \n      const result/g, '      }));\n      \n      const result');

// More robust regex: find the end of the `withRetry` call.
// We are looking for `    });` or `      });` that closes `ai.models.generateContent({`
content = content.replace(/(\s+)config: \{(.*?)\}\n(\s+)\}\);/g, '$1config: {$2}\n$3}));');
content = content.replace(/(\s+)responseMimeType:(.*?)\n(\s+)\}\n(\s+)\}\);/g, '$1responseMimeType:$2\n$3}\n$4}));');
content = content.replace(/(\s+)responseSchema:(.*?)\n(\s+)\}\n(\s+)\}\);/g, '$1responseSchema:$2\n$3}\n$4}));');

fs.writeFileSync('server.ts', content);
