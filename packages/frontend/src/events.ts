/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EventEmitter } from 'eventemitter3';
import * as Misskey from 'misskey-js';

export const globalEvents = new EventEmitter<{
	themeChanged: () => void;
	clientNotification: (notification: Misskey.entities.Notification) => void;
	requestClearPageCache: () => void;
}>();
