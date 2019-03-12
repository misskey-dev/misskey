import config from '../config';
import { toUnicode, toASCII } from 'punycode';

export function getFullApAccount(username: string, host: string) {
	return host ? `${username}@${toApHost(host)}` : `${username}@${toApHost(config.host)}`;
}

export function isSelfHost(host: string) {
	if (host == null) return true;
	return toApHost(config.host) === toApHost(host);
}

export function toDbHost(host: string) {
	if (host == null) return null;
	return toUnicode(host.toLowerCase());
}

export function toApHost(host: string) {
	if (host == null) return null;
	return toASCII(host.toLowerCase());
}
