/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const postMessageEventTypes = [
	'misskey:shareForm:shareCompleted',
	'misskey:embed:changeHeight',
] as const;

export type PostMessageEventType = typeof postMessageEventTypes[number];

export type MiPostMessageEvent = {
	type: PostMessageEventType;
	payload?: any;
};

/**
 * 親フレームにイベントを送信
 */
export function postMessageToParentWindow(type: PostMessageEventType, payload?: any): void {
	if (_DEV_) console.log('postMessageToParentWindow', type, payload);
	window.parent.postMessage({
		type,
		payload,
	}, '*');
}
