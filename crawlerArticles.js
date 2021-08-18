const axios = require("axios");
const cheerio = require("cheerio");
const { crawlerNewsDetail } = require("./pup");
const Articles = require("./models/articles");
const { crawlerComments } = require("./comments");
const crawlerListArticlesByPage = async (keyword, days, page) => {
  try {
    const res = await axios.get(
      `https://search.naver.com/search.naver?query=${encodeURI(
        keyword
      )}&where=news&ie=utf8&sm=nws_hty&start=${page * 10 + 1}`
    );
    logger.debug(
      "starting crawler url: " +
        `https://search.naver.com/search.naver?query=${encodeURI(
          keyword
        )}&where=news&ie=utf8&sm=nws_hty&start=${page * 10 + 1}`
    );
    const $ = cheerio.load(res.data);

    const categories = $("ul.list_news > li");

    for (let i = 0; i < categories.length; i++) {
      const item = {};
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
      const sort_desc = $(categories[i]).find("div.news_dsc > div > a").text();
      item["sort_desc"] = news_link;
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
        logger.debug("starting save articles: " + origin_id);
        let articles = await Articles.findOne({ origin_id: origin_id });

        if (articles) {
          await Articles.deleteOne({ origin_id: origin_id });
        }

        const data = await crawl_artical_detail(navers_link);

        if (data != null) {
          const created_at = new Date(data["created_at"]);
          let difference= Math.abs(Date.now()-created_at);
          difference = difference/(1000 * 3600 * 24)

          logger.debug("days_dif: " + difference);
          if (days_dif <= days) {
            articles = new Articles({
              ...item,
              ...data,
              origin_id: origin_id,
            });
            await articles.save();
            articleCount += 1;
            logger.debug("save articles id: " + origin_id);

            if (articles.comments_link) {
              await crawl_comments(articles.comments_link, origin_id);
            }
          }
        }
      }
      // else {
      //   logger.debug("starting save articles news_link: " + item["news_link"]);
      //   let articles = await Articles.findOne({ news_tit: item["news_link"] });
      //   if (articles) {
      //     await Articles.deleteOne({ news_tit: item["news_link"] });
      //   }

      //   articles = new Articles({
      //     ...item,
      //   });
      //   await articles.save();
      //   articleCount += 1;
      //   logger.debug("save articles id TITLE: " + item["news_link"]);
      // }
    }
    const pages = $("#main_pack > div.api_sc_page_wrap > div > div > a");
    if (pages) {
      const lastPage = parseInt($(pages[pages.length - 1]).text());
      if (page === lastPage - 1) {
        return false;
      }
    }
    return true;
  } catch (err) {
    if (err instanceof Error) {
      throw new BaseError(
        "naver news crawl articles by page fail",
        400,
        err.message,
        0
      );
    } else {
      throw err;
    }
  }
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
  console.log("done");
};
