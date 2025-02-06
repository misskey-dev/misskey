import { toHiragana } from 'wanakana';

export function romajiIncludes(base: string, query: string): boolean {
	return base.includes(query) || toHiragana(base).includes(toHiragana(query));
}
