import autobind from 'autobind-decorator';
import Chart, { Obj } from '../../core';
import { SchemaType } from '../../../../misc/schema';
import { Instances } from '../../../../models';
import { name, schema } from '../schemas/federation';

type FederationLog = SchemaType<typeof schema>;

export default class FederationChart extends Chart<FederationLog> {
	constructor() {
		super(name, schema);
	}

	@autobind
	protected async getTemplate(init: boolean, latest?: FederationLog): Promise<FederationLog> {
		const [total] = init ? await Promise.all([
			Instances.count({})
		]) : [
			latest ? latest.instance.total : 0
		];

		return {
			instance: {
				total: total,
				inc: 0,
				dec: 0
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
