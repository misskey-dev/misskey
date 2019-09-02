import autobind from 'autobind-decorator';
import Chart, { Obj, DeepPartial } from '../../core';
import { SchemaType } from '../../../../misc/schema';
import { name, schema } from '../schemas/test';

type TestLog = SchemaType<typeof schema>;

export default class TestChart extends Chart<TestLog> {
	public total = 0; // publicにするのはテストのため

	constructor() {
		super(name, schema);
	}

	@autobind
	protected genNewLog(latest: TestLog): DeepPartial<TestLog> {
		return {
			foo: {
				total: latest.foo.total,
			},
		};
	}

	@autobind
	protected async fetchActual(): Promise<DeepPartial<TestLog>> {
		return {
			foo: {
				total: this.total,
			},
		};
	}

	@autobind
	public async increment() {
		const update: Obj = {};

		update.total = 1;
		update.inc = 1;
		this.total++;

		await this.inc({
			foo: update
		});
	}
}
