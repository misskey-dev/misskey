export function char2fileName(char: string): string {
	let codes = Array.from(char)
		.map(x => x.codePointAt(0)?.toString(16))
		.filter(<T>(x: T | undefined): x is T => x !== undefined);
	if (!codes.includes('200d')) codes = codes.filter(x => x !== 'fe0f');
	codes = codes.filter(x => x.length !== 0);
	return codes.join('-');
}
