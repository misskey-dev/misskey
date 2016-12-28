/**
 * URL
 */

const regexp = /https?:\/\/[\w\/:%#@\$&\?!\(\)\[\]~\.=\+\-]+/;

module.exports = {
	test: x => new RegExp('^' + regexp.source).test(x),
	parse: text => {
		const link = text.match(new RegExp('^' + regexp.source))[0];
		return {
			type: 'link',
			content: link
		};
	}
};
