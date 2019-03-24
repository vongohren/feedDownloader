const { fetchFeed, parseFeed } = require('../lib/feed-handler');
const firebase = require('../lib/firebase');

const getFeedUrl = async () => {
  return new Promise((resolve, reject) => {
    firebase.getStaticUrl(async feedUrl => {
      resolve(feedUrl);
    });
  })
}

describe('Test the feed handler', () => {
  let feed;
  test('fetchFeed returnes XML', async (done) => {
    const url = await getFeedUrl();
    try {
      feed = await fetchFeed(url);  
    } catch (error) {
      done.fail(error);
    }
    expect(feed).toEqual(expect.stringContaining('</rss>'))
    expect(feed).toEqual(expect.stringContaining('<?xml version="1.0" encoding="utf-8"?>'));
    expect(feed).toEqual(expect.stringContaining('<title>TV Torrents :: morethan.tv</title>'));
    expect(feed).toEqual(expect.stringContaining('<item>'));
    expect(feed).toEqual(expect.stringContaining('</item>'));
    done();
  });
  
  test('parseFeed returnes complicated parsed feed object', async (done) => {
    if(!feed) {
      done.fail(new Error('parseFeed needs a feed object'));
    }
    const posts = await parseFeed(feed);
    const post = posts[0];
    expect(post.link).toEqual(expect.stringContaining('https://www.morethan.tv/torrents.php?action=download'))
    expect(post.meta).not.toBeNull();
    done();
  })
})


