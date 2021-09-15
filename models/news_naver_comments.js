// const paginate = require('./plugins/paginage');
const Mongoose = require("mongoose");
const Schema = Mongoose.Schema;
const news_naver_comment_schema = new Schema({
  origin_id: {
    type: String,
  },
  user_id: {
    type: String,
  },
  URL: {
    type: String,
  },
  content: {
    type: String,
  },
  like_count: {
    type: Number,
    default: 0,
  },
  dislike: {
    type: Number,
    default: 0,
  },
  reply: {
    type: Number,
    default: 0,
  },
  parent_comment_no: {
    type: String,
    default: '0',
  },
  article_origin_id: {
    type: String,
  },
  keyword: {
    type: String,
  },
  published_at: {
    type: Date,
  },
  created_at: {
    type: Date,
  },
},
{
  timestamps: false,
  versionKey: false,
  autoIndex: true
});

news_naver_comment_schema.index({ origin_id: 1, keyword: 1 }, { unique: true });
news_naver_comment_schema.index({ keyword: 'text' });

news_naver_comment_schema.virtual('id')
    .get(function(){ return this.get('_id');})
    .set(function(value){return this.set('_id',value);});

news_naver_comment_schema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret.id = ret._id;
    delete ret.__v;
  }
});

news_naver_comment_schema.pre('save', function(next) {
  let currentDate = new Date();
  if (!this.created_at)
    this.created_at = currentDate;
  next();
});

// news_naver_comment_schema.plugin(paginate);

module.exports = Mongoose.model( "news_naver_comment", news_naver_comment_schema );
