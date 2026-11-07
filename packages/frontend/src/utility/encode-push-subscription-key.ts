/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * PushSubscriptionの鍵 (auth / p256dh) をサーバーに送る形式 (base64) に変換する。
 * sw/register と sw/unregister で同じ形式である必要がある。
 */
export function encodePushSubscriptionKey(buffer: ArrayBuffer | null): string {
	return btoa(String.fromCharCode(...(buffer != null ? new Uint8Array(buffer) : [])));
}
