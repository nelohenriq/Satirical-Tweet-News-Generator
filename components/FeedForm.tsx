
import React, { useState } from 'react';
import { EXAMPLE_FEEDS, GROQ_MODELS } from '../constants';
import { AIProvider, GroqModelId } from '../types';
import { Tooltip } from './Tooltip';

interface FeedFormProps {
  onProcessFeed: (urls: string[]) => void;
  isLoading: boolean;
  serperApiKey: string;
  setSerperApiKey: (key: string) => void;
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
  serperApiKey,
  setSerperApiKey,
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
  };
  
  return (
    <div className="space-y-8">
      {/* Configuration Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-light-text-primary dark:text-text-primary border-b border-light-border dark:border-gray-light pb-3">Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label htmlFor="ai-provider" className="flex items-center space-x-2 text-sm font-medium text-light-text-secondary dark:text-text-secondary">
              <span>AI Provider</span>
              <Tooltip text="Choose your engine of satire. Gemini is balanced, Groq is lightning-fast, and Ollama runs on your local machine (if you've tamed it)." />
            </label>
            <select
              id="ai-provider"
              value={aiProvider}
              onChange={(e) => setAiProvider(e.target.value as AIProvider)}
              className="w-full bg-light-surface dark:bg-gray-light border border-light-border dark:border-gray-500 text-light-text-primary dark:text-text-primary rounded-md px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
              disabled={isLoading}
            >
              <option value="gemini">Google Gemini</option>
              <option value="groq">Groq</option>
              <option value="ollama">Ollama (Local)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="serper-api-key" className="flex items-center space-x-2 text-sm font-medium text-light-text-secondary dark:text-text-secondary">
              <span>Serper API Key</span>
              <Tooltip text="The key to omniscience (or at least, a really good web search). We don't store this, it just lives in this tab." />
            </label>
            <input
              id="serper-api-key"
              type="password"
              value={serperApiKey}
              onChange={(e) => setSerperApiKey(e.target.value)}
              placeholder="Enter your Serper API Key"
              required
              className="w-full bg-light-surface dark:bg-gray-light border border-light-border dark:border-gray-500 text-light-text-primary dark:text-text-primary rounded-md px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="max-age-days" className="flex items-center space-x-2 text-sm font-medium text-light-text-secondary dark:text-text-secondary">
              <span>Article Max Age (Days)</span>
               <Tooltip text="Time is a flat circle, but your news shouldn't be. Only process articles from the last few days." />
            </label>
            <input
              id="max-age-days"
              type="number"
              min="1"
              value={maxAgeDays}
              onChange={(e) => setMaxAgeDays(parseInt(e.target.value, 10) || 1)}
              className="w-full bg-light-surface dark:bg-gray-light border border-light-border dark:border-gray-500 text-light-text-primary dark:text-text-primary rounded-md px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
              disabled={isLoading}
            />
          </div>
          
          {aiProvider === 'groq' && (
            <>
              <div className="space-y-2">
                <label htmlFor="groq-model" className="block text-sm font-medium text-light-text-secondary dark:text-text-secondary mb-2">
                  Groq Model
                </label>
                <select
                  id="groq-model"
                  value={groqModel}
                  onChange={(e) => setGroqModel(e.target.value as GroqModelId)}
                  className="w-full bg-light-surface dark:bg-gray-light border border-light-border dark:border-gray-500 text-light-text-primary dark:text-text-primary rounded-md px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
                  disabled={isLoading}
                >
                  {GROQ_MODELS.map(model => (
                    <option key={model.id} value={model.id}>{model.name}</option>
                  ))}
                </select>
              </div>
               <div className="space-y-2">
                <label htmlFor="groq-api-key" className="flex items-center space-x-2 text-sm font-medium text-light-text-secondary dark:text-text-secondary">
                  <span>Groq API Key</span>
                  <Tooltip text="Unlocks ludicrous speed for your AI overlord. Handle with care." />
                </label>
                <input
                  id="groq-api-key"
                  type="password"
                  value={groqApiKey}
                  onChange={(e) => setGroqApiKey(e.target.value)}
                  placeholder="Enter your Groq API Key"
                  required
                  className="w-full bg-light-surface dark:bg-gray-light border border-light-border dark:border-gray-500 text-light-text-primary dark:text-text-primary rounded-md px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
                  disabled={isLoading}
                />
              </div>
            </>
          )}

          {aiProvider === 'ollama' && (
             <div className="space-y-2">
              <label htmlFor="ollama-model" className="block text-sm font-medium text-light-text-secondary dark:text-text-secondary mb-2">
                Ollama Model Name
              </label>
              <input
                id="ollama-model"
                type="text"
                value={ollamaModel}
                onChange={(e) => setOllamaModel(e.target.value)}
                placeholder="e.g., llama3, gemma"
                required
                className="w-full bg-light-surface dark:bg-gray-light border border-light-border dark:border-gray-500 text-light-text-primary dark:text-text-primary rounded-md px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
                disabled={isLoading}
              />
            </div>
          )}
        </div>
      </section>

      {/* Generation Section */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-xl font-bold text-light-text-primary dark:text-text-primary border-b border-light-border dark:border-gray-light pb-3">RSS Feeds</h2>
        <div>
           <label htmlFor="rss-urls" className="block text-sm font-medium text-light-text-secondary dark:text-text-secondary mb-2">
            Enter RSS Feed URLs (one per line) or use an example below.
          </label>
          <textarea
            id="rss-urls"
            rows={4}
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            placeholder="https://example.com/feed1.xml&#10;https://example.com/feed2.xml"
            required
            className="w-full bg-light-surface dark:bg-gray-light border border-light-border dark:border-gray-500 text-light-text-primary dark:text-text-primary rounded-md px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition font-mono text-sm"
            disabled={isLoading}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_FEEDS.map((feed) => (
            <button
              key={feed.name}
              type="button"
              onClick={() => handleExampleClick(feed.url)}
              disabled={isLoading}
              className="text-sm bg-light-surface dark:bg-gray-light hover:bg-light-border dark:hover:bg-gray-500 border border-light-border dark:border-gray-500 text-brand-secondary font-semibold py-1 px-3 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {feed.name}
            </button>
          ))}
        </div>
         <div className="flex items-center justify-between pt-4 border-t border-light-border dark:border-gray-light">
            <Tooltip text="Gives your app amnesia. It will forget all previously processed articles, ready to be satirized anew.">
                <button
                    type="button"
                    onClick={onClearHistory}
                    className="text-sm text-light-text-secondary dark:text-text-secondary hover:text-red-500 dark:hover:text-red-400 underline transition disabled:opacity-50"
                    disabled={isLoading}
                >
                  Clear History
                </button>
            </Tooltip>
            <button
              type="submit"
              className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-2 px-6 rounded-full transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-brand-primary/40"
              disabled={isLoading}
            >
              Generate Tweets
            </button>
          </div>
      </form>
    </div>
  );
};
