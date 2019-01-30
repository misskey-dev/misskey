import parser, { plainParser } from './parser';
import { MfmForest } from './types';
import { normalize } from './normalize';

export default (source: string, plainText = false): MfmForest => {
	if (source == null || source == '') {
		return null;
	}

	const raw = plainText ? plainParser.root.tryParse(source) : parser.root.tryParse(source) as MfmForest;
	return normalize(raw);
};
