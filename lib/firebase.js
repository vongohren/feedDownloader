var admin = require("firebase-admin");
var cache = require('memory-cache');
const logger = require('./logger');

admin.initializeApp({
  credential: admin.credential.cert(__dirname+"/../serviceAccountKey.json"),
  databaseURL: "https://feed-controller.firebaseio.com"
});

const defaultDatabase = admin.database();

const getUrl = callback => {
  defaultDatabase.ref('/').once('value').then(function(snapshot) {
    callback(parseUrl(snapshot.val()));
  });
}

const getStaticUrl = callback => {
  defaultDatabase.ref('/staticurl').once('value').then(function(snapshot) {
    callback(snapshot.val());
  });
}

const parseUrl = urlObject => {
  const url = urlObject.url;
  const passkey = urlObject.passkey
  let feedUrl = `${url}&passkey=${passkey}`
  for (let show in urlObject.shows) {
    feedUrl += `&c[]=${urlObject.shows[show]}`
  }
  return feedUrl
}

const getIgnoreList = () => {
    return new Promise((resolve, reject) => {
      if(cache.get('ignored')) {
        resolve(cache.get('ignored'));
      } else {
        defaultDatabase.ref('/ignore').once('value').then((snapshot, error) => {
          const shows = snapshot.val();
          cache.put('ignored', shows);
          resolve(shows);
        }).catch((e)=>{
          logger.log('error', `Firebase ignore failed: ${e} `)
          reject(e)
        });        
      }

    })
}

const getShowTitles = () => {
  return new Promise((resolve, reject) => {
      if(cache.get('shows')) {
          resolve(cache.get('shows'));
      } else {
          defaultDatabase.ref('/showtitles').once('value').then(function(snapshot) {
              const shows = snapshot.val();
              cache.put('shows', shows);
              resolve(shows);
          });
      }
  })
}


module.exports = {
  admin: admin,
  getUrl: getUrl,
  getShowTitles: getShowTitles,
  getStaticUrl: getStaticUrl,
  getIgnoreList: getIgnoreList
}
