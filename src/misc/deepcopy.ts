export function deepcopy(x: any) {
	return JSON.parse(JSON.stringify(x));
}
