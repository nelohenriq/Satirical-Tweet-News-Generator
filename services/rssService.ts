
import { RSSItem } from '../types';

// A simple regex to strip HTML tags.
const stripHtml = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
};

export const fetchAndParseFeed = async (url: string): Promise<RSSItem[]> => {
  // Using a more reliable CORS proxy.
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
  
  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed. Status: ${response.status}`);
    }
    const text = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'application/xml');

    const errorNode = xmlDoc.querySelector('parsererror');
    if (errorNode) {
      console.error('XML Parsing Error:', errorNode.textContent);
      throw new Error('Failed to parse the RSS feed. The format might be invalid.');
    }

    const items = Array.from(xmlDoc.querySelectorAll('item, entry'));
    
    return items.map(item => {
      const title = item.querySelector('title')?.textContent ?? '';
      const link = item.querySelector('link')?.getAttribute('href') ?? item.querySelector('link')?.textContent ?? '';
      
      // RSS feeds have content in different tags, try to find the best one.
      const contentEncoded = item.querySelector('encoded')?.textContent ?? '';
      const description = item.querySelector('description')?.textContent ?? '';
      const content = item.querySelector('content')?.textContent ?? '';
      const rawContent = contentEncoded || content || description;

      // Try to find and parse the publication date from various common tags.
      const dateString = item.querySelector('pubDate')?.textContent ?? 
                         item.querySelector('published')?.textContent ?? 
                         item.querySelector('updated')?.textContent ?? 
                         '';
      let pubDate: Date | undefined = undefined;
      if (dateString) {
          const parsedDate = new Date(dateString);
          if (!isNaN(parsedDate.getTime())) { // Check if the date is valid
              pubDate = parsedDate;
          }
      }
      
      return {
        title,
        link,
        content: stripHtml(rawContent).trim(),
        pubDate,
      };
    });
  } catch (error) {
    console.error('Error fetching or parsing RSS feed:', error);
    if (error instanceof Error && error.message.includes('Failed to fetch')) {
        throw new Error('Network error or CORS issue. The proxy might be down or the feed URL is incorrect.');
    }
    throw error;
  }
};
