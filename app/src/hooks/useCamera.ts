import { useState, useEffect, useRef, useCallback } from 'react';
import type { AppSettings } from '../types';

export const useCamera = (settings: AppSettings) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const initCamera = async () => {
      try {
        let videoConstraints: MediaTrackConstraints = {};
        
        if (settings.cameraId) {
          videoConstraints.deviceId = { exact: settings.cameraId };
        } else {
          videoConstraints.facingMode = 'environment';
        }
        
        if (settings.cameraResolution === '1080p') {
          videoConstraints = { ...videoConstraints, width: { ideal: 1920 }, height: { ideal: 1080 } };
        } else if (settings.cameraResolution === '480p') {
          videoConstraints = { ...videoConstraints, width: { ideal: 640 }, height: { ideal: 480 } };
        } else {
          // default 720p
          videoConstraints = { ...videoConstraints, width: { ideal: 1280 }, height: { ideal: 720 } };
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err: any) {
        setError(err.message || 'Failed to access camera');
        console.error('Camera error:', err);
      }
    };

    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.cameraResolution, settings.cameraId]);

  const takeSnapshot = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current || !stream) {
      return null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Draw the current video frame onto the canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get base64 string
    return canvas.toDataURL('image/jpeg', 0.8);
  }, [stream]);

  return { stream, error, videoRef, canvasRef, takeSnapshot };
};
