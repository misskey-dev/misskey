import { initDb } from './db/postgre';

async function main() {
	try {
		console.log('Connecting database...');
		await initDb(false, true, true);
	} catch (e) {
		console.error('Cannot connect to database', null, true);
		console.error(e);
		process.exit(1);
	}

	console.log('Done :)');
}

main();
