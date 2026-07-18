const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(`        {activeTab === 'import' && (
          <CSVImporter onImportComplete={() => setActiveTab('trends')} />
        )}
      </div>`, `        {activeTab === 'import' && (
          <CSVImporter onImportComplete={() => setActiveTab('trends')} />
        )}
          </>
        )}
      </div>`);

fs.writeFileSync('src/App.tsx', code);
