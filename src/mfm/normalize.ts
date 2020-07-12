import * as A from '../prelude/array';
import * as S from '../prelude/string';
import { MfmForest, MfmTree } from './prelude';
import { createTree, createLeaf } from '../prelude/tree';

function isEmptyTextTree(t: MfmTree): boolean {
	return t.node.type === 'text' && t.node.props.text === '';
}

function concatTextTrees(ts: MfmForest): MfmTree {
	return createLeaf({ type: 'text', props: { text: S.concat(ts.map(x => x.node.props.text)) } });
}

function concatIfTextTrees(ts: MfmForest): MfmForest {
	return ts[0].node.type === 'text' ? [concatTextTrees(ts)] : ts;
}

function concatConsecutiveTextTrees(ts: MfmForest): MfmForest {
	const us = A.concat(A.groupOn(t => t.node.type, ts).map(concatIfTextTrees));
	return us.map(t => createTree(t.node, concatConsecutiveTextTrees(t.children)));
}

function removeEmptyTextNodes(ts: MfmForest): MfmForest {
	return ts
		.filter(t => !isEmptyTextTree(t))
		.map(t => createTree(t.node, removeEmptyTextNodes(t.children)));
}

export function normalize(ts: MfmForest): MfmForest {
	return removeEmptyTextNodes(concatConsecutiveTextTrees(ts));
}
