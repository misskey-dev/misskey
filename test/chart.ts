/*
 * Tests of chart engine
 *
 * How to run the tests:
 * > npx cross-env TS_NODE_FILES=true TS_NODE_TRANSPILE_ONLY=true npx mocha test/chart.ts --require ts-node/register
 *
 * To specify test:
 * > npx cross-env TS_NODE_FILES=true TS_NODE_TRANSPILE_ONLY=true npx mocha test/chart.ts --require ts-node/register -g 'test name'
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import * as lolex from 'lolex';
import { async } from './utils';
import TestChart from '../src/services/chart/charts/classes/test';
import TestGroupedChart from '../src/services/chart/charts/classes/test-grouped';
import TestUniqueChart from '../src/services/chart/charts/classes/test-unique';
import * as _TestChart from '../src/services/chart/charts/schemas/test';
import * as _TestGroupedChart from '../src/services/chart/charts/schemas/test-grouped';
import * as _TestUniqueChart from '../src/services/chart/charts/schemas/test-unique';
import { Connection, getConnection, createConnection } from 'typeorm';
import config from '../src/config';
import Chart from '../src/services/chart/core';
import { initDb } from '../src/db/postgre';

function initChartDb() {
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
	let testChart: TestChart;
	let testGroupedChart: TestGroupedChart;
	let testUniqueChart: TestUniqueChart;
	let clock: lolex.InstalledClock<lolex.Clock>;
	let connection: Connection;

	before(done => {
		initChartDb().then(c => {
			connection = c;
			done();
		});
	});

	after(async(async () => {
		await connection.close();
		await initDb(true, undefined, undefined, true);
	}));

	beforeEach(done => {
		testChart = new TestChart();
		testGroupedChart = new TestGroupedChart();
		testUniqueChart = new TestUniqueChart();

		clock = lolex.install({
			now: new Date('2000-01-01 00:00:00')
		});
		done();
	});

	afterEach(async(async () => {
		clock.uninstall();
		await connection.dropDatabase();
		await connection.synchronize();
	}));

	it('Can updates', async(async () => {
		await testChart.increment();

		const chartHours = await testChart.getChart('hour', 3, 0);
		const chartDays = await testChart.getChart('day', 3, 0);

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
	
	it('Can updates (dec)', async(async () => {
		await testChart.decrement();

		const chartHours = await testChart.getChart('hour', 3, 0);
		const chartDays = await testChart.getChart('day', 3, 0);

		assert.deepStrictEqual(chartHours, {
			foo: {
				dec: [1, 0, 0],
				inc: [0, 0, 0],
				total: [-1, 0, 0]
			},
		});

		assert.deepStrictEqual(chartDays, {
			foo: {
				dec: [1, 0, 0],
				inc: [0, 0, 0],
				total: [-1, 0, 0]
			},
		});
	}));

	it('Empty chart', async(async () => {
		const chartHours = await testChart.getChart('hour', 3, 0);
		const chartDays = await testChart.getChart('day', 3, 0);

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

		const chartHours = await testChart.getChart('hour', 3, 0);
		const chartDays = await testChart.getChart('day', 3, 0);

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

		const chartHours = await testChart.getChart('hour', 3, 0);
		const chartDays = await testChart.getChart('day', 3, 0);

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

		const chartHours = await testChart.getChart('hour', 3, 0);
		const chartDays = await testChart.getChart('day', 3, 0);

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

		const chartHours = await testChart.getChart('hour', 3, 0);
		const chartDays = await testChart.getChart('day', 3, 0);

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

		const chartHours = await testChart.getChart('hour', 3, 0);
		const chartDays = await testChart.getChart('day', 3, 0);

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

	it('Can specify offset', async(async () => {
		await testChart.increment();

		clock.tick('01:00:00');

		await testChart.increment();

		const chartHours = await testChart.getChart('hour', 3, 1);
		const chartDays = await testChart.getChart('day', 3, 1);

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
				inc: [0, 0, 0],
				total: [0, 0, 0]
			},
		});
	}));

	it('Can specify offset (floor time)', async(async () => {
		clock.tick('00:30:00');

		await testChart.increment();

		clock.tick('01:30:00');

		await testChart.increment();

		const chartHours = await testChart.getChart('hour', 3, 1);
		const chartDays = await testChart.getChart('day', 3, 1);

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
				inc: [0, 0, 0],
				total: [0, 0, 0]
			},
		});
	}));

	describe('Grouped', () => {
		it('Can updates', async(async () => {
			await testGroupedChart.increment('alice');

			const aliceChartHours = await testGroupedChart.getChart('hour', 3, 0, 'alice');
			const aliceChartDays = await testGroupedChart.getChart('day', 3, 0, 'alice');
			const bobChartHours = await testGroupedChart.getChart('hour', 3, 0, 'bob');
			const bobChartDays = await testGroupedChart.getChart('day', 3, 0, 'bob');

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

			const chartHours = await testUniqueChart.getChart('hour', 3, 0);
			const chartDays = await testUniqueChart.getChart('day', 3, 0);

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

			const chartHours = await testChart.getChart('hour', 3, 0);
			const chartDays = await testChart.getChart('day', 3, 0);

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

			const chartHours = await testChart.getChart('hour', 3, 0);
			const chartDays = await testChart.getChart('day', 3, 0);

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
