export function safeURIDecode(str: string): string {
	try {
		return decodeURIComponent(str);
	} catch {
		return str;
	}
}
