import autobind from 'autobind-decorator';
import Chart, { Obj } from '../../core';
import { SchemaType } from '../../../../misc/schema';
import { name, schema } from '../schemas/test';

type TestLog = SchemaType<typeof schema>;

export default class TestChart extends Chart<TestLog> {
	public total: number = 0;

	constructor() {
		super(name, schema);
	}

	@autobind
	protected async getTemplate(init: boolean, latest?: TestLog): Promise<TestLog> {
		const [localCount] = init ? await Promise.all([
			Promise.resolve(this.total)
		]) : [
			latest ? latest.foo.total : 0,
		];

		return {
			foo: {
				total: localCount,
				inc: 0,
				dec: 0
			},
		};
	}

	@autobind
	public async update(isAdditional: boolean) {
		const update: Obj = {};

		update.total = isAdditional ? 1 : -1;
		if (isAdditional) {
			update.inc = 1;
		} else {
			update.dec = 1;
		}

		await this.inc({
			foo: update
		});
	}
}
