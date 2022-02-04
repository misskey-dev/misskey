import autobind from 'autobind-decorator';
import Chart, { KVs } from '../core';
import { name, schema } from './entities/test-grouped';

/**
 * For testing
 */
// eslint-disable-next-line import/no-default-export
export default class TestGroupedChart extends Chart<typeof schema> {
	private total = {} as Record<string, number>;

	constructor() {
		super(name, schema, true);
	}

	@autobind
	protected async queryCurrentState(group: string): Promise<Partial<KVs<typeof schema>>> {
		return {
			foo: {
				total: this.total[group],
			},
		};
	}

	@autobind
	public async increment(group: string): Promise<void> {
		if (this.total[group] == null) this.total[group] = 0;

		const update: Obj = {};

		update.total = 1;
		update.inc = 1;
		this.total[group]++;

		await this.inc({
			foo: update,
		}, group);
	}
}
