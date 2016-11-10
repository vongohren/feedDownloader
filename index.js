const request = require('request')
const FeedParser = require('feedparser')

const feedUrl = process.env.FEED_URL
const desicionMaker = require('./lib/desicion-maker.js');

function fetch(feed) {
  // Define our streams
  var posts = [];
  var req = request(feed, {timeout: 10000, pool: false});
  req.setMaxListeners(50);
  // Some feeds do not respond without user-agent and accept headers.
  req.setHeader('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36');
  req.setHeader('accept', 'text/html,application/xhtml+xml');

  var feedparser = new FeedParser();
  var done = (err, obj) => {
    if(err) console.log(err);
    if(obj) console.log(obj);
  }

  // Define our handlers
  req.on('error', done);
  req.on('response', function(res) {
    if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));
    // And boom goes the dynamite
    res.pipe(feedparser);
  });

  feedparser.on('error', done);
  feedparser.on('end', async function() {
    for(let post of posts) {
      let download = await desicionMaker.decide(post)
      if(download) console.log(post.title)
    }
  });
  feedparser.on('readable', function() {
    var post;
    while (post = this.read()) {
      posts.push(post);
    }
  });
}

// setInterval(fetch.bind(this, feedUrl), 10000);
fetch(feedUrl);
