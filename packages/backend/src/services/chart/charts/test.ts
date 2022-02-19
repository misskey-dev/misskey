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
	protected async tickMajor(): Promise<Partial<KVs<typeof schema>>> {
		return {
			'foo.total': this.total,
		};
	}

	@autobind
	protected async tickMinor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	@autobind
	public async increment(): Promise<void> {
		this.total++;

		await this.commit({
			'foo.total': 1,
			'foo.inc': 1,
		});
	}

	@autobind
	public async decrement(): Promise<void> {
		this.total--;

		await this.commit({
			'foo.total': -1,
			'foo.dec': 1,
		});
	}
}
