import parseAcct from '../misc/acct/parse';
import { resolveUser } from '../remote/resolve-user';

async function main(acct: string): Promise<any> {
	const { username, host } = parseAcct(acct);
	await resolveUser(username, host, {}, true);
}

export default () => {
	// get args
	const args = process.argv.slice(3);
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
		process.exit(0);
	}).catch(e => {
		console.warn(e);
		process.exit(1);
	});
}
