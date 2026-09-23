/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import { markRaw } from 'vue';
import { $i } from '@/i.js';
import { wsOrigin } from '@@/js/config.js';

// heart beat interval in ms
const HEART_BEAT_INTERVAL = 1000 * 60;

// バックグラウンドになってからこの時間以上経過していたら、復帰時にWSを張り直す
const RECONNECT_AFTER_HIDDEN = 1000 * 20;

let stream: Misskey.IStream | null = null;
let timeoutHeartBeat: number | null = null;
let lastHeartbeatCall = 0;
let hiddenAt: number | null = null;

export function useStream(): Misskey.IStream {
	if (stream) return stream;

	stream = markRaw(new Misskey.Stream(wsOrigin, $i ? {
		token: $i.token,
	} : null));

	if (timeoutHeartBeat) window.clearTimeout(timeoutHeartBeat);
	timeoutHeartBeat = window.setTimeout(heartbeat, HEART_BEAT_INTERVAL);

	// 既に隠れている状態で呼ばれた場合
	if (window.document.visibilityState !== 'visible') hiddenAt = Date.now();

	window.document.addEventListener('visibilitychange', () => {
		if (!stream) return;

		if (window.document.visibilityState !== 'visible') {
			hiddenAt = Date.now();
			return;
		}

		const hiddenFor = hiddenAt == null ? 0 : Date.now() - hiddenAt;
		hiddenAt = null;
		if (hiddenFor >= RECONNECT_AFTER_HIDDEN) {
			stream.reconnect();
			return;
		}

		// send heartbeat right now when last send time is over HEART_BEAT_INTERVAL
		if (Date.now() - lastHeartbeatCall < HEART_BEAT_INTERVAL) return;
		heartbeat();
	});

	return stream;
}

function heartbeat(): void {
	if (stream != null && window.document.visibilityState === 'visible') {
		stream.heartbeat();
	}
	lastHeartbeatCall = Date.now();
	if (timeoutHeartBeat) window.clearTimeout(timeoutHeartBeat);
	timeoutHeartBeat = window.setTimeout(heartbeat, HEART_BEAT_INTERVAL);
}
