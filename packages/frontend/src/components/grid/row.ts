import { DataSource } from '@/components/grid/grid.js';

export type GridRow = {
	index: number;
	ranged: boolean;
	origin: DataSource;
}

export function createRow(index: number, origin: DataSource): GridRow {
	return {
		index,
		ranged: false,
		origin: origin,
	};
}
