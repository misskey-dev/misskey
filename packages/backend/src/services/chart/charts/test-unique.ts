import autobind from 'autobind-decorator';
import Chart, { DeepPartial } from '../core';
import { SchemaType } from '@/misc/schema';
import { name, schema } from './entities/test-unique';

type TestUniqueLog = SchemaType<typeof schema>;

/**
 * For testing
 */
// eslint-disable-next-line import/no-default-export
export default class TestUniqueChart extends Chart<TestUniqueLog> {
	constructor() {
		super(name, schema);
	}

	@autobind
	protected genNewLog(latest: TestUniqueLog): DeepPartial<TestUniqueLog> {
		return {};
	}

	@autobind
	protected aggregate(logs: TestUniqueLog[]): TestUniqueLog {
		return {
			foo: logs.reduce((a, b) => a.concat(b.foo), [] as TestUniqueLog['foo']),
		};
	}

	@autobind
	protected async fetchActual(): Promise<DeepPartial<TestUniqueLog>> {
		return {};
	}

	@autobind
	public async uniqueIncrement(key: string): Promise<void> {
		await this.inc({
			foo: [key],
		});
	}
}
