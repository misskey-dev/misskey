import parser, { plainParser, MfmForest, MfmTree } from './parser';
import * as A from '../prelude/array';
import * as S from '../prelude/string';
import { createTree, createLeaf } from '../prelude/tree';

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

function isEmptyTextTree(t: MfmTree): boolean {
	return t.node.type == 'text' && t.node.props.text === '';
}

function removeEmptyTextNodes(ts: MfmForest): MfmForest {
	return ts
		.filter(t => !isEmptyTextTree(t))
		.map(t => createTree(t.node, removeEmptyTextNodes(t.children)));
}

export default (source: string, plainText = false): MfmForest => {
	if (source == null || source == '') {
		return null;
	}

	const raw = plainText ? plainParser.root.tryParse(source) : parser.root.tryParse(source) as MfmForest;
	return removeEmptyTextNodes(concatConsecutiveTextTrees(raw));
};
