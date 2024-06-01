/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const postMessageEventTypes = [
	'misskey:shareForm:shareCompleted',
	'misskey:embed:ready',
	'misskey:embed:changeHeight',
] as const;

export type PostMessageEventType = typeof postMessageEventTypes[number];

export type MiPostMessageEvent = {
	type: PostMessageEventType;
	iframeId?: string;
	payload?: any;
};

let defaultIframeId: string | null = null;

export function setIframeId(id: string): void {
	if (_DEV_) console.log('setIframeId', id);
	defaultIframeId = id;
}

/**
 * 親フレームにイベントを送信
 */
export function postMessageToParentWindow(type: PostMessageEventType, payload?: any, iframeId: string | null = null): void {
	let _iframeId = iframeId;
	if (_iframeId == null) {
		_iframeId = defaultIframeId;
	}
	if (_DEV_) console.log('postMessageToParentWindow', type, _iframeId, payload);
	window.parent.postMessage({
		type,
		iframeId: _iframeId,
		payload,
	}, '*');
}
