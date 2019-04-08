import mongo from 'monk';
import config from './config';
import { initDb } from './db/postgre';
import { User } from './models/entities/user';
import { getRepository } from 'typeorm';
import generateUserToken from './server/api/common/generate-native-user-token';

const u = (config as any).mongodb.user ? encodeURIComponent((config as any).mongodb.user) : null;
const p = (config as any).mongodb.pass ? encodeURIComponent((config as any).mongodb.pass) : null;

const uri = `mongodb://${u && p ? `${u}:${p}@` : ''}${(config as any).mongodb.host}:${(config as any).mongodb.port}/${(config as any).mongodb.db}`;

const db = mongo(uri);

const _User = db.get<any>('users');

async function main() {
	await initDb();
	const Users = getRepository(User);

	const allUsersCount = await _User.count();

	for (let i = 0; i < allUsersCount; i++) {
		const user = await _User.findOne({}, {
			skip: i
		});
		await Users.save({
			id: user._id.toHexString(),
			createdAt: user.createdAt || new Date(),
			username: user.username,
			usernameLower: user.username.toLowerCase(),
			host: user.host,
			token: generateUserToken(),
			password: user.password,
			isAdmin: user.isAdmin,
			autoAcceptFollowed: true,
			autoWatch: false
		});
		console.log(`USER (${i + 1}/${allUsersCount}) ${user.id} DONE`);
	}
}

main();
