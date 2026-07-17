const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(/await ai\.models\.generateContent\(/g, 'await withRetry(() => ai.models.generateContent(');

// Now we need to close the withRetry call. 
// Since generateContent({ ... }) is closed by }); we need to replace `});` with `}));` for those specific calls.
// Wait, a better way is to parse the contents using a simple AST or since we know the structure:
// The occurrences are:
// await ai.models.generateContent({
//    ...
// });
// So we can replace:
// await ai\.models\.generateContent\(\{([\s\S]*?)\}\);
// with
// await withRetry(() => ai.models.generateContent({$1}));

content = content.replace(/await ai\.models\.generateContent\(\{\s*([\s\S]*?)\s*\}\);/g, 'await withRetry(() => ai.models.generateContent({\n$1\n}));');

fs.writeFileSync('server.ts', content);
console.log('done');
