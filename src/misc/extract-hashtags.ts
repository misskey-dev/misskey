import * as mfm from 'mfm-js';
import { unique } from '@/prelude/array';

export function extractHashtags(nodes: mfm.MfmNode[]): string[] {
	const hashtags = [] as string[];

	mfm.inspect(nodes, (node) => {
		if (node.type === 'hashtag') {
			hashtags.push(node.props.hashtag);
		}
	});

	return unique(hashtags);
}
