import * as mfm from 'mfm-js';
import { unique } from '@/misc/prelude/array.js';

export function extractHashtags(nodes: mfm.MfmNode[]): string[] {
	const hashtagNodes = mfm.extract(nodes, (node) => node.type === 'hashtag');
	const hashtags = unique(hashtagNodes.map(x => x.props.hashtag));

	return hashtags;
}
