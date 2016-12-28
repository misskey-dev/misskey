module.exports = function(tokens, canBreak, escape) {
	if (canBreak == null) {
		canBreak = true;
	}
	if (escape == null) {
		escape = true;
	}
	return tokens.map(function(token) {
		switch (token.type) {
			case 'text':
				if (escape) {
					return token.content
						.replace(/>/g, '&gt;')
						.replace(/</g, '&lt;')
						.replace(/(\r\n|\n|\r)/g, canBreak ? '<br>' : ' ');
				} else {
					return token.content
						.replace(/(\r\n|\n|\r)/g, canBreak ? '<br>' : ' ');
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
}
