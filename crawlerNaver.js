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

crawlerArticles("윤석열 27.5%·이재명 25.5%…尹 하락세 둔화");
