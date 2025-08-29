
import React from 'react';
import { ProcessedArticle } from '../types';
import { Tweet } from './Tweet';
import { LinkIcon } from './icons';

interface ArticleCardProps {
  article: ProcessedArticle;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  return (
    <article className="bg-gray-medium rounded-lg shadow-xl p-6 border border-gray-light transition-all duration-300 ease-in-out hover:border-brand-primary hover:shadow-2xl hover:-translate-y-1">
      <header className="mb-4">
        <h3 className="text-xl font-bold text-text-primary mb-2">{article.title}</h3>
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
        <h4 className="text-md font-semibold text-text-secondary mb-2">AI Summary:</h4>
        <p className="text-text-primary leading-relaxed text-sm">{article.summary}</p>
      </div>

      <div>
        <h4 className="text-md font-semibold text-text-secondary mb-3">Generated Tweets:</h4>
        <div className="space-y-3">
          {article.tweets.map((tweetText, index) => (
            <Tweet key={index} text={tweetText} />
          ))}
        </div>
      </div>
    </article>
  );
};