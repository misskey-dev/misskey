import autobind from 'autobind-decorator';
import Chart, { Obj, DeepPartial } from '../../core';
import { SchemaType } from '@/misc/schema';
import { Instances } from '@/models/index';
import { name, schema } from '../schemas/federation';

type FederationLog = SchemaType<typeof schema>;

export default class FederationChart extends Chart<FederationLog> {
	constructor() {
		super(name, schema);
	}

	@autobind
	protected genNewLog(latest: FederationLog): DeepPartial<FederationLog> {
		return {
			instance: {
				total: latest.instance.total,
			}
		};
	}

	@autobind
	protected aggregate(logs: FederationLog[]): FederationLog {
		return {
			instance: {
				total: logs[0].instance.total,
				inc: logs.reduce((a, b) => a + b.instance.inc, 0),
				dec: logs.reduce((a, b) => a + b.instance.dec, 0),
			},
		};
	}

	@autobind
	protected async fetchActual(): Promise<DeepPartial<FederationLog>> {
		const [total] = await Promise.all([
			Instances.count({})
		]);

		return {
			instance: {
				total: total,
			}
		};
	}

	@autobind
	public async update(isAdditional: boolean) {
		const update: Obj = {};

		update.total = isAdditional ? 1 : -1;
		if (isAdditional) {
			update.inc = 1;
		} else {
			update.dec = 1;
		}

		await this.inc({
			instance: update
		});
	}
}
