import autobind from 'autobind-decorator';
import Chart, { DeepPartial, KVs } from '../core';
import { Instances } from '@/models/index';
import { name, schema } from './entities/federation';

/**
 * フェデレーションに関するチャート
 */
// eslint-disable-next-line import/no-default-export
export default class FederationChart extends Chart<typeof schema> {
	constructor() {
		super(name, schema);
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
	protected async fetchActual(): Promise<DeepPartial<KVs<typeof schema>>> {
		const [total] = await Promise.all([
			Instances.count({}),
		]);

		return {
			'instance.total': total,
		};
	}

	@autobind
	public async update(isAdditional: boolean): Promise<void> {
		await this.commit({
			'instance.total': isAdditional ? 1 : -1,
			'instance.inc': isAdditional ? 1 : 0,
			'instance.dec': isAdditional ? 0 : 1,
		});
	}
}
