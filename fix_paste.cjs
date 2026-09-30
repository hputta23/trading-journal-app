const fs = require('fs');
let code = fs.readFileSync('src/components/JournalView.jsx', 'utf-8');

const globalPasteStr = `  useEffect(() => {
    const handleGlobalPaste = (e) => {
      const items = e.clipboardData?.items || e.originalEvent?.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = items[i].getAsFile();
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_WIDTH = 800;
              let width = img.width;
              let height = img.height;

              if (width > MAX_WIDTH) {
                height = Math.round((height * MAX_WIDTH) / width);
                width = MAX_WIDTH;
              }
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, width, height);
              const compressedBase64 = canvas.toDataURL('image/jpeg', 0.5);
              setEntry(prev => ({ ...prev, imageUrl: compressedBase64 }));
              toast.success('Image pasted successfully!');
            };
            img.src = event.target.result;
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, []);`;

const unifiedPasteLogic = `  const processImageFile = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
        updateField('imageUrl', compressedBase64);
        toast.success('Image pasted successfully!');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleDivPaste = (e) => {
    const items = e.clipboardData?.items || e.originalEvent?.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        e.stopPropagation();
        processImageFile(items[i].getAsFile());
        break;
      }
    }
  };

  const handleButtonPaste = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const clipboardItem of clipboardItems) {
        const imageTypes = clipboardItem.types.filter(type => type.startsWith('image/'));
        for (const imageType of imageTypes) {
          const blob = await clipboardItem.getType(imageType);
          processImageFile(blob);
          return;
        }
      }
      toast.error('No image found in clipboard');
    } catch (err) {
      console.error(err);
      toast.error('Browser blocked paste. Try Cmd+V in the dashed box.');
    }
  };

  useEffect(() => {
    const handleGlobalPaste = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const items = e.clipboardData?.items || e.originalEvent?.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          processImageFile(items[i].getAsFile());
          break;
        }
      }
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, []);`;

code = code.replace(globalPasteStr, unifiedPasteLogic);

const oldDivStr = `                <div
                  style={{
                    width: '100%',
                    padding: '24px',
                    textAlign: 'center',
                    border: '2px dashed var(--border-active)',
                    borderRadius: 10,
                    marginBottom: 16,
                    background: 'var(--bg-input)',
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                    ...fontStyle
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 600 }}>Press Ctrl+V / Cmd+V anywhere on this page to paste a chart</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: 11, opacity: 0.6 }}>Or enter a URL below</p>
                </div>`;

const newDivStr = `                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Attach an image of your setup:</span>
                  <button onClick={handleButtonPaste} style={{ padding: '6px 14px', borderRadius: 8, background: 'var(--accent-glow)', border: '1px solid var(--border-active)', color: 'var(--text-accent)', fontSize: 12, fontWeight: 700, cursor: 'pointer', ...fontStyle }}>
                    📋 Paste Image
                  </button>
                </div>
                <div
                  tabIndex={0}
                  onPaste={handleDivPaste}
                  style={{
                    width: '100%',
                    padding: '24px',
                    textAlign: 'center',
                    border: '2px dashed var(--border-active)',
                    borderRadius: 10,
                    marginBottom: 16,
                    background: 'var(--bg-input)',
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                    cursor: 'text',
                    outline: 'none',
                    ...fontStyle
                  }}
                  onFocus={e => e.target.style.background = 'var(--accent-glow)'}
                  onBlur={e => e.target.style.background = 'var(--bg-input)'}
                >
                  <p style={{ margin: 0, fontWeight: 600 }}>Click here and press Ctrl+V / Cmd+V to paste</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: 11, opacity: 0.6 }}>Or use the Paste button above</p>
                </div>`;

code = code.replace(oldDivStr, newDivStr);

fs.writeFileSync('src/components/JournalView.jsx', code);
console.log('Script applied.');
