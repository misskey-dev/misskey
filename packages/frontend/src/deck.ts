/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { throttle } from 'throttle-debounce';
import { notificationTypes } from 'misskey-js';
import type { BasicTimelineType } from '@/timelines.js';
import type { SoundStore } from '@/preferences/def.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { deepClone } from '@/scripts/clone.js';
import { defaultStore } from '@/store.js';

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
	tl?: BasicTimelineType;
	withRenotes?: boolean;
	withReplies?: boolean;
	withSensitive?: boolean;
	onlyFiles?: boolean;
	soundSetting?: SoundStore;
};

export const loadDeck = async () => {
	let deck;

	try {
		deck = await misskeyApi('i/registry/get', {
			scope: ['client', 'deck', 'profiles'],
			key: defaultStore.state['deck.profile'],
		});
	} catch (err) {
		if (typeof err === 'object' && err != null && 'code' in err && err.code === 'NO_SUCH_KEY') {
			// 後方互換性のため
			if (defaultStore.state['deck.profile'] === 'default') {
				saveDeck();
				return;
			}

			defaultStore.set('deck.columns', []);
			defaultStore.set('deck.layout', []);
			return;
		}
		throw err;
	}

	defaultStore.set('deck.columns', deck.columns);
	defaultStore.set('deck.layout', deck.layout);
};

export async function forceSaveDeck() {
	await misskeyApi('i/registry/set', {
		scope: ['client', 'deck', 'profiles'],
		key: defaultStore.state['deck.profile'],
		value: {
			columns: defaultStore.reactiveState['deck.columns'].value,
			layout: defaultStore.reactiveState['deck.layout'].value,
		},
	});
}

// TODO: deckがloadされていない状態でsaveすると意図せず上書きが発生するので対策する
export const saveDeck = throttle(1000, () => {
	forceSaveDeck();
});

export async function getProfiles(): Promise<string[]> {
	return await misskeyApi('i/registry/keys', {
		scope: ['client', 'deck', 'profiles'],
	});
}

export async function deleteProfile(key: string): Promise<void> {
	return await misskeyApi('i/registry/remove', {
		scope: ['client', 'deck', 'profiles'],
		key: key,
	});
}

export function addColumn(column: Column) {
	if (column.name === undefined) column.name = null;
	defaultStore.push('deck.columns', column);
	defaultStore.push('deck.layout', [column.id]);
	saveDeck();
}

export function removeColumn(id: Column['id']) {
	defaultStore.set('deck.columns', defaultStore.state['deck.columns'].filter(c => c.id !== id));
	defaultStore.set('deck.layout', defaultStore.state['deck.layout']
		.map(ids => ids.filter(_id => _id !== id))
		.filter(ids => ids.length > 0));
	saveDeck();
}

export function swapColumn(a: Column['id'], b: Column['id']) {
	const aX = defaultStore.state['deck.layout'].findIndex(ids => ids.indexOf(a) !== -1);
	const aY = defaultStore.state['deck.layout'][aX].findIndex(id => id === a);
	const bX = defaultStore.state['deck.layout'].findIndex(ids => ids.indexOf(b) !== -1);
	const bY = defaultStore.state['deck.layout'][bX].findIndex(id => id === b);
	const layout = deepClone(defaultStore.state['deck.layout']);
	layout[aX][aY] = b;
	layout[bX][bY] = a;
	defaultStore.set('deck.layout', layout);
	saveDeck();
}

export function swapLeftColumn(id: Column['id']) {
	const layout = deepClone(defaultStore.state['deck.layout']);
	defaultStore.state['deck.layout'].some((ids, i) => {
		if (ids.includes(id)) {
			const left = defaultStore.state['deck.layout'][i - 1];
			if (left) {
				layout[i - 1] = defaultStore.state['deck.layout'][i];
				layout[i] = left;
				defaultStore.set('deck.layout', layout);
			}
			return true;
		}
		return false;
	});
	saveDeck();
}

export function swapRightColumn(id: Column['id']) {
	const layout = deepClone(defaultStore.state['deck.layout']);
	defaultStore.state['deck.layout'].some((ids, i) => {
		if (ids.includes(id)) {
			const right = defaultStore.state['deck.layout'][i + 1];
			if (right) {
				layout[i + 1] = defaultStore.state['deck.layout'][i];
				layout[i] = right;
				defaultStore.set('deck.layout', layout);
			}
			return true;
		}
		return false;
	});
	saveDeck();
}

export function swapUpColumn(id: Column['id']) {
	const layout = deepClone(defaultStore.state['deck.layout']);
	const idsIndex = defaultStore.state['deck.layout'].findIndex(ids => ids.includes(id));
	const ids = deepClone(defaultStore.state['deck.layout'][idsIndex]);
	ids.some((x, i) => {
		if (x === id) {
			const up = ids[i - 1];
			if (up) {
				ids[i - 1] = id;
				ids[i] = up;

				layout[idsIndex] = ids;
				defaultStore.set('deck.layout', layout);
			}
			return true;
		}
		return false;
	});
	saveDeck();
}

export function swapDownColumn(id: Column['id']) {
	const layout = deepClone(defaultStore.state['deck.layout']);
	const idsIndex = defaultStore.state['deck.layout'].findIndex(ids => ids.includes(id));
	const ids = deepClone(defaultStore.state['deck.layout'][idsIndex]);
	ids.some((x, i) => {
		if (x === id) {
			const down = ids[i + 1];
			if (down) {
				ids[i + 1] = id;
				ids[i] = down;

				layout[idsIndex] = ids;
				defaultStore.set('deck.layout', layout);
			}
			return true;
		}
		return false;
	});
	saveDeck();
}

export function stackLeftColumn(id: Column['id']) {
	let layout = deepClone(defaultStore.state['deck.layout']);
	const i = defaultStore.state['deck.layout'].findIndex(ids => ids.includes(id));
	layout = layout.map(ids => ids.filter(_id => _id !== id));
	layout[i - 1].push(id);
	layout = layout.filter(ids => ids.length > 0);
	defaultStore.set('deck.layout', layout);
	saveDeck();
}

export function popRightColumn(id: Column['id']) {
	let layout = deepClone(defaultStore.state['deck.layout']);
	const i = defaultStore.state['deck.layout'].findIndex(ids => ids.includes(id));
	const affected = layout[i];
	layout = layout.map(ids => ids.filter(_id => _id !== id));
	layout.splice(i + 1, 0, [id]);
	layout = layout.filter(ids => ids.length > 0);
	defaultStore.set('deck.layout', layout);

	const columns = deepClone(defaultStore.state['deck.columns']);
	for (const column of columns) {
		if (affected.includes(column.id)) {
			column.active = true;
		}
	}
	defaultStore.set('deck.columns', columns);

	saveDeck();
}

export function addColumnWidget(id: Column['id'], widget: ColumnWidget) {
	const columns = deepClone(defaultStore.state['deck.columns']);
	const columnIndex = defaultStore.state['deck.columns'].findIndex(c => c.id === id);
	const column = deepClone(defaultStore.state['deck.columns'][columnIndex]);
	if (column == null) return;
	if (column.widgets == null) column.widgets = [];
	column.widgets.unshift(widget);
	columns[columnIndex] = column;
	defaultStore.set('deck.columns', columns);
	saveDeck();
}

export function removeColumnWidget(id: Column['id'], widget: ColumnWidget) {
	const columns = deepClone(defaultStore.state['deck.columns']);
	const columnIndex = defaultStore.state['deck.columns'].findIndex(c => c.id === id);
	const column = deepClone(defaultStore.state['deck.columns'][columnIndex]);
	if (column == null) return;
	if (column.widgets == null) column.widgets = [];
	column.widgets = column.widgets.filter(w => w.id !== widget.id);
	columns[columnIndex] = column;
	defaultStore.set('deck.columns', columns);
	saveDeck();
}

export function setColumnWidgets(id: Column['id'], widgets: ColumnWidget[]) {
	const columns = deepClone(defaultStore.state['deck.columns']);
	const columnIndex = defaultStore.state['deck.columns'].findIndex(c => c.id === id);
	const column = deepClone(defaultStore.state['deck.columns'][columnIndex]);
	if (column == null) return;
	column.widgets = widgets;
	columns[columnIndex] = column;
	defaultStore.set('deck.columns', columns);
	saveDeck();
}

export function updateColumnWidget(id: Column['id'], widgetId: string, widgetData: any) {
	const columns = deepClone(defaultStore.state['deck.columns']);
	const columnIndex = defaultStore.state['deck.columns'].findIndex(c => c.id === id);
	const column = deepClone(defaultStore.state['deck.columns'][columnIndex]);
	if (column == null) return;
	if (column.widgets == null) column.widgets = [];
	column.widgets = column.widgets.map(w => w.id === widgetId ? {
		...w,
		data: widgetData,
	} : w);
	columns[columnIndex] = column;
	defaultStore.set('deck.columns', columns);
	saveDeck();
}

export function updateColumn(id: Column['id'], column: Partial<Column>) {
	const columns = deepClone(defaultStore.state['deck.columns']);
	const columnIndex = defaultStore.state['deck.columns'].findIndex(c => c.id === id);
	const currentColumn = deepClone(defaultStore.state['deck.columns'][columnIndex]);
	if (currentColumn == null) return;
	for (const [k, v] of Object.entries(column)) {
		currentColumn[k] = v;
	}
	columns[columnIndex] = currentColumn;
	defaultStore.set('deck.columns', columns);
	saveDeck();
}
