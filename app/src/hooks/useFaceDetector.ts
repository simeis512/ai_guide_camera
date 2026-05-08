import { useState, useEffect, useRef } from 'react';
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';

export const useFaceDetector = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const detectorRef = useRef<FaceDetector | null>(null);

  useEffect(() => {
    let active = true;

    const initDetector = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        
        if (!active) return;

        const detector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
            delegate: "GPU"
          },
          runningMode: "IMAGE" // We pass static canvas snapshots
        });

        if (!active) {
          detector.close();
          return;
        }

        detectorRef.current = detector;
        setIsReady(true);
      } catch (err) {
        console.error("Failed to initialize FaceDetector:", err);
        if (active) setError(err instanceof Error ? err : new Error(String(err)));
      }
    };

    initDetector();

    return () => {
      active = false;
      if (detectorRef.current) {
        detectorRef.current.close();
        detectorRef.current = null;
      }
    };
  }, []);

  const detectFaces = (imageSource: HTMLCanvasElement | HTMLVideoElement | HTMLImageElement) => {
    if (!detectorRef.current || !isReady) return [];
    try {
      const results = detectorRef.current.detect(imageSource);
      return results.detections;
    } catch (err) {
      console.error("Error during face detection:", err);
      return [];
    }
  };

  return { isReady, error, detectFaces };
};
