
export const search = async (query: string, apiKey: string): Promise<string> => {
  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: query,
        location: "Portugal",
        gl: "pt",
        hl: "pt-pt",
        num: 5
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.message || `HTTP error! status: ${response.status}`;
      throw new Error(`Serper API error: ${errorMessage}`);
    }

    const data = await response.json();

    // Prioritize the answer box for direct, concise answers.
    if (data.answerBox) {
        if (data.answerBox.answer) return data.answerBox.answer;
        if (data.answerBox.snippet) return data.answerBox.snippet;
    }

    // Fallback to concatenating snippets from organic search results.
    if (data.organic && data.organic.length > 0) {
      return data.organic
        .map((result: { snippet: string }) => result.snippet)
        .filter(Boolean) // Ensure no null/undefined snippets are joined
        .join('\n\n');
    }
    
    return "No relevant information found from web search.";

  } catch (error) {
    console.error('Error calling Serper API:', error);
    if (error instanceof Error) {
        // Re-throw with a more user-friendly context
        throw new Error(`Failed to get context from Serper: ${error.message}`);
    }
    throw new Error('An unknown error occurred while contacting the Serper service.');
  }
};
