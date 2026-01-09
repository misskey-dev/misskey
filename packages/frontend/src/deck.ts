/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { notificationTypes } from 'misskey-js';
import { ref } from 'vue';
import { i18n } from './i18n.js';
import type { BasicTimelineType } from '@/timelines.js';
import type { SoundStore } from '@/preferences/def.js';
import type { MenuItem } from '@/types/menu.js';
import { genId } from '@/utility/id.js';
import { deepClone } from '@/utility/clone.js';
import { prefer } from '@/preferences.js';
import * as os from '@/os.js';

export type DeckProfile = {
	name: string;
	id: string;
	columns: Column[];
	layout: Column['id'][][];
};

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
	'chat',
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
	tl?: BasicTimelineType;
	withRenotes?: boolean;
	withReplies?: boolean;
	withSensitive?: boolean;
	onlyFiles?: boolean;
	soundSetting?: SoundStore;
	// The cache for the name of the antenna, channel, list, or role
	timelineNameCache?: string;
};

const _currentProfile = prefer.s['deck.profiles'].find(p => p.name === prefer.s['deck.profile']);
const __currentProfile = _currentProfile ? deepClone(_currentProfile) : null;
export const columns = ref(__currentProfile ? __currentProfile.columns : []);
export const layout = ref(__currentProfile ? __currentProfile.layout : []);

if (prefer.s['deck.profile'] == null) {
	addProfile('Main');
}

export function forceSaveCurrentDeckProfile() {
	const currentProfile = prefer.s['deck.profiles'].find(p => p.name === prefer.s['deck.profile']);
	if (currentProfile == null) return;

	const newProfile = deepClone(currentProfile);
	newProfile.columns = columns.value;
	newProfile.layout = layout.value;

	const newProfiles = prefer.s['deck.profiles'].filter(p => p.name !== prefer.s['deck.profile']);
	newProfiles.push(newProfile);
	prefer.commit('deck.profiles', newProfiles);
}

export const saveCurrentDeckProfile = () => {
	forceSaveCurrentDeckProfile();
};

function switchProfile(profile: DeckProfile) {
	prefer.commit('deck.profile', profile.name);
	const currentProfile = deepClone(profile);
	columns.value = currentProfile.columns;
	layout.value = currentProfile.layout;
	forceSaveCurrentDeckProfile();
}

function addProfile(name: string) {
	if (name.trim() === '') return;
	if (prefer.s['deck.profiles'].find(p => p.name === name)) return;

	const newProfile: DeckProfile = {
		id: genId(),
		name,
		columns: [],
		layout: [],
	};
	prefer.commit('deck.profiles', [...prefer.s['deck.profiles'], newProfile]);
	switchProfile(newProfile);
}

function createFirstProfile() {
	addProfile('Main');
}

export function deleteProfile(name: string): void {
	const newProfiles = prefer.s['deck.profiles'].filter(p => p.name !== name);
	prefer.commit('deck.profiles', newProfiles);

	if (prefer.s['deck.profiles'].length === 0) {
		createFirstProfile();
	} else {
		switchProfile(prefer.s['deck.profiles'][0]);
	}
}

export function addColumn(column: Column) {
	if (column.name === undefined) column.name = null;
	columns.value.push(column);
	layout.value.push([column.id]);
	saveCurrentDeckProfile();
}

export function removeColumn(id: Column['id']) {
	columns.value = columns.value.filter(c => c.id !== id);
	layout.value = layout.value.map(ids => ids.filter(_id => _id !== id)).filter(ids => ids.length > 0);
	saveCurrentDeckProfile();
}

export function swapColumn(a: Column['id'], b: Column['id']) {
	const aX = layout.value.findIndex(ids => ids.indexOf(a) !== -1);
	const aY = layout.value[aX].findIndex(id => id === a);
	const bX = layout.value.findIndex(ids => ids.indexOf(b) !== -1);
	const bY = layout.value[bX].findIndex(id => id === b);
	const newLayout = deepClone(layout.value);
	newLayout[aX][aY] = b;
	newLayout[bX][bY] = a;
	layout.value = newLayout;
	saveCurrentDeckProfile();
}

export function swapLeftColumn(id: Column['id']) {
	const newLayout = deepClone(layout.value);
	layout.value.some((ids, i) => {
		if (ids.includes(id)) {
			const left = layout.value[i - 1];
			if (left) {
				newLayout[i - 1] = layout.value[i];
				newLayout[i] = left;
				layout.value = newLayout;
			}
			return true;
		}
		return false;
	});
	saveCurrentDeckProfile();
}

export function swapRightColumn(id: Column['id']) {
	const newLayout = deepClone(layout.value);
	layout.value.some((ids, i) => {
		if (ids.includes(id)) {
			const right = layout.value[i + 1];
			if (right) {
				newLayout[i + 1] = layout.value[i];
				newLayout[i] = right;
				layout.value = newLayout;
			}
			return true;
		}
		return false;
	});
	saveCurrentDeckProfile();
}

export function swapUpColumn(id: Column['id']) {
	const newLayout = deepClone(layout.value);
	const idsIndex = layout.value.findIndex(ids => ids.includes(id));
	const ids = deepClone(layout.value[idsIndex]);
	ids.some((x, i) => {
		if (x === id) {
			const up = ids[i - 1];
			if (up) {
				ids[i - 1] = id;
				ids[i] = up;

				newLayout[idsIndex] = ids;
				layout.value = newLayout;
			}
			return true;
		}
		return false;
	});
	saveCurrentDeckProfile();
}

export function swapDownColumn(id: Column['id']) {
	const newLayout = deepClone(layout.value);
	const idsIndex = layout.value.findIndex(ids => ids.includes(id));
	const ids = deepClone(layout.value[idsIndex]);
	ids.some((x, i) => {
		if (x === id) {
			const down = ids[i + 1];
			if (down) {
				ids[i + 1] = id;
				ids[i] = down;

				newLayout[idsIndex] = ids;
				layout.value = newLayout;
			}
			return true;
		}
		return false;
	});
	saveCurrentDeckProfile();
}

export function stackLeftColumn(id: Column['id']) {
	let newLayout = deepClone(layout.value);
	const i = layout.value.findIndex(ids => ids.includes(id));
	newLayout = newLayout.map(ids => ids.filter(_id => _id !== id));
	newLayout[i - 1].push(id);
	newLayout = newLayout.filter(ids => ids.length > 0);
	layout.value = newLayout;
	saveCurrentDeckProfile();
}

export function popRightColumn(id: Column['id']) {
	let newLayout = deepClone(layout.value);
	const i = layout.value.findIndex(ids => ids.includes(id));
	const affected = newLayout[i];
	newLayout = newLayout.map(ids => ids.filter(_id => _id !== id));
	newLayout.splice(i + 1, 0, [id]);
	newLayout = newLayout.filter(ids => ids.length > 0);
	layout.value = newLayout;

	const newColumns = deepClone(columns.value);
	for (const column of newColumns) {
		if (affected.includes(column.id)) {
			column.active = true;
		}
	}
	columns.value = newColumns;

	saveCurrentDeckProfile();
}

export function addColumnWidget(id: Column['id'], widget: ColumnWidget) {
	const newColumns = deepClone(columns.value);
	const columnIndex = columns.value.findIndex(c => c.id === id);
	const column = deepClone(columns.value[columnIndex]);
	if (column == null) return;
	if (column.widgets == null) column.widgets = [];
	column.widgets.unshift(widget);
	newColumns[columnIndex] = column;
	columns.value = newColumns;
	saveCurrentDeckProfile();
}

export function removeColumnWidget(id: Column['id'], widget: ColumnWidget) {
	const newColumns = deepClone(columns.value);
	const columnIndex = columns.value.findIndex(c => c.id === id);
	const column = deepClone(columns.value[columnIndex]);
	if (column == null) return;
	if (column.widgets == null) column.widgets = [];
	column.widgets = column.widgets.filter(w => w.id !== widget.id);
	newColumns[columnIndex] = column;
	columns.value = newColumns;
	saveCurrentDeckProfile();
}

export function setColumnWidgets(id: Column['id'], widgets: ColumnWidget[]) {
	const newColumns = deepClone(columns.value);
	const columnIndex = columns.value.findIndex(c => c.id === id);
	const column = deepClone(columns.value[columnIndex]);
	if (column == null) return;
	column.widgets = widgets;
	newColumns[columnIndex] = column;
	columns.value = newColumns;
	saveCurrentDeckProfile();
}

export function updateColumnWidget(id: Column['id'], widgetId: string, widgetData: any) {
	const newColumns = deepClone(columns.value);
	const columnIndex = columns.value.findIndex(c => c.id === id);
	const column = deepClone(columns.value[columnIndex]);
	if (column == null) return;
	if (column.widgets == null) column.widgets = [];
	column.widgets = column.widgets.map(w => w.id === widgetId ? {
		...w,
		data: widgetData,
	} : w);
	newColumns[columnIndex] = column;
	columns.value = newColumns;
	saveCurrentDeckProfile();
}

export function updateColumn(id: Column['id'], column: Partial<Column>) {
	const newColumns = deepClone(columns.value);
	const columnIndex = columns.value.findIndex(c => c.id === id);
	const currentColumn = deepClone(columns.value[columnIndex]);
	if (currentColumn == null) return;
	for (const [k, v] of Object.entries(column)) {
		(currentColumn[k as keyof typeof column] as any) = v;
	}
	newColumns[columnIndex] = currentColumn;
	columns.value = newColumns;
	saveCurrentDeckProfile();
}

export function switchProfileMenu(ev: PointerEvent) {
	const items: MenuItem[] = prefer.s['deck.profile'] ? [{
		text: prefer.s['deck.profile'],
		active: true,
		action: () => {},
	}] : [];

	const profiles = prefer.s['deck.profiles'];

	items.push(...(profiles.filter(p => p.name !== prefer.s['deck.profile']).map(p => ({
		text: p.name,
		action: () => {
			switchProfile(p);
		},
	}))), { type: 'divider' as const }, {
		text: i18n.ts._deck.newProfile,
		icon: 'ti ti-plus',
		action: async () => {
			const { canceled, result: name } = await os.inputText({
				title: i18n.ts._deck.profile,
				minLength: 1,
			});

			if (canceled || name == null || name.trim() === '') return;

			addProfile(name);
		},
	});

	os.popupMenu(items, ev.currentTarget ?? ev.target);
}
