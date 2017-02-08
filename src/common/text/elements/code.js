/**
 * Code
 */

const regexp = /```([\s\S]+?)```/;

module.exports = {
	test: x => new RegExp('^' + regexp.source).test(x),
	parse: text => {
		const code = text.match(new RegExp('^' + regexp.source))[0];
		return {
			type: 'code',
			content: code,
			code: code.substr(3, code.length - 6).trim()
		};
	}
};
