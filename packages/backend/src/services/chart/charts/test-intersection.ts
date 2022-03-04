import Chart, { KVs } from '../core.js';
import { name, schema } from './entities/test-intersection.js';

/**
 * For testing
 */
// eslint-disable-next-line import/no-default-export
export default class TestIntersectionChart extends Chart<typeof schema> {
	constructor() {
		super(name, schema);
	}

	protected async tickMajor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	protected async tickMinor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	public async addA(key: string): Promise<void> {
		await this.commit({
			a: [key],
		});
	}

	public async addB(key: string): Promise<void> {
		await this.commit({
			b: [key],
		});
	}
}
