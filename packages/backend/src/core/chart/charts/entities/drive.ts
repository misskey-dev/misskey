import Chart from '../../core.js';

import { chartsSchemas } from 'misskey-js/built/schemas/charts.js';
export const name = 'drive' as const;
export const schema = chartsSchemas[name];

export const entity = Chart.schemaToEntity(name, schema);
