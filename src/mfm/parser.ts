import * as P from 'parsimmon';
import parseAcct from '../misc/acct/parse';
import { toUnicode } from 'punycode';

type Node = {
	name: string,
	children: Node[],
	props?: any;
};

function _makeNode(name: string, children?: Node[], props?: any): Node {
	return {
		name,
		children,
		props
	};
}

function makeNode(name: string, props?: any): Node {
	return _makeNode(name, null, props);
}

function makeNodeWithChildren(name: string, children: Node[], props?: any): Node {
	return _makeNode(name, children, props);
}

const mfm = P.createLanguage({
	root: r => P.alt(
		r.big,
		r.bold,
		r.url,
		r.mention,
		r.emoji,
		r.text
	).many(),

	text: () => P.any.map(x => makeNode('text', { text: x })),

	//#region Big
	big: r =>
		P.regexp(/^\*\*\*([\s\S]+?)\*\*\*/, 1)
		.map(x => makeNodeWithChildren('big', P.alt(
			r.mention,
			r.emoji,
			r.text
		).atLeast(1).tryParse(x))),
	//#endregion

	//#region Block code
	blockCode: r =>
		P.regexp(/^```([\s\S]+?)```/, 1)
		.map(x => makeNode('blockCode', x)),
	//#endregion

	//#region Bold
	bold: r =>
		P.regexp(/^\*\*([\s\S]+?)\*\*/, 1)
		.map(x => makeNodeWithChildren('bold', P.alt(
			r.mention,
			r.emoji,
			r.text
		).atLeast(1).tryParse(x))),
	//#endregion

	//#region Emoji
	emoji: r =>
		P.regexp(/^:([a-z0-9_+-]+):/i, 1)
		.map(x => makeNode('emoji', {
			name: x
		})),
	//#endregion

	//#region Mention
	mention: r =>
		P.regexp(/^[^a-z0-9](@[a-z0-9_]+(?:@[a-z0-9\.\-]+[a-z0-9])?)/i, 1)
		.map(x => {
			const { username, host } = parseAcct(x.substr(1));
			const canonical = host != null ? `@${username}@${toUnicode(host)}` : x;
			return makeNode('mention', {
				canonical, username, host
			});
		}),
	//#endregion

	//#region URL
	url: r =>
		P((input, i) => {
			const text = input.substr(i);
			const match = text.match(/^https?:\/\/[\w\/:%#@\$&\?!\(\)\[\]~\.,=\+\-]+/);
			if (!match) return P.makeFailure(i, 'not a url');
			let url = match[0];
			const before = input[i - 1];
			if (url.endsWith('.')) url = url.substr(0, url.lastIndexOf('.'));
			if (url.endsWith(',')) url = url.substr(0, url.lastIndexOf(','));
			if (url.endsWith(')') && before == '(') url = url.substr(0, url.lastIndexOf(')'));
			return P.makeSuccess(i + url.length, url);
		})
		.map(x => makeNode('url', { url: x })),
	//#endregion
});

console.log(mfm.root.tryParse('aaa**important text @foo bar**bbb'));
console.log(mfm.root.tryParse('```\naaa```bbb\n```'));
console.log(mfm.root.tryParse('foo https://example.com. bar'));
