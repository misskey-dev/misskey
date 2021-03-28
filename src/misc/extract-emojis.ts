import * as mfm from 'mfm-js';
import { unique } from '@/prelude/array';

export default function(nodes: mfm.MfmNode[]): string[] {
	const emojiNodes = [] as mfm.MfmEmoji[];

	function scan(nodes: mfm.MfmNode[]) {
		for (const node of nodes) {
			if (node.type === 'emoji') emojiNodes.push(node);
			else if (node.children) scan(node.children);
		}
	}

	scan(nodes);

	const emojis = emojiNodes.filter(x => x.props.name && x.props.name.length <= 100).map(x => x.props.name!);
	return unique(emojis);
}
