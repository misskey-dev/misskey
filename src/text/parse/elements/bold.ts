/**
 * Bold
 */

module.exports = text => {
	const match = text.match(/^\*\*(.+?)\*\*/);
	if (!match) return null;
	const bold = match[0];
	return {
		type: 'bold',
		content: bold,
		bold: bold.substr(2, bold.length - 4)
	};
};
