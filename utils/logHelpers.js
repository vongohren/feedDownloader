const logger = require('../lib/logger');


const logFileDownloaded = (post, successObj) => {
    logger.log("info", `Downloaded: ${post.title}, published: ${post.date}, filePath: ${successObj.path}`)
}


module.exports = {
    logFileDownloaded: logFileDownloaded
}
