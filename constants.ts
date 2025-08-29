export const EXAMPLE_FEEDS = [
  { name: 'BBC News - World', url: 'http://feeds.bbci.co.uk/news/world/rss.xml' },
  { name: 'The New York Times', url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml' },
  { name: 'Público (Portugal)', url: 'https://www.publico.pt/rss' },
  { name: 'Wired', url: 'https://www.wired.com/feed/rss' },
];

export const TWEET_SYSTEM_PROMPT = `You are a world-class comedy writer and satirist, known for your razor-sharp wit and ability to find the absurdity in serious news. Your style is akin to a head writer for a late-night comedy show, blending intellectual humor with cutting commentary.`;

export const getTweetGenerationPrompt = (summary: string, language: string) => {
  let targetLanguage = language;
  let portugueseInstruction = '';

  // Make the instruction for European Portuguese extremely explicit and non-negotiable.
  if (language.toLowerCase().includes('portuguese')) {
    targetLanguage = 'European Portuguese';
    portugueseInstruction = 'You MUST use European Portuguese spelling, grammar, and vocabulary. Under no circumstances should you use Brazilian Portuguese variants.';
  }
  
  return `
Based on the following news summary, generate 5 distinct tweets.

**Summary:**
"""
${summary}
"""

**Your Task & Strict Guidelines:**
1.  **Satirical Tone:** Convert the news into sharply satirical, comedy-writer-worthy tweets.
2.  **Technique:** Masterfully blend sharp-edged, clever wordplay and unexpected perspectives to highlight the absurdity within the topic.
3.  **Humor Style:** The comedic edge must resonate with users who crave intellectual humor. Use wit, irony, and clever observations.
4.  **Format:** Each tweet must be under 250 characters. Aim for crisp, cutting, and memorable tweets.
5.  **Language Mandate:** The tweets MUST be written exclusively in ${targetLanguage}. ${portugueseInstruction}
6.  **Hashtags:** Do NOT include any hashtags (e.g., #news, #politics).
`;
};