
import React, { useState } from 'react';
import { EXAMPLE_FEEDS, GROQ_MODELS } from '../constants';
import { AIProvider, GroqModelId } from '../types';

interface FeedFormProps {
  onProcessFeed: (urls: string[]) => void;
  isLoading: boolean;
  tavilyApiKey: string;
  setTavilyApiKey: (key: string) => void;
  onClearHistory: () => void;
  aiProvider: AIProvider;
  setAiProvider: (provider: AIProvider) => void;
  groqApiKey: string;
  setGroqApiKey: (key: string) => void;
  groqModel: GroqModelId;
  setGroqModel: (model: GroqModelId) => void;
  ollamaModel: string;
  setOllamaModel: (model: string) => void;
  maxAgeDays: number;
  setMaxAgeDays: (days: number) => void;
}

export const FeedForm: React.FC<FeedFormProps> = ({ 
  onProcessFeed, 
  isLoading, 
  tavilyApiKey, 
  setTavilyApiKey, 
  onClearHistory,
  aiProvider,
  setAiProvider,
  groqApiKey,
  setGroqApiKey,
  groqModel,
  setGroqModel,
  ollamaModel,
  setOllamaModel,
  maxAgeDays,
  setMaxAgeDays
}) => {
  const [urls, setUrls] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const urlList = urls.split('\n').map(url => url.trim()).filter(Boolean);
    if (urlList.length > 0) {
      onProcessFeed(urlList);
    }
  };

  const handleExampleClick = (exampleUrl: string) => {
    setUrls(exampleUrl);
    onProcessFeed([exampleUrl]);
  };
  
  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="ai-provider" className="block text-sm font-medium text-text-secondary mb-2">
              AI Provider
            </label>
            <select
              id="ai-provider"
              value={aiProvider}
              onChange={(e) => setAiProvider(e.target.value as AIProvider)}
              className="w-full bg-gray-light border border-gray-500 text-text-primary rounded-md px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
              disabled={isLoading}
            >
              <option value="gemini">Google Gemini</option>
              <option value="groq">Groq</option>
              <option value="ollama">Ollama (Local)</option>
            </select>
          </div>

          <div>
            <label htmlFor="max-age-days" className="block text-sm font-medium text-text-secondary mb-2">
              Process Articles Newer Than (days)
            </label>
            <input
              id="max-age-days"
              type="number"
              min="1"
              value={maxAgeDays}
              onChange={(e) => setMaxAgeDays(parseInt(e.target.value, 10) || 1)}
              className="w-full bg-gray-light border border-gray-500 text-text-primary rounded-md px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
              disabled={isLoading}
              title="Only process articles published within the last X days. Feeds that don't provide a date are always included."
            />
          </div>

          {aiProvider === 'groq' && (
            <div>
              <label htmlFor="groq-model" className="block text-sm font-medium text-text-secondary mb-2">
                Groq Model
              </label>
              <select
                id="groq-model"
                value={groqModel}
                onChange={(e) => setGroqModel(e.target.value as GroqModelId)}
                className="w-full bg-gray-light border border-gray-500 text-text-primary rounded-md px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
                disabled={isLoading}
              >
                {GROQ_MODELS.map(model => (
                  <option key={model.id} value={model.id}>{model.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="tavily-api-key" className="block text-sm font-medium text-text-secondary mb-2">
              Tavily API Key
            </label>
            <input
              id="tavily-api-key"
              type="password"
              value={tavilyApiKey}
              onChange={(e) => setTavilyApiKey(e.target.value)}
              placeholder="Enter your Tavily API Key"
              required
              className="w-full bg-gray-light border border-gray-500 text-text-primary rounded-md px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
              disabled={isLoading}
            />
          </div>

          {aiProvider === 'groq' && (
             <div>
              <label htmlFor="groq-api-key" className="block text-sm font-medium text-text-secondary mb-2">
                Groq API Key
              </label>
              <input
                id="groq-api-key"
                type="password"
                value={groqApiKey}
                onChange={(e) => setGroqApiKey(e.target.value)}
                placeholder="Enter your Groq API Key"
                required
                className="w-full bg-gray-light border border-gray-500 text-text-primary rounded-md px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
                disabled={isLoading}
              />
            </div>
          )}

          {aiProvider === 'ollama' && (
             <div>
              <label htmlFor="ollama-model" className="block text-sm font-medium text-text-secondary mb-2">
                Ollama Model Name
              </label>
              <input
                id="ollama-model"
                type="text"
                value={ollamaModel}
                onChange={(e) => setOllamaModel(e.target.value)}
                placeholder="e.g., llama3, gemma"
                required
                className="w-full bg-gray-light border border-gray-500 text-text-primary rounded-md px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
                disabled={isLoading}
              />
            </div>
          )}
        </div>

        <div>
           <label htmlFor="rss-urls" className="block text-sm font-medium text-text-secondary mb-2">
            Enter RSS Feed URLs (one per line)
          </label>
          <textarea
            id="rss-urls"
            rows={4}
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            placeholder="https://example.com/feed1.xml&#10;https://example.com/feed2.xml"
            required
            className="w-full bg-gray-light border border-gray-500 text-text-primary rounded-md px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition font-mono text-sm"
            disabled={isLoading}
          />
        </div>
         <div className="flex items-center justify-between pt-2">
            <button
                type="button"
                onClick={onClearHistory}
                className="text-sm text-text-secondary hover:text-red-400 underline transition disabled:opacity-50"
                disabled={isLoading}
                title="Clears the list of articles that have already been processed."
              >
              Clear History
            </button>
            <button
              type="submit"
              className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-2 px-6 rounded-md transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={isLoading}
            >
              Generate
            </button>
          </div>
      </form>
      <div>
        <p className="text-sm text-text-secondary mb-2">Or try an example:</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_FEEDS.map((feed) => (
            <button
              key={feed.name}
              onClick={() => handleExampleClick(feed.url)}
              disabled={isLoading}
              className="text-sm bg-gray-light hover:bg-gray-500 border border-gray-500 text-brand-secondary font-semibold py-1 px-3 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {feed.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
