/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { i18n } from '@/i18n.js';

export const SETTING_INDEX = [{
	id: '727cc9e8-ad67-474a-9241-b5a9a6475e47',
	locationLabel: [i18n.ts.profile, i18n.ts._profile.name],
	icon: 'ti ti-user',
	keywords: ['name'],
	path: '/settings/profile',
}, {
	id: '1a06c7f9-e85e-46cb-bf5f-b3efa8e71b93',
	locationLabel: [i18n.ts.profile, i18n.ts._profile.description],
	icon: 'ti ti-user',
	keywords: ['bio'],
	path: '/settings/profile',
}, {
	id: 'acbfe8cb-c3c9-4d90-8c62-713025814b2e',
	locationLabel: [i18n.ts.privacy, i18n.ts.makeFollowManuallyApprove],
	icon: 'ti ti-lock-open',
	keywords: ['follow', 'lock', i18n.ts.lockedAccountInfo],
	path: '/settings/privacy',
}];
