import { initDb } from '@/db/postgre';
import parseAcct from '@/misc/acct/parse';

async function main(acct: string): Promise<any> {
	await initDb();
	const { resolveUser } = await import('../remote/resolve-user');

	const { username, host } = parseAcct(acct);
	await resolveUser(username, host, {}, true);
}

// get args
const args = process.argv.slice(2);
let acct = args[0];

// normalize args
acct = acct.replace(/^@/, '');

// check args
if (!acct.match(/^\w+@\w/)) {
	throw `Invalid acct format. Valid format are user@host`;
}

console.log(`resync ${acct}`);

main(acct).then(() => {
	console.log('Done');
}).catch(e => {
	console.warn(e);
});
