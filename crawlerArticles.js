const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const utf8 = require("utf8");
const { crawlerNewsDetail } = require("./pup");

const crawlerListArticles = async (keyword, page) => {
  const res = await axios.get(`https://search.naver.com/search.naver?query=${encodeURI(
    keyword
  )}&where=news&ie=utf8&sm=nws_hty&start=${page * 10 + 1}`);
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
        const data = await crawlerNewsDetail(navers_link);
        console.log({...item, ...data})
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
  // let list = $(categories).find("li");
};

const crawlerPostDetail = async () => {
  let page = 0;
  while (true) {
    const data = await crawlerListArticles(
      "신데렐라 드레스 입",
      page
    );
    if (!data) {
      break;
    }
    page++;
  }
};
crawlerPostDetail()