import autobind from 'autobind-decorator';
import Chart, { DeepPartial, Obj } from '../../core';
import { SchemaType } from '../../../../misc/schema';
import { name, schema } from '../schemas/test-grouped';

type TestGroupedLog = SchemaType<typeof schema>;

export default class TestGroupedChart extends Chart<TestGroupedLog> {
	private total = {} as Record<string, number>;

	constructor() {
		super(name, schema, true);
	}

	@autobind
	public async increment(group: string) {
		if (this.total[group] == null) this.total[group] = 0;

		const update: Obj = {};

		update.total = 1;
		update.inc = 1;
		this.total[group]++;

		await this.inc({
			foo: update
		}, group);
	}

	@autobind
	protected genNewLog(latest: TestGroupedLog): DeepPartial<TestGroupedLog> {
		return {
			foo: {
				total: latest.foo.total,
			},
		};
	}

	@autobind
	protected async fetchActual(group: string): Promise<DeepPartial<TestGroupedLog>> {
		return {
			foo: {
				total: this.total[group],
			},
		};
	}
}
