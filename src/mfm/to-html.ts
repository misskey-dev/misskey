import { JSDOM } from 'jsdom';
import config from '../config';
import { intersperse } from '../prelude/array';
import { MfmForest, MfmTree } from './prelude';
import { IMentionedRemoteUsers } from '../models/entities/note';
import { wellKnownServices } from '../well-known-services';

export function toHtml(tokens: MfmForest | null, mentionedRemoteUsers: IMentionedRemoteUsers = []) {
	if (tokens == null) {
		return null;
	}

	const { window } = new JSDOM('');

	const doc = window.document;

	function appendChildren(children: MfmForest, targetElement: any): void {
		for (const child of children.map(t => handlers[t.node.type](t))) targetElement.appendChild(child);
	}

	const handlers: { [key: string]: (token: MfmTree) => any } = {
		bold(token) {
			const el = doc.createElement('b');
			appendChildren(token.children, el);
			return el;
		},

		big(token) {
			const el = doc.createElement('strong');
			appendChildren(token.children, el);
			return el;
		},

		small(token) {
			const el = doc.createElement('small');
			appendChildren(token.children, el);
			return el;
		},

		strike(token) {
			const el = doc.createElement('del');
			appendChildren(token.children, el);
			return el;
		},

		italic(token) {
			const el = doc.createElement('i');
			appendChildren(token.children, el);
			return el;
		},

		motion(token) {
			const el = doc.createElement('i');
			appendChildren(token.children, el);
			return el;
		},

		spin(token) {
			const el = doc.createElement('i');
			appendChildren(token.children, el);
			return el;
		},

		jump(token) {
			const el = doc.createElement('i');
			appendChildren(token.children, el);
			return el;
		},

		flip(token) {
			const el = doc.createElement('span');
			appendChildren(token.children, el);
			return el;
		},

		blockCode(token) {
			const pre = doc.createElement('pre');
			const inner = doc.createElement('code');
			inner.innerHTML = token.node.props.code;
			pre.appendChild(inner);
			return pre;
		},

		center(token) {
			const el = doc.createElement('div');
			appendChildren(token.children, el);
			return el;
		},

		emoji(token) {
			return doc.createTextNode(token.node.props.emoji ? token.node.props.emoji : `\u200B:${token.node.props.name}:\u200B`);
		},

		hashtag(token) {
			const a = doc.createElement('a');
			a.href = `${config.url}/tags/${token.node.props.hashtag}`;
			a.textContent = `#${token.node.props.hashtag}`;
			a.setAttribute('rel', 'tag');
			return a;
		},

		inlineCode(token) {
			const el = doc.createElement('code');
			el.textContent = token.node.props.code;
			return el;
		},

		mathInline(token) {
			const el = doc.createElement('code');
			el.textContent = token.node.props.formula;
			return el;
		},

		mathBlock(token) {
			const el = doc.createElement('code');
			el.textContent = token.node.props.formula;
			return el;
		},

		link(token) {
			const a = doc.createElement('a');
			a.href = token.node.props.url;
			appendChildren(token.children, a);
			return a;
		},

		mention(token) {
			const a = doc.createElement('a');
			const { username, host, acct } = token.node.props;
			const wellKnown = wellKnownServices.find(x => x[0] === host);
			if (wellKnown) {
				a.href = wellKnown[1](username);
			} else {
				const remoteUserInfo = mentionedRemoteUsers.find(remoteUser => remoteUser.username === username && remoteUser.host === host);
				a.href = remoteUserInfo ? (remoteUserInfo.url ? remoteUserInfo.url : remoteUserInfo.uri) : `${config.url}/${acct}`;
				a.className = 'u-url mention';
			}
			a.textContent = acct;
			return a;
		},

		quote(token) {
			const el = doc.createElement('blockquote');
			appendChildren(token.children, el);
			return el;
		},

		title(token) {
			const el = doc.createElement('h1');
			appendChildren(token.children, el);
			return el;
		},

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
