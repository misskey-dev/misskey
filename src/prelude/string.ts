export function capitalize(s: string): string {
	return toUpperCase(s.charAt(0)) + s.slice(1).toLowerCase();
}

export function toUpperCase(s: string): string {
	return s.toUpperCase();
}
