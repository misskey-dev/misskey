const jsdom = require('jsdom');
const { JSDOM } = jsdom;
import config from '../config';
import { INote } from '../models/note';
import { Node } from './parser';
import { intersperse } from '../prelude/array';

export default (tokens: Node[], mentionedRemoteUsers: INote['mentionedRemoteUsers'] = []) => {
	if (tokens == null) {
		return null;
	}

	const { window } = new JSDOM('');

	const doc = window.document;

	function dive(nodes: Node[]): any[] {
		return nodes.map(n => handlers[n.name](n));
	}

	const handlers: { [key: string]: (token: Node) => any } = {
		bold(token) {
			const el = doc.createElement('b');
			dive(token.children).forEach(child => el.appendChild(child));
			return el;
		},

		big(token) {
			const el = doc.createElement('strong');
			dive(token.children).forEach(child => el.appendChild(child));
			return el;
		},

		strike(token) {
			const el = doc.createElement('del');
			dive(token.children).forEach(child => el.appendChild(child));
			return el;
		},

		motion(token) {
			const el = doc.createElement('i');
			dive(token.children).forEach(child => el.appendChild(child));
			return el;
		},

		blockCode(token) {
			const pre = doc.createElement('pre');
			const inner = doc.createElement('code');
			inner.innerHTML = token.props.code;
			pre.appendChild(inner);
			return pre;
		},

		center(token) {
			const el = doc.createElement('div');
			dive(token.children).forEach(child => el.appendChild(child));
			return el;
		},

		emoji(token) {
			return doc.createTextNode(token.props.emoji ? token.props.emoji : `:${token.props.name}:`);
		},

		hashtag(token) {
			const a = doc.createElement('a');
			a.href = `${config.url}/tags/${token.props.hashtag}`;
			a.textContent = `#${token.props.hashtag}`;
			a.setAttribute('rel', 'tag');
			return a;
		},

		inlineCode(token) {
			const el = doc.createElement('code');
			el.textContent = token.props.code;
			return el;
		},

		math(token) {
			const el = doc.createElement('code');
			el.textContent = token.props.formula;
			return el;
		},

		link(token) {
			const a = doc.createElement('a');
			a.href = token.props.url;
			dive(token.children).forEach(child => a.appendChild(child));
			return a;
		},

		mention(token) {
			const a = doc.createElement('a');
			const { username, host, acct } = token.props;
			const remoteUserInfo = mentionedRemoteUsers.find(remoteUser => remoteUser.username === username && remoteUser.host === host);
			a.href = remoteUserInfo ? remoteUserInfo.uri : `${config.url}/${acct}`;
			a.textContent = acct;
			return a;
		},

		quote(token) {
			const el = doc.createElement('blockquote');
			dive(token.children).forEach(child => el.appendChild(child));
			return el;
		},

		title(token) {
			const el = doc.createElement('h1');
			dive(token.children).forEach(child => el.appendChild(child));
			return el;
		},

		text(token) {
			const el = doc.createElement('span');
			const nodes = (token.props.text as string).split('\n').map(x => doc.createTextNode(x));

			for (const x of intersperse('br', nodes)) {
				if (x === 'br') {
					el.appendChild(doc.createElement('br'));
				} else {
					el.appendChild(x);
				}
			}

			return el;
		},

		url(token) {
			const a = doc.createElement('a');
			a.href = token.props.url;
			a.textContent = token.props.url;
			return a;
		},

		search(token) {
			const a = doc.createElement('a');
			a.href = `https://www.google.com/?#q=${token.props.query}`;
			a.textContent = token.props.content;
			return a;
		}
	};

	dive(tokens).forEach(x => {
		doc.body.appendChild(x);
	});

	return `<p>${doc.body.innerHTML}</p>`;
};
