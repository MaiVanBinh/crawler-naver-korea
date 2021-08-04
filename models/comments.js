const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const commentsSchema = new Schema({
  origin_id: {
    type: String,
  },
  user_id: {
    type: String,
  },
  URL: {
    type: String,
  },
  created_at: {
    type: Date,
  },
  content: {
    type: String,
  },
  like: {
    type: Number,
  },
  dislike: {
    type: Number,
  },
  reply: {
    type: Number,
  },
  parent_comment_no: {
    type: Number,
  },
  article_origin_id: {
    type: Number,
  },
});

module.exports = mongoose.model("comments", commentsSchema);
