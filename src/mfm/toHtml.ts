import { JSDOM } from 'jsdom';
import config from '../config';
import { intersperse } from '../prelude/array';
import { MfmForest, MfmTree } from './prelude';
import { IMentionedRemoteUsers } from '../models/entities/note';

export function toHtml(tokens: MfmForest | null, mentionedRemoteUsers: IMentionedRemoteUsers = []) {
	if (tokens == null) {
		return null;
	}

	const { window } = new JSDOM('');

	const doc = window.document;

	function appendChildren(children: MfmForest, targetElement: HTMLElement): void {
		for (const child of children.map(t => handlers[t.node.type](t))) targetElement.appendChild(child);
	}

	const makeBasicHandler = (tagName: string) => (token: MfmTree) => {
		const el = doc.createElement(tagName);
		appendChildren(token.children, el);
		return el;
	};

	const handlers: { [key: string]: (token: MfmTree) => Node } = {
		bold: makeBasicHandler('b'),

		big: makeBasicHandler('strong'),

		small: makeBasicHandler('small'),

		strike: makeBasicHandler('del'),

		italic: makeBasicHandler('i'),

		motion: makeBasicHandler('i'),

		spin: makeBasicHandler('i'),

		jump: makeBasicHandler('i'),

		flip: makeBasicHandler('i'),

		blockCode(token) {
			const pre = doc.createElement('pre');
			const inner = doc.createElement('code');
			inner.innerHTML = token.node.props.code;
			pre.appendChild(inner);
			return pre;
		},

		center: makeBasicHandler('div'),

		emoji(token) {
			return doc.createTextNode(token.node.props.emoji ? token.node.props.emoji : `:${token.node.props.name}:`);
		},

		hashtag(token) {
			const a = doc.createElement('a');
			a.href = `${config.url}/tags/${token.node.props.hashtag}`;
			a.textContent = `#${token.node.props.hashtag}`;
			a.setAttribute('rel', 'tag');
			return a;
		},

		inlineCode: makeBasicHandler('code'),

		mathInline: makeBasicHandler('code'),

		mathBlock: makeBasicHandler('code'),

		link(token) {
			const a = doc.createElement('a');
			a.href = token.node.props.url;
			appendChildren(token.children, a);
			return a;
		},

		mention(token) {
			const a = doc.createElement('a');
			const { username, host, acct } = token.node.props;
			switch (host) {
				case 'github.com':
					a.href = `https://github.com/${username}`;
					break;
				case 'twitter.com':
					a.href = `https://twitter.com/${username}`;
					break;
				default:
					const remoteUserInfo = mentionedRemoteUsers.find(remoteUser => remoteUser.username === username && remoteUser.host === host);
					a.href = remoteUserInfo ? remoteUserInfo.uri : `${config.url}/${acct}`;
					a.className = 'mention';
					break;
			}
			a.textContent = acct;
			return a;
		},

		quote: makeBasicHandler('blockquote'),

		title: makeBasicHandler('h1'),

		text(token) {
			const el = doc.createElement('span');
			const nodes = (token.node.props.text as string).split(/\r\n|\r|\n/).map(x => doc.createTextNode(x) as Node);

			for (const x of intersperse<Node | 'br'>('br', nodes)) {
				el.appendChild(x === 'br' ? doc.createElement('br') : x);
			}

			return el;
		},

		url(token) {
			const a = doc.createElement('a');
			a.href = token.node.props.url;
			a.textContent = token.node.props.url;
			return a;
		},

		search(token) {
			const a = doc.createElement('a');
			a.href = `https://www.google.com/?#q=${token.node.props.query}`;
			a.textContent = token.node.props.content;
			return a;
		}
	};

	appendChildren(tokens, doc.body);

	return `<p>${doc.body.innerHTML}</p>`;
}
