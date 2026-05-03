export type ProviderType = 'openai' | 'ollama' | 'gemini';

export interface AppSettings {
  provider: ProviderType;
  endpointUrl: string; // Used for OpenAI compatible or Ollama
  apiKey: string; // Not strictly needed for local Ollama, but for others
  modelName: string;
  systemPrompt: string;
  backgroundMode: 'camera' | 'black';
  autoLoopInterval: number; // in milliseconds
  ttsUrl: string;
  ttsSpeakerId: string;
  useReasoning?: boolean;
  cameraResolution?: '480p' | '720p' | '1080p';
}

export const SYSTEM_LEVEL_PROMPT = `あなたはユーザーのカメラ（またはスマートグラス）を通じて現実世界を共に探索する「AIコンパニオン」です。
ユーザーから現在の視界の画像が提供されます。画像を観察し、状況を解析した上で、次に取るべきリアクションを決定してください。

【基本ルール】
1. 出力は必ず下記のJSONフォーマットのみとし、余計なテキストは含めないでください。
2. 状況に応じて、淡々と観察を続けるか、ユーザーに何かを伝えたり要求したりするかを判断してください。
3. "action"（特に "attention" や "request"）は乱発せず、本当に重要な発見があった「ここぞ」という場面や緊急時のみ使用してください。通常時は基本的に "observe" を維持し、静かに観察を続けてください。

【出力JSONのプロパティ定義】
- "analysis" (String): 画像に写っているオブジェクト、風景、人物、文字などの客観的な解析データ。
- "thought" (String): 景色に対するあなたの主観的な感想や独り言。人間らしくフレンドリーに。
- "action" (String): 今回のアクション状態。以下のいずれかの文字列のみ。
  - "observe": 特に何もしない。ただ景色を眺める。
  - "attention": 特に気になったもの、面白いものを見つけたのでユーザーに知らせる。
  - "request": 別の場所に行きたい、別のものを見たいなど、ユーザーに行動を要求する。
  - "help": 画像が暗すぎる、ブレているなどで何も見えない場合にユーザーに助けを求める。
- "request_detail" (String/null): actionが"attention", "request", "help"の場合のみ、その詳細（気になったものや要求内容）を記述。それ以外はnull。`;

export const DEFAULT_SETTINGS: AppSettings = {
  provider: 'openai',
  endpointUrl: 'https://api.openai.com/v1',
  apiKey: '',
  modelName: 'gpt-4o',
  systemPrompt: '',
  backgroundMode: 'camera',
  autoLoopInterval: 5000,
  ttsUrl: 'http://127.0.0.1:8000/tts',
  ttsSpeakerId: '3',
  useReasoning: true,
  cameraResolution: '720p',
};

export interface AIResponse {
  analysis: string;
  thought: string;
  action: string;
  request_detail: string | null;
}

export interface Turn {
  id: string;
  response: AIResponse;
  audioUrl?: string;
  isFetchingAudio?: boolean;
  isPlayingAudio?: boolean;
}
