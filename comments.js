const puppeteer = require("puppeteer");
const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms * 1000));
};

const crawlerNewsDetail = async (
  url = "https://news.naver.com/main/read.naver?mode=LSD&mid=sec&sid1=100&oid=001&aid=0012560988&m_view=1&includeAllCount=true&m_url=%2Fcomment%2Fall.nhn%3FserviceId%3Dnews%26gno%3Dnews001%2C0012560988%26sort%3Dlikability"
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
    await sleep(5);
    let items = document.querySelectorAll("a.u_cbox_btn_more");
    while(items.length > 0) {
        items[0].click();
        await sleep(5);
        items = document.querySelectorAll("a.u_cbox_btn_more");
    }
    // const data = [];
    // // get Reacts
    // let items = document.querySelectorAll("div.u_cbox_area");
    // console.log(items.length);
    // for (let i = 0; i < items.length; i++) {
    //   let item = {};
    //   item.id = items[i].querySelector("span.u_cbox_nick")
    //     ? items[i].querySelector("span.u_cbox_nick").innerText
    //     : "";
    //   item.reply = items[i].querySelector("span.u_cbox_reply_cnt")
    //     ? items[i].querySelector("span.u_cbox_reply_cnt").innerText
    //     : 0;
    //   item.date = items[i].querySelector("span.u_cbox_date")
    //     ? items[i].querySelector("span.u_cbox_date").innerText
    //     : "";
    //   item.like = items[i].querySelector("em.u_cbox_cnt_recomm")
    //     ? items[i].querySelector("em.u_cbox_cnt_recomm").innerText
    //     : 0;
    //   item.dislike = items[i].querySelector("em.u_cbox_cnt_unrecomm")
    //     ? items[i].querySelector("em.u_cbox_cnt_unrecomm").innerText
    //     : 0;
    //   data.push(item);
    // }
    return "items.length";
  });

  console.log(data);
  await sleep(5);
  //   browser.close();
};
crawlerNewsDetail();
