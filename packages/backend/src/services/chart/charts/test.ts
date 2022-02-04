import autobind from 'autobind-decorator';
import Chart, { KVs } from '../core';
import { name, schema } from './entities/test';

/**
 * For testing
 */
// eslint-disable-next-line import/no-default-export
export default class TestChart extends Chart<typeof schema> {
	public total = 0; // publicにするのはテストのため

	constructor() {
		super(name, schema);
	}

	@autobind
	protected async queryCurrentState(): Promise<Partial<KVs<typeof schema>>> {
		return {
			foo: {
				total: this.total,
			},
		};
	}

	@autobind
	public async increment(): Promise<void> {
		const update: Obj = {};

		update.total = 1;
		update.inc = 1;
		this.total++;

		await this.inc({
			foo: update,
		});
	}

	@autobind
	public async decrement(): Promise<void> {
		const update: Obj = {};

		update.total = -1;
		update.dec = 1;
		this.total--;

		await this.inc({
			foo: update,
		});
	}
}
