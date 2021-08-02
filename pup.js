const puppeteer = require("puppeteer");
const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms * 1000));
};

exports.crawlerNewsDetail = async (url) => {
  const browser = await puppeteer.launch({
    // headless: false,
  });
  const page = await browser.newPage();
  await page.goto(url);
  await sleep(3);
  let totalHeight = 0;
  let distance = 100;
  let scrollHeight = await page.evaluate(() => {
    return document.body.scrollHeight;
  });
  // while (totalHeight < scrollHeight) {
  const reactCount = await page.evaluate(() => {
    const textToDate = (text) => {
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

    const data = {};
    // get Reacts
    let items = document.querySelectorAll(
      "#content > div.end_ct > div > div.end_top_util > div:nth-child(1) > div._reactionModule.u_likeit > a > span.u_likeit_text._count.num"
    );
    if (items.length > 0) {
      data.reacts = items[0].innerText;
    } else {
      items = document.querySelectorAll(
        "#main_content > div.article_header > div.article_info > div > div.article_btns > div.article_btns_left > div > a > span.u_likeit_text._count.num"
      );
      if (items.length > 0) {
        data.reacts = items[0].innerText;
      }
    }
    // get date
    items = document.querySelectorAll(
      "#main_content > div.article_header > div.article_info > div > span"
    );
    if (items.length > 0) {
      data.created_at = items[0].innerText;
      data.created_at = textToDate(data.created_at);
      if (items[1]) {
        data.last_updated = textToData(items[1].innerText);
      }
    } else {
      items = document.querySelectorAll(
        "#content > div.end_ct > div > div.article_info > span > em"
      );
      if (items.length > 0) {
        data.created_at = textToDate(items[0].innerText);
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
    items = document.querySelectorAll(
      "#articleTitleCommentCount"
    );
    data.comments_link = 0;
    if (items.length > 0) {
      data.comments_link = items[0].getAttribute('href');
    }


    // get like
    items = document.querySelectorAll(
      "#spiLayer > div._reactionModule.u_likeit > ul > li.u_likeit_list.good > a > span.u_likeit_list_count._count"
    );
    data.like = 0;
    if (items.length > 0) {
      data.like = parseInt(items[0].innerText);
    } else {
      items = document.querySelectorAll(
        "#ends_addition > div._reactionModule.u_likeit > ul > li.u_likeit_list.good > a > span.u_likeit_list_count._count"
      );
      if (items.length > 0) {
        data.like = parseInt(items[0].innerText);
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

    // get list angry
    items = document.querySelectorAll(
      "#spiLayer > div._reactionModule.u_likeit > ul > li.u_likeit_list.angry > a > span.u_likeit_list_count._count"
    );
    data.angry = 0;
    if (items.length > 0) {
      data.angry = parseInt(items[0].innerText);
    }

    // get list want
    items = document.querySelectorAll(
      "#spiLayer > div._reactionModule.u_likeit > ul > li.u_likeit_list.want > a > span.u_likeit_list_count._count"
    );
    data.want = 0;
    if (items.length > 0) {
      data.want = parseInt(items[0].innerText);
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
    return data;
  });

  console.log(reactCount);
  // scrollHeight = await page.evaluate(() => {
  //   window.scrollBy(0, 300);
  //   return document.body.scrollHeight;
  // });
  // totalHeight += 300;
  // }

  browser.close();
};
