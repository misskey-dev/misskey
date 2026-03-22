/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type DeviceKind = 'smartphone' | 'tablet' | 'desktop';

// 仕様: UserAgentとタッチサポートからデバイス種別を判定
// iPadOS 13+はUserAgentが「Macintosh」と報告されるため、ontouchendで判定
const ua = navigator.userAgent.toLowerCase();
const isIPad = ua.indexOf('ipad') > -1 || (ua.indexOf('macintosh') > -1 && 'ontouchend' in document);
const isTablet = isIPad || (/mobile|iphone|android/.test(ua) && window.innerWidth > 700);
const isSmartphone = !isTablet && /mobile|iphone|android/.test(ua);

export const DEFAULT_DEVICE_KIND: DeviceKind = (
	isSmartphone
		? 'smartphone'
		: isTablet
			? 'tablet'
			: 'desktop'
);

export let deviceKind: DeviceKind = DEFAULT_DEVICE_KIND;

export function updateDeviceKind(kind: DeviceKind | null) {
	deviceKind = kind ?? DEFAULT_DEVICE_KIND;
}
