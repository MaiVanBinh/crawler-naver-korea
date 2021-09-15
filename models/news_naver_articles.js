// const paginate = require('./plugins/paginage');
const Mongoose = require("mongoose");
const Schema = Mongoose.Schema;
const news_naver_article_schema = new Schema({
  task_id: {
    type: String,
    required: true,
  },
  origin_id: {
    type: String,
    required: true,
  },
  press: {
    type: String,
    required: true,
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
  comments_link: {
    type: String,
  },
  desc: {
    type: String,
    default: '',
  },
  content: {
    type: String,
    default: '',
  },
  published_at: {
    type: Date,
  },
  modified_at: {
    type: Date,
  },
  comments: {
    type: Number,
    default: 0,
  },
  react: {
    type: Number,
    default: 0,
  },
  like_count: {
    type: Number,
    default: 0,
  },
  warm: {
    type: Number,
    default: 0,
  },
  sad: {
    type: Number,
    default: 0,
  },
  angry: {
    type: Number,
    default: 0,
  },
  want: {
    type: Number,
    default: 0,
  },
  good: {
    type: Number,
    default: 0,
  },
  congrats: {
    type: Number,
    default: 0,
  },
  support: {
    type: Number,
    default: 0,
  },
  expect: {
    type: Number,
    default: 0,
  },
  surprise: {
    type: Number,
    default: 0,
  },
  cheer: {
    type: Number,
    default: 0,
  },
  keyword: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
    required: true,
  },
  thumb_url: {
    type: String
  },
  fan: {
    type: Number,
    default: 0,
  }
},
{
  timestamps: false,
  versionKey: false,
  autoIndex: true
});

news_naver_article_schema.index({ origin_id: 1, keyword: 1 }, { unique: true });
news_naver_article_schema.index({ keyword: 'text' });

news_naver_article_schema.virtual('id')
    .get(function(){ return this.get('_id');})
    .set(function(value){return this.set('_id',value);});

news_naver_article_schema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret.id = ret._id;
    delete ret.__v;
  }
});

news_naver_article_schema.pre('save', function(next) {
  let currentDate = new Date();
  if (!this.created_at)
    this.created_at = currentDate;
  next();
});

// news_naver_article_schema.plugin(paginate);

module.exports = Mongoose.model("news_naver_article", news_naver_article_schema);
