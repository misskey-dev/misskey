// test is located in test/extract-mentions

import * as mfm from 'mfm-js';

export default function(nodes: mfm.MfmNode[]): mfm.MfmMention['props'][] {
	// TODO: 重複を削除
	const mentionNodes = [] as mfm.MfmMention[];

	function scan(nodes: mfm.MfmNode[]) {
		for (const node of nodes) {
			if (node.type === 'mention') mentionNodes.push(node);
			else if (node.children) scan(node.children);
		}
	}

	scan(nodes);

	return mentionNodes.map(x => x.props);
}
