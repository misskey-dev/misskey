/*
 * Tests of chart engine
 *
 * How to run the tests:
 * > mocha test/chart.ts --require ts-node/register
 *
 * To specify test:
 * > mocha test/chart.ts --require ts-node/register -g 'test name'
 *
 * If the tests not start, try set following enviroment variables:
 * TS_NODE_FILES=true and TS_NODE_TRANSPILE_ONLY=true
 * for more details, please see: https://github.com/TypeStrong/ts-node/issues/754
 */

import * as assert from 'assert';
import * as lolex from 'lolex';
import { async } from './utils';
import { getConnection, createConnection } from 'typeorm';
const config = require('../built/config').default;
const Chart = require('../built/services/chart/core').default;
const _TestChart = require('../built/services/chart/charts/schemas/test');

//#region process
Error.stackTraceLimit = Infinity;

// During the test the env variable is set to test
process.env.NODE_ENV = 'test';

// Display detail of unhandled promise rejection
process.on('unhandledRejection', console.dir);
//#endregion

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
			Chart.schemaToEntity(_TestChart.name, _TestChart.schema)
		]
	});
}

describe('Chart', () => {
	let testChart: any;
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

		connection.synchronize().then(() => {
			clock = lolex.install({
				now: new Date('2000-01-01 00:00:00')
			});
			done();
		});
	});

	afterEach(done => {
		connection.dropDatabase().then(() => {
			clock.uninstall();
			done();
		});
	});

	it('Can updates', async(async () => {
		await testChart.update(true);

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
		await testChart.update(true);
		await testChart.update(true);
		await testChart.update(true);

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
		await testChart.update(true);

		clock.tick('01:00:00');
		testChart.total = 1;

		await testChart.update(true);

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
		await testChart.update(true);

		clock.tick('02:00:00');
		testChart.total = 1;

		await testChart.update(true);

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
});
