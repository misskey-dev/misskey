/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EventEmitter } from 'eventemitter3';
import * as Misskey from 'misskey-js';

export const globalEvents = new EventEmitter<{
	themeChanging: () => void;
	themeChanged: () => void;
	clientNotification: (notification: Misskey.entities.Notification) => void;
	requestClearPageCache: () => void;
}>();
