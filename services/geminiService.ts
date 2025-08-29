
import { GoogleGenAI, Type } from "@google/genai";
import { TWEET_SYSTEM_PROMPT, getTweetGenerationPrompt, getTweetGenerationPromptForGroq } from '../constants';
import { AIProvider, GroqModelId } from "../types";
import { summarizeContentWithOllama, generateTweetsWithOllama } from "./ollamaService";

// --- Gemini Setup ---
let ai: GoogleGenAI | null = null;
const geminiTextModel = 'gemini-2.5-flash';

// Initialize Gemini only when API key is available
const initializeGemini = () => {
  try {
    if (!ai && (import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY)) {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
      if (apiKey) {
        ai = new GoogleGenAI({ apiKey });
      }
    }
  } catch (error) {
    console.warn('Failed to initialize Gemini:', error);
  }
  return ai;
};


// --- Groq Setup ---
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';


// --- Gemini Implementations ---
const summarizeContentWithGemini = async (content: string): Promise<string> => {
  const geminiInstance = initializeGemini();
  if (!geminiInstance) {
    throw new Error("Gemini API key not configured. Please set the GEMINI_API_KEY environment variable.");
  }

  const languageInstruction = 'The summary MUST be written in European Portuguese. Use European Portuguese spelling, grammar, and vocabulary. Under no circumstances should you use Brazilian Portuguese variants.'

  const response = await geminiInstance.models.generateContent({
    model: geminiTextModel,
    contents: `Summarize the following text into a concise and informative paragraph, keeping the summary under 600 characters. ${languageInstruction} Focus on the key points and main narrative.\n\nText:\n"""${content}"""`,
    config: {
      // Disable thinking for faster, cleaner summaries.
      thinkingConfig: { thinkingBudget: 0 }
    }
  });
  return response.text;
};

const generateTweetsWithGemini = async (summary: string): Promise<string[]> => {
   const geminiInstance = initializeGemini();
   if (!geminiInstance) {
     throw new Error("Gemini API key not configured. Please set the GEMINI_API_KEY environment variable.");
   }

   const response = await geminiInstance.models.generateContent({
      model: geminiTextModel,
      contents: getTweetGenerationPrompt(summary),
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
          // FIX: Add token budget to prevent empty responses from thinking models.
          maxOutputTokens: 2048,
          thinkingConfig: { thinkingBudget: 0 },
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
    const content = data.choices[0].message.content;

    // Wait for 5 seconds after every Groq API call to respect rate limits.
    await new Promise(resolve => setTimeout(resolve, 5000));

    return content;
};

const summarizeContentWithGroq = async (content: string, apiKey: string, model: GroqModelId): Promise<string> => {
    const languageInstruction = 'The summary MUST be written in European Portuguese. Use European Portuguese spelling, grammar, and vocabulary. Under no circumstances should you use Brazilian Portuguese variants.'
    const prompt = `Summarize the following text into a concise and informative paragraph, keeping the summary under 600 characters. ${languageInstruction} Focus on the key points and main narrative.\n\nText:\n"""${content}"""`;
    const messages = [{ role: "user", content: prompt }];
    return await groqChatCompletion(apiKey, messages, model, false);
};

const generateTweetsWithGroq = async (summary: string, apiKey: string, model: GroqModelId): Promise<string[]> => {
    const prompt = getTweetGenerationPromptForGroq(summary);
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
interface ApiConfig {
    groqApiKey?: string;
    groqModel?: GroqModelId;
    ollamaModel?: string;
}

export const summarizeContent = async (content: string, provider: AIProvider, apiConfig: ApiConfig): Promise<string> => {
  try {
    if (provider === 'groq') {
      if (!apiConfig.groqApiKey) throw new Error("Groq API Key is missing.");
      if (!apiConfig.groqModel) throw new Error("Groq Model is missing.");
      return await summarizeContentWithGroq(content, apiConfig.groqApiKey, apiConfig.groqModel);
    }
    if (provider === 'ollama') {
      if (!apiConfig.ollamaModel) throw new Error("Ollama Model is missing.");
      return await summarizeContentWithOllama(content, apiConfig.ollamaModel);
    }
    return await summarizeContentWithGemini(content);
  } catch (error) {
    console.error(`Error summarizing content with ${provider}:`, error);
    if (provider === 'ollama' && error instanceof Error && error.message.includes('Could not connect')) {
        throw error;
    }
    throw new Error(`Failed to summarize the article content using ${provider}.`);
  }
};

export const generateTweets = async (summary: string, provider: AIProvider, apiConfig: ApiConfig): Promise<string[]> => {
  try {
    if (provider === 'groq') {
      if (!apiConfig.groqApiKey) throw new Error("Groq API Key is missing.");
      if (!apiConfig.groqModel) throw new Error("Groq Model is missing.");
      return await generateTweetsWithGroq(summary, apiConfig.groqApiKey, apiConfig.groqModel);
    }
     if (provider === 'ollama') {
        if (!apiConfig.ollamaModel) throw new Error("Ollama Model is missing.");
        return await generateTweetsWithOllama(summary, apiConfig.ollamaModel);
    }
    return await generateTweetsWithGemini(summary);
  } catch (error) {
    console.error(`Error generating tweets with ${provider}:`, error);
    if (provider === 'ollama' && error instanceof Error && error.message.includes('Could not connect')) {
        throw error;
    }
    throw new Error(`Failed to generate tweets using ${provider}. The AI might be having a moment.`);
  }
};
