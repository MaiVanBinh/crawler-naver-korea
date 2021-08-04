const mongoose = require("mongoose");
const { crawlerArticles } = require("./crawlerArticles");

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

crawlerArticles("신데렐라 드레스 입");
