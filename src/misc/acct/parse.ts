import Acct from './type';

export default (acct: string): Acct => {
	if (acct.startsWith('@')) acct = acct.substr(1);
	const split = acct.split('@', 2);
	return { username: split[0], host: split[1] || null };
};
