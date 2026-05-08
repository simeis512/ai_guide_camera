import React from 'react';

interface FaceMosaicModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export const FaceMosaicModal: React.FC<FaceMosaicModalProps> = ({ isOpen, onAccept, onDecline }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100,
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        backgroundColor: '#111', padding: '24px', borderRadius: '16px',
        maxWidth: '400px', width: '100%', border: '1px solid #333'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '16px', color: '#fff', fontSize: '1.2rem' }}>
          顔検出・モザイク機能について
        </h2>
        <div style={{ color: '#ccc', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '24px' }}>
          <p style={{ marginBottom: '12px' }}>
            プライバシー保護のため、カメラ映像から顔を検出し自動でモザイク（ぼかし）をかける機能が利用できます。
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '12px' }}>
            <li>ローカルで処理されるため外部に生画像は送信されません。</li>
            <li>初回有効化時に顔検出モデル（数MB）をダウンロードします。</li>
            <li>環境や角度によっては検出漏れが発生する場合があります。</li>
            <li>処理の性質上、若干の遅延やバッテリー消費が生じる可能性があります。</li>
          </ul>
          <p>機能を有効にしますか？（後から設定画面で変更可能です）</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button 
            onClick={onDecline}
            style={{
              padding: '10px 16px', borderRadius: '8px', border: '1px solid #555',
              backgroundColor: 'transparent', color: '#fff', cursor: 'pointer'
            }}
          >
            今は有効にしない
          </button>
          <button 
            onClick={onAccept}
            style={{
              padding: '10px 16px', borderRadius: '8px', border: 'none',
              backgroundColor: '#00e5ff', color: '#000', fontWeight: 'bold', cursor: 'pointer'
            }}
          >
            有効にする
          </button>
        </div>
      </div>
    </div>
  );
};
