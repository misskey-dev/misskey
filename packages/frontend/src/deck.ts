/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { throttle } from 'throttle-debounce';
import { notificationTypes } from 'misskey-js';
import type { BasicTimelineType } from '@/timelines.js';
import type { SoundStore } from '@/preferences/def.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { deepClone } from '@/utility/clone.js';
import { store } from '@/store.js';

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
			key: store.state['deck.profile'],
		});
	} catch (err) {
		if (typeof err === 'object' && err != null && 'code' in err && err.code === 'NO_SUCH_KEY') {
			// 後方互換性のため
			if (store.state['deck.profile'] === 'default') {
				saveDeck();
				return;
			}

			store.set('deck.columns', []);
			store.set('deck.layout', []);
			return;
		}
		throw err;
	}

	store.set('deck.columns', deck.columns);
	store.set('deck.layout', deck.layout);
};

export async function forceSaveDeck() {
	await misskeyApi('i/registry/set', {
		scope: ['client', 'deck', 'profiles'],
		key: store.state['deck.profile'],
		value: {
			columns: store.reactiveState['deck.columns'].value,
			layout: store.reactiveState['deck.layout'].value,
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
	store.push('deck.columns', column);
	store.push('deck.layout', [column.id]);
	saveDeck();
}

export function removeColumn(id: Column['id']) {
	store.set('deck.columns', store.state['deck.columns'].filter(c => c.id !== id));
	store.set('deck.layout', store.state['deck.layout']
		.map(ids => ids.filter(_id => _id !== id))
		.filter(ids => ids.length > 0));
	saveDeck();
}

export function swapColumn(a: Column['id'], b: Column['id']) {
	const aX = store.state['deck.layout'].findIndex(ids => ids.indexOf(a) !== -1);
	const aY = store.state['deck.layout'][aX].findIndex(id => id === a);
	const bX = store.state['deck.layout'].findIndex(ids => ids.indexOf(b) !== -1);
	const bY = store.state['deck.layout'][bX].findIndex(id => id === b);
	const layout = deepClone(store.state['deck.layout']);
	layout[aX][aY] = b;
	layout[bX][bY] = a;
	store.set('deck.layout', layout);
	saveDeck();
}

export function swapLeftColumn(id: Column['id']) {
	const layout = deepClone(store.state['deck.layout']);
	store.state['deck.layout'].some((ids, i) => {
		if (ids.includes(id)) {
			const left = store.state['deck.layout'][i - 1];
			if (left) {
				layout[i - 1] = store.state['deck.layout'][i];
				layout[i] = left;
				store.set('deck.layout', layout);
			}
			return true;
		}
		return false;
	});
	saveDeck();
}

export function swapRightColumn(id: Column['id']) {
	const layout = deepClone(store.state['deck.layout']);
	store.state['deck.layout'].some((ids, i) => {
		if (ids.includes(id)) {
			const right = store.state['deck.layout'][i + 1];
			if (right) {
				layout[i + 1] = store.state['deck.layout'][i];
				layout[i] = right;
				store.set('deck.layout', layout);
			}
			return true;
		}
		return false;
	});
	saveDeck();
}

export function swapUpColumn(id: Column['id']) {
	const layout = deepClone(store.state['deck.layout']);
	const idsIndex = store.state['deck.layout'].findIndex(ids => ids.includes(id));
	const ids = deepClone(store.state['deck.layout'][idsIndex]);
	ids.some((x, i) => {
		if (x === id) {
			const up = ids[i - 1];
			if (up) {
				ids[i - 1] = id;
				ids[i] = up;

				layout[idsIndex] = ids;
				store.set('deck.layout', layout);
			}
			return true;
		}
		return false;
	});
	saveDeck();
}

export function swapDownColumn(id: Column['id']) {
	const layout = deepClone(store.state['deck.layout']);
	const idsIndex = store.state['deck.layout'].findIndex(ids => ids.includes(id));
	const ids = deepClone(store.state['deck.layout'][idsIndex]);
	ids.some((x, i) => {
		if (x === id) {
			const down = ids[i + 1];
			if (down) {
				ids[i + 1] = id;
				ids[i] = down;

				layout[idsIndex] = ids;
				store.set('deck.layout', layout);
			}
			return true;
		}
		return false;
	});
	saveDeck();
}

export function stackLeftColumn(id: Column['id']) {
	let layout = deepClone(store.state['deck.layout']);
	const i = store.state['deck.layout'].findIndex(ids => ids.includes(id));
	layout = layout.map(ids => ids.filter(_id => _id !== id));
	layout[i - 1].push(id);
	layout = layout.filter(ids => ids.length > 0);
	store.set('deck.layout', layout);
	saveDeck();
}

export function popRightColumn(id: Column['id']) {
	let layout = deepClone(store.state['deck.layout']);
	const i = store.state['deck.layout'].findIndex(ids => ids.includes(id));
	const affected = layout[i];
	layout = layout.map(ids => ids.filter(_id => _id !== id));
	layout.splice(i + 1, 0, [id]);
	layout = layout.filter(ids => ids.length > 0);
	store.set('deck.layout', layout);

	const columns = deepClone(store.state['deck.columns']);
	for (const column of columns) {
		if (affected.includes(column.id)) {
			column.active = true;
		}
	}
	store.set('deck.columns', columns);

	saveDeck();
}

export function addColumnWidget(id: Column['id'], widget: ColumnWidget) {
	const columns = deepClone(store.state['deck.columns']);
	const columnIndex = store.state['deck.columns'].findIndex(c => c.id === id);
	const column = deepClone(store.state['deck.columns'][columnIndex]);
	if (column == null) return;
	if (column.widgets == null) column.widgets = [];
	column.widgets.unshift(widget);
	columns[columnIndex] = column;
	store.set('deck.columns', columns);
	saveDeck();
}

export function removeColumnWidget(id: Column['id'], widget: ColumnWidget) {
	const columns = deepClone(store.state['deck.columns']);
	const columnIndex = store.state['deck.columns'].findIndex(c => c.id === id);
	const column = deepClone(store.state['deck.columns'][columnIndex]);
	if (column == null) return;
	if (column.widgets == null) column.widgets = [];
	column.widgets = column.widgets.filter(w => w.id !== widget.id);
	columns[columnIndex] = column;
	store.set('deck.columns', columns);
	saveDeck();
}

export function setColumnWidgets(id: Column['id'], widgets: ColumnWidget[]) {
	const columns = deepClone(store.state['deck.columns']);
	const columnIndex = store.state['deck.columns'].findIndex(c => c.id === id);
	const column = deepClone(store.state['deck.columns'][columnIndex]);
	if (column == null) return;
	column.widgets = widgets;
	columns[columnIndex] = column;
	store.set('deck.columns', columns);
	saveDeck();
}

export function updateColumnWidget(id: Column['id'], widgetId: string, widgetData: any) {
	const columns = deepClone(store.state['deck.columns']);
	const columnIndex = store.state['deck.columns'].findIndex(c => c.id === id);
	const column = deepClone(store.state['deck.columns'][columnIndex]);
	if (column == null) return;
	if (column.widgets == null) column.widgets = [];
	column.widgets = column.widgets.map(w => w.id === widgetId ? {
		...w,
		data: widgetData,
	} : w);
	columns[columnIndex] = column;
	store.set('deck.columns', columns);
	saveDeck();
}

export function updateColumn(id: Column['id'], column: Partial<Column>) {
	const columns = deepClone(store.state['deck.columns']);
	const columnIndex = store.state['deck.columns'].findIndex(c => c.id === id);
	const currentColumn = deepClone(store.state['deck.columns'][columnIndex]);
	if (currentColumn == null) return;
	for (const [k, v] of Object.entries(column)) {
		currentColumn[k] = v;
	}
	columns[columnIndex] = currentColumn;
	store.set('deck.columns', columns);
	saveDeck();
}
