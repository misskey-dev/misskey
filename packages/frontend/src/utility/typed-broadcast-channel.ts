/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// lib.dom の BroadcastChannel は型引数を持たず、グローバル宣言のマージでも型引数を追加できないため、
// メッセージの型を付けた BroadcastChannel を別名で提供する
export interface TypedBroadcastChannel<T> extends BroadcastChannel {
	onmessage: ((this: TypedBroadcastChannel<T>, ev: MessageEvent<T>) => any) | null;
	postMessage(message: T): void;
	addEventListener(type: 'message', listener: (this: TypedBroadcastChannel<T>, ev: MessageEvent<T>) => any, options?: boolean | AddEventListenerOptions): void;
	addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
	removeEventListener(type: 'message', listener: (this: TypedBroadcastChannel<T>, ev: MessageEvent<T>) => any, options?: boolean | EventListenerOptions): void;
	removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

export const TypedBroadcastChannel = BroadcastChannel as {
	prototype: TypedBroadcastChannel<unknown>;
	new <T>(name: string): TypedBroadcastChannel<T>;
};
