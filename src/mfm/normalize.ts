import * as A from '../prelude/array';
import * as S from '../prelude/string';
import { MfmForest, MfmForestOf, MfmTree, MfmTreeOf, TextNode } from './prelude';
import { createTree, createLeaf } from '../prelude/tree';

function isTextTree(t: MfmTree): t is MfmTreeOf<TextNode> {
	return t.node.type == 'text';
}

function isTextForest(ts: MfmForest): ts is MfmForestOf<TextNode> {
	return isTextTree(ts[0]);
}

function isEmptyTextTree(t: MfmTree): t is MfmTree<{ text: '' }> {
	return isTextTree(t) && !!t.node.props.text.length;
}

function concatTextTrees(ts: MfmForestOf<TextNode>): MfmTreeOf<TextNode> {
	return createLeaf({ type: 'text', props: { text: S.concat(ts.map(x => x.node.props.text)) } });
}

function concatIfTextTrees(ts: MfmForest): MfmForest {
	return isTextForest(ts) ? [concatTextTrees(ts)] : ts;
}

function concatConsecutiveTextTrees(ts: MfmForest): MfmForest {
	return A.concat(A.groupOn(t => t.node.type, ts).map(concatIfTextTrees))
		.map(t => createTree(t.node, concatConsecutiveTextTrees(t.children)));
}

function removeEmptyTextNodes(ts: MfmForest): MfmForest {
	return ts
		.filter(t => !isEmptyTextTree(t))
		.map(t => createTree(t.node, removeEmptyTextNodes(t.children)));
}

export function normalize(ts: MfmForest): MfmForest {
	return removeEmptyTextNodes(concatConsecutiveTextTrees(ts));
}
