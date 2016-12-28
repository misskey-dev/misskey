/**
 * Hashtag
 */

module.exports = {
	test: (x, i) =>
		/^\s#[^\s]+/.test(x) || (i == 0 && /^#[^\s]+/.test(x))
	,
	parse: text => {
		const isHead = text[0] == '#';
		const hashtag = text.match(/^\s?#[^\s]+/)[0];
		const res = !isHead ? [{
			type: 'text',
			content: text[0]
		}] : [];
		res.push({
			type: 'hashtag',
			content: isHead ? hashtag : hashtag.substr(1),
			hashtag: isHead ? hashtag.substr(1) : hashtag.substr(2)
		});
		return res;
	}
};
