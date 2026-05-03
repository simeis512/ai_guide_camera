import React, { useState } from 'react';
import { Play, Square, Camera, Send, Brain, RefreshCw } from 'lucide-react';

interface ControlPanelProps {
  isAutoLoop: boolean;
  loopState: string;
  toggleAutoLoop: () => void;
  stopLoop: () => void;
  manualCapture: (text?: string) => void;
  useReasoning: boolean;
  toggleReasoning: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  isAutoLoop,
  loopState,
  toggleAutoLoop,
  stopLoop,
  manualCapture,
  useReasoning,
  toggleReasoning,
}) => {
  const [interventionText, setInterventionText] = useState('');

  const handleSend = () => {
    manualCapture(interventionText);
    setInterventionText('');
  };

  const isBusy = loopState === 'capturing' || loopState === 'thinking' || loopState === 'playing';

  const handleMainClick = () => {
    if (interventionText.trim()) {
      manualCapture(interventionText);
      setInterventionText('');
    } else if (isBusy) {
      stopLoop();
    } else {
      manualCapture();
    }
  };

  let btnText = 'AIガイド開始';
  let BtnIcon = Play;
  let btnClass = 'action-btn primary';

  if (interventionText.trim()) {
    btnText = '指示を送って実行';
    BtnIcon = Send;
  } else if (isBusy) {
    btnText = '一時停止';
    BtnIcon = Square;
    btnClass = 'action-btn active';
  } else if (isAutoLoop) {
    btnText = 'ループ開始';
    BtnIcon = RefreshCw;
  }

  return (
    <div className="control-panel glass-panel" style={{ borderRadius: 16, width: 320, padding: 20, margin: 0 }}>
      
      {/* Settings Row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: 13, color: '#ccc' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={isAutoLoop} 
            onChange={toggleAutoLoop} 
            style={{ accentColor: '#00e5ff' }}
          />
          <RefreshCw size={14} /> ループ実行
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={useReasoning} 
            onChange={toggleReasoning} 
            style={{ accentColor: '#00e5ff' }}
          />
          <Brain size={14} /> 思考モード
        </label>
      </div>

      {/* Main Action Button */}
      <button
        className={btnClass}
        onClick={handleMainClick}
        style={{ width: '100%', marginBottom: 12, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8 }}
      >
        <BtnIcon size={18} /> {btnText}
      </button>

      {/* Instruction Input */}
      <div style={{ width: '100%' }}>
        <div style={{ fontSize: 12, marginBottom: 4, color: '#aaa', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Send size={12} /> 指示を入力（任意）
        </div>
        <textarea
          className="glass-input"
          placeholder={loopState === 'paused_for_help' ? "AIに状況を伝えて助ける..." : "行き先や指示を入力..."}
          value={interventionText}
          onChange={(e) => setInterventionText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleMainClick();
            }
          }}
          style={{ width: '100%', minHeight: 60, resize: 'vertical' }}
        />
      </div>

    </div>
  );
};
