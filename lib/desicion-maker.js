const tnp = require('torrent-name-parser')
const request = require('request')
const moment = require('moment')
const logger = require('./logger');
const firebase = require('./firebase');
require("string_score");

const convertTitle= title => {
  let titleCopy = title;
  titleCopy = titleCopy.replace(/( )|(')/g,'-')
  titleCopy = specialItsHandling(titleCopy)
  return titleCopy
}

const specialItsHandling = title => {
  const regex = /\bits\b/gi;
  return title.replace(regex, 'it-s')
}

const registeredUnWatchedShows = [];

const getTraktInfo = metaData => {
  return new Promise((resolve, reject) => {
    var now = moment();
    var oneYearAgo = moment().subtract(1,'year');
    var url = `https://api.trakt.tv/users/vongohren/history/shows/${convertTitle(metaData.title)}?start_at=${oneYearAgo.format()}&end_at=${now.format()}`
    request({
      method:'get',
      uri:url,
      headers: {
        'Content-Type':'application/json',
        'trakt-api-version': '2',
        'trakt-api-key': process.env.TRAKT_CLIENT_ID
      }
    }, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            resolve(JSON.parse(body));
          } else {
            const message = response.statusCode == 403 ? 'Unauthorized on Trakt get info call, probably no env variable' : 'Unexpected error '+error
            reject({'info':message, 'code':response.statusCode});
          }
    })
  })
}

const getTraktCollectionInfo = () => {
  return new Promise((resolve, reject) => {
    var now = moment();
    var oneYearAgo = moment().subtract(1,'year');
    var url = `https://api.trakt.tv/users/vongohren/collection/shows`
    request({
      method:'get',
      uri:url,
      headers: {
        'Content-Type':'application/json',
        'trakt-api-version': '2',
        'trakt-api-key': process.env.TRAKT_CLIENT_ID
      }
    }, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            resolve(JSON.parse(body));
          } else {
            const message = response.statusCode == 403 ? 'Unauthorized on getTraktCollectionInfo call, probably no env variable' : 'Unexpected error '+error
            reject({'info':message, 'code':response.statusCode});
          }
    })
  })
}

const isPreferredResolution = (metaData, resolution) => {
  return metaData.resolution === resolution
}

const isOnlySeason = (metaData) => {
  return metaData.episode ? false : true;
}

async function isWatched(metaData) {
  const body = await getTraktInfo(metaData)
  if(body.length < 1) {
    return false;
  }
  if(body[0].episode.season === metaData.season && body[0].episode.number === metaData.episode) {
    return true
  }
  else {
    return false;
  }
}


async function isDownloaded(metaData) {
  const body = await getTraktCollectionInfo();
  const showInfo = body.find(collectionItem => {
    return collectionItem.show.title.toLowerCase() === metaData.title
  })

  if(!showInfo) {
    return false;
  }

  const season = showInfo.seasons.find(season => {
    return season.number === metaData.season
  })
  if(!season) {
    return false;
  }
  const episode = season.episodes.find(episode => {
    return episode.number === metaData.episode
  })
  if (episode) {
    return true
  } else {
    return false;
  }
}

const isDuplicate = metaData => {
  var duplicates = registeredUnWatchedShows.find(function(showMetaData){
    const isFuzzyDuplicate = metaData.title.includes(showMetaData.title) || showMetaData.title.includes(metaData.title)
    if(
      showMetaData.season === metaData.season &&
      showMetaData.episode === metaData.episode &&
      isFuzzyDuplicate
    ) {
      return true
    }
  })
  if(duplicates) {
    return true
  }
  else {
    registeredUnWatchedShows.push(metaData);
    return false
  }
}

const checkAndReportScore = (show, metaData) => {
  if(show && show.score(metaData.title, 0.99) > 0.65) {
    logger.log('error', `Score is very close but still not a match. My firebase show: ${show} - Title from RSS feed: ${metaData.title} `)
  }
}

const isOneOfMyShows = async (metaData, shows) => {
    const isMyShow = shows.find(show => {
      if(!show) return false
      const isShow = show.toLowerCase() === metaData.title;
      if(!isShow) {
        checkAndReportScore(show, metaData)
      }
      return isShow;
    })
    if(!isMyShow) return false;
    return true;
}

const isEdgeCase = metaData => {
  if(metaData.title === "planet earth" && metaData.season === 2) return true;
  else return false;
}

const specialShowHandlingRewriteValues = metaData => {
    if(metaData.title === "wet hot american summer ten years later") {
        metaData.title = "wet hot american summer";
        metaData.season = "2"
    }
}

const checkIgnoreList = async (metaData) => {
  const ignoreList = await firebase.getIgnoreList();
  const isIgnored = ignoreList.find(show => {
    if(!show) return false
    if(metaData.title === show) {
      return true;
    }
    return false
  })
  if(isIgnored) return true;
  return false;
}

async function decide(rssPost, shows) {
  const metaData = tnp(rssPost.title);
  metaData.title = metaData.title.toLowerCase();
  if(await checkIgnoreList(metaData)) {
    return false
  }

  const isMyShow = await isOneOfMyShows(metaData, shows);
  if(!isMyShow) {
      return false
  }

  specialShowHandlingRewriteValues(metaData);

  if(!isPreferredResolution(metaData, '720p')) {
    return false
  } else if(isOnlySeason(metaData)) {
    return false
  }

  if (isEdgeCase(metaData)) {
    return false;
  }

  let watched = false;
  let downloaded = false;

  [watched, downloaded] = await Promise.all([isWatched(metaData), isDownloaded(metaData)])

  if(watched) {
    return false
  } else if(isDuplicate(metaData)) {
    return false
  } else if(downloaded) {
    return false
  } else {
    return true
  }
}

const clearCache = () => {
  registeredUnWatchedShows = [];
}

module.exports = {
  decide: decide,
  clearCache: clearCache
}
