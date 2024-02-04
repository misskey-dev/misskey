export type GridRow = {
	index: number;
	ranged: boolean;
	using: boolean;
}

export function createRow(index: number, using: boolean): GridRow {
	return {
		index,
		ranged: false,
		using: using,
	};
}

export function resetRow(row: GridRow): void {
	row.ranged = false;
	row.using = false;
}
