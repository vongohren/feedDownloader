const fs = require('fs')
const RP = require('request-promise-native');
const { initiateStreamOnObject } = require('../utils/stream');

const fetchFile =  async (post) => {
  console.log(post.link);
  var options = {
    uri: post.link,
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36',
      'accept': 'application/x-bittorrent'
    },
    encoding: null
  };
  try {
    const res = await RP(options);
    return res;
  } catch (error) {
    defaultErrorHandler(error);
  }
}

const defineFileWriteStream = (post) => {
  const filePath = process.env.RSS_FILE_PATH || './'
  const slashRegex = /\//gi;
  const spaceRegex = /\s/gi
  let title = post.title.replace(slashRegex,"-")
  title = title.replace(spaceRegex,"")
  const writeStream = fs.createWriteStream(`${filePath}${title}.torrent`)
  return writeStream
}

const storeFile = (file, post) => {
  const stream = initiateStreamOnObject(file);
  const writeStream = defineFileWriteStream(post);
  const writeStreamPromise = new Promise((resolve)=> {
    writeStream.on('finish', () => {
      resolve({success: true, path: writeStream.path})
    })
  })
  stream.pipe(writeStream)
  return writeStreamPromise;
}

module.exports = {
  fetchFile,
  storeFile,
}
