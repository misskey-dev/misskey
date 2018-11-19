import * as P from 'parsimmon';
import parseAcct from '../misc/acct/parse';
import { toUnicode } from 'punycode';

const mfm = P.createLanguage({
	root: r => P.alt(
		r.bold,
		r.mention,
		r.emoji,
		P.any
	).many(),

	//#region Bold
	boldMarker: () => P.string('**'),
	bold: r =>
		r.boldMarker
		.then(P.alt(
			r.mention,
			r.emoji,
			P.any
		).atLeast(1))
		.skip(r.boldMarker)
		.map(x => {
			return {
				type: 'bold',
				children: x
			};
		}),
	//#endregion

	//#region Mention
	mention: r =>
		P.regexp(/^[^a-z0-9](@[a-z0-9_]+(?:@[a-z0-9\.\-]+[a-z0-9])?)/i, 1)
		.map(x => {
			const { username, host } = parseAcct(x.substr(1));
			const canonical = host != null ? `@${username}@${toUnicode(host)}` : x;
			return {
				type: 'mention',
				canonical,
				username,
				host
			};
		}),
	//#endregion

	//#region Emoji
	emoji: r =>
		P.regexp(/^:([a-z0-9_+-]+):/i, 1)
		.map(x => {
			return {
				type: 'emoji',
				name: x
			};
		}),
	//#endregion
});

console.log(mfm.root.tryParse('aaa**important text**bbb'));
