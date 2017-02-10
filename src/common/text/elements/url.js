/**
 * URL
 */

module.exports = text => {
	const match = text.match(/^https?:\/\/[\w\/:%#@\$&\?!\(\)\[\]~\.=\+\-]+/); 
	if (!match) return null;
	const link = match[0];
	return {
		type: 'link',
		content: link
	};
};
