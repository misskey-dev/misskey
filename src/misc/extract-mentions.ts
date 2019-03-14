// test is located in test/extract-mentions

import { MentionNode, MfmForest } from '../mfm/prelude';
import { preorderF } from '../prelude/tree';

export default function(mfmForest: MfmForest): MentionNode['props'][] {
	// TODO: 重複を削除
	const mentionNodes = preorderF(mfmForest).filter(x => x.type === 'mention') as MentionNode[];
	return mentionNodes.map(x => x.props);
}
