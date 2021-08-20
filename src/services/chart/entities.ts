import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Chart from './core';

//const _filename = fileURLToPath(import.meta.url);
const _filename = __filename;
const _dirname = dirname(_filename);

export const entities = Object.values(require('require-all')({
	dirname: _dirname + '/charts/schemas',
	filter: /^.+\.[jt]s$/,
	resolve: (x: any) => {
		return Chart.schemaToEntity(x.name, x.schema);
	}
}));
