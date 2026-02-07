import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import Editor from './components/editor/Editor';
import BookScene from './components/game/BookScene';
import useStoryStore from './stores/useStoryStore';

function App() {
  const isPlaying = useStoryStore((state) => state.isPlaying);
  const setPlaying = useStoryStore((state) => state.setPlaying);
  const nodes = useStoryStore((state) => state.nodes);
  const edges = useStoryStore((state) => state.edges);
  const loadStory = useStoryStore((state) => state.loadStory);
  const clearNode = useStoryStore((state) => state.clearNode);
  const [mode, setMode] = useState('EDIT'); // 'EDIT' | 'PLAY'
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const fileMenuRef = useRef(null);
  const loadFileInputRef = useRef(null);

  // Sync mode with store's playing state
  useEffect(() => {
    if (isPlaying) {
      setMode('PLAY');
    }
  }, [isPlaying]);

  // Close file menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(e.target)) {
        setFileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ensure file menu is closed when entering PLAY mode
  useEffect(() => {
    if (mode === 'PLAY') {
      setFileMenuOpen(false);
    }
  }, [mode]);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (newMode === 'EDIT') {
      setPlaying(false);
    }
  };

  const handleSaveStory = useCallback(() => {
    setFileMenuOpen(false);
    const data = { nodes, edges };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'story.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  const handleLoadStoryClick = useCallback(() => {
    setFileMenuOpen(false);
    loadFileInputRef.current?.click();
  }, []);

  const handleClear = useCallback(() => {
    setFileMenuOpen(false);
    clearNode();
  }, [clearNode]);

  const handleLoadStoryFile = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result ?? '{}');
        const loadedNodes = data.nodes;
        const loadedEdges = data.edges;
        if (Array.isArray(loadedNodes) && Array.isArray(loadedEdges)) {
          loadStory(loadedNodes, loadedEdges);
        } else {
          console.warn('Invalid story file: expected { nodes, edges }');
        }
      } catch (err) {
        console.error('Failed to load story:', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [loadStory]);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <div className="logo">
            ScribrEngine
          </div>
          {mode === 'EDIT' && (
            <div className="file-menu-wrapper" ref={fileMenuRef}>
              <button
                type="button"
                className="file-menu-trigger"
                onClick={() => setFileMenuOpen((open) => !open)}
                aria-expanded={fileMenuOpen}
                aria-haspopup="true"
                aria-label="File menu"
              >
                <span>File</span>
                <span className="file-menu-caret" aria-hidden="true" />
              </button>
              {fileMenuOpen && (
                <div className="file-menu-dropdown" role="menu">
                  <button type="button" role="menuitem" onClick={handleSaveStory}>
                    <span className="file-menu-item-icon" aria-hidden="true">💾</span>
                    Save Story
                  </button>
                  <button type="button" role="menuitem" onClick={handleLoadStoryClick}>
                    <span className="file-menu-item-icon" aria-hidden="true">📂</span>
                    Load Story
                  </button>
                  <button type="button" role="menuitem" onClick={handleClear}>
                    <span className="file-menu-item-icon" aria-hidden="true">⟳</span>
                    Clear Nodes
                  </button>
                </div>
              )}
              <input
                ref={loadFileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleLoadStoryFile}
                style={{ display: 'none' }}
                aria-hidden="true"
              />
            </div>
          )}
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
