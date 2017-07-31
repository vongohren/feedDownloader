const logger = require('../lib/logger');


const logFileDownloaded = (post) => {
    logger.log("info", `${post.title}, published: ${post.date}`)
}


module.exports = {
    logFileDownloaded: logFileDownloaded
}
