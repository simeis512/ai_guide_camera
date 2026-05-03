import React, { useState } from 'react';
import type { AppSettings, ProviderType } from '../types';
import { X, RefreshCw } from 'lucide-react';
import { fetchAvailableModels } from '../lib/llm-provider';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  settings,
  updateSettings,
}) => {
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provider = e.target.value as ProviderType;
    let defaultEndpoint = settings.endpointUrl;
    let defaultModel = settings.modelName;

    if (provider === 'openai') {
      defaultEndpoint = 'https://api.openai.com/v1';
      defaultModel = 'gpt-4o';
    } else if (provider === 'ollama') {
      defaultEndpoint = 'http://localhost:11434';
      defaultModel = 'llava';
    } else if (provider === 'gemini') {
      defaultEndpoint = 'https://generativelanguage.googleapis.com';
      defaultModel = 'gemini-1.5-flash';
    }

    setAvailableModels([]); // Reset models when provider changes
    updateSettings({ provider, endpointUrl: defaultEndpoint, modelName: defaultModel });
  };

  const handleFetchModels = async () => {
    setIsFetchingModels(true);
    setFetchError(null);
    try {
      const models = await fetchAvailableModels(settings);
      setAvailableModels(models);
      
      // If current model is not in the fetched list, switch to the first available
      if (models.length > 0 && !models.includes(settings.modelName)) {
        updateSettings({ modelName: models[0] });
      }
    } catch (err: any) {
      setFetchError(err.message || 'モデル取得に失敗しました');
    } finally {
      setIsFetchingModels(false);
    }
  };

  return (
    <div className={`settings-drawer ${isOpen ? 'open' : ''}`}>
      <div className="drawer-header">
        <h2>設定</h2>
        <button className="close-btn" onClick={onClose} aria-label="Close settings">
          <X size={24} />
        </button>
      </div>

      <div className="form-group">
        <label>バックグラウンド</label>
        <select
          value={settings.backgroundMode}
          onChange={(e) => updateSettings({ backgroundMode: e.target.value as 'camera' | 'black' })}
        >
          <option value="camera">カメラ映像</option>
          <option value="black">真っ黒（AR用）</option>
        </select>
      </div>

      <div className="form-group">
        <label>プロバイダ</label>
        <select value={settings.provider} onChange={handleProviderChange}>
          <option value="openai">OpenAI (互換)</option>
          <option value="gemini">Google Gemini</option>
          <option value="ollama">Ollama (ローカル)</option>
        </select>
      </div>

      <div className="form-group">
        <label>エンドポイント URL</label>
        <input
          type="text"
          className="glass-input"
          value={settings.endpointUrl}
          onChange={(e) => updateSettings({ endpointUrl: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label>API キー</label>
        <input
          type="password"
          className="glass-input"
          value={settings.apiKey}
          onChange={(e) => updateSettings({ apiKey: e.target.value })}
          placeholder="API Key (Ollama等の場合は不要)"
        />
      </div>

      <div className="form-group">
        <label>モデル名</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {availableModels.length > 0 ? (
            <select
              className="glass-input"
              value={settings.modelName}
              onChange={(e) => updateSettings({ modelName: e.target.value })}
              style={{ flex: 1 }}
            >
              {/* Ensure current model is listed even if missing (edge case) */}
              {!availableModels.includes(settings.modelName) && (
                <option value={settings.modelName}>{settings.modelName}</option>
              )}
              {availableModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              className="glass-input"
              value={settings.modelName}
              onChange={(e) => updateSettings({ modelName: e.target.value })}
              style={{ flex: 1 }}
            />
          )}
          <button
            className="glass-button"
            onClick={handleFetchModels}
            disabled={isFetchingModels}
            style={{ padding: '0 12px' }}
            title="APIからモデルリストを取得して疎通確認"
          >
            <RefreshCw size={18} className={isFetchingModels ? 'animate-spin' : ''} />
          </button>
        </div>
        {fetchError && <div style={{ color: '#ff5555', fontSize: '12px' }}>⚠️ {fetchError}</div>}
        {availableModels.length > 0 && !fetchError && (
          <div style={{ color: '#00e5ff', fontSize: '12px' }}>✓ 疎通確認成功</div>
        )}
      </div>

      <div className="form-group">
        <label>インターバル (ミリ秒)</label>
        <input
          type="number"
          className="glass-input"
          value={settings.autoLoopInterval}
          onChange={(e) => updateSettings({ autoLoopInterval: parseInt(e.target.value, 10) || 5000 })}
        />
      </div>

      <div className="form-group">
        <label>TTS API URL (音声合成)</label>
        <input
          type="text"
          className="glass-input"
          value={settings.ttsUrl}
          onChange={(e) => updateSettings({ ttsUrl: e.target.value })}
          placeholder="例: http://127.0.0.1:8000/tts"
        />
      </div>

      <div className="form-group">
        <label>TTS Speaker ID</label>
        <input
          type="text"
          className="glass-input"
          value={settings.ttsSpeakerId}
          onChange={(e) => updateSettings({ ttsSpeakerId: e.target.value })}
          placeholder="例: 3"
        />
      </div>

      <div className="form-group">
        <label>システムプロンプト</label>
        <textarea
          className="glass-input"
          value={settings.systemPrompt}
          onChange={(e) => updateSettings({ systemPrompt: e.target.value })}
        />
      </div>
    </div>
  );
};
