import { concat, sum } from './array';

export type Tree<T> = {
	node: T,
	children: Forest<T>;
};

export type Forest<T> = Tree<T>[];

export function createLeaf<T>(node: T): Tree<T> {
	return { node, children: [] };
}

export function createTree<T>(node: T, children: Forest<T>): Tree<T> {
	return { node, children };
}

export function hasChildren<T>(t: Tree<T>): boolean {
	return t.children.length !== 0;
}

export function preorder<T>(t: Tree<T>): T[] {
	return [t.node, ...preorderF(t.children)];
}

export function preorderF<T>(ts: Forest<T>): T[] {
	return concat(ts.map(preorder));
}

export function countNodes<T>(t: Tree<T>): number {
	return preorder(t).length;
}

export function countNodesF<T>(ts: Forest<T>): number {
	return sum(ts.map(countNodes));
}
