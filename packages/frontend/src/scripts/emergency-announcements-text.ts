/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import { i18n } from '@/i18n.js';

export function emergencyTitle(announcement: Misskey.entities.Announcement) {
	if (announcement.display !== 'emergency') return announcement.title;
	if (!announcement.title.startsWith('__PROVIDER_')) return announcement.title;
	const provider = announcement.title.slice('__PROVIDER_'.length).slice(0, -2);
	switch (provider) {
		case 'p2pquake':
			return i18n.ts._emergencyAnnouncement._providerLabel.p2pquake;
		default:
			return i18n.ts._emergencyAnnouncement._providerLabel.none;
	}
}

export function emergencyBody(announcement: Misskey.entities.Announcement) {
	if (announcement.display !== 'emergency') return '';
	if (announcement.text) return announcement.text;
	const provider = announcement.title.slice('__PROVIDER_'.length).slice(0, -2);
	switch (provider) {
		case 'p2pquake':
			return i18n.ts._emergencyAnnouncement._providerBody.p2pquake;
		default:
			return i18n.ts._emergencyAnnouncement._providerBody.none;
	}
}
