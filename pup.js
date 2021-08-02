const puppeteer = require("puppeteer");
const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms * 1000));
};

async function run() {
  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();
  await page.goto("https://entertain.naver.com/read?aid=0000488090&oid=312");
  await sleep(3);
  let totalHeight = 0;
  let distance = 100;
  let scrollHeight = await page.evaluate(() => {
    return document.body.scrollHeight;
  });
  while (totalHeight < scrollHeight) {
    const reactCount = await page.evaluate(() => {
      const data = {};
      let items = document.querySelectorAll(
        "#content > div.end_ct > div > div.end_top_util > div:nth-child(1) > div._reactionModule.u_likeit > a > span.u_likeit_text._count.num"
      );
      if (items.length > 0) {
        data.t =  items[0].innerText;
      }
      items = document.querySelectorAll(
        "#ends_addition > div._reactionModule.u_likeit > ul > li.u_likeit_list.cheer > a > span.u_likeit_list_count._count"
      );
      if (items.length > 0) {
        data.y = items[0].innerText;
      }
      items = document.querySelectorAll("#content > div.end_ct > div > div.article_info > span > em")
      if (items.length > 0) {
        data.z = items[0].innerText;
      }
      return data;
    });

    console.log(reactCount);
    scrollHeight = await page.evaluate(() => {
      window.scrollBy(0, 300);
      return document.body.scrollHeight;
    });
    totalHeight += 300;
  }

  browser.close();
}
run();
