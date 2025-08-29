
export interface RSSItem {
  title: string;
  content: string;
  link: string;
}

export interface ProcessedArticle {
  id: string;
  title: string;
  link: string;
  summary: string;
  tweets: string[];
}
