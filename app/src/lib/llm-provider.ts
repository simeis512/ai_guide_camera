import { type AppSettings, type AIResponse, SYSTEM_LEVEL_PROMPT } from '../types';

export const callLLM = async (
  settings: AppSettings,
  base64Image: string,
  history: string[]
): Promise<AIResponse> => {
  const { provider, endpointUrl, apiKey, modelName, systemPrompt: userSystemPrompt } = settings;

  const historyText = history.length > 0 ? `\n\n[過去のコンテキスト]\n${history.join('\n')}` : '';

  if (provider === 'openai') {
    return callOpenAI(endpointUrl, apiKey, modelName, historyText, base64Image, SYSTEM_LEVEL_PROMPT, userSystemPrompt, settings.useReasoning);
  } else if (provider === 'ollama') {
    const ollamaPrompt = [SYSTEM_LEVEL_PROMPT, userSystemPrompt, historyText].filter(Boolean).join('\n\n');
    return callOllama(endpointUrl, modelName, ollamaPrompt, base64Image, settings.useReasoning);
  } else if (provider === 'gemini') {
    return callGemini(endpointUrl, apiKey, modelName, historyText, base64Image, SYSTEM_LEVEL_PROMPT, userSystemPrompt);
  }

  throw new Error('Unsupported provider');
};

export const fetchAvailableModels = async (settings: AppSettings): Promise<string[]> => {
  const { provider, endpointUrl, apiKey } = settings;

  if (provider === 'openai') {
    const url = endpointUrl.endsWith('/chat/completions')
      ? endpointUrl.replace('/chat/completions', '/models')
      : `${endpointUrl.replace(/\/$/, '')}/models`;
    
    const headers: Record<string, string> = {};
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`OpenAI API error: ${res.statusText}`);
    const data = await res.json();
    return data.data.map((m: any) => m.id);

  } else if (provider === 'ollama') {
    const url = endpointUrl.endsWith('/api/generate')
      ? endpointUrl.replace('/api/generate', '/api/tags')
      : `${endpointUrl.replace(/\/$/, '')}/api/tags`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Ollama API error: ${res.statusText}`);
    const data = await res.json();
    return data.models.map((m: any) => m.name);

  } else if (provider === 'gemini') {
    const url = `${endpointUrl.replace(/\/$/, '')}/v1beta/models?key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Gemini API error: ${res.statusText}`);
    const data = await res.json();
    return data.models.map((m: any) => m.name.replace('models/', ''));
  }

  throw new Error('Unsupported provider');
};

const callOpenAI = async (
  endpointUrl: string,
  apiKey: string,
  modelName: string,
  historyText: string,
  base64Image: string,
  systemLevelPrompt: string,
  userSystemPrompt: string,
  useReasoning?: boolean
): Promise<AIResponse> => {
  const url = endpointUrl.endsWith('/chat/completions')
    ? endpointUrl
    : `${endpointUrl.replace(/\/$/, '')}/chat/completions`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }
  
  if (useReasoning === false) {
    headers['X-Enable-Reasoning'] = 'false';
    headers['X-Disable-Reasoning'] = 'true';
    headers['X-OpenWebUI-Reasoning'] = 'false';
  }

  // Remove the data URI prefix if present
  const base64Data = base64Image.split(',')[1] || base64Image;

  const messages: any[] = [];

  if (systemLevelPrompt) {
    messages.push({ role: 'system', content: systemLevelPrompt });
  }
  
  if (userSystemPrompt) {
    messages.push({ role: 'system', content: userSystemPrompt });
  }

  const userContent: any[] = [];
  if (historyText.trim()) {
    userContent.push({ type: 'text', text: historyText.trim() });
  }
  userContent.push({
    type: 'image_url',
    image_url: {
      url: `data:image/jpeg;base64,${base64Data}`,
    },
  });

  messages.push({
    role: 'user',
    content: userContent,
  });

  const body: any = {
    model: modelName,
    messages,
    response_format: { type: 'json_object' },
  };

  if (useReasoning === false) {
    body.reasoning_effort = 'none';
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  return JSON.parse(content);
};

const callOllama = async (
  endpointUrl: string,
  modelName: string,
  prompt: string,
  base64Image: string,
  useReasoning?: boolean
): Promise<AIResponse> => {
  const url = endpointUrl.endsWith('/api/generate')
    ? endpointUrl
    : `${endpointUrl.replace(/\/$/, '')}/api/generate`;

  const base64Data = base64Image.split(',')[1] || base64Image;

  const body: any = {
    model: modelName,
    prompt,
    images: [base64Data],
    stream: false,
    format: 'json',
  };

  if (useReasoning === false) {
    body.enable_thinking = false;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.statusText}`);
  }

  const data = await response.json();
  return JSON.parse(data.response);
};

const callGemini = async (
  endpointUrl: string,
  apiKey: string,
  modelName: string,
  historyText: string,
  base64Image: string,
  systemLevelPrompt: string,
  userSystemPrompt: string
): Promise<AIResponse> => {
  // Using the gemini vision REST API
  const url = `${endpointUrl.replace(/\/$/, '')}/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const base64Data = base64Image.split(',')[1] || base64Image;

  const parts: any[] = [];
  
  if (systemLevelPrompt) {
    parts.push({ text: systemLevelPrompt });
  }
  if (userSystemPrompt) {
    parts.push({ text: userSystemPrompt });
  }
  if (historyText.trim()) {
    parts.push({ text: historyText.trim() });
  }
  
  parts.push({
    inline_data: {
      mime_type: 'image/jpeg',
      data: base64Data,
    },
  });

  const body = {
    contents: [
      {
        parts,
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.candidates[0].content.parts[0].text;
  return JSON.parse(content);
};
