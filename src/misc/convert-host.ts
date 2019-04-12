import config from '../config';
import { toASCII } from 'punycode';
import { URL } from 'url';

export function getFullApAccount(username: string, host: string) {
	return host ? `${username}@${toPuny(host)}` : `${username}@${toPuny(config.host)}`;
}

export function isSelfHost(host: string) {
	if (host == null) return true;
	return toPuny(config.host) === toPuny(host);
}

export function extractDbHost(uri: string) {
	const url = new URL(uri);
	return toPuny(url.hostname);
}

export function toPuny(host: string) {
	return toASCII(host.toLowerCase());
}
