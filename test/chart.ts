/*
 * Tests of chart engine
 *
 * How to run the tests:
 * > npx mocha test/chart.ts --require ts-node/register
 *
 * To specify test:
 * > npx mocha test/chart.ts --require ts-node/register -g 'test name'
 *
 * If the tests not start, try set following enviroment variables:
 * TS_NODE_FILES=true and TS_NODE_TRANSPILE_ONLY=true
 * for more details, please see: https://github.com/TypeStrong/ts-node/issues/754
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import * as lolex from 'lolex';
import { async } from './utils';
import { getConnection, createConnection } from 'typeorm';
const config = require('../built/config').default;
const Chart = require('../built/services/chart/core').default;
const _TestChart = require('../built/services/chart/charts/schemas/test');
const _TestGroupedChart = require('../built/services/chart/charts/schemas/test-grouped');
const _TestUniqueChart = require('../built/services/chart/charts/schemas/test-unique');

function initDb() {
	try {
		const conn = getConnection();
		return Promise.resolve(conn);
	} catch (e) {}

	return createConnection({
		type: 'postgres',
		host: config.db.host,
		port: config.db.port,
		username: config.db.user,
		password: config.db.pass,
		database: config.db.db,
		synchronize: true,
		dropSchema: true,
		entities: [
			Chart.schemaToEntity(_TestChart.name, _TestChart.schema),
			Chart.schemaToEntity(_TestGroupedChart.name, _TestGroupedChart.schema),
			Chart.schemaToEntity(_TestUniqueChart.name, _TestUniqueChart.schema)
		]
	});
}

describe('Chart', () => {
	let testChart: any;
	let testGroupedChart: any;
	let testUniqueChart: any;
	let connection: any;
	let clock: lolex.InstalledClock<lolex.Clock>;

	before(done => {
		initDb().then(c => {
			connection = c;
			done();
		});
	});

	beforeEach(done => {
		const TestChart = require('../built/services/chart/charts/classes/test').default;
		testChart = new TestChart();

		const TestGroupedChart = require('../built/services/chart/charts/classes/test-grouped').default;
		testGroupedChart = new TestGroupedChart();

		const TestUniqueChart = require('../built/services/chart/charts/classes/test-unique').default;
		testUniqueChart = new TestUniqueChart();

		clock = lolex.install({
			now: new Date('2000-01-01 00:00:00')
		});

		connection.synchronize().then(done);
	});

	afterEach(done => {
		clock.uninstall();
		connection.dropDatabase().then(done);
	});

	it('Can updates', async(async () => {
		await testChart.increment();

		const chartHours = await testChart.getChart('hour', 3);
		const chartDays = await testChart.getChart('day', 3);

		assert.deepStrictEqual(chartHours, {
			foo: {
				dec: [0, 0, 0],
				inc: [1, 0, 0],
				total: [1, 0, 0]
			},
		});

		assert.deepStrictEqual(chartDays, {
			foo: {
				dec: [0, 0, 0],
				inc: [1, 0, 0],
				total: [1, 0, 0]
			},
		});
	}));

	it('Empty chart', async(async () => {
		const chartHours = await testChart.getChart('hour', 3);
		const chartDays = await testChart.getChart('day', 3);

		assert.deepStrictEqual(chartHours, {
			foo: {
				dec: [0, 0, 0],
				inc: [0, 0, 0],
				total: [0, 0, 0]
			},
		});

		assert.deepStrictEqual(chartDays, {
			foo: {
				dec: [0, 0, 0],
				inc: [0, 0, 0],
				total: [0, 0, 0]
			},
		});
	}));

	it('Can updates at multiple times at same time', async(async () => {
		await testChart.increment();
		await testChart.increment();
		await testChart.increment();

		const chartHours = await testChart.getChart('hour', 3);
		const chartDays = await testChart.getChart('day', 3);

		assert.deepStrictEqual(chartHours, {
			foo: {
				dec: [0, 0, 0],
				inc: [3, 0, 0],
				total: [3, 0, 0]
			},
		});

		assert.deepStrictEqual(chartDays, {
			foo: {
				dec: [0, 0, 0],
				inc: [3, 0, 0],
				total: [3, 0, 0]
			},
		});
	}));

	it('Can updates at different times', async(async () => {
		await testChart.increment();

		clock.tick('01:00:00');

		await testChart.increment();

		const chartHours = await testChart.getChart('hour', 3);
		const chartDays = await testChart.getChart('day', 3);

		assert.deepStrictEqual(chartHours, {
			foo: {
				dec: [0, 0, 0],
				inc: [1, 1, 0],
				total: [2, 1, 0]
			},
		});

		assert.deepStrictEqual(chartDays, {
			foo: {
				dec: [0, 0, 0],
				inc: [2, 0, 0],
				total: [2, 0, 0]
			},
		});
	}));

	it('Can padding', async(async () => {
		await testChart.increment();

		clock.tick('02:00:00');

		await testChart.increment();

		const chartHours = await testChart.getChart('hour', 3);
		const chartDays = await testChart.getChart('day', 3);

		assert.deepStrictEqual(chartHours, {
			foo: {
				dec: [0, 0, 0],
				inc: [1, 0, 1],
				total: [2, 1, 1]
			},
		});

		assert.deepStrictEqual(chartDays, {
			foo: {
				dec: [0, 0, 0],
				inc: [2, 0, 0],
				total: [2, 0, 0]
			},
		});
	}));

	// 要求された範囲にログがひとつもない場合でもパディングできる
	it('Can padding from past range', async(async () => {
		await testChart.increment();

		clock.tick('05:00:00');

		const chartHours = await testChart.getChart('hour', 3);
		const chartDays = await testChart.getChart('day', 3);

		assert.deepStrictEqual(chartHours, {
			foo: {
				dec: [0, 0, 0],
				inc: [0, 0, 0],
				total: [1, 1, 1]
			},
		});

		assert.deepStrictEqual(chartDays, {
			foo: {
				dec: [0, 0, 0],
				inc: [1, 0, 0],
				total: [1, 0, 0]
			},
		});
	}));

	// 要求された範囲の最も古い箇所に位置するログが存在しない場合でもパディングできる
	// Issue #3190
	it('Can padding from past range 2', async(async () => {
		await testChart.increment();
		clock.tick('05:00:00');
		await testChart.increment();

		const chartHours = await testChart.getChart('hour', 3);
		const chartDays = await testChart.getChart('day', 3);

		assert.deepStrictEqual(chartHours, {
			foo: {
				dec: [0, 0, 0],
				inc: [1, 0, 0],
				total: [2, 1, 1]
			},
		});

		assert.deepStrictEqual(chartDays, {
			foo: {
				dec: [0, 0, 0],
				inc: [2, 0, 0],
				total: [2, 0, 0]
			},
		});
	}));

	describe('Grouped', () => {
		it('Can updates', async(async () => {
			await testGroupedChart.increment('alice');

			const aliceChartHours = await testGroupedChart.getChart('hour', 3, 'alice');
			const aliceChartDays = await testGroupedChart.getChart('day', 3, 'alice');
			const bobChartHours = await testGroupedChart.getChart('hour', 3, 'bob');
			const bobChartDays = await testGroupedChart.getChart('day', 3, 'bob');

			assert.deepStrictEqual(aliceChartHours, {
				foo: {
					dec: [0, 0, 0],
					inc: [1, 0, 0],
					total: [1, 0, 0]
				},
			});

			assert.deepStrictEqual(aliceChartDays, {
				foo: {
					dec: [0, 0, 0],
					inc: [1, 0, 0],
					total: [1, 0, 0]
				},
			});

			assert.deepStrictEqual(bobChartHours, {
				foo: {
					dec: [0, 0, 0],
					inc: [0, 0, 0],
					total: [0, 0, 0]
				},
			});

			assert.deepStrictEqual(bobChartDays, {
				foo: {
					dec: [0, 0, 0],
					inc: [0, 0, 0],
					total: [0, 0, 0]
				},
			});
		}));
	});

	describe('Unique increment', () => {
		it('Can updates', async(async () => {
			await testUniqueChart.uniqueIncrement('alice');
			await testUniqueChart.uniqueIncrement('alice');
			await testUniqueChart.uniqueIncrement('bob');

			const chartHours = await testUniqueChart.getChart('hour', 3);
			const chartDays = await testUniqueChart.getChart('day', 3);

			assert.deepStrictEqual(chartHours, {
				foo: [2, 0, 0],
			});

			assert.deepStrictEqual(chartDays, {
				foo: [2, 0, 0],
			});
		}));
	});

	describe('Resync', () => {
		it('Can resync', async(async () => {
			testChart.total = 1;

			await testChart.resync();

			const chartHours = await testChart.getChart('hour', 3);
			const chartDays = await testChart.getChart('day', 3);

			assert.deepStrictEqual(chartHours, {
				foo: {
					dec: [0, 0, 0],
					inc: [0, 0, 0],
					total: [1, 0, 0]
				},
			});

			assert.deepStrictEqual(chartDays, {
				foo: {
					dec: [0, 0, 0],
					inc: [0, 0, 0],
					total: [1, 0, 0]
				},
			});
		}));

		it('Can resync (2)', async(async () => {
			await testChart.increment();

			clock.tick('01:00:00');

			testChart.total = 100;

			await testChart.resync();

			const chartHours = await testChart.getChart('hour', 3);
			const chartDays = await testChart.getChart('day', 3);

			assert.deepStrictEqual(chartHours, {
				foo: {
					dec: [0, 0, 0],
					inc: [0, 1, 0],
					total: [100, 1, 0]
				},
			});

			assert.deepStrictEqual(chartDays, {
				foo: {
					dec: [0, 0, 0],
					inc: [1, 0, 0],
					total: [100, 0, 0]
				},
			});
		}));
	});
});
