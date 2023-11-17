import xxhash from 'xxhash-wasm';

export async function toHash(name: string, author: string) {
	const { h32ToString } = await xxhash();
	return h32ToString(author + name);
}
