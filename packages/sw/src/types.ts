/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as Misskey from 'misskey-js';

export type SwMessageOrderType = 'post' | 'push';

export type SwMessage = {
	type: 'order';
	order: SwMessageOrderType;
	loginId?: string;
	url: string;
	[x: string]: unknown;
};

// Defined also @/core/PushNotificationService.ts#L12
type PushNotificationDataSourceMap = {
	notification: Misskey.entities.Notification;
	unreadAntennaNote: {
		antenna: { id: string; name: string };
		note: Misskey.entities.Note;
	};
	readAllNotifications: undefined;
};

export type PushNotificationData<K extends keyof PushNotificationDataSourceMap> = {
	type: K;
	body: PushNotificationDataSourceMap[K];
	userId: string;
	dateTime: number;
};

export type PushNotificationDataMap = {
	[K in keyof PushNotificationDataSourceMap]: PushNotificationData<K>;
};

export type BadgeNames =
	| 'null'
	| 'antenna'
	| 'arrow-back-up'
	| 'at'
	| 'bell'
	| 'chart-arrows'
	| 'circle-check'
	| 'medal'
	| 'messages'
	| 'plus'
	| 'quote'
	| 'repeat'
	| 'user-plus'
	| 'users';
