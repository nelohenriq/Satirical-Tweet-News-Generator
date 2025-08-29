import { GoogleGenAI, Type } from "@google/genai";
import { TWEET_SYSTEM_PROMPT, getTweetGenerationPrompt, getTweetGenerationPromptForGroq } from '../constants';
import { AIProvider, GroqModelId } from "../types";

// --- Gemini Setup ---
if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const geminiTextModel = 'gemini-2.5-flash';


// --- Groq Rate Limiting ---
const GROQ_RPM_LIMIT = 30; // Requests per minute
const GROQ_TPM_LIMIT = 8000; // Tokens per minute
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 60 seconds

// This will store timestamps and token counts of recent Groq requests.
const groqRequestLog: { timestamp: number; tokens: number }[] = [];

/**
 * A simple heuristic to estimate the number of tokens in a string.
 * Based on the observation that one token is roughly 4 characters for English text.
 * @param text The input string.
 * @returns An estimated token count.
 */
const estimateTokens = (text: string): number => {
    return Math.ceil(text.length / 4);
};

/**
 * Checks current Groq API usage against RPM and TPM limits and waits if necessary.
 * This function is stateful and relies on the shared `groqRequestLog`.
 * @param estimatedInputTokens Estimated tokens for the upcoming request's input.
 * @param expectedOutputTokens Estimated tokens for the upcoming request's output.
 */
const handleGroqRateLimiting = async (estimatedInputTokens: number, expectedOutputTokens: number): Promise<void> => {
    const totalTokensForRequest = estimatedInputTokens + expectedOutputTokens;

    // This function will run in a loop until we are clear to make the request.
    while (true) {
        const now = Date.now();
        
        // 1. Clean up old requests from the log.
        while (groqRequestLog.length > 0 && now - groqRequestLog[0].timestamp > RATE_LIMIT_WINDOW_MS) {
            groqRequestLog.shift(); // Remove the oldest request if it's outside the window
        }

        // 2. Calculate current usage in the window.
        const currentRPM = groqRequestLog.length;
        const currentTPM = groqRequestLog.reduce((sum, req) => sum + req.tokens, 0);

        // 3. Check if we would exceed limits with the new request.
        const wouldExceedRPM = currentRPM + 1 > GROQ_RPM_LIMIT;
        const wouldExceedTPM = currentTPM + totalTokensForRequest > GROQ_TPM_LIMIT;

        if (!wouldExceedRPM && !wouldExceedTPM) {
            // We are within limits, break the loop and proceed.
            break;
        }
        
        // 4. If we are rate-limited, calculate the necessary wait time.
        const oldestRequest = groqRequestLog[0];
        if (oldestRequest) {
            // Wait until the oldest request in our log expires, plus a small buffer.
            const timeToWait = (oldestRequest.timestamp + RATE_LIMIT_WINDOW_MS) - now + 50;
            console.log(`Groq rate limit hit. Waiting for ${timeToWait}ms...`);
            await new Promise(resolve => setTimeout(resolve, timeToWait));
        } else {
            // This case should not be hit if limits > 0, but as a safeguard:
            // If the log is empty but we'd still exceed, it means a single request is too large.
            if (totalTokensForRequest > GROQ_TPM_LIMIT) {
                 throw new Error(`Request is too large for Groq's token limit. Estimated tokens: ${totalTokensForRequest}, Limit: ${GROQ_TPM_LIMIT}`);
            }
            break; // Should not happen, but break to avoid an infinite loop.
        }
    }

    // After waiting (or if no wait was needed), log the upcoming request and proceed.
    groqRequestLog.push({ timestamp: Date.now(), tokens: totalTokensForRequest });
};

// --- Groq Setup ---
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// --- Ollama Setup ---
const OLLAMA_API_URL = 'http://localhost:11434/api/chat';


// --- Gemini Implementations ---
const summarizeContentWithGemini = async (content: string): Promise<string> => {
  const languageInstruction = 'The summary MUST be written in European Portuguese. Use European Portuguese spelling, grammar, and vocabulary. Under no circumstances should you use Brazilian Portuguese variants.'

  const response = await ai.models.generateContent({
    model: geminiTextModel,
    contents: `Summarize the following text into a concise and informative paragraph, keeping the summary under 600 characters. ${languageInstruction} Focus on the key points and main narrative.\n\nText:\n"""${content}"""`,
  });
  return response.text;
};

const generateTweetsWithGemini = async (summary: string): Promise<string[]> => {
   const response = await ai.models.generateContent({
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
const groqChatCompletion = async (apiKey: string, messages: any[], model: GroqModelId, useJson: boolean = false, expectedOutputTokens: number = 500): Promise<string> => {
    const promptContent = messages.map(m => m.content).join('\n');
    const estimatedRequestTokens = estimateTokens(promptContent);

    // Await the intelligent rate limiter before making the call.
    await handleGroqRateLimiting(estimatedRequestTokens, expectedOutputTokens);

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

const summarizeContentWithGroq = async (content: string, apiKey: string, model: GroqModelId): Promise<string> => {
    // We request under 600 chars, which is ~150 tokens. Add a buffer.
    const expectedOutputTokens = 250;
    const languageInstruction = 'The summary MUST be written in European Portuguese. Use European Portuguese spelling, grammar, and vocabulary. Under no circumstances should you use Brazilian Portuguese variants.'
    const prompt = `Summarize the following text into a concise and informative paragraph, keeping the summary under 600 characters. ${languageInstruction} Focus on the key points and main narrative.\n\nText:\n"""${content}"""`;
    const messages = [{ role: "user", content: prompt }];
    return await groqChatCompletion(apiKey, messages, model, false, expectedOutputTokens);
};

const generateTweetsWithGroq = async (summary: string, apiKey: string, model: GroqModelId): Promise<string[]> => {
    // 5 tweets * 250 chars = 1250 chars, which is ~315 tokens. Add a buffer.
    const expectedOutputTokens = 500; 
    const prompt = getTweetGenerationPromptForGroq(summary);
    const messages = [
        { role: "system", content: TWEET_SYSTEM_PROMPT },
        { role: "user", content: prompt }
    ];
    
    const jsonString = await groqChatCompletion(apiKey, messages, model, true, expectedOutputTokens);
    const result = JSON.parse(jsonString);

    if (result.tweets && Array.isArray(result.tweets)) {
        return result.tweets;
    }
    return [];
};

// --- Ollama Implementations ---
const ollamaChatCompletion = async (model: string, messages: any[], useJson: boolean = false): Promise<string> => {
    const body: any = {
        model,
        messages,
        stream: false,
    };
    if (useJson) {
        body.format = "json";
    }

    try {
        const response = await fetch(OLLAMA_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Status: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }
        return data.message.content;
    } catch (e) {
        if (e instanceof TypeError) { // Catches network errors
             throw new Error(`Could not connect to Ollama server. Please ensure Ollama is running at ${OLLAMA_API_URL}`);
        }
        throw e; // re-throw other errors
    }
};

const summarizeContentWithOllama = async (content: string, model: string): Promise<string> => {
    const languageInstruction = 'The summary MUST be written in European Portuguese. Use European Portuguese spelling, grammar, and vocabulary. Under no circumstances should you use Brazilian Portuguese variants.'
    const prompt = `Summarize the following text into a concise and informative paragraph, keeping the summary under 600 characters. ${languageInstruction} Focus on the key points and main narrative.\n\nText:\n"""${content}"""`;
    const messages = [{ role: "user", content: prompt }];
    return await ollamaChatCompletion(model, messages);
};

const generateTweetsWithOllama = async (summary: string, model: string): Promise<string[]> => {
    const prompt = getTweetGenerationPromptForGroq(summary);
    const messages = [
        { role: "system", content: TWEET_SYSTEM_PROMPT },
        { role: "user", content: prompt }
    ];
    
    const jsonString = await ollamaChatCompletion(model, messages, true);
    // Some models might wrap the JSON in ```json ... ```, so we clean it.
    const cleanedJsonString = jsonString.replace(/```json\n?|```/g, '').trim();
    const result = JSON.parse(cleanedJsonString);

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