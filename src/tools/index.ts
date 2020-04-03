import { initDb } from '../db/postgre';
import 'reflect-metadata';

console.log('Connecting DB...')
initDb().then(() => {
	console.log('Connedted!')
	require(`./${process.argv[2]}`).default();
});
