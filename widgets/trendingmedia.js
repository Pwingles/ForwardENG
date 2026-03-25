WidgetMetadata = {
  id: "forward.trendingmedia.en",
  title: "Trending Media",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "Browse trending movies, TV shows, and variety programs",
  author: "ForwardENG",
  site: "https://github.com/Pwingles/ForwardENG",
  modules: [
    {
      id: "trendingMovies",
      title: "Trending Movies",
      functionName: "trendingMovies",
      params: [],
    },
    {
      id: "latestMovies",
      title: "Latest Movies",
      functionName: "latestMovies",
      params: [],
    },
    {
      id: "trendingTV",
      title: "Trending TV Shows",
      functionName: "trendingTV",
      params: [],
    },
    {
      id: "trendingVariety",
      title: "Trending Variety",
      functionName: "trendingVariety",
      params: [],
    },
  ],
};

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

function isLatin(str) {
  if (!str) return false;
  const latinChars = str.replace(/[\s\d\W]/g, "");
  return /^[A-Za-z]+$/.test(latinChars) && latinChars.length > 0;
}

function pickEnglishTitle(media, tmdbInfo) {
  const original = tmdbInfo?.originalTitle || media?.original_title || "";
  const main = media?.title || "";
  if (isLatin(original)) return original;
  if (isLatin(main)) return main;
  return original || main || "";
}

async function fetchMediaData(category) {
  try {
    const latestUrl = `https://assets.vvebo.vip/scripts/datas/latest_${category}.json`;
    const response = await Widget.http.get(latestUrl);
    if (response && response.data) return response.data;
  } catch (error) {
    console.log(`latest_${category}.json failed, trying by date:`, error.message);
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

      const dataUrl = `https://assets.vvebo.vip/scripts/datas/trending_${category}_enriched_${dateStr}.json`;
      const response = await Widget.http.get(dataUrl);
      if (response && response.data) return response.data;
    } catch (error) {
      // try next day
    }
  }

  return [];
}

function formatMediaData(mediaList) {
  const validMediaList = mediaList.filter(
    media => media && media.title && media.tmdb_info && media.tmdb_info.id
  );

  return validMediaList.map(media => {
    const tmdbInfo = media.tmdb_info;

    return {
      id: tmdbInfo?.id || media?.id || Math.random().toString(36),
      type: "tmdb",
      title: pickEnglishTitle(media, tmdbInfo),
      originalTitle: tmdbInfo?.originalTitle || media?.original_title || "",
      description: tmdbInfo?.description || media?.summary || "",
      releaseDate: tmdbInfo?.releaseDate || media?.release_date || "",
      backdropPath: tmdbInfo?.backdropPath || "",
      posterPath: tmdbInfo?.posterPath || media?.poster_url || "",
      rating: tmdbInfo?.rating || media?.rating || 0,
      mediaType: tmdbInfo?.mediaType || (media?.is_tv ? "tv" : "movie"),
      genreTitle: translateGenres(tmdbInfo?.genreTitle || (media?.genres ? media.genres.join(", ") : "")),
      tmdbInfo: tmdbInfo,
      year: media?.year || "",
      countries: media?.countries || [],
      directors: media?.directors || [],
      actors: media?.actors || [],
      popularity: tmdbInfo?.popularity || 0,
      voteCount: tmdbInfo?.voteCount || 0,
      isNew: media?.is_new || false,
      playable: media?.playable || false,
      episodeCount: media?.episode_count || "",
    };
  });
}

async function trendingMovies(params) {
  const data = await fetchMediaData("trending");
  return formatMediaData(data);
}

async function latestMovies(params) {
  const data = await fetchMediaData("latest");
  return formatMediaData(data);
}

async function trendingTV(params) {
  const data = await fetchMediaData("tv");
  return formatMediaData(data);
}

async function trendingVariety(params) {
  const data = await fetchMediaData("variety");
  return formatMediaData(data);
}
