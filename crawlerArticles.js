const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const utf8 = require('utf8');

const crawlerListArticles = async (keyword, page) => {
  const res = await axios.get(
    `https://search.naver.com/search.naver?query=${encodeURI(
      keyword
    )}&where=news&ie=utf8&sm=nws_hty&start=${page * 10 + 1}`
  );
  let $ = cheerio.load(res.data);
  let categories = $("ul.list_news > li");
  if (categories.length > 0) {
    for (let i = 0; i < categories.length; i++) {
      const press = $(categories[i])
        .find("div.news_info > div.info_group > a.info.press")
        .text();
      console.log("press: ", press);
      const title = $(categories[i]).find("a.news_tit")[0]["attribs"]["title"];
      console.log(title);
      const news_link = $(categories[i]).find("a.news_tit")[0]["attribs"][
        "href"
      ];
      console.log("news_link: ", news_link);
      if (
        $(categories[i]).find(
          "div > div > div.news_info > div.info_group > a:nth-child(3)"
        ).length > 0
      ) {
        const navers_link = $(categories[i]).find(
          "div > div > div.news_info > div.info_group > a:nth-child(3)"
        )[0]["attribs"]["href"];
        console.log("navers_link: ", navers_link);
        await crawlerPostDetail(navers_link);
      }
    }
  }
  // let list = $(categories).find("li");
};

const crawlerPostDetail = async (naverLink) => {
  let res = await axios.get(naverLink);
  fs.writeFileSync("test.html", res.data)
  let $ = cheerio.load(res.data);
  let datetime = $(
    "#main_content > div.article_header > div.article_info > div"
  );
  if (datetime.length === 0) {
    console.log(res.data);
  } else {
    console.log(utf8.encode($($(datetime[0]).find("span")[0]).html()))
    const created_at = textToData($($(datetime[0]).find("span")[0]).text());
    console.log("Created_at: ", created_at);
    const last_update = textToData($($(datetime[0]).find("span")[1]).text());
    console.log("last_update: ", last_update);
  }
};

const textToData = (text) => {
  if (!text) return;
  let dateTime = "";
  const arr = text.split(" ");
  const date = arr[0].replace(/\./gi, "-").slice(0, -1);
  const time = arr[2]
    .split(":")
    .map((e, i) => {
      if (arr[1] == "오후" && i === 0) {
        return parseInt(e) + 12;
      }
      return e;
    })
    .join(":");
  dateTime = date + "T" + time;
  return dateTime;
};
crawlerListArticles("출", 1);
