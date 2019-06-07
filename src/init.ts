import { initDb } from './db/postgre';

console.log('Init database...');

initDb(false, true, true).then(() => {
	console.log('Done :)');
	process.exit(0);
}, e => {
	console.error('Failed to init database');
	console.error(e);
});
