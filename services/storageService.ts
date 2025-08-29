
const PROCESSED_LINKS_KEY = 'processed-article-links';

/**
 * Retrieves the set of processed article links from localStorage.
 * @returns A Set of strings, where each string is a URL.
 */
export const getProcessedLinks = (): Set<string> => {
  try {
    const storedLinks = localStorage.getItem(PROCESSED_LINKS_KEY);
    if (storedLinks) {
      return new Set(JSON.parse(storedLinks));
    }
  } catch (error) {
    console.error('Failed to parse processed links from localStorage:', error);
    // If parsing fails, start with a fresh set to avoid crashing.
    localStorage.removeItem(PROCESSED_LINKS_KEY);
  }
  return new Set();
};

/**
 * Adds a new article link to the set in localStorage.
 * @param link - The URL of the article to add.
 */
export const addProcessedLink = (link: string): void => {
  if (!link) return;
  try {
    const links = getProcessedLinks();
    links.add(link);
    localStorage.setItem(PROCESSED_LINKS_KEY, JSON.stringify(Array.from(links)));
  } catch (error) {
    console.error('Failed to save processed link to localStorage:', error);
  }
};

/**
 * Clears all stored processed article links from localStorage.
 */
export const clearProcessedLinks = (): void => {
  try {
    localStorage.removeItem(PROCESSED_LINKS_KEY);
  } catch (error) {
    console.error('Failed to clear processed links from localStorage:', error);
  }
};
