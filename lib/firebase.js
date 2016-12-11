var admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert("./serviceAccountKey.json"),
  databaseURL: "https://feed-controller.firebaseio.com"
});

const defaultDatabase = admin.database();

const getUrl = callback => {
  defaultDatabase.ref('/').once('value').then(function(snapshot) {
    callback(parseUrl(snapshot.val()));
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


module.exports = {
  getUrl: getUrl
}
