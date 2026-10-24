import React, { useState } from 'react';

interface DesktopSimulatorModalProps {
  app: string;
  onClose: () => void;
}

export const DesktopSimulatorModal: React.FC<DesktopSimulatorModalProps> = ({ app, onClose }) => {
  // Calculator state
  const [calcInput, setCalcInput] = useState<string>('0');
  // Notepad state
  const [noteContent, setNoteContent] = useState<string>(
    'VoxPilot AI - Voice Assisted Note\nCreated: ' + new Date().toLocaleString() + '\n\n'
  );

  const handleCalcClick = (val: string) => {
    if (val === 'C') {
      setCalcInput('0');
    } else if (val === '=') {
      try {
        // Safe evaluation for basic math expression
        const sanitized = calcInput.replace(/[^0-9+\-*/.]/g, '');
        // eslint-disable-next-line no-eval
        const result = Function(`'use strict'; return (${sanitized})`)();
        setCalcInput(String(result));
      } catch {
        setCalcInput('Error');
      }
    } else {
      if (calcInput === '0' || calcInput === 'Error') {
        setCalcInput(val);
      } else {
        setCalcInput(calcInput + val);
      }
    }
  };

  const handleDownloadNote = () => {
    const blob = new Blob([noteContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voxpilot-note-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-6 14H7v-2h6v2zm4-4H7v-2h10v2zm0-4H7V7h10v2z" />
            </svg>
            Native Windows App: {app.charAt(0).toUpperCase() + app.slice(1)}
          </h3>
          <button className="close-modal-btn" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {app === 'calculator' || app === 'calc' ? (
            <div>
              <div className="calc-display">{calcInput}</div>
              <div className="calculator-grid">
                {['C', '(', ')', '/'].map((item) => (
                  <button key={item} className="calc-btn op" onClick={() => handleCalcClick(item)}>
                    {item}
                  </button>
                ))}
                {['7', '8', '9', '*'].map((item) => (
                  <button key={item} className={`calc-btn ${isNaN(Number(item)) ? 'op' : ''}`} onClick={() => handleCalcClick(item)}>
                    {item}
                  </button>
                ))}
                {['4', '5', '6', '-'].map((item) => (
                  <button key={item} className={`calc-btn ${isNaN(Number(item)) ? 'op' : ''}`} onClick={() => handleCalcClick(item)}>
                    {item}
                  </button>
                ))}
                {['1', '2', '3', '+'].map((item) => (
                  <button key={item} className={`calc-btn ${isNaN(Number(item)) ? 'op' : ''}`} onClick={() => handleCalcClick(item)}>
                    {item}
                  </button>
                ))}
                {['0', '.'].map((item) => (
                  <button key={item} className="calc-btn" onClick={() => handleCalcClick(item)}>
                    {item}
                  </button>
                ))}
                <button className="calc-btn equal" onClick={() => handleCalcClick('=')}>
                  =
                </button>
              </div>
            </div>
          ) : app === 'notepad' ? (
            <div>
              <textarea
                className="notepad-textarea"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Type your notes here..."
              />
              <div className="notepad-actions">
                <button className="action-button" onClick={() => setNoteContent('')}>
                  Clear
                </button>
                <button className="action-button primary" onClick={handleDownloadNote}>
                  Save File (.txt)
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💻</div>
              <p style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                Application Dispatched: <strong>{app.toUpperCase()}</strong>
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Command sent to desktop process manager.
              </p>
              <button className="action-button primary" onClick={onClose}>
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
