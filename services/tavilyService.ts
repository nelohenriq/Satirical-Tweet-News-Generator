
export const search = async (query: string, apiKey: string): Promise<string> => {
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: "basic",
        include_answer: true,
        max_results: 3
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})); // Catch if error response is not valid JSON
      const errorMessage = errorData?.error || `HTTP error! status: ${response.status}`;
      // Create a new error object and attach the status code
      const error = new Error(`Tavily API error: ${errorMessage}`);
      // @ts-ignore - attaching a custom property
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    if (data.answer) {
      return data.answer;
    }

    // Fallback if there's no direct answer but there are results
    if (data.results && data.results.length > 0) {
      return data.results.map((result: { content: string }) => result.content).join('\n\n');
    }
    
    return "No relevant information found from web search.";

  } catch (error) {
    console.error('Error calling Tavily API:', error);
    if (error instanceof Error) {
        throw error; // Re-throw the original error with status code
    }
    throw new Error('An unknown error occurred while contacting the Tavily service.');
  }
};
