import { lib as emojilib } from 'emojilib';
import { JSDOM } from 'jsdom';

const handlers = {
	bold({ document }, { bold }) {
		const b = document.createElement('b');
		b.textContent = bold;
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
		a.href = '/search?q=#' + hashtag;
		a.textContent = hashtag;
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

	mention({ document }, { content }) {
		const a = document.createElement('a');
		a.href = '/' + content;
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
		for (const text of content.split('\n')) {
			const node = document.createTextNode(text);
			document.body.appendChild(node);

			const br = document.createElement('br');
			document.body.appendChild(br);
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

export default tokens => {
	const { window } = new JSDOM('');

	for (const token of tokens) {
		handlers[token.type](window, token);
	}

	return `<p>${window.document.body.innerHTML}</p>`;
};
