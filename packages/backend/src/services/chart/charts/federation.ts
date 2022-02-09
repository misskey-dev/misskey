import autobind from 'autobind-decorator';
import Chart, { KVs } from '../core';
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
	protected async queryCurrentState(): Promise<Partial<KVs<typeof schema>>> {
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

	@autobind
	public async deliverd(host: string, succeeded: boolean): Promise<void> {
		await this.commit(succeeded ? {
			'deliveredInstances': [host],
		} : {
			'stalled': [host],
		});
	}

	@autobind
	public async inbox(host: string): Promise<void> {
		await this.commit({
			'inboxInstances': [host],
		});
	}
}
