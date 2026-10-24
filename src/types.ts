export type SupportedLanguage = 'en-IN' | 'hi-IN' | 'en-US';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

export type AutomationAction =
  | 'play_youtube'
  | 'open_youtube'
  | 'compose_gmail'
  | 'open_gmail'
  | 'open_whatsapp'
  | 'google_search'
  | 'open_maps'
  | 'open_spotify'
  | 'launch_app';

export type Platform =
  | 'youtube'
  | 'gmail'
  | 'whatsapp'
  | 'google'
  | 'google_maps'
  | 'spotify'
  | 'desktop';

export interface IntentParameters {
  query?: string;
  to?: string;
  subject?: string;
  body?: string;
  phone?: string;
  message?: string;
  location?: string;
  app?: string;
}

export interface IntentResult {
  action: AutomationAction | string;
  platform: Platform | string;
  parameters: IntentParameters;
  response_text: string;
  raw_command: string;
}

export interface ExecutionResult {
  success: boolean;
  action: string;
  platform: string;
  url_opened: string | null;
  message: string;
  error?: string;
  simulated?: boolean;
}

export interface TerminalLog {
  id: string;
  timestamp: string;
  message: string;
  type: 'cyan' | 'green' | 'purple' | 'yellow' | 'normal';
}

export interface BackendStatus {
  status: string;
  version: string;
  engine: string;
  ollama_connected: boolean;
  supported_platforms: string[];
  languages: string[];
}
