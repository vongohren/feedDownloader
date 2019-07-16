const logger = require('./logger');

const defaultErrorHandler = (error) => {
  if(error) {
    logger.log('error', `Failing to fetch the feed itself. Message: ${error}.`)
  }
  process.exit(1);
}

const decideAndDownloadError = (error, post) => {
  if(error.code) {
    if(error.code===404) {
        logger.log('error', `Failing for ${post.title}. Http code: ${error.code}. Message: ${error.info}. Most likely an error on the parser and cant find the show on trakt`)
    } else {
        logger.log('error', `Failing for ${post.title}. Http code: ${error.code}. Message: ${error.info}.`)
    }
  } else{
    logger.log('error', error);
  }
}

module.exports = {
  defaultErrorHandler,
  decideAndDownloadError
}
