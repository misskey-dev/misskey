const crypto = require('crypto');

export default (data: ArrayBuffer) => {
  const buf = new Buffer(data);
  const hash = crypto.createHash("md5");
  hash.update(buf);
  return hash.digest("hex");
};