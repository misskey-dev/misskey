/**
 * Misskey Text Analyzer
 */

const elements = [
	require('./elements/bold'),
	require('./elements/url'),
	require('./elements/mention'),
	require('./elements/hashtag'),
	require('./elements/code')
];

function analyze(source) {

	if (source == '') {
		return null;
	}

	const tokens = [];

	function push(token) {
		if (token != null) {
			tokens.push(token);
			source = source.substr(token.content.length);
		}
	}

	let i = 0;

	// パース
	while (source != '') {
		const parsed = elements.some(el => {
			let tokens = el(source, i);
			if (tokens) {
				if (!Array.isArray(tokens)) {
					tokens = [tokens];
				}
				tokens.forEach(push);
				return true;
			}
		});

		if (!parsed) {
			push({
				type: 'text',
				content: source[0]
			});
		}

		i++;
	}

	// テキストを纏める
	tokens[0] = [tokens[0]];
	return tokens.reduce((a, b) => {
		if (a[a.length - 1].type == 'text' && b.type == 'text') {
			const tail = a.pop();
			return a.concat({
				type: 'text',
				content: tail.content + b.content
			});
		} else {
			return a.concat(b);
		}
	});
}

module.exports = analyze;
