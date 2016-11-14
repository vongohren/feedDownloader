const bunyan = require('bunyan');

class Logger {
  constructor() {
    this.mainLogger = bunyan.createLogger({
      name: "rssFeedHandler",
      streams: [
          {
            level: 'info',
            path: __dirname+'/../log/applogging.log'
          }
        ]
      });
  }

  log(level, message) {
    this.mainLogger[level](message);
  }
}

let LoggerClass = new Logger();

module.exports = LoggerClass;
