// test is located in test/extract-mentions

import * as mfm from 'mfm-js';

export function extractMentions(nodes: mfm.MfmNode[]): mfm.MfmMention['props'][] {
	// TODO: 重複を削除
	const mentions = [] as mfm.MfmMention['props'][];

	mfm.inspect(nodes, (node) => {
		if (node.type === 'mention') {
			mentions.push(node.props);
		}
	});

	return mentions;
}
