import * as requireAll from 'require-all';
import { Schema } from '../../misc/schema';
import Chart from './core';

export interface ISchemaModule {
	name: string;
	schema: Schema;
}

export const entities = Object.values(requireAll({
	dirname: __dirname + '/charts/schemas',
	resolve({ name, schema }: ISchemaModule) {
		return Chart.schemaToEntity(name, schema);
	}
}));
