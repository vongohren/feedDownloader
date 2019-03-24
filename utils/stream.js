const Readable = require('stream').Readable;

const initiateStreamOnObject = (feed) => {
  const s = new Readable();
  s._read = () => {}; // redundant? see https://stackoverflow.com/questions/12755997/how-to-create-streams-from-string-in-node-js
  s.push(feed);
  s.push(null);
  return s
}

module.exports = {
  initiateStreamOnObject,
}
