import { useState, useEffect, useRef, useCallback } from 'react';
import type { AppSettings } from '../types';
import { useFaceDetector } from './useFaceDetector';

export const useCamera = (settings: AppSettings, isSettingsOpen: boolean = false) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  const { isReady, detectFaces } = useFaceDetector();

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

  // Preview overlay drawing loop
  useEffect(() => {
    let animationFrameId: number;

    const drawOverlay = () => {
      if (!isSettingsOpen || !videoRef.current || !overlayCanvasRef.current || !isReady) {
        if (overlayCanvasRef.current) {
          const ctx = overlayCanvasRef.current.getContext('2d');
          ctx?.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
        }
        return;
      }

      const video = videoRef.current;
      const canvas = overlayCanvasRef.current;
      
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          if (settings.enableFaceMosaic) {
            const faces = detectFaces(video);
            ctx.strokeStyle = '#00e5ff';
            ctx.lineWidth = 4;
            ctx.fillStyle = 'rgba(0, 229, 255, 0.2)';
            
            faces.forEach(face => {
              const box = face.boundingBox;
              if (box) {
                ctx.beginPath();
                ctx.rect(box.originX, box.originY, box.width, box.height);
                ctx.fill();
                ctx.stroke();
              }
            });
          }
        }
      }
      
      animationFrameId = requestAnimationFrame(drawOverlay);
    };

    if (isSettingsOpen) {
      drawOverlay();
    } else {
      if (overlayCanvasRef.current) {
        const ctx = overlayCanvasRef.current.getContext('2d');
        ctx?.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
      }
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isSettingsOpen, isReady, detectFaces, settings.enableFaceMosaic]);

  const takeSnapshot = useCallback(async (): Promise<string | null> => {
    if (!videoRef.current || !canvasRef.current || !stream) {
      return null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (settings.enableFaceMosaic && isReady) {
      const faces = detectFaces(canvas);
      if (faces.length > 0) {
        faces.forEach(face => {
          const box = face.boundingBox;
          if (box) {
            // Calculate blur size dynamically based on bounding box width
            const blurSize = Math.max(5, Math.floor(box.width * 0.1));
            ctx.filter = `blur(${blurSize}px)`;
            
            // Draw only the face region again with blur
            ctx.drawImage(
              canvas, 
              box.originX, box.originY, box.width, box.height, // source slice
              box.originX, box.originY, box.width, box.height  // dest slice
            );
          }
        });
        ctx.filter = 'none'; // reset filter
      }
    }

    return canvas.toDataURL('image/jpeg', 0.8);
  }, [stream, settings.enableFaceMosaic, isReady, detectFaces]);

  return { stream, error, videoRef, canvasRef, overlayCanvasRef, takeSnapshot };
};
