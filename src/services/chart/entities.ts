import Chart from './core';

export const entities = Object.values(require('require-all')({
	dirname: __dirname + '/charts/schemas',
	filter: /^.+\.[jt]s$/,
	resolve: (x: any) => {
		return Chart.schemaToEntity(x.name, x.schema);
	}
}));
