/**
 * Danmu (bullet comments) module
 * When a module type is set to "danmu", the following params are auto-provided:
 * tmdbId, type (tv|movie), title, seriesName, episodeName, airDate,
 * runtime, premiereDate, season, episode, link, videoUrl,
 * commentId, animeId
 */
WidgetMetadata = {
  id: "forward.danmu.en",
  title: "Bullet Comments",
  version: "1.0.2",
  requiredVersion: "0.0.2",
  description: "Fetch bullet comments (danmu) from a specified server",
  author: "ForwardENG",
  site: "https://github.com/Pwingles/ForwardENG",
  globalParams: [
    {
      name: "server",
      title: "Custom Server",
      type: "input",
      placeholders: [
        {
          title: "DanDanPlay",
          value: "https://api.dandanplay.net",
        },
      ],
    },
  ],
  modules: [
    {
      id: "searchDanmu",
      title: "Search Comments",
      functionName: "searchDanmu",
      type: "danmu",
      params: [],
    },
    {
      id: "getDetail",
      title: "Get Details",
      functionName: "getDetailById",
      type: "danmu",
      params: [],
    },
    {
      id: "getComments",
      title: "Get Comments",
      functionName: "getCommentsById",
      type: "danmu",
      params: [],
    },
  ],
};

async function searchDanmu(params) {
  const { tmdbId, type, title, season, link, videoUrl, server } = params;

  let queryTitle = title;

  const response = await Widget.http.get(
    `${server}/api/v2/search/anime?keyword=${queryTitle}`,
    {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "ForwardWidgets/1.0.0",
      },
    }
  );

  if (!response) {
    throw new Error("Failed to fetch data");
  }

  const data = response.data;

  if (!data.success) {
    throw new Error(data.errorMessage || "API call failed");
  }

  const movieTypes = ["movie", "电影", "奇幻片", "剧场版"];
  let animes = [];
  if (data.animes && data.animes.length > 0) {
    animes = data.animes.filter((anime) => {
      const animeType = (anime.type || "").toLowerCase();
      if (type === "movie") {
        return movieTypes.some(t => t.toLowerCase() === animeType);
      }
      if (type === "tv") {
        return !movieTypes.some(t => t.toLowerCase() === animeType);
      }
      return true;
    });
    if (season) {
      const matchedAnimes = animes.filter((anime) => {
        if (anime.animeTitle.includes(queryTitle)) {
          let titleParts = anime.animeTitle.split(" ");
          if (titleParts.length > 1) {
            let seasonPart = titleParts[1];
            let seasonIndex = seasonPart.match(/\d+/);
            if (seasonIndex && seasonIndex[0] === season) {
              return true;
            }
            let chineseNumber = seasonPart.match(/[一二三四五六七八九十壹贰叁肆伍陆柒捌玖拾]+/);
            if (chineseNumber && String(convertChineseNumber(chineseNumber[0])) === season) {
              return true;
            }
          }
          return false;
        } else {
          return false;
        }
      });
      if (matchedAnimes.length > 0) {
        animes = matchedAnimes;
      }
    }
  }
  return { animes: animes };
}

function convertChineseNumber(chineseNumber) {
  if (/^\d+$/.test(chineseNumber)) {
    return Number(chineseNumber);
  }

  const digits = {
    '零': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9,
    '壹': 1, '貳': 2, '參': 3, '肆': 4, '伍': 5,
    '陸': 6, '柒': 7, '捌': 8, '玖': 9,
  };

  const units = {
    '十': 10, '百': 100, '千': 1000,
    '拾': 10, '佰': 100, '仟': 1000,
  };

  let result = 0;
  let current = 0;
  let lastUnit = 1;

  for (let i = 0; i < chineseNumber.length; i++) {
    const char = chineseNumber[i];

    if (digits[char] !== undefined) {
      current = digits[char];
    } else if (units[char] !== undefined) {
      const unit = units[char];
      if (current === 0) current = 1;
      if (unit >= lastUnit) {
        result = current * unit;
      } else {
        result += current * unit;
      }
      lastUnit = unit;
      current = 0;
    }
  }

  if (current > 0) {
    result += current;
  }

  return result;
}

async function getDetailById(params) {
  const { server, animeId } = params;
  const response = await Widget.http.get(
    `${server}/api/v2/bangumi/${animeId}`,
    {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "ForwardWidgets/1.0.0",
      },
    }
  );

  if (!response) {
    throw new Error("Failed to fetch data");
  }

  return response.data.bangumi.episodes;
}

async function getCommentsById(params) {
  const { server, commentId, link, videoUrl, season, episode, tmdbId, type, title } = params;

  if (commentId) {
    const response = await Widget.http.get(
      `${server}/api/v2/comment/${commentId}?withRelated=true&chConvert=1`,
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "ForwardWidgets/1.0.0",
        },
      }
    );

    if (!response) {
      throw new Error("Failed to fetch data");
    }
    return response.data;
  }
  return null;
}
