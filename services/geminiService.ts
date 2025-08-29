
import { GoogleGenAI, Type } from "@google/genai";
import { TWEET_SYSTEM_PROMPT, getTweetGenerationPrompt } from '../constants';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const textModel = 'gemini-2.5-flash';

export const detectLanguage = async (content: string): Promise<string> => {
  if (!content || content.trim().length < 20) {
    return 'English'; // Default for very short or empty content
  }
  try {
    const response = await ai.models.generateContent({
      model: textModel,
      contents: `What language is the following text written in? Respond with only the name of the language (e.g., "English", "Portuguese").\n\nText:\n"""${content.substring(0, 500)}"""`,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error detecting language:", error);
    throw new Error("Failed to detect language from content.");
  }
}

export const summarizeContent = async (content: string, language: string): Promise<string> => {
  let languageInstruction = `The summary MUST be written in ${language}.`;
  
  if (language.toLowerCase().includes('portuguese')) {
      languageInstruction = 'The summary MUST be written in European Portuguese. Use European Portuguese spelling, grammar, and vocabulary. Under no circumstances should you use Brazilian Portuguese variants.'
  }

  try {
    const response = await ai.models.generateContent({
      model: textModel,
      contents: `Summarize the following text into a concise and informative paragraph. ${languageInstruction} Focus on the key points and main narrative.\n\nText:\n"""${content}"""`,
    });
    return response.text;
  } catch (error) {
    console.error("Error summarizing content:", error);
    throw new Error("Failed to summarize the article content.");
  }
};

export const generateTweets = async (summary: string, language: string): Promise<string[]> => {
  try {
     const response = await ai.models.generateContent({
        model: textModel,
        contents: getTweetGenerationPrompt(summary, language),
        config: {
            systemInstruction: TWEET_SYSTEM_PROMPT,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    tweets: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.STRING,
                            description: "A single satirical tweet."
                        }
                    }
                },
                required: ["tweets"]
            },
        },
     });

    const jsonString = response.text;
    const result = JSON.parse(jsonString);
    
    if (result.tweets && Array.isArray(result.tweets)) {
      return result.tweets;
    }
    return [];

  } catch (error) {
    console.error("Error generating tweets:", error);
    throw new Error("Failed to generate tweets. The AI might be having a moment.");
  }
};
