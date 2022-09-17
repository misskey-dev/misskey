// https://github.com/facebook/jest/issues/12270#issuecomment-1194746382

const nativeModule = require('node:module');

function resolver(module, options) {
  const { basedir, defaultResolver } = options;
  try {
    return defaultResolver(module, options);
  } catch (error) {
    return nativeModule.createRequire(basedir).resolve(module);
  }
}

module.exports = resolver;
