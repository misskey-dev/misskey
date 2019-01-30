import parser from './parser';
import { MfmForest } from './types';
import { normalize } from './normalize';

export default (source: string): MfmForest => {
	if (source == null || source == '') {
		return null;
	}

	return normalize(parser.root.tryParse(source));
};

export function parsePlain(source: string): MfmForest {
	if (source == null || source == '') {
		return null;
	}

	return normalize(parser.plain.tryParse(source));
}
