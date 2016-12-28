/**
 * Bold
 */

const regexp = /\*\*(.+?)\*\*/;

module.exports = {
	test: x => new RegExp('^' + regexp.source).test(x),
	parse: text => {
		const bold = text.match(new RegExp('^' + regexp.source))[0];
		return {
			type: 'bold',
			content: bold,
			bold: bold.substr(2, bold.length - 4)
		};
	}
};
