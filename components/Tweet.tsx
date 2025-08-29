import React, { useState } from 'react';
import { XIcon, CopyIcon, CheckIcon } from './icons';

interface TweetProps {
  text: string;
}

export const Tweet: React.FC<TweetProps> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex items-start space-x-3 bg-gray-light p-3 rounded-lg border border-gray-500/50">
      <XIcon className="h-6 w-6 text-text-primary flex-shrink-0 mt-0.5" />
      <div className="flex-grow">
        <p className="text-text-primary text-sm">{text}</p>
      </div>
      <button
        onClick={handleCopy}
        className="p-1.5 rounded-full hover:bg-brand-primary/20 text-text-secondary hover:text-brand-primary transition-colors"
        title="Copy tweet"
      >
        {copied ? (
          <CheckIcon className="h-4 w-4 text-green-400" />
        ) : (
          <CopyIcon className="h-4 w-4" />
        )}
      </button>
    </div>
  );
};