const riot = require('riot');

module.exports = function(tokens, shouldBreak, escape) {
	if (shouldBreak == null) {
		shouldBreak = true;
	}
	if (escape == null) {
		escape = true;
	}

	const me = riot.mixin('i').me;

	let text = tokens.map(function(token) {
		switch (token.type) {
			case 'text':
				if (escape) {
					return token.content
						.replace(/>/g, '&gt;')
						.replace(/</g, '&lt;')
						.replace(/(\r\n|\n|\r)/g, shouldBreak ? '<br>' : ' ');
				} else {
					return token.content
						.replace(/(\r\n|\n|\r)/g, shouldBreak ? '<br>' : ' ');
				}
			case 'bold':
				return '<strong>' + token.bold + '</strong>';
			case 'link':
				return '<mk-url href="' + token.content + '" target="_blank"></mk-url>';
			case 'mention':
				return '<a href="' + CONFIG.url + '/' + token.username + '" target="_blank" data-user-preview="' + token.content + '">' + token.content + '</a>';
			case 'hashtag': // TODO
				return '<a>' + token.content + '</a>';
		}
	}).join('');

	if (me && me.data && me.data.nya) {
		text = text.replace(/な/g, 'にゃ')
			.replace(/ニャ/g, 'にゃ')
			.replace(/にゃでにゃで/g, 'なでなで')
			.replace(/ニャデニャデ/g, 'ナデナデ');
	}

	return text;
}
