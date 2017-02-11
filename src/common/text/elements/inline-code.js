/**
 * Code (inline)
 */

module.exports = text => {
	const match = text.match(/^`(.+?)`/);
	if (!match) return null;
	const code = match[0];
	return {
		type: 'inline-code',
		content: code,
		code: code.substr(1, code.length - 2).trim()
	};
};
