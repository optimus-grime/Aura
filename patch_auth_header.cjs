const fs = require('fs');
const glob = require('glob');

// Find all tsx files
const files = glob.sync('src/**/*.tsx');

files.forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  // replace 'Authorization': \`Bearer \${await auth.currentUser?.getIdToken()}\`
  // with 'Authorization': \`Bearer \${(await auth.currentUser?.getIdToken()) || ''}\`
  code = code.replace(/'Authorization': \`Bearer \$\{await auth\.currentUser\?\.getIdToken\(\)\}\`/g, 
    "'Authorization': `Bearer ${(await auth.currentUser?.getIdToken()) || ''}`");
    
  // replace user?.getIdToken() back if it was changed
  code = code.replace(/'Authorization': \`Bearer \$\{await user\?\.getIdToken\(\)\}\`/g, 
    "'Authorization': `Bearer ${(await auth.currentUser?.getIdToken()) || ''}`");
    
  fs.writeFileSync(file, code);
});
