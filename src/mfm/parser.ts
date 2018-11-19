import * as P from 'parsimmon';

const mfm = P.createLanguage({
	//#region
	boldMarker: () => P.string('**'),
	bold: r =>
		r.boldMarker
		.then(P.alt(
			r.mention,
			r.emoji
		))
		.skip(r.boldMarker),
	//#endregion


});
