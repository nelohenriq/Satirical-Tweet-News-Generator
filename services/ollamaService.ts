import { TWEET_SYSTEM_PROMPT, getTweetGenerationPromptForGroq } from '../constants';

const OLLAMA_API_URL = 'http://localhost:11434/api';

// --- Text Generation ---

const ollamaChatCompletion = async (model: string, messages: any[], useJson: boolean = false): Promise<string> => {
    // Note: The Ollama API does not have a "thinkingBudget" or equivalent parameter like some cloud-based APIs.
    // Requests are sent directly to the model for processing, so there is no pre-processing step to disable.
    const body: any = {
        model,
        messages,
        stream: false,
    };
    if (useJson) {
        body.format = "json";
    }

    try {
        const response = await fetch(`${OLLAMA_API_URL}/chat`, {
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

export const summarizeContentWithOllama = async (content: string, model: string): Promise<string> => {
    const languageInstruction = 'The summary MUST be written in European Portuguese. Use European Portuguese spelling, grammar, and vocabulary. Under no circumstances should you use Brazilian Portuguese variants.'
    const prompt = `Summarize the following text into a concise and informative paragraph, keeping the summary under 600 characters. ${languageInstruction} Focus on the key points and main narrative.\n\nText:\n"""${content}"""`;
    const messages = [{ role: "user", content: prompt }];
    return await ollamaChatCompletion(model, messages);
};

export const generateTweetsWithOllama = async (summary: string, model: string): Promise<string[]> => {
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


/*
// --- Image Generation ---

export const generateImageWithOllama = async (prompt: string, model: string): Promise<string> => {
    // NOTE: The user requested 'llava-llama3'. This is a multimodal large language model (MLLM)
    // typically used for understanding images (e.g., image captioning), not generating them.
    // Standard image generation models in Ollama include 'stable-diffusion'.
    // This function is implemented as requested, but it will likely fail unless the user has a
    // custom Ollama setup that enables image generation with this model name.
    const body = {
        model,
        prompt,
        stream: false,
    };
    try {
        const response = await fetch(`${OLLAMA_API_URL}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ollama API Error: Status ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }

        // Ollama image generation models typically return an 'images' array with base64 strings.
        if (data.images && Array.isArray(data.images) && data.images.length > 0) {
            return `data:image/png;base64,${data.images[0]}`;
        }

        throw new Error('API returned no image data. Ensure the Ollama model is a compatible image generation model.');

    } catch (e) {
        if (e instanceof TypeError) {
             throw new Error(`Could not connect to Ollama server at ${OLLAMA_API_URL}. Please ensure it is running and accessible.`);
        }
        // Re-throw other errors with more context
        if (e instanceof Error) {
            throw new Error(`Ollama image generation failed: ${e.message}`);
        }
        throw new Error('An unknown error occurred during Ollama image generation.');
    }
};
*/
