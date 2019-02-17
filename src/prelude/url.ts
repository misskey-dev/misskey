import { stringify } from 'querystring';

export function query(obj: {}): string {
	return stringify(Object.entries(obj)
		.filter(([, v]) => Array.isArray(v) ? v.length : v !== undefined)
		.reduce((a, [k, v]) => (a[k] = v, a), {} as Record<string, any>));
}
