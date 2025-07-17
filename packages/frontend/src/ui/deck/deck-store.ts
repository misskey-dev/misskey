/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { markRaw } from 'vue';
import type { Column } from '@/deck.js';
import { Pizzax } from '@/lib/pizzax.js';

type ColumnWidget = {
	name: string;
	id: string;
	data: Record<string, any>;
};

export const columnTypes = [
	'main',
	'widgets',
	'notifications',
	'tl',
	'antenna',
	'list',
	'channel',
	'mentions',
	'direct',
	'roleTimeline',
] as const;

export type ColumnType = typeof columnTypes[number];

export type Column = {
	id: string;
	type: ColumnType;
	name: string | null;
	width: number;
	widgets?: ColumnWidget[];
	active?: boolean;
	flexible?: boolean;
	antennaId?: string;
	listId?: string;
	channelId?: string;
	roleId?: string;
	excludeTypes?: typeof notificationTypes[number][];
	tl?: 'home' | 'local' | 'social' | 'global' | 'vmimi-relay' | 'vmimi-relay-social';
	withRenotes?: boolean;
	withReplies?: boolean;
	withSensitive?: boolean;
	onlyFiles?: boolean;
	withLocalOnly?: boolean;
	soundSetting: SoundStore;
};

export const deckStore = markRaw(new Storage('deck', {
	profile: {
		where: 'deviceAccount',
		default: 'default',
	},
	columns: {
		where: 'deviceAccount',
		default: [] as Column[],
	},
	layout: {
		where: 'deviceAccount',
		default: [] as Column['id'][][],
	},
}));
