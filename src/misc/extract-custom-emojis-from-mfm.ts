import * as mfm from 'mfm-js';
import { unique } from '@/prelude/array';

export function extractCustomEmojisFromMfm(nodes: mfm.MfmNode[]): string[] {
	const emojis = [] as string[];

	mfm.inspect(nodes, (node) => {
		if (node.type === 'emojiCode' && node.props.name.length <= 100) {
			emojis.push(node.props.name);
		}
	});

	return unique(emojis);
}
