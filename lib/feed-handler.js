const RP = require('request-promise-native');
const FeedParser = require('feedparser')
const { defaultErrorHandler } = require('./error-handler');
const { initiateStreamOnObject } = require('../utils/stream');

const fetchFeed = async (feedUri) => {
  var options = {
    uri: feedUri,
    headers: {
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36',
      'accept': 'text/html,application/xhtml+xml'
    },
    timeout: 10000,
    pool: false
  };
  try {
    const res = await RP(options);
    return res;
  } catch (error) {
    defaultErrorHandler(error);
  }
}

const parseFeed = (feed) => {
  return new Promise((resolve, reject) => {
    const posts = [];
    var feedparser = new FeedParser();
    const stream = initiateStreamOnObject(feed);
    stream.pipe(feedparser);
    feedparser.on('error', defaultErrorHandler);
    feedparser.on('readable', function() {
      var post;
      while (post = this.read()) {
        posts.push(post);
      }
    });
    
    feedparser.on('end', async function() {
      resolve(posts);
    });
  })
}

module.exports = {
  fetchFeed,
  parseFeed
}
