import { Tree } from '../prelude/tree';
import * as T from '../prelude/tree';

export type Node<T, P> = { type: T, props: P };

export type TextNode = Node<'text', {
	text: string;
}>;

export type MentionNode = Node<'mention', {
	canonical: string;
	username: string;
	host: string;
	acct: string;
}>;

export type HashtagNode = Node<'hashtag', {
	hashtag: string;
}>;

export type EmojiNode = Node<'emoji', {
	name: string;
}>;

export type MfmNode<T = object> =
	MentionNode |
	HashtagNode |
	EmojiNode |
	Node<string, T>;

export type MfmTree<T = object> = Tree<MfmNode<T>>;

export type MfmTreeOf<T extends MfmNode> = Tree<T>;

export type MfmForest<T = object> = MfmTree<T>[];

export type MfmForestOf<T extends MfmNode> = Tree<T>[];

export function createLeaf<T>(type: string, props: T): MfmTree<T> {
	return T.createLeaf({ type, props });
}

export function createTree<T>(type: string, children: MfmForest<T>, props: T): MfmTree<T> {
	return T.createTree({ type, props }, children);
}

export const urlRegex = /^https?:\/\/[\w\/:%#@$&?!()\[\]~.,=+\-]+/;
