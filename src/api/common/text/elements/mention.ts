/**
 * Mention
 */

module.exports = text => {
	const match = text.match(/^@[a-zA-Z0-9\-]+/);
	if (!match) return null;
	const mention = match[0];
	return {
		type: 'mention',
		content: mention,
		username: mention.substr(1)
	};
};
