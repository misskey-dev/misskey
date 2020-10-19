export function extractAvgColorFromBlurhash(hash: string) {
	return typeof hash == 'string'
		? '#' + [...hash.slice(2, 6)]
				.map(x => '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%*+,-.:;=?@[]^_{|}~'.indexOf(x))
				.reduce((a, c) => a * 83 + c, 0)
				.toString(16)
				.padStart(6, '0')
		: undefined;
}
