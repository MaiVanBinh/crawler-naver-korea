const puppeteer = require("puppeteer");
const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms * 1000));
};
const Comments = require("./models/news_naver_comments");

const crawlerComments = async (
  url = "https://news.naver.com/main/read.naver?mode=LSD&mid=sec&sid1=100&oid=032&aid=0003098445&m_view=1&includeAllCount=true&m_url=%2Fcomment%2Fall.nhn%3FserviceId%3Dnews%26gno%3Dnews032%2C0003098445%26sort%3Dlikability",
  article_origin_id
) => {
  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();
  await page.goto(url);
  await sleep(5);
  // while (totalHeight < scrollHeight) {
  const data = await page.evaluate(async () => {
    // sleep
    function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms * 1000));
    }

    // get comments data
    function getCommentData(comment) {
      let item = {};
      item.user_id = comment.querySelector("span.u_cbox_nick")
        ? comment.querySelector("span.u_cbox_nick").innerText
        : "";
      item.reply = comment.querySelector("span.u_cbox_reply_cnt")
        ? comment.querySelector("span.u_cbox_reply_cnt").innerText
        : 0;
      item.created_at = comment.querySelector("span.u_cbox_date")
        ? comment.querySelector("span.u_cbox_date").getAttribute("data-value")
        : null;
      item.like = comment.querySelector("em.u_cbox_cnt_recomm")
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

    // call api get create comments
    await sleep(3);
    // document.querySelector("#cbox_module_wai_u_cbox_sort_option_tab1").click();
    // await sleep(3);
    console.log()
    let data = [];

    let el = document.querySelector("li.u_cbox_comment");
    let isLoopParent = true;
    let x = 50;
    while (isLoopParent) {
      el.scroll(0, x);
      x = x + 50;
      if (el) {
        const seeReply = el.querySelector("a.u_cbox_btn_reply");
        const repl = seeReply
          ? seeReply.querySelector("span.u_cbox_reply_cnt")
          : false;
        if (repl && repl.innerText !== "0") {
          seeReply.click();
          await sleep(3);
          el = document.querySelector("li.u_cbox_comment");
          let page = el.querySelector("div.u_cbox_paginate");
          let isLoop = true;
          while (isLoop) {
            if (page && page.style.display !== "none") {
              page.querySelector("a.u_cbox_btn_more").click();
              await sleep(3);
            }
            el = document.querySelector("li.u_cbox_comment");
            page =
              el.querySelectorAll("div.u_cbox_paginate") &&
              el.querySelectorAll("div.u_cbox_paginate").length >= 2
                ? el.querySelectorAll("div.u_cbox_paginate")[1]
                : false;
            if (page && page.style.display === "none") {
              isLoop = false;
            }
          }
          const listComments = el.querySelectorAll("div.u_cbox_area");
          for (let i = 0; i < listComments.length; i++) {
            const comment = getCommentData(listComments[i]);
            data.push(comment);
          }
        } else {
          const commentC = el.querySelector("div.u_cbox_area");
          const comment = getCommentData(commentC);
          // data.push(comment);
        }
        el.remove();
      }
      
      el = document.querySelector("li.u_cbox_comment");
      if (!el) {
        el = document.querySelector("div.u_cbox_paginate");
        if (el && el.style.display === "none") {
          isLoopParent = false;
        }
        el.querySelector("a.u_cbox_btn_more").click();
        await sleep(3);
        el = document.querySelector("li.u_cbox_comment");
      }
    }
    return data;
  });
  console.log(data.length);
  console.log("done");
  browser.close();
};

crawlerComments()