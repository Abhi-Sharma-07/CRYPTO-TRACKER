export const getAiReply = async (prompt, provider = "gemini") => {
  const isLocalHost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");
  const defaultEndpoint = isLocalHost
    ? "http://localhost:5000/api/ai"
    : "/api/ai";
  const primaryEndpoint = process.env.REACT_APP_AI_ENDPOINT || defaultEndpoint;
  const fallbackEndpoint = primaryEndpoint.includes("localhost")
    ? primaryEndpoint.replace("localhost", "127.0.0.1")
    : primaryEndpoint.includes("127.0.0.1")
    ? primaryEndpoint.replace("127.0.0.1", "localhost")
    : null;

  const endpoints = fallbackEndpoint
    ? [primaryEndpoint, fallbackEndpoint]
    : [primaryEndpoint];
  let response;

  for (const endpoint of endpoints) {
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.REACT_APP_AI_BEARER_TOKEN
            ? { Authorization: `Bearer ${process.env.REACT_APP_AI_BEARER_TOKEN}` }
            : {}),
        },
        body: JSON.stringify({ prompt, provider }),
      });
      break;
    } catch {
      // try the next endpoint
    }
  }

  if (!response) {
    throw new Error(
      `Cannot reach AI server at ${endpoints.join(" or ")}. Start it with: npm run ai:server`
    );
  }

  if (!response.ok) {
    let message = `AI request failed with status ${response.status}`;
    try {
      const errData = await response.json();
      if (errData?.error) {
        message = errData.error;
      }
    } catch {
      // ignore parse errors and keep fallback message
    }
    throw new Error(message);
  }

  const data = await response.json();
  return data.reply || data.output || data.message || "No response received.";
};
