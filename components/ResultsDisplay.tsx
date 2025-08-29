
import React from 'react';
import { ProcessedArticle, AIProvider } from '../types';
import { ArticleCard } from './ArticleCard';
import { DownloadIcon } from './icons';
import { Tooltip } from './Tooltip';

interface ResultsDisplayProps {
  articles: ProcessedArticle[];
  // onGenerateImage: (articleId: string, tweetIndex: number) => void;
  aiProvider: AIProvider;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ articles, /* onGenerateImage, */ aiProvider }) => {

  const handleDownload = () => {
    const header = `# Satirical News Tweet Generation Results\n\nGenerated on: ${new Date().toUTCString()}\n\n---\n\n`;

    const markdownContent = articles.map(article => {
      const title = `## [${article.title}](${article.link})\n\n`;
      const summary = `### AI Summary\n\n> ${article.summary.replace(/\n/g, '\n> ')}\n\n`;
      const tweets = `### Generated Tweets\n\n${article.tweets.map(t => `- ${t.text}`).join('\n')}`;
      return `${title}${summary}${tweets}`;
    }).join('\n\n---\n\n');

    const fullContent = header + markdownContent;
    const blob = new Blob([fullContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'satirical-news-tweets.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <section>
      <div className="flex justify-between items-center border-b-2 border-light-border dark:border-gray-light pb-2 mb-6">
        <h2 className="text-2xl font-bold text-light-text-primary dark:text-text-primary">Generated Content</h2>
        <Tooltip text="For the discerning archivist. Download all your brilliant, AI-generated satire as a Markdown file.">
          <button
            onClick={handleDownload}
            className="flex items-center space-x-2 bg-light-surface dark:bg-gray-light hover:bg-light-border dark:hover:bg-gray-500 border border-light-border dark:border-gray-500 text-brand-secondary font-semibold py-1.5 px-3 rounded-md transition disabled:opacity-50"
          >
            <DownloadIcon className="h-4 w-4" />
            <span>Download as MD</span>
          </button>
        </Tooltip>
      </div>

      <div className="space-y-6">
        {articles.map((article) => (
          <ArticleCard 
            key={article.id} 
            article={article} 
            // onGenerateImage={onGenerateImage}
            aiProvider={aiProvider}
          />
        ))}
      </div>
    </section>
  );
};
