import * as mfm from 'mfm-js';
import { unique } from '@/prelude/array.js';

export function extractCustomEmojisFromMfm(nodes: mfm.MfmNode[]): string[] {
	const emojiNodes = mfm.extract(nodes, (node) => {
		return (node.type === 'emojiCode' && node.props.name.length <= 100);
	});

	// @ts-ignore
	return unique(emojiNodes.map(x => x.props.name));
}
