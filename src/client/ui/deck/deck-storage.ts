import { HotDeviceStorage } from './storage';

export const reactiveDeckStorage = new HotDeviceStorage('deck', true, {
	columns: [],
	layout: [],
	columnAlign: 'left',
	alwaysShowMainColumn: true,
	mainColumnPlace: 'left',
}, {
	addColumn: (state, column) => {
		if (column.name == undefined) column.name = null;
		state.columns.push(column);
		state.layout.push([column.id]);
	},

	removeColumn: (state, id) => {
		state.columns = state.columns.filter(c => c.id != id);
		state.layout = state.layout.map(ids => erase(id, ids));
		state.layout = state.layout.filter(ids => ids.length > 0);
	},

	swapColumn: (state, x) => {
		const a = x.a;
		const b = x.b;
		const aX = state.layout.findIndex(ids => ids.indexOf(a) != -1);
		const aY = state.layout[aX].findIndex(id => id == a);
		const bX = state.layout.findIndex(ids => ids.indexOf(b) != -1);
		const bY = state.layout[bX].findIndex(id => id == b);
		state.layout[aX][aY] = b;
		state.layout[bX][bY] = a;
	},

	swapLeftColumn: (state, id) => {
		state.layout.some((ids, i) => {
			if (ids.indexOf(id) != -1) {
				const left = state.layout[i - 1];
				if (left) {
					// https://vuejs.org/v2/guide/list.html#Caveats
					//state.layout[i - 1] = state.layout[i];
					//state.layout[i] = left;
					state.layout.splice(i - 1, 1, state.layout[i]);
					state.layout.splice(i, 1, left);
				}
				return true;
			}
		});
	},

	swapRightColumn: (state, id) => {
		state.layout.some((ids, i) => {
			if (ids.indexOf(id) != -1) {
				const right = state.layout[i + 1];
				if (right) {
					// https://vuejs.org/v2/guide/list.html#Caveats
					//state.layout[i + 1] = state.layout[i];
					//state.layout[i] = right;
					state.layout.splice(i + 1, 1, state.layout[i]);
					state.layout.splice(i, 1, right);
				}
				return true;
			}
		});
	},

	swapUpColumn: (state, id) => {
		const ids = state.layout.find(ids => ids.indexOf(id) != -1);
		ids.some((x, i) => {
			if (x == id) {
				const up = ids[i - 1];
				if (up) {
					// https://vuejs.org/v2/guide/list.html#Caveats
					//ids[i - 1] = id;
					//ids[i] = up;
					ids.splice(i - 1, 1, id);
					ids.splice(i, 1, up);
				}
				return true;
			}
		});
	},

	swapDownColumn: (state, id) => {
		const ids = state.layout.find(ids => ids.indexOf(id) != -1);
		ids.some((x, i) => {
			if (x == id) {
				const down = ids[i + 1];
				if (down) {
					// https://vuejs.org/v2/guide/list.html#Caveats
					//ids[i + 1] = id;
					//ids[i] = down;
					ids.splice(i + 1, 1, id);
					ids.splice(i, 1, down);
				}
				return true;
			}
		});
	},

	stackLeftColumn: (state, id) => {
		const i = state.layout.findIndex(ids => ids.indexOf(id) != -1);
		state.layout = state.layout.map(ids => erase(id, ids));
		const left = state.layout[i - 1];
		if (left) state.layout[i - 1].push(id);
		state.layout = state.layout.filter(ids => ids.length > 0);
	},

	popRightColumn: (state, id) => {
		const i = state.layout.findIndex(ids => ids.indexOf(id) != -1);
		state.layout = state.layout.map(ids => erase(id, ids));
		state.layout.splice(i + 1, 0, [id]);
		state.layout = state.layout.filter(ids => ids.length > 0);
	},

	addColumnWidget: (state, x) => {
		const column = state.columns.find(c => c.id == x.id);
		if (column == null) return;
		if (column.widgets == null) column.widgets = [];
		column.widgets.unshift(x.widget);
	},

	removeColumnWidget: (state, x) => {
		const column = state.columns.find(c => c.id == x.id);
		if (column == null) return;
		column.widgets = column.widgets.filter(w => w.id != x.widget.id);
	},

	setColumnWidgets: (state, x) => {
		const column = state.columns.find(c => c.id == x.id);
		if (column == null) return;
		column.widgets = x.widgets;
	},

	renameColumn: (state, x) => {
		const column = state.columns.find(c => c.id == x.id);
		if (column == null) return;
		column.name = x.name;
	},

	updateColumn: (state, x) => {
		const column = state.columns.findIndex(c => c.id == x.id);
		if (column > -1) return;
		state.columns[column] = x;
	},
});
