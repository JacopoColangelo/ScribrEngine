import React, { useState, useEffect } from 'react';
import './App.css';
import Editor from './components/editor/Editor';
import BookScene from './components/game/BookScene';
import useStoryStore from './stores/useStoryStore';

function App() {
  const isPlaying = useStoryStore((state) => state.isPlaying);
  const setPlaying = useStoryStore((state) => state.setPlaying);
  const [mode, setMode] = useState('EDIT'); // 'EDIT' | 'PLAY'

  // Sync mode with store's playing state
  useEffect(() => {
    if (isPlaying) {
      setMode('PLAY');
    }
  }, [isPlaying]);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (newMode === 'EDIT') {
      setPlaying(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">
          ScribrEngine
        </div>
        <div className="mode-toggle">
          <button
            className={mode === 'EDIT' ? 'active' : ''}
            onClick={() => handleModeChange('EDIT')}
          >
            Editor
          </button>
          <button
            className={mode === 'PLAY' ? 'active' : ''}
            onClick={() => handleModeChange('PLAY')}
          >
            Play
          </button>
        </div>
      </header>

      <main className="app-content">
        {mode === 'EDIT' ? <Editor /> : <BookScene />}
      </main>
    </div>
  );
}

export default App;
