import { Storage } from '../../pizzax';

type ColumnWidget = {
	name: string;
	id: string;
	data: Record<string, any>;
};

type Column = {
	id: string;
	type: string;
	name: string | null;
	width: number;
	widgets?: ColumnWidget[];
};

function copy<T>(x: T): T {
	return JSON.parse(JSON.stringify(x));
}

export const deckStorage = new Storage('deck', {
	columns: {
		where: 'deviceAccount',
		default: [] as Column[]
	},
	layout: {
		where: 'deviceAccount',
		default: [] as Column['id'][][]
	},
	columnAlign: {
		where: 'deviceAccount',
		default: 'left' as 'left' | 'right' | 'center'
	},
	alwaysShowMainColumn: {
		where: 'deviceAccount',
		default: true
	},
	mainColumnPlace: {
		where: 'deviceAccount',
		default: 'left' as 'left' | 'right'
	},
});

export function addColumn(column: Column) {
	if (column.name == undefined) column.name = null;
	deckStorage.push('columns', column);
	deckStorage.push('layout', [column.id]);
}

export function removeColumn(id: Column['id']) {
	deckStorage.set('columns', deckStorage.state.columns.filter(c => c.id !== id));
	deckStorage.set('layout', deckStorage.state.layout
		.map(ids => ids.filter(_id => _id !== id))
		.filter(ids => ids.length > 0));
}

export function swapColumn(a: Column['id'], b: Column['id']) {
	const aX = deckStorage.state.layout.findIndex(ids => ids.indexOf(a) != -1);
	const aY = deckStorage.state.layout[aX].findIndex(id => id == a);
	const bX = deckStorage.state.layout.findIndex(ids => ids.indexOf(b) != -1);
	const bY = deckStorage.state.layout[bX].findIndex(id => id == b);
	const layout = copy(deckStorage.state.layout);
	layout[aX][aY] = b;
	layout[bX][bY] = a;
	deckStorage.set('layout', layout);
}

export function swapLeftColumn(id: Column['id']) {
	const layout = copy(deckStorage.state.layout);
	deckStorage.state.layout.some((ids, i) => {
		if (ids.includes(id)) {
			const left = deckStorage.state.layout[i - 1];
			if (left) {
				layout[i - 1] = deckStorage.state.layout[i];
				layout[i] = left;
				deckStorage.set('layout', layout);
			}
			return true;
		}
	});
}

export function swapRightColumn(id: Column['id']) {
	const layout = copy(deckStorage.state.layout);
	deckStorage.state.layout.some((ids, i) => {
		if (ids.includes(id)) {
			const right = deckStorage.state.layout[i + 1];
			if (right) {
				layout[i + 1] = deckStorage.state.layout[i];
				layout[i] = right;
				deckStorage.set('layout', layout);
			}
			return true;
		}
	});
}

export function swapUpColumn(id: Column['id']) {
	const layout = copy(deckStorage.state.layout);
	const idsIndex = deckStorage.state.layout.findIndex(ids => ids.includes(id));
	const ids = copy(deckStorage.state.layout[idsIndex]);
	ids.some((x, i) => {
		if (x === id) {
			const up = ids[i - 1];
			if (up) {
				ids[i - 1] = id;
				ids[i] = up;

				layout[idsIndex] = ids;
				deckStorage.set('layout', layout);
			}
			return true;
		}
	});
}

export function swapDownColumn(id: Column['id']) {
	const layout = copy(deckStorage.state.layout);
	const idsIndex = deckStorage.state.layout.findIndex(ids => ids.includes(id));
	const ids = copy(deckStorage.state.layout[idsIndex]);
	ids.some((x, i) => {
		if (x === id) {
			const down = ids[i + 1];
			if (down) {
				ids[i + 1] = id;
				ids[i] = down;

				layout[idsIndex] = ids;
				deckStorage.set('layout', layout);
			}
			return true;
		}
	});
}

export function stackLeftColumn(id: Column['id']) {
	let layout = copy(deckStorage.state.layout);
	const i = deckStorage.state.layout.findIndex(ids => ids.includes(id));
	layout = layout.map(ids => ids.filter(_id => _id !== id));
	layout[i - 1].push(id);
	layout = layout.filter(ids => ids.length > 0);
	deckStorage.set('layout', layout);
}

export function popRightColumn(id: Column['id']) {
	let layout = copy(deckStorage.state.layout);
	const i = deckStorage.state.layout.findIndex(ids => ids.includes(id));
	layout = layout.map(ids => ids.filter(_id => _id !== id));
	layout.splice(i + 1, 0, [id]);
	layout = layout.filter(ids => ids.length > 0);
	deckStorage.set('layout', layout);
}

export function addColumnWidget(id: Column['id'], widget: ColumnWidget) {
	const columns = copy(deckStorage.state.columns);
	const columnIndex = deckStorage.state.columns.findIndex(c => c.id === id);
	const column = copy(deckStorage.state.columns[columnIndex]);
	if (column == null) return;
	if (column.widgets == null) column.widgets = [];
	column.widgets.unshift(widget);
	columns[columnIndex] = column;
	deckStorage.set('columns', columns);
}

export function removeColumnWidget(id: Column['id'], widget: ColumnWidget) {
	const columns = copy(deckStorage.state.columns);
	const columnIndex = deckStorage.state.columns.findIndex(c => c.id === id);
	const column = copy(deckStorage.state.columns[columnIndex]);
	if (column == null) return;
	column.widgets = column.widgets.filter(w => w.id != widget.id);
	columns[columnIndex] = column;
	deckStorage.set('columns', columns);
}

export function setColumnWidgets(id: Column['id'], widgets: ColumnWidget[]) {
	const columns = copy(deckStorage.state.columns);
	const columnIndex = deckStorage.state.columns.findIndex(c => c.id === id);
	const column = copy(deckStorage.state.columns[columnIndex]);
	if (column == null) return;
	column.widgets = widgets;
	columns[columnIndex] = column;
	deckStorage.set('columns', columns);
}

export function renameColumn(id: Column['id'], name: Column['name']) {
	const columns = copy(deckStorage.state.columns);
	const columnIndex = deckStorage.state.columns.findIndex(c => c.id === id);
	const column = copy(deckStorage.state.columns[columnIndex]);
	if (column == null) return;
	column.name = name;
	columns[columnIndex] = column;
	deckStorage.set('columns', columns);
}

export function updateColumn(id: Column['id'], column: Partial<Column>) {
	const columns = copy(deckStorage.state.columns);
	const columnIndex = deckStorage.state.columns.findIndex(c => c.id === id);
	const currentColumn = copy(deckStorage.state.columns[columnIndex]);
	if (currentColumn == null) return;
	for (const [k, v] of Object.entries(column)) {
		currentColumn[k] = v;
	}
	columns[columnIndex] = currentColumn;
	deckStorage.set('columns', columns);
}
