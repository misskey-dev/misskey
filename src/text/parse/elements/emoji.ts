/**
 * Emoji
 */

module.exports = text => {
	const match = text.match(/^:[a-zA-Z0-9+-_]+:/);
	if (!match) return null;
	const emoji = match[0];
	return {
		type: 'emoji',
		content: emoji,
		emoji: emoji.substr(1, emoji.length - 2)
	};
};
