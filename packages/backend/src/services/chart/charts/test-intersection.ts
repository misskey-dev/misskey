import autobind from 'autobind-decorator';
import Chart, { KVs } from '../core';
import { name, schema } from './entities/test-intersection';

/**
 * For testing
 */
// eslint-disable-next-line import/no-default-export
export default class TestIntersectionChart extends Chart<typeof schema> {
	constructor() {
		super(name, schema);
	}

	@autobind
	protected async tickMajor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	@autobind
	protected async tickMinor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	@autobind
	public async addA(key: string): Promise<void> {
		await this.commit({
			a: [key],
		});
	}

	@autobind
	public async addB(key: string): Promise<void> {
		await this.commit({
			b: [key],
		});
	}
}
