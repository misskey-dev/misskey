import Chart from './core';

export const entities = Object.values(require('require-all')({
	dirname: __dirname + '/charts/schemas',
	resolve: (x: unknown) => {
		return Chart.schemaToEntity(x.name, x.schema);
	}
}));
