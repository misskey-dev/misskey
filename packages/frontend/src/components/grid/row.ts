export type GridRow = {
	index: number;
	ranged: boolean;
}

export function createRow(index: number): GridRow {
	return {
		index,
		ranged: false,
	};
}
