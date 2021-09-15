const axios = require("axios");
const cheerio = require("cheerio");
const Articles = require("./models/news_naver_articles");
const Comments = require("./models/news_naver_comments");
const mongoose = require("mongoose");

mongoose
  .connect("mongodb://localhost:27017/naver", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log("good");
  })
  .catch((e) => console.log(e));

const puppeteer = require("puppeteer");

let pageCount = 0;
let totalArticle = 0;
let articleCount = 0;
let commentCount = 0;

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const crawl_comments = async (url, article_origin_id, keyword) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
    });

    const page = await browser.newPage();
    await page.goto(url, {
      waitUntil: "networkidle0",
    });

    const commentsGet = await page.evaluate(
      async ({ api, article_origin_id, keyword, limit }) => {
        function sleep(ms) {
          return new Promise((resolve) => setTimeout(resolve, ms));
        }

        // get comments data
        function getCommentData(comment) {
          const item = {};
          item.user_id = comment.querySelector("span.u_cbox_nick")
            ? comment.querySelector("span.u_cbox_nick").innerText
            : "";
          item.reply = comment.querySelector("span.u_cbox_reply_cnt")
            ? comment.querySelector("span.u_cbox_reply_cnt").innerText
            : 0;
          item.published_at = comment.querySelector("span.u_cbox_date")
            ? comment
                .querySelector("span.u_cbox_date")
                .getAttribute("data-value")
            : null;
          item.like_count = comment.querySelector("em.u_cbox_cnt_recomm")
            ? comment.querySelector("em.u_cbox_cnt_recomm").innerText
            : 0;
          item.dislike = comment.querySelector("em.u_cbox_cnt_unrecomm")
            ? comment.querySelector("em.u_cbox_cnt_unrecomm").innerText
            : 0;
          item.content = comment.querySelector("span.u_cbox_contents")
            ? comment.querySelector("span.u_cbox_contents").innerText
            : 0;
          item.reply = comment.querySelector("span.u_cbox_reply_cnt")
            ? comment.querySelector("span.u_cbox_reply_cnt").innerText
            : 0;
          const arrIDs = comment.parentNode.parentNode
            .getAttribute("data-info")
            .split(",");
          item.parent_comment_no = arrIDs[arrIDs.length - 1].split(":")[1];
          item.origin_id = arrIDs[0].split(":")[1];
          item.article_origin_id = arrIDs[arrIDs.length - 3].split(":")[1];
          return item;
        }

        // sleep for load comment page
        await sleep(500);

        let data = [];
        let commentsGet = 0;
        let el = document.querySelector("li.u_cbox_comment");
        let isLoopParent = true;
        while (isLoopParent) {
          if (el) {
            const seeReply = el.querySelector("a.u_cbox_btn_reply");
            const repl = seeReply
              ? seeReply.querySelector("span.u_cbox_reply_cnt")
              : false;
            if (repl && repl.innerText !== "0") {
              seeReply.click();
              // sleep for reply
              await sleep(500);
              el = document.querySelector("li.u_cbox_comment");
              let page = el ? el.querySelector("div.u_cbox_paginate") : null;
              let isLoop = true;
              while (isLoop) {
                if (page && page.style.display !== "none") {
                  page.querySelector("a.u_cbox_btn_more").click();
                  // sleep for see more comments
                  await sleep(1000);
                }
                el = document.querySelector("li.u_cbox_comment");
                page =
                  el &&
                  el.querySelectorAll("div.u_cbox_paginate") &&
                  el.querySelectorAll("div.u_cbox_paginate").length >= 2
                    ? el.querySelectorAll("div.u_cbox_paginate")[1]
                    : false;
                if (page && page.style.display === "none") {
                  isLoop = false;
                }
              }
              const listComments = el.querySelectorAll("div.u_cbox_area");
              commentsGet = commentsGet + listComments.length;
              for (let i = 0; i < listComments.length; i++) {
                const comment = getCommentData(listComments[i]);
                data.push({
                  ...comment,
                  keyword: keyword,
                  article_origin_id: article_origin_id,
                });
                if (data.length === limit) {
                  data = [];
                }
              }
            } else {
              const commentC = el ? el.querySelector("div.u_cbox_area") : null;
              const comment = commentC ? getCommentData(commentC) : null;
              if (comment) {
                data.push({
                  ...comment,
                  keyword: keyword,
                  article_origin_id: article_origin_id,
                });
                commentsGet = commentsGet + 1;
                if (data.length === limit) {
                  data = [];
                }
              }
            }
          }
          if (el) {
            el.remove();
          }
          el = document.querySelector("li.u_cbox_comment");
          if (!el) {
            el = document.querySelector("div.u_cbox_paginate");
            if (el) {
              if (el.style.display === "none") {
                isLoopParent = false;
              } else {
                if (el.querySelector("a.u_cbox_btn_more")) {
                  el.querySelector("a.u_cbox_btn_more").click();
                }
              }
            }

            // sleep for more comments
            await sleep(1000);
            el = document.querySelector("li.u_cbox_comment");
          }
        }
        return commentsGet;
      },
      {
        api: "",
        article_origin_id: article_origin_id,
        keyword: keyword,
        limit: 20,
      }
    );
    commentCount = commentCount + commentsGet;
    await browser.close();
  } catch (err) {
    console.log("Comments error in url: " + url);
    await browser.close();
    console.log(err);
    
  } finally {
    await browser.close();
  }
};

const crawl_artical_detail = async (url) => {
  console.log("Start crawl_artical_detail in url: " + url);
  let browser;
  try {
    browser = await puppeteer.launch({
      // headless: false
    });
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);

    await page.goto(url, {
      waitUntil: "networkidle0",
    });
    await sleep(500);
    const data = await page.evaluate(() => {
      function textToDate(text) {
        try {
          if (!text) return;
          let dateTime = "";
          const arr = text.split(" ");
          if (arr.length === 4) {
            arr.shift();
          }
          const date = arr[0].replace(/\./gi, "-").slice(0, -1);
          const time = arr[2]
            .split(":")
            .map((e, i) => {
              if (arr[1] == "오후" && i === 0) {
                if (parseInt(e) === 12) {
                  return e;
                }
                return parseInt(e) + 12;
              } else {
                if (e.length === 1) {
                  e = "0" + e;
                }
                return e;
              }
            })
            .join(":");
          dateTime = date + "T" + time;
          return dateTime;
        } catch (err) {
          return null;
        }
      }

      const data = {};
      // get Reacts
      let content = document.getElementById("articleBodyContents");
      if (!content) {
        content = document.getElementById("articeBody");
      }
      if (!content) {
        content = document.getElementById("content");
      }
      if (content) {
        data.content = content.innerText;
      }

      let items = document.querySelectorAll("span.u_likeit_text._count.num");

      if (items.length > 0) {
        data.reacts = items[0].innerText;
      }
      if (!data.reacts) {
        items = document.querySelectorAll(
          "#content > div > div.content > div > div.news_work > div.count > div._reactionModule.u_likeit > a > span.u_likeit_text._count.num"
        );
        if (items.length > 0) {
          data.reacts = items[0].innerText;
        }
      }
      // get date
      // https://news.naver.com/main/read.naver?mode=LSD&mid=sec&sid1=100&oid=025&aid=0003127514&m_view=1&includeAllCount=true&m_url=%2Fcomment%2Fall.nhn%3FserviceId%3Dnews%26gno%3Dnews025%2C0003127514%26sort%3Dlikability
      items = document.querySelectorAll(
        "#main_content > div.article_header > div.article_info > div > span"
      );

      if (items && items.length == 3) {
        data.created_at = items[1].innerText;
        data.created_at = textToDate(data.created_at);
        if (items[2]) {
          data.last_updated = textToDate(items[2].innerText);
        }
      } else if (items && items.length == 2) {
        data.created_at = textToDate(items[0].innerText);
        if (items[1]) {
          data.last_updated = textToDate(items[1].innerText);
        }
      } else if (items.length === 1) {
        data.created_at = textToDate(items[0].innerText);
      }
      // https://entertain.naver.com/read?oid=382&aid=0000931487
      if (!data.created_at) {
        {
          items = document.querySelectorAll(
            "#content > div.end_ct > div > div.article_info > span > em"
          );
          if (items.length === 1) {
            data.created_at = textToDate(items[0].innerText);
          }
          if (items.length === 2) {
            data.created_at = textToDate(items[0].innerText);
            data.last_updated = textToDate(items[1].innerText);
          }
        }
      }
      // https://sports.news.naver.com/news.nhn?oid=421&aid=0005585098
      if (!data.created_at) {
        // get date
        items = document.querySelectorAll(
          "#content > div > div.content > div > div.news_headline > div > span"
        );
        if (items.length === 1) {
          data.created_at = textToDate(items[0].innerText);
        }
        if (items.length === 2) {
          data.created_at = textToDate(items[0].innerText);
          data.last_updated = textToDate(items[1].innerText);
        }
      }
      // get comment
      items = document.querySelectorAll(
        "#articleTitleCommentCount > span.lo_txt"
      );
      data.comments = 0;
      if (items.length > 0) {
        data.comments =
          items[0].innerText === "댓글" ? 0 : parseInt(items[0].innerText);
      }

      // get comment link
      items = document.querySelectorAll("#articleTitleCommentCount");
      data.comments_link = 0;
      if (items.length > 0) {
        data.comments_link = items[0].getAttribute("href");
      }

      // get like
      items = document.querySelectorAll(
        "#spiLayer > div._reactionModule.u_likeit > ul > li.u_likeit_list.good > a > span.u_likeit_list_count._count"
      );
      data.like_count = 0;
      if (items.length > 0) {
        data.like_count = parseInt(items[0].innerText);
      } else {
        items = document.querySelectorAll(
          "#ends_addition > div._reactionModule.u_likeit > ul > li.u_likeit_list.good > a > span.u_likeit_list_count._count"
        );
        if (items.length > 0) {
          data.like_count = parseInt(items[0].innerText);
        }
      }

      if (!data.like_count) {
        items = document.querySelectorAll(
          "#content > div > div.content > div > div.news_end_btn > div._reactionModule.u_likeit > ul > li.u_likeit_list.good > a > span.u_likeit_list_count._count"
        );
        if (items.length > 0) {
          data.like_count = items[0].innerText;
        }
      }

      // get list warm
      items = document.querySelectorAll(
        "#spiLayer > div._reactionModule.u_likeit > ul > li.u_likeit_list.warm > a > span.u_likeit_list_count._count"
      );
      data.warm = 0;
      if (items.length > 0) {
        data.warm = parseInt(items[0].innerText);
      }

      // get list sad
      items = document.querySelectorAll(
        "#spiLayer > div._reactionModule.u_likeit > ul > li.u_likeit_list.sad > a > span.u_likeit_list_count._count"
      );
      data.sad = 0;
      if (items.length > 0) {
        data.sad = parseInt(items[0].innerText);
      }

      if (!data.sad) {
        items = document.querySelectorAll(
          "#content > div > div.content > div > div.news_end_btn > div._reactionModule.u_likeit > ul > li.u_likeit_list.sad > a > span.u_likeit_list_count._count"
        );
        if (items.length > 0) {
          data.sad = items[0].innerText;
        }
      }

      // get list angry
      items = document.querySelectorAll(
        "#spiLayer > div._reactionModule.u_likeit > ul > li.u_likeit_list.angry > a > span.u_likeit_list_count._count"
      );
      data.angry = 0;
      if (items.length > 0) {
        data.angry = parseInt(items[0].innerText);
      }

      if (!data.angry) {
        items = document.querySelectorAll(
          "#content > div > div.content > div > div.news_end_btn > div._reactionModule.u_likeit > ul > li.u_likeit_list.angry > a > span.u_likeit_list_count._count"
        );
        if (items.length > 0) {
          data.angry = items[0].innerText;
        }
      }

      // get list want
      items = document.querySelectorAll(
        "#spiLayer > div._reactionModule.u_likeit > ul > li.u_likeit_list.want > a > span.u_likeit_list_count._count"
      );
      data.want = 0;
      if (items.length > 0) {
        data.want = parseInt(items[0].innerText);
      }

      if (!data.want) {
        items = document.querySelectorAll(
          "#content > div > div.content > div > div.news_end_btn > div._reactionModule.u_likeit > ul > li.u_likeit_list.want > a > span.u_likeit_list_count._count"
        );
        if (items.length > 0) {
          data.want = items[0].innerText;
        }
      }
      // get list good
      items = document.querySelectorAll(
        "#ends_addition > div._reactionModule.u_likeit > ul > li.u_likeit_list.good > a > span.u_likeit_list_count._count"
      );
      data.good = 0;
      if (items.length > 0) {
        data.good = parseInt(items[0].innerText);
      }

      // get list cheer
      items = document.querySelectorAll(
        "#ends_addition > div._reactionModule.u_likeit > ul > li.u_likeit_list.cheer > a > span.u_likeit_list_count._count"
      );
      data.cheer = 0;
      if (items.length > 0) {
        data.cheer = parseInt(items[0].innerText);
      }

      // get list congrats
      items = document.querySelectorAll(
        "#ends_addition > div._reactionModule.u_likeit > ul > li.u_likeit_list.congrats > a > span.u_likeit_list_count._count"
      );
      data.congrats = 0;
      if (items.length > 0) {
        data.congrats = parseInt(items[0].innerText);
      }

      // get list expect
      items = document.querySelectorAll(
        "#ends_addition > div._reactionModule.u_likeit > ul > li.u_likeit_list.expect > a > span.u_likeit_list_count._count"
      );
      data.expect = 0;
      if (items.length > 0) {
        data.expect = parseInt(items[0].innerText);
      }

      // get list surprise
      items = document.querySelectorAll(
        "#ends_addition > div._reactionModule.u_likeit > ul > li.u_likeit_list.surprise > a > span.u_likeit_list_count._count"
      );
      data.surprise = 0;
      if (items.length > 0) {
        data.surprise = parseInt(items[0].innerText);
      }

      // get list sad
      items = document.querySelectorAll(
        "#ends_addition > div._reactionModule.u_likeit > ul > li.u_likeit_list.sad > a > span.u_likeit_list_count._count"
      );
      data.sad = 0;
      if (items.length > 0) {
        data.sad = parseInt(items[0].innerText);
      }
      // fan
      data.fan = 0;
      items = document.querySelectorAll(
        "#content > div > div.content > div > div.news_end_btn > div._reactionModule.u_likeit > ul > li.u_likeit_list.fan > a > span.u_likeit_list_count._count"
      );
      if (items.length > 0) {
        data.sad = items[0].innerText;
      }

      return data;
    });
    await browser.close();
    return data;
  } catch (err) {
    await browser.close();
    console.log(err);
  } finally {
    await browser.close();
  }
};

function getDateStringUri(dateObj) {
  // months from 1-12
  const month = dateObj.getMonth() + 1;
  const day = dateObj.getDate();
  const year = dateObj.getFullYear();
  return [
    year +
      "." +
      (month < 10 ? "0" + month : month) +
      "." +
      (day < 10 ? "0" + day : day),
    year +
      "" +
      (month < 10 ? "0" + month : month) +
      "" +
      (day < 10 ? "0" + day : day),
  ];
}

const crawl_articles_by_page = async (
  keyword,
  isCrawAll,
  startDay,
  endDay,
  page,
  perpage,
  task_id
) => {
  let urlListArticles = "";
  try {
    urlListArticles = `https://search.naver.com/search.naver?query=${encodeURI(
      keyword
    )}&where=news&ie=utf8&sm=nws_hty&start=${page * perpage + 1}`;
    if (!isCrawAll) {
      const ds = getDateStringUri(startDay);
      const de = getDateStringUri(endDay);
      urlListArticles = `https://search.naver.com/search.naver?query=${encodeURI(
        keyword
      )}&where=news&ie=utf8&sm=nws_hty&start=${page * perpage + 1}&ds=${
        ds[0]
      }&de=${de[0]}&nso=so:r,p:from${ds[1]}to${de[1]}&is_sug_officeid=0`;
    }
    console.log(
      "Start crawl_articles_by_page in urlListArticles: " + urlListArticles
    );

    const res = await axios.get(urlListArticles);
    const $ = cheerio.load(res.data);

    const listArticles = $("ul.list_news > li");
    if (!listArticles || listArticles.length === 0) {
      return false;
    }
    console.log("Number article: " + listArticles.length);
    for (let i = 0; i < listArticles.length; i++) {
      const item = {};

      item["content"] = "";
      const image = $(listArticles[i]).find(
        "div.news_wrap > a.dsc_thumb > img"
      );
      item["thumb_url"] = "";
      if (image) {
        item["thumb_url"] = image.attr("src");
      }
      const press = $(listArticles[i])
        .find("div.news_info > div.info_group > a.info.press")
        .text();
      item["press"] = press;
      const title = $(listArticles[i]).find("a.news_tit")[0]["attribs"][
        "title"
      ];
      item["news_tit"] = title;
      const news_link = $(listArticles[i]).find("a.news_tit")[0]["attribs"][
        "href"
      ];
      item["news_link"] = news_link;

      const short_desc = $(listArticles[i])
        .find("div.news_dsc > div > a")
        .text();
      item["desc"] = short_desc;

      if (
        $(listArticles[i]).find(
          "div > div > div.news_info > div.info_group > a:nth-child(3)"
        ).length > 0
      ) {
        const navers_link = $(listArticles[i]).find(
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

        console.log("startid 1st: " + origin_id);
        if (navers_link) {
          const old_articles = await Articles.findOneAndUpdate(
            { origin_id: origin_id, keyword: keyword, task_id: task_id },
            {
              $set: {
                ...item,
              },
            },
            { upsert: true, setDefaultsOnInsert: true }
          ).exec();
          totalArticle += 1;
          console.log("old_articles: " + old_articles);
        }
      }
    }
    const pages = $("#main_pack > div.api_sc_page_wrap > div > div > a");
    if (pages) {
      const lastPage = parseInt($(pages[pages.length - 1]).text());
      console.log("lastPage lastPage: " + lastPage);
      if (page === lastPage - 1) {
        return false;
      }
    }
    return true;
  } catch (err) {
    console.log(err);
  }
};

const news_naver_crawler_main = async () => {
  try {
    totalArticle = 0;
    pageCount = 0;
    articleCount = 0;
    commentCount = 0;

    const task_id = "1bc";
    const keyword = "윤희숙";
    const isAll = false;
    let fromDate = null;
    let toDate = null;
    if (!isAll) {
      fromDate = new Date("2021-09-14");
      toDate = new Date("2021-09-15");
    }
    const perPage = 10;
    while (true) {
      const data = await crawl_articles_by_page(
        keyword,
        isAll,
        fromDate,
        toDate,
        pageCount,
        perPage,
        task_id
      );
      pageCount++;
      if (!data) {
        break;
      }
    }

    // update processing phase=
    console.log({
      total_article: totalArticle,
      article_count: articleCount,
      page_count: pageCount,
      comment_count: commentCount,
      phase_count: 1,
    });

    let page = 0;
    let articles = [];
    do {
      console.log("articles articles mongo:" + page);
      articles = await Articles.find({ keyword: keyword, task_id: task_id }).sort([['updatedAt', 1]])
        .limit(perPage).skip(page*perPage).exec();
      
      console.log("articles l: " + articles.length + "====="  + page*perPage)
      for (let i = 0; i < articles.length; i++) {
        console.log("Start crawl_artical_detail in articleCount: " + articleCount);
        const data = await crawl_artical_detail(articles[i]["navers_link"]);
        if (data) {
          articles[i].angry = data.angry;
          articles[i].cheer = data.cheer;
          articles[i].comments = data.comments;
          articles[i].comments_link = data.comments_link;
          articles[i].congrats = data.congrats;
          articles[i].content = data.content;
          articles[i].expect = data.expect;
          articles[i].good = data.good;
          articles[i].like_count = data.like_count;
          articles[i].modified_at = data.last_updated;
          articles[i].published_at = data.created_at;
          articles[i].fan = data.fan;

          if (!articles[i].modified_at || articles[i].modified_at === "") {
            articles[i].modified_at = articles[i].published_at;
          }
          articles[i].sad = data.sad;
          articles[i].surprise = data.surprise;
          articles[i].want = data.want;
          articles[i].warm = data.warm;
          await articles[i].save();
          console.log("Start crawler comments");
          // if (data.comments_link) {
          //   await crawl_comments(
          //     data.comments_link,
          //     articles[i]["origin_id"],
          //     articles[i]["keyword"]
          //   );
          // }
          articleCount += 1;
          console.log({
            total_article: totalArticle,
            article_count: articleCount,
            page_count: pageCount,
            comment_count: commentCount,
            phase_count: 1,
          });
        } else {
          console.log(`articles[i]["navers_link"]: ` + articles[i]["navers_link"]);
        }
      }
      page++;
    } while (articles.length > 0);
  } catch (err) {
    console.log(err);
  }
  console.log("success");
};

news_naver_crawler_main();
