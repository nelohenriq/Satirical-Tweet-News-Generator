
import React, { useState, useCallback, useEffect } from 'react';
import { FeedForm } from './components/FeedForm';
import { ResultsDisplay } from './components/ResultsDisplay';
import { Spinner } from './components/Spinner';
import { LogoIcon } from './components/icons';
import { ProcessedArticle, AIProvider, GroqModelId } from './types';
import { fetchAndParseFeed } from './services/rssService';
import { search as tavilySearch } from './services/tavilyService';
import { summarizeContent, generateTweets } from './services/geminiService';
import { getProcessedLinks, addProcessedLink, clearProcessedLinks } from './services/storageService';
import { GROQ_MODELS } from './constants';

const TAVILY_API_KEY_SESSION_KEY = 'tavilyApiKey';
const GROQ_API_KEY_SESSION_KEY = 'groqApiKey';

const App: React.FC = () => {
  const [processedArticles, setProcessedArticles] = useState<ProcessedArticle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [aiProvider, setAiProvider] = useState<AIProvider>('gemini');
  const [groqModel, setGroqModel] = useState<GroqModelId>(GROQ_MODELS[0].id);
  const [ollamaModel, setOllamaModel] = useState<string>('llama3'); // Default local model
  
  // Initialize state from sessionStorage and keep it in sync.
  const [tavilyApiKey, setTavilyApiKey] = useState<string>(() => {
    try {
      return sessionStorage.getItem(TAVILY_API_KEY_SESSION_KEY) || '';
    } catch (error) {
      console.error('Failed to read Tavily API key from sessionStorage:', error);
      return '';
    }
  });

  const [groqApiKey, setGroqApiKey] = useState<string>(() => {
    try {
      return sessionStorage.getItem(GROQ_API_KEY_SESSION_KEY) || '';
    } catch (error) {
      console.error('Failed to read Groq API key from sessionStorage:', error);
      return '';
    }
  });


  // Effect to save the API keys to sessionStorage whenever they change.
  useEffect(() => {
    try {
      sessionStorage.setItem(TAVILY_API_KEY_SESSION_KEY, tavilyApiKey);
    } catch (error)      {
      console.error('Failed to save Tavily API key to sessionStorage:', error);
    }
  }, [tavilyApiKey]);

  useEffect(() => {
    try {
      sessionStorage.setItem(GROQ_API_KEY_SESSION_KEY, groqApiKey);
    } catch (error)      {
      console.error('Failed to save Groq API key to sessionStorage:', error);
    }
  }, [groqApiKey]);


  const handleClearHistory = useCallback(() => {
    clearProcessedLinks();
    setProcessedArticles([]); // Clear results from the screen
    alert('Processing history has been cleared.');
  }, []);

  const handleProcessFeed = useCallback(async (urls: string[]) => {
    if (!tavilyApiKey) {
      setError('Tavily API Key is required to process feeds.');
      return;
    }
    if (aiProvider === 'groq' && !groqApiKey) {
      setError('Groq API Key is required when using the Groq provider.');
      return;
    }
    if (aiProvider === 'ollama' && !ollamaModel) {
      setError('Ollama model name is required when using the Ollama provider.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setProcessedArticles([]); // Clear previous results for this run

    try {
      const existingLinks = getProcessedLinks();
      const apiConfig = { groqApiKey, groqModel, ollamaModel };

      setLoadingMessage(`Step 1/4: Fetching and parsing ${urls.length} RSS feed(s)...`);
      // Fetch all feeds in parallel for efficiency.
      const feedResults = await Promise.all(
        urls.map(url => fetchAndParseFeed(url).catch(e => {
            console.error(`Failed to fetch or parse feed ${url}:`, e);
            // Return an empty array for a failed feed so Promise.all doesn't reject the whole batch.
            return []; 
        }))
      );
      
      const allItems = feedResults.flat();
      const articlesToProcess = allItems.filter(item => item.link && !existingLinks.has(item.link));

      if (articlesToProcess.length === 0) {
        setError("No new articles found in the provided feed(s). Clear history to re-process existing articles.");
        setIsLoading(false);
        return;
      }
      
      for (let i = 0; i < articlesToProcess.length; i++) {
        const item = articlesToProcess[i];
        const articleProgress = `${i + 1}/${articlesToProcess.length}`;
        
        setLoadingMessage(`Step 2/4: Searching with Tavily (Article ${articleProgress})...`);
        const extraContext = await tavilySearch(item.title, tavilyApiKey);
        const fullContent = `${item.title}\n\n${item.content}\n\nAdditional Context from Tavily:\n${extraContext}`;

        setLoadingMessage(`Step 3/4: Summarizing (Article ${articleProgress})...`);
        const summary = await summarizeContent(fullContent, aiProvider, apiConfig);
        
        setLoadingMessage(`Step 4/4: Crafting tweets (Article ${articleProgress})...`);
        const tweets = await generateTweets(summary, aiProvider, apiConfig);

        const newArticle: ProcessedArticle = {
          id: item.link || `${item.title}-${Date.now()}-${i}`,
          title: item.title,
          link: item.link,
          summary,
          tweets,
        };
        
        // Stream result to the UI in real-time
        setProcessedArticles(prevArticles => [...prevArticles, newArticle]);
        // Add link to history to prevent re-processing
        if (item.link) {
          addProcessedLink(item.link);
        }
      }

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [tavilyApiKey, aiProvider, groqApiKey, groqModel, ollamaModel]);

  return (
    <div className="min-h-screen bg-gray-dark font-sans">
      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        <header className="flex items-center justify-center space-x-4 mb-8">
          <LogoIcon className="h-12 w-12 text-brand-primary" />
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight">Satirical News Tweet Generator</h1>
            <p className="text-text-secondary text-md">AI-powered satire for your news feed.</p>
          </div>
        </header>

        <main>
          <div className="bg-gray-medium rounded-lg p-6 shadow-lg mb-8 border border-gray-light">
            <FeedForm 
              onProcessFeed={handleProcessFeed} 
              isLoading={isLoading}
              tavilyApiKey={tavilyApiKey}
              setTavilyApiKey={setTavilyApiKey}
              onClearHistory={handleClearHistory}
              aiProvider={aiProvider}
              setAiProvider={setAiProvider}
              groqApiKey={groqApiKey}
              setGroqApiKey={setGroqApiKey}
              groqModel={groqModel}
              setGroqModel={setGroqModel}
              ollamaModel={ollamaModel}
              setOllamaModel={setOllamaModel}
            />
          </div>

          {isLoading && (
            <div className="flex flex-col items-center justify-center text-center p-8">
              <Spinner />
              <p className="mt-4 text-lg font-semibold text-brand-secondary">{loadingMessage}</p>
              <p className="text-text-secondary mt-2">Please wait, the AI is thinking witty thoughts...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          {/* Display results as they come in, even during loading */}
          {processedArticles.length > 0 && (
            <ResultsDisplay articles={processedArticles} />
          )}

          {!isLoading && !error && processedArticles.length === 0 && (
            <div className="text-center py-10 px-6 bg-gray-medium rounded-lg border-2 border-dashed border-gray-light">
                <p className="text-text-secondary">Results will appear here once an RSS feed is processed.</p>
                <p className="text-sm text-gray-500 mt-2">Enter your API Keys, then try an example above!</p>
            </div>
          )}
        </main>
         <footer className="text-center mt-12 text-text-secondary text-sm">
            <p>Powered by Gemini & Tavily AI. All content is AI-generated.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
