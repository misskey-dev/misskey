import { mfmLanguage } from './language';
import { MfmForest } from './prelude';
import { normalize } from './normalize';

export function parse(source: string): MfmForest;
export function parse(source: null): null;
export function parse(source: string | null) {
	return typeof source === 'string' ?
		normalize(mfmLanguage.root.tryParse(source)) :
		null;
}

export function parsePlain(source: string): MfmForest;
export function parsePlain(source: null): null;
export function parsePlain(source: string | null) {
	return typeof source === 'string' ?
		normalize(mfmLanguage.plain.tryParse(source)) :
		null;
}
