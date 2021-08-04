const puppeteer = require("puppeteer");
const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms * 1000));
};
const Comments = require("./models/comments");

const crawlerNewsDetail = async (
  url = "https://news.naver.com/main/ranking/read.naver?mode=LSD&mid=shm&sid1=001&oid=022&aid=0003606849&rankingType=RANKING&m_view=1&includeAllCount=true&m_url=%2Fcomment%2Fall.nhn%3FserviceId%3Dnews%26gno%3Dnews022%2C0003606849%26sort%3Dlikability"
) => {
  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();
  await page.goto(url);
  await sleep(5);
  // while (totalHeight < scrollHeight) {
  const data = await page.evaluate(async () => {
    function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms * 1000));
    }
    await sleep(3);
    let el = document.querySelectorAll("div.u_cbox_paginate");
    while (el.length > 0 && el[0].style.display !== "none") {
      let items = document.querySelectorAll("a.u_cbox_btn_more");
      items[0].click();
      await sleep(3);
      el = document.querySelectorAll("div.u_cbox_paginate");
    }

    items = document.querySelectorAll("a.u_cbox_btn_reply");
    for (let i = 0; i < items.length; i++) {
      const repl = items[i].querySelector("span.u_cbox_reply_cnt");
      if (!repl || repl.innerText === "0") {
        continue;
      }
      items[i].click();
      await sleep(3);
    }
    await sleep(10);
    el = document.querySelectorAll("div.u_cbox_paginate");

    while (el.length > 0) {
      let check = 0;
      for (let i = 0; i < el.length; i++) {
        if (el[i].style.display !== "none") {
          let items = el[i].querySelectorAll("a.u_cbox_btn_more");
          items[0].click();
          console.log("click");
          await sleep(3);
        } else {
          check += 1;
        }
      }
      if (check === el.length) {
        break;
      }
      el = document.querySelectorAll("div.u_cbox_paginate");
    }

    const data = [];

    items = document.querySelectorAll("div.u_cbox_area");
    console.log(items.length);
    for (let i = 0; i < items.length; i++) {
      let item = {};
      item.user_id = items[i].querySelector("span.u_cbox_nick")
        ? items[i].querySelector("span.u_cbox_nick").innerText
        : "";
      item.reply = items[i].querySelector("span.u_cbox_reply_cnt")
        ? items[i].querySelector("span.u_cbox_reply_cnt").innerText
        : 0;
      // item.date = items[i].querySelector("span.u_cbox_date")
      //   ? items[i].querySelector("span.u_cbox_date").innerText
      //   : "";
      item.like = items[i].querySelector("em.u_cbox_cnt_recomm")
        ? items[i].querySelector("em.u_cbox_cnt_recomm").innerText
        : 0;
      item.dislike = items[i].querySelector("em.u_cbox_cnt_unrecomm")
        ? items[i].querySelector("em.u_cbox_cnt_unrecomm").innerText
        : 0;

      data.push(item);
    }
    return data;
  });
  for (let i = 0; i < data.length; i++) {
    console.log(data[i]);
    const comment = new Comments({ ...data[i] });
    await comment.save();
  }
  data.forEach(async (e) => {});
  browser.close();
};
crawlerNewsDetail();
