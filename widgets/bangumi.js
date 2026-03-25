WidgetMetadata = {
  id: "forward.bangumi.en",
  title: "Anime Schedule",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "Browse trending anime and daily broadcast schedule",
  author: "ForwardENG",
  site: "https://github.com/Pwingles/ForwardENG",
  modules: [
    {
      id: "dailySchedule",
      title: "Daily Schedule",
      functionName: "dailySchedule",
      params: [
        {
          name: "day",
          title: "Day of Week",
          type: "enumeration",
          enumOptions: [
            { title: "Today", value: "today" },
            { title: "Monday", value: "星期一" },
            { title: "Tuesday", value: "星期二" },
            { title: "Wednesday", value: "星期三" },
            { title: "Thursday", value: "星期四" },
            { title: "Friday", value: "星期五" },
            { title: "Saturday", value: "星期六" },
            { title: "Sunday", value: "星期日" },
          ],
        },
      ],
    },
    {
      id: "trending",
      title: "Trending Anime",
      functionName: "trending",
      params: [],
    },
  ],
};

function isLatin(str) {
  if (!str) return false;
  const latinChars = str.replace(/[\s\d\W]/g, "");
  return /^[A-Za-z]+$/.test(latinChars) && latinChars.length > 0;
}

function pickEnglishTitle(anime) {
  const original = anime.tmdb_info?.originalTitle || "";
  const bangumi = anime.bangumi_name || "";
  if (isLatin(original)) return original;
  if (isLatin(bangumi)) return bangumi;
  return original || bangumi || "";
}

const GENRE_ZH_TO_EN = {
  "动作": "Action", "冒险": "Adventure", "动画": "Animation",
  "喜剧": "Comedy", "犯罪": "Crime", "纪录": "Documentary",
  "剧情": "Drama", "家庭": "Family", "奇幻": "Fantasy",
  "历史": "History", "恐怖": "Horror", "音乐": "Music",
  "悬疑": "Mystery", "爱情": "Romance", "科幻": "Science Fiction",
  "电视电影": "TV Movie", "惊悚": "Thriller", "战争": "War",
  "西部": "Western", "动作冒险": "Action & Adventure",
  "儿童": "Kids", "新闻": "News", "真人秀": "Reality",
  "肥皂剧": "Soap", "脱口秀": "Talk", "战争与政治": "War & Politics",
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

async function fetchBangumiData() {
  try {
    const latestUrl = "https://assets.vvebo.vip/scripts/datas/latest.json";
    const response = await Widget.http.get(latestUrl);
    if (response && response.data) return response.data;
  } catch (error) {
    console.log("latest.json failed, trying by date:", error.message);
  }

  const maxRetries = 7;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - i);
      const dateStr =
        targetDate.getFullYear().toString() +
        (targetDate.getMonth() + 1).toString().padStart(2, "0") +
        targetDate.getDate().toString().padStart(2, "0");

      const dataUrl = `https://assets.vvebo.vip/scripts/datas/bangumi_enriched_${dateStr}.json`;
      const response = await Widget.http.get(dataUrl);
      if (response && response.data) return response.data;
    } catch (error) {
      // try next day
    }
  }

  return {
    "星期一": [], "星期二": [], "星期三": [],
    "星期四": [], "星期五": [], "星期六": [], "星期日": [],
  };
}

async function fetchTrendingData() {
  try {
    const latestUrl = "https://assets.vvebo.vip/scripts/datas/latest_bangumi_trending.json";
    const response = await Widget.http.get(latestUrl);
    if (response && response.data) return response.data;
  } catch (error) {
    console.log("latest_bangumi_trending.json failed:", error.message);
  }
  return [];
}

function getAnimeByDay(data, day, maxItems = 50) {
  let animeList = [];

  if (day === "today") {
    const today = new Date();
    const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    const todayWeekday = weekdays[today.getDay()];
    animeList = data[todayWeekday] || [];
  } else {
    animeList = data[day] || [];
  }

  return animeList.slice(0, maxItems);
}

function formatAnimeData(animeList) {
  const validAnimeList = animeList.filter(
    anime => anime && anime.bangumi_name && anime.bangumi_url && anime.tmdb_info && anime.tmdb_info.id
  );

  return validAnimeList.map(anime => ({
    id: anime.tmdb_info?.id || anime.bangumi_url?.split("/").pop() || Math.random().toString(36),
    type: "bangumi",
    title: pickEnglishTitle(anime),
    description: anime.tmdb_info?.description || "",
    releaseDate: anime.tmdb_info?.releaseDate || "",
    backdropPath: anime.tmdb_info?.backdropPath || "",
    posterPath: anime.tmdb_info?.posterPath || "",
    rating: anime.tmdb_info?.rating || 0,
    mediaType: anime.tmdb_info?.mediaType || "tv",
    genreTitle: translateGenres(anime.tmdb_info?.genreTitle || ""),
    bangumiUrl: anime.bangumi_url,
    tmdbInfo: anime.tmdb_info,
    hasTmdb: !!anime.tmdb_info,
    seasonInfo: anime.tmdb_info?.seasonInfo || "",
    originalTitle: anime.tmdb_info?.originalTitle || "",
    popularity: anime.tmdb_info?.popularity || 0,
    voteCount: anime.tmdb_info?.voteCount || 0,
  }));
}

function formatTrendingData(trendingList) {
  const validList = trendingList.filter(
    anime => anime && anime.bangumi_name && anime.bangumi_url && anime.tmdb_info && anime.tmdb_info.id
  );

  return validList.map(anime => ({
    id: anime.tmdb_info?.id || anime.bangumi_url?.split("/").pop() || Math.random().toString(36),
    type: "bangumi",
    title: pickEnglishTitle(anime),
    description: anime.tmdb_info?.description || "",
    releaseDate: anime.tmdb_info?.releaseDate || "",
    backdropPath: anime.tmdb_info?.backdropPath || "",
    posterPath: anime.tmdb_info?.posterPath || "",
    rating: anime.tmdb_info?.rating || 0,
    mediaType: anime.tmdb_info?.mediaType || "tv",
    genreTitle: translateGenres(anime.tmdb_info?.genreTitle || ""),
    bangumiUrl: anime.bangumi_url,
    tmdbInfo: anime.tmdb_info,
    hasTmdb: !!anime.tmdb_info,
    seasonInfo: anime.tmdb_info?.seasonInfo || "",
    originalTitle: anime.tmdb_info?.originalTitle || "",
    popularity: anime.tmdb_info?.popularity || 0,
    voteCount: anime.tmdb_info?.voteCount || 0,
    bangumiRating: anime.bangumi_rating || 0,
    bangumiRank: anime.bangumi_rank || 0,
  }));
}

async function dailySchedule(params) {
  const data = await fetchBangumiData();
  const day = params.day || "today";
  const maxItems = params.maxItems || 50;
  const animeList = getAnimeByDay(data, day, maxItems);
  return formatAnimeData(animeList);
}

async function trending(params) {
  const data = await fetchTrendingData();
  return formatTrendingData(data);
}
