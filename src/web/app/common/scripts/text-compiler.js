const riot = require('riot');
const nyaize = require('nyaize').default;

const escape = function(text) {
	return text
		.replace(/>/g, '&gt;')
		.replace(/</g, '&lt;');
};

module.exports = function(tokens, shouldBreak, shouldEscape) {
	if (shouldBreak == null) {
		shouldBreak = true;
	}
	if (shouldEscape != null) {
		alert('do not use this option')
	}

	const me = riot.mixin('i').me;

	let text = tokens.map(function(token) {
		switch (token.type) {
			case 'text':
				return escape(token.content)
					.replace(/(\r\n|\n|\r)/g, shouldBreak ? '<br>' : ' ');
			case 'bold':
				return '<strong>' + escape(token.bold) + '</strong>';
			case 'link':
				return '<mk-url href="' + escape(token.content) + '" target="_blank"></mk-url>';
			case 'mention':
				return '<a href="' + CONFIG.url + '/' + escape(token.username) + '" target="_blank" data-user-preview="' + token.content + '">' + token.content + '</a>';
			case 'hashtag': // TODO
				return '<a>' + escape(token.content) + '</a>';
			case 'code':
				return '<pre><code>' + token.codeHtml + '</code></pre>';
		}
	}).join('');

	text = text.replace(/<br><code><pre>/g, '<code><pre>').replace(/<\/code><\/pre><br>/g, '</code></pre>');

	if (me && me.data && me.data.nya) {
		text = nyaize(text);
	}

	return text;
}
