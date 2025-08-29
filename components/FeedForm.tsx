import React, { useState } from 'react';
import { EXAMPLE_FEEDS, GROQ_MODELS } from '../constants';
import { AIProvider, GroqModelId } from '../types';
import { Tooltip } from './Tooltip';

type FormTab = 'rss' | 'url';

interface FeedFormProps {
  onProcessFeed: (urls: string[]) => void;
  onProcessUrl: (url: string) => void;
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
  onProcessUrl,
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
  const [rssUrls, setRssUrls] = useState('');
  const [singleUrl, setSingleUrl] = useState('');
  const [activeTab, setActiveTab] = useState<FormTab>('rss');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'rss') {
        const urlList = rssUrls.split('\n').map(url => url.trim()).filter(Boolean);
        if (urlList.length > 0) {
          onProcessFeed(urlList);
        }
    } else {
        const trimmedUrl = singleUrl.trim();
        if (trimmedUrl) {
            onProcessUrl(trimmedUrl);
        }
    }
  };

  const handleExampleClick = (exampleUrl: string) => {
    setActiveTab('rss');
    setRssUrls(exampleUrl);
  };
  
  const TabButton: React.FC<{tabId: FormTab; children: React.ReactNode}> = ({ tabId, children }) => (
    <button
      type="button"
      role="tab"
      aria-selected={activeTab === tabId}
      onClick={() => setActiveTab(tabId)}
      disabled={isLoading}
      className={`px-4 py-2 text-sm font-semibold rounded-t-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary transition-colors ${
        activeTab === tabId
          ? 'bg-light-surface dark:bg-gray-medium/50 text-brand-primary border-b-2 border-brand-primary'
          : 'text-light-text-secondary dark:text-text-secondary hover:text-light-text-primary dark:hover:text-text-primary'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-8">
      {/* Configuration Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-light-text-primary dark:text-text-primary border-b border-light-border dark:border-gray-light pb-3">Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column 1: Provider & Model Settings */}
            <div className="space-y-6">
                {/* AI Provider */}
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

                {/* Groq Model */}
                {aiProvider === 'groq' && (
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
                )}

                {/* Ollama Model */}
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

            {/* Column 2: API Keys */}
            <div className="space-y-6">
                {/* Serper API Key */}
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
                
                {/* Groq API Key */}
                {aiProvider === 'groq' && (
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
                )}
            </div>
        </div>
      </section>

      {/* Generation Section */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="border-b border-light-border dark:border-gray-light">
            <div role="tablist" aria-label="Input method" className="-mb-px flex space-x-4">
                <TabButton tabId="rss">From RSS Feeds</TabButton>
                <TabButton tabId="url">From Single URL</TabButton>
            </div>
        </div>

        <div className="pt-4">
          {activeTab === 'rss' && (
            <div id="rss-panel" role="tabpanel" className="space-y-4">
              <div>
                <label htmlFor="rss-urls" className="block text-sm font-medium text-light-text-secondary dark:text-text-secondary mb-2">
                  Enter RSS Feed URLs (one per line) or use an example below.
                </label>
                <textarea
                  id="rss-urls"
                  rows={4}
                  value={rssUrls}
                  onChange={(e) => setRssUrls(e.target.value)}
                  placeholder="https://example.com/feed1.xml&#10;https://example.com/feed2.xml"
                  required={activeTab === 'rss'}
                  className="w-full bg-light-surface dark:bg-gray-light border border-light-border dark:border-gray-500 text-light-text-primary dark:text-text-primary rounded-md px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition font-mono text-sm"
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
            </div>
          )}

          {activeTab === 'url' && (
             <div id="url-panel" role="tabpanel">
              <label htmlFor="single-url" className="block text-sm font-medium text-light-text-secondary dark:text-text-secondary mb-2">
                Enter a single news article URL to process.
              </label>
              <input
                id="single-url"
                type="url"
                value={singleUrl}
                onChange={(e) => setSingleUrl(e.target.value)}
                placeholder="https://www.example.com/news/todays-big-story"
                required={activeTab === 'url'}
                className="w-full bg-light-surface dark:bg-gray-light border border-light-border dark:border-gray-500 text-light-text-primary dark:text-text-primary rounded-md px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition font-mono text-sm"
                disabled={isLoading}
              />
            </div>
          )}
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