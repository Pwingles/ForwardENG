/**
 * AI Natural-Language Movie & TV Search (English)
 *
 * Users type a plain-English description (e.g. "high-rated sci-fi from last year",
 * "movies like Inception", "films directed by Nolan") and the backend LLM parses
 * the intent, searches TMDB, and returns matching results.
 *
 * The backend uses userId for rate-limiting and Pro-user identification.
 */

const API_BASE = "https://fluxapi.vvebo.vip/v1/nlsearch";

const GENRE_ZH_TO_EN = {
  "动作": "Action",
  "冒险": "Adventure",
  "动画": "Animation",
  "喜剧": "Comedy",
  "犯罪": "Crime",
  "纪录": "Documentary",
  "剧情": "Drama",
  "家庭": "Family",
  "奇幻": "Fantasy",
  "历史": "History",
  "恐怖": "Horror",
  "音乐": "Music",
  "悬疑": "Mystery",
  "爱情": "Romance",
  "科幻": "Science Fiction",
  "电视电影": "TV Movie",
  "惊悚": "Thriller",
  "战争": "War",
  "西部": "Western",
  "动作冒险": "Action & Adventure",
  "儿童": "Kids",
  "新闻": "News",
  "真人秀": "Reality",
  "肥皂剧": "Soap",
  "脱口秀": "Talk",
  "战争与政治": "War & Politics",
};

function translateGenres(genreStr) {
  if (!genreStr) return "";
  return genreStr
    .split(/[,，、\s]+/)
    .map(g => g.trim())
    .filter(Boolean)
    .map(g => GENRE_ZH_TO_EN[g] || g)
    .join(", ");
}

WidgetMetadata = {
  id: "forward.nlsearch.en",
  title: "AI Search",
  version: "1.1.0",
  requiredVersion: "0.0.1",
  description:
    "Describe what you want to watch in plain English — AI understands your intent and finds matching results. Daily usage is limited; Pro users get a higher quota.",
  author: "ForwardENG",
  site: "https://github.com/Pwingles/ForwardENG",
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

    const results = data.data || [];
    return results.map(item => {
      if (item.genreTitle) item.genreTitle = translateGenres(item.genreTitle);
      return item;
    });
  } catch (error) {
    console.error("[AI Search] Request failed:", error.message || error);
    throw new Error("AI Search is temporarily unavailable — please try again later");
  }
}
