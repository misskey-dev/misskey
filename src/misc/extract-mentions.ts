// test is located in test/extract-mentions

import * as mfm from 'mfm-js';
import { preorderF } from '../prelude/tree';

// TODO

export default function(mfmForest: mfm.MfmNode[]): mfm.MfmMention['props'][] {
	// TODO: 重複を削除
	const mentionNodes = preorderF(mfmForest).filter(x => x.type === 'mention') as mfm.MfmMention[];
	return mentionNodes.map(x => x.props);
}
