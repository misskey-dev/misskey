const { lib: emojilib } = require('emojilib');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
import config from '../config';
import { INote } from '../models/note';
import { TextElement } from './parse';

function intersperse<T>(sep: T, xs: T[]): T[] {
	return [].concat(...xs.map(x => [sep, x])).slice(1);
}

const handlers: { [key: string]: (window: any, token: any, mentionedRemoteUsers: INote['mentionedRemoteUsers']) => void } = {
	bold({ document }, { bold }) {
		const b = document.createElement('b');
		b.textContent = bold;
		document.body.appendChild(b);
	},

	big({ document }, { big }) {
		const b = document.createElement('strong');
		b.textContent = big;
		document.body.appendChild(b);
	},

	motion({ document }, { big }) {
		const b = document.createElement('strong');
		b.textContent = big;
		document.body.appendChild(b);
	},

	code({ document }, { code }) {
		const pre = document.createElement('pre');
		const inner = document.createElement('code');
		inner.innerHTML = code;
		pre.appendChild(inner);
		document.body.appendChild(pre);
	},

	emoji({ document }, { content, emoji }) {
		const found = emojilib[emoji];
		const node = document.createTextNode(found ? found.char : content);
		document.body.appendChild(node);
	},

	hashtag({ document }, { hashtag }) {
		const a = document.createElement('a');
		a.href = `${config.url}/tags/${hashtag}`;
		a.textContent = `#${hashtag}`;
		a.setAttribute('rel', 'tag');
		document.body.appendChild(a);
	},

	'inline-code'({ document }, { code }) {
		const element = document.createElement('code');
		element.textContent = code;
		document.body.appendChild(element);
	},

	link({ document }, { url, title }) {
		const a = document.createElement('a');
		a.href = url;
		a.textContent = title;
		document.body.appendChild(a);
	},

	mention({ document }, { content, username, host }, mentionedRemoteUsers) {
		const a = document.createElement('a');
		const remoteUserInfo = mentionedRemoteUsers.find(remoteUser => remoteUser.username === username && remoteUser.host === host);
		a.href = remoteUserInfo ? remoteUserInfo.uri : `${config.url}/${content}`;
		a.textContent = content;
		document.body.appendChild(a);
	},

	quote({ document }, { quote }) {
		const blockquote = document.createElement('blockquote');
		blockquote.textContent = quote;
		document.body.appendChild(blockquote);
	},

	title({ document }, { content }) {
		const h1 = document.createElement('h1');
		h1.textContent = content;
		document.body.appendChild(h1);
	},

	text({ document }, { content }) {
		const nodes = (content as string).split('\n').map(x => document.createTextNode(x));
		for (const x of intersperse(document.createElement('br'), nodes)) {
			document.body.appendChild(x);
		}
	},

	url({ document }, { url }) {
		const a = document.createElement('a');
		a.href = url;
		a.textContent = url;
		document.body.appendChild(a);
	},

	search({ document }, { content, query }) {
		const a = document.createElement('a');
		a.href = `https://www.google.com/?#q=${query}`;
		a.textContent = content;
		document.body.appendChild(a);
	}
};

export default (tokens: TextElement[], mentionedRemoteUsers: INote['mentionedRemoteUsers'] = []) => {
	if (tokens == null) {
		return null;
	}

	const { window } = new JSDOM('');

	for (const token of tokens) {
		handlers[token.type](window, token, mentionedRemoteUsers);
	}

	return `<p>${window.document.body.innerHTML}</p>`;
};
