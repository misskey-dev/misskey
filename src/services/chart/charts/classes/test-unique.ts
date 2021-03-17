import autobind from 'autobind-decorator';
import Chart, { DeepPartial } from '../../core';
import { SchemaType } from '../../../../misc/schema';
import { name, schema } from '../schemas/test-unique';

type TestUniqueLog = SchemaType<typeof schema>;

export default class TestUniqueChart extends Chart<TestUniqueLog> {
	constructor() {
		super(name, schema);
	}

	@autobind
	protected genNewLog(latest: TestUniqueLog): DeepPartial<TestUniqueLog> {
		return {};
	}

	@autobind
	protected async fetchActual(): Promise<DeepPartial<TestUniqueLog>> {
		return {};
	}

	@autobind
	public async uniqueIncrement(key: string) {
		await this.inc({
			foo: key
		});
	}
}
