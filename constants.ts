
export const EXAMPLE_FEEDS = [
  { name: 'BBC News - World', url: 'http://feeds.bbci.co.uk/news/world/rss.xml' },
  { name: 'The New York Times', url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml' },
  { name: 'Público (Portugal)', url: 'https://www.publico.pt/rss' },
  { name: 'Wired', url: 'https://www.wired.com/feed/rss' },
];

export const GROQ_MODELS = [
  { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant' },
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile' },
  { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B' },
] as const;

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
6.  **Use Emojis:** Sparingly use 1-2 relevant emojis per tweet to amplify the satire or irony. The emojis should be clever and add to the comedic effect, not just decorate the text.
7.  **Hashtags:** Do NOT include any hashtags (e.g., #news, #politics).
`;
};


export const getTweetGenerationPromptForGroq = (summary: string, language: string) => {
  let targetLanguage = language;
  let portugueseInstruction = '';

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
6.  **Use Emojis:** Sparingly use 1-2 relevant emojis per tweet to amplify the satire or irony. The emojis should be clever and add to the comedic effect, not just decorate the text.
7.  **Hashtags:** Do NOT include any hashtags (e.g., #news, #politics).
8.  **Output Format Mandate:** You MUST reply with a valid JSON object. The object must contain a single key called "tweets", which is an array of 5 strings. Do not include any other text or explanation. Example: {"tweets": ["First tweet...", "Second tweet..."]}
`;
};
