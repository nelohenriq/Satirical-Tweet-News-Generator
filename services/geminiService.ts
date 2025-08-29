
import { GoogleGenAI, Type } from "@google/genai";
import { TWEET_SYSTEM_PROMPT, getTweetGenerationPrompt, getTweetGenerationPromptForGroq } from '../constants';
import { AIProvider, GroqModelId } from "../types";

// --- Gemini Setup ---
if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const geminiTextModel = 'gemini-2.5-flash';


// --- Groq Setup ---
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';


// --- Gemini Implementations ---
const detectLanguageWithGemini = async (content: string): Promise<string> => {
  if (!content || content.trim().length < 20) {
    return 'English'; // Default for very short or empty content
  }
  const response = await ai.models.generateContent({
    model: geminiTextModel,
    contents: `What language is the following text written in? Respond with only the name of the language (e.g., "English", "Portuguese").\n\nText:\n"""${content.substring(0, 500)}"""`,
  });
  return response.text.trim();
};

const summarizeContentWithGemini = async (content: string, language: string): Promise<string> => {
  let languageInstruction = `The summary MUST be written in ${language}.`;
  
  if (language.toLowerCase().includes('portuguese')) {
      languageInstruction = 'The summary MUST be written in European Portuguese. Use European Portuguese spelling, grammar, and vocabulary. Under no circumstances should you use Brazilian Portuguese variants.'
  }

  const response = await ai.models.generateContent({
    model: geminiTextModel,
    contents: `Summarize the following text into a concise and informative paragraph, keeping the summary under 600 characters. ${languageInstruction} Focus on the key points and main narrative.\n\nText:\n"""${content}"""`,
  });
  return response.text;
};

const generateTweetsWithGemini = async (summary: string, language: string): Promise<string[]> => {
   const response = await ai.models.generateContent({
      model: geminiTextModel,
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
};


// --- Groq Implementations ---
const groqChatCompletion = async (apiKey: string, messages: any[], model: GroqModelId, useJson: boolean = false): Promise<string> => {
    const body: any = {
        messages,
        model: model,
        temperature: 0.7,
    };
    if (useJson) {
        body.response_format = { type: "json_object" };
    }

    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.error?.message || response.statusText;
        throw new Error(`Groq API error: ${errorMessage}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
};

const detectLanguageWithGroq = async (content: string, apiKey: string, model: GroqModelId): Promise<string> => {
    const prompt = `What language is the following text written in? Respond with only the name of the language (e.g., "English", "Portuguese").\n\nText:\n"""${content.substring(0, 500)}"""`;
    const messages = [{ role: "user", content: prompt }];
    const result = await groqChatCompletion(apiKey, messages, model);
    return result.trim();
};

const summarizeContentWithGroq = async (content: string, language: string, apiKey: string, model: GroqModelId): Promise<string> => {
    let languageInstruction = `The summary MUST be written in ${language}.`;
    if (language.toLowerCase().includes('portuguese')) {
      languageInstruction = 'The summary MUST be written in European Portuguese. Use European Portuguese spelling, grammar, and vocabulary. Under no circumstances should you use Brazilian Portuguese variants.'
    }
    const prompt = `Summarize the following text into a concise and informative paragraph, keeping the summary under 600 characters. ${languageInstruction} Focus on the key points and main narrative.\n\nText:\n"""${content}"""`;
    const messages = [{ role: "user", content: prompt }];
    return await groqChatCompletion(apiKey, messages, model);
};

const generateTweetsWithGroq = async (summary: string, language: string, apiKey: string, model: GroqModelId): Promise<string[]> => {
    const prompt = getTweetGenerationPromptForGroq(summary, language);
    const messages = [
        { role: "system", content: TWEET_SYSTEM_PROMPT },
        { role: "user", content: prompt }
    ];
    
    const jsonString = await groqChatCompletion(apiKey, messages, model, true);
    const result = JSON.parse(jsonString);

    if (result.tweets && Array.isArray(result.tweets)) {
        return result.tweets;
    }
    return [];
};


// --- Exported Wrappers ---
interface ApiKeys {
    groqApiKey?: string;
    groqModel?: GroqModelId;
}

export const detectLanguage = async (content: string, provider: AIProvider, apiKeys: ApiKeys): Promise<string> => {
  try {
    if (provider === 'groq') {
      if (!apiKeys.groqApiKey) throw new Error("Groq API Key is missing.");
      if (!apiKeys.groqModel) throw new Error("Groq Model is missing.");
      return await detectLanguageWithGroq(content, apiKeys.groqApiKey, apiKeys.groqModel);
    }
    return await detectLanguageWithGemini(content);
  } catch (error) {
    console.error(`Error detecting language with ${provider}:`, error);
    throw new Error(`Failed to detect language from content using ${provider}.`);
  }
}

export const summarizeContent = async (content: string, language: string, provider: AIProvider, apiKeys: ApiKeys): Promise<string> => {
  try {
    if (provider === 'groq') {
      if (!apiKeys.groqApiKey) throw new Error("Groq API Key is missing.");
      if (!apiKeys.groqModel) throw new Error("Groq Model is missing.");
      return await summarizeContentWithGroq(content, language, apiKeys.groqApiKey, apiKeys.groqModel);
    }
    return await summarizeContentWithGemini(content, language);
  } catch (error) {
    console.error(`Error summarizing content with ${provider}:`, error);
    throw new Error(`Failed to summarize the article content using ${provider}.`);
  }
};

export const generateTweets = async (summary: string, language: string, provider: AIProvider, apiKeys: ApiKeys): Promise<string[]> => {
  try {
    if (provider === 'groq') {
      if (!apiKeys.groqApiKey) throw new Error("Groq API Key is missing.");
      if (!apiKeys.groqModel) throw new Error("Groq Model is missing.");
      return await generateTweetsWithGroq(summary, language, apiKeys.groqApiKey, apiKeys.groqModel);
    }
    return await generateTweetsWithGemini(summary, language);
  } catch (error) {
    console.error(`Error generating tweets with ${provider}:`, error);
    throw new Error(`Failed to generate tweets using ${provider}. The AI might be having a moment.`);
  }
};
