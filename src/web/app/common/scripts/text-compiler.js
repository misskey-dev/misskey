const riot = require('riot');
//const emojinize = require('emojinize');
const CONFIG = require('./config');

const escape = text =>
	text
		.replace(/>/g, '&gt;')
		.replace(/</g, '&lt;');

module.exports = (tokens, shouldBreak) => {
	if (shouldBreak == null) {
		shouldBreak = true;
	}

	const me = riot.mixin('i').me;

	let text = tokens.map(token => {
		switch (token.type) {
			case 'text':
				return escape(token.content)
					.replace(/(\r\n|\n|\r)/g, shouldBreak ? '<br>' : ' ');
			case 'bold':
				return '<strong>' + escape(token.bold) + '</strong>';
			case 'url':
				return '<mk-url href="' + escape(token.content) + '" target="_blank"></mk-url>';
			case 'link':
				return '<a class="link" href="' + escape(token.url) + '" target="_blank">' + escape(token.title) + '</a>';
			case 'mention':
				return '<a href="' + CONFIG.url + '/' + escape(token.username) + '" target="_blank" data-user-preview="' + token.content + '" ' + (me && me.username == token.username ? 'data-is-me' : '') + '>' + token.content + '</a>';
			case 'hashtag': // TODO
				return '<a>' + escape(token.content) + '</a>';
			case 'code':
				return '<pre><code>' + token.html + '</code></pre>';
			case 'inline-code':
				return '<code>' + token.html + '</code>';
			case 'emoji':
				return '<i>' + token.content + '</i>';
				//return emojinize.encode(token.content)
		}
	}).join('');

	// Remove needless whitespaces
	text = text
		.replace(/ <code>/g, '<code>').replace(/<\/code> /g, '</code>')
		.replace(/<br><code><pre>/g, '<code><pre>').replace(/<\/code><\/pre><br>/g, '</code></pre>');

	return text;
};
