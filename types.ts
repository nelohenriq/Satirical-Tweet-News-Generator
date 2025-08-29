
export type AIProvider = 'gemini' | 'groq' | 'ollama';

export type GroqModelId = 'openai/gpt-oss-20b' | 'llama-3.1-8b-instant' | 'llama-3.3-70b-versatile' | 'openai/gpt-oss-120b';

export interface RSSItem {
  title: string;
  content: string;
  link: string;
  pubDate?: Date;
}

export interface ProcessedArticle {
  id: string;
  title: string;
  link: string;
  summary: string;
  tweets: string[];
}
