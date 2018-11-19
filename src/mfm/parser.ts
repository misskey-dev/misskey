import * as P from 'parsimmon';
import parseAcct from '../misc/acct/parse';
import { toUnicode } from 'punycode';

type Node = {
	name: string,
	children: Node[],
	props?: any;
};

function makeNode(name: string, children: Node[], props?: any): Node {
	return {
		name,
		children,
		props
	};
}

function text(none?: string) {
	return (none ? P.noneOf(none) : P.any).map(x => makeNode('text', null, { text: x }));
}

const mfm = P.createLanguage({
	root: r => P.alt(
		r.bold,
		r.mention,
		r.emoji,
		text()
	).many(),

	//#region Bold
	boldMarker: () => P.string('**'),
	bold: r =>
		r.boldMarker
		.then(P.alt(
			r.mention,
			r.emoji,
			text('**')
		).atLeast(1))
		.skip(r.boldMarker)
		.map(x => makeNode('bold', x)),
	//#endregion

	//#region Mention
	mention: r =>
		P.regexp(/^[^a-z0-9](@[a-z0-9_]+(?:@[a-z0-9\.\-]+[a-z0-9])?)/i, 1)
		.map(x => {
			const { username, host } = parseAcct(x.substr(1));
			const canonical = host != null ? `@${username}@${toUnicode(host)}` : x;
			return makeNode('mention', null, {
				canonical,
				username,
				host
			});
		}),
	//#endregion

	//#region Emoji
	emoji: r =>
		P.regexp(/^:([a-z0-9_+-]+):/i, 1)
		.map(x => makeNode('emoji', null, {
			name: x
		})),
	//#endregion
});

console.log(mfm.root.tryParse('aaa**important text**bbb'));
