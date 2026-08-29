const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Imports
code = code.replace(
  "import CapitalView from './components/CapitalView';",
  "import CapitalView from './components/CapitalView';\nimport CommandPalette from './components/CommandPalette';\nimport RiskSizerModal from './components/RiskSizerModal';"
);

// 2. State
code = code.replace(
  "const [showGlobalTradeModal, setShowGlobalTradeModal] = useState(false);",
  "const [showGlobalTradeModal, setShowGlobalTradeModal] = useState(false);\n  const [showCommandPalette, setShowCommandPalette] = useState(false);\n  const [showRiskSizer, setShowRiskSizer] = useState(false);"
);

// 3. useEffect Cmd+K
code = code.replace(
  "// Set up auth state listener",
  "// Keyboard shortcuts\n  useEffect(() => {\n    const handleKeyDown = (e) => {\n      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {\n        e.preventDefault();\n        setShowCommandPalette(prev => !prev);\n      }\n    };\n    window.addEventListener('keydown', handleKeyDown);\n    return () => window.removeEventListener('keydown', handleKeyDown);\n  }, []);\n\n  // Set up auth state listener"
);

// 4. Render Modals
const modals = `
      <CommandPalette 
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onNavigate={handleTabChange}
        onOpenNewTrade={() => { setEditingTrade(null); setShowGlobalTradeModal(true); setMobileMenuOpen(false); }}
        onOpenRiskSizer={() => setShowRiskSizer(true)}
      />

      <RiskSizerModal
        isOpen={showRiskSizer}
        onClose={() => setShowRiskSizer(false)}
      />
      <Toaster`;

code = code.replace("<Toaster", modals);

fs.writeFileSync('src/App.jsx', code);
