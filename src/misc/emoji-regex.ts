const twemojiRegex = require('twemoji-parser/dist/lib/regex').default;

export const emojiRegex = new RegExp(`(${twemojiRegex.source})`);
