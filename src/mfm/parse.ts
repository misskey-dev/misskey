import { mfmLanguage } from './language';
import { MfmForest } from './prelude';
import { normalize } from './normalize';

export function parse<T extends string | null>(source: T): T extends string ? MfmForest : null {
	return typeof source === 'string' ?
		normalize(mfmLanguage.root.tryParse(source)) :
		null as any;
}

export function parsePlain<T extends string | null>(source: T): T extends string ? MfmForest : null {
	return typeof source === 'string' ?
		normalize(mfmLanguage.plain.tryParse(source)) :
		null as any;
}
