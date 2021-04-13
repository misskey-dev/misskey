import { URL } from 'url';
import config from '@/config';
import { toASCII } from 'punycode/';

export function getFullApAccount(username: string, host: string | null) {
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

export function toPunyNullable(host: string | null | undefined): string | null {
	if (host == null) return null;
	return toASCII(host.toLowerCase());
}
