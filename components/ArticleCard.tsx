
import React from 'react';
import { ProcessedArticle, AIProvider } from '../types';
import { Tweet } from './Tweet';
import { LinkIcon } from './icons';

interface ArticleCardProps {
  article: ProcessedArticle;
  onGenerateImage: (articleId: string, tweetIndex: number) => void;
  aiProvider: AIProvider;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, onGenerateImage, aiProvider }) => {
  return (
    <article className="bg-light-surface dark:bg-gray-medium rounded-lg shadow-lg p-6 border border-light-border dark:border-gray-light transition-all duration-300 ease-in-out hover:border-brand-primary hover:shadow-2xl hover:-translate-y-1">
      <header className="mb-4">
        <h3 className="text-xl font-bold text-light-text-primary dark:text-text-primary mb-2">{article.title}</h3>
        {article.link && (
             <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-brand-secondary hover:underline"
            >
                <LinkIcon className="h-4 w-4 mr-1" />
                Read Original Article
            </a>
        )}
      </header>

      <div className="mb-6">
        <h4 className="text-md font-semibold text-light-text-secondary dark:text-text-secondary mb-2">AI Summary:</h4>
        <p className="text-light-text-primary dark:text-text-primary leading-relaxed text-sm">{article.summary}</p>
      </div>

      <div>
        <h4 className="text-md font-semibold text-light-text-secondary dark:text-text-secondary mb-3">Generated Tweets:</h4>
        <div className="space-y-3">
          {article.tweets.map((tweet, index) => (
            <Tweet 
              key={index} 
              tweet={tweet} 
              aiProvider={aiProvider}
              onGenerateImage={() => onGenerateImage(article.id, index)}
            />
          ))}
        </div>
      </div>
    </article>
  );
};
