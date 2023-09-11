/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import * as os from '@/os';
import { globalEvents } from '@/events';
import { claimAchievement } from '@/scripts/achievements';

let smashCount = 0;
let smashTimer: number | null = null;

/**
 * テスト通知を送信
 * 
 * - `client` … 通知ポップアップのみを表示
 * - `server` … サーバー側から通知を送信
 * 
 * @param type 通知タイプを指定
 */
export function testNotification(type: 'client' | 'server'): void {
	const notification: Misskey.entities.Notification = {
		id: Math.random().toString(),
		createdAt: new Date().toUTCString(),
		isRead: false,
		type: 'test',
	};

	switch (type) {
		case 'server':
			os.api('notifications/test-notification');
			break;
		case 'client':
			globalEvents.emit('clientNotification', notification);
			break;
	}

	// セルフ通知破壊 実績関連
	smashCount++;
	if (smashCount >= 7) {
		claimAchievement('smashTestNotificationButton');
		smashCount = 0;
	}
	if (smashTimer) {
		clearTimeout(smashTimer);
	}
	smashTimer = window.setTimeout(() => {
		smashCount = 0;
	}, 300);
}
