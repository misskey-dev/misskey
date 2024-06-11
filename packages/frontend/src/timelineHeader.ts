/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { reactive } from 'vue';
import { i18n } from '@/i18n.js';
import { userListsCache } from '@/cache.js';
import { isLocalTimelineAvailable, isGlobalTimelineAvailable } from '@/store.js';
const lists = await userListsCache.fetch();
export const timelineHeaderItemDef = reactive({
	home: {
		title: i18n.ts._timelines.home,
		icon: 'ti ti-home',
		iconOnly: false,
	},
	...(isLocalTimelineAvailable ? {
		local: {
			title: i18n.ts._timelines.local,
			icon: 'ti ti-planet',
			iconOnly: true,
		},
		social: {
			title: i18n.ts._timelines.social,
			icon: 'ti ti-universe',
			iconOnly: true,
		} } : {}),
	...(isGlobalTimelineAvailable ? { global: {
		title: i18n.ts._timelines.global,
		icon: 'ti ti-whirl',
		iconOnly: true,
	} } : {}),
	lists: {
		icon: 'ti ti-list',
		title: i18n.ts.lists,
		iconOnly: true,
	},
	antennas: {
		icon: 'ti ti-antenna',
		title: i18n.ts.antennas,
		iconOnly: true,
	},
	channels: {
		icon: 'ti ti-device-tv',
		title: i18n.ts.channel,
		iconOnly: true,
	},
	...lists.reduce((acc, l) => {
		acc['list:' + l.id] = {
			title: i18n.ts.lists + ':' + l.name,
			icon: 'ti ti-star',
			iconOnly: true,
		};
		return acc;
	}, {}),
});
