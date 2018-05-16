/**
 * Search
 */

module.exports = text => {
	const match = text.match(/^(.+?) 検索(\n|$)/);
	if (!match) return null;
	return {
		type: 'search',
		content: match[0],
		query: match[1]
	};
};
