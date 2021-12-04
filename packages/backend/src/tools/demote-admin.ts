import { initDb } from '../db/postgre';

async function main(username: string) {
	if (!username) throw `username required`;
	username = username.replace(/^@/, '');

	await initDb();
	const { Users } = await import('@/models/index');

	const res = await Users.update({
		usernameLower: username.toLowerCase(),
		host: null
	}, {
		isAdmin: false
	});

	if (res.affected !== 1) {
		throw 'Failed';
	}
}

const args = process.argv.slice(2);

main(args[0]).then(() => {
	console.log('Success');
	process.exit(0);
}).catch(e => {
	console.error(`Error: ${e.message || e}`);
	process.exit(1);
});
