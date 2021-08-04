const axios = require("axios");
const cheerio = require("cheerio");
const { crawlerNewsDetail } = require("./pup");
const Articles = require("./models/articles");

const crawlerListArticlesByPage = async (keyword, page) => {
  const res = await axios.get(
    `https://search.naver.com/search.naver?query=${encodeURI(
      keyword
    )}&where=news&ie=utf8&sm=nws_hty&start=${page * 10 + 1}`
  );
  let $ = cheerio.load(res.data);

  let categories = $("ul.list_news > li");

  if (categories.length > 0) {
    let item = {};
    for (let i = 0; i < categories.length; i++) {
      const press = $(categories[i])
        .find("div.news_info > div.info_group > a.info.press")
        .text();
      item["press"] = press;
      const title = $(categories[i]).find("a.news_tit")[0]["attribs"]["title"];
      item["news_tit"] = title;
      const news_link = $(categories[i]).find("a.news_tit")[0]["attribs"][
        "href"
      ];
      item["news_link"] = news_link;
      if (
        $(categories[i]).find(
          "div > div > div.news_info > div.info_group > a:nth-child(3)"
        ).length > 0
      ) {
        const navers_link = $(categories[i]).find(
          "div > div > div.news_info > div.info_group > a:nth-child(3)"
        )[0]["attribs"]["href"];
        item["navers_link"] = navers_link;
        const originIds = navers_link.split("?")[1].split("&");
        let origin_id = "";
        for (let i1 = 0; i1 < originIds.length; i1++) {
          const arrK = originIds[i1].split("=");
          if (arrK[0] === "oid") {
            origin_id += "news" + arrK[1];
          }
          if (arrK[0] === "aid") {
            origin_id += "," + arrK[1];
          }
        }

        const data = await crawlerNewsDetail(navers_link);
        console.log({ ...item, ...data, origin_id: origin_id });
        const articles = new Articles({ ...item, ...data, origin_id: origin_id});
        await articles.save();
        
      }
    }
  }
  let pages = $("#main_pack > div.api_sc_page_wrap > div > div > a");
  if (pages) {
    const lastPage = parseInt($(pages[pages.length - 1]).text());
    if (page === lastPage) {
      return false;
    }
  }
  return true;
};

exports.crawlerArticles = async (keyword) => {
  let page = 0;
  while (true) {
    const data = await crawlerListArticlesByPage(keyword, page);
    if (!data) {
      break;
    }
    page++;
  }
};
