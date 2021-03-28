import * as mfm from 'mfm-js';
import { unique } from '@/prelude/array';

export default function(nodes: mfm.MfmNode[]): string[] {
	const hashtagNodes = [] as mfm.MfmHashtag[];

	function scan(nodes: mfm.MfmNode[]) {
		for (const node of nodes) {
			if (node.type === 'hashtag') hashtagNodes.push(node);
			if (node.children) scan(node.children);
		}
	}

	scan(nodes);

	const hashtags = hashtagNodes.map(x => x.props.hashtag);
	return unique(hashtags);
}
