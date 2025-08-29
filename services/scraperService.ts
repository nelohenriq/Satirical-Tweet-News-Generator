
/**
 * Fetches and scrapes the main content from a given URL.
 * @param url The URL of the article to scrape.
 * @returns A promise that resolves to an object containing the title and content.
 */
export const scrapeUrlContent = async (url: string): Promise<{ title: string; content: string }> => {
  // Use the same reliable CORS proxy as the RSS service.
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;

  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL. Status: ${response.status}`);
    }
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Remove script and style elements to clean up the text content.
    doc.querySelectorAll('script, style, nav, header, footer, aside, [role="navigation"], [role="banner"], [role="contentinfo"]').forEach(el => el.remove());
    
    // Attempt to find the main content element using common tags and ARIA roles.
    const mainContentElement = doc.querySelector('main') || doc.querySelector('article') || doc.querySelector('[role="main"]');
    
    // Get text content, preferring the main element if found, otherwise fallback to the body.
    const content = (mainContentElement || doc.body).textContent || '';

    // Extract title, preferring the h1 tag, then the document title.
    const title = doc.querySelector('h1')?.textContent || doc.title || 'Untitled';
    
    if (!content.trim()) {
        throw new Error('Could not extract meaningful content from the page.');
    }

    // Clean up the extracted text by removing excessive whitespace and newlines.
    const cleanedContent = content.replace(/\s+/g, ' ').trim();

    return {
      title: title.trim(),
      content: cleanedContent,
    };
  } catch (error) {
    console.error(`Error scraping URL ${url}:`, error);
    if (error instanceof Error) {
        throw new Error(`Failed to scrape article: ${error.message}`);
    }
    throw new Error('An unknown error occurred while scraping the article.');
  }
};
