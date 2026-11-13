/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { TypedBroadcastChannel as BroadcastChannel } from '@/utility/typed-broadcast-channel.js';

export const reloadChannel = new BroadcastChannel<string | null>('reload');

// BroadcastChannelを用いて、クライアントが一斉にreloadするようにします。
export function unisonReload(path?: string) {
	if (path !== undefined) {
		reloadChannel.postMessage(path);
		window.location.href = path;
	} else {
		reloadChannel.postMessage(null);
		window.location.reload();
	}
}
