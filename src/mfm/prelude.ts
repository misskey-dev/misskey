import { Tree } from '../prelude/tree';
import * as T from '../prelude/tree';

type Node<T, P> = { type: T, props: P };

export type MentionNode = Node<'mention', {
	canonical: string,
	username: string,
	host: string,
	acct: string
}>;

export type HashtagNode = Node<'hashtag', {
	hashtag: string
}>;

export type EmojiNode = Node<'emoji', {
	name: string
}>;

export type MfmNode =
	MentionNode |
	HashtagNode |
	EmojiNode |
	Node<string, any>;

export type MfmTree = Tree<MfmNode>;

export type MfmForest = MfmTree[];

export function createLeaf(type: string, props: any): MfmTree {
	return T.createLeaf({ type, props });
}

export function createTree(type: string, children: MfmForest, props: any): MfmTree {
	return T.createTree({ type, props }, children);
}

export const urlRegex     = /^https?:\/\/[\w\/:%#@$&?!()\[\]~.,=+\-]+/;
export const urlRegexFull = /^https?:\/\/[\w\/:%#@$&?!()\[\]~.,=+\-]+$/;
