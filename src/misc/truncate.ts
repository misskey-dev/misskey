export function truncate(input: string, size: number): string;
export function truncate(input: string | undefined, size: number): string | undefined;
export function truncate(input: string | undefined, size: number): string | undefined {
	if (!input || input.length <= size) {
		return input;
	} else {
		return input.substring(0, size);
	}
}
