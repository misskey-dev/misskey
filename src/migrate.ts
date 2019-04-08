import mongo from 'monk';
import config from './config';
import { initDb } from './db/postgre';
import { User } from './models/entities/user';
import { getRepository } from 'typeorm';
import generateUserToken from './server/api/common/generate-native-user-token';
import { DriveFile } from './models/entities/drive-file';

const u = (config as any).mongodb.user ? encodeURIComponent((config as any).mongodb.user) : null;
const p = (config as any).mongodb.pass ? encodeURIComponent((config as any).mongodb.pass) : null;

const uri = `mongodb://${u && p ? `${u}:${p}@` : ''}${(config as any).mongodb.host}:${(config as any).mongodb.port}/${(config as any).mongodb.db}`;

const db = mongo(uri);

const _User = db.get<any>('users');
const _DriveFile = db.get<any>('driveFiles.files');

async function main() {
	await initDb();
	const Users = getRepository(User);
	const DriveFiles = getRepository(DriveFile);

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
			autoWatch: false,
			name: user.name,
			location: user.profile.location,
			birthday: user.profile.birthday,
			followersCount: user.followersCount,
			followingCount: user.followingCount,
			notesCount: user.notesCount,
			description: user.description,
			isBot: user.isBot,
			isCat: user.isCat,
			isVerified: user.isVerified,
			inbox: user.inbox,
			sharedInbox: user.sharedInbox,
			uri: user.uri,
		});
		console.log(`USER (${i + 1}/${allUsersCount}) ${user._id} DONE`);
	}

	const allDriveFilesCount = await _DriveFile.count();
	for (let i = 0; i < allDriveFilesCount; i++) {
		const file = await _DriveFile.findOne({}, {
			skip: i
		});
		await DriveFiles.save({
			id: file._id.toHexString(),
			userId: file.userId.toHexString(),
			createdAt: file.uploadDate || new Date(),
			md5: file.md5,
			name: file.filename,
			type: file.contentType,
			properties: file.metadata.properties,
			size: file.length,
		});
		console.log(`USER (${i + 1}/${allDriveFilesCount}) ${file._id} DONE`);
	}
}

main();
