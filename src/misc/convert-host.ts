import config from '../config';
import { toUnicode, toASCII } from 'punycode';
import { URL } from 'url';

export function getFullApAccount(username: string, host: string) {
	return host ? `${username}@${toApHost(host)}` : `${username}@${toApHost(config.host)}`;
}

export function isSelfHost(host: string) {
	if (host == null) return true;
	return toApHost(config.host) === toApHost(host);
}

export function extractDbHost(uri: string) {
	const url = new URL(uri);
	return toDbHost(url.hostname);
}

export function toDbHost(host: string) {
	if (host == null) return null;
	return toUnicode(host.toLowerCase());
}

export function toApHost(host: string) {
	if (host == null) return null;
	return toASCII(host.toLowerCase());
}
