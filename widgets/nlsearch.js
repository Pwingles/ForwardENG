/**
 * AI Natural-Language Movie & TV Search
 *
 * Users type a plain-English description (e.g. "high-rated sci-fi from last year",
 * "movies like Inception", "films directed by Nolan") and the backend LLM parses
 * the intent, searches TMDB, and returns matching results.
 *
 * The backend uses userId for rate-limiting and Pro-user identification.
 */

const API_BASE = "https://fluxapi.vvebo.vip/v1/nlsearch";

WidgetMetadata = {
  id: "forward.nlsearch",
  title: "AI Search",
  version: "1.1.0",
  requiredVersion: "0.0.1",
  description:
    "Describe what you want to watch in plain English — AI understands your intent and finds matching results. Daily usage is limited; Pro users get a higher quota.",
  author: "Forward",
  site: "https://github.com/InchStudio/ForwardWidgets",
  modules: [
    {
      id: "aiDiscover",
      title: "AI Discover",
      functionName: "nlSearch",
      cacheDuration: 3600,
      params: [
        {
          name: "keyword",
          title: "Describe what you want to watch",
          type: "input",
          value: "Recommend something",
          description: "Describe in plain English — AI finds it for you",
          placeholders: [
            { title: "Recommend something", value: "Recommend something" },
            { title: "Top sci-fi from last year", value: "Top sci-fi from last year" },
            { title: "Nolan movies", value: "Nolan movies" },
            { title: "Movies like Inception", value: "Movies like Inception" },
          ],
        },
        {
          name: "language",
          title: "Language",
          type: "language",
          value: "en-US",
        },
        {
          name: "userId",
          title: "User ID",
          type: "userId",
        },
      ],
    },
  ],
  search: {
    title: "AI Search",
    functionName: "nlSearch",
    params: [
      {
        name: "keyword",
        title: "Search keywords",
        type: "input",
        description: "Describe in plain English — AI finds it for you",
        placeholders: [
          { title: "Top sci-fi from last year", value: "Top sci-fi from last year" },
          { title: "Nolan movies", value: "Nolan movies" },
          { title: "Movies like Inception", value: "Movies like Inception" },
          { title: "Trending TV shows", value: "Trending TV shows" },
        ],
      },
      {
        name: "language",
        title: "Language",
        type: "language",
        value: "en-US",
      },
      {
        name: "userId",
        title: "User ID",
        type: "userId",
      },
    ],
  },
};

async function nlSearch(params = {}) {
  const keyword = (params.keyword || params.query || "").trim();
  if (!keyword) throw new Error("Please enter a search description");

  const language = params.language || "en-US";

  try {
    const response = await Widget.http.post(
      `${API_BASE}/search`,
      { query: keyword, userId: params.userId || "", language: language },
      { headers: { "Content-Type": "application/json" } }
    );

    const data = response.data;

    if (!data || !data.success) {
      throw new Error((data && data.message) || "Search failed");
    }

    return data.data || [];
  } catch (error) {
    console.error("[AI Search] Request failed:", error.message || error);
    throw new Error("AI Search is temporarily unavailable — please try again later");
  }
}
