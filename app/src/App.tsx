import React, { useState, useEffect } from 'react';
import './App.css';
import { Settings, EyeOff, Eye } from 'lucide-react';
import { useCamera } from './hooks/useCamera';
import { useAILoop } from './hooks/useAILoop';
import { SettingsDrawer } from './components/SettingsDrawer';
import { AIOverlay } from './components/AIOverlay';
import { ControlPanel } from './components/ControlPanel';
import { type AppSettings, DEFAULT_SETTINGS } from './types';

function App() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('ai_guide_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUiVisible, setIsUiVisible] = useState(true);

  const { videoRef, canvasRef, takeSnapshot, error: cameraError } = useCamera();
  const {
    loopState,
    isAutoLoop,
    turns,
    error: aiError,
    toggleAutoLoop,
    stopLoop,
    manualCapture,
    replayAudio,
  } = useAILoop(settings, takeSnapshot);

  useEffect(() => {
    localStorage.setItem('ai_guide_settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const isBlackBg = settings.backgroundMode === 'black';

  return (
    <div className="app-container">
      {/* Background layer */}
      <div className="background-layer" style={{ backgroundColor: isBlackBg ? '#000' : '#000' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="camera-video"
          style={{ opacity: isBlackBg ? 0 : 1 }}
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      {/* Global toggle UI visibility button (For AR) */}
      <button
        className="toggle-ui-btn glass-button"
        onClick={() => setIsUiVisible(!isUiVisible)}
        title="Toggle UI Visibility"
      >
        {isUiVisible ? <EyeOff size={24} /> : <Eye size={24} />}
      </button>

      {/* Main UI Layer */}
      <div className={`ui-layer ${!isUiVisible ? 'hidden' : ''}`}>

        {/* Top Nav (Settings Button) */}
        <div className="top-nav">
          <button className="glass-button ui-element" onClick={() => setIsSettingsOpen(true)}>
            <Settings size={20} />
          </button>
        </div>

        {/* Main Content Area (AI Bubble) */}
        <div className="main-content ui-element" style={{ position: 'relative' }}>

          {/* Left Control Panel */}
          <div style={{ position: 'absolute', left: 16, bottom: 16, zIndex: 20 }}>
            <ControlPanel
              isAutoLoop={isAutoLoop}
              loopState={loopState}
              toggleAutoLoop={toggleAutoLoop}
              stopLoop={stopLoop}
              manualCapture={manualCapture}
              useReasoning={settings.useReasoning ?? true}
              toggleReasoning={() => updateSettings({ useReasoning: !(settings.useReasoning ?? true) })}
            />
          </div>

          <AIOverlay
            turns={turns}
            replayAudio={replayAudio}
            loopState={loopState}
            error={aiError || cameraError}
          />
        </div>
      </div>

      {/* Drawer Layer */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        updateSettings={updateSettings}
      />
    </div>
  );
}

export default App;
