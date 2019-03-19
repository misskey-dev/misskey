import { mfmLanguage } from './language';
import { MfmForest } from './prelude';
import { normalize } from './normalize';

export function parse(source: string, remote = false): MfmForest {
	if (source == null || source == '') {
		return null;
	}

	return normalize(mfmLanguage.root.tryParse(source), remote);
}

export function parsePlain(source: string, remote = false): MfmForest {
	if (source == null || source == '') {
		return null;
	}

	return normalize(mfmLanguage.plain.tryParse(source), remote);
}
