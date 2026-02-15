let isDailyLimitReached = false;

export const postChessApi = async (fen, options = {}) => {
  if (isDailyLimitReached) {
    return {
      type: "error",
      error: "HIGH_USAGE",
      text: "Daily limit already reached.",
    };
  }

  const apiUrl = options.apiUrl || "https://chess-api.com/v1";
  const body = {
    fen,
    depth: options.depth || 18,
    variants: options.variants || 5,
    maxThinkingTime: options.maxThinkingTime || undefined,
  };

  const startTime = Date.now();
  let delay = 200;
  const MAX_WAIT = 5 * 60 * 1000;

  while (true) {
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data && data.type === "error" && data.error === "HIGH_USAGE") {
        isDailyLimitReached = true;
        return data;
      }

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return data;
    } catch (error) {
      const elapsed = Date.now() - startTime;

      if (elapsed >= MAX_WAIT) {
        console.error("API request timed out after 5 minutes of retries.");
        return null;
      }

      console.warn(
        `API call failed (FEN: ${fen}). Retrying in ${delay}ms...`,
        error,
      );

      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
    }
  }
};
