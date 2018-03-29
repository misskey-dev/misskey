/**
 * URL
 */

module.exports = text => {
	const match = text.match(/^https?:\/\/[\w\/:%#@\$&\?!\(\)\[\]~\.=\+\-]+/);
	if (!match) return null;
	const url = match[0];
	return {
		type: 'url',
		content: url,
		url: url
	};
};
