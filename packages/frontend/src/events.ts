/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EventEmitter } from 'eventemitter3';
import * as Misskey from 'misskey-js';
import { onBeforeUnmount } from 'vue';

type Events = {
	themeChanging: () => void;
	themeChanged: () => void;
	clientNotification: (notification: Misskey.entities.Notification) => void;
	notePosted: (note: Misskey.entities.Note) => void;
	noteDeleted: (noteId: Misskey.entities.Note['id']) => void;
};

export const globalEvents = new EventEmitter<Events>();

export function useGlobalEvent<T extends keyof Events>(
	event: T,
	callback: Events[T],
): void {
	globalEvents.on(event, callback);
	onBeforeUnmount(() => {
		globalEvents.off(event, callback);
	});
}
