/**
 * Mention
 */

const regexp = /@[a-zA-Z0-9\-]+/;

module.exports = {
	test: x => new RegExp('^' + regexp.source).test(x),
	parse: text => {
		const mention = text.match(new RegExp('^' + regexp.source))[0];
		return {
			type: 'mention',
			content: mention,
			username: mention.substr(1)
		};
	}
};
