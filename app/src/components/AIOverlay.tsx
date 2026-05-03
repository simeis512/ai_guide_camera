import React, { useEffect, useRef } from 'react';
import type { Turn } from '../types';
import { Bot, Volume2 } from 'lucide-react';

interface AIOverlayProps {
  turns: Turn[];
  replayAudio: (id: string) => void;
  loopState: 'idle' | 'capturing' | 'thinking' | 'playing' | 'paused_for_help';
  error: string | null;
}

export const AIOverlay: React.FC<AIOverlayProps> = ({ turns, replayAudio, loopState, error }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new turns or states change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [turns, loopState, error]);

  return (
    <div className="ai-overlay" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Scrollable list of past turns */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          width: '100%',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '16px',
          paddingBottom: '20px',
          paddingLeft: '16px',
          paddingRight: '16px'
        }}
      >
        {turns.map((turn) => {
          const isFetching = turn.isFetchingAudio;
          const isPlaying = turn.isPlayingAudio;

          let bubbleClass = "ai-bubble glass-panel";
          if (isFetching) bubbleClass += " fetching-audio animate-pulse";
          if (isPlaying) bubbleClass += " playing-audio";

          return (
            <div key={turn.id} className="turn-container">
              <div
                className={bubbleClass}
                onClick={() => replayAudio(turn.id)}
                style={{ cursor: turn.audioUrl ? 'pointer' : 'default', width: '100%' }}
                title={turn.audioUrl ? "クリックで音声を再再生" : ""}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Bot size={20} />
                  {turn.audioUrl && (
                    <Volume2 size={16} style={{ opacity: isPlaying ? 1 : 0.5, color: isPlaying ? '#00e5ff' : 'white' }} />
                  )}
                </div>

                <p>{turn.response.thought}</p>

                {turn.response.request_detail && (
                  <div style={{ marginTop: 12, padding: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4 }}>
                    <strong>
                      {turn.response.action === 'attention' ? '💡 注目: ' :
                        turn.response.action === 'request' ? '🔄 リクエスト: ' :
                          turn.response.action === 'help' ? '🆘 サポート要求: ' :
                            '💬 メッセージ: '}
                    </strong>
                    {turn.response.request_detail}
                  </div>
                )}
              </div>

              <div className="ai-analysis">
                <div style={{ marginBottom: 4, fontWeight: 'bold', fontSize: '12px' }}>解析結果:</div>
                <div style={{ fontSize: '12px' }}>{turn.response.analysis}</div>
                <div style={{ marginTop: 4, color: '#00e5ff', fontSize: '12px' }}>
                  [ アクション: {turn.response.action} ]
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading / Error States */}
        {error && (
          <div className="ai-bubble" style={{ color: '#ff5555', borderColor: '#ff5555', marginTop: 'auto' }}>
            ⚠️ エラーが発生しました: {error}
          </div>
        )}

        {(loopState === 'capturing' || loopState === 'thinking') && (
          <div className="ai-bubble thinking glass-panel animate-pulse" style={{ marginTop: turns.length > 0 ? 0 : 'auto' }}>
            <Bot size={20} style={{ marginBottom: 8 }} />
            <span>{loopState === 'capturing' ? '撮影中...' : '画像を解析中...'}</span>
          </div>
        )}
      </div>
    </div>
  );
};
