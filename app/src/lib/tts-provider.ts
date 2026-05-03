export const fetchTTS = async (text: string, url: string, speakerId: string): Promise<string> => {
  if (!url) {
    throw new Error('TTS URL is not set');
  }

  const body: Record<string, any> = { text };
  if (speakerId) {
    body.speaker_id = parseInt(speakerId, 10);
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`TTS server responded with status: ${response.status}`);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
};
