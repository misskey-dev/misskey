import { stringify } from 'querystring';

export function concat(xs: string[]): string {
	return xs.join('');
}

export function capitalize(s: string): string {
	return toUpperCase(s.charAt(0)) + toLowerCase(s.slice(1));
}

export function toUpperCase(s: string): string {
	return s.toUpperCase();
}

export function toLowerCase(s: string): string {
	return s.toLowerCase();
}

export function urlQuery(obj: {}): string {
	return stringify(Object.entries(obj)
		.filter(([, v]) => v !== undefined)
		.reduce((a, [k, v]) => (a[k] = typeof v === 'string' ? v : v.toString(), a), {} as Record<string, string>));
}
