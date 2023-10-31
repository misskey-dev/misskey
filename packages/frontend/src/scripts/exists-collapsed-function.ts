import type { MfmNode } from 'mfm-js';

const COLLAPSED_FUNCTIONS = ['x2', 'x3', 'x4', 'scale'];

export function existsCollapsedFunction(nodes: MfmNode[]): boolean {
	return nodes.some(node => {
		if (node.type === 'fn' && COLLAPSED_FUNCTIONS.some(f => node.props.name === f)) return true;
		if (node.children) return existsCollapsedFunction(node.children);
		return false;
	});
}
