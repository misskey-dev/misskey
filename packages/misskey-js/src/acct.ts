export type Acct = {
	username: string;
	host: string | null;
};

export function correctAcct(acct: Acct, localHostname?: string): Acct {
	const result = { ...acct };
	if (!acct.host) {
		result.host = null;
	} else if (localHostname && acct.host === localHostname) {
		result.host = null;
	}
	return result;
}

export function parse(acct: string): Acct {
	let acctWithNoPrefix = acct;

	if (acct.startsWith('@')) {
		acctWithNoPrefix = acct.substring(1);
	} else if (acct.startsWith('acct:')) {
		acctWithNoPrefix = acct.substring(5);
	}

	const split = acctWithNoPrefix.split('@', 2);

	return { username: split[0], host: split[1] || null };
}

export class UrlIsNotAcctLikeError extends Error {
	constructor() {
		super('This url is not acct like.');
	}
}

export function parseUrl(str: string): Acct {
	const url = new URL(str);

	if (url.hash.length > 0) throw new UrlIsNotAcctLikeError();
	if (url.search.length > 0) throw new UrlIsNotAcctLikeError();

	const splited = url.pathname.split('/');
	let path = splited.pop();
	if (path === '') path = splited.pop(); // If the last segment is empty due to a trailing '/', use the previous segment

	if (!path) throw new UrlIsNotAcctLikeError();
	if (!path.startsWith('@')) throw new UrlIsNotAcctLikeError();
	if (path.length <= 1) throw new UrlIsNotAcctLikeError();

	const split = path.split('@', 3); // ['', 'username', 'other.example.com']

	return { username: split[1], host: split[2] || url.hostname };
}

/**
 * Parses a string and returns an Acct object.
 * @param acct String to parse
 *   The string should be in one of the following formats:
 *   * At-mark style: `@username@example.com`
 *   * Starts with `acct:`: `acct:username@example.com`
 *   * URL style: `https://example.com/@username`, `https://self.example.com/@username@other.example.com`
 * @param localHostname If provided and matches the host found in acct, the returned `host` will be set to `null`.
 * @returns Acct object
 */
export function parseAcctOrUrl(acct: string, localHostname?: string): Acct {
	if (acct.startsWith('https://') || acct.startsWith('http://')) {
		// url style
		return correctAcct(parseUrl(acct), localHostname);
	}

	// acct style
	return correctAcct(parse(acct), localHostname);
}

export function toString(acct: Acct): string {
	return acct.host == null ? acct.username : `${acct.username}@${acct.host}`;
}
