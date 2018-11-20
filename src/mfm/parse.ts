import parser, { Node } from './parser';
import * as A from '../prelude/array';
import * as S from '../prelude/string';

export default (source: string): Node[] => {
	if (source == null || source == '') {
		return null;
	}

	let nodes: Node[] = parser.root.tryParse(source);

	const combineText = (es: Node[]): Node =>
		({ name: 'text', props: { text: S.concat(es.map(e => e.props.text)) } });

	const concatText = (nodes: Node[]): Node[] =>
		A.concat(A.groupOn(x => x.name, nodes).map(es =>
			es[0].name === 'text' ? [combineText(es)] : es
		));

	const concatTextRecursive = (es: Node[]): void =>
		es.filter(x => x.children).forEach(x => {
			x.children = concatText(x.children);
			concatTextRecursive(x.children);
		});

	nodes = concatText(nodes);
	concatTextRecursive(nodes);

	function getBeforeTextNode(node: Node): Node {
		if (node == null) return null;
		if (node.name == 'text') return node;
		if (node.children) return getBeforeTextNode(node.children[node.children.length - 1]);
		return null;
	}

	function getAfterTextNode(node: Node): Node {
		if (node == null) return null;
		if (node.name == 'text') return node;
		if (node.children) return getBeforeTextNode(node.children[0]);
		return null;
	}

	function isBlockNode(node: Node): boolean {
		return ['blockCode', 'quote', 'title'].includes(node.name);
	}

	/**
	 * ブロック要素の前後にある改行を削除します(ブロック要素自体が改行の役割も果たすため、余計に改行されてしまうため)
	 * @param nodes
	 */
	const removeNeedlessLineBreaks = (nodes: Node[]) => {
		nodes.forEach((node, i) => {
			if (node.children) removeNeedlessLineBreaks(node.children);
			if (isBlockNode(node)) {
				const before = getBeforeTextNode(nodes[i - 1]);
				const after = getAfterTextNode(nodes[i + 1]);
				if (before && before.props.text.endsWith('\n')) {
					before.props.text = before.props.text.substring(0, before.props.text.length - 1);
				}
				if (after && after.props.text.startsWith('\n')) {
					after.props.text = after.props.text.substring(1);
				}
			}
		});
	};

	const removeEmptyTextNodes = (nodes: Node[]) => {
		nodes.forEach(n => {
			if (n.children) {
				n.children = removeEmptyTextNodes(n.children);
			}
		});
		return nodes.filter(n => !(n.name == 'text' && n.props.text == ''));
	};

	removeNeedlessLineBreaks(nodes);

	nodes = removeEmptyTextNodes(nodes);

	return nodes;
};
