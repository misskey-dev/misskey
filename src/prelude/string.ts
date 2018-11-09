export function concat(xs: string[]): string {
	return xs.reduce((a, b) => a + b, "");
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
