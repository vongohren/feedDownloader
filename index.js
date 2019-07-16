const desicionMaker = require('./lib/desicion-maker.js');
const logger = require('./lib/logger');
const { fetchFeed, parseFeed } = require('./lib/feed-handler');
const { fetchFile, storeFile } = require('./lib/file-storage');
const firebase = require('./lib/firebase');
const logHelpers = require('./utils/logHelpers')
const { decideAndDownloadError } = require('./lib/error-handler');

const endScript = () => {
  firebase.admin.database().goOffline();
  logger.log('info','Script finished running')
  logger.close()
}

const downloadDecideAndStore = async (posts) => {
  const shows = await firebase.getShowTitles();
  for(let post of posts) {
    let download = false;
    try {
      
      download = await desicionMaker.decide(post, shows);
      if(download) {
        const file = await fetchFile(post);
        const success = await storeFile(file, post);
        logHelpers.logFileDownloaded(post, success);
      }
    } catch (e) {
      decideAndDownloadError(e, post)
    }
  }
}

const initiateFetch = async (feedUrl) => {
  const feed = await fetchFeed(feedUrl);
  const posts = await parseFeed(feed);
  await downloadDecideAndStore(posts);
  endScript();
}

firebase.getStaticUrl(async feedUrl => {
  initiateFetch(feedUrl);
});
