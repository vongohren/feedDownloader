const request = require('request')
const FeedParser = require('feedparser')
const fs = require('fs')
const desicionMaker = require('./lib/desicion-maker.js');
const logger = require('./lib/logger');
const firebase = require('./lib/firebase');
const logHelpers = require('./utils/logHelpers')

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
    if(err) {
        logger.log('error', `Failing to fetch the feed itself. Message: ${err}.`)
        process.exit(1);
    }
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
      let download = false;
      try {
        download = await desicionMaker.decide(post)
        if(download) {
          const requestet = request(post.link)
          requestet.setHeader('user-agent', 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36')
          requestet.setHeader('accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8');
          const filePath = process.env.RSS_FILE_PATH || './'
          const slashRegex = /\//gi;
          const spaceRegex = /\s/gi
          let title = post.title.replace(slashRegex,"-")
          title = title.replace(spaceRegex,"")
          const writeStream = fs.createWriteStream(`${filePath}${title}.torrent`)
          writeStream.on('finish', logHelpers.logFileDownloaded.bind(this, post))
          requestet.pipe(writeStream)
        }
      } catch (e) {
          if(e.code) {
              if(e.code===404) {
                  logger.log('error', `Failing for ${post.title}. Http code: ${e.code}. Message: ${e.info}. Most likely an error on the parser and cant find the show on trakt`)
              } else {
                  logger.log('error', `Failing for ${post.title}. Http code: ${e.code}. Message: ${e.info}.`)
              }

          } else{
              logger.log('error', e);
          }
      }
    }
    firebase.admin.database().goOffline();
    logger.log('info','Script finished running')
    logger.close()
  });
  feedparser.on('readable', function() {
    var post;
    while (post = this.read()) {
      posts.push(post);
    }
  });
}

firebase.getStaticUrl(feedUrl => {
  fetch(feedUrl);
});
