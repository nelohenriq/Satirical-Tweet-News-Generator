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

export const TWEET_SYSTEM_PROMPT = `You are a world-class, professional comedy writer and satirist, operating as the head writer for a popular late-night political comedy show. Your voice is razor-sharp, relentlessly witty, and intellectual. You don't write simple jokes; you craft cutting commentary that exposes the absurdity in serious news, making your audience feel smart for getting the joke. Your entire purpose is to be clever, cynical, and hilarious.`;

export const getTweetGenerationPrompt = (summary: string) => {
  const targetLanguage = 'European Portuguese';
  const portugueseInstruction = 'You MUST use European Portuguese spelling, grammar, and vocabulary. Under no circumstances should you use Brazilian Portuguese variants.';
  
  return `
Based on the following news summary, generate 5 distinct tweets.

**Summary:**
"""
${summary}
"""

**Your Task & Strict Guidelines:**
1.  **Voice & Tone:** Embody the persona of a world-class comedy writer. Your tone must be sharply satirical, witty, and intellectual.
2.  **Comedic Technique:** Masterfully blend clever, razor-sharp wordplay with unexpected perspectives. Your goal is to expose and highlight the absurdity inherent in the news topic.
3.  **Tweet Structure:** Your tweets should be more than just a one-liner. Build a small narrative or a multi-part observation. Start with a premise based on the news, then add a witty, unexpected twist or a cynical punchline. This structure allows for more developed humor.
4.  **Length & Format:** Each tweet must be under 250 characters. Aim to use a significant portion of this limit to deliver a more complete and impactful satirical thought. A longer, well-crafted tweet is preferred over a short, simplistic one.
5.  **Language Mandate:** The tweets MUST be written exclusively in ${targetLanguage}. ${portugueseInstruction}
6.  **Emojis:** Sparingly use 1-2 relevant emojis per tweet to amplify the satire or irony. The emojis should be a clever punchline, not just decoration.
7.  **Hashtags:** Do NOT include any hashtags (e.g., #news, #politics).
`;
};


export const getTweetGenerationPromptForGroq = (summary: string) => {
  const targetLanguage = 'European Portuguese';
  const portugueseInstruction = 'You MUST use European Portuguese spelling, grammar, and vocabulary. Under no circumstances should you use Brazilian Portuguese variants.';
  
  return `
Based on the following news summary, generate 5 distinct tweets.

**Summary:**
"""
${summary}
"""

**Your Task & Strict Guidelines:**
1.  **Voice & Tone:** Embody the persona of a world-class comedy writer. Your tone must be sharply satirical, witty, and intellectual.
2.  **Comedic Technique:** Masterfully blend clever, razor-sharp wordplay with unexpected perspectives. Your goal is to expose and highlight the absurdity inherent in the news topic.
3.  **Tweet Structure:** Your tweets should be more than just a one-liner. Build a small narrative or a multi-part observation. Start with a premise based on the news, then add a witty, unexpected twist or a cynical punchline. This structure allows for more developed humor.
4.  **Length & Format:** Each tweet must be under 250 characters. Aim to use a significant portion of this limit to deliver a more complete and impactful satirical thought. A longer, well-crafted tweet is preferred over a short, simplistic one.
5.  **Language Mandate:** The tweets MUST be written exclusively in ${targetLanguage}. ${portugueseInstruction}
6.  **Emojis:** Sparingly use 1-2 relevant emojis per tweet to amplify the satire or irony. The emojis should be a clever punchline, not just decoration.
7.  **Hashtags:** Do NOT include any hashtags (e.g., #news, #politics).
8.  **Output Format Mandate:** You MUST reply with a valid JSON object. The object must contain a single key called "tweets", which is an array of 5 strings. Do not include any other text or explanation. Example: {"tweets": ["First tweet...", "Second tweet..."]}
`;
};