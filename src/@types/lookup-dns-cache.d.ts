declare module 'lookup-dns-cache' {
	type IPv4 = 4;

	type IPv6 = 6;

	type Family = IPv4 | IPv6 | undefined;

	interface IRunOptions {
		family?: Family;
		all?: boolean;
	}

	type RunCallback = (error: Error | null, address?: string | string[], family?: Family) => void;

	export function lookup(hostname: string, options: IRunOptions | Family, callback: RunCallback): {} | undefined;
	export function lookup(hostname: string, callback: RunCallback): {} | undefined;
}
