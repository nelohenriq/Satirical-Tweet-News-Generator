
export const search = async (query: string, apiKey: string): Promise<string> => {
  try {
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        // Exa requires a user-agent
        'User-Agent': 'SatiricalNewsTweetGenerator/1.0',
      },
      body: JSON.stringify({
        query: query,
        numResults: 3,
        useAutoprompt: true,
        type: "neural",
        text: {
          maxCharacters: 1000,
          includeHtmlTags: false,
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.error || `HTTP error! status: ${response.status}`;
      throw new Error(`Exa API error: ${errorMessage}`);
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      return data.results.map((result: { text: string }) => result.text).join('\n\n');
    }
    
    return "No relevant information found from Exa web search.";

  } catch (error) {
    console.error('Error calling Exa API:', error);
    if (error instanceof Error) {
        throw new Error(`Failed to get context from Exa: ${error.message}`);
    }
    throw new Error('An unknown error occurred while contacting the Exa service.');
  }
};
