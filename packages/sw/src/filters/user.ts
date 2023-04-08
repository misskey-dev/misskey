import * as misskey from 'misskey-js';
import * as Acct from 'misskey-js/built/acct';

export const acct = (user: misskey.Acct) => {
	return Acct.toString(user);
};
