import { initTestDb, sendEnvResetRequest } from './utils.js';

beforeAll(async () => {
	await Promise.all([
		initTestDb(false),
		sendEnvResetRequest(),
	]);
});
