const logger = require('../lib/logger');


const logFileDownloaded = (post) => {
    logger.log("info", `Downloaded: ${post.title}, published: ${post.date}`)
}


module.exports = {
    logFileDownloaded: logFileDownloaded
}
