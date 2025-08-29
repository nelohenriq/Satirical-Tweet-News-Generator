
import React, { useState } from 'react';
import { XIcon, CopyIcon, CheckIcon } from './icons'; //, PhotoIcon } from './icons';
import { TweetData, AIProvider } from '../types';
import { Spinner } from './Spinner';

interface TweetProps {
  tweet: TweetData;
  aiProvider: AIProvider;
  // onGenerateImage: () => void;
}

export const Tweet: React.FC<TweetProps> = ({ tweet, aiProvider, /* onGenerateImage */ }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(tweet.text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-light-bg dark:bg-gray-light/70 p-3 rounded-lg border border-light-border dark:border-gray-500/50">
      <div className="flex items-start space-x-3">
        <XIcon className="h-6 w-6 text-light-text-primary dark:text-text-primary flex-shrink-0 mt-0.5" />
        <div className="flex-grow">
          <p className="text-light-text-primary dark:text-text-primary text-sm">{tweet.text}</p>
        </div>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-full hover:bg-brand-primary/20 text-light-text-secondary dark:text-text-secondary hover:text-brand-primary transition-colors"
          title="Copy tweet"
        >
          {copied ? (
            <CheckIcon className="h-4 w-4 text-green-500" />
          ) : (
            <CopyIcon className="h-4 w-4" />
          )}
        </button>
      </div>

      {/*
      <div className="mt-3 pt-3 border-t border-light-border dark:border-gray-500/50">
        {aiProvider === 'ollama' && !tweet.imageUrl && !tweet.isGeneratingImage && !tweet.imageError && (
          <button 
            onClick={onGenerateImage}
            className="flex items-center space-x-2 text-sm text-brand-secondary hover:text-brand-primary font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PhotoIcon className="h-5 w-5" />
            <span>Generate Image</span>
          </button>
        )}

        {tweet.isGeneratingImage && (
          <div className="flex items-center space-x-2 text-sm text-light-text-secondary dark:text-text-secondary">
            <Spinner />
            <span>Conjuring pixels from the digital ether...</span>
          </div>
        )}

        {tweet.imageError && (
          <div className="text-sm text-red-600 dark:text-red-400">
            <p><strong className="font-semibold">Image Generation Failed:</strong> {tweet.imageError}</p>
            <p className="text-xs mt-1">Note: This feature requires a local Ollama server running an image generation model (e.g., stable-diffusion) referenced as 'llava-llama3'.</p>
          </div>
        )}

        {tweet.imageUrl && (
          <div>
            <img 
              src={tweet.imageUrl} 
              alt={`AI-generated image for tweet: ${tweet.text}`} 
              className="mt-2 rounded-lg border border-light-border dark:border-gray-600 max-w-full h-auto" 
            />
          </div>
        )}
      </div>
      */}
    </div>
  );
};
