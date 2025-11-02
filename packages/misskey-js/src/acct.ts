export type Acct = {
	username: string;
	host: string | null;
};

export function parse(_acct: string): Acct {
	let acct = _acct;
	if (acct.startsWith('@')) acct = acct.substring(1);
	const split = acct.split('@', 2);
	return { username: split[0], host: split[1] || null };
}

export function toString(acct: Acct): string {
	return acct.host == null ? acct.username : `${acct.username}@${acct.host}`;
}
