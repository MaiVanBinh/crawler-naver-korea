const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const articlesSchema = new Schema({
  origin_id: {
    type: String,
  },
  press: {
    type: String,
  },
  news_tit: {
    type: String,
  },
  news_link: {
    type: String,
  },
  navers_link: {
    type: String,
  },
  created_at: {
    type: Date,
  },
  last_update: {
    type: Date,
  },
  react: {
    type: Number,
  },
  like: {
    type: Number,
  },
  warm: {
    type: Number,
  },
  sad: {
    type: Number,
  },
  angry: {
    type: Number,
  },
  want: {
    type: Number,
  },
  good: {
    type: Number,
  },
  congrats: {
    type: Number,
  },
  support: {
    type: Number,
  },
  expect: {
    type: Number,
  },
  surprise: {
    type: Number,
  },
  cheer: {
    type: Number,
  },
});

module.exports = mongoose.model("articles", articlesSchema);
