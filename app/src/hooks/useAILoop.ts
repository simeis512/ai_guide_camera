import { useState, useRef, useCallback } from 'react';
import type { AppSettings, Turn } from '../types';
import { callLLM } from '../lib/llm-provider';
import { fetchTTS } from '../lib/tts-provider';

type LoopState = 'idle' | 'capturing' | 'thinking' | 'playing' | 'paused_for_help';

export const useAILoop = (
  settings: AppSettings,
  takeSnapshot: () => Promise<string | null> | string | null
) => {
  const [loopState, setLoopState] = useState<LoopState>('idle');
  const [isAutoLoop, setIsAutoLoop] = useState<boolean>(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loopTimerRef = useRef<number | null>(null);
  const isAutoLoopRef = useRef(isAutoLoop);

  // Keep ref in sync
  isAutoLoopRef.current = isAutoLoop;

  const updateTurn = useCallback((id: string, updates: Partial<Turn>) => {
    setTurns((prev) => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const playTurnAudio = useCallback((turnId: string, audioUrl: string) => {
    return new Promise<void>((resolve) => {
      updateTurn(turnId, { isPlayingAudio: true });
      const audio = new Audio(audioUrl);
      audio.onended = () => {
        updateTurn(turnId, { isPlayingAudio: false });
        resolve();
      };
      audio.onerror = () => {
        console.error('Audio playback error');
        updateTurn(turnId, { isPlayingAudio: false });
        resolve();
      };
      audio.play().catch(err => {
        console.error('Failed to play audio:', err);
        updateTurn(turnId, { isPlayingAudio: false });
        resolve();
      });
    });
  }, [updateTurn]);

  const replayAudio = useCallback((turnId: string) => {
    const turn = turns.find(t => t.id === turnId);
    if (turn && turn.audioUrl && !turn.isPlayingAudio) {
      playTurnAudio(turnId, turn.audioUrl);
    }
  }, [turns, playTurnAudio]);

  const runTurn = useCallback(async (userInterventionText?: string) => {
    if (loopState === 'capturing' || loopState === 'thinking') return;
    
    setLoopState('capturing');
    setError(null);
    
    try {
      const base64Image = await takeSnapshot();
      if (!base64Image) {
        throw new Error('Failed to take snapshot');
      }

      setLoopState('thinking');

      // Add user intervention to history if provided
      let currentHistory = [...history];
      if (userInterventionText) {
        const entry = `[ユーザーからの介入]: ${userInterventionText}`;
        currentHistory.push(entry);
      }

      const response = await callLLM(settings, base64Image, currentHistory);
      
      const turnId = Date.now().toString();
      const newTurn: Turn = {
        id: turnId,
        response,
        isFetchingAudio: !!settings.ttsUrl
      };
      
      setTurns(prev => [...prev, newTurn]);
      setLoopState('playing');

      // Append AI's own action/thought to history for next turn
      const aiEntry = `[AIの行動]: ${response.action}, [AIの思考]: ${response.thought}`;
      currentHistory.push(aiEntry);

      // Keep only last 5 turns to prevent token overflow
      if (currentHistory.length > 5) {
        currentHistory = currentHistory.slice(currentHistory.length - 5);
      }
      setHistory(currentHistory);

      let audioPromise = Promise.resolve();

      // Fetch and play TTS if configured
      if (settings.ttsUrl && response.thought) {
        try {
          const audioUrl = await fetchTTS(response.thought, settings.ttsUrl, settings.ttsSpeakerId);
          updateTurn(turnId, { audioUrl, isFetchingAudio: false });
          // wait for audio to finish playing
          audioPromise = playTurnAudio(turnId, audioUrl);
        } catch (ttsErr) {
          console.error('TTS Fetch error:', ttsErr);
          updateTurn(turnId, { isFetchingAudio: false });
        }
      }

      // Wait for audio to finish before proceeding
      await audioPromise;

      if (response.action === 'help' || response.action === 'request' || response.action === 'attention') {
        setLoopState('paused_for_help');
        setIsAutoLoop(false); // Stop auto loop
        return;
      }

      setLoopState('idle');

      // Schedule next loop if in auto mode
      if (isAutoLoopRef.current) {
        loopTimerRef.current = window.setTimeout(() => {
          if (isAutoLoopRef.current) {
            runTurn();
          }
        }, settings.autoLoopInterval);
      }

    } catch (err: any) {
      console.error('AI Loop error:', err);
      setError(err.message || 'Error occurred during AI turn');
      setLoopState('idle');
      setIsAutoLoop(false);
    }
  }, [settings, takeSnapshot, history, loopState, playTurnAudio, updateTurn]);

  const toggleAutoLoop = useCallback(() => {
    setIsAutoLoop((prev) => !prev);
  }, []);

  const stopLoop = useCallback(() => {
    setIsAutoLoop(false);
    if (loopTimerRef.current) clearTimeout(loopTimerRef.current);
  }, []);

  const manualCapture = useCallback((userInterventionText?: string) => {
    if (loopTimerRef.current) clearTimeout(loopTimerRef.current);
    runTurn(userInterventionText);
  }, [runTurn]);

  return {
    loopState,
    isAutoLoop,
    turns,
    error,
    toggleAutoLoop,
    stopLoop,
    manualCapture,
    replayAudio,
  };
};
