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
export function parse(acct: string, localHostname?: string): Acct {
	//#region url style
	if (acct.startsWith('https://') || acct.startsWith('http://')) {
		const url = new URL(acct);
		const path = url.pathname.split('/').find((p) => p.startsWith('@') && p.length >= 2);
		if (!path) throw new Error('This url is not acct like.');

		const split = path.split('@', 3); // ['', 'username', 'other.example.com']

		return correctAcct({ username: split[1], host: split[2] || url.hostname }, localHostname);
	}
	//#endregion

	//#region at-mark and acct: style
	let acctWithNoPrefix = acct;
	if (acct.startsWith('@')) {
		acctWithNoPrefix = acct.substring(1);
	} else if (acct.startsWith('acct:')) {
		acctWithNoPrefix = acct.substring(5);
	}
	const split = acctWithNoPrefix.split('@', 2);

	return correctAcct({ username: split[0], host: split[1] || null }, localHostname);
	//#endregion
}

export function toString(acct: Acct): string {
	return acct.host == null ? acct.username : `${acct.username}@${acct.host}`;
}
