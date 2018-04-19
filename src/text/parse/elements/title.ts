/**
 * Title
 */

module.exports = text => {
	const match = text.match(/^【(.+?)】\n/);
	if (!match) return null;
	const title = match[0];
	return {
		type: 'title',
		content: title,
		title: title.substr(1, title.length - 3)
	};
};
