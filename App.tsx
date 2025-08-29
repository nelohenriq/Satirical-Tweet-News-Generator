
import React, { useState, useCallback, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { FeedForm } from './components/FeedForm';
import { ResultsDisplay } from './components/ResultsDisplay';
import { Spinner } from './components/Spinner';
import { LogoIcon } from './components/icons';
import { ProcessedArticle, AIProvider, GroqModelId, TweetData } from './types';
import { fetchAndParseFeed } from './services/rssService';
import { scrapeUrlContent } from './services/scraperService';
import { search as serperSearch } from './services/serperService';
import { summarizeContent, generateTweets } from './services/geminiService';
import { getOllamaModels } from './services/ollamaService';
import { getProcessedLinks, addProcessedLink, clearProcessedLinks } from './services/storageService';
import { GROQ_MODELS, FUNNY_LOADING_MESSAGES } from './constants';
import { ThemeToggle } from './components/ThemeToggle';

const SERPER_API_KEY_SESSION_KEY = 'serperApiKey';
const GROQ_API_KEY_SESSION_KEY = 'groqApiKey';
type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const [processedArticles, setProcessedArticles] = useState<ProcessedArticle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [aiProvider, setAiProvider] = useState<AIProvider>('gemini');
  const [groqModel, setGroqModel] = useState<GroqModelId>(GROQ_MODELS[0].id);
  const [ollamaModel, setOllamaModel] = useState<string>('llama3');
  const [availableOllamaModels, setAvailableOllamaModels] = useState<string[]>([]);
  const [isFetchingOllamaModels, setIsFetchingOllamaModels] = useState<boolean>(false);
  const [maxAgeDays, setMaxAgeDays] = useState<number>(2);
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme) return storedTheme as Theme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch (e) {
      return 'light';
    }
  });
  
  // Initialize state from sessionStorage and keep it in sync.
  const [serperApiKey, setSerperApiKey] = useState<string>(() => {
    try {
      return sessionStorage.getItem(SERPER_API_KEY_SESSION_KEY) || '';
    } catch (error) {
      console.error('Failed to read Serper API key from sessionStorage:', error);
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

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'light' ? 'dark' : 'light');
    root.classList.add(theme);
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {
      console.error("Could not save theme to localStorage", e);
    }
  }, [theme]);
  
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';

    // Gracefully fallback for browsers that don't support the View Transitions API.
    // @ts-ignore
    if (!document.startViewTransition) {
      setTheme(newTheme);
      return;
    }

    // Use the View Transitions API for a smooth cross-fade effect.
    // @ts-ignore
    document.startViewTransition(() => {
      // Force React to synchronously update the DOM. This is crucial for
      // the View Transition API to correctly capture the "after" state.
      flushSync(() => {
        setTheme(newTheme);
      });
    });
  };

  useEffect(() => {
    try {
      sessionStorage.setItem(SERPER_API_KEY_SESSION_KEY, serperApiKey);
    } catch (error)      {
      console.error('Failed to save Serper API key to sessionStorage:', error);
    }
  }, [serperApiKey]);

  useEffect(() => {
    try {
      sessionStorage.setItem(GROQ_API_KEY_SESSION_KEY, groqApiKey);
    } catch (error)      {
      console.error('Failed to save Groq API key to sessionStorage:', error);
    }
  }, [groqApiKey]);


  const handleClearHistory = useCallback(() => {
    clearProcessedLinks();
    setProcessedArticles([]);
    alert('Processing history has been cleared.');
  }, []);

  const fetchOllamaModels = useCallback(async () => {
      setIsFetchingOllamaModels(true);
      setError(null);
      try {
          const models = await getOllamaModels();
          setAvailableOllamaModels(models);
          if (models.length > 0) {
              setOllamaModel(currentModel => 
                  models.includes(currentModel) ? currentModel : models[0]
              );
          } else {
              setOllamaModel('');
              setError("No Ollama models found. Please pull a model (e.g., `ollama run llama3`).");
          }
      } catch (err) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred while fetching Ollama models.');
          setAvailableOllamaModels([]);
          setOllamaModel('');
      } finally {
          setIsFetchingOllamaModels(false);
      }
  }, []);

  useEffect(() => {
      if (aiProvider === 'ollama') {
          fetchOllamaModels();
      }
  }, [aiProvider, fetchOllamaModels]);


  const validateApiKeys = useCallback(() => {
    if (!serperApiKey) {
      setError('Serper API Key is required to process feeds.');
      return false;
    }
    if (aiProvider === 'groq' && !groqApiKey) {
      setError('Groq API Key is required when using the Groq provider.');
      return false;
    }
    if (aiProvider === 'ollama' && !ollamaModel) {
      setError('Ollama model name is required when using the Ollama provider.');
      return false;
    }
    return true;
  }, [serperApiKey, aiProvider, groqApiKey, ollamaModel]);

  const handleProcessUrl = useCallback(async (url: string) => {
    if (!validateApiKeys()) return;

    setIsLoading(true);
    setError(null);
    setProcessedArticles([]);

    try {
      const apiConfig = { groqApiKey, groqModel, ollamaModel };
      const randomLoadingMessage = FUNNY_LOADING_MESSAGES[Math.floor(Math.random() * FUNNY_LOADING_MESSAGES.length)];
      setLoadingMessage(randomLoadingMessage);

      const { title, content: articleContent } = await scrapeUrlContent(url);
      
      const extraContext = await serperSearch(title, serperApiKey);
      const fullContent = `${title}\n\n${articleContent}\n\nAdditional Context from Search:\n${extraContext}`;
      
      const summary = await summarizeContent(fullContent, aiProvider, apiConfig);
      const tweetTexts = await generateTweets(summary, aiProvider, apiConfig);
      const tweets: TweetData[] = tweetTexts.map(text => ({ text }));

      const newArticle: ProcessedArticle = {
        id: url,
        title: title,
        link: url,
        summary,
        tweets,
      };

      setProcessedArticles([newArticle]);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [serperApiKey, aiProvider, groqApiKey, groqModel, ollamaModel, validateApiKeys]);

  const handleProcessFeed = useCallback(async (urls: string[]) => {
    if (!validateApiKeys()) return;

    setIsLoading(true);
    setError(null);
    setProcessedArticles([]);

    try {
      const apiConfig = { groqApiKey, groqModel, ollamaModel };
      
      const randomLoadingMessage = FUNNY_LOADING_MESSAGES[Math.floor(Math.random() * FUNNY_LOADING_MESSAGES.length)];
      setLoadingMessage(randomLoadingMessage);

      const feedResults = await Promise.all(
        urls.map(url => fetchAndParseFeed(url).catch(e => {
            console.error(`Failed to fetch or parse feed ${url}:`, e);
            return []; 
        }))
      );
      
      const allItems = feedResults.flat();
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);
      const recentItems = allItems.filter(item => !item.pubDate || item.pubDate > cutoffDate);

      const existingLinks = getProcessedLinks();
      const articlesToProcess = recentItems.filter(item => item.link && !existingLinks.has(item.link));

      if (articlesToProcess.length === 0) {
        setError("No new articles found matching the criteria. Try adjusting the date filter or clearing history.");
        setIsLoading(false);
        return;
      }
      
      for (let i = 0; i < articlesToProcess.length; i++) {
        const item = articlesToProcess[i];
        
        const extraContext = await serperSearch(item.title, serperApiKey);

        const fullContent = `${item.title}\n\n${item.content}\n\nAdditional Context from Search:\n${extraContext}`;

        const summary = await summarizeContent(fullContent, aiProvider, apiConfig);
        
        const tweetTexts = await generateTweets(summary, aiProvider, apiConfig);
        const tweets: TweetData[] = tweetTexts.map(text => ({ text }));

        const newArticle: ProcessedArticle = {
          id: item.link || `${item.title}-${Date.now()}-${i}`,
          title: item.title,
          link: item.link,
          summary,
          tweets,
        };
        
        setProcessedArticles(prevArticles => [...prevArticles, newArticle]);
        if (item.link) {
          addProcessedLink(item.link);
        }

        if (aiProvider === 'gemini' && i < articlesToProcess.length - 1) {
          setLoadingMessage(`Pausing to respect API rate limits...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          const nextRandomLoadingMessage = FUNNY_LOADING_MESSAGES[Math.floor(Math.random() * FUNNY_LOADING_MESSAGES.length)];
          setLoadingMessage(nextRandomLoadingMessage);
        }
      }

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [serperApiKey, aiProvider, groqApiKey, groqModel, ollamaModel, maxAgeDays, validateApiKeys]);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto p-4 md:p-8 max-w-5xl">
        <header className="flex items-center justify-between space-x-4 mb-10">
          <div className="flex items-center space-x-4">
            <LogoIcon className="h-14 w-14 text-brand-primary" />
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-brand-primary tracking-tight">Satirical News Tweet Generator</h1>
              <p className="text-light-text-secondary dark:text-text-secondary text-lg mt-1">Turning today's headlines into tomorrow's punchlines.</p>
            </div>
          </div>
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        </header>

        <main>
          <div className="bg-light-surface dark:bg-gray-medium/30 rounded-lg p-6 shadow-lg mb-8 border border-light-border dark:border-gray-light">
            <FeedForm 
              onProcessFeed={handleProcessFeed} 
              onProcessUrl={handleProcessUrl}
              isLoading={isLoading}
              serperApiKey={serperApiKey}
              setSerperApiKey={setSerperApiKey}
              onClearHistory={handleClearHistory}
              aiProvider={aiProvider}
              setAiProvider={setAiProvider}
              groqApiKey={groqApiKey}
              setGroqApiKey={setGroqApiKey}
              groqModel={groqModel}
              setGroqModel={setGroqModel}
              ollamaModel={ollamaModel}
              setOllamaModel={setOllamaModel}
              availableOllamaModels={availableOllamaModels}
              isFetchingOllamaModels={isFetchingOllamaModels}
              onRefreshOllamaModels={fetchOllamaModels}
              maxAgeDays={maxAgeDays}
              setMaxAgeDays={setMaxAgeDays}
            />
          </div>

          {isLoading && (
            <div className="flex flex-col items-center justify-center text-center p-8">
              <Spinner />
              <p className="mt-4 text-lg font-semibold text-brand-secondary">{loadingMessage}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg relative" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          {processedArticles.length > 0 && (
            <ResultsDisplay 
              articles={processedArticles} 
              // onGenerateImage={handleGenerateImage}
              aiProvider={aiProvider}
            />
          )}

          {!isLoading && !error && processedArticles.length === 0 && (
            <div className="text-center py-16 px-6 bg-light-surface dark:bg-gray-medium/50 rounded-lg border-2 border-dashed border-light-border dark:border-gray-light">
                <div className="text-6xl mb-4" aria-hidden="true">🗞️</div>
                <h3 className="text-xl font-bold text-light-text-primary dark:text-text-primary">The Anvil of Absurdity Awaits</h3>
                <p className="text-light-text-secondary dark:text-text-secondary">Feed me an RSS link or a single URL and I shall forge comedic gold.</p>
            </div>
          )}
        </main>
         <footer className="text-center mt-12 text-light-text-secondary dark:text-text-secondary text-sm">
            <p>Crafted with 🤖 and a hint of existential dread. All content is AI-generated.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;