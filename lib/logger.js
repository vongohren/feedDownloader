const winston = require('winston')
require('winston-papertrail').Papertrail;

const winstonPapertrail = new winston.transports.Papertrail({
  host: 'logs5.papertrailapp.com',
  port: 48224,
  colorize: true,
  program: 'feedDownloader'
})

winstonPapertrail.on('error', function(err) {
  console.log(err);
});

class Logger {
    constructor() {
        this.mainLogger = new winston.Logger({
          transports: [
            new (winston.transports.File)({ filename: __dirname+'/../log/applogging.log' }),
            winstonPapertrail
          ]
        });
    }

    log(level, message) {
        this.mainLogger[level](message);
    }

    close() {
        this.mainLogger.close()
    }
}

const LoggerClass = new Logger();

module.exports = LoggerClass;
